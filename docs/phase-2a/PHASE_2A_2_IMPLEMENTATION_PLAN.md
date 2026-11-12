# PHASE 2A-2 — CORE BACKEND & AUTHENTICATION IMPLEMENTATION PLAN (MILESTONE 0)

- **Ngày lập kế hoạch:** 2026-11-12
- **Trạng thái hiện tại:** `MILESTONE 0 COMPLETED — AWAITING OWNER CONFIRMATION ON D-2A2-01..04 BEFORE CODING`
- **Baseline `main`:** `8b6c206` (`docs: reconcile project documentation after phase 2a-1 acceptance`)
- **Nhánh triển khai (`Phase 2A-2`):** `feat/phase-2a-2-core-backend` *(tách từ `8b6c206`; chưa chạm mã nguồn ứng dụng)*
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

> [!CAUTION]
> **Ràng buộc Milestone 0:** Chưa khởi tạo `apps/api/`, chưa cài package NestJS mới, chưa chỉnh sửa `prisma/*`, `packages/shared/*` hoặc `apps/web/*`. Chỉ bắt đầu Milestone 1 sau khi Chủ dự án xác nhận 4 điểm quyết định/làm rõ contract (**`D-2A2-01`** → **`D-2A2-04`**) tại Mục 3.

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

## 3. Các Điểm Mâu Thuẫn / Thiếu Quyết Định Ảnh Hưởng Security, Schema hoặc API Contract (Cần Chủ Dự Án Chốt Trước Milestone 1)

Trong quá trình đối chiếu chéo `PHASE_2A_SCOPE_FINALIZATION_REPORT.md`, `PHASE_2A_API_CONTRACT.md`, `ADMIN_AUTH_AND_SECURITY_ARCHITECTURE.md`, `prisma/schema.prisma`, `prisma/seed.ts` và đặc tả `Phase 2A-2`, phát hiện **4 điểm cần xác nhận chính thức** dưới đây:

### `D-2A2-01` — Phạm vi, Phân quyền & Response DTO của `/api/v1/admin/users*` và `/api/v1/admin/audit-logs`
- **Mâu thuẫn / Thiếu đặc tả phát hiện:**
  1. `PHASE_2A_SCOPE_FINALIZATION_REPORT.md` (Mục 2) xếp Mục `4.7` vào `Phase 2A-3`, trong khi yêu cầu `Phase 2A-2` giao rõ *"Admin/Staff provisioning"* + *"Hỗ trợ Admin tạo hoặc provision tài khoản theo contract được duyệt"* và chỉ giữ *"Excel/CSV bulk import"* ở `Phase 2A-3`. Nếu không mở API quản lý/cấp phát đơn lẻ, `Admin`/`Operator` chưa có HTTP endpoint để tạo user và phát hành token kích hoạt phục vụ luồng `/activate/*` trong `2A-2`.
  2. `PHASE_2A_API_CONTRACT.md` Mục `4.7` liệt kê 3 permission (`users:manage`, `users:provision_openday`, `audit:read`) nhưng **chưa quy định ranh giới phân quyền giữa `SUPER_ADMIN` (`users:manage`) và `EVENT_OPERATOR` (`users:provision_openday`)** trên `GET/POST /admin/users`, `PATCH /admin/users/:id/status`, `POST /admin/users/:id/invitations/resend`.
  3. `packages/shared/src/auth.ts` có `AdminCreateUserRequest`, nhưng **chưa có DTO response cho `POST /api/v1/admin/users` và `POST /api/v1/admin/users/:id/invitations/resend`** khi `provisioningMethod === 'ADMIN_DIRECT'`.
- **Đề xuất chốt cho `Phase 2A-2`:**
  1. Triển khai 5 endpoint non-bulk thuộc Mục `4.7` trong `2A-2`: `GET /api/v1/admin/users`, `POST /api/v1/admin/users`, `PATCH /api/v1/admin/users/:id/status`, `POST /api/v1/admin/users/:id/invitations/resend`, `GET /api/v1/admin/audit-logs` (giữ nguyên `/import/preview` & `/import/confirm` cho `2A-3`).
  2. Ràng buộc RBAC chặt cho `users:provision_openday` (khi thiếu `users:manage`): chỉ được xem/tạo/resend/khóa-mở khóa tài khoản `userType ∈ { STUDENT, PARENT }`, **cấm** truyền `roleCodes` hoặc đụng tài khoản `ADMIN` / `STAFF` (`403 FORBIDDEN`). Tài khoản `ADMIN`/`STAFF` & gán `roleCodes` bắt buộc `users:manage`.
  3. Với `POST /admin/users` & `invitations/resend`: khi `ADMIN_DIRECT`, backend băm SHA-256 trước khi lưu `account_invitations.token_hash` và trả **duy nhất 1 lần** `{ user, invitation: { id, channel, status, expiresAt, activationToken } }` cho Admin đang gọi; với `EMAIL_SMS_INVITATION` (chưa tích hợp SMTP/SMS ngoài ở `2A-2`), đánh dấu `SENT` qua delivery adapter cục bộ và **tuyệt đối không** trả hay log raw token ra stdout/`audit_logs`.

