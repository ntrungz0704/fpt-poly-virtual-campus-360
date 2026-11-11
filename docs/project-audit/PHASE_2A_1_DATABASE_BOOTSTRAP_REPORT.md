# PHASE 2A-1 — DATABASE BOOTSTRAP IMPLEMENTATION REPORT

**Ngày báo cáo:** 12/11/2026  
**Giai đoạn:** Phase 2A-1 (`Database Bootstrap — PostgreSQL 16 + Prisma 6 + Migrations + Seed + Integrity`)  
**Nhánh Git (`branch`):** `main`  
**Baseline trước Phase 2A-1:** [`dbbc6d6`](../project-audit/PHASE_2A_CONTRACT_ALIGNMENT_REPORT.md) (Contract Alignment) → [`5fac54e`](../project-audit/PHASE_2A_SCOPE_FINALIZATION_REPORT.md) (Scope Finalization)  
**Tài liệu đối chiếu chuẩn:** [`PHASE_2A_DATABASE_DESIGN.md`](../phase-2a/PHASE_2A_DATABASE_DESIGN.md) (`v2A.2`), [`PHASE_2A_IMPLEMENTATION_ROADMAP.md`](../phase-2a/PHASE_2A_IMPLEMENTATION_ROADMAP.md), [`ADMIN_AUTH_AND_SECURITY_ARCHITECTURE.md`](../architecture/ADMIN_AUTH_AND_SECURITY_ARCHITECTURE.md)

---

## 1. Executive Summary & Phase Gate Status

**Trạng thái triển khai Phase 2A-1:** **HOÀN TẤT ĐÚNG PHẠM VI — SẴN SÀNG NGHIỆM THU TRƯỚC KHI MỞ PHASE 2A-2.**

Toàn bộ hạ tầng cơ sở dữ liệu PostgreSQL 16 cục bộ, lược đồ Prisma ORM 6 (`prisma/schema.prisma` tại root repository), SQL migration có phiên bản kèm các chỉ mục duy nhất có điều kiện (`WHERE deleted_at IS NULL`) và `CHECK` constraints thực tế trong PostgreSQL, script `prisma/seed.ts` idempotent dữ liệu QTSC Quận 12 và bộ kiểm thử toàn vẹn dữ liệu trên database scratch cô lập đã được triển khai và kiểm chứng trực tiếp bằng lệnh thực tế (`12/12` test toàn vẹn PASS, `typecheck`/`lint`/`build` monorepo PASS `exit 0`).

- **Kiến trúc cô lập Phase 2A-1:** Không khởi tạo `apps/api/`, không viết NestJS Auth/Controller/Guard, không nối `apps/web` vào PostgreSQL (`DATA_SOURCE=mock` được giữ nguyên), không chạm mã nguồn `apps/web/**` và `packages/shared/**`, và không thêm Redis hay MinIO vào `docker-compose.yml` (theo [`PHASE_2A_SCOPE_FINALIZATION_REPORT.md`](./PHASE_2A_SCOPE_FINALIZATION_REPORT.md) và `OD-07`).

---

## 2. Infrastructure Configuration (`Docker Compose`, `.env.example`, Local `.env`)

### 2.1. Docker Compose (`postgres:16-alpine`)
Tệp [`docker-compose.yml`](../../docker-compose.yml) đã được chuẩn hóa:
- Loại bỏ thuộc tính deprecated `version: '3.8'`.
- Chỉ chạy duy nhất service `postgres` (`image: postgres:16-alpine`, `container_name: fpt_virtual_campus_db`, persistent named volume `postgres_data:/var/lib/postgresql/data`).
- Loại bỏ thông số hardcode trong healthcheck, thay bằng biến môi trường runtime:
  `pg_isready -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"` (được xác minh trực tiếp qua `docker inspect`: `["CMD-SHELL","pg_isready -U \"$POSTGRES_USER\" -d \"$POSTGRES_DB\""]`).
- `POSTGRES_PASSWORD` bắt buộc nạp từ `.env` thông qua `${POSTGRES_PASSWORD:?POSTGRES_PASSWORD must be set in .env}` (không có mật khẩu yếu hardcode trong repository).

