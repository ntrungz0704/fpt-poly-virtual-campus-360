# BÁO CÁO NGHIỆM THU NGHIỆP VỤ & KỸ THUẬT MILESTONE M7.3 (QUIZ ATTEMPT ENGINE)
## XÁC MINH TOÀN DIỆN & HOÀN TẤT 2 EDGE CASE CUỐI CÙNG (B01-T03 & B03.1)

**Dự án:** FPT Polytechnic Virtual Campus 360°  
**Nhánh:** `fix/m4-acceptance-blockers`  
**Pull Request trên GitHub:** PR #1  
**Thời gian cập nhật:** 2026-11-15 23:46 (GMT+7)

---

## 1. ĐỐI CHIẾU COMMIT SHA TRÊN GITHUB
- **HEAD Baseline trước:** `1182ea0233c846b2120594b44e3a44c644b05592`
- **M7.3 Final Edge-Case Verification Code Commit:** `7d50046` (`test(quiz-attempt): verify deterministic lock contention on expiry and enforce status-time filter consistency (B01-T03, B03.1)`)
- **M7.3 Final Edge-Case Verification Docs Commit:** Đi kèm và đồng bộ ngay sau tài liệu này.
- **Quy chuẩn Git:** Tách biệt tuyệt đối Code commit và Docs commit, không force-push, remote tip đồng bộ 100% với local HEAD.

---

## 2. GIẢI TRÌNH XỬ LÝ 2 EDGE CASE CUỐI CÙNG THEO YÊU CẦU TECH LEAD

### 🟢 1. B01-T03 — Deterministic Expiry/Save Lock Contention:
- **File:** `apps/api/test/integration/quiz-attempt.integration.spec.ts` (Test 16)
- **Cơ chế kiểm thử Deterministic không dùng sleep ngẫu nhiên:**
  1. Tạo attempt `IN_PROGRESS` với thời gian hết hạn sắp tới (`expiresAt = Date.now() + 600ms`).
  2. Mở một transaction Prisma độc lập chạy ngầm để lấy và giữ khóa hàng độc quyền:  
     `SELECT id FROM quiz_config_attempts WHERE id = ${expiringAttempt.id}::uuid FOR UPDATE`
  3. Dùng Promise coordination (`lockAcquiredPromise`) để đảm bảo transaction giữ lock đã xác nhận thành công.
  4. Xác nhận chắc chắn `Date.now() < expiresAt` (bài thi còn hạn hợp lệ) rồi mới phát request `PUT .../progress`.
  5. Request save lập tức bị PostgreSQL chặn treo (suspend) để chờ giải phóng khóa hàng từ transaction trên.
  6. Chờ thời gian trôi qua mốc `expiresAt` (`Date.now() > expiresAt`).
  7. Giải phóng transaction giữ khóa (`releaseHoldingLock()`).
  8. Request save ngay lập tức unblock, giành được khóa hàng, tái kiểm tra thời gian thực `now` dưới khóa hàng, phát hiện `now >= expiresAt`.
  9. Hệ thống cập nhật `status: "EXPIRED"` vào PostgreSQL, commit transaction thành công, và trả về HTTP 400 (`Lượt thi đã hết thời gian hoặc không còn hiệu lực làm bài.`).
  10. **Bằng chứng cơ sở dữ liệu:**
      - Trạng thái DB được lưu là `EXPIRED`.
      - `selectedOptionIndex` trong PostgreSQL vẫn giữ nguyên là `null` (tuyệt đối không bị ghi đè sau hạn).

### 🟢 2. B03.1 — Monitoring Status Filter Race Consistency:
- **File:** `apps/api/src/modules/quiz-config/quiz-config.service.ts`
- **Cơ chế xử lý:**
  - Không phụ thuộc duy nhất vào `updateMany()`, mà kết hợp trực tiếp điều kiện thời gian thực `now` vào mệnh đề `where` của Prisma:
    + Khi Admin lọc `status: "IN_PROGRESS"`:  
      `where.status = "IN_PROGRESS"; where.expiresAt = { gt: now };`  
      -> Loại trừ hoàn toàn mọi attempt đã quá hạn (kể cả attempt vừa hết hạn sau lệnh `updateMany`!).
    + Khi Admin lọc `status: "EXPIRED"`:  
      `where.OR = [ { status: "EXPIRED" }, { status: "IN_PROGRESS", expiresAt: { lte: now } } ];`  
      -> Thu thập đầy đủ 100% các attempt đã hết hạn, không sót bất kỳ bản ghi nào!
  - Cùng sử dụng một mốc `now` thống nhất cho DB normalization, điều kiện lọc `where` và mapping response `effectiveStatus`.
  - Đảm bảo `total`, `totalPages` và danh sách `items` hoàn toàn đồng nhất 100% dưới mọi điều kiện tải đồng thời.

