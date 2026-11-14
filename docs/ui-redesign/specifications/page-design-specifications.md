# ĐẶC TẢ CHI TIẾT THIẾT KẾ TỪNG TRANG (PAGE DESIGN SPECIFICATIONS)

Tài liệu này quy định mục tiêu người dùng, thành phần giao diện, luồng dữ liệu và trải nghiệm UX cho từng mã trang trong 25 trang:

## [PUB-001] Trang chủ Virtual Campus (Virtual Campus Homepage)
- **Tuyến đường (Route):** `/`
- **Phân hệ:** Public Website
- **Layout cha:** `(public)/layout.tsx`
- **Hành vi Viewport:** `CONTENT_SCROLL`
- **Đối tượng người dùng:** Khách vãng lai, Thí sinh, Phụ huynh
- **API Backend kết nối:** `GET /api/v1/public/events, GET /api/v1/public/locations`
- **Mục tiêu nghiệp vụ:** Trang chủ tiếp đón người dùng, giới thiệu trải nghiệm Virtual Campus 360°, điểm nổi bật, số liệu khuôn viên, lịch Open Day và điều hướng chính.
- **Thành phần UI cốt lõi:**
  - `PublicHeader`
  - `HeroSection`
  - `StatsGrid`
  - `FeatureHighlights`
  - `VirtualTourPreview`
  - `OpenDayBanner`
  - `ConsultingForm`
  - `PublicFooter`
- **Hướng dẫn thiết kế Desktop (1440x900):**
  - Tối ưu không gian ngang, phân cấp rõ ràng giữa thông tin quan trọng và thông tin phụ trợ.
  - Sử dụng hệ lưới 12 cột với gutter 24px, container tối đa 1440px.
- **Hướng dẫn thiết kế Mobile (390x844):**
  - Chuyển đổi các khối cột ngang thành một cột dọc duy nhất.
  - Các nút hành động chính (Primary Action) đặt tại vùng chạm ngón tay cái (thumb zone) ở nửa dưới màn hình.
  - Khoảng cách chạm tối thiểu cho các nút: 44px x 44px.

---

## [PUB-002] Giới thiệu trường (About School)
- **Tuyến đường (Route):** `/about`
- **Phân hệ:** Public Website
- **Layout cha:** `(public)/layout.tsx`
- **Hành vi Viewport:** `CONTENT_SCROLL`
- **Đối tượng người dùng:** Khách vãng lai, Thí sinh, Phụ huynh
- **API Backend kết nối:** `Nội dung tĩnh tối ưu SEO`
- **Mục tiêu nghiệp vụ:** Giới thiệu lịch sử, triết lý đào tạo thực chiến 'Thực học - Thực nghiệp', môi trường học tập và cơ sở vật chất FPT Polytechnic tại CVPM Quang Trung.
- **Thành phần UI cốt lõi:**
  - `PublicHeader`
  - `AboutHero`
  - `PhilosophyCards`
  - `CampusFacilitiesGrid`
  - `AdmissionCTA`
  - `PublicFooter`
- **Hướng dẫn thiết kế Desktop (1440x900):**
  - Tối ưu không gian ngang, phân cấp rõ ràng giữa thông tin quan trọng và thông tin phụ trợ.
  - Sử dụng hệ lưới 12 cột với gutter 24px, container tối đa 1440px.
- **Hướng dẫn thiết kế Mobile (390x844):**
  - Chuyển đổi các khối cột ngang thành một cột dọc duy nhất.
  - Các nút hành động chính (Primary Action) đặt tại vùng chạm ngón tay cái (thumb zone) ở nửa dưới màn hình.
  - Khoảng cách chạm tối thiểu cho các nút: 44px x 44px.

---

## [PUB-003] Liên hệ tuyển sinh (Contact & Admissions)
- **Tuyến đường (Route):** `/contact`
- **Phân hệ:** Public Website
- **Layout cha:** `(public)/layout.tsx`
- **Hành vi Viewport:** `CONTENT_SCROLL`
- **Đối tượng người dùng:** Khách vãng lai, Thí sinh, Phụ huynh
- **API Backend kết nối:** `Form liên hệ & tư vấn tuyển sinh`
- **Mục tiêu nghiệp vụ:** Cung cấp biểu mẫu tư vấn tuyển sinh, số điện thoại hotline, địa chỉ chi tiết cơ sở QTSC Quận 12 kèm bản đồ mini và hướng dẫn di chuyển.
- **Thành phần UI cốt lõi:**
  - `PublicHeader`
  - `ContactForm`
  - `CampusAddressCard`
  - `MapPreview`
  - `TransportGuide`
  - `FAQAccordion`
  - `PublicFooter`
- **Hướng dẫn thiết kế Desktop (1440x900):**
  - Tối ưu không gian ngang, phân cấp rõ ràng giữa thông tin quan trọng và thông tin phụ trợ.
  - Sử dụng hệ lưới 12 cột với gutter 24px, container tối đa 1440px.
- **Hướng dẫn thiết kế Mobile (390x844):**
  - Chuyển đổi các khối cột ngang thành một cột dọc duy nhất.
  - Các nút hành động chính (Primary Action) đặt tại vùng chạm ngón tay cái (thumb zone) ở nửa dưới màn hình.
  - Khoảng cách chạm tối thiểu cho các nút: 44px x 44px.

