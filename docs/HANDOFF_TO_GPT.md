# BÁO CÁO KỸ THUẬT HANDOFF — PHASE B: CONTENT CMS (NEWS CMS) REMEDIATION & STANDARDIZED EVIDENCE MATRIX

**Dự án:** FPT Polytechnic Virtual Campus 360°  
**Nhánh:** `fix/m4-acceptance-blockers`  
**Pull Request trên GitHub:** PR #1  
**Thời gian hoàn tất:** 2026-11-15 17:50 (GMT+7)

---

## 1. HEAD TRƯỚC VÀ SAU
- **HEAD trước:** `dde1b444747ebc7ff1ce466b04f6916fb0821598`
- **HEAD commit code:** `0d4f494f1c1f54117b43ecf459ba08b3a017b2b7`
- **Trạng thái Git Remote:** Đã đẩy và đồng bộ 100% với `origin/fix/m4-acceptance-blockers` (không force-push, không rebase).

---

## 2. COMMIT SHA MỚI
```text
0d4f494 fix(news-cms): remove static fallback, implement public pagination, strict 404, soft-delete slug policy and rbac alignment
```

---

## 3. CÁC FILE ĐÃ SỬA ĐỔI VÀ TÁI CẤU TRÚC (10 FILES)
1. **Backend Service (`apps/api/src/modules/news/news-admin.service.ts`):**
   - Loại bỏ hoàn toàn kiểu `any`, thay thế bằng `Prisma.NewsArticleWhereInput`.
   - Cập nhật chính sách trùng lặp slug: Kiểm tra trên TOÀN BỘ cơ sở dữ liệu (kể cả bản ghi đã xóa mềm `deletedAt !== null`). Nếu trùng bản ghi đã xóa mềm, trả về HTTP 409 ConflictException thông báo rõ ràng (`Slug "..." đã từng được sử dụng bởi bài viết đã xóa lưu trữ "...". Vui lòng chọn slug khác.`), ngăn chặn triệt để lỗi cơ sở dữ liệu `P2002` (500 Internal Server Error).
2. **Backend Public Service (`apps/api/src/modules/news/news-public.service.ts`):**
   - Thay thế `any` bằng `Prisma.NewsArticleWhereInput`.
   - Lọc bài viết nghiêm ngặt: Chỉ đọc các bài có `status: PUBLISHED` và `deletedAt: null`.
3. **Backend Tour & Users Service (`apps/api/src/modules/tour/location-admin.service.ts`, `apps/api/src/modules/users-rbac/admin-users.controller.ts`, `apps/api/src/modules/users-rbac/users-import.service.ts`):**
   - Dọn sạch biến không sử dụng (`Prisma`, `seenUsernames`, v.v.) và định kiểu tường minh `UserImportPreviewRowDto[]` cho API báo cáo lỗi, đưa ESLint backend về 0 lỗi.
4. **Integration Test Suite (`apps/api/test/integration/news-cms.integration.spec.ts`):**
   - Mở rộng từ 12 lên 14 kịch bản kiểm thử độc lập chạy trực tiếp trên PostgreSQL cô lập:
     - Kịch bản 8: Chặn trùng slug bài viết đang hoạt động bằng HTTP 409 Conflict.
     - Kịch bản 12: Chặn tái sử dụng slug của bài viết đã xóa mềm bằng HTTP 409 Conflict.
     - Kịch bản 13: Kiểm chứng cơ chế phân trang `page` và `limit` của Public API (`page=1&limit=2` vs `page=2&limit=2`, không trùng lặp phần tử, kiểm tra `total`).
     - Kịch bản 14: Kiểm chứng phân quyền RBAC đa tầng: Chặn truy cập không token (HTTP 401), chặn sinh viên không có quyền `campus:write` (HTTP 403), cho phép Admin quản trị (HTTP 200).
5. **Frontend Public API Client (`apps/web/src/lib/public/news-public-api.ts`):**
   - Loại bỏ hoàn toàn biến tĩnh `CAMPUS_GUIDE_ARTICLES`. Không dùng dữ liệu tĩnh làm fallback ngầm định. Mọi truy vấn chuyển trực tiếp về backend PostgreSQL. Nếu API trả về lỗi hoặc mạng gián đoạn, ném ngoại lệ thực tế để Next.js xử lý.
6. **Frontend Public News List (`apps/web/src/app/(public)/news/page.tsx`):**
   - Hỗ trợ phân trang chuẩn hóa qua SearchParams (`page`, `tag`).
   - Tích hợp giao diện phân trang tương tác (Trang trước, Trang sau, Bộ đếm trang).
   - Xử lý trạng thái lỗi thực sự (`ErrorState`) kèm nút "Tải lại trang" khi kết nối thất bại; hiển thị trạng thái rỗng (`EmptyState`) khi danh mục chưa có bài viết xuất bản.
