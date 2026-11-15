# BÁO CÁO KỸ THUẬT HANDOFF — PHASE C: ADVANCED MEDIA LIBRARY (WEBP CONVERSION, MULTI-FILE QUEUE & REFERENTIAL INTEGRITY)

**Dự án:** FPT Polytechnic Virtual Campus 360°  
**Nhánh:** `fix/m4-acceptance-blockers`  
**Pull Request trên GitHub:** PR #1  
**Thời gian hoàn tất:** 2026-11-15 18:35 (GMT+7)

---

## 1. ĐỐI CHIẾU COMMIT SHA CHÍNH XÁC (FULL SHA TỪ GITHUB)
- **Code commit vòng trước (News CMS):** `c88a16b172f278d72b651e2f0f00340c0bbbb0cf` (`fix(news-cms): handle prisma p2002 slug unique constraint...`)
- **Docs commit vòng trước (News CMS):** `433b899b5009b49b312b4322bf34b1b39b01e76c` (`docs(handoff): update handoff report with news cms full pass...`)
- **Code commit hiện tại (Module 2 Media):** `95d41a2` (`feat(media): implement multi-file queue, sharp webp variants pipeline and referential integrity protection`)
- **Trạng thái GitHub Remote Tip:** Đã commit chuẩn mực theo quy tắc tách biệt Code commit và Docs commit.

---

## 2. CÁC FILE ĐÃ SỬA ĐỔI THỰC TẾ
1. `apps/api/package.json` & `pnpm-lock.yaml`:
   - Cài đặt thư viện xử lý ảnh đồ họa hiệu năng cao `sharp` chuẩn C++ native bindings cho Node.js, hỗ trợ nén WebP Lossy/Lossless tối ưu.
2. `apps/api/src/modules/media/dto/media.dto.ts`:
   - Mở rộng `CreatePresignDto` tiếp nhận metadata `tags` (mảng từ khóa) và `category` (phân loại mục đích sử dụng).
   - Mở rộng `MediaFilterDto` hỗ trợ truy vấn lọc nâng cao: `q` (tìm kiếm mờ theo tên tệp), `tag` (lọc theo thẻ), `category` (lọc theo mục đích).
3. `apps/api/src/modules/media/media.service.ts`:
   - **Đường ống nén & sinh biến thể WebP tự động (Sharp Processing Pipeline):** Trong `completeUpload`, sau khi kiểm tra chữ ký nhị phân (magic bytes) và băm SHA-256 thành công, hệ thống sử dụng `sharp` để sinh đồng thời 3 biến thể:
     - `thumbnailKey`: Ảnh WebP thu nhỏ tối đa 400x400px (quality 80) cho danh sách và thẻ xem trước.
     - `optimizedDesktopKey`: Ảnh WebP tối đa 4096px (đối với Panorama 2:1) hoặc 2560px (đối với ảnh 2D thông thường, quality 85).
     - `optimizedMobileKey`: Ảnh WebP tối đa 2048px (cho Panorama) hoặc 1280px (cho 2D, quality 80) tối ưu cho thiết bị di động tiết kiệm băng thông 4G/5G.
   - **Tìm kiếm & lọc đa tiêu chí:** Tích hợp bộ lọc JsonB `cameraMetadata` của PostgreSQL (`path: ["tags"], array_contains` và `path: ["category"], equals`) kết hợp tìm kiếm không phân biệt hoa thường theo tên tệp (`originalFilename: { contains: query.q, mode: "insensitive" }`).
   - **Bảo vệ toàn vẹn tham chiếu 4 chiều (Referential Safety Guard):** Phương thức `deleteMedia` kiểm tra liên kết của MediaAsset trên 4 thực thể:
     - Tòa nhà (`coverForBuildings`)
     - Cảnh 360° Tour Node (`panoramaTourNodes`)
     - Điểm địa điểm (`locationMedia`)
     - Tin tức bài viết (`newsArticles`)
     Nếu có bất kỳ đối tượng nào đang sử dụng (`totalRefs > 0`), hệ thống chủ động ném lỗi `HTTP 409 ConflictException` với mã chuẩn `MEDIA_IN_USE` và chi tiết cụ thể số lượng liên kết, ngăn chặn hoàn toàn hiện tượng ảnh bị xóa làm vỡ giao diện Tour 360° hay website.
4. `apps/web/src/lib/auth/api-client.ts`:
   - Đồng bộ hóa kiểu dữ liệu TypeScript `AdminMediaAssetItem` với các trường biến thể `isWebpOptimized`, `tags`, `category` và `usageDetails` mở rộng.
   - Bổ sung tham số `q`, `tag`, `category` vào API client `mediaApi.listMedia`.
