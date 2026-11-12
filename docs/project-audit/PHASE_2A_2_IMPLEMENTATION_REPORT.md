# PHASE 2A-2 — CORE BACKEND & AUTHENTICATION IMPLEMENTATION REPORT

**Ngày lập báo cáo:** 12/11/2026  
**Giai đoạn:** `Phase 2A-2` — Core Backend & Authentication (`apps/api`, NestJS 11 Modular Monolith)  
**Nhánh Git (`branch`):** `feat/phase-2a-2-core-backend` (tách từ `main` tại commit `8b6c206`, đã khóa quyết định Milestone 0 tại `ae83c32`; **chưa merge và chưa push vào `main`**)  
**Tài liệu đối chiếu:** [`PHASE_2A_2_IMPLEMENTATION_PLAN.md`](../phase-2a/PHASE_2A_2_IMPLEMENTATION_PLAN.md) · [`PHASE_2A_API_CONTRACT.md`](../phase-2a/PHASE_2A_API_CONTRACT.md) · [`PHASE_2A_DATABASE_DESIGN.md`](../phase-2a/PHASE_2A_DATABASE_DESIGN.md) · [`ADMIN_AUTH_AND_SECURITY_ARCHITECTURE.md`](../architecture/ADMIN_AUTH_AND_SECURITY_ARCHITECTURE.md)

---

## 1. Tóm tắt Kiến trúc & Phạm vi Đã Triển khai (`Milestone 1 → Milestone 6`)

Ứng dụng backend lõi `apps/api` (`@nestjs/*` v11, Express 5, TypeScript strict, Prisma 6.19.3, Argon2id, Zod, `cookie-parser`, `helmet`, `@nestjs/throttler`) đã được triển khai đầy đủ trong phạm vi phê duyệt cho **Phase 2A-2**, kết nối trực tiếp vào cơ sở dữ liệu PostgreSQL 16 (`fpt_virtual_campus_db`) và dùng chung contract `@fpt-campus/shared` qua workspace dependency:

| Milestone | Thành phần / Module | Phạm vi & Hiện thực |
|---|---|---|
| **M0** | Doc & Decision Lock (`ae83c32`) | Khóa 4 quyết định `D-2A2-01` → `D-2A2-04` trong kế hoạch và hợp đồng API trước khi tạo mã nguồn `apps/api/`. |
| **M1** | Foundation, Config, Storage & Health | [`AppConfigModule`](../../apps/api/src/config/app-config.module.ts), [`env.schema.ts`](../../apps/api/src/config/env.schema.ts), [`PrismaModule`](../../apps/api/src/common/adapters/prisma.module.ts), [`RequestIdMiddleware`](../../apps/api/src/common/middleware/request-id.middleware.ts), [`ResponseEnvelopeInterceptor`](../../apps/api/src/common/interceptors/response-envelope.interceptor.ts), [`ApiExceptionFilter`](../../apps/api/src/common/filters/api-exception.filter.ts), [`StorageModule`](../../apps/api/src/modules/storage/storage.module.ts) (`LocalStorageAdapter`), [`HealthModule`](../../apps/api/src/modules/health/health.module.ts) (`GET /api/v1/health`). |
| **M2** | Auth, Session Rotation, CSRF & Password Guards | [`AuthModule`](../../apps/api/src/modules/auth/auth.module.ts), [`JwtAuthGuard`](../../apps/api/src/common/guards/jwt-auth.guard.ts), [`ForcePasswordChangedGuard`](../../apps/api/src/common/guards/force-password-changed.guard.ts), [`PermissionsGuard`](../../apps/api/src/common/guards/permissions.guard.ts), [`CsrfCookieGuard`](../../apps/api/src/common/guards/csrf-cookie.guard.ts), [`token-crypto.ts`](../../apps/api/src/common/utils/token-crypto.ts), [`phone-normalizer.ts`](../../apps/api/src/common/utils/phone-normalizer.ts). |
| **M3** | Users Provisioning, RBAC & Audit Logs | [`UsersRbacModule`](../../apps/api/src/modules/users-rbac/users-rbac.module.ts), [`invitation-delivery.adapter.ts`](../../apps/api/src/modules/users-rbac/invitation-delivery.adapter.ts), [`AuditLogModule`](../../apps/api/src/modules/audit-log/audit-log.module.ts) (tự động che khóa nhạy cảm trong `diffJson`). |
| **M4** | Public Read APIs + Stateless Quiz + App Bootstrap | [`PublicModule`](../../apps/api/src/modules/public/public.module.ts) (`9` endpoint `/api/v1/public/*`), [`enum-mappers.ts`](../../apps/api/src/common/utils/enum-mappers.ts) (`R-05`), [`AppModule` / `AppCoreModule`](../../apps/api/src/app.module.ts), [`app.setup.ts`](../../apps/api/src/app.setup.ts), [`main.ts`](../../apps/api/src/main.ts). |
| **M5** | Unit Tests & PostgreSQL 16 HTTP Integration Tests | `5` bộ Unit Tests (`19` cases) tại [`apps/api/test/unit/`](../../apps/api/test/unit/token-crypto.spec.ts) và `5` bộ Integration Tests cô lập trên scratch PostgreSQL 16 DB (`15` cases) tại [`apps/api/test/integration/`](../../apps/api/test/integration/test-db.helper.ts). |
| **M6** | Regression & Runtime Verification | Build, typecheck, lint, Jest, `pnpm db:test`, live HTTP smoke test `node dist/main.js`, kiểm tra `apps/web`, quét bảo mật và báo cáo nghiệm thu. |