---

## [PUB-004] Sự kiện Open Day 2026 (Open Day Event Showcase)
- **Tuyến đường (Route):** `/events`
- **Phân hệ:** Public Website
- **Layout cha:** `(public)/layout.tsx`
- **Hành vi Viewport:** `CONTENT_SCROLL`
- **Đối tượng người dùng:** Khách vãng lai, Thí sinh, Phụ huynh
- **API Backend kết nối:** `GET /api/v1/public/events, POST /api/v1/public/events/register`
- **Mục tiêu nghiệp vụ:** Trang giới thiệu sự kiện Open Day công nghệ lớn nhất trong năm, đồng hồ đếm ngược, lịch trình phiên sáng/chiều, diễn giả và đăng ký nhận vé miễn phí.
- **Thành phần UI cốt lõi:**
  - `PublicHeader`
  - `EventCountdownHero`
  - `ScheduleTabs`
  - `SpeakerCards`
  - `OpenDayRegistrationModal`
  - `FAQAccordion`
  - `StickyRegisterBar`
  - `PublicFooter`
- **Hướng dẫn thiết kế Desktop (1440x900):**
  - Tối ưu không gian ngang, phân cấp rõ ràng giữa thông tin quan trọng và thông tin phụ trợ.
  - Sử dụng hệ lưới 12 cột với gutter 24px, container tối đa 1440px.
- **Hướng dẫn thiết kế Mobile (390x844):**
  - Chuyển đổi các khối cột ngang thành một cột dọc duy nhất.
  - Các nút hành động chính (Primary Action) đặt tại vùng chạm ngón tay cái (thumb zone) ở nửa dưới màn hình.
  - Khoảng cách chạm tối thiểu cho các nút: 44px x 44px.

---

## [PUB-005] Minigame & Vòng quay (Gamification & Lucky Wheel)
- **Tuyến đường (Route):** `/games`
- **Phân hệ:** Public Website
- **Layout cha:** `(public)/layout.tsx`
- **Hành vi Viewport:** `CONTENT_SCROLL`
- **Đối tượng người dùng:** Khách vãng lai, Sinh viên
- **API Backend kết nối:** `POST /api/v1/gamification/spin, POST /api/v1/gamification/quiz/submit, GET /api/v1/gamification/leaderboard`
- **Mục tiêu nghiệp vụ:** Khu vực giải trí và tích lũy điểm thưởng XP: Vòng quay may mắn 3D với 8 ô giải thưởng, làm bài thi trắc nghiệm Quiz, bảng xếp hạng Leaderboard.
- **Thành phần UI cốt lõi:**
  - `PublicHeader`
  - `LuckyWheelCanvas`
  - `QuizChallengeCard`
  - `LeaderboardWidget`
  - `RecentWinnersTicker`
  - `RewardClaimModal`
  - `PublicFooter`
- **Hướng dẫn thiết kế Desktop (1440x900):**
  - Tối ưu không gian ngang, phân cấp rõ ràng giữa thông tin quan trọng và thông tin phụ trợ.
  - Sử dụng hệ lưới 12 cột với gutter 24px, container tối đa 1440px.
- **Hướng dẫn thiết kế Mobile (390x844):**
  - Chuyển đổi các khối cột ngang thành một cột dọc duy nhất.
  - Các nút hành động chính (Primary Action) đặt tại vùng chạm ngón tay cái (thumb zone) ở nửa dưới màn hình.
  - Khoảng cách chạm tối thiểu cho các nút: 44px x 44px.

---

## [PUB-006] Danh mục địa điểm (Campus Locations Directory)
- **Tuyến đường (Route):** `/locations`
- **Phân hệ:** Public Website
- **Layout cha:** `(public)/layout.tsx`
- **Hành vi Viewport:** `CONTENT_SCROLL`
- **Đối tượng người dùng:** Khách vãng lai, Thí sinh, Sinh viên
- **API Backend kết nối:** `GET /api/v1/public/locations`
- **Mục tiêu nghiệp vụ:** Danh sách toàn bộ phòng học, phòng lab thực hành, hội trường, thư viện số và khu tự học tại khuôn viên trường kèm bộ lọc thông minh.
- **Thành phần UI cốt lõi:**
  - `PublicHeader`
  - `LocationFilterBar`
  - `LocationSearchInput`
  - `LocationCardGrid`
  - `BuildingTagList`
  - `PublicFooter`
- **Hướng dẫn thiết kế Desktop (1440x900):**
  - Tối ưu không gian ngang, phân cấp rõ ràng giữa thông tin quan trọng và thông tin phụ trợ.
  - Sử dụng hệ lưới 12 cột với gutter 24px, container tối đa 1440px.
- **Hướng dẫn thiết kế Mobile (390x844):**
  - Chuyển đổi các khối cột ngang thành một cột dọc duy nhất.
  - Các nút hành động chính (Primary Action) đặt tại vùng chạm ngón tay cái (thumb zone) ở nửa dưới màn hình.
  - Khoảng cách chạm tối thiểu cho các nút: 44px x 44px.

---

