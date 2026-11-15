# BÁO CÁO NGHIỆM THU NGHIỆP VỤ & KỸ THUẬT MILESTONE M7.3 (QUIZ ATTEMPT ENGINE)
## XỬ LÝ TRIỆT ĐỂ TOÀN DIỆN 4 BLOCKER B01–B04 THEO CHỈ ĐẠO TECH LEAD

**Dự án:** FPT Polytechnic Virtual Campus 360°  
**Nhánh:** `fix/m4-acceptance-blockers`  
**Pull Request trên GitHub:** PR #1  
**Thời gian cập nhật:** 2026-11-15 23:26 (GMT+7)

---

## 1. ĐỐI CHIẾU COMMIT SHA TRÊN GITHUB
- **HEAD Baseline trước (M7.2 FULL PASS):** `bc851f93f92a80016a57faf0fdb54173d0dd59b4`
- **M7.3 Initial Implementation Commits:**
  - Code Commit: `a2a04a5` (`feat(quiz-attempt): implement real-time quiz attempt engine, postgresql state persistence, and portal exam room (M7.3)`)
  - Docs Commit: `3623125` (`docs(handoff): document m7.3 quiz attempt engine architecture, additive migration, and postgresql regression evidence`)
- **M7.3 Remediation B01–B04 Commits:**
  - Code Commit (B01–B04): `e5795c2` (`feat(quiz-attempt): implement atomic save transaction, serialized autosave, admin monitoring, and boundary concurrency test (B01-B04)`)
  - Docs Commit (B01–B04): Commit tiếp theo sau tài liệu này.
- **Quy chuẩn Git:** Tuân thủ 100% nguyên tắc tách biệt Code commit và Docs commit, không force-push, remote tip đồng bộ tuyệt đối với local HEAD.

---

## 2. GIẢI TRÌNH ROOT CAUSE & GIẢI PHÁP KỸ THUẬT CHO 4 BLOCKER B01–B04

### 🔴 B01 — Atomic Save Progress và Expiration Guard
- **Root Cause:**
  - Trong triển khai ban đầu, `saveProgress()` truy vấn `attempt` bên ngoài giao dịch, kiểm tra `now >= attempt.expiresAt` trước khi ghi, và cập nhật từng câu trả lời độc lập bằng vòng lặp `for`.
  - Điều này dẫn đến nguy cơ race condition: nếu một request bắt đầu trước thời điểm hết hạn nhưng trễ mạng đến DB sau khi hết hạn hoặc sau khi một request khác chuyển attempt sang `EXPIRED`, dữ liệu vẫn có thể được ghi.
  - Ngoài ra, việc lặp qua từng câu trả lời độc lập khiến cho một batch chứa câu trả lời hợp lệ và không hợp lệ có thể bị ghi một phần (partial write) trước khi phát hiện lỗi.
- **Giải pháp Kỹ thuật Triển khai:**
  - File: `apps/api/src/modules/portal/portal-quiz.service.ts`
  - Đưa toàn bộ luồng lưu tiến độ vào `this.prisma.$transaction(async (tx) => { ... })`.
  - Khóa hàng bản ghi attempt bằng câu lệnh PostgreSQL độc quyền:  
    `await tx.$executeRaw\`SELECT id FROM quiz_config_attempts WHERE id = ${attemptId}::uuid FOR UPDATE\`;`
  - Tái kiểm tra thời gian thực `const now = new Date();` và trạng thái `attempt.status === 'IN_PROGRESS'` ngay sau khi giành được khóa hàng. Nếu `now >= attempt.expiresAt`, tự động chuyển trạng thái thành `EXPIRED` trên DB và ném ngay `BadRequestException('Lượt thi đã hết thời gian hoặc không còn hiệu lực làm bài.')`.
  - Thực hiện xác thực toàn bộ mảng `dto.answers` TRƯỚC KHI thực hiện bất kỳ lệnh ghi nào (Atomic Batch Validation): kiểm tra câu hỏi có thuộc attempt hay không, kiểm tra `selectedOptionIndex` có nằm trong giới hạn mảng options của câu hỏi hay không. Nếu có bất kỳ item nào sai, ném lỗi 400 lập tức -> transaction tự động rollback toàn bộ, không có bất kỳ dòng dữ liệu nào bị ghi dở dang.
  - Toàn bộ câu trả lời hợp lệ được cập nhật trong transaction cùng thời điểm `answeredAt: now`.

