# MAPPING THIẾT KẾ UI CHI TIẾT TỪNG MÀN HÌNH
**Dự án:** FPT Polytechnic Virtual Campus 360° — Cơ sở TP.HCM (CVPM Quang Trung, Quận 12)  
**Cập nhật:** Đồng bộ lộ trình 7 giai đoạn (`UI-00` -> `UI-06`) & 5 bộ màn hình tham chiếu mới nhất  
**Phạm vi:** 19 URL route duy nhất (`14` hiện có + `5` Admin P0 mới) / `20` hạng mục màn hình UI mục tiêu

---

## 1. Quy ước Tài liệu Tham chiếu (Reference Registry)

### 1.1. 5 Mẫu Giao diện Tham chiếu Trực tiếp (Ưu tiên cho 5 màn hình trải nghiệm P0)
- **Mẫu 01 — Trang chủ (`/`):** Cảm hứng *The University of Alabama Virtual Tour* — Hero panorama/ảnh khuôn viên chiếm trọn màn hình đầu, mini-map preview góc dưới trái, điểm tương tác ngay trên cảnh, nút CTA nổi bật duy nhất (`Bắt đầu tham quan tự do`) và 1 CTA phụ (`Khám phá Open Day`).
- **Mẫu 02 — Tour 360° (`/campus`):** Cảm hứng *Zaha Hadid Heydar Aliyev 360°* — Panorama chiếm ~100% khung nhìn, HUD kính mờ tinh gọn góc trên, dropdown chọn cảnh + nút **Hide UI**, hotspot/callouts neo theo không gian thực tế, thanh zoom dọc góc dưới trái, dải thumbnail chọn cảnh gọn.
- **Mẫu 03 — Bản đồ GIS (`/map`):** Cảm hứng *Tilton Viewbook Explore Campus* — Nền bản đồ GIS sáng, sạch, dễ đọc là nội dung chính; top toolbar gọn nhẹ; pin phân nhóm theo màu; bấm pin/tòa nhà mở card preview gọn kèm nút **Xem thông tin** và **Vào 360°**; không chồng lấn drawer lên thanh điều khiển.
- **Mẫu 04 — Địa điểm (`/locations`):** Danh sách phân nhóm kết hợp ô tìm kiếm & bộ lọc đơn giản; mỗi thẻ phòng/không gian chỉ hiển thị ảnh thực tế, tên, tòa nhà/tầng và nút **Xem 360°** (cùng link chi tiết); tuyệt đối không nhồi thông số thừa.
- **Mẫu 05 — Open Day (`/events`):** Cảm hứng *VU Open Day My Program* — Chia rõ chế độ **Lịch sự kiện công khai** (thời gian, nội dung, trạng thái, vị trí bản đồ) và **Chương trình tham gia được bảo vệ** (yêu cầu đăng nhập bằng tài khoản Admin cấp).

### 1.2. 13 Stitch PNGs Hiện có trong `docs/stitch-references/`
1. `fpt_polytechnic_virtual_campus_360_trang_ch.png` (Home desktop)
2. `page_03_virtual_campus_360_exploration_mobile.png` (Tour 360° mobile)
3. `page_04_3d_campus_explorer_desktop.png` (3D Explorer desktop — tham khảo tương tác bản đồ/góc nhìn, bản thân tab 3D WebGL **ẩn ở P0**)
4. `page_04_3d_campus_explorer_mobile.png` (3D Explorer mobile)
5. `page_05_fpt_polytechnic_campus_gis_map_desktop.png` (GIS Map desktop)
6. `page_05_fpt_polytechnic_campus_gis_map_mobile.png` (GIS Map mobile)
7. `page_06_building_and_room_details_desktop.png` (Locations / Building & Room desktop)
8. `page_06_building_and_room_details_mobile.png` (Locations / Building & Room mobile)
9. `page_07_fpt_polytechnic_open_day_desktop.png` (Open Day desktop)
10. `page_09_fpt_polytechnic_news_and_events_desktop.png` (News legacy desktop)
11. `page_09_fpt_polytechnic_news_and_events_mobile.png` (News legacy mobile)
12. `page_10_news_article_detail_page_desktop.png` (News detail legacy desktop)
13. `page_10_mobile_news_article_detail.png` (News detail legacy mobile)

*(Lưu ý: Không có Stitch PNG riêng cho `/login`, `/portal`, `/games`, `/about`, `/contact` và nhóm `/admin/*` — nhóm này thiết kế trực tiếp theo Design System thống nhất trong `DESIGN_SYSTEM_AND_BLUEPRINT.md`.)*

---

## 2. Mapping Chi tiết Toàn bộ Các Màn hình UI

### 2.1. Nhóm Điều hướng & Trải nghiệm Cốt lõi (P0 Public & Immersive)