## [PUB-007] Chi tiết địa điểm & Lab (Location Detail & Lab)
- **Tuyến đường (Route):** `/locations/[slug]`
- **Phân hệ:** Public Website
- **Layout cha:** `(public)/layout.tsx`
- **Hành vi Viewport:** `CONTENT_SCROLL`
- **Đối tượng người dùng:** Khách vãng lai, Thí sinh, Sinh viên
- **API Backend kết nối:** `GET /api/v1/public/locations/:slug`
- **Mục tiêu nghiệp vụ:** Trang chi tiết của từng địa điểm: thông số sức chứa, trang thiết bị kỹ thuật, thư viện ảnh 2D, vị trí trên bản đồ và nút chuyển thẳng vào Tour 360°.
- **Thành phần UI cốt lõi:**
  - `PublicHeader`
  - `LocationHeaderBanner`
  - `FacilitySpecList`
  - `PhotoGalleryGrid`
  - `MiniMapPin`
  - `EnterTourButton`
  - `PublicFooter`
- **Hướng dẫn thiết kế Desktop (1440x900):**
  - Tối ưu không gian ngang, phân cấp rõ ràng giữa thông tin quan trọng và thông tin phụ trợ.
  - Sử dụng hệ lưới 12 cột với gutter 24px, container tối đa 1440px.
- **Hướng dẫn thiết kế Mobile (390x844):**
  - Chuyển đổi các khối cột ngang thành một cột dọc duy nhất.
  - Các nút hành động chính (Primary Action) đặt tại vùng chạm ngón tay cái (thumb zone) ở nửa dưới màn hình.
  - Khoảng cách chạm tối thiểu cho các nút: 44px x 44px.

---

## [PUB-008] Bảng tin tức sự kiện (News & Events Board)
- **Tuyến đường (Route):** `/news`
- **Phân hệ:** Public Website
- **Layout cha:** `(public)/layout.tsx`
- **Hành vi Viewport:** `CONTENT_SCROLL`
- **Đối tượng người dùng:** Khách vãng lai, Thí sinh, Sinh viên, Phụ huynh
- **API Backend kết nối:** `Dữ liệu tin tức và thông báo tĩnh tối ưu SEO`
- **Mục tiêu nghiệp vụ:** Kênh truyền thông tin tức, hoạt động sinh viên, thông báo học vụ, lịch khai giảng và cẩm nang hướng dẫn tham quan Virtual Campus.
- **Thành phần UI cốt lõi:**
  - `PublicHeader`
  - `FeaturedNewsCard`
  - `CategoryFilterTabs`
  - `NewsGrid`
  - `PaginationControls`
  - `PublicFooter`
- **Hướng dẫn thiết kế Desktop (1440x900):**
  - Tối ưu không gian ngang, phân cấp rõ ràng giữa thông tin quan trọng và thông tin phụ trợ.
  - Sử dụng hệ lưới 12 cột với gutter 24px, container tối đa 1440px.
- **Hướng dẫn thiết kế Mobile (390x844):**
  - Chuyển đổi các khối cột ngang thành một cột dọc duy nhất.
  - Các nút hành động chính (Primary Action) đặt tại vùng chạm ngón tay cái (thumb zone) ở nửa dưới màn hình.
  - Khoảng cách chạm tối thiểu cho các nút: 44px x 44px.

---

## [PUB-009] Chi tiết bài viết tin tức (News Article Detail)
- **Tuyến đường (Route):** `/news/[slug]`
- **Phân hệ:** Public Website
- **Layout cha:** `(public)/layout.tsx`
- **Hành vi Viewport:** `CONTENT_SCROLL`
- **Đối tượng người dùng:** Khách vãng lai, Thí sinh, Sinh viên, Phụ huynh
- **API Backend kết nối:** `Dữ liệu bài viết chi tiết`
- **Mục tiêu nghiệp vụ:** Giao diện bài viết chi tiết chuẩn typographic: tiêu đề lớn, thông tin tác giả/ngày đăng, ảnh bìa sắc nét, nội dung văn bản định dạng phong phú và bài liên quan.
- **Thành phần UI cốt lõi:**
  - `PublicHeader`
  - `ArticleHeader`
  - `ArticleContentRenderer`
  - `TableOfContents`
  - `SocialShareBar`
  - `RelatedArticles`
  - `PublicFooter`
- **Hướng dẫn thiết kế Desktop (1440x900):**
  - Tối ưu không gian ngang, phân cấp rõ ràng giữa thông tin quan trọng và thông tin phụ trợ.
  - Sử dụng hệ lưới 12 cột với gutter 24px, container tối đa 1440px.
- **Hướng dẫn thiết kế Mobile (390x844):**
  - Chuyển đổi các khối cột ngang thành một cột dọc duy nhất.
  - Các nút hành động chính (Primary Action) đặt tại vùng chạm ngón tay cái (thumb zone) ở nửa dưới màn hình.
  - Khoảng cách chạm tối thiểu cho các nút: 44px x 44px.

---

## [AUTH-001] Đăng nhập tập trung (Centralized Authentication)
- **Tuyến đường (Route):** `/login`
- **Phân hệ:** Authentication
- **Layout cha:** `(auth)/layout.tsx`
- **Hành vi Viewport:** `FULL_VIEWPORT`
- **Đối tượng người dùng:** Chưa đăng nhập (Sinh viên, Phụ huynh, Cán bộ, Quản trị viên)
- **API Backend kết nối:** `POST /api/v1/auth/login, POST /api/v1/auth/refresh`
- **Mục tiêu nghiệp vụ:** Giao diện đăng nhập tập trung dạng chia đôi màn hình: Cột trái hình ảnh nhận diện công nghệ/VR campus; cột phải form đăng nhập với tab 3 vai trò.
- **Thành phần UI cốt lõi:**
  - `AuthSplitBanner`
  - `RoleTabSelector`
  - `CredentialInputs`
  - `RememberCheckbox`
  - `PrimaryAuthButton`
  - `PasswordVisibilityToggle`
