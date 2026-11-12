# LỘ TRÌNH TRIỂN KHAI PHASE 2A → 2E — FPT POLYTECHNIC VIRTUAL CAMPUS 360°

- **Phiên bản:** 2A.2 (Aligned with `OD-01` → `OD-10`)
- **Trạng thái hiện tại (Post Phase 2A-1 Acceptance):** `Phase 2A-1 — Database Bootstrap` đã **`ACCEPTED`** (`1117e7a` → `605db97` → [`7e1753d`](../project-audit/PHASE_2A_1_FINAL_ACCEPTANCE_REPORT.md)). Trạng thái tiếp theo: **Chuẩn bị triển khai `Phase 2A-2 — Core Backend & Authentication`** (`apps/api/` hiện chưa tồn tại; `Phase 2A-2`, `Phase 2A-3` và `Phase 2B` chưa triển khai).
- **Điều kiện tiên quyết:** Bộ 5 tài liệu `docs/phase-2a/*` và hợp đồng `@fpt-campus/shared` (`packages/shared`) đã khóa đồng bộ theo `OD-01` → `OD-10` trước khi khởi tạo mã nguồn `apps/api` và `prisma/`.
- **Ràng buộc bảo toàn:** Giữ nguyên toàn bộ **19 route hiện tại** ở `apps/web`, bảo toàn trải nghiệm miễn phí không cần đăng nhập trên `/`, `/campus`, `/map`, `/locations`, `/events`, giữ `/games` & `/portal` tương thích (chưa xây Student/Parent Portal, chưa có Check-in QR hay XP/Leaderboard trong MVP), giữ `/news` & `OFFICIAL_CAMPUS_INFO` ở cấu hình web tĩnh (`OD-03` Phương án B), và giữ ẩn tab 3D WebGL khỏi MVP.

---

## 1. Biểu đồ phụ thuộc các Giai đoạn (Dependency Roadmap)

```mermaid
flowchart LR
    G0["Cổng Hợp đồng 2A.2\ndocs/phase-2a + @fpt-campus/shared\n(OD-01..OD-10 · DONE)"] --> P2A1["Phase 2A-1 — Database Bootstrap\n(ACCEPTED · 7e1753d)\nPostgreSQL 16, Prisma 6, Migrations & Seed"]
    P2A1 --> P2A2["Phase 2A-2 — Core Backend & Auth\n(TIẾP THEO — CHUẨN BỊ MỞ)\nNestJS Modular Monolith, Prisma + Shared,\nAuth/RBAC, StorageAdapter local & Public Read"]
    P2A2 --> P2A3["Phase 2A-3 — Business Modules\n(CHƯA TRIỂN KHAI)\nAdmin CRUD, FloorPlan, Panorama &\nNối Frontend"]
    P2A3 --> P2B["Phase 2B — Nâng cấp Studio UI\n(CHƯA TRIỂN KHAI)\nFloorPlan Interactive Drawer\n& Admin Studio 3 Vùng"]
    P2B --> P2C["Phase 2C\nNạp dữ liệu thật QTSC\n(Tòa nhà, Tầng, Mặt bằng, Ảnh chụp 360°)"]
    P2C --> P2D["Phase 2D\nKiểm thử tải, Bảo mật\n& Xuất bản Production"]
    P2D -. "Tùy chọn sau MVP" .-> P2E["Phase 3+ (Mở rộng)\nStudent Portal / Check-in QR / XP / 3D"]
```

---

## 2. Chi tiết từng Giai đoạn & Tiêu chí nghiệm thu (Acceptance Criteria)

### Phase 2A — Nền tảng Backend, CSDL, Media & Tour Engine (`apps/api`)
*Không mở rộng sang 3D WebGL, Student/Parent Portal (`/portal`), Check-in QR (`OD-05`), hay XP/Leaderboard (`OD-08`) trong MVP; phần tài khoản hỗ trợ đầy đủ 3 nhóm người dùng (`ADMIN`/`STAFF`, `STUDENT`/`PARENT` Open Day — đăng nhập bằng `username | email | phone` theo `OD-04`, và Khách tham quan tự do không cần tài khoản).*

