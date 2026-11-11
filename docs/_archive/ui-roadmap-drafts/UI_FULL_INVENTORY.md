# UI_FULL_INVENTORY — FPT Polytechnic Virtual Campus 360°

> **Trạng thái tài liệu:** Bản kiểm kê toàn diện phục vụ Phê duyệt Thiết kế lại UI/UX (Chưa chỉnh sửa mã nguồn ứng dụng).  
> **Cơ sở tham chiếu:** `apps/web/src/`, `packages/shared/src/`, `apps/web/public/`, `docs/stitch-references/`, kiểm tra trực tiếp trên `localhost:3000` (UI-01 baseline).  
> **Phạm vi sản phẩm:** Cơ sở TP.HCM — Công viên Phần mềm Quang Trung (QTSC), Lô 24, Quận 12.

---

## 1. Bảng Tổng Hợp Chỉ Số Hệ Thống (Exact Verified Metrics)

Tách biệt tuyệt đối giữa số lượng route đang tồn tại trên ổ đĩa, route đề xuất mới, và màn hình UI phân biệt (không đếm trùng `/admin`).

| Hạng mục | Số lượng thực tế | Chi tiết đối soát |
|---|---:|---|
| **App Router `page.tsx` đang tồn tại trên ổ đĩa** | **14** | 9 `(public)` + 2 `(immersive)` + 1 `(auth)` + 1 `(portal)` + 1 `admin` |
| — Route tĩnh hiện có | **12** | `/`, `/about`, `/contact`, `/events`, `/games`, `/locations`, `/news`, `/campus`, `/map`, `/login`, `/portal`, `/admin` |
| — Dynamic route templates hiện có | **2** | `/locations/[slug]`, `/news/[slug]` |
| **Route Admin P0 đề xuất bổ sung mới** | **5** | `/admin/locations`, `/admin/virtual-tour`, `/admin/events`, `/admin/media`, `/admin/users` |
| **Tổng Unique URL Routes trong phạm vi P0** | **19** | `14` route hiện có + `5` route Admin P0 mới *(các route đề xuất hợp nhất/chuyển tiếp vẫn giữ nguyên đến khi duyệt)* |
| **Tổng Màn hình UI phân biệt (Distinct P0 Screens)** | **19** | Tương ứng 1-1 với 19 route P0 (`/admin` chỉ tính 1 lần) |
| **Route Admin P1/P2 hoãn triển khai (Deferred)** | **4** | `/admin/3d-models`, `/admin/games`, `/admin/analytics`, `/admin/settings` *(0 file `.tsx` trên ổ đĩa)* |
| **Route Admin loại bỏ do ngoài ranh giới / gộp** | **2 + 2** | Loại khỏi Virtual Campus: `/admin/contacts`, `/admin/news`. Gộp vào P0: `/admin/import` & `/admin/roles` → `/admin/users` |
| **App Router `layout.tsx` hiện có** | **6** | `app/layout.tsx`, `(public)`, `(immersive)`, `(auth)`, `(portal)`, `admin` |
| **Next.js `loading.tsx` / `error.tsx` / `not-found.tsx` / `middleware.ts` / `route.ts`** | **0** | Hoàn toàn chưa có ở tầng App Router |
| **Tổng tệp TS/TSX trong `apps/web/src`** | **70** | `20` tệp trong `src/app/` + `49` tệp trong `src/components/` + `1` tệp `src/lib/utils.ts` |
| **Tổng URL ngoài `lh3.googleusercontent.com`** | **23** | Xuất hiện tại `9` tệp nguồn (`campus`, `about`, `locations`, `locations/[slug]`, `news`, `news/[slug]`, `Hero360Viewer`, `FeaturedFacilities`) |
| **Thư mục `apps/web/public/models/`** | **0 tệp** | Thư mục rỗng hoàn toàn, không có tệp `.glb`/`.gltf` |
| **Thư mục `apps/web/public/images/`** | **6 tệp** | Chỉ `fpt-logo-official.png` đang được render thực tế; `2` tệp 521KB trùng lặp kích thước |
| **Tệp ảnh tham chiếu Stitch (`docs/stitch-references/`)** | **13 PNG** | Bao phủ `/`, `/campus` (mobile), `/map` & `3D Explorer`, `/locations/[slug]` (Building detail), `/events`, `/news`, `/news/[slug]` — **100% dùng dữ liệu Hà Nội (Trịnh Văn Bô)** |
| **Backend (`apps/api`)** | **0 tệp** | Thư mục không tồn tại; `100%` luồng hiện tại chạy state React cục bộ hoặc mock |

