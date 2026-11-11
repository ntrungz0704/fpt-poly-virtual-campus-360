# KẾ HOẠCH MIGRATION & MAPPING TOÀN BỘ ROUTE
**Dự án:** FPT Polytechnic Virtual Campus 360° — Cơ sở TP.HCM (CVPM Quang Trung, Quận 12)  
**Cập nhật:** Phiên bản UI-00 Master Plan (Trước khi triển khai `UI-01`)  
**Trạng thái:** Bản thiết kế trình duyệt — **CHƯA thực hiện xóa, đổi tên hay redirect route trong mã nguồn**

---

## 1. Kiểm kê Route & Đối chiếu Số lượng Chính xác

### 1.1. 14 Route Hiện Có trong `apps/web/src/app`
*(Kiểm kê trực tiếp từng file `page.tsx`, mỗi dynamic route `[slug]` chỉ tính là 1 route duy nhất, không đếm trùng lặp theo tham số)*

| # | URL Route | File thực tế | Nhóm Layout hiện tại | Trạng thái kỹ thuật hiện tại |
|---|---|---|---|---|
| 1 | `/` | `src/app/(public)/page.tsx` | `(public)` | Hoạt động, nhưng nhồi quá nhiều section (`QuickAdmissionForm`, `CampusMetricsBar`, tuyên bố `Marzipano`/`Leaflet`) |
| 2 | `/campus` | `src/app/(immersive)/campus/page.tsx` | `(immersive)` | Hoạt động với Three.js sphere + 3 scene (`thu-vien`, `lab-it`, `studio-imac`); lỗi slug từ Home/Locations |
| 3 | `/map` | `src/app/(immersive)/map/page.tsx` | `(immersive)` | Hoạt động, đang mặc định `activeTab="3d"` dù `public/models/` trống (`0` file `.glb/.gltf`) |
| 4 | `/locations` | `src/app/(public)/locations/page.tsx` | `(public)` | Hoạt động, lỗi filter `?building=` (`split(" ")[2]` chữ `"t"` khớp `"tòa"`), sceneSlug `"campus"` không tồn tại |
| 5 | `/locations/[slug]` | `src/app/(public)/locations/[slug]/page.tsx` | `(public)` | Hoạt động (1 dynamic route), đang dùng nội dung tĩnh chung cho mọi `slug` |
| 6 | `/events` | `src/app/(public)/events/page.tsx` | `(public)` | Hoạt động, nhưng cho phép tự đăng ký nhận mã QR giả (`TicketRegistrationModal`) thay vì luồng lịch công khai + tài khoản cấp |
| 7 | `/games` | `src/app/(public)/games/page.tsx` | `(public)` | Hoạt động độc lập (Quiz 5 câu), có link sang `/portal` |
| 8 | `/login` | `src/app/(auth)/login/page.tsx` | `(auth)` | Giao diện demo hardcoded push `/portal`, chứa badge sai sự thật (`ISO/IEC 27001`, `TLS 1.3`, `bcrypt`, `EduID 2.0 SSO`) |
| 9 | `/portal` | `src/app/(portal)/portal/page.tsx` | `(portal)` | Giao diện phụ huynh/sinh viên dữ liệu mẫu tĩnh (`PS24180`) |
| 10 | `/about` | `src/app/(public)/about/page.tsx` | `(public)` | Trang giới thiệu chung, trùng vai trò với website chính thức `caodang.fpt.edu.vn` |
| 11 | `/contact` | `src/app/(public)/contact/page.tsx` | `(public)` | Form liên hệ tuyển sinh cục bộ, trùng vai trò `caodang.fpt.edu.vn/lien-he` |
| 12 | `/news` | `src/app/(public)/news/page.tsx` | `(public)` | Danh sách tin tức mẫu, trùng vai trò với website trường |
| 13 | `/news/[slug]` | `src/app/(public)/news/[slug]/page.tsx` | `(public)` | Chi tiết bài viết tĩnh (1 dynamic route), chứa tuyên bố `"360 độ siêu nét 4K"` |
| 14 | `/admin` | `src/app/admin/page.tsx` | `admin` | Có trang Dashboard duy nhất, còn 11 link sidebar trỏ vào route 404 |

