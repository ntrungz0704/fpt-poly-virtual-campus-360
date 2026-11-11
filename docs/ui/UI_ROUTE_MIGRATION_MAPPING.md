# UI_ROUTE_MIGRATION_MAPPING — Đối Soát Route, Điều Hướng & Đề Xuất Chuyển Tiếp

> **Quy tắc an toàn tuyệt đối:** Chưa xóa, chưa đổi tên, và chưa gắn redirect cho bất kỳ route hiện hành nào trong giai đoạn thiết kế này. Mọi thay đổi liên kết/chuyển hướng dưới đây đều ở trạng thái **`Proposal Pending Approval` (Chờ Chủ dự án phê duyệt trước khi thực thi UI-02+)**.

---

## 1. Bảng Đối Soát Toán Học Route (`14` Hiện Có + `5` Admin P0 Mới = `19`)

| Nhóm Route | Số lượng | Danh sách URL cụ thể | Trạng thái trên ổ đĩa (`apps/web/src/app`) |
|---|---:|---|---|
| **Existing Core Product Routes (Giữ & Tái thiết kế)** | **9** | `/`, `/campus`, `/map`, `/locations`, `/locations/[slug]`, `/events`, `/login`, `/portal`, `/admin` | Đã có đủ `9` tệp `page.tsx` |
| **Existing Transitional / Out-of-Boundary Routes (Giữ tạm — Đề xuất xử lý)** | **5** | `/about`, `/contact`, `/news`, `/news/[slug]`, `/games` | Đã có đủ `5` tệp `page.tsx` |
| **Proposed New P0 Admin Routes (Cần tạo mới)** | **5** | `/admin/locations`, `/admin/virtual-tour`, `/admin/events`, `/admin/media`, `/admin/users` | `0` tệp trên ổ đĩa *(sidebar `admin/layout.tsx` đã gắn link)* |
| **TỔNG P0 ROUTE / MÀN HÌNH PHÂN BIỆT** | **19** | **19 Unique URL Routes = 19 Distinct P0 Screens** *(không đếm trùng `/admin`)* | `14` hiện có + `5` mới |
| **Deferred Admin Routes (Hoãn sang P1/P2)** | **4** | `/admin/3d-models` (P2 chờ `.glb`), `/admin/games` (P1/P2), `/admin/analytics` (P2), `/admin/settings` (P2) | `0` tệp — Không đưa vào P0 |
| **Excluded Out-of-Boundary Admin Routes** | **2** | `/admin/contacts`, `/admin/news` | Loại bỏ (thuộc website chính thức) |
| **Consolidated / Canonicalized Admin Naming** | **3** | `/admin/tours-360` → `/admin/virtual-tour`; `/admin/import` & `/admin/roles` → hợp nhất vào `/admin/users` | Đã khớp trong `admin/layout.tsx` |

*(Ghi chú kỹ thuật về Auth sub-flows: Luồng **Đổi mật khẩu bắt buộc lần đầu** và **Quên mật khẩu** ở P0 được thiết kế dưới dạng view chuyển trạng thái ngay trong `/login` hoặc `/portal` để giữ nguyên cấu trúc 19 route gọn nhẹ; nếu Chủ dự án muốn tách route URL riêng `/change-password`, có thể bổ sung ngay trong phase Auth mà không ảnh hưởng ranh giới P0).*

---

## 2. Bản Đồ Quyết Định Cho Từng Route (`19` P0 + `4` Deferred)

### 2.1. Core Active Routes (`9` hiện có + `5` mới P0)

