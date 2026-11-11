# 03. KIỂM TOÁN CHI TIẾT TỪNG TRANG & UI/UX (PAGE-BY-PAGE AUDIT)

Tài liệu này kiểm toán toàn bộ **12 nhóm sản phẩm** (trên tổng số **14 `page.tsx`** hiện có + **11 route CMS thiếu**) và đối chiếu trực tiếp với ảnh thiết kế Stitch trong `docs/stitch-references/`.

---

## 1. Bảng Tổng Hợp Theo Trang (Section 19C)

| # | Nhóm Sản phẩm | Route thực tế | Desktop | Mobile | Design (Stitch) | Frontend | Backend | Database | Tương tác thực tế | Còn thiếu chính | Trạng thái chung |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **01** | Homepage | `/` | S3 (gãy CSS build) | S3 | Có (`...trang_ch.png`) | S3 | S0 | S0 | Drag 360° giả lập, hotspot, lọc facility, submit form RAM | Build fix, `?scene=` đúng, API form/metrics | **S3** |
| **02** | About | `/about` | S3 | S3 | Không thấy ảnh riêng | S3 | S0 | S0 | Nút chuyển trang tĩnh | Gắn link từ Header/Dropdown, dữ liệu CMS | **S3** |
| **03** | Virtual Campus 360° | `/campus` | S3 (méo ảnh, leak WebGL) | S3 | Có (`page_03...mobile.png`) | S3 | S0 | S0 | Đổi 3 scene, zoom, mở drawer, auto-rotate | Marzipano / equirectangular 2:1, ≥10–18 scene, DB hotspots | **S3** |
| **04** | 3D Campus & GIS | `/map` | S3 (UI overlap đáy) | S3 | Có (`page_04`, `page_05`) | S3 / S2 | S0 | S0 | Orbit + Walk WASD/D-pad, click tòa nhà, SVG zoom | R3F+Drei + `.glb`, Leaflet GIS thật, sửa HUD overlap & bug `KeyE` | **S3** |
| **05** | Locations & Room Detail | `/locations`, `/locations/[slug]` | S3 / S2 | S3 / S2 | Có (`page_06...png`) | S3 / S2 | S0 | S0 | Lọc category/building (bị bug `T` vs `F`) | Render dữ liệu thật theo `slug`, gallery, schema DB, fix filter | **S3** |
| **06** | Events & Open Day | `/events` | S3 | S3 | Có (`page_07...png`) | S3 | S0 | S0 | Mở modal đăng ký vé giả, mini-game Canvas | Auth/workshop gate, lưu vé QR thật, API sự kiện | **S3** |
| **07** | News & Detail | `/news`, `/news/[slug]` | S3 / S2 | S3 / S2 | Có (`page_09`, `page_10`) | S3 / S2 | S0 | S0 | Lọc tab 4 bài, `alert()` sao chép link | Tìm kiếm/phân trang, render bài theo `slug` từ DB | **S3** |
| **08** | Contact | `/contact` | S3 | S3 | Không thấy ảnh riêng | S3 | S0 | S0 | Accordion 5 FAQ, submit form RAM | Lưu form `ContactModule`, validation SĐT VN, nhúng bản đồ | **S3** |
| **09** | Authentication | `/login` | S2 | S2 | Được mô tả trong docs | S2 | S0 | S0 | Hiện/ẩn mật khẩu, chuyển hướng giả sau 600ms | JWT, bcrypt, đổi MK lần đầu, quên MK, Next middleware | **S2** |
| **10** | Student & Parent Portal | `/portal` | S2 | S2 | Được mô tả trong docs | S2 | S0 | S0 | Tabs? (không, chỉ 1 view tĩnh + `alert()` PDF) | Route guard, dữ liệu theo user đăng nhập, xuất QR/PDF thật | **S2** |
| **11** | Gamification & Quiz | `/games` (+ `/events`) | S3 | S3 | Chưa đối chiếu ảnh riêng | S3 | S0 | S0 | Làm 5 câu quiz, vòng quay + 3 câu mini-game | Lưu điểm XP/BXH server, chống reset gian lận, sửa xung đột địa chỉ | **S3** |
| **12** | Admin CMS | `/admin` (+ 11 routes 404) | S2 | S2 | Được mô tả trong docs | S2 | S0 | S0 | Chỉ click xem layout tĩnh, 11 link 404 | 11 trang con CMS, CRUD, Upload 360/GLB, CSV import, RBAC | **S2** |