#### 1. `/` — Trang chủ (`src/app/(public)/page.tsx`)
- **Mục tiêu trang:** Mở ra trải nghiệm khuôn viên QTSC Quận 12 ngay khi vừa vào trang và đưa người dùng vào chế độ tham quan chỉ với 1 lần bấm.
- **Đối tượng sử dụng:** Học sinh THPT, phụ huynh, khách vãng lai, sinh viên tìm hiểu khuôn viên trước khi đến trường.
- **Nội dung chính:**
  1. Hero Panorama / khuôn viên lớn toàn màn hình đầu (`Hero360Viewer` được tinh gọn) kèm mini-map preview QTSC góc dưới trái.
  2. Giới thiệu ngắn gọn về cơ sở CVPM Quang Trung, Q.12 (1 block tinh gọn, không dàn hàng loạt thống kê marketing).
  3. 3–4 không gian thực hành nổi bật (`FeaturedFacilities`, đồng bộ đúng `sceneSlug`).
  4. Lịch Open Day sắp tới rút gọn (`OpenDayBanner` đã dọn link `/games`).
- **CTA chính:** **`Bắt đầu tham quan tự do`** -> `/campus` *(CTA phụ: `Khám phá Open Day` -> `/events`)*.
- **Thành phần cần giữ / bỏ:**
  - **Giữ (và tinh giản):** `Hero360Viewer` (gọn HUD, thêm mini-map card liên kết `/map`), `FeaturedFacilities`, `OpenDayBanner`.
  - **Bỏ hoàn toàn:** `QuickAdmissionForm` (trùng `caodang.fpt.edu.vn/dang-ky-truc-tuyen`), `CampusMetricsBar` (tránh nhồi thống kê ngay trên đầu trang), `VirtualTourShowcase` hoặc viết lại không chứa badge sai `"Marzipano"`, `"Leaflet GIS"`, và bỏ claim `"Full 4K"` chưa kiểm chứng.
- **Reference đối chiếu:** **Mẫu 01 (UA Virtual Tour)** + `fpt_polytechnic_virtual_campus_360_trang_ch.png`.
- **Desktop (`1440`/`1280`) & Mobile (`768`/`390`/`360`):**
  - Desktop: Hero cao tối thiểu `calc(100vh - 64px)`, mini-map ở góc dưới trái (`width: 240px`), nút zoom/xoay gọn góc dưới phải, các section dưới dùng lưới 3–4 cột thoáng rộng.
  - Mobile: Hero `70vh–75vh` vẫn giữ được 100% nút CTA chính trên màn hình đầu (above the fold), mini-map thu thành chip nút `"Xem bản đồ QTSC"`, ẩn control xoay rườm rà.
- **Layout:** `PublicLayout` (Header 4 mục + Footer mới không có `/admin`).
- **Trạng thái hiện tại & Phase:** Đã có nhưng nặng tính cổng tuyển sinh & sai badge công nghệ -> Thiết kế lại tại **`UI-02`**.

#### 2. `/campus` — Trải nghiệm Tour 360° (`src/app/(immersive)/campus/page.tsx`)
- **Mục tiêu trang:** Trình duyệt tham quan không gian 360° mượt mà, cho cảm giác "đứng giữa khuôn viên và phòng Lab thật".
- **Đối tượng sử dụng:** Khách tham quan tự do, học sinh/phụ huynh khám phá từng phòng học, sinh viên kiểm tra địa điểm trước Open Day.
- **Nội dung chính:**
  - Canvas Panorama 360° chiếm trọn vùng làm việc.
  - Điểm nóng (`TourHotspotMarker`) gắn theo tọa độ không gian `yaw / pitch`: hotspot thông tin (`info`) và hotspot di chuyển cảnh (`scene`).
  - Dải chọn cảnh (`TourSceneSelector`) dạng thumbnail gọn + bộ lọc theo Tòa nhà / Tầng + tùy chọn chuyển giữa **Tham quan tự do** và **Lộ trình gợi ý (Guided Tour)**.
  - Panel chi tiết địa điểm (`TourInfoDrawer`) chỉ mở khi người dùng bấm chọn.
- **CTA chính:** **`Chọn điểm đến / Di chuyển cảnh 360°`** *(+ CTA phụ trong drawer: `Xem chi tiết phòng` -> `/locations/[slug]` hoặc `Xem trên bản đồ` -> `/map`)*.
- **Thành phần cần giữ / bỏ:**
  - **Giữ & nâng cấp:** `VirtualTourViewer`, `TourCompassHUD`, `TourSceneSelector`, `TourInfoDrawer`, `TourHotspotMarker`.
  - **Bổ sung mới:** Nút **`Hide UI`** (ẩn toàn bộ HUD để ngắm panorama thuần túy, chỉ chừa 1 pill nhỏ để bật lại UI); chuẩn hóa danh sách scene ID (`thu-vien`, `lab-it`, `studio-imac`, và bổ sung scene ngoài trời/hội trường thay cho slug lỗi `"campus"`).
  - **Bỏ:** Thanh HUD chồng chéo khi thu hẹp viewport; tắt auto-rotate mặc định để tránh chóng mặt/tự trôi góc nhìn.
