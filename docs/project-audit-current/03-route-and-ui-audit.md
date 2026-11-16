# KIỂM TOÁN TOÀN BỘ ROUTE & GIAO DIỆN FRONTEND (03-ROUTE-AND-UI-AUDIT)
## FPT Polytechnic Virtual Campus 360°

- **Framework:** Next.js 16.4.6 (Turbopack, App Router)
- **CSS Framework:** Tailwind CSS v4, Material Symbols Outlined
- **Tổng số Route ứng dụng:** 29 routes (bao gồm các dynamic params và sitemap)

---

## 1. Danh Sách & Hiện Trạng Toàn Bộ Routes

### 1.1. Nhóm Public Website (Không yêu cầu xác thực)

| Đường Dẫn (Route) | File Tương Ứng | Loại Trang | Trạng Thái Truy Cập | Dữ Liệu Sử Dụng | Lỗi / Ghi Chú |
|---|---|---|---|---|---|
| `/` | `(public)/page.tsx` | Static (○) | **200 OK** | Trực tiếp từ API `GET /public/campus` + Tour 360 preview | Responsive hoàn thiện, không lỗi console. |
| `/about` | `(public)/about/page.tsx` | Static (○) | **200 OK** | Dữ liệu chính thức FPT Polytechnic QTSC | Hero banner, thông điệp trường, sơ đồ cơ sở vật chất. |
| `/campus` | `(immersive)/campus/page.tsx` | Dynamic (ƒ) | **200 OK** | API `GET /public/tour-nodes` + WebGL Equirectangular | Toàn cảnh 360°, xoay góc nhìn, click hotspot chuyển cảnh. |
| `/map` | `(immersive)/map/page.tsx` | Dynamic (ƒ) | **200 OK** | API `GET /public/locations` + Leaflet Map | Đánh dấu tòa nhà, xem sơ đồ vị trí QTSC. |
| `/locations` | `(public)/locations/page.tsx` | Dynamic (ƒ) | **200 OK** | API `GET /public/locations` | Danh bạ cơ sở vật chất, lọc theo loại phòng. |
| `/locations/[slug]` | `(public)/locations/[slug]/page.tsx` | Dynamic (ƒ) | **200 OK** | API `GET /public/locations/:slug` | Chi tiết phòng lab, hội trường, liên kết Tour 360. |
| `/events` | `(public)/events/page.tsx` | Static (○) | **200 OK** | API `GET /public/events` (PostgreSQL) | Lịch trình Open Day, FAQ, Form đăng ký nhận vé QR SVG. |
| `/games` | `(public)/games/page.tsx` | Static (○) | **200 OK** | API `GET /gamification/*` (PostgreSQL) | Quiz trắc nghiệm, Vòng quay may mắn, Bảng xếp hạng. |
| `/news` | `(public)/news/page.tsx` | Static (○) | **200 OK** | Mảng tĩnh `CAMPUS_GUIDE_ARTICLES` | Dữ liệu còn tĩnh, chưa có API CMS (Mục tiêu M5). |
| `/news/[slug]` | `(public)/news/[slug]/page.tsx` | SSG (● 3 bài) | **200 OK** | Static params 3 bài viết cẩm nang | Hiển thị bài viết chi tiết, danh mục liên quan. |
| `/contact` | `(public)/contact/page.tsx` | Static (○) | **200 OK** | Thông tin tĩnh và link sang web tuyển sinh | Chưa có form gửi tin nhắn lưu DB (Mục tiêu M5). |
| `/sitemap.xml` | `sitemap.ts` | Static (○) | **200 OK** | Metadata tự động | Chuẩn SEO XML Sitemap. |

### 1.2. Nhóm Authentication (Bảo mật tài khoản)

| Đường Dẫn (Route) | File Tương Ứng | Loại Trang | Trạng Thái Truy Cập | Chức Năng Hoạt Động | Ghi Chú |
|---|---|---|---|---|---|
| `/login` | `(auth)/login/page.tsx` | Static (○) | **200 OK** | Form đăng nhập (Email/SĐT/Username + Password) | Kiểm tra Argon2id, lưu in-memory JWT, HttpOnly refresh cookie. |
| `/change-password` | `(auth)/change-password/page.tsx`| Static (○) | **200 OK** | Form bắt buộc đổi mật khẩu lần đầu | Chặn điều hướng nếu `mustChangePassword = true`. |

### 1.3. Nhóm Student Portal (Cổng Thông Tin Sinh Viên)

