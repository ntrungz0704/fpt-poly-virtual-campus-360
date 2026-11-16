# 15 — CHIẾN LƯỢC TÁI THIẾT KẾ TOÀN DIỆN (COMPLETE REDESIGN STRATEGY)

## 1. Định Vị Bản Sắc Thị Giác (Brand Identity & Visual Direction)

- **Thông điệp cốt lõi:** *"FPT Polytechnic Virtual Campus — Nơi công nghệ dẫn lối trải nghiệm học tập thực chiến."*
- **Phong cách chủ đạo:** **Modern EdTech meets Immersive Space**. 
  - Đậm chất nhận diện thương hiệu giáo dục FPT (màu cam nhiệt huyết).
  - Kết hợp chiều sâu công nghệ (mặt kính mờ glassmorphism, tương tác không gian thực tế ảo 360°, bản đồ số GIS hiện đại).
  - Tối ưu hóa triệt để cho thiết bị di động (Mobile-First responsive).

---

## 2. Chiến Lược Thiết Kế Theo Từng Phân Hệ (Sub-system Design Principles)

### 2.1 Public Website (Khách vãng lai, thí sinh, phụ huynh)
- **Mục tiêu:** Tạo ấn tượng choáng ngợp về cơ sở vật chất hiện đại của FPT Polytechnic QTSC ngay từ cái nhìn đầu tiên.
- **Giải pháp:**
  - Hero Section sử dụng video hoặc góc quay 360° tương tác nhanh.
  - Phân luồng điều hướng rõ ràng: Nút "Khám phá 360°" và "Đăng ký Open Day" nổi bật.
  - Sử dụng các thẻ bo góc lớn (`rounded-2xl`), đổ bóng nhẹ (`shadow-sm` $ightarrow$ `shadow-md` khi hover).

### 2.2 Virtual Campus (Tour 360° & Bản đồ số)
- **Mục tiêu:** Tập trung 100% sự chú ý của người xem vào không gian ảo, loại bỏ mọi yếu tố gây phân tâm.
- **Giải pháp:**
  - Toàn bộ thanh công cụ chuyển thành Floating Glass Dock (thanh nổi trong suốt phía dưới).
  - Tích hợp radar bản đồ mini ở góc trái, tự động xoay theo hướng nhìn 360°.
  - Điểm ghim Hotspot thiết kế dạng vòng tròn phát sáng đa lớp (pulsing pulse ring) có nhãn tiếng Việt rõ ràng.

### 2.3 Student & Parent Portal (Cổng sinh viên & phụ huynh)
- **Mục tiêu:** Tối giản, thân thiện, dễ tra cứu, tôn vinh thành tích cá nhân.
- **Giải pháp:**
  - Trang chủ Portal hiển thị thẻ thành viên điện tử (Virtual Student ID Card) với ảnh đại diện và mã QR.
  - Thẻ vé sự kiện Open Day thiết kế theo cảm hứng Boarding Pass (vé máy bay) với đường đục lỗ trang trí.
  - Phụ huynh được xem thẻ thông tin con em với màu sắc ấm áp, chữ to dễ đọc trên điện thoại.

### 2.4 Admin Console (Hệ thống quản trị)
- **Mục tiêu:** Chuyên nghiệp, tốc độ thao tác nhanh, mật độ thông tin tối ưu (tương tự Linear / Stripe).
- **Giải pháp:**
  - Thanh Sidebar cố định viền trái màu xám đậm (`#0F172A`).
  - Bảng dữ liệu có sẵn thanh tìm kiếm tức thì, bộ lọc theo cột và phân trang gọn gàng.
  - Màn hình Studio biên tập Tour 360° chia 3 cột cố định, không để xảy ra cuộn trang ngoài ý muốn.
