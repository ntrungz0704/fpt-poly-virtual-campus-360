# 04 — DANH MỤC TOÀN BỘ ROUTE & TRANG GIAO DIỆN (COMPLETE ROUTE INVENTORY)

Dưới đây là bảng thống kê chính xác tuyệt đối **25 trang chức năng + 2 trạng thái hệ thống**, đối soát trực tiếp từ cây thư mục `apps/web/src/app`:

| STT | Route Path | Phân hệ (Group) | Tên màn hình / Mục đích | Layout áp dụng | Yêu cầu Auth / Role | API Backend kết nối | Models DB liên quan | Hiện trạng UI | Nhu cầu Redesign |
|:---:|---|---|---|---|---|---|---|:---:|:---:|
| 1 | `/` | Public | Trang chủ Virtual Campus | `(public)/layout` | Khách công cộng | `GET /public/events`, `locations` | Campus, Building, Location, Event | Hoạt động | **Cần Redesign** (Hiện đại hóa Hero, CTA) |
| 2 | `/about` | Public | Giới thiệu FPT Polytechnic | `(public)/layout` | Khách công cộng | Không (Nội dung tĩnh) | Không | Hoạt động | **Cần Redesign** (Nâng cấp giao diện kể chuyện) |
| 3 | `/contact` | Public | Liên hệ & Hỗ trợ tuyển sinh | `(public)/layout` | Khách công cộng | Không (Form tĩnh) | Không | Hoạt động | **Cần Redesign** (Thêm bản đồ mini & Form đẹp) |
| 4 | `/events` | Public | Lịch trình & Đăng ký Open Day | `(public)/layout` | Khách công cộng | `GET /public/events`, `POST register` | OpenDayEvent, Session, Faq, Ticket | Hoạt động | **Cần Redesign** (Lịch trình trực quan, vé đẹp) |
| 5 | `/games` | Public | Minigame trắc nghiệm & Vòng quay | `(public)/layout` | Khách công cộng | `POST /gamification/quiz/submit`, `spin` | QuizAttempt, SpinHistory, XpLedger | Hoạt động | **Cần Redesign** (Tăng tính Gamification vui nhộn) |
| 6 | `/locations` | Public | Danh mục không gian & phòng học | `(public)/layout` | Khách công cộng | `GET /public/locations` | Location, Building, LocationMedia | Hoạt động | **Cần Redesign** (Bộ lọc thông minh, thẻ ảnh xịn) |
| 7 | `/locations/[slug]` | Public | Chi tiết địa điểm & ảnh 360 liên kết | `(public)/layout` | Khách công cộng | `GET /public/locations/:slug` | Location, TourNode, LocationMedia | Hoạt động | **Cần Redesign** (Bố cục thông tin & nút vào tour) |
| 8 | `/news` | Public | Bảng tin tức & sự kiện campus | `(public)/layout` | Khách công cộng | Không (Dữ liệu tĩnh) | Không | Hoạt động | **Cần Redesign** (Tạp chí hiện đại, chia cột) |
| 9 | `/news/[slug]` | Public | Chi tiết bài viết tin tức | `(public)/layout` | Khách công cộng | Không (Dữ liệu tĩnh) | Không | Hoạt động | **Cần Redesign** (Typography đọc bài chuẩn mực) |
| 10 | `/login` | Auth | Đăng nhập tài khoản tập trung | `(auth)/layout` | Chưa đăng nhập | `POST /auth/login` | User, UserRole, Role, RefreshToken | Hoạt động | **Cần Redesign** (Chia đôi màn hình, thẩm mỹ cao) |
| 11 | `/change-password` | Auth | Buộc đổi mật khẩu lần đầu | `(auth)/layout` | Bắt buộc đổi MK | `POST /auth/change-password` | User, AuditLog | Hoạt động | **Cần Redesign** (Hiển thị tiêu chí mật khẩu trực quan) |
| 12 | `/campus` | Immersive | Khám phá thực tế ảo 360° | `(immersive)/layout`| Khách công cộng | `GET /public/tour`, `nodes` | TourNode, TourEdge, Hotspot, Media | Hoạt động | **Cần Redesign** (UI Toolbar tinh gọn, không scrollbar) |
| 13 | `/map` | Immersive | Bản đồ số GIS khuôn viên QTSC | `(immersive)/layout`| Khách công cộng | `GET /public/campus/map` | Campus, Building, FloorPlan | Hoạt động | **Cần Redesign** (Bản đồ tràn viền, bộ lọc tòa nhà) |
| 14 | `/portal` | Student | Tổng quan Cổng sinh viên | `(portal)/layout` | STUDENT | `GET /portal/profile`, `tickets`, `gamification`| User, EventParticipation, XpLedger | Hoạt động | **Cần Redesign** (Dashboard chào mừng sang trọng) |
| 15 | `/portal/profile` | Student | Thông tin cá nhân & bio sinh viên | `(portal)/layout` | STUDENT | `GET/PATCH /portal/profile` | User | Hoạt động | **Cần Redesign** (Thẻ sinh viên điện tử sinh động) |
| 16 | `/portal/progress` | Student | Điểm thưởng XP, level, lịch sử quay | `(portal)/layout` | STUDENT | `GET /portal/gamification` | XpLedger, UserSpinHistory | Hoạt động | **Cần Redesign** (Thanh tiến trình & huy hiệu cấp độ) |
| 17 | `/portal/schedule` | Student | Lịch trình phiên tham quan cá nhân | `(portal)/layout` | STUDENT | `GET /portal/tickets` | EventParticipation, OpenDaySession | Hoạt động | **Cần Redesign** (Timeline sự kiện rõ nét) |
| 18 | `/portal/tickets` | Student | Vé Open Day & QR Code cá nhân | `(portal)/layout` | STUDENT | `GET /portal/tickets` | EventParticipation, OpenDayEvent | Hoạt động | **Cần Redesign** (Vé máy bay / concert xịn xò) |
| 19 | `/parent` | Parent | Cổng phụ huynh theo dõi con em | `(portal)/layout` | PARENT | `GET /parent/students`, `POST link` | ParentStudentLink, User, XpLedger | Hoạt động | **Cần Redesign** (Thẻ thông tin con em trực quan) |
| 20 | `/admin` | Admin | Bảng điều khiển quản trị chung | `admin/layout` | ADMIN, SUPER_ADMIN | `GET /admin/stats` (Tổng hợp) | Users, Events, Locations, TourNodes | Hoạt động | **Cần Redesign** (SaaS Enterprise chuẩn chỉnh) |
| 21 | `/admin/events` | Admin | Quản lý sự kiện, phiên & Check-in | `admin/layout` | EVENT_OPERATOR, ADMIN | `GET/POST/PATCH /admin/events` | OpenDayEvent, Session, Faq, QuizItem | Hoạt động | **Cần Redesign** (Bảng quản lý & bộ lọc sắc nét) |
| 22 | `/admin/locations` | Admin | Quản lý tòa nhà, tầng, địa điểm | `admin/layout` | ADMIN, SUPER_ADMIN | `GET/POST/PATCH /admin/locations` | Building, Floor, Location, LocationMedia | Hoạt động | **Cần Redesign** (Drawer nhập liệu chuẩn Form SaaS) |
| 23 | `/admin/media` | Admin | Quản lý thư viện hình ảnh & 360 | `admin/layout` | ADMIN, SUPER_ADMIN | `GET/POST /admin/media`, presign | MediaAsset, UploadToken | Hoạt động | **Cần Redesign** (Lưới media, preview ảnh 360) |
| 24 | `/admin/users` | Admin | Quản trị tài khoản & phân quyền | `admin/layout` | SUPER_ADMIN | `GET/POST /admin/users`, `roles` | User, UserRole, Role, Permission | Hoạt động | **Cần Redesign** (Bảng tài khoản & badge vai trò) |
| 25 | `/admin/virtual-tour`| Admin | Thiết lập kịch bản Tour & Hotspots | `admin/layout` | ADMIN, SUPER_ADMIN | `GET/POST /admin/tour`, `hotspots` | TourNode, TourEdge, Hotspot | Hoạt động | **Cần Redesign** (Khung biên tập 360 Studio chuyên nghiệp) |
| 26 | `/_not-found` | System | Trang báo lỗi 404 Không tìm thấy | Root layout | Tất cả | Không | Không | Hoạt động | **Cần Redesign** (Minh họa 404 phong cách Poly) |
| 27 | `/loading` | System | Skeleton toàn trang khi tải | Root layout | Tất cả | Không | Không | Hoạt động | **Cần Redesign** (Skeleton animation mượt mà) |
