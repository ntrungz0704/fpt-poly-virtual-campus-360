# 02. TRẠNG THÁI DỰ ÁN HIỆN TẠI (CURRENT PROJECT STATUS)

Báo cáo tổng hợp trạng thái từng mảng kỹ thuật, mô-đun Frontend và Backend dựa trên thang phân loại bắt buộc `S0`–`S6`.

---

## 1. Thang Phân Loại Áp Dụng

| Mã | Tên gọi | Định nghĩa kiểm toán |
|---|---|---|
| **S0** | `NOT STARTED` | Chưa có bất kỳ mã nguồn hay triển khai thực tế nào. |
| **S1** | `PLANNED` | Đã có mô tả yêu cầu, định hướng kiến trúc hoặc cấu hình khung (`.env.example`, `docker-compose.yml`), chưa code. |
| **S2** | `DESIGNED` | Đã có bản thiết kế Stitch (`docs/stitch-references/*.png`), tài liệu `docs/*.md`, hoặc UI tĩnh làm vỏ bọc nhưng chưa có logic/tương tác thật. |
| **S3** | `PARTIALLY IMPLEMENTED` | Đã có mã nguồn chạy một phần ở client, nhưng thiếu backend/DB, thiếu trạng thái đầy đủ, hoặc còn bug chức năng cốt lõi. |
| **S4** | `IMPLEMENTED` | Chức năng hoàn chỉnh đầu-cuối (FE ↔ BE ↔ DB), chỉ còn bước viết/chạy test tích hợp. |
| **S5** | `TESTED` | Đã vượt qua bộ kiểm thử tự động liên quan (Unit/Integration/E2E) trên bản chạy gần nhất. |
| **S6** | `PRODUCTION READY` | Đã test, bảo mật, giám sát, sao lưu, tối ưu và sẵn sàng vận hành thực tế. |

---

## 2. Bảng Trạng Thái 13 Mảng Trọng Tâm (Section 19B)

