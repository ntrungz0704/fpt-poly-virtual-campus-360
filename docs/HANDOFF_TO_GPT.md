# BÁO CÁO KỸ THUẬT HANDOFF — M7.1: QUIZ CONFIGURATION & IMMUTABLE QUESTION SNAPSHOT ENGINE

**Dự án:** FPT Polytechnic Virtual Campus 360°  
**Nhánh:** `fix/m4-acceptance-blockers`  
**Pull Request trên GitHub:** PR #1  
**Thời gian hoàn tất:** 2026-11-15 20:25 (GMT+7)

---

## 1. ĐỐI CHIẾU COMMIT SHA CHÍNH XÁC (FULL SHA TỪ GITHUB)
- **M6 Base Feature Commit:** `773ecec3ef150a50b743112f336386a6ca6a9858`
- **M6 Base Docs Commit:** `2948069297e0405f184caf0cd1fd307d74ccc2ed`
- **M6 Remediation Round 1 Code Commit:** `6f9f001e85aa003d893153921eb331de1cb2d698`
- **M6 Remediation Round 1 Docs Commit:** `702fd9e82331fe45dd7a4eb0f7c0a8ac275f41e4`
- **M6 Final Closure Code Commit (Strict Enum):** `6bbd3997e2c3e9d3fcbf8d2cadc1df2c0dfa0494`
- **M6 Final Closure Docs Commit (Verified):** `e81413b35fb0d616d866cf2c8b5318a02a0caab4` *(Đã sửa chính xác theo chỉ đạo của Tech Lead)*
- **M7.1 Code Commit:** `34125f4baec1ac6e6a90c0a5e6b9a20250678a5a` (`feat(quiz-config): implement m7.1 quiz configuration, question bank selection, and immutable snapshot engine`)
- **M7.1 Docs Commit:** *(Commit riêng biệt ngay sau báo cáo này)*
- **Quy chuẩn Git:** Tuân thủ 100% nguyên tắc tách biệt Code commit và Docs commit, không force-push, remote tip đồng bộ tuyệt đối với local HEAD.

---

## 2. TỔNG QUAN KIẾN TRÚC & MÔ HÌNH DỮ LIỆU M7.1

### A. Mô hình Dữ liệu Bổ sung (Additive Schema — Zero Regression)
Triển khai thêm 2 model độc lập trong `prisma/schema.prisma` và migration `20261115000003_quiz_configurations`:
1. `model QuizConfiguration`:
   - Định danh: `id` (UUIDv4)
   - Thông tin cơ bản: `title` (VARCHAR 255), `description` (TEXT), `eventId` (UUID nullable, khóa ngoại FK -> `open_day_events`)
   - Thông số kỹ thuật: `timeLimitMinutes` (Int, default 15), `passingScore` (Int, default 70), `maxAttempts` (Int, default 3)
   - Cấu hình đề: `isShuffleQuestions` (Boolean, default true), `isShuffleOptions` (Boolean, default true)
   - Vòng đời: `status` (`QuizConfigStatus`: `DRAFT`, `PUBLISHED`, `ARCHIVED`)
   - Phân quyền & Giám sát: `createdById`, `updatedById`, `publishedAt`, `createdAt`, `updatedAt`, `deletedAt` (Soft-delete)
2. `model QuizConfigQuestion`:
   - Khóa ngoại liên kết: `quizConfigId` (FK -> `quiz_configurations`), `questionBankItemId` (FK nullable -> `question_bank_items` on delete SET NULL)
   - Thứ tự: `sortOrder` (Int)
   - **Các trường Snapshot Độc lập (Immutable Question Snapshot):**
     - `questionText` (TEXT): Toàn văn nội dung câu hỏi tại thời điểm đóng gói
     - `optionsJson` (JSONB): Mảng 4 phương án trả lời độc lập
     - `correctIndex` (Int): Chỉ số đáp án đúng (0..3)
     - `explanation` (TEXT): Lời giải thích chi tiết
     - `topic` (VARCHAR 100): Chủ đề kiến thức
     - `difficulty` (`QuestionDifficulty`: `EASY`, `MEDIUM`, `HARD`)
   - Ràng buộc: `@@unique([quizConfigId, questionBankItemId])`, `@@index([quizConfigId, sortOrder])`.