### 🔴 B02 — Frontend Autosave Ordering & Request Serialization
- **Root Cause:**
  - Trong `apps/web/src/app/(portal)/portal/quiz/page.tsx`, mỗi lần sinh viên click chọn đáp án, hàm `handleSelectOption()` phát ngay request API mà không tuần tự hóa.
  - Nếu sinh viên đổi đáp án nhanh (ví dụ click A rồi đổi sang B ngay lập tức), request A và B bay song song trên mạng; nếu request B đến DB trước rồi request A đến sau, request A sẽ ghi đè lên B, dẫn đến lệch trạng thái giữa màn hình và PostgreSQL. Ngoài ra nhãn "Đã lưu" có thể hiển thị sai khi request cũ phản hồi sau.
- **Giải pháp Kỹ thuật Triển khai:**
  - File: `apps/web/src/app/(portal)/portal/quiz/page.tsx`
  - Thiết lập cơ chế chuỗi Promise tuần tự (Strict FIFO Serialization):  
    `const saveQueueRef = useRef<Promise<void>>(Promise.resolve());`
  - Duy trì bộ đếm tuần tự toàn cục `latestSequenceRef` và bộ đếm phiên bản theo từng câu hỏi `questionLatestSeqRef`.
  - Giao diện vẫn phản hồi tức thời (Optimistic UI Update) để người dùng không cảm thấy độ trễ.
  - Mọi thao tác lưu mạng đều được nối đuôi vào `saveQueueRef.current`. Nếu trong thời gian chờ đợi hàng đợi, câu hỏi đã nhận được một click mới hơn (`questionLatestSeqRef.current[questionId] > seq`), request cũ sẽ bị bỏ qua (skip), không gửi payload lỗi thời lên máy chủ.
  - Nhãn "Đã lưu lúc HH:mm:ss" CHỈ xuất hiện khi request đang hoàn tất là request mới nhất của toàn phòng thi (`seq === latestSequenceRef.current`).

### 🔴 B03 — Admin Exam Room Monitoring (Giám sát phòng thi)
- **Root Cause:**
  - Trong phạm vi M7.3 ban đầu, hệ thống chỉ có các API và giao diện dành cho sinh viên, chưa có màn hình và endpoint phục vụ giám sát lượt thi cho ban quản trị.
- **Giải pháp Kỹ thuật Triển khai:**
  - **Shared Contract (`packages/shared/src/quiz-config.ts`):**
    - `AdminQuizAttemptStudentDto`: Sinh viên (`id, fullName, email, studentCode, avatarUrl`).
    - `AdminQuizAttemptMonitoringDto`: Lượt thi (`id, quizConfigId, quizTitle, student, attemptNumber, status, startedAt, expiresAt, submittedAt, totalQuestions, answeredCount, remainingSeconds`).
    - `AdminQuizAttemptListQueryDto` & `AdminQuizAttemptListResponseDto`: Hỗ trợ phân trang, lọc theo `quizConfigId`, `status`, tìm kiếm theo `search`.
  - **Backend API & Service:**
    - `apps/api/src/modules/quiz-config/dto/quiz-config.dto.ts`: `AdminQuizAttemptQueryDto`.
    - `apps/api/src/modules/quiz-config/quiz-config.service.ts`: `getAttemptsMonitoring()` truy vấn cơ sở dữ liệu PostgreSQL, tính toán tiến độ câu hỏi `answeredCount / totalQuestions`, thời gian còn lại `remainingSeconds`, tự động chuẩn hóa trạng thái `EXPIRED` nếu đã quá hạn.
    - `apps/api/src/modules/quiz-config/quiz-config.controller.ts`: Endpoint `GET /api/v1/admin/quiz-configs/attempts/monitoring`, đặt trước `@Get(":id")` để tránh xung đột routing, bảo vệ nghiêm ngặt bằng `JwtAuthGuard`, `PermissionsGuard` và quyền `events:write`.
    - Tuân thủ 100% nguyên tắc Read-only: Không cung cấp bất kỳ API nào cho phép Admin sửa câu trả lời, can thiệp kết quả hoặc thay đổi thời gian thi.
  - **Frontend Admin (`apps/web`):**
    - `apps/web/src/app/admin/events/components/exam-room-monitoring.tsx`: Giao diện giám sát phòng thi chuyên nghiệp với thanh lọc tìm kiếm thời gian thực, lọc trạng thái, checkbox "Tự động làm mới (10s)", nút làm mới, bảng dữ liệu chi tiết sinh viên, thanh tiến độ làm bài (%), đồng hồ đếm ngược và phân trang.
    - `apps/web/src/app/admin/events/page.tsx`: Tích hợp tab điều hướng mới `"exam-monitoring"` (Giám sát phòng thi M7.3).

