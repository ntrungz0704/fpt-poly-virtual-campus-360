# BÁO CÁO KỸ THUẬT HANDOFF — M6 QUESTION BANK MANAGEMENT: FINAL CLOSURE (STRICT ENUM VALIDATION)

**Dự án:** FPT Polytechnic Virtual Campus 360°  
**Nhánh:** `fix/m4-acceptance-blockers`  
**Pull Request trên GitHub:** PR #1  
**Thời gian hoàn tất:** 2026-11-15 19:42 (GMT+7)

---

## 1. ĐỐI CHIẾU COMMIT SHA CHÍNH XÁC (FULL SHA TỪ GITHUB)
- **M6 Base Feature Commit:** `773ecec3ef150a50b743112f336386a6ca6a9858`
- **M6 Base Docs Commit:** `2948069297e0405f184caf0cd1fd307d74ccc2ed`
- **M6 Remediation Round 1 Code Commit:** `6f9f001e85aa003d893153921eb331de1cb2d698` (`fix(questions): enforce server-side import trust boundary, nested validation, and unify rbac to events:write`)
- **M6 Remediation Round 1 Docs Commit:** `702fd9e82331fe45dd7a4eb0f7c0a8ac275f41e4` (`docs(handoff): document m6 remediation closure for import trust boundary and rbac consistency`)
- **M6 Final Closure Code Commit (Strict Enum Validation):** `6bbd3997e2c3e9d3fcbf8d2cadc1df2c0dfa0494` (`fix(questions): enforce strict enum validation and reject invalid difficulty and status values`)
- **M6 Final Closure Docs Commit:** *(Commit riêng biệt ngay sau báo cáo này)*
- **Quy chuẩn Git:** Tuân thủ 100% nguyên tắc tách biệt Code commit và Docs commit, không force-push, remote tip đồng bộ tuyệt đối với local HEAD.

---

## 2. NGUYÊN NHÂN VÀ CÁCH SỬA STRICT ENUM VALIDATION

### 🔴 Vấn đề phát hiện trong đánh giá kỹ thuật:
Ở vòng remediation trước, hàm `validateRowForConfirm()` xử lý độ khó và trạng thái bằng toán tử ba ngôi: nếu giá trị gửi lên không khớp enum hợp lệ thì tự động gán fallback mặc định (`MEDIUM` hoặc `APPROVED`). Điều này vô tình biến các dòng dữ liệu cố tình gửi sai (ví dụ `difficulty: "INVALID"`, `status: "SUPER_ADMIN"`) thành câu hỏi hợp lệ trong hệ thống thay vì phải từ chối và loại bỏ chúng.

### 🟢 Biện pháp kỹ thuật triệt để đã triển khai:
Tại `apps/api/src/modules/questions/questions-import.service.ts` trong hàm `validateRowForConfirm()`:
1. **Phân định rạch ròi giữa giá trị bị bỏ trống (Omitted) và giá trị gửi sai (Explicit Invalid):**
   - **Trường hợp bỏ trống:** Nếu `difficulty` (hoặc `status`) không được gửi (`undefined`, `null` hoặc chuỗi rỗng `""`), hệ thống áp dụng giá trị mặc định chuẩn mực (`MEDIUM` cho difficulty, `APPROVED` cho status).
   - **Trường hợp cố tình gửi giá trị sai:** Nếu client gửi chuỗi khác rỗng nhưng không thuộc enum chuẩn (`validDifficulties = ["EASY", "MEDIUM", "HARD"]`, `validStatuses = ["DRAFT", "IN_REVIEW", "APPROVED", "REJECTED"]`), hệ thống đánh dấu dòng là **KHÔNG HỢP LỆ** (`isValid: false, error: ...`), lập tức loại bỏ dòng này khỏi danh sách import và tăng số lượng `skippedCount`. Tuyệt đối không âm thầm gán mặc định.
2. **Bảo toàn tính nhất quán khi import batch hỗn hợp:**
   - Khi batch gồm cả dòng hợp lệ, dòng bỏ trống độ khó (nhận default), và dòng mang enum sai, chỉ những dòng thực sự hợp lệ mới được ghi vào PostgreSQL trong Prisma `$transaction`. Các dòng sai enum bị bỏ qua sạch sẽ.
   - `AuditLog` và phản hồi API ghi nhận số liệu `importedCount` và `skippedCount` chính xác 100% khớp với DB.

---

## 3. KẾT QUẢ QUALITY GATES & BẰNG CHỨNG KIỂM THỬ THỰC TẾ (100% PASS)

