# PHASE 2A-2 — CORE BACKEND & AUTHENTICATION IMPLEMENTATION PLAN (MILESTONE 0)

- **Ngày lập kế hoạch:** 2026-11-12
- **Trạng thái hiện tại:** `DECISIONS LOCKED (D-2A2-01..04) — READY FOR MILESTONE 1..6 ON BRANCH feat/phase-2a-2-core-backend`
- **Baseline `main`:** `8b6c206` (`docs: reconcile project documentation after phase 2a-1 acceptance`)
- **Nhánh triển khai (`Phase 2A-2`):** `feat/phase-2a-2-core-backend` *(tách từ `8b6c206`)*
- **Nguồn đối chiếu bắt buộc đã đọc trực tiếp:**
  - [PHASE_2A_API_CONTRACT.md](./PHASE_2A_API_CONTRACT.md)
  - [PHASE_2A_DATABASE_DESIGN.md](./PHASE_2A_DATABASE_DESIGN.md)
  - [PHASE_2A_SYSTEM_ARCHITECTURE.md](./PHASE_2A_SYSTEM_ARCHITECTURE.md)
  - [PHASE_2A_IMPLEMENTATION_ROADMAP.md](./PHASE_2A_IMPLEMENTATION_ROADMAP.md)
  - [PHASE_2A_SCOPE_FINALIZATION_REPORT.md](../project-audit/PHASE_2A_SCOPE_FINALIZATION_REPORT.md)
  - [PHASE_2A_1_FINAL_ACCEPTANCE_REPORT.md](../project-audit/PHASE_2A_1_FINAL_ACCEPTANCE_REPORT.md)
  - [ADMIN_AUTH_AND_SECURITY_ARCHITECTURE.md](../architecture/ADMIN_AUTH_AND_SECURITY_ARCHITECTURE.md)
  - [MVP_SCOPE_AND_ROUTE_DECISIONS.md](../decisions/MVP_SCOPE_AND_ROUTE_DECISIONS.md)
  - [prisma/schema.prisma](../../prisma/schema.prisma), [prisma/seed.ts](../../prisma/seed.ts), [.env.example](../../.env.example)
  - `@fpt-campus/shared`: [api.ts](../../packages/shared/src/api.ts), [auth.ts](../../packages/shared/src/auth.ts), [campus.ts](../../packages/shared/src/campus.ts), [location.ts](../../packages/shared/src/location.ts), [tour.ts](../../packages/shared/src/tour.ts), [events.ts](../../packages/shared/src/events.ts)

> [!IMPORTANT]
> **Trạng thái Gate Milestone 0:** Toàn bộ 4 quyết định **`D-2A2-01` → `D-2A2-04`** đã được Chủ dự án phê duyệt/điều chỉnh chính thức. Tuyệt đối tuân thủ ranh giới `Phase 2A-2`, không mở rộng phạm vi sang `Phase 2A-3`/`2B`, không sửa lịch sử `Phase 2A-1`, không đổi `OD-01..OD-10` và không thay đổi `prisma/schema.prisma` khi chưa có blocker kỹ thuật được phê duyệt.

---

## 1. Xác minh Baseline Repository & Hạ tầng Thực tế

