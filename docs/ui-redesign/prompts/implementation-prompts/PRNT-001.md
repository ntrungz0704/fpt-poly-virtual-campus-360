# IMPLEMENTATION PROMPT — PRNT-001: CỔNG PHỤ HUYNH THEO DÕI CON

## A. ROLE
Bạn là Senior Frontend Engineer chuyên sâu về Next.js 16 App Router, React 19, TypeScript và Tailwind CSS v4, phụ trách lập trình hiện thực hóa giao diện mới cho trang **PRNT-001 — Cổng phụ huynh theo dõi con**.

---

## B. TARGET PAGE
- **Mã trang:** `PRNT-001`
- **Tên trang:** Cổng phụ huynh theo dõi con (Parent Portal Guardian View)
- **Tuyến đường (Route):** `/parent`
- **Tệp mã nguồn:** `apps/web/src/app/(public)/parent/page.tsx`
- **Layout cha:** `(portal)/layout.tsx`
- **Phân hệ:** Parent Portal
- **Loại Viewport:** `CONTENT_SCROLL`

---

## C. DESIGN REFERENCES
- **Ảnh tham chiếu Desktop (1440x900):** [`docs/ui-redesign/images/PRNT-001/desktop.png`](file:///E:/Virtual%20Campus%20FPT%20Poly/docs/ui-redesign/images/PRNT-001/desktop.png)
- **Ảnh tham chiếu Mobile (390x844):** [`docs/ui-redesign/images/PRNT-001/mobile.png`](file:///E:/Virtual%20Campus%20FPT%20Poly/docs/ui-redesign/images/PRNT-001/mobile.png)
- **Quy chuẩn Design System:** [`docs/ui-redesign/design-system/DESIGN_SYSTEM.md`](file:///E:/Virtual%20Campus%20FPT%20Poly/docs/ui-redesign/design-system/DESIGN_SYSTEM.md)
- **Hệ thống Design Tokens:** [`docs/ui-redesign/design-system/TOKENS.md`](file:///E:/Virtual%20Campus%20FPT%20Poly/docs/ui-redesign/design-system/TOKENS.md)

---

## D. DESIGN ANALYSIS
1. **Cấu trúc tổng thể:** Áp dụng hệ thống lưới chuẩn của phân hệ Parent Portal, bố cục phân chia rành mạch giữa các khối nội dung.
2. **Khoảng cách & Thẻ card:** Dùng bo góc `rounded-2xl`, bóng đổ nhẹ `shadow-sm` $ightarrow$ `shadow-md`, khoảng cách padding tối thiểu `p-6` trên desktop và `p-4` trên mobile.
3. **Màu sắc & Nhận diện:** Màu cam FPT (`#F26F21`) cho nút hành động chính và huy hiệu nổi bật; Xanh Navy (`#0D47A1`) cho các điểm nhấn công nghệ; nền ứng dụng `bg-slate-50`.
4. **Hành vi tương tác:**
   - Trạng thái hover có hiệu ứng chuyển động mượt mà bằng `transition-all duration-200`.
   - Có đầy đủ trạng thái đang tải (`LoadingSkeleton`) và trạng thái dữ liệu rỗng (`EmptyState`).

---

## E. IMPLEMENTATION REQUIREMENTS
- **Công nghệ áp dụng:** Next.js 16 App Router (Client hoặc Server Component tùy mục đích tương tác), React 19, TypeScript (Strict Mode).
- **Styling:** Tailwind CSS v4, tuyệt đối không viết CSS inline tràn lan (`style={{...}}`).
- **Tái sử dụng Component:** Sử dụng triệt để các component trong `apps/web/src/components/ui/` (`Button`, `Card`, `Badge`, `Input`, `Modal`, `Drawer`). Không tạo component trùng lặp.
- **Không dùng ảnh thay thế giao diện:** Mọi khối nội dung, chữ, nút bấm phải được viết bằng mã HTML/JSX thật 100%, tuyệt đối không nhét ảnh chụp làm nền thay cho code thật.
- **Tính khả thi:** Đảm bảo code chạy được trên cả Desktop 1440px và Mobile 390px, không bị vỡ giao diện.

---

## F. DATA & FUNCTIONALITY
- **API Backend kết nối:** `GET /api/v1/parent/students, GET /api/v1/parent/students/:id, POST /api/v1/parent/links`.
- **Hợp đồng dữ liệu:** Import trực tiếp các DTOs, Enums từ gói `@fpt-campus/shared`. Tuyệt đối không tự bịa ra các kiểu dữ liệu không có trong schema.
- **Xử lý bảo mật:** Tuân thủ phân quyền RBAC (`Phụ huynh (PARENT)`). Tự động đính kèm Token trong Header khi gọi API được bảo vệ.

---

## G. RESPONSIVE VERIFICATION CHECKLIST
Bắt buộc kiểm tra hiển thị không lỗi trên 4 kích thước:
- [ ] Desktop (1440 × 900)
- [ ] Laptop (1366 × 768 / 1280 × 800)
- [ ] Tablet (1024 × 768 / 768 × 1024)
- [ ] Mobile (390 × 844 / 360 × 800)

---

## H. ACCEPTANCE CRITERIA
1. Giao diện chuẩn xác theo ảnh tham chiếu tại `docs/ui-redesign/images/PRNT-001/`.
2. Không phát sinh thanh cuộn ngang ngoài ý muốn (`scrollWidth <= clientWidth`).
3. Không bị đè lấp bởi Header hoặc Sidebar.
4. Console trình duyệt không có cảnh báo lỗi hoặc hydration mismatch.
5. Kiểm tra `pnpm --filter web typecheck` đạt 0 lỗi TypeScript.
6. Lệnh `pnpm --filter web build` biên dịch thành công.

---

## I. REPORT FORMAT SAU KHI CODE
Sau khi lập trình xong trang này, lập báo cáo:
- Danh sách file đã tạo / chỉnh sửa.
- Các component đã tái sử dụng và component tạo mới.
- Kết quả kiểm tra responsive trên Desktop và Mobile.
- Tình trạng kết nối API backend thật.
