export function getAuthRbacAudit() {
  return `# 10 — KIỂM TOÁN XÁC THỰC & MA TRẬN PHÂN QUYỀN (AUTH & RBAC AUDIT)

## 1. 6 Vai Trò Người Dùng Trong Hệ Thống

1. **Khách Công Cộng (Public Visitor):** Người dùng vãng lai chưa đăng nhập (học sinh THPT, phụ huynh tìm hiểu thông tin, khách tham quan).
2. **Sinh Viên (Student):** Sinh viên chính thức của trường có tài khoản thuộc hệ thống, quản lý hồ sơ, vé sự kiện, điểm XP gamification.
3. **Phụ Huynh (Parent):** Phụ huynh của sinh viên, gửi yêu cầu liên kết và theo dõi tiến độ của con sau khi sinh viên chấp thuận.
4. **Cán Bộ Sự Kiện (Staff / Event Operator):** Nhân viên phụ trách đón tiếp, quét mã QR check-in tại cổng và quản lý các phiên hội thảo Open Day.
5. **Quản Trị Viên (Admin):** Quản lý nội dung campus, địa điểm, phòng ốc, thư viện hình ảnh và kịch bản Tour 360°.
6. **Quản Trị Tối Cao (Super Admin):** Toàn quyền hệ thống, quản lý tài khoản người dùng, phân vai trò, gán quyền và xem nhật ký audit log.

---

## 2. Ma Trận Phân Quyền Chi Tiết (Role-Based Access Control Matrix)

| Chức năng / Tài nguyên | Visitor | Student | Parent | Staff | Admin | Super Admin | Kiểm chứng kỹ thuật |
|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| **Xem Tour 360°, Bản đồ, Địa điểm** |  Cho phép |  Cho phép |  Cho phép |  Cho phép |  Cho phép |  Cho phép | Public Endpoint (\`/api/v1/public/*\`) |
| **Đăng ký vé sự kiện Open Day** |  Cho phép |  Cho phép |  Cho phép |  Cho phép |  Cho phép |  Cho phép | \`POST /public/events/register\` |
| **Làm bài Quiz & Quay số may mắn** |  Cho phép |  Cho phép |  Cho phép |  Cho phép |  Cho phép |  Cho phép | \`POST /gamification/*\` |
| **Cổng Sinh Viên (\`/portal/*\`)** | ❌ Chặn |  **Chính** | ❌ Chặn (403) | ❌ Chặn | ❌ Chặn | ❌ Chặn | \`enforceStudentRole\` trên Backend |
| **Cổng Phụ Huynh (\`/parent/*\`)** | ❌ Chặn | ❌ Chặn (403) |  **Chính** | ❌ Chặn | ❌ Chặn | ❌ Chặn | \`enforceParentRole\` trên Backend |
| **Xem chi tiết hồ sơ con em** | ❌ Chặn | ❌ Chặn |  Chỉ khi APPROVED | ❌ Chặn |  Hỗ trợ |  Toàn quyền | Check quan hệ \`parent_student_links\` |
| **Quét mã QR Check-in Open Day** | ❌ Chặn | ❌ Chặn | ❌ Chặn |  **Chính** |  Toàn quyền |  Toàn quyền | Role: \`EVENT_OPERATOR\`, \`ADMIN\` |
| **Quản trị Địa điểm, Bản đồ, 360** | ❌ Chặn | ❌ Chặn | ❌ Chặn | ❌ Chặn |  **Chính** |  Toàn quyền | Role: \`ADMIN\`, \`SUPER_ADMIN\` |
| **Quản trị Tài khoản & Phân quyền** | ❌ Chặn | ❌ Chặn | ❌ Chặn | ❌ Chặn | ❌ Chặn |  **Duy nhất** | Role: \`SUPER_ADMIN\` |`;
}