---

## 2. Kiểm Kê Chi Tiết 14 Route Hiện Có & 5 Route Đề Xuất P0

### 2.1. Nhóm Public & Exploration (9 Route hiện có)

| # | URL Route | Tệp nguồn `page.tsx` | Layout | Loại render hiện tại | Stitch PNG đối ứng | Phân loại | Trạng thái & Định hướng |
|---|---|---|---|---|---|---|---|
| 1 | `/` | `src/app/(public)/page.tsx` | `(public)` | Server entry + 6 client/home sections | `fpt_polytechnic_virtual_campus_360_trang_ch.png` *(đã bác bỏ bố cục tuyển sinh của Stitch)* | **P0 Core** | Tồn tại — **Redesign lớn**: Hero Panorama là trọng tâm, bỏ `QuickAdmissionForm` và khối marketing |
| 2 | `/campus` | `src/app/(immersive)/campus/page.tsx` | `(immersive)` | Client (`dynamic` Viewer, 3 scenes cứng) | `page_03_virtual_campus_360_exploration_mobile.png` *(chỉ có mobile)* | **P0 Core** | Tồn tại — **Redesign lớn**: Giảm HUD, >90% không gian panorama, thêm Hide UI, sửa WebGL leak & seam ảnh |
| 3 | `/map` | `src/app/(immersive)/map/page.tsx` | `(immersive)` | Client (Mặc định mở `Campus3DViewer` khối hộp) | `page_05_..._gis_map_desktop/mobile.png`, `page_04_..._3d_campus_...png` | **P0 Core** | Tồn tại — **Redesign lớn**: Mặc định Light GIS Map, bỏ thanh điều hướng trùng, **ẩn tab 3D WebGL** đến khi có `.glb` |
| 4 | `/locations` | `src/app/(public)/locations/page.tsx` | `(public)` | Client (6 phòng mẫu hardcoded) | Không có trang index riêng (tham chiếu từ `page_06`) | **P0 Core** | Tồn tại — **Redesign + Sửa bug**: Đơn giản hóa card, thêm EmptyState, sửa lỗi lọc `?building=` |
| 5 | `/locations/[slug]` | `src/app/(public)/locations/[slug]/page.tsx` | `(public)` | Client (`useParams`, **bỏ qua `slug`**) | `page_06_building_and_room_details_desktop/mobile.png` | **P0 Core** | Tồn tại — **Redesign + Fix**: Đọc đúng `slug`, gỡ dữ liệu cứng `"95 m² / 45 chỗ"`, trả 404 UI nếu sai slug |
| 6 | `/events` | `src/app/(public)/events/page.tsx` | `(public)` | Client (Trộn Open Day + Modal tự ĐK + Wheel) | `page_07_fpt_polytechnic_open_day_desktop.png` | **P0 Core** | Tồn tại — **Redesign lớn**: Tách Lịch công khai vs Hoạt động dành riêng cho tài khoản được cấp; bỏ tự đăng ký VIP |
| 7 | `/about` | `src/app/(public)/about/page.tsx` | `(public)` | Client (Giới thiệu chung, trùng `caodang.fpt.edu.vn`) | *Không có Stitch PNG* | **Chuyển tiếp (Đề xuất giữ/thu gọn)** | Tồn tại — **Proposal Pending Approval**: Giảm thành trang định hướng ngắn hoặc chuyển hướng ra `caodang.fpt.edu.vn` |
| 8 | `/contact` | `src/app/(public)/contact/page.tsx` | `(public)` | Client (Form tư vấn tuyển sinh + FAQ) | *Không có Stitch PNG* | **Ngoài ranh giới (Đề xuất Redirect)** | Tồn tại — **Proposal Pending Approval**: Thay bằng thông tin chỉ đường QTSC + liên kết ra `caodang.fpt.edu.vn/lien-he` |
| 9 | `/news` | `src/app/(public)/news/page.tsx` | `(public)` | Client (4 bài tin tuyển sinh/chung) | `page_09_..._news_and_events_desktop/mobile.png` | **Ngoài ranh giới (Đề xuất Redirect/Giữ hạn chế)** | Tồn tại — **Proposal Pending Approval**: Không cạnh tranh tin tức trường; giữ/gỡ theo phê duyệt |
| 10 | `/news/[slug]` | `src/app/(public)/news/[slug]/page.tsx` | `(public)` | Client (**bỏ qua `slug`**, `alert()` copy link) | `page_10_news_article_detail_page_desktop/mobile.png` | **Ngoài ranh giới (Đề xuất Redirect/Giữ hạn chế)** | Tồn tại — **Proposal Pending Approval**: Phản ánh cùng quyết định của `/news` |
| 11 | `/games` | `src/app/(public)/games/page.tsx` | `(public)` | Client (Quiz 5 câu + BXH giả lập công khai) | *Không có Stitch PNG* | **Chuyển tiếp / P1** | Tồn tại — **Proposal Pending Approval**: Di chuyển vào khu vực hoạt động có tài khoản (`/portal`) hoặc gắn nhãn rõ ở P1 |

