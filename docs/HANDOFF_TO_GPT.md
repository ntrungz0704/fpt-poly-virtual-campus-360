# BÁO CÁO KỸ THUẬT HANDOFF — M7.1 FINAL REMEDIATION (ROUND 2): ATOMIC PUBLISHED IMMUTABILITY & CONCURRENCY TESTS (B01-RACE)

**Dự án:** FPT Polytechnic Virtual Campus 360°  
**Nhánh:** `fix/m4-acceptance-blockers`  
**Pull Request trên GitHub:** PR #1  
**Thời gian hoàn tất:** 2026-11-15 20:56 (GMT+7)

---

## 1. ĐỐI CHIẾU COMMIT SHA CHÍNH XÁC (FULL SHA TỪ GITHUB)
- **M6 Final Closure Code Commit:** `6bbd3997e2c3e9d3fcbf8d2cadc1df2c0dfa0494`
- **M6 Final Closure Docs Commit (Verified):** `e81413b35fb0d616d866cf2c8b5318a02a0caab4`
- **M7.1 Base Feature Code Commit:** `34125f4baec1ac6e6a90c0a5e6b9a20250678a5a`
- **M7.1 Base Docs Commit:** `d548f0cb3d5aa0bcd78f7144938e068daf7582c3`
- **M7.1 Remediation Round 1 Code Commit (B01, B02, B03):** `146041c7c517c6091960f3c9f2dca346d6cd665a`
- **M7.1 Remediation Round 1 Docs Commit:** `aa872fe64ddd39c9549028ae0e875dd59be1e280`
- **M7.1 Final Remediation Round 2 Code Commit (B01-RACE):** `c6dc56e0ff2e11eb30d3bc09bda4825dac0145ce` (`fix(quiz-config): enforce atomic conditional transactions for published immutability and add concurrency tests (B01-RACE)`)
- **M7.1 Final Remediation Round 2 Docs Commit:** Đi kèm và đồng bộ trực tiếp trên nhánh `fix/m4-acceptance-blockers` ngay sau code commit `c6dc56e0ff2e11eb30d3bc09bda4825dac0145ce`.
- **Quy chuẩn Git:** Tuân thủ 100% nguyên tắc tách biệt Code commit và Docs commit, không force-push, remote tip đồng bộ tuyệt đối với local HEAD.

---

## 2. GIẢI TRÌNH NGUYÊN NHÂN GỐC RỄ & GIẢI PHÁP TÍNH NGUYÊN TỬ (ATOMICITY) CHO B01-RACE

### 🔴 Nguyên nhân gốc rễ Race Condition (Root Cause Analysis):
Ở vòng remediation trước, việc kiểm tra trạng thái (`if (existing.status !== "DRAFT")`) được thực hiện bằng `findFirst()` ở ngoài transaction. Sau đó mới mở `$transaction` và chạy `update({ where: { id } })`.
Kịch bản cạnh tranh dữ liệu (Race Condition) có thể xảy ra:
- **Request A (PATCH config):** Đọc được `status = DRAFT`, vượt qua kiểm tra điều kiện.
- **Request B (Publish config):** Xuất bản thành công, chuyển trạng thái cấu hình sang `PUBLISHED` và commit vào PostgreSQL.
- **Request A:** Bắt đầu transaction và thực thi lệnh `update({ where: { id } })` vô điều kiện trạng thái -> **Vô tình ghi đè metadata lên bài thi đã xuất bản!**

Tương tự với `manageQuestions()`: việc kiểm tra trạng thái nằm ngoài và không có cơ chế khóa nguyên tử kết hợp kiểm tra trạng thái bên trong `$transaction`.

### 🟢 Giải pháp Tính Nguyên Tử Toàn Diện (Atomic Conditional Transaction):
Tại `apps/api/src/modules/quiz-config/quiz-config.service.ts`:
1. **Trong `updateConfiguration()`:**
   - Đưa toàn bộ việc kiểm tra và cập nhật vào bên trong `prisma.$transaction`.
   - Sử dụng lệnh cập nhật có điều kiện nguyên tử ở mức hàng cơ sở dữ liệu:
     ```ts
     const updateResult = await tx.quizConfiguration.updateMany({
       where: { id, status: "DRAFT", deletedAt: null },
       data: { ... },
     });
     ```
   - Trong PostgreSQL, `UPDATE ... WHERE id = ... AND status = 'DRAFT'` chiếm giữ khóa độc quyền hàng (exclusive row lock).
   - Nếu bản ghi đã bị chuyển sang `PUBLISHED` hoặc `ARCHIVED` bởi một request đồng thời, `updateResult.count === 0`. Hệ thống lập tức ném `BadRequestException(400)` và rollback toàn bộ transaction: không một byte dữ liệu nào bị thay đổi và không có bản ghi `AuditLog` nào được tạo!
