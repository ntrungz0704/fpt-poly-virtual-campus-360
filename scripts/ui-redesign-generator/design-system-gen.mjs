export function getDesignSystemMd() {
  return `# FPT POLYTECHNIC VIRTUAL CAMPUS 360° — DESIGN SYSTEM SPECIFICATION

> [!IMPORTANT]
> **TÀI LIỆU QUY CHUẨN THIẾT KẾ ĐỒ HỌA & GIAO DIỆN (UI/UX)**
> - **Thương hiệu:** Trường Cao đẳng FPT Polytechnic TP.HCM — Cơ sở Công viên Phần mềm Quang Trung (QTSC).
> - **Phiên bản:** Design System v2.0 (Redesign Milestone).
> - **Mục tiêu:** Định hình một ngôn ngữ thiết kế nhất quán, hiện đại, đậm chất công nghệ giáo dục nhưng vẫn thân thiện, tối ưu trải nghiệm trên mọi kích thước màn hình.

---

## 1. Bản Sắc Thương Hiệu (Brand Identity)

### 1.1 Triết Lý Thiết Kế: Modern EdTech Meets Immersive Space
Hệ thống kết hợp ba yếu tố cốt lõi:
1. **Nhiệt Huyết & Thực Chiến (Poly Dynamic):** Sắc cam FPT rực rỡ truyền cảm hứng năng động, sáng tạo cho sinh viên và thí sinh.
2. **Chiều Sâu Công Nghệ (Deep Tech Space):** Tông màu Navy sâu thẳm, mặt kính mờ (Glassmorphism), hiệu ứng phát sáng nhẹ (ambient glow) tôn vinh trải nghiệm thực tế ảo 360° và bản đồ số GIS.
3. **Sạch Sẽ & Chuẩn Mực SaaS (Enterprise Clarity):** Bố cục thẻ rõ ràng, tỷ lệ khoảng trắng cân đối, typography dễ đọc, hỗ trợ thao tác nhanh cho cán bộ quản trị.

---

## 2. Hệ Thống 4 Phân Vùng Thị Giác (4-Tier Persona Systems)

Để tránh tình trạng "tất cả các trang đều giống hệt một template dashboard", hệ thống phân tách 4 phân vùng thị giác:

| Phân hệ | Đối tượng chính | Phong cách chủ đạo | Đặc trưng giao diện |
|---|---|---|---|
| **Public Website** | Thí sinh, Học sinh THPT, Khách tham quan | **Modern EdTech** | Khối Hero lớn, hình ảnh campus 3D nổi bật, thẻ bo góc lớn (\`rounded-2xl\`), nút CTA cam nổi bật. |
| **Authentication** | Mọi người dùng đăng nhập | **Split-Screen Minimal** | Cột trái ảnh campus công nghệ, cột phải form nhập liệu thanh lịch, bảo vệ mắt. |
| **Virtual Campus** | Người khám phá không gian ảo | **Immersive Dark Glassmorphism** | Toàn màn hình (\`h-screen overflow-hidden\`), thanh công cụ nổi (floating glass dock), HUD tối giản. |
| **Student / Parent Portal** | Sinh viên, Phụ huynh | **Clean Educational Dashboard** | Thẻ học tập thân thiện, thẻ vé dạng Boarding Pass có mã QR sắc nét, thanh tiến trình XP trực quan. |
| **Admin Console** | Cán bộ quản lý, Quản trị viên | **Enterprise SaaS** | Sidebar cố định tối màu (\`#0F172A\`), bảng dữ liệu dày đặc thông tin, lọc và tìm kiếm nhanh bằng phím. |

---

## 3. Quy Chuẩn Không Gian & Phân Loại Cuộn (Scroll & Viewport Rules)

- **\`FULL_VIEWPORT\`:** Tuyệt đối không để phát sinh thanh cuộn dọc ngoài ý muốn của tài liệu trình duyệt (\`body { overflow-y: hidden }\`). Áp dụng cho: \`/login\`, \`/change-password\`, \`/admin/virtual-tour\`.
- **\`IMMERSIVE_CANVAS\`:** Canvas 360°/Bản đồ chiếm 100% diện tích; các thanh công cụ, radar được neo tuyệt đối (\`fixed\` / \`absolute\`) trên bề mặt kính mờ. Áp dụng cho: \`/campus\`, \`/map\`.
- **\`CONTENT_SCROLL\`:** Cho phép cuộn dọc tự nhiên, giữ Header cố định (\`sticky top-0 z-40\`), bảng dữ liệu dài trên mobile bắt buộc có thanh cuộn ngang nội bộ (\`overflow-x-auto\`).`;
}

