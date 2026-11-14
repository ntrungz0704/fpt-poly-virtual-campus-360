# 05 — SỐ LƯỢNG TRANG & PHẠM VI REDESIGN (PAGE COUNT & REDESIGN SCOPE)

## 1. Thống Kê Số Lượng Trang Tuyệt Đối (Không Ước Lượng)

Dựa trên việc kiểm kê từng thư mục mã nguồn thực tế tại `apps/web/src/app`:

1. **Tổng số Unique Route Templates:** **27** (25 màn hình chức năng + 2 màn hình hệ thống).
2. **Tổng số Static Routes:** **23**.
3. **Tổng số Dynamic Route Templates:** **2** (`/locations/[slug]`, `/news/[slug]`).
4. **Tổng số Page Layouts:** **6** (Root, Public, Auth, Immersive, Portal, Admin).
5. **Tổng số trang Public Website:** **9**.
6. **Tổng số trang Authentication:** **2**.
7. **Tổng số trang Virtual Campus (360 & Map):** **2**.
8. **Tổng số trang Student Portal:** **5**.
9. **Tổng số trang Parent Portal:** **1**.
10. **Tổng số trang Admin CMS:** **6**.
11. **Tổng số trang System / Error:** **2** (`404`, `loading`).
12. **Tổng số trang CẦN REDESIGN:** **25 trang** (Toàn bộ 25 màn hình chức năng).
13. **Tổng số trang dùng chung Layout/Template:** **4 trang** (Chi tiết địa điểm và chi tiết tin tức kế thừa template bài viết/thực thể; các trang con của Portal dùng chung cấu trúc tab sinh viên).
14. **Tổng số thiết kế hình ảnh độc lập (Distinct UI Mockups) cần tạo:** **18 ảnh**.
15. **Số UI States quan trọng cần thiết kế thêm:** **7 states** (Modal Check-in QR, Drawer tạo địa điểm Admin, Modal xác nhận liên kết phụ huynh, Mobile Navigation Menu, Dropdown thông tin tài khoản, Modal làm bài Quiz, Thông báo nhận thưởng XP Toast).

---

## 2. Bảng Phân Bổ Template Thiết Kế & Số Lượng Ảnh UI

| Nhóm | Số trang thực tế | Số Template độc lập | Danh sách trang cụ thể | Ghi chú thiết kế |
|---|:---:|:---:|---|---|
| **Public Website** | 9 | 7 | `/`, `/about`, `/contact`, `/events`, `/games`, `/locations` (+detail), `/news` (+detail) | `/locations/[slug]` và `/news/[slug]` dùng chung layout detail chuẩn với trang cha. |
| **Authentication** | 2 | 2 | `/login`, `/change-password` | Bố cục split-screen đối xứng hiện đại. |
| **Virtual Campus** | 2 | 2 | `/campus` (360 Tour), `/map` (GIS Leaflet) | Immersive Canvas toàn màn hình, toolbar kính mờ (glassmorphism). |
| **Student Portal** | 5 | 3 | `/portal` (Dashboard), `/portal/profile` (kèm `/progress`), `/portal/tickets` (kèm `/schedule`) | Gom các tab có cùng bố cục vào 3 layout mockup chủ đạo. |
| **Parent Portal** | 1 | 1 | `/parent` | Bố cục thẻ con em, tiến độ học tập và modal liên kết. |
| **Admin CMS** | 6 | 3 | `/admin` (Dashboard), CRUD Bảng (`/events`, `/locations`, `/media`, `/users`), Studio (`/virtual-tour`) | 1 mẫu Dashboard thống kê + 1 mẫu Data Table SaaS chuẩn + 1 mẫu Studio 360 editor. |
| **TỔNG CỘNG** | **25 trang** | **18 Mockups** | Đầy đủ 6 phân hệ người dùng | **18 ảnh UI Desktop + 18 biến thể Mobile = 36 ảnh UI mục tiêu.** |
