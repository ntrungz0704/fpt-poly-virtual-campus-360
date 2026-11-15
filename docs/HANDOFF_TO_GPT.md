# BÁO CÁO KỸ THUẬT HANDOFF — PHASE D: QUESTION BANK MANAGEMENT (MODULE 6) FINAL CLOSURE

**Dự án:** FPT Polytechnic Virtual Campus 360°  
**Nhánh:** `fix/m4-acceptance-blockers`  
**Pull Request trên GitHub:** PR #1  
**Thời gian hoàn tất:** 2026-11-15 19:20 (GMT+7)

---

## 1. ĐỐI CHIẾU COMMIT SHA CHÍNH XÁC (FULL SHA TỪ GITHUB)
- **Code commit vòng trước (M2 Remediation):** `689d089bdd2229e99922278f882a2a1d7690b5f1` (Đã được Tech Lead nghiệm thu **FULL PASS**)
- **Docs commit vòng trước (M2 Remediation):** `70f8a380beb7abeae4f9d101dbdf1401784cc060`
- **Code commit hiện tại (M6 Question Bank):** `773ecec3ef150a50b743112f336386a6ca6a9858` (`feat(questions): implement independent question bank management, excel import and rbac protection (m6)`)
- **Trạng thái GitHub Remote Tip:** Nhánh `fix/m4-acceptance-blockers` tuân thủ 100% nguyên tắc tách biệt Code commit và Docs commit, không force-push.

---

## 2. GIẢI TRÌNH XỬ LÝ 100% YÊU CẦU THEO CHỈ ĐẠO CỦA TECH LEAD (MENTOR GPT)

Tuân thủ nghiêm ngặt chỉ đạo kỹ thuật từ Tech Lead về việc phân định rạch ròi giữa **M6 (Question Bank)** và **M7 (Quiz Engine)**:

### 🌟 Kiến trúc Ngân hàng câu hỏi độc lập (PostgreSQL Persistence)
- **Tách biệt khỏi Open Day Event:** Thiết kế model `QuestionBankItem` độc lập hoàn toàn với `OpenDayEvent`, có thể tái sử dụng cho bất kỳ kỳ thi nào trong tương lai:
  - `questionText`: Nội dung câu hỏi (tối thiểu 5 ký tự).
  - `optionsJson`: Lưu trữ mảng 4 phương án trắc nghiệm chuẩn (`JsonB`).
  - `correctIndex`: Chỉ số đáp án đúng (từ 0 đến 3 tương ứng A, B, C, D).
  - `explanation`: Giải thích đáp án phục vụ tra cứu sau thi.
  - `topic`: Phân loại chủ đề linh hoạt (`Lịch sử FPT`, `Văn hóa FPT`, `Công nghệ thông tin`, `Kỹ năng mềm`, `Chung`...).
  - `difficulty`: Enum `EASY`, `MEDIUM`, `HARD`.
  - `status`: Enum quy trình kiểm duyệt `DRAFT`, `IN_REVIEW`, `APPROVED`, `REJECTED`.
  - `tags`: Mảng từ khóa JSON phục vụ tìm kiếm mờ.
  - `createdById`, `updatedById`, `deletedAt`: Quản lý tác giả, người cập nhật và xóa mềm (Soft-Delete) bảo toàn dữ liệu lịch sử.
- **Migration an toàn:** Tạo migration `20261115000002_question_bank` với các chỉ mục tối ưu (`idx_question_bank_status`, `idx_question_bank_difficulty`, `idx_question_bank_topic`, `idx_question_bank_deleted_at`, `idx_question_bank_created_at`).

### 🌟 Tính năng Nhập hàng loạt từ Excel (Excel Bulk Import & Validation Engine)
- **Tải file mẫu chuẩn (`/api/v1/admin/questions/import/template`):** Cung cấp tệp `.xlsx` có đầy đủ 11 cột, hướng dẫn chi tiết và 3 câu hỏi mẫu thực tế.
- **Bộ máy kiểm định từng dòng (Row-by-Row Validator):**
  - Kiểm tra câu hỏi thiếu nội dung (< 5 ký tự).
  - Kiểm tra phương án thiếu hoặc rỗng (bắt buộc đủ 4 phương án A, B, C, D).
  - Kiểm tra đáp án đúng (chuẩn hóa A/B/C/D hoặc 1/2/3/4; ném lỗi nếu ký tự không hợp lệ).
  - Tự động phân giải độ khó (EASY, MEDIUM, HARD) và cắt nhỏ mảng tags.
