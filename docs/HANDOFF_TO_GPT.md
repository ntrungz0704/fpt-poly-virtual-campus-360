# BÁO CÁO KỸ THUẬT HANDOFF — M7.1 FINAL REMEDIATION: PUBLISHED CONFIGURATION IMMUTABILITY & UNIFIED DEFAULTS

**Dự án:** FPT Polytechnic Virtual Campus 360°  
**Nhánh:** `fix/m4-acceptance-blockers`  
**Pull Request trên GitHub:** PR #1  
**Thời gian hoàn tất:** 2026-11-15 20:43 (GMT+7)

---

## 1. ĐỐI CHIẾU COMMIT SHA CHÍNH XÁC (FULL SHA TỪ GITHUB)
- **M6 Base Feature Commit:** `773ecec3ef150a50b743112f336386a6ca6a9858`
- **M6 Base Docs Commit:** `2948069297e0405f184caf0cd1fd307d74ccc2ed`
- **M6 Remediation Round 1 Code Commit:** `6f9f001e85aa003d893153921eb331de1cb2d698`
- **M6 Remediation Round 1 Docs Commit:** `702fd9e82331fe45dd7a4eb0f7c0a8ac275f41e4`
- **M6 Final Closure Code Commit (Strict Enum):** `6bbd3997e2c3e9d3fcbf8d2cadc1df2c0dfa0494`
- **M6 Final Closure Docs Commit (Verified):** `e81413b35fb0d616d866cf2c8b5318a02a0caab4`
- **M7.1 Base Feature Code Commit:** `34125f4baec1ac6e6a90c0a5e6b9a20250678a5a`
- **M7.1 Base Docs Commit:** `d548f0cb3d5aa0bcd78f7144938e068daf7582c3`
- **M7.1 Remediation Code Commit (B01, B02, B03):** `146041c7c517c6091960f3c9f2dca346d6cd665a` (`fix(quiz-config): lock published configuration immutability, unify defaults, and add regression tests (B01, B02, B03)`)
- **M7.1 Remediation Docs Commit:** Đi kèm và đồng bộ trực tiếp trên nhánh `fix/m4-acceptance-blockers` ngay sau code commit `146041c7c517c6091960f3c9f2dca346d6cd665a`
- **Quy chuẩn Git:** Tuân thủ 100% nguyên tắc tách biệt Code commit và Docs commit, không force-push, remote tip đồng bộ tuyệt đối với local HEAD.

---

## 2. GIẢI TRÌNH XỬ LÝ TRIỆT ĐỂ 3 BLOCKER THEO YÊU CẦU TECH LEAD

### 🔴 Blocker B01 — Khóa Bất biến Cấu hình Đã Xuất bản (Published Configuration Immutability)
**Vấn đề:** Trước remediation, `updateConfiguration()` chỉ từ chối trạng thái `ARCHIVED`, vô tình cho phép bài thi `PUBLISHED` tiếp tục bị chỉnh sửa thông số qua `PATCH /api/v1/admin/quiz-configs/:id`.
**Giải pháp triệt để:**
1. **Backend Service (`quiz-config.service.ts`):**
   - Trong `updateConfiguration()`: Kiểm tra nghiêm ngặt `if (existing.status !== "DRAFT")`, ném ngay `BadRequestException(400)` nếu bài thi ở trạng thái `PUBLISHED` hoặc `ARCHIVED`. Toàn bộ các trường `title`, `description`, `eventId`, `timeLimitMinutes`, `passingScore`, `maxAttempts`, `isShuffleQuestions`, `isShuffleOptions` được bảo vệ bất biến 100%.
   - Trong `manageQuestions()`: Bổ sung kiểm tra `if (quiz.status !== "DRAFT")`, từ chối mọi thao tác chỉnh sửa hoặc thay đổi danh sách câu hỏi snapshot đối với bài thi không phải bản nháp.
2. **Admin Frontend (`quiz-config-manager.tsx`):**
   - Ẩn nút "Sửa" đối với bài thi `PUBLISHED` và `ARCHIVED` (chỉ hiển thị khi `row.status === "DRAFT"`).
   - Nút "Câu hỏi" tự động chuyển thành "Xem câu hỏi" ở chế độ chỉ đọc (Read-only) khi bài thi đã xuất bản; ẩn toàn bộ các nút di chuyển Lên/Xuống, nút Xóa câu hỏi, nút Lưu danh sách, và vô hiệu hóa nút Chọn từ Ngân hàng câu hỏi M6.

