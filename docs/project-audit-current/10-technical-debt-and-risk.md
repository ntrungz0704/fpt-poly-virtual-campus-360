# BÁO CÁO NỢ KỸ THUẬT & QUẢN TRỊ RỦI RO (10-TECHNICAL-DEBT-AND-RISK)
## FPT Polytechnic Virtual Campus 360°

---

## 1. Danh Mục Nợ Kỹ Thuật (Technical Debt)

1. **Dữ liệu tĩnh chưa kết nối Database ở Module Tin tức & Liên hệ:**
   - Trang `/news` và `/contact` hiện chưa có controller backend và model database tương ứng, vẫn đang dựa vào các mảng dữ liệu tĩnh trong `apps/web/src/components/news/news-items.ts`.
   - *Biện pháp giải quyết:* Triển khai Milestone M5 (News & Contact CMS) với schema PostgreSQL hoàn chỉnh.
2. **Lưu cấu hình Tour 360° mới dừng ở LocalStorage:**
   - Dữ liệu chỉnh sửa điểm ghim và góc nhìn trên `/admin/virtual-tour` được lưu vào `localStorage.getItem("vc_admin_tour_scenes")` mà chưa có API lưu đồng bộ vào bảng `tour_nodes` và `hotspots`.
   - *Biện pháp giải quyết:* Xây dựng endpoint `PUT /api/v1/admin/tour/configuration` hoặc gắn nhãn "Bản nháp cục bộ" cho người dùng.
3. **Sự không nhất quán trong Test Suite cũ của API:**
   - Trong `apps/api/test/integration/auth-session.integration.spec.ts`, một assertion mong đợi `mustChangePassword === true`, nhưng tài khoản seed bootstrap hiện tại đã được cấu hình `mustChangePassword = false` theo yêu cầu đơn giản hóa 1 Super Admin duy nhất.
   - *Biện pháp giải quyết:* Đồng bộ lại điều kiện kiểm thử trong file spec tương ứng.

---

## 2. Quản Trị Rủi Ro Kiến Trúc & Vận Hành (Risk Register)

| Mã Rủi Ro | Phân Loại | Mô Tả Rủi Ro | Mức Độ | Tác Động | Biện Pháp Kiểm Soát & Giảm Thiểu |
|---|---|---|---|---|---|
| **R-01** | Security | Lộ mật khẩu mặc định qua fallback file test E2E | **Cao** | Người ngoài có thể dò mật khẩu nếu môi trường staging dùng lại chuỗi này | Xóa bỏ fallback chuỗi `"Admin@123456"` trong test, buộc đọc từ biến môi trường bí mật. |
| **R-02** | Security | Bỏ lọt kiểm tra loại người dùng ở tầng API Portal | **Cao** | Người dùng mang role khác có thể thao tác với endpoint sinh viên | Bổ sung Guard phân quyền theo `userType` ở Backend (Blocker B1). |
| **R-03** | Data Integrity| Ghép dữ liệu vé theo tên người tham dự | **Trung bình** | Trùng lặp hoặc gán sai vé cho tài khoản có cùng họ tên | Chỉ ánh xạ vé thông qua `userId` và mã vé duy nhất đã xác minh (Blocker B5). |
| **R-04** | Operational | Mất dữ liệu cấu hình Tour khi đổi máy tính | **Trung bình** | Người quản trị sửa góc nhìn trên máy này nhưng máy khác không thấy | Chuyển luồng lưu từ `localStorage` sang API backend PostgreSQL. |
| **R-05** | Documentation| Tài liệu `PROJECT_STATUS.md` bị lệch pha so với Git | **Thấp** | Tech Lead mới tiếp nhận có thể hiểu nhầm dự án chưa làm M1–M4 | Cập nhật ngay bảng trạng thái chuẩn xác phản ánh commit mới nhất. |