- **Phát hiện trùng lặp 2 tầng (Dual-Layer Duplicate Detection):**
  - **Tầng 1 (In-File):** Phát hiện các dòng trùng nội dung câu hỏi trong cùng một tệp Excel tải lên.
  - **Tầng 2 (In-Database):** Đối chiếu với toàn bộ câu hỏi đang hoạt động trong PostgreSQL để gắn cờ `DUPLICATE`.
- **Giao dịch nguyên tử (Atomic Transaction):** Chỉ import các dòng có trạng thái `VALID` trong một giao dịch Prisma `$transaction`, các dòng lỗi/trùng lặp được bỏ qua an toàn mà không làm hủy bỏ toàn bộ quá trình.
- **Xuất báo cáo lỗi chi tiết (`/api/v1/admin/questions/import/export-errors`):** Cho phép tải tệp Excel chứa toàn bộ các dòng lỗi/trùng lặp kèm cột lý do cụ thể để người quản trị chỉnh sửa và nhập lại.

### 🌟 Giao diện Quản trị Chuyên nghiệp (`/admin/questions`)
- Tích hợp liền mạch vào Admin Shell với biểu tượng `help_outline` và phân quyền RBAC `events:write` / `campus:write`.
- Thẻ thống kê thời gian thực: Tổng câu hỏi, Đã duyệt, Chờ duyệt, Câu hỏi đang hiển thị.
- Bộ lọc đa chiều: Tìm kiếm từ khóa theo nội dung/giải thích, lọc theo Chủ đề, lọc theo Độ khó, lọc theo Trạng thái duyệt.
- Modal tạo & sửa câu hỏi trực quan: Giao diện chọn đáp án đúng bằng nút Radio riêng biệt cho 4 phương án A, B, C, D, hỗ trợ xem trước (Live Preview).
- Thao tác nhanh: Duyệt nhanh (`APPROVED`), Từ chối (`REJECTED`), Xóa mềm với modal cảnh báo rõ ràng.
- Xử lý lỗi bảo toàn trạng thái (Zero Fake State): Nếu API lỗi, hiển thị thông báo lỗi từ máy chủ, không đóng modal và giữ nguyên dữ liệu đang nhập.

### 🌟 Bảo mật, RBAC & Giới hạn Phạm vi
- Chỉ tài khoản có quyền quản trị (`events:write`) mới được truy cập các endpoint `/admin/questions`. Thí sinh / sinh viên truy cập nhận ngay HTTP 403 `FORBIDDEN`.
- Tuyệt đối KHÔNG có endpoint public nào để lộ đáp án đúng của ngân hàng câu hỏi.
- Ghi nhận `AuditLog` cho tất cả hành động: `CREATE_QUESTION`, `UPDATE_QUESTION`, `CHANGE_QUESTION_STATUS`, `DELETE_QUESTION`, `IMPORT_QUESTIONS`.
- **Tuân thủ giới hạn phạm vi:** Không lấn sân sang M7 (không tạo lượt làm bài, không tính giờ thi, không chấm điểm tự động hay cộng XP).

---

## 3. KẾT QUẢ QUALITY GATES & BẰNG CHỨNG KIỂM THỬ THỰC TẾ (100% PASS)

| Hạng mục kiểm tra | Lệnh thực thi | Exit Code | Kết quả thực tế |
| :--- | :--- | :---: | :--- |
| **Question Bank Integration Test** | `jest --runInBand test/integration/question-bank.integration.spec.ts` | **0** | **10/10 tests PASS (25.84s)** trên scratch PostgreSQL |
| **Shared Package Build** | `pnpm --filter shared build` | **0** | **100% compile contracts** (`tsc`) |
| **API Typecheck** | `pnpm --filter api typecheck` | **0** | **0 errors** (`tsc --noEmit`) |
| **Web Typecheck** | `pnpm --filter web typecheck` | **0** | **0 errors** (`tsc --noEmit`) |
| **API Lint** | `pnpm --filter api lint` | **0** | **0 errors, 0 warnings** (`eslint`) |
| **Web Lint** | `pnpm --filter web lint` | **0** | **0 errors, 0 warnings** (`eslint`) |
| **API Unit Tests** | `pnpm --filter api test:unit` | **0** | **8 suites, 31 tests PASS (5.65s)** |
| **Web Unit Tests** | `pnpm --filter web test:unit` | **0** | **10 tests PASS (123ms)** |
| **Next.js Production Build** | `pnpm --filter web build` | **0** | **27 routes compiled** (`next build`), route `/admin/questions` tối ưu hóa tĩnh thành công |

---