---

## 2. Danh sách API Endpoints (`22` Endpoints Dưới Prefix `/api/v1`)

| # | Method & Path | Bảo vệ / Quyền | Hành vi Chính Đã Xác minh |
|---|---|---|---|
| 1 | `GET /api/v1/health` | `@Public()`, `@SkipThrottle()` | Chạy `SELECT 1` qua `PrismaService.ping()`; trả `200 ok` hoặc `503 SERVICE_UNAVAILABLE` không lộ DSN/host/credentials/stack trace (`D-2A2-02`). |
| 2 | `POST /api/v1/auth/login` | `@Public()`, `@Throttle(5/60s)` | Đăng nhập bằng `username`, `email` lowercase hoặc số điện thoại chuẩn hóa `+84` (`OD-04`); khóa 15 phút sau 5 lần sai; cấp JWT Access + cookie `refresh_token`. |
| 3 | `POST /api/v1/auth/refresh` | `@Public()`, `CsrfCookieGuard`, `@Throttle(20/60s)` | Xác thực `Origin`/`Referer` + `X-Requested-With: XMLHttpRequest` (`D-2A2-04`), xoay vòng cookie (`revokedAt`), phát hiện replay thu hồi toàn bộ `family_id`. |
| 4 | `POST /api/v1/auth/logout` | `@Public()`, `CsrfCookieGuard` | Kiểm tra CSRF kép (`D-2A2-04`), thu hồi `refresh_tokens`, xóa cookie `refresh_token`, ghi audit `LOGOUT`. |
| 5 | `GET /api/v1/auth/me` | JWT, `@AllowMustChangePassword()` | Hoạt động cả khi `mustChangePassword = true`; trả `AuthUserProfileDto` kèm vai trò, quyền và `eventParticipations`. |
| 6 | `PATCH /api/v1/auth/me/password` | JWT, `@AllowMustChangePassword()` | Xác minh `currentPassword` Argon2id, kiểm tra mật khẩu mới `>=12` ký tự & không nằm danh sách cấm, tắt `mustChangePassword`, thu hồi các session `refresh_tokens` anh em. |
| 7 | `POST /api/v1/auth/activate/validate` | `@Public()`, `@Throttle(10/60s)` | Kiểm tra token kích hoạt bằng SHA-256 (`token_hash`) không lộ lý do nhạy cảm. |
| 8 | `POST /api/v1/auth/activate/complete` | `@Public()`, `@Throttle(5/60s)` | Transaction `updateMany` single-use claim token, đặt mật khẩu Argon2id, đánh dấu `ACTIVATED`; replay trả `409 CONFLICT`. |
| 9 | `GET /api/v1/admin/users` | JWT + `users:manage` | Danh sách phân trang user (không trả `passwordHash`/`tokenHash`); `EVENT_OPERATOR` (`users:provision_openday`) bị chặn `403`. |
| 10 | `POST /api/v1/admin/users` | JWT + (`users:manage` OR `users:provision_openday`) | Chuẩn hóa SĐT E.164, kiểm tra trùng contact (`409`); không có `users:manage` chỉ tạo được `STUDENT`/`PARENT` và cấm truyền `roleCodes`; `ADMIN_DIRECT` trả `activationToken` 1 lần duy nhất; `EMAIL_SMS_INVITATION` dùng local stub trả `null`. |
| 11 | `PATCH /api/v1/admin/users/:id/status` | JWT + (`users:manage` OR `users:provision_openday`) | Object-level check: thiếu `users:manage` không thể thao tác `STAFF`/`ADMIN` (`403`); cấm tự khóa hoặc khóa root `admin` (`422`); khóa/tạm ngưng/reset thu hồi ngay toàn bộ `refresh_tokens` và chặn JWT Bearer kế tiếp. |
| 12 | `POST /api/v1/admin/users/:id/invitations/resend` | JWT + (`users:manage` OR `users:provision_openday`) | Object-level check target userType; vô hiệu hóa invitation cũ (`EXPIRED`), cấp token mới tăng `resendCount`. |
| 13 | `GET /api/v1/admin/audit-logs` | JWT + `audit:read` | Phân trang `audit_logs` với lọc `actor`, `action`, `resourceType`, `from`, `to`. |
| 14 | `GET /api/v1/public/campus` | `@Public()` | `PublicCampusResponseDto`: `defaultEntryNodeSlug` và `buildings[].defaultNodeSlug` ẩn thành `null`, `publishedNodeCount = 0` khi node chưa đạt đủ điều kiện `D-2A2-03`. |
| 15 | `GET /api/v1/public/buildings/:slug` | `@Public()` | `PublicBuildingDetailDto`: tòa nhà + danh sách tầng `PUBLISHED`. |
| 16 | `GET /api/v1/public/buildings/:slug/floors` | `@Public()` | `PublicFloorSummaryDto[]`: chỉ phát floor pin & node pin đủ điều kiện `D-2A2-03`, dùng `renderObjectKey` / `thumbnailObjectKey` (không bao giờ lộ `sourceObjectKey`). |
| 17 | `GET /api/v1/public/locations` | `@Public()` | `PublicLocationSummaryDto[]`: tách DTO chuẩn (`D-2A2-03` §3.2 — không chứa `gallery` và `tourNodes`), hỗ trợ `buildingCode`, `category`, `typeCode`, `q`. |
| 18 | `GET /api/v1/public/locations/:slug` | `@Public()` | `PublicLocationDetailDto`: bao gồm `gallery` an toàn (`optimizedDesktopKey`/`thumbnailKey`) và chỉ `tourNodes` đủ điều kiện. |
| 19 | `GET /api/v1/public/tour/nodes` | `@Public()` | `TourNodeSummaryDto[]`: chỉ trả các node `PUBLISHED`, `deletedAt=null`, `isPreviewApproved=true`, location & building `PUBLISHED`. Baseline QTSC seed trả `[]`. |
| 20 | `GET /api/v1/public/tour/nodes/:slug` | `@Public()` | `PublicTourNodeDetailDto`: trả `404` với node `DRAFT`/`isPreviewApproved=false`/soft-deleted; lọc bỏ hoàn toàn hotspot `SCENE_LINK` trỏ tới node không đạt điều kiện. |
| 21 | `GET /api/v1/public/events` | `@Public()` | Chỉ trả `OpenDaySession` có `status='PUBLISHED'`, `deletedAt=null` và **`isPublic=true`** (`4/6` session seed; `2` session `isPublic=false` bị loại); đọc `OpenDayQuizItem` không suy diễn `eventId`, bỏ `correctIndex` và `explanation`, ẩn `tourNodeSlug` thành `null` khi node là `DRAFT`. |
| 22 | `POST /api/v1/public/quiz/verify` | `@Public()` | Chấm điểm stateless đối chiếu `OpenDayQuizItem` (`PUBLISHED`), không ghi bảng bài làm hay lead. |