- **Reference đối chiếu:** **Mẫu 02 (Zaha Hadid 360°)** + `page_03_virtual_campus_360_exploration_mobile.png`.
- **Desktop & Mobile:**
  - Desktop: Top-left pill tiêu đề khu vực; top-right selector dropdown + nút `Hide UI`; bottom-left pill zoom dọc; bottom-center dải thumbnail gọn; panel chi tiết trượt bên phải (`max-w-[380px]`).
  - Mobile: Gọn tối đa 2 vùng chạm (top compact bar & bottom horizontal thumbnail strip cao `<= 76px`), panel chi tiết mở dưới dạng bottom sheet (`max-h-[65vh]`), thao tác vuốt cảm ứng mượt không cướp scroll trang.
- **Layout:** `ImmersiveLayout` (Top bar mảnh `56px` đồng bộ Header 4 mục).
- **Trạng thái hiện tại & Phase:** Đã có Three.js sphere + 3 scene nhưng UI chưa gọn, thiếu `Hide UI` và lỗi slug liên kết -> Nâng cấp tại **`UI-02`**.

#### 3. `/map` — Bản đồ GIS Khuôn viên (`src/app/(immersive)/map/page.tsx`)
- **Mục tiêu trang:** Giúp người dùng nhìn rõ tổng thể khuôn viên QTSC Q.12, vị trí từng tòa nhà/khu chức năng, bấm chọn để xem thông tin và nhảy sang Tour 360°.
- **Đối tượng sử dụng:** Tân sinh viên, khách tham quan lần đầu đến QTSC, người tham gia Open Day tìm tòa nhà/điểm check-in.
- **Nội dung chính:**
  - Bản đồ GIS trực quan làm trung tâm (độ tương phản cao, tông sáng rõ đường đi, khối tòa nhà T/F/P/Innovation, khu thể thao, cổng QTSC, trạm xe buýt).
  - Bộ lọc layer gọn: `Tất cả`, `Giảng đường`, `Phòng Lab`, `Thể thao`, `Xe buýt`.
  - Card/Drawer chi tiết tòa nhà (`BuildingDetailDrawer`) hiện khi bấm vào pin hoặc chip tòa nhà.
- **CTA chính:** **`Vào Tour 360° tòa nhà đang chọn`** -> `/campus?scene=...` *(CTA phụ: `Danh sách phòng tòa này` -> `/locations?building=...`)*.
- **Thành phần cần giữ / bỏ:**
  - **Giữ & nâng cấp:** `CampusGISMap`, `BuildingDetailDrawer`, chip chọn nhanh tòa nhà.
  - **Ẩn ở P0 (nhưng GIỮ file trong codebase):** Tab **`Mô hình 3D WebGL`** (`Campus3DViewer.tsx`) và các điều khiển đi bộ/orbit 3D — do `apps/web/public/models/` chưa có tài sản `.glb/.gltf`. Đổi state mặc định từ `"3d"` sang GIS ở P0; giữ mã `Campus3DViewer.tsx` để mở lại ở P1/P2.
  - **Sửa lỗi dữ liệu:** Thống nhất tên & query param `?building=` truyền sang `/locations`.
- **Reference đối chiếu:** **Mẫu 03 (Tilton Viewbook GIS)** + `page_05_fpt_polytechnic_campus_gis_map_desktop.png` & `_mobile.png`. *(Chỉ tham khảo trải nghiệm chọn pin/drawer từ `page_04_3d_*`, không bật 3D tab ở P0)*.
- **Desktop & Mobile:**
  - Desktop: Toolbar nổi gọn gàng trên cùng; vùng bản đồ mở rộng >= 90%; drawer nổi bên trái hoặc phải (`340px–380px`) cách lề `>= 16px`, không che thanh filter và thanh chọn tòa nhà.
  - Mobile: Bộ lọc cuộn ngang gọn trên cùng (`44px`), khi bấm pin tòa nhà mở bottom-sheet preview gọn gàng (`<= 45%` chiều cao màn hình) có thể kéo đóng dễ dàng.
- **Layout:** `ImmersiveLayout`.
- **Trạng thái hiện tại & Phase:** Đang ưu tiên `activeTab="3d"` và bản đồ GIS nền tối khó phân biệt không gian -> Thiết kế lại sang bản đồ GIS chủ đạo ở **`UI-02`**.

