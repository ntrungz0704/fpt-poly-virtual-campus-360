# 06 — KIỂM TOÁN CHI TIẾT TRẢI NGHIỆM GIAO DIỆN (COMPLETE UI/UX AUDIT)

## 1. Đánh Giá Trực Quan (Visual Design)

Qua kiểm tra 50 ảnh chụp thực tế tại các độ phân giải 1440x900 (Desktop) và 390x844 (Mobile):
- **Phân cấp thị giác (Visual Hierarchy):** Đang bị phân mảnh. Trang chủ và trang công cộng dùng màu cam FPT (`#F26F21`), nhưng trang Admin và Portal lại có chỗ dùng màu xanh indigo mặc định của Tailwind.
- **Typography:** Đang dùng hệ font hệ thống không đồng nhất giữa các thẻ heading và body. Khoảng cách dòng (`leading`) ở các trang bài viết tin tức chưa tối ưu cho trải nghiệm đọc lâu.
- **Nút bấm & Tương tác (Button Hierarchy):** Chưa có quy chuẩn rõ ràng giữa nút Primary (Cam FPT), Secondary (Xám trung tính), Ghost và Danger. Một số nút trong Admin có kích thước không đồng đều.

---

## 2. Kiểm Toán Hành Vi Khung Nhìn Toàn Màn Hình (Full Viewport / Scroll Behavior)

Đây là hạng mục kiểm tra kỹ thuật đặc biệt quan trọng:

| Route | Mục tiêu hiển thị | Phân loại chuẩn | Hiện trạng thực tế | Vấn đề phát hiện | Giải pháp Redesign |
|---|---|---|---|---|---|
| `/campus` | Tràn viền 100% màn hình | **IMMERSIVE_CANVAS** | Đã loại bỏ cuộn ngang; canvas chiếm trọn màn hình | Toolbar điều khiển 360 đôi khi che khuất điểm ghim hotspot ở viền dưới mobile. | Đưa thanh điều khiển thành floating dock kính mờ tự động co giãn. |
| `/map` | Toàn màn hình bản đồ | **IMMERSIVE_CANVAS** | Chiếm trọn viewport | Thanh tìm kiếm địa điểm trên bản đồ mobile chiếm quá nhiều diện tích phía trên. | Chuyển thành dạng ô tìm kiếm thu gọn (collapsible sheet). |
| `/admin/virtual-tour` | Không gian làm việc biên tập | **FULL_VIEWPORT** | Giữ khung cố định, sidebar cuộn bên trong | Đã khắc phục thanh sidebar dính cố định `sticky h-screen`, nhưng danh sách hotspot dài cần thanh cuộn mượt mà hơn. | Phân chia 3 cột cố định: Cây địa điểm | Canvas xem trước | Bảng thuộc tính hotspot. |
| Các trang nội dung (`/`, `/about`, `/events`, `/portal`) | Cuộn nội dung | **CONTENT_SCROLL** | Cuộn dọc tự nhiên | Một số khối bảng (table) trên mobile bị tràn nhẹ cần thanh cuộn ngang nội bộ. | Áp dụng `overflow-x-auto` cho khối bảng dữ liệu. |

---

## 3. Bảng Tổng Hợp Vấn Đề Giao Diện (UI/UX Issues Register)

| ID | Tuyến đường (Route) | Vấn đề cụ thể | Bằng chứng | Độ nghiêm trọng | Ảnh hưởng | Nguyên nhân kỹ thuật | Đề xuất khắc phục |
|:---:|---|---|---|:---:|---|---|---|
| **UI-01** | `/login` | Form đăng nhập đặt giữa màn hình nền trắng đơn điệu, thiếu hình ảnh nhận diện thương hiệu | `desktop-1440__login.png` | **P2** | Trải nghiệm đăng nhập tẻ nhạt, thiếu cảm giác cổng thông tin trường | Chưa có layout split-screen nhận diện sinh viên FPT Poly | Thiết kế lại dạng 2 cột: Cột trái hình ảnh sinh viên năng động/campus 360, cột phải form đăng nhập sang trọng |
| **UI-02** | `/portal/tickets` | Giao diện vé sự kiện hiển thị dưới dạng card phẳng thông thường, chưa tạo cảm giác như một chiếc vé thực thụ | `desktop-1440__portal-tickets.png` | **P2** | Sinh viên khó nhận biết mã QR khi đi check-in tại cổng | Dùng thẻ DIV phẳng thay vì phong cách vé đục lỗ | Thiết kế thẻ vé dạng boarding pass với mã QR to rõ, mã vạch trang trí và nút tải ảnh vé về điện thoại |
| **UI-03** | `/admin/locations` | Form thêm mới địa điểm mở dạng Drawer nhưng các trường nhập liệu bố trí 1 cột dài | `desktop-1440__admin-locations.png` | **P2** | Người quản trị phải cuộn chuột nhiều để điền thông tin | Chưa chia nhóm trường thông tin (Thông tin chung, Tọa độ bản đồ, Hình ảnh) | Tổ chức form thành 2 cột với các nhóm tab rõ ràng: Thông tin cơ bản, Tọa độ GPS & Liên kết 360 |
| **UI-04** | `/games` | Bàn xoay may mắn và danh sách phần thưởng bố trí dồn cục trên màn hình nhỏ | `mobile-390__games.png` | **P2** | Trải nghiệm chơi game trên mobile bị chật chội | CSS grid chưa tối ưu cho viewport hẹp | Trên mobile ưu tiên hiển thị vòng quay ở trung tâm, danh sách quà tặng chuyển thành tab hoặc trượt ngang |
| **UI-05** | `/parent` | Thẻ sinh viên liên kết chưa nổi bật trạng thái đã duyệt hay đang chờ | `desktop-1440__parent.png` | **P3** | Phụ huynh khó phân biệt con nào đã được xem điểm XP | Badge trạng thái dùng màu sắc nhạt | Thiết kế lại thẻ con em dạng Card hồ sơ học sinh với ảnh đại diện, thanh tiến độ học tập và huy hiệu xanh nổi bật |