| Đường Dẫn (Route) | File Tương Ứng | Loại Trang | Trạng Thái Truy Cập | Dữ Liệu Thực Tế | Ghi Chú |
|---|---|---|---|---|---|
| `/portal` | `(portal)/portal/page.tsx` | Static (○) | **200 OK** | API `GET /auth/me` & `GET /portal/profile` | Dashboard chào mừng, các tab điều hướng `PortalNavTabs`. |
| `/portal/profile` | `(portal)/portal/profile/page.tsx` | Static (○) | **200 OK** | API `GET & PATCH /portal/profile` | Chỉnh sửa bio, major, sđt lưu thẳng vào PostgreSQL. |
| `/portal/tickets` | `(portal)/portal/tickets/page.tsx` | Static (○) | **200 OK** | API `GET /portal/tickets` | Danh sách vé Open Day, mở modal xem mã QR SVG. |
| `/portal/schedule` | `(portal)/portal/schedule/page.tsx`| Static (○) | **200 OK** | API `GET /portal/schedule` | Lịch trình sự kiện dạng timeline, lọc Buổi sáng/Chiều. |
| `/portal/progress` | `(portal)/portal/progress/page.tsx`| Static (○) | **200 OK** | API `GET /portal/gamification` | Cấp bậc, tổng XP, lượt quay, lịch sử giao dịch XP. |

### 1.4. Nhóm Parent Portal (Cổng Thông Tin Phụ Huynh)

| Đường Dẫn (Route) | File Tương Ứng | Loại Trang | Trạng Thái Truy Cập | Dữ Liệu Thực Tế | Ghi Chú |
|---|---|---|---|---|---|
| `/parent` | `(portal)/parent/page.tsx` | Static (○) | **200 OK** | API `GET /parent/students` & `/portal/links` | Danh sách sinh viên liên kết, duyệt/từ chối yêu cầu, xem chi tiết. |

### 1.5. Nhóm Admin CMS (Trang Quản Trị Hệ Thống)

| Đường Dẫn (Route) | File Tương Ứng | Loại Trang | Trạng Thái Truy Cập | Module Nghiệp Vụ | Ghi Chú |
|---|---|---|---|---|---|
| `/admin` | `admin/page.tsx` | Static (○) | **200 OK** | Dashboard tổng quan KPI quản trị | Thống kê vé, địa điểm, sự kiện, người dùng. |
| `/admin/locations` | `admin/locations/page.tsx` | Static (○) | **200 OK** | Quản trị Địa điểm & Sơ đồ GIS | CRUD địa điểm, tòa nhà, căn chỉnh tọa độ. |
| `/admin/virtual-tour`| `admin/virtual-tour/page.tsx` | Static (○) | **200 OK** | Biên tập Tour 360° & Hotspots | UI WebGL xem trực quan, ghim sidebar sticky 100vh, có nút lưu cấu hình. |
| `/admin/events` | `admin/events/page.tsx` | Static (○) | **200 OK** | Quản lý Sự kiện & Check-in QR | Quét/nhập mã vé điểm danh trực tiếp vào DB. |
| `/admin/media` | `admin/media/page.tsx` | Static (○) | **200 OK** | Thư viện Media & Tải lên tệp | Upload ảnh panorama/2D có kiểm tra SHA-256. |
| `/admin/users` | `admin/users/page.tsx` | Static (○) | **200 OK** | Quản lý Tài khoản & Phân quyền RBAC | Cấp tài khoản, kích hoạt, quản lý quyền hạn. |

---

## 2. Đánh Giá Trải Nghiệm Người Dùng (UI/UX) & Responsive

1. **Hiển thị trên Desktop (> 1024px):**
   - Bố cục lưới 3 cột chặt chẽ trên `/admin/virtual-tour` (Danh sách cảnh, WebGL Stage, Hotspot Inspector).
   - Sidebar Admin được ghim cố định toàn màn hình (`lg:sticky lg:top-0 lg:h-screen`), không bị kéo trôi khi người dùng lướt nội dung dài.
2. **Hiển thị trên Mobile & Tablet (< 1024px):**
   - Menu trượt dạng drawer che phủ với backdrop làm mờ.
   - Các bảng danh sách chuyển sang dạng thẻ vuốt (Cards) tự động co giãn.
   - Component QR Code SVG co giãn chuẩn tỷ lệ 1:1, hiển thị rõ nét trên màn hình Retina.
3. **Các trạng thái tương tác:**
   - Đã xử lý đầy đủ: `LoadingState` (skeleton/spinner), `EmptyState` (kèm nút hành động khôi phục), `ErrorState` (thông báo lỗi và nút thử lại) và `StatusToast` (phản hồi sau khi lưu).