### B. Chiến lược Snapshot Câu hỏi Bất biến (Immutable Snapshot Strategy)
- Khi thêm hoặc cập nhật câu hỏi vào cấu hình bài thi (`manageQuestions`), hệ thống nạp các bản ghi `QuestionBankItem` đang hoạt động (`status = "APPROVED"`, `deletedAt IS NULL`) từ PostgreSQL, sao chép toàn bộ dữ liệu phương án và đáp án vào `quiz_config_questions`.
- **Bảo chứng Độc lập:** Nếu người quản trị sau này sửa câu hỏi trong Ngân hàng câu hỏi M6, đổi đáp án, hoặc xóa mềm `QuestionBankItem`, bản ghi `quiz_config_questions` trong bài thi đã xuất bản vẫn giữ nguyên vẹn 100% nội dung gốc. Đảm bảo tính nhất quán tuyệt đối cho việc chấm thi và lịch sử học tập.
- **Bảo toàn Hệ thống Cũ (Zero Regression):** Giữ nguyên vẹn bảng `open_day_quiz_items` và các bài thi Open Day hiện hữu, đảm bảo tương thích ngược 100%.

---

## 3. DANH SÁCH API ENDPOINTS TRIỂN KHAI CHO M7.1

Tất cả API được bảo vệ bởi `JwtAuthGuard`, `PermissionsGuard` với quyền `events:write`:
1. `GET /api/v1/admin/quiz-configs`: Liệt kê danh sách cấu hình bài thi (hỗ trợ phân trang, lọc theo `status`, `eventId`, tìm kiếm từ khóa `q`).
2. `GET /api/v1/admin/quiz-configs/:id`: Đọc chi tiết cấu hình kèm toàn bộ câu hỏi snapshot đã sắp xếp theo `sortOrder`.
3. `POST /api/v1/admin/quiz-configs`: Tạo mới cấu hình bài thi (`CreateQuizConfigDto`).
4. `PATCH /api/v1/admin/quiz-configs/:id`: Cập nhật thông số bài thi ở trạng thái DRAFT (`UpdateQuizConfigDto`).
5. `PUT /api/v1/admin/quiz-configs/:id/questions`: Tuyển chọn và sắp xếp thứ tự câu hỏi từ Ngân hàng câu hỏi M6, thực hiện transactional snapshot.
6. `POST /api/v1/admin/quiz-configs/:id/publish`: Xuất bản bài thi (xác thực nghiêm ngặt: yêu cầu ít nhất 1 câu hỏi được duyệt; chuyển trạng thái `PUBLISHED`, lưu `publishedAt` và ghi `AuditLog`).
7. `POST /api/v1/admin/quiz-configs/:id/archive`: Đưa bài thi vào trạng thái lưu trữ `ARCHIVED`.
8. `DELETE /api/v1/admin/quiz-configs/:id`: Xóa mềm bài thi (`deletedAt`), loại bỏ khỏi danh sách hoạt động và ghi `AuditLog`.

---

## 4. GIAO DIỆN QUẢN TRỊ ADMIN (ADMIN FRONTEND)
- **Tích hợp:** Bổ sung Tab `"quiz-config"` ("Cấu hình Bài thi (M7.1)") trực tiếp vào phân khu quản trị Open Day (`apps/web/src/app/admin/events/page.tsx`).
- **Module Quản trị (`QuizConfigManager`):**
  - **Bảng danh sách cấu hình:** Hiển thị tên bài thi, sự kiện liên kết, thông số thời gian/điểm đạt/lượt thi/trộn đề, số lượng câu hỏi snapshot, huy hiệu trạng thái (DRAFT/PUBLISHED/ARCHIVED).
  - **Modal Tạo / Sửa Cấu hình:** Nhập tiêu đề, mô tả, chọn sự kiện Open Day, cấu hình thời gian làm bài (phút), điểm đạt (%), số lần làm tối đa, bật/tắt trộn thứ tự câu hỏi và trộn đáp án.
  - **Drawer / Modal Tuyển chọn Câu hỏi & Snapshot:**
    - Cột trái: Danh sách câu hỏi đã chọn trong bài thi kèm nút di chuyển thứ tự (Lên ↑ / Xuống ↓), nút xóa khỏi bài thi, hiển thị đáp án đúng và nhãn độ khó.
    - Cột phải: Bộ tuyển chọn từ Ngân hàng câu hỏi M6 (lọc theo từ khóa, chủ đề, chỉ hiển thị câu hỏi `APPROVED`), nút chọn nhanh chống trùng lặp.
    - Nút "Lưu danh sách câu hỏi" đóng gói snapshot ngay lập tức vào PostgreSQL.
    - Nút "Xuất bản ngay" kích hoạt khóa snapshot bài thi.
  - **Bảo toàn dữ liệu:** 100% dữ liệu thao tác qua API thực tế kết nối cơ sở dữ liệu PostgreSQL, hiển thị Loading, Empty, Error Toast và xử lý phản hồi máy chủ sạch sẽ. Không sử dụng bất kỳ mock data hay localStorage nào.

