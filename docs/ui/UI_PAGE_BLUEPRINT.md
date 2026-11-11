# UI_PAGE_BLUEPRINT — Bản Thiết Kế Chi Tiết Từng Màn Hình (`19` P0 Screens)

> **Chuẩn đối soát:** Bản thiết kế này bao phủ trọn vẹn **19 màn hình P0** (14 route hiện có + 5 route Admin P0 mới) trên 3 ngưỡng khung hình (**Desktop `1280–1440px` · Tablet `768px` · Mobile `360–390px`**).  
> **Nguyên tắc vàng:** Mỗi trang chỉ có **1 mục tiêu chính**; không biến Virtual Campus thành cổng tuyển sinh thứ hai; không hiển thị công nghệ/dữ liệu chưa có thật (3D GLB, "4K", "Marzipano", "ISO 27001").

---

## MỤC A — TRẢI NGHIỆM CÔNG KHAI & KHÁM PHÁ TỰ DO (`/` · `/campus` · `/map` · `/locations` · `/locations/[slug]` · `/events`)

### 1. Trang chủ `/` (`src/app/(public)/page.tsx`)
- **Mục đích & Người dùng:** Điểm chạm đầu tiên cho học sinh THPT, phụ huynh và khách ghé thăm — vào là thấy khuôn viên QTSC Quận 12 và có thể bắt đầu tham quan ngay trong 1 chạm không cần đăng nhập.
- **Thứ tự thị giác (Hierarchy) & Above the Fold:**
  1. Khung Hero khuôn viên (`calc(100vh - 64px)`, tối đa `780px`, `min-h-[520px]` desktop / `min-h-[460px]` mobile): nền ảnh Panorama/Khuôn viên Q.12 sắc nét, **chỉ 2 điểm neo UI sạch** (Tiêu đề + Primary/Secondary CTA gọn góc dưới-trái trên gradient mờ chân ảnh + Nút xoay/Toàn màn hình nhỏ góc dưới-phải; **xóa bỏ hoàn toàn** thẻ info mở sẵn che góc trái, badge `"VR 4K"`, thanh hint nổi giữa ảnh, và la bàn lớn góc trên phải).
  2. **Primary CTA:** `Bắt đầu tham quan tự do` → `/campus`
  3. **Secondary CTA:** `Khám phá Open Day` → `/events`
- **Các khối nội dung dưới màn hình đầu (Below the Fold — Tối đa 3 section gọn):**
  1. **Section 1 — Định hướng nhanh Khuôn viên QTSC Q.12:** Mô tả ngắn 2–3 câu về không gian công nghệ phần mềm Quang Trung + 2 thẻ lối vào chính (`Tour 360° Khuôn viên` → `/campus`, `Bản đồ GIS các tòa nhà` → `/map`). *(Thay thế hoàn toàn `CampusMetricsBar` 97.7% & 300+ doanh nghiệp).*
  2. **Section 2 — Điểm đến nổi bật (4 thẻ):** Ảnh + Tên + Tòa nhà + CTA `Xem 360°` liên kết tới **đúng ID scene hợp lệ** (`/campus?scene=thu-vien`, `/campus?scene=lab-it`, `/campus?scene=studio-imac`, hoặc `/locations`). *(Không gán sai ID `it-lab`, `automation`, `studio`, `sports-field`).*
  3. **Section 3 — Open Day Sắp Diễn Ra (1 thẻ ngang cô đọng):** Ngày giờ sự kiện + tóm tắt 1 dòng + CTA `Xem lịch trình Open Day` (`/events`) và link nhỏ `Đã có tài khoản? Đăng nhập` (`/login`). *(Xóa bỏ `QuickAdmissionForm`, xóa `VirtualTourShowcase` "Marzipano/Leaflet").*
- **Bố cục Responsive:**
  - `1440px / 1280px`: Hero full-bleed trong `max-w` hoặc edge-to-edge có khối text góc dưới trái (`max-w-xl`), 4 thẻ điểm đến dạng `grid-cols-4`.
  - `768px`: 4 thẻ điểm đến dạng `grid-cols-2`.
  - `390px / 360px`: Hero cao `~520px`, 2 CTA xếp dọc full-width `min-h-[44px]`, lưới điểm đến `grid-cols-1`. Không tràn ngang `scrollWidth <= innerWidth`.
- **Trạng thái bắt buộc:** Panorama Idle, Panorama Loading (nền `fpt-concept-hero.jpg` hoặc `fpoly-campus-aerial.jpg` cục bộ làm poster ngay tức thì để LCP nhanh), Panorama Texture Error (giữ nguyên ảnh khuôn viên tĩnh sạch + ẩn hotspot, không hiển thị màn hình đen).
- **Đối chiếu Stitch & Tham chiếu Chủ dự án:** Bác bỏ `fpt_polytechnic_virtual_campus_360_trang_ch.png` (Stitch quá nhiều tab cơ sở, stats tuyển sinh `97.7%`, và banner `Nộp hồ sơ`). Áp dụng tinh thần **The University of Alabama reference**: Hero mở thoáng ngay khuôn viên + CTA rõ + nội dung hỗ trợ tiết chế.
- **Yêu cầu Asset thực tế:** Dùng `fpt-concept-hero.jpg` / `fpoly-campus-aerial.jpg` (hoặc ảnh panorama 2:1 equirectangular được upload qua `/admin/media`), xóa phụ thuộc `lh3.googleusercontent.com`.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - 0 form tuyển sinh hoặc thẻ tin tức trên `/`.
  - 100% link `?scene=` khớp chính xác scene ID tồn tại.
  - Hero có ≤ 3 phần tử UI nổi, không có popup/card thông tin mở sẵn che panorama.

