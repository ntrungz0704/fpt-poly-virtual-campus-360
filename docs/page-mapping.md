# FPT Polytechnic Virtual Campus 360° — Page Mapping Specification

> **Mục tiêu**: Định tuyến rõ ràng từ 100% tệp xuất Google Stitch sang các Route Next.js App Router, gán Layout tương ứng và phân loại component.

---

## 1. BẢNG QUY HOẠCH TOÀN BỘ 12 NHÓM ROUTE

| STT | Route Next.js | Tên hiển thị (VN) | Thư mục Desktop Stitch | Thư mục Mobile Stitch | Layout áp dụng | Quyền truy cập |
|---|---|---|---|---|---|---|
| **01** | `/` | Trang chủ | `fpt_polytechnic_virtual_campus_360_trang_ch` | `page_01_fpt_polytechnic_virtual_campus_360_mobile` | `PublicLayout` | Công khai |
| **02** | `/about` | Giới thiệu | `page_02_about_fpt_polytechnic_desktop` | `page_02_about_fpt_polytechnic_mobile` | `PublicLayout` | Công khai |
| **03** | `/campus` | Virtual Campus 360° | `page_03_virtual_campus_360_exploration_desktop` | `page_03_virtual_campus_360_exploration_mobile` | `ImmersiveTourLayout` | Công khai |
| **04** | `/map` | Bản đồ 3D & GIS | `page_04_3d_campus_explorer_desktop` + `page_05` | `page_04` + `mobile/three.js` + `page_05` | `ImmersiveTourLayout` | Công khai |
| **05** | `/locations`<br>`/locations/[slug]` | Danh sách & Chi tiết Địa điểm | `page_06_building_and_room_details_desktop` | `page_06_building_and_room_details_mobile` | `PublicLayout` | Công khai |
| **06** | `/events` | Sự kiện & Open Day | `page_07_fpt_polytechnic_open_day_desktop` | `page_07_fpt_polytechnic_open_day_mobile` | `PublicLayout` | Xem tự do, Đăng ký cần Login |
| **07** | `/news`<br>`/news/[slug]` | Tin tức & Chi tiết bài viết | `page_09_news_and_events` + `page_10_article_detail` | `page_09` + `page_10` | `PublicLayout` | Công khai |
| **08** | `/contact` | Liên hệ & Tư vấn | Form tư vấn từ `trang_ch` & `page_07` | Form tư vấn từ `page_01` & `page_07` | `PublicLayout` | Công khai |
| **09** | `/login` | Đăng nhập hệ thống | Nửa đầu `page_12_account_login_and_profile_management` | Form đăng nhập chuẩn hóa tương ứng | `AuthLayout` | Công khai (dành cho chưa đăng nhập) |
| **10** | `/portal` | Cổng Sinh viên / Phụ huynh | `page_11_student_and_parent_portal` + Nửa sau `page_12` | `page_11_student_and_parent_portal_mobile` | `PortalLayout` | Yêu cầu đăng nhập (`STUDENT`, `PARENT`) |
| **11** | `/games` | Trò chơi & Thử thách Campus | Mở rộng từ mục thử thách của `page_11` | Thử thách tương ứng | `PublicLayout` | Chơi tự do, Lưu điểm cần Login |
| **12** | `/admin` | Admin CMS Quản trị | Xây mới 12 module quản trị theo Phần V | Tương thích máy tính bảng & mobile | `AdminLayout` | Quản trị viên (`ADMIN`, `SUPER_ADMIN`) |

---

## 2. CHI TIẾT TỪNG ROUTE VÀ CÁC THÀNH PHẦN BÓC TÁCH

### Route 01: `/` — Trang chủ (Home)
- **Tập tin đích**: `apps/web/src/app/(public)/page.tsx`
- **Components bóc tách**:
  - `Hero360Viewer`: Cửa sổ tương tác 360 độ ban đầu với hiệu ứng quét radar, chọn cơ sở toàn quốc và các nút Hotspot trôi nổi.
  - `CampusStatsBar`: Dải số liệu thống kê thành tựu (cơ sở, tỷ lệ việc làm, doanh nghiệp đối tác).
  - `FeaturedSpacesGrid`: Lưới bento hiển thị các phòng Lab, thư viện, xưởng sáng tạo với bộ lọc danh mục.
  - `OpenDayBanner`: Khung truyền thông ngày hội trải nghiệm Open Day 2025.
  - `VirtualTourFeedback`: Đánh giá trải nghiệm thực tế ảo từ sinh viên và phụ huynh.
  - `QuickRegistrationForm`: Biểu mẫu đăng ký tham quan nhanh và nhận thông tin học bổng.

