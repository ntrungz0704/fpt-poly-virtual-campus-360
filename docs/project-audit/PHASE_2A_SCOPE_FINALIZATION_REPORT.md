# PHASE 2A — SCOPE FINALIZATION REPORT (FINALIZE `2A-1` → `2A-3`)

- **Ngày lập báo cáo:** 2026-11-12
- **Baseline trước Finalization:** Commit `dbbc6d6` trên nhánh `main` (`Phase 2A — Contract & Design Alignment v2A.2`, Accepted)
- **Trạng thái tại thời điểm lập báo cáo (`5fac54e`):** **`SCOPE FINALIZED — AWAITING EXPLICIT APPROVAL TO START PHASE 2A-1 (DATABASE BOOTSTRAP)`**
- **Chủ trương thực thi tại mốc `5fac54e`:** Tài liệu only — **không triển khai code, không khởi tạo Database/Backend, không tự động mở `Phase 2A-1`**.

> [!NOTE]
> **Cập nhật trạng thái hiện tại (Hậu nghiệm thu Phase 2A-1):** Mục 1 → Mục 6 bên dưới giữ nguyên giá trị lịch sử tại thời điểm chốt phạm vi (`5fac54e`). Xem cập nhật trạng thái hiện tại sau khi **`Phase 2A-1: ACCEPTED`** tại [Mục 7](#7-cập-nhật-trạng-thái-hậu-nghiệm-thu-phase-2a-1-post-acceptance-reconciliation) và báo cáo nghiệm thu [`PHASE_2A_1_FINAL_ACCEPTANCE_REPORT.md`](./PHASE_2A_1_FINAL_ACCEPTANCE_REPORT.md).

---

## 1. Các Tài Liệu Đã Chỉnh Sửa & Tạo Mới

| File | Vai trò | Tóm tắt nội dung chỉnh sửa |
| --- | --- | --- |
| [PHASE_2A_IMPLEMENTATION_ROADMAP.md](../phase-2a/PHASE_2A_IMPLEMENTATION_ROADMAP.md) | Lộ trình triển khai chuẩn (`v2A.2`, 152 dòng) | Sửa sơ đồ Mermaid, Callout nguyên tắc và Section 2 để tách riêng **`Phase 2A-1` (Database Bootstrap)**, **`Phase 2A-2` (Core Backend & Authentication)**, **`Phase 2A-3` (Business Modules)**; mỗi phase có **Phạm vi**, **Đầu ra** và **Tiêu chí nghiệm thu** riêng (bao trọn 7 lưu ý kỹ thuật kiểm chứng SQL/Transaction/Argon2id/Phone/Blob); tách rõ `Phase 2B` chuyên về nâng cấp UI Studio 3 vùng & FloorPlan Interactive Drawer; đồng bộ `Consistency Matrix` & Checklist Section 5. |
| [PHASE_2A_SYSTEM_ARCHITECTURE.md](../phase-2a/PHASE_2A_SYSTEM_ARCHITECTURE.md) | Kiến trúc hệ thống mục tiêu (`v2A.2`, 204 dòng) | Đồng bộ phạm vi đầu tài liệu, Bảng 1.1, Section 3, Bảng Module Section 4 (`AuthModule`, `FloorPlanModule`, `MediaPipelineModule`), Section 5 (`StorageAdapter` `LOCAL_FS` từ `2A-2`, không lưu panorama lớn vào PostgreSQL), Section 6 (rate limit `memory` `2A-2` / `redis` `2A-3+`), Section 7.1–7.3 (`Docker Compose` 3 giai đoạn & Zero-Downtime Cutover), và `DEC-03`. |
| [PHASE_2A_DATABASE_DESIGN.md](../phase-2a/PHASE_2A_DATABASE_DESIGN.md) | Thiết kế CSDL PostgreSQL 16 (`v2A.2`, 519 dòng) | Giữ nguyên toàn bộ 17 enums, bảng, cột và quyết định `OD-01..OD-10`; bổ sung tiểu mục *Ràng buộc kiểm chứng SQL Migration & Bảo mật DB (`Phase 2A-1` → `Phase 2A-3`)* khóa chặt partial unique indexes & `hotspots CHECK` trong file SQL migration, test vi phạm constraint, Argon2id + `ADMIN_BOOTSTRAP_PASSWORD`, không lưu ảnh nhị phân panorama vào DB, chuẩn hóa `users.phone`, soft-delete transaction `TourNode` và `confirm-alignment`. |
| [PHASE_2A_API_CONTRACT.md](../phase-2a/PHASE_2A_API_CONTRACT.md) | Đặc tả API `/api/v1` (`v2A.2`, 319 dòng) | Đồng bộ nhãn phase ở bảng HTTP `202 Accepted` (tác vụ async `Media`/`FloorPlan` chuyển sang `Phase 2A-3+`) và chú thích `StorageAdapter` (khởi tạo `local` từ `Phase 2A-2` cho Public Read/dev cục bộ; upload ở `Phase 2A-3`). |
| [PHASE_2A_CONTRACT_ALIGNMENT_REPORT.md](./PHASE_2A_CONTRACT_ALIGNMENT_REPORT.md) | Báo cáo Alignment (`v2A.2`) | Cập nhật Gate Decision header, sửa các tham chiếu phase ở Section 2.1, `OD-07` (Section 3), Section 6, Section 8, và viết lại toàn bộ **Section 9** tách sạch `2A-1` (Database Bootstrap ONLY), `2A-2` (Core Backend & Auth) và `2A-3` (Business Modules & Frontend Integration). |
| [PHASE_2A_SCOPE_FINALIZATION_REPORT.md](./PHASE_2A_SCOPE_FINALIZATION_REPORT.md) | Báo cáo chốt phạm vi *(file này)* | Văn bản đối chiếu cuối cùng chốt phạm vi, đầu ra, tiêu chí nghiệm thu, kiểm chứng consistency và cam kết giữ nguyên ranh giới trước khi bắt đầu `Phase 2A-1`. |

> [!NOTE]
> **Bảo toàn lịch sử kiểm toán:** Các tài liệu lịch sử đã phê duyệt trước đó ([PHASE_0_REPOSITORY_FOUNDATION_REPORT.md](./PHASE_0_REPOSITORY_FOUNDATION_REPORT.md), [PHASE_1_SECURITY_AND_MVP_CLEANUP_REPORT.md](./PHASE_1_SECURITY_AND_MVP_CLEANUP_REPORT.md), [PHASE_2A_READINESS_AND_DATA_CONTRACT_VERIFICATION.md](./PHASE_2A_READINESS_AND_DATA_CONTRACT_VERIFICATION.md), [MVP_SCOPE_AND_ROUTE_DECISIONS.md](../decisions/MVP_SCOPE_AND_ROUTE_DECISIONS.md), [ADMIN_AUTH_AND_SECURITY_ARCHITECTURE.md](../architecture/ADMIN_AUTH_AND_SECURITY_ARCHITECTURE.md)) và toàn bộ quyết định `OD-01` → `OD-10` được **giữ nguyên hoàn toàn**, không chỉnh sửa hay hồi tố.

---

## 2. Bảng Phân Chia Phạm Vi `Phase 2A-1`, `Phase 2A-2`, `Phase 2A-3`

| Tiêu chí | `Phase 2A-1` — **Database Bootstrap** | `Phase 2A-2` — **Core Backend & Authentication** | `Phase 2A-3` — **Business Modules** |
| --- | --- | --- | --- |
| **Mục tiêu kiểm soát rủi ro** | Xác minh toàn vẹn mô hình dữ liệu PostgreSQL, SQL constraints, khả năng reset/re-initialize và dữ liệu seed trước khi đụng tới code ứng dụng. | Xây khung NestJS Modular Monolith, xác thực/RBAC và luồng Public Read ổn định trên CSDL đã nghiệm thu. | Triển khai đầy đủ Admin CRUD, pipeline xử lý Media/FloorPlan, Tour Graph Engine, Open Day CMS và nối frontend từng module. |
| **Phạm vi công việc** | • Chạy local PostgreSQL 16 bằng Docker Compose (`postgres:16-alpine`).<br>• Hoàn thiện env configuration (`.env.example`, `.env` local không commit).<br>• Khởi tạo Prisma và `prisma/schema.prisma`.<br>• Tạo SQL migrations với đủ **17 Prisma enums**, indexes, **partial unique indexes (`WHERE deleted_at IS NULL`) trong SQL migration**, và **`hotspots CHECK` constraint trong SQL migration**.<br>• Seed dữ liệu QTSC đúng FK order (`ADMIN_BOOTSTRAP_PASSWORD` + Argon2id, `loc-the-thao.primary_node_id = NULL`, `floor_plan_id = NULL`, không lưu ảnh panorama lớn vào DB).<br>• Kiểm tra migration, seed idempotent, `prisma migrate reset` và DB integrity. | • Khởi tạo **NestJS Modular Monolith (`apps/api/`)**.<br>• Tích hợp Prisma Client và `@fpt-campus/shared`.<br>• Triển khai Auth (`POST /auth/login` chuẩn hóa `users.phone` trước khi check uniqueness/login, hỗ trợ `username \| email \| phone`; Argon2id; JWT RAM + Refresh Token cookie quay vòng & reuse revocation; `/me`, `/me/password`, `/activate/*`; cấm `/register`), RBAC + `audit_logs`.<br>• Triển khai `StorageAdapter` local (`STORAGE_DRIVER=local` map 8 ảnh seed QTSC).<br>• Triển khai toàn bộ **Public Read APIs** (`/public/campus`, `/buildings/:slug`, `/buildings/:slug/floors`, `/locations`, `/locations/:slug`, `/tour/nodes`, `/tour/nodes/:slug`, `/events`, `POST /public/quiz/verify` stateless). | • CRUD Campus, Building, Floor, Location.<br>• Floor Plan (`PNG/JPG/SVG/PDF`, snapshot, Ghost Overlay, `confirm-alignment` cập nhật `tour_nodes.floor_plan_id`), Panorama 2:1 pipeline (BullMQ + Redis & tùy chọn `MinIO/S3`, không lưu binary vào DB), `TourNode` (**soft-delete xử lý `tour_edges` & `hotspots` trong cùng transaction**), `TourEdge`, `Hotspot`, Graph Validator 7 luật (`OD-10`) & Publish.<br>• Open Day CMS (`/admin/events/*` CRUD) & Admin workflows (gồm 5-step Excel import, chuẩn hóa `phone`, dedup `email -> phone`, báo `IDENTITY_CONFLICT`, cấm lưu file/tên gốc).<br>• Kết nối frontend `apps/web` (`DATA_SOURCE=api`) với API thật theo từng module (giữ nguyên 19 routes & phạm vi MVP). |
| **Ngoài phạm vi (Cấm làm trong phase)** | **Không tạo `apps/api/`**, không NestJS, không Auth/RBAC runtime, không `StorageAdapter`, không API handlers, không Redis/MinIO, không sửa UI. | Không Admin Write CRUD (`Campus/Location/FloorPlan/TourNode/Events`), không upload/convert PDF & panorama async, không Redis/BullMQ/MinIO (trừ khi nâng hạ tầng ở `2A-3`), chưa nối cắt nguồn UI toàn bộ. | Không mở rộng sang Student/Parent Portal (`/portal`), 3D WebGL, Check-in QR (`OD-05`), hay Quiz XP/Leaderboard (`OD-08`). |
| **Đầu ra bắt buộc** | `docker-compose.yml` (`postgres:16`), `.env.example`, `prisma/schema.prisma`, `prisma/migrations/*` (có custom SQL), `prisma/seed.ts`, log kiểm chứng reset/seed/vi phạm constraint. | `apps/api/` (AuthModule, UsersRbacModule, AuditLogModule, PublicModule, `StorageAdapter` local), kết quả test HTTP auth/rotation/public read & kiểm chứng bảo mật. | Đầy đủ Admin Modules, Worker pipeline Media/FloorPlan, Tour Validator API, Open Day CMS, Adapter API trên `apps/web` nối từng module + kiểm thử E2E/build/lint. |
| **Tiêu chí nghiệm thu cốt lõi** | 1. `postgres` healthy theo biến `.env`.<br>2. `migrate deploy` & `migrate reset` sạch.<br>3. `pg_indexes`/`pg_constraint` & file SQL migration có đủ partial unique (`WHERE deleted_at IS NULL`) + `hotspots CHECK` **kèm testcase vi phạm constraint bị DB từ chối**.<br>4. Seed idempotent 2 lần sạch, Admin dùng `ADMIN_BOOTSTRAP_PASSWORD` + Argon2id (không hardcode), không lưu panorama lớn vào PostgreSQL.<br>5. `apps/api/` chưa tồn tại, `apps/web` giữ nguyên HTTP 200 & `exit 0`. | 1. `apps/api` build sạch, dùng trực tiếp `@fpt-campus/shared` & Prisma.<br>2. Chuẩn hóa `users.phone` trước khi check uniqueness/login; ép `403 PASSWORD_CHANGE_REQUIRED`; refresh reuse thu hồi `family_id`; không có `/register`.<br>3. Toàn bộ Public Read APIs trả đúng schema (`loc-the-thao.primaryNodeSlug = null`, `quiz` ẩn đáp án, 0 rò rỉ hash/DRAFT).<br>4. `StorageAdapter` local hoạt động không cần MinIO/Redis. | 1. Soft-delete `TourNode` dọn `tour_edges` & `hotspots` trong cùng transaction.<br>2. `confirm-alignment` cập nhật đúng `tour_nodes.floor_plan_id`.<br>3. SVG XSS bị sanitize, PDF render đúng trang, ảnh `5.77:1` bị chặn, `2:1` sinh 3 bản WebP không lưu binary trong PostgreSQL.<br>4. Excel dedup `email -> phone` (chuẩn hóa `phone`), báo `IDENTITY_CONFLICT`, không lưu file gốc.<br>5. Frontend nối API theo module chạy ổn định trên đủ 19 routes. |

---

## 3. Các Điểm Mâu Thuẫn Đã Giải Quyết

| # | Mâu thuẫn phát hiện giữa các tài liệu (Trước Finalization) | Cách giải quyết đã áp dụng (Sau Finalization) |
| --- | --- | --- |
| **C-01** | `PHASE_2A_CONTRACT_ALIGNMENT_REPORT.md` Section 9 (`Scope 2A-1`) gộp PostgreSQL, Prisma, NestJS, Auth (`/login`, `/change-password`, `/me`), Public Read APIs và `StorageAdapter` vào `Phase 2A-1`. | Thu hẹp Section 9 và cập nhật toàn văn Alignment Report: `Phase 2A-1` **chỉ gồm Database Bootstrap**; chuyển hoàn toàn NestJS, Auth/RBAC, Public Read APIs và `StorageAdapter` local sang **`Phase 2A-2`**; chuyển Admin CRUD/Media/Tour/OpenDay/Frontend API integration sang **`Phase 2A-3`**. |
| **C-02** | `PHASE_2A_IMPLEMENTATION_ROADMAP.md` (Section 1 Mermaid, Section 2 Step `2A-1..2A-3`, Section 4 Consistency Matrix, Section 5 Checklist) gộp NestJS + Auth + Public Read + `DATA_SOURCE=api` vào `2A-1`, và đặt Redis/BullMQ/Media/FloorPlan ở `2A-2` trước Business Modules `2A-3`. | Sắp xếp lại thống nhất đúng 3 tầng: `2A-1` (**Database Bootstrap**), `2A-2` (**Core Backend & Auth + `StorageAdapter` local + Public Read APIs**), `2A-3` (**Business Modules: Admin CRUD + FloorPlan/Panorama Pipeline + Open Day CMS + Frontend API Integration theo từng module**); `Phase 2B` giữ vai trò nâng cấp UI chuyên sâu (Studio 3 vùng & FloorPlan Interactive Drawer). |
| **C-03** | `PHASE_2A_IMPLEMENTATION_ROADMAP.md` dòng 41 tham chiếu trực tiếp sang `Section 12` của báo cáo kiểm toán lịch sử `PHASE_2A_READINESS_AND_DATA_CONTRACT_VERIFICATION.md` (vốn vẫn gộp `apps/api` + Auth + Core Read vào `2A-1`). | Giữ nguyên báo cáo kiểm toán `PHASE_2A_READINESS_AND_DATA_CONTRACT_VERIFICATION.md` (commit `d331ae7`) như hồ sơ lịch sử không hồi tố; thay tham chiếu ở `ROADMAP.md` bằng tiêu chí nghiệm thu tách riêng ngay trong từng phase `2A-1`, `2A-2`, `2A-3` (những tiêu chí DB ở `Section 12` cũ nay được phân bổ: tiêu chí 1–5 về DB -> `2A-1`, tiêu chí 6–7/9 về Auth & Public Read -> `2A-2`, nối Frontend -> `2A-3`). |
| **C-04** | `PHASE_2A_SYSTEM_ARCHITECTURE.md` (lines 5, 19, 22, 23, 57, 109, 112, 114, 124, 129–130, 168, 177–182, 189–190, 200) ghi `StorageAdapter (LOCAL_FS)`, `AuthModule`, `Core Read APIs`, `RATE_LIMIT_STORE=memory` ở `Phase 2A-1` và xử lý bất đồng bộ Media/FloorPlan ở `Phase 2A-2`. | Đồng bộ toàn bộ 14 vị trí trên về đúng 3 phase: `2A-1` chỉ lưu metadata key/path trong PostgreSQL seed (chưa có `apps/api` hay `StorageAdapter`), `2A-2` dựng NestJS + Auth/RBAC + `StorageAdapter LOCAL_FS` + `memory` rate limit + Public Read APIs, `2A-3` mở Business Modules + BullMQ/Redis + tùy chọn `MinIO/S3` + cắt `DATA_SOURCE=api` theo từng module. |
| **C-05** | `PHASE_2A_API_CONTRACT.md` (lines 51 & 234) ghi tác vụ bất đồng bộ `202 Accepted` ở `Phase 2A-2+` và `STORAGE_DRIVER=local` ở `Phase 2A-1/dev cục bộ`. | Sửa dòng 51 thành `Phase 2A-3+` và dòng 234 thành `STORAGE_DRIVER=local (khởi tạo từ Phase 2A-2 cho Public Read/dev cục bộ; phục vụ upload Business Modules ở Phase 2A-3)`. |
| **C-06** | `PHASE_2A_CONTRACT_ALIGNMENT_REPORT.md` lines 85, 126, 129, 163–164 nhắc tới `apps/api` và `DATA_SOURCE=api` tại `Phase 2A-1`. | Chỉnh nhất quán thành `apps/api` từ `Phase 2A-2` và nối nguồn `DATA_SOURCE=api` theo từng module tại `Phase 2A-3`. |
| **C-07** | Các lưu ý kiểm chứng kỹ thuật từ thẩm định (partial unique phải có trong SQL migration, `hotspots CHECK` + test vi phạm, soft-delete `TourNode` transaction, `confirm-alignment` set `floor_plan_id`, chuẩn hóa `users.phone`, Argon2id + env password không hardcode, không lưu ảnh panorama lớn vào DB) cần gắn rõ vào tiêu chí từng phase. | Tích hợp đầy đủ cả 7 điểm vào `PHASE_2A_DATABASE_DESIGN.md`, `PHASE_2A_IMPLEMENTATION_ROADMAP.md`, `PHASE_2A_CONTRACT_ALIGNMENT_REPORT.md` Section 9, và Bảng Mục 2 của báo cáo này. |

---

## 4. Kết Quả Kiểm Tra Consistency

Toàn bộ các kiểm tra đối chiếu tài liệu và ranh giới phạm vi sau lần chỉnh sửa cuối cùng đều **PASS**:

| Hạng mục kiểm tra | Lệnh / Cơ chế kiểm chứng | Kết quả quan sát thực tế |
| --- | --- | --- |
| **Toàn vẹn liên kết Markdown** | `check_md_links.cjs` | **PASS** (`Checked Markdown files: 48, Broken links: 0`). |
| **Nhất quán `2A-1 → 2A-3` trên Specs & Alignment Report** | `rg -n "2A-1" docs/phase-2a docs/project-audit/PHASE_2A_CONTRACT_ALIGNMENT_REPORT.md` | **PASS** (`exit 0`, toàn bộ các dòng khớp đồng nhất `Phase 2A-1` chỉ là Database Bootstrap; NestJS/Auth/Public Read/`StorageAdapter local` nằm ở `2A-2`; Business Modules/Frontend API Cutover nằm ở `2A-3`). |
| **Ranh giới không tạo Backend/Prisma** | `Test-Path "apps/api"`, `Test-Path "prisma"` | **PASS** (`apps/api exists: False`, `prisma exists: False`). |
| **Ranh giới chỉ chỉnh sửa tài liệu** | `git diff --name-only` & `git status --short` | **PASS** — Chỉ gồm `5` file `.md` chỉnh sửa (`PHASE_2A_API_CONTRACT.md`, `PHASE_2A_DATABASE_DESIGN.md`, `PHASE_2A_IMPLEMENTATION_ROADMAP.md`, `PHASE_2A_SYSTEM_ARCHITECTURE.md`, `PHASE_2A_CONTRACT_ALIGNMENT_REPORT.md`) và `1` file `.md` mới (`PHASE_2A_SCOPE_FINALIZATION_REPORT.md`). Không chạm bất kỳ file code `.ts`/`.tsx`/`.json`/Docker/env nào. |
| **Hồ sơ lịch sử & quyết định `OD-01..OD-10`** | Đối chiếu file lịch sử & mục tiêu | **PASS** — `PHASE_0_*`, `PHASE_1_*`, `PHASE_2A_READINESS_AND_DATA_CONTRACT_VERIFICATION.md`, `MVP_SCOPE_AND_ROUTE_DECISIONS.md`, `ADMIN_AUTH_AND_SECURITY_ARCHITECTURE.md` và `OD-01..OD-10` được bảo toàn nguyên vẹn. |

---

## 5. Commit SHA & Git Status

- **Commit Alignment trước Finalization:** `dbbc6d6` (`docs(phase-2a): align specs, shared contracts, and web data per OD-01..OD-10`) trên nhánh `main`.
- **Phạm vi thay đổi của đợt Finalization này:** Chỉ chỉnh sửa 5 file tài liệu trong `docs/phase-2a/*` và `docs/project-audit/*` và tạo mới file báo cáo này (`6` file Markdown trong `docs/**`).
- **Commit SHA của đợt Scope Finalization:** Được tạo ngay sau bước kiểm tra cuối cùng trên nhánh `main` (xem `git log -n 2 --oneline` trong báo cáo bàn giao), đảm bảo working tree sạch (`git status --short` rỗng) và tách bạch hoàn toàn với mọi thay đổi code trong tương lai.

---

## 6. Xác Nhận Không Thay Đổi Code & Chưa Triển Khai Database / Backend

1. **Không tạo mã nguồn mới:** `Test-Path "apps/api"` -> `False`; `Test-Path "prisma"` -> `False`.
2. **Không sửa code Frontend, Shared, Docker hay Env:** Toàn bộ thay đổi chỉ nằm trong `docs/phase-2a/*` và `docs/project-audit/*`. Không sửa `apps/web/**`, `packages/shared/**`, `docker-compose.yml`, hay `.env*`.
3. **Không chạy Docker hay PostgreSQL:** Không có container PostgreSQL/Redis/MinIO nào được khởi chạy, không có migration hay seed nào được thực thi.
4. **Không thay đổi quyết định sản phẩm & MVP:** Giữ nguyên 100% quyết định `OD-01` → `OD-10`, toàn bộ 19 route trên `apps/web`, và giữ trạng thái **DỪNG trước `Phase 2A-1`**, không tự động khởi chạy `Phase 2A-1`.

---

## 7. Cập nhật Trạng thái Hậu Nghiệm Thu Phase 2A-1 (Post-Acceptance Reconciliation)

*Phần bổ sung này cập nhật tiến độ thực tế trên nhánh `main` sau thời điểm chốt phạm vi (`5fac54e`) mà **không sửa đổi** nội dung lịch sử kiểm toán ở Mục 1 → Mục 6:*

| Giai đoạn | Trạng thái Hiện tại | Căn cứ & Dẫn chiếu |
|---|---|---|
| **`Phase 2A-1` — Database Bootstrap** | **`ACCEPTED`** | Triển khai PostgreSQL 16 + Prisma 6 (`26` models, `17` enums), migrations, seed idempotent & kiểm thử toàn vẹn (`pnpm db:test`: `13/13 PASS`; R-01 → R-04 đã xử lý; D-01/D-02 đã khóa). Mốc commit: Baseline `1117e7a` → Remediation `605db97` → Báo cáo nghiệm thu cuối [`PHASE_2A_1_FINAL_ACCEPTANCE_REPORT.md`](./PHASE_2A_1_FINAL_ACCEPTANCE_REPORT.md) (`7e1753d`). |
| **`Phase 2A-2` — Core Backend & Authentication** | **Chưa triển khai** | `apps/api/` **chưa tồn tại**; sẵn sàng lập prompt triển khai khi có phê duyệt mới của Chủ dự án (mang theo 4 lưu ý chuyển tiếp: lọc `TourNode PUBLISHED` & không lộ placeholder chưa duyệt trên Public API, mapper hai chiều `BuildingCategory`/`MapBuildingIconKey`, giữ phân loại dev seed QTSC và thay ảnh 360° thật trước Go-Live). |
| **`Phase 2A-3` — Business Modules** | **Chưa triển khai** | Chưa mở phạm vi Admin Write CRUD, Media/FloorPlan Pipeline và kết nối `apps/web` (`DATA_SOURCE=api`). |
| **`Phase 2B` — Admin Studio UI** | **Chưa triển khai** | Chưa mở phạm vi nâng cấp Studio 3 vùng & FloorPlan Interactive Drawer. |
