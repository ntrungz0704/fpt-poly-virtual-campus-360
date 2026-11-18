# PROJECT_STATUS — FPT Polytechnic Virtual Campus 360°

> [!IMPORTANT]
> **Trạng thái đương đại mới nhất (Full Project Health Check `2026-11-18` — Batch A & B `ACCEPTED`, Batch C1–C3 `IMPLEMENTED & PUSHED`, +2 P1 Fixes trên `audit/comprehensive-quality-remediation`):**
> - **`origin/main` HEAD (Single Source of Truth — không tự ý merge):** `c0a268dafaeb84c537f667cabad82b63ee3d39bb` (merge commit của PR [#2](https://github.com/ntrungz0704/fpt-poly-virtual-campus-360/pull/2) gồm `10f8471` và `a8b3833`, trên nền `ef03ce9`; local `main` tại `ef03ce9` chậm 3 commit so với `origin/main`).
> - **Audit Branch:** `audit/comprehensive-quality-remediation` (sync với `origin/audit/comprehensive-quality-remediation`; `20+` commit ahead, `0` behind `origin/main`).
> - **Milestones đã hoàn thành trên `main`:** M1–M7.5 và **M8** (Open Day Event & QR Check-in Engine, B01/B02).
> - **Trạng thái các Batch Remediation:**
>   - **Batch A — `ACCEPTED` (`6aa4427`):** `bff4323`, `09d0bcc` (B-A1/B-A2), `a9bbfaa` (B-A3 Option 1).
>   - **Batch B — `ACCEPTED` (`1fee256`, docs sync `3f446f5`):** `a388652` & `c3096c5` (B-B1), `aca1ab5` & `4de2026` (B-B2), `fe1531b` (B-B3), `1fee256` (B-B4).
>   - **Batch C (`C1`–`C3`) — `IMPLEMENTED & PUSHED` (chờ Tech Lead formal acceptance):** `fb519c3` (B-C1 UX/schedule/inline alerts/RBAC shortcuts), `6cdc3fe` & `74839f9` (B-C2 Events countdown & Public content honesty), `bd10727` & `968a871` (B-C3 Dynamic DB Sitemap & single `robots.ts`).
>   - **Health Check P1 Fixes (`2026-11-18`):** Vá mapper `INFO` hotspot `infoText`/`body` trong `apps/web/src/lib/public/public-api.ts` (+ regression unit test) và khắc phục timeout 5000ms giao dịch `prisma.$transaction` trong `prisma/seed.ts` (`{ maxWait: 10_000, timeout: 60_000 }`).
> - **Ranh giới sẵn sàng dự án:** **KHÔNG ĐẠT PRODUCTION-READY.** Còn thiếu **Batches D–F** (cleanup dead code, sửa cô lập E2E suite toàn phần), thiếu hạ tầng DevOps/CI (`.github/workflows`, Dockerfiles `web`/`api`, Nginx/TLS, Redis, S3/R2 active buckets, SMTP/SMS provider thật thay `LocalStubInvitationDeliveryAdapter`, backup/monitoring), còn `4 high` vulnerability advisories trong `pnpm audit --prod` (`xlsx`, `zod`, `deepmerge-ts`), và 5 panorama seed hiện vẫn là AI synthetic placeholder (`isPreviewApproved` không đạt chuẩn ảnh QTSC thật).

---

## 1A. Hiện Trạng Đương Đại Chi Tiết (Cập nhật `2026-11-18` trên nhánh `audit/comprehensive-quality-remediation`)

| Lĩnh vực | Trạng thái Thực tế | Chi tiết Kiểm chứng Kỹ thuật |
|---|---|---|
| **Git & GitHub Remote** | **VERIFIED & SYNCED** | Duy nhất `main` (`origin/main` `c0a268d`) và `audit/comprehensive-quality-remediation` (`0` stale branches cần xóa). `0` open PRs; PR #1 & #2 đã `MERGED`. `.github/workflows` chưa tồn tại (`0` CI runs). Không lộ secret trong Git history/files đã kiểm tra (`.env` bị ignore). |
| **Cơ sở dữ liệu (Prisma + PostgreSQL 16)** | **MIGRATIONS OK / LOCAL PRIMARY DB DRIFT** | Schema có `39` Models, `23` Enums, `14` migrations. `pnpm db:test` **PASS `14/14` (`AC-08` hết timeout)** trên scratch DB. **Cảnh báo:** DB local chính `virtual_campus_360` thiếu bảng `_prisma_migrations` và thiếu cột/index Batch A/B (`guest_session_id`, `uq_event_participations_active_email`) nên `pnpm db:status` FAIL (`exit 1`); chạy `preflight-m1-quiz-event.sql` đạt `3/3 RESOLVED (R1_SESSION)`. |
| **Backend Core & Business API (`apps/api`)** | **IMPLEMENTED & VERIFIED** | `14` NestJS Modules, toàn bộ Admin/Portal/Parent API được bảo vệ bằng Global `JwtAuthGuard` + `ForcePasswordChangedGuard` + `PermissionsGuard` + `CsrfCookieGuard` + `ThrottlerGuard`. `0` `$queryRawUnsafe` ở source production. Còn mismatch phụ công thức spin ở `PortalService` (`+1/100 XP`) vs `GamificationService` (không cộng theo XP) và stub gửi thư mời `LocalStubInvitationDeliveryAdapter`. |
| **Giao diện Web (`apps/web`)** | **IMPLEMENTED & BUILD PASS (`28` pages + SEO routes)** | Next.js 16.4.6 App Router (`28` `page.tsx` + `/_not-found`, `/robots.txt`, `/sitemap.xml`). Tour 360° dùng Three.js WebGL thật (đã vá mapper `body -> infoText` cho INFO hotspots); GIS Map dùng Leaflet + OpenStreetMap + tọa độ QTSC thật; 3D GLB/Walk Mode đã chốt loại khỏi MVP (`MVP_SCOPE_AND_ROUTE_DECISIONS.md`). |
| **Kiểm thử Tự động & Build (Sau P1 fix `2026-11-18`)** | **UNIT/BUILD/DB PASS · FULL E2E CÒN 6 LỖI** | `@fpt-campus/shared build/typecheck` PASS; `api lint/typecheck/build` PASS + unit **11/11 suites (42/42 PASS)**; `web lint/typecheck/build` PASS + unit **49/49 PASS**; `pnpm db:test` **14/14 PASS**. `api test:integration` đạt **22/22 suites (198/198 PASS)** trước 2 bản vá P1 `public-api.ts` & `seed.ts` (`seed.ts` đã kiểm lại qua `db:test`). Full `pnpm --filter web test:e2e` trên nền `968a871`: **17 passed, 6 failed, 10 did not run** (do `@Throttle(5/60s)` `/auth/login`, đụng độ tài khoản `e2e_operator` với B3, strict selector React SSR `<div hidden id="S:0">` ở `/locations/[slug]`, và ticket giả `localStorage` ở `gamification-flow.spec.ts`). |
| **DevSecOps & Production Readiness** | **NOT PRODUCTION READY** | Thiếu CI/CD (`.github/workflows`), thiếu `Dockerfile` cho `api`/`web`, thiếu Nginx/TLS, chưa cấu hình Redis thật (`RATE_LIMIT_STORE=memory`) và Object Storage S3/R2 thật (`STORAGE_DRIVER=local`), `pnpm audit --prod` còn **4 HIGH** (`xlsx` Prototype Pollution/ReDoS chưa có bản vá npm, `zod`, `deepmerge-ts`). |

> [!NOTE]
> Phần **Mục Lịch sử Cận kề (`2026-11-17` — Batch A & B)** bên dưới được giữ nguyên làm mốc đối chiếu trước đợt Health Check `2026-11-18`.

### Mốc Lịch sử Cận kề: Post-M8 + Audit Batch A & B (`2026-11-17`)

| Lĩnh vực | Trạng thái Thực tế | Chi tiết Kiểm chứng Kỹ thuật |
|---|---|---|
| **Cơ sở dữ liệu (Prisma + PostgreSQL 16)** | **VERIFIED (`14` migrations)** | `39` Models, `23` Enums, quản lý qua `14` migrations (B-A1 thêm `20261117000001_gamification_guest_session_id`; B-B1 thêm `20261117000002_event_participation_active_email_unique` khóa trùng email active). |
| **Backend Core & Business API (`apps/api`)** | **BATCH A & B ACCEPTED** | `14` NestJS Modules: `GET /api/v1/admin/overview` (B-B3 PostgreSQL counts), `GET /api/v1/admin/audit-logs` (`audit:read`), `TourAdminService` đồng bộ TX/edge/`deleteNode`/guard `tour:publish` trên `updateNode` (B-B2), `NewsAdminService`/`NewsPublicService` xử lý `BigInt` & loại media `deleted_at IS NOT NULL` (B-B4), `PublicService.registerEvent` chống race `P2002` (B-B1). |
| **Bảo mật & Phân quyền (Auth & RBAC)** | **POLICY LOCKED & VERIFIED (`auth-session` 4/4 PASS)** | `prisma/seed.ts:1311` giữ nguyên `mustChangePassword: true`; E2E runner đồng bộ `E2E_ADMIN_BOOTSTRAP_PASSWORD`; `PATCH /admin/tour/nodes/:id` chặn đổi `status` thiếu `tour:publish` (`403`); `/admin/audit-logs` giữ chặt `audit:read` (`403` cho `TOUR_EDITOR`/`EVENT_OPERATOR`). |
| **Giao diện Web (`apps/web`)** | **VERIFIED BUILD (`28/28` routes)** | Next.js 16.4.6 App Router (`28` routes): gỡ 100% `localStorage`/`TOUR_SCENES` ở Tour Studio & Admin Locations (B-B2); gỡ KPI/log giả trên Dashboard Admin & xử lý `403`/error/empty/loading qua `apiRequestEnvelope` (B-B3); dọn timer/unmount trong `SpinWheel.tsx` qua `createSpinTimerLifecycle()` (B-B4). |
| **Bộ kiểm thử tự động sau B-B4 (`1fee256`)** | **SCOPED REGRESSION PASS (PostgreSQL 16)** | `@fpt-campus/shared build`, `api build/lint/typecheck` (`0` lỗi), **11/11** API unit suites (**42/42 PASS**), `web lint/typecheck/build` (`28/28`) & **32/32** Web unit tests PASS; **5/5** PG16 integration suites trọng tâm sau `1fee256` (**36/36 PASS**: `news-cms` 17/17, `audit-batch-a` 9/9, `audit-batch-b1` 5/5, `audit-batch-b2` 3/3, `audit-batch-b3` 2/2). Thêm E2E `admin-dashboard-b3.spec.ts` (**2/2 PASS**) ở B-B3 & `open-day-flow.spec.ts` (**5/5 PASS**) ở B-B1. Còn lỗi E2E pre-existing ngoài scope (`auth-integration #5`, `portal-flow #4`), full regression Batch E & CI chưa chạy. |

---

## 1. Trạng thái Lịch sử Mốc Phase 2A-3 (`ff13f14`)

- **Cơ sở mục tiêu:** Trường Cao đẳng FPT Polytechnic TP.HCM — Công viên Phần mềm Quang Trung (QTSC), Quận 12.
- **Tài liệu chuẩn hóa Phase 2A-3 (`M0`):**
  - Scope Lock: [`PHASE_2A_3_SCOPE_LOCK.md`](docs/phase-2a/PHASE_2A_3_SCOPE_LOCK.md)
  - Decision Register (`D-2A3-01` → `D-2A3-08`): [`PHASE_2A_3_DECISION_REGISTER.md`](docs/phase-2a/PHASE_2A_3_DECISION_REGISTER.md)
  - Implementation Plan (`M0–M7`): [`PHASE_2A_3_IMPLEMENTATION_PLAN.md`](docs/phase-2a/PHASE_2A_3_IMPLEMENTATION_PLAN.md)
  - Lộ trình tổng thể Phase 2A: [`PHASE_2A_IMPLEMENTATION_ROADMAP.md`](docs/phase-2a/PHASE_2A_IMPLEMENTATION_ROADMAP.md)

| Lĩnh vực | Trạng thái Hiện tại (`ff13f14`) | Chi tiết Thực tế Đã Xác minh |
|---|---|---|
| **Database (`prisma/` + PostgreSQL 16)** | **ACCEPTED (`Phase 2A-1`)** | `postgres:16-alpine` trong `docker-compose.yml`; `prisma/schema.prisma` (`26` models, `17` enums), custom SQL migration `20261111175635_init`, seed idempotent (`1` Event, `6` Sessions, `4` FAQs, `3` Quiz items chưa có `event_id`, `5` AI placeholder panoramas `isPreviewApproved=false` + `5` `TourNode` `DRAFT`, `6` ảnh 2D). |
| **Core Backend (`apps/api/`)** | **ACCEPTED (`Phase 2A-2`)** | NestJS Modular Monolith đã merge với **6 modules**: `health`, `storage` (`LocalStorageAdapter` read-only 4 methods), `audit-log`, `users-rbac` (non-bulk provisioning/status/resend + `LocalStubInvitationDeliveryAdapter`), `auth` (Argon2id, JWT + refresh cookie rotation/reuse, CSRF/CORS), `public` (campus/buildings/floors/locations/tour/events). |
| **Giới hạn Bảo mật Public Quiz** | **LOCKED (Fail-Closed)** | Theo remediation `04fa094` / `b8aac75`, `GET /api/v1/public/events` trả `quizItems: []` và `POST /api/v1/public/quiz/verify` trả `404 NOT_FOUND` trước khi truy vấn DB vì `open_day_quiz_items` chưa có `event_id` FK. Chỉ mở lại sau khi hoàn tất `M1` + `M2` (`D-2A3-02`). |
| **Phase 2A-3 Business Modules & Infra** | **CHƯA TRIỂN KHAI (Đang ở `M0`)** | Chưa triển khai Admin CRUD (`/admin/campus`, `/admin/locations`, `/admin/media`, `/admin/floor-plans`, `/admin/tour`, `/admin/events`), Bulk Import (`POST /admin/users/import/*`), Three-Zone Storage, Redis 7 + BullMQ worker, hay migration `open_day_quiz_items.event_id`. Đang khóa tài liệu tại `M0`. |
| **Frontend (`apps/web/`)** | **Giữ nguyên (`DATA_SOURCE=mock`)** | Toàn bộ 19 routes chạy trên dữ liệu mock; theo quyết định **`D-2A3-01` (`OWNER APPROVED`)**, `apps/web` **không thay đổi** trong Phase 2A-3 và toàn bộ việc nối API thật, `/login`, `/activate`, Admin UI thuộc **Phase 2B**. |

### Phân loại Tài liệu Lịch sử Phase 1 & Lưu trữ (`Historical / Archive Notice`)

> [!CAUTION]
> **Không dùng tài liệu lịch sử Phase 1 làm trạng thái hiện tại:** Các tài liệu sau thuộc giai đoạn kiểm toán/dựng khung Phase 0–1 hoặc ngữ cảnh tải lên ngoài repository và **CHỈ mang giá trị lịch sử** (được bảo toàn nguyên vẹn, không xóa):
> - Mục **1B** bên dưới trong chính tệp `PROJECT_STATUS.md` này *(snapshot ngày `2026-11-11` cuối Phase 1)*.
> - `pasted.txt` *(tệp đính kèm ngữ cảnh hội thoại bên ngoài — không tồn tại trong repository Git)*.
> - Toàn bộ thư mục [`docs/_archive/project-audit/`](docs/_archive/project-audit/01-executive-summary.md) *(bộ kiểm toán lịch sử 14 phần trước tái cấu trúc)*.
> - Các báo cáo mốc Phase 0/1 tại [`docs/project-audit/PROJECT_HEALTH_CHECK_AND_REPOSITORY_CLEANUP_AUDIT_2026-11-11.md`](docs/project-audit/PROJECT_HEALTH_CHECK_AND_REPOSITORY_CLEANUP_AUDIT_2026-11-11.md), [`PHASE_0_REPOSITORY_FOUNDATION_REPORT.md`](docs/project-audit/PHASE_0_REPOSITORY_FOUNDATION_REPORT.md) và [`PHASE_1_SECURITY_AND_MVP_CLEANUP_REPORT.md`](docs/project-audit/PHASE_1_SECURITY_AND_MVP_CLEANUP_REPORT.md).

---

## 1B. Lịch sử Snapshot Cuối Phase 1 (Preserved Historical Record — `2026-11-11`)

> [!NOTE]
> **Historical Phase 1 Content (Preserved):** Đoạn nội dung nguyên bản dưới đây được giữ lại nguyên văn để bảo toàn lịch sử kiểm toán Phase 1 (trước khi triển khai `Phase 2A-1` & `Phase 2A-2`):
> - [`PROJECT_HEALTH_CHECK_AND_REPOSITORY_CLEANUP_AUDIT_2026-11-11.md`](docs/project-audit/PROJECT_HEALTH_CHECK_AND_REPOSITORY_CLEANUP_AUDIT_2026-11-11.md) — Kiểm toán đối soát 19 route, build/lint PASS
> - [`PHASE_0_REPOSITORY_FOUNDATION_REPORT.md`](docs/project-audit/PHASE_0_REPOSITORY_FOUNDATION_REPORT.md) — Nghiệm thu Phase 0 (Git, `pnpm`, cấu trúc `docs/`)
> - [`PHASE_1_SECURITY_AND_MVP_CLEANUP_REPORT.md`](docs/project-audit/PHASE_1_SECURITY_AND_MVP_CLEANUP_REPORT.md) — Nghiệm thu Phase 1 (Gỡ auth giả client-side, dọn copy & asset test, chuẩn hóa `.npmrc`)
> - [`MVP_SCOPE_AND_ROUTE_DECISIONS.md`](docs/decisions/MVP_SCOPE_AND_ROUTE_DECISIONS.md) — Quyết định phạm vi MVP, 19 routes & định hướng Auth Phase 3

- **Cơ sở mục tiêu:** Trường Cao đẳng FPT Polytechnic TP.HCM — Công viên Phần mềm Quang Trung (QTSC), Quận 12.
- **Giai đoạn lịch sử tại thời điểm ghi nhận (11/11/2026 — Historical):** **Hoàn tất Phase 1 (Frontend UI + SEO/Config Cleanup)** — Toàn bộ 19 route đang chạy trên dữ liệu mẫu tĩnh tại `apps/web/src/data/campus-data.ts`, sẵn sàng bước sang **Phase 2 (Shared Data Contract `@fpt-campus/shared`)** và **Phase 3 (Backend NestJS + PostgreSQL/Prisma + Auth RBAC)**.
- **Mức độ sẵn sàng tại mốc Phase 1:** **Chưa mở public Internet** cho `/admin/*` do Authentication & Backend API chưa triển khai ở thời điểm Phase 1.

---

### Snapshot Lịch sử Theo Từng Mảng *(Tại Mốc Phase 1 — `2026-11-11`, Historical)*

> [!WARNING]
> **Historical Record Only:** Bảng bên dưới được giữ nguyên nguyên văn để bảo toàn bằng chứng kiểm toán tại mốc cuối Phase 1 (`9062c58`), **không** phản ánh trạng thái hiện tại sau Phase 2A-1 (`7e1753d`) và Phase 2A-2 (`ff13f14`). Xem trạng thái thực tế hiện nay ở **Mục 1** phía trên.

| Lĩnh vực | Trạng thái | Chi tiết thực tế |
|---|---|---|
| Repository & Package Manager | **PASS** | Git chuẩn hóa trên nhánh `main`, `pnpm` workspace + store nội bộ workspace (`.npmrc`), không chứa script hay store ngoài phạm vi. |
| Frontend (`apps/web`) | **PASS** | **19** `page.tsx`, **6** `layout.tsx`, toàn bộ ảnh nội bộ nằm tại `apps/web/public/images/`, không phụ thuộc URL ngoài `lh3`/`unsplash`. |
| Virtual Campus (360° + GIS Map) | **MVP Frontend** | Tour 360° Three.js WebGL tại `/` và `/campus`, Bản đồ GIS Leaflet + OpenStreetMap phong cách FixNear tại `/map`; tạm ẩn 3D WebGL `.glb` trong MVP. |
| SEO & Static Assets | **PASS** | Đã bổ sung `apps/web/src/app/sitemap.ts` (`/sitemap.xml` HTTP `200`), `robots.txt` chặn `/admin`, `/portal`, `/login`; chuyển ảnh thừa `fpoly-campus-aerial.jpg` sang `samples/reference/`. |
| Authentication & Security | **MVP An toàn (Chưa bật Backend Auth)** | Đã gỡ hoàn toàn `prototype-auth.ts`, plaintext password & `sessionStorage` auth giả; `/login` ở trạng thái chờ Phase 3; `/admin/*` gắn banner Preview nội bộ. |
| Backend & Database | **Chờ Phase 2–3** | Chưa triển khai `apps/api` (NestJS), PostgreSQL, Prisma ORM hay Object Storage S3/R2 thật. |

---

## 2. Phụ Lục Tài Liệu Lịch Sử (`docs/_archive/project-audit/`)

> Bộ báo cáo kiểm toán ban đầu (lúc 11:11 sáng 11/11/2026, trước các đợt sửa giao diện `UI-01` → `UI-04` và Phase 0–1) được lưu nguyên trạng để đối chiếu lịch sử tại [`docs/_archive/project-audit/`](docs/_archive/project-audit/01-executive-summary.md):

- [01-executive-summary.md](docs/_archive/project-audit/01-executive-summary.md) — Tóm tắt điều hành ban đầu
- [02-current-project-status.md](docs/_archive/project-audit/02-current-project-status.md) — Bảng trạng thái lịch sử `S0–S6`
- [03-page-by-page-audit.md](docs/_archive/project-audit/03-page-by-page-audit.md) — Kiểm toán page lịch sử
- [04-frontend-audit.md](docs/_archive/project-audit/04-frontend-audit.md) — Kiểm toán Frontend ban đầu
- [05-backend-audit.md](docs/_archive/project-audit/05-backend-audit.md) — Kiểm toán Backend mục tiêu
- [06-database-audit.md](docs/_archive/project-audit/06-database-audit.md) — Kiểm toán Database ban đầu *(đã thay thế chuẩn bởi `docs/phase-2a/PHASE_2A_DATABASE_DESIGN.md`)*
- [07-virtual-campus-audit.md](docs/_archive/project-audit/07-virtual-campus-audit.md) — Kiểm toán Virtual Campus ban đầu
- [08-security-audit.md](docs/_archive/project-audit/08-security-audit.md) — Kiểm toán Bảo mật ban đầu
- [09-performance-audit.md](docs/_archive/project-audit/09-performance-audit.md) — Kiểm toán Hiệu năng ban đầu
- [10-deployment-audit.md](docs/_archive/project-audit/10-deployment-audit.md) — Kiểm toán Hạ tầng & DevOps
- [11-technical-debt.md](docs/_archive/project-audit/11-technical-debt.md) — Nợ kỹ thuật ban đầu
- [12-implementation-roadmap.md](docs/_archive/project-audit/12-implementation-roadmap.md) — Backlog lịch sử `P0–P3`
- [13-mvp-readiness.md](docs/_archive/project-audit/13-mvp-readiness.md) — MVP Readiness ban đầu
- [14-project-architecture.md](docs/_archive/project-audit/14-project-architecture.md) — Kiến trúc ban đầu vs Mục tiêu
