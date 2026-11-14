# DESIGN PROMPT — ADMN-002: ADMIN QUẢN LÝ SỰ KIỆN

> **Mục tiêu:** Tạo bản thiết kế UI/UX đồ họa chất lượng cao cho Admin Quản lý sự kiện (Event Management & Check-in).

---

## 1. Thông Số Tạo Ảnh (Image Generation Parameters)
- **Mã trang:** `ADMN-002`
- **Tên trang:** Admin Quản lý sự kiện (Event Management & Check-in)
- **Tuyến đường:** `/admin/events`
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
- Mục tiêu trang: Quản trị toàn diện sự kiện Open Day: danh sách sự kiện, trạng thái xuất bản, quản lý các phiên hội thảo, ngân hàng câu hỏi Quiz và quét mã QR check-in.
- Các thành phần bắt buộc có:
  - **AdminSidebar**
  - **AdminTopbar**
  - **EventListTable**
  - **SessionManagerModal**
  - **QuizManagerDrawer**
  - **QrScannerModal**
  - **EventCreateButton**

### 2.2 Bố Cục Mobile (390x844)
- Bố cục dọc 1 cột tối ưu cho màn hình cảm ứng điện thoại thông minh.
- Thanh điều hướng thu gọn thành hamburger menu hoặc bottom navigation bar.
- Nút bấm chính to rõ, kích thước tối thiểu 44px để ngón tay cái dễ bấm.

---

## 3. Câu Lệnh Prompt Dành Cho Công Cụ AI (Midjourney / DALL-E / Imagen)

```text
High-fidelity modern UI/UX web design mockup for 'ADMN-002 - Event Management & Check-in' of FPT Polytechnic Virtual Campus (/admin/events). 
View: Clean 1440x900 desktop browser screenshot. 
Brand Colors: Signature FPT Orange (#F26F21), Tech Navy (#0D47A1), crisp off-white background (#F8FAFC). 
Key Elements: AdminSidebar, AdminTopbar, EventListTable, SessionManagerModal, QuizManagerDrawer, QrScannerModal, EventCreateButton. 
Purpose: Quản trị toàn diện sự kiện Open Day: danh sách sự kiện, trạng thái xuất bản, quản lý các phiên hội thảo, ngân hàng câu hỏi Quiz và quét mã QR check-in.. 
Style: Ultra-modern EdTech web platform, Dribbble/Behance trending design, clean typography in Vietnamese, smooth card shadows, rounded-2xl corners, pixel-perfect layout.
```