2. **Trong `manageQuestions()`:**
   - Thực hiện khóa điều kiện nguyên tử bên trong transaction:
     ```ts
     const touchResult = await tx.quizConfiguration.updateMany({
       where: { id, status: "DRAFT", deletedAt: null },
       data: { updatedById: user.id },
     });
     ```
   - Nếu cấu hình không còn là `DRAFT`, `touchResult.count === 0` -> Ném `BadRequestException(400)` và rollback, ngăn chặn tuyệt đối việc xóa hoặc tạo lại câu hỏi snapshot cho bài thi đã xuất bản.
3. **Trong `publishConfiguration()`:**
   - Thực hiện kiểm tra câu hỏi và cập nhật có điều kiện trạng thái `status: "DRAFT"` nguyên tử bên trong transaction:
     ```ts
     const publishResult = await tx.quizConfiguration.updateMany({
       where: { id, status: "DRAFT", deletedAt: null },
       data: { status: "PUBLISHED", publishedAt: new Date(), updatedById: user.id },
     });
     ```
   - Đảm bảo tính tuần tự hóa (Serializable / Atomic): Hai request publish cùng lúc hay PATCH đồng thời chỉ một nhánh hợp lệ duy nhất được phép ghi nhận.

---

## 3. THIẾT KẾ & KẾT QUẢ CÁC BÀI TEST ĐỒNG THỜI (CONCURRENCY REGRESSION TESTS)

File: `apps/api/test/integration/quiz-config.integration.spec.ts`

### 1. Test 12 [Atomic Concurrency: Concurrent PATCH vs Publish]
- **Thiết kế:** Tạo bài thi ở trạng thái DRAFT. Kích hoạt đồng thời 2 request song song qua `Promise.all([PATCH, Publish])`.
- **Kết quả thực tế:**
  - Database PostgreSQL cuối cùng luôn đảm bảo trạng thái `PUBLISHED`.
  - Nếu PATCH commit trước, publish sẽ đóng gói giá trị mới; nếu Publish commit trước, PATCH bị từ chối với HTTP 400 Bad Request và giá trị trong DB giữ nguyên giá trị ban đầu.
  - Tuyệt đối không có trường hợp metadata bị ghi đè sau khi bài thi đã commit `PUBLISHED`.
  - Request PATCH tiếp theo bị từ chối 100% với HTTP 400.

### 2. Test 13 [Atomic Concurrency: Concurrent manageQuestions vs Publish]
- **Thiết kế:** Tạo bài thi DRAFT có sẵn câu hỏi 1. Kích hoạt song song `Promise.all([manageQuestions(câu hỏi 2), Publish])`.
- **Kết quả thực tế:**
  - Database PostgreSQL cuối cùng luôn đảm bảo trạng thái `PUBLISHED`.
  - Danh sách câu hỏi snapshot trong DB được bảo toàn toàn vẹn: hoặc câu hỏi 2 được snapshot trước khi publish, hoặc publish hoàn tất trước và request manageQuestions nhận 400 với snapshot câu hỏi 1 giữ nguyên 100%.
  - Mọi request manageQuestions sau khi bài thi xuất bản bị từ chối 100% với HTTP 400.

---

## 4. KẾT QUẢ QUALITY GATES & BẰNG CHỨNG KIỂM THỬ THỰC TẾ (100% PASS)