### 2.2. Nhóm Auth, Participant Workspace & Admin (3 Route hiện có + 5 Route P0 mới)

| # | URL Route | Tệp nguồn | Layout | Trạng thái hiện tại | Stitch PNG | Phân loại | Định hướng tái thiết kế |
|---|---|---|---|---|---|---|---|
| 12 | `/login` | `src/app/(auth)/login/page.tsx` | `(auth)` | Client (Điền sẵn `PS24180`, 600ms mock, nhãn ISO/EduID giả) | *Không có* | **P0 Core** | Tồn tại — **Redesign**: Đăng nhập tài khoản cấp bởi nhà trường, bỏ nhãn chứng nhận giả, thêm đầy đủ trạng thái lỗi & đổi MK |
| 13 | `/portal` | `src/app/(portal)/portal/page.tsx` | `(portal)` | Client (Mở công khai không guard, 450 XP & thẻ giả `PK-VIP`) | *Không có* | **P0 Core** | Tồn tại — **Redesign**: Trở thành **Không gian Tham dự Open Day** (Lịch trình tham gia, QR check-in, hoạt động Open Day được phân quyền) |
| 14 | `/admin` | `src/app/admin/page.tsx` | `admin` | Client (4 thẻ thống kê trang trí + 6 link sai/404) | *Không có* | **P0 Core** | Tồn tại — **Redesign**: Giao diện tác vụ vận hành (Hàng đợi check-in, cảnh báo asset/scene nháp, tác vụ nhanh nội bộ) |
| 15 | `/admin/locations` | *(Chưa tồn tại — 404)* | `admin` | Đã khai báo trong `admin/layout.tsx` nhưng chưa có file | *Không có* | **P0 Mới** | Thiết kế màn hình quản lý Tòa nhà, Phòng Lab/Xưởng, tọa độ pin GIS |
| 16 | `/admin/virtual-tour` | *(Chưa tồn tại — 404)* | `admin` | Đã khai báo trong `admin/layout.tsx` nhưng chưa có file | *Không có* | **P0 Mới** | Thiết kế trình quản lý Scene 360° & cấu hình Hotspot yaw/pitch + gán phòng |
| 17 | `/admin/events` | *(Chưa tồn tại — 404)* | `admin` | Đã khai báo trong `admin/layout.tsx` nhưng chưa có file | *Không có* | **P0 Mới** | Thiết kế quản lý lịch trình Open Day, hoạt động giới hạn & điểm danh QR |
| 18 | `/admin/media` | *(Chưa tồn tại — 404)* | `admin` | Đã khai báo trong `admin/layout.tsx` nhưng chưa có file | *Không có* | **P0 Mới** | Thiết kế thư viện ảnh 2D & Panorama 360°, kiểm tra tỷ lệ & nguồn tham chiếu |
| 19 | `/admin/users` | *(Chưa tồn tại — 404)* | `admin` | Đã khai báo trong `admin/layout.tsx` nhưng chưa có file | *Không có* | **P0 Mới** | Thiết kế danh sách tài khoản tham gia & luồng Import Excel/CSV + cấp/khóa/reset mật khẩu |

