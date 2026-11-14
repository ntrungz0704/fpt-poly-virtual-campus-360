# DESIGN PROMPT — ADMN-004: ADMIN KHO MEDIA & ẢNH 360°

> **Mục tiêu:** Tạo bản thiết kế UI/UX đồ họa chất lượng cao cho Admin Kho Media & Ảnh 360° (Media Asset Library).

---

## 1. Thông Số Tạo Ảnh (Image Generation Parameters)
- **Mã trang:** `ADMN-004`
- **Tên trang:** Admin Kho Media & Ảnh 360° (Media Asset Library)
- **Tuyến đường:** `/admin/media`
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
- Mục tiêu trang: Thư viện quản lý tài sản số tập trung: danh sách ảnh panorama 360, ảnh 2D, mô hình 3D; khu vực kéo thả upload kiểm tra magic bytes an toàn.
- Các thành phần bắt buộc có:
  - **AdminSidebar**
  - **AdminTopbar**
  - **MediaGridCardView**
  - **DragDropUploadZone**
  - **MediaTypeFilterTabs**
  - **PanoramaPreviewModal**
  - **StorageUsageWidget**

### 2.2 Bố Cục Mobile (390x844)
- Bố cục dọc 1 cột tối ưu cho màn hình cảm ứng điện thoại thông minh.
- Thanh điều hướng thu gọn thành hamburger menu hoặc bottom navigation bar.
- Nút bấm chính to rõ, kích thước tối thiểu 44px để ngón tay cái dễ bấm.

---

## 3. Câu Lệnh Prompt Dành Cho Công Cụ AI (Midjourney / DALL-E / Imagen)

```text
High-fidelity modern UI/UX web design mockup for 'ADMN-004 - Media Asset Library' of FPT Polytechnic Virtual Campus (/admin/media). 
View: Clean 1440x900 desktop browser screenshot. 
Brand Colors: Signature FPT Orange (#F26F21), Tech Navy (#0D47A1), crisp off-white background (#F8FAFC). 
Key Elements: AdminSidebar, AdminTopbar, MediaGridCardView, DragDropUploadZone, MediaTypeFilterTabs, PanoramaPreviewModal, StorageUsageWidget. 
Purpose: Thư viện quản lý tài sản số tập trung: danh sách ảnh panorama 360, ảnh 2D, mô hình 3D; khu vực kéo thả upload kiểm tra magic bytes an toàn.. 
Style: Ultra-modern EdTech web platform, Dribbble/Behance trending design, clean typography in Vietnamese, smooth card shadows, rounded-2xl corners, pixel-perfect layout.
```
