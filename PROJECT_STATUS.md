# PROJECT_STATUS — FPT Polytechnic Virtual Campus 360°

> [!IMPORTANT]
> **Trạng thái đương đại mới nhất (Post-M8 Integration & Audit Batch A — cập nhật `2026-11-17` trên nhánh `audit/comprehensive-quality-remediation`):**
> - **`origin/main` HEAD (đã merge M8 PR #2):** `c0a268dafaeb84c537f667cabad82b63ee3d39bb` (merge commit của PR [#2](https://github.com/ntrungz0704/fpt-poly-virtual-campus-360/pull/2) gồm `10f8471` và `a8b3833`, trên nền `ef03ce9`).
> - **Audit Branch (đã đồng bộ `origin/main`):** `audit/comprehensive-quality-remediation` (merge commit `bff4323e910470ffa96f56a7646ba1fa1e5f7778`, B-A1/B-A2 commit `09d0bccb43768d14ddf36d502a5dbfaefa255dd3`, B-A3 Option 1 commit `a9bbfaade7777b2de0a54181c302435e6759a41e`).
> - **Milestones đã hoàn thành trên `main`:** M1–M7.5 và **M8** (Open Day Event & QR Check-in Engine, B01/B02).
> - **Trạng thái kiểm toán:** Đã hoàn tất **Batch A** (bảo mật/concurrency gamification, Tour Go-Live guard, Portal integrity/rank/avatar XSS, QR ISO-18004, gỡ public fake fallbacks, B-A1, B-A2 và B-A3 Option 1) — **chờ Tech Lead nghiệm thu chốt Batch A** trước khi bắt đầu **Batch B** (không tuyên bố FULL PASS toàn hệ thống khi còn 10/19 integration suites và Playwright E2E chưa chạy lại ở đợt này).

---

## 1A. Hiện Trạng Đương Đại Chi Tiết (Cập nhật `2026-11-17` trên nhánh `audit/comprehensive-quality-remediation`)

| Lĩnh vực | Trạng thái Thực tế | Chi tiết Kiểm chứng Kỹ thuật |
|---|---|---|
| **Cơ sở dữ liệu (Prisma + PostgreSQL 16)** | **VERIFIED (`13` migrations)** | `39` Models, `23` Enums, quản lý qua `13` migrations (gồm `20261117000001_gamification_guest_session_id` thêm `guest_session_id` nullable cho walk-in gamification). |
| **Backend Core & Business API (`apps/api`)** | **BATCH A READY / PENDING ACCEPTANCE** | `14` NestJS Modules: `auth`, `users-rbac`, `public`, `open-day` (gồm M8 check-in controller), `gamification` (HMAC guest cookie + strict ticket check + XP-only leaderboard), `portal`, `media`, `storage`, `audit-log`, `health`, `news`, `questions`, `quiz-config`. |
| **Bảo mật & Phân quyền (Auth & RBAC)** | **POLICY LOCKED (`mustChangePassword = true`)** | Argon2id, JWT + HttpOnly refresh rotation, RBAC 6 vai trò; tài khoản admin seed giữ `mustChangePassword = true` (sửa E2E login/change-password flow vào Batch B; `auth-session.integration.spec.ts` vẫn fail `2` test do `seed.ts:1311` chưa đồng bộ từ `d03b55a`). |
| **Giao diện Web (`apps/web`)** | **VERIFIED BUILD (`28/28` routes)** | Next.js 16.4.6 App Router, Tailwind CSS, `28` `page.tsx` routes, tích hợp M8 QR Scanner (`jsqr`) + QR ISO-18004 (`QRCodeSVG`) + client guest-session handshake. |
| **Bộ kiểm thử tự động sau đồng bộ M8 + B-A3** | **PARTIAL REGRESSION PASS (PostgreSQL 16)** | `@fpt-campus/shared build`, `pnpm typecheck`, `web lint/typecheck/build` (`28/28`) & `20/20` web unit tests PASS; `api lint/typecheck/build` & `9/9` API unit suites (`38/38`) PASS; `9/19` PostgreSQL 16 integration suites (`80/80` tests) PASS. Còn `auth-session` (known baseline fail), `9` integration suites ngoài scope và `4/4` Playwright E2E (Batch E) chưa chạy. |

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
