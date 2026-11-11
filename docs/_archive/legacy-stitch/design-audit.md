# FPT Polytechnic Virtual Campus 360° — Design Audit Report

> **Trạng thái**: Hoàn thành kiểm kê toàn diện  
> **Thời điểm**: 10/11/2026  
> **Nguồn kiểm tra**: Thư mục thực tế `E:\Virtual Campus FPT Poly` (`desktop/` và `mobile/`)  
> **Kiến trúc đích**: Next.js App Router + TypeScript + Tailwind CSS (Monorepo)

---

## 1. TỔNG QUAN KIỂM KÊ WORKSPACE

Thư mục gốc bao gồm hai nhánh nguồn xuất trực tiếp từ **Google Stitch**:
1. `desktop/stitch_fpt_polytechnic_virtual_campus/`
2. `mobile/stitch_fpt_polytechnic_virtual_campus/`

Toàn bộ các thư mục con đều chứa tệp mã nguồn HTML hoàn chỉnh (`code.html`), một số thư mục có ảnh chụp thiết kế gốc (`screen.png`), và cả hai nhánh đều có tài liệu quy chuẩn thiết kế `DESIGN.md`.

---

## 2. BẢNG KIỂM KÊ CHI TIẾT TỪNG TRANG NGUỒN

| Mã Stitch | Tên thư mục Desktop | Tệp tin Desktop | Tên thư mục Mobile | Tệp tin Mobile | Đánh giá hiện trạng |
|---|---|---|---|---|---|
| **Home (Chính)** | `fpt_polytechnic_virtual_campus_360_trang_ch` | `code.html` (55.6 KB)<br>`screen.png` (866 KB) | *(Kế thừa từ page_01_mobile)* | — | **Bản chuẩn Desktop**: Đầy đủ 360° Hero Viewport, Live Hotspots, HUD controls, Bento grid, Testimonials, Quick registration form. |
| **Page 01** | `page_01_fpt_polytechnic_virtual_campus_360_desktop` | `code.html` (39.9 KB) | `page_01_fpt_polytechnic_virtual_campus_360_mobile` | `code.html` (23.2 KB) | Bản rút gọn của Trang chủ. Phiên bản mobile của page_01 tương thích chặt chẽ với cấu trúc `trang_ch`. |
| **Page 02** | `page_02_about_fpt_polytechnic_desktop` | `code.html` (37.1 KB) | `page_02_about_fpt_polytechnic_mobile` | `code.html` (25.4 KB) | **Giới thiệu**: Lịch sử, sứ mệnh, tầm nhìn, triết lý "Thực học - Thực nghiệp", tổ hợp Trịnh Văn Bô, cơ sở vật chất. |
| **Page 03** | `page_03_virtual_campus_360_exploration_desktop` | `code.html` (50.0 KB) | `page_03_virtual_campus_360_exploration_mobile` | `code.html` (34.6 KB)<br>`screen.png` | **Virtual Campus 360°**: Trình duyệt không gian đa điểm, thanh điều hướng Scene, Hotspots đa năng, Mini Map vị trí. |
| **Page 04** | `page_04_3d_campus_explorer_desktop` | `code.html` (40.7 KB)<br>`screen.png` | `page_04_3d_campus_explorer_mobile` | `code.html` (25.4 KB)<br>`screen.png` | **3D Campus Digital Twin**: Chứa Three.js script hoàn chỉnh dựng mô hình khối tòa nhà T, ánh sáng mặt trời, đổ bóng, sương mù. |
| **Page 05** | `page_05_fpt_polytechnic_campus_gis_map_desktop` | `code.html` (51.2 KB)<br>`screen.png` | `page_05_fpt_polytechnic_campus_gis_map_mobile` | `code.html` (25.6 KB)<br>`screen.png` | **Campus GIS Map**: Bản đồ vị trí khuôn viên, hệ thống hạ tầng, phân vùng chức năng và định tuyến giao thông. |
| **Page 06** | `page_06_building_and_room_details_desktop` | `code.html` (69.7 KB)<br>`screen.png` | `page_06_building_and_room_details_mobile` | `code.html` (36.3 KB)<br>`screen.png` | **Chi tiết tòa nhà & Phòng học**: Sơ đồ tầng (Floor Directory), danh sách phòng Lab, thư viện số, studio iMac, thông số kỹ thuật. |
| **Page 07** | `page_07_fpt_polytechnic_open_day_desktop` | `code.html` (69.4 KB)<br>`screen.png` | `page_07_fpt_polytechnic_open_day_mobile` | `code.html` (34.8 KB) | **Ngày hội Open Day**: 4 trải nghiệm đặc quyền, lịch trình sự kiện chi tiết, diễn giả, form đăng ký tham gia, vé mời số. |
| **Page 08** | *(Chưa có thư mục trong Stitch)* | — | *(Chưa có thư mục)* | — | **Liên hệ & Tư vấn**: Sẽ phát triển trang `/contact` dựa trên form tư vấn chuẩn từ Header/Footer và Open Day. |
| **Page 09** | `page_09_fpt_polytechnic_news_and_events_desktop` | `code.html` (59.1 KB)<br>`screen.png` | `page_09_fpt_polytechnic_news_and_events_mobile` | `code.html` (34.2 KB)<br>`screen.png` | **Tin tức & Sự kiện**: Lưới bài viết, bài viết tiêu điểm, lọc danh mục, lịch sự kiện học đường. |
| **Page 10** | `page_10_news_article_detail_page_desktop` | `code.html` (52.4 KB)<br>`screen.png` | `page_10_mobile_news_article_detail` | `code.html` (29.0 KB)<br>`screen.png` | **Chi tiết bài viết**: Nội dung chuyên sâu (Open Day 2025, Poly Hackathon), mục lục, tương tác chia sẻ, bài viết liên quan. |
| **Page 11** | `page_11_student_and_parent_portal_desktop` | `code.html` (37.9 KB) | `page_11_student_and_parent_portal_mobile` | `code.html` (30.6 KB) | **Portal Sinh viên & Phụ huynh**: Dashboard cá nhân, vé Open Day số, lịch trình tham quan cá nhân hóa, chỉ số hoạt động. |
| **Page 12** | `page_12_account_login_and_profile_management_desktop` | `code.html` (42.0 KB) | *(Thiếu source mobile riêng)* | — | **Đăng nhập & Quản lý hồ sơ**: Màn hình xác thực bảo mật SSO/EduID, form đăng nhập, đổi mật khẩu và quản lý hồ sơ. |
| **3D Engine** | *(Tích hợp trong page_04)* | — | `three.js` | `code.html` (10.9 KB) | **Mô đun Three.js độc lập**: Toàn bộ thuật toán khởi tạo scene 3D, ánh sáng, vật liệu tòa nhà được tách riêng. |

