# PROJECT_STATUS — FPT Polytechnic Virtual Campus 360°

> **Nguồn sự thật duy nhất (Single Source of Truth)** về hiện trạng thực tế của dự án tại `E:\Virtual Campus FPT Poly`. Được lập dựa trên kết quả kiểm toán mã nguồn & lệnh kiểm tra thực tế (Read-only Audit). Toàn bộ báo cáo chi tiết nằm tại [`docs/project-audit/`](docs/project-audit/01-executive-summary.md).

- **Cơ sở mục tiêu:** Trường Cao đẳng FPT Polytechnic TP.HCM — CVPM Quang Trung, Quận 12.
- **Ngày kiểm toán gần nhất:** `11/11/2026`
- **Giai đoạn hiện tại (Current Phase):** **Frontend UI Prototype (Giai đoạn 1 chưa hoàn thiện)** — Chưa có Backend, chưa có Database, bản Production Build hiện đang gãy.
- **Mức độ sẵn sàng Production / Người dùng thật:** **NO (Chưa sẵn sàng)** — Mới có thể demo giao diện cục bộ bằng `next dev`.

---

## 1. Chỉ Số Hoàn Thành & Trạng Thái Từng Mảng

| Lĩnh vực | Trạng thái | Tỷ lệ ước lượng | Ghi chú cốt lõi |
|---|---|---:|---|
| Design & Tokens | **S2–S3** | ~65% | Có 13 ảnh Stitch tại `docs/stitch-references/`, 7 doc phân tích và bảng màu `@theme` ở `globals.css`. Thư mục gốc `desktop/` & `mobile/` đã không còn trong workspace; `globals.css` bị đứt dòng 115 làm mất các utility typography cấp dưới. |
| Frontend (Next.js App Router) | **S3** | ~40% | Có 14 `page.tsx`, 6 `layout.tsx`, 32 component `.tsx` (`9.044` LOC). `tsc --noEmit` đạt `exit 0`, nhưng **`next build` FAIL**, **`eslint` FAIL (2 errors, 3 warnings)**, `0` lệnh `fetch()`, 100% dữ liệu hardcode, 11/12 route Admin 404. |
| Virtual Campus (360° + 3D + GIS) | **S3 / S2** | ~30% | Có Three.js thuần (`BoxGeometry` 3D Walk Mode + 3 scene 360° từ ảnh 16:9 ép lên cầu) và GIS SVG tĩnh. Chưa có R3F/Drei, Marzipano, Leaflet GIS hay file `.glb` nào (`public/models/` rỗng). |
| Backend (NestJS) | **S0** | 0% | Thư mục `apps/api` chưa tồn tại; 0/23 NestJS modules. |
| Database (PostgreSQL + Prisma) | **S0** | 0% | Mới có `docker-compose.yml` + `.env.example`. Chưa có `prisma/schema.prisma`, migrations hay seed; Docker hiện chưa chạy. |
| Authentication & Security | **S2 (UI) / S0 (Logic)** | ~5% | `/login` giả lập 600ms; `/portal` & `/admin` mở công khai không có guard; không có bcrypt/JWT/RBAC/forced password change. |
| Admin CMS & Media Pipeline | **S2** | ~5% | Chỉ có dashboard tĩnh `/admin`; 11 route con bị 404; 23 ảnh phụ thuộc URL tạm `lh3.googleusercontent.com`. |
| Testing & DevOps | **S0 / S1** | 0–10% | `0` bài test tự động; chưa có Git repo, `Dockerfile`, CI/CD, Object Storage R2/S3 thật hay monitoring. |

---

## 2. Kết Quả Kiểm Tra Lệnh Thực Tế (11/11/2026)

| Kiểm tra | Lệnh | Kết quả | Chi tiết |
|---|---|---|---|
| Typecheck Shared | `npx tsc -p packages/shared/tsconfig.json --noEmit` | **PASS (`0`)** | Hợp đồng type `packages/shared/src/index.ts` (183 dòng) sạch lỗi nhưng chưa được `apps/web` import. |
| Typecheck Web | `npx tsc -p apps/web/tsconfig.json --noEmit` | **PASS (`0`)** | Không có lỗi TypeScript. |
| ESLint Web | `npm --prefix apps/web run lint` | **FAIL (`1`)** | 2 errors (`Campus3DViewer.tsx:842`, `test-height.mjs:13`), 3 warnings (`OpenDayMiniGame.tsx:263`, `Campus3DViewer.tsx:285,1021`). |
| Production Build | `npm --prefix apps/web run build` | **FAIL (`1`)** | `CssSyntaxError` tại `apps/web/src/app/globals.css:114:1: Missing closing } at .font-headline-lg`. |

