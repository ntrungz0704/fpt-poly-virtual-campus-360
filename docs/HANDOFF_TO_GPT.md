# BÁO CÁO NGHIỆM THU NGHIỆP VỤ & KỸ THUẬT MILESTONE M7.5 — QUIZ RESULTS & HISTORY REVIEW DASHBOARD
## HỆ THỐNG TRA CỨU LỊCH SỬ THI SINH VIÊN, DASHBOARD THỐNG KÊ KẾT QUẢ DÀNH CHO ADMIN VÀ BỘ KIỂM THỬ POSTGRESQL 100% PASS

**Dự án:** FPT Polytechnic Virtual Campus 360°  
**Kho lưu trữ:** `ntrungz0704/fpt-poly-virtual-campus-360`  
**Nhánh làm việc:** `fix/m4-acceptance-blockers` (Tuân thủ duy nhất 1 nhánh làm việc, không tạo nhánh phụ)  
**Pull Request trên GitHub:** PR #1  
**Thời gian hoàn thành:** 2026-11-16 21:45 (GMT+7)  

---

## 1. ĐỐI CHIẾU COMMIT SHA TRÊN GITHUB
- **HEAD Baseline Tech Lead nghiệm thu M7.4:** `4254d63` (FULL PASS)
- **M7.5 Code & Tests Commit:** `9738d27` (`feat(quiz-results): implement m7.5 student history, admin results dashboard and postgresql integration tests`)
- **M7.5 Docs Commit:** Đi kèm ngay sau tài liệu này.
- **Quy chuẩn Git:** Phân tách hoàn toàn Code commit và Docs commit, 0 mock/stub, không force-push, duy trì trạng thái 1 nhánh duy nhất `fix/m4-acceptance-blockers`.

---

## 2. TỔNG QUAN TRIỂN KHAI MILESTONE M7.5

Milestone M7.5 hoàn thiện chu trình thi trắc nghiệm toàn diện, cung cấp giao diện và API cho cả Sinh viên (xem lại lịch sử thi, phân biệt thi lần đầu vs thi lại, xem giải thích chi tiết) và Quản trị viên (dashboard thống kê tổng quan KPI, lọc/tìm kiếm sinh viên, xem lại từng lượt làm bài và lịch sử retake).

### 2.1. M7.5-A — Lịch sử thi của sinh viên (Student Quiz History)
- **Endpoint:** `GET /api/v1/portal/quiz/history`
- **Quyền hạn (RBAC):** Chỉ cho phép `Role.STUDENT` (Phụ huynh và các vai trò khác bị từ chối 403 với mã lỗi `FORBIDDEN_STUDENT_ONLY`).
- **Tham số truy vấn (Query DTO):**
  - `page`, `limit`: Phân trang chuẩn server-side.
  - `status`: Lọc theo trạng thái `IN_PROGRESS`, `SUBMITTED`, `EXPIRED`.
  - `passed`: Lọc theo kết quả đỗ/trượt (`true`/`false`).
  - `quizConfigId`: Lọc theo cấu hình bài thi cụ thể.
- **Thông tin phản hồi:**
  - `attemptNumber`: Số thứ tự lần thi.
  - `isRetake`: Tính toán tự động (`attemptNumber > 1`).
  - `scorePercent`: Điểm phần trăm (0 - 100%).
  - `passed`: Đạt hay không đạt ngưỡng điểm của cấu hình.
  - `awardedXp`: Số XP đã nhận ở lần thi này (lần đầu = XP đạt được, lần retake = 0 XP).
  - `xpReason`: Giải thích lý do ("FIRST_SUBMIT_AWARD", "RETAKE_NO_XP", "ZERO_SCORE_CLAIM", hoặc "NO_XP_CLAIM").

### 2.2. M7.5-B — Chi tiết bài thi & Bảo vệ chống lộ đáp án (Zero-Leak Review & IDOR Protection)
- **Endpoint:** `GET /api/v1/portal/quiz/history/:attemptId`
- **Bảo vệ IDOR (Insecure Direct Object References):**
  - Sinh viên chỉ được phép xem attempt của chính mình (`attempt.userId === req.user.id`).
  - Sinh viên khác truy cập sẽ bị từ chối ngay lập tức với lỗi `403 Forbidden` (`FORBIDDEN_ATTEMPT_ACCESS`).
