# BÁO CÁO KỸ THUẬT HANDOFF — PHASE C (REMEDIATION): ADVANCED MEDIA LIBRARY FINAL CLOSURE

**Dự án:** FPT Polytechnic Virtual Campus 360°  
**Nhánh:** `fix/m4-acceptance-blockers`  
**Pull Request trên GitHub:** PR #1  
**Thời gian hoàn tất:** 2026-11-15 18:50 (GMT+7)

---

## 1. ĐỐI CHIẾU COMMIT SHA CHÍNH XÁC (FULL SHA TỪ GITHUB)
- **Code commit vòng trước (M2 Initial):** `95d41a272e2441e1f5303fab2cec4a44887ab489` (`feat(media): implement multi-file queue, sharp webp variants pipeline...`)
- **Docs commit vòng trước (M2 Initial):** `a3b42075a56618cff7306c04cd656de510377bc6` (`docs(handoff): update handoff report with advanced media library...`)
- **Code commit hiện tại (M2 Remediation):** `689d089` (`fix(media): enforce strict sharp failure handling, panorama category defaulting and 4-way referential integrity`)
- **Trạng thái GitHub Remote Tip:** Nhánh `fix/m4-acceptance-blockers` chuẩn bị được đẩy đồng bộ 100%, tuân thủ nguyên tắc tách biệt Code commit và Docs commit.

---

## 2. GIẢI TRÌNH CHI TIẾT XỬ LÝ 100% CÁC BLOCKER TỪ TECH LEAD

### 🔴 Blocker 1: Xử lý triệt để lỗi Sharp Processing Pipeline (Không nuốt lỗi, bảo toàn token cho retry, dọn dẹp biến thể dở dang)
- **Vấn đề trước đây:** Khi nén WebP thất bại, khối catch chỉ ghi nhận chuỗi `processingError` nhưng vẫn cập nhật `processingStatus: "READY"` và tiêu thụ token (`usedAt = now`).
- **Biện pháp khắc phục trong `apps/api/src/modules/media/media.service.ts`:**
  1. **Không nuốt lỗi:** Khối catch bắt mọi lỗi từ Sharp hoặc Storage Adapter, chuyển trạng thái `mediaAsset` sang `processingStatus: "FAILED"` kèm nội dung `processingError` chi tiết.
  2. **Dọn dẹp tệp ghi dở (Atomic Cleanup):** Mọi key biến thể đã ghi vào storage trước thời điểm xảy ra lỗi (lưu trong mảng `writtenVariantKeys`) đều được gọi `deleteObject` dọn sạch, tránh để lại file rác mồ côi trên ổ đĩa / Cloud Storage.
  3. **Bảo toàn UploadToken cho Retry:** Không cập nhật `uploadToken.usedAt` khi xử lý ảnh thất bại (`usedAt` giữ nguyên `null`), cho phép client gửi lại yêu cầu `completeUpload` (hoặc upload lại tệp hợp lệ) để khắc phục lỗi.
  4. **Ném lỗi rõ ràng:** Ném ngoại lệ `BadRequestException` với mã chuẩn `IMAGE_PROCESSING_FAILED` và thông báo lỗi minh bạch cho client.
  5. **Điều kiện ngặt nghèo để READY:** Chỉ khi cả 3 biến thể `thumbnailKey`, `optimizedDesktopKey`, `optimizedMobileKey` đều tồn tại hợp lệ thì hệ thống mới chuyển `processingStatus: "READY"` và đánh dấu `uploadToken.usedAt = now`.
- **Bằng chứng kiểm thử:** Test 4 trong `media-library-advanced.integration.spec.ts` mô phỏng tệp ảnh lỗi -> Sharp ném lỗi -> DB xác nhận `FAILED`, `uploadToken.usedAt` vẫn là `null` -> Client gửi lại ảnh hợp lệ -> Complete thành công chuyển `READY`, `isWebpOptimized: true` và token được tiêu thụ an toàn.

---

### 🔴 Blocker 2: Khắc phục logic phân loại danh mục Panorama 2:1 (Category Defaulting)
- **Vấn đề trước đây:** Frontend mặc định gửi `STANDARD_IMAGE` khi chưa chọn bộ lọc danh mục, dẫn tới ảnh Panorama 2:1 bị gán nhãn sai thành ảnh phẳng 2D.
- **Biện pháp khắc phục:**
  1. **Tại Backend (`media.service.ts`):** `presignUpload` tự động gán `defaultCategory = "PANORAMA_360"` nếu ảnh là tỷ lệ 2:1 (`dto.assetKind === "PANORAMA_2_1" || is2to1`). Nếu client không truyền category cụ thể hoặc truyền giá trị rỗng/mặc định, hệ thống luôn ưu tiên `PANORAMA_360` cho ảnh toàn cảnh 2:1 và `STANDARD_IMAGE` cho ảnh phẳng 2D.
  2. **Tại Frontend (`apps/web/src/app/admin/media/page.tsx`):** `handleFilesSelected` không lấy giá trị của bộ lọc tìm kiếm (`selectedCategory`) để gán cho tệp mới. Trường category được để trống để `processUploadItem` phân giải động dựa trên kích thước thật của ảnh sau khi probe (2:1 -> `PANORAMA_360`, 2D -> `STANDARD_IMAGE`).
