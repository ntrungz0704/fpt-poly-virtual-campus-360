# KIỂM TOÁN LOGIC NGHIỆP VỤ & CÁC TRƯỜNG HỢP BIÊN (06-BUSINESS-LOGIC-AUDIT)
## FPT Polytechnic Virtual Campus 360°

---

## 1. Module Xác Thực & Quản Lý Phiên (Authentication & Session)
- **Happy Path:** Người dùng nhập identifier (Email, SĐT hoặc Username) và mật khẩu hợp lệ → Backend xác thực Argon2id → Trả về accessToken (RAM) và gán Cookie `refresh_token` HttpOnly → Chuyển hướng đúng vai trò (`/admin` cho Admin, `/portal` cho Sinh viên).
- **Negative Path:**
  - Nhập sai mật khẩu: Tăng `failedLoginAttempts`. Khi đạt 5 lần, tài khoản bị khóa trong 15 phút (`lockedUntil`), mọi lần thử tiếp theo bị chặn với HTTP 401.
  - Tái sử dụng Refresh Token (Token Reuse Attack): Khi một refresh token cũ đã bị xoay vòng được gửi lại, backend phát hiện trùng `familyId` và ngay lập tức thu hồi toàn bộ các token trong cùng gia đình, buộc kẻ tấn công và nạn nhân phải đăng nhập lại.
- **Idempotency:** Đăng xuất nhiều lần đều trả về thành công và xóa sạch trạng thái cookie an toàn.

---

## 2. Module Open Day & Check-in QR
- **Happy Path:** Người dùng điền form tại `/events` → Backend kiểm tra định dạng email và SĐT → Sinh mã vé ngẫu nhiên duy nhất `OD26-XXXX-XXXX` → Lưu vào `event_participations` → Client hiển thị mã QR SVG và lưu mã vé vào `localStorage` để tra cứu lại.
- **Negative Path:**
  - Đăng ký trùng lặp (Duplicate Registration): Người dùng đăng ký lại cùng một email cho cùng một sự kiện sẽ bị từ chối với lỗi HTTP `409 Conflict` (`DUPLICATE_REGISTRATION`).
  - Điểm danh lặp (Duplicate Check-in): Khi quét mã vé đã điểm danh, backend kiểm tra `checked_in_at !== null` và trả về thông báo lỗi "Vé đã được sử dụng trước đó", ngăn chặn việc một vé vào cửa nhiều người.
- **Audit Logging:** Mỗi thao tác check-in thành công đều tự động ghi một bản ghi vào bảng `audit_logs` với đầy đủ ID quản trị viên, mã vé và thời điểm thực tế.

---

## 3. Module Gamification (Quiz & Vòng Quay May Mắn)
- **Happy Path:**
  - Làm bài Quiz: Client nộp mảng câu trả lời → Server đối soát với đáp án đúng trong DB → Tính 20 XP cho mỗi câu đúng và thưởng 40 XP khi đạt điểm tuyệt đối → Ghi lịch sử `quiz_attempts` và ghi sổ cái `xp_ledgers` trong 1 Database Transaction.
  - Quay thưởng Spin Wheel: Server kiểm tra số lượt quay còn lại của `participantKey` → Sinh số ngẫu nhiên an toàn → Chọn phần quà từ danh mục quà còn số lượng (`stock > 0`) → Trừ `stock` và lưu `user_spin_histories`.
- **Chống Gian Lận (Anti-Cheat):**
  - Điểm số không được gửi từ client lên, hoàn toàn do backend tính toán độc lập.
  - Cơ chế Transaction trong Prisma đảm bảo nếu việc trừ quà thất bại (hết hàng cùng thời điểm) thì giao dịch quay thưởng sẽ bị rollback, chống race condition.

---

## 4. Module Cổng Sinh Viên & Phụ Huynh (Portal M4)
- **Happy Path:**
  - Sinh viên xem và cập nhật hồ sơ cá nhân: Cập nhật thành công lưu trực tiếp vào bảng `users`.
  - Phụ huynh gửi yêu cầu liên kết: Nhập email/mã SV của con em → Tạo bản ghi `parent_student_links` với status `PENDING`. Sinh viên đăng nhập vào `/parent` thấy yêu cầu và bấm Duyệt (`APPROVE`). Sau khi duyệt, phụ huynh xem được chi tiết vé và tiến trình của con em.
- **Các Điểm Cần Cải Thiện (Blocker Remediation theo GPT Mentor):**
  - **B1 (Role Enforcement):** Cần chặn tài khoản không phải `STUDENT` gọi API sinh viên, và chặn tài khoản không phải `PARENT` gọi API phụ huynh.
  - **B2 (XP Aggregation):** Cần sửa hàm tính tổng XP trong `portal.service.ts` để tính trên toàn bộ lịch sử thay vì giới hạn 10 giao dịch gần nhất.
  - **B5 (Ownership):** Loại bỏ việc liên kết theo tên (`attendeeName`) để tránh nhầm lẫn dữ liệu giữa hai người dùng trùng tên.