#### 4. `/locations` — Danh mục Địa điểm & Phòng Lab (`src/app/(public)/locations/page.tsx`)
- **Mục tiêu trang:** Cung cấp danh mục tra cứu nhanh các phòng học, phòng Lab, xưởng thực hành và tiện ích trong khuôn viên Q.12.
- **Đối tượng sử dụng:** Học sinh/phụ huynh xem cơ sở vật chất theo ngành, sinh viên tra mã phòng và tòa nhà.
- **Nội dung chính:**
  - Thanh tìm kiếm theo tên/mã phòng + bộ lọc Tòa nhà & Danh mục không gian (`LocationFilterBar`).
  - Lưới thẻ địa điểm (`LocationCard`) hiển thị tinh giản: **Ảnh thật + Tên địa điểm + Tòa nhà/Tầng + Nút `Xem 360°` + Link chi tiết**.
  - Bộ đếm kết quả và **Empty State** kèm nút `"Đặt lại bộ lọc"`.
- **CTA chính:** **`Xem 360°`** trên từng thẻ -> `/campus?scene=...` *(CTA phụ: `Chi tiết` -> `/locations/[slug]`)*.
- **Thành phần cần giữ / bỏ:**
  - **Giữ & sửa:** `LocationFilterBar`, `LocationCard`. Sửa ngay lỗi lọc `?building=` ở `locations/page.tsx:108-113` (hiện `b.split(" ")[2]` = `"t"` khớp nhầm với chữ `"Tòa"` trong `"Tòa Nhà F"`). Sửa `sceneSlug: "campus"` sang scene hợp lệ.
  - **Bỏ:** Nhồi nhiều badge thông số kỹ thuật, mã dài, hoặc danh sách thiết bị quá dày trực tiếp trên card danh mục; bỏ nút `"Xem Bản Đồ 3D"` đổi thành **`"Xem trên Bản đồ"`**.
- **Reference đối chiếu:** **Mẫu 04 (Địa điểm)** + `page_06_building_and_room_details_desktop.png` & `_mobile.png`.
- **Desktop & Mobile:**
  - Desktop: Thanh search + 2 select/pills trên 1 dòng; Grid 3 cột (`lg:grid-cols-3`).
  - Mobile: Filter xếp dọc gọn gàng hoặc 2 cột nút cao `>= 44px`, Grid 1 cột (`grid-cols-1`), ảnh tỷ lệ `16:10` thống nhất.
- **Layout:** `PublicLayout`.
- **Trạng thái hiện tại & Phase:** Đã có giao diện danh mục nhưng lỗi lọc URL và thẻ còn nhiều chữ -> Tối giản & sửa lỗi tại **`UI-03`**.

#### 5. `/locations/[slug]` — Chi tiết Không gian (`src/app/(public)/locations/[slug]/page.tsx`)
- **Mục tiêu trang:** Hiển thị thông tin đầy đủ nhưng súc tích của 1 phòng học/Lab/khu chức năng cụ thể và dẫn người dùng vào cảnh 360° tương ứng.
- **Đối tượng sử dụng:** Người dùng click từ card `/locations` hoặc từ drawer trên `/campus` / `/map`.
- **Nội dung chính:**
  - Breadcrumb (`Trang chủ / Địa điểm / Tên phòng`).
  - Hình ảnh/gallery thực tế không gian, tòa nhà, tầng, mô tả công năng, danh sách thiết bị tiêu biểu, vị trí gợi ý trên bản đồ GIS và các không gian liên quan cùng tòa nhà.
- **CTA chính:** **`Mở Không gian 360°`** -> `/campus?scene=...` *(CTA phụ: `Xem vị trí trên Bản đồ` -> `/map`)*.
- **Thành phần cần giữ / bỏ:**
  - **Thay thế:** Bỏ dữ liệu cứng `"95 m² / 45 Chỗ / 1 Gbps"` dùng chung cho mọi slug; map đúng dữ liệu theo `slug` (kèm trang fallback sạch khi không tìm thấy `slug`).
  - **Bỏ:** Sidebar booking tham quan cá nhân nếu trùng luồng Open Day.
- **Reference đối chiếu:** `page_06_building_and_room_details_desktop.png` & `_mobile.png`.
- **Desktop & Mobile:** Desktop 2 cột (`8/12` ảnh & nội dung + `4/12` thông tin tòa nhà & CTA 360°); Mobile 1 cột với nút CTA 360° rõ ràng ngay dưới ảnh hero.
- **Layout:** `PublicLayout`.
- **Trạng thái hiện tại & Phase:** Đang hiển thị nội dung tĩnh giống hệt nhau cho mọi `slug` -> Cập nhật động theo dataset thống nhất tại **`UI-03`**.