---

### 🔴 Blocker B02 — Đồng bộ Thống nhất Bộ Giá trị Mặc định (Unified Defaults: 3 / true / true)
**Vấn đề:** Giá trị mặc định của `maxAttempts`, `isShuffleQuestions`, `isShuffleOptions` giữa UI (3 / true / true) và Service/Prisma (1 / false / false) không khớp nhau.
**Giải pháp triệt để:**
1. **Prisma Schema (`prisma/schema.prisma`):**
   - `maxAttempts Int @default(3) @map("max_attempts")`
   - `isShuffleQuestions Boolean @default(true) @map("is_shuffle_questions")`
   - `isShuffleOptions Boolean @default(true) @map("is_shuffle_options")`
2. **Prisma Migration (`20261115000004_quiz_config_defaults`):**
   - `ALTER TABLE "quiz_configurations" ALTER COLUMN "max_attempts" SET DEFAULT 3;`
   - `ALTER TABLE "quiz_configurations" ALTER COLUMN "is_shuffle_questions" SET DEFAULT true;`
   - `ALTER TABLE "quiz_configurations" ALTER COLUMN "is_shuffle_options" SET DEFAULT true;`
   - Đã áp dụng đồng bộ vào PostgreSQL qua `prisma db push` (Exit code 0).
3. **Backend Service (`quiz-config.service.ts`):**
   - Thống nhất fallback mặc định: `maxAttempts: dto.maxAttempts ?? 3`, `isShuffleQuestions: dto.isShuffleQuestions ?? true`, `isShuffleOptions: dto.isShuffleOptions ?? true`.
4. **Admin UI Form Defaults:**
   - Đảm bảo form tạo mới luôn khởi tạo chính xác: `maxAttempts: 3`, `isShuffleQuestions: true`, `isShuffleOptions: true`.

---

### 🔴 Blocker B03 — Bổ sung Bộ Kiểm thử Tích hợp PostgreSQL (PostgreSQL Regression Tests)
**File cập nhật:** `apps/api/test/integration/quiz-config.integration.spec.ts`
Bổ sung 2 kịch bản tích hợp chuyên sâu chạy trực tiếp trên PostgreSQL:
1. `Test 10 [Configuration Immutability (B01)]`:
   - Tạo bài thi hợp lệ và xuất bản thành công (`status = "PUBLISHED"`).
   - Gọi `PATCH /api/v1/admin/quiz-configs/:id` cố tình thay đổi điểm đạt, thời gian làm bài, số lượt thi -> Xác nhận API từ chối với HTTP 400 Bad Request.
   - Truy vấn trực tiếp PostgreSQL: Xác nhận 100% dữ liệu gốc trong DB không hề suy chuyển (`passingScore: 70`, `timeLimitMinutes: 15`, `maxAttempts: 3`, `status: "PUBLISHED"`).
   - Kiểm tra `AuditLog`: Xác nhận không có bất kỳ bản ghi `UPDATE_QUIZ_CONFIG` nào được ghi nhận cho request bị từ chối.
   - Lưu trữ bài thi (`status = "ARCHIVED"`) và gọi `PATCH` -> Xác nhận API từ chối với HTTP 400 Bad Request.
   - Kiểm tra bài thi ở trạng thái `DRAFT` vẫn cho phép cập nhật thông số bình thường.
2. `Test 11 [Unified Defaults (B02)]`:
   - Tạo bài thi với payload bỏ trống các trường tùy chọn (`maxAttempts`, `isShuffleQuestions`, `isShuffleOptions`).
   - Kiểm tra phản hồi API và xác minh trực tiếp cơ sở dữ liệu PostgreSQL: các trường tự động nhận đúng giá trị mặc định chuẩn `maxAttempts = 3`, `isShuffleQuestions = true`, `isShuffleOptions = true`.
   - Tạo bài thi với các giá trị tùy biến rõ ràng (`maxAttempts: 5, isShuffleQuestions: false, isShuffleOptions: false`) -> Xác nhận PostgreSQL lưu trữ chính xác giá trị người dùng chỉ định.

---

## 3. KẾT QUẢ QUALITY GATES & BẰNG CHỨNG KIỂM THỬ THỰC TẾ (100% PASS)