> [!IMPORTANT]
> **Nguyên tắc phân kỳ triển khai chuẩn (Kiểm soát rủi ro Data -> Core -> Business, `OD-07` & `OD-10`):**  
> - **Phase 2A-1 chỉ dựng Database Bootstrap (PostgreSQL 16 + Prisma + Migrations + Seed):** Chưa khởi tạo `apps/api/`, chưa triển khai NestJS, Auth hay API handlers để tách bạch và xác minh toàn vẹn data model trước.  
> - **`TourNode` độc lập có ảnh panorama 2:1 hợp lệ được `PUBLISH` ở Phase 2A-2/2A-3 ngay cả khi chưa có `FloorPlan`** (`floor_plan_id = NULL`, không tạo mặt bằng giả — `OD-10`).  
> - **Không lưu ảnh panorama lớn trực tiếp vào PostgreSQL:** DB chỉ lưu object key / đường dẫn tham chiếu trong `media_assets` ở mọi phase.

1. **Phase 2A-1 — Database Bootstrap (`2–3 ngày` · Trạng thái: `ACCEPTED` tại [`7e1753d`](../project-audit/PHASE_2A_1_FINAL_ACCEPTANCE_REPORT.md))**
   - **Phạm vi:**
     - Chạy local **PostgreSQL 16** bằng Docker Compose (`postgres:16-alpine`, container `fpt_virtual_campus_db`, database `virtual_campus_360`, healthcheck dùng `${POSTGRES_USER}` & `${POSTGRES_DB}`).
     - Hoàn thiện environment configuration (`.env.example` và `.env` cục bộ không commit: `DATABASE_URL`, `POSTGRES_*`, `ADMIN_BOOTSTRAP_PASSWORD`, `STORAGE_DRIVER=local`, `WEB_ORIGIN`, `DATA_SOURCE`).
     - Khởi tạo Prisma và `prisma/schema.prisma` (`26` models, `17` enums) khớp `PHASE_2A_DATABASE_DESIGN.md` v2A.2.
     - Tạo SQL migrations (`20261111175635_init`) với đầy đủ **17 Prisma enums**, indexes, **partial unique indexes (`WHERE deleted_at IS NULL`) hiện diện thực sự trong file SQL migration** (trên `campuses`, `buildings`, `floors`, `locations`, `tour_nodes`, `users(username/email/phone)`, `open_day_events`), và **`hotspots` `CHECK` constraint (`SCENE_LINK <-> edge_id`) trong file SQL migration**.
     - Viết `prisma/seed.ts` idempotent theo đúng thứ tự khóa ngoại (tạo **01 tài khoản gốc duy nhất `admin`** đọc `ADMIN_BOOTSTRAP_PASSWORD` từ environment và băm bằng **Argon2id**, tuyệt đối không hardcode mật khẩu; seed dữ liệu phát triển QTSC gồm `5` tòa nhà Leaflet WGS84 + `routeWaypoints`, `6` địa điểm với `loc-the-thao.primary_node_id = NULL` theo `OD-02`, `5` `TourNode` với `floor_plan_id = NULL` theo `OD-10` và trạng thái **`DRAFT`** theo quyết định `D-02`, `11` metadata asset cục bộ trong `media_assets` [`5` AI placeholder panorama `is_preview_approved = false` + `6` ảnh `PHOTO_2D`], và dữ liệu `open_day_*`).
     - Kiểm tra migration, seed, reset/re-initialize (`prisma migrate reset` / `AC-08`) và database integrity qua `prisma/verify-db-integrity.ts` (`pnpm db:test`: `13/13 PASS`, gồm đối chiếu SHA-256 `11/11` asset trên đĩa và `14` ca test âm tính `AC-07-NEG`).
     - **Chưa khởi tạo `apps/api/`, chưa triển khai NestJS, Auth, `StorageAdapter` hoặc API handlers.**
   - **Đầu ra đã bàn giao:** `docker-compose.yml` (`postgres:16-alpine`), `.env.example`, `prisma/schema.prisma`, `prisma/migrations/20261111175635_init/*`, `prisma/seed.ts`, `prisma/verify-db-integrity.ts`, [`PHASE_2A_1_FINAL_ACCEPTANCE_REPORT.md`](../project-audit/PHASE_2A_1_FINAL_ACCEPTANCE_REPORT.md).
   - **Kết quả nghiệm thu (`Phase 2A-1`):** **`ACCEPTED`** (`1117e7a` → `605db97` → `7e1753d`; `R-01 → R-04` đã xử lý; `R-05` & `R-06` ghi nhận chuyển tiếp sang `2A-2`/`2C`; `apps/api/` chưa tồn tại).

