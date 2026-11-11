# PROJECT HEALTH CHECK & REPOSITORY CLEANUP AUDIT — VIRTUAL CAMPUS FPT POLYTECHNIC (QTSC QUẬN 12)

**Ngày kiểm toán:** 11/11/2026  
**Đối tượng kiểm toán:** Toàn bộ repository tại `E:\Virtual Campus FPT Poly`  
**Phương pháp:** Strict Read-Only Code, Asset, Config, Dependency & Runtime Verification (không chỉnh sửa mã nguồn hay CSDL, chỉ xuất duy nhất tài liệu kiểm toán này).  
**Nhãn trạng thái chuẩn áp dụng:** `VERIFIED` · `PARTIAL` · `MISSING` · `BROKEN` · `UNVERIFIED` · `UNKNOWN`

---

## 1. Tóm tắt điều hành (Executive Summary)

### 1.1. Kết luận tổng quan
Repository hiện tại thực chất là một **Frontend UI Prototype độc lập chạy trên dữ liệu mẫu tĩnh (`apps/web/src/data/campus-data.ts`)**, **chưa phải** một hệ thống Full-stack hoàn chỉnh như các tài liệu kiến trúc đặt ra. So với hồ sơ kiểm toán cũ trong `PROJECT_STATUS.md` và `docs/project-audit/01..14` (lập lúc ~11:08–11:11 sáng 11/11/2026), giao diện Frontend trong `apps/web` đã trải qua một đợt tái thiết kế lớn (cập nhật tới ~17:12 cùng ngày): tăng từ 14 lên **19 route `page.tsx`**, chuyển bản đồ từ SVG/3D lỗi sang **Leaflet + OpenStreetMap**, đưa toàn bộ ảnh/panorama vào local (`public/images/`), bổ sung **5 route Admin UI mới** (`/admin/locations`, `/admin/virtual-tour`, `/admin/events`, `/admin/media`, `/admin/users`) và **biên dịch / typecheck / lint / build thành công 100% (`exit 0`)**.

Tuy nhiên, bên dưới lớp giao diện sạch sẽ đó tồn tại **5 nhóm rủi ro và nợ kỹ thuật nghiêm trọng**:

1. **Toàn bộ tầng Backend, Database, Auth thật, Storage & Test vẫn ở mức `0%` (`MISSING`):** Không có `apps/api/`, không có `prisma/`, không có `.env`, Docker Compose mới chỉ định nghĩa container `postgres:16-alpine` chưa nối vào ứng dụng; `fetch()` calls trong `apps/web/src` = **0**, `process.env` reads = **0**.
2. **Lỗ hổng bảo mật & xung đột nghiệp vụ MVP trên Frontend (`BROKEN` / `PARTIAL`):**
   - Toàn bộ **6 route `/admin/*` hoàn toàn không có auth guard** trong `apps/web/src/app/admin/layout.tsx` hay `apps/web/src/app/admin/page.tsx`; không có `middleware.ts`. Bất kỳ ai mở URL `/admin` hoặc `/admin/users` đều truy cập trực tiếp.
   - `apps/web/src/lib/prototype-auth.ts:13-24` nhúng thẳng tài khoản và mật khẩu quản trị dạng plaintext (`admin` / `Fpoly@2026`) ngay trong client bundle.
   - Dù định hướng MVP đã chốt **`/login` chỉ dành cho Admin & không có Open Day QR / Student Portal**, có tới **7+ điểm UI và dữ liệu vẫn quảng bá luồng đăng nhập Open Day QR & `/portal`**.
3. **Đứt gãy giữa 3 lớp dữ liệu & kiến trúc (`PARTIAL` / `BROKEN`):**
   - `packages/shared/src/index.ts` bị bỏ hoang (**0 import** trong toàn dự án) với kiểu cũ (`CampusCode` 5 cơ sở, `PanoramaScene`, `STUDENT`/`PARENT` roles).
   - `apps/web/src/data/campus-data.ts` (1.114 dòng) dùng kiểu prototype phẳng (`floor` là string, 1–1 `sceneId`/`linkedLocationSlug`, không có `Floor`/`FloorPlan`).
   - `docs/phase-2a/*` mô tả kiến trúc chuẩn `Building → Floor → FloorPlan → Location (1–N) → TourNode → Hotspot/TourEdge` nhưng chưa có dòng code nào triển khai.
4. **Dấu vết prototype / test artifact lẫn vào bản chạy thật & tài nguyên rác:** 2 ảnh test tỷ lệ 3:1 (`tang-1.jpg`, `tang-2.jpg`) kèm nhãn `"(Test)"` và ghi chú debug hiển thị trực tiếp trong `TOUR_SCENES` (`campus-data.ts:529-535, 714-799`); dependency `lucide-react` cài nhưng `0` lượt import; ảnh `public/images/fpoly-campus-aerial.jpg` (509,2 KB) không còn file nào tham chiếu; nhiều class CSS cũ bỏ hoang trong `globals.css`.
5. **Không có Git & tài liệu `docs/` phân mảnh thành 4 thế hệ mâu thuẫn nhau:** Thư mục gốc **chưa khởi tạo Git** (`.git` không tồn tại), thiếu root `.gitignore`, thiếu root `package.json`, `pnpm-workspace.yaml` khai báo pnpm nhưng thực tế dùng `npm` (`apps/web/package-lock.json`); `docs/` có **35 file Markdown + 13 PNG (~10,8 MB)** chồng chéo giữa bản audit cũ, 2 đợt UI roadmap và đặc tả Phase 2A.

---

## 2. Kiểm kê toàn bộ cấu trúc repository

### 2.1. Thư mục gốc (`E:\Virtual Campus FPT Poly`)
Kiểm tra trực tiếp bằng `Get-ChildItem -Force` cho thấy thư mục gốc **không chứa `.git`, `.gitignore`, `.env`, `package.json`, `pnpm-lock.yaml`, `apps/api/`, hay `prisma/`**. Chỉ có 3 thư mục (`apps/`, `docs/`, `packages/`) và 5 tệp gốc:
- `.env.example` (1.209 B)
- `docker-compose.yml` (619 B)
- `pnpm-workspace.yaml` (40 B)
- `PROJECT_STATUS.md` (13.203 B)
- `README.md` (1.998 B)

### 2.2. Thống kê toàn bộ 177 tệp không thuộc `node_modules` / `.next`
Tổng số tệp thực tế (loại trừ `node_modules` và `.next`): **177 tệp**.

| Nhóm thư mục / Phân hệ | Số tệp | Vai trò thực tế | Trạng thái |
|---|---:|---|---|
| `root (config/docs)` | 5 | `.env.example`, `docker-compose.yml`, `pnpm-workspace.yaml`, `PROJECT_STATUS.md`, `README.md` | `PARTIAL` (tài liệu lỗi thời, thiếu root `package.json` & `.gitignore`) |
| `apps/web (config/lock/tsbuildinfo)` | 10 | `.gitignore`, `AGENTS.md`, `eslint.config.mjs`, `next-env.d.ts`, `next.config.ts`, `package-lock.json`, `package.json`, `README.md`, `tsconfig.json`, `tsconfig.tsbuildinfo` | `PARTIAL` (`next.config.ts` còn domain ảnh cũ) |
| `apps/web/src/app` | 29 | 19 `page.tsx`, 6 `layout.tsx`, `loading.tsx`, `not-found.tsx`, `globals.css` (831 L), `CopyLinkButton.tsx` (40 L) | `VERIFIED` build & HTTP 200 (trừ bảo mật `/admin`) |
| `apps/web/src/components` | 52 | `admin/`(3), `animations/`(2), `events/`(3), `home/`(5), `locations/`(4), `map/`(4), `navigation/`(3), `news/`(4), `portal/`(4), `quiz/`(3), `tour/`(6), `ui/`(11) | `PARTIAL` (`ReactBits` + `PanoramaStage` + `CampusGISMap` tốt; nhiều UI & copy prototype) |
| `apps/web/src/data` | 1 | `campus-data.ts` (1.114 dòng dữ liệu cứng + kiểu TS cục bộ) | `PARTIAL` (chưa tách `Floor`/`FloorPlan`, lẫn dữ liệu test) |
| `apps/web/src/lib` | 2 | `prototype-auth.ts` (67 L), `utils.ts` (18 L) | `PARTIAL` (`prototype-auth.ts` lộ credential; `utils.ts` dư hàm chưa dùng) |
| `apps/web/scripts` | 1 | `capture-pages.mjs` (168 L — Puppeteer multi-viewport QA) | `VERIFIED` |
| `apps/web/public (root/icons/seo)` | 7 | `apple-touch-icon.png`, `favicon-32x32.png`, `favicon.ico`, `favicon.svg`, `icon-fpt.png`, `manifest.json`, `robots.txt` | `PARTIAL` (`manifest.json` sai câu 3D; `robots.txt` trỏ `/sitemap.xml` trả 404) |
| `apps/web/public/images` | 15 | `fpt-logo-official.png`, `fpoly-campus-aerial.jpg` (chết), 6 `locations/*.jpg`, 7 `panoramas/*.jpg` (gồm 2 ảnh test) | `PARTIAL` |
| `packages/shared (src/config)` | 3 | `package.json`, `tsconfig.json`, `src/index.ts` (183 L) | `MISSING` consumer (0 import trong `apps/web`) |
| `packages/shared/dist` | 4 | `index.d.ts`, `index.d.ts.map`, `index.js`, `index.js.map` | `BROKEN` hygiene (build artifact mồ côi) |
| `docs/root` | 7 | `component-architecture.md`, `design-audit.md`, `design-system.md`, `migration-report.md`, `ORIGINAL_DESIGN_SPEC.md`, `page-mapping.md`, `standardization-and-cleanup.md` | `BROKEN` / Obsolete (đời Stitch đầu, sai với code hiện tại) |
| `docs/project-audit` | 14 | `01-executive-summary.md` → `14-project-architecture.md` | `PARTIAL` (phản ánh snapshot cũ 11:08 AM, mâu thuẫn Phase 2A ở file `06`) |
| `docs/ui-roadmap` | 9 | 2 đợt tài liệu (`12:23 PM` và `13:54 PM`) gồm blueprint, design system, route mapping | `PARTIAL` (nội bộ tự trùng lặp 3 cặp file, vẫn ghi luồng `/portal`) |
| `docs/phase-2a` | 5 | `PHASE_2A_SYSTEM_ARCHITECTURE.md`, `DATABASE_DESIGN.md`, `API_CONTRACT.md`, `PANORAMA_WORKFLOW.md`, `IMPLEMENTATION_ROADMAP.md` | `VERIFIED` về mặt thiết kế, `0%` triển khai code |
| `docs/stitch-references` | 13 | 13 ảnh `.png` UI tham chiếu từ Google Stitch (~10,2 MB tổng dung lượng) | Design reference (`B5`) |
| **TỔNG CỘNG** | **177** | Tổng mã nguồn `apps/web/src`: **84 tệp / 12.411 dòng** (App: 4.876 L, Components: 6.334 L, Data: 1.114 L, Lib: 87 L) | — |

