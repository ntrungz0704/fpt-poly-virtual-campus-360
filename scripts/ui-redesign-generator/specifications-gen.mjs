import { PAGES_DATA } from "./pages-data.mjs";

export function getPageInventoryMd() {
  return `# DANH MỤC KIỂM KÊ 25 TRANG THIẾT KẾ (PAGE INVENTORY)

Tài liệu kiểm kê chi tiết 25 page templates được thiết kế lại:

| STT | Mã ID | Tên trang tiếng Việt | Tuyến đường (Route) | Phân hệ (Sub-system) | Layout áp dụng | Loại Viewport | Trạng thái Route |
|:---:|:---:|---|---|---|---|:---:|:---:|
${PAGES_DATA.map(
  (p, idx) =>
    `| ${idx + 1} | **${p.id}** | ${p.name} | \`${p.route}\` | ${p.group} | \`${p.layout}\` | **${p.viewportType}** |  Tồn tại |`,
).join("\n")}

---

### Phân Tích Tổng Hợp Số Lượng:
- **Tổng số trang chức năng:** 25 trang.
- **Trang Public Website:** 9 trang (chiếm 36%).
- **Trang Authentication:** 2 trang (chiếm 8%).
- **Trang Virtual Campus (360 & Map):** 2 trang (chiếm 8%).
- **Trang Student Portal:** 5 trang (chiếm 20%).
- **Trang Parent Portal:** 1 trang (chiếm 4%).
- **Trang Admin CMS:** 6 trang (chiếm 24%).
- **Tổng số ảnh thiết kế cần tạo:** **50 ảnh** (25 trang x 2 viewports Desktop 1440 và Mobile 390).`;
}

export function getPageDesignSpecificationsMd() {
  return `# ĐẶC TẢ CHI TIẾT THIẾT KẾ TỪNG TRANG (PAGE DESIGN SPECIFICATIONS)

Tài liệu này quy định mục tiêu người dùng, thành phần giao diện, luồng dữ liệu và trải nghiệm UX cho từng mã trang trong 25 trang:

${PAGES_DATA.map(
  (p) => `## [${p.id}] ${p.name} (${p.englishName})
- **Tuyến đường (Route):** \`${p.route}\`${p.aliasRoute ? ` *(Tương thích: \`${p.aliasRoute}\`)*` : ""}
- **Phân hệ:** ${p.group}
- **Layout cha:** \`${p.layout}\`
- **Hành vi Viewport:** \`${p.viewportType}\`
- **Đối tượng người dùng:** ${p.role}
- **API Backend kết nối:** \`${p.api}\`
- **Mục tiêu nghiệp vụ:** ${p.description}
- **Thành phần UI cốt lõi:**
${p.components.map((c) => `  - \`${c}\``).join("\n")}
- **Hướng dẫn thiết kế Desktop (1440x900):**
  - Tối ưu không gian ngang, phân cấp rõ ràng giữa thông tin quan trọng và thông tin phụ trợ.
  - Sử dụng hệ lưới 12 cột với gutter 24px, container tối đa 1440px.
- **Hướng dẫn thiết kế Mobile (390x844):**
  - Chuyển đổi các khối cột ngang thành một cột dọc duy nhất.
  - Các nút hành động chính (Primary Action) đặt tại vùng chạm ngón tay cái (thumb zone) ở nửa dưới màn hình.
  - Khoảng cách chạm tối thiểu cho các nút: 44px x 44px.

---
`,
).join("\n")}`;
}

export function getResponsiveSpecificationsMd() {
  return `# QUY CHUẨN ĐÁP ỨNG ĐA THIẾT BỊ (RESPONSIVE SPECIFICATIONS)

## 1. 4 Điểm Ngắt Màn Hình Chuẩn (Responsive Breakpoints)

Hệ thống được thiết kế và kiểm thử nghiêm ngặt trên 4 ngưỡng hiển thị:

| Thiết bị mục tiêu | Viewport chuẩn | Breakpoint Tailwind | Hành vi bố cục chính |
|---|:---:|:---:|---|
| **Mobile Điện thoại** | **390 × 844** | Base (\`< 640px\`) | 1 cột duy nhất, Sidebar chuyển thành Bottom Nav hoặc Drawer trượt, bảng dữ liệu chuyển thành Card dọc. |
| **Tablet Máy tính bảng**| **768 × 1024** | \`md: (768px - 1023px)\`| 2 cột linh hoạt, Sidebar thu gọn thành icon-only (72px), bảng dữ liệu có scroll ngang nội bộ. |
| **Laptop Tiêu chuẩn** | **1280 × 800** | \`lg: (1024px - 1279px)\`| 3 cột, Sidebar mở rộng đầy đủ (260px), các khối thống kê chia 2x2. |
| **Desktop Màn hình lớn**| **1440 × 900** | \`xl: (1280px+)\` | Toàn bộ không gian làm việc tối đa, biểu đồ và bảng trải rộng không bị co ép. |

---

## 2. Chiến Lược Xử Lý Cuộn & Chống Tràn (Anti-Overflow Strategy)

1. **Chống tràn ngang (\`horizontal overflow\`):**
   - Tuyệt đối không để xảy ra hiện tượng \`scrollWidth > clientWidth\` trên toàn bộ trang.
   - Thẻ bảng \`<table>\` bắt buộc phải được bọc trong container \`<div className="overflow-x-auto w-full">\`.
2. **Quản lý chiều cao toàn màn hình (\`Full Viewport Height\`):**
   - Thay thế hoàn toàn \`100vh\` bằng \`100dvh\` hoặc \`h-screen flex flex-col\` để tránh thanh địa chỉ của trình duyệt Safari/Chrome trên mobile che khuất đáy trang.
3. **Vùng an toàn di động (Safe Area Insets):**
   - Đảm bảo \`padding-bottom: env(safe-area-inset-bottom)\` cho thanh điều hướng mobile để không bị vướng vạch điều hướng cảm ứng của iPhone/Android.`;
}
