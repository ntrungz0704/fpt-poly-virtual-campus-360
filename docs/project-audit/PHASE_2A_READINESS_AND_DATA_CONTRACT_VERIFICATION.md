# PHASE 2A READINESS & DATA CONTRACT VERIFICATION REPORT

**Ngày kiểm toán:** 12/11/2026  
**Phạm vi kiểm toán:** Read-only Readiness & Data Contract Audit trước khi khởi tạo PostgreSQL, Prisma, `apps/api` (NestJS) và đồng bộ `@fpt-campus/shared`  
**Git Baseline xác minh:** Nhánh `main`, HEAD commit `9062c587b0b48b26fc69d6fa1c5e49032f2b5628` *(clean working tree trước khi tạo báo cáo này)*  
**Mục tiêu:** Đánh giá độ khớp giữa đặc tả Phase 2A (`docs/phase-2a/*`), quyết định sản phẩm & bảo mật (`docs/decisions/*`, `docs/architecture/*`), cấu hình hạ tầng (`docker-compose.yml`, `.env.example`, workspace), hợp đồng dùng chung (`packages/shared`), và mã nguồn thực tế đang chạy tại `apps/web/src/**`.

> [!IMPORTANT]
> **Ranh giới kiểm toán (Read-Only):** Quá trình kiểm toán chỉ đọc mã nguồn, cấu hình và tài liệu; không sửa source code `apps/web`, không sửa tài liệu hiện có, không chỉnh `docker-compose.yml` hay `.env*`, không sửa `packages/shared`, không khởi tạo `prisma/` hay `apps/api/`, và không khởi chạy PostgreSQL/Redis/MinIO container. Mọi xung đột chưa được chốt được đánh dấu rõ để **Chủ dự án phê duyệt** trước khi viết code Database/Backend.

---

## 1. Executive Summary

Dự án **Virtual Campus FPT Polytechnic (QTSC Quận 12)** đang ở trạng thái **Frontend Prototype hoàn chỉnh trên dữ liệu tĩnh (Backend Level `S0`)**, với **19 routes** Next.js 16 App Router đã qua dọn bảo mật Phase 1 (`prototype-auth.ts` và plaintext credentials đã gỡ bỏ, `/login` là màn hình chờ Auth Phase 3, `/admin/*` gắn banner Preview nội bộ, `/portal` và `/games` giữ tương thích theo quyết định MVP). Hạ tầng monorepo `pnpm` (`store-dir=.pnpm-store`) hoạt động ổn định, `docker-compose.yml` đã có khung `postgres:16-alpine`, và bộ 5 tài liệu `docs/phase-2a/*` đã giải quyết được các quyết định kiến trúc quan trọng nhất (**chuẩn hóa `TourNode` thay `tour_scenes`, tách `Location (1) — (N) TourNode`, tách 3 hệ tọa độ, Ghost Overlay versioning, Dual Provisioning không plaintext password, Import Excel 5 bước không lưu file gốc**).

Tuy nhiên, **dự án CHƯA SẴN SÀNG (`NO-GO` ngay lập tức)** để chạy `prisma migrate` hoặc viết code PostgreSQL/NestJS nếu dùng nguyên trạng bộ đặc tả hiện tại, do **7 nhóm lệch pha & thiếu hụt trọng yếu** được phát hiện qua đối chiếu chéo:

1. **Lệch kiến trúc bản đồ GIS giữa Tài liệu Phase 2A và Source Code thực tế (Critical Drift):** `CampusGISMap.tsx` và `campus-data.ts` đang vận hành bằng **Leaflet 1.9.4 + OpenStreetMap** với tọa độ WGS84 (`lat`, `lng`), `routeWaypoints`, `mapIconKey`, `addressNote`, `QTSC_ORIGIN_POINT` và **không sử dụng `gisX`/`gisY` ở runtime (`0` chỗ dùng)**. Ngược lại, `PHASE_2A_DATABASE_DESIGN.md` và `PHASE_2A_SYSTEM_ARCHITECTURE.md` vẫn thiết kế `/map` theo mô hình **SVG `gis_x/gis_y NOT NULL`**, để `lat/lng` là `NULLABLE` ("tương lai Leaflet"), thiếu hoàn toàn `routeWaypoints`, `mapIconKey`, `floorsLabel`, `highlights`, `QTSC_ORIGIN_POINT`, và lệch giá trị `category` (`service | sports` vs `facility`).
2. **Mâu thuẫn dữ liệu mẫu `CAMPUS_LOCATIONS` vs ràng buộc `Location (1) — (N) TourNode`:** Trong `campus-data.ts`, cả `loc-sanh-innovation` (`INNOVATION`) lẫn `loc-the-thao` (`SPORTS`) đều gán `sceneId: "cong-chao-qtsc"` (dạng `N Locations -> 1 Scene`), trái chiều với `tour_nodes.location_id NOT NULL` (`1 Location -> N TourNodes`). Cần bổ sung node riêng hoặc tách khái niệm điểm 360° mặc định / liên kết chia sẻ trước khi viết script seed.
3. **Thiếu hụt mô hình dữ liệu & API cho nội dung Public đang tồn tại trên Web:** `OPEN_DAY_FAQ` (`4` items trên `/events`) được nhắc trong `PHASE_2A_API_CONTRACT.md` và `PHASE_2A_SYSTEM_ARCHITECTURE.md` nhưng **hoàn toàn thiếu bảng `open_day_faqs` trong `PHASE_2A_DATABASE_DESIGN.md`**. Ngoài ra, `CAMPUS_GUIDE_ARTICLES` (`/news`, `/news/[slug]`, `sitemap.ts`), 14 trường thông tin cơ sở `OFFICIAL_CAMPUS_INFO` (`/about`, `/contact`, footer), `highlights` của Building/Location, `open_day_events` (bảng cha cho `event_key`), và toàn bộ Admin CRUD cho Events/FAQ/Quiz/News/AuditLogs chưa khớp hoặc chưa có trong `API_CONTRACT`.
4. **Lỗ hổng ràng buộc trong `PHASE_2A_DATABASE_DESIGN.md`:**
   - Thiếu partial unique index `WHERE deleted_at IS NULL` cho `users.username`, `users.email`, `locations.slug`, `tour_nodes.slug` (mới chỉ có ở `buildings` và `floors`).
   - Chưa xử lý đăng nhập & định danh duy nhất cho tài khoản Open Day mời qua **SMS (`phone`)** khi `email = NULL` và `username = NULL`.
   - Thiếu `SessionPeriod`, `ParticipationStatus`, `BuildingCategory` trong khối Prisma `enum`; thiếu DB `CHECK` ràng buộc `hotspots` (`SCENE_LINK` ↔ `edge_id`); chưa xử lý vòng đời `tour_edges` (xóa cứng) khi soft-delete `TourNode`; và thiếu cập nhật `tour_nodes.floor_plan_id` trong `confirm-alignment` API.
5. **Xung đột nghiêm trọng ở `packages/shared`:** `packages/shared/src/index.ts` hiện đang chứa hợp đồng cũ từ giai đoạn đầu (`CampusCode = 'HN' | 'DN' | 'HCM' | 'CT' | 'TN'`, `PanoramaScene`, `LocationRoom`, `UserRole` phẳng, `xpPoints`, `EventRegistrationRequest` tự đăng ký công khai, `QuizQuestionItem.correctAnswer` lộ đáp án), **`apps/web` có `0` import từ `@fpt-campus/shared`**, và `packages/shared/package.json` trỏ `"main": "src/index.ts"` với `tsconfig.json` `NodeNext` dễ lỗi khi NestJS nạp runtime.
6. **Chưa tách rạch ròi Public Quiz vs Server-Graded Gamification:** `open_day_quiz_items` chứa `correct_index` nếu trả chung trong `GET /api/v1/public/events` sẽ lộ đáp án, trong khi không có bảng `quiz_attempts` và MVP chưa triển khai `/portal`.
7. **Khác biệt đường dẫn tài liệu P1 & thiếu biến/tùy chỉnh Local Infra:** 3 tài liệu P1 trong yêu cầu kiểm toán đã được chuyển thư mục từ Phase 0 (`docs/decisions/*`, `docs/architecture/*`); `docker-compose.yml` dùng `version: '3.8'` lỗi thời và hardcode `pg_isready -U fpt_admin -d virtual_campus_360`; `.env.example` thiếu `ADMIN_BOOTSTRAP_PASSWORD`, `WEB_ORIGIN`, `REDIS_URL`, `STORAGE_TYPE=local`.

**Kết luận sẵn sàng:** **NEEDS REVISION** — Cần Chủ dự án chốt **10 quyết định mở (`OD-01` → `OD-10`)**, cập nhật bộ tài liệu `docs/phase-2a/*` + dọn hợp đồng `packages/shared`, rồi mới mở **Phase 2A-1** (PostgreSQL + Prisma + Core Seed + Auth/RBAC).

---

## 2. Exact Files and Revisions Reviewed

### 2.1. Lịch sử Git Baseline được xác minh
- `20f85ad` — `chore: initialize git repository and baseline snapshot before phase 0`
- `b4f1a94` — `chore(phase-0): standardize pnpm workspace, organize docs, and add auth & phase-1 specs`
- `5c9fea0` — `chore(phase-1): remove client prototype auth, clean MVP copy/test scenes, configure project pnpm store`
- `9062c58` *(HEAD hiện tại)* — `fix(web): add dynamic sitemap.xml, tighten robots.txt, clean dead CSS/assets, and refactor map CTA`

### 2.2. Đối chiếu Đường dẫn Tài liệu P0 & P1
Trong 3 tài liệu P1 được nêu theo đường dẫn gốc `docs/*.md`, thực tế tại commit `b4f1a94` đã di chuyển vào thư mục con theo chuẩn phân loại tài liệu:

| Mức độ | Đường dẫn nêu trong yêu cầu kiểm toán | Tồn tại tại root `docs/`? | Đường dẫn thực tế trong Repo | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| **P0** | `docs/phase-2a/PHASE_2A_DATABASE_DESIGN.md` | Có | [PHASE_2A_DATABASE_DESIGN.md](../phase-2a/PHASE_2A_DATABASE_DESIGN.md) | Đọc đủ 400/400 dòng |
| **P0** | `docs/phase-2a/PHASE_2A_SYSTEM_ARCHITECTURE.md` | Có | [PHASE_2A_SYSTEM_ARCHITECTURE.md](../phase-2a/PHASE_2A_SYSTEM_ARCHITECTURE.md) | Đọc đủ 201/201 dòng |
| **P0** | `docs/phase-2a/PHASE_2A_API_CONTRACT.md` | Có | [PHASE_2A_API_CONTRACT.md](../phase-2a/PHASE_2A_API_CONTRACT.md) | Đọc đủ 247/247 dòng |
| **P0** | `docs/phase-2a/PHASE_2A_IMPLEMENTATION_ROADMAP.md` | Có | [PHASE_2A_IMPLEMENTATION_ROADMAP.md](../phase-2a/PHASE_2A_IMPLEMENTATION_ROADMAP.md) | Đọc đủ 121/121 dòng |
| **P0 (Bổ sung)** | `docs/phase-2a/PHASE_2A_PANORAMA_WORKFLOW.md` | Có | [PHASE_2A_PANORAMA_WORKFLOW.md](../phase-2a/PHASE_2A_PANORAMA_WORKFLOW.md) | Đọc đủ 139/139 dòng |
| **P1** | `docs/MVP_SCOPE_AND_ROUTE_DECISIONS.md` | **Không (`False`)** | [MVP_SCOPE_AND_ROUTE_DECISIONS.md](../decisions/MVP_SCOPE_AND_ROUTE_DECISIONS.md) | Đọc đủ 52/52 dòng |
| **P1** | `docs/ADMIN_AUTH_AND_SECURITY_ARCHITECTURE.md` | **Không (`False`)** | [ADMIN_AUTH_AND_SECURITY_ARCHITECTURE.md](../architecture/ADMIN_AUTH_AND_SECURITY_ARCHITECTURE.md) | Đọc đủ 134/134 dòng |
| **P1** | `docs/NEXT_PHASE_PREPARATION_PLAN.md` | **Không (`False`)** | [NEXT_PHASE_PREPARATION_PLAN.md](../decisions/NEXT_PHASE_PREPARATION_PLAN.md) | Đọc đủ 94/94 dòng |
| **Tham chiếu P1** | `docs/project-audit/PHASE_1_SECURITY_AND_MVP_CLEANUP_REPORT.md` | Có | [PHASE_1_SECURITY_AND_MVP_CLEANUP_REPORT.md](./PHASE_1_SECURITY_AND_MVP_CLEANUP_REPORT.md) | Đọc dòng 1–55 (xác minh lịch sử pnpm/Phase 1) |

