# DESIGN PROMPT — ADMN-006: ADMIN STUDIO BIÊN TẬP TOUR 360°

> **Mục tiêu:** Tạo bản thiết kế UI/UX đồ họa chất lượng cao cho Admin Studio biên tập Tour 360° (Tour 360° Studio Editor).

---

## 1. Thông Số Tạo Ảnh (Image Generation Parameters)
- **Mã trang:** `ADMN-006`
- **Tên trang:** Admin Studio biên tập Tour 360° (Tour 360° Studio Editor)
- **Tuyến đường:** `/admin/virtual-tour`
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
- Mục tiêu trang: Không gian studio 3 cột chuyên nghiệp: Cột 1 cây danh sách cảnh 360; Cột 2 khung biên tập panorama trực tiếp; Cột 3 bảng chỉnh sửa thuộc tính Hotspot.
- Các thành phần bắt buộc có:
  - **AdminSidebar**
  - **AdminTopbar**
  - **SceneTreeSidebar**
  - **HotspotEditorCanvas**
  - **HotspotInspectorPanel**
  - **SaveDraftTourButton**
  - **PreviewTourModal**

### 2.2 Bố Cục Mobile (390x844)
- Bố cục dọc 1 cột tối ưu cho màn hình cảm ứng điện thoại thông minh.
- Thanh điều hướng thu gọn thành hamburger menu hoặc bottom navigation bar.
- Nút bấm chính to rõ, kích thước tối thiểu 44px để ngón tay cái dễ bấm.

---

## 3. Câu Lệnh Prompt Dành Cho Công Cụ AI (Midjourney / DALL-E / Imagen)

```text
High-fidelity modern UI/UX web design mockup for 'ADMN-006 - Tour 360° Studio Editor' of FPT Polytechnic Virtual Campus (/admin/virtual-tour). 
View: Clean 1440x900 desktop browser screenshot. 
Brand Colors: Signature FPT Orange (#F26F21), Tech Navy (#0D47A1), crisp off-white background (#F8FAFC). 
Key Elements: AdminSidebar, AdminTopbar, SceneTreeSidebar, HotspotEditorCanvas, HotspotInspectorPanel, SaveDraftTourButton, PreviewTourModal. 
Purpose: Không gian studio 3 cột chuyên nghiệp: Cột 1 cây danh sách cảnh 360; Cột 2 khung biên tập panorama trực tiếp; Cột 3 bảng chỉnh sửa thuộc tính Hotspot.. 
Style: Ultra-modern EdTech web platform, Dribbble/Behance trending design, clean typography in Vietnamese, smooth card shadows, rounded-2xl corners, pixel-perfect layout.
```
