# 01. TÓM TẮT ĐIỀU HÀNH (EXECUTIVE SUMMARY)

**Dự án:** FPT Polytechnic Virtual Campus 360° (Cơ sở TP.HCM — CVPM Quang Trung, Quận 12)  
**Thư mục gốc kiểm toán:** `E:\Virtual Campus FPT Poly`  
**Ngày kiểm toán:** 11/11/2026  
**Phương pháp:** Kiểm toán mã nguồn tĩnh & kiểm tra lệnh thực tế (Read-only Audit), đối chiếu trực tiếp toàn bộ `apps/web`, `packages/shared`, `docs/`, `docker-compose.yml`, `.env.example` và 13 ảnh tham chiếu Stitch trong `docs/stitch-references/`.

---

## 1. Dự Án Là Gì & Mục Tiêu Cần Đạt

**FPT Polytechnic Virtual Campus 360°** là nền tảng trải nghiệm khuôn viên số (Digital Campus Ecosystem) dành cho thí sinh, phụ huynh, sinh viên hiện tại và ban quản trị tại **Cơ sở TP. Hồ Chí Minh (Công viên Phần mềm Quang Trung, Lô 24 & khu lân cận, Quận 12)**.

Theo định hướng kiến trúc đã xác nhận, hệ thống hoàn chỉnh gồm 12 phân hệ chính:
1. Website công khai của cơ sở (Trang chủ, Giới thiệu, Liên hệ).
2. Tham quan thực tế ảo **Virtual Campus 360°** (Marzipano / equirectangular panorama + hotspot cầu).
3. Khám phá khuôn viên **3D Campus Explorer** (Three.js + React Three Fiber + Drei + mô hình `.glb/.gltf`).
4. Bản đồ **GIS Campus Map**.
5. Danh mục và chi tiết **Tòa nhà / Phòng học / Lab**.
6. Nền tảng sự kiện **Open Day** (đăng ký vé, lịch trình, check-in, truy cập phân quyền).
7. **Tin tức & Sự kiện** và chi tiết bài viết.
8. **Liên hệ & Tư vấn tuyển sinh**.
9. **Xác thực & Phân quyền (Authentication & RBAC)** với tài khoản do nhà trường import qua Excel/CSV và bắt buộc đổi mật khẩu lần đầu.
10. **Cổng Sinh viên & Phụ huynh (Student & Parent Portal)**.
11. **Gamification & Quiz** (câu hỏi trắc nghiệm, XP, bảng xếp hạng, mini-game chống gian lận).
12. **Admin CMS** quản trị toàn bộ nội dung, phòng học, scene 360°, mô hình 3D, sự kiện, người dùng, game và phân tích dữ liệu trên PostgreSQL + Object Storage/CDN.

---

## 2. Giai Đoạn Phát Triển Hiện Tại

> **Kết luận thẳng thắn:** Dự án hiện đang ở giai đoạn **Frontend UI Prototype (Giai đoạn 1 chưa hoàn thiện)** — mới xây dựng phần vỏ giao diện Next.js App Router chạy với dữ liệu tĩnh hardcode ngay trong component.

- **Không phải Staging / Chưa sẵn sàng Production.**
- **Production Build đang GÃY:** `npm run build` thất bại ở bước biên dịch CSS tại `apps/web/src/app/globals.css:114-115` (mã file bị cắt cụt giữa chừng ở `.font-headline-lg { font-family: 'Plus Jaka`).
- **ESLint đang LỖI:** `npm run lint` thoát mã `1` với 2 errors (`Campus3DViewer.tsx:842` và file script thừa `test-height.mjs:13`) cùng 3 warnings.
- **Backend & Database bằng 0% (`S0`):** Thư mục `apps/api` không tồn tại; không có NestJS, không có `prisma/schema.prisma`, không có migration, không có seed.
- **Bảo mật & CMS bằng 0% chức năng (`S0` về bảo mật / `S2` giao diện vỏ):** `/admin` và `/portal` không có guard bảo vệ, `/login` cho phép đăng nhập giả lập bất kỳ chuỗi nào bằng `setTimeout(600ms)`.

