# QUY CHUẨN ĐÁP ỨNG ĐA THIẾT BỊ (RESPONSIVE SPECIFICATIONS)

## 1. 4 Điểm Ngắt Màn Hình Chuẩn (Responsive Breakpoints)

Hệ thống được thiết kế và kiểm thử nghiêm ngặt trên 4 ngưỡng hiển thị:

| Thiết bị mục tiêu | Viewport chuẩn | Breakpoint Tailwind | Hành vi bố cục chính |
|---|:---:|:---:|---|
| **Mobile Điện thoại** | **390 × 844** | Base (`< 640px`) | 1 cột duy nhất, Sidebar chuyển thành Bottom Nav hoặc Drawer trượt, bảng dữ liệu chuyển thành Card dọc. |
| **Tablet Máy tính bảng**| **768 × 1024** | `md: (768px - 1023px)`| 2 cột linh hoạt, Sidebar thu gọn thành icon-only (72px), bảng dữ liệu có scroll ngang nội bộ. |
| **Laptop Tiêu chuẩn** | **1280 × 800** | `lg: (1024px - 1279px)`| 3 cột, Sidebar mở rộng đầy đủ (260px), các khối thống kê chia 2x2. |
| **Desktop Màn hình lớn**| **1440 × 900** | `xl: (1280px+)` | Toàn bộ không gian làm việc tối đa, biểu đồ và bảng trải rộng không bị co ép. |

---

## 2. Chiến Lược Xử Lý Cuộn & Chống Tràn (Anti-Overflow Strategy)

1. **Chống tràn ngang (`horizontal overflow`):**
   - Tuyệt đối không để xảy ra hiện tượng `scrollWidth > clientWidth` trên toàn bộ trang.
   - Thẻ bảng `<table>` bắt buộc phải được bọc trong container `<div className="overflow-x-auto w-full">`.
2. **Quản lý chiều cao toàn màn hình (`Full Viewport Height`):**
   - Thay thế hoàn toàn `100vh` bằng `100dvh` hoặc `h-screen flex flex-col` để tránh thanh địa chỉ của trình duyệt Safari/Chrome trên mobile che khuất đáy trang.
3. **Vùng an toàn di động (Safe Area Insets):**
   - Đảm bảo `padding-bottom: env(safe-area-inset-bottom)` cho thanh điều hướng mobile để không bị vướng vạch điều hướng cảm ứng của iPhone/Android.