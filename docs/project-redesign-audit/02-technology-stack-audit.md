# 02 — KIỂM TOÁN CÔNG NGHỆ & DEPENDENCY (TECHNOLOGY STACK AUDIT)

## 1. Công Nghệ Tầng Frontend (`apps/web`)

- **Framework:** Next.js 16.4.6 (App Router, Turbopack enabled).
- **Core Library:** React 19.3.0, React DOM 19.3.0.
- **Language:** TypeScript 5.7.2 (Strict mode).
- **Styling:** Tailwind CSS v4 (`@tailwindcss/postcss`, PostCSS 8).
- **Animation & Motion:** `motion` v14.12.0 (Framer Motion thế hệ mới).
- **Bản Đồ & GIS:** `leaflet` v1.9.4 kết hợp OpenStreetMap tiles và custom building SVG markers.
- **360° Panorama Viewer:** Tích hợp Marzipano / Pannellum canvas container, hỗ trợ tương tác chuột, cảm ứng và con quay hồi chuyển mobile.
- **Tiện ích UI & Gamification:** `canvas-confetti` v1.9.4 (hiệu ứng nhận thưởng), `clsx`, `tailwind-merge` (quản lý class CSS linh hoạt).
- **Testing:** Playwright Test 1.48+, Node.js Test Runner, Puppeteer 23+ (dành cho multi-viewport snapshot capture).

---

## 2. Công Nghệ Tầng Backend (`apps/api`)

- **Runtime & Framework:** Node.js v22.x, NestJS v10.4.x (Modular Monolith).
- **API Protocol:** RESTful API chuẩn Envelope: `{ success: boolean, data?: T, error?: { code: string, message: string }, meta?: any }`.
- **Global API Prefix:** `/api/v1`.
- **Mã Hóa & Bảo Mật:** Argon2id (`argon2` v0.41.1) băm mật khẩu chuẩn bảo mật cao, `@nestjs/passport`, `passport-jwt`.
- **Xác Thực (Auth):** Access Token (JWT thời hạn 15 phút, lưu in-memory ở client) + Refresh Token (HttpOnly Cookie, SameSite=Strict, tự động xoay vòng Token Rotation và phát hiện tái sử dụng Token Reuse).
- **Phân Quyền:** RBAC 6 cấp độ kết hợp Guards `JwtAuthGuard`, `RolesGuard`.
- **Upload & Storage:** Three-Zone architecture (`LocalStorageAdapter` cho local dev, sẵn sàng cắm S3/Cloudflare R2 adapter), kiểm tra Magic Bytes định dạng file nhị phân.
- **Validation:** `class-validator` và `class-transformer` tự động sanitize và validate payload đầu vào.

---

## 3. Database & Lưu Trữ (`prisma/`)

- **Database Engine:** PostgreSQL 16 (chạy containerized qua Docker Compose `postgres:16-alpine`).
- **ORM:** Prisma ORM v5.22.0.
- **Quy mô lược đồ:** 32 Models, 19 Enums, quản lý qua Prisma Migrations có versioning.

---

## 4. Bảng Kiểm Toán Toàn Bộ Dependencies (Dependency Audit Table)

| Package | Version | Phân loại | Phạm vi sử dụng | Đánh giá mức độ cần thiết | Rủi ro & Khuyến nghị |
|---|---|---|---|---|---|
| `next` | 16.4.6 | Core | `apps/web` | **Bắt buộc** | Framework chính, Turbopack ổn định cao. Giữ nguyên. |
| `react` | 19.3.0 | Core | `apps/web` | **Bắt buộc** | Thư viện giao diện chính. Giữ nguyên. |
| `tailwindcss` | ^4.0.0 | UI | `apps/web` | **Bắt buộc** | Engine CSS hiện đại. Cần tổ chức lại Design Tokens. |
| `motion` | ^14.12.0 | Animation | `apps/web` | **Bắt buộc** | Animation mượt mà cho UI, tabs, drawer, modal. |
| `leaflet` | ^1.9.4 | Map/GIS | `apps/web` | **Bắt buộc** | Bản đồ tương tác khuôn viên. Cần bọc component an toàn tránh SSR mismatch. |
| `canvas-confetti` | ^1.9.4 | UI | `apps/web` | **Cần thiết** | Hiệu ứng chúc mừng trúng thưởng/thăng hạng XP. |
| `@nestjs/core` | ^10.4.0 | Core | `apps/api` | **Bắt buộc** | Nền tảng backend chính. Giữ nguyên. |
| `@prisma/client` | 5.22.0 | Database | Toàn dự án | **Bắt buộc** | ORM chuẩn hóa kiểu dữ liệu. Giữ nguyên. |
| `argon2` | ^0.41.1 | Security | `apps/api` | **Bắt buộc** | Chuẩn hashing mật khẩu an toàn nhất hiện nay. |
| `@playwright/test`| ^1.48.0 | Testing | `apps/web` | **Bắt buộc** | Framework E2E tự động hóa kiểm thử thật trên browser. |
| `puppeteer` | ^23.0.0 | Dev Tool | `apps/web` | **Cần thiết** | Công cụ chụp screenshot đa kích thước phục vụ audit. |