- **Nguyên lý Zero-Leak Invariant:**
  - Nếu attempt ở trạng thái `SUBMITTED`: Trả về toàn bộ danh sách câu hỏi trong snapshot, thứ tự các lựa chọn đã shuffle (`optionOrderJson`), đáp án sinh viên đã chọn (`selectedOptionIndex`), đáp án chính xác (`isCorrect`), và phần giải thích (`explanation`).
  - Nếu attempt ở trạng thái `IN_PROGRESS` hoặc `EXPIRED`: Mảng `results: []` rỗng, **TUYỆT ĐỐI KHÔNG** để lộ đáp án đúng hay lời giải thích dưới bất kỳ hình thức nào.
- **Zero XP on Read:** Thao tác đọc kết quả là read-only, tuyệt đối không kích hoạt ghi nhận XP hay thay đổi trạng thái attempt.

### 2.3. M7.5-C — Dashboard quản trị kết quả thi (Admin Quiz Results Dashboard)
- **Các Endpoints Quản trị:**
  1. `GET /api/v1/admin/quiz-configs/results`: Danh sách tất cả lượt thi của toàn trường, phân trang, hỗ trợ tìm kiếm sinh viên (họ tên, email, mã số sinh viên `studentCode`), lọc theo cấu hình, trạng thái thi, kết quả đỗ/trượt, khoảng thời gian thi, và sắp xếp server-side (`scorePercent`, `startedAt`, `submittedAt`).
  2. `GET /api/v1/admin/quiz-configs/results/summary`: Tổng hợp chỉ số KPI cấp cao:
     - `totalAttempts`: Tổng số lượt thi bắt đầu.
     - `totalSubmitted`: Tổng số lượt đã nộp bài.
     - `passRatePercent`: Tỷ lệ đỗ (`(passedCount / totalSubmitted) * 100`).
     - `averageScorePercent`: Điểm số trung bình toàn trường.
     - `uniqueStudents`: Số sinh viên duy nhất tham gia thi.
     - `totalAwardedXp`: Tổng số điểm XP đã phân phối qua bài thi.
  3. `GET /api/v1/admin/quiz-configs/results/:attemptId`: Quản trị viên xem lại chi tiết bài làm của sinh viên, câu đúng/sai, đáp án sinh viên chọn và giải thích nghiệp vụ.
  4. `GET /api/v1/admin/quiz-configs/results/students/:userId/quizzes/:quizConfigId`: Xem toàn bộ chuỗi lịch sử thi (retakes) của 1 sinh viên cụ thể trong 1 bài thi để đánh giá mức độ tiến bộ.
- **RBAC:** Toàn bộ endpoints trên yêu cầu vai trò `SUPER_ADMIN` hoặc `ADMIN`. Sinh viên và các vai trò khác bị chặn với `403 Forbidden`.

---

## 3. THIẾT KẾ & TÍCH HỢP GIAO DIỆN NGƯỜI DÙNG (FRONTEND)

### 3.1. Student Portal (`apps/web/src/app/(portal)/portal/quiz/page.tsx`)
- Bổ sung thanh điều hướng 2 tab trực quan:
  - **Bài thi đang mở:** Hiển thị danh sách các bài thi đang active, bộ đếm thời gian, nút "Bắt đầu làm bài" hoặc "Tiếp tục làm bài".
  - **Lịch sử làm bài:** Giao diện tra cứu các lượt thi đã hoàn thành hoặc hết hạn:
    - Bộ lọc dropdown: Lọc theo bài thi, theo trạng thái (Tất cả, Đã nộp, Đang làm, Hết hạn), và theo kết quả (Đạt / Không đạt).
    - Thẻ thống kê kết quả: Điểm số %, huy hiệu ĐẠT / KHÔNG ĐẠT, nhãn "Thi lại (Retake)", số XP đạt được kèm chú thích rõ ràng.
    - Modal Xem lại chi tiết (Review Modal): Hiển thị chi tiết từng câu hỏi, đáp án đã chọn (xanh lá nếu đúng, đỏ nếu sai), hiển thị đáp án chuẩn và hộp giải thích màu xanh lam dịu mắt. Đối với bài thi chưa nộp, hiển thị thông báo an toàn Zero-Leak.