export function getTokensMd() {
  return `# DESIGN TOKENS — FPT POLYTECHNIC VIRTUAL CAMPUS 360°

## 1. Bảng Màu Chuẩn Hóa (Color Tokens)

### 1.1 Brand & Primary Colors
- **\`--color-primary\`:** \`#F26F21\` (Màu Cam FPT chính thống).
- **\`--color-primary-hover\`:** \`#D95A10\` (Trạng thái hover của nút bấm cam).
- **\`--color-primary-light\`:** \`#FFF4ED\` (Nền thẻ nhẹ, badge nổi bật).
- **\`--color-primary-subtle\`:** \`rgba(242, 111, 33, 0.12)\`.

### 1.2 Secondary & Tech Navy
- **\`--color-secondary\`:** \`#0D47A1\` (Xanh Navy công nghệ FPT).
- **\`--color-secondary-hover\`:** \`#0A3880\`.
- **\`--color-secondary-light\`:** \`#EFF6FF\`.

### 1.3 Neutral & Surface Colors
- **\`--color-bg-app\`:** \`#F8FAFC\` (Slate 50 — Nền ứng dụng chính, chống mỏi mắt).
- **\`--color-surface\`:** \`#FFFFFF\` (Trắng thuần cho các khối thẻ Card).
- **\`--color-surface-hover\`:** \`#F1F5F9\` (Slate 100).
- **\`--color-border\`:** \`#E2E8F0\` (Slate 200 — Đường kẻ viền phân cách).
- **\`--color-dark-sidebar\`:** \`#0F172A\` (Slate 900 — Sidebar Admin & Dock công cụ 360).

### 1.4 Typography & Text Colors
- **\`--color-text-primary\`:** \`#0F172A\` (Chữ tiêu đề, văn bản chính độ tương phản cao).
- **\`--color-text-secondary\`:** \`#475569\` (Chữ mô tả phụ, nhãn thông tin).
- **\`--color-text-muted\`:** \`#94A3B8\` (Placeholder, ghi chú nhỏ).

### 1.5 Semantic State Colors
- **Success:** \`#10B981\` (Thành công, đã duyệt, đã check-in).
- **Warning:** \`#F59E0B\` (Chờ xử lý, lưu ý, điểm XP).
- **Danger:** \`#EF4444\` (Lỗi, hủy vé, khóa tài khoản).
- **Info:** \`#3B82F6\` (Thông báo điều hướng).

---

## 2. Thang Đo Khoảng Cách & Bán Kính Góc (Spacing & Radius)

### 2.1 Bán Kính Bo Góc (Border Radius)
- \`rounded-sm\`: 4px (Tag nhỏ).
- \`rounded-md\`: 8px (Nút nhỏ, badge, checkbox).
- \`rounded-xl\`: 12px (Input, nút bấm tiêu chuẩn, dropdown menu).
- \`rounded-2xl\`: 16px - 20px (Card nội dung, modal, widget thống kê).
- \`rounded-3xl\`: 24px (Khối Hero, container chính).
- \`rounded-full\`: 9999px (Avatar, pill badge, nút tròn icon).

### 2.2 Bóng Đổ (Elevation & Shadows)
- \`shadow-xs\`: \`0 1px 2px 0 rgba(0, 0, 0, 0.05)\` (Thẻ phẳng tinh tế).
- \`shadow-md\`: \`0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04)\` (Card tiêu chuẩn).
- \`shadow-xl\`: \`0 20px 25px -5px rgba(0, 0, 0, 0.1)\` (Modal, Drawer, Floating Dock).

---

## 3. Thang Đo Typography (Type Scale)

- **Display 1 (Hero Title):** 40px - 48px | Bold 800 | Leading 1.15.
- **Heading 1 (Page Title):** 28px - 32px | Bold 700 | Leading 1.2.
- **Heading 2 (Section Title):** 22px - 24px | SemiBold 600 | Leading 1.3.
- **Heading 3 (Card Title):** 18px - 20px | SemiBold 600 | Leading 1.4.
- **Body Large:** 16px | Regular 400 / Medium 500 | Leading 1.5.
- **Body Regular:** 14px | Regular 400 | Leading 1.5.
- **Caption / Small:** 12px | Medium 500 | Leading 1.4.`;
}

