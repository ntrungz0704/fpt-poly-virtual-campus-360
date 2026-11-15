# BÁO CÁO NGHIỆM THU NGHIỆP VỤ & KỸ THUẬT MILESTONE M7.4 (QUIZ SUBMISSION, SCORING & XP)
## TOÀN BỘ CHỈ ĐẠO CỦA TECH LEAD ĐÃ ĐƯỢC TRIỂN KHAI VÀ KIỂM CHỨNG 100% TRÊN POSTGRESQL

**Dự án:** FPT Polytechnic Virtual Campus 360°  
**Nhánh:** `fix/m4-acceptance-blockers`  
**Pull Request trên GitHub:** PR #1  
**Thời gian cập nhật:** 2026-11-16 01:05 (GMT+7)

---

## 1. ĐỐI CHIẾU COMMIT SHA TRÊN GITHUB
- **HEAD Baseline trước (M7.3 Pass):** `7bd933fb5d289081df4de4857004eeae3bdf195a`
- **M7.4 Code Commit:** `b2c7fc4` (`feat(quiz-submit): implement m7.4 quiz submission, server-side scoring, and one-time xp ledger award`)
- **M7.4 Docs Commit:** Đi kèm ngay sau tài liệu này.
- **Quy chuẩn Git:** Tuân thủ tuyệt đối quy tắc phân tách Code commit và Docs commit, không commit mock/stub, không force-push, remote tip đồng bộ 100% với local HEAD trên nhánh `fix/m4-acceptance-blockers`.

---

## 2. TỔNG QUAN TRIỂN KHAI MILESTONE M7.4

### 2.1. Prisma Schema Migration & PostgreSQL DDL
- **File migration:** `prisma/migrations/20261116000001_quiz_submission_scoring_xp/migration.sql`
- **Các trường bổ sung vào bảng `quiz_config_attempts`:**
  - `total_questions INT NULL`
  - `answered_count INT NULL`
  - `correct_count INT NULL`
  - `score_percent INT NULL`
  - `passed BOOLEAN NULL`
  - `base_xp INT NULL`
  - `bonus_xp INT NULL`
  - `awarded_xp INT NULL`
- **Bổ sung vào bảng `xp_ledger`:**
  - `idempotency_key VARCHAR(160) NULL` kèm ràng buộc duy nhất:
    `CREATE UNIQUE INDEX xp_ledger_idempotency_key_key ON xp_ledger(idempotency_key);`
  - Đảm bảo bảo vệ chống double-credit ở cấp độ vật lý cơ sở dữ liệu.

### 2.2. Shared Contracts (`packages/shared/src/quiz-config.ts`)
- `QuizAttemptQuestionResultDto`: Chi tiết từng câu hỏi khi nộp bài (id, displayedOrder, questionText, displayedOptions, selectedOptionIndex, correctOptionIndex, isCorrect, explanation).
- `QuizAttemptSummaryDto`: Tổng hợp số liệu bài thi (`totalQuestions`, `answeredCount`, `correctCount`, `scorePercent`, `passingScore`, `passed`).
- `QuizAttemptXpAwardDto`: Chi tiết phần thưởng (`baseXp`, `bonusXp`, `awardedXp`, `isXpAwarded`, `reason`).
- `SubmitQuizAttemptResponseDto`: Cấu trúc response chính thức của endpoint nộp bài.
- `PortalQuizAttemptDto`: Mở rộng thuộc tính `submissionResult?: SubmitQuizAttemptResponseDto`.