| Hạng mục | Kết quả kiểm tra thực tế | Ghi chú kỹ thuật |
|---|---|---|
| **Git & Branch** | Baseline `main` ở commit `8b6c206`; đã tạo branch riêng `feat/phase-2a-2-core-backend` | Không commit trực tiếp vào `main`; `apps/api/` hiện chưa tồn tại. |
| **Runtime** | `Node v22.23.4`, `pnpm 10.33.2`, workspace `apps/*` & `packages/*` | Khớp `package.json` (`node >= 20`, `pnpm >= 10`) và `.npmrc` (`store-dir=.pnpm-store`). |
| **PostgreSQL 16** | Container `fpt_virtual_campus_db` (`postgres:16-alpine`) đang `Up (healthy)` trên port `5432` | Schema đã migrate (`26` models, `17` enums, partial unique indexes `WHERE deleted_at IS NULL`, `hotspots` CHECK). |
| **Frontend (`apps/web`)** | Next.js `16.4.6`, `19` routes, chạy độc lập trên `DATA_SOURCE=mock` | Phase 2A-2 giữ nguyên `apps/web` chạy `DATA_SOURCE=mock`, không cắt nối API toàn cục trước `2A-3`. |
| **`@fpt-campus/shared`** | Biên dịch bằng `tsc` (`module: NodeNext`) ra CommonJS (`"use strict"`, `exports`) | Tương thích trực tiếp với NestJS CommonJS & Next.js mà không cần đổi module format. |
| **Biến môi trường `.env.example`** | Đã có đủ `API_PORT=4000`, `WEB_ORIGIN=http://localhost:3000`, `RATE_LIMIT_STORE=memory`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRATION=15m`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRATION=7d`, `STORAGE_DRIVER=local`, `LOCAL_MEDIA_ROOT=apps/web/public/images` | Giữ nguyên tên biến theo `.env.example` và `.env` local (không đổi `JWT_SECRET` sang tên khác gây vỡ env đã nghiệm thu). |

---

## 2. Đối chiếu Schema, Dữ liệu Seed & Hợp đồng `OD-01..OD-10`

### 2.1. Kiểm tra Prisma Schema (`prisma/schema.prisma`)
**Kết luận: `0` thay đổi schema bắt buộc.** Toàn bộ model và cột phục vụ Phase `2A-2` đã tồn tại từ Phase `2A-1`:
- **Auth / Session / RBAC / Audit:** `User` (đủ `username`, `email`, `phone`, `userType`, `accountStatus`, `activationStatus`, `provisioningMethod`, `passwordHash`, `mustChangePassword`, `failedLoginAttempts`, `lockedUntil`, `lastLoginAt`, `deletedAt`), `Role`, `Permission`, `UserRole`, `RolePermission`, `RefreshToken` (`tokenHash` `CHAR(64) @unique`, `familyId`, `expiresAt`, `revokedAt`, `userAgent`, `ipAddress` `@db.Inet`), `AccountInvitation` (`channel`, `tokenHash` `CHAR(64) @unique`, `status`, `expiresAt`, `sentAt`, `activatedAt`, `resendCount`, `failureReason`, `createdBy`), `EventParticipation`, `AuditLog` (`actorUserId`, `actorUsername`, `action`, `resourceType`, `resourceId`, `diffJson`, `ipAddress` `@db.Inet`).
- **Public Read:** `Campus`, `Building`, `Floor`, `FloorPlan`, `LocationType`, `Location`, `MediaAsset`, `LocationMedia`, `TourNode`, `TourEdge`, `Hotspot`, `OpenDayEvent`, `OpenDaySession`, `OpenDayFaq`, `OpenDayQuizItem`.

### 2.2. Đối chiếu Trạng thái Seed & Ràng buộc chuyển tiếp từ `Phase 2A-1`
1. **Enum Mapping (`R-05`):**
   - PostgreSQL `BuildingCategory`: `ACADEMIC | LAB | FACILITY` ↔ `@fpt-campus/shared`: `"academic" | "lab" | "facility"`.
   - PostgreSQL `MapBuildingIconKey`: `INNOVATION | IT_BUILDING | DESIGN_STUDIO | ACADEMIC_HALL | SPORTS` ↔ `@fpt-campus/shared`: `"innovation" | "it-building" | "design-studio" | "academic-hall" | "sports"`.
   - `SessionPeriod` đã đồng bộ chữ hoa (`MORNING | NOON | AFTERNOON`) giữa Prisma và `@fpt-campus/shared`.
2. **Cách ly Panorama Placeholder AI (`D-02` / `R-03`):**
   - Trong `prisma/seed.ts`, `5/5` `PANORAMA_2_1` assets có `isPreviewApproved = false` và `5/5` `TourNode` có `status = 'DRAFT'`.
   - Mọi Public APIs phải lọc nghiêm ngặt `status = 'PUBLISHED' AND deletedAt IS NULL`, và mọi tham chiếu tới `TourNode` phải đòi hỏi thêm `node.status === 'PUBLISHED' && node.deletedAt === null && node.panoramaAsset.isPreviewApproved === true`.