---

## 3. Đối chiếu tiến độ thật giữa `PROJECT_STATUS.md` / `docs/project-audit` và Source Code thực tế

### 3.1. Bảng sai lệch so với `PROJECT_STATUS.md` (lập 11/11/2026 11:11 AM)

| Hạng mục tuyên bố trong `PROJECT_STATUS.md` & `docs/project-audit/01..02` | Thực tế trong source hiện tại | Trạng thái đối chiếu |
|---|---|---|
| `14` tệp `page.tsx`, `6` `layout.tsx`, `32` component `.tsx`, `9.044` LOC (`PROJECT_STATUS.md:19-24`) | **19** `page.tsx`, **6** `layout.tsx`, **52** tệp trong `src/components/` (**84** tệp trong `src/`, **12.411 LOC**) | **Lỗi thời nặng** |
| `/admin` mới có 1 trang, **11/12 link admin bị 404** (`PROJECT_STATUS.md:49,54`) | Đã có đủ **6/6 trang Admin P0** khớp 100% `ADMIN_MODULES` (`/admin`, `/locations`, `/virtual-tour`, `/events`, `/media`, `/users`), tất cả trả **HTTP 200** | **Đã sửa xong ở tầng UI** |
| `npm run build` **FAIL** (Turbopack CSS `globals.css` mất phần cuối từ dòng 115) (`PROJECT_STATUS.md:30-31`) | `globals.css` đầy đủ **831 dòng**; `npm run build` **PASS (`exit 0`)**, compile 2.5s, 28 static/SSG worker pages | **Đã sửa xong** |
| `npm run lint` **FAIL** (6 errors) (`PROJECT_STATUS.md:32-33`) | `npm run lint` **PASS (`exit 0`)**, 0 errors *(lưu ý `eslint.config.mjs` tắt 3 rule Next)* | **Đã sửa xong** |
| Tồn tại `Campus3DViewer.tsx` (1.244 dòng) & `apps/web/test-height.mjs` (`PROJECT_STATUS.md:39,47`) | Cả 2 tệp **không còn tồn tại**; `/map` dùng `CampusGISMap.tsx` (783 L) + Leaflet/OSM | **Đã dọn / thay thế** |
| **23 URL ảnh `lh3.googleusercontent.com`** gắn cứng & 0 ảnh local (`PROJECT_STATUS.md:45,51`) | **0 URL `lh3`/`unsplash`** trong `src/`; toàn bộ 14 ảnh sử dụng nằm local trong `public/images/` *(chỉ còn `next.config.ts` quên xóa `remotePatterns`)* | **Đã thay thế (sót config)** |
| `apps/api`, PostgreSQL, Prisma, Auth, RBAC, R2/S3, Test = **0%** | **Vẫn giữ nguyên 0% (`MISSING`)** — chưa khởi tạo bất kỳ hạng mục Backend/DB/Test nào | **Chính xác (chưa đổi)** |

### 3.2. Đánh giá mức độ hoàn thiện thật sự (Weighted Progress Audit)

| Phân hệ (Domain) | Trạng thái kỹ thuật thực tế | Mức hoàn thiện thật | Ghi chú minh bạch |
|---|---|---:|---|
| **Frontend Public & Immersive UI (`/` `/campus` `/map` `/locations` `/events` `/news` `/about` `/contact`)** | Render mượt, responsive, Three.js 360° & Leaflet GIS hoạt động tốt | **~85% UI / ~50% chức năng thật** | Thiếu API động, thiếu dữ liệu Floor Plan 2D, còn chữ test/portal lạc nhịp MVP |
| **Frontend Admin Studio UI (`/admin/*`)** | 6 màn hình bảng/form/editor chạy tốt ở state cục bộ | **~65% UI / ~10% nghiệp vụ thật** | **Không có auth guard**, mọi chỉnh sửa mất khi F5, chưa đồng bộ giữa các màn hình, chưa có Floor Plan Editor |
| **Auth & Security** | Client-side mock `sessionStorage` + hardcoded password trong JS | **~5% (`BROKEN`)** | Không middleware, không JWT/cookie, không RBAC, `/admin` mở toang |
| **Shared Contract (`packages/shared`)** | Build được `tsc --noEmit` nhưng **0 file dùng**, lệch schema hoàn toàn | **~5% (`BROKEN`)** | Không khớp `campus-data.ts` lẫn `docs/phase-2a` |
| **Backend API (`apps/api`) & Database (PostgreSQL/Prisma)** | Chỉ có `docker-compose.yml` postgres template + `.env.example` + tài liệu Phase 2A | **0% (`MISSING`)** | Chưa có folder `apps/api/` hay `prisma/` |
| **Storage, Media Pipeline & Tests (Unit/Integration/E2E)** | Có `FileDropzone` mock (`URL.createObjectURL`) & `scripts/capture-pages.mjs` | **0% (Backend/Test)** | Không có Vitest/Playwright test suite, không Redis/BullMQ/S3 |
| **Mức sẵn sàng Prototype Demo UI / Mức sẵn sàng Production Full-Stack** | Build sạch, chạy demo trình duyệt tốt; **chưa thể vận hành production** | **Demo UI: ~75% · Full-Stack Product: ~25%** | Phải tách rạch ròi 2 con số này để không ngộ nhận tiến độ |

---

## 4. Kiểm toán toàn bộ Route, Layout và Trạng thái từng màn hình

Kiểm tra `apps/web/src/app` ghi nhận **29 tệp**: **19 `page.tsx`**, **6 `layout.tsx`**, `loading.tsx`, `not-found.tsx`, `globals.css`, `CopyLinkButton.tsx`. Tất cả 19 URL (cùng dynamic slugs) đã được kiểm tra trực tiếp bằng `next build` (`exit 0`) và HTTP `Invoke-WebRequest` tới production build server tại `http://localhost:3000`:

| # | Route URL | Tệp nguồn | Loại Render (`next build`) | HTTP Check | Guard / Auth thực tế | Mức phù hợp MVP hiện tại |
|---:|---|---|---|---|---|---|
| 1 | `/` | `src/app/(public)/page.tsx` (19 L) | `Static` (`○`) Server | `200` | Công khai | **Đạt định hướng 360° hero**, nhưng `OpenDayBanner.tsx:35-36` còn nhắc đăng nhập QR Open Day |
| 2 | `/campus` | `src/app/(immersive)/campus/page.tsx` (21 L) | `Dynamic` (`ƒ`) Server | `200` | Công khai | Hoạt động tốt (WebGL Three.js), nhưng lẫn 2 scene test `tang-1`, `tang-2`; **chưa có mini-map Floor Plan** |
| 3 | `/map` | `src/app/(immersive)/map/page.tsx` (19 L) | `Dynamic` (`ƒ`) Server | `200` | Công khai | Đạt (Leaflet + OSM + 5 pin QTSC + route polyline; 3D WebGL không còn xuất hiện) |
| 4 | `/locations` | `src/app/(public)/locations/page.tsx` (70 L) | `Dynamic` (`ƒ`) Server | `200` | Công khai | Hoạt động tốt (`LocationsExplorer`), dùng min-height chống nhảy footer; copy dòng 36 nhắc điểm check-in |
| 5 | `/locations/[slug]` | `src/app/(public)/locations/[slug]/page.tsx` (203 L) | `SSG` (`●`, 6 paths) Server | `200` | Công khai | Đạt, render động theo slug, có `NotFoundState` khi sai slug |
| 6 | `/events` | `src/app/(public)/events/page.tsx` (98 L) | `Static` (`○`) Server | `200` | Công khai | **Lệch copy MVP:** nội dung (`EventPillarGrid`, `OpenDayScheduleTimeline`, FAQ) hướng dẫn đăng nhập lấy QR |
| 7 | `/news` | `src/app/(public)/news/page.tsx` (74 L) | `Static` (`○`) Server | `200` | Công khai | Chạy tốt (`59 L` data nằm lạc trong `components/news/news-items.ts`) |
| 8 | `/news/[slug]` | `src/app/(public)/news/[slug]/page.tsx` (109 L) | `SSG` (`●`, 3 paths) Server | `200` | Công khai | **Lệch copy MVP:** bài #2 nhắc hướng dẫn mở thẻ Check-in QR tại `/portal` |
| 9 | `/about` | `src/app/(public)/about/page.tsx` (204 L) | `Static` (`○`) Server | `200` | Công khai | Chạy tốt (ReactBits Desktop-only); mục 2 (`line 147-150`) vẫn mô tả tài khoản Open Day `/portal` |
| 10 | `/contact` | `src/app/(public)/contact/page.tsx` (114 L) | `Static` (`○`) Server | `200` | Công khai | Đạt (kênh liên hệ QTSC + link website chính thức) |
| 11 | `/games` | `src/app/(public)/games/page.tsx` (38 L) | `Static` (`○`) Server | `200` | Công khai | **0 link trỏ tới trong `src/`** (ẩn đúng khỏi menu); `QuizLeaderboard.tsx:27` vẫn nhắc QR Open Day |
| 12 | `/login` | `src/app/(auth)/login/page.tsx` (292 L) | `Static` (`○`) **Client** | `200` | Auth mock | Tiêu đề đã đổi sang **Đăng nhập Quản trị** (không cho tự đăng ký), nhưng `first_login_change_password` mode là dead branch (`mustChangePassword: false`), mật khẩu cứng `Fpoly@2026` |
| 13 | `/portal` | `src/app/(portal)/portal/page.tsx` (197 L) | `Static` (`○`) **Client** | `200` | `sessionStorage` check | Đã loại khỏi nav/sitemap nhưng **vẫn giữ route**; hiển thị `<AuthGateState actionHref="/login?next=/portal" />` (`line 66`); không kiểm tra role nên `admin` cũng mở được giao diện khách mời |
| 14 | `/admin` | `src/app/admin/page.tsx` (205 L) | `Static` (`○`) Server | `200` | **KHÔNG CÓ GUARD (`BROKEN`)** | Dashboard đọc mảng tĩnh; **bị truy cập tự do không cần đăng nhập** |
| 15 | `/admin/locations` | `src/app/admin/locations/page.tsx` (390 L) | `Static` (`○`) **Client** | `200` | **KHÔNG CÓ GUARD** | CRUD phòng học `useState` cục bộ (mất khi F5), chưa có tạo tòa nhà hay tầng/mặt bằng |
| 16 | `/admin/virtual-tour` | `src/app/admin/virtual-tour/page.tsx` (381 L) | `Static` (`○`) **Client** | `200` | **KHÔNG CÓ GUARD** | Raycast click đặt hotspot trên WebGL rất tốt nhưng lưu `useState` cục bộ, không đồng bộ sang `/campus` |
| 17 | `/admin/events` | `src/app/admin/events/page.tsx` (402 L) | `Static` (`○`) **Client** | `200` | **KHÔNG CÓ GUARD** | Quản lý lịch Open Day + tab Check-in QR cho tài khoản `participant` (`INITIAL_ADMIN_USERS` hiện chỉ có 1 user `admin` nên roster trống) |
| 18 | `/admin/media` | `src/app/admin/media/page.tsx` (244 L) | `Static` (`○`) **Client** | `200` | **KHÔNG CÓ GUARD** | Kiểm tra tỷ lệ ảnh 2:1 qua `Image()` + `URL.createObjectURL`, chưa upload server |
| 19 | `/admin/users` | `src/app/admin/users/page.tsx` (447 L) | `Static` (`○`) **Client** | `200` | **KHÔNG CÓ GUARD** | Thiết kế phục vụ tạo/import CSV tài khoản `participant` mời (trước quyết định Admin-only MVP) |

**Kiểm tra thêm route đặc biệt:**
- `/khong-ton-tai-404` → `HTTP 404` (render `not-found.tsx`, đạt).
- `/sitemap.xml` → **`HTTP 404`** dù `apps/web/public/robots.txt:6` khai báo `Sitemap: https://virtualcampus.poly.edu.vn/sitemap.xml` (`BROKEN` SEO config).

---

## 5. Kiểm toán kiến trúc Frontend (Next.js App Router, Components, State, Styling)

- **Kiến trúc Route Groups (5 layout + 1 root layout):** `(public)`, `(immersive)`, `(auth)`, `(portal)`, `admin` phân tách shell rõ ràng. `PublicHeader.tsx:7-12,98-100` chỉ chứa 4 link công khai (`/campus`, `/map`, `/locations`, `/events`) + nút **`Quản trị`** trỏ `/login`, không chứa `/games` hay `/portal`.
- **Panorama Engine (`apps/web/src/components/tour/PanoramaStage.tsx`, 717 L):**
  - **Điểm mạnh:** Khởi tạo đúng **1 `THREE.WebGLRenderer` duy nhất**, chỉ swap texture khi đổi scene (`line 448+`), tự động bù dải trần/sàn cho ảnh không đạt chuẩn 2:1 (`preparePanoramaTexture`, `line 61+`), hỗ trợ `autoRotate` và tự động xoay lại đúng **3.000ms** sau khi thả tay kéo (`AUTO_ROTATE_RESUME_MS = 3000` ở `Hero360Viewer.tsx:12`, `idleElapsed` ở `PanoramaStage.tsx:363-365`), dọn sạch `requestAnimationFrame`, `ResizeObserver`, `window.resize`, `geometry`, `material`, `texture`, `renderer.dispose()` khi unmount (`line 430-445`).
  - **Hạn chế:** Còn phụ thuộc raycasting client thuần trên 1 file dữ liệu tĩnh; chưa có lớp giao diện đồng bộ mini-map Floor Plan 2D hay nút chọn tầng bên trong `/campus`.
- **Bản đồ GIS (`apps/web/src/components/map/CampusGISMap.tsx`, 783 L):**
  - Dynamic import `leaflet` phía client (`line 181`), dọn `mapRef.current.remove()` đúng cách khi unmount (`line 221-229`), hiển thị 5 tòa nhà với tọa độ WGS84 QTSC thật, tìm kiếm/lọc, đo khoảng cách Haversine + lộ trình nét đứt từ Cổng QTSC hoặc GPS người dùng, popup + `BuildingDetailDrawer`.
  - **Hạn chế:** Tệp hơi dài (783 L), trùng khối CTA `Google Maps ↗` / `Mở Tour 360°` ở cả Desktop overlay (`line 668-691`) và Mobile bottom bar (`line 757-772`).
- **Animations (`apps/web/src/components/animations/ReactBits.tsx`, 316 L):**
  - Dùng `useSyncExternalStore` + `matchMedia("(min-width: 1024px)")` & `(prefers-reduced-motion: reduce)` (`useDesktopMotionEnabled`, `line 13-41`) để **vô hiệu hóa hoàn toàn animation trên Mobile/Tablet**.
  - **Điểm lưu ý:** Dùng `BlurText`, `AnimatedContent`, `FadeContent`, `SpotlightCard`, `CountUp` không chỉ ở `/` mà còn trên `/about`, `/contact`, `/events`, `/locations`, `/locations/[slug]`, `/news`, `/news/[slug]` — khớp với yêu cầu mở rộng animation sang các trang không phải 360° trên desktop, nhưng việc import `motion/react` kéo runtime `motion` (`^14.12.0`) vào tất cả các trang public kể cả khi thiết bị `<1024px` không chạy animation.
- **State Management & Data Fetching:**
  - `0` lời gọi `fetch()`, `0` Server Actions, `0` Route Handlers (`/api/*`), `0` Zustand/Context đồng bộ dữ liệu Admin. Toàn bộ 5 màn hình chỉnh sửa Admin (`/admin/locations`, `virtual-tour`, `events`, `media`, `users`) giữ bản sao `useState(...)` độc lập đọc từ `campus-data.ts` — chỉnh ở màn hình này không sang màn hình kia và **F5 là mất trắng**.
- **UI Primitives & CSS (`apps/web/src/components/ui/*` & `globals.css`):**
  - `Modal.tsx` và `Drawer.tsx` xử lý tốt `role="dialog"`, `aria-modal`, Escape key, lock body scroll và cleanup; tuy nhiên `Drawer.tsx` chưa restore focus về trigger khi đóng và `Modal.tsx` chưa có `Tab` focus-trap đầy đủ.
  - `LocationsExplorer.tsx:81` (`min-h-[520px] sm:min-h-[700px] lg:min-h-[846px]`) và `OpenDayScheduleTimeline.tsx:58` (`min-h-[520px] sm:min-h-[740px] lg:min-h-[1190px]`) đang giữ chiều cao cố định bằng pixel cứng để chống giật footer khi lọc; cách này lệ thuộc số lượng item mẫu hiện tại, nếu thêm/bớt item sau này từ DB sẽ bị thừa khoảng trắng hoặc tụt khung.

---

## 6. Phát hiện File dư thừa, Code trùng lặp và Dead Code (B1–B6)