### 2.3. Backend Submission, Scoring & XP Service (`portal-quiz.service.ts` & `portal-quiz.controller.ts`)
- **Route:** `POST /api/v1/portal/quiz/attempts/:attemptId/submit` (Bảo vệ bằng `JwtAuthGuard` và `enforceStudentRole`).
- **Giao dịch nguyên tử (Atomic Transaction):**
  1. `SELECT id FROM quiz_config_attempts WHERE id = :attemptId::uuid FOR UPDATE`: Khóa hàng bản ghi attempt.
  2. `SELECT pg_advisory_xact_lock(hashtext('quiz_submit_' || userId || '_' || quizConfigId))`: Tuần tự hóa các attempt đồng thời của cùng một sinh viên, đảm bảo giải quyết tranh chấp cấp XP mượt mà không gây lỗi xung đột 409.
  3. **IDOR & Ownership Guard:** Kiểm tra `attempt.userId === userId`, chặn sinh viên khác nộp bài (403 Forbidden).
  4. **Idempotent Repeat Submit:** Nếu `attempt.status === "SUBMITTED"`, trả ngay kết quả đã lưu kèm HTTP 200 OK mà không chấm lại hay cấp thêm XP.
  5. **Server-side Expiry Guard:** Nếu `now >= attempt.expiresAt`, cập nhật trạng thái `status = 'EXPIRED'`, commit transaction và ném `400 Bad Request` (`ATTEMPT_EXPIRED`).
  6. **100% Server-side Scoring:**
     - Duyệt từng câu hỏi trong snapshot `attempt.answers`.
     - Phục hồi chỉ số đáp án đúng theo thứ tự hiển thị của học viên: `correctDisplayedIndex = optionOrder.indexOf(q.correctIndex)`.
     - Câu hỏi chưa chọn (`selectedOptionIndex === null`) tự động tính là sai (`isCorrect = false`).
     - Công thức tính điểm: $\text{scorePercent} = \text{round}(C / N \times 100)$.
     - Điều kiện đạt: $\text{passed} = \text{scorePercent} \ge \text{passingScore}$.
  7. **Chính sách cấp XP (One-time per Quiz Configuration):**
     - Base XP: $\text{baseXp} = C \times 10$.
     - Bonus XP: $\text{bonusXp} = \text{passed} ? 20 : 0$.
     - Tổng XP tính toán: $\text{calculatedXp} = \text{baseXp} + \text{bonusXp}$.
     - Kiểm tra `XpLedger` theo `idempotencyKey = 'quiz:first-submit:' || userId || ':' || quizConfigId`.
     - Lần đầu nộp: Cấp `awardedXp = calculatedXp`, `isXpAwarded = true`, tạo bản ghi `XpLedger`.
     - Thi lại (Retake): `awardedXp = 0`, `isXpAwarded = false`, `reason = 'ALREADY_AWARDED_OR_RETAKE'`, không tạo thêm `XpLedger`.
  8. **Cập nhật trạng thái:** Cập nhật `quiz_config_attempts` sang `SUBMITTED`, lưu `submittedAt`, `scorePercent`, `passed`, `awardedXp`... trong cùng 1 transaction duy nhất.

### 2.4. Frontend Web Portal (`apps/web/src/app/(portal)/portal/quiz/page.tsx`)
- Tích hợp hàm `submitQuiz()` với modal xác nhận (`submit-confirm-modal`).
- Nút "Nộp bài thi" nổi bật trên thanh header và question palette với spinner loading và retry khi lỗi mạng.
- Giao diện kết quả chi tiết `QuizResultView`:
  - Badge Điểm số lớn dạng phần trăm (VD: `100%`, `67%`).
  - Badge trạng thái: `ĐẠT CHỈ TIÊU` (xanh lục) hoặc `CHƯA ĐẠT` (đỏ/vàng).
  - Khối hiển thị XP nhận được: Nổi bật số điểm XP nhận về tài khoản hoặc ghi chú lượt thi lại không cộng thêm XP.
  - Danh sách từng câu hỏi: Hiển thị câu trả lời đã chọn, đáp án đúng và phần giải thích chi tiết (`explanation`).

---

## 3. KẾT QUẢ KIỂM THỬ TÍCH HỢP POSTGRESQL (100% PASS)

