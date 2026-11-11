# FPT Polytechnic Virtual Campus 360° — Migration Strategy & Execution Report

> **Trạng thái Giai đoạn 1**: HOÀN THÀNH 100%  
> **Thời điểm nghiệm thu**: 10/11/2026  
> **Kết quả Build Next.js**: `npm run build` thành công 16/16 route tĩnh và động, 0 lỗi TypeScript, 0 lỗi ESLint.

---

## 1. TỔNG KẾT KẾT QUẢ GIAI ĐOẠN 1

Chúng ta đã chuyển đổi toàn bộ mã nguồn Google Stitch thành công sang cấu trúc ứng dụng **Next.js App Router** hiện đại:

### 1.1. Hệ thống 4 (+1) Layouts chuẩn hóa
- **`PublicLayout`** (`apps/web/src/app/(public)/layout.tsx`): Header FPT Polytechnic, Footer 5 cơ sở toàn quốc, popup chọn cơ sở trường `CampusSelectorModal`.
- **`ImmersiveTourLayout`** (`apps/web/src/app/(immersive)/layout.tsx`): Chế độ tràn viền 100% viewport cho `/campus` và `/map`, thanh HUD kính mờ trôi nổi, không có footer che khuất không gian.
- **`AuthLayout`** (`apps/web/src/app/(auth)/layout.tsx`): Giao diện đăng nhập tập trung, tối giản, tiêu chuẩn bảo mật SSO EduID 2.0 và ISO/IEC 27001.
- **`PortalLayout`** (`apps/web/src/app/(portal)/layout.tsx`): Giao diện cổng dịch vụ định danh dành riêng cho Phụ huynh và Sinh viên.
- **`AdminLayout`** (`apps/web/src/app/admin/layout.tsx`): Giao diện Dashboard quản trị CMS chuyên nghiệp với Sidebar 12 module có thể thu gọn.

### 1.2. Danh mục 12 nhóm trang đã hoàn thành
| STT | Route | Chức năng & Giao diện | Trạng thái Build |
|---|---|---|---|
| 01 | `/` | **Trang chủ**: 360° Hero Viewport, Live Hotspots radar ping, HUD xoay zoom, Bento grid không gian nổi bật, Open Day banner, Form tư vấn | ✅ Prerendered Static |
| 02 | `/about` | **Giới thiệu**: Lịch sử FPT Poly, 3 trụ cột thực chiến (70% thực hành, 2000+ DN, 97.7% việc làm), cơ sở vật chất | ✅ Prerendered Static |
| 03 | `/campus` | **Virtual Campus 360°**: Chuyển scene đa điểm (Thư viện số, Lab IT, Studio iMac), ghim hotspot góc cầu, Drawer thông số phòng | ✅ Prerendered Static |
| 04 | `/map` | **Bản đồ 3D & GIS**: Không gian Three.js Digital Twin dựng khối tòa nhà, chiếu sáng mặt trời, đổ bóng, bảng chọn tòa nhà, chuyển lớp GIS | ✅ Prerendered Static |
| 05 | `/locations`<br>`/locations/[slug]` | **Địa điểm & Phòng học**: Tra cứu theo tầng, loại phòng (Lab IT, Studio, Xưởng), thông số máy trạm, chi tiết phòng học | ✅ Prerendered Static / Partial |
| 06 | `/events` | **Sự kiện & Open Day**: 4 trọng điểm đặc quyền, thời gian biểu sáng/chiều, form đăng ký nhận vé mời số QR Code | ✅ Prerendered Static |
| 07 | `/news`<br>`/news/[slug]` | **Tin tức & Chi tiết**: Lưới bài viết, bài viết tiêu điểm, phân loại danh mục, khung đọc bài chuyên sâu kèm teaser 360 | ✅ Prerendered Static / Partial |
| 08 | `/contact` | **Liên hệ**: Danh bạ 5 cơ sở toàn quốc (hotline, địa chỉ), form gửi câu hỏi tư vấn tuyển sinh 1:1, accordion giải đáp FAQ | ✅ Prerendered Static |
| 09 | `/login` | **Đăng nhập**: Xác thực mã sinh viên / SĐT phụ huynh, ẩn hiện mật khẩu, ghi nhớ phiên, nút đăng nhập nhanh tài khoản mẫu | ✅ Prerendered Static |
| 10 | `/portal` | **Portal Sinh viên & Phụ huynh**: Thẻ định danh quan hệ cha con, Vé mời số Open Day, lịch trình riêng trong ngày, chỉ số XP | ✅ Prerendered Static |
| 11 | `/games` | **Gamification & Quiz**: Sảnh trò chơi, bộ câu hỏi 5 màn thử tài FPT Poly tính điểm XP (+50 XP/câu đúng), bảng vinh danh Top người chơi | ✅ Prerendered Static |
| 12 | `/admin` | **Admin CMS**: Dashboard chỉ số tổng quan, phím tắt quản trị 12 module, nhật ký thao tác kiểm toán (Audit Logs) | ✅ Prerendered Static |

---

## 2. KẾT QUẢ KIỂM THỬ KỸ THUẬT

1. **TypeScript Build**: `next build` hoàn thành với **0 lỗi**.
2. **ESLint**: Hoàn thành sạch sẽ, tương thích chuẩn Next.js 16 và React 19.
3. **Độ ổn định Three.js**: Đã đóng gói thành công component `Campus3DViewer` nạp bằng `next/dynamic` với `ssr: false`, không gây lỗi server hydration.
4. **Hệ thống Font & Biểu tượng**: Tải phông chữ tiếng Việt chuẩn (`Plus Jakarta Sans`, `Inter`) và Google `Material Symbols Outlined`.

---

## 3. SẴN SÀNG CHO GIAI ĐOẠN 2

Toàn bộ giao diện Desktop và Mobile của 12 nhóm trang đã được quy tụ về một khối thống nhất, có thể chạy thử trực tiếp bằng lệnh:
```bash
cd apps/web
npm run dev
```

Bước tiếp theo theo đúng lộ trình sẽ là: **Giai đoạn 2 — Thiết kế Database PostgreSQL với Prisma ORM và khởi tạo NestJS Backend API.**