| Phân loại | Tệp / Thực thể / Dòng mã cụ thể | Lý do phân loại & Bằng chứng | Hướng xử lý đề xuất |
|---|---|---|---|
| **B1. Core Production** | `apps/web/src/app/(public|immersive|auth)/*`, `apps/web/src/components/{home,tour,map,locations,navigation,ui,animations,events,news}/*`, `apps/web/public/images/{fpt-logo-official.png,locations/*,panoramas/* trừ tang-1,2}`, favicons | Mã nguồn giao diện active của sản phẩm, `tsc`/`lint`/`build` PASS và đang phục vụ 19 route | **Giữ & hoàn thiện kết nối API thật** |
| **B2. Unused / Dead Code** | `packages/shared/*` + `packages/shared/dist/*` (4 tệp compiled JS/d.ts/map) | **0 lượt import** `@fpt-campus/shared` trong toàn repo; `tsconfig.json` không khai báo alias | Viết lại contract khớp Phase 2A rồi wire vào workspace, xóa `dist/` khỏi tracking |
| **B2. Unused / Dead Code** | Dependency `lucide-react` (`^1.71.0`) trong `apps/web/package.json:18` | **0 lượt import** trong toàn bộ `src/` (app dùng Material Symbols + SVG inline) | Gỡ khỏi `package.json` khi dọn dependency |
| **B2. Unused / Dead Code** | `apps/web/public/images/fpoly-campus-aerial.jpg` (521.451 B / 1024×576) | **0 tham chiếu** trong `apps/web/src/` (chỉ còn được nhắc trong `docs/` cũ) | Xóa hoặc chuyển ra ngoài `public/` để giảm dung lượng deploy |
| **B2. Unused / Dead Code** | `CardHeader`, `CardContent`, `CardFooter` (`components/ui/Card.tsx:38-78`); `formatNumber`, `formatDate` (`src/lib/utils.ts:8-17`) | **0 consumer** ngoài file định nghĩa & barrel `ui/index.ts` | Giữ lại có chủ đích nếu dùng ở Admin phase sau, hoặc gỡ nếu không cần |
| **B2. Unused CSS Dead** | `globals.css`: `.home-reveal` (`line 348, 818`), `.home-reveal-visible` (`357`), `.animate-fade-in` (`309`), `.shadow-cta-glow` (`417`), `.glass-hud` (`421`), `.ui-dropdown-menu` (`717`), `.ui-state-success` (`748`) | **0 lượt dùng** trong toàn bộ `src/**/*.tsx,ts` | Dọn khỏi `globals.css` để tránh CSS phình & nhầm chuẩn |
| **B2. Dead Auth UI Branch** | `apps/web/src/app/(auth)/login/page.tsx:72-97, 212-279` (`first_login_change_password` UI) | `prototype-auth.ts:22` gán `mustChangePassword: false` cho duy nhất `admin`, nên màn hình đổi mật khẩu lần đầu không bao giờ chạm tới | Gỡ khi dọn luồng Open Day guest hoặc chuyển sang Backend auth flow thật |
| **B3. Trùng lặp & Mâu thuẫn Spec** | `docs/` (35 `.md` chia làm 4 đời: `docs/*.md`, `docs/project-audit/01..14`, 2 đợt `docs/ui-roadmap/*`, `docs/phase-2a/*`) | MD5 khác nhau hoàn toàn nhưng trùng chủ đề & tên gọi (`DESIGN_SYSTEM_AND_BLUEPRINT.md` vs `UI_DESIGN_SYSTEM.md` vs `design-system.md`; `ROUTE_MIGRATION_MAPPING.md` vs `UI_ROUTE_MIGRATION_MAPPING.md`; `06-database-audit.md` dùng `tour_scenes` 1–1 mâu thuẫn `PHASE_2A_DATABASE_DESIGN.md` dùng `tour_nodes` 1–N) | Archive tài liệu cũ vào `docs/_archive/`, chỉ giữ `docs/phase-2a/*` + spec chuẩn |
| **B3. Schema Fragmentation** | 3 schema dữ liệu tách rời: `packages/shared/src/index.ts`, `apps/web/src/data/campus-data.ts`, `docs/phase-2a/PHASE_2A_DATABASE_DESIGN.md` | Không tương thích tên field, số campus, role và quan hệ | Hợp nhất về 1 chuẩn tại `packages/shared` theo Phase 2A |
| **B3. Local Code Duplication** | Khối nút CTA `Google Maps ↗` & `Mở Tour 360°` lặp lại trong `CampusGISMap.tsx:668-691` (desktop) và `757-772` (mobile); Pattern table+search+modal CRUD lặp giữa `admin/locations` (390L), `admin/events` (402L), `admin/users` (447L) | Lặp markup & action handlers trong cùng component / giữa các trang admin | Tách subcomponent `<BuildingActionButtons />` & dùng chung helper admin khi refactor |
| **B4. Mock / Test Artifacts** | `tang-1.jpg` (294,7 KB, `2170×725` 3:1), `tang-2.jpg` (341,9 KB, `2172×724` 3:1) + scene `tang-1-sanh-ong-vang`, `tang-2-dich-vu-sv` + hotspot `hs-to-tang1-test` (`campus-data.ts:529-535, 714-799`) | Hiển thị chữ `"(Test)"`, `"Test Ảnh Thực tế Tầng 1"`, `"vạch nối nhẹ sau lưng ~30 MAE"` ra UI public `/campus`! Đồng thời khiến `AdminDashboardMetrics.tsx:36-37` báo sai `"7 cảnh ... Chuẩn 2:1 nội bộ"` | **Ưu tiên P1 gỡ khỏi `TOUR_SCENES` & `INITIAL_MEDIA_ASSETS`** hoặc ẩn dưới flag/draft |
| **B4. Prototype / Transitional** | `src/lib/prototype-auth.ts`, `src/app/(portal)/portal/*`, `src/components/portal/*`, `AdminRecentActivityLog.tsx` (hardcoded `RECENT_OPERATIONS`), `news-items.ts` (đặt nhầm trong `components/news/`), `admin/events` tab Check-in QR & `admin/users` CRUD CSV guest | Mô phỏng dữ liệu/luồng cũ (trước quyết định bỏ Open Day guest login) | Chờ xác nhận giữ/ẩn phần Open Day guest & `/portal` |
| **B5. Design Reference** | `docs/stitch-references/*.png` (13 ảnh, ~10,2 MB), `docs/ORIGINAL_DESIGN_SPEC.md`, `docs/ui-roadmap/UI_DESIGN_SYSTEM.md`, `docs/phase-2a/*` | Tài liệu & ảnh đối chiếu thiết kế/kiến trúc | Giữ `phase-2a/` và 1 bộ Design System chuẩn; nén/archive `stitch-references` nếu repo nhẹ |
| **B6. Config / Doc Outdated** | `PROJECT_STATUS.md`, `README.md`, `apps/web/README.md`, `apps/web/AGENTS.md`, `apps/web/next.config.ts` (`lh3`/`unsplash` `remotePatterns`), `apps/web/public/manifest.json` (`"bản đồ 3D tương tác"`), `apps/web/public/robots.txt` (`/sitemap.xml` trả 404) | Khai báo sai sự thật so với code & MVP hiện hành | Cập nhật `PROJECT_STATUS.md`, `README.md`, `next.config.ts`, `manifest.json`, bổ sung `app/sitemap.ts` hoặc sửa `robots.txt` |

---

## 7. Kiểm toán Tài liệu (`docs/`) và Độ khớp với MVP hiện tại

Kiểm tra timestamp & nội dung toàn bộ **35 tệp Markdown** và **13 PNG** trong `docs/` cho thấy tài liệu được sinh ra qua **4 làn sóng chồng lớp**:
1. **Đời 1 (`10/11/2026` tối):** `docs/ORIGINAL_DESIGN_SPEC.md`, `design-audit.md`, `design-system.md`, `component-architecture.md`, `migration-report.md`, `page-mapping.md`, `standardization-and-cleanup.md` + `stitch-references/*.png`. **Đã lỗi thời 100%** (nhắc `Campus3DViewer`, `QuickAdmissionForm`, `16 routes`, `Marzipano`).
2. **Đời 2 (`11/11/2026 11:08–11:11`):** `PROJECT_STATUS.md` + `docs/project-audit/01..14`. Mô tả snapshot trước khi sửa UI nên lệch toàn bộ số liệu Frontend (`14` pages, build FAIL, lint FAIL, 11/12 admin 404). Tệp `06-database-audit.md` dùng `tour_scenes` `1–1` — mâu thuẫn với Phase 2A.
3. **Đời 3 (`11/11/2026` trưa & chiều):** `docs/ui-roadmap/` chia làm **2 đợt kế tiếp trong cùng ngày**:
   - Đợt 1 (`12:23–12:24`): `DESIGN_SYSTEM_AND_BLUEPRINT.md`, `ROUTE_MIGRATION_MAPPING.md`, `UI_DESIGN_MAPPING.md`.
   - Đợt 2 (`13:54–13:58`): `UI_DESIGN_SYSTEM.md`, `UI_ROUTE_MIGRATION_MAPPING.md`, `UI_PAGE_BLUEPRINT.md`, `UI_FULL_INVENTORY.md`, `UI_UX_AUDIT.md`, `UI_IMPLEMENTATION_ROADMAP.md`.
   - Cả 2 đợt này đều giữ tiền đề **Open Day Participant Portal (`/portal`) & `/login?next=/portal`**, không còn khớp với quyết định cuối cùng (`/login` Admin-only, không xây Student/Guest Portal).
