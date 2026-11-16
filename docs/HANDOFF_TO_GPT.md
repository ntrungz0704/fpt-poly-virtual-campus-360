# BÁO CÁO NGHIỆM THU NGHIỆP VỤ & KỸ THUẬT MILESTONE M7.4 (QUIZ SUBMISSION, SCORING & XP) — TARGETED REMEDIATION (B01–B04)
## TOÀN BỘ CHỈ ĐẠO CỦA TECH LEAD ĐÃ ĐƯỢC TRIỂN KHAI VÀ XÁC THỰC 100% TRÊN POSTGRESQL THỰC TẾ

**Dự án:** FPT Polytechnic Virtual Campus 360°  
**Nhánh:** `fix/m4-acceptance-blockers` (Duy nhất 1 nhánh, không phân nhánh phụ)  
**Pull Request trên GitHub:** PR #1  
**Thời gian hoàn thành:** 2026-11-16 13:15 (GMT+7)  

---

## 1. ĐỐI CHIẾU COMMIT SHA TRÊN GITHUB
- **HEAD Baseline M7.4 trước remediation:** `c967de5` (Code commit `b2c7fc4`)
- **M7.4 Remediation Code Commit:** `2ed54d0` (`fix(quiz-submit): resolve b01 zero-xp claim, b02 autosave flush, and add b03-b04 integration tests`)
- **M7.4 Remediation Docs Commit:** Đi kèm ngay sau tài liệu này.
- **Quy chuẩn Git:** Tuân thủ tuyệt đối quy tắc phân tách Code commit và Docs commit, 0 mock/stub, không force-push, 100% đồng bộ với `origin/fix/m4-acceptance-blockers`.

---

## 2. GIẢI TRÌNH XỬ LÝ CHI TIẾT CÁC ĐIỂM CHỈ ĐẠO CỦA TECH LEAD (B01 – B04)

### 2.1. B01 — One-time XP Claim khi lần submit đầu tiên đạt 0 điểm / 0 XP
- **Vấn đề trước đây:** Logic cũ chỉ dựa vào `findUnique({ where: { idempotencyKey } })` trên bảng `xp_ledger`. Khi sinh viên submit lần đầu đạt 0 điểm ($0 \text{ XP}$), hệ thống không tạo ledger record dẫn đến lượt thi thứ hai (retake) vẫn được nhận XP nếu đạt điểm cao.
- **Giải pháp xử lý:**
  1. **Prisma Model & PostgreSQL Table (`quiz_xp_claims`):**
     - Tạo model `QuizXpClaim` với các trường `id`, `userId`, `quizConfigId`, `attemptId`, `awardedXp`, `createdAt`.
     - Thiết lập ràng buộc độc nhất ở cấp độ vật lý DB:
       ```sql
       CREATE UNIQUE INDEX uq_quiz_xp_claims_user_quiz ON quiz_xp_claims(user_id, quiz_config_id);
       ```
     - Migration file: `prisma/migrations/20261116000002_quiz_xp_claims/migration.sql`.
  2. **Logic giao dịch Backend (`portal-quiz.service.ts`):**
     - Trong transaction atomic có khóa `FOR UPDATE` và `pg_advisory_xact_lock`, kiểm tra `tx.quizXpClaim.findUnique({ where: { userId_quizConfigId: { userId, quizConfigId } } })`.
     - **Lần submit đầu tiên (`!existingClaim`):**
       - Nếu `calculatedXp > 0`: Cấp `awardedXp = calculatedXp`, `isXpAwarded = true`, `reason = 'FIRST_QUIZ_SUBMISSION'`, ghi vào `xp_ledger` và ghi nhận claim vào `quiz_xp_claims`.
       - Nếu `calculatedXp === 0`: Đánh dấu `awardedXp = 0`, `isXpAwarded = false`, `reason = 'FIRST_SUBMIT_ZERO_XP'`. **KHÔNG** ghi record rác vào `xp_ledger`, nhưng **BẮT BUỘC** ghi claim vào `quiz_xp_claims` với `awardedXp = 0`. Quyền nhận XP bị tiêu thụ vĩnh viễn ngay từ lần đầu này.
     - **Các lần thi lại tiếp theo (Retake - `existingClaim` đã tồn tại):**
       - Bất kể điểm số của lần thi lại cao bao nhiêu (kể cả 100%), `awardedXp = 0`, `isXpAwarded = false`, `reason = 'ALREADY_AWARDED_OR_RETAKE'`, không ghi thêm claim hay ledger.
  3. **Kiểm chứng bằng Test 5:**
     - Sinh viên submit Attempt 1 với 0 điểm -> Nhận 0 XP, claim được tạo trong DB với `awarded_xp: 0`, 0 dòng trong `xp_ledger`.
     - Sinh viên tạo Attempt 2 (Retake) và trả lời đúng 100% (2/2 câu) -> Submit nhận 0 XP (`reason: ALREADY_AWARDED_OR_RETAKE`), DB vẫn chỉ có duy nhất 1 claim và 0 dòng trong `xp_ledger`.

---