2. **Phase 2A-2 — Core Backend & Authentication (`3–4 ngày` · Trạng thái: `CHUẨN BỊ TRIỂN KHAI — CHƯA BẮT ĐẦU`)**
   - **Phạm vi:**
     - Khởi tạo **NestJS Modular Monolith (`apps/api/`, prefix `/api/v1`)**.
     - Tích hợp Prisma Client và dùng chung types/DTO từ `@fpt-campus/shared` (**xử lý mapper hai chiều giữa `BuildingCategory` / `MapBuildingIconKey` trong `@fpt-campus/shared` và PostgreSQL enums theo `R-05`**).
     - Triển khai **`AuthModule`**, **`UsersRbacModule`**, **`AuditLogModule`**:
       - `POST /api/v1/auth/login` hỗ trợ `username | email | normalized phone` (**chuẩn hóa `users.phone` theo `E.164/VN` trước khi kiểm tra uniqueness và đăng nhập**), verify **Argon2id**.
       - Session/token lifecycle: Access JWT ngắn hạn (chỉ giữ RAM ở client), Refresh Token 64-byte quay vòng trong cookie `HttpOnly` (thu hồi toàn bộ `family_id` khi reuse attack), ép `403 PASSWORD_CHANGE_REQUIRED` khi `mustChangePassword === true`, hỗ trợ `/refresh`, `/logout`, `/me`, `/me/password`, `/activate/validate`, `/activate/complete` (**cấm `/register`**).
       - RBAC Guards & ghi `audit_logs` cho mọi thao tác xác thực/quản trị.
     - Triển khai **`StorageAdapter` local (`STORAGE_DRIVER=local`)** ánh xạ bộ ảnh QTSC cục bộ đã seed và `RATE_LIMIT_STORE=memory`.
     - Triển khai toàn bộ **Public Read APIs** theo contract đã khóa: `/api/v1/public/campus`, `/buildings/:slug`, `/buildings/:slug/floors`, `/locations`, `/locations/:slug`, `/tour/nodes`, `/tour/nodes/:slug`, `/events` (ẩn đáp án quiz), và `POST /api/v1/public/quiz/verify` (stateless). **Bảo đảm Public Tour API chỉ trả `TourNode` `PUBLISHED` (`deleted_at IS NULL`) kèm `panoramaAsset.isPreviewApproved = true` để ảnh AI placeholder chưa duyệt không lộ lên tour công khai (`D-02`).**
   - **Đầu ra:** Ứng dụng `apps/api/` chạy ổn định với `PostgreSQL 16`, Auth/RBAC, `StorageAdapter` local và toàn bộ Public Read endpoints.
   - **Tiêu chí nghiệm thu (Phase 2A-2):**
     1. `apps/api` build/typecheck sạch, nhập trực tiếp `@fpt-campus/shared`, xử lý mapper `BuildingCategory`/`MapBuildingIconKey`, kết nối PostgreSQL qua Prisma.
     2. Auth hoạt động chuẩn bảo mật: login qua `username`/`email`/`phone` (đã chuẩn hóa `phone`), bắt buộc đổi bootstrap password lần đầu, refresh rotation + reuse detection, không có `/auth/register`.
     3. Toàn bộ Public Read APIs trả đúng dữ liệu `PUBLISHED & deleted_at IS NULL` từ PostgreSQL (`loc-the-thao.primaryNodeSlug = null`, `quizItems` không lộ `correctIndex`/`explanation`, `0` rò rỉ `password_hash`/`token_hash`/`DRAFT` hay panorama placeholder `is_preview_approved = false`, không trình bày dev seed QTSC như dữ liệu đã đo đạc thực địa).
     4. `StorageAdapter` local phục vụ đúng đường dẫn media hạt giống mà chưa cần MinIO/Redis.