4. **Đời 4 (`11/11/2026 16:07–16:15`):** 5 tài liệu `docs/phase-2a/*` — **là nguồn kiến trúc mục tiêu chuẩn xác và mới nhất**, đã cập nhật chuẩn `TourNode` (`1–N` với `Location`), bỏ `PARTICIPANT`, định nghĩa `Floor` + `FloorPlan` + `[0..1]` coords + MinIO/R2 + Redis/BullMQ + Graph Validator. Tuy nhiên chưa đồng bộ vào code.

---

## 8. Kiểm toán Dependency & Bundle

- **Mâu thuẫn Package Manager (`BROKEN` hygiene):** `pnpm-workspace.yaml` khai báo pnpm monorepo (`apps/*`, `packages/*`), nhưng thư mục gốc **không có `package.json` và không có `pnpm-lock.yaml`**; trong khi `apps/web/` dùng **`package-lock.json` (`251.281 B` của npm)**.
- **Audit từng package trong `apps/web/package.json`:**
  - `next` (`16.4.6`), `react` (`19.3.0`), `react-dom` (`19.3.0`), `clsx`, `tailwind-merge`, `tailwindcss` (`4.3.3`), `@tailwindcss/turbopack` (`4.3.3`), `eslint`, `eslint-config-next`, `typescript`, `@types/*`: **Đang dùng đúng mục đích**.
  - **`lucide-react` (`^1.71.0`): DƯ THỪA HOÀN TOÀN (`0` import trong toàn repo)** — app dùng font `Material Symbols Outlined` qua CDN `fonts.googleapis.com` (`layout.tsx:53`) và SVG nội tuyến (`qtscLeafletIcons.ts:95`).
  - `three` (`^0.187.0`): Chỉ dùng trong `PanoramaStage.tsx` (import client-side trên `/` và `/campus`, `/admin/virtual-tour`).
  - `leaflet` (`^1.9.4`): Dynamic import client-side chỉ trên `/map` (`CampusGISMap.tsx:181`), tốt cho code-splitting.
  - `motion` (`^14.12.0`): Dùng bởi `ReactBits.tsx` trên hầu hết các trang public; dù tắt hiệu ứng trên `<1024px`, gói JS `motion` vẫn được tải xuống client.
  - `puppeteer` (`^25.17.0` trong `devDependencies`): Dùng đúng bởi `scripts/capture-pages.mjs` (`npm run capture`).
- **Kiểm tra lỗ hổng bảo mật (`npm --prefix apps/web audit --json`, exit `1`):**
  - **0 critical · 0 high · 0 low · 8 moderate** (475 tổng gói, 28 prod deps).
  - Toàn bộ **8 cảnh báo moderate** nằm trong chuỗi **devDependency** (`eslint-config-next` → `typescript-eslint` → `@typescript-eslint/*` → `minimatch` `GHSA-g3hv-75wg-m249`). **0 lỗ hổng runtime production** được ghi nhận bởi `npm audit`.

---

## 9. Kiểm toán Bảo mật & An toàn cấu hình

| Mức độ | Phát hiện cụ thể | Vị trí bằng chứng | Rủi ro & Tác động |
|---|---|---|---|
| **CRITICAL** | **6 route `/admin/*` hoàn toàn không có auth guard** | `src/app/admin/layout.tsx`, `src/app/admin/page.tsx`, không có `middleware.ts` | Bất kỳ người dùng ẩn danh nào gõ `/admin`, `/admin/users`, `/admin/virtual-tour` đều mở được giao diện quản trị (`HTTP 200`). |
| **CRITICAL** | **Mật khẩu Admin hardcode plaintext trong JS client bundle** | `src/lib/prototype-auth.ts:13-38` (`username: "admin"`, `password: "Fpoly@2026"`) | Bất kỳ ai mở DevTools / view source JS bundle ở `/login` đều đọc được mật khẩu admin. |
| **HIGH** | **Session giả lập thuần client qua `window.sessionStorage` & bỏ qua kiểm tra Role** | `prototype-auth.ts:40-67`; `portal/page.tsx:59` (`if (!session)` không check `role`) | Ai cũng tự ghi JSON vào `sessionStorage` để vượt qua `AuthGateState` trên `/portal`; đổi mật khẩu tại `portal/page.tsx:74-103` không xác thực `currentPw`. |
| **HIGH** | **Open-ish internal redirect sang `/portal` và lộ UI hướng dẫn tài khoản mời** | `login/page.tsx:16-26,68`; `portal/page.tsx:66`; `StateFeedback.tsx:174` (`/login?next=/portal`) | Dù `resolveSafeNextPath` chặn external URL (`//`), đường dẫn `/login?next=/portal` vẫn tồn tại trong code dù `/portal` không nằm trong MVP. |
| **MEDIUM** | **Thiếu Security Headers / CSP & phụ thuộc CDN ngoài khi tải Font/Tile** | `apps/web/next.config.ts` (không cấu hình `headers()`); `layout.tsx:53` (`fonts.googleapis.com`) | Chưa có `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, CSP; nếu mất mạng ngoài sẽ mất toàn bộ icon Material Symbols. |
| **MEDIUM** | **Không có `.git`, thiếu root `.gitignore`, secret mẫu mặc định yếu** | Root workspace thiếu `.git` & `.gitignore`; `docker-compose.yml`, `.env.example` | Không có lịch sử commit/rollback; nếu khởi tạo Git mà quên `.gitignore` ở root dễ vô tình commit `.env`, dump DB hoặc log sau này. *(Đã xác minh hiện chưa tồn tại `.env` trên ổ đĩa).* |

---

## 10. Kiểm toán Dữ liệu mẫu, Content & Copywriting theo định hướng MVP

Đối chiếu trực tiếp code hiện tại với quyết định sản phẩm đã chốt (**`/login` chỉ dành cho Admin, không tự đăng ký, không có tài khoản khách Open Day / Student Portal trong MVP, tạm ẩn 3D WebGL, ưu tiên 360° + GIS**):

1. **Vẫn còn 8 tệp công khai / admin mô tả sai luồng Open Day Account & QR `/portal`:**
   - `apps/web/src/components/home/OpenDayBanner.tsx:35-36` (Trang chủ `/`!)
   - `apps/web/src/app/(public)/about/page.tsx:147-150`
   - `apps/web/src/app/(public)/events/page.tsx:33` + `OpenDayScheduleTimeline.tsx:79` + `EventPillarGrid.tsx:22-29`
   - `apps/web/src/components/news/news-items.ts:36,41-42` (lẫn cả con số `"5 góc nhìn 360°"` tại dòng 21 trong khi `TOUR_SCENES` đang có 7 cảnh)
   - `apps/web/src/components/quiz/QuizLeaderboard.tsx:27` (trên `/games`)
   - `apps/web/src/components/ui/StateFeedback.tsx:172,174` & `src/app/(portal)/portal/page.tsx:64,66` (còn `/login?next=/portal`)
   - `apps/web/src/data/campus-data.ts:822,874,913,919` (`OPEN_DAY_SESSIONS` và `OPEN_DAY_FAQ` nói rõ đường dẫn `/portal` & mật khẩu tạm Zalo/Email!)
2. **Dữ liệu test nội bộ bị lộ ra môi trường public:**
   - `campus-data.ts:529-535` thêm nút hotspot `"Test Ảnh Thực tế Tầng 1"` ngay ở cảnh chào đầu tiên (`cong-chao-qtsc`).
   - `campus-data.ts:714-799` chứa 2 cảnh `tang-1-sanh-ong-vang` và `tang-2-dich-vu-sv` có nhãn `"(Test)"`, `buildingLabel: "Cơ sở Thực tế (Test 360°)"` và hotspot `infoText` in thẳng kết quả benchmark kỹ thuật (`"vạch nối nhẹ sau lưng ~30 MAE"`, `"13.1 MAE"`, `"2170×725"`).
3. **Thông tin metadata cấu hình chưa đồng bộ:**
   - `apps/web/public/manifest.json:4` vẫn ghi `"bản đồ 3D tương tác"` dù 3D WebGL đã ẩn khỏi MVP.
   - `apps/web/public/robots.txt:6` trỏ `Sitemap: https://virtualcampus.poly.edu.vn/sitemap.xml` nhưng chưa có route/file tạo sitemap.

---

## 11. Kiểm toán Asset & Media (`apps/web/public` & `docs/stitch-references`)

Kiểm tra kích thước pixel thực tế từng ảnh trên ổ đĩa bằng `System.Drawing.Image`:

| Đường dẫn | Kích thước pixel & Tỷ lệ | Dung lượng | Trạng thái sử dụng | Ghi chú kiểm toán |
|---|---|---:|---|---|
| `public/images/panoramas/campus-courtyard-360.jpg` | `2048×1024` (`2.00:1`) | 466,2 KB | `VERIFIED` (`cong-chao-qtsc`) | Chuẩn equirectangular 2:1 |
| `public/images/panoramas/auditorium-360.jpg` | `2048×1024` (`2.00:1`) | 388,3 KB | `VERIFIED` (`sanh-innovation`) | Chuẩn 2:1 |
| `public/images/panoramas/library-360.jpg` | `2048×1024` (`2.00:1`) | 391,3 KB | `VERIFIED` (`thu-vien`) | Chuẩn 2:1 |
| `public/images/panoramas/it-lab-360.jpg` | `2048×1024` (`2.00:1`) | 309,7 KB | `VERIFIED` (`lab-it`) | Chuẩn 2:1 |
| `public/images/panoramas/imac-studio-360.jpg` | `2048×1024` (`2.00:1`) | 336,9 KB | `VERIFIED` (`studio-imac`) | Chuẩn 2:1 |
| `public/images/panoramas/tang-1.jpg` | `2170×725` (`2.99:1`) | 294,7 KB | **Test artifact active** | **Lệch tỷ lệ (thiếu trần/sàn), dùng để test (`isEquirectangular2to1: false`)** |
| `public/images/panoramas/tang-2.jpg` | `2172×724` (`3.00:1`) | 341,9 KB | **Test artifact active** | **Lệch tỷ lệ (thiếu trần/sàn), dùng để test (`isEquirectangular2to1: false`)** |
| `public/images/locations/*.jpg` (6 ảnh) | `1280×720` (`1.78:1`) | 167–306 KB | `VERIFIED` (tổng 1,35 MB) | Phù hợp thẻ 16:9 & drawer (Lưu ý: `sports-complex.jpg` & `library-reading.jpg` chưa có mặt trong `INITIAL_MEDIA_ASSETS` — *lệch giữa 6 ảnh thực tế và `med-06..med-08` trong bảng Media Admin!*) |
| `public/images/fpoly-campus-aerial.jpg` | `1024×576` (`1.78:1`) | 509,2 KB | **UNUSED (`0` ref)** | Dư thừa, không được dùng ở bất kỳ trang nào |
| `public/images/fpt-logo-official.png` | `1024×348` (`2.94:1`) | 66,5 KB | `VERIFIED` | Nặng nhẹ hợp lý cho logo PNG |
| Favicons (`favicon.{ico,svg}`, `favicon-32x32.png`, `icon-fpt.png`, `apple-touch-icon.png`) | Đa chuẩn (SVG + PNG + ICO) | ~43 KB tổng | `VERIFIED` | Đầy đủ & đã khai báo trong `layout.tsx:28-36` |
| `docs/stitch-references/*.png` (13 ảnh) | Nhiều kích thước | ~10,2 MB | Design ref (`B5`) | Nặng gấp đôi toàn bộ `apps/web/public` (~3,9 MB) |

---

## 12. Kiểm toán Hỗ trợ Đa tòa nhà, Đa tầng, Bản vẽ mặt bằng (Floor Plan) & Admin Virtual Tour Studio

Đánh giá thực chất khả năng hỗ trợ lộ trình sản phẩm sắp tới (lấy **code thật** làm chuẩn, phân biệt rõ phần mới nằm trên giấy `docs/phase-2a/*` và phần đã có trong code):

| # | Năng lực mục tiêu | Trạng thái trong Code | Bằng chứng cụ thể | Đánh giá sẵn sàng |
|---:|---|---|---|---|
| 1 | **Nhiều tòa nhà trên khuôn viên (GIS)** | **`PARTIAL`** | `CAMPUS_BUILDINGS` (`campus-data.ts:102-251`) gán cứng 5 `BuildingCode` union literal (`INNOVATION | TOA-T | TOA-F | TOA-P | SPORTS`). Không có UI Admin tạo/sửa/xóa tòa nhà hoặc kéo thả pin trên GIS. | Chưa mở rộng động được khi thêm cơ sở/tòa nhà mới |
| 2 | **Nhiều tầng trong mỗi tòa nhà** | **`MISSING`** | `floor` chỉ là chuỗi văn bản tự do (`"Tầng Trệt"`, `"Tầng 1"` trong `CampusLocationItem:314` và `TourSceneItem`). Chưa có thực thể `Floor` (`sortOrder`, `buildingId`, `code`). | Phải bổ sung model `Floor` trước khi làm mặt bằng tầng |
| 3 | **Upload bản vẽ mặt bằng cho từng tầng (PNG/JPG/SVG/PDF)** | **`MISSING`** | `/admin/media` chỉ phân loại `"panorama_2_1"` vs `"photo_2d"` (`admin/media/page.tsx:15,39`). Không có pipeline hay UI upload Floor Plan / render PDF. | Mới có đặc tả ở `docs/phase-2a/`, 0% code |
| 4 | **Đặt vị trí phòng & điểm chụp 360° lên bản vẽ mặt bằng** | **`MISSING`** | Không có bất kỳ canvas 2D đặt pin nào với hệ tọa độ chuẩn hóa `[0..1]`; không có `floorNormX`/`floorNormY` trong `campus-data.ts`. | 0% code UI lẫn schema TS |
| 5 | **Upload nhiều ảnh Panorama 360°** | **`PARTIAL`** (Mock) | `AdminMediaPage` hỗ trợ dropzone multi-file & kiểm tra 2:1 ở client qua `URL.createObjectURL` (`line 23-63`), nhưng biến mất khi reload và không nối backend/storage. | Cần S3/MinIO/R2 presigned upload + job worker |
| 6 | **Tạo và nối Hotspot chuyển cảnh giữa các điểm 360°** | **`PARTIAL`** (Mock) | `AdminVirtualTourPage` cho phép click trực tiếp lên cầu WebGL (`handleSphereClick`, `line 55-84`) để lấy tọa độ `(yaw, pitch)`, đổi nhãn và gắn `targetSceneId`. Rất tốt về UX nguyên mẫu, nhưng lưu `useState` tại chỗ. | UI nguyên mẫu tốt, có thể tái sử dụng component stage |
| 7 | **Đồng bộ 2 chiều: Floor Plan ↔ Tour 360° ↔ GIS Map** | **`MISSING`** | Các màn hình `/admin/locations`, `/admin/virtual-tour`, `/admin/media`, `/campus`, `/map` đọc từ constant tĩnh riêng hoặc `useState` rời rạc; sửa cảnh trong Admin **không phản ánh** sang `/campus` hoặc `/locations`. | Bắt buộc có Backend/Store chung & API graph |
| 8 | **Admin Virtual Tour Studio tích hợp toàn bộ quy trình** | **`PARTIAL`** (Phân mảnh) | Quy trình đang bị xé lẻ qua 3 trang không liên thông (`/admin/locations`, `/admin/media`, `/admin/virtual-tour`) và thiếu bước `Building → Floor → FloorPlan → Place Location/Node → Connect Edges → Validate`. | Cần thiết kế lại thành Studio pipeline theo Phase 2A |
| 9 | **Phiên bản hóa mặt bằng (`floor_plans.version`) & Migration snapshot** | **`MISSING`** | Chỉ có trong tài liệu `PHASE_2A_DATABASE_DESIGN.md:15-16`. | 0% code |
| 10 | **Kiểm tra đồ thị kết nối Tour (Graph Validation: cô lập / ngõ cụt)** | **`MISSING`** | Chỉ có trong tài liệu `PHASE_2A_PANORAMA_WORKFLOW.md:114-122`. Không có hàm kiểm tra BFS/DFS hay cảnh báo hotspot trỏ nhầm id. | 0% code |
| 11 | **Tách bạch 3 hệ tọa độ (`GIS`, `FloorPlan [0..1]`, `Spherical`)** | **`PARTIAL`** | Code hiện tại mới có **2 hệ**: GIS (`lat/lng`, `gisX/gisY`) và Spherical (`yaw, pitch, fov`). Hệ thứ 2 (`FloorPlan 2D [0..1]`) **hoàn toàn vắng mặt**. | Cần bổ sung lớp `FloorPlan [0..1]` vào `@fpt-campus/shared` & DB trước tiên |

---

## 13. Đánh giá mức độ sẵn sàng mở rộng Backend / Database / Auth / Storage

- **Thực trạng hạ tầng hiện tại:**
  - `docker-compose.yml` mới khai báo duy nhất `postgres:16-alpine` (`container_name: fpt_virtual_campus_db`, DB `virtual_campus_360`), **thiếu `redis` (cho BullMQ queue xử lý ảnh panorama/PDF) và thiếu `minio` (S3-compatible dev storage)** so với thiết kế `docs/phase-2a/PHASE_2A_SYSTEM_ARCHITECTURE.md`.
  - `.env.example` đã liệt kê các khóa cho `DATABASE_URL`, `JWT_*`, `S3_*`, `NEXT_PUBLIC_API_URL`, nhưng không có ứng dụng nào đọc chúng (`process_env` hits = **0**).
- **Rào cản cần tháo gỡ trước khi dựng `apps/api` (NestJS + Prisma):**
  1. Thống nhất `packages/shared` theo đúng hợp đồng dữ liệu Phase 2A (`TourNode`, `Floor`, `FloorPlan`, `Location 1–N TourNode`, `Hotspot`, `TourEdge`) và xóa schema cũ.
  2. Chốt quyết định về `/portal` và Open Day QR để schema Prisma (`06-database-audit.md` vs `PHASE_2A_DATABASE_DESIGN.md`) không bị vướng bảng thừa.
  3. Thiết lập cấu trúc monorepo nhất quán (root `package.json` + chọn 1 package manager duy nhất: `pnpm` hoặc `npm` workspaces).

---

## 14. Đề xuất cấu trúc Repository sạch chuẩn mục tiêu