| Hạng mục kiểm tra | Lệnh thực thi | Exit Code | Kết quả thực tế |
| :--- | :--- | :---: | :--- |
| **Question Bank Integration Tests (M6)** | `jest --runInBand test/integration/question-bank.integration.spec.ts` | **0** | **12/12 tests PASS (24.70s)** trên scratch PostgreSQL thật |
| **Shared Package Build** | `pnpm --filter shared build` | **0** | **100% compile contracts** (`tsc`) |
| **API Typecheck** | `pnpm --filter api typecheck` | **0** | **0 errors** (`tsc --noEmit`) |
| **Web Typecheck** | `pnpm --filter web typecheck` | **0** | **0 errors** (`tsc --noEmit`) |
| **API Lint** | `pnpm --filter api lint` | **0** | **0 errors, 0 warnings** (`eslint`) |
| **Web Lint** | `pnpm --filter web lint` | **0** | **0 errors, 0 warnings** (`eslint`) |
| **API Unit Tests** | `pnpm --filter api test:unit` | **0** | **8 suites, 31 tests PASS (4.55s)** |
| **Web Unit Tests** | `pnpm --filter web test:unit` | **0** | **10 tests PASS (935ms)** |
| **Next.js Production Build** | `pnpm --filter web build` | **0** | **27 routes compiled** (`next build`), route `/admin/questions` tối ưu tĩnh thành công |

### Chi tiết 12 kịch bản Integration Test đã kiểm chứng trên PostgreSQL:
1. `Test 1 [RBAC]`: Sinh viên và tài khoản chỉ có `campus:write` (`TOUR_EDITOR`) bị chặn 403 `FORBIDDEN`.
2. `Test 2 [Validation]`: Từ chối payload tạo câu hỏi sai cấu trúc (thiếu text, thiếu options, option rỗng, correctIndex sai) trả 400.
3. `Test 3 [CRUD]`: Tạo câu hỏi thành công, lưu vào PostgreSQL và ghi `AuditLog`.
4. `Test 4 [GetById]`: Đọc chi tiết câu hỏi theo ID và xử lý 404 sạch sẽ.
5. `Test 5 [Update]`: Cập nhật nội dung câu hỏi, độ khó và ghi nhận audit diff.
6. `Test 6 [Status]`: Chuyển trạng thái kiểm duyệt câu hỏi (`APPROVED`, `REJECTED`, `IN_REVIEW`) và ghi lịch sử.
7. `Test 7 [SoftDelete]`: Xóa mềm câu hỏi, đánh dấu `deletedAt` và loại trừ khỏi danh sách hoạt động.
8. `Test 8 [Search & Filter]`: Tìm kiếm từ khóa, lọc đa tiêu chí theo topic, độ khó, trạng thái trên server.
9. `Test 9 [Excel Template]`: Tải file mẫu Excel (.xlsx) chuẩn cấu trúc 11 cột.
10. `Test 10 [Excel Preview]`: Phân tích file Excel, phát hiện lỗi dữ liệu và trùng lặp 2 tầng (in-file & in-DB).
11. `Test 13 [M6 Remediation - Blocker 1]`:
    - Phớt lờ `validationStatus: "VALID"` giả mạo của client.
    - Kiểm tra text < 5 ký tự, options < 4, `correctIndex = 99` đều bị loại.
    - Chống race-condition khi câu hỏi được tạo trong PostgreSQL giữa preview và confirm.
    - Từ chối payload chứa thuộc tính non-whitelisted bằng `ValidationPipe` (400).
12. `Test 14 [M6 Final Closure - Strict Enum Validation]`:
    - Dòng chứa `difficulty: "INVALID"` bị loại bỏ, kiểm tra trực tiếp PostgreSQL: không tồn tại trong DB.
    - Dòng chứa `status: "SUPER_ADMIN"` bị loại bỏ, kiểm tra trực tiếp PostgreSQL: không tồn tại trong DB.
    - Dòng không gửi `difficulty`/`status` được gán chính xác mặc định `MEDIUM` và `APPROVED`.
    - Dòng gửi đúng `difficulty: "EASY"` và `status: "DRAFT"` được lưu chính xác vào DB.
    - Batch hỗn hợp 4 dòng: `importedCount: 2`, `skippedCount: 2`.
    - `AuditLog` diffJson ghi nhận chính xác `importedCount: 2, skippedCount: 2, totalReceived: 4`.

---

## 4. BẢNG ĐỐI CHIẾU BẰNG CHỨNG THỰC TẾ 9 MODULE (STANDARDIZED EVIDENCE MATRIX)