---

## 5. KẾT QUẢ QUALITY GATES & BẰNG CHỨNG KIỂM THỬ THỰC TẾ (100% PASS)

| Hạng mục kiểm tra | Lệnh thực thi | Exit Code | Kết quả thực tế |
| :--- | :--- | :---: | :--- |
| **Quiz Config Integration Tests (M7.1)** | `jest --runInBand test/integration/quiz-config.integration.spec.ts` | **0** | **9/9 tests PASS (25.04s)** trên scratch PostgreSQL thật |
| **Question Bank Integration Tests (M6)** | `jest --runInBand test/integration/question-bank.integration.spec.ts` | **0** | **12/12 tests PASS (24.70s)** trên scratch PostgreSQL thật |
| **Shared Package Build** | `pnpm --filter shared build` | **0** | **100% compile contracts** (`tsc`) |
| **API Typecheck** | `pnpm --filter api typecheck` | **0** | **0 errors** (`tsc --noEmit`) |
| **Web Typecheck** | `pnpm --filter web typecheck` | **0** | **0 errors** (`tsc --noEmit`) |
| **API Lint** | `pnpm --filter api lint` | **0** | **0 errors, 0 warnings** (`eslint`) |
| **Web Lint** | `pnpm --filter web lint` | **0** | **0 errors, 0 warnings** (`eslint`) |
| **API Unit Tests** | `pnpm --filter api test:unit` | **0** | **8 suites, 31 tests PASS (4.97s)** |
| **Web Unit Tests** | `pnpm --filter web test:unit` | **0** | **10 tests PASS (126ms)** |
| **Next.js Production Build** | `pnpm --filter web build` | **0** | **27 routes compiled** (`next build`), route `/admin/events` tối ưu thành công |

### Chi tiết 9 kịch bản Integration Test đã kiểm chứng trên PostgreSQL:
1. `Test 1 [RBAC]`: Sinh viên và tài khoản chỉ có `campus:write` (`TOUR_EDITOR`) bị chặn 403 `FORBIDDEN`.
2. `Test 2 [Validation]`: Từ chối payload tạo cấu hình sai tiêu đề (< 3 ký tự), mã sự kiện không tồn tại, trùng câu hỏi hoặc câu hỏi chưa duyệt (400 Bad Request).
3. `Test 3 [CRUD]`: Tạo cấu hình bài thi, sao chép snapshot câu hỏi được duyệt, lưu trữ PostgreSQL và ghi `AuditLog`.
4. `Test 4 [Get & Update]`: Đọc chi tiết bài thi kèm danh sách câu hỏi snapshot và cập nhật thông số thành công.
5. `Test 5 [Manage Questions]`: Sắp xếp lại thứ tự câu hỏi, cập nhật snapshot và từ chối câu hỏi chưa được phê duyệt (`DRAFT`).
6. `Test 6 [Publish]`: Chặn xuất bản bài thi rỗng (0 câu hỏi), xuất bản thành công bài thi hợp lệ và chuyển trạng thái `PUBLISHED`.
7. `Test 7 [Snapshot Immutability]`: **Bảo chứng Bất biến:** Sửa đổi nội dung hoặc xóa mềm `QuestionBankItem` gốc KHÔNG làm thay đổi nội dung câu hỏi trong snapshot bài thi đã xuất bản.
8. `Test 8 [Archive & Delete]`: Đưa bài thi vào trạng thái lưu trữ `ARCHIVED`, xóa mềm (`deletedAt`) và loại trừ khỏi danh sách hoạt động.
9. `Test 9 [Regression Guard]`: Giữ nguyên vẹn hoạt động của các bài thi sự kiện Open Day hiện có (`OpenDayQuizItem`).

---

## 6. BẢNG ĐỐI CHIẾU TIẾN ĐỘ 9 MODULE (STANDARDIZED EVIDENCE MATRIX)