```text
E:\Virtual Campus FPT Poly\
├── .gitignore                          # [BỔ SUNG] Gộp ignore cho root, .env*, dist/, .next/, coverage/, logs
├── .env.example                        # [GIỮ & CHUẨN HÓA] Dùng chung template cho web + api + worker
├── docker-compose.yml                  # [MỞ RỘNG] postgres:16-alpine + redis:7-alpine + minio (dev S3)
├── package.json                        # [BỔ SUNG] Root workspace scripts (dev, build, lint, typecheck, test)
├── pnpm-workspace.yaml                 # [CHỌN 1 LOCKFILE] pnpm-lock.yaml HOẶC chuyển hẳn sang npm workspaces
├── PROJECT_STATUS.md                   # [CẬP NHẬT] Chỉ giữ bảng đối soát sự thật mới nhất
├── README.md                           # [CẬP NHẬT] Khớp Next.js 16, Three.js, Leaflet & Phase 2A
│
├── apps/
│   ├── web/                            # Next.js 16 App Router (Frontend công khai + Admin Studio)
│   │   ├── public/images/{locations,panoramas}/   # Chỉ ảnh chuẩn 2:1 & 16:9 thật (bỏ ảnh test & aerial chết)
│   │   ├── scripts/capture-pages.mjs
│   │   └── src/
│   │       ├── middleware.ts           # [SẼ BỔ SUNG] Route guard bảo vệ /admin/*
│   │       ├── app/                    # 19 routes (+ app/sitemap.ts hoặc sửa robots.txt)
│   │       ├── components/             # UI, tour, map, floor-plan (mới), studio (mới), home, navigation
│   │       ├── data/                   # Tạm chứa seed fallback cho tới khi nối GET /api/v1/* (gộp news-items.ts vào đây)
│   │       └── lib/                    # API client, utils, auth session client (bỏ hardcoded password)
│   └── api/                            # [PHASE 2A] NestJS Modular Monolith + BullMQ media worker
│
├── packages/
│   └── shared/                         # [TÁI CẤU TRÚC] Single Source of Truth DTO/Zod/Types cho Web + API
│
├── prisma/                             # [PHASE 2A] schema.prisma + migrations/ + seed.ts (1 admin + QTSC graph)
│
└── docs/
    ├── phase-2a/                       # [CHUẨN HIỆN HÀNH] Kiến trúc, DB ERD, API Contract, Panorama & FloorPlan Workflow
    ├── ui/                             # [HỢP NHẤT] Chỉ giữ 1 Design System + 1 Blueprint + 1 Route Spec
    ├── project-audit/                  # Giữ báo cáo kiểm toán mới nhất làm điểm mốc
    └── _archive/                       # [DI DỜI] Gói tài liệu Stitch đời 1, ui-roadmap đời cũ, audit 01..14 cũ
```

---

## 15. Kết quả chạy Build / Lint / Typecheck / Test thực tế

Toàn bộ lệnh dưới đây được thực thi trực tiếp trong phiên kiểm toán ngày 11/11/2026:

| Hạng mục kiểm tra | Lệnh thực thi | Kết quả / Exit Code | Chi tiết quan sát được |
|---|---|---|---|
| **TypeScript (`packages/shared`)** | `npx tsc -p "packages\shared\tsconfig.json" --noEmit` | **PASS (`0`)** | Không có lỗi cú pháp TS *(nhưng 0 file nào import package này)* |
| **TypeScript (`apps/web`)** | `npx tsc -p "apps\web\tsconfig.json" --noEmit` | **PASS (`0`)** | 0 lỗi type trên toàn bộ 84 tệp `src/` |
| **ESLint (`apps/web`)** | `npm --prefix "apps\web" run lint` | **PASS (`0`)** | 0 error *(lưu ý `eslint.config.mjs` tắt 3 rule: `no-html-link-for-pages`, `no-img-element`, `no-page-custom-font`)* |
| **Production Build (`apps/web`)** | `npm --prefix "apps\web" run build` | **PASS (`0`)** | Next.js 16.4.6 (Turbopack) compile `2.5s`, TS `1.66s`, xuất **28** trang tĩnh/SSG (`14` Static routes + `1` `_not-found` + `6` location slugs + `3` news slugs + metadata) và `3` Dynamic routes (`/campus`, `/locations`, `/map`) |
| **HTTP Route Probe (`localhost:3000`)** | `Invoke-WebRequest` tới 25 URL | **19/19 routes `200`** | Toàn bộ 19 route chính + `/locations/lab-lap-trinh-t301`, `/locations/sanh-innovation`, `/news/huong-dan-tham-quan-qtsc-360`, `/robots.txt`, `/manifest.json`, `/favicon.ico`, `/favicon.svg` đều `HTTP 200`; `/khong-ton-tai-404` trả `404`; **`/sitemap.xml` trả `404`** |
| **Dependency Security Audit** | `npm --prefix "apps\web" audit --json` | **EXIT `1` (`8 moderate`)** | 0 critical, 0 high, 0 low; 8 moderate thuộc devDeps (`eslint-config-next` → `typescript-eslint` → `minimatch`) |
| **Unit / Integration / E2E Test** | Kiểm tra `apps/web/package.json` & workspace | **`MISSING` (`0` tests)** | Không có script `test`, không có Vitest/Jest/Playwright test suite |
| **Git Status & History** | `git status` & `git log` | **`MISSING` (exit `128`)** | `fatal: not a git repository` |
| **Docker / PostgreSQL Runtime** | Kiểm tra thực tế kết nối DB | **Chưa kết nối (`UNVERIFIED` / `0%`)** | Chưa có driver DB, migration hoặc `.env` trong ứng dụng |

---

## 16. Backlog dọn dẹp & chỉnh sửa ưu tiên (P0 / P1 / P2 / P3)