> **Lưu ý về Route Admin P1/P2 hoãn triển khai (Deferred):** `/admin/3d-models` (P2, phụ thuộc model `.glb` thật), `/admin/games` (P1/P2), `/admin/analytics` (P2), `/admin/settings` (P2).  
> **Lưu ý về Route Admin loại trừ khỏi phạm vi Virtual Campus:** `/admin/contacts` và `/admin/news` (vì tuyển sinh, tư vấn và tin tức chính thức thuộc `caodang.fpt.edu.vn`).

---

## 3. Kiểm Kê Layouts, Shared UI Kit & Components Hiện Có (`49` Component Files)

### 3.1. Layouts (`6` files)

| File Layout | Vai trò | Đánh giá hiện tại sau UI-01 |
|---|---|---|
| `src/app/layout.tsx` | Root HTML (`vi`), Font `Plus Jakarta Sans` & `Inter`, Material Symbols Outlined CDN | Đã sạch (`58` dòng, không còn `dangerouslySetInnerHTML`); cần bổ sung `metadataBase` & chuẩn hóa title cho Open Day hiện hành (đang ghi `Open Day 2025`) |
| `src/app/(public)/layout.tsx` | Bọc `PublicHeader` (`fixed h-16`) + `<main pt-16>` + `PublicFooter` | Đã sửa tốt; cần rà soát lại `PublicFooter` về địa danh phường QTSC thống nhất |
| `src/app/(immersive)/layout.tsx` | Thanh điều hướng `h-14` gọn (`Tour 360°`, `Bản đồ GIS`, `Open Day`, `Về Trang chủ`) | UI-01 đã tốt, nhưng trang `/map` bên trong đang tự vẽ thêm thanh sub-bar thứ 2 ngay dưới khiến bị lặp shell |
| `src/app/(auth)/layout.tsx` | Top bar tối giản + main căn giữa + footer chân trang trung thực | Đạt yêu cầu về cấu trúc |
| `src/app/(portal)/layout.tsx` | Header đơn giản cho Portal (`Tham quan`, `Open Day`) | Chưa có nút Đăng xuất/trạng thái người dùng, đang gắn nhãn `KHU VỰC OPEN DAY (P1 PORTAL)` |
| `src/app/admin/layout.tsx` | Sidebar `6` module P0 thu gọn/mở rộng được + Mobile slide-over drawer + Topbar | Khung shell đã chuẩn P0 (khớp 6 route P0); chỉ cần thay badge `UI Prototype` / `AD` tĩnh bằng thông tin phiên & nút thoát rõ ràng khi có auth |

### 3.2. Shared UI Primitives (`src/components/ui/` — `8` files)