---

## 3. Công Việc Đã Hoàn Thành (Completed Tasks — Đã Kiểm Chứng)

- Khởi tạo workspace frontend Next.js (`16.4.6`) + React (`19.3.0`) + TypeScript + Tailwind CSS v4 (`apps/web`).
- Xây dựng hệ thống màu FPT Polytechnic trong `@theme` (`apps/web/src/app/globals.css:3-68`) và cấu hình font `Plus Jakarta Sans`, `Inter`, `Material Symbols Outlined` (`apps/web/src/app/layout.tsx`).
- Xây dựng 6 layout và 14 route trang giao diện ở trạng thái dữ liệu mẫu: `/`, `/about`, `/campus`, `/map`, `/locations`, `/locations/[slug]` (mẫu tĩnh), `/events`, `/news`, `/news/[slug]` (mẫu tĩnh), `/contact`, `/games`, `/login` (giả lập), `/portal` (mẫu tĩnh), `/admin` (dashboard tĩnh).
- Xây dựng Prototype 3D Walk Mode & Orbit (`Campus3DViewer.tsx` — 1.244 dòng) với 4 cụm khu vực giả lập, nhân vật voxel, điều khiển phím/cảm ứng, trọng lực và hộp va chạm tòa nhà.
- Xây dựng Prototype 360° Sphere Viewer (`Hero360Viewer.tsx`, `VirtualTourViewer.tsx`) hỗ trợ kéo xoay, zoom FOV và hotspot chiếu theo tọa độ cầu `(yaw, pitch)`.
- Xây dựng giao diện Mini-game vòng quay Canvas 340×340 + quiz client (`OpenDayMiniGame.tsx`, `CampusQuizStepper.tsx`).
- Khởi tạo bản nháp Shared TypeScript contracts (`packages/shared/src/index.ts`), cấu hình mẫu `docker-compose.yml` và `.env.example`, cùng 7 tài liệu kỹ thuật trong `docs/`.
- Hoàn thành kiểm toán kỹ thuật toàn diện dự án với 14 báo cáo chuyên sâu tại `docs/project-audit/`.

---

## 4. Công Việc Đang Thực Hiện & Đang Bị Chặn (In-Progress & Blocked Tasks)

- **Đang thực hiện (In-progress):** Chưa có sprint lập trình tính năng mới nào đang chạy; vừa kết thúc bước **Technical Audit (11/11/2026)**.
- **Đang bị chặn (Blocked):**
  - **Đóng gói & Triển khai Web (`Blocked`):** Bị chặn bởi `CssSyntaxError` tại `apps/web/src/app/globals.css:114-115` và lỗi ESLint `apps/web/test-height.mjs:13` + `Campus3DViewer.tsx:842`.
  - **Lưu trữ dữ liệu, Đăng ký Open Day, Login & Portal/CMS (`Blocked`):** Bị chặn hoàn toàn vì `apps/api` (NestJS), `prisma/schema.prisma` và Docker PostgreSQL chưa được xây dựng/khởi chạy.
  - **Chuẩn hóa 360° & 3D thực tế (`Blocked`):** Thiếu kho Object Storage S3/R2 + CDN, thiếu bộ ảnh Equirectangular 2:1 chuẩn và mô hình `.glb` thật từ phía Nhà trường (`public/models/` đang trống).

---

## 5. Kiến Trúc Hiện Tại vs Quyết Định Kiến Trúc Đã Chốt

