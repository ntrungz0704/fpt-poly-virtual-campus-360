# 07 — KIỂM TOÁN DESIGN SYSTEM & ĐỊNH HƯỚNG THỐNG NHẤT (DESIGN SYSTEM AUDIT)

## 1. Hiện Trạng Thư Viện UI Hiện Tại (`apps/web/src/components/ui`)

Thư viện component hiện có gồm:
- `Button` (`button.tsx`): Có biến thể `primary`, `secondary`, `outline`, `ghost`, `danger`.
- `Card` (`card.tsx`): Đóng gói hộp nội dung với bóng mờ và viền border.
- `Badge` (`badge.tsx`): Hiển thị nhãn trạng thái (`success`, `warning`, `danger`, `info`).
- `Modal` & `Drawer`: Quản lý hộp thoại pop-up và thanh trượt bên phải.
- `States` (`loading-state.tsx`, `empty-state.tsx`, `error-state.tsx`): Trạng thái rỗng và báo lỗi.
- `StatusToast`: Thông báo nổi góc màn hình.

**Hạn chế phát hiện:** Các component trên hoạt động tốt về mặt logic nhưng chưa có bộ **Design Tokens** tập trung. Các thông số về màu sắc (`color`), bán kính góc (`border-radius`), bóng đổ (`box-shadow`) và khoảng cách (`spacing`) đang bị hardcode rải rác trong các class Tailwind.

---

## 2. Đề Xuất Bộ Design Tokens Chuẩn Hóa Mới

### 2.1 Bảng Màu Nhận Diện (Color Palette)
- **Primary Brand (Cam FPT):** `#F26F21` (Hover: `#D95A10`, Light: `#FFF4ED`). Thể hiện sự nhiệt huyết, sáng tạo và đặc trưng của FPT Polytechnic.
- **Secondary (Xanh Công Nghệ):** `#0D47A1` (Phối hợp tạo sự tin cậy, vững chãi của giáo dục).
- **Neutral Dark (Văn bản & Nền tối):** `#0F172A` (Slate 900), `#1E293B` (Slate 800).
- **Neutral Light (Nền sáng & Thẻ):** `#F8FAFC` (Slate 50), `#FFFFFF` (White).
- **Semantic Colors:**
  - Success: `#10B981` (Đã duyệt, hoàn thành).
  - Warning: `#F59E0B` (Chờ duyệt, lưu ý).
  - Danger: `#EF4444` (Từ chối, lỗi, khóa).
  - Info: `#3B82F6` (Thông tin hướng dẫn).

### 2.2 Bán Kính Góc (Border Radius)
- Small components (Tag, Badge, Button nhỏ): `rounded-lg` (8px).
- Cards, Input, Button tiêu chuẩn: `rounded-xl` (12px).
- Modals, Drawers, Hero Cards: `rounded-2xl` (16px - 20px).

### 2.3 4 Phân Vùng Thiết Kế Riêng Biệt (4-Tier Persona Systems)
1. **Public Website:** Phong cách hiện đại, giàu hình ảnh, tương tác mượt, nhấn mạnh năng động và công nghệ.
2. **Virtual Campus (360/Map):** Phong cách Dark Glassmorphism, tràn viền, tối giản thanh công cụ để nhường chỗ cho không gian hình ảnh 360°.
3. **Student & Parent Portal:** Phong cách Clean Educational Dashboard, rõ ràng, thẻ card bo góc thân thiện, biểu đồ dễ hiểu.
4. **Admin Console:** Phong cách Enterprise SaaS (tương tự Linear/Vercel/Stripe), mật độ thông tin cao, thao tác bảng phím nhanh, màu sắc trung tính sạch sẽ.