- **Hướng dẫn thiết kế Desktop (1440x900):**
  - Tối ưu không gian ngang, phân cấp rõ ràng giữa thông tin quan trọng và thông tin phụ trợ.
  - Sử dụng hệ lưới 12 cột với gutter 24px, container tối đa 1440px.
- **Hướng dẫn thiết kế Mobile (390x844):**
  - Chuyển đổi các khối cột ngang thành một cột dọc duy nhất.
  - Các nút hành động chính (Primary Action) đặt tại vùng chạm ngón tay cái (thumb zone) ở nửa dưới màn hình.
  - Khoảng cách chạm tối thiểu cho các nút: 44px x 44px.

---

## [AUTH-002] Buộc đổi mật khẩu lần đầu (Forced Password Change)
- **Tuyến đường (Route):** `/change-password`
- **Phân hệ:** Authentication
- **Layout cha:** `(auth)/layout.tsx`
- **Hành vi Viewport:** `FULL_VIEWPORT`
- **Đối tượng người dùng:** Tài khoản cần đổi mật khẩu (mustChangePassword = true)
- **API Backend kết nối:** `POST /api/v1/auth/change-password`
- **Mục tiêu nghiệp vụ:** Màn hình bắt buộc đổi mật khẩu khi tài khoản được kích hoạt lần đầu hoặc bị quản trị viên yêu cầu reset: form nhập 12 ký tự kèm thanh đo độ mạnh.
- **Thành phần UI cốt lõi:**
  - `SecurityShieldIcon`
  - `CurrentPasswordInput`
  - `NewPasswordInput`
  - `PasswordPolicyChecklist`
  - `StrengthMeterBar`
  - `ConfirmChangeButton`
- **Hướng dẫn thiết kế Desktop (1440x900):**
  - Tối ưu không gian ngang, phân cấp rõ ràng giữa thông tin quan trọng và thông tin phụ trợ.
  - Sử dụng hệ lưới 12 cột với gutter 24px, container tối đa 1440px.
- **Hướng dẫn thiết kế Mobile (390x844):**
  - Chuyển đổi các khối cột ngang thành một cột dọc duy nhất.
  - Các nút hành động chính (Primary Action) đặt tại vùng chạm ngón tay cái (thumb zone) ở nửa dưới màn hình.
  - Khoảng cách chạm tối thiểu cho các nút: 44px x 44px.

---

## [CAMP-001] Tour thực tế ảo 360° (Virtual Tour 360° Experience)
- **Tuyến đường (Route):** `/campus`
- **Phân hệ:** Virtual Campus
- **Layout cha:** `(immersive)/layout.tsx`
- **Hành vi Viewport:** `IMMERSIVE_CANVAS`
- **Đối tượng người dùng:** Tất cả người dùng
- **API Backend kết nối:** `GET /api/v1/public/tour, GET /api/v1/public/tour/nodes/:id`
- **Mục tiêu nghiệp vụ:** Trải nghiệm tham quan thực tế ảo 360° toàn màn hình, thanh công cụ nổi kính mờ (Floating Glass Dock), điểm ghim Hotspot phát sáng, radar mini-map.
- **Thành phần UI cốt lõi:**
  - `PannellumViewerCanvas`
  - `FloatingControlDock`
  - `HotspotOverlayPins`
  - `SceneSwitcherDropdown`
  - `MiniMapRadarWidget`
  - `AudioNarratorButton`
  - `FullscreenToggle`
- **Hướng dẫn thiết kế Desktop (1440x900):**
  - Tối ưu không gian ngang, phân cấp rõ ràng giữa thông tin quan trọng và thông tin phụ trợ.
  - Sử dụng hệ lưới 12 cột với gutter 24px, container tối đa 1440px.
- **Hướng dẫn thiết kế Mobile (390x844):**
  - Chuyển đổi các khối cột ngang thành một cột dọc duy nhất.
  - Các nút hành động chính (Primary Action) đặt tại vùng chạm ngón tay cái (thumb zone) ở nửa dưới màn hình.
  - Khoảng cách chạm tối thiểu cho các nút: 44px x 44px.

---

## [CAMP-002] Bản đồ số GIS khuôn viên (Interactive GIS Campus Map)
- **Tuyến đường (Route):** `/map`
- **Phân hệ:** Virtual Campus
- **Layout cha:** `(immersive)/layout.tsx`
- **Hành vi Viewport:** `IMMERSIVE_CANVAS`
- **Đối tượng người dùng:** Tất cả người dùng
- **API Backend kết nối:** `GET /api/v1/public/campus/map`
- **Mục tiêu nghiệp vụ:** Bản đồ số GIS tương tác khuôn viên QTSC, định vị các tòa nhà, sơ đồ tầng, điểm ghim dịch vụ và nút chuyển nhanh vào Tour 360° của từng tòa.
- **Thành phần UI cốt lõi:**
  - `LeafletMapCanvas`
  - `BuildingIsoMarkers`
  - `MapSearchFilterDock`
  - `BuildingInfoDrawer`
  - `FloorPlanToggle`
  - `ZoomTiltControls`