| Component | Trạng thái áp dụng | Vấn đề thực tế |
|---|---|---|
| `Button.tsx` | Tốt về variants (`primary/secondary/outline/ghost/danger`), touch target `min-h-[44px]` | Chưa được dùng nhất quán ở các trang con (`events`, `portal`, `admin`, `Hero360Viewer` vẫn viết class Tailwind rời rạc); nút `primary` có `.shadow-cta-glow` cần tiết chế theo design system mới |
| `Badge.tsx` | 6 variants cơ bản | Đang lạm dụng tràn lan trên card địa điểm, banner, dashboard (4–6 badge trên cùng 1 thẻ) |
| `Card.tsx` | Subcomponents `CardHeader`, `CardContent`, `CardFooter` | Đang để mặc định nhiều viền + shadow; một số component tự viết `rounded-3xl border` thay vì dùng `Card` |
| `FormField.tsx` | `Input`, `Select`, `Textarea` có `useId()`, `aria-invalid`, `aria-describedby` | Đạt WCAG; cần thêm `Checkbox` / `RadioGroup` / `SearchInput` và `FileDropzone` cho Admin Media & User Import |
| `Modal.tsx` | Lock body scroll + Escape key + Backdrop click | Đạt chuẩn cơ bản; cần thêm Focus Trap (`Tab` cycle trong dialog) |
| `Drawer.tsx` | `right` / `left` / `bottom` responsive drawer | Đạt chuẩn cơ bản; chưa tích hợp vào `TourInfoDrawer.tsx` hay `BuildingDetailDrawer.tsx` (hai component này tự code khung riêng chồng chéo) |
| `StateFeedback.tsx` | `LoadingState`, `EmptyState`, `ErrorState` | Chưa được sử dụng ở `/locations`, `/campus`, `/map`, `/admin/*`, `/portal` |
| `index.ts` | Barrel export | Sẵn sàng tái sử dụng |

### 3.3. Feature Components (`41` files còn lại)

| Nhóm | Tệp component | Tình trạng sử dụng & Phát hiện quan trọng |
|---|---|---|
| **Navigation (`3`)** | `PublicHeader.tsx`, `PublicFooter.tsx`, `CampusSelectorModal.tsx` | `PublicHeader` & `PublicFooter` hoạt động; **`CampusSelectorModal.tsx` là file mồ côi (0 lượt import)** và còn ghi *"5 cơ sở toàn quốc"* trong khi chỉ có HCM Q.12. |
| **Home (`7`)** | `Hero360Viewer.tsx`, `CampusMetricsBar.tsx`, `FeaturedFacilities.tsx`, `OpenDayBanner.tsx`, `VirtualTourShowcase.tsx`, `QuickAdmissionForm.tsx`, `index.ts` | `Hero360Viewer`: trùng ~70% WebGL với `VirtualTourViewer`, `setState` 60fps, link `sports -> campus` (gãy), 6 lớp HUD đè hero.<br>`FeaturedFacilities`: 4 link `?scene=` đều sai ID (`it-lab`, `automation`, `studio`, `sports-field`).<br>`CampusMetricsBar`: số liệu chưa kiểm chứng (`97.7%`, `300+`).<br>`VirtualTourShowcase`: ghi sai `"Marzipano"`, `"Leaflet GIS"`.<br>`QuickAdmissionForm`: vi phạm ranh giới sản phẩm (form tuyển sinh). |
| **Tour 360° (`6`)** | `VirtualTourViewer.tsx`, `TourCompassHUD.tsx`, `TourSceneSelector.tsx`, `TourInfoDrawer.tsx`, `TourHotspotMarker.tsx`, `index.ts` | **`TourHotspotMarker.tsx` mồ côi (0 lượt import)**.<br>`VirtualTourViewer`: recreate `WebGLRenderer` khi đổi scene, `setState` 60fps, thiếu nút Hide UI, thiếu Error fallback khi ảnh 360° lỗi. |
| **Map & 3D (`4`)** | `Campus3DViewer.tsx`, `CampusGISMap.tsx`, `BuildingDetailDrawer.tsx`, `index.ts` | `Campus3DViewer`: khối hộp `BoxGeometry` placeholder (0 `.glb`), sai địa danh (`Tân Chánh Hiệp` vs `Trung Mỹ Tây`), stale closure `KeyE`.<br>`CampusGISMap`: SVG nền tối `slate-950`, HUD `bottom-20` chèn sát strip đáy, filter góc phải đè thanh tab.<br>`BuildingDetailDrawer`: mở mặc định che 80% mobile, link `?building=Tòa Nhà F` gây bug lọc nhầm Tòa T. |
| **Locations (`3`)** | `LocationCard.tsx`, `LocationFilterBar.tsx`, `index.ts` | `LocationCard` nhồi thông số (`capacity`, `area`, 3 badge thiết bị, pulsing status). `LocationFilterBar` thiếu nút Reset rõ ràng khi kết hợp search + category + building. |
| **Events (`5`)** | `EventPillarGrid.tsx`, `OpenDayScheduleTimeline.tsx`, `TicketRegistrationModal.tsx`, `OpenDayMiniGame.tsx`, `index.ts` | `TicketRegistrationModal`: phát mã VIP giả `POLY-VIP-2025-9821` tự do.<br>`OpenDayMiniGame`: vòng quay/quiz nhúng trực tiếp trang công khai, cho chơi lại vô hạn không đăng nhập. |
| **Portal (`4`)** | `StudentProfileHeader.tsx`, `DigitalPassCard.tsx`, `PersonalItineraryTimeline.tsx`, `index.ts` | Nhãn `"Cổng Phụ huynh & Sinh viên"`, nút `Tải file PDF` trên nền gradient tối có độ tương phản kém & gọi `alert()`, link sang `/games`. |
| **Quiz (`3`)** | `CampusQuizStepper.tsx`, `QuizLeaderboard.tsx`, `index.ts` | Đáp án lộ trong bundle client, BXH cứng 5 người không ghi chú dữ liệu mẫu, sai địa danh phường QTSC. |
| **News (`3`)** | `FeaturedArticleCard.tsx`, `NewsArticleGrid.tsx`, `index.ts` | Thuộc cụm bài viết tuyển sinh ngoài phạm vi lõi Virtual Campus. |
| **Admin (`3`)** | `AdminDashboardMetrics.tsx`, `AdminRecentActivityLog.tsx`, `index.ts` | Chứa 100% số liệu giả trang trí (`142.850`) và mô tả sai ("tiếp nhận hồ sơ tuyển sinh tự động"). |