| URL Route | Hành động đề xuất | Đích đến / Vai trò mới | Điều kiện kích hoạt |
|---|---|---|---|
| `/` | **Keep & Redesign** | Điểm khởi đầu tham quan khuôn viên QTSC (Hero Panorama + lối vào `/campus`, `/map`, `/events`) | Duyệt Blueprint Section 1 |
| `/campus` | **Keep & Redesign** | Trải nghiệm 360° toàn màn hình (HUD tối giản, nút Hide UI, sửa WebGL leak) | Cần ảnh equirectangular 2:1 |
| `/map` | **Keep & Redesign** | Bản đồ GIS nền sáng QTSC mặc định + Drawer tắt sẵn + **ẩn tab 3D WebGL** | Duyệt ẩn tab 3D P0 |
| `/locations` | **Keep & Redesign + Bugfix** | Danh mục không gian đơn giản hóa thẻ + sửa filter `?building=` + EmptyState | Duyệt Card Budget |
| `/locations/[slug]` | **Keep & Redesign + Fix** | Đọc động theo `slug`, hiển thị NotFoundState nếu sai slug, nối `/campus?scene=...` | Đồng bộ data QTSC |
| `/events` | **Keep & Redesign** | Công khai lịch Open Day & phân tách vùng cần đăng nhập (`/login?next=/portal`) | Duyệt bỏ tự đăng ký VIP |
| `/login` | **Keep & Redesign** | Đăng nhập tài khoản cấp bởi trường + view Đổi MK lần đầu + view Hướng dẫn quên MK | Duyệt bỏ nhãn EduID/ISO |
| `/portal` | **Keep & Redesign** | Không gian Tham dự Open Day (QR check-in + Lịch cá nhân + Hoạt động Open Day) | Duyệt chuyển định vị |
| `/admin` | **Keep & Redesign** | Bảng tác vụ vận hành nội bộ (Action Queue + Health + Audit log) | Duyệt bỏ KPI trang trí |
| `/admin/locations` | **Create New (P0)** | CRUD Tòa nhà/Phòng + gán tọa độ GIS + Publish toggle | Phase UI Admin P0 |
| `/admin/virtual-tour` | **Create New (P0)** | Quản lý Scene 360° + Editor Hotspot (`yaw`/`pitch`) + Preview | Phase UI Admin P0 |
| `/admin/events` | **Create New (P0)** | Quản lý Lịch Open Day (Public vs Restricted) + Check-in QR | Phase UI Admin P0 |
| `/admin/media` | **Create New (P0)** | Thư viện Media 2D & Panorama 2:1 + Kiểm tra tỷ lệ + Reference guard | Phase UI Admin P0 |
| `/admin/users` | **Create New (P0)** | Quản lý Tài khoản + Import Excel/CSV 3 bước + Cấp MK tạm/Khóa | Phase UI Admin P0 |

### 2.2. Nhóm Route Chuyển Tiếp / Ngoài Ranh Giới (`5` Route Chờ Phê Duyệt Chủ Dự Án)

| Route hiện có | Trạng thái hiện tại | Phương án A *(Khuyến nghị — Giữ URL mượt, không làm gãy link)* | Phương án B *(Cắt gọn triệt để)* | Trạng thái |
|---|---|---|---|---|
| `/about` | Nội dung trùng `caodang.fpt.edu.vn` & liệt kê 5 cơ sở | Giữ làm trang **"Giới thiệu Virtual Campus Q.12 & Hướng dẫn sử dụng"** siêu gọn + link chính thức ra `https://caodang.fpt.edu.vn/` | Redirect `308/301` thẳng ra `https://caodang.fpt.edu.vn/` | **`Proposal Pending Approval`** |
| `/contact` | Form tư vấn tuyển sinh giả + sai phường | Biến thành trang **"Chỉ đường đến CVPM Quang Trung Q.12 & Hỗ trợ Open Day"** + nút chuyển ra `https://caodang.fpt.edu.vn/lien-he` | Redirect thẳng ra `https://caodang.fpt.edu.vn/lien-he` | **`Proposal Pending Approval`** |
| `/news` | Tin tức tuyển sinh/chung trùng website trường | Gắn **Bridge Notice** gọn giới thiệu tin chính thức tại `https://caodang.fpt.edu.vn/` (hoặc gỡ khỏi mọi menu điều hướng) | Redirect ra `https://caodang.fpt.edu.vn/` & ẩn khỏi Web App | **`Proposal Pending Approval`** |
| `/news/[slug]` | Bỏ qua `slug`, ảnh ngoài `lh3`, nút `alert()` | Theo cùng quyết định của `/news`; nếu giữ tạm thì sửa đọc đúng `slug` + bỏ `alert()` | Redirect về `/news` hoặc ra `https://caodang.fpt.edu.vn/` | **`Proposal Pending Approval`** |
| `/games` | Quiz 5 câu công khai + BXH 5 người cứng | Tạm giữ ở P0 với nhãn *"Thử thách Khám phá Khuôn viên (Bản thử)"* hoặc gộp vào phần hoạt động của `/portal` (Open Day Workspace) ở P1 | Hợp nhất & Redirect `/games` → `/events` (nếu chưa login) hoặc `/portal` (khi đã login) | **`Proposal Pending Approval`** |