- **Hướng dẫn thiết kế Desktop (1440x900):**
  - Tối ưu không gian ngang, phân cấp rõ ràng giữa thông tin quan trọng và thông tin phụ trợ.
  - Sử dụng hệ lưới 12 cột với gutter 24px, container tối đa 1440px.
- **Hướng dẫn thiết kế Mobile (390x844):**
  - Chuyển đổi các khối cột ngang thành một cột dọc duy nhất.
  - Các nút hành động chính (Primary Action) đặt tại vùng chạm ngón tay cái (thumb zone) ở nửa dưới màn hình.
  - Khoảng cách chạm tối thiểu cho các nút: 44px x 44px.

---

## [STUD-001] Cổng sinh viên Dashboard (Student Portal Dashboard)
- **Tuyến đường (Route):** `/portal`
- **Phân hệ:** Student Portal
- **Layout cha:** `(portal)/layout.tsx`
- **Hành vi Viewport:** `CONTENT_SCROLL`
- **Đối tượng người dùng:** Sinh viên (STUDENT)
- **API Backend kết nối:** `GET /api/v1/portal/profile, GET /api/v1/portal/tickets, GET /api/v1/portal/gamification`
- **Mục tiêu nghiệp vụ:** Bảng điều khiển cá nhân của sinh viên: lời chào mừng, thẻ tóm tắt điểm thưởng XP, thẻ vé Open Day sắp tới, lịch trình phiên tham gia và lối tắt nhanh.
- **Thành phần UI cốt lõi:**
  - `PortalHeader`
  - `PortalNavigationTabs`
  - `WelcomeStudentBanner`
  - `XpSummaryCard`
  - `ActiveTicketQuickView`
  - `UpcomingSessionsTimeline`
- **Hướng dẫn thiết kế Desktop (1440x900):**
  - Tối ưu không gian ngang, phân cấp rõ ràng giữa thông tin quan trọng và thông tin phụ trợ.
  - Sử dụng hệ lưới 12 cột với gutter 24px, container tối đa 1440px.
- **Hướng dẫn thiết kế Mobile (390x844):**
  - Chuyển đổi các khối cột ngang thành một cột dọc duy nhất.
  - Các nút hành động chính (Primary Action) đặt tại vùng chạm ngón tay cái (thumb zone) ở nửa dưới màn hình.
  - Khoảng cách chạm tối thiểu cho các nút: 44px x 44px.

---

## [STUD-002] Hồ sơ sinh viên (Student Profile)
- **Tuyến đường (Route):** `/portal/profile`
- **Phân hệ:** Student Portal
- **Layout cha:** `(portal)/layout.tsx`
- **Hành vi Viewport:** `CONTENT_SCROLL`
- **Đối tượng người dùng:** Sinh viên (STUDENT)
- **API Backend kết nối:** `GET /api/v1/portal/profile, PATCH /api/v1/portal/profile`
- **Mục tiêu nghiệp vụ:** Quản lý thông tin cá nhân của sinh viên: mã sinh viên, chuyên ngành đào tạo, email, số điện thoại, ảnh đại diện và chỉnh sửa phần tiểu sử (Bio).
- **Thành phần UI cốt lõi:**
  - `PortalHeader`
  - `StudentIdCardWidget`
  - `PersonalInfoForm`
  - `BioEditorTextarea`
  - `SaveProfileButton`
- **Hướng dẫn thiết kế Desktop (1440x900):**
  - Tối ưu không gian ngang, phân cấp rõ ràng giữa thông tin quan trọng và thông tin phụ trợ.
  - Sử dụng hệ lưới 12 cột với gutter 24px, container tối đa 1440px.
- **Hướng dẫn thiết kế Mobile (390x844):**
  - Chuyển đổi các khối cột ngang thành một cột dọc duy nhất.
  - Các nút hành động chính (Primary Action) đặt tại vùng chạm ngón tay cái (thumb zone) ở nửa dưới màn hình.
  - Khoảng cách chạm tối thiểu cho các nút: 44px x 44px.

---

## [STUD-003] Tiến trình & Điểm thưởng XP (XP Progress & Gamification)
- **Tuyến đường (Route):** `/portal/progress`
- **Phân hệ:** Student Portal
- **Layout cha:** `(portal)/layout.tsx`
- **Hành vi Viewport:** `CONTENT_SCROLL`
- **Đối tượng người dùng:** Sinh viên (STUDENT)
- **API Backend kết nối:** `GET /api/v1/portal/gamification`
- **Mục tiêu nghiệp vụ:** Theo dõi toàn bộ thành tích tích lũy điểm XP (120 XP), thanh thăng cấp (Level 2), danh hiệu đạt được và lịch sử biến động sổ cái điểm thưởng.
- **Thành phần UI cốt lõi:**
  - `PortalHeader`
  - `LevelProgressBar`
  - `XpRankBadge`
  - `AchievementBadgesGrid`
  - `XpLedgerHistoryTable`
  - `SpinWheelShortcut`