export function getComponentCatalogMd() {
  return `# COMPONENT CATALOG — FPT POLYTECHNIC VIRTUAL CAMPUS 360°

Danh mục 24 component tái sử dụng chuẩn hóa:

| STT | Tên Component | Thư mục mã nguồn | Mục đích sử dụng | Biến thể (Variants) |
|:---:|---|---|---|---|
| 1 | **\`PublicHeader\`** | \`components/layout/public-header.tsx\` | Header chính trang công cộng | Transparent, Solid Sticky, Mobile Drawer |
| 2 | **\`PublicFooter\`** | \`components/layout/public-footer.tsx\` | Chân trang chứa liên kết tuyển sinh | Full 4 Columns, Compact Mobile |
| 3 | **\`AdminSidebar\`** | \`components/admin/admin-sidebar.tsx\` | Menu điều hướng quản trị cố định | Expanded (260px), Collapsed (72px) |
| 4 | **\`AdminTopbar\`** | \`components/admin/admin-topbar.tsx\` | Thanh công cụ tìm kiếm & hồ sơ admin | Default with Search & Avatar dropdown |
| 5 | **\`PortalTabs\`** | \`components/portal/portal-tabs.tsx\` | Thanh điều hướng các tab sinh viên | Horizontal scrollable pills |
| 6 | **\`Button\`** | \`components/ui/button.tsx\` | Nút bấm thao tác người dùng | Primary (Cam), Secondary, Outline, Ghost, Danger |
| 7 | **\`Card\`** | \`components/ui/card.tsx\` | Khung bao bọc nội dung | Default, Hoverable, Bordered, Glassmorphic |
| 8 | **\`Badge\`** | \`components/ui/badge.tsx\` | Nhãn trạng thái dữ liệu | Success, Warning, Danger, Info, Neutral |
| 9 | **\`Input\`** | \`components/ui/input.tsx\` | Trường nhập liệu văn bản | Text, Password with toggle, Search with icon |
| 10 | **\`Modal\`** | \`components/ui/modal.tsx\` | Hộp thoại thông báo & xác nhận | Center Popup, Blur Backdrop, Small/Medium/Large |
| 11 | **\`Drawer\`** | \`components/ui/drawer.tsx\` | Bảng trượt từ cạnh phải để nhập liệu | Right Sheet (480px / 600px), Mobile Bottom Sheet |
| 12 | **\`DataTable\`** | \`components/ui/data-table.tsx\` | Bảng dữ liệu quản trị chuẩn SaaS | Sortable headers, selection checkbox, pagination |
| 13 | **\`StatCard\`** | \`components/admin/stat-card.tsx\` | Thẻ hiển thị chỉ số thống kê KPI | Metric with trend badge (+12%) & icon |
| 14 | **\`Toast\`** | \`components/ui/toast.tsx\` | Thông báo nổi góc màn hình | Success, Error, Info with auto-dismiss timer |
| 15 | **\`TicketPass\`**| \`components/portal/ticket-pass.tsx\` | Thẻ vé Open Day phong cách Boarding pass | Scannable QR, Perforated border line |
| 16 | **\`TourDock\`** | \`components/tour/floating-dock.tsx\` | Thanh điều khiển Tour 360 nổi | Rounded glass dock with camera controls |
| 17 | **\`RadarMap\`** | \`components/tour/radar-map.tsx\` | Radar mini-map góc màn hình 360 | Transparent canvas with dynamic vision cone |
| 18 | **\`HotspotPin\`**| \`components/tour/hotspot-pin.tsx\` | Điểm ghim tương tác trên ảnh 360 | Glowing pulse ring with Vietnamese tooltip |
| 19 | **\`SpinWheel\`** | \`components/games/lucky-spin-wheel.tsx\` | Vòng quay may mắn tương tác 3D | 8 segments, pointer arrow, center spin CTA |
| 20 | **\`XpBar\`** | \`components/portal/xp-progress-bar.tsx\` | Thanh tiến độ điểm thưởng XP | Gradient bar with level indicators |
| 21 | **\`EmptyState\`**| \`components/ui/empty-state.tsx\` | Giao diện khi danh sách trống | Illustration, title, descriptive message & CTA |
| 22 | **\`LoadingSkeleton\`** | \`components/ui/skeleton.tsx\` | Hiệu ứng xương nhấp nháy khi tải | Card skeleton, table rows, hero banner |
| 23 | **\`ErrorBanner\`**| \`components/ui/error-banner.tsx\` | Banner cảnh báo lỗi hệ thống | Dismissible alert with retry button |
| 24 | **\`QrScanner\`** | \`components/admin/qr-scanner.tsx\` | Khung camera quét mã QR check-in | Camera viewport with target corner brackets |`;
}