| Hạng mục kiểm tra | Lệnh thực thi | Exit Code | Kết quả thực tế |
| :--- | :--- | :---: | :--- |
| **Quiz Config Integration Tests (M7.1)** | `jest --runInBand test/integration/quiz-config.integration.spec.ts` | **0** | **11/11 tests PASS (31.42s)** trên scratch PostgreSQL thật |
| **Question Bank Regression Tests (M6)** | `jest --runInBand test/integration/question-bank.integration.spec.ts` | **0** | **12/12 tests PASS (27.65s)** trên scratch PostgreSQL thật |
| **Shared Package Build** | `pnpm --filter shared build` | **0** | **100% compile contracts** (`tsc`) |
| **API Typecheck** | `pnpm --filter api typecheck` | **0** | **0 errors** (`tsc --noEmit`) |
| **Web Typecheck** | `pnpm --filter web typecheck` | **0** | **0 errors** (`tsc --noEmit`) |
| **API Lint** | `pnpm --filter api lint` | **0** | **0 errors, 0 warnings** (`eslint`) |
| **Web Lint** | `pnpm --filter web lint` | **0** | **0 errors, 0 warnings** (`eslint`) |
| **API Unit Tests** | `pnpm --filter api test:unit` | **0** | **8 suites, 31 tests PASS (4.96s)** |
| **Web Unit Tests** | `pnpm --filter web test:unit` | **0** | **10 tests PASS (126ms)** |
| **Next.js Production Build** | `pnpm --filter web build` | **0** | **27 routes compiled** (`next build`), tối ưu thành công |

### Chi tiết 11 kịch bản Quiz Configuration Integration Test:
1. `Test 1 [RBAC]`: Chặn 403 Forbidden đối với Student và TOUR_EDITOR (`campus:write`).
2. `Test 2 [Validation]`: Chặn tiêu đề ngắn (< 3 ký tự), eventId sai, câu hỏi trùng hoặc chưa duyệt (400 Bad Request).
3. `Test 3 [CRUD]`: Tạo cấu hình, sao chép snapshot câu hỏi duyệt, lưu PostgreSQL và ghi `AuditLog`.
4. `Test 4 [Get & Update]`: Đọc chi tiết bài thi và cập nhật thông số bài thi DRAFT thành công.
5. `Test 5 [Manage Questions]`: Sắp xếp thứ tự, cập nhật snapshot, từ chối câu hỏi chưa duyệt.
6. `Test 6 [Publish]`: Chặn bài thi 0 câu hỏi, xuất bản bài thi hợp lệ và chuyển trạng thái `PUBLISHED`.
7. `Test 7 [Snapshot Immutability]`: **Bảo chứng Snapshot Bất biến:** Sửa đổi hoặc xóa mềm `QuestionBankItem` gốc KHÔNG ảnh hưởng snapshot đã xuất bản.
8. `Test 8 [Archive & Delete]`: Đưa bài thi vào trạng thái lưu trữ `ARCHIVED`, xóa mềm (`deletedAt`) và loại trừ khỏi danh sách hoạt động.
9. `Test 9 [Regression Guard]`: Giữ nguyên vẹn 100% các câu hỏi bài thi Open Day hiện hành (`OpenDayQuizItem`).
10. `Test 10 [Configuration Immutability (B01)]`: **Bảo chứng Cấu hình Bất biến:** Bài thi `PUBLISHED` và `ARCHIVED` từ chối triệt để request `PATCH` (400), PostgreSQL giữ nguyên vẹn thông số, không ghi `AuditLog` giả mạo, và bài thi `DRAFT` vẫn sửa bình thường.
11. `Test 11 [Unified Defaults (B02)]`: **Bảo chứng Thống nhất Mặc định:** Khởi tạo khi bỏ trống trường tùy chọn tự động nhận `maxAttempts = 3`, `isShuffleQuestions = true`, `isShuffleOptions = true` khớp 100% giữa API, Service, PostgreSQL và UI.

---

## 4. BẢNG ĐỐI CHIẾU TIẾN ĐỘ 9 MODULE (STANDARDIZED EVIDENCE MATRIX)