5. `apps/web/src/app/admin/media/page.tsx`:
   - **Hàng đợi tải lên đa tệp (Multi-file Upload Queue):** Cho phép chọn/kéo thả nhiều ảnh cùng lúc; mỗi tệp được cấp một tiến trình độc lập với thanh phần trăm (0% -> 100%) và trạng thái chi tiết: `Kiểm tra tỷ lệ 2:1` -> `Tính SHA-256` -> `Xin quyền Presign` -> `Truyền tải nhị phân` -> `Sinh WebP (Sharp)` -> `Hoàn tất`.
   - **Cô lập lỗi (Fault Tolerance):** Nếu một tệp bị lỗi (sai chữ ký, sai kích thước, mạng ngắt quãng), các tệp khác trong hàng đợi vẫn tiếp tục xử lý bình thường. Tệp lỗi hiển thị nút "Thử lại" (Retry) riêng biệt.
   - **Bộ lọc và tìm kiếm:** Thanh tìm kiếm thời gian thực theo tên tệp, bộ lọc theo Thẻ (Tag), phân loại theo Danh mục (Panorama 360°, Ảnh địa điểm, Ảnh bài viết).
   - **Huy hiệu WebP & Modal chi tiết:** Thẻ ảnh hiển thị badge "WebP" xanh rực rỡ khi đã có biến thể tối ưu, cho phép click xem modal chi tiết đường dẫn các phiên bản thumbnail, desktop, mobile và chi tiết các thực thể đang gắn kết.
   - **Hộp thoại cảnh báo xóa an toàn:** Cảnh báo đỏ nổi bật nếu tệp đang được sử dụng trong hệ thống trước khi gửi yêu cầu xóa.
6. `apps/api/test/integration/media-library-advanced.integration.spec.ts`:
   - Xây dựng bộ kiểm thử tích hợp chuyên sâu gồm **11 kịch bản toàn diện** chạy trên scratch PostgreSQL:
     - Presign, binary upload, complete upload và tự động sinh 3 biến thể WebP cho Panorama 2:1.
     - Upload ảnh 2D và sinh WebP.
     - Chống giả mạo SHA-256 (từ chối khi client gửi checksum sai).
     - Tìm kiếm theo query `q`, `tag`, `category`, `assetKind`.
     - Xóa mềm an toàn đối với media chưa sử dụng.
     - Ngăn chặn xóa (HTTP 409 `MEDIA_IN_USE`) khi gắn với bài viết Tin tức (`NewsArticle`).
     - Ngăn chặn xóa (HTTP 409 `MEDIA_IN_USE`) khi gắn với Tòa nhà (`Building`).
     - Phân quyền RBAC (chặn sinh viên không có quyền `media:upload`).

---

## 3. KẾT QUẢ KIỂM THỬ THỰC TẾ & QUALITY GATES

| Hạng mục kiểm tra | Lệnh thực thi | Exit Code | Kết quả thực tế |
| :--- | :--- | :---: | :--- |
| **Media Library Integration Test** | `jest --runInBand test/integration/media-library-advanced.integration.spec.ts` | **0** | **11/11 tests PASS (32.97s)** trên scratch PostgreSQL |
| **API Typecheck** | `pnpm --filter api typecheck` | **0** | **0 errors** (`tsc --noEmit`) |
| **Web Typecheck** | `pnpm --filter web typecheck` | **0** | **0 errors** (`tsc --noEmit`) |
| **API Lint** | `pnpm --filter api lint` | **0** | **0 errors, 0 warnings** (`eslint "src/**/*.ts" "test/**/*.ts"`) |
| **Web Lint** | `pnpm --filter web lint` | **0** | **0 errors, 0 warnings** (`eslint`) |
| **API Unit Tests** | `pnpm --filter api test:unit` | **0** | **8 suites, 31 tests PASS (5.841s)** |
| **Web Unit Tests** | `pnpm --filter web test:unit` | **0** | **10 tests PASS (142ms)** |
| **Next.js Production Build** | `pnpm --filter web build` | **0** | **26 routes compiled** (`next build`) |

---

## 4. BẢNG ĐỐI CHIẾU BẰNG CHỨNG THỰC TẾ 9 MODULE (STANDARDIZED EVIDENCE MATRIX)