| Hạng mục kiểm tra | Lệnh thực thi | Exit Code | Kết quả thực tế |
| :--- | :--- | :---: | :--- |
| **Quiz Config Integration Tests (M7.1)** | `jest --runInBand test/integration/quiz-config.integration.spec.ts` | **0** | **13/13 tests PASS (28.37s)** trên scratch PostgreSQL thật |
| **Question Bank Regression Tests (M6)** | `jest --runInBand test/integration/question-bank.integration.spec.ts` | **0** | **12/12 tests PASS (27.65s)** trên scratch PostgreSQL thật |
| **Shared Package Build** | `pnpm --filter shared build` | **0** | **100% compile contracts** (`tsc`) |
| **API Typecheck** | `pnpm --filter api typecheck` | **0** | **0 errors** (`tsc --noEmit`) |
| **Web Typecheck** | `pnpm --filter web typecheck` | **0** | **0 errors** (`tsc --noEmit`) |
| **API Lint** | `pnpm --filter api lint` | **0** | **0 errors, 0 warnings** (`eslint`) |
| **Web Lint** | `pnpm --filter web lint` | **0** | **0 errors, 0 warnings** (`eslint`) |
| **API Unit Tests** | `pnpm --filter api test:unit` | **0** | **8 suites, 31 tests PASS (6.42s)** |
| **Web Unit Tests** | `pnpm --filter web test:unit` | **0** | **10 tests PASS (154ms)** |
| **Next.js Production Build** | `pnpm --filter web build` | **0** | **27 routes compiled** (`next build`), tối ưu thành công |

### Danh sách 13 kịch bản Quiz Configuration Integration Test:
1. `Test 1 [RBAC]`: Student và TOUR_EDITOR bị chặn 403 Forbidden.
2. `Test 2 [Validation]`: Chặn tiêu đề ngắn, eventId sai, câu hỏi trùng hoặc chưa duyệt (400 Bad Request).
3. `Test 3 [CRUD]`: Tạo cấu hình, sao chép snapshot câu hỏi duyệt, lưu PostgreSQL và ghi AuditLog.
4. `Test 4 [Get & Update]`: Đọc chi tiết bài thi và cập nhật thông số bài thi DRAFT thành công.
5. `Test 5 [Manage Questions]`: Sắp xếp thứ tự, cập nhật snapshot, từ chối câu hỏi chưa duyệt.
6. `Test 6 [Publish]`: Chặn bài thi 0 câu hỏi, xuất bản bài thi hợp lệ và chuyển trạng thái PUBLISHED.
7. `Test 7 [Snapshot Immutability]`: Sửa đổi hoặc xóa mềm QuestionBankItem gốc KHÔNG ảnh hưởng snapshot đã xuất bản.
8. `Test 8 [Archive & Delete]`: Đưa bài thi vào trạng thái lưu trữ ARCHIVED, xóa mềm và loại trừ khỏi danh sách hoạt động.
9. `Test 9 [Regression Guard]`: Giữ nguyên vẹn 100% các câu hỏi bài thi Open Day hiện hành (OpenDayQuizItem).
10. `Test 10 [Configuration Immutability (B01)]`: PUBLISHED và ARCHIVED từ chối triệt để request PATCH và PUT questions (400), PostgreSQL giữ nguyên vẹn thông số, không ghi AuditLog giả mạo.
11. `Test 11 [Unified Defaults (B02)]`: Khởi tạo khi bỏ trống trường tùy chọn tự động nhận maxAttempts=3, isShuffleQuestions=true, isShuffleOptions=true khớp 100% giữa API, Service, PostgreSQL và UI.
12. `Test 12 [Atomic Concurrency (B01-RACE)]`: Concurrent PATCH vs Publish không thể ghi đè metadata lên bài thi đã xuất bản.
13. `Test 13 [Atomic Concurrency (B01-RACE)]`: Concurrent manageQuestions vs Publish không thể thay đổi snapshot câu hỏi sau khi xuất bản.

---

## 5. BẢNG ĐỐI CHIẾU TIẾN ĐỘ 9 MODULE (STANDARDIZED EVIDENCE MATRIX)

