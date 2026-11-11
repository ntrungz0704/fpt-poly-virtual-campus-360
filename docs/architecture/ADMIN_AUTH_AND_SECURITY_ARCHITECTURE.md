# ADMIN AUTHENTICATION & SECURITY ARCHITECTURE

**Trạng thái:** Phase 0 — Design Approved First (Chưa triển khai Backend/Auth thật trong Phase 0)  
**Lựa chọn đã chốt của Chủ dự án:**
- **Admin Authentication:** Phương án 1 — Thiết kế kiến trúc chuẩn trước, triển khai xác thực thực tế đồng bộ cùng Backend (`NestJS + PostgreSQL + Prisma + Redis`) ở giai đoạn sau. **Tuyệt đối không** dựng cơ chế cookie/session giả hoặc middleware kiểm tra giá trị từ client tự ghi.
- **Phạm vi sử dụng Admin:** Phương án 1 — Chỉ phục vụ nhân sự nội bộ, **không đưa `/admin/*` lên Internet cho người dùng thật** cho tới khi Auth thực tế hoạt động hoàn chỉnh.

---

## 1. Kiểm kê Toàn bộ Dấu vết Thông tin Đăng nhập & Route cần Bảo vệ Hiện tại

Kết quả quét trực tiếp toàn bộ `apps/web/src/` cho thấy hiện trạng rủi ro mức **CRITICAL**:

### 1.1. Nơi chứa hoặc tham chiếu thông tin đăng nhập / session giả lập
| Tệp mã nguồn | Dòng / Thành phần | Vấn đề bảo mật hiện hữu | Kế hoạch xử lý (từ Phase 1+) |
|---|---|---|---|
| `apps/web/src/lib/prototype-auth.ts` | *(Đã xóa ở Phase 1)* | Từng chứa plaintext username/password (`admin` / `Fpoly@2026`) và `sessionStorage` giả lập. | **Đã gỡ hoàn toàn ở Phase 1**; không còn credential hay fake session phía client. Sang Phase 3 sẽ nối HTTP Auth Client thật tới `/api/v1/auth/*`. |
| `apps/web/src/app/(auth)/login/page.tsx` | Trang trạng thái Auth | Từng chứa form đăng nhập prototype và nhánh `first_login_change_password` đọc `sessionStorage`. | **Đã chuyển thành màn hình thông báo Auth chưa triển khai ở Phase 1** (không có form giả); nối API `/api/v1/auth/login` + luồng kích hoạt token 1 lần ở Phase 3. |
| `apps/web/src/app/(portal)/portal/page.tsx` & `layout.tsx` | Route `/portal` (giữ tương thích) | Từng đọc `sessionStorage` và gắn CTA `/login?next=/portal` + copy Check-in QR. | **Đã gỡ `sessionStorage` và CTA `/login?next=/portal` ở Phase 1**; hiển thị thông báo Student/Parent Portal ngoài phạm vi MVP, giữ route nguyên trạng chờ giai đoạn sau. |
| `apps/web/src/components/ui/StateFeedback.tsx` | `AuthGateState` (`actionHref = "/campus"`, L170–178) | Từng mặc định điều hướng về `/login?next=/portal`. | **Đã sửa ở Phase 1** về trải nghiệm công khai `/campus` & `/events`. |
| `apps/web/src/components/portal/*` | `DigitalPassCard.tsx`, `StudentProfileHeader.tsx`, `portal-types.ts` | Từng import `PrototypeParticipantSession` từ `prototype-auth.ts` và chứa copy QR / mật khẩu tạm. | **Đã tách sang `portal-types.ts` và làm sạch copy ở Phase 1**; giữ file thành phần cho giai đoạn Portal sau MVP. |
| `.env.example` & `docker-compose.yml` | Biến mẫu `POSTGRES_PASSWORD`, `JWT_SECRET` | Chỉ là template cấu hình dev local; chưa tồn tại tệp `.env` thật trên ổ đĩa. | Cấm dùng chuỗi mẫu lên Staging/Production; sinh secret ngẫu nhiên `>= 256-bit` khi dựng hạ tầng. |