### 2.3. Cấu hình Hạ tầng, Monorepo, Shared Contract & Frontend Source Đã Kiểm Tra
- **Infra & Workspace Configs:**
  - [docker-compose.yml](../../docker-compose.yml) *(24 dòng)*
  - [.env.example](../../.env.example) *(36 dòng)*
  - [.gitignore](../../.gitignore) *(41 dòng)*
  - [.npmrc](../../.npmrc) *(1 dòng)*
  - [pnpm-workspace.yaml](../../pnpm-workspace.yaml) *(3 dòng)*
  - [package.json](../../package.json) *(19 dòng)*
  - [packages/shared/package.json](../../packages/shared/package.json) *(14 dòng)*
  - [packages/shared/tsconfig.json](../../packages/shared/tsconfig.json) *(17 dòng)*
  - [packages/shared/src/index.ts](../../packages/shared/src/index.ts) *(183 dòng)*
  - [apps/web/package.json](../../apps/web/package.json) *(36 dòng)*
  - [apps/web/tsconfig.json](../../apps/web/tsconfig.json) *(34 dòng)*
  - [apps/web/next.config.ts](../../apps/web/next.config.ts) *(14 dòng)*
- **Frontend Static Registries & Consumers:**
  - [campus-data.ts](../../apps/web/src/data/campus-data.ts) *(997 dòng — Single source of truth tĩnh hiện tại)*
  - [news-items.ts](../../apps/web/src/components/news/news-items.ts) *(59 dòng)*
  - [portal-types.ts](../../apps/web/src/components/portal/portal-types.ts) *(9 dòng)*
  - Các consumer chính: `CampusGISMap.tsx`, `qtscLeafletIcons.ts`, `BuildingDetailDrawer.tsx`, `VirtualTourViewer.tsx`, `TourInfoDrawer.tsx`, `TourSceneSelector.tsx`, `LocationsExplorer.tsx`, `LocationFilterBar.tsx`, `LocationCard.tsx`, `locations/page.tsx`, `locations/[slug]/page.tsx`, `FeaturedFacilities.tsx`, `CampusOrientationSection.tsx`, `PublicHeader.tsx`, `about/page.tsx`, `contact/page.tsx`, `events/page.tsx`, `OpenDayScheduleTimeline.tsx`, `EventPillarGrid.tsx`, `news/page.tsx`, `news/[slug]/page.tsx`, `games/page.tsx`, `CampusQuizStepper.tsx`, `QuizLeaderboard.tsx`, `sitemap.ts`, `PersonalItineraryTimeline.tsx`, `admin/layout.tsx`, `admin/page.tsx`, `AdminDashboardMetrics.tsx`, `AdminRecentActivityLog.tsx`, `admin/locations/page.tsx`, `admin/virtual-tour/page.tsx`, `admin/events/page.tsx`, `admin/media/page.tsx`, `admin/users/page.tsx`.

---

## 3. Current Repository Evidence

Kết quả kiểm chứng trực tiếp bằng công cụ trên workspace tại `9062c58` xác nhận:

1. **Chưa có thành phần Backend / ORM thực tế (`Backend Level S0`):**
   - `Test-Path apps/api` → `False`
   - `Test-Path prisma` → `False`
   - `Test-Path .env` → `False`, `Test-Path apps/web/.env` → `False`
2. **Dữ liệu Frontend 100% tĩnh & State in-memory:**
   - Lệnh tìm kiếm trên toàn bộ `apps/web/src` xác nhận **0 lệnh import/sử dụng `@fpt-campus/shared`**.
   - **42 tệp** trong `apps/web/src` (cộng thêm chính `news-items.ts`) import trực tiếp từ `@/data/campus-data`, `@/components/news`, hoặc `./portal-types`.
   - Toàn bộ trang `/admin/*` (locations, virtual-tour, events, media, users) giữ thay đổi bằng React `useState` trong bộ nhớ trình duyệt; làm mới trang sẽ quay về dữ liệu khởi tạo.
3. **Bản đồ `/map` thực tế đã chuyển sang Leaflet + OpenStreetMap:**
   - [apps/web/package.json](../../apps/web/package.json) cài `"leaflet": "^1.9.4"` và `"@types/leaflet": "^1.9.22"`.
   - [CampusGISMap.tsx](../../apps/web/src/components/map/CampusGISMap.tsx) và [qtscLeafletIcons.ts](../../apps/web/src/components/map/qtscLeafletIcons.ts) dùng **tọa độ WGS84 (`lat`, `lng`)**, điểm gốc `QTSC_ORIGIN_POINT`, đường đi bộ `routeWaypoints`, `mapIconKey`, `highlights`, `addressNote`, `floorsLabel`, `statusNote`, `defaultSceneId`.
   - Grep `gisX|gisY` trên `apps/web/src` cho thấy chỉ tồn tại định nghĩa trong `campus-data.ts` (5 tòa nhà) và **0 nơi render ở bất kỳ component nào**.
4. **Hạ tầng `pnpm` đã được cô lập an toàn từ Phase 1:**
   - [`.npmrc`](../../.npmrc) đặt `store-dir=.pnpm-store` (trỏ tới store riêng trong workspace, tránh chạm store dùng chung ngoài workspace).
   - [`pnpm-workspace.yaml`](../../pnpm-workspace.yaml) khai báo `apps/*` và `packages/*`.
   - [`package.json`](../../package.json) cố định `packageManager: "pnpm@10.33.2"`, `engines: node >= 20, pnpm >= 10`.
5. **Phạm vi bảo mật & MVP hiện giữ đúng cam kết:**
   - `prototype-auth.ts` không còn trong cây mã nguồn; `AdminLayout` gắn banner cảnh báo Admin Preview nội bộ; `/portal` giữ route dự phòng; `/games` giữ route nhưng không xuất hiện trong `NAV_ITEMS` của [`PublicHeader.tsx`](../../apps/web/src/components/navigation/PublicHeader.tsx).

---

## 4. Complete Database Model Inventory

Theo [`PHASE_2A_DATABASE_DESIGN.md`](../phase-2a/PHASE_2A_DATABASE_DESIGN.md), thiết kế hiện có **24 bảng** chia thành 5 nhóm domain và **13 Prisma enums** tường minh ở Mục 4:

### 4.1. Bảng tổng hợp 24 thực thể đề xuất

| # | Tên bảng | Domain | Khóa chính / Khóa ngoại chính | Ràng buộc Unique & Index thiết kế | Cơ chế Xóa / Ghi chú trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `campuses` | Campus & FloorPlan | `PK id`; `default_entry_node_id -> tour_nodes.id` *(NULL, ON DELETE SET NULL)* | `UNIQUE(code)` | Soft delete (`deleted_at`); thiếu `ORIGIN_POINT` & metadata trường |
| 2 | `buildings` | Campus & FloorPlan | `PK id`; `campus_id -> campuses.id`; `cover_media_id -> media_assets.id` *(NULL)* | `UNIQUE(campus_id, code) WHERE deleted_at IS NULL`; `UNIQUE(campus_id, slug) WHERE deleted_at IS NULL`; `idx_buildings_campus_status` | Soft delete (`deleted_at`); `CHECK gis_x/y ∈ [0..100]`; `lat/lng` đang nullable |
| 3 | `floors` | Campus & FloorPlan | `PK id`; `building_id -> buildings.id`; `active_floor_plan_id -> floor_plans.id` *(NULL)* | `UNIQUE(building_id, code) WHERE deleted_at IS NULL`; `UNIQUE(building_id, level_index) WHERE deleted_at IS NULL` | Soft delete (`deleted_at`) |
| 4 | `floor_plans` | Campus & FloorPlan | `PK id`; `floor_id -> floors.id`; `uploaded_by -> users.id` | `UNIQUE(floor_id, version)` | Không `deleted_at` (giữ lịch sử version); `processing_status`, `aspect_ratio` |
| 5 | `floor_plan_alignment_snapshots` | Campus & FloorPlan | `PK id`; `new_floor_plan_id -> floor_plans.id`; `previous_floor_plan_id -> floor_plans.id` *(NULL)*; `confirmed_by -> users.id` *(NULL)* | — | Lưu JSONB `{ nodeId, locationId, oldNormX, oldNormY }` |
| 6 | `location_types` | Location & Media | `PK id` | `UNIQUE(code)` | Danh mục tĩnh/seed; có `icon_name` & `is_inter_floor_connector` |
| 7 | `locations` | Location & Media | `PK id`; `building_id -> buildings.id`; `floor_id -> floors.id` *(NULL)*; `location_type_id -> location_types.id`; `primary_node_id -> tour_nodes.id` *(NULL)* | `UNIQUE(slug)` *(toàn cục)*; `idx_locations_floor_type WHERE deleted_at IS NULL`; `idx_locations_building_status WHERE deleted_at IS NULL` | Soft delete (`deleted_at`); `CHECK floor_norm_x/y ∈ [0..1]`; **thiếu partial unique `WHERE deleted_at IS NULL`** |
| 8 | `media_assets` | Location & Media | `PK id`; `uploaded_by -> users.id` | `idx_media_kind_status WHERE deleted_at IS NULL`; `idx_media_sha256` | Soft delete (`deleted_at`); giữ `is_valid_2_to_1`, `is_preview_approved` |
| 9 | `location_media` | Location & Media | `PK id`; `location_id -> locations.id`; `media_asset_id -> media_assets.id` | `UNIQUE(location_id, media_asset_id)` | Bảng nối gallery ảnh 2D |
| 10 | `tour_nodes` | Tour Graph | `PK id`; `location_id -> locations.id`; `floor_plan_id -> floor_plans.id` *(NULL)*; `panorama_asset_id -> media_assets.id` | `UNIQUE(slug)` *(toàn cục)*; `idx_tour_nodes_location`; `idx_tour_nodes_floor_plan` | Soft delete (`deleted_at`); `CHECK` paired NULL/NOT NULL `(floor_plan_id, floor_norm_x, floor_norm_y)`; **thiếu partial unique `WHERE deleted_at IS NULL`** |
| 11 | `tour_edges` | Tour Graph | `PK id`; `from_node_id -> tour_nodes.id`; `to_node_id -> tour_nodes.id` | `UNIQUE(from_node_id, to_node_id, edge_type)`; `CHECK (from_node_id <> to_node_id)` | **Hard delete** (không có `deleted_at`) |
| 12 | `hotspots` | Tour Graph | `PK id`; `node_id -> tour_nodes.id`; `edge_id -> tour_edges.id` *(NULL, UNIQUE, ON DELETE CASCADE)* | `UNIQUE(edge_id)` | **Hard delete**; `CHECK yaw ∈ [-180..180], pitch ∈ [-90..90]`; thiếu `CHECK` đồng bộ `hotspot_type` vs `edge_id` |
| 13 | `users` | Auth & RBAC | `PK id` | `UNIQUE(username)` *(NULLable)*; `UNIQUE(email)` *(NULLable)* | Soft delete (`deleted_at`); **thiếu partial unique `WHERE deleted_at IS NULL`** và thiếu index/ràng buộc cho `phone` |
| 14 | `roles` | Auth & RBAC | `PK id` | `UNIQUE(code)` | `SUPER_ADMIN`, `TOUR_EDITOR`, `EVENT_OPERATOR` |
| 15 | `permissions` | Auth & RBAC | `PK id` | `UNIQUE(code)` | 10 mã permission định nghĩa trong tài liệu |
| 16 | `user_roles` | Auth & RBAC | `PK(user_id, role_id)`; `FK -> users.id, roles.id` | PK kép | Bảng nối N-N |
| 17 | `role_permissions` | Auth & RBAC | `PK(role_id, permission_id)`; `FK -> roles.id, permissions.id` | PK kép | Bảng nối N-N |
| 18 | `account_invitations` | Auth & Provisioning | `PK id`; `user_id -> users.id`; `created_by -> users.id` | `UNIQUE(token_hash)` | Lưu `CHAR(64)` SHA-256 hash; không lưu raw token |
| 19 | `event_participations` | Auth & Provisioning | `PK id`; `user_id -> users.id`; `provisioned_by -> users.id` *(NULL)* | `UNIQUE(user_id, open_day_event_key)` | Dùng `open_day_event_key VARCHAR(80)` thay vì FK tới bảng `open_day_events` |
| 20 | `user_import_batches` | Auth & Compliance | `PK id`; `imported_by -> users.id` | — | Cấm lưu tên/đường dẫn/file Excel gốc |
| 21 | `refresh_tokens` | Auth Session | `PK id`; `user_id -> users.id` | `UNIQUE(token_hash)` | Lưu SHA-256 hash + `family_id` phát hiện reuse attack |
| 22 | `audit_logs` | Security Audit | `PK id`; `actor_user_id -> users.id` *(NULL)* | — | Append-only; `ON DELETE SET NULL` nên ghi rõ cho `actor_user_id` |
| 23 | `open_day_sessions` | Open Day CMS | `PK id`; `campus_id -> campuses.id`; `location_id -> locations.id` *(NULL)* | — | Thiếu `deleted_at`, thiếu `tour_node_id`, `host_unit`, `custom_location_label` |
| 24 | `open_day_quiz_items` | Open Day / Tour Quiz | `PK id`; `tour_node_id -> tour_nodes.id` *(NULL)* | — | Chứa `correct_index`; chưa tách câu trả lời khi trả Public API |