---

## 2. Phân Tích Chi Tiết 12 Nhóm Sản Phẩm (Section 8)

### 01. Homepage (`/`)
- **Mục đích:** Điểm chạm đầu tiên giới thiệu hệ sinh thái campus Q.12, kích hoạt trải nghiệm 360° ngay ở Hero và chuyển đổi đăng ký Open Day/Tư vấn.
- **Route & Layout:** `/` — `(public)/layout.tsx` (`PublicHeader` + `main.pt-20` + `PublicFooter`).
- **Số section & tên (`(public)/page.tsx:13-31`):** 6 section:
  1. `Hero360Viewer` (Viewport 360° trực tiếp + 5 hotspot QTSC + panel giới thiệu góc dưới trái + nút auto-rotate).
  2. `CampusMetricsBar` (4 chỉ số: `2.5+ Ha`, `4 Tòa nhà`, `50+ Phòng Lab`, `360° Chuẩn 4K`).
  3. `FeaturedFacilities` (Grid 4 không gian nổi bật có tab lọc `Tất cả` / `Hạ tầng CNTT` / `Thiết kế & Game` / `Đời sống & Thể thao`).
  4. `OpenDayBanner` (Banner cam-navy quảng bá sự kiện Open Day 2025).
  5. `VirtualTourShowcase` (Giới thiệu 3 điểm nhấn công nghệ: Panorama, Bản đồ GIS, Lộ trình cá nhân hóa).
  6. `QuickAdmissionForm` (Form 5 trường + cam kết 3 ý bên trái).
- **Thiếu sót & Sai lệch:**
  - `FeaturedFacilities.tsx` gắn URL `/campus?scene=it-lab`, `automation`, `studio`, `sports-field` và `Hero360Viewer.tsx` gắn `/campus?scene=campus` — tất cả bị fallback về `thu-vien` vì `campus/page.tsx` chỉ nhận `thu-vien`, `lab-it`, `studio-imac`.
  - `VirtualTourShowcase.tsx` tự giới thiệu dùng **Marzipano** và **Leaflet GIS**, sai hoàn toàn với mã nguồn hiện dùng Three.js thuần & SVG.
  - `PublicHeader.tsx` không có link tới `/about`, nút đổi cơ sở có badge text nhưng `CampusSelectorModal.tsx` không hề được render.
  - `QuickAdmissionForm.tsx` không gọi API, không check format SĐT Việt Nam.
- **Dữ liệu/API/DB cần:** `CMSModule` (hero/metrics/sections), `LocationsModule` (featured cards), `ContactModule`/`RegistrationsModule` (form submit). **Auth:** Public.
- **Desktop / Mobile:** UI trình bày được cả 2 màn hình nhưng thiếu tối ưu tải ảnh ngoài `lh3.googleusercontent.com` và trên mobile hotspot label có thể chồng nhẹ; `next build` hiện gãy bởi `globals.css`. **Overall: S3**.

### 02. About (`/about`)
- **Mục đích:** Giới thiệu triết lý `"Thực học — Thực nghiệp"`, tỷ lệ việc làm, đối tác doanh nghiệp và 3 cụm cơ sở vật chất tiêu biểu tại CVPM Quang Trung.
- **Route & Layout:** `/about` — `(public)/layout.tsx`.
- **Số section (`about/page.tsx`):** 4 section: Hero Banner → 3 Pillars (`70%`, `2.000+`, `97.7%`) → Facilities Showcase (3 ảnh từ `lh3.googleusercontent.com`) → Dark CTA Banner.
- **Thiếu sót:** Không có link trên `PublicHeader` (chỉ có 1 link nhỏ `"Giới thiệu cơ sở"` ở góc phải `PublicFooter.tsx`), dữ liệu hardcode, không lấy từ CMS. **Overall: S3**.

