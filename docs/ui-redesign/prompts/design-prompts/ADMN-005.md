# DESIGN PROMPT — ADMN-005: ADMIN QUẢN TRỊ NGƯỜI DÙNG & RBAC

> **Mục tiêu:** Tạo bản thiết kế UI/UX đồ họa chất lượng cao cho Admin Quản trị người dùng & RBAC (User Management & RBAC).

---

## 1. Thông Số Tạo Ảnh (Image Generation Parameters)
- **Mã trang:** `ADMN-005`
- **Tên trang:** Admin Quản trị người dùng & RBAC (User Management & RBAC)
- **Tuyến đường:** `/admin/users`
- **Phân hệ:** Admin CMS
- **Khung nhìn Desktop:** 1440 × 900 (Tỷ lệ 16:9)
- **Khung nhìn Mobile:** 390 × 844 (Tỷ lệ 9:19.5)
- **Bảng màu chủ đạo:**
  - Cam FPT: `#F26F21` (Màu nhấn, CTA, badge nổi bật)
  - Xanh Navy: `#0D47A1` (Nhận diện công nghệ, khối phụ)
  - Nền ứng dụng: `#F8FAFC` (Slate 50 sạch sẽ)
  - Nền thẻ / Bề mặt: `#FFFFFF` (Trắng thuần bo góc lớn)

---

## 2. Mô Tả Chi Tiết Yêu Cầu Thiết Kế (Detailed Design Brief)

### 2.1 Bố Cục Desktop (1440x900)
- Thiết kế giao diện web hoàn chỉnh nhìn chính diện (front-facing browser mockup).
- Không nghiêng phối cảnh, không tạo khung viền laptop, không cắt mất thanh điều hướng.
- Mục tiêu trang: Quản lý danh sách tài khoản toàn hệ thống, phân quyền vai trò (RBAC), tạo tài khoản cá nhân, khóa/mở tài khoản và xem ma trận quyền hạn.
- Các thành phần bắt buộc có:
  - **AdminSidebar**
  - **AdminTopbar**
  - **UserDataTable**
  - **RoleBadgeFilter**
  - **CreateUserModal**
  - **AssignRoleDrawer**
  - **AccountStatusToggle**

### 2.2 Bố Cục Mobile (390x844)
- Bố cục dọc 1 cột tối ưu cho màn hình cảm ứng điện thoại thông minh.
- Thanh điều hướng thu gọn thành hamburger menu hoặc bottom navigation bar.
- Nút bấm chính to rõ, kích thước tối thiểu 44px để ngón tay cái dễ bấm.

---

## 3. Câu Lệnh Prompt Dành Cho Công Cụ AI (Midjourney / DALL-E / Imagen)

```text
High-fidelity modern UI/UX web design mockup for 'ADMN-005 - User Management & RBAC' of FPT Polytechnic Virtual Campus (/admin/users). 
View: Clean 1440x900 desktop browser screenshot. 
Brand Colors: Signature FPT Orange (#F26F21), Tech Navy (#0D47A1), crisp off-white background (#F8FAFC). 
Key Elements: AdminSidebar, AdminTopbar, UserDataTable, RoleBadgeFilter, CreateUserModal, AssignRoleDrawer, AccountStatusToggle. 
Purpose: Quản lý danh sách tài khoản toàn hệ thống, phân quyền vai trò (RBAC), tạo tài khoản cá nhân, khóa/mở tài khoản và xem ma trận quyền hạn.. 
Style: Ultra-modern EdTech web platform, Dribbble/Behance trending design, clean typography in Vietnamese, smooth card shadows, rounded-2xl corners, pixel-perfect layout.
```
