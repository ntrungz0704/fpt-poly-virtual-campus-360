# DANH MỤC KIỂM KÊ 25 TRANG THIẾT KẾ (PAGE INVENTORY)

Tài liệu kiểm kê chi tiết 25 page templates được thiết kế lại:

| STT | Mã ID | Tên trang tiếng Việt | Tuyến đường (Route) | Phân hệ (Sub-system) | Layout áp dụng | Loại Viewport | Trạng thái Route |
|:---:|:---:|---|---|---|---|:---:|:---:|
| 1 | **PUB-001** | Trang chủ Virtual Campus | `/` | Public Website | `(public)/layout.tsx` | **CONTENT_SCROLL** |  Tồn tại |
| 2 | **PUB-002** | Giới thiệu trường | `/about` | Public Website | `(public)/layout.tsx` | **CONTENT_SCROLL** |  Tồn tại |
| 3 | **PUB-003** | Liên hệ tuyển sinh | `/contact` | Public Website | `(public)/layout.tsx` | **CONTENT_SCROLL** |  Tồn tại |
| 4 | **PUB-004** | Sự kiện Open Day 2026 | `/events` | Public Website | `(public)/layout.tsx` | **CONTENT_SCROLL** |  Tồn tại |
| 5 | **PUB-005** | Minigame & Vòng quay | `/games` | Public Website | `(public)/layout.tsx` | **CONTENT_SCROLL** |  Tồn tại |
| 6 | **PUB-006** | Danh mục địa điểm | `/locations` | Public Website | `(public)/layout.tsx` | **CONTENT_SCROLL** |  Tồn tại |
| 7 | **PUB-007** | Chi tiết địa điểm & Lab | `/locations/[slug]` | Public Website | `(public)/layout.tsx` | **CONTENT_SCROLL** |  Tồn tại |
| 8 | **PUB-008** | Bảng tin tức sự kiện | `/news` | Public Website | `(public)/layout.tsx` | **CONTENT_SCROLL** |  Tồn tại |
| 9 | **PUB-009** | Chi tiết bài viết tin tức | `/news/[slug]` | Public Website | `(public)/layout.tsx` | **CONTENT_SCROLL** |  Tồn tại |
| 10 | **AUTH-001** | Đăng nhập tập trung | `/login` | Authentication | `(auth)/layout.tsx` | **FULL_VIEWPORT** |  Tồn tại |
| 11 | **AUTH-002** | Buộc đổi mật khẩu lần đầu | `/change-password` | Authentication | `(auth)/layout.tsx` | **FULL_VIEWPORT** |  Tồn tại |
| 12 | **CAMP-001** | Tour thực tế ảo 360° | `/campus` | Virtual Campus | `(immersive)/layout.tsx` | **IMMERSIVE_CANVAS** |  Tồn tại |
| 13 | **CAMP-002** | Bản đồ số GIS khuôn viên | `/map` | Virtual Campus | `(immersive)/layout.tsx` | **IMMERSIVE_CANVAS** |  Tồn tại |
| 14 | **STUD-001** | Cổng sinh viên Dashboard | `/portal` | Student Portal | `(portal)/layout.tsx` | **CONTENT_SCROLL** |  Tồn tại |
| 15 | **STUD-002** | Hồ sơ sinh viên | `/portal/profile` | Student Portal | `(portal)/layout.tsx` | **CONTENT_SCROLL** |  Tồn tại |
| 16 | **STUD-003** | Tiến trình & Điểm thưởng XP | `/portal/progress` | Student Portal | `(portal)/layout.tsx` | **CONTENT_SCROLL** |  Tồn tại |
| 17 | **STUD-004** | Lịch trình tham gia sự kiện | `/portal/schedule` | Student Portal | `(portal)/layout.tsx` | **CONTENT_SCROLL** |  Tồn tại |
| 18 | **STUD-005** | Vé Open Day & Mã QR | `/portal/tickets` | Student Portal | `(portal)/layout.tsx` | **CONTENT_SCROLL** |  Tồn tại |
| 19 | **PRNT-001** | Cổng phụ huynh theo dõi con | `/parent` | Parent Portal | `(portal)/layout.tsx` | **CONTENT_SCROLL** |  Tồn tại |
| 20 | **ADMN-001** | Admin Dashboard | `/admin` | Admin CMS | `admin/layout.tsx` | **CONTENT_SCROLL** |  Tồn tại |
| 21 | **ADMN-002** | Admin Quản lý sự kiện | `/admin/events` | Admin CMS | `admin/layout.tsx` | **CONTENT_SCROLL** |  Tồn tại |
| 22 | **ADMN-003** | Admin Quản lý địa điểm | `/admin/locations` | Admin CMS | `admin/layout.tsx` | **CONTENT_SCROLL** |  Tồn tại |
| 23 | **ADMN-004** | Admin Kho Media & Ảnh 360° | `/admin/media` | Admin CMS | `admin/layout.tsx` | **CONTENT_SCROLL** |  Tồn tại |
| 24 | **ADMN-005** | Admin Quản trị người dùng & RBAC | `/admin/users` | Admin CMS | `admin/layout.tsx` | **CONTENT_SCROLL** |  Tồn tại |
| 25 | **ADMN-006** | Admin Studio biên tập Tour 360° | `/admin/virtual-tour` | Admin CMS | `admin/layout.tsx` | **FULL_VIEWPORT** |  Tồn tại |

---

### Phân Tích Tổng Hợp Số Lượng:
- **Tổng số trang chức năng:** 25 trang.
- **Trang Public Website:** 9 trang (chiếm 36%).
- **Trang Authentication:** 2 trang (chiếm 8%).
- **Trang Virtual Campus (360 & Map):** 2 trang (chiếm 8%).
- **Trang Student Portal:** 5 trang (chiếm 20%).
- **Trang Parent Portal:** 1 trang (chiếm 4%).
- **Trang Admin CMS:** 6 trang (chiếm 24%).
- **Tổng số ảnh thiết kế cần tạo:** **50 ảnh** (25 trang x 2 viewports Desktop 1440 và Mobile 390).