| Module | Route Admin | Route Người dùng | API Endpoint | Bảng DB (PostgreSQL) | Bằng chứng Kiểm thử Thực tế | Trạng thái Nghiệm thu |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **M1: User & Excel Import** | `/admin/users` | `/login`, `/change-password` | `/api/v1/admin/users/import`, `/api/v1/auth/login` | `users`, `user_import_batches`, `audit_logs` | Integration test `users-admin-crud.integration.spec.ts` (PASS), Unit test auth | **FULL PASS** *(đã nghiệm thu)* |
| **M2: Media Library** | `/admin/media` | CDN / Tour 360° nhúng | `/api/v1/admin/media`, `/api/v1/storage/upload` | `media_assets`, `upload_tokens`, `audit_logs` | 15/15 Integration tests PASS | **FULL PASS** *(đã nghiệm thu)* |
| **M3: Tour Studio 360°** | `/admin/virtual-tour` | `/campus` (Viewer 360°) | `/api/v1/admin/tour/nodes`, `/api/v1/public/tour` | `tour_nodes`, `tour_edges`, `hotspots`, `audit_logs` | Integration test `tour-studio-persistence.integration.spec.ts` (PASS) | **FULL PASS** *(đã nghiệm thu)* |
| **M4: GIS & Locations** | `/admin/locations` | `/map`, `/locations` | `/api/v1/admin/locations`, `/api/v1/public/locations` | `locations`, `buildings`, `floors`, `location_types`, `audit_logs` | 13/13 Integration tests `location-gis-crud.integration.spec.ts` (PASS) | **FULL PASS** *(đã nghiệm thu)* |
| **M5: Content CMS (News)** | `/admin/news` | `/news`, `/news/[slug]` | `/api/v1/admin/news`, `/api/v1/public/news` | `news_articles`, `media_assets`, `users`, `audit_logs` | 16/16 Integration tests PASS | **FULL PASS** *(đã nghiệm thu)* |
| **M6: Question Bank** | `/admin/questions` | Ngân hàng câu hỏi trắc nghiệm | `/api/v1/admin/questions` | `question_bank_items`, `users`, `audit_logs` | 12/12 Integration tests PASS: strict enum, trust boundary | **FULL PASS** *(đã nghiệm thu)* |
| **M7.1: Quiz Configuration** | `/admin/events` (Cấu hình Bài thi) | Bộ đề thi chuẩn hóa | `/api/v1/admin/quiz-configs` | `quiz_configurations`, `quiz_config_questions`, `audit_logs` | **9/9 Integration tests PASS (25.04s)** trên scratch PostgreSQL, Immutable Snapshot Engine đã kiểm chứng | **SẴN SÀNG NGHIỆM THU (Hoàn tất 100%)** |
| **M7.2: Quiz Delivery** | `/admin/events` | `/portal/quiz` (Phát đề thi) | `/api/v1/portal/quiz/active` | `quiz_configurations`, `quiz_config_questions` | Chờ Tech Lead nghiệm thu M7.1 | **PENDING (Kế tiếp)** |
| **M7.3: Quiz Attempt** | Giám sát phòng thi | `/portal/quiz/:attemptId` | `/api/v1/portal/quiz/start`, `/api/v1/portal/quiz/save-progress` | `quiz_attempts`, `quiz_attempt_answers` | Chờ M7.2 hoàn tất | **PENDING** |
| **M7.4: Scoring & XP** | Thống kê điểm thi | Chấm điểm tự động & Nhận XP | `/api/v1/portal/quiz/submit` | `quiz_attempts`, `xp_ledgers` | Chờ M7.3 hoàn tất | **PENDING** |
| **M7.5: Results & Recovery** | Báo cáo chi tiết | Xem lại kết quả & Giải thích | `/api/v1/portal/quiz/:attemptId/results` | `quiz_attempts` | Chờ M7.4 hoàn tất | **PENDING** |
| **M8: Event & QR Check-in** | `/admin/events` (Tickets tab) | `/events` (Nhận vé OD26) | `/api/v1/open-day/register`, `/api/v1/admin/events/checkin` | `open_day_events`, `open_day_sessions`, `event_participations` | Unit test định dạng vé chuẩn OD26 & QR verify (PASS) | **PARTIAL** |
| **M9: Student & Parent Portal** | Quản trị hồ sơ & vé | `/portal`, `/parent` | `/api/v1/portal/profile`, `/api/v1/portal/tickets` | `users`, `parent_student_links`, `event_participations` | Unit test phân luồng định tuyến và bảo vệ route (PASS) | **PARTIAL** |

---

## 7. BẢO CHỨNG PHẠM VI & SẴN SÀNG KÍCH HOẠT M7.2
- **Phạm vi nghiêm ngặt:** Tuân thủ 100% Scope Guard, tuyệt đối không triển khai trước M7.2 (Quiz Delivery), M7.3 (Attempts), M7.4 (Scoring/XP), hay M7.5 (Results) cho tới khi Tech Lead duyệt nghiệm thu M7.1.
- **Không xảy ra Regression:** Toàn bộ các module từ M1 đến M6 hoạt động ổn định, 31 API unit tests và 10 Web unit tests đều PASS.
- **Quy chuẩn Git:** Đã thực hiện Code commit và chuẩn bị Docs commit riêng biệt. Sẵn sàng đẩy nhánh lên GitHub.