3. **Phân loại dữ liệu QTSC (`R-06`):**
   - Dữ liệu seed hiện có là dữ liệu phát triển phục vụ API; backend không gắn nhãn hay suy diễn đây là số liệu đo đạc thực địa.
4. **Hành vi `OD-01..OD-10`:**
   - `OD-01`: `GET /public/campus` & `/buildings/:slug` trả full WGS84 (`lat`, `lng`, `routeWaypoints`, `originPoint`, `landmarks`, `gisX`, `gisY`).
   - `OD-02`: `khu-the-thao-qtsc` có `primaryNodeSlug = null`, `tourNodes = []`.
   - `OD-03` / `OD-05`: Open Day public CMS chỉ gồm event/session/faq/quiz (`participationStatus` chỉ có `INVITED | CONFIRMED | CANCELLED`, không QR/check-in).
   - `OD-04`: Chuẩn hóa `email` lowercase và `phone` E.164/VN (`+84...`) trước check uniqueness, create, và login (`username | email | phone`). Không có `/register`.
   - `OD-08`: `GET /public/events` ẩn hoàn toàn `correctIndex` và `explanation`; `POST /public/quiz/verify` chấm stateless không lưu DB cá nhân hay XP/Leaderboard.
   - `OD-10`: `floors[].activeFloorPlan = null` khi chưa có mặt bằng, không dựng `FloorPlan` giả.

---

## 3. Bảng Chốt Quyết Định Chính Thức Từ Chủ Dự Án (`D-2A2-01` → `D-2A2-04`)

| Mã Quyết Định | Chủ đề | Trạng thái Phê duyệt | Quy tắc Bắt buộc Áp dụng |
|---|---|---|---|
| **`D-2A2-01`** | Admin Users & Audit Logs (`§4.7` non-bulk) | **`APPROVED WITH CONDITIONS`** | Mở 5 endpoint non-bulk trong `2A-2`: `GET /admin/users`, `POST /admin/users`, `PATCH /admin/users/:id/status`, `POST /admin/users/:id/invitations/resend`, `GET /admin/audit-logs`; giữ `/import/preview` & `/import/confirm` ở `2A-3`. Xem 6 quy tắc RBAC & quy tắc activation bên dưới. |
| **`D-2A2-02`** | Health Check & Session Revocation | **`APPROVED`** | Bổ sung `GET /api/v1/health` (public, `SELECT 1`, trả `200`/`503`, không lộ connection string/hostname nội bộ/credentials/stack trace). Không tạo thêm `/auth/sessions/*`; thực hiện revoke session qua `/auth/logout`, `/auth/me/password`, reuse-detection `family_id`, và `PATCH /admin/users/:id/status`. |
| **`D-2A2-03`** | Public Tour & Open Day Data Isolation | **`REVISED AND APPROVED UNDER THE RULES ABOVE`** | Điều chỉnh quan trọng: `GET /api/v1/public/events` **chỉ** trả session có `isPublic = true && status = PUBLISHED && deletedAt IS NULL` (không lộ session `isPublic = false` cho anonymous caller); áp dụng bộ lọc `TourNode` (`PUBLISHED && deletedAt === null && panoramaAsset.isPreviewApproved === true`) + masking `null`/`0`/`[]` trên mọi Public API; tách `PublicLocationSummaryDto[]` vs `PublicLocationDetailDto`; giữ nguyên schema `OpenDayQuizItem` (không tự suy diễn `eventId` hay sửa migration). |
| **`D-2A2-04`** | CSRF, Cookie & CORS | **`APPROVED WITH CONDITIONS`** | Cookie `refresh_token`: `HttpOnly; SameSite=Lax; Path=/api/v1/auth` (`Secure=true` ở production HTTPS, chỉ tắt `Secure` trên local HTTP dev). `POST /auth/refresh` và `POST /auth/logout` kiểm tra đồng thời `Origin` (hoặc `Referer` khi thiếu `Origin`) khớp chính xác `WEB_ORIGIN` **và** header `X-Requested-With: XMLHttpRequest` (`403 FORBIDDEN` nếu thiếu/sai). CORS whitelist `WEB_ORIGIN` + `credentials: true` (cấm `*`). |