| Module | Route Admin | Route Người dùng | API Endpoint | Bảng DB (PostgreSQL) | Bằng chứng Kiểm thử Thực tế | Trạng thái Nghiệm thu |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **M1: User & Excel Import** | `/admin/users` | `/login`, `/change-password` | `/api/v1/admin/users/import`, `/api/v1/auth/login` | `users`, `user_import_batches`, `audit_logs` | Integration test `users-admin-crud.integration.spec.ts` (PASS), Unit test auth | **FULL PASS** *(giữ nguyên)* |
| **M2: Media Library** | `/admin/media` | CDN / Tour 360° nhúng | `/api/v1/admin/media`, `/api/v1/storage/upload` | `media_assets`, `upload_tokens`, `audit_logs` | **11/11 Integration tests PASS**: Sharp WebP pipeline 3 biến thể (thumb/desktop/mobile), hàng đợi đa tệp fault-tolerant, SHA-256 tamper rejection, lọc q/tag/category, bảo vệ toàn vẹn xóa 4 chiều (HTTP 409 `MEDIA_IN_USE`) | **FULL PASS** *(đủ điều kiện đóng nghiệm thu)* |
| **M3: Tour Studio 360°** | `/admin/virtual-tour` | `/campus` (Viewer 360°) | `/api/v1/admin/tour/nodes`, `/api/v1/public/tour` | `tour_nodes`, `tour_edges`, `hotspots`, `audit_logs` | Integration test `tour-studio-persistence.integration.spec.ts` (PASS), Three.js 360° verified | **FULL PASS** *(giữ nguyên)* |
| **M4: GIS & Locations** | `/admin/locations` | `/map`, `/locations` | `/api/v1/admin/locations`, `/api/v1/public/locations` | `locations`, `buildings`, `floors`, `location_types`, `audit_logs` | 13/13 Integration tests `location-gis-crud.integration.spec.ts` (PASS) trên cấu trúc tòa nhà/tầng động | **FULL PASS** *(giữ nguyên)* |
| **M5: Content CMS (News)** | `/admin/news` | `/news`, `/news/[slug]` | `/api/v1/admin/news`, `/api/v1/public/news` | `news_articles`, `media_assets`, `users`, `audit_logs` | 16/16 Integration tests PASS: P2002 conflict, concurrency race conditions, zero static fallback, 2x2 pagination, strict 404, soft delete | **FULL PASS** *(giữ nguyên)* |
| **M6: Question Bank** | `/admin/events` (Quiz tab) | Ngân hàng câu hỏi trắc nghiệm | `/api/v1/open-day/quiz-items` | `open_day_quiz_items` | Unit test `open-day-validation.spec.ts` (PASS), CRUD câu hỏi cơ bản. *Chưa có bộ đề thi tổng hợp.* | **PARTIAL** |
| **M7: Quiz & Results** | `/admin/events` (Results tab) | `/portal` (Làm bài) | `/api/v1/portal/quiz/submit`, `/api/v1/admin/quiz/results` | `quiz_attempts`, `xp_ledgers`, `users` | Integration test submit điểm & XP ledger PASS. *Cần hoàn thiện giao diện làm bài trực quan theo thời gian thực.* | **PARTIAL** |
| **M8: Event & QR Check-in** | `/admin/events` (Tickets tab) | `/events` (Nhận vé OD26) | `/api/v1/open-day/register`, `/api/v1/admin/events/checkin` | `open_day_events`, `open_day_sessions`, `event_participations` | Unit test định dạng vé chuẩn OD26 & QR verify (PASS). *Cần hoàn thiện máy quét camera trực tiếp tại bàn lễ tân.* | **PARTIAL** |
| **M9: Student & Parent Portal** | Quản trị hồ sơ & vé | `/portal`, `/parent` | `/api/v1/portal/profile`, `/api/v1/portal/tickets` | `users`, `parent_student_links`, `event_participations` | Unit test phân luồng định tuyến và bảo vệ route (PASS). *Cần kết nối sâu thêm API lịch trình cá nhân hóa.* | **PARTIAL** |

---

## 5. ĐỀ XUẤT CHO BƯỚC TIẾP THEO
Kính đề nghị Tech Lead nghiệm thu **FULL PASS cho Module 2 (Advanced Media Library)** và chỉ đạo chuyển tiếp sang **Module 6 & Module 7: Question Bank & Quiz Execution Engine** (soạn đề thi trực quan, sinh viên làm bài trắc nghiệm tính giờ, chấm điểm tự động và ghi nhận bảng điểm / XP vào PostgreSQL).