> [!CAUTION]
> Chuỗi mật khẩu thử nghiệm từng xuất hiện trong `apps/web/src/lib/prototype-auth.ts` đã bị coi là **lộ công khai**. Tuyệt đối **không** tái sử dụng chuỗi này (hoặc bất kỳ mật khẩu mẫu nào trong `.env.example`) làm tài khoản quản trị trên Staging, Demo công khai hoặc Production. Nếu từng dùng chung mật khẩu cho dịch vụ/tài khoản khác, cần đổi ngay lập tức.

### 1.2. Toàn bộ Route Web & API Quản trị Bắt buộc Bảo vệ
- **Next.js App Router Admin UI (hiện đang mở công khai `HTTP 200`, `0` guard):**
  - `/admin` (`apps/web/src/app/admin/page.tsx`)
  - `/admin/locations` (`apps/web/src/app/admin/locations/page.tsx`)
  - `/admin/virtual-tour` (`apps/web/src/app/admin/virtual-tour/page.tsx`)
  - `/admin/events` (`apps/web/src/app/admin/events/page.tsx`)
  - `/admin/media` (`apps/web/src/app/admin/media/page.tsx`)
  - `/admin/users` (`apps/web/src/app/admin/users/page.tsx`)
  - *(Dự kiến mở rộng Phase 4: giao diện Floor Plan Upload/Alignment & Admin Campus Studio)*
- **Authentication & Admin REST APIs mục tiêu (`/api/v1/*`, tham chiếu `docs/phase-2a/PHASE_2A_API_CONTRACT.md`):**
  - **Auth endpoints:** `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`, `PATCH /api/v1/auth/me/password`.
  - **Admin protected endpoints (tất cả đều yêu cầu Bearer JWT hợp lệ + RBAC Guard + `must_change_password === false`):**
    - `/api/v1/admin/buildings/**`
    - `/api/v1/admin/floors/**`
    - `/api/v1/admin/floor-plans/**`
    - `/api/v1/admin/locations/**`
    - `/api/v1/admin/media/**`
    - `/api/v1/admin/tour/**` (`nodes`, `hotspots`, `edges`, `validate`, `publish`)
    - `/api/v1/admin/events/**`
    - `/api/v1/admin/users/**`
    - `/api/v1/admin/audit-logs/**`

---

## 2. Kiến trúc Xác thực Admin Mục tiêu (Target Auth Architecture)

### 2.1. Chính sách Tài khoản, Phân loại Người dùng & Phân quyền (RBAC)
1. **Phân tách 3 nhóm người dùng & Không tự đăng ký công khai:**
   - **Nhóm A (`ADMIN`, `STAFF`):** Tài khoản quản trị và nhân sự nhà trường do Admin / bootstrap CLI cấp.
   - **Nhóm B (`STUDENT`, `PARENT` — Người tham gia Open Day):** Tài khoản dành cho khách tham dự Open Day (sinh viên/học sinh và phụ huynh quan tâm — **không mặc định là sinh viên chính thức đang theo học**; hỗ trợ tham gia **nhiều sự kiện Open Day**). **Tuyệt đối không mở API tự đăng ký (`POST /auth/register` không tồn tại)** và lưu ý rằng giao diện Student/Parent Portal (`/portal`) vẫn **chưa thuộc phạm vi MVP**.
   - **Nhóm C (Khách tham quan tự do):** Không cần tài khoản, không đăng nhập khi xem Tour 360°, GIS Map, Địa điểm và lịch Open Day công khai.
   - **Phân tách rạch ròi các thuộc tính:** Cơ sở dữ liệu và DTO tách riêng `userType` (`ADMIN | STAFF | STUDENT | PARENT`), `roles/permissions` (RBAC quản trị), `accountStatus` (`ACTIVE | LOCKED | SUSPENDED | ARCHIVED`), `activationStatus` (`PENDING_ACTIVATION | INVITATION_SENT | ACTIVATED | EXPIRED | REVOKED`) và `provisioningMethod` (`BOOTSTRAP | ADMIN_DIRECT | EMAIL_SMS_INVITATION`) — **không gộp chung mọi khái niệm vào 1 cột `role`**.