3. **Phase 2A-3 — Business Modules (`5–6 ngày` · Trạng thái: `CHUẨN BỊ SAU 2A-2 — CHƯA TRIỂN KHAI`)**
   - **Phạm vi:**
     - **CRUD Campus, Building, Floor, Location:** `/api/v1/admin/campus`, `/buildings`, `/floors`, `/locations` (hỗ trợ đầy đủ Leaflet WGS84 + metadata `OD-01`, `primaryNodeId NULLABLE` theo `OD-02`).
     - **Floor Plan, Panorama, TourNode, TourEdge, Hotspot & Media Pipeline:**
       - Tích hợp hàng đợi **Redis 7 + BullMQ** và mở rộng **`StorageAdapter`** sang tùy chọn **`S3/MinIO` (`STORAGE_DRIVER=s3`)** khi xử lý upload thực tế.
       - `MediaPipelineModule`: chặn ảnh chưa ghép/cylinder `5.77:1`, kiểm magic bytes, xuất 3 biến thể WebP (`4K/2K/Thumb 512`), duyệt preview 360°.
       - `FloorPlanModule`: hỗ trợ `PNG/JPG/SVG/PDF` (SVG sanitizer chống XSS, PDF 300 DPI sandbox), lưu version & snapshot, Ghost Overlay, và **`confirm-alignment` bắt buộc cập nhật đúng `tour_nodes.floor_plan_id = floorPlanId`**, `floor_norm_x/y`, `floors.active_floor_plan_id`, `floors.requires_floor_plan = true`.
       - `TourGraphModule`: tạo/sửa `TourNode`, **xóa mềm `TourNode` phải xử lý dọn `tour_edges` và `hotspots` trong cùng PostgreSQL transaction**, tạo hotspot hai chiều, Graph Validator 7 luật (gồm `VAL_UNPLACED_NODE` có điều kiện theo `OD-10`) và Publish (`NODE`/`FLOOR`/`BUILDING`).
     - **Open Day CMS & Admin Workflows:** CRUD `/api/v1/admin/events/*` (`events`, `sessions`, `faqs`, `quiz-items` theo `OD-03`, `OD-05`, `OD-08`), quản lý user & quy trình Import Excel/CSV 5 bước (chuẩn hóa `phone` trước check uniqueness, dedup `email -> phone`, báo `IDENTITY_CONFLICT`, cấm lưu file/tên gốc) và phát hành lời mời.
     - **Kết nối Frontend với API thật theo từng module (`apps/web`):** Chuyển dần từ fallback mock sang gọi NestJS API qua Adapter (`DATA_SOURCE=api`) cho từng nhóm (`/map`, `/locations`, `/campus`, `/events`, `/games`, `/login`, `/activate`, `/admin/*`) mà vẫn giữ nguyên 19 routes & ranh giới MVP.
   - **Đầu ra:** Hệ thống Business APIs đầy đủ, Media/FloorPlan workers, Pre-Publish Validator, và `apps/web` kết nối trực tiếp Backend API theo từng module.
   - **Tiêu chí nghiệm thu (Phase 2A-3):**
     1. Xóa mềm `TourNode` dọn sạch `tour_edges` & `hotspots` trong cùng transaction; `confirm-alignment` cập nhật đúng `tour_nodes.floor_plan_id`; `VAL_UNPLACED_NODE` tuân thủ `OD-10` (không bắt `FloorPlan` giả).
     2. Upload thử `SVG` chứa `<script>` bị tước sạch, `PDF` nhiều trang render đúng trang, ảnh `5.77:1` bị chặn và ảnh `2:1` tạo đủ 3 bản WebP không lưu nhị phân vào PostgreSQL.
     3. Chuẩn hóa `phone` khi check uniqueness/import Excel (`IDENTITY_CONFLICT` khi lệch user), Open Day CMS CRUD & stateless quiz đồng bộ DB.
     4. Frontend (`apps/web`) bật `DATA_SOURCE=api` hoạt động thông suốt từng module đã nối; `pnpm build`, `typecheck`, `lint` PASS (`exit 0`), 19 routes trả HTTP `200`.