---

## 4. Kiểm Kê Tài Nguyên Thực Tế & Sai Lệch Dữ Liệu (Media & Asset Reality Audit)

### 4.1. Tài sản Cục bộ (`apps/web/public/`)
- `public/favicon.svg` (498 B) — đang dùng trong `RootLayout`.
- `public/manifest.json` (445 B) & `public/robots.txt` (114 B) — tệp tĩnh PWA/SEO cơ bản.
- `public/images/`:
  1. `fpt-logo-official.png` (68,092 B) — **Đang sử dụng** tại tất cả header/footer.
  2. `campus-aerial-real.jpg` (521,451 B) — **Chưa dùng** *(trùng hệt dung lượng/ảnh với `fpoly-campus-aerial.jpg`)*.
  3. `fpoly-campus-aerial.jpg` (521,451 B) — **Chưa dùng**.
  4. `fpt-concept-hero.jpg` (348,682 B) — **Chưa dùng**.
  5. `fpt-gate-clean.jpg` (107,143 B) — **Chưa dùng**.
  6. `fpt-mockup-reference.jpg` (393,532 B) — **Chưa dùng**.
- `public/models/`: **RỖNG (`0` tệp `.glb` / `.gltf`)**.

### 4.2. Rủi ro Phụ thuộc Tài sản Ngoài (`23` URL `lh3.googleusercontent.com`)
- **3 cảnh 360° trong `/campus` và `1` cảnh trong `Hero360Viewer.tsx`:** Đang tải ảnh từ URL ngoài và sử dụng ảnh tỷ lệ thông thường (~16:9) thay vì **Equirectangular 2:1**, tạo vết rách dọc (vertical seam) rõ rệt ngay chính giữa màn hình (quan sát thấy trên ảnh chụp thực tế `desktop-1440__home.png` và `desktop-1440__campus.png`).
- **6 ảnh phòng trong `/locations`, 1 ảnh cứng trong `/locations/[slug]`, 4 ảnh thẻ trong `FeaturedFacilities`, 3 ảnh trong `/about`, 5 ảnh trong `/news` & `/news/[slug]`:** 100% phụ thuộc URL Google ngoài, có nguy cơ gãy HTTP 403/404 bất cứ lúc nào.