- **Kiến trúc hiện tại:** Single Next.js client-heavy frontend (`apps/web`), dữ liệu hardcode trong TSX, Three.js thuần (`SphereGeometry` + `BoxGeometry`), sơ đồ GIS SVG tĩnh, 23 ảnh trỏ ngoài `lh3.googleusercontent.com/aida-public/...`, không API, không Database, không Auth.
- **Quyết định kiến trúc đã chốt (Confirmed Decisions):**
  1. Monorepo Hybrid: `apps/web` (Next.js App Router + Tailwind + TS) + `apps/api` (NestJS Modular Monolith + REST API) + `packages/shared`.
  2. Database: PostgreSQL + Prisma ORM (chứa metadata đầy đủ cho Users/RBAC, Campus/Buildings/Floors/Locations, Tours/Panoramas/Hotspots, 3D Models/Versions/Placements, Events/Registrations/Attendance, Gamification, CMS/News/Media/AuditLogs).
  3. Virtual Campus: Kết hợp 360° Panorama (Marzipano hoặc viewer equirectangular 2:1 chuẩn) và 3D Campus (Three.js + React Three Fiber + Drei + `.glb/.gltf`).
  4. Xác thực & Phân quyền: Tài khoản do Nhà trường import qua Excel/CSV, hash mật khẩu an toàn (`bcrypt`/`argon2`), **bắt buộc đổi mật khẩu lần đầu**, bảo vệ qua RBAC & NestJS Guards; khách công khai vẫn xem được thông tin chung, 360°/3D, địa điểm, tin tức và game công khai.
  5. Triển khai Hybrid: Web/API trên Cloud, Object Storage (R2/S3) + CDN lưu ảnh/video/panorama/GLB, kèm quy trình sản xuất và duyệt tài sản 3D/360° phía Nhà trường trước khi xuất bản.

---

## 6. Rủi Ro Đã Nhận Diện (Known Risks)

1. **Rủi ro Bảo mật Cấp 1:** `/admin` và `/portal` không có bất kỳ kiểm soát truy cập nào; `/login` hiển thị nhãn bảo mật không đúng thực tế (`"ISO/IEC 27001"`, `"HASH BCRYPT"`).
2. **Rủi ro Đứt Gãy Tài Nguyên Hình Ảnh:** 100% ảnh nội dung & 360° đang dùng 23 URL `lh3.googleusercontent.com/aida-public/...` có thể hết hạn bất kỳ lúc nào.
3. **Rủi ro Hiệu Năng WebGL & Trình Duyệt:** `VirtualTourViewer.tsx` tạo mới `WebGLRenderer` mỗi lần chuyển cảnh (rò rỉ GPU context) và cả 3 viewer gọi React `setState` / cấp phát `Vector3` 60 lần/giây; lạm dụng `"use client"` trên 10/14 trang.
4. **Rủi ro Chết Chức Năng & Mâu Thuẫn Dữ Liệu:** 11/12 trang CMS 404; link `?scene=` trên Trang chủ sai ID; lọc Tòa F bị nhầm thành Tòa T; mâu thuẫn địa danh phường (Trung Mỹ Tây vs Tân Chánh Hiệp) và mâu thuẫn số lượng cơ sở/scene giữa UI và docs.
5. **Rủi ro Mất Kiểm Soát Phiên Bản:** Chưa có `.git` trong workspace và các script thừa (`test-height.mjs`) nằm lẫn ngay trong `apps/web/`.

---

## 7. Công Việc Còn Lại & 10 Hành Động Tiếp Theo (Next Actions)

Chi tiết backlog `P0–P3` và lộ trình 5 giai đoạn xem tại [`docs/project-audit/12-implementation-roadmap.md`](docs/project-audit/12-implementation-roadmap.md). Dưới đây là đúng **10 hành động phải thực hiện ngay theo thứ tự**:

1. Khôi phục hoàn chỉnh `apps/web/src/app/globals.css` (dòng 114–115 và các class typography thiếu) để `npm run build` pass.
2. Sửa toàn bộ 2 errors + 3 warnings ESLint (`Campus3DViewer.tsx:285,795,842,1021`, `OpenDayMiniGame.tsx:263`), xóa `apps/web/test-height.mjs` và dời `capture-pages.mjs` ra khỏi gốc `apps/web`.
3. Vá 4 lỗi logic/UI tức thời: bug lọc Tòa F → Tòa T (`locations/page.tsx:111-112`), đồng bộ ID `?scene=` trên Trang chủ, bổ sung link `/about` vào `PublicHeader`, và thống nhất địa danh hành chính CVPM Quang Trung Q.12.
4. Khởi tạo `.git`, thêm `package.json` gốc cho `pnpm-workspace.yaml` và tạo `.env` cục bộ với secret riêng (không tái sử dụng secret mẫu trong `.env.example`).
5. Bật PostgreSQL qua `docker compose`, khởi tạo `apps/api/prisma/schema.prisma` (24+ bảng), chạy migration đầu tiên và seed chuẩn Cơ sở Quận 12.
6. Khởi tạo Backend NestJS Modular Monolith tại `apps/api` (Swagger, `ValidationPipe`, `ThrottlerGuard`, `Helmet`, `CORS`, kết nối `@fpt-campus/shared`).
7. Xây dựng `AuthModule` + `UsersModule` + `RolesModule` + `PermissionsModule` (`bcrypt`/`argon2`, JWT `HttpOnly`, **bắt buộc đổi MK lần đầu**, NestJS RBAC Guards) và khóa chặt `/portal`, `/admin`.
8. Cấu hình Object Storage (R2/S3 + CORS + CDN) + `MediaModule` và di dời toàn bộ 23 ảnh `lh3.googleusercontent.com` + dọn 5 ảnh dư thừa trong `apps/web/public/images/`.
9. Nối API/DB thật cho các luồng Public & Open Day/Gamification (`/locations/[slug]`, `/news/[slug]`, `/events` vé QR, `/contact`, `/games` + vòng quay server-side chống reset).
10. Nâng cấp trình xem 360° (equirectangular 2:1 / Marzipano không rò rỉ WebGL), xây dựng `AccountImportModule` (CSV/Excel) + các trang `/admin/*` cốt lõi và thiết lập CI test tự động (Vitest + Jest/Supertest Guards + Playwright Smoke).

---

## Phụ Lục Tài Liệu Kiểm Toán (`docs/project-audit/`)

- [01-executive-summary.md](docs/project-audit/01-executive-summary.md) — Tóm tắt điều hành & Ước lượng hoàn thành
- [02-current-project-status.md](docs/project-audit/02-current-project-status.md) — Bảng trạng thái `S0–S6` 13 mảng & từng module FE/BE
- [03-page-by-page-audit.md](docs/project-audit/03-page-by-page-audit.md) — Kiểm toán 12 nhóm sản phẩm & đối chiếu Stitch
- [04-frontend-audit.md](docs/project-audit/04-frontend-audit.md) — Kiểm toán 20 tiêu chí Next.js / Tailwind / TypeScript
- [05-backend-audit.md](docs/project-audit/05-backend-audit.md) — Kiểm toán 23 NestJS modules
- [06-database-audit.md](docs/project-audit/06-database-audit.md) — Kiểm toán PostgreSQL, Prisma & Sơ đồ ERD Mermaid
- [07-virtual-campus-audit.md](docs/project-audit/07-virtual-campus-audit.md) — Kiểm toán 360°, 3D, GIS, Media, Open Day, Game & Admin CMS
- [08-security-audit.md](docs/project-audit/08-security-audit.md) — Kiểm toán Xác thực, RBAC & 17 hạng mục bảo mật
- [09-performance-audit.md](docs/project-audit/09-performance-audit.md) — Kiểm toán Hiệu năng, Mở rộng & Kiểm thử
- [10-deployment-audit.md](docs/project-audit/10-deployment-audit.md) — Kiểm toán Hạ tầng & DevOps Hybrid
- [11-technical-debt.md](docs/project-audit/11-technical-debt.md) — Nợ kỹ thuật phân loại theo 10 nhóm
- [12-implementation-roadmap.md](docs/project-audit/12-implementation-roadmap.md) — Backlog `P0–P3`, Lộ trình 5 Phase & 10 Hành động kế tiếp
- [13-mvp-readiness.md](docs/project-audit/13-mvp-readiness.md) — Trả lời 12 câu hỏi MVP Readiness (`YES/PARTIALLY/NO/UNKNOWN`)
- [14-project-architecture.md](docs/project-audit/14-project-architecture.md) — Kiến trúc Hiện tại vs Mục tiêu (Mermaid)