---

## 3. Ước Lượng Tỷ Lệ Hoàn Thành Theo Từng Lĩnh Vực

### Phương Pháp Tính Toán (Methodology)
Không lấy trung bình cộng đơn thuần giữa các mảng không đồng đều. Thay vào đó:
- Mỗi lĩnh vực được đánh giá độc lập dựa trên tỷ lệ **tiêu chí nghiệm thu thực tế đã có bằng chứng mã nguồn chạy được** (không tính file doc kế hoạch hay mock giao diện làm % hoàn thành logic).
- Trọng số tham chiếu cho hệ thống Full-stack Production theo kiến trúc xác nhận:
  - Frontend UI & Pages: **20%**
  - Virtual Campus (360° + 3D + GIS): **20%**
  - Backend API (NestJS 23 modules): **25%**
  - Database (PostgreSQL + Prisma): **10%**
  - Authentication & Security: **10%**
  - Admin CMS & Media Pipeline: **10%**
  - Testing & DevOps/CI-CD: **5%**

### Bảng Điểm Hoàn Thành Độc Lập

| Lĩnh vực | Mức hoàn thành ước lượng | Trạng thái tổng | Cơ sở đo lường & Bằng chứng |
|---|---:|---|---|
| **Design (Stitch Reference & Tokens)** | **~65%** | **S2–S3** | Có 7 tài liệu `docs/*.md` + 13 ảnh `docs/stitch-references/*.png`, có bảng màu `@theme` trong `globals.css`. Tuy nhiên thư mục gốc `desktop/` và `mobile/` đã bị xóa khỏi workspace (`Get-ChildItem` trống); nhiều màn Stitch (`page_06`, `page_07`, `page_09`, `page_10`, Auth, Portal, CMS) chưa được chuyển hóa đầy đủ sang app. |
| **Frontend (Next.js App Router)** | **~40%** | **S3** | Đã có 14 `page.tsx`, 6 `layout.tsx`, 32 component `.tsx` (`9.044` dòng code trong `apps/web/src`). Tuy nhiên 100% dữ liệu hardcode, `0` lệnh `fetch()`, `globals.css` bị cụt khiến `next build` lỗi, `locations/[slug]` và `news/[slug]` bỏ qua `slug`, `/admin` thiếu 11/12 route con, nhiều lỗi UI/UX và responsive. |
| **Virtual Campus (360° + 3D + GIS)** | **~30%** | **S3** | Có Three.js thuần (`Hero360Viewer.tsx`, `VirtualTourViewer.tsx`, `Campus3DViewer.tsx`) + bản đồ SVG tĩnh `CampusGISMap.tsx`. Nhưng không dùng R3F/Drei, không dùng Marzipano, không dùng Leaflet/GIS thật, `public/models/` rỗng, mới có 3 scene ảnh Google 16:9 kéo lên hình cầu (bị méo/đường ghép dọc), có memory leak WebGL & bug React loop. |
| **Backend (NestJS)** | **0%** | **S0** | `apps/api` không tồn tại. 0/23 module NestJS (`AuthModule`..`AuditLogsModule`) được khởi tạo. Chỉ có khung kiểu dữ liệu chưa được dùng trong `packages/shared/src/index.ts` (183 dòng, 0 import). |
| **Database (PostgreSQL + Prisma)** | **0%** | **S0** | Chỉ có `docker-compose.yml` khai báo service `postgres:16-alpine` và `.env.example`. Không có `prisma/schema.prisma`, không có migration, không có seed, Docker daemon chưa chạy. |
| **Admin CMS** | **~5%** | **S2** | Chỉ có 1 trang dashboard tĩnh `/admin` (`admin/page.tsx`) với số liệu giả lập và menu trỏ tới 11 route con (`/admin/locations`..`/admin/settings`) đều trả 404. Không có CRUD, không có pipeline Upload → Publish media. |
| **Authentication & RBAC** | **~5%** | **S2 (UI) / S0 (Security)** | Chỉ có trang UI `/login` (`login/page.tsx`) điền sẵn `PS24180` / `polytechnic2025`, bấm Submit tự `router.push("/portal")` sau 600ms. Không có JWT, không có bcrypt, không có Guards, không có forced password change, `/portal` và `/admin` mở công khai. |
| **Testing (QA)** | **0%** | **S0** | 0 file `*.test.*` / `*.spec.*`. Không cài Vitest/Jest/Playwright. Chỉ có 2 script Puppeteer thủ công chụp ảnh/kiểm tra chiều cao (`capture-pages.mjs`, `test-height.mjs` bị lỗi cú pháp). |
| **Deployment & DevOps** | **~10%** | **S1–S2** | Chỉ có `docker-compose.yml` cho Postgres local và `.env.example`. Chưa có `.env`, chưa có `Dockerfile`, chưa có CI/CD GitHub Actions, chưa cấu hình Object Storage S3/R2 thật, CDN hay monitoring/backup. |
| **Tổng hợp có trọng số toàn hệ thống** | **~14% – 18%** | **Prototype (Giai đoạn 1 chưa hoàn tất)** | Phản ánh thực tế rằng phần lõi Backend + DB + Auth + CMS + Real 3D/360 Asset Pipeline chiếm ~75% giá trị vận hành thực sự hiện vẫn ở mức `S0` hoặc `S2`. |

