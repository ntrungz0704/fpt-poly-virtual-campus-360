# DESIGN SYSTEM SPECIFICATION & FULL UI BLUEPRINT
**Dự án:** FPT Polytechnic Virtual Campus 360° — Cơ sở TP.HCM (CVPM Quang Trung, Quận 12)  
**Cơ sở kỹ thuật hiện hữu:** `apps/web/src/app/globals.css` (Tailwind v4 `@theme`) & `apps/web/src/app/layout.tsx`  
**Áp dụng cho:** Toàn bộ giai đoạn `UI-01` -> `UI-06`

---

## PHẦN A — DESIGN SYSTEM CHUẨN HÓA

### 1. Hệ thống Màu sắc (Semantic Color Tokens từ `globals.css`)

Thay vì dùng rải rác các lớp màu cứng (`bg-slate-900`, `text-orange-600`) gây lệch tông giữa các trang, mọi component từ `UI-01` trở đi phải dùng bộ token ngữ nghĩa thống nhất trong `@theme` của `globals.css`:

| Nhóm Token | CSS Variable / Tailwind Token | Giá trị / Vai trò chuẩn | Quy tắc sử dụng |
|---|---|---|---|
| **Thương hiệu chính (Cam FPT)** | `--color-primary` | `#a04100` | Dùng cho **chữ/link/icon cam trên nền sáng** để đảm bảo tương phản WCAG AA trên nền `#f9f9ff` và `#ffffff`. |
| **Nút & Điểm nhấn nổi bật** | `--color-primary-container` | `#f36f21` | Chỉ dùng làm **màu nền CTA chính**, badge nổi bật hoặc đường viền focus; **không dùng làm chữ nhỏ trên nền trắng**. |
| **Chữ trên nền Cam** | `--color-on-primary` | Nền tương phản sáng trên `--color-primary` / `--color-primary-container` | Dùng cho nhãn nút CTA chính kết hợp `font-bold`. |
| **Chữ phụ / Nhãn bổ trợ** | `--color-secondary` | `#49607c` | Mô tả phụ, metadata tòa nhà/tầng, placeholder rõ nét. |
| **Liên kết / Trạng thái thông tin** | `--color-tertiary` | `#005db7` | Hotspot thông tin, badge trạng thái hệ thống / Open Day. |
| **Bề mặt nền chính** | `--color-surface` | `#f9f9ff` | Nền mặc định toàn website công khai, sạch sẽ, không xám đục. |
| **Chữ chính trên nền sáng** | `--color-on-surface` | `#041b3c` | Tiêu đề, nội dung chính đạt độ tương phản cao. |
| **Hệ Surface phân cấp** | `surface-container-lowest..highest` | Phân tầng card, input, panel, divider không cần quá nhiều border nặng. | Khối nổi dùng card sáng đặt trên `surface`, vùng phụ dùng `surface-container-low`. |
| **Nền tối / Immersive HUD** | `--color-inverse-surface` | `#1d3052` (kết hợp `.glass-hud-dark`) | Khung điều khiển nổi trên Panorama 360° (`/campus`) và Drawer/Modal tối khi cần tương phản ảnh thực tế. |
| **Ngữ nghĩa trạng thái** | `success`, `warning`, `info`, `error` | Bộ token trạng thái sẵn có trong `globals.css` | Trạng thái mở/đóng Open Day, lỗi validate form, cảnh báo khóa tài khoản, xác nhận thao tác Admin. |

---

### 2. Typography Scale & Font Family (`layout.tsx` + `globals.css`)

- **Font Display (`--font-display`):** `Plus Jakarta Sans` (`--font-plus-jakarta-sans`) — dùng cho toàn bộ tiêu đề `.font-headline-*` và nút CTA chính.
- **Font Body (`--font-sans`):** `Inter` (`--font-inter`) — dùng cho văn bản đọc `.font-body-*`, nhãn `.font-label-*`, bảng dữ liệu Admin.
- **Icon System:** Google Material Symbols Outlined (nhúng trong `layout.tsx`).
- **Hệ lớp chữ chuẩn từ `globals.css`:**
  - Tiêu đề lớn: `.font-headline-xl`, `.font-headline-lg`, `.font-headline-md`, `.font-headline-sm` kèm biến thể responsive `-mobile` (`.font-headline-xl-mobile`, `.font-headline-lg-mobile`, `.font-headline-md-mobile`).
  - Nội dung văn bản: `.font-body-lg`, `.font-body-md`, `.font-body-sm`.
  - Nhãn, nút & badge: `.font-label-lg`, `.font-label-md`, `.font-label-sm`.

