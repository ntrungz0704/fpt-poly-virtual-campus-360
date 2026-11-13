# M3B PRE-IMPLEMENTATION REVIEW & TECHNICAL INVENTORY
**Dự án:** FPT Polytechnic Virtual Campus 360° (CVPM Quang Trung - QTSC, Quận 12)  
**Tài liệu:** `docs/project-audit/M3B_PRE_IMPLEMENTATION_REVIEW.md`  
**Ngày thực hiện:** 13/11/2026 (Local Time)  
**Vai trò:** Principal Technical Lead & Software Architect  
**Trạng thái:** Pre-Implementation Discovery (Read-Only, Zero Code Mutation)

---

## 1. LÀM RÕ VÀ HIỆU CHỈNH 5 ĐIỂM CHƯA NHẤT QUÁN TỪ BÁO CÁO STATUS

### 1.1. Con số Tiến độ Tổng thể "58.5%"
- **Vấn đề:** Báo cáo trước đưa ra con số ước tính 58.5% nhưng chưa giải thích rõ phương pháp tính.
- **Đối soát kỹ thuật:**
  - Trong các dự án phần mềm theo tiêu chuẩn Enterprise, việc gán một tỷ lệ phần trăm đơn lẻ cho toàn bộ monorepo (Frontend + Backend + DB + DevOps) khi chưa có Story Point đo lường chi tiết thường mang tính cảm tính (heuristic) và dễ gây ngộ nhận.
  - **Khẳng định lại:** Chưa thể xác định một con số phần trăm duy nhất có cơ sở toán học chặt chẽ cho toàn dự án. Thay vào đó, tiến độ phải được báo cáo định lượng theo từng tầng kiến trúc và số lượng Acceptance Criteria đã vượt qua kiểm thử tự động:
    - **Database Layer:** **100%** schema Phase 2A/M1 (27 models, 18 enums, 2 migrations, 14/14 checks `pnpm db:test` PASS).
    - **Backend API Layer:** **75%** (8 feature modules, 33 endpoints hoạt động, 14 suites / 47 tests Jest PASS; còn thiếu Admin Location/Tour Studio CRUD).
    - **Auth & Session Security:** **100%** Phase 2B (12/12 AC PASS, 5/5 Playwright E2E tests PASS trên Chromium thật).
    - **Media Storage (M3A):** **100%** (S3 & Local Storage Adapters, Magic Bytes, SHA-256 đối soát, `/admin/media` kết nối thật).
    - **Frontend Public Experience:** **30%** (Giao diện 20 routes hoàn thiện, nhưng 17/20 routes vẫn chạy mock `campus-data.ts`, chỉ có 3 routes `/login`, `/change-password`, `/admin/media` chạy API thật).
    - **Production DevOps:** **30%** (Docker Compose PostgreSQL hoạt động, chưa có Dockerfile Web/API, Nginx SSL, CI/CD).

### 1.2. Số Lượng Backend Modules
- **Vấn đề:** Báo cáo trước ghi "7 module nghiệp vụ", cần đối chiếu chính xác `AppModule` và thư mục `src/modules/`.
- **Đối soát mã nguồn thực tế tại `apps/api/src/`:**
  - Thư mục `apps/api/src/modules/` có đúng **8 thư mục con**:
    1. `audit-log` (`AuditLogModule`)
    2. `auth` (`AuthModule`)
    3. `health` (`HealthModule`)
    4. `media` (`MediaModule` — bổ sung trong M3A)
    5. `open-day` (`OpenDayModule` — hoàn tất trong M2)
    6. `public` (`PublicModule`)
    7. `storage` (`StorageModule`)
    8. `users-rbac` (`UsersRbacModule`)
  - Tầng hạ tầng dùng chung (`src/common/adapters/` và `src/config/`):
    9. `PrismaModule` (Global Database Provider)
    10. `AppConfigModule` (Zod Environment Config)
    11. `ThrottlerModule` (Rate Limiting)
  - **Kiểm tra đăng ký trong `apps/api/src/app.module.ts` (dòng 27-46):**
    Cả 8 modules trong `src/modules/` cùng `PrismaModule` và `ThrottlerModule` đều được `import` đầy đủ vào `AppCoreModule`. Không có module nào bị bỏ sót hay đăng ký ảo.