### 3.1. Chi tiết Quy tắc `D-2A2-01` (`APPROVED WITH CONDITIONS`)
1. `users:manage` được quản lý tài khoản theo quyền đã cấp.
2. `users:provision_openday` khi thiếu `users:manage` **chỉ** được provision tài khoản `STUDENT` và `PARENT`.
3. Cấm truyền `roleCodes`, tự gán quyền hoặc tạo/sửa tài khoản `ADMIN`, `STAFF` bằng quyền `users:provision_openday`.
4. Các thao tác `PATCH /admin/users/:id/status` và `POST /admin/users/:id/invitations/resend` **bắt buộc kiểm tra quyền trên đúng đối tượng tài khoản mục tiêu** (`targetUser.userType`), không chỉ kiểm tra quyền truy cập route.
5. `GET /api/v1/admin/users` (`users:manage` ONLY) và `GET /api/v1/admin/audit-logs` (`audit:read` ONLY) có authorization riêng; quyền `users:provision_openday` **không** được phép đọc danh sách toàn bộ người dùng hoặc nhật ký kiểm toán.
6. Không tự tạo role mới ngoài mô hình RBAC hiện có trong DB/seed (`SUPER_ADMIN`, `TOUR_EDITOR`, `EVENT_OPERATOR`); ánh xạ đúng theo permission và role hiện hữu.
7. Quy tắc activation:
   - `ADMIN_DIRECT`: tạo token ngẫu nhiên đủ entropy (`>= 32 bytes`), có hạn sử dụng, single-use; lưu `SHA-256(rawToken)` vào `account_invitations.token_hash`; trả `activationToken` plaintext **đúng 1 lần** trong HTTP response cho Admin có quyền phù hợp; tuyệt đối không lưu/ghi plaintext token vào DB, audit log, application log hoặc error log.
   - `EMAIL_SMS_INVITATION`: dùng local delivery stub trong `Phase 2A-2`; không tích hợp SMTP/SMS thật và **không** trả plaintext token trong HTTP response.

### 3.2. Chi tiết Quy tắc `D-2A2-02` (`APPROVED`)
- `GET /api/v1/health`: public, kiểm tra PostgreSQL bằng `SELECT 1`, trả `200` khi DB sẵn sàng hoặc `503` khi DB lỗi; payload tối giản, tuyệt đối không tiết lộ connection string, hostname nội bộ, credentials, stack trace hay thông tin hạ tầng nhạy cảm.
- Không thêm endpoint `/auth/sessions/*`. Revoke session kiểm chứng qua integration tests cho `/auth/logout`, `/auth/me/password`, token reuse revocation trên toàn bộ `family_id`, và `PATCH /admin/users/:id/status`.