### `D-2A2-02` — Endpoint Health Check & Phạm vi "Revoke Session"
- **Thiếu đặc tả phát hiện:**
  - Yêu cầu triển khai `Phase 2A-2` nêu *"Health endpoint — Database connectivity check"* và *"Revoke session"*, đồng thời cấm *"tự ý tạo endpoint hoặc thay đổi semantics của endpoint đã định nghĩa trong API Contract"*.
  - Hiện `PHASE_2A_API_CONTRACT.md` **chưa có route `/health`** và không có route riêng `DELETE /auth/sessions/:id`.
- **Đề xuất chốt:**
  1. Bổ sung endpoint **`GET /api/v1/health`** (public, không auth, ping PostgreSQL `SELECT 1`, trả HTTP `200` khi DB up / `503` khi DB down với format ApiEnvelope `{ status: "ok" | "error", database: "up" | "down", timestamp }`) và cập nhật 1 dòng tham chiếu tương ứng vào `PHASE_2A_API_CONTRACT.md` khi duyệt.
  2. Khẳng định cơ chế **"Revoke session"** thực thi qua các endpoint đã khóa trong contract (`POST /auth/logout` thu hồi session hiện tại, `PATCH /auth/me/password` thu hồi các phiên khác của user, reuse detection thu hồi toàn bộ `family_id`, và `PATCH /admin/users/:id/status` thu hồi toàn bộ refresh token khi `LOCKED`/`SUSPENDED`/`ARCHIVED`/reset), **không tự ý thêm endpoint `/auth/sessions/*` ngoài contract**.

### `D-2A2-03` — Lọc Dữ liệu `DRAFT` (`D-02`) trên Public APIs & Khớp DTO `@fpt-campus/shared`
- **Sai khác giữa Seed / Schema / Mô tả API phát hiện:**
  1. Trong `prisma/seed.ts` (đã chốt `D-02`), toàn bộ `5` `TourNode` đều đang `DRAFT` (`panoramaAsset.isPreviewApproved = false`), nhưng `Campus.defaultEntryNodeId`, `Building.defaultNodeId`, `Location.primaryNodeId`, `OpenDaySession.tourNodeId` và `OpenDayQuizItem.tourNodeId` đều đang trỏ tới các node `DRAFT` đó. Nếu Public API serialize nguyên `slug` từ DB khi `TourNode` còn `DRAFT`, client sẽ nhận slug dẫn tới `404` trên `/public/tour/nodes/:slug` và rò rỉ node chưa duyệt.
  2. `PHASE_2A_API_CONTRACT.md` Mục `2.4` mô tả chung có `gallery[]`, `tourNodes[]`, trong khi `@fpt-campus/shared` phân tách `PublicLocationSummaryDto` (danh sách `GET /public/locations` không có `gallery`/`tourNodes`) và `PublicLocationDetailDto` (chi tiết `GET /public/locations/:slug` mới có `gallery[]` & `tourNodes[]`).
  3. `OpenDayQuizItem` trong `prisma/schema.prisma` không có cột `eventId` (chỉ có `tourNodeId` nullable), và trong `prisma/seed.ts` có `2/6` `OpenDaySession` đặt `isPublic = false` (`status = PUBLISHED`).
- **Đề xuất chốt:**
  1. Áp dụng nguyên tắc **"Zero DRAFT-Node Leak"** thống nhất trên mọi `/api/v1/public/*`: chỉ serialize `nodeSlug` / `defaultEntryNodeSlug` / `defaultNodeSlug` / `primaryNodeSlug` / `tourNodeSlug` / `nodes[]` / `publishedNodeCount` khi `TourNode` thỏa `status = 'PUBLISHED' AND deletedAt IS NULL AND panoramaAsset.isPreviewApproved = true`; ngược lại trả `null` / `0` / `[]`.
  2. Tuân thủ đúng `@fpt-campus/shared`: `GET /public/locations` trả `PublicLocationSummaryDto[]`, `GET /public/locations/:slug` trả `PublicLocationDetailDto`.
  3. `GET /public/events` trả cả session `isPublic = true` (`accessType: "public"`) lẫn `isPublic = false` (`accessType: "invited"`) có `status = PUBLISHED` (khớp `shared-contracts.ts` & Mục `2.5`), và trả `open_day_quiz_items` `status = PUBLISHED` (masking `tourNodeSlug = null` nếu node chưa duyệt/publish) không phụ thuộc `eventKey` vì schema `open_day_quiz_items` không có `event_id`.