| Module | Route Admin | Route Người dùng | API Endpoint | Bảng DB (PostgreSQL) | Bằng chứng Kiểm thử Thực tế | Trạng thái Nghiệm thu |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **M1: User & Excel Import** | `/admin/users` | `/login`, `/change-password` | `/api/v1/admin/users/import`, `/api/v1/auth/login` | `users`, `user_import_batches`, `audit_logs` | Integration test `users-admin-crud.integration.spec.ts` (PASS), Unit test auth | **FULL PASS** *(đã nghiệm thu)* |
| **M2: Media Library** | `/admin/media` | CDN / Tour 360° nhúng | `/api/v1/admin/media`, `/api/v1/storage/upload` | `media_assets`, `upload_tokens`, `audit_logs` | 15/15 Integration tests PASS: Sharp WebP 3 biến thể, không nuốt lỗi, bảo toàn token retry, default Panorama 2:1, hàng đợi tuần tự, bảo vệ toàn vẹn 4 quan hệ | **FULL PASS** *(đã nghiệm thu)* |
| **M3: Tour Studio 360°** | `/admin/virtual-tour` | `/campus` (Viewer 360°) | `/api/v1/admin/tour/nodes`, `/api/v1/public/tour` | `tour_nodes`, `tour_edges`, `hotspots`, `audit_logs` | Integration test `tour-studio-persistence.integration.spec.ts` (PASS), Three.js 360° verified | **FULL PASS** *(đã nghiệm thu)* |
| **M4: GIS & Locations** | `/admin/locations` | `/map`, `/locations` | `/api/v1/admin/locations`, `/api/v1/public/locations` | `locations`, `buildings`, `floors`, `location_types`, `audit_logs` | 13/13 Integration tests `location-gis-crud.integration.spec.ts` (PASS) | **FULL PASS** *(đã nghiệm thu)* |
| **M5: Content CMS (News)** | `/admin/news` | `/news`, `/news/[slug]` | `/api/v1/admin/news`, `/api/v1/public/news` | `news_articles`, `media_assets`, `users`, `audit_logs` | 16/16 Integration tests PASS: P2002 conflict, concurrency race conditions, zero static fallback, 2x2 pagination, strict 404, soft delete | **FULL PASS** *(đã nghiệm thu)* |
| **M6: Question Bank** | `/admin/questions` | Ngân hàng câu hỏi trắc nghiệm | `/api/v1/admin/questions` | `question_bank_items`, `users`, `audit_logs` | **12/12 Integration tests PASS**: CRUD đầy đủ, trust boundary, duplicate protection (batch & DB race), RBAC thống nhất `events:write`, strict enum validation, Excel template/preview/export-errors, 100% PostgreSQL | **FULL PASS** *(Hoàn tất nghiệm thu 100%)* |
| **M7: Quiz Engine & Scoring** | `/admin/events` (Results tab) | `/portal` (Làm bài) | `/api/v1/portal/quiz/submit`, `/api/v1/admin/quiz/results` | `quiz_attempts`, `xp_ledgers`, `users` | Sẵn sàng triển khai 5 giai đoạn: M7.1 Configuration, M7.2 Delivery, M7.3 Attempt, M7.4 Scoring & XP, M7.5 Recovery. | **PENDING (Next)** |
| **M8: Event & QR Check-in** | `/admin/events` (Tickets tab) | `/events` (Nhận vé OD26) | `/api/v1/open-day/register`, `/api/v1/admin/events/checkin` | `open_day_events`, `open_day_sessions`, `event_participations` | Unit test định dạng vé chuẩn OD26 & QR verify (PASS). | **PARTIAL** |
| **M9: Student & Parent Portal** | Quản trị hồ sơ & vé | `/portal`, `/parent` | `/api/v1/portal/profile`, `/api/v1/portal/tickets` | `users`, `parent_student_links`, `event_participations` | Unit test phân luồng định tuyến và bảo vệ route (PASS). | **PARTIAL** |

---

## 5. XÁC NHẬN KHÔNG PHÁT SINH REGRESSION & SẴN SÀNG HANDOFF SANG M7
- Toàn bộ các module M1–M5 giữ nguyên vẹn, không có thay đổi mã nguồn ngoài phạm vi M6.
- Toàn bộ unit tests của API (8 suites, 31 tests) và Web (10 tests) đều đạt 100% PASS.
- Production build Next.js 27 routes thành công sạch sẽ.
- Sẵn sàng kích hoạt triển khai **Module 7: Quiz Engine & Scoring** theo 5 giai đoạn đã thống nhất với Tech Lead!