| Mảng (Area) | Trạng thái | Bằng chứng xác thực (Evidence) | Phần việc còn thiếu (Missing Work) | Độ ưu tiên |
|---|---|---|---|---|
| **UI/UX** | **S3** *(~60% so với Stitch)* | Có `@theme` tokens trong `apps/web/src/app/globals.css:3-68`, 13 ảnh `docs/stitch-references/*.png`, responsive lưới Tailwind. Tuy nhiên `desktop/` & `mobile/` đã mất; nhiều màn thiếu chi tiết Stitch (`page_06`, `page_07`, `page_09`, `page_10`); mobile drawer & overlap HUD ở `/map` và `/campus` chưa triệt để; `globals.css:114-115` bị cắt cụt. | Khôi phục `globals.css`; đồng bộ mobile bottom sheet/drawer; bổ sung đủ các section bị cắt ở Detail/News/Open Day; xóa chữ giả mạo chứng nhận & thông số sai lệch giữa các trang. | **P0** |
| **Frontend** | **S3** | 14 `page.tsx`, 6 `layout.tsx`, 32 component `.tsx` (`9.044` LOC). `tsc --noEmit` đạt `exit 0`. Tuy nhiên `next build` GÃY do `globals.css`; `eslint` lỗi 2 điểm; `0` lần gọi `fetch()`; 100% state tạm; bug slug/query filter; `<a href>` & `<img src>` chưa tối ưu; `packages/shared` chưa import. | Sửa build + lint; sửa link `?scene=` & filter `?building=`; cài React Query/Zod/RHF; kết nối REST API; thêm `loading.tsx`/`error.tsx`/`not-found.tsx`; nối `@fpt-campus/shared`. | **P0** |
| **Backend** | **S0** | Thư mục `apps/api` **không tồn tại**. `pnpm-workspace.yaml` khai báo `apps/*` nhưng chỉ có `apps/web`. 0/23 module NestJS. | Khởi tạo NestJS monolith trong `apps/api`; cấu hình Swagger, ValidationPipe, Global Exception Filter, PrismaService và 23 module nghiệp vụ. | **P0** |
| **Database** | **S0** | Chỉ có `docker-compose.yml` (`postgres:16-alpine`) và `.env.example` (`DATABASE_URL`). Không có `prisma/schema.prisma`, không migration, không seed, Docker không chạy. | Thiết kế `prisma/schema.prisma` (20+ bảng), tạo migration đầu tiên, viết seed dữ liệu Q.12 (tòa nhà, phòng học, scene, tin, sự kiện, user test), thiết lập backup. | **P0** |
| **Authentication** | **S2 (UI) / S0 (Logic)** | `apps/web/src/app/(auth)/login/page.tsx` chỉ chạy `setTimeout(..., 600)` và `router.push("/portal")` cho mọi input không rỗng (mặc định điền sẵn `PS24180`/`polytechnic2025`). Không cookie/token/guard ở `/portal` và `/admin`. | Cài đặt `AuthModule` + JWT Access/Refresh (HttpOnly Cookie), `bcrypt`/`argon2`, Next.js Middleware + NestJS `JwtAuthGuard`/`RolesGuard`, import CSV/Excel, forced password change lần đầu. | **P0** |
| **Virtual Campus 360** | **S3** | `Hero360Viewer.tsx` (567L), `VirtualTourViewer.tsx` (480L) dùng Three.js `SphereGeometry` + `OrbitControls`/kéo tay. `campus/page.tsx` chỉ có 3 scene lấy ảnh `lh3.googleusercontent.com` (tỉ lệ 16:9 không phải 2:1 equirectangular). | Thay ảnh panorama equirectangular 2:1 thật (tối thiểu 4K/tile); tích hợp Marzipano hoặc sửa Three.js sphere tránh tạo lại WebGLRenderer & sửa `setState` mỗi frame; đồng bộ database hotspots + `?scene=` đúng ID. | **P1** |
| **3D Campus** | **S3** | `Campus3DViewer.tsx` (1.244L) dựng hình học lập trình (`BoxGeometry`, `CylinderGeometry`) cho Tòa T, F, P, Innovation, cổng, khu thể thao + Walk Mode (`WASD` + D-pad). Không dùng R3F/Drei; `public/models/` rỗng; lỗi `KeyE` stale closure & `eslint prefer-const`. | Chuẩn hóa kích thước/vị trí thực tế QTSC; chuyển sang React Three Fiber + Drei (hoặc tối ưu Three.js pipeline); hỗ trợ load `.glb/.gltf` + DRACO/KTX2; bổ sung collider cây/cổng; sửa lỗi hook `useEffect`. | **P1** |
| **GIS** | **S2** | `CampusGISMap.tsx` (321L) chỉ là một sơ đồ `<svg viewBox="0 0 1000 650">` vẽ tĩnh với zoom/pan bằng CSS `transform: scale()`. Thanh pill đáy (`bottom-6` L303) đè lên chip của `map/page.tsx`. Không có tọa độ GPS lat/lng thật dù `packages/shared` có định nghĩa. | Quyết định rõ: dùng Leaflet/Mapbox GIS thật theo tọa độ QTSC (`10.852...`, `106.628...`) hoặc giữ sơ đồ Vector có tọa độ chuẩn + sửa trùng HUD; tách tầng dữ liệu POI/Buildings từ API. | **P2** |
| **Open Day** | **S3 (UI) / S0 (Nghiệp vụ)** | `events/page.tsx`, `EventPillarGrid.tsx`, `OpenDayScheduleTimeline.tsx`, `TicketRegistrationModal.tsx` đã có UI. Nhưng mở tự do không phân biệt vé thí sinh/khách với hoạt động nội bộ yêu cầu đăng nhập; mã vé cứng `POLY-VIP-2025-9821`; `DigitalPassCard.tsx` chỉ `alert()`. | Nối `EventsModule` + `RegistrationsModule`; sinh mã QR check-in duy nhất theo bản ghi DB; gửi email/SMS xác nhận; cho phép quản lý slot workshop, điểm danh & phân quyền tài khoản trường cấp. | **P1** |
| **Gamification** | **S3 (UI) / S0 (Anti-cheat)** | `games/page.tsx` (5 câu quiz + `CampusQuizStepper.tsx` + `QuizLeaderboard.tsx` hardcode 5 người) và `OpenDayMiniGame.tsx` (562L, Canvas wheel + 3 câu quiz). Toàn bộ điểm XP, phần thưởng (`Math.random()`) nằm ở client state, bấm reset chơi lại vô hạn. | Tạo `GamesModule`, `QuizzesModule`, `LeaderboardModule`; chuyển chấm điểm & tính XP/quay thưởng về server; giới hạn lượt chơi theo session/user; sửa lỗi đáp án mâu thuẫn (P. Trung Mỹ Tây vs P. Tân Chánh Hiệp) & warning `isCorrect`. | **P1** |
| **Admin CMS** | **S2** | `admin/layout.tsx` & `admin/page.tsx` hiển thị giao diện tổng quan + số liệu tĩnh (`142.850`, `68.420`...). 11/12 route sidebar (`/admin/locations`, `/admin/tours-360`, `/admin/models-3d`, `/admin/media`...) chưa tồn tại (404). Nút `"Đồng Bộ Dữ Liệu"` vô tác dụng. | Xây dựng đầy đủ CMS subroutes kết nối API; RBAC guard; pipeline Upload → Validate → Process → Preview → Publish cho Panorama 360° & `.glb`; module import CSV/Excel user; Audit Logs. | **P1** |
| **Deployment** | **S1** | Có `docker-compose.yml` (chỉ có Postgres local) và `.env.example` (`S3_*`, `JWT_*`, `DATABASE_URL`). Không có `.env`, không có `Dockerfile`, không có CI/CD, không có script CDN/Object Storage, Docker chưa chạy. | Sửa build `apps/web`; tạo `Dockerfile` multi-stage cho Web & API; cấu hình Cloudflare R2/S3 + CDN thật thay thế 23 link `lh3.googleusercontent.com`; thiết lập CI/CD GitHub Actions, HTTPS, backup DB & Sentry/healthcheck. | **P1** |
| **Testing** | **S0** | `0` unit tests, `0` integration tests, `0` E2E tests. Không có Vitest, Jest hay Playwright trong `package.json`. Hai script `capture-pages.mjs` và `test-height.mjs` nằm lẫn ở root `apps/web`, trong đó `test-height.mjs` bị lỗi cú pháp ESLint. | Xóa `test-height.mjs` / dời `capture-pages.mjs` vào `scripts/`; thiết lập Vitest + React Testing Library (FE), Jest + Supertest (NestJS API), Playwright (E2E desktop + mobile). | **P1** |