#### 6. `/events` — Open Day (`src/app/(public)/events/page.tsx`)
- **Mục tiêu trang:** Công bố lịch trình Open Day công khai cho mọi khách truy cập, đồng thời là cổng vào chương trình Open Day tương tác dành riêng cho tài khoản đã được Admin cấp.
- **Đối tượng sử dụng:** Khách vãng lai xem lịch trình; thí sinh/khách tham dự đã được cấp tài khoản Open Day để vào hoạt động chương trình.
- **Nội dung chính:**
  - **Phần công khai (Mọi người xem được):** Giới thiệu sự kiện Open Day sắp diễn ra, ngày giờ, địa điểm CVPM Quang Trung Q.12, lịch trình các phiên (`OpenDayScheduleTimeline`), vị trí check-in gắn bản đồ khu vực.
  - **Phần được bảo vệ (Account-Gated Program):** Hiển thị rõ trạng thái khóa nếu chưa đăng nhập kèm CTA đăng nhập; khi chuyển sang chế độ đã đăng nhập (`prototype state` ở giai đoạn UI) sẽ mở khu vực **"Chương trình của tôi (My Program)"**, tiến độ trải nghiệm & minigame Open Day (`OpenDayMiniGame`).
- **CTA chính:** **`Đăng nhập tham gia Open Day`** -> `/login?next=/events` *(khi đã đăng nhập: **`Bắt đầu hoạt động Open Day`**)*.
- **Thành phần cần giữ / bỏ:**
  - **Giữ & tái cấu trúc:** `OpenDayScheduleTimeline`, `OpenDayMiniGame`, trạng thái 2 lớp (Công khai vs Đã xác thực).
  - **Bỏ hoàn toàn:** `TicketRegistrationModal` (bỏ biểu mẫu tự điền tên rồi cấp mã vé QR VIP giả `POLY-VIP-2025-9821`); bỏ các banner dẫn sang form tuyển sinh hoặc `/games` rời rạc.
- **Reference đối chiếu:** **Mẫu 05 (VU Open Day My Program)** + `page_07_fpt_polytechnic_open_day_desktop.png`.
- **Desktop & Mobile:** Desktop chia 2 cột trực quan (trái: timeline phiên theo giờ có tab `Lịch trình` / `Tất cả hoạt động`; phải: bản đồ khu vực Open Day & card quyền truy cập/chương trình); Mobile xếp tab rõ ràng (`Lịch trình` | `Bản đồ` | `Tham gia`).
- **Layout:** `PublicLayout`.
- **Trạng thái hiện tại & Phase:** Đã có nhưng đang giả lập tự đăng ký QR code và trộn layout marketing -> Cấu trúc lại tại **`UI-03`**.

---

### 2.2. Nhóm Xác thực, Hoạt động Liên kết & Các Route Chuyển tiếp

#### 7. `/games` — Minigame / Tương tác Open Day (`src/app/(public)/games/page.tsx`)
- **Mục tiêu trang:** Cung cấp minigame đố vui khám phá campus như một hoạt động bổ trợ của Open Day (không phải sản phẩm game độc lập trên thanh menu chính).
- **Đối tượng sử dụng:** Người tham gia Open Day hoặc khách đang khám phá khuôn viên.
- **Nội dung chính:** Khối chọn tham gia Quiz 5 câu hỏi kiến thức về khuôn viên QTSC Q.12 + kết quả trả lời + ghi chú rõ bản prototype UI (không giả lập lưu điểm lên server khi chưa có Backend).
- **CTA chính:** **`Bắt đầu thử thách`** *(hoặc **`Quay lại Open Day`** -> `/events`)*.
- **Thành phần cần giữ / bỏ:** Giữ `CampusQuizStepper` nhưng làm gọn phần lobby; bỏ link ví điểm `/portal` và ẩn khỏi Header/Footer chính.
- **Reference đối chiếu:** Tham khảo Design System card & stepper chuẩn (`DESIGN_SYSTEM_AND_BLUEPRINT.md`).
- **Desktop & Mobile:** Layout 1–2 cột sạch sẽ, tối đa 640px cho câu hỏi trắc nghiệm, nút đáp án cao `>= 48px` dễ bấm trên mobile.
- **Layout:** `PublicLayout`.
- **Trạng thái hiện tại & Phase:** Đã có nhưng đứng tách rời ngoài Open Day -> Tích hợp & tinh gọn ở **`UI-03`**.

#### 8. `/login` — Đăng nhập (`src/app/(auth)/login/page.tsx`)
- **Mục tiêu trang:** Cổng đăng nhập sạch, trung thực cho người tham gia Open Day sử dụng tài khoản được Admin cấp và cho nhân sự vận hành Admin.
- **Đối tượng sử dụng:** Người tham gia Open Day (tài khoản cấp trước), Admin vận hành hệ thống.
- **Nội dung chính:**
  - Logo FPT Polytechnic chính thức (`/images/fpt-logo-official.png`), tên hệ thống `Virtual Campus Open Day`, form nhập Tên đăng nhập / Mã tài khoản & Mật khẩu.
  - Hỗ trợ giao diện đầy đủ các trạng thái nghiệp vụ:
    1. Đăng nhập mặc định + chuyển đổi qua tab/bộ chọn demo role ở chế độ UI prototype nếu cần test UX.
    2. Lỗi sai thông tin (`Invalid credentials`) & tài khoản bị khóa (`Disabled/Locked`).
    3. **Luồng đổi mật khẩu lần đầu (First-login Change Password modal/step)** vì tài khoản do Admin cấp sẵn qua import.
    4. Hỗ trợ quên mật khẩu: chỉ dẫn liên hệ Ban Tổ Chức Open Day (không trỏ về form `/contact`).