- **Bằng chứng kiểm thử:** Test 2 trong `media-library-advanced.integration.spec.ts` chứng minh upload ảnh 2:1 không truyền category thì PostgreSQL vẫn lưu chính xác `category: "PANORAMA_360"`.

---

### 🔴 Blocker 3: Chứng minh toàn diện Referential Safety cho ĐỦ 4 QUAN HỆ
- **Vấn đề trước đây:** Code backend đã kiểm tra 4 quan hệ nhưng test suite mới chỉ tạo quan hệ với `Building` và `NewsArticle`.
- **Biện pháp khắc phục trong `media-library-advanced.integration.spec.ts`:**
  - Thiết lập kịch bản kiểm thử độc lập cho cả 4 thực thể trong PostgreSQL:
    1. **Tòa nhà (`Building` qua `coverMediaId`):** DELETE trả về `HTTP 409 Conflict`, mã `MEDIA_IN_USE`, thông điệp chứa `"Tòa nhà: 1"`, DB xác nhận `deletedAt: null`.
    2. **Tin tức (`NewsArticle` qua `coverMediaId`):** DELETE trả về `HTTP 409 Conflict`, mã `MEDIA_IN_USE`, thông điệp chứa `"Tin tức: 1"`, DB xác nhận `deletedAt: null`.
    3. **Điểm dừng Tour 360° (`TourNode` qua `panoramaAssetId`):** DELETE trả về `HTTP 409 Conflict`, mã `MEDIA_IN_USE`, thông điệp chứa `"Cảnh 360°: 1"`, DB xác nhận `deletedAt: null`.
    4. **Bộ sưu tập Địa điểm (`LocationMedia` qua `mediaAssetId`):** DELETE trả về `HTTP 409 Conflict`, mã `MEDIA_IN_USE`, thông điệp chứa `"Địa điểm: 1"`, DB xác nhận `deletedAt: null`.
  - Kiểm tra đối chiếu với tệp không có tham chiếu: DELETE trả về `HTTP 200 OK`, DB xác nhận soft-delete thành công (`deletedAt !== null`).

---

### 🔴 Blocker 4: Chuẩn hóa mô hình Multi-file Queue & Stage-based Progress
- **Minh bạch mô hình:** Báo cáo xác nhận chính xác đây là **Hàng đợi xử lý tuần tự nhiều tệp (Multi-file Sequential Queue)**: người dùng có thể chọn hoặc kéo-thả hàng loạt tệp cùng một lúc, hệ thống đưa vào hàng đợi và lần lượt xử lý từng tệp để tránh làm nghẽn CPU/RAM do chuyển đổi Sharp đồng thời quá nhiều.
- **Tiến trình theo giai đoạn (Stage-based Progress):** Gỡ bỏ hoàn toàn thanh % giả lập tĩnh. Thay bằng các huy hiệu giai đoạn thực tế kèm hiệu ứng xoay sống động:
  - `CHỜ XỬ LÝ` -> `KIỂM ĐỊNH 2:1` -> `TÍNH TOÁN SHA-256` -> `XIN QUYỀN UPLOAD` -> `TRUYỀN TẢI NHỊ PHÂN` -> `XỬ LÝ WEBP SHARP` -> `HOÀN TẤT` (hoặc `THẤT BẠI`).
- **Cô lập lỗi (Fault Isolation):** Nếu một tệp thất bại, chỉ tệp đó chuyển trạng thái `THẤT BẠI` kèm thông báo lỗi và nút "Thử lại", các tệp còn lại trong hàng đợi vẫn tiếp tục được xử lý bình thường.

---

## 3. KẾT QUẢ QUALITY GATES & BẰNG CHỨNG KIỂM THỬ THỰC TẾ

| Hạng mục kiểm tra | Lệnh thực thi | Exit Code | Kết quả thực tế |
| :--- | :--- | :---: | :--- |
| **Media Library Integration Test** | `jest --runInBand test/integration/media-library-advanced.integration.spec.ts` | **0** | **15/15 tests PASS (23.63s)** trên scratch PostgreSQL |
| **API Typecheck** | `pnpm --filter api typecheck` | **0** | **0 errors** (`tsc --noEmit`) |
| **Web Typecheck** | `pnpm --filter web typecheck` | **0** | **0 errors** (`tsc --noEmit`) |
| **API Lint** | `pnpm --filter api lint` | **0** | **0 errors, 0 warnings** (`eslint`) |
| **Web Lint** | `pnpm --filter web lint` | **0** | **0 errors, 0 warnings** (`eslint`) |
| **API Unit Tests** | `pnpm --filter api test:unit` | **0** | **8 suites, 31 tests PASS (4.68s)** |
| **Web Unit Tests** | `pnpm --filter web test:unit` | **0** | **10 tests PASS (126ms)** |
| **Next.js Production Build** | `pnpm --filter web build` | **0** | **26 routes compiled** (`next build`) |