### 1.3. RBAC: 5 Vai trò Mô tả vs. 3 Bản ghi Role trong Database
- **Vấn đề:** Tại sao tài liệu mô tả 5 vai trò (`SUPER_ADMIN`, `CAMPUS_ADMIN`, `EVENT_OPERATOR`, `CONTENT_STAFF`, `STUDENT`) nhưng cơ sở dữ liệu `roles` chỉ có đúng 3 bản ghi?
- **Đối soát kỹ thuật giữa Schema, Seed và Logic phân quyền:**
  - Trong `prisma/schema.prisma` và `packages/shared/src/auth.ts`:
    - `UserType` là một Enum phân loại chủ thể: `ADMIN`, `STAFF`, `STUDENT`, `PARENT`.
    - `RoleCode` là mã quyền hạn quản trị Admin: `"SUPER_ADMIN" | "TOUR_EDITOR" | "EVENT_OPERATOR"`.
  - Trong file `prisma/seed.ts` (dòng 72-88), danh sách nạp ban đầu (`ROLES_DATA`) chỉ khởi tạo 3 vai trò quản trị nội bộ:
    1. `SUPER_ADMIN` (Toàn quyền hệ thống).
    2. `TOUR_EDITOR` (Biên tập viên Tour 360° & Mặt bằng — tương đương `CAMPUS_ADMIN` trong tài liệu phân tích).
    3. `EVENT_OPERATOR` (Điều phối viên Sự kiện Open Day).
  - Người dùng thuộc nhóm `STUDENT` hoặc `PARENT` là người dùng cuối tham gia Open Day, được phân loại qua trường `user.user_type = 'STUDENT'`. Họ **không có bản ghi trong bảng `user_roles`** vì họ không nắm giữ bất kỳ quyền quản trị (`permissions`) nào trong khu vực `/admin/*`.
  - Nhóm `CONTENT_STAFF`: Hiện chưa có module Tin tức trong Backend nên chưa được seed vào bảng `roles`.
  - **Kết luận:** Việc Database chỉ có 3 Role records là **hoàn toàn chính xác theo thiết kế seed hiện tại**. Báo cáo trước đã nhầm lẫn giữa khái niệm `UserType` (loại người dùng) và `Role` (vai trò quản trị RBAC).

