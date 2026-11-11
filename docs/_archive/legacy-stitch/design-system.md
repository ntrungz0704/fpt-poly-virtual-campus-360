# FPT Polytechnic Virtual Campus 360° — Design System Specification

> **Nguồn trích xuất**: `desktop/virtual_campus_360/DESIGN.md` và `mobile/virtual_campus_360/DESIGN.md`  
> **Ngôn ngữ chuẩn**: Tiếng Việt (Giao diện) / Tiếng Anh (Mã nguồn & Tokens)  
> **Nền tảng**: Tailwind CSS 3.x / Tailwind CSS v4 tương thích Next.js 15

---

## 1. HỆ THỐNG MÀU SẮC (COLOR SYSTEM)

### 1.1. Bảng màu thương hiệu (Brand Palette)
- **Primary (Cam FPT)**: `#a04100` (Tone đậm) · Container: `#f36f21` (Cam nhận diện FPT nổi bật) · Fixed: `#ffdbcc` · On-Primary: `#ffffff`
- **Secondary (Navy Đậm)**: `#102a43` / `#041b3c` (Tone nền & điều hướng uy tín) · Container: `#c7dfff` · Text: `#49607c`
- **Tertiary (Xanh Công nghệ)**: `#005db7` / `#0084ff` (Điểm nhấn thông tin, la bàn, trạng thái) · Container: `#4c96ff`
- **Surface / Background**:
  - `surface`: `#f9f9ff` (Nền sáng hiện đại, không lóa mắt)
  - `surface-container-lowest`: `#ffffff` (Thẻ card trắng tinh khiết)
  - `surface-container-low`: `#f1f3ff` (Khối phụ trợ)
  - `surface-container`: `#e8edff` (Đường phân cách mềm)
  - `surface-container-high`: `#e0e8ff` (Hover state)
  - `surface-container-highest`: `#d7e2ff`
- **Inverse Surface**: `#1d3052` / `#0f172a` (Dùng cho nền Viewer 360° & không gian 3D Digital Twin)
- **Status Colors**:
  - `success`: `#10b981` (Xanh lục trạng thái Mở cửa, Hoàn thành)
  - `error`: `#ba1a1a` · Error Container: `#ffdad6`
  - `warning`: `#f59e0b`

---

## 2. HỆ THỐNG KIỂU CHỮ (TYPOGRAPHY)

Sử dụng hai phông chữ chủ đạo tải từ Google Fonts:
1. **Plus Jakarta Sans**: Dành cho tất cả các Tiêu đề (`font-headline-*`), Nhãn (`font-label-*`), Nút bấm CTA và số liệu thống kê.
2. **Inter**: Dành cho Văn bản nội dung (`font-body-*`), mô tả chi tiết và bài viết tin tức.

### Phân cấp Typography
| Token | Font Family | Size | Line Height | Weight | Trường hợp áp dụng |
|---|---|---|---|---|---|
| `headline-xl` | Plus Jakarta Sans | 48px | 56px | 800 (Bold) | Tiêu đề Hero Desktop lớn nhất |
| `headline-xl-mobile` | Plus Jakarta Sans | 32px | 40px | 800 (Bold) | Tiêu đề Hero Mobile |
| `headline-lg` | Plus Jakarta Sans | 36px | 44px | 700 (Bold) | Tiêu đề Section chính |
| `headline-lg-mobile` | Plus Jakarta Sans | 26px | 34px | 700 (Bold) | Tiêu đề Section Mobile |
| `headline-md` | Plus Jakarta Sans | 24px | 32px | 600 (Semibold)| Tiêu đề Card, Modal, Panel |
| `headline-sm` | Plus Jakarta Sans | 20px | 28px | 600 (Semibold)| Tiêu đề Nhóm nhỏ, Hotspot Card |
| `body-lg` | Inter | 18px | 28px | 400 (Regular) | Đoạn văn bản dẫn đề (Lead text) |
| `body-md` | Inter | 15px | 24px | 400 (Regular) | Nội dung thông thường chuẩn |
| `body-sm` | Inter | 13px | 20px | 400 (Regular) | Chú thích, metadata, ngày tháng |
| `label-lg` | Plus Jakarta Sans | 14px | 20px | 600 (Semibold)| Nút bấm chính, Menu chính |
| `label-md` | Plus Jakarta Sans | 12px | 16px | 600 (Semibold)| Badge, Chip lọc, Tab |
| `label-sm` | Plus Jakarta Sans | 11px | 14px | 700 (Bold) | Tag danh mục viết hoa (Uppercase) |

---

## 3. KHOẢNG CÁCH & ĐƯỜNG BO GÓC (SPACING & RADIUS)

### Spacing Tokens
- `space-xs`: `0.25rem` (4px)
- `space-sm`: `0.5rem` (8px)
- `space-md`: `1rem` (16px)
- `space-lg`: `1.5rem` (24px)
- `space-xl`: `2.5rem` (40px)
- `gutter`: `1.5rem` (24px) — Rãnh lề lưới desktop
- `gutter-mobile`: `1rem` (16px) — Rãnh lề lưới mobile
- `margin`: `2.5rem` (40px) — Lề ngoài trang desktop
- `margin-mobile`: `1rem` (16px) — Lề ngoài trang mobile

### Border Radius
- `rounded-sm`: `0.25rem` (4px)
- `rounded-DEFAULT`: `0.5rem` (8px)
- `rounded-lg`: `1rem` (16px) — Thẻ Card, Panel nổi
- `rounded-xl`: `1.5rem` (24px) — Khung Hero, Modal lớn
- `rounded-full`: `9999px` — Nút viên thuốc (Pill CTA), Chip, Vòng Hotspot

---

## 4. HỆ THỐNG ĐỘ NỔI & ĐỔ BÓNG (ELEVATION & SHADOWS)

- **Level 1 (Card phẳng)**: `box-shadow: 0 1px 4px rgba(4, 27, 60, 0.04)`
- **Level 2 (HUD & Floating Controls)**: `backdrop-filter: blur(16px); background: rgba(255, 255, 255, 0.88); box-shadow: 0 12px 32px -4px rgba(16, 42, 69, 0.08);`
- **Level 3 (Modal, Dropdown, Hotspot Card)**: `box-shadow: 0 20px 48px -6px rgba(16, 42, 69, 0.16)`
- **Primary CTA Glow**: `box-shadow: 0 4px 14px rgba(243, 111, 33, 0.35)`

---

## 5. ĐIỀU KIỆN ĐÁP ỨNG THIẾT BỊ (RESPONSIVE BREAKPOINTS)

- **Mobile**: `< 768px` (Tối ưu đặc biệt cho 360px, 390px, 430px)
  - Thanh menu thu về Mobile Bottom Navigation Bar hoặc Hamburger Drawer.
  - Cụm điều khiển 360°/3D đưa xuống khu vực ngón tay cái thuận tiện thao tác một tay.
- **Tablet**: `768px - 1023px` (iPad, tablet Android)
- **Desktop Tiêu chuẩn**: `1024px - 1439px` (Laptop)
- **Desktop Mở rộng**: `1440px - 1920px` (Màn hình làm việc lớn)
