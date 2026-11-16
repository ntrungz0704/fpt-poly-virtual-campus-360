# 14 — KẾ HOẠCH TẠO ẢNH GIAO DIỆN MỚI (REDESIGN PAGE INVENTORY & IMAGE PLAN)

## 1. Danh Sách Mã Định Danh Trang (Page IDs) & Chỉ Mục Tạo Ảnh UI

Để việc sinh ảnh giao diện bằng AI (như Midjourney, DALL-E, Imagen hoặc Figma AI) đạt chất lượng cao nhất, mỗi màn hình được chuẩn hóa mã ID và chia thành **18 ảnh UI độc lập**:

| Mã ID | Tên màn hình | Tuyến đường | Nhóm phân hệ | Layout chính | Mức ưu tiên | Đề xuất tạo ảnh |
|:---:|---|---|---|---|:---:|---|
| **PUB-001** | Trang chủ Virtual Campus | `/` | Public | Portal Landing | **Cao nhất (P0)** | Ảnh Hero banner 3D Campus, khối thống kê và lối vào Tour 360°. |
| **PUB-002** | Giới thiệu trường | `/about` | Public | Content Storytelling | **P1** | Bố cục câu chuyện lịch sử, cơ sở vật chất và triết lý đào tạo. |
| **PUB-003** | Liên hệ tuyển sinh | `/contact` | Public | Split Form & Map | **P2** | Form liên hệ hiện đại kèm thông tin đường đi cơ sở QTSC. |
| **PUB-004** | Sự kiện Open Day | `/events` | Public | Event Showcase | **P0** | Lịch trình tương tác, diễn giả và nút đăng ký nhận vé. |
| **PUB-005** | Minigame & Quay số | `/games` | Public | Gamification Arcade | **P1** | Bàn quay số may mắn neon/công nghệ, bảng thành tích. |
| **PUB-006** | Danh mục địa điểm | `/locations` | Public | Grid Filter | **P1** | Thẻ địa điểm (lab, hội trường) với ảnh đẹp và tag phân loại. |
| **PUB-007** | Bảng tin tức | `/news` | Public | Magazine Grid | **P2** | Lưới tin tức chia cột với bài viết tiêu điểm lớn. |
| **AUTH-001**| Đăng nhập tập trung | `/login` | Auth | Split Auth Screen | **P0** | Cột trái ảnh campus công nghệ, cột phải form nhập sang trọng. |
| **AUTH-002**| Buộc đổi mật khẩu | `/change-password` | Auth | Focused Security Card | **P1** | Thẻ bảo mật giữa màn hình với checklist độ mạnh mật khẩu. |
| **CAMP-001**| Tour tương tác 360° | `/campus` | Immersive | Immersive Canvas | **P0** | Tràn viền 100%, floating control dock, radar bản đồ góc dưới. |
| **CAMP-002**| Bản đồ số GIS khuôn viên | `/map` | Immersive | GIS Map View | **P0** | Bản đồ số QTSC với các khối tòa nhà 3D isometric nổi bật. |
| **STUD-001**| Dashboard sinh viên | `/portal` | Student | Student Dashboard | **P0** | Lời chào sinh viên, thẻ điểm XP, widget vé sắp tới. |
| **STUD-002**| Hồ sơ & Tiến trình XP | `/portal/profile` | Student | Profile & Level Badge | **P1** | Thẻ sinh viên điện tử, thanh cấp độ (Level 2) và lịch sử XP. |
| **STUD-003**| Vé Open Day & QR | `/portal/tickets` | Student | Boarding Pass Ticket | **P0** | Thẻ vé phong cách sự kiện quốc tế, mã QR to nét để check-in. |
| **PRNT-001**| Cổng phụ huynh | `/parent` | Parent | Family Guardian View | **P0** | Thẻ con em liên kết, tiến độ học tập và nút gửi yêu cầu. |
| **ADMN-001**| Dashboard quản trị | `/admin` | Admin | SaaS Overview | **P0** | Thống kê số lượng sinh viên, vé check-in, biểu đồ trực quan. |
| **ADMN-002**| Quản lý dữ liệu bảng | `/admin/locations` | Admin | Enterprise Data Table | **P1** | Bảng dữ liệu SaaS chuẩn chỉnh với bộ lọc, search và Drawer. |
| **ADMN-003**| Studio biên tập 360° | `/admin/virtual-tour` | Admin | 3-Column Studio | **P0** | Không gian studio 3 cột: Cây địa điểm - Canvas 360 - Bảng thuộc tính. |

---

## 2. Kế Hoạch 7 UI States Quan Trọng Cần Tạo Ảnh Chi Tiết

1. **STATE-01:** Modal Quét mã QR Check-in cổng sự kiện (Dành cho cán bộ lễ tân).
2. **STATE-02:** Drawer Nhập liệu thêm mới địa điểm/phòng học (Dành cho Admin).
3. **STATE-03:** Modal Phụ huynh nhập mã sinh viên để gửi yêu cầu liên kết.
4. **STATE-04:** Modal Sinh viên nhận thông báo và duyệt liên kết từ phụ huynh.
5. **STATE-05:** Mobile Drawer Menu trượt từ cạnh phải cho thiết bị di động.
6. **STATE-06:** Modal Làm bài thi trắc nghiệm Quiz trực tiếp với đồng hồ đếm ngược.
7. **STATE-07:** Toast & Pháo hoa chúc mừng thăng cấp XP / Quay trúng thưởng.