---

### 3. Spacing, Layout Container, Radius & Elevation (`globals.css`)

- **Spacing Scale:** Sử dụng nhất quán `--spacing-space-xs` -> `--spacing-space-xl` và `--spacing-gutter` cho padding ngang container `.ui-container`.
- **Border Radius:**
  - Điều khiển nhỏ (`button`, `input`, `chip`, `badge`): `--radius-control` (`0.5rem` — `8px`).
  - Thẻ nội dung (`card`): `--radius-card` (`1rem` — `16px`).
  - Khung lớn (`drawer`, `modal`, `viewer shell`): `--radius-panel` (`1.5rem` — `24px`).
- **Elevation & HUD:**
  - Card tĩnh -> `--shadow-elevation-1`, Hover/Dropdown -> `--shadow-elevation-2`, Modal/Drawer -> `--shadow-elevation-3`, Primary CTA -> `--shadow-cta-glow`.
  - Floating HUD trên Panorama/Bản đồ dùng `.glass-hud` (nền sáng) hoặc `.glass-hud-dark` (nền tối).

---

### 4. Breakpoints & Responsive Grid

Sử dụng breakpoint chuẩn của Tailwind v4 kết hợp `--breakpoint-xs: 30rem` (`480px`) trong `globals.css`:

| Viewport QA bắt buộc | Breakpoint | Quy tắc Layout & Grid |
|---|---|---|
| **1440px** | `xl`/`2xl` | Container `max-w-7xl`, Grid 3–4 cột thoáng rộng, Immersive HUD giữ tối đa 2 vùng nổi mỗi cạnh, Sidebar Admin cố định trái. |
| **1280px** | `xl` | Header 4 mục tuyệt đối 1 dòng không rớt chữ; Hero/Canvas giữ trọn tỷ lệ trên `calc(100vh - 64px)` không cắt nút CTA chính. |
| **768px** | `md` | Grid 2 cột; Admin chuyển sang **Slide-over Drawer**; thanh chọn cảnh/tòa nhà chuyển chế độ cuộn ngang không tràn `clientWidth`. |
| **390px / 360px** | `< sm` (`xs`) | Stack 1 cột hoàn toàn; vùng chạm nút/input `>= 44px`; Panel chi tiết chuyển thành Bottom Sheet (`<= 60%` viewport height); đảm bảo `scrollWidth === clientWidth`. |

---

### 5. Quy chuẩn UI Components & States Dùng Chung (`.ui-*` trong `globals.css`)

1. **Public Header (`PublicLayout` — `64px` fixed):**
   - Trái: Logo FPT Polytechnic (`/images/fpt-logo-official.png`) + chữ `Virtual Campus` + pill nhỏ `QTSC Q.12`.
   - Phải (Desktop): Đúng **4 mục duy nhất**: `Tham quan` (`/campus`), `Bản đồ` (`/map`), `Open Day` (`/events`), nút **`Đăng nhập`** (`/login`).
   - Mobile (`< 768px`): Logo gọn + 1 nút Hamburger (`44x44px`) mở Drawer 4 mục rõ ràng.
2. **Public Footer (`PublicLayout`):**
   - 3–4 cột gọn gàng: (1) Định danh Virtual Campus & địa chỉ Lô 24 CVPM Quang Trung, Q.12; (2) Khám phá nhanh (`/campus`, `/map`, `/locations`, `/events`); (3) Liên kết Website Chính thức `https://caodang.fpt.edu.vn` (Trang chủ trường, Tuyển sinh, Ngành học, Liên hệ).
   - **Tuyệt đối không đặt link `/admin`** trong Footer.
3. **Immersive Header / Topbar (`ImmersiveLayout` — `56px`):**
   - Dùng cho `/campus` và `/map`: Nút về Trang chủ + Chuyển nhanh `Tour 360°` (`/campus`) / `Bản đồ GIS` (`/map`) + Link gọn `Open Day` / `Đăng nhập`, không để trùng lặp hai thanh navbar chồng nhau như lỗi trước đây.