7. **Frontend Public News Detail (`apps/web/src/app/(public)/news/[slug]/page.tsx`):**
   - Bắt lỗi chuẩn qua `ApiClientError` và HTTP status 404 để gọi hàm `notFound()` của Next.js, hiển thị trang 404 thực tế khi bài viết không tồn tại, đang là DRAFT hoặc đã bị xóa mềm.
8. **Frontend RBAC Routing (`apps/web/src/lib/auth/auth-routing.ts`):**
   - Điều chỉnh đồng bộ tiền tố `/admin/news` chỉ yêu cầu `anyOf: ["campus:write"]`, khớp 100% với `@RequirePermissions("campus:write")` ở backend NestJS.

---

## 4. BẰNG CHỨNG THỰC TẾ & XÁC MINH CÁC TIÊU CHÍ (ACCEPTANCE CRITERIA)

### 4.1. Loại bỏ hoàn toàn Static Fallback
- File `apps/web/src/lib/public/news-public-api.ts` đã gỡ bỏ hoàn toàn việc import `CAMPUS_GUIDE_ARTICLES`.
- Khi server backend ngắt kết nối hoặc trả về lỗi, trang `/news` hiển thị khối `ErrorState` báo lỗi kết nối máy chủ kèm nút thử lại, không tự tiện hiển thị mảng dữ liệu tĩnh giả mạo.

### 4.2. Public chỉ đọc bài PUBLISHED từ PostgreSQL
- Test case 3 & 4: Bài viết mới tạo ở trạng thái `DRAFT` không xuất hiện trong `GET /api/v1/public/news` và truy vấn trực tiếp slug trả về HTTP 404.
- Test case 5 & 6: Sau khi Admin gọi `POST /api/v1/admin/news/:id/publish`, bài viết ngay lập tức xuất hiện trên Public API với `publishedAt` được ghi nhận.
- Test case 10: Khi Admin gọi `POST /api/v1/admin/news/:id/unpublish`, bài viết quay về `DRAFT` và lập tức biến mất khỏi Public API.

### 4.3. HTTP 404 thực sự với bài không tồn tại
- Test case 4 & Next.js `notFound()`: Truy vấn bài không tồn tại, bài DRAFT, hoặc bài đã xóa mềm đều trả về đúng mã trạng thái HTTP 404.

### 4.4. Phân trang (Pagination) động
- Test case 13: Tạo 4 bài viết xuất bản. Gọi `GET /api/v1/public/news?page=1&limit=2` trả về 2 bài đầu tiên, gọi `page=2&limit=2` trả về 2 bài tiếp theo, không có sự trùng lặp phần tử giữa các trang.
- Frontend `/news` hỗ trợ tham số `?page=X&tag=Y`, có nút điều hướng "Trang trước" / "Trang sau" và disable trạng thái khi ở đầu/cuối danh sách.

### 4.5. Phân quyền RBAC (401 / 403 / 200)
- Test case 14:
  - Request không mang Bearer Token vào endpoint admin: Nhận HTTP 401 Unauthorized.
  - Request mang Token của sinh viên (Role `STUDENT`, không có quyền `campus:write`): Nhận HTTP 403 Forbidden.
  - Request mang Token của Super Admin / Staff có `campus:write`: Nhận HTTP 200 OK.
- Frontend route `/admin/news` được bảo vệ đồng bộ với rule `campus:write`.

### 4.6. Chính sách xử lý Slug và Xóa mềm
- Test case 8 & 12: Đảm bảo tính toàn vẹn của chỉ mục `news_articles_slug_key` trên PostgreSQL:
  - Thử tạo bài viết mới với slug trùng bài đang hoạt động: Trả về HTTP 409 Conflict.
  - Thử tạo bài viết mới với slug trùng bài đã xóa mềm (`deletedAt != null`): Trả về HTTP 409 Conflict kèm thông báo rõ ràng slug thuộc về bài lưu trữ, không bị lỗi máy chủ nội bộ 500.

---

## 5. KẾT QUẢ KIỂM THỬ VÀ QUALITY GATES

| Hạng mục kiểm tra | Lệnh thực thi | Exit Code | Kết quả thực tế |
| :--- | :--- | :---: | :--- |
| **News CMS Integration Test** | `jest ... news-cms.integration.spec.ts` | **0** | **14/14 tests PASS (25.227s)** trên scratch PostgreSQL |
| **GIS Location Integration Test** | `jest ... location-gis-crud.integration.spec.ts` | **0** | **13/13 tests PASS (28.847s)** trên scratch PostgreSQL |
| **API Typecheck** | `pnpm --filter api typecheck` | **0** | **0 errors** (`tsc --noEmit`) |
| **Web Typecheck** | `pnpm --filter web typecheck` | **0** | **0 errors** (`tsc --noEmit`) |
| **API Lint** | `pnpm --filter api lint` | **0** | **0 errors, 0 warnings** (`eslint`) |
| **Web Lint** | `pnpm --filter web lint` | **0** | **0 errors, 0 warnings** (`eslint`) |
| **API Unit Tests** | `pnpm --filter api test:unit` | **0** | **8 suites, 31 tests PASS** |
| **Web Unit Tests** | `pnpm --filter web test:unit` | **0** | **10 tests PASS** |
| **Next.js Production Build** | `pnpm --filter web build` | **0** | **30 routes compiled** (bao gồm dynamic `/news`, `/news/[slug]`, static `/admin/news`) |