- **Hướng dẫn thiết kế Desktop (1440x900):**
  - Tối ưu không gian ngang, phân cấp rõ ràng giữa thông tin quan trọng và thông tin phụ trợ.
  - Sử dụng hệ lưới 12 cột với gutter 24px, container tối đa 1440px.
- **Hướng dẫn thiết kế Mobile (390x844):**
  - Chuyển đổi các khối cột ngang thành một cột dọc duy nhất.
  - Các nút hành động chính (Primary Action) đặt tại vùng chạm ngón tay cái (thumb zone) ở nửa dưới màn hình.
  - Khoảng cách chạm tối thiểu cho các nút: 44px x 44px.

---

## [STUD-004] Lịch trình tham gia sự kiện (Student Event Schedule)
- **Tuyến đường (Route):** `/portal/schedule`
- **Phân hệ:** Student Portal
- **Layout cha:** `(portal)/layout.tsx`
- **Hành vi Viewport:** `CONTENT_SCROLL`
- **Đối tượng người dùng:** Sinh viên (STUDENT)
- **API Backend kết nối:** `GET /api/v1/portal/tickets`
- **Mục tiêu nghiệp vụ:** Thời khóa biểu các phiên hội thảo, workshop công nghệ và tour thực tế mà sinh viên đã đăng ký trong sự kiện Open Day kèm chỉ dẫn phòng học.
- **Thành phần UI cốt lõi:**
  - `PortalHeader`
  - `ScheduleCalendarTimeline`
  - `SessionDetailCard`
  - `SpeakerAvatarList`
  - `RoomDirectionsButton`
- **Hướng dẫn thiết kế Desktop (1440x900):**
  - Tối ưu không gian ngang, phân cấp rõ ràng giữa thông tin quan trọng và thông tin phụ trợ.
  - Sử dụng hệ lưới 12 cột với gutter 24px, container tối đa 1440px.
- **Hướng dẫn thiết kế Mobile (390x844):**
  - Chuyển đổi các khối cột ngang thành một cột dọc duy nhất.
  - Các nút hành động chính (Primary Action) đặt tại vùng chạm ngón tay cái (thumb zone) ở nửa dưới màn hình.
  - Khoảng cách chạm tối thiểu cho các nút: 44px x 44px.

---

## [STUD-005] Vé Open Day & Mã QR (Digital Ticket & Check-in QR)
- **Tuyến đường (Route):** `/portal/tickets`
- **Phân hệ:** Student Portal
- **Layout cha:** `(portal)/layout.tsx`
- **Hành vi Viewport:** `CONTENT_SCROLL`
- **Đối tượng người dùng:** Sinh viên (STUDENT)
- **API Backend kết nối:** `GET /api/v1/portal/tickets`
- **Mục tiêu nghiệp vụ:** Thẻ vé điện tử thiết kế theo phong cách vé máy bay/concert: mã vé canonical OD26, mã QR độ tương phản cao để quét check-in và hướng dẫn điểm danh.
- **Thành phần UI cốt lõi:**
  - `PortalHeader`
  - `BoardingPassTicketCard`
  - `ScannableQrCodeDisplay`
  - `TicketStatusBadge`
  - `DownloadTicketPdfButton`
  - `CheckinGuideCard`
- **Hướng dẫn thiết kế Desktop (1440x900):**
  - Tối ưu không gian ngang, phân cấp rõ ràng giữa thông tin quan trọng và thông tin phụ trợ.
  - Sử dụng hệ lưới 12 cột với gutter 24px, container tối đa 1440px.
- **Hướng dẫn thiết kế Mobile (390x844):**
  - Chuyển đổi các khối cột ngang thành một cột dọc duy nhất.
  - Các nút hành động chính (Primary Action) đặt tại vùng chạm ngón tay cái (thumb zone) ở nửa dưới màn hình.
  - Khoảng cách chạm tối thiểu cho các nút: 44px x 44px.

---

## [PRNT-001] Cổng phụ huynh theo dõi con (Parent Portal Guardian View)
- **Tuyến đường (Route):** `/parent`
- **Phân hệ:** Parent Portal
- **Layout cha:** `(portal)/layout.tsx`
- **Hành vi Viewport:** `CONTENT_SCROLL`
- **Đối tượng người dùng:** Phụ huynh (PARENT)
- **API Backend kết nối:** `GET /api/v1/parent/students, GET /api/v1/parent/students/:id, POST /api/v1/parent/links`
- **Mục tiêu nghiệp vụ:** Giao diện dành riêng cho phụ huynh: hiển thị danh sách con em đã liên kết (APPROVED), điểm XP, vé sự kiện và form gửi yêu cầu liên kết mới qua MSSV.
- **Thành phần UI cốt lõi:**
  - `ParentHeader`
  - `LinkedStudentCardList`
  - `StudentDetailModal`
  - `AddChildLinkRequestForm`
  - `PendingRequestsNotice`
- **Hướng dẫn thiết kế Desktop (1440x900):**
  - Tối ưu không gian ngang, phân cấp rõ ràng giữa thông tin quan trọng và thông tin phụ trợ.
  - Sử dụng hệ lưới 12 cột với gutter 24px, container tối đa 1440px.
- **Hướng dẫn thiết kế Mobile (390x844):**
  - Chuyển đổi các khối cột ngang thành một cột dọc duy nhất.
  - Các nút hành động chính (Primary Action) đặt tại vùng chạm ngón tay cái (thumb zone) ở nửa dưới màn hình.
  - Khoảng cách chạm tối thiểu cho các nút: 44px x 44px.