2. **Bootstrap Admin an toàn & Quy trình Cấp / Kích hoạt Tài khoản Không Mật Khẩu Plaintext:**
   - Khi khởi tạo Database, seed duy nhất **01 tài khoản gốc (`username = "admin"`, `userType = ADMIN`, role `SUPER_ADMIN`)** đọc mật khẩu khởi tạo từ biến môi trường `ADMIN_BOOTSTRAP_PASSWORD` (hoặc script CLI tương tác); tuyệt đối không có fallback hardcoded trong code và ép đổi mật khẩu ở lần đầu (`must_change_password = true`).
   - **Cấp phát cho `STUDENT` / `PARENT` & `STAFF` (Single Unified `users` Model — Dual Provisioning):**
     - **Phương thức A (`ADMIN_DIRECT`):** Admin tạo thủ công hoặc import rồi cấp **mã/liên kết kích hoạt dùng một lần có thời hạn** (lưu hash trong DB) để người dùng tự thiết lập mật khẩu cá nhân ngay lần kích hoạt đầu. **Cấm tuyệt đối mật khẩu mặc định dùng chung (`shared default password`) hoặc lưu/hiển thị mật khẩu plaintext.**
     - **Phương thức B (`EMAIL_SMS_INVITATION`):** Hệ thống gửi lời mời qua Email hoặc SMS chứa token ngẫu nhiên dùng một lần có thời hạn (**chỉ lưu hash SHA-256 trong DB**, không ghi raw token vào log/AuditLog/URL công khai), theo dõi trạng thái `INVITATION_PENDING → SENT → EXPIRED/FAILED → ACTIVATED` và hỗ trợ **`Resend`** (vô hiệu hóa token cũ, sinh token mới).
   - **Import Excel/CSV 5 bước (`.xlsx`/`.csv`):** (1) Upload tạm thời trong RAM/stream → (2) Đọc ô & tự nhận diện/ánh xạ lại cột → (3) Preview & Validate → (4) Confirm Import bản ghi chuẩn hóa + `EventParticipation` → (5) Báo cáo kết quả từng dòng. **Quy tắc cứng: Không bao giờ lưu file Excel gốc, tên file gốc hay đường dẫn file gốc vào Database hoặc Object Storage (S3/MinIO); chỉ lưu bản ghi user đã chuẩn hóa và nhật ký tổng hợp đợt import.**
   - Mật khẩu lưu bằng **Argon2id** (`memoryCost >= 65536`, `timeCost >= 3`, `parallelism = 1`).
3. **Vai trò & Quyền hạn (RBAC):**
   - `SUPER_ADMIN`: toàn quyền quản trị hệ thống, tạo/khóa tài khoản nội bộ & Open Day, import danh sách, xem audit logs, publish tour.
   - Dự phòng mở rộng nội bộ: `TOUR_EDITOR` (`campus:write`, `floorplan:write`, `location:write`, `media:upload`, `tour:write`, `tour:publish`), `EVENT_OPERATOR` (`events:write`, `users:provision_openday`).
   - Tài khoản Open Day (`STUDENT` / `PARENT`) không được gán quyền quản trị `/api/v1/admin/*` (`RolesGuard`/`PermissionsGuard` từ chối mặc định `403 Forbidden`).
   - Toàn bộ kiểm tra quyền thực hiện qua **`JwtAuthGuard` → `ForcePasswordChangedGuard` → `AccountActiveGuard` → `RolesGuard` / `PermissionsGuard`** tại tầng NestJS API.