## 4. BẢNG ĐỐI CHIẾU BẰNG CHỨNG THỰC TẾ 9 MODULE (STANDARDIZED EVIDENCE MATRIX)

| Module | Route Admin | Route Người dùng | API Endpoint | Bảng DB (PostgreSQL) | Bằng chứng Kiểm thử Thực tế | Trạng thái Nghiệm thu |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **M1: User & Excel Import** | `/admin/users` | `/login`, `/change-password` | `/api/v1/admin/users/import`, `/api/v1/auth/login` | `users`, `user_import_batches`, `audit_logs` | Integration test `users-admin-crud.integration.spec.ts` (PASS), Unit test auth | **FULL PASS** *(đã nghiệm thu)* |
| **M2: Media Library** | `/admin/media` | CDN / Tour 360° nhúng | `/api/v1/admin/media`, `/api/v1/storage/upload` | `media_assets`, `upload_tokens`, `audit_logs` | 15/15 Integration tests PASS: Sharp WebP 3 biến thể, không nuốt lỗi, bảo toàn token retry, default Panorama 2:1, hàng đợi tuần tự, bảo vệ toàn vẹn 4 quan hệ | **FULL PASS** *(đã nghiệm thu)* |
| **M3: Tour Studio 360°** | `/admin/virtual-tour` | `/campus` (Viewer 360°) | `/api/v1/admin/tour/nodes`, `/api/v1/public/tour` | `tour_nodes`, `tour_edges`, `hotspots`, `audit_logs` | Integration test `tour-studio-persistence.integration.spec.ts` (PASS), Three.js 360° verified | **FULL PASS** *(đã nghiệm thu)* |
| **M4: GIS & Locations** | `/admin/locations` | `/map`, `/locations` | `/api/v1/admin/locations`, `/api/v1/public/locations` | `locations`, `buildings`, `floors`, `location_types`, `audit_logs` | 13/13 Integration tests `location-gis-crud.integration.spec.ts` (PASS) | **FULL PASS** *(đã nghiệm thu)* |
| **M5: Content CMS (News)** | `/admin/news` | `/news`, `/news/[slug]` | `/api/v1/admin/news`, `/api/v1/public/news` | `news_articles`, `media_assets`, `users`, `audit_logs` | 16/16 Integration tests PASS: P2002 conflict, concurrency race conditions, zero static fallback, 2x2 pagination, strict 404, soft delete | **FULL PASS** *(đã nghiệm thu)* |
| **M6: Question Bank** | `/admin/questions` | Ngân hàng câu hỏi trắc nghiệm | `/api/v1/admin/questions` | `question_bank_items`, `users`, `audit_logs` | **10/10 Integration tests PASS**: CRUD đầy đủ, validation nghiêm ngặt, lọc theo topic/độ khó/trạng thái, phân trang server, tải template Excel, preview phát hiện trùng lặp 2 tầng, commit transaction nguyên tử, xuất báo cáo lỗi, RBAC 403 | **FULL PASS** *(đủ điều kiện đóng nghiệm thu)* |
| **M7: Quiz & Results** | `/admin/events` (Results tab) | `/portal` (Làm bài) | `/api/v1/portal/quiz/submit`, `/api/v1/admin/quiz/results` | `quiz_attempts`, `xp_ledgers`, `users` | Integration test submit điểm & XP ledger PASS. *Chuẩn bị triển khai tiếp theo.* | **PARTIAL** |
| **M8: Event & QR Check-in** | `/admin/events` (Tickets tab) | `/events` (Nhận vé OD26) | `/api/v1/open-day/register`, `/api/v1/admin/events/checkin` | `open_day_events`, `open_day_sessions`, `event_participations` | Unit test định dạng vé chuẩn OD26 & QR verify (PASS). | **PARTIAL** |
| **M9: Student & Parent Portal** | Quản trị hồ sơ & vé | `/portal`, `/parent` | `/api/v1/portal/profile`, `/api/v1/portal/tickets` | `users`, `parent_student_links`, `event_participations` | Unit test phân luồng định tuyến và bảo vệ route (PASS). | **PARTIAL** |

---

## 5. ĐỀ XUẤT CHO BƯỚC TIẾP THEO
Kính đề nghị Tech Lead nghiệm thu **FULL PASS chính thức cho Module 6 (Question Bank Management)** và chỉ đạo yêu cầu kỹ thuật chi tiết cho **Module 7: Quiz Engine & Scoring (Tạo bài thi từ Question Bank, đếm ngược thời gian, chấm điểm phía server, ghi nhận QuizAttempt và tự động cộng XP Ledger)**.