---

### Phase 2B — Nâng cấp UI Chuyên sâu (`Admin Studio 3 Vùng` & `Floor Plan Interactive Drawer`, `3–4 ngày` · Trạng thái: `CHƯA TRIỂN KHAI`)
*(Sau khi `Phase 2A-3` đã nối xong API thật theo từng module cho các màn hiện hữu, `Phase 2B` tập trung hoàn thiện phần giao diện nâng cấp mới:)*
1. **Nâng cấp Public `/campus` & `/locations/[slug]` (Floor Plan Drawer):**
   - Giữ nguyên trải nghiệm Three.js `PanoramaStage.tsx` (kéo xoay + tự xoay sau 3s).
   - Bổ sung **Floor Plan Interactive Drawer / Overlay** bên cạnh bản đồ GIS: chuyển tầng (`Tầng 1, 2, 3...`), xem chấm vị trí đang đứng `[0..1]`, bấm vào phòng hoặc thang máy/cầu thang để nhảy thẳng sang panorama tương ứng.
2. **Nâng cấp UI `/admin/locations`, `/admin/media`, `/admin/virtual-tour`:**
   - Giao diện chọn trang `Floor Plan` (`PNG/JPG/SVG/PDF`) + đặt tọa độ `[0..1]` và **Ghost Overlay** trực quan khi thay mặt bằng.
   - Bố cục **Admin Studio 3 Vùng** hoàn chỉnh + thao tác kiểm duyệt & xuất bản trực quan.

---

### Phase 2C — Thu thập & Nạp Dữ liệu Thực tế Khuôn viên QTSC (`Theo tiến độ chụp của Trường`)
1. Chụp thực địa theo SOP `PHASE_2A_PANORAMA_WORKFLOW.md` (hành lang, cửa phòng, bên trong Lab, thang máy, cầu thang).
2. Xử lý hậu kỳ xóa tripod nadir, làm mờ thông tin cá nhân/màn hình nhạy cảm.
3. Admin tạo tòa nhà/tầng thật, upload bản vẽ mặt bằng từng tầng, gắn tọa độ `TourNode`, nối hotspot hai chiều và chạy Validator kiểm duyệt trước khi xuất bản.

---

### Phase 2D — Kiểm thử Tải, Bảo mật & Go-Live (`3–4 ngày`)
- Chạy `owasp` security checklist (kiểm tra Upload XSS SVG, Path Traversal, Brute-Force Login Rate Limit, JWT Refresh Reuse, IDOR trên `/admin/*`).
- Kiểm tra hiệu năng tải Panorama `web_4k.webp` / `web_2k.webp` & Floor Plan qua CDN trên Desktop và Mobile.
- Thiết lập backup tự động PostgreSQL + Object Storage.

---

### Phase 2E (Tùy chọn sau MVP — Phase 3+)
- Đánh giá bổ sung **3D Dollhouse** (nếu trường thực hiện scan LiDAR/Matterport hoặc dựng `.glb` kiến trúc chuẩn), **Định vị đường đi ngắn nhất giữa 2 phòng xuyên tầng (BFS Pathfinding trên `TourGraph`)**, và xem xét mở **Student/Parent Portal (`/portal`)** sau khi hoàn tất nền tảng Auth & Open Day ở Phase 3.

---

## 3. Phân tích Rủi ro & Biện pháp giảm thiểu