**Bảng hiện có trên Frontend/API nhưng CHƯA CÓ trong Database Design (0 bảng):**
- `open_day_faqs` *(đã hứa trong `PHASE_2A_API_CONTRACT.md:153` và `PHASE_2A_SYSTEM_ARCHITECTURE.md:116`)*
- `open_day_events` *(đang denormalized thành `open_day_event_key/event_name/event_date` trong `event_participations` và `open_day_sessions`)*
- `news_articles` / `campus_guides` *(phục vụ `/news` và `/news/[slug]`, đang nằm trong `news-items.ts`)*

### 4.2. Kiểm kê Enums
- **13 Prisma enums đã khai báo tường minh trong Mục 4 (`L307-393`):** `PublishStatus`, `ProcessingStatus`, `FloorPlanFormat`, `MediaKind`, `TourEdgeType`, `AlignmentStatus`, `HotspotType`, `UserType`, `AccountStatus`, `ActivationStatus`, `ProvisioningMethod`, `InvitationChannel`, `InvitationStatus`.
- **Enum / Giá trị rời chưa được định nghĩa vào khối `prisma/schema.prisma`:**
  1. `SessionPeriod` (`MORNING`, `NOON`, `AFTERNOON`) cho `open_day_sessions.session_period`.
  2. `ParticipationStatus` (`INVITED`, `CONFIRMED`, `CANCELLED`) cho `event_participations.participation_status`.
  3. `BuildingCategory` (đang viết chuỗi tự do `VARCHAR(40)`: doc ghi `'academic'|'lab'|'service'|'sports'`, frontend dùng `'academic'|'lab'|'facility'`).
  4. Kiểu dữ liệu cột `status` của `open_day_sessions` và `open_day_quiz_items` chưa ghi tường minh là `PublishStatus`.

---

## 5. Relationship and Constraint Verification

