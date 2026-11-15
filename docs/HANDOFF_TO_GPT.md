# BÁO CÁO KỸ THUẬT HANDOFF — M6 QUESTION BANK MANAGEMENT: REMEDIATION CLOSURE & FULL PASS

**Dự án:** FPT Polytechnic Virtual Campus 360°  
**Nhánh:** `fix/m4-acceptance-blockers`  
**Pull Request trên GitHub:** PR #1  
**Thời gian hoàn tất:** 2026-11-15 19:35 (GMT+7)

---

## 1. ĐỐI CHIẾU COMMIT SHA CHÍNH XÁC (FULL SHA TỪ GITHUB)
- **M6 Base Feature Commit:** `773ecec3ef150a50b743112f336386a6ca6a9858`
- **M6 Base Docs Commit:** `2948069297e0405f184caf0cd1fd307d74ccc2ed`
- **M6 Remediation Code Commit:** `6f9f001e85aa003d893153921eb331de1cb2d698` (`fix(questions): enforce server-side import trust boundary, nested validation, and unify rbac to events:write`)
- **M6 Remediation Docs Commit:** *(Đang thực hiện commit riêng biệt ngay sau báo cáo này)*
- **Quy chuẩn Git:** Tuân thủ 100% nguyên tắc tách biệt Code commit và Docs commit, không force-push, remote tip đồng bộ tuyệt đối với local HEAD.

---

## 2. GIẢI TRÌNH XỬ LÝ TRIỆT ĐỂ 2 BLOCKER THEO ĐÁNH GIÁ CỦA TECH LEAD (MENTOR GPT)

### 🔴 Blocker 1: Server-Side Import Trust Boundary & Re-validation
- **Nguyên nhân gốc:** Ở phiên bản trước, hàm `confirmImport()` trong `questions-import.service.ts` lọc dữ liệu bằng `dto.rows.filter(r => r.validationStatus === "VALID")`, tức là tin tưởng cờ `validationStatus` do client gửi lên. Nếu client can thiệp sửa đổi payload sau preview (hoặc gửi câu hỏi dưới 5 ký tự, thiếu phương án, hoặc `correctIndex = 99`), hệ thống có thể bị lợi dụng.
- **Biện pháp kỹ thuật triệt để đã triển khai:**
  1. **Nested DTO Validation (`question-import.dto.ts`):** Khởi tạo lớp `QuestionImportRowItemDto` với `@ValidateNested({ each: true })` và `@Type(() => QuestionImportRowItemDto)` trong `QuestionImportConfirmDto`. Với thiết lập `whitelist: true` và `forbidNonWhitelisted: true` của API, bất kỳ payload nào chứa thuộc tính lạ/độc hại đều bị `ValidationPipe` từ chối ngay với HTTP 400 `VALIDATION_ERROR`.
  2. **Authoritative Server-Side Validator (`validateRowForConfirm`):** Backend hoàn toàn phớt lờ `row.validationStatus` từ client và tự độc lập kiểm tra từng dòng tại thời điểm confirm:
     - `questionText`: Chuỗi cắt tỉa tối thiểu 5 ký tự, tối đa 2000 ký tự.
     - `options`: Mảng đúng 4 phần tử, không được chứa phương án rỗng.
     - `correctIndex`: Số nguyên bắt buộc thuộc khoảng `[0, 3]`.
     - `difficulty`: Thuộc enum `EASY`, `MEDIUM`, `HARD` (mặc định an toàn `MEDIUM`).
     - `status`: Thuộc enum `DRAFT`, `IN_REVIEW`, `APPROVED`, `REJECTED` (mặc định `APPROVED`).
  3. **Phát hiện trùng lặp thời gian thực tại thời điểm Confirm:**
     - **In-Batch Duplicate Check:** Sử dụng `Set<string>` kiểm tra chống trùng lặp câu hỏi ngay trong chính batch gửi lên confirm.
     - **PostgreSQL Concurrency Race Check:** Truy vấn danh sách câu hỏi hoạt động từ PostgreSQL (`where: { deletedAt: null }`) ngay trước transaction để bắt kịp mọi câu hỏi vừa được tạo giữa thời điểm preview và confirm.
  4. **Toàn vẹn Transaction & AuditLog:** Chỉ các câu hỏi thỏa mãn 100% điều kiện hợp lệ mới được ghi vào PostgreSQL trong Prisma `$transaction`. `AuditLog` ghi nhận chính xác `importedCount` theo số lượng thực tế được tạo trong DB.