### 03. Virtual Campus 360° (`/campus`)
- **Mục đích:** Trình xem panorama 360° toàn màn hình cho từng phòng học/khuôn viên, có hotspot dịch chuyển không gian và bảng thông số phòng.
- **Route & Layout:** `/campus` (hỗ trợ `?scene=...`) — `(immersive)/layout.tsx`.
- **Số section:** 1 viewport canvas toàn màn hình + 4 lớp HUD nổi (`TourCompassHUD`, `TourInfoDrawer`, `TourSceneSelector`, điều khiển Zoom/Reset).
- **Đối chiếu Stitch (`page_03_virtual_campus_360_exploration_mobile.png`):**
  - Stitch mobile có bottom sheet thanh lịch, thumbnail cảnh quan rõ nét, chip phân khu ở cạnh dưới.
  - Bản code hiện tại mới có **3 scene** (`thu-vien`, `lab-it`, `studio-imac`), ảnh tải từ URL `lh3.googleusercontent.com` tỷ lệ chữ nhật thường ép lên `SphereGeometry` gây vệt ghép dọc sau lưng và nhòe.
- **Thiếu sót kỹ thuật nghiêm trọng:** Không dùng equirectangular 2:1 chuẩn, không có Marzipano multi-tile; `VirtualTourViewer.tsx:274` hủy & khởi tạo lại `WebGLRenderer` mỗi lần chuyển scene gây rò rỉ bộ nhớ GPU; `TourHotspotMarker.tsx` viết xong nhưng không dùng; thiếu dữ liệu động từ `VirtualTourModule`/`PanoramaModule`/`MediaModule`. **Auth:** Public (tùy chọn scene nội bộ nếu cần). **Overall: S3**.

### 04. 3D Campus Explorer & GIS Campus Map (`/map`)
- **Mục đích:** Cho phép người dùng quan sát tổng thể mặt bằng 3D CVPM Quang Trung (Orbit hoặc Walk Mode góc nhìn thứ 3 với avatar sinh viên) và xem sơ đồ GIS phân khu, bấm vào tòa nhà để mở ngăn chi tiết và nhảy tới trang danh sách phòng hoặc 360°.
- **Route & Layout:** `/map` — `(immersive)/layout.tsx`.
- **Cảnh báo tách route:** Trong Stitch, **3D Campus Explorer** (`page_04`) và **GIS Campus Map** (`page_05`) là **2 trang tách biệt hoàn toàn** (`3d-campus` và `gis-map`). Hiện tại bản cài đặt gộp chung cả 2 vào 1 route `/map` qua state chuyển tab `viewMode: "3d" | "gis"`. Nên cân nhắc tách `/map` (GIS thật với Leaflet/Mapbox + URL query chia sẻ được) và `/campus-3d` (3D Explorer) hoặc ít nhất hỗ trợ URL query `?mode=gis` / `?building=`.
- **Số section & components:** Header HUD + Sub-toolbar chuyển `Mô hình 3D WebGL` / `Bản đồ GIS 2D` / `Vào Tour 360°` + `Campus3DViewer` (hoặc `CampusGISMap`) + `BuildingDetailDrawer` + dải nút chọn nhanh các khu ở cạnh đáy (`map/page.tsx:104-127`).
- **Tương tác & Lỗi đối chiếu thực tế (cũng xuất hiện trên ảnh đính kèm của người dùng):**
  - Đã có OrbitControls, Walk Mode (`WASD`, phím mũi tên, IME Telex, nút D-pad cảm ứng, Shift chạy, Space nhảy), va chạm `BUILDING_COLLIDERS`, raycast click tòa nhà.
  - **Bug chồng lấn HUD:** Ở chế độ GIS (`CampusGISMap.tsx:303`), thanh nổi `bottom-6` trùng trực tiếp lên dải nút chọn tòa nhà `bottom-3` của `map/page.tsx`. Ở màn hình vừa/mobile, drawer trái và hint ở đáy dễ che khuất góc nhìn 3D.
  - **Lỗi code:** `Campus3DViewer.tsx:842` (`let clock` bị ESLint error), dòng `795`/`1021` (`KeyE` bắt stale closure `nearbyBuilding`), `new THREE.Vector3()` tạo mới trong vòng lặp 60fps, cây cối & cổng QTSC không có collider khiến nhân vật đi xuyên qua, khối 3D chỉ là `BoxGeometry` lập trình chứ chưa nạp `.glb/.gltf`.
  - **Bug điều hướng liên trang:** Bấm `"Xem phòng học & xưởng Lab"` trong `BuildingDetailDrawer.tsx:99` khi đang mở Tòa Nhà F sẽ gửi `?building=Tòa Nhà F`, nhưng `locations/page.tsx:111-112` đối chiếu sai thành **Tòa Nhà T**!