### 3.1. Bộ test M7.4 (`quiz-submit.integration.spec.ts`) — 13/13 KỊCH BẢN THỰC TẾ
```
PASS test/integration/quiz-submit.integration.spec.ts (36.253 s)
  Quiz Submission, Scoring & XP Integration Suite (M7.4)
    √ Test 1 [Auth & Role]: Rejects unauthenticated request (401) and non-student role (403) (22 ms)
    √ Test 2 [Ownership & IDOR Protection]: Student B cannot submit Student A's attempt (403) (69 ms)
    √ Test 3 [Expiry & Status Guard]: Rejects expired attempt (400) and updates DB status to EXPIRED (83 ms)
    √ Test 4 [Perfect Score & First XP]: Scores 100%, passes quiz, awards base + bonus XP, and creates XpLedger (154 ms)
    √ Test 5 [Zero Score & Omitted]: Omitted questions count as incorrect, score is 0, bonus is 0, 0 XP awarded (136 ms)
    √ Test 6 [Boundary & Rounding]: 2/3 correct rounds to 67%, below 70% threshold -> FAIL, awards 20 base XP and 0 bonus XP (209 ms)
    √ Test 7 [Shuffle Mapping]: Correctly scores question when option order is shuffled (255 ms)
    √ Test 8 [One-Time XP]: Retake attempt is scored and saved as SUBMITTED, but awards 0 XP (166 ms)
    √ Test 9 [Idempotency]: Submitting an already SUBMITTED attempt returns saved result with HTTP 200 without creating extra XP (94 ms)
    √ Test 10 [Concurrency Same Attempt]: 10 concurrent submits on same attempt all succeed without duplicate ledger records (628 ms)
    √ Test 11 [Concurrency 2 Attempts Same Student]: Unique idempotency key ensures exactly ONE attempt receives XP (466 ms)
    √ Test 12 [Submit Lock Contention on Expiry]: Submit request waiting on lock past expiresAt is rejected with 400 and committed as EXPIRED (2698 ms)
    √ Test 13 [Zero Leakage & Tamper Resistance]: Ignores client payload attempting to inject score/answers (141 ms)

Test Suites: 1 passed, 1 total
Tests:       13 passed, 13 total
```

### 3.2. Toàn bộ 4 bộ test hồi quy (Regression Suites) — 55/55 KỊCH BẢN PASS
1. **M7.3 Attempt Engine (`quiz-attempt.integration.spec.ts`):** 20/20 PASS (34.4s)
2. **M7.2 Delivery (`quiz-delivery.integration.spec.ts`):** 10/10 PASS (27.3s)
3. **M7.1 Configuration (`quiz-config.integration.spec.ts`):** 13/13 PASS (39.0s)
4. **M6 Question Bank (`question-bank.integration.spec.ts`):** 12/12 PASS (33.7s)

**Tổng cộng: 68 test tích hợp PostgreSQL chạy độc lập liên tục, 0 lỗi, 0 cảnh báo.**

---

## 4. TỔNG HỢP KIỂM TRA CHẤT LƯỢNG (QUALITY GATES)

| Lệnh Kiểm Tra | Kết Quả | Chi Tiết |
| :--- | :--- | :--- |
| `pnpm exec prisma validate` | **PASS** | Lược đồ hợp lệ 100% |
| `pnpm --filter shared build` | **PASS** | Biên dịch TypeScript exit code 0 |
| `pnpm --filter api typecheck` | **PASS** | 0 lỗi kiểu |
| `pnpm --filter web typecheck` | **PASS** | 0 lỗi kiểu |
| `pnpm --filter api lint` | **PASS** | 0 lỗi, 0 cảnh báo |
| `pnpm --filter web lint` | **PASS** | 0 lỗi, 0 cảnh báo |
| `pnpm --filter api test:unit` | **PASS** | 8 suites, 31 tests passed |
| `pnpm --filter web test:unit` | **PASS** | 10 tests passed |
| `pnpm --filter web build` | **PASS** | 28 route tĩnh và động biên dịch thành công |

---

## 5. ĐỀ XUẤT CHO TECH LEAD (MENTOR GPT)
- **Đánh giá và cấp thẩm quyền:** Đề nghị Tech Lead nghiệm thu **FULL PASS** cho **Milestone M7.4 (Quiz Submission, Scoring & XP)**.
- **Kế hoạch tiếp theo:** Sau khi Tech Lead ký duyệt M7.4, sẽ nhận chỉ đạo chính thức để triển khai Milestone **M7.5 (Quiz Results & History Review Dashboard)**.
