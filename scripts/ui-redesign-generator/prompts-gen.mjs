import { PAGES_DATA } from "./pages-data.mjs";

export function generateDesignPrompt(page) {
  return `# DESIGN PROMPT — ${page.id}: ${page.name.toUpperCase()}

> **Mục tiêu:** Tạo bản thiết kế UI/UX đồ họa chất lượng cao cho ${page.name} (${page.englishName}).

---

## 1. Thông Số Tạo Ảnh (Image Generation Parameters)
- **Mã trang:** \`${page.id}\`
- **Tên trang:** ${page.name} (${page.englishName})
- **Tuyến đường:** \`${page.route}\`
- **Phân hệ:** ${page.group}
- **Khung nhìn Desktop:** 1440 × 900 (Tỷ lệ 16:9)
- **Khung nhìn Mobile:** 390 × 844 (Tỷ lệ 9:19.5)
- **Bảng màu chủ đạo:**
  - Cam FPT: \`#F26F21\` (Màu nhấn, CTA, badge nổi bật)
  - Xanh Navy: \`#0D47A1\` (Nhận diện công nghệ, khối phụ)
  - Nền ứng dụng: \`#F8FAFC\` (Slate 50 sạch sẽ)
  - Nền thẻ / Bề mặt: \`#FFFFFF\` (Trắng thuần bo góc lớn)

---

## 2. Mô Tả Chi Tiết Yêu Cầu Thiết Kế (Detailed Design Brief)

### 2.1 Bố Cục Desktop (1440x900)
- Thiết kế giao diện web hoàn chỉnh nhìn chính diện (front-facing browser mockup).
- Không nghiêng phối cảnh, không tạo khung viền laptop, không cắt mất thanh điều hướng.
- Mục tiêu trang: ${page.description}
- Các thành phần bắt buộc có:
${page.components.map((c) => `  - **${c}**`).join("\n")}

### 2.2 Bố Cục Mobile (390x844)
- Bố cục dọc 1 cột tối ưu cho màn hình cảm ứng điện thoại thông minh.
- Thanh điều hướng thu gọn thành hamburger menu hoặc bottom navigation bar.
- Nút bấm chính to rõ, kích thước tối thiểu 44px để ngón tay cái dễ bấm.

---

## 3. Câu Lệnh Prompt Dành Cho Công Cụ AI (Midjourney / DALL-E / Imagen)

\`\`\`text
High-fidelity modern UI/UX web design mockup for '${page.id} - ${page.englishName}' of FPT Polytechnic Virtual Campus (${page.route}). 
View: Clean 1440x900 desktop browser screenshot. 
Brand Colors: Signature FPT Orange (#F26F21), Tech Navy (#0D47A1), crisp off-white background (#F8FAFC). 
Key Elements: ${page.components.join(", ")}. 
Purpose: ${page.description}. 
Style: Ultra-modern EdTech web platform, Dribbble/Behance trending design, clean typography in Vietnamese, smooth card shadows, rounded-2xl corners, pixel-perfect layout.
\`\`\`
`;
}