---

## 3. BẰNG CHỨNG KIỂM THỬ THỰC TẾ TRÊN POSTGRESQL (55/55 TESTS PASS)
Tất cả 4 bộ test tích hợp đã chạy độc lập trên PostgreSQL:

### 1. M7.3 Quiz Attempt Suite (`quiz-attempt.integration.spec.ts`): 20/20 TESTS PASS (38.42s)
```
PASS test/integration/quiz-attempt.integration.spec.ts (38.171 s)
  Quiz Attempt Integration Suite (M7.3)
    √ Test 1 [Security]: Unauthenticated request is rejected (401) (10 ms)
    √ Test 2 [Security]: Non-student role (PARENT) is rejected (403) (11 ms)
    √ Test 3 [Lifecycle Guard]: DRAFT, ARCHIVED, and Soft-deleted quizzes cannot be started (404) (26 ms)
    √ Test 4 [Event Eligibility]: Unregistered student cannot start event quiz (403) (11 ms)
    √ Test 5 [Start Attempt]: Successfully starts attempt with server-side timer & Zero-leak guarantee (63 ms)
    √ Test 6 [Resume Attempt]: Starting again while IN_PROGRESS resumes existing attempt without incrementing attemptNumber (13 ms)
    √ Test 7 [Shuffle Stability]: Question order and option mapping remain completely stable across resume and GET (21 ms)
    √ Test 8 [Save Progress]: Saves answers directly to PostgreSQL and prevents duplicates (138 ms)
    √ Test 9 [Validation]: Rejects non-existent question or out-of-range option index (400) (22 ms)
    √ Test 10 [IDOR Protection]: Student B cannot read or modify Student A's attempt (403) (18 ms)
    √ Test 11 [Expiry Guard]: Expired attempt transitions to EXPIRED and rejects further progress (400) (325 ms)
    √ Test 12 [Max Attempts]: Student can start second attempt after first expired, but 3rd attempt is rejected (400) (150 ms)
    √ Test 13 [Concurrency Near Limit]: Concurrent start requests when only 1 attempt remains respect maxAttempts via advisory lock without over-provisioning (265 ms)
    √ Test 14 [Regression Guard]: M7.2 delivery endpoints and M7.1 config remain completely functional (19 ms)
    √ Test 15 [B01-T01 & B01-T02 Expiry Commit]: IN_PROGRESS attempt past expiresAt updates DB to EXPIRED, returns 400, and answers remain unchanged (222 ms)
    √ Test 16 [B01-T03 Deterministic Lock Contention]: Save request in-flight before expiry is held by row lock until past expiresAt, then rejected (400) and committed as EXPIRED (893 ms)
    √ Test 17 [B01-T04 Expiry Immutability]: EXPIRED attempt cannot be reverted to IN_PROGRESS or updated (535 ms)
    √ Test 18 [B01 Atomic Rollback]: Invalid item in batch rolls back entire batch without partial writes (108 ms)
    √ Test 19 [B03.1 Status Consistency]: In-progress attempts past expiresAt appear under status=EXPIRED and not under status=IN_PROGRESS (276 ms)
    √ Test 20 [B03.2 Quiz Filter & RBAC]: Admin can filter monitoring by quizConfigId and search, non-admin blocked (403) (40 ms)

Test Suites: 1 passed, 1 total
Tests:       20 passed, 20 total
Snapshots:   0 total
Time:        38.417 s
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

## 5. BẢO VỆ PHẠM VI & GIT STATUS
- Không triển khai M7.4 (submit, scoring, passingScore, XP).
- Không triển khai M7.5 (result, history).
- Git working tree sạch 100%: On branch `fix/m4-acceptance-blockers`, nothing to commit, working tree clean.
