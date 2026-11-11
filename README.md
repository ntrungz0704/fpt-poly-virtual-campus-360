# FPT Polytechnic — Virtual Campus 360° (Cơ sở TP.HCM — QTSC Quận 12)

Hệ thống trải nghiệm không gian **Virtual Campus 360°** dành cho Trường Cao đẳng FPT Polytechnic tại Công viên Phần mềm Quang Trung (QTSC, Quận 12), kết hợp trình xem Panorama 360°, bản đồ khuôn viên GIS, danh mục không gian học tập và khu vực quản trị nội dung nội bộ.

> **Trạng thái hiện tại (Phase 0 — Repository Foundation):** Đang vận hành ở trạng thái **Frontend UI Prototype** (`apps/web`) với dữ liệu mẫu tĩnh. Backend (`apps/api`), PostgreSQL/Prisma, Authentication thực tế và Admin Campus Studio đang trong lộ trình chuẩn hóa kiến trúc và phê duyệt từng giai đoạn.

---

## Cấu trúc Monorepo (`pnpm` Workspace)

- `apps/web`: Ứng dụng Frontend Next.js 16 (App Router, React 19, TypeScript, Tailwind CSS v4, Three.js 360°, Leaflet GIS, Motion).
- `packages/shared`: Package hợp đồng kiểu dữ liệu dùng chung `@fpt-campus/shared` *(sẽ đồng bộ lại theo chuẩn Phase 2A trước khi dựng Backend)*.
- `apps/api`: Backend NestJS Modular Monolith + Prisma + MinIO/S3 + Redis *(Chưa khởi tạo — thuộc Phase 3 sau khi duyệt kiến trúc & data contract)*.
- `docs/`: Hệ thống tài liệu đã chuẩn hóa theo 6 nhóm:
  - [`docs/decisions/MVP_SCOPE_AND_ROUTE_DECISIONS.md`](docs/decisions/MVP_SCOPE_AND_ROUTE_DECISIONS.md): Quyết định MVP, quy ước 19 routes & thứ tự 6 Phase.
  - [`docs/architecture/ADMIN_AUTH_AND_SECURITY_ARCHITECTURE.md`](docs/architecture/ADMIN_AUTH_AND_SECURITY_ARCHITECTURE.md): Kiến trúc xác thực Admin, RBAC & bảo mật mục tiêu.
  - [`docs/phase-2a/`](docs/phase-2a/PHASE_2A_SYSTEM_ARCHITECTURE.md): Đặc tả kỹ thuật Backend, Database ERD, API Contract & Panorama/FloorPlan Workflow.
  - [`docs/ui/`](docs/ui/UI_DESIGN_SYSTEM.md): Design System, UI Blueprint & UX Audit.
  - [`docs/project-audit/`](docs/project-audit/PROJECT_HEALTH_CHECK_AND_REPOSITORY_CLEANUP_AUDIT_2026-11-11.md): Báo cáo kiểm toán dự án & nghiệm thu từng giai đoạn.
  - `docs/_archive/`: Lưu trữ lịch sử tài liệu Stitch đời đầu (`docs/_archive/legacy-stitch/`, `stitch-references/`, `ui-roadmap-drafts/`) và hồ sơ audit ban đầu (`docs/_archive/project-audit/`).

---

## Nhận diện Thương hiệu FPT Polytechnic

- **Primary Accent**: Cam FPT (`#a04100` / `#f36f21`)
- **Brand Ink / Navy**: Deep Navy (`#041b3c` / `#102a43`)
- **Background Surface**: Ice Surface (`#f9f9ff`)
- **Typography**: `Plus Jakarta Sans` (Headings/Labels) & `Inter` (Body)
- **Icons**: Google Material Symbols Outlined

---

## Khởi chạy Workspace (`pnpm`)

```bash
# Cài đặt toàn bộ dependency từ pnpm-lock.yaml
pnpm install --frozen-lockfile

# Chạy môi trường phát triển Frontend
pnpm dev

# Kiểm tra TypeScript, ESLint và Production Build toàn workspace
pnpm typecheck
pnpm lint
pnpm build
```

Truy cập ứng dụng tại: `http://localhost:3000`