### Nhóm P0 — Khẩn cấp (Bảo mật, Khởi tạo phiên bản, Đồng bộ định hướng MVP)
| ID | Hạng mục & Vị trí | Lý do | Hành động đề xuất | Rủi ro & Kiểm chứng | Ước lượng | Cần duyệt? |
|---|---|---|---|---|---|---|
| **P0-1** | **Khởi tạo Git + root `.gitignore`** (`E:\Virtual Campus FPT Poly\`) | Hiện không có version control, dễ mất code khi dọn dẹp/refactor lớn | `git init`, tạo root `.gitignore` chặn `.env*`, `node_modules`, `.next`, `dist`, `tsconfig.tsbuildinfo`, commit baseline trước mọi cleanup | Rủi ro rất thấp; Verify: `git status` sạch | 0.5h | **Có** |
| **P0-2** | **Gỡ mật khẩu Admin cứng khỏi Client & khóa tạm `/admin/*`** (`src/lib/prototype-auth.ts:13-38`, `src/app/admin/layout.tsx`, `src/middleware.ts`) | Hiện `/admin/*` mở công khai (`HTTP 200`, 0 guard) và mật khẩu `Fpoly@2026` lộ trong JS client | Chặn `/admin/*` nếu chưa có phiên hợp lệ (tối thiểu Route Guard + Auth server-side cookie / env-backed API route tạm, sau đó thay bằng NestJS JWT ở Phase 2A) | Tránh tự khóa Admin UI khi dev; Verify: truy cập `/admin` khi chưa login bị redirect `/login` | 2–4h | **Có** |
| **P0-3** | **Xử lý triệt để tàn dư `/portal` & thông điệp Open Day QR** (`OpenDayBanner.tsx`, `about/page.tsx`, `events/page.tsx`, `EventPillarGrid.tsx`, `news-items.ts`, `QuizLeaderboard.tsx`, `StateFeedback.tsx:174`, `portal/page.tsx:66`, `campus-data.ts:822,874,913,919`, `admin/events` tab Check-in, `admin/users`) | Gây hiểu nhầm nghiêm trọng cho người dùng thật (kêu gọi dùng tài khoản Open Day lấy mã QR trong khi `/login` chỉ dành cho Admin) | Viết lại toàn bộ copy public thành **tham quan & xem lịch công khai không cần tài khoản**; gán `AuthGateState` mặc định về `/login` (Admin) hoặc vô hiệu/ẩn nội dung mời tài khoản ở `/events` & `/portal` (giữ nguyên route `/portal` nếu chưa cho xóa) | Cần duyệt đúng câu chữ & số phận nội bộ `/portal` và `/admin/users` (chỉ quản lý tài khoản quản trị hay giữ bảng CTV/khách); Verify: grep `next=/portal` = `0` | 2–3h | **Có** |

### Nhóm P1 — Cao (Dọn dữ liệu test, Sửa lỗi cấu hình, Hợp nhất Workspace)
| ID | Hạng mục & Vị trí | Lý do | Hành động đề xuất | Rủi ro & Kiểm chứng | Ước lượng | Cần duyệt? |
|---|---|---|---|---|---|---|
| **P1-1** | **Gỡ 2 cảnh & ảnh test (`tang-1.jpg`, `tang-2.jpg`) khỏi dữ liệu public** (`campus-data.ts:529-535, 714-799, 1066-1085`, `public/images/panoramas/tang-{1,2}.jpg`) | Làm lộ chuỗi `"(Test)"`, metric debug `"~30 MAE"` trên Tour 360° public và sai số đếm `AdminDashboardMetrics` | Gỡ khỏi mảng `TOUR_SCENES` & `INITIAL_MEDIA_ASSETS` (chuyển ảnh test vào thư mục sample ngoài `public/` nếu còn dùng kiểm thử) | Kiểm tra mọi hotspot trỏ tới `tang-1`/`tang-2` được gỡ sạch; Verify: `npm run build` + test `/campus` | 0.5h | **Có** |
| **P1-2** | **Sửa cấu hình `next.config.ts`, `manifest.json`, `robots.txt` & xóa ảnh/package chết** (`next.config.ts`, `manifest.json:4`, `robots.txt:6`, `public/images/fpoly-campus-aerial.jpg`, `lucide-react` trong `package.json`) | Chứa remote domain cũ, mô tả `"bản đồ 3D"`, trỏ `/sitemap.xml` 404, 509 KB ảnh mồ côi & 1 dependency chết | Bỏ `remotePatterns` thừa hoặc chỉ giữ khi cần; cập nhật mô tả `manifest.json` sang 360° & GIS; thêm `app/sitemap.ts` (hoặc gỡ dòng `Sitemap` trong `robots.txt`); xóa `fpoly-campus-aerial.jpg` & `npm uninstall lucide-react` | Thấp; Verify: `/sitemap.xml` HTTP 200, `next build` & `eslint` PASS | 1.5h | **Có** |
| **P1-3** | **Chuẩn hóa Package Manager & Root Workspace** (`pnpm-workspace.yaml`, thiếu root `package.json`, `apps/web/package-lock.json`, `packages/shared/dist/`) | Khai báo `pnpm` nhưng chạy `npm`, thiếu script root, còn thư mục compiled `packages/shared/dist/` | Chốt dùng **pnpm** (tạo root `package.json` + `pnpm-lock.yaml`, xóa `package-lock.json`) hoặc **npm workspaces** (xóa `pnpm-workspace.yaml`, tạo root `package.json`); xóa `packages/shared/dist/` khỏi repo | Cẩn thận đồng bộ version lock; Verify: install & build từ thư mục gốc | 1.5h | **Có** |
| **P1-4** | **Đồng bộ lại `packages/shared` theo chuẩn Phase 2A & nối vào `apps/web`** (`packages/shared/src/index.ts`, `apps/web/tsconfig.json`, `apps/web/package.json`) | Hiện `packages/shared` không có bất kỳ consumer nào và xung đột 100% với `campus-data.ts` lẫn `docs/phase-2a` | Cập nhật `packages/shared` thành contract chuẩn `Campus`, `Building`, `Floor`, `FloorPlan`, `Location`, `TourNode` (1–N), `Hotspot`, `TourEdge`, `MediaAsset` | Đảm bảo Typecheck 2 chiều giữa `web` & `api` sắp tới; Verify: `tsc --noEmit` ở cả 2 package | 3–4h | **Có** |

### Nhóm P2 — Trung bình (Tái cấu trúc Frontend, Tài liệu & Chuẩn bị Studio)
| ID | Hạng mục & Vị trí | Lý do | Hành động đề xuất | Rủi ro & Kiểm chứng | Ước lượng | Cần duyệt? |
|---|---|---|---|---|---|---|
| **P2-1** | **Dọn & hợp nhất `docs/` + cập nhật `PROJECT_STATUS.md`, `README.md`** | 35 file `.md` trùng chéo 4 thế hệ gây hiểu nhầm tiến độ và kiến trúc (`tour_scenes` vs `tour_nodes`) | Archive `docs/*.md` cũ, `docs/project-audit/01..14` và các file `docs/ui-roadmap` bản nháp 12:23 vào `docs/_archive/`; cập nhật `PROJECT_STATUS.md` & `README.md` theo thực tế | Không mất lịch sử; Verify: chỉ còn 1 bộ nguồn chuẩn (`phase-2a` + `ui`) | 2h | **Có** |
| **P2-2** | **Dọn CSS chết & bỏ `first_login` dead UI branch / `news-items.ts` misplaced** (`globals.css`, `components/news/news-items.ts`, `CampusGISMap.tsx`, `lib/utils.ts`) | `.home-reveal*`, `.shadow-cta-glow`, `.glass-hud`, `.ui-dropdown-menu`, `.ui-state-success`, `.animate-fade-in` không được dùng; data tin tức nằm trong folder component | Dọn các rule CSS 0 hit; chuyển `news-items.ts` sang `src/data/`; tách nút CTA GIS lặp thành subcomponent; kiểm tra giữ/gỡ `CardHeader..` & `formatDate/Number` | Thấp; Verify: `next build` + kiểm tra giao diện bằng `scripts/capture-pages.mjs` | 2h | Nên duyệt |
| **P2-3** | **Thay pixel `min-h` cứng bằng layout skeleton / flex ổn định** (`LocationsExplorer.tsx:81`, `OpenDayScheduleTimeline.tsx:58`) | Giá trị `min-h-[846px]` và `min-h-[1190px]` bị gắn chặt vào số lượng card tĩnh hiện tại | Giữ footer ổn định bằng flex/min-height tương đối ở cấp trang hoặc kết hợp trạng thái lọc gọn khi danh sách thay đổi từ DB | Kiểm thử visual regression với 1 item / 0 item / 20 items | 1.5h | Không bắt buộc |

### Nhóm P3 — Lộ trình Phase 2A (Xây dựng Hệ thống Thật: Backend, DB, Storage & Multi-Floor Studio)
| ID | Hạng mục & Vị trí | Lý do | Hành động đề xuất | Ước lượng | Cần duyệt? |
|---|---|---|---|---|---|
| **P3-1** | **Khởi tạo `prisma/schema.prisma`, Docker đầy đủ (Postgres + Redis + MinIO) & `apps/api` (NestJS)** | Toàn bộ tầng lưu trữ, auth RBAC, upload ảnh, graph validation hiện bằng `0%` | Triển khai theo `docs/phase-2a/PHASE_2A_DATABASE_DESIGN.md` & `PHASE_2A_API_CONTRACT.md` | 1–2 tuần | **Có** |
| **P3-2** | **Nâng cấp Admin Studio hỗ trợ `Building → Floor → FloorPlan Upload & Pinning [0..1] → TourNode (1–N) → Hotspot/TourEdge` + Graph Validator** | Đáp ứng đầy đủ 11 yêu cầu đa tòa nhà / đa tầng / bản vẽ mặt bằng & đồng bộ 2 chiều GIS ↔ FloorPlan ↔ 360° | Xây dựng UI upload mặt bằng + Canvas ghim tọa độ `[0..1]` + BFS Graph Validator + mini-map Floor Plan trên `/campus` | 1.5–2 tuần | **Có** |
| **P3-3** | **Thiết lập Test Suite (Vitest/Jest + Playwright) & Security Headers** | Hiện `0` unit/integration/E2E test | Bổ sung unit test Graph Validator / Auth Guard, API integration test & E2E smoke test 19 routes | 3–5 ngày | **Có** |

---

## 17. Các quyết định cần Chủ dự án xác nhận trước khi thực hiện Cleanup & Phase tiếp theo

1. **Xử lý triệt để phần `/portal` và copy Open Day QR:**
   - Trong khi vẫn **giữ route `/portal`** ở mã nguồn theo quyết định tạm thời, Chủ dự án đồng ý **gỡ toàn bộ văn bản hướng dẫn đăng nhập Open Day QR / mật khẩu tạm Zalo** ở Trang chủ (`OpenDayBanner.tsx`), `/events`, `/about`, `/news`, `/games` (`QuizLeaderboard.tsx`), `/locations`, `StateFeedback.tsx` và **vô hiệu/chuyển hướng nút hành động trên `/portal`**, đồng thời cập nhật `/admin/events` & `/admin/users` thành công cụ quản trị lịch & tài khoản nhân sự quản trị?
2. **Dọn ngay tài sản rác & dữ liệu test (`P1-1`, `P1-2`):**
   - Đồng ý xóa 2 scene/ảnh test `tang-1.jpg` & `tang-2.jpg` khỏi `TOUR_SCENES` public, xóa `public/images/fpoly-campus-aerial.jpg`, gỡ dependency `lucide-react`, dọn `remotePatterns` trong `next.config.ts` và CSS dư trong `globals.css`?
3. **Chuẩn hóa Git & Package Manager (`P0-1`, `P1-3`):**
   - Đồng ý `git init` + tạo root `.gitignore` ngay làm mốc an toàn, và chọn **`pnpm`** (theo `pnpm-workspace.yaml` sẵn có) hay **`npm workspaces`** (theo `apps/web/package-lock.json` sẵn có)?
4. **Hợp nhất kho tài liệu `docs/` (`P2-1`):**
   - Đồng ý chuyển toàn bộ tài liệu đời cũ (`docs/*.md`, `docs/project-audit/01..14`, các bản nháp cũ trong `docs/ui-roadmap/`) vào thư mục `docs/_archive/` để tránh AI/Dev sau này đọc nhầm `tour_scenes` hoặc chỉ số 14 route cũ?
5. **Thứ tự ưu tiên kỹ thuật ngay sau Cleanup (`P0-2` → `P3`):**
   - Đồng ý khóa bảo mật tạm cho `/admin/*` trước, sau đó triển khai **Phase 2A** theo thứ tự: `packages/shared` chuẩn Phase 2A → `PostgreSQL + Prisma + NestJS Auth/Campus/FloorPlan/TourNode API` → `Admin Virtual Tour & Floor Plan Studio`?