4. **Admin Shell (`AdminLayout` — cho 6 màn hình `UI-05`):**
   - Sidebar cố định trái (`256px` desktop, Drawer ẩn trên `<1024px`) chứa đúng **6 mục P0**: `Dashboard`, `Địa điểm`, `Tour 360°`, `Open Day`, `Media`, `Tài khoản`.
5. **Buttons (`.ui-btn*`):**
   - `Primary`: Nền `--color-primary-container`, chữ `--color-on-primary`, `--shadow-cta-glow` (chỉ **1 nút Primary nổi bật cho mỗi màn hình**).
   - `Secondary`: Nền `surface-container`, viền rõ, chữ `--color-on-surface`.
   - `Ghost` & `Danger`: Dùng cho thao tác phụ / xác nhận xóa Admin. Chiều cao tối thiểu `44px` trên mobile/touch.
6. **Cards (`.ui-card*`) & Inputs (`.ui-input`, `.ui-select`, `.ui-textarea`):**
   - Card danh mục địa điểm giới hạn tối đa 3–4 dòng thông tin + ảnh tỉ lệ `16:10`.
   - Mọi form input cao `>= 44px`, có label rõ ràng ở trên (không phụ thuộc hoàn toàn vào placeholder).
7. **Full UI States (Bắt buộc kiểm tra ở `UI-06`):**
   - `Loading`: Skeleton đồng bộ kích thước card/bảng hoặc spinner nhỏ kèm nhãn trạng thái đang tải cảnh 360°/GIS.
   - `Empty`: Minh họa nhẹ + thông báo rõ + nút `"Đặt lại bộ lọc"` hoặc `"+ Tạo mới"`.
   - `Error`: Alert banner/inline thông báo nguyên nhân rõ & nút `"Thử lại"`.
   - `Disabled` & `Focus`: Giảm độ mờ `opacity-50 pointer-events-none`; bàn phím `Tab` hiển thị vòng focus `.focus-visible` rõ nét (`2px`).

---

### 6. Nguyên tắc Visual-First & Chống Nhồi nhét (Mandatory Rules)

1. **Mỗi trang 1 mục tiêu chính + 1 CTA nổi bật duy nhất.**
2. **Không gian thực tế là nhân vật chính:** Màn hình đầu của `/`, `/campus`, `/map` dành tối thiểu `70%–90%` diện tích cho panorama/bản đồ; chữ chỉ đóng vai trò dẫn hướng súc tích.
3. **Không dùng dữ liệu giả để tạo ảo giác đã có backend:** Bỏ bảng điểm/vé QR/số liệu bảo mật giả; mọi luồng cần backend ở giai đoạn UI phải ghi rõ là mẫu/prototype hoặc gắn trạng thái điều khiển rõ ràng.

---

## PHẦN B — FULL UI BLUEPRINT TOÀN BỘ MÀN HÌNH

### Blueprint 1: `/` — Trang chủ (`UI-02`)
- **Mục tiêu & Luồng chính:** Vào trang là thấy ngay khuôn viên trường trên màn hình lớn, bấm 1 lần vào ngay `/campus` hoặc sang `/events`.
- **Cấu trúc Desktop (`1440/1280`):**
  1. **Header (`64px`):** Logo + 4 mục (`Tham quan`, `Bản đồ`, `Open Day`, `Đăng nhập`).
  2. **Section 1 — Full-Viewport Hero (`min-h-[calc(100vh-64px)]`):**
     - Nền: Toàn cảnh 360° khuôn viên CVPM Quang Trung Q.12 (tắt tự xoay mặc định).
     - Góc trên trái: Nhãn vị trí gọn (`CVPM Quang Trung, Q.12`) + Tiêu đề H1 ngắn gọn + 2 nút CTA:
       - **CTA chính (`Primary`):** `Bắt đầu tham quan tự do` (`/campus`).
       - **CTA phụ (`Secondary Glass`):** `Khám phá Open Day` (`/events`).
     - Trên không gian panorama: 3–4 hotspot điểm nhấn nổi bật gắn đúng vị trí tòa nhà.
     - Góc dưới trái (Desktop): **Mini-map Card (`~240x150px`)** hiển thị sơ đồ khuôn viên thu gọn + nút `Mở Bản đồ GIS` (`/map`) — thiết kế theo Mẫu 01 (UA Virtual Tour).
     - Góc dưới phải: Bộ nút phóng to/thu nhỏ/đặt lại góc nhìn gọn nhẹ.
  3. **Section 2 — Giới thiệu ngắn cơ sở Q.12 (1 block sạch sẽ):** 1 đoạn giới thiệu 2–3 câu về không gian học tập thực hành tại QTSC kèm ảnh/3 điểm nổi bật cốt lõi (**không** dựng lại `CampusMetricsBar` 4 ô dày đặc).
  4. **Section 3 — Không gian Nổi bật (3–4 Cards):** Grid 3–4 thẻ (`Phòng Lab IT & Bán dẫn`, `Studio Apple iMac M3`, `Thư viện số`, `Khu Thể thao QTSC`), sửa lại link `?scene=` khớp chính xác với `/campus`.
  5. **Section 4 — Lịch Open Day Sắp tới (`1` Card Banner rộng):** Ngày, địa điểm QTSC Q.12, mô tả ngắn + nút `Xem lịch Open Day` (`/events`). (**Loại bỏ** `QuickAdmissionForm` và bỏ nút `/games`).
  6. **Footer:** Gọn nhẹ, không `/admin`, có cụm link ra `caodang.fpt.edu.vn`.