---

## [ADMN-001] Admin Dashboard (Admin Executive Dashboard)
- **Tuyến đường (Route):** `/admin`
- **Phân hệ:** Admin CMS
- **Layout cha:** `admin/layout.tsx`
- **Hành vi Viewport:** `CONTENT_SCROLL`
- **Đối tượng người dùng:** Quản trị viên, Quản trị tối cao (ADMIN, SUPER_ADMIN)
- **API Backend kết nối:** `GET /api/v1/admin/stats`
- **Mục tiêu nghiệp vụ:** Bảng điều khiển quản trị trung tâm chuẩn Enterprise SaaS: 4 thẻ chỉ số KPI tổng quan, biểu đồ lượt tham quan 360, dòng thời gian check-in trực tiếp.
- **Thành phần UI cốt lõi:**
  - `AdminSidebar`
  - `AdminTopbar`
  - `KpiMetricsRow`
  - `VirtualVisitorChartCard`
  - `LiveCheckinFeed`
  - `QuickActionPanel`
- **Hướng dẫn thiết kế Desktop (1440x900):**
  - Tối ưu không gian ngang, phân cấp rõ ràng giữa thông tin quan trọng và thông tin phụ trợ.
  - Sử dụng hệ lưới 12 cột với gutter 24px, container tối đa 1440px.
- **Hướng dẫn thiết kế Mobile (390x844):**
  - Chuyển đổi các khối cột ngang thành một cột dọc duy nhất.
  - Các nút hành động chính (Primary Action) đặt tại vùng chạm ngón tay cái (thumb zone) ở nửa dưới màn hình.
  - Khoảng cách chạm tối thiểu cho các nút: 44px x 44px.

---

## [ADMN-002] Admin Quản lý sự kiện (Event Management & Check-in)
- **Tuyến đường (Route):** `/admin/events`
- **Phân hệ:** Admin CMS
- **Layout cha:** `admin/layout.tsx`
- **Hành vi Viewport:** `CONTENT_SCROLL`
- **Đối tượng người dùng:** Cán bộ điều phối, Quản trị viên (EVENT_OPERATOR, ADMIN)
- **API Backend kết nối:** `GET/POST/PATCH /api/v1/admin/events, POST /api/v1/open-day/check-in`
- **Mục tiêu nghiệp vụ:** Quản trị toàn diện sự kiện Open Day: danh sách sự kiện, trạng thái xuất bản, quản lý các phiên hội thảo, ngân hàng câu hỏi Quiz và quét mã QR check-in.
- **Thành phần UI cốt lõi:**
  - `AdminSidebar`
  - `AdminTopbar`
  - `EventListTable`
  - `SessionManagerModal`
  - `QuizManagerDrawer`
  - `QrScannerModal`
  - `EventCreateButton`
- **Hướng dẫn thiết kế Desktop (1440x900):**
  - Tối ưu không gian ngang, phân cấp rõ ràng giữa thông tin quan trọng và thông tin phụ trợ.
  - Sử dụng hệ lưới 12 cột với gutter 24px, container tối đa 1440px.
- **Hướng dẫn thiết kế Mobile (390x844):**
  - Chuyển đổi các khối cột ngang thành một cột dọc duy nhất.
  - Các nút hành động chính (Primary Action) đặt tại vùng chạm ngón tay cái (thumb zone) ở nửa dưới màn hình.
  - Khoảng cách chạm tối thiểu cho các nút: 44px x 44px.

---

## [ADMN-003] Admin Quản lý địa điểm (Location & Campus Management)
- **Tuyến đường (Route):** `/admin/locations`
- **Phân hệ:** Admin CMS
- **Layout cha:** `admin/layout.tsx`
- **Hành vi Viewport:** `CONTENT_SCROLL`
- **Đối tượng người dùng:** Quản trị viên, Quản trị tối cao (ADMIN, SUPER_ADMIN)
- **API Backend kết nối:** `GET/POST/PATCH /api/v1/admin/locations`
- **Mục tiêu nghiệp vụ:** Quản trị dữ liệu không gian trường học: tòa nhà, tầng, phòng lab, hội trường; form thêm mới/chỉnh sửa dạng Drawer hỗ trợ tự động tạo slug tiếng Việt.
- **Thành phần UI cốt lõi:**
  - `AdminSidebar`
  - `AdminTopbar`
  - `LocationDataTable`
  - `LocationFilterTabs`
  - `LocationFormDrawer`
  - `SlugAutoGeneratorInput`
- **Hướng dẫn thiết kế Desktop (1440x900):**
  - Tối ưu không gian ngang, phân cấp rõ ràng giữa thông tin quan trọng và thông tin phụ trợ.
  - Sử dụng hệ lưới 12 cột với gutter 24px, container tối đa 1440px.
- **Hướng dẫn thiết kế Mobile (390x844):**
  - Chuyển đổi các khối cột ngang thành một cột dọc duy nhất.
  - Các nút hành động chính (Primary Action) đặt tại vùng chạm ngón tay cái (thumb zone) ở nửa dưới màn hình.
  - Khoảng cách chạm tối thiểu cho các nút: 44px x 44px.

---