### 🔴 B04 — Concurrency Test gần giới hạn maxAttempts
- **Root Cause:**
  - Test 13 trước đó gửi 6 request đồng thời khi sinh viên chưa có lượt thi nào (`attemptCount = 0`, `maxAttempts = 3`). Test này chứng minh được idempotent resume nhưng chưa kiểm tra được race condition tại thời điểm nhạy cảm nhất: khi sinh viên chỉ còn đúng 1 lượt thi cuối cùng trước khi chạm trần `maxAttempts`.
- **Giải pháp Kỹ thuật Triển khai:**
  - File: `apps/api/test/integration/quiz-attempt.integration.spec.ts`
  - Cập nhật Test 13: Tạo trước 2 lượt thi đã hết hạn (`attemptNumber = 1, 2`, `status = EXPIRED`) cho sinh viên đối với bài thi có `maxAttempts = 3`. Lúc này sinh viên chỉ còn đúng 1 lượt thi hợp lệ.
  - Bắn đồng thời 6 request `POST .../attempts`.
  - Khẳng định (Assert):
    - 100% request trả về mã HTTP hợp lệ (201 thành công hoặc 400), KHÔNG CÓ BẤT KỲ REQUEST NÀO BỊ 500 (loại trừ hoàn toàn lỗi deadlock hoặc vi phạm unique constraint).
    - Trong cơ sở dữ liệu PostgreSQL: Tổng số attempt của sinh viên đạt chính xác 3 (bằng `maxAttempts`), không vượt quá trần.
    - Lượt thi thứ 3 có `status = IN_PROGRESS`, và tất cả các request 201 trả về cùng `id` của lượt thi thứ 3.
    - Khi lượt thi thứ 3 hết hạn, gửi tiếp request thứ 7 -> Hệ thống từ chối ngay lập tức với HTTP 400 (`Đã vượt quá số lượt thi cho phép`).

---

## 3. DANH SÁCH FILE THAY ĐỔI
1. `apps/api/src/modules/portal/portal-quiz.service.ts`: B01 transaction nguyên tử, `FOR UPDATE` row lock, time re-check under lock, atomic batch validation & updates.
2. `apps/api/src/modules/quiz-config/dto/quiz-config.dto.ts`: B03 `AdminQuizAttemptQueryDto`.
3. `apps/api/src/modules/quiz-config/quiz-config.controller.ts`: B03 `GET /admin/quiz-configs/attempts/monitoring` endpoint.
4. `apps/api/src/modules/quiz-config/quiz-config.service.ts`: B03 `getAttemptsMonitoring()` read-only query.
5. `apps/api/test/integration/quiz-attempt.integration.spec.ts`: B04 concurrency test near limit, B01 atomic batch rollback test (Test 15), B01 expiry immutability test (Test 16), B03 admin monitoring test (Test 17).
6. `apps/web/src/app/(portal)/portal/quiz/page.tsx`: B02 FIFO serialized queue, seq counter, stale payload skip.
7. `apps/web/src/app/admin/events/components/exam-room-monitoring.tsx`: B03 Giao diện Giám sát phòng thi.
8. `apps/web/src/app/admin/events/page.tsx`: B03 Tab "Giám sát phòng thi (M7.3)".
9. `apps/web/src/lib/auth/api-client.ts`: B03 `quizConfigApi.getAttemptsMonitoring()`.
10. `packages/shared/src/quiz-config.ts`: B03 Shared contracts cho Admin Exam Room Monitoring.

---

## 4. BẰNG CHỨNG KIỂM THỬ THỰC TẾ TRÊN POSTGRESQL (52/52 TESTS PASS)
Tất cả 4 bộ test tích hợp đã chạy độc lập tuần tự trên cơ sở dữ liệu PostgreSQL thực tế:

### 1. M7.3 Quiz Attempt Suite (`quiz-attempt.integration.spec.ts`): 17/17 TESTS PASS (36.12s)
```
PASS test/integration/quiz-attempt.integration.spec.ts (35.885 s)
  Quiz Attempt Integration Suite (M7.3)
    √ Test 1 [Security]: Unauthenticated request is rejected (401) (12 ms)
    √ Test 2 [Security]: Non-student role (PARENT) is rejected (403) (16 ms)
    √ Test 3 [Lifecycle Guard]: DRAFT, ARCHIVED, and Soft-deleted quizzes cannot be started (404) (36 ms)
    √ Test 4 [Event Eligibility]: Unregistered student cannot start event quiz (403) (17 ms)
    √ Test 5 [Start Attempt]: Successfully starts attempt with server-side timer & Zero-leak guarantee (89 ms)
    √ Test 6 [Resume Attempt]: Starting again while IN_PROGRESS resumes existing attempt without incrementing attemptNumber (24 ms)
    √ Test 7 [Shuffle Stability]: Question order and option mapping remain completely stable across resume and GET (30 ms)
    √ Test 8 [Save Progress]: Saves answers directly to PostgreSQL and prevents duplicates (112 ms)
    √ Test 9 [Validation]: Rejects non-existent question or out-of-range option index (400) (22 ms)
    √ Test 10 [IDOR Protection]: Student B cannot read or modify Student A's attempt (403) (21 ms)
    √ Test 11 [Expiry Guard]: Expired attempt transitions to EXPIRED and rejects further progress (400) (105 ms)
    √ Test 12 [Max Attempts]: Student can start second attempt after first expired, but 3rd attempt is rejected (400) (114 ms)
    √ Test 13 [Concurrency Near Limit]: Concurrent start requests when only 1 attempt remains respect maxAttempts via advisory lock without over-provisioning (206 ms)
    √ Test 14 [Regression Guard]: M7.2 delivery endpoints and M7.1 config remain completely functional (21 ms)
    √ Test 15 [B01 Atomic Rollback]: Invalid item in batch rolls back entire batch without partial writes (185 ms)
    √ Test 16 [B01 Expiry Immutability]: EXPIRED attempt cannot be reverted to IN_PROGRESS or updated (78 ms)
    √ Test 17 [B03 Admin Monitoring]: Admin can query exam room monitoring list with filters and student details, non-admin blocked (403) (101 ms)

Test Suites: 1 passed, 1 total
Tests:       17 passed, 17 total
Snapshots:   0 total
Time:        36.124 s
```

### 2. M7.2 Quiz Delivery Suite (`quiz-delivery.integration.spec.ts`): 10/10 TESTS PASS (34.91s)
- Test 1-2: Security (401 unauthenticated, 403 PARENT).
- Test 3-4: Active Quizzes & Zero-leak payload.
- Test 5: Event Eligibility Policy (CONFIRMED, CHECKED_IN, INVITED, CANCELLED, unregistered).
- Test 6-8: Lifecycle & ID guards.
- Test 9-10: Snapshot immutability & Open Day regression.

### 3. M7.1 Quiz Configuration Suite (`quiz-config.integration.spec.ts`): 13/13 TESTS PASS (31.11s)
- Test 1-5: RBAC, validation, CRUD, question snapshot, reordering.
- Test 6-9: Publish, archive, soft-delete, Open Day isolation.
- Test 10-13: Immutability guards & atomic concurrency locks.

### 4. M6 Question Bank Management Suite (`question-bank.integration.spec.ts`): 12/12 TESTS PASS (29.25s)
- Test 1-10: CRUD, search, filter, Excel download/preview.
- Test 13-14: Trust boundary import, race-condition duplicates, strict enum validation.

**Tổng cộng:** 52/52 tests PASS tuyệt đối trên cơ sở dữ liệu PostgreSQL thực tế (0 mock).

---

## 5. KẾT QUẢ QUALITY GATES DỰ ÁN
- **Prisma Schema Validation:** `pnpm exec prisma validate` -> Exit code 0 (The schema at prisma/schema.prisma is valid).
- **Shared Package Build:** `pnpm --filter shared build` -> Exit code 0 (`tsc`).
- **API Typecheck:** `pnpm --filter api typecheck` -> Exit code 0 (`tsc --noEmit`).
- **Web Typecheck:** `pnpm --filter web typecheck` -> Exit code 0 (`tsc --noEmit`).
- **API Lint:** `pnpm --filter api lint` -> Exit code 0 (0 errors, 0 warnings).
- **Web Lint:** `pnpm --filter web lint` -> Exit code 0 (0 errors, 0 warnings).
- **API Unit Tests:** `pnpm --filter api test:unit` -> 8 suites, 31 tests PASS (5.95s).
- **Web Unit Tests:** `pnpm --filter web test:unit` -> 10 tests PASS (129ms).
- **Web Production Build:** `pnpm --filter web build` -> 28 static/dynamic routes compiled successfully.

---

## 6. BẢO VỆ PHẠM VI & TÌNH TRẠNG GIT
- **Scope Guard:**
  - Không sửa đổi hoặc làm hồi quy các module M1–M7.2.
  - Tuyệt đối chưa triển khai submit bài thi, scoring, passingScore hay cộng XP (thuộc phạm vi M7.4).
  - Chưa tạo model kết quả hay lịch sử điểm thi (thuộc phạm vi M7.5).
- **Git Working Tree:** Sạch hoàn toàn, không có uncommitted changes.
- **Git Branch:** `fix/m4-acceptance-blockers`.