---

### 2. Tour 360° Không Gian (`/campus` — `src/app/(immersive)/campus/page.tsx`)
- **Mục đích & Người dùng:** Trải nghiệm cốt lõi giúp khách tham quan di chuyển giữa các phòng Lab, Thư viện, Studio, Sảnh bằng góc nhìn 360°.
- **Bố cục Desktop (`1280–1440px`) & Tablet (`768px`):**
  - **Không gian Panorama chiếm ≥ 90% viewport** dưới thanh header 56px của `(immersive)/layout.tsx`.
  - **Khu vực HUD nổi tối đa 3 cụm neo cố định (có nút `Ẩn UI` thu gọn toàn bộ về 1 nút `Hiện UI`):**
    1. **Top-Left Compact Pill (`max-w-[340px]`):** Tên tòa nhà / tên cảnh hiện tại + nút bấm `Chi tiết` (mở `TourInfoDrawer` trượt phải — mặc định **ĐÓNG**).
    2. **Top-Right Action Capsule:** Dropdown chọn cảnh theo danh mục/tầng (thay thế dãy nút tầng dài chiếm chỗ) + Nút **`Ẩn UI` (`Hide UI`)** + Nút **`Toàn màn hình` (`Fullscreen`)**.
    3. **Bottom Controls:** Cụm Zoom gọn (`+` / `-` / Reset góc nhìn) đặt bên phải; dải chọn cảnh ngang mảnh (`max-h-[76px]`, thu gọn được bằng toggle) nằm chính giữa cạnh đáy, **không che phần trung tâm ảnh**.
- **Bố cục Mobile (`360–390px`):**
  - Top-Left hiển thị ngắn 1 dòng Tên cảnh + icon `(i)` mở Bottom Sheet (`<= 45vh`).
  - Top-Right giữ gọn 2 nút chạm `44×44px`: `Chọn cảnh` (mở Bottom Sheet danh sách cảnh + ô tìm phòng) + `Ẩn UI`.
  - **Không mở Bottom Sheet danh sách phòng che 40% màn hình mặc định** (khắc phục nhược điểm của Stitch `page_03` mobile).
- **Tương tác Hotspot & Hiệu năng Kỹ thuật UI:**
  - Hotspot trong không gian 3D hiển thị dạng điểm neo nhỏ gọn (mũi tên đi bộ `scene` màu cam, biểu tượng `i` `info` màu xanh). Card nhãn/thông tin hotspot **chỉ bung ra khi hover (desktop) hoặc tap (mobile)** — không mở hàng loạt nhãn đè lên nhau.
  - Sửa kiến trúc React + Three.js: Giữ nguyên **1 `WebGLRenderer` duy nhất**, chỉ đổi texture khi chuyển `?scene=`; cập nhật tọa độ hotspot & góc la bàn bằng **DOM `ref.style.transform`** thay vì `setState` 60 lần/giây.
- **Trạng thái UI bắt buộc:**
  1. `Loading`: Thanh progress mảnh + spinner sạch (giữ cảnh trước đó mờ nhẹ nếu đang chuyển cảnh).
  2. `Texture Error`: `ErrorState` gọn giữa khung với nút `Thử lại tải cảnh` và nút quay về cảnh danh sách.
  3. `Hide UI Mode`: Ẩn sạch Top-Left, Bottom Bar, Hotspots (tùy chọn giữ lại nút nhỏ góc trên phải `Hiện giao diện`).
  4. `Touch Hint`: Chỉ hiện 1 lần `3 giây` rồi tự ẩn (hoặc tắt khi người dùng chạm màn hình).
  5. `Drawer Open`: Mở thông tin mô tả cảnh + trang thiết bị chính + link tới `/locations/[slug]`.
- **Đối chiếu Stitch & Tham chiếu:** Phản biện `page_03_virtual_campus_360_exploration_mobile.png` (bỏ Bottom Sheet chiếm 40% mặc định, bỏ chip `4K 360°`, bỏ thanh Bottom Tab Bar 4 nút thừa); áp dụng bố cục **Ground Cafe (Heydar Aliyev) reference**: Panorama mở rộng tối đa, nút `Dropdown + Hide UI` góc phải trên, zoom gọn, hotspot tối giản.
- **Yêu cầu Asset thực tế:** Bắt buộc cung cấp **ảnh Panorama Equirectangular tỷ lệ 2:1** lưu cục bộ hoặc qua Media CDN (không dùng ảnh chữ nhật 16:9 gây vết ghép dọc giữa màn hình).
- **Tiêu chí nghiệm thu:**
  - Diện tích panorama không bị che phủ đạt **≥ 90% viewport** ở trạng thái mặc định.
  - Chuyển đổi 20 scene liên tiếp không tái tạo `WebGLRenderer` và không lỗi WebGL Context Lost.
  - Có nút `Hide UI` hoạt động đúng cả Desktop & Mobile.

