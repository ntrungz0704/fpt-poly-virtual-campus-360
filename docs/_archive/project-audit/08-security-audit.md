# 08. KIỂM TOÁN XÁC THỰC & BẢO MẬT (AUTHENTICATION & SECURITY AUDIT)

Kiểm toán toàn bộ hệ thống bảo mật theo Mục 13 của đề bài và kiến trúc xác nhận (tài khoản cấp bởi nhà trường qua Excel/CSV, hash mật khẩu an toàn, đổi mật khẩu bắt buộc lần đầu, RBAC + NestJS Guards).

---

## 1. Kết Luận An Ninh Trọng Tâm

> **Cảnh báo Đỏ (`CRITICAL`):** Hệ thống hiện tại **KHÔNG CÓ BẤT KỲ CƠ CHẾ XÁC THỰC HAY PHÂN QUYỀN NÀO**. Toàn bộ `/portal` (Cổng Sinh viên/Phụ huynh) và `/admin` (CMS Quản trị) đều mở công khai không kiểm tra phiên; màn hình `/login` thực chất chỉ làm hiệu ứng chờ 600ms và điền sẵn mật khẩu demo.

---

## 2. Bảng Kiểm Tra 17 Hạng Mục Bảo Mật (Section 13)

| # | Hạng mục kiểm toán | Trạng thái | Bằng chứng quan sát thực tế & Rủi ro |
|---|---|---|---|
| 1 | **Login** | **S2 (Giả lập)** | `apps/web/src/app/(auth)/login/page.tsx:10-11` điền sẵn `PS24180` và `polytechnic2025`. Khi submit, chỉ kiểm tra rỗng bằng state, `setTimeout(600ms)` rồi `router.push("/portal")`. Giao diện còn **ghi sai sự thật** nhãn `"TLS 1.3 & HASH BCRYPT"` và `"ISO/IEC 27001"`. |
| 2 | **Logout** | **S0** | Chưa có phiên đăng nhập thật nên các nút thoát/đóng ở `(portal)/layout.tsx` và `admin/layout.tsx` chỉ là thẻ `<a href="/login">` hoặc `<Link href="/">` chuyển hướng URL đơn thuần, không thu hồi token/cookie. |
| 3 | **Refresh Token** | **S0** | Không có token, không có cookie (`0` lượt dùng `localStorage`/`sessionStorage`/`document.cookie` trong toàn bộ `apps/web/src`). |
| 4 | **Password Hashing** | **S0** | Chưa có Backend NestJS; chưa cài `bcrypt` hay `argon2`. |
| 5 | **Password Reset** | **S0** | Link/luồng quên mật khẩu chưa được cài đặt ở Frontend lẫn Backend. |
| 6 | **Forced Password Change** | **S0** | Chưa có cờ `mustChangePassword`, chưa có Guard chặn mọi API cho đến khi user đổi mật khẩu tạm được cấp từ file Excel/CSV. |
| 7 | **RBAC (Role-Based Access Control)** | **S0** | `packages/shared/src/index.ts:18-26` mới định nghĩa enum kiểu TypeScript `UserRole` (`GUEST`, `STUDENT`, `PARENT`, `TEACHER`, `CONTENT_EDITOR`, `EVENT_MANAGER`, `ADMIN`, `SUPER_ADMIN`), nhưng **chưa có thực thi ở cả Next.js lẫn NestJS**. |
| 8 | **API Guards** | **S0** | Chưa có `apps/api`, chưa có `JwtAuthGuard`, `RolesGuard`, `PermissionsGuard`. |
| 9 | **Input Validation** | **Yếu (`S2`)** | Các form ở Frontend (`QuickAdmissionForm`, `contact`, `TicketRegistrationModal`, `login`) chỉ dùng thuộc tính `required` HTML5, không có Zod schema hoặc `class-validator` DTO ở server. |
| 10 | **SQL Injection** | **S0 (Chưa áp dụng DB)** | Chưa có DB; khi triển khai bắt buộc dùng Prisma parameterized queries và cấm nối chuỗi trong `$queryRawUnsafe`. |
| 11 | **XSS (Cross-Site Scripting)** | **RỦI RO TRUNG BÌNH** | Quét toàn mã nguồn `apps/web/src` phát hiện **`2` chỗ dùng `dangerouslySetInnerHTML`** ở `apps/web/src/app/layout.tsx:39,47`. Dù hiện đang chứa chuỗi tĩnh tự viết, cần loại bỏ hoàn toàn kỹ thuật tiêm script nội tuyến và sau này khi render bài viết `NewsArticle` HTML/Markdown từ Admin CMS bắt buộc phải sanitize qua `DOMPurify` + bật `CSP`. |
| 12 | **CSRF Considerations** | **S0** | Chưa có API cookie session; khi cài JWT qua `HttpOnly` cookie giữa Next.js và NestJS phải cấu hình `SameSite=Lax` + CSRF double-submit hoặc custom header check cho các request ghi dữ liệu. |
| 13 | **CORS** | **S0** | Chưa có Backend NestJS. Phải whitelist đúng domain frontend (`NEXT_PUBLIC_APP_URL`), không dùng `origin: '*'` khi `credentials: true`. |
| 14 | **Rate Limiting** | **S0** | Chưa có giới hạn tần suất cho `/login`, `/contact`, `/events/register`, `/games/spin`. Rất dễ bị script spam hàng nghìn vé Open Day hoặc brute-force MSSV. |
| 15 | **File Upload Security** | **S0** | Chưa có upload; khi triển khai Admin CMS upload `.jpg/.webp/.glb`, bắt buộc dùng Presigned URL có giới hạn `content-length-range`, kiểm tra magic bytes (không chỉ tin `Content-Type`/đuôi file) và cô lập domain lưu trữ media (Cloudflare R2/S3). |
| 16 | **Sensitive Env Variables** | **RỦI RO CAO** | `.env.example` và `docker-compose.yml` để sẵn chuỗi secret/mật khẩu mẫu (`fpt_poly_secret_2026`, `fpt_virtual_campus_jwt_secret_key_super_secure_2026`). Rủi ro kỹ sư copy nguyên file mẫu lên server mà không sinh secret ngẫu nhiên mới. Ngoài ra `login/page.tsx` hardcode sẵn thông tin đăng nhập demo trên giao diện công khai. |
| 17 | **Audit Logs** | **S0** | Chưa có logging hành vi đăng nhập, import danh sách tài khoản, sửa phân quyền, xóa/xuất bản nội dung 360°/CMS. |