export function generateImplementationPrompt(page) {
  return `# IMPLEMENTATION PROMPT — ${page.id}: ${page.name.toUpperCase()}

## A. ROLE
Bạn là Senior Frontend Engineer chuyên sâu về Next.js 16 App Router, React 19, TypeScript và Tailwind CSS v4, phụ trách lập trình hiện thực hóa giao diện mới cho trang **${page.id} — ${page.name}**.

---

## B. TARGET PAGE
- **Mã trang:** \`${page.id}\`
- **Tên trang:** ${page.name} (${page.englishName})
- **Tuyến đường (Route):** \`${page.route}\`${page.aliasRoute ? ` *(Hỗ trợ alias: \`${page.aliasRoute}\`)*` : ""}
- **Tệp mã nguồn:** \`apps/web/src/app${page.route === "/" ? "/(public)/page.tsx" : page.route.startsWith("/admin") ? `${page.route}/page.tsx` : page.route.startsWith("/portal") ? `/(portal)${page.route}/page.tsx` : page.route.startsWith("/campus") || page.route.startsWith("/map") ? `/(immersive)${page.route}/page.tsx` : `/(public)${page.route}/page.tsx`}\`
- **Layout cha:** \`${page.layout}\`
- **Phân hệ:** ${page.group}
- **Loại Viewport:** \`${page.viewportType}\`

---

## C. DESIGN REFERENCES
- **Ảnh tham chiếu Desktop (1440x900):** [\`docs/ui-redesign/images/${page.id}/desktop.png\`](file:///E:/Virtual%20Campus%20FPT%20Poly/docs/ui-redesign/images/${page.id}/desktop.png)
- **Ảnh tham chiếu Mobile (390x844):** [\`docs/ui-redesign/images/${page.id}/mobile.png\`](file:///E:/Virtual%20Campus%20FPT%20Poly/docs/ui-redesign/images/${page.id}/mobile.png)
- **Quy chuẩn Design System:** [\`docs/ui-redesign/design-system/DESIGN_SYSTEM.md\`](file:///E:/Virtual%20Campus%20FPT%20Poly/docs/ui-redesign/design-system/DESIGN_SYSTEM.md)
- **Hệ thống Design Tokens:** [\`docs/ui-redesign/design-system/TOKENS.md\`](file:///E:/Virtual%20Campus%20FPT%20Poly/docs/ui-redesign/design-system/TOKENS.md)

---

## D. DESIGN ANALYSIS
1. **Cấu trúc tổng thể:** Áp dụng hệ thống lưới chuẩn của phân hệ ${page.group}, bố cục phân chia rành mạch giữa các khối nội dung.
2. **Khoảng cách & Thẻ card:** Dùng bo góc \`rounded-2xl\`, bóng đổ nhẹ \`shadow-sm\` $\rightarrow$ \`shadow-md\`, khoảng cách padding tối thiểu \`p-6\` trên desktop và \`p-4\` trên mobile.
3. **Màu sắc & Nhận diện:** Màu cam FPT (\`#F26F21\`) cho nút hành động chính và huy hiệu nổi bật; Xanh Navy (\`#0D47A1\`) cho các điểm nhấn công nghệ; nền ứng dụng \`bg-slate-50\`.
4. **Hành vi tương tác:**
   - Trạng thái hover có hiệu ứng chuyển động mượt mà bằng \`transition-all duration-200\`.
   - Có đầy đủ trạng thái đang tải (\`LoadingSkeleton\`) và trạng thái dữ liệu rỗng (\`EmptyState\`).

---

## E. IMPLEMENTATION REQUIREMENTS
- **Công nghệ áp dụng:** Next.js 16 App Router (Client hoặc Server Component tùy mục đích tương tác), React 19, TypeScript (Strict Mode).
- **Styling:** Tailwind CSS v4, tuyệt đối không viết CSS inline tràn lan (\`style={{...}}\`).
- **Tái sử dụng Component:** Sử dụng triệt để các component trong \`apps/web/src/components/ui/\` (\`Button\`, \`Card\`, \`Badge\`, \`Input\`, \`Modal\`, \`Drawer\`). Không tạo component trùng lặp.
- **Không dùng ảnh thay thế giao diện:** Mọi khối nội dung, chữ, nút bấm phải được viết bằng mã HTML/JSX thật 100%, tuyệt đối không nhét ảnh chụp làm nền thay cho code thật.
- **Tính khả thi:** Đảm bảo code chạy được trên cả Desktop 1440px và Mobile 390px, không bị vỡ giao diện.

---

## F. DATA & FUNCTIONALITY
- **API Backend kết nối:** \`${page.api}\`.
- **Hợp đồng dữ liệu:** Import trực tiếp các DTOs, Enums từ gói \`@fpt-campus/shared\`. Tuyệt đối không tự bịa ra các kiểu dữ liệu không có trong schema.
- **Xử lý bảo mật:** Tuân thủ phân quyền RBAC (\`${page.role}\`). Tự động đính kèm Token trong Header khi gọi API được bảo vệ.

---

## G. RESPONSIVE VERIFICATION CHECKLIST
Bắt buộc kiểm tra hiển thị không lỗi trên 4 kích thước:
- [ ] Desktop (1440 × 900)
- [ ] Laptop (1366 × 768 / 1280 × 800)
- [ ] Tablet (1024 × 768 / 768 × 1024)
- [ ] Mobile (390 × 844 / 360 × 800)

---

## H. ACCEPTANCE CRITERIA
1. Giao diện chuẩn xác theo ảnh tham chiếu tại \`docs/ui-redesign/images/${page.id}/\`.
2. Không phát sinh thanh cuộn ngang ngoài ý muốn (\`scrollWidth <= clientWidth\`).
3. Không bị đè lấp bởi Header hoặc Sidebar.
4. Console trình duyệt không có cảnh báo lỗi hoặc hydration mismatch.
5. Kiểm tra \`pnpm --filter web typecheck\` đạt 0 lỗi TypeScript.
6. Lệnh \`pnpm --filter web build\` biên dịch thành công.

---

## I. REPORT FORMAT SAU KHI CODE
Sau khi lập trình xong trang này, lập báo cáo:
- Danh sách file đã tạo / chỉnh sửa.
- Các component đã tái sử dụng và component tạo mới.
- Kết quả kiểm tra responsive trên Desktop và Mobile.
- Tình trạng kết nối API backend thật.
`;
}