---

### 3. Bản Đồ Khuôn Viên GIS (`/map` — `src/app/(immersive)/map/page.tsx`)
- **Mục đích & Người dùng:** Giúp người dùng hình dung mặt bằng tổng thể CVPM Quang Trung Q.12 (các khối Tòa nhà T, F, P, Khu Thể thao, Cổng/Lối đi), tìm tòa nhà và nhảy thẳng vào Tour 360° bên trong.
- **Quyết định Kiến trúc bắt buộc:**
  - **Mặc định mở thẳng Bản đồ GIS 2D nền sáng (Light Cartographic Map)**.
  - **BỎ thanh sub-bar trùng lặp** (`Mô hình 3D WebGL | Bản đồ GIS 2D | Vào Tour 360°`) ngay dưới Header 56px của `(immersive)/layout.tsx`.
  - **KHÔNG hiển thị tab/nút `Mô hình 3D WebGL`** ở giao diện công khai P0 khi `public/models/` đang có **0 tệp `.glb`** (chỉ bật lại ở P2 khi có mô hình CAD/GLB thật).
- **Bố cục Desktop (`1280–1440px`) & Tablet (`768px`):**
  - Toàn bộ khung dưới header 56px là bản đồ khuôn viên QTSC sáng sủa, đường nội bộ, mảng xanh, nhãn rõ ràng.
  - **Top-Left Floating Toolbar:** 1 thanh mảnh gồm ô tìm tòa nhà/phòng nhanh + 3–4 chip lọc loại điểm (`Tất cả`, `Tòa đào tạo`, `Phòng Lab & Xưởng`, `Tiện ích / Thể thao`).
  - **Pin Tòa nhà trên bản đồ:** Pin mặc định navy `#041b3c`; Pin đang chọn nổi bật màu cam `#f36f21` kèm nhãn tên ngắn (không hiện thẻ to che bản đồ).
  - **Bottom-Left Legend + Bottom-Right Zoom (`+ / - / Căn giữa`):** Gọn sát góc, **tuyệt đối không xếp 2 thanh ngang đè nhau** như `CampusGISMap.tsx` cũ.
  - **Drawer Chi tiết Tòa nhà (`BuildingDetailDrawer`):** **MẶC ĐỊNH ĐÓNG khi mới vào trang**. Khi bấm chọn tòa nhà, mở 1 bảng trượt bên phải (`max-w-[360px]`) hiển thị: Tên tòa nhà, ảnh đại diện tòa, mô tả ngắn các khu vực chính, **CTA chính `Khám phá 360° bên trong`** (`/campus?scene=<valid-slug>`), **CTA phụ `Xem danh sách phòng` (`/locations?building=<buildingCode>`)**, và nút Đóng (`Esc`).
- **Bố cục Mobile (`360–390px`):**
  - Thanh tìm & chip lọc cuộn ngang (`scrollbar-none`) sát mép trên; zoom button `44×44px` ở góc phải.
  - Khi bấm pin tòa nhà: mở **Compact Bottom Sheet (`max-h-[42vh]`)** gồm Tên tòa, 1 dòng mô tả, và nút `Xem 360°` + `Danh sách phòng` — bản đồ phía trên vẫn nhìn thấy được >55%.
- **Trạng thái UI bắt buộc:** Unselected Clean Map (mặc định), Building Selected (mở 1 Drawer phải / Bottom Sheet), Search No Results (gợi ý xóa từ khóa), Category Empty, `?building=<id>` Deep-link preselect.
- **Đối chiếu Stitch & Tham chiếu:** Học **Tilton Viewbook** & **Stitch `page_05`** ở bảng màu sáng kiến trúc và pin chọn rõ ràng; **BÁC BỎ** bố cục 2 sidebar trái + phải mở đồng thời trong `page_05` desktop làm bóp nghẹt bản đồ.
- **Tiêu chí nghiệm thu:**
  - Tab/nút `"Mô hình 3D WebGL"` bị loại bỏ ở P0.
  - Vào `/map` trên `390px` mobile nhìn thấy ≥ 85% diện tích bản đồ ngay lập tức (Drawer không tự mở).
  - Bấm `"Xem danh sách phòng"` từ Tòa F lọc chính xác các phòng Tòa F bằng mã `buildingCode`.

---

