# BÁO CÁO NGHIỆM THU NGHIỆP VỤ & KỸ THUẬT MILESTONE M7.3 (QUIZ ATTEMPT ENGINE)
## HOÀN TẤT KIỂM CHỨNG BLOCKER CUỐI CÙNG (B01-T03: ROW LOCK CONTENTION TRÊN POSTGRESQL)

**Dự án:** FPT Polytechnic Virtual Campus 360°  
**Nhánh:** `fix/m4-acceptance-blockers`  
**Pull Request trên GitHub:** PR #1  
**Thời gian cập nhật:** 2026-11-16 00:10 (GMT+7)

---

## 1. ĐỐI CHIẾU COMMIT SHA TRÊN GITHUB
- **HEAD Baseline trước:** `90aa6d82d6f0b75001fd03df7c6afc6138b2a6d3`
- **M7.3 Final Fix B01-T03 Code Commit:** `c31b9d4` (`test(quiz-attempt): verify supertest actively waits on postgresql row lock before expiry (B01-T03)`)
- **M7.3 Final Fix B01-T03 Docs Commit:** Đi kèm và đồng bộ ngay sau tài liệu này.
- **Quy chuẩn Git:** Tách biệt tuyệt đối Code commit và Docs commit, không force-push, remote tip đồng bộ 100% với local HEAD.

---

## 2. GIẢI TRÌNH XỬ LÝ BLOCKER CUỐI CÙNG THEO YÊU CẦU TECH LEAD

### 🟢 B01-T03 — Supertest Request Actively Waits on PostgreSQL Row Lock Before Expiry
- **File:** `apps/api/test/integration/quiz-attempt.integration.spec.ts` (Test 16)
- **Vấn đề đã khắc phục:**
  Trước đó, `saveRequestPromise = request(server).put(...).send(...)` chỉ tạo đối tượng Supertest `Test`. Supertest chỉ thực thi HTTP request khi được `await` hoặc gọi `.then()`. Do đó, nếu chỉ `await` sau khi đã giải phóng lock thì request thực tế mới bắt đầu sau khi attempt hết hạn và sau khi lock đã nhả.
- **Trình tự kiểm chứng thực tế 3 giai đoạn chặt chẽ (100% Deterministic & Zero-Mock):**
  1. **Giai đoạn 1 (Thiết lập khóa hàng & Kiểm tra hạn):**
     - Tạo attempt `IN_PROGRESS` với thời gian hết hạn `expiresAt = Date.now() + 1200ms`.
     - Transaction Prisma độc lập chạy ngầm thực thi `$queryRaw`:
       `SELECT id FROM quiz_config_attempts WHERE id = ${expiringAttempt.id}::uuid FOR UPDATE`
     - Dùng Promise coordination (`lockAcquiredPromise`) xác nhận transaction đã giữ khóa hàng độc quyền.
     - Xác nhận chắc chắn `Date.now() < expiresAt` (attempt còn hạn).
  2. **Giai đoạn 2 (Kích hoạt Supertest Request & Quan sát PostgreSQL pg_stat_activity):**
     - Kích hoạt Supertest request ngay lập tức bằng cách gọi `.then(...)`. Request được dispatch ngay qua HTTP tới NestJS API -> Service -> `prisma.$transaction`.
     - Trong khi request đang chạy ngầm, test tiến hành poll bảng hệ thống PostgreSQL `pg_stat_activity` với điều kiện:
       ```sql
       SELECT pid, wait_event_type, wait_event, query
       FROM pg_stat_activity
       WHERE wait_event_type = 'Lock'
         AND query ILIKE '%quiz_config_attempts%'
         AND query ILIKE '%FOR UPDATE%'
       ```
     - **Bằng chứng lock contention:**
       + `lockWaitingDetected == true`: Request thực sự đã vào PostgreSQL và đang bị chặn treo ở trạng thái `wait_event_type = 'Lock'`!
       + `requestCompleted == false`: Request chưa hoàn thành (đang bị suspend).
       + `Date.now() < expiresAt.getTime()`: Khẳng định thời điểm request bị block xảy ra **TRƯỚC KHI** lượt thi hết hạn!
  3. **Giai đoạn 3 (Chờ quá hạn, Nhả khóa & Xác nhận Immutability):**
     - Test chờ thời gian trôi qua mốc `expiresAt` (`Date.now() > expiresAt.getTime() + 100ms`).
     - Xác nhận `requestCompleted == false` (request vẫn kiên nhẫn chờ lock dưới PostgreSQL).
     - Giải phóng transaction giữ khóa (`releaseHoldingLock()`).
     - Request unblock, giành được row lock, tái kiểm tra `now >= expiresAt`, cập nhật DB sang `EXPIRED`, kết thúc transaction thành công và trả về HTTP 400 (`Lượt thi đã hết thời gian hoặc không còn hiệu lực làm bài.`).
     - **Bảo vệ toàn vẹn dữ liệu PostgreSQL:**
       + Trạng thái DB được lưu là `EXPIRED`.
       + `selectedOptionIndex` trong PostgreSQL vẫn giữ nguyên là `null` (tuyệt đối không bị ghi đè sau hạn).
     - **Khối finally an toàn:** Bọc toàn bộ trong `try ... finally` bảo đảm `releaseHoldingLock()` luôn được gọi, tránh mọi nguy cơ treo test suite.

---