---

## 3. PHÂN TÍCH SO SÁNH TRANG CHỦ

### 3.1. `fpt_polytechnic_virtual_campus_360_trang_ch` (Bản nâng cấp 55.6 KB)
- **360° Hero Interactive Viewport**: Canvas toàn cảnh tích hợp sẵn scrim chuyển màu, 4 điểm Hotspot tương tác (Tòa nhà Alpha, Lab IT & IoT, Thư viện số Poly, Sân thể thao) với hiệu ứng sóng radar ping và Floating Node Card khi hover.
- **HUD Điều khiển**: Nút chọn nhanh cơ sở (Hà Nội, Đà Nẵng, TP.HCM, Cần Thơ, Tây Nguyên), cụm phím xoay 360, zoom, la bàn la bàn xoay.
- **Dải chỉ số ấn tượng**: 5 cơ sở toàn quốc, 97.7% sinh viên có việc làm, 50.000+ sinh viên, 100+ đối tác doanh nghiệp.
- **Bento Grid Không gian nổi bật**: Lọc chuyên mục (Giảng đường & Lab, Sáng tạo & Media, Tiện ích), thẻ hiển thị chi tiết hình ảnh thực tế.
- **Banner Open Day 2025 & VR Tour**: Card giới thiệu ngày hội, kết nối trải nghiệm thực tế ảo.
- **Form Đăng ký nhanh (Quick Action)**: Hỗ trợ phụ huynh và học sinh để lại thông tin xét tuyển hoặc tham quan trực tiếp.