- **Cấu trúc Mobile (`768/390/360`):** Hero cao `72vh` giữ trọn H1 + 2 nút CTA trong viewport đầu; Mini-map thu thành nút chip nổi góc dưới trái `"Bản đồ QTSC"` trỏ `/map`; Grid không gian chuyển 1 cột (`grid-cols-1`).

---

### Blueprint 2: `/campus` — Tour 360° (`UI-02`)
- **Mục tiêu & Luồng chính:** Tham quan tự do mọi cảnh 360° hoặc đi theo lộ trình gợi ý, ẩn toàn bộ giao diện thừa chỉ bằng 1 bấm.
- **Cấu trúc Desktop (`1440/1280`):**
  1. **Immersive Topbar (`56px`)** hoặc giao diện full `100vh`:
     - **Canvas 360° (`100%` kích thước còn lại).**
     - **Góc trên trái (Floating Glass Card, max-w `320px`):** Tên cảnh hiện tại + Tòa nhà/Tầng + mô tả 2 dòng; nút `"Thông tin phòng"` để mở/đóng panel chi tiết.
     - **Góc trên phải (Floating Action Pills):**
       - Dropdown chọn cảnh (`Scene Selector Dropdown`) + Chế độ (`Tham quan tự do` / `Lộ trình gợi ý`).
       - Nút **`Hide UI`** (khi bấm: ẩn toàn bộ card/strip/zoom, chỉ giữ lại đúng 1 nút nhỏ góc trên phải **`Hiện UI`**).
     - **Trong không gian 360°:** Spatial Hotspot Markers theo tọa độ `yaw / pitch` — Click hotspot `scene` chuyển sang cảnh đích; Click hotspot `info` mở tooltip/card thông tin điểm nhấn (theo Mẫu 02 Zaha Hadid).
     - **Góc dưới trái:** Pill điều khiển **Zoom In / Zoom Out / Reset** xếp dọc nhỏ gọn.
     - **Dưới giữa:** **Thumbnail Scene Strip** gọn (`1` hàng ngang có nút cuộn trái/phải, max cao `84px`) cho phép nhảy nhanh giữa các cảnh đã chuẩn hóa (`thu-vien`, `lab-it`, `studio-imac`, `khuon-vien-qtsc`).
     - **Cạnh phải (Slide-over Drawer — ẩn mặc định):** Chỉ trượt ra khi người dùng bấm `"Xem thông tin"` (`width: 360px`, mô tả, thiết bị tiêu biểu, nút chuyển tới `/locations/[slug]` và `/map`).
- **Cấu trúc Mobile (`768/390/360`):**
  - Top bar thu gọn thành 1 pill tên cảnh + nút `Hide UI`.
  - Bỏ nút zoom rời (dùng pinch/drag trên canvas) hoặc giữ 1 nút thu nhỏ cực gọn.
  - Bottom strip cuộn ngang mượt (`height <= 72px`) không đè lên nút điều hướng.
  - Drawer chi tiết mở dạng **Bottom Sheet (`max-h-[60vh]`)** có nút đóng rõ ràng ở đỉnh.

---

