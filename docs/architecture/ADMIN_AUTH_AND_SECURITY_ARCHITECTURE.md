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
| `apps/web/src/lib/prototype-auth.ts` | `ADMIN_ACCOUNT_CONFIG` (L13–38), `SESSION_KEY` (L11), `sessionStorage` (L43–67) | **Lộ plaintext username & password (`admin` / `Fpoly@2026`) ngay trong client JavaScript bundle**; lưu phiên dạng JSON thuần ở `window.sessionStorage`. | Gỡ bỏ mật khẩu plaintext trong Phase 1; thay hoàn toàn bằng HTTP Auth Client gọi `/api/v1/auth/*` khi triển khai Backend. |
| `apps/web/src/app/(auth)/login/page.tsx` | `authenticatePrototypeAccount`, `resolveSafeNextPath`, nhánh `first_login_change_password` (L72–97, 212–279) | Gọi `prototype-auth.ts`; điều hướng mặc định sang `/admin`, hỗ trợ `?next=/portal`; có nhánh UI đổi mật khẩu lần đầu không chạm tới vì `mustChangePassword: false`. | Nối với `POST /api/v1/auth/login` + `PATCH /api/v1/auth/me/password` thật ở Phase 3; gỡ luồng `/portal` mời khách ở Phase 1. |
| `apps/web/src/app/(portal)/portal/page.tsx` & `layout.tsx` | Guard `if (!session)` (L59–71), đổi MK bỏ qua kiểm tra `currentPw` (L74–103), `clearPrototypeSession` | Đọc `sessionStorage` không kiểm tra role; hiển thị `<AuthGateState actionHref="/login?next=/portal" />`. | Gỡ CTA trỏ `/login?next=/portal` ở Phase 1; giữ nguyên file route `/portal` chờ quyết định riêng. |
| `apps/web/src/components/ui/StateFeedback.tsx` | `AuthGateState` (`actionHref = "/login?next=/portal"`, L170–178) | Mặc định điều hướng về `/login?next=/portal`. | Đổi mặc định/ngữ cảnh MVP trong Phase 1. |
| `apps/web/src/components/portal/*` | `DigitalPassCard.tsx`, `StudentProfileHeader.tsx` | Import `PrototypeParticipantSession` từ `prototype-auth.ts`. | Giữ nguyên cấu trúc file cho tới khi xử lý dứt điểm `/portal`. |
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

### 2.1. Chính sách Tài khoản & Phân quyền (RBAC)
1. **Admin/Staff-Only:** `/login` chỉ cấp quyền truy cập cho tài khoản nhân sự quản trị do người có thẩm quyền tạo hoặc seed qua CLI/DB. **Không có API hoặc giao diện tự đăng ký (`POST /auth/register` không tồn tại).** Không có role `PARTICIPANT`, `STUDENT` hay `PARENT` trong MVP.
2. **Bootstrap Admin an toàn:**
   - Khi khởi tạo Database, seed duy nhất **01 tài khoản gốc (`username = "admin"`, role `SUPER_ADMIN`)** đọc mật khẩu khởi tạo từ biến môi trường `ADMIN_BOOTSTRAP_PASSWORD` (hoặc script CLI tương tác).
   - **Không có giá trị fallback hardcoded** trong source code hay file migration Prisma; script seed phải fail ngay nếu thiếu `ADMIN_BOOTSTRAP_PASSWORD`.
   - Mật khẩu lưu bằng **Argon2id** (`memoryCost >= 65536`, `timeCost >= 3`, `parallelism = 1`).
   - Tài khoản seed mặc định mang cờ `must_change_password = true` (trạng thái `PENDING_PASSWORD_CHANGE`), ép buộc đổi mật khẩu mới ngay lần đăng nhập đầu tiên trước khi gọi được bất kỳ API `/api/v1/admin/*` nào (trả `403 PASSWORD_CHANGE_REQUIRED`).
3. **Vai trò & Quyền hạn (RBAC):**
   - `SUPER_ADMIN`: toàn quyền quản trị hệ thống, tạo/khóa tài khoản nội bộ khác, xem audit logs, publish tour.
   - Dự phòng mở rộng nội bộ (khi trường phân công nhiều cán bộ): `TOUR_EDITOR` (`campus:write`, `floorplan:write`, `location:write`, `media:upload`, `tour:write`, `tour:publish`), `EVENT_OPERATOR` (`events:write`).
   - Toàn bộ kiểm tra quyền thực hiện qua **`JwtAuthGuard` → `ForcePasswordChangedGuard` → `RolesGuard` / `PermissionsGuard`** tại tầng NestJS API.

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
| **Phase 0 (Hiện tại)** | Đang hoàn tất | Tài liệu hóa đầy đủ kiến trúc Auth; giữ `/admin` chỉ chạy nội bộ; **không dựng session giả / cookie giả**. |
| **Phase 1 (Security & MVP Cleanup)** | Chờ duyệt triển khai | Gỡ plaintext credential `Fpoly@2026` khỏi `prototype-auth.ts`; dọn toàn bộ link/copy `/login?next=/portal` sai định hướng MVP; vô hiệu hóa đăng nhập hardcoded trên client (hoặc hiển thị thông báo rõ rằng trang `/admin` đang chờ kết nối Auth Backend nội bộ, không lưu mật khẩu trong code). |
| **Phase 3 (Backend & DB)** | Sau khi chốt Phase 2 Data Contract | Dựng PostgreSQL `users`, `roles`, `permissions`, `user_roles`, `role_permissions`, `refresh_tokens`, `audit_logs`; cài `AuthModule` + `Argon2id` + `Redis` rate-limit + NestJS Guards; nối `/login` & `/admin/*` qua API `/api/v1/auth/*`. |
| **Pre-Production Gate** | Trước khi mở Internet | Bật HTTPS/TLS, Cookie `Secure=true`, CORS whitelist chặt, Security Headers, xoay mới toàn bộ `JWT_SECRET`, `POSTGRES_PASSWORD`, `ADMIN_BOOTSTRAP_PASSWORD`, chạy checklist OWASP Auth/IDOR. |