### 3.2. `page_01_fpt_polytechnic_virtual_campus_360_desktop` (Bản 39.9 KB)
- Layout 2 cột kiểu truyền thống (Hero text bên trái, mockup 360 bên phải).
- Cấu trúc ít tính năng hơn so với bản `trang_ch`.

👉 **Kết luận lựa chọn**: Sử dụng `fpt_polytechnic_virtual_campus_360_trang_ch` làm nền tảng chính cho Desktop và phối hợp nhịp nhàng với `page_01_mobile` trên thiết bị di động.

---

## 4. PHÂN TÍCH MÃ NGUỒN THREE.JS 3D

Trong `desktop/page_04_3d_campus_explorer_desktop/code.html` và `mobile/three.js/code.html`:
- **Thư viện sử dụng**: Three.js r125 (`three.min.js`).
- **Cấu hình không gian**:
  - `scene.background = new THREE.Color(0x0f172a)` (Slate-900 digital twin atmospheric theme).
  - `scene.fog = new THREE.FogExp2(0x0f172a, 0.0028)`.
  - `camera`: PerspectiveCamera(45, width / height, 0.1, 2000), tọa độ `(160, 130, 210)`.
  - `renderer`: WebGLRenderer({ antialias: true, alpha: true }) với soft shadow map (`THREE.PCFSoftShadowMap`).
- **Hệ thống chiếu sáng**:
  - `AmbientLight(0xdbeafe, 0.95)`.
  - `DirectionalLight(0xffedd5, 1.4)` (ánh sáng mặt trời đổ bóng, góc `(220, 280, 160)`).
  - `DirectionalLight(0x38bdf8, 0.85)` (Blue rim light phản xạ).
  - `PointLight(0xf36f21, 1.6, 180)` (Đèn nhấn sắc cam FPT tại trung tâm).
- **Vật liệu và khối kiến trúc**:
  - Khối đế sân cỏ `0x1e293b`, đường giao thông `0x0f172a`, quảng trường `0x334155`.
  - Các khối tòa nhà Academic Complex với kính phản quang và khung cam nhận diện.

👉 **Kế hoạch chuyển đổi**: Tái cấu trúc thành component `CampusCanvas` và `CampusScene` trong Next.js sử dụng Dynamic Import (`next/dynamic` với `ssr: false`) để tránh lỗi hydration và tối ưu tải trang.

---

## 5. NHỮNG ĐIỂM CẦN XỬ LÝ ĐẶC THÙ

1. **Thiếu thư mục `page_08` (Liên hệ)**:
   - Xây dựng trang `/contact` hoàn chỉnh với thông tin hotline, email, địa chỉ 5 cơ sở, bản đồ vị trí, danh sách câu hỏi thường gặp (FAQ) và Form gửi yêu cầu tư vấn kết nối trực tiếp với backend.
2. **Trang `page_12` (Đăng nhập & Profile)**:
   - Tách thành 2 route độc lập:
     - `/login`: Form đăng nhập bảo mật (SSO EduID 2.0, mã sinh viên/SĐT phụ huynh, ẩn hiện mật khẩu, ghi nhớ đăng nhập).
     - `/portal`: Dashboard hồ sơ sinh viên/phụ huynh, thông báo và lịch trình.
3. **Màn hình Mobile cho Login**:
   - Dựng giao diện mobile responsive hoàn chỉnh cho `/login` dựa trên design tokens và form chuẩn của Desktop page 12.
4. **Gamification (`/games`) & Admin CMS (`/admin`)**:
   - Dựng mới giao diện Gamification (Quiz, thử thách tìm hiểu trường, bảng xếp hạng XP).
   - Dựng mới Admin CMS theo kiến trúc 12 module quản trị tại Phần V.