### Blueprint 3: `/map` — Bản đồ GIS Khuôn viên (`UI-02`)
- **Mục tiêu & Luồng chính:** Hiển thị bản đồ tổng thể QTSC Q.12 sắc nét, bấm vào tòa nhà để xem tóm tắt và mở Tour 360° hoặc danh sách phòng.
- **Quyết định P0 bắt buộc:** **ẨN hoàn toàn tab `Mô hình 3D WebGL`** trong UI P0 (`Campus3DViewer.tsx` giữ nguyên mã trong repo cho P1/P2).
- **Cấu trúc Desktop (`1440/1280`):**
  1. **Top Control Bar (nổi trên mép trên bản đồ, 1 dòng thoáng):**
     - Trái: Tên **`Bản đồ Khuôn viên QTSC Q.12`** + ô Filter Layer Pills (`Tất cả`, `Giảng đường`, `Phòng Lab`, `Thể thao`, `Xe buýt`).
     - Phải: Nút **`Mở Tour 360°`** (`/campus`).
  2. **Vùng Bản đồ GIS Chính (`90%+` diện tích — cảm hứng Mẫu 03 Tilton Viewbook):**
     - Nền sáng sạch rõ đường nội bộ, cổng CVPM Quang Trung, khối tòa nhà T/Innovation, F, P, Sân thể thao.
     - **Custom GIS Pins** phân màu theo nhóm (`Giảng đường`, `Phòng Lab`, `Thể thao`, `Xe buýt`), hiển thị tooltip tên ngắn khi hover.
  3. **Card / Drawer Chi tiết Tòa nhà (`~340px`, góc trái hoặc góc phải cách lề `16px`):**
     - Ảnh đại diện tòa nhà + Mã tòa + Địa chỉ thực tế tại QTSC + Các khu chức năng chính.
     - **CTA chính:** **`Vào 360° Tòa này`** (`/campus?scene=...`).
     - **CTA phụ:** **`Xem danh sách phòng`** (`/locations?building=...` — sửa dứt điểm lỗi query filter).
  4. **Dưới giữa:** Thanh chip chọn nhanh các cụm chính (`Tòa Innovation / T`, `Tòa F`, `Tòa P`, `Khu Thể thao`, `Cổng QTSC`) không đè lên Drawer.
  5. **Góc dưới phải:** Cụm Zoom `+` / `-` / `1x`.
- **Cấu trúc Mobile (`768/390/360`):**
  - Filter Layer Pills cuộn ngang 1 dòng trên cùng (`height: 44px`).
  - Bản đồ hỗ trợ kéo/zoom mượt bằng tay.
  - Bấm vào Pin trên bản đồ mới mở **Bottom Sheet tóm tắt (`~42%` chiều cao)** để không che hết bản đồ; mặc định trên mobile có thể thu gọn bottom sheet để người dùng nhìn toàn cảnh bản đồ ngay khi vào.

---

### Blueprint 4: `/locations` & `/locations/[slug]` — Địa điểm (`UI-03`)
- **Mục tiêu & Luồng chính:** Tìm đúng phòng/xưởng theo tòa nhà hoặc tên, xem nhanh và nhảy vào 360°.
- **Cấu trúc `/locations` Desktop (`1440/1280`):**
  1. **Page Header gọn:** Breadcrumb + H1 `Danh mục Địa điểm & Phòng thực hành` + nút phụ `Xem trên Bản đồ` (`/map`).
  2. **Thanh Tìm kiếm & Bộ lọc (`1` dòng):** Input search (tìm theo tên/mã phòng) + Select/Tabs **Tòa nhà** (`Tất cả`, `Tòa Innovation / T`, `Tòa F`, `Tòa P`, `Khu Thể thao`) + Select/Tabs **Loại không gian** + Bộ đếm số kết quả khớp.
  3. **Grid Thẻ Địa điểm (`3` cột desktop, `2` cột tablet, `1` cột mobile — cảm hứng Mẫu 04):**
     - Ảnh `16:10` có tag nhỏ tên Tòa nhà/Tầng ở góc ảnh.
     - Tiêu đề phòng (tối đa 2 dòng) + Mô tả ngắn 1–2 dòng.
     - Footer thẻ gọn gàng: Link `Chi tiết` (`/locations/[slug]`) + Nút **`Xem 360°`** (`/campus?scene=...`).
     - *(Bỏ danh sách thiết bị dài, bảng thông số diện tích/sức chứa dày đặc khỏi mặt card ngoài danh mục).*
  4. **Empty State:** Hiển thị khi lọc không ra phòng + nút `Xóa bộ lọc`.