| Rủi ro | Khả năng | Tác động | Biện pháp kiểm soát thiết kế sẵn |
| :--- | :--- | :--- | :--- |
| Ảnh chụp 360° thực tế quá nặng (20–40MB JPEG) làm chậm tải trình duyệt | Cao | Cao | Bắt buộc Worker nén ra 2 mức WebP (`web_4k` 1.5–3MB cho Desktop, `web_2k` 500–900KB cho Mobile) + prefetch node hàng xóm. |
| File PDF mặt bằng CAD có nhiều layer/vector phức tạp | Trung bình | Cao | Render PDF sang ảnh WebP 300 DPI trên Server Worker có timeout 15s & giới hạn pixel, không để trình duyệt client tự parse PDF. |
| Thay thế bản vẽ mặt bằng mới làm lệch toàn bộ điểm ghim cũ | Trung bình | Cao | Tọa độ chuẩn hóa `[0..1]` + lưu lịch sử `version` + snapshot tọa độ cũ + **luôn bật `needsRealignment = true` và Ghost Overlay bắt Admin xác nhận trước Publish** (không bỏ qua dù cùng tỷ lệ). |
| Nhân sự vận hành nối thiếu đường quay ra khỏi phòng trên Tour 360° | Cao | Trung bình | Graph Validator chặn node cô lập/ngõ cụt (`VAL_DEAD_END_NODE`), cung cấp nút **"Tạo liên kết 2 chiều tự động"**, đồng thời hỗ trợ ngoại lệ `isTerminalApproved` / `isOneWayApproved` cho lối đi một chiều hợp lệ. |
| Upload SVG mặt bằng chứa mã độc XSS | Thấp | Rất cao | Magic-byte check + SVG Sanitizer nghiêm ngặt + phục vụ qua domain/CDN tĩnh với CSP chặt chẽ. |

---

## 4. Bảng Đối chiếu Nhất quán Liên tài liệu (Consistency Matrix)

| Chủ đề | `DATABASE_DESIGN` | `API_CONTRACT` | `PANORAMA_WORKFLOW` | `SYSTEM_ARCH` & `ROADMAP` |
| :--- | :--- | :--- | :--- | :--- |
| **GIS Campus Map (`OD-01`)** | `campuses.origin_point_json`, `buildings.lat/lng NOT NULL`, `route_waypoints_json`, `map_icon_key`, `gis_x/y NULLABLE` | `GET /public/campus` trả full Leaflet WGS84 + `originPoint` | Tách biệt Hệ tọa độ 1 (WGS84 Leaflet) khỏi `[0..1]` | Chuẩn hóa Leaflet + OpenStreetMap (FixNear) |
| **Tên thực thể 360° & `OD-02`** | `tour_nodes` (`TourNode`); `Location (1) — (N) TourNode`; `loc-the-thao.primary_node_id = NULL` | `/api/v1/public/tour/nodes` & `/:slug` + `primaryNodeSlug: string \| null` | `TourNode` 2:1, không gắn chéo giả | Nhất quán tên `TourNode` trên cả Web & API |
| **Optional `FloorPlan` (`OD-10`)** | `floors.requires_floor_plan`, `tour_nodes.floor_plan_id NULLABLE` | `POST .../publish` hỗ trợ `NODE` scope độc lập; `confirm-alignment` set `floor_plan_id` | `VAL_UNPLACED_NODE` chỉ chặn khi Floor đã có `active_floor_plan_id` / `requires_floor_plan = true` | Cho phép seed QTSC & node 360° thuần xuất bản không cần mặt bằng giả |
| **Open Day & Static CMS (`OD-03`, `OD-05`, `OD-08`)** | `open_day_events`, `open_day_sessions`, `open_day_faqs`, `open_day_quiz_items` (không `CHECKED_IN`, không XP) | `GET /public/events` (ẩn `correctIndex`), `POST /public/quiz/verify`, Admin CRUD `/admin/events/*` | Không tạo bảng/API Check-in hay XP | `/news` & `OFFICIAL_CAMPUS_INFO` giữ static config; Quiz public không tài khoản |
| **Auth & Phone (`OD-04`)** | Partial unique `WHERE deleted_at IS NULL` trên `username`, `email`, `phone` (E.164/VN) | `POST /auth/login` hỗ trợ `username \| email \| phone`; Excel dedup `email -> phone` | Cấm dedup theo `(fullName, phone)` hay `fullName` | `ADMIN_BOOTSTRAP_PASSWORD`, Dual Provisioning, không `/register` |
| **Shared Contract (`OD-09`)** | `@fpt-campus/shared` khớp 100% Prisma schema v2A.2 | Typed Request/Response & `ApiEnvelope` | Dùng chung Validation Error Codes | `packages/shared` build `./dist/*` & tích hợp vào `apps/web` |
| **Infrastructure (`OD-07`)** | Schema, partial unique & CHECK migration cho PostgreSQL 16 (`Phase 2A-1`) | `StorageAdapter` local ở `2A-2`, nâng lên upload/`S3_MINIO` ở `2A-3` | Xử lý Sharp/Poppler ở Worker Phase `2A-3` | `2A-1` chỉ DB Bootstrap; `2A-2` NestJS + Auth + Public Read; `2A-3` Business Modules + Redis/MinIO + Nối Web |

