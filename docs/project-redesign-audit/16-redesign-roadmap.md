# 16 — LỘ TRÌNH TRIỂN KHAI REDESIGN THEO TỪNG PHA (IMPLEMENTATION ROADMAP)

## 10 Pha Triển Khai Tuần Tự (Không Phá Vỡ Logic Hiện Có)

| Pha | Tên giai đoạn | Mục tiêu cốt lõi | Phạm vi màn hình | Thời lượng dự kiến | Tiêu chí nghiệm thu (Acceptance Criteria) |
|:---:|---|---|---|:---:|---|
| **Phase 1** | **Design Foundation & Tokens** | Xây dựng bộ Design Tokens (màu sắc, font, spacing) và thư viện component dùng chung | `packages/ui` hoặc `apps/web/src/components/ui` | 3 ngày | Bảng tra cứu token Tailwind v4 hoạt động, bộ button/input/card/badge mới pass kiểm thử. |
| **Phase 2** | **Core Layouts & Navigations** | Tái cấu trúc 6 layouts chính (Root, Public, Auth, Immersive, Portal, Admin) | 6 layouts | 2 ngày | Header/Footer mới hiển thị chuẩn xác, thanh điều hướng mobile trượt mượt mà. |
| **Phase 3** | **Public Website Redesign** | Làm mới toàn bộ 9 trang công cộng | `/`, `/about`, `/contact`, `/events`, `/games`, `/locations/*`, `/news/*` | 4 ngày | 9 trang public đạt chuẩn responsive, form đăng ký Open Day hoạt động mượt mà. |
| **Phase 4** | **Authentication Redesign** | Nâng cấp màn hình Đăng nhập và Buộc đổi mật khẩu | `/login`, `/change-password` | 1 ngày | Bố cục split-screen sang trọng, validate mật khẩu 12 ký tự trực quan. |
| **Phase 5** | **Immersive Canvas 360 & Map**| Làm mới giao diện Tour thực tế ảo và Bản đồ GIS | `/campus`, `/map` | 3 ngày | Tràn viền 100%, không xuất hiện thanh cuộn dọc ngoài ý muốn, floating dock mượt. |
| **Phase 6** | **Student Portal Redesign** | Thiết kế lại 5 trang cổng sinh viên | `/portal/*` (Overview, Profile, Progress, Schedule, Tickets) | 3 ngày | Thẻ vé QR Boarding Pass đẹp mắt, tiến trình XP và cấp độ hiển thị rõ ràng. |
| **Phase 7** | **Parent Portal Redesign** | Làm mới trang cổng phụ huynh | `/parent` | 2 ngày | Danh sách con em và luồng duyệt yêu cầu liên kết hiển thị mạch lạc, dễ dùng. |
| **Phase 8** | **Admin CMS Redesign** | Chuẩn hóa giao diện quản trị chuẩn SaaS | `/admin/*` (Dashboard, Events, Locations, Media, Users, Tour Studio) | 4 ngày | Màn hình Studio biên tập Tour 3 cột cố định, các bảng dữ liệu quản lý mượt mà. |
| **Phase 9** | **Responsive & Edge Cases** | Kiểm tra hiển thị trên Tablet (768px), Mobile (390px, 360px), Laptop (1280px) | Toàn bộ 25 màn hình | 2 ngày | 0 lỗi cuộn ngang (horizontal overflow) trên toàn bộ các kích thước màn hình. |
| **Phase 10**| **Full Verification & QA** | Chạy kiểm thử tự động toàn diện Playwright E2E, Unit tests và bàn giao nghiệm thu | Toàn dự án | 2 ngày | 100% test E2E xanh, Typecheck 0 lỗi, Turbopack build thành công. |

---

## Tổng Thời Lượng Dự Kiến: 26 Ngày Làm Việc.