---

### 1.2. Đối chiếu 11 Route Admin Thiếu (`admin/layout.tsx` vs Tài liệu Audit)

Kiểm tra thực tế `ADMIN_MODULES` trong `src/app/admin/layout.tsx` (dòng 6–19) cho thấy có **12 mục sidebar**, gồm `/admin` (hiện có) và **11 link hiện đang 404**:
- Trong `admin/layout.tsx`: `/admin/locations`, `/admin/virtual-tour`, `/admin/3d-models`, `/admin/events`, `/admin/users`, `/admin/import`, `/admin/games`, `/admin/media`, `/admin/contacts`, `/admin/analytics`, `/admin/settings`.
- Trong danh sách 11 route Admin còn thiếu của tài liệu Audit: `Locations`, `Tours 360°`, `Models 3D`, `Media`, `Events`, `Games`, `News`, `Users`, `Roles`, `Analytics`, `Settings`.
  *(Khác biệt nhỏ: Audit liệt kê `News` và `Roles`, trong khi `admin/layout.tsx` đang liệt kê `/admin/import` và `/admin/contacts`.)*

Để tránh xây CMS phình to không cần thiết ở P0 nhưng vẫn bao phủ đúng nghiệp vụ vận hành nội bộ, **toàn bộ 11 hạng mục Admin được chuẩn hóa thành 6 màn hình Admin P0** (`/admin` nâng cấp + **5 route Admin xây mới P0**):