- **Dữ liệu/API/DB cần:** `CampusModule`, `BuildingsModule`, `ThreeDModule`, `LocationsModule`. **Overall: S3 (3D) / S2 (GIS)**.

### 05. Locations & Room Details (`/locations`, `/locations/[slug]`)
- **Mục đích:** Tra cứu, lọc toàn bộ phòng Lab, Xưởng thực hành, Studio, Giảng đường theo tòa nhà và nhóm ngành; xem thông số kỹ thuật chi tiết từng phòng.
- **Đối chiếu Stitch (`page_06_building_and_room_details_desktop.png` & `mobile.png`):**
  - Stitch thiết kế rất chi tiết: chọn tòa nhà/tầng, sơ đồ mặt bằng hoặc danh sách thiết bị chi tiết từng máy, thông số phòng, đánh giá, ảnh thư viện đa góc, lịch trống phòng/lịch mở cửa.
  - Hiện tại `/locations` (`locations/page.tsx`) chỉ có 8 thẻ phòng viết cứng trong mảng `LOCATIONS_DATA`. Còn `/locations/[slug]` **không đọc dữ liệu từ bất kỳ danh sách nào**, mọi `slug` đều hiển thị đúng một trang mẫu tĩnh cố định (`"95 m² · 45 Chỗ · 1 Gbps"` và cùng một tấm ảnh + cùng 3 link quay về `/locations`)!
- **Thiếu sót:** Backend `LocationsModule` + `FloorsModule` + `BuildingsModule`, trang chi tiết động thật theo `slug`, sửa bug regex/string filter `b.split(" ")[2]` trong `locations/page.tsx:111`. **Auth:** Public. **Overall: S3 (List) / S2 (Detail)**.

### 06. Events & Open Day (`/events`)
- **Mục đích:** Công bố lịch trình Open Day, hoạt động trải nghiệm ngành, mini-game săn quà tại sự kiện và đăng ký vé tham dự QR.
- **Đối chiếu Stitch (`page_07_fpt_polytechnic_open_day_desktop.png`):**
  - Stitch có: countdown đếm ngược, khu chọn khung giờ workshop chuyên sâu, bản đồ khu check-in, gói trải nghiệm dành riêng cho tài khoản trường/thí sinh, quy trình nhận vé rõ ràng.
  - Hiện tại `/events` gồm 4 section (`Hero Banner` → `EventPillarGrid` → `OpenDayMiniGame` → `OpenDayScheduleTimeline` + `TicketRegistrationModal`).
- **Thiếu sót:** Mọi người mở tự do đều hiện thông báo đăng ký thành công với mã vé cứng `POLY-VIP-2025-9821`; thiếu xác thực tài khoản học sinh/phụ huynh cho hoạt động giới hạn theo yêu cầu kiến trúc; không tạo bản ghi DB `registrations`; không xuất vé QR động. **Overall: S3**.