---

## 3. Hiện Trạng Kiểm Kê Workspace & Tài Nguyên Thực Tế

1. **Tổng quan thư mục gốc (`E:\Virtual Campus FPT Poly`):**
   - `apps/web/`: Ứng dụng Next.js (`16.4.6`) + React (`19.3.0`) + TypeScript (`^5`) + Tailwind (`4.3.3`) + Three (`^0.187.0`) + Lucide (`^1.71.0`) + Puppeteer devDep (`^25.17.0`).
   - `apps/api/`: **KHÔNG TỒN TẠI.**
   - `packages/shared/`: Chỉ có `package.json` (`@fpt-campus/shared`), `tsconfig.json`, `src/index.ts` (183 dòng type/interface — **0 lần import** trong `apps/web`).
   - `docs/`: 7 file `.md` + 13 file `.png` trong `docs/stitch-references/`.
   - `desktop/` & `mobile/`: **KHÔNG TỒN TẠI** trong thư mục dự án hiện tại (khác với mô tả trong `README.md` và `docs/design-audit.md`).
   - Git repository: Chưa khởi tạo `.git` trong workspace hoặc chưa có lịch sử commit (cần lưu ý quản trị phiên bản trước khi bắt đầu Giai đoạn 2).
2. **Thống kê mã nguồn `apps/web/src/`:**
   - Tổng cộng **63 files / 9.044 dòng mã nguồn** gồm: `14` trang (`page.tsx`), `6` layout (`layout.tsx`), `32` component `.tsx`, `9` file barrel `index.ts`, `1` helper `lib/utils.ts` (18L), `1` stylesheet `globals.css` (115L).
   - **Lệnh kiểm tra chạy thực tế lúc kiểm toán:**
     - `tsc -p packages/shared/tsconfig.json --noEmit`: **PASS** (`EXIT_SHARED=0`).
     - `tsc -p apps/web/tsconfig.json --noEmit`: **PASS** (`EXIT_WEB_TSC=0`).
     - `npm run lint` (`apps/web`): **FAIL** (`exit 1` — 2 errors, 3 warnings).
     - `npm run build` (`apps/web`): **FAIL** (`CssSyntaxError` tại `src/app/globals.css:114-115`).

