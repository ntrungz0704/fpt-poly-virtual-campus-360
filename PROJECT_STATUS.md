# PROJECT_STATUS — FPT Polytechnic Virtual Campus 360°

> [!NOTE]
> **Nguồn sự thật hiện hành (Đã cập nhật sau Phase 1 & bản vá frontend/SEO):**
> - [`PROJECT_HEALTH_CHECK_AND_REPOSITORY_CLEANUP_AUDIT_2026-11-11.md`](docs/project-audit/PROJECT_HEALTH_CHECK_AND_REPOSITORY_CLEANUP_AUDIT_2026-11-11.md) — Kiểm toán đối soát 19 route, build/lint PASS
> - [`PHASE_0_REPOSITORY_FOUNDATION_REPORT.md`](docs/project-audit/PHASE_0_REPOSITORY_FOUNDATION_REPORT.md) — Nghiệm thu Phase 0 (Git, `pnpm`, cấu trúc `docs/`)
> - [`PHASE_1_SECURITY_AND_MVP_CLEANUP_REPORT.md`](docs/project-audit/PHASE_1_SECURITY_AND_MVP_CLEANUP_REPORT.md) — Nghiệm thu Phase 1 (Gỡ auth giả client-side, dọn copy & asset test, chuẩn hóa `.npmrc`)
> - [`MVP_SCOPE_AND_ROUTE_DECISIONS.md`](docs/decisions/MVP_SCOPE_AND_ROUTE_DECISIONS.md) — Quyết định phạm vi MVP, 19 routes & định hướng Auth Phase 3

- **Cơ sở mục tiêu:** Trường Cao đẳng FPT Polytechnic TP.HCM — Công viên Phần mềm Quang Trung (QTSC), Quận 12.
- **Giai đoạn hiện tại (Current Phase):** **Hoàn tất Phase 1 (Frontend UI + SEO/Config Cleanup)** — Toàn bộ 19 route đang chạy trên dữ liệu mẫu tĩnh tại `apps/web/src/data/campus-data.ts`, sẵn sàng bước sang **Phase 2 (Shared Data Contract `@fpt-campus/shared`)** và **Phase 3 (Backend NestJS + PostgreSQL/Prisma + Auth RBAC)**.
- **Mức độ sẵn sàng Production / Người dùng thật:** **Chưa mở public Internet** cho `/admin/*` do Authentication & Backend API chưa triển khai trong MVP.

---

## 1. Trạng Thái Hiện Tại Theo Từng Mảng

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