### 07. News & News Detail (`/news`, `/news/[slug]`)
- **Mục đích:** Cổng tin tức tuyển sinh, thành tích sinh viên và nhật ký công nghệ.
- **Đối chiếu Stitch (`page_09...desktop.png`, `mobile.png`, `page_10...desktop.png`, `mobile.png`):**
  - Stitch trang `/news` có thanh tìm kiếm bài viết, phân loại danh mục phong phú hơn, khu đăng ký nhận bản tin (Newsletter) và phân trang. Code `/news` hiện chỉ có 1 bài nổi bật (`FEATURED_ARTICLE`) + 3 bài trong `NEWS_LIST` lọc tại client.
  - Stitch trang `/news/[slug]` có mục lục/bài viết liên quan bên phải, tags, tác giả chi tiết, nút share đa nền tảng. Code `/news/[slug]` **bỏ qua `slug`** (mọi URL đều hiện bài `"Open Day 2025"`), nút copy link chạy `alert("Đã sao chép liên kết bài viết!")` mà không thật sự gọi `navigator.clipboard.writeText()`.
- **Thiếu sót:** `CMSModule` API bài viết, đọc `slug` từ DB, tìm kiếm + phân trang + SEO metadata động (`generateMetadata`). **Auth:** Public. **Overall: S3 (List) / S2 (Detail)**.

### 08. Contact (`/contact`)
- **Mục đích:** Kênh liên hệ trực tiếp ban tuyển sinh Cơ sở Quận 12, hướng dẫn đi xe buýt (tuyến 55, 24, 48), giải đáp thắc mắc thường gặp (5 FAQ).
- **Route & Layout:** `/contact` — `(public)/layout.tsx`.
- **Thiếu sót:** Form gửi liên hệ chỉ set `isSent = true` tại state cục bộ; thiếu API `ContactModule` lưu `contact_submissions`, thiếu email thông báo cho tuyển sinh, thiếu captcha/rate-limit chống spam, thiếu nhúng bản đồ tương tác hoặc link chỉ đường Google Maps thật. **Auth:** Public. **Overall: S3**.

### 09. Authentication (`/login`)
- **Mục đích:** Cổng đăng nhập dành cho Sinh viên, Phụ huynh, Giảng viên và Quản trị viên (sử dụng tài khoản do nhà trường import từ Excel/CSV).
- **Route & Layout:** `/login` — `(auth)/layout.tsx` (chứa logo + nút quay về `/` dùng `<a href>`).
- **Hiện trạng nguy hiểm:**
  - `login/page.tsx:10-11` điền sẵn `PS24180` và `polytechnic2025`.
  - Lệnh submit không gọi API bất kỳ nào, chỉ cần input không rỗng là chờ 600ms rồi chuyển thẳng sang `/portal` (`router.push("/portal")`).
  - Giao diện in dòng `"TLS 1.3 & HASH BCRYPT"` và `"ISO/IEC 27001"` trong khi thực tế **0% mã hóa, 0% session, 0% kiểm tra tài khoản**.
  - **Thiếu hoàn toàn:** Màn hình / luồng **Đổi mật khẩu bắt buộc lần đầu** (confirmed requirement), Quên mật khẩu, Refresh token, phân luồng redirect sau đăng nhập (Admin → `/admin`, Student/Parent → `/portal`). **Overall: S2**.

### 10. Student & Parent Portal (`/portal`)
- **Mục đích:** Không gian cá nhân cho Sinh viên & Phụ huynh xem lịch trình Open Day đã đăng ký, thẻ QR VIP điện tử, điểm XP & huy hiệu đã đạt, thông tin phòng học đã tham quan.
- **Route & Layout:** `/portal` — `(portal)/layout.tsx` (dùng `<a href>`, không auth guard!).
- **Hiện trạng:** Ai gõ thẳng `/portal` cũng vào được. Hiển thị cứng hồ sơ `"Nguyễn Hoàng Nam (PS24180)"` / Phụ huynh `"Nguyễn Văn An"`, `450 XP`, `08/16 Phòng Lab`, mã vé `POLY-2025-VIP-9821`. Nút `"Tải vé PDF"` chỉ chạy `alert("Đã tải vé PDF về thiết bị!")` (`DigitalPassCard.tsx:61`). Thiếu chức năng đổi mật khẩu, cập nhật hồ sơ (Stitch có đề cập Login and Profile Management), sinh QR cá nhân hóa. **Auth:** Bắt buộc (`STUDENT`, `PARENT`). **Overall: S2**.