### `D-2A2-04` — Cơ chế CSRF Guard & Cookie trên Local Dev (`localhost:3000` ↔ `localhost:4000`)
- **Điểm cần làm rõ bảo mật:**
  - `ADMIN_AUTH_AND_SECURITY_ARCHITECTURE.md` Mục `2.2–2.3` quy định cookie `refresh_token` đặt `HttpOnly; SameSite=Lax; Path=/api/v1/auth` (`Secure=true` ở HTTPS/Prod; chỉ tắt `Secure` trên `http://localhost`), và 2 endpoint cookie (`POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`) **bắt buộc** kiểm tra `Origin`/`Referer` khớp `WEB_ORIGIN` **và** custom header `X-Requested-With: XMLHttpRequest`.
- **Đề xuất chốt:**
  - CORS cho phép `WEB_ORIGIN` (hỗ trợ danh sách phân tách dấu phẩy, `credentials: true`), allowed headers gồm `Authorization`, `Content-Type`, `X-Requested-With`.
  - CSRF Guard áp dụng bắt buộc cho `POST /api/v1/auth/refresh` và `POST /api/v1/auth/logout`: từ chối `403 FORBIDDEN` nếu thiếu/sai `Origin` (hoặc `Referer` khi thiếu `Origin`) so với whitelist `WEB_ORIGIN`, **hoặc** thiếu `X-Requested-With: XMLHttpRequest`. (`POST /auth/login` không đọc cookie cũ nên chỉ kiểm `Origin` qua CORS + rate limit, không làm gãy standard JSON clients).

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
| **Health** | `GET /api/v1/health` *(pending `D-2A2-02`)* | `@Public()` | Check DB `SELECT 1` | `200` / `503` |
| **Auth** | `POST /api/v1/auth/login` | `@Public()` | Brute-force: 5 fail/15m lock + 5 req/min IP | `username\|email\|phone`, trả `LoginResponse` + `HttpOnly` cookie |
| **Auth** | `POST /api/v1/auth/refresh` | Cookie + `CsrfCookieGuard` | Rate limit vừa phải | Rotate token trong `family_id`; reuse -> thu hồi cả `family_id` (`401`) |
| **Auth** | `POST /api/v1/auth/logout` | Cookie + `CsrfCookieGuard` | Authenticated optional / cookie | Thu hồi refresh token hiện tại, clear cookie, ghi `AUDIT` |
| **Auth** | `GET /api/v1/auth/me` | `JwtAuth` + `AccountActive` | `@AllowMustChangePassword()` | Trả `AuthUserProfileDto` kèm `eventParticipations[]` |
| **Auth** | `PATCH /api/v1/auth/me/password` | `JwtAuth` + `AccountActive` | `@AllowMustChangePassword()` | Verify Argon2id cũ, min 12 chars, hạ `mustChangePassword=false`, revoke phiên khác |
| **Activate** | `POST /api/v1/auth/activate/validate` | `@Public()` | Strict rate limit | SHA-256 lookup `account_invitations`, không lộ raw token/chi tiết thừa |
| **Activate** | `POST /api/v1/auth/activate/complete` | `@Public()` | Strict rate limit | Atomic single-use update + Argon2id hash, kích hoạt `email`/`phone` login |
| **Admin Users** | `GET /api/v1/admin/users` *(pending `D-2A2-01`)* | Full Chain + `ForcePwdChanged` | `users:manage` hoặc `users:provision_openday` (scoped) | Lọc theo `userType`, `accountStatus`, `activationStatus`, `provisioningMethod`, `openDayEventKey` |
| **Admin Users** | `POST /api/v1/admin/users` *(pending `D-2A2-01`)* | Full Chain + `ForcePwdChanged` | `users:manage` / `users:provision_openday` (scoped) | `ADMIN_DIRECT` / `EMAIL_SMS_INVITATION`, chuẩn hóa `email`/`phone` trước check `409`, không bulk Excel |
| **Admin Users** | `PATCH /api/v1/admin/users/:id/status` *(pending `D-2A2-01`)* | Full Chain + `ForcePwdChanged` | `users:manage` (hoặc scoped Open Day) | Cấm tự khóa tài khoản `admin` đang đăng nhập; revoke active refresh tokens khi khóa/reset |
| **Admin Users** | `POST /api/v1/admin/users/:id/invitations/resend` *(pending `D-2A2-01`)* | Full Chain + `ForcePwdChanged` | `users:manage` / `users:provision_openday` | Thu hồi token mời cũ, tăng `resendCount`, tạo token hash mới |
| **Audit** | `GET /api/v1/admin/audit-logs` *(pending `D-2A2-01`)* | Full Chain + `ForcePwdChanged` | `audit:read` | Phân trang + lọc `actor`, `action`, `resourceType`, `from`, `to` |
| **Public** | `GET /api/v1/public/campus` | `@Public()` | Read-only | Mask `defaultEntryNodeSlug` & `building.defaultNodeSlug` nếu node chưa publish+approved |
| **Public** | `GET /api/v1/public/buildings/:slug` & `/:slug/floors` | `@Public()` | Read-only | `PUBLISHED`, `activeFloorPlan` nullable (`OD-10`), `floor.nodes` chỉ node đã publish+approved |
| **Public** | `GET /api/v1/public/locations` & `/:slug` | `@Public()` | Read-only | Lọc `buildingCode`, `category`, `typeCode`, `q`; `primaryNodeSlug=null` khi chưa có node duyệt |
| **Public** | `GET /api/v1/public/tour/nodes` & `/:slug` | `@Public()` | Read-only | Chỉ `PUBLISHED` & `isPreviewApproved=true` (`[]` / `404` trên seed AI hiện tại) |
| **Public** | `GET /api/v1/public/events` | `@Public()` | Read-only | Không lộ `correctIndex`/`explanation` (`OD-08`); mask `nodeSlug=null` nếu node chưa duyệt |
| **Public** | `POST /api/v1/public/quiz/verify` | `@Public()` | Moderate rate limit | Stateless verification, trả `QuizVerifyResponse` không ghi DB |

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