---

## 3. Bằng chứng Tuân thủ `D-2A2-01` → `D-2A2-04`

1. **`D-2A2-01` (RBAC & Provisioning `§4.7`):**
   - `GET /api/v1/admin/users` gắn `@RequirePermissions("users:manage")`; `GET /api/v1/admin/audit-logs` gắn `@RequirePermissions("audit:read")`.
   - `POST /admin/users`, `PATCH /admin/users/:id/status`, `POST /admin/users/:id/invitations/resend` áp dụng logic phân tầng `users:manage || users:provision_openday` + object-level check chặn `EVENT_OPERATOR` động vào `STAFF`/`ADMIN` (`403 FORBIDDEN`) và chặn gán `roleCodes`.
   - Dùng đúng 3 vai trò seed (`SUPER_ADMIN`, `TOUR_EDITOR`, `EVENT_OPERATOR`), không phát minh role mới.
   - `ADMIN_DIRECT` lưu `SHA-256(rawToken)` vào `account_invitations.token_hash`, trả `activationToken` 1 lần duy nhất qua response; `EMAIL_SMS_INVITATION` dùng `LocalStubInvitationDeliveryAdapter` trả `activationToken: null` và không ghi token vào `stdout` hay `audit_logs`.
2. **`D-2A2-02` (Health Check & Quản lý Phiên):**
   - Triển khai `GET /api/v1/health` công khai dùng `SELECT 1`.
   - Không mở `/api/v1/auth/sessions/*`; thu hồi phiên thực hiện qua `/auth/logout`, `/auth/me/password`, phát hiện reuse `family_id`, và `PATCH /admin/users/:id/status`.