| Nhóm | Hạng mục / Route | Nguồn đối chiếu | Quyết định phân tầng | Xử lý trong Roadmap |
|---|---|---|---|---|
| **P0 (Giữ & nâng cấp)** | `/admin` | `admin/layout.tsx` + Audit | **Nâng cấp P0** | Dashboard vận hành nội bộ gọn nhẹ (`UI-05`), bỏ card link sang `/games`, `/news` giả |
| **P0 (Xây mới #1)** | `/admin/locations` | `admin/layout.tsx` + Audit | **Xây mới P0** | Quản lý Tòa nhà, Phòng Lab/Xưởng, Tọa độ GIS (`UI-05`) |
| **P0 (Xây mới #2)** | `/admin/virtual-tour` | `admin/layout.tsx` + Audit (`Tours 360°`) | **Xây mới P0** | Quản lý Scene 360°, sắp xếp thứ tự cảnh và trình đặt Hotspot (`UI-05`) |
| **P0 (Xây mới #3)** | `/admin/events` | `admin/layout.tsx` + Audit | **Xây mới P0** | Quản lý Sự kiện & Lịch trình Open Day, trạng thái mở/cổng đăng nhập (`UI-05`) |
| **P0 (Xây mới #4)** | `/admin/media` | `admin/layout.tsx` + Audit | **Xây mới P0** | Thư viện Ảnh 360° & Media dùng cho Scene và Địa điểm (`UI-05`) |
| **P0 (Xây mới #5)** | `/admin/users` | `admin/layout.tsx` + Audit (`Users`) | **Xây mới P0** (gộp `import` & `roles`) | Quản lý tài khoản Open Day & Admin; tích hợp **tab/modal Import danh sách tài khoản** (`/admin/import`) và **gán vai trò cơ bản** (`Roles`) ngay bên trong (`UI-05`) |
| **Gộp vào P0** | `/admin/import`, `Roles` | `admin/layout.tsx` / Audit | **Gộp vào `/admin/users`** | Không tách route lẻ ở P0 để giữ sidebar 6 mục gọn nhẹ |
| **Hoãn P1 / P2** | `/admin/3d-models` | `admin/layout.tsx` + Audit | **Hoãn P1/P2** | `apps/web/public/models/` hiện có `0` file `.glb/.gltf`; chỉ mở lại khi dự án có tài sản 3D thực tế |
| **Hoãn P1** | `/admin/games` | `admin/layout.tsx` + Audit | **Hoãn P1** | Chưa cần CMS minigame phức tạp trong P0 |
| **Hoãn P1** | `/admin/analytics` | `admin/layout.tsx` + Audit | **Hoãn P1** | Báo cáo thống kê chuyên sâu triển khai sau khi có Backend telemetry |
| **Hoãn P1** | `/admin/settings` | `admin/layout.tsx` + Audit | **Hoãn P1** | Cấu hình nâng cao hệ thống triển khai ở P1 |
| **Loại bỏ** | `/admin/contacts`, `News` | `admin/layout.tsx` / Audit | **Không xây dựng** | Không xây hệ thống quản lý liên hệ tuyển sinh hoặc CMS tin tức trùng `caodang.fpt.edu.vn` |

### 1.3. Tổng kết Số màn hình UI Mục tiêu
- **Tổng số URL route duy nhất toàn UI P0:** **`19` URL route** (`14` route hiện có + `5` route Admin P0 mới; khi giữ toàn bộ route chuyển tiếp hiện có).
- **Tổng số hạng mục màn hình UI mục tiêu:** **`20` màn hình/hạng mục** (bao gồm `14` slot route hiện có với `/admin` nâng cấp + `6` màn hình Admin P0 hoàn chỉnh: `/admin`, `/admin/locations`, `/admin/virtual-tour`, `/admin/events`, `/admin/media`, `/admin/users`).
- **Route trải nghiệm P0 cốt lõi phía người dùng cuối:** `7` màn hình chính (`/`, `/campus`, `/map`, `/locations`, `/locations/[slug]`, `/events`, `/login`) + `/games` (tích hợp/đồng bộ cùng Open Day).

---

## 2. Quy tắc Điều hướng & Ranh giới Sản phẩm Đã Chốt

1. **Header công khai chỉ có tối đa 4 mục:**
   - `Tham quan` (`/campus`)
   - `Bản đồ` (`/map`)
   - `Open Day` (`/events`)
   - `Đăng nhập` (`/login`)
   *(Trang `/locations` được điều hướng tự nhiên từ Trang chủ, Bản đồ GIS `/map` và Tour 360° `/campus`.)*
2. **Ẩn tab `Mô hình 3D WebGL` khỏi UI ở P0:** `/map` tập trung hoàn toàn vào bản đồ GIS rõ ràng, dễ tìm tòa nhà; giữ lại mã `Campus3DViewer.tsx` để tái kích hoạt ở P1/P2.
3. **Ẩn hoàn toàn `/admin` khỏi `PublicFooter.tsx` (`line 162`)** và toàn bộ điều hướng công khai. Chỉ truy cập nội bộ bằng URL trực tiếp (bảo vệ bằng RBAC thật ở giai đoạn Backend).
4. **Hai chế độ sử dụng rõ ràng:**
   - **Tham quan tự do:** Không yêu cầu đăng nhập (`/`, `/campus`, `/map`, `/locations`, `/locations/[slug]`).
   - **Open Day:** Xem lịch công khai tại `/events`; tham gia chương trình/hoạt động nội bộ bằng tài khoản do Admin cấp qua `/login`.
5. **Không nhân bản website chính thức `https://caodang.fpt.edu.vn`:**
   - Không đặt form đăng ký tư vấn tuyển sinh (`QuickAdmissionForm`), form tự tạo vé QR (`TicketRegistrationModal`), form liên hệ (`/contact`), hoặc CMS tin tức (`/news`) thành luồng chính của Virtual Campus.
   - Gắn liên kết ngoài rõ ràng về `caodang.fpt.edu.vn` tại Footer và các trang chuyển tiếp.

---

## 3. Bảng Mapping Migration Chi tiết Toàn bộ Các Route

| # | Route | File hiện tại | Vai trò mục tiêu | Hiển thị trên Nav | Phân tầng | Phase | Quyết định Migration | Đích chuyển hướng (sau khi duyệt) | Lý do & Công việc chi tiết |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `/` | `(public)/page.tsx` | Trang chủ Virtual Campus Experience | Logo FPT Polytechnic | **P0** | `UI-02` | **Giữ & thiết kế lại hoàn toàn** | — | Hero 360°/khuôn viên lớn (`100%`), 1 CTA chính `"Bắt đầu tham quan tự do"` (`/campus`), 1 CTA phụ `"Khám phá Open Day"` (`/events`), mini-map preview. Bỏ `QuickAdmissionForm`, `CampusMetricsBar` dày đặc, bỏ claim `Marzipano`/`Leaflet`. |
| 2 | `/campus` | `(immersive)/campus/page.tsx` | Trải nghiệm Tour 360° chính | Header (`Tham quan`) | **P0** | `UI-02` | **Giữ & nâng cấp toàn diện** | — | Panorama chiếm gần trọn viewport, glass HUD gọn + nút `Hide UI`, hotspot tọa độ `yaw/pitch`, dải thumbnail chọn cảnh, panel chi tiết địa điểm đóng/mở được, đồng bộ danh sách `sceneSlug`. |
| 3 | `/map` | `(immersive)/map/page.tsx` | Bản đồ GIS Khuôn viên QTSC Q.12 | Header (`Bản đồ`) | **P0** | `UI-02` | **Giữ & tập trung GIS P0** | — | Mặc định & chỉ hiển thị GIS ở P0 (**ẩn tab `Mô hình 3D WebGL`** ở P0, giữ file `Campus3DViewer.tsx` cho P1/P2). Nâng cấp bản đồ sáng/trực quan theo mẫu Tilton, click pin mở preview/drawer, sửa bug link `/locations?building=`. |
| 4 | `/locations` | `(public)/locations/page.tsx` | Danh mục Phòng Lab, Xưởng & Tiện ích | Từ Home, Map, Tour | **P0** | `UI-03` | **Giữ & tối giản hóa** | — | Sửa bug filter `?building=` (`split(" ")[2]` chữ `"t"` khớp nhầm `"tòa"`) và sửa sceneSlug `"campus"`. Card gọn: Ảnh, Tên, Tòa nhà/Tầng, nút `Xem 360°` và link chi tiết. Bỏ nhồi thông số thừa. |
| 5 | `/locations/[slug]` | `(public)/locations/[slug]/page.tsx` | Chi tiết 1 Không gian / Phòng Lab | Từ card `/locations` | **P0** | `UI-03` | **Giữ & đổ dữ liệu động theo slug** | — | Map đúng thông tin/ảnh/thiết bị/tòa nhà theo `slug` thay vì 1 mẫu tĩnh, nút CTA chính mở thẳng đúng cảnh trên `/campus?scene=...`. |
| 6 | `/events` | `(public)/events/page.tsx` | Trang Open Day (Công khai + Gated Program) | Header (`Open Day`) | **P0** | `UI-03` | **Giữ & thiết kế lại theo luồng 2 lớp** | — | Bỏ `TicketRegistrationModal` tự phát vé QR giả. Lớp công khai: lịch sự kiện, phiên theo giờ, địa điểm QTSC Q.12. Lớp có cổng: nút `"Đăng nhập tham gia Open Day"` (`/login?next=/events`) để mở chương trình dành riêng cho tài khoản được cấp. |
| 7 | `/games` | `(public)/games/page.tsx` | Minigame / Hoạt động tương tác Open Day | Từ `/events` (gỡ khỏi Header) | **P0 (tích hợp)** | `UI-03` | **Thu gọn & tích hợp vào Open Day** | Sau duyệt: `/events#program` hoặc giữ `/games` tối giản | Giữ trang gọn gàng tương thích liên kết cũ (`OpenDayBanner`, `admin/page.tsx`), gỡ khỏi Footer/Header chính, đồng bộ với chương trình Open Day (bỏ link sang `/portal` gây cụt luồng). |
| 8 | `/login` | `(auth)/login/page.tsx` | Cổng đăng nhập Tài khoản Open Day & Admin | Header (`Đăng nhập`) | **P0** | `UI-04` | **Giữ & viết lại sạch sẽ** | — | **Loại bỏ** các tuyên bố sai: `ISO/IEC 27001`, `TLS 1.3`, `bcrypt`, `EduID 2.0 SSO`. Bổ sung đầy đủ UI states: lỗi sai tài khoản, tài khoản khóa, luồng đổi mật khẩu lần đầu (prototype), hỗ trợ quên MK qua BTC (bỏ link `/contact`). Điều hướng sau login P0 hướng về `/events` (hoặc `/admin` tùy vai trò). |
| 9 | `/portal` | `(portal)/portal/page.tsx` | Cổng Sinh viên / Phụ huynh | Ẩn khỏi Nav chính | **P1 (Hoãn)** | `UI-04` | **Ẩn khỏi Nav, giữ route tương thích** | Đề xuất sau duyệt: `/events` | Chưa phát triển hệ thống portal phụ huynh phức tạp ở P0; giữ file route ở UI-04 dạng màn hình chuyển tiếp gọn tới `/events` & `/campus` để không vỡ link cũ từ `games` / `login`. |
| 10 | `/about` | `(public)/about/page.tsx` | Giới thiệu FPT Polytechnic (Chuyển tiếp) | Ẩn khỏi Nav; Footer link ngoài | **Chuyển tiếp / P2** | `UI-04` | **Thay bằng link ngoài `caodang.fpt.edu.vn`; giữ route chuyển tiếp tạm** | `https://caodang.fpt.edu.vn` (hoặc `/` + link ngoài) | Không nhân bản website giới thiệu trường. Gỡ khỏi nav; UI-04 thu gọn thành card chuyển tiếp kèm link chính thức + CTA Tour 360°. |
| 11 | `/contact` | `(public)/contact/page.tsx` | Liên hệ & Tư vấn (Chuyển tiếp) | Ẩn khỏi Nav; Footer link ngoài | **Chuyển tiếp / Gỡ bỏ** | `UI-04` | **Thay bằng link ngoài `caodang.fpt.edu.vn/lien-he`; bỏ form tự nhập** | `https://caodang.fpt.edu.vn/lien-he` | Bỏ form tuyển sinh/liên hệ trùng website chính. UI-04 thay nội dung bằng thông tin địa chỉ cơ sở CVPM Quang Trung Q.12 + nút mở `caodang.fpt.edu.vn/lien-he` và `/events`. |
| 12 | `/news` | `(public)/news/page.tsx` | Tin tức trường (Chuyển tiếp) | Ẩn khỏi Header & Footer | **Chuyển tiếp / Gỡ bỏ** | `UI-04` | **Không xây CMS tin tức; thay bằng link website trường** | `https://caodang.fpt.edu.vn/tin-tuc-poly` hoặc `/events` | Tin tức chung do `caodang.fpt.edu.vn` quản lý. UI-04 giữ trang chuyển tiếp gọn để tránh 404 trước khi bật redirect HTTP chính thức. |
| 13 | `/news/[slug]` | `(public)/news/[slug]/page.tsx` | Chi tiết bài viết (Chuyển tiếp) | Không có trên Nav | **Chuyển tiếp / Gỡ bỏ** | `UI-04` | **Giữ trang chuyển tiếp, loại bỏ claim `4K`** | `/news` hoặc `caodang.fpt.edu.vn` | Loại bỏ nội dung `"360 độ siêu nét 4K"` chưa kiểm chứng; giữ khung chuyển tiếp lịch sự trước khi cấu hình redirect sau khi duyệt mapping. |
| 14 | `/admin` | `admin/page.tsx` | Dashboard Vận hành Nội bộ P0 | **ẨN khỏi Footer** (URL trực tiếp) | **P0** | `UI-05` | **Giữ & nâng cấp chuẩn P0** | — | Gỡ link `/admin` khỏi `PublicFooter.tsx:162`. Sidebar còn đúng 6 mục P0 (`Dashboard`, `Địa điểm`, `Tour 360°`, `Open Day`, `Media`, `Tài khoản`). Gỡ Quick Action link 404 tới `/games`, `/news`. |
| 15 | `/admin/locations` | *(Chưa có file)* | Quản lý Địa điểm & GIS Markers | Sidebar Admin P0 | **P0** | `UI-05` | **Xây mới UI P0** | — | CRUD tòa nhà, phòng Lab, tầng, tọa độ GIS (`x, y`), trạng thái hiển thị. |
| 16 | `/admin/virtual-tour` | *(Chưa có file)* | Quản lý Tour 360° & Hotspot | Sidebar Admin P0 | **P0** | `UI-05` | **Xây mới UI P0** | — | Danh sách Scene 360°, thứ tự cảnh, liên kết ảnh Media, giao diện đặt Hotspot `yaw/pitch` & cảnh đích. |
| 17 | `/admin/events` | *(Chưa có file)* | Quản lý Sự kiện & Lịch Open Day | Sidebar Admin P0 | **P0** | `UI-05` | **Xây mới UI P0** | — | CRUD sự kiện Open Day, lịch phiên theo giờ, cấu hình cổng đăng nhập (`public` / `account_required`). |
| 18 | `/admin/media` | *(Chưa có file)* | Thư viện Ảnh 360° & Media | Sidebar Admin P0 | **P0** | `UI-05` | **Xây mới UI P0** | — | Upload dropzone UI, thư viện ảnh 360°/địa điểm, bộ lọc category, sao chép Asset URL & xem thử 360°. |
| 19 | `/admin/users` | *(Chưa có file)* | Quản lý Tài khoản & Import danh sách | Sidebar Admin P0 (gộp `import`/`roles`) | **P0** | `UI-05` | **Xây mới UI P0** | — | Cấp tài khoản tham gia Open Day / Admin, tab Import danh sách CSV/Excel hàng loạt, đặt lại mật khẩu / khóa tài khoản. |
| — | `/admin/3d-models`, `/admin/games`, `/admin/analytics`, `/admin/settings` | *(Chưa có file)* | Module Admin nâng cao | Ẩn khỏi Sidebar P0 | **P1/P2** | Sau MVP | **Hoãn sang P1/P2** | — | Không tạo link 404 trên Sidebar Admin P0; chỉ mở lại ở P1/P2 khi có tài sản `.glb` và Backend thực sự. |
| — | `/admin/contacts`, `/admin/news` | *(Chưa có file)* | CMS Tuyển sinh / Tin tức | Không có | **Loại bỏ** | — | **Loại bỏ hoàn toàn** | — | Nằm ngoài ranh giới sản phẩm Virtual Campus. |

---

## 4. Kiểm toán Phụ thuộc Nội bộ Cần Xử lý ở `UI-01` – `UI-05`

Khi triển khai từ `UI-01` trở đi, các vị trí cụ thể dưới đây trong codebase phải được xử lý đồng bộ để không còn link chết hoặc tuyên bố sai:

1. **`src/components/navigation/PublicHeader.tsx` (lines 43–49, 149, 217):** Đang chứa `News`, `Games`, nút CTA thừa — cần thu gọn về đúng **4 mục điều hướng chính** (`/campus`, `/map`, `/events`, `/login`) trong `UI-01`.
2. **`src/components/navigation/PublicFooter.tsx` (lines 60, 87, 139, 156, 159, 162):** Đang có link `/portal`, `/games`, `/about`, `/contact` và **`/admin` ("Quản trị CMS" ở line 162)** — cần ẩn `/admin`, dọn các link P1/loại bỏ, bổ sung link ngoài tới `https://caodang.fpt.edu.vn` ở `UI-01`.
3. **`src/components/home/QuickAdmissionForm.tsx`:** Gỡ bỏ khỏi Trang chủ (`src/app/(public)/page.tsx`) ở `UI-02` vì trùng form tuyển sinh `caodang.fpt.edu.vn/dang-ky-truc-tuyen`.
4. **`src/components/home/VirtualTourShowcase.tsx` (lines 19, 27, 44):** Đang hiển thị sai badge `"Marzipano"` và `"Leaflet GIS"` (trong khi thực tế dự án đang dùng Three.js sphere + SVG GIS tự dựng) — gỡ hoặc sửa lại ở `UI-02`.
5. **`src/components/home/FeaturedFacilities.tsx` (lines 29, 40, 51, 62) & `Hero360Viewer.tsx` (line 79):** Đang trỏ tới `?scene=it-lab`, `automation`, `studio`, `sports-field`, `campus` trong khi `CAMPUS_SCENES` ở `/campus` chỉ có `thu-vien`, `lab-it`, `studio-imac` — cần chuẩn hóa 1 bộ `sceneId` duy nhất ở `UI-02`.
6. **`src/app/(immersive)/map/page.tsx` (line 40):** Đang đặt `useState<"3d" | "gis">("3d")` — cần đổi mặc định sang GIS và ẩn tab 3D WebGL khỏi UI P0 ở `UI-02` (giữ file `Campus3DViewer.tsx`).
7. **`src/components/map/BuildingDetailDrawer.tsx` (line 99) & `src/app/(public)/locations/page.tsx` (lines 72, 85, 96–113):** Lỗi truyền tên tòa nhà sang bộ lọc `?building=` (`split(" ")[2]` = `"t"` khớp nhầm `"tòa"`) và `sceneSlug: "campus"` không tồn tại — sửa ở `UI-02` & `UI-03`.
8. **`src/components/events/TicketRegistrationModal.tsx` & `OpenDayBanner.tsx` (line 53):** Bỏ form tự đăng ký cấp vé QR giả ở `UI-03`; thay bằng điều hướng xem lịch công khai & đăng nhập bằng tài khoản được cấp.
9. **`src/app/(auth)/login/page.tsx` (lines 24, 45, 53, 65, 79, 148) & `(auth)/layout.tsx` (line 43):** Xóa bỏ `ISO/IEC 27001`, `TLS 1.3`, `bcrypt`, `EduID 2.0`, `SSO`; đổi `router.push("/portal")` sang luồng Open Day/Admin; đổi link `/contact` ở nút `"Quên mật khẩu?"` ở `UI-04`.
10. **`src/app/admin/layout.tsx` (lines 6–19) & `src/app/admin/page.tsx` (lines 33, 40, 47):** Thu gọn Sidebar Admin từ 12 mục (11 link 404) về đúng **6 màn hình Admin P0** (`UI-01` / `UI-05`), gỡ link trỏ về `/games`, `/news`.

---

## 5. Lộ trình 7 Giai đoạn UI Chính thức (`UI-00` -> `UI-06`)

| Giai đoạn | Tên giai đoạn | Mục tiêu & Phạm vi | Trạng thái |
|---|---|---|---|
| **UI-00** | Audit, Chốt Sitemap, Mapping, Design System & UI Blueprint | Sửa lỗi nền CSS/build/lint, kiểm kê tài sản & route, ban hành Mapping, Design System và UI Blueprint để duyệt trước khi code UI-01 | **Đang hoàn tất** |
| **UI-01** | Foundation, Header (4 mục), Footer, Layout Shells & Shared Components | Thu gọn Header 4 mục, sửa Footer (ẩn `/admin`, thêm link `caodang.fpt.edu.vn`), chuẩn hóa Buttons/Cards/Inputs/Drawers/Modals/States theo Design System | Chờ duyệt UI-00 |
| **UI-02** | Trang chủ (`/`), Tour 360° (`/campus`) & Bản đồ GIS (`/map`) | Thiết kế lại Trang chủ hero-first, Tour 360° full-bleed + Hide UI + spatial callouts, Bản đồ GIS làm trung tâm (ẩn 3D WebGL tab ở P0) | Sau UI-01 |
| **UI-03** | Địa điểm (`/locations`, `/locations/[slug]`), Open Day (`/events`) & `/games` | Làm gọn Danh mục & Chi tiết địa điểm (sửa lỗi filter/slug), Open Day 2 chế độ (lịch công khai + cổng tài khoản) & tích hợp Minigame | Sau UI-02 |
| **UI-04** | Login (`/login`), Portal (`/portal`) & Các Route Chuyển tiếp | Làm sạch Login (bỏ tuyên bố TLS/ISO, bổ sung states & đổi MK lần đầu), xử lý tạm `/portal`, `/about`, `/contact`, `/news`, `/news/[slug]` | Sau UI-03 |
| **UI-05** | Hệ thống Admin P0 (`6` màn hình) | Hoàn thiện Dashboard (`/admin`) + 5 route mới: `/admin/locations`, `/admin/virtual-tour`, `/admin/events`, `/admin/media`, `/admin/users` (kèm Import) | Sau UI-04 |
| **UI-06** | Responsive (`1440/1280/768/390/360`), UI QA, States & Nghiệm thu MVP | Chụp & kiểm tra đủ 5 viewport trên 19 URL, kiểm thử đầy đủ Loading/Empty/Error/Focus/Disabled states, xác nhận `0` console error / `0` overflow | Sau UI-05 |