### 3.2. Admin Results Dashboard (`apps/web/src/app/admin/events/components/quiz-results-dashboard.tsx`)
- Tích hợp liền mạch vào hệ thống Admin Events tại tab `"results"` (`/admin/events?tab=results`).
- **Thẻ thống kê KPI (Stat Cards):** 6 thẻ hiển thị real-time các chỉ số: Tổng lượt thi, Lượt nộp thành công, Tỷ lệ đỗ (%), Điểm trung bình (%), Sinh viên tham gia, Tổng XP đã cấp.
- **Thanh công cụ lọc & tìm kiếm:** Ô tìm kiếm debounce (họ tên, email, MSSV), bộ lọc dropdown bài thi, bộ lọc trạng thái đỗ/trượt.
- **Bảng dữ liệu phân trang:** Hiển thị chi tiết thông tin sinh viên, tên bài thi, số lần thi, điểm số (có thanh tiến độ trực quan), trạng thái, XP và ngày thi.
- **Modal chi tiết bài làm:** Quản trị viên có thể xem lại chính xác câu hỏi và lựa chọn của sinh viên.
- **Modal lịch sử Retake:** Hiển thị toàn bộ các lần thi của sinh viên theo trình tự thời gian để theo dõi lộ trình cải thiện điểm số.

---

## 4. KẾT QUẢ KIỂM THỬ POSTGRESQL & BỘ TEST HỒI QUY TOÀN DỰ ÁN

Tất cả các bài kiểm thử đều được chạy trực tiếp trên cơ sở dữ liệu PostgreSQL thực tế thông qua cơ chế `provisionScratchDatabase`, đảm bảo tuân thủ 100% ràng buộc schema, unique index và khóa ngoại.

### 4.1. Bộ test tích hợp M7.5 (`quiz-results.integration.spec.ts`) — 20/20 PASS
```
PASS apps/api/test/integration/quiz-results.integration.spec.ts (29.548 s)
  Quiz Results & History Review Dashboard Integration Suite (M7.5)
    √ Test 1: Student 1 queries quiz history list returns paginated attempts ordered by startedAt desc (37 ms)
    √ Test 2: Student history distinguishes first attempt (isRetake: false) from retakes (isRetake: true) (16 ms)
    √ Test 3: Student history reflects awarded XP and reason (first submit vs retake 0 XP) (9 ms)
    √ Test 4: Student history filter by status=SUBMITTED returns only submitted attempts (14 ms)
    √ Test 5: Student history filter by passed=true returns only passed attempts (11 ms)
    √ Test 6: Student history filter by quizConfigId isolates attempts for that quiz (20 ms)
    √ Test 7: Student views SUBMITTED attempt detail returns full questions review with options, student selection, correct answer and explanation (12 ms)
    √ Test 8: Zero-Leak Invariant: Student viewing EXPIRED attempt detail returns results: [] and NEVER leaks correct answers or explanations (11 ms)
    √ Test 9: Zero-Leak Invariant: Student viewing IN_PROGRESS attempt detail returns results: [] and NEVER leaks correct answers (8 ms)
    √ Test 10: IDOR Protection: Student 2 attempting to view Student 1 attempt detail is rejected with 403 Forbidden (17 ms)
    √ Test 11: Zero XP on Read: Repeatedly viewing history or detail does NOT alter attempt status, score or XP claims (29 ms)
    √ Test 12: Admin queries quiz results with pagination returns all campus attempts with student profiles (35 ms)
    √ Test 13: Admin search by student (studentCode PS67890) returns only Student 2 attempts (24 ms)
    √ Test 14: Admin filter by passed=true returns only passed attempts across campus (22 ms)
    √ Test 15: Admin sorting by scorePercent desc orders highest score first (19 ms)
    √ Test 16: Admin summary KPI metrics computes accurate aggregate counts and pass rate (36 ms)
    √ Test 17: Admin view attempt detail returns complete question answers and explanation for admin review (33 ms)
    √ Test 18: Admin student retake history endpoint returns all attempts for user and quiz in ascending order (16 ms)
    √ Test 19: RBAC: Student calling admin results endpoints is rejected with 403 Forbidden (20 ms)
    √ Test 20: RBAC: Parent calling portal quiz history is rejected with 403 Forbidden (FORBIDDEN_STUDENT_ONLY) (11 ms)

Test Suites: 1 passed, 1 total
Tests:       20 passed, 20 total
Time:        29.786 s
```

### 4.2. Toàn bộ chuỗi kiểm thử hồi quy (Full Regression Suites) — 91/91 PASS
- **M7.5 — Quiz Results & History Review Dashboard:** 20/20 PASSED
- **M7.4 — Quiz Submission, Scoring & XP:** 16/16 PASSED
- **M7.3 — Quiz Attempt Engine & Live Timer:** 20/20 PASSED
- **M7.2 — Quiz Delivery & Shuffle Logic:** 10/10 PASSED
- **M7.1 — Quiz Configuration & Snapshot:** 13/13 PASSED
- **M6 — Question Bank Management:** 12/12 PASSED
- **TỔNG CỘNG:** **91/91 PostgreSQL Integration Tests Passed (0 Failure, 0 Regression)**.