| Module | Route Admin | Route Người dùng | API Endpoint | Bảng DB (PostgreSQL) | Bằng chứng Kiểm thử Thực tế | Trạng thái Nghiệm thu |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **M1: User & Excel Import** | `/admin/users` | `/login`, `/change-password` | `/api/v1/admin/users/import`, `/api/v1/auth/login` | `users`, `user_import_batches`, `audit_logs` | Integration test `users-admin-crud.integration.spec.ts` (PASS), Unit test auth | **FULL PASS** *(đã nghiệm thu)* |
| **M2: Media Library** | `/admin/media` | CDN / Tour 360° nhúng | `/api/v1/admin/media`, `/api/v1/storage/upload` | `media_assets`, `upload_tokens`, `audit_logs` | 15/15 Integration tests PASS | **FULL PASS** *(đã nghiệm thu)* |
| **M3: Tour Studio 360°** | `/admin/virtual-tour` | `/campus` (Viewer 360°) | `/api/v1/admin/tour/nodes`, `/api/v1/public/tour` | `tour_nodes`, `tour_edges`, `hotspots`, `audit_logs` | Integration test `tour-studio-persistence.integration.spec.ts` (PASS) | **FULL PASS** *(đã nghiệm thu)* |
| **M4: GIS & Locations** | `/admin/locations` | `/map`, `/locations` | `/api/v1/admin/locations`, `/api/v1/public/locations` | `locations`, `buildings`, `floors`, `location_types`, `audit_logs` | 13/13 Integration tests `location-gis-crud.integration.spec.ts` (PASS) | **FULL PASS** *(đã nghiệm thu)* |
| **M5: Content CMS (News)** | `/admin/news` | `/news`, `/news/[slug]` | `/api/v1/admin/news`, `/api/v1/public/news` | `news_articles`, `media_assets`, `users`, `audit_logs` | 16/16 Integration tests PASS | **FULL PASS** *(đã nghiệm thu)* |
| **M6: Question Bank** | `/admin/questions` | Ngân hàng câu hỏi trắc nghiệm | `/api/v1/admin/questions` | `question_bank_items`, `users`, `audit_logs` | 12/12 Integration tests PASS: strict enum, trust boundary | **FULL PASS** *(đã nghiệm thu)* |
| **M7.1: Quiz Configuration** | `/admin/events` (Cấu hình Bài thi) | Bộ đề thi chuẩn hóa | `/api/v1/admin/quiz-configs` | `quiz_configurations`, `quiz_config_questions`, `audit_logs` | **13/13 Integration tests PASS (28.37s)** trên PostgreSQL, B01-RACE đã xử lý triệt để bằng atomic conditional transaction | **HOÀN TẤT REMEDIATION — SẴN SÀNG FULL PASS** |
| **M7.2: Quiz Delivery** | `/admin/events` | `/portal/quiz` (Phát đề thi) | `/api/v1/portal/quiz/active` | `quiz_configurations`, `quiz_config_questions` | Chờ Tech Lead nghiệm thu M7.1 | **PENDING (Kế tiếp)** |
| **M7.3: Quiz Attempt** | Giám sát phòng thi | `/portal/quiz/:attemptId` | `/api/v1/portal/quiz/start`, `/api/v1/portal/quiz/save-progress` | `quiz_attempts`, `quiz_attempt_answers` | Chờ M7.2 hoàn tất | **PENDING** |
| **M7.4: Scoring & XP** | Thống kê điểm thi | Chấm điểm tự động & Nhận XP | `/api/v1/portal/quiz/submit` | `quiz_attempts`, `xp_ledgers` | Chờ M7.3 hoàn tất | **PENDING** |
| **M7.5: Results & Recovery** | Báo cáo chi tiết | Xem lại kết quả & Giải thích | `/api/v1/portal/quiz/:attemptId/results` | `quiz_attempts` | Chờ M7.4 hoàn tất | **PENDING** |
| **M8: Event & QR Check-in** | `/admin/events` (Tickets tab) | `/events` (Nhận vé OD26) | `/api/v1/open-day/register`, `/api/v1/admin/events/checkin` | `open_day_events`, `open_day_sessions`, `event_participations` | Unit test định dạng vé chuẩn OD26 & QR verify (PASS) | **PARTIAL** |
| **M9: Student & Parent Portal** | Quản trị hồ sơ & vé | `/portal`, `/parent` | `/api/v1/portal/profile`, `/api/v1/portal/tickets` | `users`, `parent_student_links`, `event_participations` | Unit test phân luồng định tuyến và bảo vệ route (PASS) | **PARTIAL** |

---

## 6. BẢO CHỨNG PHẠM VI (SCOPE GUARD)
- Tuyệt đối chỉ khắc phục B01-RACE theo đúng chỉ đạo.
- Không triển khai trước M7.2–M7.5.
- Không thay đổi các module M1–M6 đã nghiệm thu.
- Giữ nguyên vẹn 100% tính năng OpenDayQuizItem cũ.
- Sẵn sàng kích hoạt M7.2 (Quiz Delivery) ngay khi Tech Lead ký nghiệm thu FULL PASS!