---

## 4. Những Thành Quả Thực Sự Đã Xây Dựng Được

1. **Khung ứng dụng Next.js App Router + TypeScript:** 14 route trang và 6 layout tách biệt theo route groups `(public)`, `(immersive)`, `(auth)`, `(portal)`, `admin`; kiểm tra `tsc --noEmit` trên cả `apps/web` và `packages/shared` đều pass (`exit 0`).
2. **Hệ thống màu & font cơ bản:** Khai báo `@theme` trong `apps/web/src/app/globals.css` khớp bảng màu FPT (`#a04100`, `#f36f21`, `#041b3c`, `#f9f9ff`) cùng Google Fonts `Plus Jakarta Sans` và `Inter` trong `apps/web/src/app/layout.tsx`.
3. **Interactive 3D Walk-Mode Prototype (`Campus3DViewer.tsx` — 1.244 dòng):** Dựng khối hình hộp mô phỏng 4 cụm khu vực QTSC + nhân vật voxel sinh viên điều khiển bằng phím `WASD`/mũi tên/IME Telex tiếng Việt, nút cảm ứng D-pad, trọng lực nhảy, va chạm hộp `BUILDING_COLLIDERS` và `BuildingDetailDrawer`.
4. **Prototype Quả cầu 360° (`Hero360Viewer.tsx`, `VirtualTourViewer.tsx`):** Cài đặt cơ chế xoay kéo, zoom FOV, chiếu tọa độ spherical `(yaw, pitch)` sang tọa độ 2D trên màn hình cho hotspot và điều hướng chuyển scene.
5. **Giao diện minh họa các trang Public & Mini-game:** Form tư vấn nhanh, bộ lọc cơ sở vật chất, timeline Open Day, vòng quay + trắc nghiệm 3 câu `OpenDayMiniGame.tsx` dùng HTML5 Canvas 340×340, trang `/games` 5 câu hỏi.
6. **Bộ tài liệu kỹ thuật ban đầu (`docs/`) & Contract nháp (`packages/shared`):** Đã chuẩn hóa sơ bộ bộ type TypeScript `183` dòng ở `packages/shared/src/index.ts`.

---

## 5. Các Điểm Nghẽn Nghiêm Trọng Nhất (Critical Blockers)