- **CTA chính:** **`Đăng nhập`** *(sau đăng nhập ở P0 dẫn vào `/events` cho người tham dự hoặc `/admin` cho Admin)*.
- **Thành phần cần giữ / bỏ:**
  - **Loại bỏ 100% tuyên bố sai sự thật:** Xóa `"Cổng Định Danh Số EduID 2.0"`, `"Hệ thống xác thực một lần (SSO)"`, `"MÃ HÓA TLS 1.3 & HASH BCRYPT"`, `"TIÊU CHUẨN ISO/IEC 27001"` tại `login/page.tsx:45,53,65,79` và `(auth)/layout.tsx:43`.
  - **Loại bỏ:** Nút hardcoded tự nhảy sang `/portal`.
- **Reference đối chiếu:** Design System `AuthLayout` (cột thông tin hướng dẫn tài khoản Open Day + card form trung tâm sạch sẽ).
- **Desktop & Mobile:** Desktop 2 cột cân đối (`min-h-screen`, `<= 1000px` max-width) hoặc 1 card trung tâm kèm ghi chú rõ ràng; Mobile 1 cột gọn, input cao `>= 44px`, không thừa scroll.
- **Layout:** `AuthLayout`.
- **Trạng thái hiện tại & Phase:** Có form demo nhưng chứa nhiều tuyên bố bảo mật/công nghệ sai lệch -> Viết lại sạch tại **`UI-04`**.

#### 9. `/portal` — Cổng Sinh viên / Phụ huynh (`src/app/(portal)/portal/page.tsx`) [P1 Hoãn]
- **Mục tiêu trang:** Được bảo lưu ở P0 dưới dạng trang điều hướng nhẹ (không xóa file) trong khi hoãn xây dựng Portal đầy đủ sang P1.
- **Đối tượng sử dụng:** Người dùng truy cập link cũ (từ lịch sử trình duyệt hoặc luồng chuyển tiếp).
- **Nội dung chính:** Thông báo gọn về phạm vi trải nghiệm hiện tại + 2 thẻ điều hướng nhanh sang **Chương trình Open Day** (`/events`) và **Tham quan 360° tự do** (`/campus`).
- **CTA chính:** **`Đến Chương trình Open Day`** -> `/events`.
- **Thành phần cần giữ / bỏ:** Tạm thu gọn `StudentProfileHeader`, `DigitalPassCard`, `PersonalItineraryTimeline` dùng dữ liệu giả `PS24180` ở P0 (chờ Backend + RBAC P1); giữ `(portal)/layout.tsx` sạch sẽ.
- **Reference đối chiếu:** Không có Stitch PNG riêng; áp dụng Design System card tối giản.
- **Desktop & Mobile:** 1–2 card căn giữa gọn trên desktop và mobile.
- **Layout:** `PortalLayout` (hoặc shell gọn không hiển thị dữ liệu giả).
- **Trạng thái hiện tại & Phase:** Đang dùng dữ liệu tĩnh `PS24180` -> Thu gọn làm route tương thích tại **`UI-04`**.

#### 10. `/about`, `/contact`, `/news`, `/news/[slug]` — Nhóm Route Chuyển tiếp (`Transition Routes`)
- **Mục tiêu trang:** Giữ tương thích URL tạm thời (không gây 404 trong lúc chờ duyệt redirect) nhưng **không giữ chức năng/nội dung trùng website `caodang.fpt.edu.vn`**.
- **Đối tượng sử dụng:** Khách truy cập qua URL trực tiếp hoặc bookmark cũ.
- **Nội dung chính:**
  - `/about`: Card tóm tắt Virtual Campus Q.12 + CTA mở **`caodang.fpt.edu.vn`** (mục Giới thiệu) hoặc vào **`/campus`**.
  - `/contact`: Thông tin địa chỉ thực tế cơ sở CVPM Quang Trung, Q.12 + **BỎ form liên hệ tuyển sinh cục bộ**, đặt CTA mở **`caodang.fpt.edu.vn/lien-he`**.
  - `/news` & `/news/[slug]`: Thông báo tin tức chính thức được cập nhật tại website trường + **BỎ toàn bộ bài viết mẫu & claim `"siêu nét 4K"`**, đặt CTA mở **`caodang.fpt.edu.vn`** hoặc về **`/events`**.