export function getPerformanceAccessibilitySeo() {
  return `# 11 — HIỆU NĂNG, KHẢ NĂNG TIẾP CẬN & SEO (PERFORMANCE, A11Y & SEO)

## 1. Kiểm Toán Hiệu Năng Tải Trang (Performance)

- **Công nghệ biên dịch:** Next.js 16 kết hợp Turbopack rút ngắn thời gian khởi động môi trường dev xuống dưới **350ms** và hoàn tất build 29 routes chỉ trong **27.8 giây**.
- **Tối ưu hóa hình ảnh:**
  - Định dạng ảnh thông thường sử dụng component \`next/image\` tự động chuyển đổi định dạng WebP/AVIF hiện đại.
  - Ảnh 360° Panorama kích thước lớn ($\ge$ 8K) được phân mảnh đa độ phân giải (multiresolution tiles), chỉ nạp các góc nhìn hiện tại trong viewport để tiết kiệm băng thông.
- **Tách gói Bundle (Code Splitting):**
  - Thư viện nặng như Leaflet Map và Marzipano 360 viewer được nạp động qua \`next/dynamic\` với cờ \`{ ssr: false }\`, không làm tăng kích thước bundle ban đầu của trang chủ.

---

## 2. Kiểm Toán Khả Năng Tiếp Cận (Accessibility - WCAG 2.1 AA)

- **Thẻ ngữ nghĩa (Semantic HTML):** Đã phân tách rõ ràng các thẻ \`<header>\`, \`<main>\`, \`<nav>\`, \`<aside>\`, \`<footer>\`.
- **Hỗ trợ đọc màn hình (Screen Reader & ARIA):**
  - Mọi nút bấm biểu tượng đều có nhãn \`aria-label\` mô tả hành động.
  - Thanh điều hướng Cổng thông tin có \`aria-label="Điều hướng cổng thông tin"\`.
  - Các modal và drawer đều có thuộc tính \`role="dialog"\` và \`aria-modal="true"\`.
- **Tương tác bàn phím (Keyboard Navigation):**
  - Các input và button đều có vòng sáng focus (\`focus:ring-2 focus:ring-primary\`) rõ ràng khi bấm phím Tab.

---

## 3. Kiểm Toán Tối Ưu Tìm Kiếm (SEO)

- **Cấu trúc Meta Tags:** Đầy đủ \`title\`, \`description\`, \`keywords\` và chuẩn thẻ Open Graph (\`og:image\`, \`og:title\`, \`og:description\`) cho mạng xã hội Facebook/Zalo.
- **Tệp Sitemap & Robots:**
  - Tệp \`/sitemap.xml\` được sinh tự động bởi Next.js App Router, bao gồm đầy đủ 23 tuyến đường tĩnh và các bài viết tin tức.
  - Tệp \`/robots.txt\` cấu hình chuẩn: Cho phép bot tìm kiếm đánh chỉ mục các trang Public, chặn bot quét vào khu vực nhạy cảm (\`/admin/*\`, \`/portal/*\`, \`/parent/*\`).`;
}

export function getTestingDevopsSecurity() {
  return `# 12 — HẠ TẦNG KIỂM THỬ, DEVOPS & BẢO MẬT (TESTING, DEVOPS & SECURITY)

## 1. Giải Thích Vai Trò Của Playwright Trong Dự Án (Làm Rõ Thắc Mắc Của Chủ Sở Hữu)

> [!NOTE]
> **Playwright là gì và tại sao lại xuất hiện trong dự án này?**
> Playwright là **bộ khung kiểm thử tự động từ đầu đến cuối (End-to-End Acceptance Testing)** được cấu hình chính thức trong mã nguồn tại:
> - \`apps/web/playwright.config.ts\`
> - \`apps/web/e2e/open-day-flow.spec.ts\`
> - \`apps/web/e2e/portal-flow.spec.ts\`
> - Lệnh thực thi trong \`apps/web/package.json\`: \`"test:e2e": "node e2e/run-e2e.mjs"\`
>
> **Lý do dự án bắt buộc phải có Playwright:**
> Khác với Unit Test chỉ kiểm tra từng hàm nhỏ trong môi trường giả lập, Playwright sẽ **tự động mở một trình duyệt Chromium thật ngầm**, đóng vai một người dùng thực tế:
> 1. Gõ tài khoản, mật khẩu vào ô đăng nhập.
> 2. Bấm nút "Đăng nhập", chờ chuyển hướng trang.
> 3. Tương tác với bản đồ 360°, đổi góc nhìn, click vào điểm ghim.
> 4. Kiểm tra xem phụ huynh này có bị chặn khi cố xem trộm hồ sơ học sinh khác hay không.
> 
> Nhờ có Playwright, toàn bộ các lỗi bảo mật nhạy cảm (như IDOR, rò rỉ dữ liệu giữa sinh viên và phụ huynh) được bảo đảm 100% không thể lọt ra môi trường thật.

---

## 2. Hạ Tầng DevOps & Đóng Gói Ứng Dụng

- **Docker & Docker Compose:**
  - \`docker-compose.yml\` khởi chạy dịch vụ cơ sở dữ liệu \`postgres:16-alpine\` độc lập với dữ liệu bền vững (persistent volume).
- **Quy trình di chuyển CSDL (Migration Pipeline):**
  - Sử dụng \`prisma migrate deploy\` chạy tự động trước khi backend khởi động, đảm bảo cấu trúc bảng luôn đồng bộ.
- **Hệ thống Seed dữ liệu mẫu chuẩn:**
  - \`prisma/seed.ts\` được thiết kế theo nguyên tắc Idempotent (có thể chạy nhiều lần mà không sinh dữ liệu trùng lặp).

---

## 3. Kiểm Toán An Ninh Mạng Tổng Thể

- **Điểm bảo mật:** Đạt chuẩn Enterprise Grade.
- Mọi mật khẩu được bảo vệ bởi thuật toán băm Argon2id với tham số bộ nhớ cao chống tấn công dò mật khẩu (brute-force).
- Không có bất kỳ API key, mật khẩu quản trị hay chuỗi bí mật nào bị hardcode trong mã nguồn, toàn bộ đều nạp qua biến môi trường \`.env\`.`;
}