### 4. Danh Mục Địa Điểm (`/locations` — `src/app/(public)/locations/page.tsx`)
- **Mục đích & Người dùng:** Cho phép người dùng tìm, lọc theo tòa nhà/chức năng và quyết định nhanh không gian nào muốn xem 360° hoặc xem chi tiết.
- **Bố cục & Cấu trúc Trang:**
  - **Page Header Gọn:** Tiêu đề `Khám phá Không gian & Phòng thực hành`, mô tả trung thực 1 dòng (bỏ số giả `"50+ phòng học"`), nút phụ `Xem trên Bản đồ GIS` → `/map` *(thay cho `"Xem Bản Đồ 3D"`).*
  - **Filter Bar 1 hàng (`sticky` tùy chọn nhẹ):** SearchInput + Select chọn Tòa nhà (`Tất cả tòa nhà`, `Tòa Nhà T`, `Tòa Nhà F`, `Tòa Nhà P`, `Tòa Nhà Innovation`, `Khu Thể Thao`) + Pills nhóm không gian (*Tất cả*, *Phòng Lab CNTT*, *Studio & Đồ họa*, *Thư viện & Chung*). Đọc/ghi URL param chính xác (`?building=TOA-F`).
  - **Lưới thẻ (`LocationCard`):** `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`, gap `20px`.
    - **Nội dung bên trong mỗi thẻ (Tối đa 4 yếu tố theo Card Budget):**
      1. Ảnh `aspect-video` sạch (`next/image`, tối đa 1 badge tòa nhà ở góc ảnh, bỏ chữ `"Sẵn sàng phục vụ"` nhấp nháy).
      2. Tên địa điểm (`type-h3`, `line-clamp-2`).
      3. Tóm tắt ngắn 1–2 dòng nói rõ không gian này dùng để học/trải nghiệm gì *(bỏ sức chứa, diện tích `m²`, và 3 badge phần cứng)*.
      4. Footer gọn gồm **Nút `Xem 360°`** (`/campus?scene=<valid-slug>` nếu có scene) + **Link chữ `Chi tiết →`** (`/locations/[slug]`).
- **Trạng thái UI bắt buộc:**
  - `LoadingState`: 6 thẻ skeleton khi tải API/dữ liệu.
  - `EmptyState` *(hiện đang thiếu hoàn toàn)*: Khi tìm kiếm/lọc ra 0 kết quả → hiện hộp thông báo `"Không tìm thấy không gian phù hợp với bộ lọc"` + nút `Đặt lại bộ lọc`.
- **Tiêu chí nghiệm thu:**
  - `?building=` lọc chính xác từng tòa nhà dựa trên `buildingCode`, không dùng chuỗi con `"t"`.
  - Mỗi thẻ không chứa quá 1 badge, không chứa chấm trạng thái nhấp nháy hay chip phần cứng.

---

### 5. Chi Tiết Địa Điểm (`/locations/[slug]` — `src/app/(public)/locations/[slug]/page.tsx`)
- **Mục đích & Người dùng:** Cung cấp đủ ngữ cảnh giúp người xem quyết định khám phá 360° hoặc biết vị trí của phòng học/xưởng cụ thể tại QTSC Q.12.
- **Cấu trúc trang (Đọc động từ `slug`, không dùng dữ liệu cứng):**
  1. **Breadcrumb:** `Trang chủ / Địa điểm / [Tên Địa Điểm]`.
  2. **Hero 2 cột (`lg:grid-cols-12`, mobile xếp dọc):** Trái (7 cột) = Ảnh thực tế (`next/image` không dùng `<img>` thô) kèm nút nổi nếu có Tour 360°. Phải (5 cột) = Badge Tòa nhà + Tầng, Tên phòng (`type-h1`), mô tả rõ ràng, **CTA chính `Mở Tour 360° tại đây` (`/campus?scene=<room.sceneId>`)**, **CTA phụ `Định vị trên Bản đồ GIS` (`/map?building=<room.buildingCode>`)**. *(Gỡ bỏ CTA `"Đăng ký tham quan ngay"` sang tuyển sinh).*
  3. **Thông tin bổ trợ có kiểm chứng (Tối đa 2 khối sạch):** Điểm nổi bật của không gian & Thiết bị/công năng thực tế *(chỉ hiển thị các thuộc tính có dữ liệu thật trong cấu hình, bỏ thông số cứng `"95 m² / 45 Chỗ / 1 Gbps"`)*; Danh sách 2–3 phòng lân cận cùng tòa nhà để tiếp tục khám phá.
- **Trạng thái UI bắt buộc:** `NotFoundState` rõ ràng khi `slug` không hợp lệ (kèm nút về `/locations`); trạng thái phòng chưa có ảnh 360° (disable hoặc thay CTA 360° thành `Xem vị trí trên Bản đồ GIS`).
- **Đối chiếu Stitch:** Tinh giản từ `page_06_building_and_room_details_desktop/mobile.png` — bỏ 10 thẻ thông số dày đặc và sơ đồ CAD giả định.

---

