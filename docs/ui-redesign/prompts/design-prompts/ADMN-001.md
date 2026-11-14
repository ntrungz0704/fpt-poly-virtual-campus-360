# DESIGN PROMPT — ADMN-001: ADMIN DASHBOARD

> **Mục tiêu:** Tạo bản thiết kế UI/UX đồ họa chất lượng cao cho Admin Dashboard (Admin Executive Dashboard).

---

## 1. Thông Số Tạo Ảnh (Image Generation Parameters)
- **Mã trang:** `ADMN-001`
- **Tên trang:** Admin Dashboard (Admin Executive Dashboard)
- **Tuyến đường:** `/admin`
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
- Mục tiêu trang: Bảng điều khiển quản trị trung tâm chuẩn Enterprise SaaS: 4 thẻ chỉ số KPI tổng quan, biểu đồ lượt tham quan 360, dòng thời gian check-in trực tiếp.
- Các thành phần bắt buộc có:
  - **AdminSidebar**
  - **AdminTopbar**
  - **KpiMetricsRow**
  - **VirtualVisitorChartCard**
  - **LiveCheckinFeed**
  - **QuickActionPanel**

### 2.2 Bố Cục Mobile (390x844)
- Bố cục dọc 1 cột tối ưu cho màn hình cảm ứng điện thoại thông minh.
- Thanh điều hướng thu gọn thành hamburger menu hoặc bottom navigation bar.
- Nút bấm chính to rõ, kích thước tối thiểu 44px để ngón tay cái dễ bấm.

---

## 3. Câu Lệnh Prompt Dành Cho Công Cụ AI (Midjourney / DALL-E / Imagen)

```text
High-fidelity modern UI/UX web design mockup for 'ADMN-001 - Admin Executive Dashboard' of FPT Polytechnic Virtual Campus (/admin). 
View: Clean 1440x900 desktop browser screenshot. 
Brand Colors: Signature FPT Orange (#F26F21), Tech Navy (#0D47A1), crisp off-white background (#F8FAFC). 
Key Elements: AdminSidebar, AdminTopbar, KpiMetricsRow, VirtualVisitorChartCard, LiveCheckinFeed, QuickActionPanel. 
Purpose: Bảng điều khiển quản trị trung tâm chuẩn Enterprise SaaS: 4 thẻ chỉ số KPI tổng quan, biểu đồ lượt tham quan 360, dòng thời gian check-in trực tiếp.. 
Style: Ultra-modern EdTech web platform, Dribbble/Behance trending design, clean typography in Vietnamese, smooth card shadows, rounded-2xl corners, pixel-perfect layout.
```
