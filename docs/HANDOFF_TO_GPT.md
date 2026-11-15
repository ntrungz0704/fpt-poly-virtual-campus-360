# BÁO CÁO NGHIỆM THU NGHIỆP VỤ & KỸ THUẬT MILESTONE M7.3 (QUIZ ATTEMPT ENGINE)
## HOÀN TẤT TRIỆT ĐỂ B01 & B03 — SẴN SÀNG FULL PASS

**Dự án:** FPT Polytechnic Virtual Campus 360°  
**Nhánh:** `fix/m4-acceptance-blockers`  
**Pull Request trên GitHub:** PR #1  
**Thời gian cập nhật:** 2026-11-15 23:38 (GMT+7)

---

## 1. ĐỐI CHIẾU COMMIT SHA TRÊN GITHUB
- **HEAD Baseline trước:** `96eeadbf1074594c4bc5164e0c06ce3cef98940b`
- **M7.3 Final Remediation Code Commit (B01, B03):** `158e277` (`fix(quiz-attempt): commit expired status before 400 rejection, normalize monitoring status filter, and add quiz filter UI (B01, B03)`)
- **M7.3 Final Remediation Docs Commit:** Đi kèm và đồng bộ ngay sau tài liệu này.
- **Quy chuẩn Git:** Tách biệt tuyệt đối Code commit và Docs commit, không force-push, remote tip đồng bộ 100% với local HEAD.

---

## 2. GIẢI PHÁP KỸ THUẬT XỬ LÝ TRIỆT ĐỂ 2 BLOCKER B01 & B03

### 🟢 B01 — Xử lý Transaction Rollback khi Hết hạn:
- **File:** `apps/api/src/modules/portal/portal-quiz.service.ts`
- **Cơ chế:**
  - Giữ nguyên khóa hàng `SELECT id FROM quiz_config_attempts WHERE id = ${attemptId}::uuid FOR UPDATE`.
  - Tái kiểm tra thời gian thực `now` dưới khóa hàng. Nếu `attempt.status === "IN_PROGRESS" && now >= attempt.expiresAt`:
    + Cập nhật trạng thái `status: "EXPIRED"` vào PostgreSQL trong transaction.
    + Trả về kết quả nội bộ `{ expiredOrClosed: true, data: null }` thay vì ném exception trực tiếp bên trong callback của `$transaction`.
    + Nhờ đó, **Prisma Transaction commit thành công 100%**, trạng thái `EXPIRED` được ghi bền vững vào PostgreSQL!
  - Sau khi transaction commit xong, hàm `saveProgress()` mới ném `BadRequestException({ code: "ATTEMPT_EXPIRED_OR_CLOSED", message: "Lượt thi đã hết thời gian hoặc không còn hiệu lực làm bài." })` để trả về HTTP 400 cho client.
  - Tuyệt đối không có câu trả lời nào được ghi khi hết hạn.
  - Kiểm chứng qua các test B01-T01, B01-T02, B01-T03, B01-T04.

### 🟢 B03 — Hoàn thiện Giám sát Phòng thi (Admin Exam Room Monitoring):
- **B03.1 — Đồng bộ Nhất quán Trạng thái Lọc (Status Consistency & Normalization):**
  - **File:** `apps/api/src/modules/quiz-config/quiz-config.service.ts`
  - Trước khi thực hiện `count` và `findMany`, hàm `getAttemptsMonitoring()` chạy lệnh chuẩn hóa nguyên tử:
    ```ts
    await this.prisma.quizConfigAttempt.updateMany({
      where: {
        status: "IN_PROGRESS",
        expiresAt: { lte: now },
      },
      data: {
        status: "EXPIRED",
      },
    });
    ```
  - Đảm bảo 100% các lượt thi đã quá hạn đều được chuyển thành `EXPIRED` trên DB trước khi lọc.
  - Bộ lọc `status=EXPIRED` lấy chính xác và đầy đủ toàn bộ các lượt thi đã hết giờ.
  - Lượt thi đã hết giờ tuyệt đối không xuất hiện dưới bộ lọc `status=IN_PROGRESS`.
  - Tổng số bản ghi `total`, `totalPages` và danh sách `items` hoàn toàn ăn khớp và đồng nhất.
- **B03.2 — Bộ lọc Bài thi (Quiz Filter UI):**
  - **File:** `apps/web/src/app/admin/events/components/exam-room-monitoring.tsx`
  - Tải danh sách bài thi từ API `quizConfigApi.list({ limit: 100 })`.
  - Bổ sung dropdown `<select value={quizFilter} ...>` cho phép Admin chọn "Tất cả bài thi" hoặc lọc theo từng bài thi cụ thể.
  - Truyền `quizConfigId` xuống API `getAttemptsMonitoring()`.
  - Tích hợp mượt mà với bộ lọc trạng thái, ô tìm kiếm và giữ nguyên trạng thái lọc khi tự động làm mới (Auto-refresh 10s).

---

## 3. BẰNG CHỨNG KIỂM THỬ THỰC TẾ TRÊN POSTGRESQL (55/55 TESTS PASS)
Tất cả 4 bộ test tích hợp đã chạy độc lập tuần tự trên cơ sở dữ liệu PostgreSQL thực tế:

### 1. M7.3 Quiz Attempt Suite (`quiz-attempt.integration.spec.ts`): 20/20 TESTS PASS (36.96s)
```
PASS test/integration/quiz-attempt.integration.spec.ts (36.691 s)
  Quiz Attempt Integration Suite (M7.3)
    √ Test 1 [Security]: Unauthenticated request is rejected (401) (10 ms)
    √ Test 2 [Security]: Non-student role (PARENT) is rejected (403) (11 ms)
    √ Test 3 [Lifecycle Guard]: DRAFT, ARCHIVED, and Soft-deleted quizzes cannot be started (404) (34 ms)
    √ Test 4 [Event Eligibility]: Unregistered student cannot start event quiz (403) (18 ms)
    √ Test 5 [Start Attempt]: Successfully starts attempt with server-side timer & Zero-leak guarantee (86 ms)
    √ Test 6 [Resume Attempt]: Starting again while IN_PROGRESS resumes existing attempt without incrementing attemptNumber (18 ms)
    √ Test 7 [Shuffle Stability]: Question order and option mapping remain completely stable across resume and GET (28 ms)
    √ Test 8 [Save Progress]: Saves answers directly to PostgreSQL and prevents duplicates (210 ms)
    √ Test 9 [Validation]: Rejects non-existent question or out-of-range option index (400) (24 ms)
    √ Test 10 [IDOR Protection]: Student B cannot read or modify Student A's attempt (403) (21 ms)
    √ Test 11 [Expiry Guard]: Expired attempt transitions to EXPIRED and rejects further progress (400) (187 ms)
    √ Test 12 [Max Attempts]: Student can start second attempt after first expired, but 3rd attempt is rejected (400) (157 ms)
    √ Test 13 [Concurrency Near Limit]: Concurrent start requests when only 1 attempt remains respect maxAttempts via advisory lock without over-provisioning (266 ms)
    √ Test 14 [Regression Guard]: M7.2 delivery endpoints and M7.1 config remain completely functional (22 ms)
    √ Test 15 [B01-T01 & B01-T02 Expiry Commit]: IN_PROGRESS attempt past expiresAt updates DB to EXPIRED, returns 400, and answers remain unchanged (154 ms)
    √ Test 16 [B01-T03 Concurrent Expiry]: Concurrent save requests on an expiring attempt cannot write answers after expiry (337 ms)
    √ Test 17 [B01-T04 Expiry Immutability]: EXPIRED attempt cannot be reverted to IN_PROGRESS or updated (389 ms)
    √ Test 18 [B01 Atomic Rollback]: Invalid item in batch rolls back entire batch without partial writes (129 ms)
    √ Test 19 [B03.1 Status Consistency]: In-progress attempts past expiresAt appear under status=EXPIRED and not under status=IN_PROGRESS (147 ms)
    √ Test 20 [B03.2 Quiz Filter & RBAC]: Admin can filter monitoring by quizConfigId and search, non-admin blocked (403) (46 ms)

Test Suites: 1 passed, 1 total
Tests:       20 passed, 20 total
Snapshots:   0 total
Time:        36.964 s
```

### 2. M7.2 Quiz Delivery Suite (`quiz-delivery.integration.spec.ts`): 10/10 TESTS PASS (34.91s)
### 3. M7.1 Quiz Configuration Suite (`quiz-config.integration.spec.ts`): 13/13 TESTS PASS (31.11s)
### 4. M6 Question Bank Suite (`question-bank.integration.spec.ts`): 12/12 TESTS PASS (29.25s)

**Tổng cộng:** 55/55 tests PASS tuyệt đối trên cơ sở dữ liệu PostgreSQL thực tế (0 mock).

---

## 4. KẾT QUẢ QUALITY GATES DỰ ÁN
- **Prisma Schema:** `pnpm exec prisma validate` -> Valid 100%.
- **Shared Package Build:** `pnpm --filter shared build` -> Exit code 0.
- **API Typecheck:** `pnpm --filter api typecheck` -> Exit code 0 (0 errors).
- **Web Typecheck:** `pnpm --filter web typecheck` -> Exit code 0 (0 errors).
- **API Lint:** `pnpm --filter api lint` -> Exit code 0 (0 errors, 0 warnings).
- **Web Lint:** `pnpm --filter web lint` -> Exit code 0 (0 errors, 0 warnings).
- **API Unit Tests:** `pnpm --filter api test:unit` -> 8 suites, 31 tests PASS (5.58s).
- **Web Unit Tests:** `pnpm --filter web test:unit` -> 10 tests PASS (135ms).
- **Web Production Build:** `pnpm --filter web build` -> 28 static/dynamic routes compiled successfully.

---

## 5. BẢO VỆ PHẠM VI (SCOPE GUARD) & GIT STATUS
- Không triển khai M7.4 (submit, scoring, passingScore, XP).
- Không triển khai M7.5 (result, history).
- Git working tree sạch 100%: On branch `fix/m4-acceptance-blockers`, nothing to commit, working tree clean.