### Route 02: `/about` — Giới thiệu FPT Polytechnic
- **Tập tin đích**: `apps/web/src/app/(public)/about/page.tsx`
- **Components bóc tách**:
  - `AboutHero`: Banner giới thiệu trường với thông điệp "Thực học — Thực nghiệp".
  - `PhilosophySection`: Triết lý giáo dục, sứ mệnh, tầm nhìn và giá trị cốt lõi.
  - `CampusComplexOverview`: Giới thiệu tổ hợp học thuật Trịnh Văn Bô (Hà Nội) và các cơ sở trọng điểm.
  - `FacilitiesShowcase`: Trưng bày cơ sở vật chất, hạ tầng công nghệ số và phòng lab chuyên dụng.
  - `CampusGallery`: Bộ sưu tập hình ảnh và video toàn cảnh khuôn viên trường.

### Route 03: `/campus` — Virtual Campus 360°
- **Tập tin đích**: `apps/web/src/app/(immersive)/campus/page.tsx`
- **Components bóc tách**:
  - `PanoramaCanvas`: Khung nhìn toàn cảnh 360 độ (kết nối Marzipano / Pannellum).
  - `SphericalHotspots`: Các điểm ghim tương tác được định vị theo góc cầu (`yaw`, `pitch`).
  - `SceneNavigatorBar`: Thanh chuyển đổi góc nhìn và chuyển đổi nhanh giữa các khu vực.
  - `MiniLocationMap`: Bản đồ thu nhỏ góc màn hình báo hiệu vị trí của người dùng trong khuôn viên.
  - `CameraControlHUD`: Phím phóng to, thu nhỏ, xoay trái/phải, chế độ toàn màn hình và la bàn định hướng.

### Route 04: `/map` — Bản đồ số 3D & GIS Khuôn viên
- **Tập tin đích**: `apps/web/src/app/(immersive)/map/page.tsx`
- **Components bóc tách**:
  - `DigitalTwinCanvas`: Không gian 3D tương tác sử dụng React Three Fiber (kế thừa từ Three.js trong `page_04`).
  - `BuildingSelectorSheet`: Bảng thông tin tòa nhà trượt từ cạnh bên (Tòa T, Alpha, Hội trường, Thư viện).
  - `GisMapOverlay`: Lớp bản đồ 2D GIS hỗ trợ định vị các lối đi bộ, khu thể thao và bãi xe.
  - `SwitchModeControls`: Nút chuyển đổi qua lại giữa góc nhìn 3D Digital Twin và bản đồ mặt bằng 2D.

### Route 05: `/locations` & `/locations/[slug]` — Địa điểm & Phòng học
- **Tập tin đích**: `apps/web/src/app/(public)/locations/page.tsx` & `[slug]/page.tsx`
- **Components bóc tách**:
  - `LocationDirectoryHeader`: Thanh tìm kiếm và bộ lọc đa tiêu chí (Toà nhà, Tầng, Loại phòng).
  - `FloorDirectoryAccordion`: Sơ đồ các tầng của tòa nhà với danh mục chi tiết từng phòng học.
  - `RoomCard`: Thẻ phòng học với hình ảnh, số lượng máy trạm, thiết bị và nút "Xem góc 360°".
  - `RoomDetailModal`: Khung xem chi tiết trang thiết bị và công năng đào tạo.

### Route 06: `/events` — Sự kiện & Ngày hội Open Day
- **Tập tin đích**: `apps/web/src/app/(public)/events/page.tsx`
- **Components bóc tách**:
  - `OpenDayHero`: Tiêu điểm ngày hội trải nghiệm nghề nghiệp 2025.
  - `KeyPillarsGrid`: 4 trọng điểm trải nghiệm (Campus Tour 360, Workshop thực chiến, Hướng nghiệp 4.0, Học bổng).
  - `ScheduleTimeline`: Lịch trình hoạt động trong ngày theo từng khung giờ.
  - `EventRegistrationCard`: Khối đăng ký tham gia với quy tắc chuyển hướng đăng nhập.