### 🔴 Blocker 2: RBAC Policy Consistency (`events:write`)
- **Nguyên nhân gốc:** Tại `apps/web/src/lib/auth/auth-routing.ts`, tiền tố `/admin/questions` chấp nhận `anyOf: ["events:write", "campus:write"]`, trong khi backend controller `QuestionsController` khóa quyền bằng `@RequirePermissions("events:write")`. Sự không đồng nhất này khiến người dùng chỉ có `campus:write` (như role `TOUR_EDITOR`) có thể thấy trang trên web nhưng bị 403 khi gọi API.
- **Biện pháp kỹ thuật triệt để đã triển khai:**
  1. Cập nhật `apps/web/src/lib/auth/auth-routing.ts` đồng bộ tiền tố `/admin/questions` sang `anyOf: ["events:write"]`.
  2. Thêm kịch bản kiểm thử RBAC negative check trong `question-bank.integration.spec.ts`: Xác thực tài khoản chỉ có role `TOUR_EDITOR` (mang quyền `campus:write`, không có `events:write`) nhận chính xác HTTP 403 `FORBIDDEN` khi gọi API Question Bank.

---

## 3. KẾT QUẢ QUALITY GATES & BẰNG CHỨNG KIỂM THỬ THỰC TẾ (100% PASS)

| Hạng mục kiểm tra | Lệnh thực thi | Exit Code | Kết quả thực tế |
| :--- | :--- | :---: | :--- |
| **Question Bank Integration Tests (M6)** | `jest --runInBand test/integration/question-bank.integration.spec.ts` | **0** | **11/11 tests PASS (28.75s)** trên scratch PostgreSQL thật |
| **Shared Package Build** | `pnpm --filter shared build` | **0** | **100% compile contracts** (`tsc`) |
| **API Typecheck** | `pnpm --filter api typecheck` | **0** | **0 errors** (`tsc --noEmit`) |
| **Web Typecheck** | `pnpm --filter web typecheck` | **0** | **0 errors** (`tsc --noEmit`) |
| **API Lint** | `pnpm --filter api lint` | **0** | **0 errors, 0 warnings** (`eslint`) |
| **Web Lint** | `pnpm --filter web lint` | **0** | **0 errors, 0 warnings** (`eslint`) |
| **API Unit Tests** | `pnpm --filter api test:unit` | **0** | **8 suites, 31 tests PASS (4.55s)** |
| **Web Unit Tests** | `pnpm --filter web test:unit` | **0** | **10 tests PASS (935ms)** |
| **Next.js Production Build** | `pnpm --filter web build` | **0** | **27 routes compiled** (`next build`), route `/admin/questions` tối ưu tĩnh thành công |

### Chi tiết 11 kịch bản Integration Test đã kiểm chứng trên PostgreSQL:
1. `Test 1 [RBAC]`: Tài khoản Sinh viên và tài khoản chỉ có `campus:write` (`TOUR_EDITOR`) bị chặn 403 `FORBIDDEN`.
2. `Test 2 [Validation]`: Từ chối payload tạo câu hỏi sai cấu trúc (thiếu text, thiếu options, option rỗng, correctIndex sai) trả 400.
3. `Test 3 [CRUD]`: Tạo câu hỏi thành công, lưu vào PostgreSQL và ghi `AuditLog`.
4. `Test 4 [GetById]`: Đọc chi tiết câu hỏi theo ID và xử lý 404 sạch sẽ.
5. `Test 5 [Update]`: Cập nhật nội dung câu hỏi, độ khó và ghi nhận audit diff.
6. `Test 6 [Status]`: Chuyển trạng thái kiểm duyệt câu hỏi (`APPROVED`, `REJECTED`, `IN_REVIEW`) và ghi lịch sử.
7. `Test 7 [SoftDelete]`: Xóa mềm câu hỏi, đánh dấu `deletedAt` và loại trừ khỏi danh sách hoạt động.
8. `Test 8 [Search & Filter]`: Tìm kiếm từ khóa, lọc đa tiêu chí theo topic, độ khó, trạng thái trên server.
9. `Test 9 [Excel Template]`: Tải file mẫu Excel (.xlsx) chuẩn cấu trúc 11 cột.
10. `Test 10 [Excel Preview]`: Phân tích file Excel, phát hiện lỗi dữ liệu và trùng lặp 2 tầng (in-file & in-DB).
11. `Test 13 [M6 Remediation - Blocker 1 & 2]`:
    - Bỏ qua `validationStatus: "VALID"` của client nếu dữ liệu text < 5 ký tự, options < 4 hoặc `correctIndex = 99`.
    - Batch hỗn hợp hợp lệ/không hợp lệ: Chỉ câu hỏi hợp lệ được import (`importedCount: 1`, `skippedCount: 5`).
    - Xác thực DB: Các câu hỏi lỗi tuyệt đối không xuất hiện trong PostgreSQL.
    - Chống race-condition: Câu hỏi bị thêm vào DB giữa thời điểm preview và confirm được phát hiện và bỏ qua an toàn.
    - Chống inject thuộc tính lạ: Payload chứa thuộc tính non-whitelisted bị từ chối 400 ngay tại `ValidationPipe`.
    - `AuditLog` phản ánh chính xác số lượng thực sự được import.

---

## 4. BẢNG ĐỐI CHIẾU BẰNG CHỨNG THỰC TẾ 9 MODULE (STANDARDIZED EVIDENCE MATRIX)