---

## 4. Trạng Thái Từng Mô-Đun (Section 19D: Frontend & Backend Modules)

### A. Các Nhóm Mô-đun Frontend (`apps/web/src/components/*` & App Routes)

| Nhóm Module / Thư mục | Tệp thực tế | Trạng thái | Nhận xét kỹ thuật chi tiết |
|---|---|---|---|
| **Layout & Navigation** | `PublicHeader.tsx` (211L), `PublicFooter.tsx` (170L), `CampusSelectorModal.tsx` (131L), `6` `layout.tsx` | **S3** | Header dính (fixed) chạy được desktop/mobile nhưng thiếu link `/about`, nút "5 cơ sở" mở ra không có modal (`CampusSelectorModal.tsx` không được import ở bất cứ đâu). `(auth)` và `(portal)` dùng raw `<a>` thay `<Link>`. Footer có link tới `/admin`. |
| **Home Sections** | `Hero360Viewer.tsx` (567L), `CampusMetricsBar.tsx` (68L), `FeaturedFacilities.tsx` (187L), `OpenDayBanner.tsx` (65L), `VirtualTourShowcase.tsx` (87L), `QuickAdmissionForm.tsx` (193L) | **S3** | Hình thức khá đầy đủ, nhưng: `Hero360Viewer` setState mỗi frame WebGL + link `?scene=campus` chết; `FeaturedFacilities` có 4 link `?scene=` chết; `VirtualTourShowcase` gắn badge sai sự thật (`"Marzipano"`, `"Leaflet GIS"`); `QuickAdmissionForm` không gửi API & không validate số điện thoại VN. |
| **Virtual Tour 360°** | `VirtualTourViewer.tsx` (480L), `TourCompassHUD.tsx` (105L), `TourHotspotMarker.tsx` (64L), `TourInfoDrawer.tsx` (99L), `TourSceneSelector.tsx` (92L) | **S3** | Mới phục vụ được 3 scene tĩnh ở `campus/page.tsx`. `TourHotspotMarker.tsx` là dead code. `VirtualTourViewer.tsx` bị memory leak + rebuild renderer mỗi lần đổi scene (`useEffect` phụ thuộc `[currentScene, handleZoom]`) + `setState` mỗi frame. |
| **3D Campus & GIS Map** | `Campus3DViewer.tsx` (1.244L), `CampusGISMap.tsx` (321L), `BuildingDetailDrawer.tsx` (115L) | **S3 / S2** | `Campus3DViewer` có Orbit + Walk + Jump + Drawer hoạt động nhưng là khối BoxGeometry, thiếu collider cây/cổng, lỗi ESLint `prefer-const` & stale closure `KeyE`, `teleportTo` unused. `CampusGISMap` chỉ là SVG tĩnh (S2) bị đè thanh điều khiển phía dưới bởi `map/page.tsx`. |
| **Locations & Rooms** | `(public)/locations/page.tsx` (228L), `[slug]/page.tsx` (152L), `LocationCard.tsx` (112L), `LocationFilterBar.tsx` (81L) | **S3 / S2** | Trang danh mục lọc được theo mảng cứng 8 phòng nhưng có **bug lọc Tòa F → Tòa T** (`locations/page.tsx:111-112`). Trang chi tiết `[slug]` hoàn toàn là mẫu tĩnh 1 nội dung duy nhất bỏ qua giá trị `slug` (S2). |
| **Events & Open Day** | `(public)/events/page.tsx` (87L), `EventPillarGrid.tsx` (65L), `OpenDayScheduleTimeline.tsx` (122L), `TicketRegistrationModal.tsx` (166L) | **S3** | UI xem lịch trình và mở modal đăng ký chạy được, nhưng không kết nối API, không lưu vé, mã vé cố định `POLY-VIP-2025-9821`, không phân quyền tài khoản nội bộ hay chọn workshop theo Stitch. |
| **Gamification & Quiz** | `OpenDayMiniGame.tsx` (562L), `(public)/games/page.tsx` (161L), `CampusQuizStepper.tsx` (208L), `QuizLeaderboard.tsx` (63L) | **S3** | Trải nghiệm chơi thử UI khá mượt (Canvas wheel + 3Q mini-game + 5Q stepper), nhưng 0 bảo vệ chống gian lận, reset vô hạn, `Leaderboard` hardcode, sai nhất quán địa chỉ phường (`Trung Mỹ Tây` vs `Tân Chánh Hiệp`). |
| **News & Articles** | `(public)/news/page.tsx` (100L), `[slug]/page.tsx` (144L), `FeaturedArticleCard.tsx` (87L), `NewsArticleGrid.tsx` (99L) | **S3 / S2** | Trang `/news` lọc category tĩnh trên 3+1 bài (thiếu search, phân trang, newsletter như Stitch). Trang `/news/[slug]` bỏ qua `slug`, luôn hiện bài `"Open Day 2025"` + nút sao chép link chỉ gọi `alert()`. |
| **Contact & Admissions** | `(public)/contact/page.tsx` (345L) | **S3** | Có thông tin Q.12, bus 55/24/48, 5 FAQ accordion chạy client. Form liên hệ chỉ bật `isSent = true`, không gửi đi đâu. |
| **Authentication UI** | `(auth)/layout.tsx` (48L), `(auth)/login/page.tsx` (235L) | **S2** | Form đăng nhập 100% giả lập; tự điền sẵn thông tin demo; chưa có luồng đổi mật khẩu lần đầu hay quên mật khẩu. |
| **Student & Parent Portal** | `(portal)/layout.tsx` (71L), `(portal)/portal/page.tsx` (152L), `StudentProfileHeader.tsx` (61L), `DigitalPassCard.tsx` (74L), `PersonalItineraryTimeline.tsx` (82L) | **S2** | Dữ liệu cố định cho một người dùng `"Nguyễn Hoàng Nam"` / phụ huynh `"Nguyễn Văn An"`; nút tải vé gọi `alert()`; không kiểm tra phiên đăng nhập; không có mục xem chi tiết/đổi mật khẩu như đề bài/Stitch. |
| **Admin CMS** | `admin/layout.tsx` (134L), `admin/page.tsx` (126L), `AdminDashboardMetrics.tsx` (68L), `AdminRecentActivityLog.tsx` (66L) | **S2** | Dashboard tổng quan chỉ là bảng số liệu tĩnh; 11 route con trong sidebar trả 404; không bảo vệ phân quyền; không quản lý nội dung hay upload file. |

### B. Các Mô-đun Backend (`apps/api` — NestJS)

Toàn bộ **23/23 mô-đun backend** theo danh sách kiểm toán (`AuthModule`, `UsersModule`, `RolesModule`, `PermissionsModule`, `AccountImportModule`, `CampusModule`, `BuildingsModule`, `FloorsModule`, `LocationsModule`, `VirtualTourModule`, `PanoramaModule`, `ThreeDModule`, `EventsModule`, `RegistrationsModule`, `GamesModule`, `QuizzesModule`, `LeaderboardModule`, `MediaModule`, `CMSModule`, `ContactModule`, `NotificationsModule`, `AnalyticsModule`, `AuditLogsModule`) đều đang ở trạng thái **`S0 – NOT STARTED`** (chưa có thư mục `apps/api`, chưa có controller, service, DTO, entity hay guard nào). Chi tiết đầy đủ tại [05-backend-audit.md](./05-backend-audit.md).
