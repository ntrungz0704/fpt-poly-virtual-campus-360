# DESIGN PROMPT — STUD-003: TIẾN TRÌNH & ĐIỂM THƯỞNG XP

> **Mục tiêu:** Tạo bản thiết kế UI/UX đồ họa chất lượng cao cho Tiến trình & Điểm thưởng XP (XP Progress & Gamification).

---

## 1. Thông Số Tạo Ảnh (Image Generation Parameters)
- **Mã trang:** `STUD-003`
- **Tên trang:** Tiến trình & Điểm thưởng XP (XP Progress & Gamification)
- **Tuyến đường:** `/portal/progress`
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
- Mục tiêu trang: Theo dõi toàn bộ thành tích tích lũy điểm XP (120 XP), thanh thăng cấp (Level 2), danh hiệu đạt được và lịch sử biến động sổ cái điểm thưởng.
- Các thành phần bắt buộc có:
  - **PortalHeader**
  - **LevelProgressBar**
  - **XpRankBadge**
  - **AchievementBadgesGrid**
  - **XpLedgerHistoryTable**
  - **SpinWheelShortcut**

### 2.2 Bố Cục Mobile (390x844)
- Bố cục dọc 1 cột tối ưu cho màn hình cảm ứng điện thoại thông minh.
- Thanh điều hướng thu gọn thành hamburger menu hoặc bottom navigation bar.
- Nút bấm chính to rõ, kích thước tối thiểu 44px để ngón tay cái dễ bấm.

---

## 3. Câu Lệnh Prompt Dành Cho Công Cụ AI (Midjourney / DALL-E / Imagen)

```text
High-fidelity modern UI/UX web design mockup for 'STUD-003 - XP Progress & Gamification' of FPT Polytechnic Virtual Campus (/portal/progress). 
View: Clean 1440x900 desktop browser screenshot. 
Brand Colors: Signature FPT Orange (#F26F21), Tech Navy (#0D47A1), crisp off-white background (#F8FAFC). 
Key Elements: PortalHeader, LevelProgressBar, XpRankBadge, AchievementBadgesGrid, XpLedgerHistoryTable, SpinWheelShortcut. 
Purpose: Theo dõi toàn bộ thành tích tích lũy điểm XP (120 XP), thanh thăng cấp (Level 2), danh hiệu đạt được và lịch sử biến động sổ cái điểm thưởng.. 
Style: Ultra-modern EdTech web platform, Dribbble/Behance trending design, clean typography in Vietnamese, smooth card shadows, rounded-2xl corners, pixel-perfect layout.
```