### 2.2. Token & Vòng đời Phiên (Session Lifecycle)
```mermaid
sequenceDiagram
    participant U as Admin Browser
    participant W as Next.js App (/login & /admin)
    participant A as NestJS Auth/Admin API
    participant R as Redis (Rate Limit / Lock)
    participant DB as PostgreSQL (users, refresh_tokens, audit_logs)

    U->>W: Mở /login, nhập username + password
    W->>A: POST /api/v1/auth/login
    A->>R: Check rate limit (5 req/phút/IP) & lockout
    A->>DB: Tìm user + verify Argon2id password hash
    alt Sai thông tin
        A->>DB: Tăng failed_login_attempts + ghi AUDIT LOGIN_FAILED
        A-->>W: 401 Unauthorized (thông báo chung chung)
    else Đúng thông tin
        A->>DB: Tạo refresh_token (64B random, lưu SHA-256 hash + family_id) + ghi AUDIT LOGIN_SUCCESS
        A-->>U: Set-Cookie refresh_token (HttpOnly; Secure; SameSite=Lax; Path=/api/v1/auth)<br/>+ JSON { accessToken (15m, giữ trong RAM), user, mustChangePassword }
    end
    Note over U,A: Nếu mustChangePassword=true, UI bắt buộc gọi PATCH /api/v1/auth/me/password trước khi vào /admin
    U->>A: Gọi /api/v1/admin/* kèm Authorization: Bearer <accessToken>
    A->>A: Verify chữ ký JWT + check mustChangePassword=false + RBAC permission
```

1. **Access Token (JWT ngắn hạn — 15 phút):**
   - Chỉ giữ **trong bộ nhớ RAM (React Context / in-memory closure)** phía client.
   - **Cấm lưu** vào `localStorage`, `sessionStorage` hoặc `document.cookie` để loại bỏ nguy cơ XSS đánh cắp token dài hạn hoặc giả mạo session ở trình duyệt.
   - Chứa payload tối giản: `sub` (user UUID), `username`, `roles`, `jti`, `pwdRequired` (`mustChangePassword`), `iat`, `exp`.
2. **Refresh Token (Opaque 64-byte random — 7 ngày, có Rotation & Reuse Detection):**
   - Bản gốc chỉ gửi trong Cookie **`HttpOnly; Secure; SameSite=Lax; Path=/api/v1/auth`** (`Secure=true` trên HTTPS; chỉ cho phép tắt flag `Secure` ở local `http://localhost`).
   - Database bảng `refresh_tokens` chỉ lưu **SHA-256 hash** của token, kèm `family_id`, `user_id`, `expires_at`, `revoked_at`, `ip_address`, `user_agent`.
   - **Rotation:** Mỗi lần gọi `POST /api/v1/auth/refresh`, token cũ bị đánh dấu `revoked_at = NOW()` ngay lập tức và cấp token mới trong cùng `family_id`.
   - **Reuse Attack Detection:** Nếu một `refresh_token` đã thu hồi bị gửi lại, backend lập tức thu hồi **toàn bộ `family_id`**, xóa cookie và ghi nhận cảnh báo bảo mật vào `audit_logs`.
3. **Logout & Đổi mật khẩu:**
   - `POST /api/v1/auth/logout`: thu hồi `refresh_token` hiện tại (hoặc `family_id`), xóa cookie ở Path `/api/v1/auth`, xóa `accessToken` khỏi RAM React và chuyển về `/login`.
   - `PATCH /api/v1/auth/me/password`: bắt buộc xác thực `currentPassword` (Argon2id), kiểm tra độ mạnh mật khẩu mới (tối thiểu 12 ký tự, khác mật khẩu cũ), hạ `must_change_password = false` và **thu hồi toàn bộ `refresh_tokens` đang hoạt động của user** trừ phiên hiện tại (hoặc ép đăng nhập lại).