3. **`D-2A2-03` (Cô lập Public Data & Chống rò rỉ Tour/Quiz/Session):**
   - Helper trung tâm [`isPublicTourNodeEligible`](../../apps/api/src/modules/public/public.service.ts#L194-L232) kiểm soát thống nhất trên cả `campus`, `buildings`, `floors`, `locations`, `tour/nodes`, `events` (`sessions` + `quizItems`) và lọc `SCENE_LINK` hotspots.
   - Không bao giờ xuất `originalObjectKey` hoặc `sourceObjectKey` trong bất kỳ DTO công khai nào.
   - `GET /api/v1/public/events` lọc cứng `isPublic: true` (`4` session công khai từ baseline seed) và bỏ `correctIndex`, `explanation` khỏi `quizItems`.
4. **`D-2A2-04` (Cookie, CSRF & CORS):**
   - Cookie `refresh_token` đặt `httpOnly: true`, `sameSite: "lax"`, `path: "/api/v1/auth"`, `secure: NODE_ENV === "production"`.
   - [`CsrfCookieGuard`](../../apps/api/src/common/guards/csrf-cookie.guard.ts) kiểm tra **đồng thời** (`Origin` hoặc fallback `Referer` thuộc `WEB_ORIGIN`) **VÀ** `X-Requested-With: XMLHttpRequest` trên `POST /auth/refresh` và `POST /auth/logout`.
   - CORS chỉ cho phép origin hợp lệ từ `WEB_ORIGIN` với `credentials: true` (cấm `*` tại Zod `env.schema.ts`).

---

## 4. Thay đổi Mã nguồn & Ràng buộc Không Chạm

### 4.1. Thống kê tệp trong nhánh `feat/phase-2a-2-core-backend`
- **Tệp tài liệu Milestone 0 đã commit tại `ae83c32`:** [`docs/phase-2a/PHASE_2A_2_IMPLEMENTATION_PLAN.md`](../phase-2a/PHASE_2A_2_IMPLEMENTATION_PLAN.md), [`docs/phase-2a/PHASE_2A_API_CONTRACT.md`](../phase-2a/PHASE_2A_API_CONTRACT.md).
- **Additive DTOs trong `@fpt-campus/shared`:** [`packages/shared/src/api.ts`](../../packages/shared/src/api.ts) (`HealthStatusDto`), [`packages/shared/src/auth.ts`](../../packages/shared/src/auth.ts) (`AdminUserListItemDto`, `AdminInvitationSummaryDto`, `AdminCreateUserResponse`, `AdminUpdateUserStatusRequest`, `AdminResendInvitationRequest`, `AuditLogEntryDto`) + [`pnpm-lock.yaml`](../../pnpm-lock.yaml).
- **Backend `apps/api/` (`59` tệp):** cấu hình & build (`package.json`, `tsconfig.json`, `tsconfig.build.json`, `nest-cli.json`, `jest.config.js`, `eslint.config.mjs`), `42` tệp source dưới [`apps/api/src/`](../../apps/api/src/main.ts), và `11` tệp test/helper dưới [`apps/api/test/`](../../apps/api/test/integration/test-db.helper.ts).
- **Báo cáo nghiệm thu:** [`docs/project-audit/PHASE_2A_2_IMPLEMENTATION_REPORT.md`](./PHASE_2A_2_IMPLEMENTATION_REPORT.md) *(file này)*.

### 4.2. Kiểm chứng các thành phần ngoài phạm vi (`0` thay đổi)
- `apps/web/`: **0 tệp thay đổi** (`DATA_SOURCE=mock`, 29 route build & HTML serve giữ nguyên).
- `prisma/schema.prisma`, `prisma/migrations/`, `prisma/seed.ts`, `prisma/verify-db-integrity.ts`: **0 thay đổi**.
- `docker-compose.yml`, `.env`, `.env.example`: **0 thay đổi**.
- Quét từ khóa cấm trong `apps/api/`: `rg -n -i "(redis|bullmq|ioredis|minio|aws-sdk|xlsx|exceljs|qrcode)" apps/api/package.json apps/api/src apps/api/test` → **0 kết quả**.

---

## 5. Kết quả Kiểm thử & Hậu kiểm Sau Lần Sửa Cuối (`tsbuildinfo` / `tsconfig.build.json`)

| Lệnh Kiểm tra | Phạm vi | Kết quả Thực tế Quan sát |
|---|---|---|
| `pnpm --filter @fpt-campus/shared build` | Shared CJS/ESM types | **PASS** (`tsc` exit `0`) |
| `pnpm --filter api typecheck` | Strict TS (`src/` + `test/`) | **PASS** (`tsc --noEmit` `0` errors) |
| `pnpm --filter api lint` | ESLint v9 flat config | **PASS** (`0` errors, `0` warnings) |
| `pnpm --filter api build` | `nest build` (incremental disabled) | **PASS** (`42` JS files emitted in `apps/api/dist/`) |
| `pnpm --filter api test` | Jest `--runInBand` (`5` unit + `5` PG16 integration) | **PASS** (**`10/10` suites, `34/34` tests, `0` failed, `0` skipped**, `100.304 s`) |
| `pnpm typecheck` | `@fpt-campus/shared` + `apps/web` | **PASS** (`tsc --noEmit` exit `0`) |
| `pnpm lint` | `apps/web` ESLint | **PASS** (exit `0`) |
| `pnpm build` | `@fpt-campus/shared` + `apps/web` (`Next.js 16.4.6 Turbopack`) | **PASS** (`29/29` routes compiled) |
| `pnpm db:test` | PostgreSQL 16 + Disk Integrity Regression | **PASS** (**`13/13` checks PASS, `0` failed**, `11/11` local assets verified) |

### Chi tiết các bộ Test trong `apps/api` (`34/34` PASS)
1. **Unit Tests (`5` suites — `19` cases):**
   - [`phone-normalizer.spec.ts`](../../apps/api/test/unit/phone-normalizer.spec.ts): chuẩn hóa E.164 VN (`09...`, `+84...`, `0084...`, dấu cách/ngoặc), từ chối chuỗi chữ/sai định dạng, lowercase email.
   - [`token-crypto.spec.ts`](../../apps/api/test/unit/token-crypto.spec.ts): Argon2id `m=65536, t=3, p=1`, mật khẩu `>=12` ký tự & chặn mật khẩu cấm, entropy `64B` refresh / `32B` activation, SHA-256 64-hex, cookie options dev vs `production` (`Secure`).
   - [`enum-mappers.spec.ts`](../../apps/api/test/unit/enum-mappers.spec.ts): mapping hai chiều `R-05` cho `BuildingCategory`, `MapBuildingIconKey`, `TourNodeCategory`.
   - [`local-storage.adapter.spec.ts`](../../apps/api/test/unit/local-storage.adapter.spec.ts): đối chiếu đủ `11/11` file ảnh thật trên `apps/web/public/images`, chặn path traversal (`../`, `%2e%2e`), backslash, UNC/drive `C:\`, URI `file://` / `https://`, null byte `\0`, và directory junction thoát ra ngoài `LOCAL_MEDIA_ROOT`.
   - [`env.schema.spec.ts`](../../apps/api/test/unit/env.schema.spec.ts): chặn `CHANGE_ME_*`, secret `<32` ký tự, `WEB_ORIGIN=*` hoặc kèm path, và `DATABASE_URL` sai giao thức.
2. **PostgreSQL 16 Integration Tests (`5` suites — `15` cases trên scratch DB cô lập):**
   - [`health.integration.spec.ts`](../../apps/api/test/integration/health.integration.spec.ts): `200 ok` và giả lập mất kết nối DB trả `503 SERVICE_UNAVAILABLE` không lộ DSN/credentials/stack trace.
   - [`auth-session.integration.spec.ts`](../../apps/api/test/integration/auth-session.integration.spec.ts): bootstrap `admin` → `403 PASSWORD_CHANGE_REQUIRED` → `/auth/me` vẫn mở → `PATCH /auth/me/password` thu hồi sibling refresh session → mở khóa `/admin/*`; JWT hết hạn/giả mạo → `401`; 5 lần sai khóa 15 phút (`ACCOUNT_LOCKED_BRUTE_FORCE`) chặn luôn mật khẩu đúng (`LOGIN_LOCKED_ATTEMPT`); refresh rotation + reuse detection thu hồi toàn bộ `family_id`; `/auth/logout` xóa cookie; `/auth/register` trả `404`; rate limit `5 req/60s` → request thứ 6 trả `429 RATE_LIMITED`.
   - [`csrf-cors.integration.spec.ts`](../../apps/api/test/integration/csrf-cors.integration.spec.ts): thiếu/sai `X-Requested-With`, thiếu cả `Origin` & `Referer`, hoặc `Origin`/`Referer` lạ đều trả `403 FORBIDDEN`; chấp nhận fallback `Referer` hợp lệ; CORS trả exact `Origin` + `Access-Control-Allow-Credentials: true` (không `*`) và không cấp header cho origin lạ; kiểm chứng `Set-Cookie` có cờ `Secure` khi `NODE_ENV=production`.
   - [`rbac-provisioning-activation.integration.spec.ts`](../../apps/api/test/integration/rbac-provisioning-activation.integration.spec.ts): `TOUR_EDITOR` bị chặn `403`; `EVENT_OPERATOR` bị chặn trên `GET /admin/users`, `GET /admin/audit-logs`, tạo `STAFF`, gán `roleCodes`, và object-level `PATCH /status` hay `POST /resend` lên `STAFF`/`ADMIN` (`403`), nhưng tạo/resend/lock được `STUDENT`/`PARENT`; trùng SĐT E.164 trả `409`; `SUPER_ADMIN` không tự khóa được root `admin` (`422`); activation validate/complete single-use (`409` khi replay, `400` khi hết hạn); đăng nhập bằng `"0912 345 678"` khớp `+84912345678`; khóa user thu hồi tức thì cả cookie `refresh_token` và JWT Bearer hiện hữu; không lộ token trong `audit_logs`.
   - [`public-isolation.integration.spec.ts`](../../apps/api/test/integration/public-isolation.integration.spec.ts): trên seed QTSC chuẩn (`defaultEntryNodeSlug=null`, `publishedNodeCount=0`, `GET /public/locations` không có `gallery`/`tourNodes`, `GET /public/tour/nodes` → `[]`, `cong-chao-qtsc` → `404`, `GET /public/events` chỉ trả `4` session `isPublic=true`, quiz không lộ đáp án) và bộ fixture tổng hợp chứng minh node `PUBLISHED + isPreviewApproved=false`, node soft-deleted, node `DRAFT`, target `SCENE_LINK` chưa duyệt và `originalObjectKey` đều không bao giờ rò rỉ ra Public API.

---

## 6. Kiểm tra Live HTTP Server (`apps/api/dist/main.js` & Web `:3000`)

- **API server (`node apps/api/dist/main.js` kết nối `.env` + `fpt_virtual_campus_db` trên cổng `4000`, tắt sạch sau kiểm tra):**
  - `GET /api/v1/health` → `200` (`status: "ok", database: "up"`)
  - `GET /api/v1/public/campus` → `200` (`code: "QTSC-Q12"`, `buildings: 5`, `defaultEntryNodeSlug: null`, toàn bộ buildings `defaultNodeSlug: null` & `publishedNodeCount: 0`)
  - `GET /api/v1/public/locations` → `200` (`6` items, không có khóa `gallery`/`tourNodes`)
  - `GET /api/v1/public/tour/nodes` → `200` (`[]`)
  - `GET /api/v1/public/tour/nodes/cong-chao-qtsc` → `404`
  - `GET /api/v1/public/events` → `200` (`4` sessions công khai, `3` quiz items đã che đáp án & `tourNodeSlug: null`)
  - `GET /api/v1/admin/users` (không JWT) → `401`
  - Log khởi động không phát sinh cảnh báo Express 5 (`path-to-regexp`) hay lỗi runtime.
- **Database `virtual_campus_360` chính thức:** xác minh còn nguyên `1` user (`admin`), `1` `audit_logs`, `5` `tour_nodes`, `11` `media_assets` (không dính dữ liệu test).
- **Web Next.js (`http://127.0.0.1:3000`, chế độ `DATA_SOURCE=mock`):** `/`, `/campus`, `/locations`, `/events`, `/login`, `/portal`, `/admin` trả HTTP `200`.

---

## 7. Trạng thái Bàn giao & Điều kiện Mở Phase 2A-3

- Toàn bộ thay đổi được giữ sạch trên nhánh riêng **`feat/phase-2a-2-core-backend`**; nhánh `main` giữ nguyên trạng thái trước khi bắt đầu Phase 2A-2 (`8b6c206`), chưa merge và chưa push lên remote.
- Hệ thống sẵn sàng chờ Chủ dự án rà soát và phê duyệt nghiệm thu Phase 2A-2 trước khi mở **Phase 2A-3** (Business CRUD Campus / Building / Floor / FloorPlan / Panorama Upload Pipeline / Tour Graph Validator / Open Day CMS & chuyển đổi Frontend khỏi `mock`).