### 5.1. Tên thực thể `TourNode` vs `TourScene` và Quan hệ `Location` ↔ `TourNode`
- **Thống nhất tài liệu:** Cả 5 file `docs/phase-2a/*` đều đã thống nhất dùng `TourNode` (`tour_nodes`) và `TourEdge` (`tour_edges`), thay thế hoàn toàn `tour_scenes` cũ và sửa thành quan hệ **`Location (1) — (N) TourNode`** (`locations ||--o{ tour_nodes`), vẫn giữ tham số URL `/campus?scene={slug}` nhận `TourNode.slug`.
- **Xung đột với Dữ liệu tĩnh hiện tại (`apps/web/src/data/campus-data.ts`):**
  - Trong `CAMPUS_LOCATIONS`, **`loc-sanh-innovation`** (`L345`, `buildingCode: "INNOVATION"`) và **`loc-the-thao`** (`L455`, `buildingCode: "SPORTS"`) **cùng trỏ về `sceneId: "cong-chao-qtsc"`**. Trong khi đó, `TOUR_SCENES` phần tử `"cong-chao-qtsc"` có `linkedLocationSlug: "sanh-innovation"`.
  - Theo schema `tour_nodes.location_id NOT NULL`, một `TourNode` chỉ thuộc **đúng 1 `Location`** (`1 — N`), không thể đồng thời thuộc hai `Location` thuộc hai tòa nhà khác nhau (`INNOVATION` và `SPORTS`).
  - **Hệ quả khi Seed:** Nếu seed `loc-the-thao` với `primary_node_id = 'cong-chao-qtsc'`, `loc-the-thao` sẽ trỏ sang `TourNode` thuộc `loc-sanh-innovation` (gây lệch building/breadcrumb khi xem 360° hoặc không hợp lệ nếu backend kiểm tra `primary_node.location_id === location.id`). Giải pháp là tạo `TourNode` ngoài trời riêng cho Khu Thể thao (hoặc tạm thời để `loc-the-thao.primary_node_id = NULL` cho đến khi có ảnh panorama sân thể thao, hiển thị fallback "Định vị GIS" vốn đã được lập trình sẵn trong [`LocationCard.tsx:68-78`](../../apps/web/src/components/locations/LocationCard.tsx#L68-L78)).

### 5.2. Ba hệ tọa độ không gian & Độ lệch Leaflet vs SVG GIS
- **Hệ 2 (`Floor Plan [0..1]`) và Hệ 3 (`Spherical yaw/pitch/fov`):** Thiết kế nhất quán giữa Database, Workflow và API Contract (`normX, normY ∈ [0, 1]`, constraint cặp NULL/NOT NULL trên `tour_nodes`, `heading_offset_deg`, `initial_yaw/pitch/fov`, `hotspots.yaw ∈ [-180..180]`, `pitch ∈ [-90..90]`).
- **Hệ 1 (`Campus GIS` — CẦN CHỈNH SỬA):**
  - Tài liệu `PHASE_2A_DATABASE_DESIGN.md:96-100` và `PHASE_2A_SYSTEM_ARCHITECTURE.md:44` giả định `/map` dùng **bản đồ SVG với `gis_x`, `gis_y` (`NOT NULL`)**, còn `lat`, `lng` là `NULLABLE` ("tương lai Leaflet/GIS").
  - Thực tế [`CampusGISMap.tsx`](../../apps/web/src/components/map/CampusGISMap.tsx) **đã chuyển sang Leaflet + OpenStreetMap**: bắt buộc có **`lat`, `lng` (`NOT NULL`)**, **`routeWaypoints`** (mảng tọa độ polyline từ cổng QTSC), **`mapIconKey`**, **`addressNote`**, **`shortName`**, **`floorsLabel`**, **`statusNote`**, **`highlights`**, và **`QTSC_ORIGIN_POINT`** + **`QTSC_LANDMARKS`**.
  - Nếu dùng schema `buildings` hiện tại để build API `/api/v1/public/campus`, trang `/map` sẽ **gãy giao diện Leaflet FixNear** trừ khi giữ mock tĩnh hoặc bổ sung đầy đủ các cột địa lý thực vào DB.

### 5.3. Chu trình Khóa ngoại (Bidirectional / Circular FKs) & Lưu ý Prisma
Có **4 cặp quan hệ hai chiều / phụ thuộc vòng** trong schema:
1. `campuses.default_entry_node_id` → `tour_nodes.id` *(khi `buildings` → `floors` → `locations` → `tour_nodes` đều quay về `campuses`)*.
2. `floors.active_floor_plan_id` → `floor_plans.id` ↔ `floor_plans.floor_id` → `floors.id`.
3. `locations.primary_node_id` → `tour_nodes.id` ↔ `tour_nodes.location_id` → `locations.id`.
4. `buildings.cover_media_id` → `media_assets.id` *(phụ thuộc `media_assets.uploaded_by` → `users.id`)*.

**Đánh giá kỹ thuật:** Các khóa ngoại ngược này đều là `NULLABLE`, nên hoàn toàn hợp lệ về mặt PostgreSQL DDL nếu:
- Khai báo tường minh tên quan hệ trong Prisma (`@relation("FloorActiveFloorPlan")` vs `@relation("FloorVersions")`, `@relation("LocationPrimaryNode")` vs `@relation("LocationTourNodes")`).
- Seed và API ghi theo **2 bước trong cùng một transaction (`prisma.$transaction`)**: tạo parent với con trỏ nullable là `NULL` → tạo child → `UPDATE` cập nhật con trỏ active/primary/entry.
- Cần bổ sung kiểm tra tầng ứng dụng (hoặc trigger): `locations.primary_node_id` phải trỏ tới `tour_nodes` thuộc đúng `location_id` đó (trừ trường hợp chia sẻ có chủ đích), và `floors.active_floor_plan_id` phải thuộc đúng `floor_id` đó và `processing_status = 'READY'`.

### 5.4. Các lỗ hổng Constraint & Vòng đời Dữ liệu trong `DATABASE_DESIGN.md`
1. **Partial Unique Index khi dùng Soft Delete (`deleted_at`):**
   - `buildings` (`L106`) và `floors` (`L121`) đã dùng `WHERE deleted_at IS NULL`.
   - Ngược lại, `users.username`, `users.email` (`L287`), `locations.slug` (`L178`), `tour_nodes.slug` (`L230`) đang ghi `UNIQUE` toàn bảng. Nếu xóa mềm một phòng hoặc user, tạo lại cùng `slug`/`username`/`email` sẽ lỗi `P2002`. **Lưu ý Prisma:** Prisma schema `@unique` mặc định sinh `UNIQUE INDEX` toàn bảng, do đó bắt buộc chỉnh file SQL migration thủ công thành `CREATE UNIQUE INDEX ... WHERE deleted_at IS NULL`.
2. **Ràng buộc `hotspots` ↔ `tour_edges`:**
   - Thiếu `CHECK ((hotspot_type = 'SCENE_LINK' AND edge_id IS NOT NULL) OR (hotspot_type <> 'SCENE_LINK' AND edge_id IS NULL))` để tránh hotspot `INFO`/`QUIZ_TRIGGER` gắn nhầm `edge_id` hoặc `SCENE_LINK` không có cạnh điều hướng.
3. **Soft Delete `TourNode` vs Hard Delete `TourEdge` / `Hotspot`:**
   - `tour_nodes` có `deleted_at`, nhưng `tour_edges` và `hotspots` không có `deleted_at` (`ON DELETE CASCADE` từ edge → hotspot). Khi soft-delete một `TourNode`, mọi `tour_edges` (cả `from_node_id` và `to_node_id`) và `hotspots` trỏ đến node đó sẽ trở thành **liên kết ma** nếu API không chủ động dọn `tour_edges`/`hotspots` hoặc luôn lọc `toNode.deletedAt IS NULL AND toNode.status = 'PUBLISHED'`.
4. **Cập nhật `tour_nodes.floor_plan_id` khi `confirm-alignment`:**
   - Trong `PHASE_2A_API_CONTRACT.md:192-194`, API `confirm-alignment` ghi cập nhật `floorNormX/Y`, đặt `alignmentStatus = 'CONFIRMED'`, `needsRealignment = false`, và kích hoạt bản vẽ mới, nhưng **chưa ghi rõ việc cập nhật `tour_nodes.floor_plan_id = :floorPlanId`**. Nếu thiếu bước này, `tour_nodes` sẽ tiếp tục tham chiếu bản vẽ `version` cũ!
5. **`locations.building_id NOT NULL` và liên kết `floor_id` cho Khu vực ngoài trời:**
   - `locations.floor_id` cho phép `NULL` với khu vực ngoài trời, nhưng `tour_nodes.floor_plan_id` cũng `NULL` và `tour_nodes` không có `floor_id`/`exterior_label` riêng. Trong khi đó `API_CONTRACT.md:127` giả định `location.floorId` và `TourInfoDrawer` cần hiển thị `"Ngoài trời"` hoặc `"Tầng 2"`. Nếu một `Building` có nhiều tầng hoặc khu vực ngoài trời, cần quy định rõ nguồn lấy nhãn tầng hiển thị.

---

## 6. Domain & API Consistency Assessment

### 6.1. Ranh giới Module Backend (`apps/api`)
Kiến trúc 9 modules trong [`PHASE_2A_SYSTEM_ARCHITECTURE.md:105-117`](../phase-2a/PHASE_2A_SYSTEM_ARCHITECTURE.md#L105-L117) chia ranh giới domain hợp lý cho Modular Monolith:
- `AuthModule` + `UsersRbacModule` + `AuditLogModule` tách bạch Auth, RBAC, Provisioning, Excel Import và Audit.
- `CampusGeoModule` + `FloorPlanModule` + `LocationsModule` + `MediaPipelineModule` + `TourGraphModule` tách đúng 3 lớp không gian và tách xử lý nặng (`Sharp` / `PDF` / `SVG Sanitizer`) sang Worker.
- `OpenDayModule` hiện gánh cả lịch trình công khai (`open_day_sessions`), `EventParticipation` (liên kết tài khoản mời Open Day), FAQ và Quiz. **Lưu ý:** Nếu quyết định quản trị bài viết `/news` và thông tin trường `/about`, `/contact` trong DB, cần thêm `CmsContentModule` (hoặc mở rộng `CampusGeoModule`/`OpenDayModule`) và `HealthModule` (`GET /api/v1/health` cho Docker/Compose).

### 6.2. Đối chiếu Public, Auth & Admin APIs (`PHASE_2A_API_CONTRACT.md` vs DB vs Frontend)

| Nhóm API | Khớp tốt với Frontend & Quyết định | Thiếu hụt / Sai khác cần sửa trước khi code |
| :--- | :--- | :--- |
| **`GET /api/v1/public/campus`** | Có `campus` + `buildings[]` + `defaultEntryNodeSlug` | **Thiếu** `QTSC_ORIGIN_POINT`, `QTSC_LANDMARKS`, metadata của `OFFICIAL_CAMPUS_INFO`, và các field Leaflet bắt buộc của `CampusGISMap.tsx` (`lat`, `lng`, `routeWaypoints`, `mapIconKey`, `floorsLabel`, `addressNote`, `statusNote`, `highlights`, `defaultSceneId`, `shortName`). Cần có thêm `GET /api/v1/public/buildings/:slug` nếu load chi tiết riêng. |
| **`GET /api/v1/public/tour/nodes/:slug`** | Khớp `?scene={slug}`, trả `initialYaw/Pitch/Fov`, `panoramaUrl`, `fallbackMobileUrl`, `thumbUrl`, `siblingNodes`, `hotspots` (đã merge `edgeType`, `targetNodeSlug`, `targetEntryYaw`, `targetFloorId`) | 1. **Thiếu `GET /api/v1/public/tour/nodes`** (trả danh sách rút gọn tất cả node đã publish để dựng [`TourSceneSelector.tsx`](../../apps/web/src/components/tour/TourSceneSelector.tsx) & danh sách chuyển cảnh nhanh — hiện UI đang hiển thị `5` cảnh toàn tour chứ không chỉ `hotspots` lân cận!).<br>2. Node payload **thiếu** `intro` / `description`, `buildingLabel`, `floorLabel` đang hiển thị trong [`TourInfoDrawer.tsx:28,44`](../../apps/web/src/components/tour/TourInfoDrawer.tsx#L28-L44). |
| **`GET /api/v1/public/locations` & `/:slug`** | Khớp lọc `buildingCode`, `typeCode`, `q` và trang chi tiết `/locations/[slug]` | 1. `LocationCard` và `LocationFilterBar` lọc theo nhóm giao diện (`all | common | lab | studio`), cần có map ánh xạ từ `location_types.code` sang nhóm filter.<br>2. `locations` DB và API **thiếu** `highlights: string[]` (được render dạng checklist trên `/locations/[slug]`). |
| **`GET /api/v1/public/events`** | Phục vụ `/events` không cần đăng nhập | 1. Promised FAQ (`L153`) nhưng **không có bảng `open_day_faqs`** trong DB design.<br>2. Quiz payload không được trả `correctIndex` thô nếu chuyển sang server-graded, hoặc phải xác nhận phạm vi Public Quiz tự chấm phía client.<br>3. Lịch trình cần thêm `event` header (`eventKey`, `eventName`, `dateLabel`, `timeLabel`), `buildingCode`, `locationLabel`, `sceneSlug`, `hostUnit`. |
| **News APIs (`/news`, `/news/[slug]`)** | Chưa có API | Frontend hiện có route `/news`, `/news/[slug]` và `sitemap.ts` đọc từ `CAMPUS_GUIDE_ARTICLES`. Hoàn toàn **vắng mặt** trong `API_CONTRACT` và `DATABASE_DESIGN`. |
| **Auth APIs (`/api/v1/auth/*`)** | Khớp tuyệt đối với `ADMIN_AUTH_AND_SECURITY_ARCHITECTURE.md`: Login, Refresh cookie HttpOnly + reuse detection, Logout, `/me`, `/me/password`, `/activate/validate`, `/activate/complete`, **không có `/register`** | 1. `POST /auth/login` mới ghi `identifier` = `username` (Admin/Staff) hoặc `email` (đã kích hoạt). Cần chốt trường hợp user Open Day kích hoạt qua **`SMS` bằng `phone`** khi `email = NULL`!<br>2. Chưa có endpoint kiểm tra/cập nhật sau kích hoạt khi đổi SĐT/Email nếu trùng. |
| **Admin APIs (`/api/v1/admin/*`)** | Đầy đủ cho `buildings`, `floors`, `floor-plans` (presign/confirm/status/alignment-overlay/confirm-alignment), `media`, `locations`, `tour/nodes`, `tour/hotspots`, `tour/validate`, `publish`, `users`, `import/preview`, `import/confirm`, `audit-logs` | 1. **Thiếu hoàn toàn** Admin CRUD cho `open_day_events` / `open_day_sessions` / `open_day_faqs` / `open_day_quiz_items` (trái ngược UI preview đã có tại [`/admin/events`](../../apps/web/src/app/admin/events/page.tsx) và permission `events:write`!).<br>2. **Thiếu** endpoint Admin cho Check-in Open Day (nếu giữ tab Check-in trên `/admin/events`), `PATCH /admin/campus` (cập nhật thông tin cơ sở & điểm vào mặc định), `GET /admin/buildings` & `GET /admin/locations` (danh sách cả `DRAFT` cho CMS), `GET /admin/tour/nodes` (cây Studio 3 vùng), và `POST/PATCH/DELETE` bài viết `/news` nếu CMS hóa. |

### 6.3. Đánh giá Quy tắc Người dùng & Open Day Provisioning
- Chính sách 3 nhóm người dùng (`ADMIN`/`STAFF`, Open Day `STUDENT`/`PARENT`, Public Visitors) hoàn toàn nhất quán giữa `MVP_SCOPE_AND_ROUTE_DECISIONS.md`, `ADMIN_AUTH_AND_SECURITY_ARCHITECTURE.md` và `PHASE_2A_DATABASE_DESIGN.md`.
- Nguyên tắc **không tự đăng ký công khai**, **không dùng mật khẩu mặc định dùng chung / plaintext**, **không lưu file/tên/đường dẫn Excel gốc**, **Dual Provisioning (`ADMIN_DIRECT` & `EMAIL_SMS_INVITATION` lưu hash SHA-256)** và **giữ `/portal` ngoài phạm vi MVP** đều được thiết kế đúng trọng tâm.
- **Điểm cần làm rõ trước khi tạo bảng `users` & `event_participations`:**
  1. **Định danh khi mời SMS không có Email:** Nếu một phụ huynh hoặc học sinh Open Day trong file Excel chỉ có `phone` (`email = NULL`, `username = NULL`), làm sao họ đăng nhập sau khi kích hoạt nếu `POST /auth/login` chỉ nhận `username` hoặc `email`? Đồng thời `users.phone` hiện không có `UNIQUE` (ngay cả partial unique index với `deleted_at IS NULL`), khiến bước Import Excel (`preview`/`confirm`) chưa rõ khóa đối chiếu chống trùng lặp (`phone` vs `email` vs `(full_name, phone)`) khi `username = NULL` và `email = NULL`!
  2. **Tab Check-in Open Day trên UI `/admin/events`:** Giao diện Preview hiện tại có `checkedIn` và `ticketCode` trên user Open Day, nhưng bảng `event_participations` mới chỉ có `participation_status ('INVITED' | 'CONFIRMED' | 'CANCELLED')`, chưa có `CHECKED_IN` / `checked_in_at` / `ticket_code` (vì Phase 1 đã gỡ bỏ luồng "Check-in QR" cho khách public). Cần Chủ dự án chốt rõ có giữ nghiệp vụ Admin đánh dấu `CHECKED_IN` tại sự kiện Open Day không.
  3. **`AdminRecentActivityLog` vs `audit_logs`:** Giao diện Dashboard Admin đang hiển thị `Nhật ký thao tác gần đây` với các action đọc dễ hiểu (`badge`: Media, Tour 360°, Tài khoản, Open Day). Cần bảo đảm `audit_logs` hoặc lớp DTO trả về của `GET /api/v1/admin/audit-logs` hỗ trợ nhãn hiển thị tiếng Việt, nhưng tuyệt đối tuân thủ luật không ghi token/password/tên file Excel.

### 6.4. Tính thực tế của Storage (`Local` vs `MinIO/S3`) và `Redis / BullMQ` ở giai đoạn đầu
- **Lớp Lưu trữ Media:** Thiết kế bảng `floor_plans` và `media_assets` lưu **`*_object_key`** (không hardcode URL domain vào DB) là rất tốt về mặt kiến trúc, vì có thể dùng interface `StorageProvider` (`LOCAL_FS` | `MINIO_S3` | `R2`) mà không cần sửa schema DB.
  - **Cảnh báo API Contract:** `PHASE_2A_API_CONTRACT.md` hiện giả định luồng `presign -> client PUT trực tiếp lên MinIO -> confirm`. Ở bước triển khai PostgreSQL đầu tiên (`Phase 2A-1`), toàn bộ 8 ảnh mẫu đã có sẵn trong `apps/web/public/images/`. **Chưa bắt buộc dựng MinIO container hay S3 thật ngay trong Phase 2A-1** nếu chỉ phục vụ migrate dữ liệu tĩnh + Auth + Core CRUD; tuy nhiên khi mở Media Upload (`Phase 2A-2`), nếu dùng Local Storage fallback thay MinIO thì Backend cần cung cấp thêm endpoint `PUT/POST /api/v1/admin/media/local-upload/:assetId` (với file size guard) vì Local FS không có S3 presigned URL.
- **Lớp Hàng đợi `Redis + BullMQ`:**
  - Cần thiết cho **Phase 2A-2 trở đi** (xử lý `Sharp` ảnh 4K–8K, render `PDF -> WebP 300 DPI` với sandbox timeout 15s, và phân phối rate-limit đa instance).
  - Với **Phase 2A-1** (chỉ PostgreSQL + Prisma + Auth + Seed + Read Public APIs ở local dev 1 instance), có thể dùng PostgreSQL đơn lẻ + in-memory rate-limit/throttler tạm thời (hoặc bật Redis chỉ khi cần khóa Brute-Force xuyên restart). Không nên ép dựng đủ 6 container (`postgres + redis + minio + minio-init + api + worker + web`) làm nghẽn cột mốc xác minh PostgreSQL đầu tiên.

### 6.5. Ranh giới CMS Content & Tách bạch Gamification
1. **Ranh giới CMS Content (Chưa có sự thống nhất cuối cùng trong docs):**
   - Tài liệu Phase 2A mới mô hình hóa Building, Floor, FloorPlan, Location, Media, TourNode/Edge/Hotspot, OpenDay Sessions và Quiz.
   - Hiện tại `OFFICIAL_CAMPUS_INFO` (14 trường thông tin cơ sở, giờ làm việc, liên kết tuyển sinh `caodang.fpt.edu.vn`), `OPEN_DAY_FAQ` (`4` câu hỏi trên `/events`), và `CAMPUS_GUIDE_ARTICLES` (`3` bài viết trên `/news` và `/news/[slug]`) đang nằm cứng trong code Frontend.
   - Nếu mục tiêu là "chuyển dữ liệu nghiệp vụ sang PostgreSQL", cần quyết định rõ **Option A** (tạo thêm `open_day_faqs`, `campus_articles`, mở rộng `campuses` để CMS quản trị 100%) hay **Option B** (chỉ DB-ize không gian + tour + users + `open_day_sessions` + `open_day_faqs`, còn `/news` và thông tin liên hệ chính thức `OFFICIAL_CAMPUS_INFO` giữ nguyên cấu hình tĩnh/environment có kiểm soát vì không thay đổi thường xuyên).
2. **Tách bạch Gamification / Quiz:**
   - Trong `campus-data.ts`, `OPEN_DAY_QUIZ_QUESTIONS` chỉ là **3 câu trắc nghiệm định hướng nhanh** trên `/games` (`CampusQuizStepper.tsx`), không lưu DB, không có tài khoản, không có XP hay bảng xếp hạng cá nhân (`QuizLeaderboard.tsx` chỉ là thẻ CTA quay lại `/campus` và Open Day!).
   - Trong `packages/shared/src/index.ts` (draft cũ) lại có `xpPoints`, `xpReward`, `QuizAttemptResult` (rất dễ gây hiểu nhầm thành hệ thống điểm thưởng có tài khoản).
   - Trong `PHASE_2A_DATABASE_DESIGN.md`, bảng `open_day_quiz_items` lưu `correct_index` và `hotspot_type = 'QUIZ_TRIGGER'`.
   - **Khuyến nghị bắt buộc:** Tách rạch ròi:
     - **Chế độ Public Orientation Quiz (`/games` & hotspot `QUIZ_TRIGGER`):** Giữ đơn giản cho khách tự do không đăng nhập. Nếu muốn ẩn đáp án khỏi network payload trước khi khách chọn, tách `POST /api/v1/public/quiz/check` (stateless verification, không lưu user/leaderboard) thay vì đẩy `correct_index` qua `GET /public/events`.
     - **Chế độ Event Leaderboard / XP / Attempt Tracking:** Đưa vào **FUTURE (sau MVP)** nếu sau này triển khai trên `/portal` hoặc Open Day có tài khoản; không trộn `xpPoints` vào `User` model ở Phase 2A.

---

## 7. Static Data Migration Mapping

Toàn bộ dữ liệu tĩnh trong `apps/web/src/` được kiểm kê chi tiết từ mã nguồn thực tế (`campus-data.ts`, `news-items.ts`, `portal-types.ts`, và các hằng số local trong components):

| Hằng số / Type Tĩnh Hiện Tại | Nguồn File | Consumers Đang Dùng (Xác minh bằng `rg`) | Đích DB Table (`PHASE_2A_DATABASE_DESIGN`) | Đích API Endpoint (`PHASE_2A_API_CONTRACT`) | Mức độ Ưu tiên | Biến đổi / Mở rộng Bắt buộc |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `OFFICIAL_CAMPUS_INFO` (`CampusOfficialInfo`, 14 fields) | `apps/web/src/data/campus-data.ts:26` | 15 files: `OpenDayBanner`, `Hero360Viewer`, `CampusOrientationSection`, `PublicFooter`, `QuizLeaderboard`, `news-items.ts`, `news/page`, `contact/page`, `about/page`, `locations/page`, `portal/page`, `games/page`, `events/page`, `admin/page`, `admin/users/page`, `login/page` | `campuses` + *(thiếu trường mở rộng hoặc `open_day_events`)* | `GET /api/v1/public/campus` *(chưa có đủ field)*; thiếu `PATCH /admin/campus` | **P1** *(hoặc giữ config nếu chọn Option B)* | `campuses` hiện chỉ có `id, code, name, address, default_entry_node_id`. Cần quyết định bổ sung `short_name, campus_label, ward, district, city, coordinates_label, support_hours, official_*_url` hoặc đọc từ bảng cấu hình / bảng `open_day_events` cho `openDayDateLabel`, `openDayTimeLabel`. |
| `QTSC_ORIGIN_POINT`, `QTSC_LANDMARKS` | `apps/web/src/data/campus-data.ts:60,76` | `CampusGISMap.tsx` | **Chưa có bảng/cột** *(đề xuất `campus.origin_point_json` hoặc bảng `campus_landmarks`)* | Cần trả trong `GET /api/v1/public/campus` | **P0** *(nếu nối `/map` vào API)* | Không tồn tại trong `DATABASE_DESIGN`. Thiếu dữ liệu này `CampusGISMap.tsx` không vẽ được marker "Cổng chính QTSC (Tô Ký)" & tuyến đi bộ mặc định. |
| `CAMPUS_BUILDINGS` (`5` tòa nhà) | `apps/web/src/data/campus-data.ts:102` | `CampusGISMap.tsx`, `BuildingDetailDrawer.tsx`, `qtscLeafletIcons.ts`, `LocationFilterBar.tsx`, `LocationsExplorer.tsx`, `about/page.tsx`, `admin/locations/page.tsx`, `admin/events/page.tsx` | `buildings` + `media_assets` (`cover_media_id`) | `GET /api/v1/public/campus` & `/api/v1/admin/buildings` | **P0** | Chuyển `lat`, `lng` thành **`NOT NULL`**; đồng bộ `category` (`'facility'` vs `'service'|'sports'`); bổ sung `short_name`, `floors_label`, `address_note`, `status_note`, `map_icon_key`, `highlights_json`, `route_waypoints_json`, `default_node_id`; tạo thêm các bản ghi `floors` tương ứng với `floorsLabel` để nối chuỗi `Building -> Floor -> FloorPlan`. |
| `CAMPUS_LOCATIONS` (`6` địa điểm) | `apps/web/src/data/campus-data.ts:325` | `FeaturedFacilities.tsx`, `LocationsExplorer.tsx`, `LocationFilterBar.tsx`, `LocationCard.tsx`, `locations/[slug]/page.tsx`, `AdminDashboardMetrics.tsx`, `admin/locations/page.tsx`, `sitemap.ts` | `locations` + `location_types` + `location_media` + `floors` | `GET /api/v1/public/locations`, `GET /api/v1/public/locations/:slug`, `/api/v1/admin/locations` | **P0** | Tách `buildingName` & `floor` thành FK `building_id` + `floor_id` (NULL nếu ngoài trời); map `category` (`common/lab/studio`) qua `location_types`; **thêm `highlights_json`** (hiện chưa có); gỡ liên kết sai `loc-the-thao.sceneId = 'cong-chao-qtsc'` (do `Location 1-N TourNode`); chuyển `FEATURED_SLUGS` trong `FeaturedFacilities.tsx` sang cờ `is_featured` hoặc query API. |
| `TOUR_SCENES` (`5` cảnh, `hotspots`, `initialView`) | `apps/web/src/data/campus-data.ts:487` | `Hero360Viewer.tsx`, `VirtualTourViewer.tsx`, `TourSceneSelector.tsx`, `TourInfoDrawer.tsx`, `PanoramaStage.tsx`, `AdminDashboardMetrics.tsx`, `admin/virtual-tour/page.tsx` | `tour_nodes` + `tour_edges` + `hotspots` + `media_assets` (`PANORAMA_2_1`) | `GET /api/v1/public/tour/nodes/:slug`, **thiếu `GET /api/v1/public/tour/nodes`**, `/api/v1/admin/tour/*` | **P0** | Đổi `id` -> `slug` (`cong-chao-qtsc`, ...), `bgUrl/thumbUrl` -> `panorama_asset_id` (`PANORAMA_2_1`); tách mỗi `hotspot` loại `'scene'` thành **cặp `(tour_edges, hotspots)`**; thêm `intro` hoặc lấy từ `locations.short_summary/description`; xử lý `floor_plan_id = NULL` khi chưa có bản vẽ mặt bằng. |
| `INITIAL_MEDIA_ASSETS` (`8` ảnh: 5 panorama `2:1`, 3 ảnh `2D` + 5 thumb trùng ảnh building/location) | `apps/web/src/data/campus-data.ts:882` | `admin/media/page.tsx`, `AdminDashboardMetrics.tsx` | `media_assets` + `location_media` + `buildings.cover_media_id` | `GET /api/v1/admin/media`, `/api/v1/admin/media/*` | **P0** | Ảnh tĩnh trong `apps/web/public/images/*` ánh xạ thành seed `media_assets` (`processing_status = 'READY'`, `is_valid_2_to_1`, `is_preview_approved = true` cho 5 panorama mẫu, lưu `original_object_key`/`optimized_*_key` khớp `StorageService`). |
| `OPEN_DAY_SESSIONS` (`6` phiên) | `apps/web/src/data/campus-data.ts:721` | `OpenDayScheduleTimeline.tsx`, `PersonalItineraryTimeline.tsx`, `about/page.tsx`, `admin/events/page.tsx`, `AdminDashboardMetrics.tsx` | `open_day_sessions` *(+ cần bảng cha `open_day_events`)* | `GET /api/v1/public/events` *(thiếu `/api/v1/admin/events` CRUD)* | **P1** | Tách `timeRange` (`"08:00 – 08:45"`) thành `start_time_label` & `end_time_label`; map `period` -> `MORNING/NOON/AFTERNOON`; `accessType === 'public'` -> `is_public = true`; bổ sung `host_unit`, `custom_location_label`, `tour_node_id`, `building_id` cho các phiên như `od-03` tham chiếu nhiều phòng. |
| `OPEN_DAY_FAQ` (`4` FAQ) | `apps/web/src/data/campus-data.ts:808` | `EventPillarGrid.tsx` | **Thiếu bảng `open_day_faqs`** | `GET /api/v1/public/events` *(API đã liệt kê FAQ nhưng chưa có bảng DB)* | **P1** | Tạo bảng `open_day_faqs` (`id, campus_id/event_id, question, answer, sort_order, status`) và Admin CRUD nếu quản trị trong CMS. |
| `OPEN_DAY_QUIZ_QUESTIONS` (`3` câu hỏi) | `apps/web/src/data/campus-data.ts:843` | `games/page.tsx`, `CampusQuizStepper.tsx` | `open_day_quiz_items` | `GET /api/v1/public/events` (hoặc `/public/quiz`) | **P2** | Đổi `id` -> UUID, `question` -> `question_text`, `options` -> `options_json`, `correctIndex` -> `correct_index`. Nếu muốn chống lộ đáp án, tách endpoint kiểm tra đáp án server-side thay vì trả `correctIndex`. |
| `INITIAL_ADMIN_USERS` (`1` bản ghi `admin`) | `apps/web/src/data/campus-data.ts:985` | `admin/users/page.tsx`, `admin/events/page.tsx`, `admin/page.tsx`, `AdminDashboardMetrics.tsx` | `users` + `user_roles` + `roles` + `account_invitations` + `event_participations` | `GET/POST/PATCH /api/v1/admin/users`, `/api/v1/auth/*` | **P0** | Loại bỏ cấu trúc gộp `AdminParticipantUser` (`role: "participant"|"operator"|"admin"`, `checkedIn`, `passwordStatus`); chuyển sang mô hình tách `userType`, RBAC `SUPER_ADMIN`, `accountStatus`, `activationStatus`, `provisioningMethod`, `must_change_password = true`, mật khẩu đọc từ `ADMIN_BOOTSTRAP_PASSWORD`. |
| `CAMPUS_GUIDE_ARTICLES` (`3` bài viết) | `apps/web/src/components/news/news-items.ts:14` | `news/page.tsx`, `news/[slug]/page.tsx`, `NewsArticleGrid.tsx`, `FeaturedArticleCard.tsx`, `sitemap.ts` | **Thiếu bảng `news_articles`** | **Thiếu API** (`/public/news`, `/admin/news`) | **P1 / Quyết định CMS** | Hiện `content: string[]` là mảng đoạn văn; `relatedSceneId` ánh xạ `tour_node_id`; `imageUrl` ánh xạ `cover_media_id`. Cần Chủ dự án chốt Option A (đưa vào DB) hay Option B (giữ cẩm nang tĩnh). |
| `RECENT_OPERATIONS` (`4` dòng giả) | `apps/web/src/components/admin/AdminRecentActivityLog.tsx:4` | `admin/page.tsx` | `audit_logs` | `GET /api/v1/admin/audit-logs` | **P1** | Chuyển nhật ký thao tác tĩnh trên Admin Dashboard sang đọc 100% từ bảng append-only `audit_logs`. |
| `PortalParticipantPreview` (`portal-types.ts`) + `PersonalItineraryTimeline` (`selectedIds`) | `apps/web/src/components/portal/portal-types.ts:1`, `PersonalItineraryTimeline.tsx:1` | `DigitalPassCard.tsx`, `StudentProfileHeader.tsx`, `portal/page.tsx` | N/A *(Out of MVP)* | N/A *(Out of MVP)* | **FUTURE** | `/portal` chưa triển khai trong MVP theo `MVP_SCOPE_AND_ROUTE_DECISIONS.md`. Giữ file tĩnh để không vỡ route dự phòng `/portal`. |
| `NAV_ITEMS`, `ADMIN_MODULES`, `QUICK_WORKSPACES`, `ORIENTATION_WAYS`, `ACCESS_STEPS` | `PublicHeader.tsx`, `admin/layout.tsx`, `admin/page.tsx`, `CampusOrientationSection.tsx`, `EventPillarGrid.tsx` | Các component layout/landing tương ứng | Không đưa vào DB | Không cần API | **Giữ Tĩnh** | Thuộc UI navigation chrome & copy tĩnh của ứng dụng Next.js; giữ nguyên trong code UI để bảo toàn thiết kế 19 routes. |
| Draft types cũ (`CampusCode`, `UserProfile`, `PanoramaScene`, `LocationRoom`, `EventRegistrationRequest`, `QuizAttemptResult`, `ApiResponse<T>`) | `packages/shared/src/index.ts:1-183` | **0 consumers trong toàn workspace** | **Trái ngược schema Phase 2A** | **Trái ngược `API_CONTRACT.md`** | **P0 (Rewrite)** | Phải viết lại hoàn toàn `@fpt-campus/shared` theo đúng hợp đồng `Campus`, `Building`, `Floor`, `FloorPlan`, `Location`, `TourNode`, `TourEdge`, `Hotspot`, `Auth/User`, `OpenDay`, `ApiSuccessResponse/ApiErrorResponse` trước khi nối API. |

---

## 8. Local PostgreSQL Readiness

### 8.1. Kiểm tra Cấu hình Workspace & Docker Hiện Hữu

| Tệp cấu hình | Hiện trạng đã xác minh | Vấn đề / Điểm cần điều chỉnh cho PostgreSQL Local |
| :--- | :--- | :--- |
| [`docker-compose.yml`](../../docker-compose.yml) | Đã khai báo 1 service `postgres` (`postgres:16-alpine`), container `fpt_virtual_campus_db`, DB `virtual_campus_360`, user `fpt_admin`, port `5432`, volume `postgres_data`. | 1. Dòng 1 dùng `version: '3.8'` đã lỗi thời với Docker Compose v2 (nên gỡ bỏ).<br>2. Dòng 17 **hardcode** `pg_isready -U fpt_admin -d virtual_campus_360` thay vì `${POSTGRES_USER:-fpt_admin}` và `${POSTGRES_DB:-virtual_campus_360}` — nếu người phát triển đổi tên DB/user trong `.env`, healthcheck sẽ báo `unhealthy` dù Postgres đã chạy.<br>3. Chưa có service `redis` (`redis:7-alpine`) và `minio` (sẽ thêm ở Phase 2A-2 để tránh phình overhead khi mới verify DB ở 2A-1). |
| [`.env.example`](../../.env.example) | Có `NODE_ENV`, `PORT=3000`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`, `API_PORT=4000`, `POSTGRES_*`, `DATABASE_URL`, `JWT_*`, `STORAGE_TYPE=s3`, `S3_*`. | 1. **Thiếu `ADMIN_BOOTSTRAP_PASSWORD`** (bắt buộc bởi `DEC-04` và `DATABASE_DESIGN.md:287`).<br>2. **Thiếu `WEB_ORIGIN`** (CORS whitelist bắt buộc trong `SYSTEM_ARCHITECTURE.md:163`).<br>3. **Thiếu `DATA_SOURCE=mock\|api`** (`SYSTEM_ARCHITECTURE.md:189`).<br>4. **Thiếu `REDIS_URL` / `REDIS_HOST` / `REDIS_PORT`** (cho Phase 2A-2+).<br>5. Phần `STORAGE_TYPE=s3` đang điền endpoint R2 giả (`your-account-id.r2...`) — cần tùy chọn `STORAGE_TYPE=local` cho dev local hoặc thông số MinIO Dev mặc định.<br>6. Hiện chưa có tệp `.env` thật trên ổ đĩa (đúng chuẩn Read-Only; `.gitignore` đã loại trừ `.env` & `.env.*`, chỉ track `.env.example`). |
| [`.npmrc`](../../.npmrc) & [`pnpm-workspace.yaml`](../../pnpm-workspace.yaml) | `store-dir=.pnpm-store`; workspace `apps/*` và `packages/*`. | **READY.** Đảm bảo khi tạo `apps/api/` (thư mục con trong `apps/`), pnpm tự nhận diện thành workspace package dùng chung store nội bộ. |
| [`package.json`](../../package.json) (root) | Script mới có `dev`, `build`, `start`, `lint`, `typecheck`, `capture` cho `web` và `@fpt-campus/shared`. | Khi khởi tạo `apps/api` và `prisma/`, cần bổ sung scripts `api:dev`, `api:build`, `db:migrate`, `db:seed`, `db:generate` — chưa sửa trong bước audit này. |
| [`packages/shared/package.json`](../../packages/shared/package.json) & [`tsconfig.json`](../../packages/shared/tsconfig.json) | `package.json`: `"main": "src/index.ts"`, `"types": "src/index.ts"`.<br>`tsconfig.json`: `"module": "NodeNext"`, `"moduleResolution": "NodeNext"`, `"outDir": "./dist"`, `"declaration": true`. | **Rủi ro biên dịch & runtime:**<br>1. `outDir` xuất ra `./dist` nhưng `"main"` lại trỏ vào `"src/index.ts"`. NestJS chạy Node runtime sẽ **không** thực thi được `.ts` trong `node_modules/@fpt-campus/shared/src/index.ts` nếu không build ra `dist/index.js` và trỏ `"main": "./dist/index.js"`, `"types": "./dist/index.d.ts"`, kèm `"exports"`.<br>2. `apps/web/package.json` chưa khai báo `"@fpt-campus/shared": "workspace:*"` và [`apps/web/next.config.ts`](../../apps/web/next.config.ts) chưa cấu hình `transpilePackages` (nếu import source TS) hoặc dùng bản build `dist/`.<br>3. Khi dùng `"module": "NodeNext"`, mọi file tách module trong `packages/shared/src/` phải import đuôi `.js` hoặc đồng bộ lại cấu hình `moduleResolution`. |

### 8.2. Chiến lược Khởi tạo Prisma, Migration & Seed cho Giai đoạn PostgreSQL Đầu tiên
1. **Vị trí Prisma Schema:** Khởi tạo chuẩn tại `apps/api/prisma/schema.prisma` (hoặc `packages/database/prisma/schema.prisma` nếu muốn dùng chung). Với mô hình Modular Monolith trong `SYSTEM_ARCHITECTURE.md`, đặt tại `apps/api/prisma/schema.prisma` và chỉ `apps/api` giữ `PrismaClient` (Web chỉ giao tiếp qua REST `/api/v1` + DTO từ `@fpt-campus/shared`) là sạch và tránh rò rỉ DB connection ra frontend.
2. **Xử lý Partial Unique Indexes & Check Constraints trong Migration:**
   - Tạo baseline schema trong Prisma (`prisma migrate dev --create-only --name init`), sau đó **bổ sung SQL thủ công** vào `migration.sql` cho các ràng buộc mà Prisma DSL chưa biểu diễn gốc:
     - `UNIQUE INDEX ... WHERE deleted_at IS NULL` trên `buildings`, `floors`, `locations`, `tour_nodes`, `users` (`username`, `email`, `phone`).
     - `CHECK` constraints cho `[0..1]`, `[-180..180]`, `[-90..90]`, paired NULL/NOT NULL `(floor_plan_id, floor_norm_x, floor_norm_y)`, `from_node_id <> to_node_id`, và `hotspots (hotspot_type vs edge_id)`.
3. **Thứ tự Transaction Seed an toàn cho Khóa ngoại Vòng (`prisma/seed.ts`):**
   - Kiểm tra bắt buộc biến môi trường `ADMIN_BOOTSTRAP_PASSWORD` (`>= 12` ký tự, không rỗng; từ chối chạy nếu thiếu hoặc trùng chuỗi mẫu `Fpoly@2026`).
   - Bước 1: Seed `roles` (`SUPER_ADMIN`, `TOUR_EDITOR`, `EVENT_OPERATOR`), `permissions` (10 mã), `role_permissions`.
   - Bước 2: Upsert `users` tài khoản gốc duy nhất `username = 'admin'` (`user_type = 'ADMIN'`, `account_status = 'ACTIVE'`, `activation_status = 'ACTIVATED'`, `provisioning_method = 'BOOTSTRAP'`, `must_change_password = true`, Argon2id hash) + `user_roles`.
   - Bước 3: Seed `location_types` (`LOBBY`, `LIBRARY`, `AUDITORIUM`, `IT_LAB`, `STUDIO`, `SPORTS_AREA`, `HALLWAY`, `STAIRS`, `ELEVATOR`, `RESTROOM`, `RESTRICTED_AREA`).
   - Bước 4: Seed `media_assets` cho bộ ảnh mẫu cục bộ trong `apps/web/public/images/` (`READY`, 5 panorama đánh dấu `is_valid_2_to_1 = true` & `is_preview_approved = true`).
   - Bước 5: Seed `campuses` (`QTSC-Q12`, tạm để `default_entry_node_id = NULL`), `buildings` (`5` tòa nhà kèm dữ liệu Leaflet `lat/lng/routeWaypoints/...`), `floors` (chờ chốt `Floor` mặc định), `locations` (tạm để `primary_node_id = NULL`), `tour_nodes` (`5` node), `tour_edges` + `hotspots`.
   - Bước 6: Cập nhật con trỏ vòng (`campuses.default_entry_node_id`, `locations.primary_node_id`).
   - Bước 7: Seed `open_day_events`, `open_day_sessions`, `open_day_faqs`, `open_day_quiz_items`, *(và `campus_articles` nếu chọn CMS hóa `/news`)*.

---

## 9. Conflicts, Product Decisions & Technical Standards Required

Các hạng mục dưới đây được tách rõ giữa **Nhóm A — Quyết định Sản phẩm & Phạm vi (thuộc Chủ dự án quyết định)** và **Nhóm B — Yêu cầu Kiến trúc & Toàn vẹn Kỹ thuật (Kiến trúc sư / Team kỹ thuật tự chuẩn hóa theo nguyên tắc đã duyệt)**:

### 9.1. Nhóm A — Quyết định Sản phẩm & Phạm vi (`Product Decisions`)

| Decision ID | Bằng chứng (File & Dòng) | Mâu thuẫn / Khoảng trống | Tác động nếu không chốt | Phương án Đề xuất & Kết quả Chốt | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`OD-01`** | [`CampusGISMap.tsx`](../../apps/web/src/components/map/CampusGISMap.tsx), [`campus-data.ts:78-100`](../../apps/web/src/data/campus-data.ts#L78-L100) vs [`PHASE_2A_DATABASE_DESIGN.md:96-100`](../phase-2a/PHASE_2A_DATABASE_DESIGN.md#L96-L100), [`PHASE_2A_SYSTEM_ARCHITECTURE.md:44`](../phase-2a/PHASE_2A_SYSTEM_ARCHITECTURE.md#L44) | UI `/map` đã nâng cấp thành **Leaflet + OSM (FixNear)** cần `lat/lng NOT NULL`, `routeWaypoints`, `mapIconKey`, `shortName`, `floorsLabel`, `addressNote`, `statusNote`, `highlights`, `defaultSceneId`, `category = 'academic'\|'lab'\|'facility'`, và `QTSC_ORIGIN_POINT`. Tài liệu DB vẫn thiết kế theo bản đồ SVG cũ (`gis_x/gis_y NOT NULL`, `lat/lng NULLABLE`, `category = 'service'\|'sports'`). | Gãy hoàn toàn trang `/map` khi chuyển sang API hoặc mất khả năng quản trị marker/tuyến đường Leaflet từ DB. | Lấy **Leaflet + OpenStreetMap + WGS84 (`lat/lng NOT NULL`)** làm chuẩn GIS chính thức; bổ sung đầy đủ cột UI Leaflet & `origin_point`; giữ `gis_x/gis_y` là `NULLABLE` dự phòng; chuẩn hóa `BuildingCategory = academic \| lab \| facility`. | **Đã chốt (`OD-01`)** |
| **`OD-02`** | [`campus-data.ts:345,455,489-499`](../../apps/web/src/data/campus-data.ts#L345) vs [`PHASE_2A_DATABASE_DESIGN.md:232`](../phase-2a/PHASE_2A_DATABASE_DESIGN.md#L232) | Trong dữ liệu mẫu, cả `loc-sanh-innovation` (`INNOVATION`) lẫn `loc-the-thao` (`SPORTS`) cùng trỏ `sceneId = "cong-chao-qtsc"`. Schema quy định chặt `Location (1) — (N) TourNode` (`tour_nodes.location_id NOT NULL`). | Script seed hoặc API chi tiết `/locations/khu-the-thao-qtsc` sẽ vi phạm tính nhất quán Location ↔ TourNode hoặc lỗi FK. | Giữ nghiêm quan hệ `Location (1) — (N) TourNode`; đặt `loc-the-thao.primary_node_id = NULL` (`sceneId: null`) cho đến khi có panorama riêng, không tạo liên kết chéo giả. | **Đã chốt (`OD-02`)** |
| **`OD-03`** | [`campus-data.ts:808-833`](../../apps/web/src/data/campus-data.ts#L808-L833), [`news-items.ts:1-59`](../../apps/web/src/components/news/news-items.ts#L1-L59), [`campus-data.ts:26-43`](../../apps/web/src/data/campus-data.ts#L26-L43), [`admin/events/page.tsx`](../../apps/web/src/app/admin/events/page.tsx) vs [`PHASE_2A_DATABASE_DESIGN.md:298-300`](../phase-2a/PHASE_2A_DATABASE_DESIGN.md#L298-L300) & [`PHASE_2A_API_CONTRACT.md:241`](../phase-2a/PHASE_2A_API_CONTRACT.md#L241) | `open_day_faqs` thiếu bảng DB; `CAMPUS_GUIDE_ARTICLES` (`/news`) và `OFFICIAL_CAMPUS_INFO` (14 field `/about`, `/contact`, footer) không có bảng/API; `open_day_events` chưa tách khỏi chuỗi lặp; Admin CRUD `/admin/events` chưa có trong `API_CONTRACT`. | Không rõ phạm vi PostgreSQL đối với FAQ, News (`/news`), và thông tin tĩnh của trường (`/about`, `/contact`). | **Phương án B (Core Campus + Open Day):** DB hóa `open_day_events`, `open_day_sessions`, `open_day_faqs` + Admin CRUD `/admin/events`; giữ `/news` (`CAMPUS_GUIDE_ARTICLES`) & thông tin trường tĩnh (`OFFICIAL_CAMPUS_INFO`) ở cấu hình web tĩnh trong MVP. | **Đã chốt (`OD-03` Phương án B)** |
| **`OD-04`** | [`PHASE_2A_API_CONTRACT.md:165`](../phase-2a/PHASE_2A_API_CONTRACT.md#L165) vs [`PHASE_2A_DATABASE_DESIGN.md:287,292`](../phase-2a/PHASE_2A_DATABASE_DESIGN.md#L287) | Người tham gia Open Day (`STUDENT`, `PARENT`) được phép mời qua `EMAIL_SMS_INVITATION` (`phone`), tức có thể **không có `email`/`username`**, nhưng `POST /auth/login` chưa hỗ trợ `phone` và `users.phone` chưa chuẩn hóa/unique. | Người nhận lời mời SMS có `email = NULL` không thể kích hoạt/đăng nhập; import Excel dễ trùng lặp. | Cho phép đăng nhập bằng `username`, `email` hoặc `phone` đã kích hoạt; chuẩn hóa `phone` với `UNIQUE (phone) WHERE deleted_at IS NULL AND phone IS NOT NULL`; Excel dedup ưu tiên `email`, sau đó `phone` (tuyệt đối không dedup theo tên). | **Đã chốt (`OD-04`)** |
| **`OD-05`** | [`admin/events/page.tsx:27-68`](../../apps/web/src/app/admin/events/page.tsx#L27-L68), [`admin/users/page.tsx:75-76`](../../apps/web/src/app/admin/users/page.tsx#L75-L76) vs [`PHASE_2A_DATABASE_DESIGN.md:293`](../phase-2a/PHASE_2A_DATABASE_DESIGN.md#L293) & [`MVP_SCOPE_AND_ROUTE_DECISIONS.md:17-19`](../decisions/MVP_SCOPE_AND_ROUTE_DECISIONS.md#L17-L19) | UI Preview `/admin/events` có tab Check-in Open Day (`checkedIn`, `ticketCode`), trong khi `event_participations` chỉ có `INVITED \| CONFIRMED \| CANCELLED`. | Nhầm lẫn về phạm vi nghiệp vụ Check-in / QR ticket trong MVP. | **Phương án A:** **Chưa có nghiệp vụ Check-in QR hay điểm danh thật trong MVP.** Không thêm `CHECKED_IN`, `ticket_code`, `checked_in_at` vào DB hay API; giữ trạng thái tối giản `INVITED \| CONFIRMED \| CANCELLED`. | **Đã chốt (`OD-05` Phương án A)** |
| **`OD-08`** | [`CampusQuizStepper.tsx`](../../apps/web/src/components/quiz/CampusQuizStepper.tsx), [`PHASE_2A_DATABASE_DESIGN.md:300`](../phase-2a/PHASE_2A_DATABASE_DESIGN.md#L300), [`packages/shared/src/index.ts:39,151-167`](../../packages/shared/src/index.ts#L39) | `packages/shared` cũ trộn `xpPoints` & `QuizAttemptResult`; `open_day_quiz_items` đặt `correct_index` trong DB nhưng API public dễ lộ đáp án; chưa khóa việc không lưu lịch sử làm quiz cá nhân. | Lẫn lộn Public Orientation Quiz với hệ thống XP/Leaderboard có tài khoản. | Gỡ bỏ hoàn toàn `xpPoints`, `xpReward`, `QuizAttemptResult`, `quiz_attempts` khỏi MVP (chuyển sang `FUTURE`); `/games` & hotspot `QUIZ_TRIGGER` là **Public Orientation Quiz** không tài khoản, API public không trả sẵn `correctIndex` (chấm qua `POST /public/quiz/verify`). | **Đã chốt (`OD-08`)** |
| **`OD-10`** | [`campus-data.ts:487-706`](../../apps/web/src/data/campus-data.ts#L487-L706) vs [`PHASE_2A_DATABASE_DESIGN.md:109-155,232-247`](../phase-2a/PHASE_2A_DATABASE_DESIGN.md#L109-L155) | Các `TOUR_SCENES` hiện tại chưa có ảnh mặt bằng tầng thật (`FloorPlan`), khiến `tour_nodes.floor_plan_id` sẽ là `NULL` lúc khởi tạo dù panorama & Tour Graph đã hợp lệ. | Cản trở `PUBLISH` TourNode có panorama chuẩn chỉ vì thiếu ảnh mặt bằng tầng, hoặc ép tạo mặt bằng giả. | Cho phép `TourNode` tồn tại (`floor_plan_id = NULL`) và được `PUBLISH` độc lập khi panorama (`media_assets` 2:1 `READY`) & TourGraph hợp lệ; `VAL_UNPLACED_NODE` chỉ áp dụng khi `Floor` đã gắn `active_floor_plan_id` (yêu cầu định vị mặt bằng), tuyệt đối không tạo `FloorPlan` giả. | **Đã chốt (`OD-10`)** |

### 9.2. Nhóm B — Chuẩn Kỹ thuật & Toàn vẹn Hệ thống (`Technical Implementation Decisions`)

| Decision ID | Bằng chứng (File & Dòng) | Vấn đề Kỹ thuật | Giải pháp Chuẩn hóa (Architect / Tech Lead thực thi) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| **`OD-06`** | [`PHASE_2A_DATABASE_DESIGN.md:178,230,287`](../phase-2a/PHASE_2A_DATABASE_DESIGN.md#L178) & `L266-278` | 1. `users(username, email, phone)`, `locations.slug`, `tour_nodes.slug` thiếu partial unique `WHERE deleted_at IS NULL`.<br>2. `hotspots` thiếu `CHECK` theo `hotspot_type` ↔ `edge_id`.<br>3. Soft-delete `TourNode` chưa quy định xóa/ẩn `tour_edges` & `hotspots`.<br>4. `confirm-alignment` API chưa nêu rõ cập nhật `tour_nodes.floor_plan_id`.<br>5. Thiếu enum `SessionPeriod`, `ParticipationStatus`, `BuildingCategory`, `MapBuildingIconKey`, `PublishStatus` trên Open Day tables. | Áp dụng trọn bộ bản vá toàn vẹn schema trực tiếp vào `PHASE_2A_DATABASE_DESIGN.md`, `PHASE_2A_API_CONTRACT.md` và SQL migration ở Phase 2A-1; soft-delete `TourNode` thực hiện xóa transactional các `tour_edges` & `hotspots` liên đới. | **Áp dụng chuẩn kỹ thuật (`OD-06`)** |
| **`OD-07`** | [`PHASE_2A_SYSTEM_ARCHITECTURE.md:57,174-180`](../phase-2a/PHASE_2A_SYSTEM_ARCHITECTURE.md#L57) & [`PHASE_2A_API_CONTRACT.md:183,197`](../phase-2a/PHASE_2A_API_CONTRACT.md#L183) | `docker-compose` trong roadmap đưa Redis + MinIO vào ngay Phase 2A-1, làm nặng bước dựng PostgreSQL/Auth/Seed ban đầu khi ảnh tĩnh QTSC đã có sẵn cục bộ. | - **Phase 2A-1:** Chỉ dùng **PostgreSQL 16** (Docker) + Prisma + `apps/api` Core (`StorageAdapter` trừu tượng sẵn `LOCAL_FS` / `S3_MINIO`, in-memory rate limit).<br>- **Phase 2A-2:** Bật **Redis 7 + BullMQ** (và `MinIO/S3` hoặc `LOCAL_FS`) cho media pipeline. | **Áp dụng chuẩn kỹ thuật (`OD-07`)** |
| **`OD-09`** | [`packages/shared/src/index.ts:1-183`](../../packages/shared/src/index.ts#L1-L183), [`packages/shared/package.json`](../../packages/shared/package.json), [`apps/web/package.json`](../../apps/web/package.json) | `packages/shared` chứa model cũ (`CampusCode` 5 cơ sở, `PanoramaScene`, `xpPoints`, `EventRegistrationRequest`), chưa build `dist/`, chưa được `apps/web` sử dụng. | Viết lại toàn bộ `@fpt-campus/shared` khớp `OD-01`→`OD-10`, cấu hình `main`/`types`/`exports` trỏ `./dist/*`, build sạch và tích hợp trực tiếp vào `apps/web`. | **Áp dụng chuẩn kỹ thuật (`OD-09`)** |

---

## 10. Status Matrix (`READY / BLOCKED / NEEDS REVISION / FUTURE`)

| Hạng mục Kiểm tra | Trạng thái | Tóm tắt căn cứ |
| :--- | :--- | :--- |
| Git Repository, `.gitignore` & `pnpm` Workspace Isolation (`.npmrc`) | **READY** | Clean HEAD `9062c58`; `pnpm-workspace.yaml` nhận `apps/*` & `packages/*`; store cô lập trong `.pnpm-store`. |
| Kiến trúc Bảo mật Auth, Dual Provisioning & Chính sách Excel (`MVP_SCOPE`, `ADMIN_AUTH`) | **READY** | Đã gỡ plaintext `Fpoly@2026` & `prototype-auth.ts` ở Phase 1; chốt JWT RAM + Refresh cookie HttpOnly + Argon2id + 5-step Excel không lưu file gốc + không tự đăng ký `/register`. |
| 19 Routes hiện hữu & Bảo toàn Trải nghiệm Công khai Miễn phí | **READY** | `sitemap.ts` khớp public routes; `/games` ẩn menu chính; `/portal` chưa xây trong MVP; 3D WebGL ẩn. |
| Quy trình Panorama `2:1`, Floor Plan 4 định dạng, Ghost Overlay & Validator 7 luật | **READY** | Thiết kế rất chặt chẽ trong `PHASE_2A_PANORAMA_WORKFLOW.md` (`DEC-01`, `DEC-02`, `DEC-05`). |
| Chuẩn hóa Tên `TourNode` & Quan hệ `Location (1) — (N) TourNode` trong Docs | **READY** | Nhất quán trên cả 5 tài liệu `docs/phase-2a/*` (chỉ cần chỉnh dữ liệu seed `loc-the-thao` theo `OD-02`). |
| Lược đồ Bảng `buildings` & `campuses` vs Leaflet GIS (`/map`) | **NEEDS REVISION** | Tài liệu DB/Arch vẫn viết theo SVG `gisX/gisY`; code thực tế dùng Leaflet WGS84 `lat/lng` + `routeWaypoints` + `mapIconKey` + `QTSC_ORIGIN_POINT` (`OD-01`). |
| Ràng buộc Prisma/PostgreSQL (Partial Unique, Enum thiếu, Hotspot Check, Soft-delete Edge) | **NEEDS REVISION** | Cần bổ sung vào `PHASE_2A_DATABASE_DESIGN.md` và `migration.sql` theo `OD-06`, đồng thời xử lý login/unique bằng `phone` theo `OD-04`. |
| Phủ sóng Bảng & API cho `OPEN_DAY_FAQ`, `/news`, `OFFICIAL_CAMPUS_INFO`, `/admin/events`, `/public/tour/nodes` | **NEEDS REVISION** | Thiếu bảng `open_day_faqs`, `open_day_events`, `news_articles` (tùy `OD-03`) và thiếu một số endpoint Public/Admin tương ứng. |
| Hợp đồng `packages/shared` (`@fpt-campus/shared`) & cấu hình `package.json` | **BLOCKED** | Đang chứa model cũ trái ngược Phase 2A (`CampusCode` 5 cơ sở, `PanoramaScene`, `xpPoints`) và trỏ `main` về `.ts` thô (`OD-09`). Phải viết lại trước khi Web & API dùng chung. |
| Cấu hình `docker-compose.yml` & `.env.example` cho Local Dev PostgreSQL | **NEEDS REVISION** | Cần sửa hardcode `pg_isready`, xóa `version: '3.8'`, thêm `ADMIN_BOOTSTRAP_PASSWORD`, `WEB_ORIGIN`, `DATA_SOURCE`, `REDIS_URL`, tùy chọn `STORAGE_TYPE=local`. |
| Khởi tạo Mã nguồn PostgreSQL / Prisma / `apps/api` (Phase 2A-1 Code) | **BLOCKED** | Bị chặn cho tới khi Chủ dự án phê duyệt `OD-01` → `OD-10` và đồng bộ lại `docs/phase-2a/*` + `packages/shared`. |
| Student/Parent Portal (`/portal`), 3D Dollhouse WebGL, BFS Pathfinding, XP/Leaderboard | **FUTURE** | Nằm ngoài phạm vi MVP theo `MVP_SCOPE_AND_ROUTE_DECISIONS.md` và `PHASE_2A_IMPLEMENTATION_ROADMAP.md` (`Phase 2E / 3+`). |

---

## 11. Recommended Implementation Phases

Đề xuất sắp xếp lại thứ tự thực thi để **gỡ toàn bộ độ lệch hợp đồng trước khi chạm vào database**, sau đó đi theo từng lát cắt kiểm chứng được:

1. **Bước 0 — Contract & Design Alignment Gate *(1 ngày — Trước khi viết code DB)*:**
   - Trình Chủ dự án phê duyệt các quyết định `OD-01` → `OD-10`.
   - Cập nhật đồng bộ `PHASE_2A_DATABASE_DESIGN.md`, `PHASE_2A_API_CONTRACT.md`, `PHASE_2A_SYSTEM_ARCHITECTURE.md` (chuyển sang chuẩn Leaflet GIS, bổ sung `open_day_faqs`/`open_day_events`/CMS scope, sửa partial unique/enum/check constraints, chuẩn hóa `phone`/check-in).
   - Viết lại hoàn chỉnh `@fpt-campus/shared` (`packages/shared/src/*`) + cấu hình `dist/` build + kết nối vào `apps/web` (giữ build clean với mock adapter).
2. **Bước 1 — Phase 2A-1: PostgreSQL 16 + Prisma + Bootstrap Seed + Auth/RBAC + Core Read APIs *(3–4 ngày)*:**
   - Sửa `docker-compose.yml` & tạo `.env.example` hoàn chỉnh + `.env` local (không commit). Chạy duy nhất container `postgres` trước.
   - Khởi tạo `apps/api` (NestJS Modular Monolith + Prisma Client), tạo initial migration kèm custom SQL (partial unique indexes `WHERE deleted_at IS NULL`, `CHECK` constraints).
   - Viết `prisma/seed.ts` idempotent (chỉ seed 1 `admin` dùng `ADMIN_BOOTSTRAP_PASSWORD`, không fallback cứng; nạp dữ liệu QTSC thực tế từ `campus-data.ts` khớp 100% schema mới).
   - Triển khai `AuthModule`, `UsersRbacModule`, `AuditLogModule` và các endpoint đọc công khai tối thiểu (`/api/v1/public/campus`, `/locations`, `/tour/nodes`, `/events`) + Adapter `DATA_SOURCE=api|mock` trên `apps/web` để kiểm chứng web hiển thị dữ liệu thật từ PostgreSQL.
3. **Bước 2 — Phase 2A-2: Media Storage (`Local` → `MinIO/S3`) & BullMQ Pipeline *(4–5 ngày)*:**
   - Thêm `redis` + `minio` vào `docker-compose.yml` (hoặc dùng `LOCAL_FS` adapter cho media trước nếu chưa bật MinIO).
   - Triển khai `MediaPipelineModule` (chặn RAW/5.77:1, magic bytes, Sharp WebP `4K/2K/Thumb`, Admin Preview) và `FloorPlanModule` (4 định dạng + SVG sanitizer + PDF 300 DPI sandbox + Versioning + Snapshot + Ghost Overlay alignment).
4. **Bước 3 — Phase 2A-3: Full Admin CRUD, Tour Graph Engine & Validator API *(4–5 ngày)*:**
   - Hoàn thiện CRUD `buildings`, `floors`, `locations`, `tour/nodes`, `tour/hotspots` (`createReverseEdge`), `events`/`sessions`/`faqs`, `users`/`import` 5 bước, và `POST /admin/tour/validate` + `/publish`.
5. **Bước 4 — Phase 2B → 2D: Admin Studio 3 Vùng, Nạp Dữ Liệu Thật QTSC & Security/Load Audit:**
   - Nâng cấp UI `/admin/*` nối API thật, nạp mặt bằng từng tầng + ảnh chụp 360° QTSC thật, kiểm thử OWASP/IDOR/XSS SVG và Go-Live.

---

## 12. Acceptance Criteria for the First PostgreSQL Implementation Phase (`Phase 2A-1`)

Giai đoạn code PostgreSQL đầu tiên (**Phase 2A-1**) chỉ được coi là **NGHIỆM THU ĐẠT** khi thỏa mãn toàn bộ **10 tiêu chí kiểm chứng cụ thể** sau:

1. **Cổng Thiết kế đã Khóa:** Toàn bộ `OD-01` → `OD-10` đã được chốt; `docs/phase-2a/*` đồng bộ hoàn toàn Leaflet WGS84, toàn bộ enum (`SessionPeriod`, `ParticipationStatus`, `BuildingCategory`, `MapBuildingIconKey`, `PublishStatus`), và nguyên tắc `OD-10` (cho phép `TourNode` có panorama & TourGraph hợp lệ được `PUBLISH` khi `floor_plan_id = NULL`; `VAL_UNPLACED_NODE` chỉ áp dụng khi `Floor` có `active_floor_plan_id` yêu cầu định vị mặt bằng, không tạo `FloorPlan` giả).
2. **Hợp đồng Dùng chung Đồng bộ (`@fpt-campus/shared`):** `pnpm --filter @fpt-campus/shared build` xuất `dist/` sạch; `apps/web` và `apps/api` cùng import types/DTO trực tiếp từ `@fpt-campus/shared`; `pnpm typecheck` đạt `exit 0`.
3. **PostgreSQL Container Healthy bằng Biến Môi trường:** `docker compose up -d postgres` khởi chạy sạch; healthcheck dùng `${POSTGRES_USER}` và `${POSTGRES_DB}` đạt trạng thái `healthy` kể cả khi đổi cấu hình trong `.env`; không commit `.env` lên Git.
4. **Migration Sạch & Đủ Ràng Buộc:** `prisma migrate deploy` (hoặc `migrate dev`) áp dụng thành công trên DB trống; kiểm tra `pg_indexes` / `\d+` xác nhận có đủ **partial unique indexes (`WHERE deleted_at IS NULL`)** cho `buildings`, `floors`, `locations`, `tour_nodes`, `users` (`username`, `email`, `phone`) và **`CHECK` constraints** trên `tour_nodes`, `tour_edges`, `hotspots`.
5. **Seed Idempotent & An Toàn Bootstrap:** Chạy `prisma/seed.ts` **2 lần liên tiếp** không gây lỗi hay nhân bản dòng; thiếu `ADMIN_BOOTSTRAP_PASSWORD` phải fail rõ ràng (không fallback cứng, không chấp nhận `Fpoly@2026`); DB chứa **duy nhất 1 user ban đầu (`username = 'admin'`, `user_type = 'ADMIN'`, role `SUPER_ADMIN`, `must_change_password = true`)** với `password_hash` dạng `$argon2id$`.
6. **Xác thực Thành công Cổng Auth & Rotation:**
   - `POST /api/v1/auth/login` hỗ trợ `username | email | phone` (`OD-04`); sai trả HTTP `401` thông báo chung + tăng `failed_login_attempts` + ghi `audit_logs`; đúng trả `accessToken` + `Set-Cookie: refresh_token` (`HttpOnly; SameSite=Lax`) + `mustChangePassword: true`.
   - Khi `mustChangePassword === true`, mọi gọi `/api/v1/admin/*` trả `403 PASSWORD_CHANGE_REQUIRED`; sau `PATCH /api/v1/auth/me/password`, `must_change_password` về `false` và token cũ bị thu hồi.
   - Replay `refresh_token` đã rotate kích hoạt thu hồi toàn bộ `family_id`.
   - Tuyệt đối không tồn tại endpoint `/api/v1/auth/register`.
7. **Dữ liệu Công khai Phục vụ từ PostgreSQL:** Khi bật `DATA_SOURCE=api`, các endpoint `/api/v1/public/campus`, `/locations`, `/locations/:slug`, `/tour/nodes`, `/tour/nodes/:slug`, `/events` trả đủ dữ liệu QTSC thực tế (`5` tòa nhà kèm `lat/lng/routeWaypoints`, `6` địa điểm với `loc-the-thao` `primaryNodeSlug = null` theo `OD-02`, `5` `TourNode` độc lập có panorama hợp lệ được `PUBLISH` theo `OD-10` kèm `hotspots`, lịch Open Day & FAQ) với `status = 'PUBLISHED'` và `deleted_at IS NULL`; các thông tin tĩnh như `/news` và `OFFICIAL_CAMPUS_INFO` giữ theo cấu hình web tĩnh (`OD-03`).
8. **Không Phá Vỡ UI & 19 Routes Hiện Tại:** `apps/web` vẫn chạy `pnpm build`, `pnpm typecheck`, `pnpm lint` (`exit 0`); đủ 19 routes trả HTTP `200`; `/map` Leaflet, `/campus` 360°, `/locations`, `/events` hoạt động miễn phí không cần đăng nhập; `/admin/*` có Auth Guard ở Backend nếu đã nối API.
9. **Kiểm soát Rò rỉ Dữ liệu Nhạy cảm:** Grep client bundle và kiểm tra response `/api/v1/public/*` xác nhận **0 `password_hash`, 0 `token_hash`, 0 thông tin `DRAFT`/`ARCHIVED`, 0 đường dẫn/tên file Excel, 0 lộ `correctIndex` quiz khi chưa xác minh**.
10. **Ghi nhận Kiểm toán & Trạng thái Sạch:** Mọi thao tác bootstrap/login/thay đổi mật khẩu ghi nhận đầy đủ vào `audit_logs`, và có báo cáo kết quả chạy lệnh thực tế kèm Git commit tách riêng cho Phase 2A-1.