### 6. Lịch Trình & Thông Tin Open Day (`/events` — `src/app/(public)/events/page.tsx`)
- **Mục đích & Người dùng:** Thông báo công khai thông tin & lịch trình Ngày hội Open Day tại QTSC Q.12, đồng thời **phân tách rõ ràng** phần xem tự do với phần hoạt động giới hạn chỉ dành cho tài khoản được Admin cấp.
- **Cấu trúc 4 khối minh bạch:**
  1. **Hero Sự Kiện Công Khai:** Chủ đề kỳ Open Day gần nhất tại QTSC Q.12 (ngày, khung giờ, địa điểm tập trung Tòa Innovation / Lô 24). **CTA chính:** `Đăng nhập tham gia Open Day` (`/login?next=/portal`) · **CTA phụ:** `Xem sơ đồ điểm tập trung` (`/map`).
  2. **Lịch Trình Công Khai Theo Khung Giờ (Public Schedule):** Tab lọc `Tất cả / Buổi sáng / Buổi chiều`; mỗi dòng gồm Giờ (`tabular-nums`), Tên phiên, Địa điểm trên khuôn viên, và **Nhãn phân loại rõ ràng**: `Công khai (Tự do)` hoặc `Dành riêng tài khoản được mời`.
  3. **Phân Tách Quyền Tham Dự (Clear Boundary Banner — 2 cột):**
     - *Cột Trái (Khách tham quan tự do):* Xem lịch trình công khai, đi Tour 360° & Bản đồ khuôn viên bất cứ lúc nào không cần tài khoản.
     - *Cột Phải (Hoạt động Open Day chuyên sâu & Check-in QR):* Dành cho khách mời / học sinh / phụ huynh đã được Ban tổ chức cấp tài khoản qua Zalo/Email. **Nút hành động `Mở Không gian Tham dự` (`/login?next=/portal`)**. *(Loại bỏ hoàn toàn `TicketRegistrationModal` tự phát mã VIP giả `POLY-VIP-2025-9821` và loại bỏ vòng quay `OpenDayMiniGame` chơi tự do giữa trang công khai).*
  4. **FAQ Về Cách Tham Dự Open Day:** 4–5 câu hỏi ngắn trả lời cách nhận tài khoản mời từ nhà trường, địa điểm QTSC, mang theo gì khi đến.
- **Đối chiếu Stitch & Tham chiếu Chủ dự án:** Kết hợp phân biệt quyền từ `page_07_fpt_polytechnic_open_day_desktop.png` với bố cục lịch trình & bản đồ tham chiếu **Victoria University (`openday.vu.edu.au`)**.

---

## MỤC B — XÁC THỰC & KHÔNG GIAN THAM DỰ OPEN DAY (`/login` · `/portal`)

### 7. Đăng Nhập Tài Khoản Được Cấp (`/login` — `src/app/(auth)/login/page.tsx`)
- **Mục đích & Người dùng:** Điểm đăng nhập duy nhất cho Người tham dự Open Day (khách mời/học sinh/phụ huynh được cấp tài khoản) và Nhân sự vận hành (`/admin`), hoạt động trên `(auth)/layout.tsx`.
- **Thiết kế Bố Cục & Nội dung Trung thực:**
  - Giao diện 1 cột thẻ trung tâm (`max-w-md` hoặc split 2 cột gọn `max-w-4xl` trên desktop, nhưng cột giải thích bên trái chỉ nói đúng vai trò **Virtual Campus & Open Day**).
  - **Loại bỏ 100% nội dung sai sự thật:** Xóa `"Cổng Định Danh Số EduID 2.0"`, `"SSO"`, `"MÃ HÓA TLS 1.3 & HASH BCRYPT"`, `"TIÊU CHUẨN ISO/IEC 27001"`; **không điền sẵn** `PS24180` / `polytechnic2025` vào ô input.
  - **Hướng dẫn tài khoản trung thực:** Khối ghi chú nhỏ gọn ngay dưới tiêu đề: *"Sử dụng tài khoản & mật khẩu tạm được Ban Tổ Chức gửi qua Zalo/Email để truy cập lịch trình Open Day cá nhân và vé QR check-in."*
  - **Link phụ trợ:** `Chưa có tài khoản? Xem thông tin Open Day công khai` (`/events`) và `Cần hỗ trợ tài khoản?` (mở hướng dẫn tại chỗ thay vì nhảy sang `/contact`).
- **6 Trạng thái UI bắt buộc (Design Complete Flow Matrix — Không có Stitch PNG):**
  1. `Default`: Ô tài khoản trống (`placeholder="Ví dụ: OD-2026-1042 hoặc email"`), ô mật khẩu có nút hiện/ẩn (`min-h-[44px]`), nút `Đăng nhập`.
  2. `Validation Error`: Báo lỗi ngay dưới trường thiếu (`Input error="..."`).
  3. `Invalid Credentials`: Banner cảnh báo lỗi rõ ràng *"Mã tài khoản hoặc mật khẩu chưa chính xác. Vui lòng kiểm tra lại tin nhắn cấp tài khoản."*
  4. `Account Locked / Inactive`: Trạng thái thông báo tài khoản đang bị khóa hoặc chưa đến thời gian kích hoạt sự kiện + thông tin liên hệ BTC Open Day.
  5. `Forced First-Login Password Change View`: Khi tài khoản mới từ CSV/Excel có cờ `mustChangePassword = true`, ngay trong khung `(auth)` chuyển mượt sang **biểu mẫu Đổi mật khẩu bắt buộc lần đầu** (Mật khẩu mới + Xác nhận mật khẩu + tiêu chí độ dài tối thiểu) trước khi vào `/portal` hoặc `/admin`.
  6. `Forgot Password Guidance View`: Modal hoặc chế độ chuyển đổi tại chỗ hướng dẫn liên hệ điều phối viên Open Day/Admin để cấp lại mật khẩu tạm (vì đây là hệ thống tài khoản cấp kín).

