# 11 — HIỆU NĂNG, KHẢ NĂNG TIẾP CẬN & SEO (PERFORMANCE, A11Y & SEO)

## 1. Kiểm Toán Hiệu Năng Tải Trang (Performance)

- **Công nghệ biên dịch:** Next.js 16 kết hợp Turbopack rút ngắn thời gian khởi động môi trường dev xuống dưới **350ms** và hoàn tất build 29 routes chỉ trong **27.8 giây**.
- **Tối ưu hóa hình ảnh:**
  - Định dạng ảnh thông thường sử dụng component `next/image` tự động chuyển đổi định dạng WebP/AVIF hiện đại.
  - Ảnh 360° Panorama kích thước lớn ($ge$ 8K) được phân mảnh đa độ phân giải (multiresolution tiles), chỉ nạp các góc nhìn hiện tại trong viewport để tiết kiệm băng thông.
- **Tách gói Bundle (Code Splitting):**
  - Thư viện nặng như Leaflet Map và Marzipano 360 viewer được nạp động qua `next/dynamic` với cờ `{ ssr: false }`, không làm tăng kích thước bundle ban đầu của trang chủ.

---

## 2. Kiểm Toán Khả Năng Tiếp Cận (Accessibility - WCAG 2.1 AA)

- **Thẻ ngữ nghĩa (Semantic HTML):** Đã phân tách rõ ràng các thẻ `<header>`, `<main>`, `<nav>`, `<aside>`, `<footer>`.
- **Hỗ trợ đọc màn hình (Screen Reader & ARIA):**
  - Mọi nút bấm biểu tượng đều có nhãn `aria-label` mô tả hành động.
  - Thanh điều hướng Cổng thông tin có `aria-label="Điều hướng cổng thông tin"`.
  - Các modal và drawer đều có thuộc tính `role="dialog"` và `aria-modal="true"`.
- **Tương tác bàn phím (Keyboard Navigation):**
  - Các input và button đều có vòng sáng focus (`focus:ring-2 focus:ring-primary`) rõ ràng khi bấm phím Tab.

---

## 3. Kiểm Toán Tối Ưu Tìm Kiếm (SEO)

- **Cấu trúc Meta Tags:** Đầy đủ `title`, `description`, `keywords` và chuẩn thẻ Open Graph (`og:image`, `og:title`, `og:description`) cho mạng xã hội Facebook/Zalo.
- **Tệp Sitemap & Robots:**
  - Tệp `/sitemap.xml` được sinh tự động bởi Next.js App Router, bao gồm đầy đủ 23 tuyến đường tĩnh và các bài viết tin tức.
  - Tệp `/robots.txt` cấu hình chuẩn: Cho phép bot tìm kiếm đánh chỉ mục các trang Public, chặn bot quét vào khu vực nhạy cảm (`/admin/*`, `/portal/*`, `/parent/*`).
