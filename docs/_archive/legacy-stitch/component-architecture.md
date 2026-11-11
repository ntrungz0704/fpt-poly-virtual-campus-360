# FPT Polytechnic Virtual Campus 360° — Component Architecture

> **Mô hình kiến trúc**: Modular Component-Driven Design  
> **Nguyên tắc**: Single Responsibility, Không thao tác DOM bẩn, Khử trùng lặp giữa Desktop và Mobile bằng Responsive Tailwind Utilities.

---

## 1. CẤU TRÚC THƯ MỤC COMPONENT (NEXT.JS APP ROUTER)

```
apps/web/src/
├── app/
│   ├── (public)/
│   │   ├── layout.tsx              # PublicLayout (Header + Footer dùng chung)
│   │   ├── page.tsx                # Trang chủ (/)
│   │   ├── about/page.tsx          # Giới thiệu (/about)
│   │   ├── locations/
│   │   │   ├── page.tsx            # Danh sách địa điểm (/locations)
│   │   │   └── [slug]/page.tsx     # Chi tiết địa điểm (/locations/[slug])
│   │   ├── events/page.tsx         # Sự kiện Open Day (/events)
│   │   ├── news/
│   │   │   ├── page.tsx            # Tin tức (/news)
│   │   │   └── [slug]/page.tsx     # Chi tiết tin tức (/news/[slug])
│   │   ├── contact/page.tsx        # Liên hệ (/contact)
│   │   └── games/page.tsx          # Gamification & Quiz (/games)
│   ├── (immersive)/
│   │   ├── layout.tsx              # ImmersiveTourLayout (Full-bleed, không Footer)
│   │   ├── campus/page.tsx         # Virtual Campus 360° (/campus)
│   │   └── map/page.tsx            # Bản đồ 3D Digital Twin & GIS (/map)
│   ├── (auth)/
│   │   ├── layout.tsx              # AuthLayout (Gọn gàng, tập trung bảo mật)
│   │   └── login/page.tsx          # Đăng nhập (/login)
│   ├── (portal)/
│   │   ├── layout.tsx              # PortalLayout (Có Topbar cá nhân & Auth Guard)
│   │   └── portal/page.tsx         # Dashboard Sinh viên & Phụ huynh (/portal)
│   └── admin/
│       ├── layout.tsx              # AdminLayout (Sidebar 12 modules quản trị)
│       └── page.tsx                # Admin Dashboard (/admin)
├── components/
│   ├── navigation/
│   │   ├── PublicHeader.tsx        # Header thống nhất cho các trang công khai
│   │   ├── PublicFooter.tsx        # Footer 5 cơ sở FPT Polytechnic
│   │   ├── MobileDrawer.tsx        # Menu vuốt trên điện thoại
│   │   └── CampusSelectorModal.tsx # Popup chọn cơ sở (Hà Nội, Đà Nẵng, TP.HCM...)
│   ├── ui/
│   │   ├── Button.tsx              # Nút bấm (Primary cam, Secondary navy, Glass HUD)
│   │   ├── Badge.tsx               # Nhãn trạng thái (Live, Sắp diễn ra, Hotspot)
│   │   ├── Modal.tsx               # Hộp thoại popup đa năng
│   │   ├── Card.tsx                # Thẻ bọc nội dung có đổ bóng chuẩn
│   │   └── Input.tsx               # Ô nhập dữ liệu có focus ring cam FPT
│   └── shared/
│       ├── SectionHeading.tsx      # Tiêu đề mục chuẩn hóa
│       ├── StatCounter.tsx         # Khối hiển thị số liệu nổi bật
│       └── Breadcrumb.tsx          # Đường dẫn phân cấp trang
├── features/
│   ├── home/
│   │   ├── Hero360Preview.tsx      # Khung nhìn tương tác trang chủ
│   │   ├── FeaturedSpaces.tsx      # Lưới không gian tiêu biểu
│   │   └── QuickRegister.tsx       # Form xét tuyển & tham quan nhanh
│   ├── campus-360/
│   │   ├── PanoramaViewer.tsx      # Trình xem 360 Marzipano/Pannellum wrapper
│   │   ├── HotspotNode.tsx         # Điểm ghim tọa độ cầu (yaw, pitch)
│   │   └── SceneNavigation.tsx     # Thanh trượt chuyển đổi phòng/scene
│   ├── campus-3d/
│   │   ├── DigitalTwinCanvas.tsx   # React Three Fiber Canvas
│   │   ├── CampusModel.tsx         # Khối kiến trúc các tòa nhà & quảng trường
│   │   └── BuildingInfoCard.tsx    # Bảng chi tiết tòa nhà được click chọn
│   ├── events/
│   │   ├── EventTimeline.tsx       # Lịch trình diễn ra Open Day
│   │   └── RegisterModal.tsx       # Popup đăng ký tham dự
│   ├── portal/
│   │   ├── DigitalPass.tsx         # Vé mời số cá nhân hóa có QR Code
│   │   └── ScheduleList.tsx        # Lịch trình tham gia riêng của phụ huynh/SV
│   ├── gamification/
│   │   ├── QuizCard.tsx            # Câu hỏi trắc nghiệm tìm hiểu trường
│   │   └── LeaderboardTable.tsx    # Bảng xếp hạng điểm thưởng XP
│   └── admin/
│       ├── AdminSidebar.tsx        # Danh mục 12 module quản trị
│       └── HotspotEditor.tsx       # Công cụ định vị hotspot trên ảnh 360
└── lib/
    ├── api-client.ts               # Kết nối REST API NestJS
    └── utils.ts                    # Tiện ích cn, format tiền tệ, ngày tháng
```

---

## 2. NGUYÊN TẮC QUẢN LÝ TRẠNG THÁI (STATE MANAGEMENT)

1. **Server State**: Sử dụng `@tanstack/react-query` để lấy dữ liệu từ Backend NestJS (danh sách địa điểm, sự kiện, bài viết, thông tin người dùng).
2. **Client State chia sẻ**: Sử dụng `zustand` chỉ cho các trạng thái toàn cục thực sự:
   - `useCampusStore`: Cơ sở hiện tại được chọn (Hà Nội, TP.HCM, Đà Nẵng...), Scene 360° đang xem.
   - `useAuthStore`: Trạng thái phiên đăng nhập (JWT token, vai trò người dùng, thông tin hồ sơ).
   - `useTourStore`: Trạng thái âm thanh thuyết minh, chế độ toàn màn hình, bật/tắt la bàn.
3. **Form State**: Dùng `react-hook-form` + `zod` để kiểm tra tính hợp lệ của dữ liệu ngay tại client trước khi gửi lên API.