---

## 5. Checklist Trạng thái Kiến trúc & Thực thi Phase 2A (Cập nhật Post Phase 2A-1 Acceptance)

- [x] **Cổng Hợp đồng & Scope (`v2A.2`):** Đồng bộ `OD-01` → `OD-10` trên 5 tài liệu `docs/phase-2a/*`, chuẩn hóa Leaflet WGS84 (`OD-01`), `Location (1) — (N) TourNode` & `loc-the-thao.primary_node_id = NULL` (`OD-02`), optional `FloorPlan` (`OD-10`), `open_day_*` CMS (`OD-03`, `OD-05`, `OD-08`), SQL partial unique/CHECK (`OD-04`, `OD-06`), `@fpt-campus/shared` (`OD-09`), và ranh giới `2A-1` → `2A-2` → `2A-3` (`OD-07`).
- [x] **Phase 2A-1 — Database Bootstrap (`ACCEPTED` · `1117e7a` → `605db97` → [`7e1753d`](../project-audit/PHASE_2A_1_FINAL_ACCEPTANCE_REPORT.md)):** PostgreSQL 16 + Prisma 6 (`26` models, `17` enums), migration SQL (`partial unique WHERE deleted_at IS NULL`, `hotspots CHECK`), idempotent seed (R-01..R-04 xử lý; D-01 chốt `17` enums; D-02 đặt 5 AI placeholder panorama `is_preview_approved = false` & 5 `TourNode` `DRAFT`), `pnpm db:test` `13/13 PASS`, `apps/api/` chưa tồn tại.
- [ ] **Phase 2A-2 — Core Backend & Authentication (`TIẾP THEO — CHUẨN BỊ TRIỂN KHAI`):** Khởi tạo `apps/api/` (NestJS Modular Monolith + Prisma + `@fpt-campus/shared`), mapper hai chiều `BuildingCategory` / `MapBuildingIconKey` (`R-05`), Auth/RBAC (`username | email | normalized phone`, Argon2id, JWT + HttpOnly Refresh Rotation), `LocalStorageAdapter`, và Public Read APIs (chỉ trả `TourNode PUBLISHED` & không lộ placeholder chưa duyệt).
- [ ] **Phase 2A-3 — Business Modules & Kết nối Frontend (`CHƯA TRIỂN KHAI`):** Admin CRUD, Media/FloorPlan workers (`Redis/BullMQ`, tùy chọn `S3/MinIO`), Graph Validator 7 luật & chuyển đổi `apps/web` (`DATA_SOURCE=api`) giữ nguyên `19` routes.
- [ ] **Phase 2B — Admin Studio UI (`CHƯA TRIỂN KHAI`):** Studio 3 vùng & `FloorPlan Interactive Drawer`.
- [ ] **Phase 2C & 2D — Dữ liệu thực địa QTSC & Go-Live (`CHƯA TRIỂN KHAI`):** Xác minh tọa độ thực địa (`R-06`), chụp & duyệt ảnh 360°×180° thật thay toàn bộ 5 AI placeholders (`D-02`).