## 7. Lộ trình Milestones 1–6 (Sau Khi Chốt `D-2A2-01..04`)

1. **Milestone 1 — NestJS Skeleton (`apps/api`):** Khởi tạo `apps/api/package.json`, `tsconfig`, `main.ts`, `ConfigModule`, `PrismaService`, `ResponseEnvelopeInterceptor`, `ApiExceptionFilter`, `RequestIdMiddleware`, `HealthModule`.
2. **Milestone 2 — `StorageModule` (`STORAGE_DRIVER=local`):** Interface `StorageAdapter` + `LocalStorageAdapter`, kiểm chứng 11 seeded assets trên đĩa qua unit tests (negative traversal/symlink tests).
3. **Milestone 3 — `AuthModule`, `UsersRbacModule`, `AuditLogModule`:** Phone normalizer, Argon2id, Login/Lockout, Refresh rotation & reuse family revocation, Logout, `/me`, `/me/password` + `403 PASSWORD_CHANGE_REQUIRED`, Activation validate/complete, và Section 4.7 non-bulk Admin User & Audit endpoints theo quyết định `D-2A2-01`.
4. **Milestone 4 — `PublicModule`:** Triển khai đủ 9 endpoint Public Read + Stateless Quiz Verify dùng `@fpt-campus/shared` & enum mappers (`R-05`), đảm bảo 0 rò rỉ `DRAFT`/`isPreviewApproved=false`/`correctIndex`.
5. **Milestone 5 — Comprehensive Tests (PostgreSQL 16 thật):** Unit tests (`phone-normalizer`, `token-crypto`, `enum-mappers`, `LocalStorageAdapter`) + Integration tests HTTP Supertest trên Postgres DB test cô lập cho toàn bộ Auth/RBAC/CSRF/Activation/Provisioning/Public/Quiz.
6. **Milestone 6 — Verification & Phase 2A-2 Report:** Chạy `pnpm -r typecheck`, `pnpm -r lint`, `pnpm -r build`, `pnpm --filter api test`, `pnpm db:test`, `apps/web` `DATA_SOURCE=mock` 19 routes HTTP 200; kiểm tra secret/log hygiene; xuất `PHASE_2A_2_IMPLEMENTATION_REPORT.md` và cập nhật `PHASE_2A_API_CONTRACT.md` (mục `Health` & chi tiết `4.7`) theo quyết định đã duyệt.