---

### 8. Không Gian Tham Dự Open Day (`/portal` — `src/app/(portal)/portal/page.tsx`)
- **Mục đích & Người dùng:** Không gian làm việc riêng của người tham dự đã đăng nhập bằng tài khoản được cấp (thay thế hoàn toàn định hướng *"Cổng dịch vụ Phụ huynh & Sinh viên + 450 XP học bổng"* cũ).
- **Bảo vệ & Điều kiện truy cập:**
  - Nếu chưa có phiên hợp lệ (ở bản UI Prototype hoặc trước khi nối Backend), hiển thị màn `AuthGateState` rõ ràng yêu cầu đăng nhập tại `/login?next=/portal` (không hiển thị trực tiếp thông tin giả của `PS24180` cho khách vô danh).
- **Cấu trúc Bố cục (Lấy cảm hứng `My program` Open Day + Không có Stitch PNG):**
  1. **Header cá nhân (Compact):** Tên người tham dự + Mã tài khoản mời + Nhãn trạng thái phiên (`Đang mở khóa Open Day`) + nút `Đổi mật khẩu` (nếu cần) + nút `Đăng xuất` rõ ràng *(trước đây thiếu nút Đăng xuất thật)*.
  2. **Tab / Chế độ nội dung 3 phần gọn trên Mobile & Desktop (`max-w-6xl`):**
     - **Khối 1 — Vé Check-in QR Open Day:** Hiển thị mã vé duy nhất theo phiên người dùng, thời gian & cổng check-in tại QTSC Q.12, độ tương phản cao (sửa lỗi chữ mờ `Tải file PDF` trên nền tối ở bản cũ), nút `Lưu / In thẻ tham dự` mở hộp in chuẩn thay vì `alert()`.
     - **Khối 2 — Chương trình của tôi (`Lịch đã đăng ký` / `Toàn ngày`):** Lộ trình các phiên workshop, check-in, trải nghiệm Lab theo giờ thực tế, nút `Xem trước không gian 360°` (`/campus?scene=<valid>`) và `Định vị phòng` (`/map`).
     - **Khối 3 — Hoạt động Tương tác & Thử thách Open Day:** Khu vực tham gia Quiz / Mini-activity có kiểm soát dành riêng cho khách mời Open Day *(nơi chuyển phần hợp lệ từ `/games` và minigame về đúng ngữ cảnh được cấp quyền).*

---

## MỤC C — HỆ THỐNG ADMIN VẬN HÀNH NỘI BỘ (`6` Màn Hình P0 trong `/admin` & `/admin/*`)

> **Thẩm mỹ & Nguyên tắc Admin (`admin/layout.tsx` 6 module P0):**  
> Từ chối kiểu Dashboard trưng bày 4 thẻ KPI lớn phóng đại. Mỗi trang Admin là **công cụ tác vụ vận hành trực diện** (lấy chuẩn mật độ thông tin gọn từ *Homies Lab reference*), dùng `DataTable`, bộ lọc tìm kiếm, Drawer chỉnh sửa bên phải, và hộp thoại xác nhận rõ ràng trước tác vụ phá hủy. *(Không có Stitch PNG cho toàn bộ 6 màn hình Admin).*

### 9. Tổng Quan Tác Vụ Vận Hành (`/admin` — `src/app/admin/page.tsx`)
- **Mục tiêu:** Trả lời trong 5 giây cho người vận hành: *"Hôm nay cần làm gì, có cảnh/địa điểm nào chưa xuất bản hoặc bị thiếu media chuẩn, tình trạng sự kiện & danh sách tài khoản mới import ra sao?"*
- **Cấu trúc Bố cục (Thay thế hoàn toàn `AdminDashboardMetrics` 142.850 & 6 lối tắt public):**
  1. **Header tác vụ:** Tiêu đề `Bảng Tác Vụ Vận Hành Campus` + `4 nút hành động trực tiếp` trỏ tới **4 route Admin nội bộ** (`+ Thêm Địa điểm` `/admin/locations`, `+ Tạo Scene 360°` `/admin/virtual-tour`, `Import Tài khoản` `/admin/users`, `Quản lý Open Day` `/admin/events`).
  2. **Cụm 1 — Hàng Đợi Cần Xử Lý (Action Queue Table):** Liệt kê các mục đang cần can thiệp (VD: Scene 360° chưa đạt tỷ lệ 2:1 / chưa gắn hotspot, Địa điểm ở trạng thái `Draft`, Phiên Open Day sắp mở check-in, File import còn dòng lỗi) kèm nút `Mở xử lý` dẫn thẳng sang module tương ứng.
  3. **Cụm 2 (2 cột): Tóm tắt Sức khỏe Dữ liệu Thật & Nhật ký Thao tác gần nhất:** Đếm chính xác theo trạng thái (`3` Scene hoạt động / Nháp, `6` Địa điểm, Tài khoản đã cấp / Đã đổi MK lần đầu) + Bảng nhật ký hành động nội bộ (`Admin`, `Operator` thực hiện thao tác gì, lúc nào).