- **CTA chính:** **`Truy cập Website Chính thức FPT Polytechnic`** (external link) *(CTA phụ: `Khám phá Campus 360°` -> `/campus`)*.
- **Reference đối chiếu:** `page_09_*`, `page_10_*` chỉ dùng làm hồ sơ lịch sử thiết kế cũ; giao diện chuyển tiếp mới dùng card chuẩn Design System.
- **Desktop & Mobile:** Card trung tâm `max-w-2xl`, padding thoáng, 2 nút rõ ràng trên desktop/mobile.
- **Layout:** `PublicLayout`.
- **Trạng thái hiện tại & Phase:** Hiện đang nhân bản website trường -> Chuyển đổi thành màn hình chuyển tiếp gọn nhẹ ở **`UI-04`** (trước khi bật redirect chính thức sau khi người dùng duyệt).

---

### 2.3. Nhóm Hệ thống Vận hành Nội bộ Admin P0 (`6` màn hình tại `UI-05`)

> Quy tắc chung cho 6 màn hình Admin: Dùng chung **`AdminLayout`** (`Sidebar 6 mục P0` trên desktop `lg+`, `Slide-over Drawer` trên tablet/mobile `<1024px`, thanh Topbar gồm breadcrumb + nút tạo mới/action chính). Không công khai bất kỳ liên kết Admin nào trong Header/Footer công khai.

#### 11. `/admin` — Admin Dashboard (`src/app/admin/page.tsx`)
- **Mục tiêu trang:** Trung tâm điều phối nhanh các dữ liệu cốt lõi của Virtual Campus và Open Day.
- **Đối tượng sử dụng:** Quản trị viên nội bộ / Ban tổ chức Open Day.
- **Nội dung chính:** 4 thẻ số liệu tổng quan đúng phạm vi P0 (`Địa điểm`, `Cảnh 360°`, `Sự kiện Open Day`, `Tài khoản đã cấp`), bảng hoạt động gần đây và thẻ truy cập nhanh 5 module quản trị P0.
- **CTA chính:** **`Thêm Sự kiện / Cảnh 360° mới`** (Quick action tới `/admin/virtual-tour` hoặc `/admin/events`).
- **Thành phần cần giữ / bỏ:** Giữ `AdminDashboardMetrics` & `AdminRecentActivityLog` (cập nhật đúng nhãn/số liệu P0); **bỏ** các quick links dẫn tới `/games`, `/news`, `/admin/contacts`, `/admin/3d-models`.
- **Desktop & Mobile:** Grid 2–4 cột metrics + 2 cột hoạt động/quick-actions; Mobile stack 1 cột.
- **Layout:** `AdminLayout`.
- **Trạng thái hiện tại & Phase:** Đã có bản nền, 11/12 sidebar link đang 404 -> Hoàn thiện tại **`UI-05`** (cập nhật sidebar 6 mục từ `UI-01`).

#### 12. `/admin/locations` — Quản lý Địa điểm & GIS *(Xây mới P0)*
- **Mục tiêu trang:** Quản lý toàn bộ danh sách tòa nhà, phòng Lab/xưởng và tọa độ hiển thị trên bản đồ GIS.
- **Nội dung chính:** Bộ lọc tìm kiếm + lọc theo Tòa nhà; Bảng danh sách (Desktop) / Card list (Mobile) gồm tên, mã phòng, tòa nhà, tầng, scene 360° liên kết, trạng thái `Hiển thị / Nháp`; Modal Tạo/Sửa kèm bộ chọn tọa độ GIS (`x, y`) trên khung preview bản đồ thu nhỏ; Hộp thoại xác nhận xóa.
- **CTA chính:** **`+ Thêm Địa điểm mới`**.
- **States bắt buộc:** Loading skeleton bảng, Empty state khi lọc rỗng, Validation error trên form modal.
- **Layout & Phase:** `AdminLayout` -> **`UI-05`**.

#### 13. `/admin/virtual-tour` — Quản lý Cảnh 360° & Hotspot *(Xây mới P0)*
- **Mục tiêu trang:** Quản lý danh sách cảnh 360°, thứ tự hành trình tham quan và gắn điểm Hotspot (`info` / `scene`) trực quan.
- **Nội dung chính:** Cột trái danh sách Scene theo tòa nhà/thứ tự + trạng thái; Cột phải trình xem thử khung hình 360° kèm danh sách Hotspot (`yaw`, `pitch`, loại `info` hoặc `scene` đích); Modal Thêm/Sửa Scene (chọn ảnh từ Thư viện Media) & Thêm Hotspot.
- **CTA chính:** **`+ Tạo Cảnh 360° mới`** *(CTA phụ trong workspace: `+ Gắn Hotspot`)*.
- **States bắt buộc:** Empty state khi cảnh chưa có hotspot, Preview fallback nếu URL ảnh lỗi.
- **Layout & Phase:** `AdminLayout` -> **`UI-05`**.