---

## 6. BẢNG ĐỐI CHIẾU BẰNG CHỨNG THỰC TẾ 9 MODULE (STANDARDIZED EVIDENCE MATRIX)

| Module | Route Admin | Route Người dùng | API Endpoint | Bảng DB (PostgreSQL) | Bằng chứng Kiểm thử Thực tế | Trạng thái Nghiệm thu |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **M1: User & Excel Import** | `/admin/users` | `/login`, `/change-password` | `/api/v1/admin/users/import`, `/api/v1/auth/login` | `users`, `user_import_batches`, `audit_logs` | Integration test `users-admin-crud.integration.spec.ts` (PASS), Unit test auth | **FULL PASS** |
| **M2: Media Library** | `/admin/media` | CDN / Tour nhúng | `/api/v1/media/upload`, `/api/v1/media` | `media_assets` | Unit test: `local-storage.adapter.spec.ts` (PASS), API upload xác thực MIME/size. *Chưa có upload đồng thời nhiều file & WebP compression tự động.* | **PARTIAL** |
| **M3: Tour Studio 360°** | `/admin/virtual-tour` | `/campus` (Viewer 360°) | `/api/v1/admin/tour/nodes`, `/api/v1/public/tour` | `tour_nodes`, `tour_edges`, `hotspots`, `audit_logs` | Integration test `tour-studio-persistence.integration.spec.ts` (PASS), Browser test 360° | **FULL PASS** |
| **M4: GIS & Locations** | `/admin/locations` | `/map`, `/locations` | `/api/v1/admin/locations`, `/api/v1/public/locations` | `locations`, `buildings`, `floors`, `location_types`, `audit_logs` | 13/13 Integration tests `location-gis-crud.integration.spec.ts` (PASS) trên cấu trúc tòa nhà/tầng động và chống lệch tầng | **FULL PASS** |
| **M5: Content CMS (News)** | `/admin/news` | `/news`, `/news/[slug]` | `/api/v1/admin/news`, `/api/v1/public/news` | `news_articles`, `media_assets`, `users`, `audit_logs` | 14/14 Integration tests `news-cms.integration.spec.ts` (PASS), Không static fallback, phân trang động, strict 404, RBAC 401/403/200, soft-delete slug policy | **FULL PASS** |
| **M6: Question Bank** | `/admin/events` (Quiz tab) | Ngân hàng đề thi | `/api/v1/open-day/quiz-items` | `open_day_quiz_items` | Unit test `open-day-validation.spec.ts` (PASS), CRUD câu hỏi DB cơ bản. *Chưa có giao diện soạn đề thi tổng hợp.* | **PARTIAL** |
| **M7: Quiz & Results** | `/admin/events` (Results tab) | `/portal` (Làm bài) | `/api/v1/portal/quiz/submit`, `/api/v1/admin/quiz/results` | `quiz_attempts`, `xp_ledgers`, `users` | Integration test submit điểm & XP ledger PASS. *Cần hoàn thiện giao diện làm bài trực quan theo thời gian thực.* | **PARTIAL** |
| **M8: Event & QR Check-in** | `/admin/events` (Tickets tab) | `/events` (Nhận vé OD26) | `/api/v1/open-day/register`, `/api/v1/admin/events/checkin` | `open_day_events`, `open_day_sessions`, `event_participations` | Unit test định dạng vé chuẩn OD26 & QR verify (PASS). *Cần hoàn thiện máy quét camera trực tiếp tại bàn lễ tân.* | **PARTIAL** |
| **M9: Student & Parent Portal** | Quản trị hồ sơ & vé | `/portal`, `/parent` | `/api/v1/portal/profile`, `/api/v1/portal/tickets` | `users`, `parent_student_links`, `event_participations` | Unit test phân luồng định tuyến và bảo vệ route (PASS). *Cần kết nối sâu thêm API lịch trình cá nhân hóa.* | **PARTIAL** |

---

## 7. ĐỀ XUẤT CHO TECH LEAD (CHATGPT) CHO TASK TIẾP THEO
Toàn bộ yêu cầu remediation của **News Content CMS (M5)** và chuẩn hóa **Evidence Matrix 9 Module** đã hoàn tất 100%, vượt qua tất cả quality gates và đẩy lên nhánh `fix/m4-acceptance-blockers`.
Kính đề nghị Tech Lead:
1. Nghiệm thu **FULL PASS cho Module 5 (News Content CMS)**.
2. Chỉ đạo triển khai hạng mục tiếp theo: **Nâng cấp Media Library (M2)** (Hỗ trợ upload hàng loạt đa file, nén tự động WebP, gắn tag phân loại tài nguyên) để nâng cấp từ PARTIAL lên FULL PASS, làm bước đệm hoàn thiện hệ sinh thái Tour Studio 360°.