### 3.3. Chi tiết Quy tắc `D-2A2-03` (`REVISED AND APPROVED UNDER THE RULES ABOVE`)
1. **TourNode Publication Filter (toàn bộ Public API):** Mọi endpoint `/api/v1/public/*` chỉ được sử dụng/xuất `TourNode` thỏa đồng thời `status === 'PUBLISHED' && deletedAt === null && panoramaAsset.isPreviewApproved === true`. Mọi node không đạt chuẩn đều phải mask `defaultEntryNodeSlug`, `defaultNodeSlug`, `primaryNodeSlug`, `nodeSlug`, `tourNodeSlug` thành `null`, `publishedNodeCount` thành `0`, `nodes[]`/`tourNodes[]` loại bỏ hoàn toàn (không rò rỉ slug, ID hay thông tin nội bộ).
2. **Location DTO:** `GET /api/v1/public/locations` trả `PublicLocationSummaryDto[]`; `GET /api/v1/public/locations/:slug` trả `PublicLocationDetailDto`.
3. **Open Day Session Privacy (Điều chỉnh bắt buộc):** `GET /api/v1/public/events` **chỉ** trả session có `isPublic === true && status === 'PUBLISHED' && deletedAt === null`. Tuyệt đối không trả session `isPublic = false` cho request công khai kể cả khi event cha đã `PUBLISHED`. Không tự tạo endpoint private/invited session mới ngoài contract.
4. **OpenDayQuizItem:** Chỉ trả quiz item có `status === 'PUBLISHED' && deletedAt === null`, tuyệt đối ẩn `correctIndex` và `explanation`; đặt `tourNodeSlug = null` nếu node liên quan chưa đạt điều kiện mục (1). Vì bảng `open_day_quiz_items` trong `prisma/schema.prisma` không có `event_id` FK (chỉ có `tour_node_id` nullable), truy vấn chỉ lọc theo trạng thái publish thực tế trên bảng `open_day_quiz_items` (không tự suy diễn quan hệ với event/session hay sửa Prisma schema/migration).

### 3.4. Chi tiết Quy tắc `D-2A2-04` (`APPROVED WITH CONDITIONS`)
- Cookie `refresh_token`: `HttpOnly = true`, `SameSite = Lax`, `Path = /api/v1/auth`; `Secure = true` trên production HTTPS, chỉ tắt `Secure` trên local HTTP dev (`NODE_ENV !== 'production'`).
- `POST /api/v1/auth/refresh` và `POST /api/v1/auth/logout` bắt buộc kiểm tra đồng thời:
  1. Nếu có header `Origin`, phải khớp chính xác origin trong `WEB_ORIGIN`.
  2. Nếu không có `Origin`, lấy origin từ header `Referer` để đối chiếu `WEB_ORIGIN`; nếu cả hai đều thiếu hoặc không khớp -> từ chối `403 FORBIDDEN`.
  3. Header `X-Requested-With` bắt buộc có giá trị chính xác `XMLHttpRequest` (`403 FORBIDDEN` nếu thiếu/sai).
- CORS: chỉ whitelist các origin từ `WEB_ORIGIN`, bật `credentials: true`, cấm wildcard `*` cùng credentials, chỉ mở HTTP methods & headers thực sự cần thiết (`GET,POST,PATCH,DELETE,OPTIONS`; `Authorization,Content-Type,X-Requested-With`).

---

## 4. Kiến trúc Module Mục tiêu `apps/api/` (NestJS Modular Monolith)

```text
apps/api/
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── nest-cli.json
└── src/
    ├── main.ts                              # Prefix /api/v1, Helmet, cookie-parser, CORS, ValidationPipe
    ├── app.module.ts
    ├── config/
    │   ├── env.schema.ts                    # Zod validation khớp .env.example (no insecure defaults)
    │   └── app-config.module.ts
    ├── common/
    │   ├── adapters/prisma.service.ts       # PrismaClient lifecycle + health SELECT 1
    │   ├── decorators/                      # @Public(), @CurrentUser(), @RequirePermissions(), @AllowMustChangePassword()
    │   ├── filters/api-exception.filter.ts  # Chuẩn hóa ApiErrorEnvelope + Prisma error mapping (P2002 -> 409)
    │   ├── guards/                          # JwtAuth, AccountActive, ForcePasswordChanged, Permissions, CsrfCookie
    │   ├── interceptors/response-envelope.interceptor.ts
    │   ├── middleware/request-id.middleware.ts
    │   └── utils/
    │       ├── enum-mappers.ts              # BuildingCategory & MapBuildingIconKey bidirectional (R-05)
    │       ├── phone-normalizer.ts          # E.164 / VN phone normalization (OD-04)
    │       ├── ip-sanitizer.ts              # net.isIP guard cho PostgreSQL INET
    │       └── token-crypto.ts              # Argon2id (65536, t=3, p=1), 64B random token, SHA-256
    ├── modules/
    │   ├── health/                          # GET /api/v1/health
    │   ├── storage/                         # StorageAdapter interface + LocalStorageAdapter (traversal/symlink safe)
    │   ├── audit-log/                       # AuditLogService (scrub sensitive fields) + GET /admin/audit-logs
    │   ├── users-rbac/                      # User lookup, Role/Permission loader, Admin user CRUD/provisioning
    │   ├── auth/                            # Login, Refresh rotation/reuse, Logout, /me, /me/password, /activate/*
    │   └── public/                          # Campus, Buildings, Floors, Locations, TourNodes, Events, Quiz verify
    └── test/                                # Unit + Supertest/PostgreSQL integration specs
```

