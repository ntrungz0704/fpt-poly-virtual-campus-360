# DESIGN PROMPT — STUD-002: HỒ SƠ SINH VIÊN

> **Mục tiêu:** Tạo bản thiết kế UI/UX đồ họa chất lượng cao cho Hồ sơ sinh viên (Student Profile).

---

## 1. Thông Số Tạo Ảnh (Image Generation Parameters)
- **Mã trang:** `STUD-002`
- **Tên trang:** Hồ sơ sinh viên (Student Profile)
- **Tuyến đường:** `/portal/profile`
- **Phân hệ:** Student Portal
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
- Mục tiêu trang: Quản lý thông tin cá nhân của sinh viên: mã sinh viên, chuyên ngành đào tạo, email, số điện thoại, ảnh đại diện và chỉnh sửa phần tiểu sử (Bio).
- Các thành phần bắt buộc có:
  - **PortalHeader**
  - **StudentIdCardWidget**
  - **PersonalInfoForm**
  - **BioEditorTextarea**
  - **SaveProfileButton**

### 2.2 Bố Cục Mobile (390x844)
- Bố cục dọc 1 cột tối ưu cho màn hình cảm ứng điện thoại thông minh.
- Thanh điều hướng thu gọn thành hamburger menu hoặc bottom navigation bar.
- Nút bấm chính to rõ, kích thước tối thiểu 44px để ngón tay cái dễ bấm.

---

## 3. Câu Lệnh Prompt Dành Cho Công Cụ AI (Midjourney / DALL-E / Imagen)

```text
High-fidelity modern UI/UX web design mockup for 'STUD-002 - Student Profile' of FPT Polytechnic Virtual Campus (/portal/profile). 
View: Clean 1440x900 desktop browser screenshot. 
Brand Colors: Signature FPT Orange (#F26F21), Tech Navy (#0D47A1), crisp off-white background (#F8FAFC). 
Key Elements: PortalHeader, StudentIdCardWidget, PersonalInfoForm, BioEditorTextarea, SaveProfileButton. 
Purpose: Quản lý thông tin cá nhân của sinh viên: mã sinh viên, chuyên ngành đào tạo, email, số điện thoại, ảnh đại diện và chỉnh sửa phần tiểu sử (Bio).. 
Style: Ultra-modern EdTech web platform, Dribbble/Behance trending design, clean typography in Vietnamese, smooth card shadows, rounded-2xl corners, pixel-perfect layout.
```
