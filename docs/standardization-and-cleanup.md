# Báo Cáo Chuẩn Hóa Màn Hình & Tối Ưu Cấu Trúc Dự Án (Clean Architecture)

**Dự án**: FPT Polytechnic Virtual Campus 360°  
**Trạng thái**: Hoàn thành Chuẩn hóa 100% (Screens Standardized & Folders Cleaned)  
**Tiêu chuẩn chất lượng**: 0 Lỗi Lint, 0 Lỗi Build (16/16 Routes Prerendered & Dynamic)

---

## 1. Dọn Dẹp Workspace & Xóa Bỏ Thư Mục Rác (Folder Cleanup)
- **Đã xóa bỏ hoàn toàn**: 
  - `desktop/stitch_fpt_polytechnic_virtual_campus/` (200+ MB file HTML/JS/CSS thô chưa chuẩn hóa).
  - `mobile/stitch_fpt_polytechnic_virtual_campus/` (Các màn hình mobile thô riêng lẻ).
  - `apps/web/src/components/campus-3d/` (Thư mục cũ gộp, đã chuyển đổi sang `components/map`).
- **Lưu trữ bảo toàn tài sản thiết kế**:
  - `docs/ORIGINAL_DESIGN_SPEC.md`: Bản đặc tả hệ màu, typography và spacing gốc từ Google Stitch.
  - `docs/stitch-references/`: Kho ảnh chụp giao diện mẫu để đối chiếu visual regression testing.
- **Thư mục gốc Monorepo hiện tại (Chuẩn công nghiệp)**:
  ```text
  E:\Virtual Campus FPT Poly\
  ├── apps/
  │   └── web/                   # Next.js 16 (App Router) + Tailwind v4 + Three.js
  ├── packages/
  │   └── shared/                # DTO, Enums, Type Contracts dùng chung
  ├── docs/                      # Tài liệu kiến trúc, audit, design system & token
  ├── docker-compose.yml         # Container PostgreSQL 16 Alpine
  ├── pnpm-workspace.yaml        # Monorepo configuration
  ├── .env.example               # Mẫu cấu hình môi trường
  └── README.md                  # Hướng dẫn chạy & vận hành
  ```

---

## 2. Chuẩn Hóa Semantic Màn Hình & Phân Tách Component (Screen Modularization)

Mỗi màn hình được tái cấu trúc thành các module độc lập, chuẩn Single Responsibility Principle (SRP) với tên gọi tiếng Anh ngữ nghĩa chuẩn xác, toàn bộ UI hiển thị tiếng Việt tự nhiên:

| Phân hệ (Domain) | Thư mục Component | Các Component Ngữ Nghĩa Được Tách Ra | Màn hình Sử Dụng |
| :--- | :--- | :--- | :--- |
| **Trang Chủ** | `components/home/` | `Hero360Viewer.tsx`<br>`CampusMetricsBar.tsx`<br>`FeaturedFacilities.tsx`<br>`OpenDayBanner.tsx`<br>`VirtualTourShowcase.tsx`<br>`QuickAdmissionForm.tsx` | `/` (`(public)/page.tsx`) |
| **Tour 360°** | `components/tour/` | `VirtualTourViewer.tsx`<br>`TourCompassHUD.tsx`<br>`TourHotspotMarker.tsx`<br>`TourSceneSelector.tsx`<br>`TourInfoDrawer.tsx` | `/campus` (`(immersive)/campus/page.tsx`) |
| **Bản Đồ 3D WebGL**| `components/map/` | `Campus3DViewer.tsx`<br>`BuildingDetailDrawer.tsx` | `/map` (`(immersive)/map/page.tsx`) |
| **Địa Điểm & Lab** | `components/locations/`| `LocationCard.tsx`<br>`LocationFilterBar.tsx` | `/locations`<br>`/locations/[slug]` |
| **Sự Kiện Open Day** | `components/events/` | `OpenDayScheduleTimeline.tsx`<br>`EventPillarGrid.tsx`<br>`TicketRegistrationModal.tsx` | `/events` |
| **Tin Tức & Báo Chí**| `components/news/` | `FeaturedArticleCard.tsx`<br>`NewsArticleGrid.tsx` | `/news`<br>`/news/[slug]` |
| **Cổng Phụ Huynh/SV**| `components/portal/` | `StudentProfileHeader.tsx`<br>`DigitalPassCard.tsx`<br>`PersonalItineraryTimeline.tsx` | `/portal` |
| **Minigame Quiz** | `components/quiz/` | `CampusQuizStepper.tsx`<br>`QuizLeaderboard.tsx` | `/games` |
| **Quản Trị CMS** | `components/admin/` | `AdminDashboardMetrics.tsx`<br>`AdminRecentActivityLog.tsx` | `/admin` |
| **Điều Hướng Chung**| `components/navigation/`| `PublicHeader.tsx` (có Mobile Menu Drawer)<br>`PublicFooter.tsx`<br>`CampusSelectorModal.tsx` | Tất cả layout |

---

## 3. Chuẩn Hóa Tài Nguyên Tĩnh (Public Assets)
- Khởi tạo thư mục `apps/web/public/`:
  - `favicon.svg`: Icon nhận diện thương hiệu FPT Polytechnic (Cam `#a04100` / `#f36f21`).
  - `manifest.json`: Web App Manifest phục vụ PWA.
  - `robots.txt`: Cấu hình SEO và chặn indexing khu vực nội bộ (`/admin`, `/portal`).
  - `images/`, `models/`: Cấu trúc thư mục chờ tải tài nguyên 3D (.glb) và ảnh toàn cảnh 360°.

---

## 4. Kết Quả Kiểm Nghiệm (Verification)
1. **Kiểm tra TypeScript (`packages/shared`)**:
   - `npm run build` -> Đạt 100%, xuất đầy đủ file type definitions `.d.ts`.
2. **Kiểm tra Lint (`apps/web`)**:
   - `npm run lint` -> **0 errors, 0 warnings**.
3. **Kiểm tra Build Production (`apps/web`)**:
   - `npm run build` -> Biên dịch thành công 16 route:
     - 14 Static prerendered routes: `/`, `/about`, `/admin`, `/campus`, `/contact`, `/events`, `/games`, `/locations`, `/login`, `/map`, `/news`, `/portal`, `/_not-found`.
     - 2 Dynamic Partial Prerendered routes: `/locations/[slug]`, `/news/[slug]`.

---

## 5. Sẵn Sàng Kế Tiếp (Phase 2 Roadmap)
- [ ] Khởi tạo backend `apps/api` với NestJS framework.
- [ ] Thiết kế cơ sở dữ liệu PostgreSQL 16 qua Prisma ORM:
  - Users & Phân quyền RBAC (SuperAdmin, Admin, Editor, Teacher, Student, Parent, Guest).
  - Campuses, Buildings, Floors, Locations, LocationCategories.
  - Virtual Tour (Tours, Scenes, Panoramas, Hotspots, Navigations).
  - Open Day Events & Ticket Registrations.
  - Gamification (Quiz, Questions, Attempts, XP Points, Leaderboard).
  - CMS Media Assets & Activity Audit Logs.
- [ ] Cấu hình REST API endpoints & Swagger OpenApi Docs.
