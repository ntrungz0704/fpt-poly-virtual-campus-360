# FPT POLYTECHNIC VIRTUAL CAMPUS 360° — DESIGN SYSTEM SPECIFICATION

> [!IMPORTANT]
> **TÀI LIỆU QUY CHUẨN THIẾT KẾ ĐỒ HỌA & GIAO DIỆN (UI/UX)**
> - **Thương hiệu:** Trường Cao đẳng FPT Polytechnic TP.HCM — Cơ sở Công viên Phần mềm Quang Trung (QTSC).
> - **Phiên bản:** Design System v2.0 (Redesign Milestone).
> - **Mục tiêu:** Định hình một ngôn ngữ thiết kế nhất quán, hiện đại, đậm chất công nghệ giáo dục nhưng vẫn thân thiện, tối ưu trải nghiệm trên mọi kích thước màn hình.

---

## 1. Bản Sắc Thương Hiệu (Brand Identity)

### 1.1 Triết Lý Thiết Kế: Modern EdTech Meets Immersive Space
Hệ thống kết hợp ba yếu tố cốt lõi:
1. **Nhiệt Huyết & Thực Chiến (Poly Dynamic):** Sắc cam FPT rực rỡ truyền cảm hứng năng động, sáng tạo cho sinh viên và thí sinh.
2. **Chiều Sâu Công Nghệ (Deep Tech Space):** Tông màu Navy sâu thẳm, mặt kính mờ (Glassmorphism), hiệu ứng phát sáng nhẹ (ambient glow) tôn vinh trải nghiệm thực tế ảo 360° và bản đồ số GIS.
3. **Sạch Sẽ & Chuẩn Mực SaaS (Enterprise Clarity):** Bố cục thẻ rõ ràng, tỷ lệ khoảng trắng cân đối, typography dễ đọc, hỗ trợ thao tác nhanh cho cán bộ quản trị.

---

## 2. Hệ Thống 4 Phân Vùng Thị Giác (4-Tier Persona Systems)

Để tránh tình trạng "tất cả các trang đều giống hệt một template dashboard", hệ thống phân tách 4 phân vùng thị giác:

| Phân hệ | Đối tượng chính | Phong cách chủ đạo | Đặc trưng giao diện |
|---|---|---|---|
| **Public Website** | Thí sinh, Học sinh THPT, Khách tham quan | **Modern EdTech** | Khối Hero lớn, hình ảnh campus 3D nổi bật, thẻ bo góc lớn (`rounded-2xl`), nút CTA cam nổi bật. |
| **Authentication** | Mọi người dùng đăng nhập | **Split-Screen Minimal** | Cột trái ảnh campus công nghệ, cột phải form nhập liệu thanh lịch, bảo vệ mắt. |
| **Virtual Campus** | Người khám phá không gian ảo | **Immersive Dark Glassmorphism** | Toàn màn hình (`h-screen overflow-hidden`), thanh công cụ nổi (floating glass dock), HUD tối giản. |
| **Student / Parent Portal** | Sinh viên, Phụ huynh | **Clean Educational Dashboard** | Thẻ học tập thân thiện, thẻ vé dạng Boarding Pass có mã QR sắc nét, thanh tiến trình XP trực quan. |
| **Admin Console** | Cán bộ quản lý, Quản trị viên | **Enterprise SaaS** | Sidebar cố định tối màu (`#0F172A`), bảng dữ liệu dày đặc thông tin, lọc và tìm kiếm nhanh bằng phím. |

---

## 3. Quy Chuẩn Không Gian & Phân Loại Cuộn (Scroll & Viewport Rules)

- **`FULL_VIEWPORT`:** Tuyệt đối không để phát sinh thanh cuộn dọc ngoài ý muốn của tài liệu trình duyệt (`body { overflow-y: hidden }`). Áp dụng cho: `/login`, `/change-password`, `/admin/virtual-tour`.
- **`IMMERSIVE_CANVAS`:** Canvas 360°/Bản đồ chiếm 100% diện tích; các thanh công cụ, radar được neo tuyệt đối (`fixed` / `absolute`) trên bề mặt kính mờ. Áp dụng cho: `/campus`, `/map`.
- **`CONTENT_SCROLL`:** Cho phép cuộn dọc tự nhiên, giữ Header cố định (`sticky top-0 z-40`), bảng dữ liệu dài trên mobile bắt buộc có thanh cuộn ngang nội bộ (`overflow-x-auto`).