### 2.2. B02 — Flush Autosave Queue trước khi Submit & Xử lý lỗi Autosave
- **Vấn đề trước đây:** Frontend `handleSubmitQuiz` gọi thẳng `portalApi.submitQuizAttempt` mà không chờ `saveQueueRef.current`. Nếu người dùng click submit ngay sau khi vừa chọn đáp án, request autosave có thể chạy song song hoặc chưa kịp lưu vào DB.
- **Giải pháp xử lý (`apps/web/src/app/(portal)/portal/quiz/page.tsx`):**
  1. Thêm `lastSaveErrorRef = useRef<Error | null>(null)` để theo dõi trạng thái lỗi của chuỗi autosave.
  2. Trong `handleSelectOption`:
     - Khi autosave tuần tự thành công và sequence khớp `latestSequenceRef.current`, reset `lastSaveErrorRef.current = null`.
     - Khi autosave bị lỗi (network fail/server 500), lưu lỗi vào `lastSaveErrorRef.current`.
  3. Trong `handleSubmitQuiz`:
     ```typescript
     // 1. Flush autosave queue: chờ toàn bộ các request lưu đáp án trước đó hoàn tất
     await saveQueueRef.current;

     // 2. Kiểm tra nếu autosave gần nhất bị lỗi: không được nuốt lỗi mà phải hủy submit
     if (lastSaveErrorRef.current) {
       throw new Error(
         `Không thể nộp bài vì lưu câu trả lời chưa thành công: ${lastSaveErrorRef.current.message}. Vui lòng thử lại.`,
       );
     }

     // 3. Toàn bộ đáp án đã được đồng bộ an toàn lên PostgreSQL -> Gửi submit
     const res = await portalApi.submitQuizAttempt(activeAttempt.id);
     ```
  4. **Kiểm thử tự động chuyên sâu (`apps/web/tests/unit/quiz-submit-autosave-flush.test.ts`):**
     - Test 11: Chứng minh submit phải chờ in-flight autosave hoàn tất trước khi gọi API submit (trật tự thực thi: `submit_requested` -> `autosave_finished` -> `submit_api_called`).
     - Test 12: Chứng minh nếu autosave thất bại, submit bị hủy ngay lập tức, ném lỗi và hoàn toàn **KHÔNG** gọi API submit.

---

### 2.3. B03 — PostgreSQL Atomic Rollback Integration Test (Fault Injection)
- **Kịch bản kiểm thử (Test 14 trong `quiz-submit.integration.spec.ts`):**
  1. Sinh viên bắt đầu bài thi và trả lời câu hỏi hợp lệ.
  2. Dùng `$executeRawUnsafe` cắm một trigger PostgreSQL kiểm soát sự cố (`trg_test_fail_claim`) trên bảng `quiz_xp_claims`:
     ```sql
     CREATE OR REPLACE FUNCTION fail_test_claim_insert() RETURNS TRIGGER AS $$
     BEGIN
       RAISE EXCEPTION 'CONTROLLED_POSTGRESQL_TRIGGER_ROLLBACK_TEST';
     END;
     $$ LANGUAGE plpgsql;
     ```
  3. Gửi request submit qua API -> Máy chủ gặp lỗi khi tạo XP claim và trả về HTTP 500 Internal Server Error.
  4. **Xác minh tính nguyên tử (Atomic Rollback) trên PostgreSQL thực tế:**
     - Trạng thái lượt thi `QuizConfigAttempt` trong DB được rollback nguyên vẹn: `status = 'IN_PROGRESS'`, `submittedAt = null`, `scorePercent = null`, `awardedXp = null`.
     - Số lượng bản ghi trong `quiz_xp_claims`: chính xác bằng 0.
     - Số lượng bản ghi trong `xp_ledger`: chính xác bằng 0.
  5. Khôi phục DB an toàn trong khối `finally` (`DROP TRIGGER`, `DROP FUNCTION`).

---

### 2.4. B04 — Submit / Autosave Race Integration Test & Tính Bất Biến Sau Submit
- **Kịch bản kiểm thử (Test 15 trong `quiz-submit.integration.spec.ts`):**
  1. Sinh viên bắt đầu bài thi và lưu đáp án câu 1 là Option 0 (đáp án đúng) qua API `/progress`.
  2. Nộp bài thi qua API `/submit` -> Trạng thái chuyển sang `SUBMITTED`.
  3. Giả lập một request autosave trễ (late autosave) hoặc payload can thiệp cố tình gửi lên sau khi bài thi đã được submit nhằm đổi đáp án câu 1 thành Option 3.
  4. **Kết quả kiểm chứng:**
     - Endpoint `/progress` trả về ngay HTTP 400 Bad Request với thông báo: *"Lượt thi đã kết thúc hoặc không còn hiệu lực làm bài"*.
     - Truy vấn trực tiếp PostgreSQL bảng `quiz_config_attempt_answers`: Đáp án `selectedOptionIndex` trong cơ sở dữ liệu giữ nguyên giá trị 0 ban đầu, bất biến 100%, không bị ghi đè.

---

## 3. KẾT QUẢ KIỂM THỬ TÍCH HỢP POSTGRESQL (100% PASS)