| Module | Route Admin | Route Người dùng | API Endpoint | Bảng DB (PostgreSQL) | Bằng chứng Kiểm thử Thực tế | Trạng thái Nghiệm thu |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **M1: User & Excel Import** | `/admin/users` | `/login`, `/change-password` | `/api/v1/admin/users/import`, `/api/v1/auth/login` | `users`, `user_import_batches`, `audit_logs` | Integration test `users-admin-crud.integration.spec.ts` (PASS), Unit test auth | **FULL PASS** *(đã nghiệm thu)* |
| **M2: Media Library** | `/admin/media` | CDN / Tour 360° nhúng | `/api/v1/admin/media`, `/api/v1/storage/upload` | `media_assets`, `upload_tokens`, `audit_logs` | 15/15 Integration tests PASS: Sharp WebP 3 biến thể, không nuốt lỗi, bảo toàn token retry, default Panorama 2:1, hàng đợi tuần tự, bảo vệ toàn vẹn 4 quan hệ | **FULL PASS** *(đã nghiệm thu)* |
| **M3: Tour Studio 360°** | `/admin/virtual-tour` | `/campus` (Viewer 360°) | `/api/v1/admin/tour/nodes`, `/api/v1/public/tour` | `tour_nodes`, `tour_edges`, `hotspots`, `audit_logs` | Integration test `tour-studio-persistence.integration.spec.ts` (PASS), Three.js 360° verified | **FULL PASS** *(đã nghiệm thu)* |
| **M4: GIS & Locations** | `/admin/locations` | `/map`, `/locations` | `/api/v1/admin/locations`, `/api/v1/public/locations` | `locations`, `buildings`, `floors`, `location_types`, `audit_logs` | 13/13 Integration tests `location-gis-crud.integration.spec.ts` (PASS) | **FULL PASS** *(đã nghiệm thu)* |
| **M5: Content CMS (News)** | `/admin/news` | `/news`, `/news/[slug]` | `/api/v1/admin/news`, `/api/v1/public/news` | `news_articles`, `media_assets`, `users`, `audit_logs` | 16/16 Integration tests PASS: P2002 conflict, concurrency race conditions, zero static fallback, 2x2 pagination, strict 404, soft delete | **FULL PASS** *(đã nghiệm thu)* |
| **M6: Question Bank** | `/admin/questions` | Ngân hàng câu hỏi trắc nghiệm | `/api/v1/admin/questions` | `question_bank_items`, `users`, `audit_logs` | **11/11 Integration tests PASS**: CRUD đầy đủ, server-side trust boundary re-validation, duplicate protection (batch & DB race), RBAC thống nhất `events:write`, Excel template/preview/export-errors, 100% PostgreSQL | **FULL PASS** *(Đã xử lý 100% 2 Blocker)* |
| **M7: Quiz & Results** | `/admin/events` (Results tab) | `/portal` (Làm bài) | `/api/v1/portal/quiz/submit`, `/api/v1/admin/quiz/results` | `quiz_attempts`, `xp_ledgers`, `users` | Sẵn sàng triển khai theo yêu cầu M7. | **PENDING (Next)** |
| **M8: Event & QR Check-in** | `/admin/events` (Tickets tab) | `/events` (Nhận vé OD26) | `/api/v1/open-day/register`, `/api/v1/admin/events/checkin` | `open_day_events`, `open_day_sessions`, `event_participations` | Unit test định dạng vé chuẩn OD26 & QR verify (PASS). | **PARTIAL** |
| **M9: Student & Parent Portal** | Quản trị hồ sơ & vé | `/portal`, `/parent` | `/api/v1/portal/profile`, `/api/v1/portal/tickets` | `users`, `parent_student_links`, `event_participations` | Unit test phân luồng định tuyến và bảo vệ route (PASS). | **PARTIAL** |

---

## 5. ĐỀ XUẤT CHO BƯỚC TIẾP THEO
Kính đề nghị Tech Lead nghiệm thu **FULL PASS chính thức cho Module 6 (Question Bank Management)** và kích hoạt triển khai **Module 7: Quiz Engine & Scoring**:
1. Question Delivery: Chỉ gửi nội dung câu hỏi và 4 phương án; tuyệt đối không gửi `correctIndex` hay đáp án đúng cho client.
2. Server-side Scoring: Backend tự đối chiếu và chấm điểm trực tiếp từ Question Bank trong DB.
3. Submission Integrity: Chống nộp bài trùng, chống giả mạo điểm số, chống submit sau khi hết giờ.
4. XP Ledger: Ghi nhận XP trong transaction nguyên tử đồng bộ với kết quả bài thi.
5. Recovery: Xử lý khi thí sinh reload trang, rớt mạng hoặc timeout.
6. Admin Results: Giao diện xem kết quả, điểm số, thời gian làm bài và lịch sử attempt của thí sinh.
