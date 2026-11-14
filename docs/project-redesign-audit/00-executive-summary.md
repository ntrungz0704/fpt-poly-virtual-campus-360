# 00 — BÁO CÁO TỔNG QUAN ĐIỀU HÀNH (EXECUTIVE SUMMARY)
## DỰ ÁN FPT POLYTECHNIC VIRTUAL CAMPUS 360° — PHỤC VỤ REDESIGN TOÀN DIỆN

> [!IMPORTANT]
> **THÔNG TIN ĐỐI SOÁT CHÍNH THỨC:**
> - **Dự án:** FPT Polytechnic Virtual Campus 360° (Cơ sở CVPM Quang Trung, Quận 12, TP.HCM).
> - **Repository:** `ntrungz0704/fpt-poly-virtual-campus-360`
> - **Branch hiện tại:** `fix/m4-acceptance-blockers`
> - **HEAD Commit SHA:** `935d27b` (feat(portal): enforce parent-student RBAC, fix gamification XP, and add M4 acceptance E2E suite)
> - **Thời điểm kiểm toán:** 2026-11-14.
> - **Trạng thái sẵn sàng cho Redesign:** **READY FOR REDESIGN WITH CONSTRAINTS** (Khung lõi kỹ thuật, bảo mật, dữ liệu và API đã ổn định 100%, sẵn sàng cho đợt nâng cấp giao diện toàn diện).

---

### 1. Mục Tiêu Đợt Khảo Sát & Kiểm Toán Redesign
Mục tiêu của đợt kiểm toán này không phải sửa đổi chắp vá vài component hay cải thiện các trang riêng lẻ, mà là **khảo sát toàn diện mọi ngóc ngách của hệ thống để chuẩn bị cho một cuộc đại tu UI/UX từ đầu**, với nguyên tắc cốt lõi:
1. **Tái thiết kế toàn bộ trải nghiệm người dùng:** Hiện đại, trực quan, đậm chất công nghệ và nhận diện giáo dục FPT Polytechnic.
2. **Bảo toàn 100% logic nghiệp vụ:** Giữ nguyên vẹn toàn bộ 32 Prisma Models, 19 Enums, 10 NestJS Backend Modules, cơ chế xác thực JWT in-memory + Cookie Refresh rotation, phân quyền RBAC và hệ thống API hiện có.
3. **Không phá vỡ chức năng:** Mọi nâng cấp giao diện phải khớp nối chính xác với contracts dữ liệu chuẩn hóa tại `packages/shared`.

---

### 2. Các Con Số Khảo Sát Thực Tế Cốt Lõi (Được Kiểm Chứng 100%)

| Tiêu chí | Số liệu thực tế | Ghi chú kiểm chứng |
|---|:---:|---|
| **Tổng số Unique Route Templates** | **27** | 25 trang chức năng chính + 2 trạng thái hệ thống (`loading.tsx`, `not-found.tsx`) |
| **Số Layout chính** | **6** | 1 Root layout + 5 Sub-layouts: Public, Auth, Immersive, Portal, Admin |
| **Số Route Static** | **23** | Render tĩnh / dynamic client component theo chuẩn Next.js App Router |
| **Số Route Dynamic Templates** | **2** | `/locations/[slug]` (Địa điểm) và `/news/[slug]` (Tin tức) |
| **Ảnh Screenshot thực tế đã chụp** | **50** | Đầy đủ 25 màn hình x 2 viewports (Desktop 1440x900 & Mobile 390x844) |
| **Số trang cần Redesign** | **25** | Toàn bộ 25 màn hình thuộc 6 phân hệ |
| **Số lượng Template thiết kế UI độc lập** | **18** | Đã gom các trang có chung cấu trúc để tối ưu việc sinh ảnh và code |
| **Prisma Models / Enums** | **32 / 19** | Lưu trữ toàn bộ dữ liệu Campus, 360 Tour, Open Day, Gamification, Users |
| **Backend Modules / Controllers** | **10 / 9** | Kiến trúc Modular Monolith NestJS chuẩn RESTful tại `/api/v1` |
| **Unit Tests Passed** | **41 / 41** | 10 test web (Node test runner) + 31 test backend (Jest) |
| **Turbopack Build Routes** | **29 / 29** | `next build` thành công 100% không cảnh báo lỗi |

---

### 3. Phân Hệ Người Dùng Thuộc Phạm Vi Redesign

1. **Public Website (9 trang):** Trang chủ (`/`), Giới thiệu (`/about`), Liên hệ (`/contact`), Sự kiện Open Day (`/events`), Minigame & Vòng quay (`/games`), Danh mục địa điểm (`/locations`), Chi tiết địa điểm (`/locations/[slug]`), Tin tức (`/news`), Chi tiết tin tức (`/news/[slug]`).
2. **Authentication (2 trang):** Đăng nhập (`/login`), Đổi mật khẩu bắt buộc (`/change-password`).
3. **Virtual Campus Immersive (2 trang):** Tour 360° tương tác (`/campus`), Bản đồ số GIS khuôn viên QTSC (`/map`).
4. **Student Portal (5 trang):** Tổng quan (`/portal`), Hồ sơ sinh viên (`/portal/profile`), Điểm thưởng XP & Gamification (`/portal/progress`), Lịch sự kiện (`/portal/schedule`), Vé Open Day (`/portal/tickets`).
5. **Parent Portal (1 trang):** Cổng phụ huynh theo dõi con em (`/parent`).
6. **Admin CMS (6 trang):** Dashboard (`/admin`), Sự kiện (`/admin/events`), Địa điểm (`/admin/locations`), Kho Media (`/admin/media`), Người dùng & RBAC (`/admin/users`), Kịch bản Tour & Hotspots (`/admin/virtual-tour`).

---

### 4. Kết Luận & Định Hướng
Codebase hiện tại đạt độ hoàn thiện cao về tầng logic và dữ liệu, không có nợ kỹ thuật nghiêm trọng ở backend. Toàn bộ các vấn đề nghẽn của giao diện hiện tại nằm ở sự phân mảnh về phong cách (inconsistent design tokens), thiếu phân cấp thị giác rõ nét giữa trang công cộng và trang quản trị, và một số lỗi overflow/scrollbar trên các trang trải nghiệm không gian toàn màn hình. 

Dự án **HOÀN TOÀN ĐỦ ĐIỀU KIỆN ĐỂ BƯỚC VÀO GIAI ĐOẠN REDESIGN**.