- **Cấu trúc `/locations/[slug]` Desktop & Mobile:**
  - Breadcrumb `Trang chủ / Địa điểm / Tên phòng`.
  - Cột trái (`8/12`): Ảnh không gian lớn + Mô tả công năng + Danh sách trang thiết bị chính + Gợi ý không gian cùng tòa nhà.
  - Cột phải (`4/12`): Card thông tin vị trí (Tòa nhà, Tầng, Mã phòng, Giờ mở cửa tham khảo) + **1 CTA chính:** **`Mở Không gian 360°`** (`/campus?scene=...`) + CTA phụ: `Định vị trên Bản đồ` (`/map`).
  - Dữ liệu đổ động 100% từ dataset chuẩn theo `slug` (kèm màn hình `404 / Không tìm thấy phòng` lịch sự khi sai `slug`).

---

### Blueprint 5: `/events` — Open Day (`UI-03`)
- **Mục tiêu & Luồng chính:** Phân tách rõ khách xem lịch công khai với người dùng có tài khoản được Admin cấp vào chương trình Open Day.
- **Cấu trúc Desktop (`1440/1280` — cảm hứng Mẫu 05 VU My Program):**
  1. **Hero Sự kiện (Gọn, không form đăng ký QR giả):**
     - Tên đợt Open Day + Ngày/Giờ diễn ra + Địa chỉ CVPM Quang Trung Q.12 + Trạng thái (`Đang mở đăng nhập chương trình` / `Sắp diễn ra`).
     - **CTA chính trên Hero:**
       - Nếu *chưa đăng nhập*: **`Đăng nhập tham gia Open Day`** (`/login?next=/events`) + mô tả *"Tài khoản tham dự được Ban Tổ Chức cấp trước."*
       - Nếu *đã đăng nhập (demo state P0)*: Hiển thị tên khách tham dự + badge `Đã kích hoạt chương trình` + nút chuyển nhanh xuống khu vực hoạt động.
  2. **Khối Lịch trình & Bản đồ Sự kiện (2 cột `7/12` + `5/12`):**
     - **Cột trái (Timeline Phiên theo giờ):** Tab chuyển đổi `Lịch trình theo giờ` / `Toàn bộ hoạt động` (`OpenDayScheduleTimeline`), mỗi phiên hiển thị giờ, tên hoạt động, tòa nhà/phòng check-in + link `Xem vị trí 360°`.
     - **Cột phải (Bản đồ Khu vực Open Day + Khối Gated Program):** Bản đồ GIS thu nhỏ đánh dấu các trạm Open Day tại QTSC + Panel **Chương trình Open Day Nội bộ**:
       - *Trạng thái Chưa đăng nhập:* Khung khóa tinh tế kèm danh sách quyền lợi khi tham gia (theo dõi lịch cá nhân, minigame check-in) và nút **`Đăng nhập bằng tài khoản được cấp`**.
       - *Trạng thái Đã đăng nhập:* Mở khóa trực tiếp khu vực **Chương trình của tôi** & **Minigame Open Day** (`OpenDayMiniGame`).
- **Cấu trúc Mobile (`768/390/360`):** Chuyển layout 2 cột thành 3 Tab rõ ràng ngay dưới Hero (`Lịch trình` | `Bản đồ trạm` | `Chương trình Open Day`) để không phải cuộn quá dài.

---

### Blueprint 6: `/games` — Minigame Tương tác (`UI-03`)
- **Mục tiêu & Luồng chính:** Hoạt động phụ trợ cho Open Day; đồng bộ cùng trạng thái trên `/events`.
- **Cấu trúc Desktop & Mobile:** Header gọn liên kết quay lại `/events`; Khối Quiz 5 câu hỏi (`CampusQuizStepper`) nằm giữa màn hình (`max-w-3xl`), nút chọn đáp án cao `>= 48px`; Kết quả hoàn thành hiển thị điểm ngay trong phiên (kèm ghi chú giao diện demo chờ kết nối Backend ở P1, bỏ nút chuyển về `/portal`).

---

