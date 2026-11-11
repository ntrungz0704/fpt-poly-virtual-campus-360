# FPT Polytechnic — Virtual Campus 360°

Hệ sinh thái số Virtual Campus 360° dành cho Trường Cao đẳng FPT Polytechnic, kết hợp tham quan không gian thực tế ảo 360°, mô phỏng 3D Digital Twin khuôn viên, cổng sự kiện Open Day tương tác và hệ thống quản trị nội dung CMS.

---

## 🏛️ Cấu trúc Monorepo

- `apps/web`: Ứng dụng Frontend Next.js 15 (App Router, React, TypeScript, Tailwind CSS, Three.js, Marzipano).
- `apps/api`: Backend NestJS REST API (Authentication, RBAC, Campus Data, Media Storage, Gamification) *(Triển khai ở Giai đoạn sau)*.
- `packages/shared`: Kiểu dữ liệu TypeScript và DTOs dùng chung giữa Web và API.
- `docs/`: Toàn bộ tài liệu quy chuẩn kỹ thuật:
  - [`docs/design-audit.md`](docs/design-audit.md): Báo cáo kiểm kê thiết kế Stitch chi tiết.
  - [`docs/page-mapping.md`](docs/page-mapping.md): Bản đồ phân tuyến 12 nhóm màn hình Next.js.
  - [`docs/design-system.md`](docs/design-system.md): Quy chuẩn Design Tokens (Màu sắc, Typography, Spacing).
  - [`docs/component-architecture.md`](docs/component-architecture.md): Cấu trúc Component và Quản lý trạng thái.
  - [`docs/migration-report.md`](docs/migration-report.md): Lộ trình chuyển đổi kỹ thuật.
- `desktop/`: Thư mục chứa mã nguồn gốc Google Stitch bản Desktop (Read-only reference).
- `mobile/`: Thư mục chứa mã nguồn gốc Google Stitch bản Mobile (Read-only reference).

---

## 🎨 Nhận diện Thương hiệu FPT Polytechnic

- **Primary Color**: Cam FPT (`#a04100` / `#f36f21`)
- **Secondary Color**: Deep Navy (`#041b3c` / `#102a43`)
- **Background**: Ice Surface (`#f9f9ff`)
- **Typography**: Plus Jakarta Sans (Headings/Labels) & Inter (Body)
- **Icons**: Google Material Symbols Outlined

---

## 🚀 Khởi chạy Frontend (Giai đoạn 1)

```bash
cd apps/web
npm run dev
```

Truy cập ứng dụng tại: `http://localhost:3000`