---

## 5. Danh mục Endpoints & Ma trận Bảo mật (`Phase 2A-2`)

| Nhóm | Method & Route | Auth / Guard | Quyền / Rate Limit | Ghi chú Contract |
|---|---|---|---|---|
| **Health** | `GET /api/v1/health` *(Locked `D-2A2-02`)* | `@Public()` | Check DB `SELECT 1` | `200` / `503`, không lộ DSN/hostname/credentials/stack |
| **Auth** | `POST /api/v1/auth/login` | `@Public()` | Brute-force: 5 fail/15m lock + 5 req/min IP | `username\|email\|phone`, trả `LoginResponse` + `HttpOnly` cookie |
| **Auth** | `POST /api/v1/auth/refresh` | Cookie + `CsrfCookieGuard` | Rate limit vừa phải | Rotate token trong `family_id`; reuse -> thu hồi cả `family_id` (`401`) |
| **Auth** | `POST /api/v1/auth/logout` | Cookie + `CsrfCookieGuard` | Authenticated optional / cookie | Thu hồi refresh token hiện tại, clear cookie, ghi `AUDIT` |
| **Auth** | `GET /api/v1/auth/me` | `JwtAuth` + `AccountActive` | `@AllowMustChangePassword()` | Trả `AuthUserProfileDto` kèm `eventParticipations[]` |
| **Auth** | `PATCH /api/v1/auth/me/password` | `JwtAuth` + `AccountActive` | `@AllowMustChangePassword()` | Verify Argon2id cũ, min 12 chars, hạ `mustChangePassword=false`, revoke phiên khác |
| **Activate** | `POST /api/v1/auth/activate/validate` | `@Public()` | Strict rate limit | SHA-256 lookup `account_invitations`, không lộ raw token/chi tiết thừa |
| **Activate** | `POST /api/v1/auth/activate/complete` | `@Public()` | Strict rate limit | Atomic single-use update + Argon2id hash, kích hoạt `email`/`phone` login |
| **Admin Users** | `GET /api/v1/admin/users` *(Locked `D-2A2-01`)* | Full Chain + `ForcePwdChanged` | **`users:manage` ONLY** | Quyền provision KHÔNG đọc toàn bộ users; lọc `userType`, `accountStatus`, `activationStatus`, `provisioningMethod`, `openDayEventKey` |
| **Admin Users** | `POST /api/v1/admin/users` *(Locked `D-2A2-01`)* | Full Chain + `ForcePwdChanged` | `users:manage` hoặc `users:provision_openday` (object-scoped) | Provisioning đơn lẻ; `provision_openday` chỉ tạo `STUDENT/PARENT` không `roleCodes`; `ADMIN_DIRECT` trả token 1 lần, `EMAIL_SMS_INVITATION` dùng stub không trả raw token |
| **Admin Users** | `PATCH /api/v1/admin/users/:id/status` *(Locked `D-2A2-01`)* | Full Chain + `ForcePwdChanged` | `users:manage` hoặc `users:provision_openday` + **object-level target check** | Kiểm tra `target.userType` trước khi xử lý; cấm tự khóa hoặc khóa root `admin`; revoke active refresh tokens khi khóa/reset |
| **Admin Users** | `POST /api/v1/admin/users/:id/invitations/resend` *(Locked `D-2A2-01`)* | Full Chain + `ForcePwdChanged` | `users:manage` hoặc `users:provision_openday` + **object-level target check** | Kiểm tra `target.userType`; vô hiệu hóa token mời cũ, tăng `resendCount`, tạo SHA-256 hash mới |
| **Audit** | `GET /api/v1/admin/audit-logs` *(Locked `D-2A2-01`)* | Full Chain + `ForcePwdChanged` | **`audit:read` ONLY** | Phân trang + lọc `actor`, `action`, `resourceType`, `from`, `to` |
| **Public** | `GET /api/v1/public/campus` | `@Public()` | Read-only | Mask `defaultEntryNodeSlug` & `building.defaultNodeSlug` thành `null` nếu node chưa publish+approved |
| **Public** | `GET /api/v1/public/buildings/:slug` & `/:slug/floors` | `@Public()` | Read-only | `PUBLISHED`, `activeFloorPlan` nullable (`OD-10`), `floor.nodes` chỉ node publish+approved |
| **Public** | `GET /api/v1/public/locations` & `/:slug` | `@Public()` | Read-only | Liệt kê trả `PublicLocationSummaryDto[]`; `:slug` trả `PublicLocationDetailDto`; `primaryNodeSlug=null` khi node chưa duyệt |
| **Public** | `GET /api/v1/public/tour/nodes` & `/:slug` | `@Public()` | Read-only | Chỉ `PUBLISHED && deletedAt===null && isPreviewApproved===true` (`[]` / `404` trên seed AI hiện tại) |
| **Public** | `GET /api/v1/public/events` | `@Public()` | Read-only | **CHỈ** trả session `isPublic=true && status=PUBLISHED`; `quizItems` `status=PUBLISHED` ẩn `correctIndex`/`explanation`; mask `nodeSlug`/`tourNodeSlug=null` |
| **Public** | `POST /api/v1/public/quiz/verify` | `@Public()` | Moderate rate limit | Stateless verification trên item `status=PUBLISHED`, trả `QuizVerifyResponse` không ghi DB |