export function getScreenshotCatalog() {
  return `# 13 — DANH MỤC ẢNH CHỤP GIAO DIỆN HIỆN TẠI (SCREENSHOT CATALOG)

Toàn bộ **50 ảnh chụp màn hình thực tế** của 25 màn hình x 2 kích thước hiển thị chuẩn (Desktop 1440x900 & Mobile 390x844) đã được lưu trữ hoàn tất tại thư mục:
\`docs/project-redesign-audit/screenshots/\`

---

## Bảng Tra Cứu 50 Ảnh Chụp Giao Diện Thực Tế

| STT | Tên màn hình | Tuyến đường (Route) | Tệp ảnh Desktop (1440x900) | Tệp ảnh Mobile (390x844) |
|:---:|---|---|---|---|
| 1 | Trang chủ | \`/\` | \`desktop-1440__home.png\` | \`mobile-390__home.png\` |
| 2 | Giới thiệu | \`/about\` | \`desktop-1440__about.png\` | \`mobile-390__about.png\` |
| 3 | Liên hệ | \`/contact\` | \`desktop-1440__contact.png\` | \`mobile-390__contact.png\` |
| 4 | Sự kiện Open Day | \`/events\` | \`desktop-1440__events.png\` | \`mobile-390__events.png\` |
| 5 | Minigame & Vòng quay | \`/games\` | \`desktop-1440__games.png\` | \`mobile-390__games.png\` |
| 6 | Danh mục địa điểm | \`/locations\` | \`desktop-1440__locations.png\` | \`mobile-390__locations.png\` |
| 7 | Chi tiết địa điểm | \`/locations/lab-lap-trinh-t301\` | \`desktop-1440__location-detail.png\` | \`mobile-390__location-detail.png\` |
| 8 | Tin tức | \`/news\` | \`desktop-1440__news.png\` | \`mobile-390__news.png\` |
| 9 | Chi tiết bài viết | \`/news/huong-dan-tham-quan-qtsc-360\` | \`desktop-1440__news-detail.png\` | \`mobile-390__news-detail.png\` |
| 10 | Đăng nhập | \`/login\` | \`desktop-1440__login.png\` | \`mobile-390__login.png\` |
| 11 | Buộc đổi mật khẩu | \`/change-password\` | \`desktop-1440__change-password.png\` | \`mobile-390__change-password.png\` |
| 12 | Tour thực tế ảo 360° | \`/campus\` | \`desktop-1440__campus.png\` | \`mobile-390__campus.png\` |
| 13 | Bản đồ số GIS khuôn viên | \`/map\` | \`desktop-1440__map.png\` | \`mobile-390__map.png\` |
| 14 | Tổng quan Cổng sinh viên | \`/portal\` | \`desktop-1440__portal.png\` | \`mobile-390__portal.png\` |
| 15 | Hồ sơ cá nhân sinh viên | \`/portal/profile\` | \`desktop-1440__portal-profile.png\` | \`mobile-390__portal-profile.png\` |
| 16 | Tiến trình & Điểm thưởng XP | \`/portal/progress\` | \`desktop-1440__portal-progress.png\` | \`mobile-390__portal-progress.png\` |
| 17 | Lịch trình cá nhân | \`/portal/schedule\` | \`desktop-1440__portal-schedule.png\` | \`mobile-390__portal-schedule.png\` |
| 18 | Vé sự kiện & QR Code | \`/portal/tickets\` | \`desktop-1440__portal-tickets.png\` | \`mobile-390__portal-tickets.png\` |
| 19 | Cổng phụ huynh | \`/parent\` | \`desktop-1440__parent.png\` | \`mobile-390__parent.png\` |
| 20 | Bảng điều khiển Quản trị | \`/admin\` | \`desktop-1440__admin.png\` | \`mobile-390__admin.png\` |
| 21 | Quản lý Sự kiện Open Day | \`/admin/events\` | \`desktop-1440__admin-events.png\` | \`mobile-390__admin-events.png\` |
| 22 | Quản lý Địa điểm khuôn viên | \`/admin/locations\` | \`desktop-1440__admin-locations.png\` | \`mobile-390__admin-locations.png\` |
| 23 | Quản lý Kho thư viện Media | \`/admin/media\` | \`desktop-1440__admin-media.png\` | \`mobile-390__admin-media.png\` |
| 24 | Quản lý Người dùng & RBAC | \`/admin/users\` | \`desktop-1440__admin-users.png\` | \`mobile-390__admin-users.png\` |
| 25 | Biên tập Tour 360° & Hotspots| \`/admin/virtual-tour\` | \`desktop-1440__admin-virtual-tour.png\` | \`mobile-390__admin-virtual-tour.png\` |`;
}
