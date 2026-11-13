# KIỂM TOÁN HIỆU NĂNG, WEBGL & TRẢI NGHIỆM NGƯỜI DÙNG (08-PERFORMANCE-AND-UX-AUDIT)
## FPT Polytechnic Virtual Campus 360°

---

## 1. Đánh Giá Hiệu Năng Frontend (Next.js 16 App Router)

- **Thời gian biên dịch (Production Build):** 47 giây cho 29 routes (Turbopack + TypeScript checks).
- **Phân bổ tải trang:**
  - Phần lớn các trang thông tin (`/`, `/about`, `/events`, `/games`, `/news`, `/contact`, `/portal/*`) được biên dịch tĩnh dạng Prerendered Static (○) hoặc Static Site Generation (●), cho thời gian phản hồi máy chủ đạt mức dưới 50ms khi người dùng truy cập.
  - Các trang nhúng WebGL tương tác cao (`/campus`, `/map`, `/locations/[slug]`) được cấu hình Dynamic (ƒ) với cờ `no-store` để tải dữ liệu cập nhật theo thời gian thực từ database.
- **Tối ưu hóa hình ảnh:** Toàn bộ ảnh nền và panorama được tối ưu hóa kích thước equirectangular 2:1 (2048x1024), dung lượng dao động từ 170KB đến 470KB, kiểm tra tính hợp lệ qua chuẩn JPEG MIME và SHA-256.

---

## 2. Kiểm Toán WebGL & Panorama 360°

- **Thư viện nền tảng:** Three.js qua component `PanoramaStage.tsx`.
- **Tối ưu vòng đời WebGL (Lifecycle & Context Management):**
  - Sử dụng `requestAnimationFrame` được hủy sạch sẽ khi unmount component, tránh rò rỉ bộ nhớ (memory leaks) khi người dùng chuyển đổi qua lại giữa các trang.
  - Kiểm tra `webglContextLost` và tự động khôi phục ngữ cảnh đồ họa khi trình duyệt giải phóng bộ nhớ GPU.
  - Tự động điều chỉnh tỷ lệ khung hình theo kích thước canvas thực tế (`resizeObserver`), hỗ trợ đầy đủ các thao tác vuốt chạm trên màn hình cảm ứng di động.

---

## 3. Trải Nghiệm Người Dùng (UI/UX) & Responsive Design

- **Ghim Sidebar Admin (Pinned 100vh Sticky Viewport):**
  - Đã khắc phục triệt để lỗi sidebar bị kéo trôi khi người dùng cuộn trang.
  - Cấu hình lớp Tailwind `lg:sticky lg:top-0 lg:h-screen lg:self-start` đảm bảo thanh điều hướng luôn nằm cố định trong tầm mắt người quản trị, trong khi danh sách menu có thanh cuộn độc lập (`overflow-y-auto`).
- **Phản hồi trạng thái (Feedback & Micro-interactions):**
  - Các nút bấm hành động đều tích hợp cờ `loading` dạng spinner xoay để báo hiệu tiến trình gửi dữ liệu, ngăn chặn việc người dùng nhấn đúp (double-click) gây trùng lặp request.
  - Hệ thống thông báo nổi `StatusToast` hiển thị thông điệp ngắn gọn, trực quan và tự động biến mất sau 4–5 giây.
- **Tiêu chuẩn Accessibility (WCAG):**
  - Các nút bấm icon đều có nhãn `aria-label` hoặc `title` rõ ràng.
  - Các modal thoại (`role="dialog"`, `aria-modal="true"`) hỗ trợ phím bấm `Escape` để đóng nhanh.