### 3.1. Bộ test M7.4 (`quiz-submit.integration.spec.ts`) — 15/15 KỊCH BẢN THỰC TẾ
```
PASS test/integration/quiz-submit.integration.spec.ts (57.6 s)
  Quiz Submission, Scoring & XP Integration Suite (M7.4)
    √ Test 1 [Auth & Role]: Rejects unauthenticated request (401) and non-student role (403) (22 ms)
    √ Test 2 [Ownership & IDOR Protection]: Student B cannot submit Student A's attempt (403) (69 ms)
    √ Test 3 [Expiry & Status Guard]: Rejects expired attempt (400) and updates DB status to EXPIRED (83 ms)
    √ Test 4 [Perfect Score & First XP]: Scores 100%, passes quiz, awards base + bonus XP, and creates XpLedger (154 ms)
    √ Test 5 [B01 Zero-XP Claim & Retake]: First attempt with 0 points consumes claim with 0 XP; Retake with 100% still receives 0 XP (278 ms)
    √ Test 6 [Boundary & Rounding]: 2/3 correct rounds to 67%, below 70% threshold -> FAIL, awards 20 base XP and 0 bonus XP (209 ms)
    √ Test 7 [Shuffle Mapping]: Correctly scores question when option order is shuffled (255 ms)
    √ Test 8 [One-Time XP]: Retake attempt is scored and saved as SUBMITTED, but awards 0 XP (166 ms)
    √ Test 9 [Idempotency]: Submitting an already SUBMITTED attempt returns saved result with HTTP 200 without creating extra XP (94 ms)
    √ Test 10 [Concurrency Same Attempt]: 10 concurrent submits on same attempt all succeed without duplicate ledger records (628 ms)
    √ Test 11 [Concurrency 2 Attempts Same Student]: Unique idempotency key ensures exactly ONE attempt receives XP (466 ms)
    √ Test 12 [Submit Lock Contention on Expiry]: Submit request waiting on lock past expiresAt is rejected with 400 and committed as EXPIRED (2698 ms)
    √ Test 13 [Zero Leakage & Tamper Resistance]: Ignores client payload attempting to inject score/answers (141 ms)
    √ Test 14 [B03 Atomic Rollback]: DB transaction rollback preserves IN_PROGRESS state and creates 0 XP claims/ledgers upon failure (182 ms)
    √ Test 15 [B04 Submit/Autosave Race]: Late autosave after SUBMITTED is rejected (400) and answers remain immutable in PostgreSQL (135 ms)

Test Suites: 1 passed, 1 total
Tests:       15 passed, 15 total
Snapshots:   0 total
Time:        57.603 s
```

### 3.2. Toàn bộ 4 bộ test hồi quy (Regression Suites) — 55/55 KỊCH BẢN PASS
1. **M7.3 Attempt Engine (`quiz-attempt.integration.spec.ts`):** 20/20 PASS (41.9s)
2. **M7.2 Delivery (`quiz-delivery.integration.spec.ts`):** 10/10 PASS (33.8s)
3. **M7.1 Configuration (`quiz-config.integration.spec.ts`):** 13/13 PASS (33.8s)
4. **M6 Question Bank (`question-bank.integration.spec.ts`):** 12/12 PASS (31.0s)

**Tổng cộng: 70/70 test tích hợp PostgreSQL chạy độc lập liên tục, 0 lỗi, 0 cảnh báo.**

---

## 4. TỔNG HỢP KIỂM TRA CHẤT LƯỢNG (QUALITY GATES)

| Lệnh Kiểm Tra | Kết Quả | Chi Tiết |
| :--- | :--- | :--- |
| `pnpm exec prisma validate` | **PASS** | Lược đồ hợp lệ 100%, quan hệ `quiz_xp_claims` chuẩn |
| `pnpm --filter shared build` | **PASS** | Biên dịch TypeScript exit code 0 |
| `pnpm --filter api typecheck` | **PASS** | 0 lỗi kiểu |
| `pnpm --filter web typecheck` | **PASS** | 0 lỗi kiểu |
| `pnpm --filter api lint` | **PASS** | 0 lỗi, 0 cảnh báo |
| `pnpm --filter web lint` | **PASS** | 0 lỗi, 0 cảnh báo |
| `pnpm --filter api test:unit` | **PASS** | 8 suites, 31 tests passed |
| `pnpm --filter web test:unit` | **PASS** | 12 tests passed (bao gồm 2 test flush autosave queue) |
| `pnpm --filter web build` | **PASS** | 28 route tĩnh và động biên dịch thành công (Turbopack) |

---

## 5. ĐỀ XUẤT CHO TECH LEAD (MENTOR GPT)
- **Đánh giá và cấp thẩm quyền:** Đề nghị Tech Lead nghiệm thu **FULL PASS** cho **Milestone M7.4 (Quiz Submission, Scoring & XP)** sau đợt Targeted Remediation (B01–B04) triệt để này.
- **Kế hoạch tiếp theo:** Sau khi Tech Lead phê duyệt chính thức M7.4, sẵn sàng nhận chỉ đạo để bước vào Milestone **M7.5 (Quiz Results & History Review Dashboard)**.
