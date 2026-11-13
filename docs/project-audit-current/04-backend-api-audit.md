# KIỂM TOÁN CHI TIẾT TOÀN BỘ BACKEND & RESTFUL API (04-BACKEND-API-AUDIT)
## FPT Polytechnic Virtual Campus 360°

- **Framework:** NestJS 11 (Modular Monolith)
- **Cơ sở dữ liệu:** PostgreSQL 16 qua Prisma ORM 5.22
- **Base URL:** `http://localhost:4000/api/v1`

---

## 1. Danh Mục Các Module & Controllers Backend

| Module Tên | Controller | File Path | Mục Đích Nghiệp Vụ |
|---|---|---|---|
| **AuthModule** | `AuthController` | `apps/api/src/modules/auth/auth.controller.ts` | Đăng nhập, làm mới phiên, đăng xuất, đổi mật khẩu, kích hoạt tài khoản |
| **UsersRbacModule** | `AdminUsersController` | `apps/api/src/modules/users-rbac/admin-users.controller.ts`| Quản lý tài khoản, danh sách user, cấp quyền RBAC |
| **PublicModule** | `PublicController` | `apps/api/src/modules/public/public.controller.ts` | Cung cấp dữ liệu công khai cơ sở, tòa nhà, tour 360, địa điểm |
| **OpenDayModule** | `OpenDayController` | `apps/api/src/modules/open-day/open-day.controller.ts` | Đăng ký vé Open Day công khai, quản trị sự kiện, check-in QR |
| **GamificationModule**| `GamificationController` | `apps/api/src/modules/gamification/gamification.controller.ts`| Chấm điểm Quiz server-side, Vòng quay may mắn, Bảng xếp hạng XP |
| **PortalModule** | `PortalController` | `apps/api/src/modules/portal/portal.controller.ts` | Dữ liệu Cổng Sinh viên (/portal/*) và Cổng Phụ huynh (/parent/*) |
| **MediaModule** | `MediaController` | `apps/api/src/modules/media/media.controller.ts` | Quản lý tệp media, cấp presigned URL, kiểm tra SHA-256 |
| **AuditLogModule** | `AuditLogController` | `apps/api/src/modules/audit-log/audit-log.controller.ts` | Ghi nhận và tra cứu lịch sử thao tác hệ thống |
| **HealthModule** | `HealthController` | `apps/api/src/modules/health/health.controller.ts` | Giám sát liveness/readiness probe hệ thống |

---

## 2. Bảng Thống Kê Chi Tiết Từng API Endpoint

| Phương Thức & Đường Dẫn | Bảo Mật / Phân Quyền | Input DTO & Validation | Xử Lý Database | Frontend Consumer |
|---|---|---|---|---|
| `POST /auth/login` | `@Public()`, `@Throttle(5/60s)` | `LoginDto` (`identifier`, `password`) | Tìm user, so khớp Argon2id, tạo refresh_token | `apps/web/src/lib/auth/api-client.ts` |
| `POST /auth/refresh` | `@Public()`, Cookie Refresh | Đọc `refresh_token` từ Cookie | Kiểm tra Family ID, xoay vòng token | `apps/web/src/lib/auth/api-client.ts` |
| `POST /auth/logout` | `JwtAuthGuard` | N/A | Thu hồi token gia đình, xóa Cookie | `apps/web/src/lib/auth/api-client.ts` |
| `GET /auth/me` | `JwtAuthGuard` | N/A | Tìm user theo JWT sub, nạp roles/permissions | `apps/web/src/lib/auth/api-client.ts` |
| `PATCH /auth/me/password` | `JwtAuthGuard` | `ChangePasswordDto` (mật khẩu >= 12 ký tự) | So khớp mật khẩu cũ, hash Argon2id mật khẩu mới | `apps/web/src/app/(auth)/change-password` |
| `GET /public/campus` | `@Public()`, `@Throttle` | N/A | Đọc bảng `campuses` (QTSC) và các tòa nhà liên kết | `apps/web/src/lib/campus-api.ts` |
| `GET /public/locations` | `@Public()`, `@Throttle` | Query filters (building, floor, type) | Đọc `locations` kèm quan hệ tòa nhà | `apps/web/src/lib/campus-api.ts` |
| `GET /public/tour-nodes` | `@Public()`, `@Throttle` | N/A | Đọc các `tour_nodes` có trạng thái PUBLISHED | `apps/web/src/components/tour/PanoramaStage` |
| `GET /public/events` | `@Public()`, `@Throttle` | N/A | Đọc sự kiện Open Day, phiên hoạt động, FAQ | `apps/web/src/app/(public)/events/page.tsx` |
| `POST /public/events/register` | `@Public()`, `@Throttle(10/60s)` | `TicketRegistrationDto` (email, phone, name) | Tạo `event_participations` với mã vé `OD26-*` | `apps/web/src/components/events/Registration`|
| `POST /open-day/check-in` | `JwtAuthGuard`, `events:write` | `CheckInTicketDto` (`ticketCode`) | Cập nhật `checked_in_at`, ghi `AuditLog` | `apps/web/src/app/admin/events/page.tsx` |
| `POST /gamification/quiz/submit`| `@Public()`, `@Throttle(15/60s)`| `SubmitQuizDto` (answers array) | Chấm điểm server, ghi `quiz_attempts`, cộng XP | `apps/web/src/app/(public)/games/page.tsx` |
| `POST /gamification/spin` | `@Public()`, `@Throttle(10/60s)`| `SpinRequestDto` (`participantKey`) | Kiểm tra lượt, random quà, trừ tồn kho, ghi log | `apps/web/src/components/games/SpinWheel` |
| `GET /gamification/leaderboard` | `@Public()`, `@Throttle` | N/A | Group by `xp_ledgers`, sắp xếp top 10 điểm cao | `apps/web/src/components/games/Leaderboard`|
| `GET /portal/profile` | `JwtAuthGuard` | N/A | Đọc `users` (`major`, `bio`, `studentCode`) | `apps/web/src/lib/portal/portal-api.ts` |
| `PATCH /portal/profile` | `JwtAuthGuard` | `UpdateProfileDto` | Cập nhật bio, major, sđt vào bảng `users` | `apps/web/src/app/(portal)/portal/profile`|
| `GET /portal/tickets` | `JwtAuthGuard` | N/A | Đọc `event_participations` của tài khoản | `apps/web/src/app/(portal)/portal/tickets`|
| `GET /portal/schedule` | `JwtAuthGuard` | N/A | Đọc `open_day_sessions` và đối chiếu vé đã có | `apps/web/src/app/(portal)/portal/schedule`|
| `GET /portal/gamification` | `JwtAuthGuard` | N/A | Đọc `xp_ledgers` và `user_spin_histories` | `apps/web/src/app/(portal)/portal/progress`|
| `GET /parent/students` | `JwtAuthGuard` | N/A | Đọc `parent_student_links` theo `parentId` | `apps/web/src/app/(portal)/parent/page.tsx`|
| `GET /parent/students/:id` | `JwtAuthGuard` | Param `studentId` | Kiểm tra quan hệ APPROVED, trả chi tiết con em | `apps/web/src/app/(portal)/parent/page.tsx`|
| `POST /parent/links` | `JwtAuthGuard` | `CreateLinkRequest` (`studentIdentifier`) | Tìm học sinh, tạo bản ghi link status PENDING | `apps/web/src/app/(portal)/parent/page.tsx`|
| `POST /portal/links/:id/respond`| `JwtAuthGuard` | `RespondLinkRequest` (`APPROVE/REJECT`) | Cập nhật `parent_student_links.status` | `apps/web/src/app/(portal)/parent/page.tsx`|

---

## 3. Các Điểm Cần Lưu Ý Khi Tích Hợp API
1. **ValidationPipe chặt chẽ:** Toàn bộ API áp dụng `whitelist: true`, `forbidNonWhitelisted: true`, tự động từ chối request nếu gửi trường thừa hoặc kiểu dữ liệu sai.
2. **Double CSRF Protection:** Middleware kiểm tra header `X-Requested-With` và so khớp token bảo vệ trên các request thay đổi trạng thái.
3. **Chống N+1 Query:** Các câu truy vấn `findFirst`/`findMany` trong `portal.service.ts` và `public.service.ts` đều sử dụng mệnh đề `include` để nạp dữ liệu một lần thay vì truy vấn lặp trong vòng lặp.