#### 14. `/admin/events` — Quản lý Sự kiện & Open Day *(Xây mới P0)*
- **Mục tiêu trang:** Tạo và cập nhật lịch trình Open Day, cấu hình phiên hoạt động và chế độ yêu cầu đăng nhập.
- **Nội dung chính:** Danh sách sự kiện Open Day + tab **Lịch trình theo phiên (Schedule Sessions)**; Form chỉnh sửa thời gian, địa điểm QTSC, trạng thái sự kiện (`Sắp diễn ra`, `Đang mở`, `Đã kết thúc`) và công tắc `Bắt buộc tài khoản cấp sẵn để vào chương trình`.
- **CTA chính:** **`+ Tạo Sự kiện Open Day`**.
- **Layout & Phase:** `AdminLayout` -> **`UI-05`**.

#### 15. `/admin/media` — Thư viện Ảnh 360° & Media *(Xây mới P0)*
- **Mục tiêu trang:** Quản lý tập trung kho ảnh panorama 360°, ảnh chụp thực tế phòng Lab/tòa nhà phục vụ liên kết vào Locations và Tour.
- **Nội dung chính:** Khu vực Upload kéo-thả (UI prototype), thanh tìm kiếm & lọc theo danh mục (`Panorama 360°`, `Tòa nhà & Khuôn viên`, `Phòng Lab & Xưởng`), Grid thumbnail kèm badge kích thước/loại ảnh, nút **Xem thử 360°**, **Sao chép URL**, **Xóa**.
- **CTA chính:** **`Tải lên Media mới`**.
- **Layout & Phase:** `AdminLayout` -> **`UI-05`**.

#### 16. `/admin/users` — Quản lý Tài khoản & Import Danh sách *(Xây mới P0)*
- **Mục tiêu trang:** Quản lý danh sách tài khoản tham gia Open Day (được Admin cấp trước) và tài khoản quản trị; gộp chức năng `/admin/import` & `Roles` vào bên trong.
- **Nội dung chính:**
  - Tab 1 (`Danh sách tài khoản`): Bảng/Card tài khoản, mã người tham dự, vai trò (`Open Day Guest`, `Admin`), trạng thái (`Chưa đổi MK lần đầu`, `Đang hoạt động`, `Đã khóa`), thao tác nhanh `Đặt lại MK` / `Khóa-Mở khóa`.
  - Tab 2 / Modal (`Import danh sách hàng loạt`): Upload file CSV/Excel mẫu, bảng preview kiểm tra dòng hợp lệ / dòng lỗi trùng lặp trước khi bấm xác nhận cấp hàng loạt.
- **CTA chính:** **`+ Cấp Tài khoản / Import CSV`**.
- **Layout & Phase:** `AdminLayout` -> **`UI-05`**.

---

## 3. Rà soát Các Tuyên bố Cần Loại bỏ Ngay Trong Quá trình Thiết kế Lại

| Vị trí phát hiện trong codebase | Tuyên bố hiện tại chưa có cơ sở | Cách xử lý bắt buộc trong UI-02..UI-04 |
|---|---|---|
| `src/app/(auth)/login/page.tsx:45,53,65,79` | `Cổng Định Danh Số EduID 2.0`, `Hệ thống xác thực một lần (SSO)`, `MÃ HÓA TLS 1.3 & HASH BCRYPT`, `TIÊU CHUẨN ISO/IEC 27001` | **Xóa hoàn toàn**. Thay bằng mô tả đúng bản chất: tài khoản tham gia Open Day do Ban Tổ Chức / Admin cấp trước & hỗ trợ đổi mật khẩu lần đầu. |
| `src/app/(auth)/layout.tsx:43` | `Hệ thống xác thực danh tính tích hợp ISO/IEC 27001 & SSO EduID` | **Xóa hoàn toàn**, thay bằng copyright gọn của Virtual Campus FPT Polytechnic TP.HCM. |
| `src/components/home/VirtualTourShowcase.tsx:19,27,44` | Badge `"Marzipano"`, `"Leaflet GIS"`, `"ảnh toàn cảnh 360° Marzipano"` | **Xóa badge sai**. Hiện tại UI dùng Three.js sphere & bản đồ GIS SVG tương tác; chỉ nêu công năng trải nghiệm thực tế cho người dùng. |
| `src/components/home/FeaturedFacilities.tsx:25`, `news/[slug]/page.tsx:72` | Nhãn `"Full 4K"` / `"siêu nét 4K"` | **Gỡ bỏ** khỏi giao diện công khai chừng nào kho ảnh panorama chưa được kiểm định đạt chuẩn 4K đồng nhất. |
| `src/app/(immersive)/map/page.tsx:40` & `apps/web/public/models/` (`0` file) | Mở mặc định `"Mô hình 3D WebGL"` với khối hộp placeholder khi chưa có file `.glb/.gltf` | **Ẩn tab 3D WebGL ở P0**, giữ mã trong repo cho giai đoạn nâng cấp P1/P2. |