### Blueprint 7: `/login` — Đăng nhập (`UI-04`)
- **Mục tiêu & Luồng chính:** Đăng nhập trung thực, rõ ràng, xử lý đầy đủ các trạng thái nghiệp vụ cho tài khoản được cấp sẵn.
- **Cấu trúc Desktop (`1440/1280`):**
  - `AuthLayout` 2 cột (`max-w-5xl` căn giữa):
    - **Cột trái (Thông tin hướng dẫn — nền `--color-inverse-surface` hoặc cam nhấn thương hiệu):** Logo FPT Polytechnic (`/images/fpt-logo-official.png`), tiêu đề `Cổng Tham Gia Open Day & Quản Trị Nội Bộ`, giải thích ngắn 2 nhóm sử dụng (Khách tham gia Open Day bằng tài khoản cấp sẵn; Nhân sự vận hành Admin). **Không chứa bất kỳ badge `ISO/IEC 27001`, `TLS 1.3`, `bcrypt`, `EduID 2.0 SSO`.**
    - **Cột phải (Card Form sạch sẽ):**
      - Chọn chế độ xem / test nhanh (chỉ phục vụ giai đoạn UI prototype): `Tài khoản mặc định` | `Lỗi sai mật khẩu` | `Tài khoản bị khóa` | `Bắt buộc đổi mật khẩu lần đầu`.
      - Form đăng nhập: Tên đăng nhập / Mã tài khoản, Mật khẩu (có nút hiện/ẩn), nút **CTA chính:** **`Đăng nhập`**.
      - Trạng thái **Đổi mật khẩu lần đầu** (render ngay trong card khi tài khoản cấp qua Import đăng nhập lần đầu): Nhập mật khẩu mới, xác nhận mật khẩu, thanh độ mạnh cơ bản, nút `Xác nhận & Vào Open Day`.
      - Mục `"Quên mật khẩu?"`: Mở hướng dẫn/modal liên hệ Ban Tổ Chức Open Day (không trỏ sang `/contact`).
- **Cấu trúc Mobile (`768/390/360`):** Ẩn/thu gọn cột mô tả trái thành banner header nhỏ trên card form, input cao `>= 44px`.

---

### Blueprint 8: `/portal` & Nhóm Route Chuyển tiếp (`/about`, `/contact`, `/news`, `/news/[slug]`) (`UI-04`)
- **Mục tiêu & Luồng chính:** Giữ nguyên URL để không gãy đường dẫn cũ trong khi hoàn thiện P0, dẫn người dùng về đúng trải nghiệm chính hoặc website `caodang.fpt.edu.vn`.
- **Cấu trúc chung (Desktop & Mobile):**
  - Container `max-w-2xl` căn giữa gọn gàng trên nền `surface`:
    - **Icon/Badge nhận diện** + **Tiêu đề rõ chức năng** + **Mô tả 2 dòng giải thích chuyển hướng**.
    - **CTA chính:** Link phù hợp:
      - `/portal`: `Vào Chương trình Open Day` (`/events`) + nút phụ `Tham quan 360° tự do` (`/campus`).
      - `/about`, `/news`, `/news/[slug]`: **`Xem thông tin chính thức tại caodang.fpt.edu.vn`** (`target="_blank"`) + nút phụ `Khám phá Campus 360°` (`/campus`).
      - `/contact`: Thông tin địa chỉ chính thức cơ sở CVPM Quang Trung, Q.12 + CTA mở **`caodang.fpt.edu.vn/lien-he`** (`target="_blank"`), **bỏ toàn bộ form tự nhập**.

---

### Blueprint 9: Hệ thống Admin P0 — `6` Màn hình (`UI-05`)

#### Cấu trúc Khung chung `AdminLayout`
- **Desktop (`>= 1024px`):** Sidebar trái rộng `256px` gồm đúng **6 mục P0**:
  1. `Dashboard` (`/admin`)
  2. `Địa điểm & GIS` (`/admin/locations`)
  3. `Tour 360° & Hotspot` (`/admin/virtual-tour`)
  4. `Sự kiện Open Day` (`/admin/events`)
  5. `Thư viện Media` (`/admin/media`)
  6. `Tài khoản & Import` (`/admin/users`)
  Kèm nút cuối sidebar: `Xem trang công khai` (`/`) + thông tin nhân sự vận hành.