### 2.2. Environment & Secret Hygiene
- [`docker-compose.yml`](../../docker-compose.yml) và [`.env.example`](../../.env.example) không chứa mật khẩu thật hay chuỗi mật khẩu thử nghiệm cũ.
- Bổ sung đầy đủ biến môi trường chuẩn cho Phase 2A trong [`.env.example`](../../.env.example): `NODE_ENV`, `PORT`, `DATA_SOURCE=mock`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`, `WEB_ORIGIN`, `API_PORT`, `RATE_LIMIT_STORE=memory`, `POSTGRES_*`, `DATABASE_URL`, `ADMIN_BOOTSTRAP_PASSWORD`, `JWT_*`, `STORAGE_DRIVER=local`, `LOCAL_MEDIA_ROOT`, `REDIS_URL`, và các placeholder `S3_*`.
- Tệp `.env` cục bộ được tạo bằng giá trị ngẫu nhiên an toàn qua `crypto.randomBytes`, được [`.gitignore`](../../.gitignore) loại trừ (`git check-ignore -v .env` xác nhận `.gitignore:8:.env`), không bao giờ đưa vào Git hoặc log đầu ra.

### 2.3. Container & Database Runtime Proof
- Container `fpt_virtual_campus_db` chạy ổn định ở trạng thái **`healthy`**, cổng host `0.0.0.0:5432->5432/tcp`.
- Phiên bản PostgreSQL xác nhận qua `psql`: `PostgreSQL 16.15 on x86_64-pc-linux-musl, compiled by gcc (Alpine 15.2.0) 15.2.0, 64-bit`.

---

## 3. Prisma Schema & Versioned SQL Migration Summary

### 3.1. Vị trí & Phiên bản Tooling
- [`prisma/schema.prisma`](../../prisma/schema.prisma) đặt tại thư mục gốc repository, độc lập hoàn toàn với `apps/api/`.
- Root [`package.json`](../../package.json) cài đặt `prisma@6.19.3`, `@prisma/client@6.19.3`, `argon2@^0.45.2`, `dotenv@^18.0.10`, `pg@^8.23.1`, `tsx@^4.23.15` kèm bộ scripts: `db:generate`, `db:migrate:dev`, `db:migrate:deploy`, `db:seed`, `db:status`, `db:studio`, `db:test`, và cấu hình `"prisma": { "seed": "tsx prisma/seed.ts" }`.
- Kiểm chứng cô lập: `apps/web` và `@fpt-campus/shared` không khai báo dependency `@prisma/client` hay `argon2`.

### 3.2. Độ phủ Bảng & Prisma Enums (`26` Tables, `17` Enums)
- **Tất cả 26 bảng nghiệp vụ** đặc tả tại Mục 3.1–3.5 của [`PHASE_2A_DATABASE_DESIGN.md`](../phase-2a/PHASE_2A_DATABASE_DESIGN.md) đều đã được ánh xạ chính xác (cộng bảng hệ thống `_prisma_migrations` = **27 bảng** thực tế trong schema `public`):
  - **3.1 Campus & FloorPlan (5 bảng):** `campuses`, `buildings`, `floors`, `floor_plans`, `floor_plan_alignment_snapshots`.
  - **3.2 Location & Media (4 bảng):** `location_types`, `locations`, `media_assets`, `location_media`.
  - **3.3 Tour Graph (3 bảng):** `tour_nodes`, `tour_edges`, `hotspots`.
  - **3.4 Auth, RBAC, Provisioning & Compliance (10 bảng):** `users`, `roles`, `permissions`, `user_roles`, `role_permissions`, `account_invitations`, `event_participations`, `user_import_batches`, `refresh_tokens`, `audit_logs`.
  - **3.5 Open Day & Public Orientation Quiz (4 bảng):** `open_day_events`, `open_day_sessions`, `open_day_faqs`, `open_day_quiz_items`.
- **Ghi chú đối chiếu số lượng Enum (`17` vs text `"18"` trong tài liệu tổng hợp):** Mục 4 của [`PHASE_2A_DATABASE_DESIGN.md`](../phase-2a/PHASE_2A_DATABASE_DESIGN.md) định nghĩa tường minh **17 Prisma enums** (`PublishStatus`, `ProcessingStatus`, `FloorPlanFormat`, `MediaKind`, `BuildingCategory`, `MapBuildingIconKey`, `TourEdgeType`, `AlignmentStatus`, `HotspotType`, `UserType`, `AccountStatus`, `ActivationStatus`, `ProvisioningMethod`, `InvitationChannel`, `InvitationStatus`, `SessionPeriod`, `ParticipationStatus`). Toàn bộ các cột phân loại còn lại (`location_types.code`, `location_types.filter_group`, `tour_nodes.category`, `roles.code`) được đặc tả là `VARCHAR` trong Mục 3 nên [`prisma/schema.prisma`](../../prisma/schema.prisma) triển khai chính xác **17 enums** theo đặc tả nguồn mà không tự ý phát sinh enum ngoài thiết kế.
- **SQL Migration:** [`prisma/migrations/20261111175635_init/migration.sql`](../../prisma/migrations/20261111175635_init/migration.sql) đã áp dụng thành công bằng `pnpm db:migrate:deploy`; `pnpm db:status` xác nhận `1 migration found` và `Database schema is up to date!`.

---

## 4. Custom PostgreSQL Constraints & Partial Indexes Verification

Kiểm tra trực tiếp `pg_indexes` và `pg_constraint` trong `virtual_campus_360` xác nhận **18 partial indexes (`WHERE deleted_at IS NULL`)** và **17 `CHECK` constraints** tồn tại thực sự trong PostgreSQL:

### 4.1. 12 Partial Unique Indexes (`WHERE deleted_at IS NULL`)
| Chỉ mục (`pg_indexes`) | Bảng | Biểu thức điều kiện |
|---|---|---|
| `uq_campuses_code_active` | `campuses` | `(code) WHERE (deleted_at IS NULL)` |
| `uq_buildings_campus_code_active` | `buildings` | `(campus_id, code) WHERE (deleted_at IS NULL)` |
| `uq_buildings_campus_slug_active` | `buildings` | `(campus_id, slug) WHERE (deleted_at IS NULL)` |
| `uq_floors_building_code_active` | `floors` | `(building_id, code) WHERE (deleted_at IS NULL)` |
| `uq_floors_building_level_active` | `floors` | `(building_id, level_index) WHERE (deleted_at IS NULL)` |
| `uq_locations_slug_active` | `locations` | `(slug) WHERE (deleted_at IS NULL)` |
| `uq_locations_building_code_active` | `locations` | `(building_id, code) WHERE (deleted_at IS NULL)` |
| `uq_tour_nodes_slug_active` | `tour_nodes` | `(slug) WHERE (deleted_at IS NULL)` |
| `uq_users_username_active` | `users` | `(username) WHERE (deleted_at IS NULL AND username IS NOT NULL)` |
| `uq_users_email_active` | `users` | `(email) WHERE (deleted_at IS NULL AND email IS NOT NULL)` |
| `uq_users_phone_active` | `users` | `(phone) WHERE (deleted_at IS NULL AND phone IS NOT NULL)` |
| `uq_open_day_events_key_active` | `open_day_events` | `(event_key) WHERE (deleted_at IS NULL)` |

*(Kèm **6 partial performance indexes**: `idx_buildings_campus_status`, `idx_locations_floor_type`, `idx_locations_building_status`, `idx_media_kind_status`, `idx_tour_nodes_location`, `idx_tour_nodes_floor_plan` đều có `WHERE deleted_at IS NULL`.)*

### 4.2. 17 PostgreSQL `CHECK` Constraints
- **`hotspots` (`OD-06` & phạm vi góc nhìn):**
  - `chk_hotspots_scene_link_edge_consistency`: `CHECK (((hotspot_type = 'SCENE_LINK' AND edge_id IS NOT NULL) OR (hotspot_type <> 'SCENE_LINK' AND edge_id IS NULL)))`
  - `chk_hotspots_yaw_range` (`[-180, 180]`), `chk_hotspots_pitch_range` (`[-90, 90]`)
- **`tour_edges`:**
  - `chk_tour_edges_no_self_loop`: `CHECK (from_node_id <> to_node_id)` (cùng `UNIQUE (from_node_id, to_node_id, edge_type)` và `hotspots.edge_id -> tour_edges.id ON DELETE CASCADE`).
- **`tour_nodes` (`OD-10` & phạm vi góc nhìn):**
  - `chk_tour_nodes_floor_coords_consistency`: `CHECK (((floor_plan_id IS NULL AND floor_norm_x IS NULL AND floor_norm_y IS NULL) OR (floor_plan_id IS NOT NULL AND floor_norm_x IS NOT NULL AND floor_norm_y IS NOT NULL)))`
  - `chk_tour_nodes_floor_norm_x_range`, `chk_tour_nodes_floor_norm_y_range` (`[0, 1]`), `chk_tour_nodes_initial_yaw_range` (`[-180, 180]`), `chk_tour_nodes_initial_pitch_range` (`[-90, 90]`), `chk_tour_nodes_initial_fov_range` (`[30, 100]`).
- **`buildings` (`OD-01`):** `chk_buildings_lat_wgs84` (`[-90, 90]`), `chk_buildings_lng_wgs84` (`[-180, 180]`), `chk_buildings_gis_x_range` / `chk_buildings_gis_y_range` (`[0, 100]` nullable).
- **`locations`:** `chk_locations_floor_norm_x_range` / `chk_locations_floor_norm_y_range` (`[0, 1]` nullable).
- **`open_day_quiz_items`:** `chk_open_day_quiz_items_correct_index_non_negative` (`correct_index >= 0`).

---

## 5. Seed Script Execution (`prisma/seed.ts` — Idempotency & QTSC Dataset)

Tệp [`prisma/seed.ts`](../../prisma/seed.ts) chèn dữ liệu đúng thứ tự khóa ngoại (bước 1 → 6, cập nhật reverse FKs ở bước 5) từ nguồn QTSC chính thức:

| Thực thể / Bảng | Seed Run 1 | Seed Run 2 (Re-run) | Tuân thủ quyết định (`OD-01..OD-10`) |
|---|---:|---:|---|
| `users` | **1** | **1** | Duy nhất user `admin`, `user_type = 'ADMIN'`, `must_change_password = true`, `password_hash` prefix `$argon2id$`. Run 2 trả `PRESERVED_EXISTING_ADMIN_PASSWORD` — không ghi đè mật khẩu đang có. |
| `roles` / `permissions` / `role_permissions` / `user_roles` | **3 / 10 / 18 / 1** | **3 / 10 / 18 / 1** | `SUPER_ADMIN` (`10` permissions), `TOUR_EDITOR` (`6`), `EVENT_OPERATOR` (`2`); `admin` gắn `SUPER_ADMIN`. |
| `location_types` | **11** | **11** | Khớp 11 `LocationTypeCode` chuẩn trong `@fpt-campus/shared`. |
| `campuses` | **1** | **1** | `QTSC-Q12`, `origin_point_json = QTSC_ORIGIN_POINT`, `default_entry_node_id -> 'cong-chao-qtsc'`. |
| `buildings` | **5** | **5** | `INNOVATION`, `TOA-T`, `TOA-F`, `TOA-P`, `SPORTS` đầy đủ WGS84 `lat/lng`, `route_waypoints_json`, `map_icon_key`; `SPORTS.default_node_id = NULL`. |
| `floors` / `floor_plans` | **6 / 0** | **6 / 0** | Tất cả `active_floor_plan_id = NULL`, `requires_floor_plan = false`; **0 FloorPlan giả (`OD-10`)**. |
| `media_assets` | **11** | **11** | 5 panorama `2048×1024` (`is_valid_2_to_1 = true`) + 6 ảnh 2D `1280×720` khớp byte/SHA-256 thực tế trong `apps/web/public/images`; **chỉ lưu object key tương đối, không lưu binary trong DB**. |
| `locations` / `location_media` | **6 / 6** | **6 / 6** | `khu-the-thao-qtsc` (`SPO-01`) có `floor_id = NULL` và **`primary_node_id = NULL` (`OD-02`)**. |
| `tour_nodes` | **5** | **5** | Toàn bộ 5 node có **`floor_plan_id = NULL`**, `floor_norm_x/y = NULL`, `status = 'PUBLISHED'` (`OD-10`). |
| `tour_edges` / `hotspots` | **11 / 16** | **11 / 16** | `11` `SCENE_LINK` hotspots liên kết 1-1 với `11` `tour_edges` + `5` `INFO` hotspots với `edge_id = NULL`. |
| `open_day_events` / `sessions` / `faqs` / `quiz_items` | **1 / 6 / 4 / 3** | **1 / 6 / 4 / 3** | `OD-03` Phương án B & `OD-08` (stateless quiz, không `quiz_attempts`, không `CHECKED_IN`/QR). |
| `audit_logs` | **1** | **1** | 1 bản ghi `SYSTEM_BOOTSTRAP_SEED` (không lưu mật khẩu/hash), không nhân bản khi re-seed. |

---

## 6. Acceptance Criteria Verification (`AC-01` → `AC-10`) & Integrity Suite

Bộ kiểm thử thực tế [`prisma/verify-db-integrity.ts`](../../prisma/verify-db-integrity.ts) (`pnpm db:test`) thực thi toàn bộ mutation test và reset test trên database scratch độc lập (`virtual_campus_360_verify`, được drop sạch sau khi xong, không bao giờ xóa dữ liệu trên `virtual_campus_360`): **12/12 PASS (0 lỗi)**:

| Tiêu chí | Nội dung kiểm chứng | Bằng chứng thực tế | Trạng thái |
|---|---|---|---|
| **AC-01** | PostgreSQL 16 healthy qua Docker Compose | `docker compose ps` (`healthy`), `psql SELECT version()` PostgreSQL 16.15 | **PASS** |
| **AC-02** | `.env` gitignored & `.env.example` hoàn chỉnh | `git check-ignore -v .env` khớp `.gitignore:8:.env`; không có mật khẩu thật trong repo | **PASS** |
| **AC-03** | Seed guard từ chối `ADMIN_BOOTSTRAP_PASSWORD` thiếu/yếu/lộ | 4 negative child-process tests (omitted env, `""`, `<12` ký tự, placeholder, legacy credential bị cấm) đều fail trước khi ghi DB (`users = 0`) | **PASS** |
| **AC-04** | Prisma schema & versioned migration sạch | `prisma validate`, `pnpm db:generate`, `pnpm db:migrate:deploy`, `pnpm db:status` (`up to date`), `26` domain tables + `17` enums | **PASS** |
| **AC-05** | Seed idempotent & bảo toàn mật khẩu Admin khi re-seed | Seed Run 1 = Run 2; kiểm tra thay đổi mật khẩu + `must_change_password = false` trên scratch DB sau đó re-seed vẫn giữ nguyên hash mới | **PASS** |
| **AC-06.1** | Chặn trùng lặp khóa duy nhất đang active | PG từ chối `23505` cho `uq_users_username_active`, `uq_users_phone_active` (`+84901234567`), `uq_locations_slug_active`, `uq_tour_nodes_slug_active` | **PASS** |
| **AC-06.2** | Cho phép tái sử dụng slug/phone sau soft-delete | Bản ghi `deleted_at IS NOT NULL` cho phép tạo bản ghi mới cùng `slug`/`phone`, nhưng bản ghi active thứ 2 vẫn bị chặn `23505` | **PASS** |
| **AC-06.3** | PG `CHECK` constraints (`hotspots` OD-06 & các bảng khác) | PG từ chối `23514` khi `SCENE_LINK` thiếu `edge_id`, `INFO` có `edge_id`, `yaw = 185`, `from_node_id = to_node_id`, tọa độ floor mồ côi khi `floor_plan_id IS NULL`, hoặc `correct_index = -1` | **PASS** |
| **AC-06.4** | Chặn Foreign Key không hợp lệ | PG từ chối `23503` khi `tour_nodes.location_id` hoặc `buildings.campus_id` không tồn tại | **PASS** |
| **AC-06.5/6** | Hợp lệ `OD-10` (`floor_plan_id = NULL`) & `OD-02` (`primary_node_id = NULL`) | Khả năng lưu & xuất bản (`PUBLISHED`) cho node chưa gắn mặt bằng và địa điểm ngoài trời chưa có 360° | **PASS** |
| **AC-06.7** | Chính sách xóa `TourNode` / `TourEdge` / `Hotspot` | Hard delete `TourNode` bị `23503` chặn; xóa `TourEdge` `ON DELETE CASCADE` sang `SCENE_LINK` hotspot; transaction soft-delete `TourNode` dọn sạch edges/hotspots liên đới và giữ nguyên `MediaAsset` | **PASS** |
| **AC-07** | Không lưu nhị phân ảnh lớn trong PostgreSQL | `media_assets` chỉ chứa object key tương đối `/images/...` | **PASS** |
| **AC-08** | Kiểm thử reset / re-init từ trống | Drop `virtual_campus_360_verify` → create → `prisma migrate deploy` → `seed` trả về số dòng khớp 100% database chính, sau đó drop scratch DB | **PASS** |
| **AC-09** | Regression monorepo (`typecheck`, `lint`, `build`) | `pnpm typecheck`, `pnpm lint`, `pnpm build` (`29` targets / `19` `page.tsx`), `tsc --noEmit --strict` cho `prisma/*.ts` đều `exit 0` | **PASS** |
| **AC-10** | Tài liệu báo cáo & trạng thái Git sạch | `docs/project-audit/PHASE_2A_1_DATABASE_BOOTSTRAP_REPORT.md` đầy đủ, 0 broken markdown links | **PASS** |

---

## 7. Security, Secret Hygiene & Monorepo Regression

- **Rà soát rò rỉ bí mật:** Quét `rg` toàn bộ `.env.example`, `docker-compose.yml`, `package.json`, `prisma/` xác nhận **0** chuỗi mật khẩu thật, **0** hash mật khẩu tĩnh và **0** legacy prototype password; chỉ xuất hiện tiền tố kiểm tra định dạng `.startsWith("$argon2id$")` trong script test.
- **Kiểm tra TypeScript trên script DB:** `pnpm exec tsc --noEmit --target es2022 --module commonjs --moduleResolution node --esModuleInterop --strict --skipLibCheck prisma/seed.ts prisma/verify-db-integrity.ts` → **PASS (`0` lỗi)**.
- **Regression Frontend & Shared Package (chạy sau mọi chỉnh sửa Phase 2A-1):**
  - `pnpm typecheck` → **PASS (`exit 0`)** (`@fpt-campus/shared` + `web`).
  - `pnpm lint` → **PASS (`exit 0`)**.
  - `pnpm build` → **PASS (`exit 0`, Next.js 16.4.6 Turbopack build sạch 29 trang/static outputs, bảo toàn 19 `page.tsx` routes)**.

---

## 8. Scope Compliance Confirmation

| Mục tiêu / Giới hạn | Kết quả kiểm chứng trực tiếp |
|---|---|
| `apps/api/` chưa được tạo | `Test-Path 'apps/api'` → **`False`** |
| `apps/web/**` & `packages/shared/**` không đổi | `git diff --name-only apps/web packages/shared` → **Trống (`0` tệp thay đổi)** |
| Không thêm Redis / MinIO ở Phase 2A-1 | [`docker-compose.yml`](../../docker-compose.yml) chỉ có service `postgres` |
| Không thêm Check-in QR / `quiz_attempts` / XP | Schema không chứa `CHECKED_IN`, `ticket_code`, `quiz_attempts` hay trường XP |
| Giữ nguyên commit nền [`dbbc6d6`](../project-audit/PHASE_2A_CONTRACT_ALIGNMENT_REPORT.md) & [`5fac54e`](../project-audit/PHASE_2A_SCOPE_FINALIZATION_REPORT.md) | Không amend/rebase lịch sử commit cũ |

---

## 9. Phase 2A-2 Readiness Recommendation

Phase 2A-1 (**Database Bootstrap**) đã hoàn thành trọn vẹn với PostgreSQL 16 thực tế đang chạy ổn định, schema & SQL constraints được khóa ở tầng Database và dữ liệu QTSC khởi tạo an toàn.

**Đề xuất bước tiếp theo sau khi Chủ dự án nghiệm thu Phase 2A-1:**
- Mở **Phase 2A-2 — Core Backend (`apps/api/`) + Auth/RBAC + `StorageAdapter` Local + Public Read APIs**, tiêu thụ trực tiếp [`@fpt-campus/shared`](../../packages/shared/package.json) và kết nối PostgreSQL 16 đã bootstrap (chưa bật `DATA_SOURCE=api` sang toàn bộ Frontend và chưa dựng UI Admin Studio 3 vùng của Phase 2B).