### 2.3. Chống CSRF, Brute-Force & Bảo vệ Edge/Middleware
1. **CSRF Defense:**
   - Các API `/api/v1/admin/*` nhận `Authorization: Bearer <accessToken>` qua HTTP header (không đọc từ cookie) nên miễn nhiễm với CSRF cookie truyền thống.
   - Hai endpoint dùng cookie là `POST /api/v1/auth/refresh` và `POST /api/v1/auth/logout` phải:
     - Gắn cookie `SameSite=Lax; HttpOnly; Secure`.
     - Kiểm tra chặt header **`Origin` / `Referer`** khớp chính xác `WEB_ORIGIN` whitelist.
     - Yêu cầu custom header `X-Requested-With: XMLHttpRequest` (hoặc CSRF double-submit header đồng bộ trên same-origin proxy).
2. **Ranh giới giữa Next.js Middleware / Server Route Guard vs NestJS Backend Guards:**
   - **Nguyên tắc vàng:** Một `middleware.ts` ở Next.js chỉ đọc cookie cờ do client đặt **KHÔNG PHẢI LÀ AUTH**.
   - **Route Protection hợp lệ ở Next.js:**
     - **Tầng UI Shell (`/admin/*`):** Khi người dùng mở `/admin/*` trong trình duyệt, `AdminAuthGate` phía client/server tiến hành gọi `POST /api/v1/auth/refresh` hoặc Server Component/Middleware kiểm tra cookie phiên (nếu dùng Same-Origin Reverse Proxy) tới endpoint **`GET /api/v1/auth/me`** của NestJS. Nếu chưa xác thực (`401`) hoặc `mustChangePassword === true`, chặn render dữ liệu quản trị và chuyển hướng về `/login`.
     - **Tầng Dữ liệu Thực (Source of Truth):** 100% thao tác đọc dữ liệu nháp, danh sách user, audit log, upload media, tạo/sửa/xóa/publish **bắt buộc** đi qua NestJS Guards; ngay cả khi ai đó cố render shell HTML của `/admin` phía client, không có bất kỳ dữ liệu nội bộ hay khả năng ghi DB nào được trả về nếu thiếu Bearer JWT + RBAC hợp lệ.
3. **Security Headers (sẽ cấu hình ở Nginx/Next.js trước khi Staging/Prod):**
   - `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, và `Content-Security-Policy` chuẩn hóa (riêng asset SVG mặt bằng từ S3/CDN phục vụ qua `Content-Security-Policy: sandbox`).

---

## 3. Lộ trình Chuyển đổi từ Prototype sang Auth Thật

| Giai đoạn | Trạng thái | Hành động cụ thể |
|---|---|---|
| **Phase 0 (Hoàn tất)** | Đã nghiệm thu (`b4f1a94`) | Tài liệu hóa đầy đủ kiến trúc Auth; giữ `/admin` chỉ chạy nội bộ; **không dựng session giả / cookie giả**. |
| **Phase 1 (Security & MVP Cleanup)** | Đang hoàn tất | Gỡ toàn bộ `Fpoly@2026`, `prototype-auth.ts`, `sessionStorage`; chuyển `/login` thành màn hình trạng thái chưa kích hoạt; gắn banner Preview nội bộ trên `/admin/*`; dọn QR/Zalo/`next=/portal`; đồng bộ đặc tả 3 nhóm user, Dual Provisioning & Import Excel không lưu file gốc. |
| **Phase 3 (Backend & DB)** | Sau khi chốt Phase 2 Data Contract | Dựng PostgreSQL `users` (tách `user_type`, `account_status`, `activation_status`, `provisioning_method`), `roles`, `permissions`, `user_roles`, `role_permissions`, `account_invitations`, `event_participations`, `user_import_batches`, `refresh_tokens`, `audit_logs`; cài `AuthModule` + `Argon2id` + `Redis` rate-limit + quy trình kích hoạt/import Excel 5 bước + NestJS Guards; nối `/login`, `/activate` & `/admin/*` qua API `/api/v1/auth/*`. |
| **Pre-Production Gate** | Trước khi mở Internet | Bật HTTPS/TLS, Cookie `Secure=true`, CORS whitelist chặt, Security Headers, xoay mới toàn bộ `JWT_SECRET`, `POSTGRES_PASSWORD`, `ADMIN_BOOTSTRAP_PASSWORD`, chạy checklist OWASP Auth/IDOR. |