### 10. Quản Lý Địa Điểm & Bản Đồ GIS (`/admin/locations` — *Mới P0*)
- **Mục tiêu:** Tạo, cập nhật, gắn tọa độ trên bản đồ GIS và xuất bản Tòa nhà / Phòng học / Xưởng thực hành QTSC Q.12.
- **Cấu trúc 2 tab hoặc Drawer kết hợp:**
  - **Toolbar:** Ô tìm kiếm + Lọc theo Tòa nhà (`Tòa Innovation`, `Tòa T`, `Tòa F`, `Tòa P`, `Thể thao`) + Lọc Trạng thái (`Published / Draft`) + Nút `+ Thêm Địa điểm mới`.
  - **DataTable chính:** Cột `Mã & Tên không gian` | `Tòa nhà & Tầng` | `Liên kết Scene 360°` | `Tọa độ GIS` | `Trạng thái` | `Thao tác (Sửa / Xem 360° / Ẩn)`.
  - **Slide-over Editor Drawer (`520px`):** Nhập thông tin tinh gọn (Tên, Slug, Tòa nhà, Mô tả ngắn hiển thị Card, Mô tả chi tiết, Ảnh đại diện chọn từ `/admin/media`), **Khung Chọn Pin Bản đồ GIS trực quan** (click lên mặt bằng QTSC để lấy `x/y` hoặc `lat/lng`), và toggle `Xuất bản công khai`.

### 11. Quản Lý Tour 360° & Trình Biên Tập Hotspot (`/admin/virtual-tour` — *Mới P0*)
- **Mục tiêu:** Quản lý danh sách Scene 360°, kiểm duyệt chất lượng ảnh panorama và đặt tọa độ Hotspot ngay trên màn hình xem trước.
- **Cấu trúc Workbench 3 vùng (Desktop `>= 1024px`, Tablet/Mobile xếp tab chuyển mượt):**
  - **Cột Trái (`280px`):** Danh sách Scene hiện có + trạng thái (`Published / Draft / Missing 2:1`) + nút `+ Tạo Scene mới`.
  - **Vùng Giữa (Chính):** Khung **Preview Panorama 360° tương tác**, cho phép click trực tiếp lên mặt cầu để lấy tọa độ `(yaw, pitch)` đặt Hotspot mới, kèm thanh góc nhìn mặc định (`Set Initial View`).
  - **Cột Phải (`320px`):** Bảng cấu hình Scene (Gán Địa điểm/Tòa nhà, chọn ảnh 2:1 từ `/admin/media`) + Danh sách các Hotspot thuộc cảnh này (chọn loại `Chuyển Scene` hoặc `Điểm Thông tin`, đích liên kết, xóa/sửa tọa độ).

### 12. Quản Lý Sự Kiện Open Day (`/admin/events` — *Mới P0*)
- **Mục tiêu:** Quản trị kỳ Open Day, phân loại phiên công khai vs phiên giới hạn tài khoản, và kiểm soát danh sách khách mời / check-in tại sự kiện.
- **Cấu trúc 2 Tab vận hành chính:**
  - **Tab 1 — Chương trình & Khung giờ (`Schedule Builder`):** Bảng phiên hoạt động (Giờ, Tên hoạt động, Địa điểm QTSC, Chế độ truy cập: `Công khai` hay `Giới hạn tài khoản cấp`, Sức chứa) + Form thêm/sửa phiên.
  - **Tab 2 — Danh sách Tham dự & Check-in QR (`Attendance Queue`):** Tìm theo mã vé/mã tài khoản, lọc trạng thái (`Chưa check-in` / `Đã check-in`), nút đánh dấu check-in thủ công tại bàn đón tiếp hoặc kiểm tra hợp lệ mã QR.

### 13. Thư Viện Media & Kiểm Định Asset (`/admin/media` — *Mới P0*)
- **Mục tiêu:** Thay thế hoàn toàn 23 URL ngoài và quản lý kho ảnh 2D + ảnh Panorama 360° có kiểm soát nguồn sử dụng.
- **Cấu trúc màn hình:**
  - **Zone Upload (trên cùng hoặc Drawer):** Hỗ trợ chọn loại upload (`Ảnh 2D Địa điểm` vs `Ảnh Panorama 360° Equirectangular 2:1`), hiển thị **tự động kết quả kiểm tra kích thước & tỷ lệ** (`2:1` đạt chuẩn hay cảnh báo sai tỷ lệ sẽ gây seam dọc!).
  - **Bộ lọc kho Media:** Tab `Tất cả / Panorama 360° / Ảnh Địa điểm 2D / Chưa gắn sử dụng` + Chuyển chế độ Lưới (Grid) hoặc Bảng (Table).
  - **Thẻ/Dòng Asset:** Thumbnail, Tên tệp, Kích thước & Tỷ lệ (VD `4096×2048 · 2:1`), **Số lượng nơi đang tham chiếu** (VD `Đang dùng ở 1 Scene`). Nút `Xóa` bị khóa hoặc bật cảnh báo nghiêm trọng nếu asset đang gắn với nội dung đã xuất bản.