---

## 6. Ghi chú Triển khai `LocalStorageAdapter` & Kỹ thuật Cốt lõi

1. **`LocalStorageAdapter` (`STORAGE_DRIVER=local`):**
   - `LOCAL_MEDIA_ROOT=apps/web/public/images` trong `.env.example`, trong khi `media_assets` seed lưu key `/images/locations/...` và `/images/panoramas/...`.
   - Adapter chuẩn hóa `LOCAL_MEDIA_ROOT` sao cho key `/images/...` khớp đúng `<repoRoot>/apps/web/public/images/...` (tránh lỗi double `/images/images/`), đồng thời kế thừa toàn bộ luật chống path traversal, null byte, backslash, UNC/Windows drive, encoded `..` và `realpathSync` symlink escape từ `prisma/verify-db-integrity.ts`.
   - Không mở route ghi/upload (`POST /admin/storage/local-upload/:token`) trong `2A-2` (thuộc `2A-3`).
2. **Bảo vệ Access JWT ngay cả khi còn hạn ngắn (15m):**
   - Trong `JwtAuthGuard`, verify chữ ký JWT (dùng `JWT_SECRET`) đồng thời kiểm tra nhanh trạng thái user hiện hành (`deletedAt IS NULL`, `accountStatus === 'ACTIVE'`, `mustChangePassword`) hoặc đọc quyền từ DB để thu hồi quyền tức thì nếu Admin khóa tài khoản hoặc user vừa đổi mật khẩu.
3. **Rate Limiting (`RATE_LIMIT_STORE=memory`):**
   - Áp dụng `@nestjs/throttler` in-memory cho MVP `2A-2` với ngưỡng chặt cho `/auth/login`, `/auth/activate/*`, `/auth/refresh` và bảo vệ chống `failedLoginAttempts >= 5` -> `lockedUntil = now + 15m` ghi DB + `AuditLog`.

---