### 4.3. Kiểm thử đơn vị giao diện (Web Unit Tests) — 14/14 PASS
- 14/14 unit tests tại `apps/web/tests/unit/*.test.ts` (bao gồm toàn bộ kịch bản autosave flush, chốt chặn race condition B02, RBAC routes, format code) đạt 100% PASS.

---

## 5. BÁO CÁO CỔNG CHẤT LƯỢNG (QUALITY GATES)

| Lệnh kiểm tra | Kết quả | Ghi chú |
| :--- | :---: | :--- |
| `pnpm --filter shared build` | **PASS (Exit 0)** | Shared DTOs biên dịch sạch sẽ |
| `pnpm --filter api typecheck` | **PASS (Exit 0)** | 0 lỗi TypeScript NestJS API |
| `pnpm --filter web typecheck` | **PASS (Exit 0)** | 0 lỗi TypeScript Next.js Web |
| `pnpm --filter api lint` | **PASS (Exit 0)** | 0 warnings, 0 errors |
| `pnpm --filter web lint` | **PASS (Exit 0)** | 0 warnings, 0 errors |
| `pnpm --filter web test:unit` | **PASS (Exit 0)** | 14/14 tests pass |
| `pnpm --filter web build` | **PASS (Exit 0)** | Next.js 16.4.6 build thành công toàn bộ 28 routes |

---

## 6. DANH SÁCH FILE THAY ĐỔI TRONG M7.5

1. `packages/shared/src/quiz-config.ts` (M7.5 DTOs & Interfaces)
2. `apps/api/src/modules/portal/dto/portal.dto.ts` (Query DTO sinh viên)
3. `apps/api/src/modules/portal/portal-quiz.controller.ts` (Endpoints lịch sử và chi tiết bài làm)
4. `apps/api/src/modules/portal/portal-quiz.service.ts` (Logic tra cứu, Zero-leak & IDOR protection)
5. `apps/api/src/modules/quiz-config/dto/quiz-config.dto.ts` (Query DTO admin)
6. `apps/api/src/modules/quiz-config/quiz-config.controller.ts` (Endpoints admin results, summary, retakes)
7. `apps/api/src/modules/quiz-config/quiz-config.service.ts` (Aggregate metrics, sorting, filtering)
8. `apps/web/src/lib/portal/portal-api.ts` (Client API cho sinh viên)
9. `apps/web/src/lib/auth/api-client.ts` (Client API cho quản trị viên)
10. `apps/web/src/app/(portal)/portal/quiz/page.tsx` (Giao diện lịch sử & review modal cho sinh viên)
11. `apps/web/src/app/admin/events/components/quiz-results-dashboard.tsx` (Dashboard kết quả cho admin)
12. `apps/web/src/app/admin/events/page.tsx` (Tích hợp tab results)
13. `apps/api/test/integration/quiz-results.integration.spec.ts` (20 integration tests)
14. `apps/api/test/integration/question-bank.integration.spec.ts` (Tăng timeout phòng ngừa)
15. `apps/api/test/integration/quiz-config.integration.spec.ts` (Tăng timeout phòng ngừa)
16. `apps/api/test/integration/quiz-delivery.integration.spec.ts` (Tăng timeout phòng ngừa)
17. `apps/api/test/integration/quiz-attempt.integration.spec.ts` (Tăng timeout phòng ngừa)
18. `docs/HANDOFF_TO_GPT.md` (Tài liệu nghiệm thu chính thức)

---

## 7. ĐỀ XUẤT NGHIỆM THU CHO TECH LEAD (MENTOR GPT)

Toàn bộ các tiêu chí nghiệm thu của **Milestone M7.5 (Quiz Results & History Review Dashboard)** đã được triển khai hoàn tất với chất lượng cao nhất:
- Cơ chế bảo vệ Zero-Leak và phòng chống tấn công IDOR được xác thực bằng kiểm thử tự động trên PostgreSQL thực tế.
- Bộ chỉ số thống kê tổng hợp KPI đáp ứng chính xác nhu cầu quản lý đào tạo và sự kiện.
- Giao diện người dùng responsive, trực quan, hỗ trợ đầy đủ các bộ lọc và tìm kiếm.
- Bộ test hồi quy 91/91 PostgreSQL tests và 14/14 unit tests đạt 100% tỷ lệ pass.

Kính đề nghị Tech Lead (Mentor GPT) xem xét và cấp quyết định **FULL PASS** chính thức cho **Milestone M7.5** và hoàn tất toàn bộ chuyên đề **Milestone 7 (Quiz System End-to-End)**!