---

## 3. Lỗ Hổng Đặc Thù Ở Tầng Frontend Hiện Tại

1. **Hoàn toàn thiếu bảo vệ Route (Even at Frontend Level):**
   - Người dùng ẩn danh truy cập thẳng `http://localhost:3000/admin` vẫn vào được giao diện Admin CMS; truy cập `/portal` vẫn thấy đầy đủ thông tin cá nhân & vé của sinh viên `"Nguyễn Hoàng Nam (PS24180)"`.
2. **Ghi đè hàm gốc trình duyệt (`apps/web/src/app/layout.tsx:46-127`):**
   - Chèn IIFE sửa đổi `Element.prototype.setAttribute`, nuốt lỗi `console.error` chứa từ `"hydration"` và chặn `window.addEventListener('error', ..., true)` để xử lý extension Cốc Cốc. Cách làm này tiềm ẩn nguy cơ che giấu ngoại lệ runtime hoặc làm gãy các thư viện bên thứ 3 (Marzipano/R3F/CSP strict khi bỏ `'unsafe-inline'`).
3. **Thông số bảo mật gây hiểu nhầm trên UI:**
   - Xóa hoặc tạm ẩn huy hiệu `"TLS 1.3 & HASH BCRYPT"`, `"ISO/IEC 27001"` tại `login/page.tsx` cho tới khi backend thật sự đạt chuẩn hashing + HTTPS.
4. **Quy tắc bắt buộc khi làm Backend:**
   - **Không bao giờ** chỉ bảo vệ trang `/admin` hoặc `/portal` bằng Next.js Middleware hay kiểm tra state ở React. Mọi thao tác đọc dữ liệu riêng tư (`/portal`, `/registrations/my`), ghi dữ liệu CMS, import CSV/Excel tài khoản và thống kê Admin **bắt buộc** phải đi qua xác thực JWT + `@Roles()`/`@Permissions()` Guards trên NestJS API.