### 14. Quản Lý Tài Khoản Tham Gia & Import Excel/CSV (`/admin/users` — *Mới P0*)
- **Mục tiêu:** Đáp ứng luồng nghiệp vụ trọng tâm: Admin cấp phát đơn lẻ hoặc nhập hàng loạt tài khoản tham dự Open Day qua file Excel/CSV để phát hành hướng dẫn qua Zalo/Email.
- **Cấu trúc màn hình:**
  - **Toolbar:** Search (tên, mã định danh, SĐT/email), Filter Vai trò (`Participant`, `Operator`, `Admin`), Filter Trạng thái (`Chưa đổi MK tạm`, `Hoạt động`, `Đã khóa`), nút `+ Tạo tài khoản lẻ`, và **CTA chính `Import Excel / CSV`**.
  - **DataTable Tài khoản:** Mã tài khoản | Họ tên & Kênh liên hệ | Đợt Open Day | Trạng thái Bảo mật (`Đã đổi MK` / `Chờ đổi MK lần đầu` / `Đã khóa`) | Thao tác (`Khóa/Mở`, `Đặt lại MK tạm`, `Sao chép thông tin gửi Zalo`).
  - **Modal / Wizard Import Excel / CSV (3 bước rõ ràng):**
    1. *Bước 1 — Tải mẫu & Chọn file:* Nút tải tệp `.csv/.xlsx` mẫu + FileDropzone.
    2. *Bước 2 — Kiểm tra & Xem trước (Validation Preview):* Hiển thị tóm tắt `X dòng hợp lệ` / `Y dòng lỗi` + Bảng liệt kê từng dòng lỗi cụ thể (VD: dòng 14 thiếu SĐT, dòng 22 trùng mã) trước khi ghi hệ thống.
    3. *Bước 3 — Xác nhận & Xuất hướng dẫn cấp tài khoản:* Tạo tài khoản kèm mật khẩu tạm (`mustChangePassword = true`) và cho phép xuất bảng kết quả tạm để nhân sự gửi cho khách mời.

---

## MỤC D — NHÓM ROUTE CHUYỂN TIẾP & NGOÀI RANH GIỚI (`5` Route Đang Giữ Nguyên Chờ Phê Duyệt)

*(Các route này vẫn tồn tại trong `14` route hiện hành để không xóa/redirect tự ý trước khi Chủ dự án phê duyệt ở bước migration).*

| Route | Trạng thái đề xuất thiết kế (Proposal Pending Approval) | Mức độ can thiệp UI nếu tạm giữ |
|---|---|---|
| **15. `/about`** | Thu gọn thành trang *"Về Virtual Campus QTSC Q.12"* + 1 card dẫn về `https://caodang.fpt.edu.vn/` (hoặc Redirect). | Xóa mục 5 cơ sở ngoài TP.HCM, sửa link `"Xem Bản Đồ 3D WebGL"` thành `"Mở Bản đồ GIS"`, xóa số liệu tuyển sinh chưa kiểm chứng. |
| **16. `/contact`** | Chuyển thành trang **Chỉ đường QTSC Quận 12 & Hỗ trợ Open Day** + nút ngoài sang `https://caodang.fpt.edu.vn/lien-he` (hoặc Redirect). | Bỏ logo hộp chữ `"P"` sai chuẩn, bỏ form đăng ký tuyển sinh giả, thống nhất 1 địa danh phường Q.12. |
| **17. `/news`** | Đề xuất **Redirect hoặc thay bằng notice chuyển về cổng tin tức `caodang.fpt.edu.vn`** vì Virtual Campus không làm CMS báo chí. | Nếu tạm giữ trong pha chuyển tiếp: gắn banner dẫn nguồn chính thức, bỏ ảnh `lh3.googleusercontent.com`. |
| **18. `/news/[slug]`** | Đề xuất **Đi cùng quyết định của `/news`**. | Nếu tạm giữ: sửa để đọc đúng `slug` hoặc hiển thị `NotFoundState`, gỡ `alert()`, gỡ tuyên bố `"360 độ 4K"`. |
| **19. `/games`** | Đề xuất **Hợp nhất luồng thử thách tương tác có kiểm soát vào `/portal` (Open Day Workspace)** để tránh quiz lộ đáp án & BXH giả công khai. | Nếu tạm giữ độc lập P1: ghi rõ nhãn *"Trải nghiệm thử — Điểm không tích lũy học bổng"*, chuẩn hóa câu hỏi địa danh QTSC. |