### Route 07: `/news` & `/news/[slug]` — Tin tức & Sự kiện Học đường
- **Tập tin đích**: `apps/web/src/app/(public)/news/page.tsx` & `[slug]/page.tsx`
- **Components bóc tách**:
  - `FeaturedArticleBanner`: Bài viết tâm điểm kích thước lớn.
  - `NewsCategoryTabs`: Bộ tab phân loại (Tin đào tạo, Sự kiện sinh viên, Công nghệ số, Tuyển sinh).
  - `NewsArticleGrid`: Lưới bài viết kèm thời gian đăng và ảnh đại diện.
  - `ArticleContentRenderer`: Khung hiển thị nội dung bài viết chi tiết, danh mục mục lục và nút chia sẻ.

### Route 08: `/contact` — Liên hệ & Tư vấn Tuyển sinh
- **Tập tin đích**: `apps/web/src/app/(public)/contact/page.tsx`
- **Components bóc tách**:
  - `CampusNetworkList`: Thông tin chi tiết 5 cơ sở (Hà Nội, Đà Nẵng, TP.HCM, Cần Thơ, Tây Nguyên).
  - `ContactInquiryForm`: Biểu mẫu tiếp nhận yêu cầu tư vấn, chọn ngành học và lịch hẹn tham quan trường.
  - `FaqAccordion`: Danh sách câu hỏi thường gặp về tuyển sinh, nhập học và học phí.

### Route 09: `/login` — Cổng xác thực số (Authentication)
- **Tập tin đích**: `apps/web/src/app/(auth)/login/page.tsx`
- **Components bóc tách**:
  - `AuthLeftBranding`: Cột truyền thông thương hiệu với tiêu chuẩn an ninh EduID SSO 2.0 và ISO/IEC 27001.
  - `LoginForm`: Form đăng nhập mã sinh viên/SĐT phụ huynh, hiển thị/ẩn mật khẩu an toàn, nút ghi nhớ phiên.
  - `AccountAssistanceModal`: Hướng dẫn cấp lại tài khoản do nhà trường phát hành.

### Route 10: `/portal` — Cổng thông tin Sinh viên & Phụ huynh
- **Tập tin đích**: `apps/web/src/app/(portal)/portal/page.tsx`
- **Components bóc tách**:
  - `UserGreetingCard`: Thẻ định danh tài khoản, liên kết cha con (Phụ huynh - Sinh viên), mã định danh.
  - `DigitalPassInvitation`: Thẻ vé mời tham dự Open Day số có mã QR định danh.
  - `RegisteredEventsList`: Danh sách các hoạt động sự kiện đã đăng ký và lịch trình riêng.
  - `ActivityHistoryTimeline`: Nhật ký tham quan các phòng Lab và tiến trình tích lũy.

### Route 11: `/games` — Trò chơi & Thử thách Khám phá Trường
- **Tập tin đích**: `apps/web/src/app/(public)/games/page.tsx`
- **Components bóc tách**:
  - `GameDiscoveryLobby`: Sảnh chọn trò chơi (Poly Quiz, Truy tìm kho báu Campus, Thử tài hiểu Poly).
  - `QuizInteractiveScreen`: Giao diện trả lời câu hỏi trắc nghiệm có đồng hồ đếm ngược.
  - `ResultBadgeModal`: Bảng hiển thị kết quả, số điểm XP tích lũy và danh hiệu mở khóa.
  - `CampusLeaderboard`: Bảng vinh danh top sinh viên/khách tham quan đạt điểm cao nhất.

### Route 12: `/admin` — Hệ thống Quản trị Nội dung (CMS)
- **Tập tin đích**: `apps/web/src/app/admin/page.tsx` và các module con
- **Components bóc tách**:
  - `AdminSidebar`: Thanh điều hướng 12 module quản trị.
  - `DashboardOverviewMetrics`: Bảng thống kê lượt xem 360, lượt đăng ký Open Day, tài khoản người dùng.
  - `TourHotspotEditor`: Trình trực quan kéo thả hotspot trên ảnh Panorama equirectangular.
  - `MediaUploadManager`: Khu vực tải lên ảnh 360°, mô hình 3D (GLB) có thanh tiến trình.