### 1.4. Trạng thái Triển khai S3 / Cloudflare R2 & Thông số Môi trường
- **Vấn đề:** Adapter đám mây đã hoàn thành đến đâu? Driver nào đang chạy và thông tin xác thực ra sao?
- **Đối soát mã nguồn thực tế:**
  - `S3StorageAdapter` (`apps/api/src/modules/storage/s3-storage.adapter.ts`): Đã được lập trình hoàn chỉnh với `@aws-sdk/client-s3` và `@aws-sdk/s3-request-presigner`, hỗ trợ đầy đủ các phương thức `putObject`, `getObject`, `deleteObject`, `getPresignedUploadUrl`, và `getMetadata`.
  - **Storage Driver đang kích hoạt:** Trong file `.env` hiện tại, cấu hình là:
    ```env
    STORAGE_DRIVER=local
    ```
  - **Thông tin Cloud Credentials:** Hoàn toàn **chưa được cấu hình** trong `.env` cục bộ (các biến `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET_NAME`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` đang để trống). Hệ thống đang chạy 100% trên `LocalStorageAdapter` lưu tại ổ đĩa cục bộ (`uploads/`).
  - **Kết luận:** Code adapter S3/R2 đã sẵn sàng tích hợp (Production-ready code), nhưng môi trường phát triển hiện tại đang chạy driver `local`.

### 1.5. Hiệu chỉnh Cách Diễn đạt An ninh (Security Claims Calibration)
Để đảm bảo tính khách quan và chuẩn mực kỹ thuật, các khẳng định an ninh được hiệu chỉnh như sau:
1. *Về XSS:* Không dùng từ "triệt tiêu hoàn toàn XSS". Hiệu chỉnh thành: **"Việc lưu trữ access token trong bộ nhớ RAM (in-memory) loại bỏ nguy cơ token bị đọc trộm từ `localStorage`/`sessionStorage` khi có lỗ hổng XSS lưu trữ. Tuy nhiên, ứng dụng vẫn cần tuân thủ Content Security Policy và cơ chế mã hóa DOM của React để ngăn chặn các hành vi tấn công XSS khác."**
2. *Về Argon2id:* Không dùng từ "kháng lại hoàn toàn tấn công vét cạn". Hiệu chỉnh thành: **"Argon2id là giải pháp băm mật khẩu memory-hard chuẩn hóa cao, gia tăng chi phí tính toán đối với tấn công vét cạn bằng phần cứng GPU/ASIC, kết hợp cùng chính sách kiểm soát độ dài mật khẩu tối thiểu 12 ký tự."**
3. *Về Magic Bytes:* Không gọi là "quét mã độc" (malware scanning). Hiệu chỉnh thành: **"Cơ chế kiểm định Magic Bytes nhị phân (JPEG `FF D8 FF`, PNG `89 50 4E 47`, WebP `RIFF..WEBP`) là tầng xác thực định dạng tệp (Format Integrity Check), ngăn chặn hành vi giả mạo đuôi file và MIME type, nhưng không thay thế cho phần mềm quét mã độc/antivirus chuyên dụng."**

---

## 2. DISCOVERY & ĐÁNH GIÁ KỸ THUẬT CHO MILESTONE M3B

Milestone M3B có nhiệm vụ: **Nối 4 route công khai (`/campus`, `/map`, `/locations`, `/locations/[slug]`) từ dữ liệu tĩnh `campus-data.ts` sang API máy chủ thật của `PublicModule`.**

### 2.1. Phát hiện Quan trọng: Trạng thái DRAFT của Tour Nodes trong Cơ sở Dữ liệu
Khi kiểm tra bảng `tour_nodes` trong cơ sở dữ liệu `virtual_campus_360`, phát hiện:
- Cả 5 bản ghi `TourNode` trong seed hiện tại có:
  ```json
  "status": "DRAFT",
  "panoramaAsset": { "isPreviewApproved": false, "processingStatus": "READY" }
  ```
- Trong khi đó, endpoint `GET /api/v1/public/tour/nodes` tại `PublicService.listTourNodes()` có bộ lọc bảo vệ nghiêm ngặt:
  ```typescript
  where: {
    status: PublishStatus.PUBLISHED,
    deletedAt: null,
    panoramaAsset: { isPreviewApproved: true }
  }
  ```
- **Hệ quả kỹ thuật:** Nếu Frontend gọi trực tiếp `GET /api/v1/public/tour/nodes` ngay bây giờ, API sẽ trả về mảng rỗng `[]` vì chưa có node nào được duyệt `PUBLISHED` và `isPreviewApproved=true`!
- **Giải pháp cho M3B:** Trước khi nối Frontend `/campus`, cần có bước kiểm tra hoặc cập nhật trạng thái xuất bản cho 5 điểm chụp mẫu trong seed (`status: PUBLISHED`, `isPreviewApproved: true`) để API trả dữ liệu hợp lệ.

---

### 2.2. Danh Sách Endpoint & Hợp Đồng Dữ Liệu (Contracts)

| Route Frontend | Endpoint Backend | Query / Params | DTO Phản Hồi (@fpt-campus/shared) | Mục đích dữ liệu |
|---|---|---|---|---|
| `/campus` | `GET /api/v1/public/tour/nodes` | Không | `TourNodeSummaryDto[]` | Danh sách 5 điểm chụp 360° |
| `/campus?scene=:slug` | `GET /api/v1/public/tour/nodes/:slug` | `slug` (path) | `PublicTourNodeDetailDto` | Cảnh hiện tại, hotspots, ảnh panorama 2:1 |
| `/map` | `GET /api/v1/public/campus` | Không | `PublicCampusResponseDto` | Tọa độ QTSC, danh sách 5 tòa nhà |
| `/map` | `GET /api/v1/public/buildings/:slug` | `slug` (path) | `PublicBuildingDetailDto` | Chi tiết tòa nhà, danh sách tầng, drawer |
| `/locations` | `GET /api/v1/public/locations` | `?building=&category=&q=` | `PublicLocationSummaryDto[]` | Danh sách địa điểm có bộ lọc |
| `/locations/[slug]` | `GET /api/v1/public/locations/:slug` | `slug` (path) | `PublicLocationDetailDto` | Chi tiết phòng, thư viện ảnh, liên kết tour |

---

### 2.3. Bảng Đối Soát Data Mapping (Schema Differences)

#### A. Trình xem 360° (`/campus` - `VirtualTourViewer` & `PanoramaStage`)
- **Dữ liệu mock cũ (`campus-data.ts`):**
  - Khóa: `id` (e.g. `'cong-chao-qtsc'`), `title`, `panoramaUrl`, `initialView: { yaw, pitch, fov }`.
  - Hotspot: `{ id, targetSceneId, yaw, pitch, label, tooltip, type: 'scene' | 'info' }`.
- **Dữ liệu API thật (`PublicTourNodeDetailDto`):**
  - Khóa: `node.id` (UUID), `node.slug` (e.g. `'cong-chao-qtsc'`), `node.title`, `node.panoramaUrl`.
  - Góc nhìn: `node.initialYaw`, `node.initialPitch`, `node.initialFov`.
  - Hotspot: `hotspots` mảng chứa:
    - `id`: UUID.
    - `hotspotType`: `"SCENE_LINK" | "INFO" | "QUIZ_TRIGGER"`.
    - `targetNodeSlug`: Chuỗi slug đích (thay cho `targetSceneId`).
    - `yaw`, `pitch`, `title`, `body`.
- **Cần xử lý chuyển đổi (Adapter Mapper):** Tạo hàm mapper chuyển đổi `PublicTourNodeDetailDto` sang định dạng `TourSceneItem` mà `PanoramaStage.tsx` yêu cầu, đặc biệt ánh xạ `targetNodeSlug` vào luồng chuyển cảnh khi click hotspot.

#### B. Bản đồ GIS (`/map` - `CampusGISMap`)
- **Dữ liệu mock cũ:**
  - `CAMPUS_BUILDINGS`: mảng chứa `code`, `coords: [lat, lng]`, `vietnameseName`, `floorsCount`, `roomsCount`.
  - `QTSC_ORIGIN_POINT`: tọa độ cứng Cổng 1 QTSC `[10.853039, 106.626243]`.
- **Dữ liệu API thật (`PublicCampusResponseDto`):**
  - `campus.originLat`, `campus.originLng`: Tọa độ gốc khuôn viên trả từ DB thật.
  - `buildings`: mảng chứa `id`, `code`, `slug`, `name`, `shortName`, `lat`, `lng`, `category`, `nodeCount`, `locationCount`.
- **Cần xử lý chuyển đổi:** Cập nhật `CampusGISMap.tsx` nhận danh sách tòa nhà và tọa độ gốc từ API response thay vì import từ `campus-data.ts`.

#### C. Danh mục Địa điểm (`/locations` - `LocationsExplorer`)
- **Dữ liệu mock cũ:**
  - Lọc offline trên mảng `CAMPUS_LOCATIONS` (6 items).
- **Dữ liệu API thật (`PublicLocationSummaryDto[]`):**
  - Endpoint `GET /api/v1/public/locations` đã hỗ trợ sẵn query params phía máy chủ: `?building=...&category=...&q=...`.
- **Cần xử lý chuyển đổi:**
  - `LocationsExplorer.tsx` chuyển sang gọi API với debounce search input và bộ lọc phía máy chủ hoặc nạp danh sách ban đầu rồi lọc client-side mượt mà.
  - Xử lý trạng thái Loading (Skeleton UI) và Error state khi máy chủ không phản hồi.

#### D. Chi tiết Địa điểm (`/locations/[slug]`)
- **Dữ liệu mock cũ:**
  - Gọi `generateStaticParams()` dựa trên mảng tĩnh `CAMPUS_LOCATIONS`.
- **Dữ liệu API thật (`PublicLocationDetailDto`):**
  - Gọi `publicApi.getLocationBySlug(slug)` từ Server Component.
  - Bao gồm `gallery` (mảng ảnh `MediaGalleryItemDto`) và `tourNodes` liên kết.
  - Xử lý `notFound()` chuẩn của Next.js khi API trả lỗi HTTP 404.

---

### 2.4. Danh Sách File Dự Kiến Cần Thay Đổi Cho M3B

1. **Thư viện API Client:**
   - `apps/web/src/lib/public/public-api.ts` (Tạo mới): Đóng gói toàn bộ các hàm gọi API công khai (`getCampus`, `getBuilding`, `listLocations`, `getLocationBySlug`, `listTourNodes`, `getTourNodeBySlug`).
   - `apps/web/src/lib/auth/api-client.ts` (Export thêm helper hoặc tái sử dụng `getApiBaseUrl`).
2. **Module Tour 360°:**
   - `apps/web/src/app/(immersive)/campus/page.tsx`: Fetch danh sách tour nodes và chi tiết node từ API máy chủ.
   - `apps/web/src/components/tour/VirtualTourViewer.tsx`: Nhận props từ dữ liệu API thật hoặc fetch dữ liệu động, xử lý fallback khi chưa có dữ liệu.
3. **Module Bản đồ GIS:**
   - `apps/web/src/app/(immersive)/map/page.tsx`: Truyền dữ liệu campus & buildings thật vào component.
   - `apps/web/src/components/map/CampusGISMap.tsx`: Tiếp nhận dữ liệu tòa nhà từ API, giữ nguyên tính toán cự ly Haversine mượt mà.
4. **Module Địa điểm:**
   - `apps/web/src/app/(public)/locations/page.tsx`: Fetch dữ liệu danh mục từ API `GET /api/v1/public/locations`.
   - `apps/web/src/components/locations/LocationsExplorer.tsx`: Sử dụng dữ liệu API và quản lý trạng thái loading/error.
   - `apps/web/src/app/(public)/locations/[slug]/page.tsx`: Fetch dữ liệu chi tiết từ `GET /api/v1/public/locations/:slug`.
5. **Kiểm tra Dữ liệu Seed (Nếu cần thiết):**
   - Đảm bảo 5 TourNodes và Panorama Assets có trạng thái `PUBLISHED` và `isPreviewApproved: true` trong Database để API trả dữ liệu hợp lệ.

---

### 2.5. Acceptance Criteria Cho Milestone M3B

- **AC-M3B-01 (Tour 360° API):** Trang `/campus` nạp danh sách điểm chụp từ `GET /api/v1/public/tour/nodes`. Trình xem Three.js hiển thị ảnh panorama 2:1 từ cơ sở dữ liệu thật; chuyển cảnh mượt mà khi click hotspot.
- **AC-M3B-02 (GIS Map API):** Trang `/map` nạp dữ liệu tọa độ gốc và 5 tòa nhà từ `GET /api/v1/public/campus` & `GET /api/v1/public/buildings/:slug`. Hiển thị đầy đủ marker và drawer thông tin.
- **AC-M3B-03 (Locations List API):** Trang `/locations` nạp 6 địa điểm từ `GET /api/v1/public/locations`, bộ lọc tòa nhà và chuyên khoa hoạt động chính xác.
- **AC-M3B-04 (Location Detail API):** Trang `/locations/[slug]` hiển thị đầy đủ chi tiết phòng học, thư viện ảnh và liên kết mở Tour 360° tương ứng từ `GET /api/v1/public/locations/:slug`.
- **AC-M3B-05 (Fallback & Error States):** Tất cả các trang xử lý an toàn trạng thái mạng yếu (Loading skeleton), lỗi kết nối API (Error toast / Retry button), và trả 404 chuẩn khi nhập slug sai.
- **AC-M3B-06 (Zero Regression):** Không làm ảnh hưởng đến các luồng đã kiểm chứng trong Phase 2B (Auth) và M3A (Media); toàn bộ test suites (`pnpm typecheck`, `pnpm --filter web lint`, Playwright E2E) tiếp tục PASS 100%.

---

## 3. KẾT LUẬN & ĐIỀU KIỆN TIÊN QUYẾT CHO IMPLEMENTATION

1. **Kết luận về tính sẵn sàng:** Milestone M3B **ĐÃ ĐỦ ĐIỀU KIỆN KỸ THUẬT ĐỂ TRIỂN KHAI** về mặt kiến trúc, schema và endpoint.
2. **Lưu ý cốt lõi trước khi code:** Phải giải quyết điểm nghẽn trạng thái `DRAFT` của 5 `TourNode` trong Database (chuyển sang `PUBLISHED` và `isPreviewApproved=true`) để endpoint `GET /api/v1/public/tour/nodes` không trả về mảng rỗng.
3. **Tuân thủ quy tắc:** Không thực hiện bất kỳ thay đổi mã nguồn nào trong phiên kiểm toán này. Chờ phê duyệt của Mentor để kích hoạt implementation.
