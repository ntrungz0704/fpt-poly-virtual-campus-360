# 08 — ĐÁNH GIÁ MỨC ĐỘ HOÀN THIỆN TÍNH NĂNG (FEATURE COMPLETENESS AUDIT)

Thang đo đánh giá độ hoàn thiện chuẩn quốc tế:
- **S0:** Chưa bắt đầu.
- **S1:** Dựng khung file rỗng.
- **S2:** Prototype UI mock dữ liệu tĩnh.
- **S3:** Đã code logic Backend/Frontend.
- **S4:** Đã kết nối API thật hai chiều.
- **S5:** Đã có kiểm thử tự động xác minh (VERIFIED).
- **S6:** Sẵn sàng môi trường Production (PRODUCTION READY).

---

## Bảng Đánh Giá Chi Tiết Từng Module Nghiệp Vụ

| Mã | Module nghiệp vụ | UI | API | Database | Auth / RBAC | Tests | Mức độ | Đánh giá thực tế |
|:---:|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| **F-01** | Xác thực tập trung (`/login`) | Có | Có | Có | Có | E2E + Unit | **S6** | Hỗ trợ đăng nhập đa vai trò, băm Argon2id, cookie rotation. |
| **F-02** | Buộc đổi mật khẩu (`/change-password`) | Có | Có | Có | Có | Unit | **S6** | Ép tài khoản mới tạo đổi mật khẩu $ge$ 12 ký tự trước khi vào hệ thống. |
| **F-03** | Khám phá Tour 360° (`/campus`) | Có | Có | Có | Public | Runtime | **S5** | Load node 360 thật, chuyển cảnh theo edge, hiển thị hotspot tương tác. |
| **F-04** | Bản đồ số khuôn viên (`/map`) | Có | Có | Có | Public | Runtime | **S5** | Bản đồ Leaflet với tọa độ tòa nhà QTSC thật, popup thông tin chi tiết. |
| **F-05** | Danh mục địa điểm (`/locations`) | Có | Có | Có | Public | Unit | **S5** | Phân loại phòng lab, hội trường, thư viện kèm slug chuẩn SEO. |
| **F-06** | Đăng ký sự kiện Open Day | Có | Có | Có | Public | Unit | **S6** | Validate số điện thoại Việt Nam, sinh mã vé canonical `OD26-...`. |
| **F-07** | Vé Open Day & QR Check-in | Có | Có | Có | STUDENT | E2E + Unit | **S6** | Check-in QR tại cổng sự kiện, chống check-in lặp, ghi nhận điểm danh. |
| **F-08** | Minigame trắc nghiệm (Quiz) | Có | Có | Có | Public/User | Unit | **S5** | Nộp bài tính điểm bảo mật server-side, cộng XP khi đạt $ge$ 60%. |
| **F-09** | Vòng quay may mắn (Spin Wheel) | Có | Có | Có | Public/User | Unit | **S5** | Tính lượt quay hợp lệ dựa trên vé và XP, tỷ lệ trúng thưởng cân bằng. |
| **F-10** | Cổng sinh viên - Hồ sơ & Bio | Có | Có | Có | STUDENT | E2E | **S6** | Xem và cập nhật bio, hiển thị chuyên ngành và mã sinh viên. |
| **F-11** | Cổng sinh viên - Tiến trình XP | Có | Có | Có | STUDENT | E2E | **S6** | Tổng hợp chính xác sổ cái XP (120 XP), hiển thị cấp bậc không rò rỉ. |
| **F-12** | Cổng phụ huynh - Xem tin con em | Có | Có | Có | PARENT | E2E | **S6** | Chống IDOR triệt để: chỉ xem được con em khi liên kết ở trạng thái `APPROVED`. |
| **F-13** | Phụ huynh - Gửi yêu cầu liên kết | Có | Có | Có | PARENT | E2E | **S6** | Kiểm tra tài khoản đích phải là `STUDENT` đang `ACTIVE`. |
| **F-14** | Sinh viên - Duyệt yêu cầu liên kết| Có | Có | Có | STUDENT | E2E | **S6** | Cập nhật nguyên tử (`updateMany`), chống sinh viên khác can thiệp. |
| **F-15** | Admin - Quản lý sự kiện | Có | Có | Có | OPERATOR | Unit | **S5** | CRUD sự kiện Open Day, phiên tham quan, câu hỏi FAQ và Quiz. |
| **F-16** | Admin - Quản lý địa điểm | Có | Có | Có | ADMIN | Runtime | **S5** | Thêm sửa địa điểm, tự động tạo slug tiếng Việt và ảnh mặc định. |
| **F-17** | Admin - Quản lý kho Media | Có | Có | Có | ADMIN | Unit | **S5** | Upload ảnh, kiểm tra magic bytes nhị phân chống mã độc. |
| **F-18** | Admin - Quản lý người dùng & RBAC| Có | Có | Có | SUPER_ADMIN | Unit | **S5** | Xem danh sách tài khoản, khóa/mở tài khoản, gán vai trò. |
| **F-19** | Admin - Biên tập Tour 360° | Có | Có | Có | ADMIN | Runtime | **S4** | Đặt điểm ghim hotspot, lưu cấu hình bản nháp vào Local Storage. |