## [ADMN-004] Admin Kho Media & Ảnh 360° (Media Asset Library)
- **Tuyến đường (Route):** `/admin/media`
- **Phân hệ:** Admin CMS
- **Layout cha:** `admin/layout.tsx`
- **Hành vi Viewport:** `CONTENT_SCROLL`
- **Đối tượng người dùng:** Quản trị viên, Quản trị tối cao (ADMIN, SUPER_ADMIN)
- **API Backend kết nối:** `GET /api/v1/admin/media, POST /api/v1/media/upload/presign`
- **Mục tiêu nghiệp vụ:** Thư viện quản lý tài sản số tập trung: danh sách ảnh panorama 360, ảnh 2D, mô hình 3D; khu vực kéo thả upload kiểm tra magic bytes an toàn.
- **Thành phần UI cốt lõi:**
  - `AdminSidebar`
  - `AdminTopbar`
  - `MediaGridCardView`
  - `DragDropUploadZone`
  - `MediaTypeFilterTabs`
  - `PanoramaPreviewModal`
  - `StorageUsageWidget`
- **Hướng dẫn thiết kế Desktop (1440x900):**
  - Tối ưu không gian ngang, phân cấp rõ ràng giữa thông tin quan trọng và thông tin phụ trợ.
  - Sử dụng hệ lưới 12 cột với gutter 24px, container tối đa 1440px.
- **Hướng dẫn thiết kế Mobile (390x844):**
  - Chuyển đổi các khối cột ngang thành một cột dọc duy nhất.
  - Các nút hành động chính (Primary Action) đặt tại vùng chạm ngón tay cái (thumb zone) ở nửa dưới màn hình.
  - Khoảng cách chạm tối thiểu cho các nút: 44px x 44px.

---

## [ADMN-005] Admin Quản trị người dùng & RBAC (User Management & RBAC)
- **Tuyến đường (Route):** `/admin/users`
- **Phân hệ:** Admin CMS
- **Layout cha:** `admin/layout.tsx`
- **Hành vi Viewport:** `CONTENT_SCROLL`
- **Đối tượng người dùng:** Quản trị tối cao (SUPER_ADMIN)
- **API Backend kết nối:** `GET/POST /api/v1/admin/users, GET /api/v1/admin/roles`
- **Mục tiêu nghiệp vụ:** Quản lý danh sách tài khoản toàn hệ thống, phân quyền vai trò (RBAC), tạo tài khoản cá nhân, khóa/mở tài khoản và xem ma trận quyền hạn.
- **Thành phần UI cốt lõi:**
  - `AdminSidebar`
  - `AdminTopbar`
  - `UserDataTable`
  - `RoleBadgeFilter`
  - `CreateUserModal`
  - `AssignRoleDrawer`
  - `AccountStatusToggle`
- **Hướng dẫn thiết kế Desktop (1440x900):**
  - Tối ưu không gian ngang, phân cấp rõ ràng giữa thông tin quan trọng và thông tin phụ trợ.
  - Sử dụng hệ lưới 12 cột với gutter 24px, container tối đa 1440px.
- **Hướng dẫn thiết kế Mobile (390x844):**
  - Chuyển đổi các khối cột ngang thành một cột dọc duy nhất.
  - Các nút hành động chính (Primary Action) đặt tại vùng chạm ngón tay cái (thumb zone) ở nửa dưới màn hình.
  - Khoảng cách chạm tối thiểu cho các nút: 44px x 44px.

---

## [ADMN-006] Admin Studio biên tập Tour 360° (Tour 360° Studio Editor)
- **Tuyến đường (Route):** `/admin/virtual-tour` *(Tương thích: `/admin/tours-360`)*
- **Phân hệ:** Admin CMS
- **Layout cha:** `admin/layout.tsx`
- **Hành vi Viewport:** `FULL_VIEWPORT`
- **Đối tượng người dùng:** Quản trị viên, Quản trị tối cao (ADMIN, SUPER_ADMIN)
- **API Backend kết nối:** `GET/POST /api/v1/admin/tour, POST /api/v1/admin/tour/hotspots`
- **Mục tiêu nghiệp vụ:** Không gian studio 3 cột chuyên nghiệp: Cột 1 cây danh sách cảnh 360; Cột 2 khung biên tập panorama trực tiếp; Cột 3 bảng chỉnh sửa thuộc tính Hotspot.
- **Thành phần UI cốt lõi:**
  - `AdminSidebar`
  - `AdminTopbar`
  - `SceneTreeSidebar`
  - `HotspotEditorCanvas`
  - `HotspotInspectorPanel`
  - `SaveDraftTourButton`
  - `PreviewTourModal`
- **Hướng dẫn thiết kế Desktop (1440x900):**
  - Tối ưu không gian ngang, phân cấp rõ ràng giữa thông tin quan trọng và thông tin phụ trợ.
  - Sử dụng hệ lưới 12 cột với gutter 24px, container tối đa 1440px.
- **Hướng dẫn thiết kế Mobile (390x844):**
  - Chuyển đổi các khối cột ngang thành một cột dọc duy nhất.
  - Các nút hành động chính (Primary Action) đặt tại vùng chạm ngón tay cái (thumb zone) ở nửa dưới màn hình.
  - Khoảng cách chạm tối thiểu cho các nút: 44px x 44px.

---