| Module | Route Admin | Route Người dùng | API Endpoint | Bảng DB (PostgreSQL) | Bằng chứng Kiểm thử Thực tế | Trạng thái Nghiệm thu |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **M1: User & Excel Import** | `/admin/users` | `/login`, `/change-password` | `/api/v1/admin/users/import`, `/api/v1/auth/login` | `users`, `user_import_batches`, `audit_logs` | Integration test `users-admin-crud.integration.spec.ts` (PASS), Unit test auth | **FULL PASS** *(đã nghiệm thu)* |
| **M2: Media Library** | `/admin/media` | CDN / Tour 360° nhúng | `/api/v1/admin/media`, `/api/v1/storage/upload` | `media_assets`, `upload_tokens`, `audit_logs` | 15/15 Integration tests PASS | **FULL PASS** *(đã nghiệm thu)* |
| **M3: Tour Studio 360°** | `/admin/virtual-tour` | `/campus` (Viewer 360°) | `/api/v1/admin/tour/nodes`, `/api/v1/public/tour` | `tour_nodes`, `tour_edges`, `hotspots`, `audit_logs` | Integration test `tour-studio-persistence.integration.spec.ts` (PASS) | **FULL PASS** *(đã nghiệm thu)* |
| **M4: GIS & Locations** | `/admin/locations` | `/map`, `/locations` | `/api/v1/admin/locations`, `/api/v1/public/locations` | `locations`, `buildings`, `floors`, `location_types`, `audit_logs` | 13/13 Integration tests `location-gis-crud.integration.spec.ts` (PASS) | **FULL PASS** *(đã nghiệm thu)* |
| **M5: Content CMS (News)** | `/admin/news` | `/news`, `/news/[slug]` | `/api/v1/admin/news`, `/api/v1/public/news` | `news_articles`, `media_assets`, `users`, `audit_logs` | 16/16 Integration tests PASS | **FULL PASS** *(đã nghiệm thu)* |
| **M6: Question Bank** | `/admin/questions` | Ngân hàng câu hỏi trắc nghiệm | `/api/v1/admin/questions` | `question_bank_items`, `users`, `audit_logs` | 12/12 Integration tests PASS: strict enum, trust boundary | **FULL PASS** *(đã nghiệm thu)* |
| **M7.1: Quiz Configuration** | `/admin/events` (Cấu hình Bài thi) | Bộ đề thi chuẩn hóa | `/api/v1/admin/quiz-configs` | `quiz_configurations`, `quiz_config_questions`, `audit_logs` | **11/11 Integration tests PASS (31.42s)** trên PostgreSQL, B01, B02, B03 đã xử lý triệt để | **HOÀN TẤT REMEDIATION — SẴN SÀNG FULL PASS** |
| **M7.2: Quiz Delivery** | `/admin/events` | `/portal/quiz` (Phát đề thi) | `/api/v1/portal/quiz/active` | `quiz_configurations`, `quiz_config_questions` | Chờ Tech Lead nghiệm thu M7.1 | **PENDING (Kế tiếp)** |
| **M7.3: Quiz Attempt** | Giám sát phòng thi | `/portal/quiz/:attemptId` | `/api/v1/portal/quiz/start`, `/api/v1/portal/quiz/save-progress` | `quiz_attempts`, `quiz_attempt_answers` | Chờ M7.2 hoàn tất | **PENDING** |
| **M7.4: Scoring & XP** | Thống kê điểm thi | Chấm điểm tự động & Nhận XP | `/api/v1/portal/quiz/submit` | `quiz_attempts`, `xp_ledgers` | Chờ M7.3 hoàn tất | **PENDING** |
| **M7.5: Results & Recovery** | Báo cáo chi tiết | Xem lại kết quả & Giải thích | `/api/v1/portal/quiz/:attemptId/results` | `quiz_attempts` | Chờ M7.4 hoàn tất | **PENDING** |
| **M8: Event & QR Check-in** | `/admin/events` (Tickets tab) | `/events` (Nhận vé OD26) | `/api/v1/open-day/register`, `/api/v1/admin/events/checkin` | `open_day_events`, `open_day_sessions`, `event_participations` | Unit test định dạng vé chuẩn OD26 & QR verify (PASS) | **PARTIAL** |
| **M9: Student & Parent Portal** | Quản trị hồ sơ & vé | `/portal`, `/parent` | `/api/v1/portal/profile`, `/api/v1/portal/tickets` | `users`, `parent_student_links`, `event_participations` | Unit test phân luồng định tuyến và bảo vệ route (PASS) | **PARTIAL** |

---

## 5. BẢO CHỨNG PHẠM VI (SCOPE GUARD)
- Tuyệt đối chỉ khắc phục 3 blocker B01, B02, B03 theo đúng chỉ đạo.
- Không triển khai trước M7.2–M7.5.
- Không thay đổi các module M1–M6 đã nghiệm thu.
- Bảo toàn tương thích ngược 100% với `OpenDayQuizItem`.
- Sẵn sàng kích hoạt M7.2 (Quiz Delivery) ngay khi Tech Lead ký nghiệm thu FULL PASS!