---

## 4. BẢNG ĐỐI CHIẾU BẰNG CHỨNG THỰC TẾ 9 MODULE (STANDARDIZED EVIDENCE MATRIX)

| Module | Route Admin | Route Người dùng | API Endpoint | Bảng DB (PostgreSQL) | Bằng chứng Kiểm thử Thực tế | Trạng thái Nghiệm thu |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **M1: User & Excel Import** | `/admin/users` | `/login`, `/change-password` | `/api/v1/admin/users/import`, `/api/v1/auth/login` | `users`, `user_import_batches`, `audit_logs` | Integration test `users-admin-crud.integration.spec.ts` (PASS), Unit test auth | **FULL PASS** *(giữ nguyên)* |
| **M2: Media Library** | `/admin/media` | CDN / Tour 360° nhúng | `/api/v1/admin/media`, `/api/v1/storage/upload` | `media_assets`, `upload_tokens`, `audit_logs` | **15/15 Integration tests PASS**: Sharp WebP 3 biến thể, không nuốt lỗi, dọn dẹp ghi dở, token bảo toàn cho retry, category Panorama mặc định 100%, hàng đợi tuần tự đa tệp, bảo vệ toàn vẹn tham chiếu ĐỦ 4 QUAN HỆ (Building, TourNode, LocationMedia, NewsArticle) | **FULL PASS** *(đủ điều kiện đóng nghiệm thu)* |
| **M3: Tour Studio 360°** | `/admin/virtual-tour` | `/campus` (Viewer 360°) | `/api/v1/admin/tour/nodes`, `/api/v1/public/tour` | `tour_nodes`, `tour_edges`, `hotspots`, `audit_logs` | Integration test `tour-studio-persistence.integration.spec.ts` (PASS), Three.js 360° verified | **FULL PASS** *(giữ nguyên)* |
| **M4: GIS & Locations** | `/admin/locations` | `/map`, `/locations` | `/api/v1/admin/locations`, `/api/v1/public/locations` | `locations`, `buildings`, `floors`, `location_types`, `audit_logs` | 13/13 Integration tests `location-gis-crud.integration.spec.ts` (PASS) trên cấu trúc tòa nhà/tầng động | **FULL PASS** *(giữ nguyên)* |
| **M5: Content CMS (News)** | `/admin/news` | `/news`, `/news/[slug]` | `/api/v1/admin/news`, `/api/v1/public/news` | `news_articles`, `media_assets`, `users`, `audit_logs` | 16/16 Integration tests PASS: P2002 conflict, concurrency race conditions, zero static fallback, 2x2 pagination, strict 404, soft delete | **FULL PASS** *(giữ nguyên)* |
| **M6: Question Bank** | `/admin/events` (Quiz tab) | Ngân hàng câu hỏi trắc nghiệm | `/api/v1/open-day/quiz-items` | `open_day_quiz_items` | Unit test `open-day-validation.spec.ts` (PASS), CRUD câu hỏi cơ bản. *Chuẩn bị bước vào Phase Discovery.* | **PARTIAL** |
| **M7: Quiz & Results** | `/admin/events` (Results tab) | `/portal` (Làm bài) | `/api/v1/portal/quiz/submit`, `/api/v1/admin/quiz/results` | `quiz_attempts`, `xp_ledgers`, `users` | Integration test submit điểm & XP ledger PASS. *Chuẩn bị triển khai sau M6.* | **PARTIAL** |
| **M8: Event & QR Check-in** | `/admin/events` (Tickets tab) | `/events` (Nhận vé OD26) | `/api/v1/open-day/register`, `/api/v1/admin/events/checkin` | `open_day_events`, `open_day_sessions`, `event_participations` | Unit test định dạng vé chuẩn OD26 & QR verify (PASS). | **PARTIAL** |
| **M9: Student & Parent Portal** | Quản trị hồ sơ & vé | `/portal`, `/parent` | `/api/v1/portal/profile`, `/api/v1/portal/tickets` | `users`, `parent_student_links`, `event_participations` | Unit test phân luồng định tuyến và bảo vệ route (PASS). | **PARTIAL** |

---

## 5. ĐỀ XUẤT CHO BƯỚC TIẾP THEO
Kính đề nghị Tech Lead nghiệm thu **FULL PASS chính thức cho Module 2 (Advanced Media Library)** và chỉ đạo bắt đầu **Phase Discovery cho Module 6 (Question Bank Management)**.