1. **P0-1 — Không thể Build Production:** `apps/web/src/app/globals.css:114-115` bị cụt file khiến `next build` thất bại hoàn toàn; `npm run lint` lỗi 2 chỗ (`Campus3DViewer.tsx:842`, `test-height.mjs:13`).
2. **P0-2 — Không có Backend API & Database:** 0% NestJS API, 0% PostgreSQL/Prisma schema. Mọi đăng ký Open Day, form liên hệ, đăng nhập, điểm XP mini-game/quiz đều mất trắng khi tải lại trang.
3. **P0-3 — Lỗ hổng Bảo mật Tuyệt đối ở Auth / Portal / Admin:** Không có xác thực phiên thật; `/admin` và `/portal` truy cập tự do; UI `/login` ghi nhãn giả `"TLS 1.3 & HASH BCRYPT"`, `"ISO/IEC 27001"` trong khi thực chất bỏ qua kiểm tra mật khẩu.
4. **P0-4 — Lỗi 404/Chết Chức năng trên Hàng loạt Liên kết Chính:**
   - Sidebar `/admin` có 11/12 mục (từ `/admin/locations` đến `/admin/settings`) không tồn tại trang thực tế (404).
   - Card trên trang chủ (`FeaturedFacilities.tsx`) gắn `?scene=it-lab`, `automation`, `studio`, `sports-field` và `Hero360Viewer.tsx` gắn `?scene=campus` — tất cả **không khớp** 3 ID duy nhất trong `/campus` (`thu-vien`, `lab-it`, `studio-imac`).
   - Bug lọc chuỗi tại `/locations?building=Tòa Nhà F` luôn bị khớp nhầm thành `Tòa Nhà T` (`locations/page.tsx:111-112`).
5. **P0-5 — Tài nguyên Media & 3D/360 Không đạt Chuẩn Sản xuất:**
   - 23 URL ảnh phụ thuộc link tạm `https://lh3.googleusercontent.com/aida-public/...` (hết hạn hoặc bị chặn là gãy toàn site).
   - Ảnh 360° thực chất là ảnh phối cảnh 16:9 ép lên hình cầu Three.js gây méo cực và vệt ghép dọc rõ rệt (nhìn thấy trực tiếp trong ảnh chụp thực tế).
   - `apps/web/public/models/` rỗng; toàn bộ 3D chỉ là khối hộp/trụ lập trình (`BoxGeometry`).
   - `VirtualTourViewer.tsx` khởi tạo lại cả `WebGLRenderer` mỗi lần chuyển scene và gọi `setState` 60 lần/giây trong `requestAnimationFrame`.
6. **P0-6 — Sai lệch Kiến trúc & Dữ liệu So với Spec/Stitch:**
   - `README.md` và `docs/` tuyên bố dùng R3F/Drei, Marzipano, Leaflet, Zustand, React Query, RHF/Zod, 5 cơ sở toàn quốc — **tất cả đều chưa được cài đặt hoặc chưa dùng** trong `apps/web/package.json`.
   - `CampusSelectorModal.tsx` (chuyển cơ sở) và `TourHotspotMarker.tsx` là code thừa chưa gắn vào app; `PublicHeader` thiếu link `/about`.

---

## 6. Kết Luận Nhanh

Nếu cần trả lời câu hỏi **"Có đưa lên cho thí sinh và phụ huynh dùng thật ngay lúc này được không?"**:
**KHÔNG.** Dự án hiện mới chỉ đạt mức **demo giao diện tĩnh (Clickable UI Prototype)** chạy cục bộ ở chế độ `next dev`. Để đạt **MVP thật chạy Production**, đội ngũ bắt buộc phải: (1) Vá lỗi build/lint/routing ngay lập tức, (2) Dựng Backend NestJS + PostgreSQL/Prisma + Auth RBAC thực sự, (3) Chuyển media sang Object Storage/CDN + ảnh Equirectangular 2:1 & mô hình `.glb` thật, và (4) Nối các luồng Public, Open Day, Portal và Admin CMS tối thiểu với kiểm thử tự động.
