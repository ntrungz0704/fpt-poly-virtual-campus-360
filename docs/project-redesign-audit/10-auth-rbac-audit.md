# 10 — KIỂM TOÁN XÁC THỰC & MA TRẬN PHÂN QUYỀN (AUTH & RBAC AUDIT)

## 1. 6 Vai Trò Người Dùng Trong Hệ Thống

1. **Khách Công Cộng (Public Visitor):** Người dùng vãng lai chưa đăng nhập (học sinh THPT, phụ huynh tìm hiểu thông tin, khách tham quan).
2. **Sinh Viên (Student):** Sinh viên chính thức của trường có tài khoản thuộc hệ thống, quản lý hồ sơ, vé sự kiện, điểm XP gamification.
3. **Phụ Huynh (Parent):** Phụ huynh của sinh viên, gửi yêu cầu liên kết và theo dõi tiến độ của con sau khi sinh viên chấp thuận.
4. **Cán Bộ Sự Kiện (Staff / Event Operator):** Nhân viên phụ trách đón tiếp, quét mã QR check-in tại cổng và quản lý các phiên hội thảo Open Day.
5. **Quản Trị Viên (Admin):** Quản lý nội dung campus, địa điểm, phòng ốc, thư viện hình ảnh và kịch bản Tour 360°.
6. **Quản Trị Tối Cao (Super Admin):** Toàn quyền hệ thống, quản lý tài khoản người dùng, phân vai trò, gán quyền và xem nhật ký audit log.

---

## 2. Ma Trận Phân Quyền Chi Tiết (Role-Based Access Control Matrix)

| Chức năng / Tài nguyên | Visitor | Student | Parent | Staff | Admin | Super Admin | Kiểm chứng kỹ thuật |
|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| **Xem Tour 360°, Bản đồ, Địa điểm** |  Cho phép |  Cho phép |  Cho phép |  Cho phép |  Cho phép |  Cho phép | Public Endpoint (`/api/v1/public/*`) |
| **Đăng ký vé sự kiện Open Day** |  Cho phép |  Cho phép |  Cho phép |  Cho phép |  Cho phép |  Cho phép | `POST /public/events/register` |
| **Làm bài Quiz & Quay số may mắn** |  Cho phép |  Cho phép |  Cho phép |  Cho phép |  Cho phép |  Cho phép | `POST /gamification/*` |
| **Cổng Sinh Viên (`/portal/*`)** | ❌ Chặn |  **Chính** | ❌ Chặn (403) | ❌ Chặn | ❌ Chặn | ❌ Chặn | `enforceStudentRole` trên Backend |
| **Cổng Phụ Huynh (`/parent/*`)** | ❌ Chặn | ❌ Chặn (403) |  **Chính** | ❌ Chặn | ❌ Chặn | ❌ Chặn | `enforceParentRole` trên Backend |
| **Xem chi tiết hồ sơ con em** | ❌ Chặn | ❌ Chặn |  Chỉ khi APPROVED | ❌ Chặn |  Hỗ trợ |  Toàn quyền | Check quan hệ `parent_student_links` |
| **Quét mã QR Check-in Open Day** | ❌ Chặn | ❌ Chặn | ❌ Chặn |  **Chính** |  Toàn quyền |  Toàn quyền | Role: `EVENT_OPERATOR`, `ADMIN` |
| **Quản trị Địa điểm, Bản đồ, 360** | ❌ Chặn | ❌ Chặn | ❌ Chặn | ❌ Chặn |  **Chính** |  Toàn quyền | Role: `ADMIN`, `SUPER_ADMIN` |
| **Quản trị Tài khoản & Phân quyền** | ❌ Chặn | ❌ Chặn | ❌ Chặn | ❌ Chặn | ❌ Chặn |  **Duy nhất** | Role: `SUPER_ADMIN` |