---

## 3. Ma Trận Điều Hướng & Vá Toàn Bộ Liên Kết Chéo Bị Gãy

### 3.1. Điều hướng Shell Toàn Cục (`Navigation Menus`)
| Vị trí | Mục hiện tại (UI-01) | Đề xuất sau khi Redesign | Ghi chú |
|---|---|---|---|
| **PublicHeader Desktop & Mobile Drawer** | Logo `/` · `Tham quan` (`/campus`) · `Bản đồ` (`/map`) · `Open Day` (`/events`) · `Đăng nhập` (`/login`) | **Giữ đúng 4–5 mục gọn này**, bổ sung hoặc đặt `Địa điểm` (`/locations`) ở menu phụ/footer hoặc đổi thành: `Tham quan 360°` (`/campus`), `Bản đồ GIS` (`/map`), `Địa điểm` (`/locations`), `Open Day` (`/events`), nút `Đăng nhập` (`/login`). | Tránh đưa `/news`, `/contact`, `/admin` lên PublicHeader; `CampusSelectorModal` mồ côi không gắn vào Q.12-only header. |
| **ImmersiveLayout (`/campus`, `/map`)** | `Tour 360°` (`/campus`), `Bản đồ GIS` (`/map`), `Open Day` (`/events`), `Home` (`/`) | **Giữ nguyên shell này**; **XÓA thanh sub-bar trùng** ngay bên trong `map/page.tsx`! | Chỉ giữ đúng 1 thanh bar 56px trên đỉnh. |
| **PortalLayout (`/portal`)** | Logo `/` · `Tham quan` (`/campus`) · `Open Day` (`/events`) | Bổ sung link `Lịch trình & QR (/portal)` + nút `Đăng xuất` (`/login`) + hiển thị vai trò người dùng. | Gỡ chữ `(P1 PORTAL)` kỹ thuật trên header. |
| **AdminLayout (`/admin*`)** | `6` module: `/admin`, `/admin/locations`, `/admin/virtual-tour`, `/admin/events`, `/admin/media`, `/admin/users` + `Xem trang công khai` `/` + `Logout` `/login` | **Giữ nguyên 6 module P0 đã chuẩn hóa**, chỉ thay thẻ `"UI Prototype"` / `"AD"` bằng thông tin phiên operator khi kết nối auth. | Khớp 100% với `5` route P0 mới cần tạo. |

### 3.2. Vá Toàn Bộ Deep-Link & Query Params Bị Gãy Trong Mã Nguồn