## 3. BẰNG CHỨNG KIỂM THỬ THỰC TẾ TRÊN POSTGRESQL (55/55 TESTS PASS)
Tất cả 4 bộ test tích hợp đã chạy độc lập trên cơ sở dữ liệu PostgreSQL thực tế:

### 1. M7.3 Quiz Attempt Suite (`quiz-attempt.integration.spec.ts`): 20/20 TESTS PASS (34.54s)
```
PASS test/integration/quiz-attempt.integration.spec.ts (34.312 s)
  Quiz Attempt Integration Suite (M7.3)
    √ Test 1 [Security]: Unauthenticated request is rejected (401) (11 ms)
    √ Test 2 [Security]: Non-student role (PARENT) is rejected (403) (10 ms)
    √ Test 3 [Lifecycle Guard]: DRAFT, ARCHIVED, and Soft-deleted quizzes cannot be started (404) (23 ms)
    √ Test 4 [Event Eligibility]: Unregistered student cannot start event quiz (403) (10 ms)
    √ Test 5 [Start Attempt]: Successfully starts attempt with server-side timer & Zero-leak guarantee (65 ms)
    √ Test 6 [Resume Attempt]: Starting again while IN_PROGRESS resumes existing attempt without incrementing attemptNumber (13 ms)
    √ Test 7 [Shuffle Stability]: Question order and option mapping remain completely stable across resume and GET (19 ms)
    √ Test 8 [Save Progress]: Saves answers directly to PostgreSQL and prevents duplicates (106 ms)
    √ Test 9 [Validation]: Rejects non-existent question or out-of-range option index (400) (20 ms)
    √ Test 10 [IDOR Protection]: Student B cannot read or modify Student A's attempt (403) (16 ms)
    √ Test 11 [Expiry Guard]: Expired attempt transitions to EXPIRED and rejects further progress (400) (151 ms)
    √ Test 12 [Max Attempts]: Student can start second attempt after first expired, but 3rd attempt is rejected (400) (112 ms)
    √ Test 13 [Concurrency Near Limit]: Concurrent start requests when only 1 attempt remains respect maxAttempts via advisory lock without over-provisioning (245 ms)
    √ Test 14 [Regression Guard]: M7.2 delivery endpoints and M7.1 config remain completely functional (16 ms)
    √ Test 15 [B01-T01 & B01-T02 Expiry Commit]: IN_PROGRESS attempt past expiresAt updates DB to EXPIRED, returns 400, and answers remain unchanged (157 ms)
    √ Test 16 [B01-T03 Deterministic Lock Contention]: Save request in-flight before expiry is held by row lock until past expiresAt, then rejected (400) and committed as EXPIRED (1408 ms)
    √ Test 17 [B01-T04 Expiry Immutability]: EXPIRED attempt cannot be reverted to IN_PROGRESS or updated (325 ms)
    √ Test 18 [B01 Atomic Rollback]: Invalid item in batch rolls back entire batch without partial writes (145 ms)
    √ Test 19 [B03.1 Status Consistency]: In-progress attempts past expiresAt appear under status=EXPIRED and not under status=IN_PROGRESS (108 ms)
    √ Test 20 [B03.2 Quiz Filter & RBAC]: Admin can filter monitoring by quizConfigId and search, non-admin blocked (403) (32 ms)

Test Suites: 1 passed, 1 total
Tests:       20 passed, 20 total
Snapshots:   0 total
Time:        34.539 s
```

### 2. M7.2 Quiz Delivery Suite (`quiz-delivery.integration.spec.ts`): 10/10 TESTS PASS (32.84s)
### 3. M7.1 Quiz Configuration Suite (`quiz-config.integration.spec.ts`): 13/13 TESTS PASS (30.20s)
### 4. M6 Question Bank Suite (`question-bank.integration.spec.ts`): 12/12 TESTS PASS (30.99s)

**Tổng cộng:** 55/55 tests PASS tuyệt đối trên cơ sở dữ liệu PostgreSQL thực tế (0 mock).

---

## 4. KẾT QUẢ QUALITY GATES DỰ ÁN
- **Prisma Schema:** `pnpm exec prisma validate` -> Valid 100%.
- **Shared Package Build:** `pnpm --filter shared build` -> Exit code 0.
- **API Typecheck:** `pnpm --filter api typecheck` -> Exit code 0 (0 errors).
- **Web Typecheck:** `pnpm --filter web typecheck` -> Exit code 0 (0 errors).
- **API Lint:** `pnpm --filter api lint` -> Exit code 0 (0 errors, 0 warnings).
- **Web Lint:** `pnpm --filter web lint` -> Exit code 0 (0 errors, 0 warnings).
- **API Unit Tests:** `pnpm --filter api test:unit` -> 8 suites, 31 tests PASS (4.78s).
- **Web Unit Tests:** `pnpm --filter web test:unit` -> 10 tests PASS (122ms).
- **Web Production Build:** `pnpm --filter web build` -> 28 static/dynamic routes compiled successfully.

---

## 5. BẢO VỆ PHẠM VI & GIT STATUS
- Không triển khai M7.4 (submit, scoring, passingScore, XP).
- Không triển khai M7.5 (result, history).
- Giữ nguyên các migration cũ và legacy Open Day Quiz.
- Git working tree sạch 100%: On branch `fix/m4-acceptance-blockers`, nothing to commit, working tree clean.