## 7. Lộ trình Milestones 1–6 (Đã Khóa Theo `D-2A2-01..04`)

1. **Milestone 1 — NestJS Skeleton (`apps/api`):** Khởi tạo `apps/api/package.json`, `tsconfig`, `main.ts` (`helmet`, `cookie-parser`, CORS `WEB_ORIGIN` + `credentials: true`), `ConfigModule`, `PrismaService`, `ResponseEnvelopeInterceptor`, `ApiExceptionFilter`, `RequestIdMiddleware`, `HealthModule` (`GET /api/v1/health` theo `D-2A2-02`).
2. **Milestone 2 — `StorageModule` (`STORAGE_DRIVER=local`):** Interface `StorageAdapter` + `LocalStorageAdapter`, kiểm chứng 11 seeded assets trên đĩa qua unit tests (bao gồm negative traversal/symlink/encoding tests).
3. **Milestone 3 — `AuthModule`, `UsersRbacModule`, `AuditLogModule`:** Phone normalizer, Argon2id, Login/Lockout, Refresh rotation & reuse `family_id` revocation, Logout, `/me`, `/me/password` + `403 PASSWORD_CHANGE_REQUIRED`, `CsrfCookieGuard` (`D-2A2-04`), Activation validate/complete, và 5 endpoint non-bulk §4.7 với RBAC phân tách + object-level check theo `D-2A2-01`.
4. **Milestone 4 — `PublicModule`:** Triển khai đủ 9 endpoint Public Read + Stateless Quiz Verify dùng `@fpt-campus/shared` & enum mappers (`R-05`), đảm bảo mọi rule cách ly `D-2A2-03` (0 rò rỉ node `DRAFT` / soft-deleted / panorama chưa duyệt, **chặn `isPublic=false` khỏi `/public/events`**, ẩn `correctIndex`/`explanation`, tách `PublicLocationSummaryDto` vs `PublicLocationDetailDto`).
5. **Milestone 5 — Comprehensive Tests (PostgreSQL 16 thật):** Unit tests + HTTP Integration & Security Negative Tests trên PostgreSQL cô lập:
   - Auth/Session/Revoke: expired token, malformed/tampered token, revoked session (`/logout`, `/me/password` revoking sibling sessions, `/admin/users/:id/status` revoking locked user sessions), refresh reuse revoking entire `family_id`, brute-force lockout, `mustChangePassword` 403 gate.
   - RBAC & Provisioning: `users:provision_openday` bị `403` trên `GET /admin/users`, `GET /admin/audit-logs`, tạo `STAFF`, truyền `roleCodes`, và `PATCH /status` hoặc `POST /resend` lên tài khoản `ADMIN`/`STAFF`; `ADMIN_DIRECT` single-use + expiry + replay failure; `EMAIL_SMS_INVITATION` không trả raw token.
   - CSRF & CORS: `POST /auth/refresh` & `/auth/logout` bị `403` khi sai `Origin`, thiếu `Origin`/`Referer`, hoặc thiếu/sai `X-Requested-With`; CORS reject origin ngoài `WEB_ORIGIN` & không trả `*` với credentials.
   - Public Data Isolation (`D-2A2-03`): chứng minh node `DRAFT`, node soft-deleted, panorama `isPreviewApproved=false` không xuất hiện hoặc lộ slug/ID trên bất kỳ `/public/*` endpoint nào; session `isPublic=false` không xuất hiện trong `GET /public/events`; quiz payload không có `correctIndex`/`explanation`.
6. **Milestone 6 — Verification & Phase 2A-2 Final Report:** Chạy `pnpm -r typecheck`, `pnpm -r lint`, `pnpm -r build`, `pnpm --filter api test`, `pnpm db:test`, `apps/web` `DATA_SOURCE=mock` 19 routes HTTP 200; kiểm tra không lộ secret/token vào log/audit; lập báo cáo đầy đủ 10 mục nghiệm thu theo yêu cầu Chủ dự án và dừng lại chờ nghiệm thu trên `feat/phase-2a-2-core-backend`.