| Nguồn liên kết (File & Line hiện tại) | URL bị lỗi hiện nay | Vấn đề | Đích sửa chính xác (Canonical Target) |
|---|---|---|---|
| `Hero360Viewer.tsx` (hotspot `sports`) | `/campus?scene=campus` | ID `campus` không tồn tại | `/campus?scene=khu-the-thao` *(khi bổ sung scene chuẩn)* hoặc `/map?building=SPO-QTSC` |
| `FeaturedFacilities.tsx:29` | `/campus?scene=it-lab` | Sai ID (ID thật là `lab-it`) | `/campus?scene=lab-it` |
| `FeaturedFacilities.tsx:40` | `/campus?scene=automation` | Scene không tồn tại | Tạo scene chuẩn hợp lệ hoặc trỏ `/locations` / `/campus?scene=thu-vien` |
| `FeaturedFacilities.tsx:51` | `/campus?scene=studio` | Sai ID (ID thật là `studio-imac`) | `/campus?scene=studio-imac` |
| `FeaturedFacilities.tsx:62` | `/campus?scene=sports-field` | Scene không tồn tại | `/map?building=SPO-QTSC` (hoặc `/campus?scene=khu-the-thao` sau khi có ảnh) |
| `Campus3DViewer.tsx` (`bldg-sports`, `bldg-overpass`) & `locations/page.tsx` (`hall-500`, `sports-qtsc`) | `/campus?scene=campus` | Scene `campus` không tồn tại | Trỏ tới scene ID có thật hoặc ẩn nút `Xem 360°` nếu phòng đó chưa có panorama |
| `BuildingDetailDrawer.tsx:99` | `/locations?building=Tòa Nhà F` | `locations/page.tsx:111` cắt chuỗi `"T"` gây lọc nhầm Tòa T | Chuẩn hóa tham số **`/locations?building=TOA-F`** (so khớp bằng `buildingCode` chính xác `TOA-T`, `TOA-F`, `TOA-P`, `INNOVATION`, `SPORTS`) |
| `locations/[slug]/page.tsx:86` | `href="/campus"` *(mất scene)* & CTA `"Đăng ký tham quan ngay"` → `/events` | Không dẫn thẳng vào cảnh tương ứng và dẫn nhầm sang đăng ký VIP | `/campus?scene=<room.sceneId>` (hoặc `/map?building=<room.buildingCode>` nếu chưa có ảnh 360°) |
| `admin/page.tsx` (6 shortcut cards) | Trỏ `/map` (*"Mô Hình 3D WebGL"*), `/locations`, `/events`, `/games`, `/news` | Lối tắt Admin lại nhảy sang giao diện công khai thay vì trang CRUD | Đổi toàn bộ 4–6 lối tắt trên `/admin` sang **đúng các route `/admin/*` nội bộ** (`/admin/locations`, `/admin/virtual-tour`, `/admin/events`, `/admin/media`, `/admin/users`) |

---

## 4. Đồng Bộ Dữ Liệu Địa Danh & Tên Thực Thể Chuẩn QTSC

1. **Cơ sở duy nhất trong phạm vi sản phẩm:** `Trường Cao đẳng FPT Polytechnic — Cơ sở TP.HCM (CVPM Quang Trung, Lô 24, Quận 12)`.
2. **Điểm cần Chủ dự án xác nhận 1 lần trước khi code UI-02:** Thống nhất 1 tên phường duy nhất thay cho tình trạng xung đột `P. Trung Mỹ Tây` vs `P. Tân Chánh Hiệp` hiện có giữa `Campus3DViewer.tsx`, `PublicFooter.tsx`, `contact/page.tsx`, `games/page.tsx` và `OpenDayMiniGame.tsx`. *(Lưu ý địa chỉ chính thức của CVPM Quang Trung Lô 24 Quận 12 trên hệ thống thường dùng Phường Tân Chánh Hiệp hoặc Đường Tô Ký/Quang Trung giáp ranh Trung Mỹ Tây — tài liệu thiết kế khóa trường `OFFICIAL_CAMPUS_ADDRESS` thành 1 hằng số dùng chung trong `packages/shared` để 100% màn hình không bao giờ lệch nhau).*
