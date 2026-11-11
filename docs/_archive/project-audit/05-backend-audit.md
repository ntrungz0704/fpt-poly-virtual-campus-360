# 05. KIỂM TOÁN BACKEND (NESTJS MODULAR MONOLITH)

Kiểm toán toàn bộ hiện trạng tầng Backend API theo đúng danh sách 23 mô-đun và 10 hạng mục chi tiết tại Mục 9 của đề bài.

---

## 1. Kết Luận Tổng Quát Về Backend

- **Trạng thái tổng thể:** **`S0 – NOT STARTED` (0%)**
- **Bằng chứng thực tế trong workspace (`E:\Virtual Campus FPT Poly`):**
  - Thư mục `apps/api` **HOÀN TOÀN KHÔNG TỒN TẠI** (kiểm tra `Get-ChildItem apps`: chỉ có duy nhất `apps/web`).
  - Không có `nest-cli.json`, không có `src/main.ts`, không có `src/app.module.ts`, không có controller, service, DTO, guard, interceptor hay API route handler nào (kể cả Next.js Route Handlers `apps/web/src/app/api/**` cũng bằng `0`).
  - Trong `README.md:10` ghi chú rõ: *"Backend NestJS REST API ... (Triển khai ở Giai đoạn sau)"*.
  - File `.env.example:11-14` có khai báo biến mẫu `NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1` và `API_PORT=4000`, nhưng hiện tại không có dịch vụ nào lắng nghe ở cổng `4000`, và toàn bộ `apps/web/src/` có **`0` lệnh `fetch()`**.

---

## 2. Kiểm Tra Từng Mô-Đun Trong 23 NestJS Modules (Section 9)

Mọi mô-đun trong kiến trúc đích đều đang ở mức **`S0 – NOT STARTED`**. Bảng dưới đây kiểm tra đầy đủ 10 tiêu chí (Module definition, Controllers, Services, DTOs, Entities/Prisma models, Guards, Validation, Error handling, Swagger/API docs, Tests) và liệt kê rõ tập endpoint tối thiểu còn thiếu:

| # | Tên Module | Status | Định nghĩa / Controller / Service / DTO / Guard / Test | Endpoint REST API tối thiểu cần xây dựng (`/api/v1/...`) |
|---|---|---|---|---|
| 01 | `AuthModule` | **S0** | Chưa có (`0/10` hạng mục) | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/change-password` (bắt buộc lần đầu), `POST /auth/forgot-password`, `POST /auth/reset-password`, `GET /auth/me` |
| 02 | `UsersModule` | **S0** | Chưa có (`0/10` hạng mục) | `GET /users`, `POST /users`, `GET /users/:id`, `PATCH /users/:id`, `PATCH /users/:id/status`, `PATCH /profile` (SV/PH tự sửa thông tin cho phép) |
| 03 | `RolesModule` | **S0** | Chưa có (`0/10` hạng mục) | `GET /roles`, `POST /roles`, `PATCH /roles/:id`, `PUT /roles/:id/permissions` |
| 04 | `PermissionsModule` | **S0** | Chưa có (`0/10` hạng mục) | `GET /permissions`, guard decorator `@RequirePermissions(...)` + `PermissionsGuard` |
| 05 | `AccountImportModule` | **S0** | Chưa có (`0/10` hạng mục) | `POST /account-imports/upload` (Excel/CSV), `GET /account-imports`, `GET /account-imports/:jobId`, `GET /account-imports/:jobId/errors.csv` |
| 06 | `CampusModule` | **S0** | Chưa có (`0/10` hạng mục) | `GET /campuses`, `GET /campuses/:code`, `POST /campuses`, `PATCH /campuses/:id` |
| 07 | `BuildingsModule` | **S0** | Chưa có (`0/10` hạng mục) | `GET /buildings`, `GET /buildings/:slug`, `POST /buildings`, `PATCH /buildings/:id`, `DELETE /buildings/:id` |
| 08 | `FloorsModule` | **S0** | Chưa có (`0/10` hạng mục) | `GET /buildings/:buildingId/floors`, `POST /floors`, `PATCH /floors/:id`, `DELETE /floors/:id` |
| 09 | `LocationsModule` | **S0** | Chưa có (`0/10` hạng mục) | `GET /locations` (filter `building`, `category`, `search`, phân trang), `GET /locations/:slug`, `POST /locations`, `PATCH /locations/:id`, `DELETE /locations/:id` |
| 10 | `VirtualTourModule` | **S0** | Chưa có (`0/10` hạng mục) | `GET /tours`, `GET /tours/:slug` (full tree scene + connection), `POST /tours`, `PATCH /tours/:id`, `POST /tours/:id/publish` |
| 11 | `PanoramaModule` | **S0** | Chưa có (`0/10` hạng mục) | `GET /scenes`, `GET /scenes/:slug`, `POST /scenes`, `PATCH /scenes/:id`, `POST /scenes/:id/hotspots`, `PATCH /hotspots/:id`, `DELETE /hotspots/:id` |
| 12 | `ThreeDModule` | **S0** | Chưa có (`0/10` hạng mục) | `GET /3d/models`, `POST /3d/models`, `POST /3d/models/:id/versions`, `PUT /3d/placements`, `GET /3d/campus-scene/:campusCode` |
| 13 | `EventsModule` | **S0** | Chưa có (`0/10` hạng mục) | `GET /events`, `GET /events/:slug`, `GET /events/:id/schedules`, `POST /events`, `PATCH /events/:id`, `POST /events/:id/schedules` |
| 14 | `RegistrationsModule` | **S0** | Chưa có (`0/10` hạng mục) | `POST /events/:id/register`, `GET /registrations/my`, `GET /registrations` (admin), `POST /registrations/check-in` (quét QR tại Open Day), `GET /registrations/:code/ticket` |
| 15 | `GamesModule` | **S0** | Chưa có (`0/10` hạng mục) | `GET /games`, `POST /games/:slug/sessions`, `POST /games/sessions/:id/spin` (server-side RNG + cấp voucher thật), `GET /games/rewards/my`, `POST /admin/games` |
| 16 | `QuizzesModule` | **S0** | Chưa có (`0/10` hạng mục) | `GET /quizzes/:slug`, `POST /quizzes/:slug/attempts`, `POST /quizzes/attempts/:id/submit` (chấm đáp án trên server, không gửi đáp án đúng xuống client trước!), CRUD admin |
| 17 | `LeaderboardModule` | **S0** | Chưa có (`0/10` hạng mục) | `GET /leaderboard` (phân trang top XP theo cơ sở/sự kiện), `GET /leaderboard/me` |
| 18 | `MediaModule` | **S0** | Chưa có (`0/10` hạng mục) | `POST /media/presign-upload`, `POST /media/confirm`, `GET /media`, `PATCH /media/:id`, `DELETE /media/:id` (kiểm MIME/magic-bytes, virus/size check, S3/R2 integration) |
| 19 | `CMSModule` | **S0** | Chưa có (`0/10` hạng mục) | `GET /cms/pages/:slug`, `PUT /cms/sections/:id`, `GET /cms/navigation`, `PUT /cms/settings`, `GET /news`, `GET /news/:slug`, `POST /admin/news`, `PATCH /admin/news/:id`, `DELETE /admin/news/:id` |
| 20 | `ContactModule` | **S0** | Chưa có (`0/10` hạng mục) | `POST /contact` (tư vấn tuyển sinh / liên hệ công khai, có rate limit), `GET /admin/contacts`, `PATCH /admin/contacts/:id/status` |
| 21 | `NotificationsModule` | **S0** | Chưa có (`0/10` hạng mục) | `GET /notifications/my`, `PATCH /notifications/:id/read`, service gửi Email/ZNS xác nhận vé Open Day & cấp mật khẩu tạm |
| 22 | `AnalyticsModule` | **S0** | Chưa có (`0/10` hạng mục) | `POST /analytics/events` (lượt xem scene 360°, click hotspot, thời lượng), `GET /admin/analytics/overview`, `GET /admin/analytics/funnel` |
| 23 | `AuditLogsModule` | **S0** | Chưa có (`0/10` hạng mục) | Interceptor/Service tự động ghi log hành động nhạy cảm (login, import user, đổi role, publish/delete media/CMS), `GET /admin/audit-logs` |

---

## 3. Khoảng Trống Giữa `packages/shared` Và Yêu Cầu Hệ Thống

Tệp `packages/shared/src/index.ts` (183 dòng) hiện là hợp đồng kiểu dữ liệu duy nhất đã viết sơ bộ, nhưng:
1. **Chưa được sử dụng ở đâu cả** (`apps/web` và chưa-tồn-tại `apps/api` đều có `0` câu lệnh `import ... from '@fpt-campus/shared'`).
2. **Thiếu nhiều trường bắt buộc theo kiến trúc xác nhận:**
   - `UserProfile` thiếu `mustChangePassword: boolean`, `status`, `lastLoginAt`, `importedBatchId`.
   - Thiếu hoàn toàn DTO/Interface cho: `Floor`, `ThreeDModelAsset`, `ThreeDPlacement`, `EventSchedule`, `TicketPass`, `QuizAttemptSubmitRequest`, `MediaAsset`, `AuditLogEntry`, `AccountImportJob`, `ContactSubmission`, `NewsArticle` phân trang (`PaginatedResponse<T>`).
   - `BuildingInfo` không khớp hoàn toàn với dữ liệu thực trong `Campus3DViewer.tsx` (thiếu `position3D`, `dimensions`, `functionalZones`, `majors`).

---

## 4. Khung Tiêu Chuẩn Phải Áp Dụng Khi Khởi Tạo NestJS (`apps/api`)

1. **Modular Monolith sạch:** Mỗi nghiệp vụ đóng gói thành module độc lập giao tiếp qua Service interface hoặc Domain Event nội bộ, chuẩn bị sẵn khả năng tách service nếu cần.
2. **Global Security & Validation Layer:**
   - `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` kết hợp `class-validator` / `zod`.
   - `JwtAuthGuard` + `RolesGuard` + `PermissionsGuard` gắn mặc định ở cấp `@UseGuards()` hoặc global `APP_GUARD` (dùng `@Public()` cho các endpoint khách).
   - `ThrottlerGuard` chống brute-force đăng nhập, chống spam form liên hệ/đăng ký Open Day và anti-bot quiz/spin.
   - `Helmet`, cấu hình CORS chặt chẽ theo `NEXT_PUBLIC_APP_URL`, Cookie parser (`HttpOnly; Secure; SameSite=Lax`).
3. **Chuẩn Response & Documentation:** Tích hợp `@nestjs/swagger` tại `/api/docs` (chỉ bật ở dev/staging hoặc bảo vệ khi lên prod) và `GlobalExceptionFilter` chuẩn hóa JSON lỗi khớp `ApiResponse<T>`.
4. **Kiểm thử tối thiểu:** Unit test Service (Jest) cho Auth, AccountImport, Registrations, Quizzes/Games Anti-cheat; Integration test (Supertest + Test DB) kiểm tra 401/403 Guard trên toàn bộ endpoint nhạy cảm.
