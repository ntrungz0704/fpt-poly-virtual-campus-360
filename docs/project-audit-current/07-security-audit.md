# BÁO CÁO KIỂM TOÁN AN TOÀN THÔNG TIN & BẢO MẬT (07-SECURITY-AUDIT)
## FPT Polytechnic Virtual Campus 360°

---

## 1. Bảng Đánh Giá Mức Độ An Toàn Các Trụ Cột Bảo Mật

| Trụ Cột An Toàn | Trạng Thái | Cơ Chế Kiểm Soát Kỹ Thuật | Đánh Giá Rủi Ro |
|---|---|---|---|
| **Mật khẩu & Băm mật khẩu** | **AN TOÀN** | Sử dụng thuật toán **Argon2id** (`m=65536, t=3, p=1`). Mật khẩu tối thiểu 12 ký tự gồm chữ hoa, chữ thường, số, ký tự đặc biệt. | Thấp |
| **Bảo vệ Access Token** | **AN TOÀN** | Lưu thuần trong bộ nhớ biến JavaScript (`inMemoryAccessToken`). Tuyệt đối không lưu vào `localStorage` hay `sessionStorage`. | Thấp |
| **Bảo vệ Refresh Token** | **AN TOÀN** | Cookie Opaque Token 256-bit với thuộc tính `HttpOnly`, `SameSite=Lax`, `Path=/api/v1/auth`. Tự động xoay vòng mỗi lần refresh. | Thấp |
| **Phát hiện Tái sử dụng Token** | **AN TOÀN** | Quản lý theo `family_id`. Nếu một refresh token cũ được gửi lại, backend vô hiệu hóa toàn bộ gia đình token ngay lập tức. | Thấp |
| **Chống Tấn Công Brute-Force** | **AN TOÀN** | Khóa tài khoản 15 phút sau 5 lần nhập sai liên tiếp (`failedLoginAttempts >= 5`). Giới hạn tần suất `@Throttle(5/60s)`. | Thấp |
| **Chống Tấn Công CSRF** | **AN TOÀN** | Kiểm tra nghiêm ngặt header `X-Requested-With: XMLHttpRequest` và cấu hình CORS chặt chẽ theo danh sách `allowedOrigins`. | Thấp |
| **Kiểm Soát Tải Lên Tệp (Upload)** | **AN TOÀN** | Cấp `UploadToken` ngắn hạn có gắn `sha256Checksum`, kích thước tối đa, kiểm tra định dạng MIME và magic bytes tệp JPEG/PNG. | Thấp |
| **Chống Tấn Công SQL Injection** | **AN TOÀN** | Sử dụng 100% Prisma ORM với cơ chế Parameterized Queries, không sử dụng câu lệnh SQL raw ghép chuỗi không an toàn. | Thấp |

---

## 2. Các Lỗ Hổng & Điểm Cần Cải Thiện Được Phát Hiện (Vulnerabilities & Remediations)

### Lỗ Hổng 1: Fallback mật khẩu mặc định trong file E2E test (Mức độ: P1 - High)
- **Vị trí:** `apps/web/e2e/portal-flow.spec.ts` (dòng 4)
- **Bằng chứng:** `const ADMIN_PASSWORD = process.env.ADMIN_BOOTSTRAP_PASSWORD || "Admin@123456";`
- **Tác động:** Khi repository công khai trên GitHub, chuỗi fallback này có thể bị kẻ xấu khai thác nếu môi trường thử nghiệm dùng lại mật khẩu mặc định.
- **Phương án khắc phục:** Xóa bỏ hoàn toàn fallback `"Admin@123456"`. Buộc test phải đọc từ biến môi trường `ADMIN_BOOTSTRAP_PASSWORD` hoặc dừng test nếu thiếu.

### Lỗ Hổng 2: Thiếu Backend Role Guard trên API Portal (Mức độ: P1 - High)
- **Vị trí:** `apps/api/src/modules/portal/portal.controller.ts`
- **Bằng chứng:** Các endpoint `/portal/*` và `/parent/*` chỉ dùng `JwtAuthGuard` mà chưa có Guard kiểm tra loại người dùng `userType === "STUDENT"` hoặc `userType === "PARENT"`.
- **Tác động:** Người dùng mang role khác (hoặc phụ huynh) có thể gọi trực tiếp API sinh viên nếu biết endpoint và sở hữu token hợp lệ.
- **Phương án khắc phục:** Thêm `PortalUserTypeGuard` tại backend để kiểm tra chặt chẽ `userType` của actor trước khi thực thi nghiệp vụ.

### Lỗ Hổng 3: Ghép dữ liệu theo tên mập mờ trong hàm lấy vé (Mức độ: P2 - Medium)
- **Vị trí:** `apps/api/src/modules/portal/portal.service.ts`
- **Bằng chứng:** Trong `getTickets()` và `getSchedule()`, điều kiện truy vấn sử dụng `OR: [{ userId }, { attendeeEmail: user.email }]`. Trong `getProfile()`, có đoạn cộng XP theo `attendeeName = user.fullName`.
- **Tác động:** Nếu có hai người dùng trùng họ tên hoặc email khách chưa được gán chính xác `userId`, dữ liệu vé/XP có thể bị hiển thị chéo.
- **Phương án khắc phục:** Chỉ đối soát quyền sở hữu vé thông qua `userId` đã được định danh chính thức trong database.

### Lỗ Hổng 4: Nút lưu cấu hình Tour mới lưu ở client (Mức độ: P2 - Medium)
- **Vị trí:** `apps/web/src/app/admin/virtual-tour/page.tsx`
- **Bằng chứng:** Hàm `handleSaveTourConfiguration()` ghi trực tiếp vào `localStorage.setItem("vc_admin_tour_scenes", ...)` và hiển thị thông báo "thành công".
- **Tác động:** Người dùng tưởng cấu hình đã lưu vào hệ thống máy chủ, nhưng khi đổi trình duyệt hoặc thiết bị khác thì cấu hình không còn.
- **Phương án khắc phục:** Ghi rõ trên giao diện là "Bản nháp cục bộ trên trình duyệt" hoặc xây dựng API Backend `PUT /admin/tour/configuration` lưu trực tiếp vào các bảng `tour_nodes` và `hotspots`.