### 11. Gamification & Quiz (`/games` và trong `/events`)
- **Mục đích:** Tổ chức đố vui kiến thức về FPT Polytechnic Q.12 & vòng quay may mắn Open Day nhằm tăng tương tác và cấp điểm XP / quà tặng.
- **Route & Layout:** `/games` (`(public)/layout.tsx`) và nhúng trong `/events` (`OpenDayMiniGame.tsx`).
- **Tương tác hiện có:**
  - `/games`: Chọn bắt đầu → làm 5 câu trắc nghiệm (`CampusQuizStepper.tsx`) → xem kết quả XP; xem `QuizLeaderboard` (5 dòng tĩnh).
  - `/events`: Vòng quay HTML5 Canvas 340×340 (5 ô thưởng cố định) + thử thách 3 câu hỏi nhận mã quà ngẫu nhiên trên trình duyệt.
- **Lỗi & Thiếu sót:**
  - **Mâu thuẫn dữ liệu nội bộ:** Câu 2 ở `games/page.tsx:21` cho rằng CVPM Quang Trung nằm ở **Phường Trung Mỹ Tây**, trong khi `Campus3DViewer.tsx` / Tòa F ghi **P. Tân Chánh Hiệp** (và trong thực tế Lô 24 CVPM Quang Trung Q.12 cần thống nhất một địa danh hành chính chuẩn duy nhất trên toàn hệ thống).
  - Bấm `Chơi lại` reset toàn bộ lượt quay/câu hỏi vô tận; mã quà `POLY2025-XXXX` tạo ngẫu nhiên bằng `Math.random()` không lưu database để đối soát phát quà tại quầy Open Day.
  - ESLint báo cảnh báo biến không dùng `isCorrect` ở `OpenDayMiniGame.tsx:263`. **Overall: S3**.

### 12. Admin CMS (`/admin` + các route quản trị)
- **Mục đích:** Trung tâm quản trị không cần đụng code để chỉnh sửa nội dung web, địa điểm, ảnh 360°, mô hình 3D, sự kiện, trò chơi, import CSV/Excel tài khoản và xem thống kê.
- **Route & Layout:** `/admin` — `admin/layout.tsx` (sidebar dark navy + header).
- **Lỗi chết (Broken Routes):** `admin/layout.tsx` liệt kê **12 route** nhưng **11/12 route KHÔNG TỒN TẠI (404)**:
  - Có file: `/admin` (`admin/page.tsx` — dashboard tĩnh).
  - **404 (chưa tạo file):** `/admin/locations`, `/admin/tours-360`, `/admin/models-3d`, `/admin/media`, `/admin/events`, `/admin/games`, `/admin/news`, `/admin/users`, `/admin/roles`, `/admin/analytics`, `/admin/settings`.
- **Thiếu sót:** Bảo vệ RBAC (`ADMIN`, `SUPER_ADMIN`, `CONTENT_EDITOR`, `EVENT_MANAGER`), toàn bộ CRUD forms, upload R2/S3 bằng presigned URL, preview 360° & `.glb` trước khi publish, import Excel/CSV tài khoản. **Overall: S2**.

---

## 3. Đề Xuất Tách / Tổ Chức Lại Routes

1. **Tách GIS & 3D Campus thành 2 route độc lập (hoặc đồng bộ URL state rõ ràng):**
   - `/map`: Bản đồ GIS QTSC thật (Leaflet/Mapbox + phân khu + chỉ đường tới từng tòa nhà).
   - `/campus-3d` (hoặc `/3d-explorer`): Không gian 3D Campus WebGL (R3F + Walk Mode). Cách này bám sát thiết kế Stitch (`page_04` và `page_05`), giảm tải bundle WebGL khi user chỉ muốn xem bản đồ 2D và cho phép chia sẻ link trực tiếp.
2. **Tách route Profile & Đổi mật khẩu trong Portal:**
   - `/portal/profile` & `/change-password` để hỗ trợ luồng bắt buộc đổi mật khẩu ở lần đăng nhập đầu tiên.
3. **Bổ sung 11 subroute còn thiếu trong `/admin/*`** (hoặc nhóm lại thành các route quản trị có kiểm soát quyền theo role).