- **Tablet & Mobile (`< 1024px`):** Top bar có nút Menu mở **Slide-over Sidebar Drawer**, vùng nội dung chuyển từ `Table` sang `Stacked Admin Cards` để không xuất hiện thanh cuộn ngang trang.

#### Chi tiết 6 Màn hình Admin P0:
1. **`/admin` (Dashboard):**
   - 4 thẻ thống kê đúng phạm vi P0 (`Tổng số Địa điểm`, `Số Cảnh 360°`, `Sự kiện Open Day`, `Tài khoản đã cấp`) + Nhãn ghi rõ dữ liệu mẫu UI.
   - 2 khối bên dưới: (Trái) Lịch Open Day & hoạt động cập nhật gần đây; (Phải) Phím tắt nhanh tới 5 module P0 (`+ Thêm địa điểm`, `+ Tạo cảnh 360°`, `+ Tạo sự kiện`, `Upload Media`, `Import tài khoản`).
2. **`/admin/locations` (Địa điểm & GIS):**
   - Header bar (`H1` + **CTA chính `+ Thêm địa điểm`**).
   - Filter bar (Tìm theo tên/mã, lọc theo Tòa nhà, lọc trạng thái `Hiển thị / Nháp`).
   - Bảng dữ liệu (Tên, Mã, Tòa nhà/Tầng, Scene 360° liên kết, Tọa độ GIS `(x, y)`, Trạng thái, Sửa/Xóa).
   - Modal Tạo/Sửa có trình click chọn trực tiếp tọa độ `(x, y)` trên sơ đồ mini khuôn viên QTSC + Hộp thoại xác nhận xóa.
3. **`/admin/virtual-tour` (Tour 360° & Hotspot):**
   - Chia 2 cột trên Desktop:
     - Cột trái (`4/12`): Danh sách Scene theo thứ tự tour (kèm nút lên/xuống sắp xếp thứ tự, trạng thái, nút **`+ Tạo cảnh mới`**).
     - Cột phải (`8/12`): Khung Preview 360°/Ảnh panorama của cảnh đang chọn + Danh sách Hotspot của cảnh (`label`, `type: info | scene`, `yaw/pitch`, `targetScene`) + nút **`+ Thêm Hotspot`** (nhập hoặc click đặt vị trí).
4. **`/admin/events` (Sự kiện & Lịch Open Day):**
   - Bảng/Thẻ danh sách các kỳ Open Day (`Tên sự kiện`, `Ngày diễn ra`, `Cổng truy cập: Yêu cầu tài khoản / Công khai`, `Trạng thái`) + nút **`+ Tạo sự kiện`**.
   - Drawer/Tab quản lý chi tiết từng **Phiên lịch trình (Sessions)** thuộc sự kiện: Thêm/sửa/xóa khung giờ, địa điểm tòa nhà, bật/tắt trạng thái công khai hoặc giới hạn tài khoản.
5. **`/admin/media` (Thư viện Media & Ảnh 360°):**
   - Dropzone tải file lên (`JPG/PNG/WebP`, hỗ trợ lọc `Tất cả`, `Ảnh 360° Equirectangular`, `Ảnh Phòng & Tòa nhà`).
   - Grid thẻ Media (`4` cột desktop, `2` cột mobile): Thumbnail, Tên file, Tag loại ảnh, Kích thước hiển thị; Nút nhanh `Xem 360°` (nếu là panorama), `Copy URL`, `Xóa` (có cảnh báo nếu đang gắn vào Scene/Location).
6. **`/admin/users` (Tài khoản & Import Danh sách):**
   - Header với 2 nút hành động rõ ràng: **`+ Cấp tài khoản lẻ`** và **`Import danh sách CSV`** (gộp chức năng `/admin/import` & `Roles`).
   - Bảng danh sách tài khoản: Tên đăng nhập/Mã SV-Khách, Họ tên, Vai trò (`Open Day Guest` / `Admin`), Trạng thái (`Chưa đổi MK lần đầu` / `Hoạt động` / `Đã khóa`), Lần truy cập cuối, Hành động (`Đặt lại MK`, `Khóa/Mở`).
   - Modal **Import CSV**: Tải file CSV mẫu -> Chọn/kéo thả file -> Xem bảng preview phân tách dòng hợp lệ vs dòng lỗi (trùng mã, thiếu cột) -> Bấm xác nhận cấp danh sách.