### 4.3. Danh sách Tuyên bố Sai / Chưa kiểm chứng đang hiển thị trên UI
1. **Công nghệ lõi:** `"Marzipano"` và `"Leaflet GIS"` trong `VirtualTourShowcase.tsx` (không tồn tại trong `package.json`).
2. **Độ phân giải 360°:** `"Không gian VR 4K Sẵn Sàng"`, `"Full 4K"`, `"65 inch 4K"`, `"siêu nét 4K"` (chỉ là ảnh JPEG thường).
3. **Mô hình 3D:** `"Mô hình 3D WebGL"` hiện là `BoxGeometry` minh họa, chưa có model thật.
4. **Quy mô Campus & Tuyển sinh:** `"18 Scene"` (chỉ có 3), `"50+ phòng học"` (chỉ có 6), `"120 điểm GIS"` (chỉ có 4–5 khối), `"97.7% có việc làm"`, `"300+ doanh nghiệp"`.
5. **Bảo mật & Định danh:** `"Cổng Định Danh Số EduID 2.0"`, `"SSO"`, `"MÃ HÓA TLS 1.3 & HASH BCRYPT"`, `"TIÊU CHUẨN ISO/IEC 27001"` tại `/login`.
6. **Xung đột địa danh hành chính QTSC:** `P. Trung Mỹ Tây` (`Campus3DViewer`, `PublicFooter`, `contact`, `games`) mâu thuẫn với `P. Tân Chánh Hiệp` (`Campus3DViewer` dòng 54/77, `OpenDayMiniGame` dòng 70). **Cần Chủ dự án chốt 1 tên phường duy nhất trước khi code UI-02.**

---

## 5. Kiểm Kê Trạng Thái UI (UI State Matrix) Bắt Buộc Cho Các Màn Hình Tương Tác

Bảng kiểm kê trạng thái hiện có so với trạng thái bắt buộc phải thiết kế trong `UI_PAGE_BLUEPRINT.md`:

| Màn hình / Luồng | Trạng thái hiện có | Trạng thái đang THIẾU (Cần bổ sung thiết kế) |
|---|---|---|
| **360° Tour (`/campus`, Hero `/`)** | Idle loaded, Loading banner | Texture Load Error (`Retry` + fallback), Empty/No-scenes, Mobile Touch Hint dismissed, Active Info Drawer, **UI Hidden Mode (Hide HUD)**, WebGL unsupported fallback |
| **GIS Map (`/map`)** | Building selected (bắt buộc mở sẵn ngay khi tải!) | **Clean Unselected Default** (canvas thoáng hoàn toàn), Search No Results, Filter Empty State, Category Active, Mobile Compact Sheet Collapsed/Expanded, Map Load Error |
| **Locations (`/locations`)** | Populated grid | **Search/Filter Empty State** *(hiện trả mảng trống không thông báo)*, Loading skeleton, Error retry, Active Query Params Sync (`?building=`) |
| **Location Detail (`/locations/[slug]`)** | Single hardcoded layout | **Not Found / Invalid Slug State** *(hiện nhập bừa slug vẫn render cùng 1 phòng)*, No 360° Scene Available state |
| **Open Day (`/events`)** | Static timeline + VIP modal + wheel | **Guest Public View** vs **Authorized Activity Locked Hint (Cần tài khoản cấp)**, Event Ended / Full Capacity / Upcoming states |
| **Login (`/login`)** | Default (điền sẵn), Submitting 600ms, Empty-field error | Invalid Credentials error, **Locked / Disabled Account**, **First-Login Forced Password Change**, **Forgot Password / Liên hệ BTC guidance**, Session Expired notice |
| **Portal (`/portal`)** | Unprotected fake student data + Ticket print `alert()` | **Unauthorized / Guest Redirect Gate**, Active Event Check-in QR Pass (Empty vs Issued), Assigned Activities Locked/Unlocked/Completed states, **Update Temporary Password Form** |
| **Admin Dashboard & 5 Submodules (`/admin/*`)** | Only `/admin` static mockup | Empty tables/lists, Validation errors, Save Success/Toast, **Destructive Action Confirmation Modal** (khóa tài khoản/xóa media đang dùng), **Import CSV/Excel 3-step states** (Uploading → Row Errors Preview → Partial/Full Success), **Asset Publish Gate** (Draft missing 2:1 panorama or orphan check) |
