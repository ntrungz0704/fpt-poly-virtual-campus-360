# PHASE 2A-2 — FINAL ACCEPTANCE EVIDENCE REVIEW (`3a13178`)

**Ngày thẩm định:** 12/11/2026  
**Đối tượng kiểm tra:** Nhánh `feat/phase-2a-2-core-backend` tại commit [`3a13178`](../../docs/project-audit/PHASE_2A_2_IMPLEMENTATION_REPORT.md) (`3a13178321bd43c9f40f65309704470d4736321c`, tách từ `main` / `origin/main` `8b6c206`)  
**Chế độ thực hiện:** **READ-ONLY** — Không chỉnh sửa source code, test, Prisma schema, migration; không merge hoặc push lên `main`; chỉ bổ sung xác minh runtime read-only trên commit `3a13178` và xuất báo cáo bằng chứng này.

---

## 1. Executive Summary

Kết quả thẩm định thực chứng đối chiếu trực tiếp mã nguồn `apps/api`, `prisma/schema.prisma`, `prisma/seed.ts`, bộ test (`10` suites / `34` cases), log kiểm thử theo commit và live HTTP server tại `3a13178` cho thấy:

| Lĩnh vực đánh giá | Kết quả | Tóm tắt bằng chứng |
|---|---|---|
| **Yêu cầu 1 — RBAC & Provisioning (`D-2A2-01`)** | **PASS** *(có 1 gap test phụ `NOT VERIFIED`)* | `SUPER_ADMIN`, `TOUR_EDITOR`, `EVENT_OPERATOR` bám đúng ma trận quyền `seed.ts`; object-level guard chặn `EVENT_OPERATOR` động vào `STAFF`/`ADMIN` (`403`) và cấm truyền `roleCodes`; không có endpoint tự nâng quyền/tạo `ADMIN`. |
| **Yêu cầu 2 — Activation Token & Session Security** | **PASS** | CSPRNG `32B`/`64B` base64url, chỉ lưu `SHA-256` trong DB, atomic CAS single-use (`409` khi replay, `400` khi hết hạn), `ADMIN_DIRECT` trả token 1 lần, `EMAIL_SMS_INVITATION` không rò rỉ token; rotation + reuse detection + password change + admin lock thu hồi session ngay lập tức. |
| **Yêu cầu 3 — Public Data Isolation (`D-2A2-03`)** | **FAIL (1 BLOCKER)** | Phần lọc `TourNode` (DRAFT/deleted/`isPreviewApproved=false`), `SCENE_LINK`, DTO `locations`, `OpenDaySession.isPublic`, ẩn `correctIndex`/`explanation` và ẩn `originalObjectKey`/`sourceObjectKey` đều **PASS**. Tuy nhiên **`OpenDayQuizItem` không có `eventId` hoặc FK tới `OpenDayEvent` trong `prisma/schema.prisma:694-710`**, nhưng `GET /api/v1/public/events` vẫn query và công khai toàn bộ `3` quiz items `PUBLISHED` thay vì tạm thời không công khai theo quyết định `D-2A2-03 §3.4` và điều kiện nghiệm thu; đồng thời thiếu negative test cho quiz/session/event `DRAFT` & `deleted`. |
| **Yêu cầu 4 — CSRF & CORS (`D-2A2-04`)** | **PASS** *(có 1 gap test phụ `NOT VERIFIED`)* | `CsrfCookieGuard` bắt buộc đồng thời `Origin` (hoặc fallback `Referer`) thuộc `WEB_ORIGIN` + `X-Requested-With: XMLHttpRequest`; CORS allowlist `credentials: true` (cấm `*`); cookie `refresh_token` đặt `HttpOnly`, `SameSite=Lax`, `Path=/api/v1/auth`, `Secure` bật theo `NODE_ENV=production`. |
| **Yêu cầu 5 — Inventory 22 Endpoints & Quy trình kiểm thử** | **PASS với lưu ý attribution** | Đủ `22/22` endpoint trong `apps/api/src/modules/**`; bộ build/lint/typecheck/API test (`34/34`) + `db:test` (`13/13`) + live API smoke test (bổ sung ở đợt rà soát này) đều xác nhận trên commit `3a13178`. Riêng `pnpm build` (Next.js `29/29` route) chạy trước commit `3a13178` trên cây mã đồng nhất về `apps/web` (`0` thay đổi từ `8b6c206`). |

**Đề xuất nghiệm thu:** **`NOT ACCEPTED`** — Chưa merge `feat/phase-2a-2-core-backend` vào `main` cho tới khi Chủ dự án quyết định hướng xử lý blocker `OpenDayQuizItem` ở Yêu cầu 3 và bổ sung các negative test còn thiếu.

---

## 2. Bảng Đối chiếu Quyết định `D-2A2-01` → `D-2A2-04`

| Mã quyết định | Trạng thái phê duyệt Milestone 0 | Hiện trạng triển khai tại `3a13178` | Đánh giá tuân thủ |
|---|---|---|---|
| **`D-2A2-01`** | **APPROVED WITH CONDITIONS** (`5` endpoint non-bulk, RBAC 2 tầng, `ADMIN_DIRECT` once-only, `EMAIL_SMS_INVITATION` local stub) | Đủ `5` endpoint Admin Users & Audit Logs; Excel/CSV bulk giữ ở Phase 2A-3; kiểm tra quyền endpoint + object-level `target.userType`; `SHA-256` hash-only; `LocalStubInvitationDeliveryAdapter` trả `activationToken: null` và redacted log. | **PASS** |
| **`D-2A2-02`** | **APPROVED** (`GET /api/v1/health` dùng `SELECT 1`; không mở `/auth/sessions/*`; revoke qua 4 luồng chuẩn) | [`health.controller.ts`](../../apps/api/src/modules/health/health.controller.ts#L1-L29) chạy `SELECT 1`, trả `200`/`503` không lộ DSN/credentials; không có `/auth/sessions/*`; 4 luồng revoke hoạt động và có integration test chứng minh. | **PASS** |
| **`D-2A2-03`** | **REVISED AND APPROVED** (chỉ publish `TourNode` khi `PUBLISHED && deletedAt=null && isPreviewApproved=true`; tách DTO `/locations`; chỉ trả `OpenDaySession.isPublic=true`; **nếu không xác định được quan hệ an toàn cho `OpenDayQuizItem` thì không công khai**; bắt buộc negative tests) | Lọc `TourNode`, `SCENE_LINK`, DTO `locations`, `OpenDaySession.isPublic=true` (`4/6` session), stripping `correctIndex`/`explanation` và `originalObjectKey`/`sourceObjectKey` đạt chuẩn. **Sai lệch tại `OpenDayQuizItem`:** doc cập nhật ở `ae83c32` ([`PHASE_2A_2_IMPLEMENTATION_PLAN.md:92`](../phase-2a/PHASE_2A_2_IMPLEMENTATION_PLAN.md#L92), [`PHASE_2A_API_CONTRACT.md:202`](../phase-2a/PHASE_2A_API_CONTRACT.md#L202)) và [`public.service.ts:1081-1123`](../../apps/api/src/modules/public/public.service.ts#L1081-L1123) công khai toàn bộ `3` quiz items `PUBLISHED` dù schema không có FK tới `OpenDayEvent`, đồng thời thiếu negative test cho trường hợp này và quiz/session/event `DRAFT`/`deleted`. | **FAIL (BLOCKER)** |
| **`D-2A2-04`** | **APPROVED WITH CONDITIONS** (`refresh_token` cookie `HttpOnly`, `SameSite=Lax`, `Path=/api/v1/auth`, `Secure` theo production; `CsrfCookieGuard` kiểm tra `Origin`/`Referer` + `X-Requested-With`; CORS allowlist `WEB_ORIGIN` + `credentials: true`) | [`token-crypto.ts:89-108`](../../apps/api/src/common/utils/token-crypto.ts#L89-L108), [`csrf-cookie.guard.ts:30-81`](../../apps/api/src/common/guards/csrf-cookie.guard.ts#L30-L81), [`app.setup.ts:55-79`](../../apps/api/src/app.setup.ts#L55-L79), [`env.schema.ts:26-47,146`](../../apps/api/src/config/env.schema.ts#L26-L47) đáp ứng đủ điều kiện và có test phủ các case chính. | **PASS** |

---

## 3. Bằng chứng Code & Test Theo Từng Yêu cầu

### 3.1. Yêu cầu 1 — RBAC & Account Provisioning

#### Inventory toàn bộ Admin Users & Audit Logs (`5` endpoints) & Guard bảo vệ

Chuỗi Global Guards trong [`apps/api/src/app.module.ts:43-59`](../../apps/api/src/app.module.ts#L43-L59) chạy theo thứ tự: `ThrottlerGuard` → `JwtAuthGuard` → `ForcePasswordChangedGuard` → `PermissionsGuard`.

| # | Endpoint | Controller & Line | Permission Decorator | Kiểm tra bổ sung tầng Service / DTO |
|---|---|---|---|---|
| 1 | `GET /api/v1/admin/users` | [`admin-users.controller.ts:40-46`](../../apps/api/src/modules/users-rbac/admin-users.controller.ts#L40-L46) | `@RequirePermissions("users:manage")` | Chỉ actor có `users:manage` mới đọc danh sách; không trả `passwordHash`/`tokenHash`. |
| 2 | `POST /api/v1/admin/users` | [`admin-users.controller.ts:48-60`](../../apps/api/src/modules/users-rbac/admin-users.controller.ts#L48-L60) | `@RequireAnyPermission("users:manage", "users:provision_openday")` | [`users.dto.ts:26-30,138-141`](../../apps/api/src/modules/users-rbac/dto/users.dto.ts#L26-L30): `@IsIn(["STAFF", "STUDENT", "PARENT"])` chặn `"ADMIN"`. [`users-rbac.service.ts:140-170`](../../apps/api/src/modules/users-rbac/users-rbac.service.ts#L140-L170): không có `users:manage` cấm tạo `STAFF`/`ADMIN` hoặc truyền `roleCodes` (`403`); có `users:manage` cũng cấm gán `roleCodes` cho `STUDENT`/`PARENT` (`400`); truy vấn role thực tế trong DB qua `role.findMany` (`:216-229`). |
| 3 | `PATCH /api/v1/admin/users/:id/status` | [`admin-users.controller.ts:62-76`](../../apps/api/src/modules/users-rbac/admin-users.controller.ts#L62-L76) | `@RequireAnyPermission("users:manage", "users:provision_openday")` | [`users-rbac.service.ts:403,634-648`](../../apps/api/src/modules/users-rbac/users-rbac.service.ts#L634-L648): `assertActorCanManageTarget(actor, target.userType)` chặn actor thiếu `users:manage` nếu `targetUserType !== "STUDENT" && targetUserType !== "PARENT"` (`403`); chặn tự khóa/khóa root `admin` (`:405-420`, `422`); thu hồi toàn bộ refresh session khi lock/suspend/reset (`:424-433`). |
| 4 | `POST /api/v1/admin/users/:id/invitations/resend` | [`admin-users.controller.ts:78-93`](../../apps/api/src/modules/users-rbac/admin-users.controller.ts#L78-L93) | `@RequireAnyPermission("users:manage", "users:provision_openday")` | [`users-rbac.service.ts:507,634-648`](../../apps/api/src/modules/users-rbac/users-rbac.service.ts#L507): kiểm tra cùng `assertActorCanManageTarget(actor, target.userType)` (`403` nếu target không phải `STUDENT`/`PARENT` khi thiếu `users:manage`). |
| 5 | `GET /api/v1/admin/audit-logs` | [`audit-log.controller.ts:12-18`](../../apps/api/src/modules/audit-log/audit-log.controller.ts#L12-L18) | `@RequirePermissions("audit:read")` | Chỉ `SUPER_ADMIN` có quyền đọc; `scrubAuditDetails` ([`audit-log.service.ts:12-47`](../../apps/api/src/modules/audit-log/audit-log.service.ts#L12-L47)) che trường nhạy cảm. |

#### Ma trận quyền thực tế theo [`prisma/seed.ts:71-119`](../../prisma/seed.ts#L71-L119)

| Role (`roles.code`) | Tập Permissions được seed (`10` permissions tổng) | Quyền Admin Users & Audit Logs |
|---|---|---|
| `SUPER_ADMIN` | `campus:write`, `floorplan:write`, `location:write`, `media:upload`, `tour:write`, `tour:publish`, `users:manage`, `users:provision_openday`, `events:write`, `audit:read` | Đọc users, tạo `STAFF`/`STUDENT`/`PARENT`, đổi status (trừ self/root `admin`), resend invitation, đọc audit logs. Không thể tạo `ADMIN` qua API (`@IsIn(["STAFF", "STUDENT", "PARENT"])`). |
| `TOUR_EDITOR` | `campus:write`, `floorplan:write`, `location:write`, `media:upload`, `tour:write`, `tour:publish` | Không có quyền nào trong 5 endpoint (`403 FORBIDDEN`). |
| `EVENT_OPERATOR` | `events:write`, `users:provision_openday` | Bị chặn `GET /admin/users` (`403`), `GET /admin/audit-logs` (`403`); tại `POST /admin/users` chỉ tạo `STUDENT`/`PARENT` với `roleCodes` rỗng; bị chặn `PATCH /status` và `POST /invitations/resend` trên `STAFF`/`ADMIN` (`403`). |

#### Chống tự nâng quyền & không tạo tài khoản `ADMIN`/`STAFF` ngoài quyền

- Không tồn tại endpoint đăng ký công khai (`/api/v1/auth/register` trả `404`), không có endpoint `PATCH /auth/me` hay API gán role độc lập sau tạo user.
- `ROLE_CODES` trong [`users.dto.ts:58-62`](../../apps/api/src/modules/users-rbac/dto/users.dto.ts#L58-L62) chỉ chấp nhận `["SUPER_ADMIN", "TOUR_EDITOR", "EVENT_OPERATOR"]`; truyền role lạ như `"INVENTED_ROLE"` bị `ValidationPipe` chặn `400`.
- Test case chứng minh tại [`rbac-provisioning-activation.integration.spec.ts:115-347`](../../apps/api/test/integration/rbac-provisioning-activation.integration.spec.ts#L115-L347) (`"enforces D-2A2-01 RBAC matrix, object-level target checks, provisioning, phone E.164 & audit scrubbing"` — **PASS**): xác nhận `TOUR_EDITOR` nhận `403`, `EVENT_OPERATOR` nhận `403` khi đọc `/admin/users`, đọc `/admin/audit-logs`, tạo `STAFF`, truyền `roleCodes: ["SUPER_ADMIN"]`, hoặc `PATCH /status` / `POST /resend` lên `tourEditorUserId` (`STAFF`), đồng thời thao tác thành công trên `STUDENT`/`PARENT`.
- *Lưu ý độ phủ test (`NOT VERIFIED`):* Chưa có assertion riêng cho trường hợp `EVENT_OPERATOR` gọi `PATCH /status` hoặc `POST /resend` trực tiếp vào ID của root `admin` (`UserType.ADMIN`); logic chặn được thực thi qua cùng nhánh `targetUserType !== "STUDENT" && targetUserType !== "PARENT"` tại [`users-rbac.service.ts:641`](../../apps/api/src/modules/users-rbac/users-rbac.service.ts#L641).

---

### 3.2. Yêu cầu 2 — Activation Token & Session Security

- **Sinh token CSPRNG:**
  - Activation token: `generateActivationToken()` dùng `crypto.randomBytes(32).toString("base64url")` ([`token-crypto.ts:81-83`](../../apps/api/src/common/utils/token-crypto.ts#L81-L83)).
  - Refresh token: `generateOpaqueRefreshToken()` dùng `crypto.randomBytes(64).toString("base64url")` ([`token-crypto.ts:76-78`](../../apps/api/src/common/utils/token-crypto.ts#L76-L78)).
  - Unit test: [`token-crypto.spec.ts:51-65`](../../apps/api/test/unit/token-crypto.spec.ts#L51-L65) (**PASS**).
- **Chỉ lưu hash trong DB:**
  - `sha256Hex(rawToken)` lưu vào `account_invitations.token_hash` (`Char(64) @unique`, [`schema.prisma:532`](../../prisma/schema.prisma#L532), [`users-rbac.service.ts:256,323,542,583`](../../apps/api/src/modules/users-rbac/users-rbac.service.ts#L256)) và `refresh_tokens.token_hash` (`Char(64) @unique`, [`schema.prisma:585`](../../prisma/schema.prisma#L585), [`auth.service.ts:176,197,313,347`](../../apps/api/src/modules/auth/auth.service.ts#L176)).
  - Integration test truy vấn DB trực tiếp xác nhận cột `tokenHash` khớp `SHA-256(rawToken)` và không lưu plaintext: [`rbac-provisioning-activation.integration.spec.ts:231-235`](../../apps/api/test/integration/rbac-provisioning-activation.integration.spec.ts#L231-L235), [`auth-session.integration.spec.ts:225-233`](../../apps/api/test/integration/auth-session.integration.spec.ts#L225-L233).
- **Hạn dùng & single-use atomic CAS:**
  - `INVITATION_TTL_MS = 72 * 60 * 60 * 1000` ([`users-rbac.service.ts:46`](../../apps/api/src/modules/users-rbac/users-rbac.service.ts#L46)).
  - `POST /api/v1/auth/activate/complete` dùng transaction với điều kiện CAS `accountInvitation.updateMany({ where: { tokenHash, status: { in: ["INVITATION_PENDING", "SENT"] }, activatedAt: null, expiresAt: { gt: now } }, data: { status: "ACTIVATED", activatedAt: now } })` ([`auth.service.ts:586-597`](../../apps/api/src/modules/auth/auth.service.ts#L586-L597)); replay trả `409 CONFLICT` (`:604-606, 660-665`), token sai/hết hạn trả `400 VALIDATION_ERROR`.
  - Integration test [`rbac-provisioning-activation.integration.spec.ts:349-482`](../../apps/api/test/integration/rbac-provisioning-activation.integration.spec.ts#L349-L482): `validate` sai (`false`), đúng (`true`), `complete` (`200`), replay (`409 CONFLICT`), hết hạn (`400`) (**PASS**).
- **`ADMIN_DIRECT` trả 1 lần vs `EMAIL_SMS_INVITATION` không rò rỉ:**
  - [`users-rbac.service.ts:368-369,625-626`](../../apps/api/src/modules/users-rbac/users-rbac.service.ts#L368-L369): chỉ trả `activationToken` khi `provisioningMethod === "ADMIN_DIRECT"`; nhánh `EMAIL_SMS_INVITATION` trả `activationToken: null`.
  - [`LocalStubInvitationDeliveryAdapter.deliver`](../../apps/api/src/modules/users-rbac/invitation-delivery.adapter.ts#L36-L45) chỉ ghi log `channel` + `userId` kèm `"(token redacted)"`. [`scrubAuditDetails`](../../apps/api/src/modules/audit-log/audit-log.service.ts#L12-L47) xóa khóa nhạy cảm trong `audit_logs.diff_json`.
  - Integration test [`rbac-provisioning-activation.integration.spec.ts:250,299-317`](../../apps/api/test/integration/rbac-provisioning-activation.integration.spec.ts#L250) kiểm chứng `activationToken: null` cho `EMAIL_SMS_INVITATION` và không rò rỉ trong `/admin/users` hay `/admin/audit-logs` (**PASS**).
- **Session Rotation, Reuse Detection, Logout, Password Change & User Lock Revocation:**
  - Reuse refresh token: [`auth.service.ts:258-363`](../../apps/api/src/modules/auth/auth.service.ts#L258-L363) ghi nhận `REFRESH_TOKEN_REUSE_DETECTED` và thu hồi toàn bộ `familyId`.
  - Logout: [`auth.service.ts:374-406`](../../apps/api/src/modules/auth/auth.service.ts#L374-L406); Đổi mật khẩu bắt buộc: [`auth.service.ts:484-502`](../../apps/api/src/modules/auth/auth.service.ts#L484-L502) thu hồi các refresh token anh em; Khóa user qua `/admin/users/:id/status`: [`users-rbac.service.ts:424-433`](../../apps/api/src/modules/users-rbac/users-rbac.service.ts#L424-L433) thu hồi `refreshTokens` và [`JwtAuthGuard`](../../apps/api/src/common/guards/jwt-auth.guard.ts#L83-L114) truy vấn trạng thái DB chặn luôn JWT Bearer còn hạn.
  - Integration tests (**PASS**): [`auth-session.integration.spec.ts:27-155,161-286,292-389`](../../apps/api/test/integration/auth-session.integration.spec.ts#L27-L155) và [`rbac-provisioning-activation.integration.spec.ts:430-454`](../../apps/api/test/integration/rbac-provisioning-activation.integration.spec.ts#L430-L454).

---

### 3.3. Yêu cầu 3 — Public Data Isolation (`D-2A2-03`)

#### Các hạng mục đạt chuẩn (`PASS`)
1. **TourNode eligibility & masking:** [`public.service.ts`](../../apps/api/src/modules/public/public.service.ts) lọc đồng bộ `status === PUBLISHED && deletedAt === null && panoramaAsset.isPreviewApproved === true` kèm điều kiện location/building/floor `PUBLISHED`, lọc `SCENE_LINK` hotspot trỏ tới node không hợp lệ (`:919-923`), trả `null`/`0`/`[]` khi node chưa đạt chuẩn. Trên QTSC seed (`5` node `DRAFT` + `isPreviewApproved=false`), live HTTP `GET /api/v1/public/tour/nodes` trả `[]` và `/tour/nodes/cong-chao-qtsc` trả `404`.
2. **Location DTO tách biệt:** `GET /public/locations` trả `PublicLocationSummaryDto[]` (không có `gallery`, `tourNodes`); `GET /public/locations/:slug` trả `PublicLocationDetailDto`.
3. **Session riêng tư (`isPublic = false`):** `GET /public/events` lọc `isPublic: true && status: PUBLISHED && deletedAt: null`, chỉ trả `4/6` session seed (`sortOrder [1, 2, 4, 6]`), loại `2` session mời riêng (`isPublic = false`).
4. **Không lộ đáp án & object key gốc:** `correctIndex` và `explanation` bị loại khỏi payload `GET /public/events`; `originalObjectKey` và `sourceObjectKey` không bao giờ được chọn hoặc xuất ra trong public DTOs ([`public.service.ts:325,673`](../../apps/api/src/modules/public/public.service.ts#L325)).
5. **Bằng chứng test đạt (`3` cases trong [`public-isolation.integration.spec.ts`](../../apps/api/test/integration/public-isolation.integration.spec.ts#L1-L398)):** chứng minh QTSC seed cô lập node placeholder/session private/đáp án quiz, và synthetic fixture chứng minh node `DRAFT`, node soft-delete, node `PUBLISHED` nhưng `isPreviewApproved=false`, cùng `SCENE_LINK` hotspot tới node chưa duyệt đều bị lọc khỏi Public APIs.

#### BLOCKER NGHIÊM TRỌNG (`FAIL` — Cần Chủ dự án quyết định & xử lý)

- **Vấn đề 1 — `OpenDayQuizItem` công khai không có quan hệ an toàn tới `OpenDayEvent`:**
  - **Thực trạng Schema ([`prisma/schema.prisma:694-710`](../../prisma/schema.prisma#L694-L710) & `:622-643`):** Bảng `open_day_quiz_items` chỉ có `id`, `tourNodeId` (`TourNode?` nullable), `questionText`, `optionsJson`, `correctIndex`, `explanation`, `sortOrder`, `status`, timestamps — **hoàn toàn không có cột `eventId` hay FK liên kết `OpenDayEvent`**. Quan hệ gián tiếp nếu đi ngược `tourNode → location → building → campus → openDayEvents` là quan hệ 1-nhiều không xác định đơn trị event.
  - **Quyết định `D-2A2-03 §3.4` đã chốt ở Milestone 0:** *"Prisma hiện không có `eventId` trên `OpenDayQuizItem`: phải kiểm tra quan hệ thực tế trong schema trước khi triển khai truy vấn. Không tự suy diễn quan hệ giữa quiz item và event/session... Nếu không thể xác định an toàn quyền truy cập hoặc quan hệ dữ liệu từ schema hiện tại, phải ghi rõ giới hạn và tạm thời không công khai dữ liệu liên quan."* Yêu cầu thẩm định đợt này cũng nhắc lại nguyên văn: *"Nếu không xác định được quan hệ an toàn giữa Quiz và Event từ schema hiện tại thì không được công khai Quiz tương ứng."*
  - **Lệch chuẩn ở tài liệu `ae83c32` & code `3a13178`:** Commit `ae83c32` sửa [`PHASE_2A_2_IMPLEMENTATION_PLAN.md:92`](../phase-2a/PHASE_2A_2_IMPLEMENTATION_PLAN.md#L92) và [`PHASE_2A_API_CONTRACT.md:202`](../phase-2a/PHASE_2A_API_CONTRACT.md#L202) theo hướng vẫn query thẳng `OpenDayQuizItem` theo `status = PUBLISHED && deletedAt = null`. Do đó tại [`public.service.ts:1081-1123`](../../apps/api/src/modules/public/public.service.ts#L1081-L1123), `GET /api/v1/public/events` truy vấn **ngoài khối `if (event)`**, luôn trả toàn bộ quiz `PUBLISHED` toàn cục bất kể `eventKey` nào được truyền (kể cả khi `event === null` hoặc `OpenDayEvent` là `DRAFT`/`deleted`).
  - **Tác động:** Live HTTP `GET /api/v1/public/events` trên commit `3a13178` vẫn trả `quizItems.count = 3`; [`public-isolation.integration.spec.ts:120`](../../apps/api/test/integration/public-isolation.integration.spec.ts#L120) đang assert `expect(payload.quizItems).toHaveLength(3)` (kiểm tra *có trả*, ngược với yêu cầu *không công khai khi chưa có quan hệ an toàn*).
- **Vấn đề 2 — Thiếu negative tests bắt buộc cho Quiz / Event / Session `DRAFT` & `deleted`:**
  - [`public-isolation.integration.spec.ts`](../../apps/api/test/integration/public-isolation.integration.spec.ts#L1-L398) chưa có test case chứng minh:
    1. Không công khai `OpenDayQuizItem` khi không xác định được quan hệ an toàn với `OpenDayEvent`.
    2. `OpenDayEvent`, `OpenDaySession`, `OpenDayQuizItem` ở trạng thái `DRAFT` hoặc có `deletedAt != null` bị loại khỏi `GET /public/events` (và `POST /public/quiz/verify` từ chối quiz `DRAFT`/`deleted`).
  - *Ghi chú phụ (`NOT VERIFIED`):* Trường hợp `FloorPlan.processingStatus !== READY` trên `GET /public/buildings/:slug/floors` chưa có synthetic negative test riêng trong `public-isolation.integration.spec.ts`.

---

### 3.4. Yêu cầu 4 — CSRF, Cookie & CORS (`D-2A2-04`)

| Cơ chế bảo vệ | Vị trí mã nguồn | Kiểm chứng Test ([`csrf-cors.integration.spec.ts`](../../apps/api/test/integration/csrf-cors.integration.spec.ts#L22-L182), unit tests) | Kết quả |
|---|---|---|---|
| **CSRF Guard (`Origin`/`Referer` + `X-Requested-With: XMLHttpRequest`)** | [`csrf-cookie.guard.ts:30-81`](../../apps/api/src/common/guards/csrf-cookie.guard.ts#L30-L81) áp dụng trên `POST /auth/refresh` & `POST /auth/logout` | Missing/wrong `X-Requested-With` (`:42-62` → `403`); missing both `Origin` & `Referer` (`:64-69` → `403`); invalid `Origin` (`:71-77` → `403`); invalid `Referer` (`:79-85` → `403`); valid `Origin` (`:99-105` → `200`); missing `Origin` + valid `Referer` fallback (`:87-97` → `200`). | **PASS** *(trừ case `Referer` malformed syntax chưa test riêng — `NOT VERIFIED`)* |
| **CORS allowlist & `credentials: true`** | [`app.setup.ts:55-79`](../../apps/api/src/app.setup.ts#L55-L79), [`env.schema.ts:26-47`](../../apps/api/src/config/env.schema.ts#L26-L47) | Reject `*` hoặc path trong `WEB_ORIGIN` ([`env.schema.spec.ts:18-30,45-55`](../../apps/api/test/unit/env.schema.spec.ts#L18-L30)); allowlist origin trả exact `Origin` + `Access-Control-Allow-Credentials: true`, origin lạ không được cấp ACAO (`csrf-cors.integration.spec.ts:111-153`). | **PASS** |
| **Cookie `refresh_token` Security Attributes** | [`token-crypto.ts:89-108`](../../apps/api/src/common/utils/token-crypto.ts#L89-L108), [`env.schema.ts:146`](../../apps/api/src/config/env.schema.ts#L146) | `httpOnly: true`, `sameSite: "lax"`, `path: "/api/v1/auth"`, `secure: NODE_ENV === "production"` — kiểm chứng cả trong [`token-crypto.spec.ts:67-90`](../../apps/api/test/unit/token-crypto.spec.ts#L67-L90) và HTTP `Set-Cookie` khi `NODE_ENV=production` (`csrf-cors.integration.spec.ts:155-182`). | **PASS** |

---

### 3.5. Yêu cầu 5 — Inventory 22 Endpoints & Đối chiếu Commit Thực thi

#### Danh sách đầy đủ `22` endpoints đã triển khai dưới prefix `/api/v1`

| # | Method | Path (`/api/v1/...`) | Auth / Guard / Permissions | Controller |
|---:|---|---|---|---|
| 1 | `GET` | `/api/v1/health` | `@Public()`, `@SkipThrottle()` | [`health.controller.ts`](../../apps/api/src/modules/health/health.controller.ts) |
| 2 | `POST` | `/api/v1/auth/login` | `@Public()`, `@Throttle(5/60s)` | [`auth.controller.ts`](../../apps/api/src/modules/auth/auth.controller.ts) |
| 3 | `POST` | `/api/v1/auth/refresh` | `@Public()`, `CsrfCookieGuard`, `@Throttle(20/60s)` | [`auth.controller.ts`](../../apps/api/src/modules/auth/auth.controller.ts) |
| 4 | `POST` | `/api/v1/auth/logout` | `@Public()`, `CsrfCookieGuard` | [`auth.controller.ts`](../../apps/api/src/modules/auth/auth.controller.ts) |
| 5 | `GET` | `/api/v1/auth/me` | `JwtAuthGuard`, `@AllowMustChangePassword()` | [`auth.controller.ts`](../../apps/api/src/modules/auth/auth.controller.ts) |
| 6 | `PATCH` | `/api/v1/auth/me/password` | `JwtAuthGuard`, `@AllowMustChangePassword()` | [`auth.controller.ts`](../../apps/api/src/modules/auth/auth.controller.ts) |
| 7 | `POST` | `/api/v1/auth/activate/validate` | `@Public()`, `@Throttle(10/60s)` | [`auth.controller.ts`](../../apps/api/src/modules/auth/auth.controller.ts) |
| 8 | `POST` | `/api/v1/auth/activate/complete` | `@Public()`, `@Throttle(5/60s)` | [`auth.controller.ts`](../../apps/api/src/modules/auth/auth.controller.ts) |
| 9 | `GET` | `/api/v1/admin/users` | `JwtAuthGuard` + `ForcePwd` + `@RequirePermissions("users:manage")` | [`admin-users.controller.ts`](../../apps/api/src/modules/users-rbac/admin-users.controller.ts) |
| 10 | `POST` | `/api/v1/admin/users` | `JwtAuthGuard` + `ForcePwd` + `@RequireAnyPermission("users:manage", "users:provision_openday")` | [`admin-users.controller.ts`](../../apps/api/src/modules/users-rbac/admin-users.controller.ts) |
| 11 | `PATCH` | `/api/v1/admin/users/:id/status` | `JwtAuthGuard` + `ForcePwd` + `@RequireAnyPermission("users:manage", "users:provision_openday")` | [`admin-users.controller.ts`](../../apps/api/src/modules/users-rbac/admin-users.controller.ts) |
| 12 | `POST` | `/api/v1/admin/users/:id/invitations/resend` | `JwtAuthGuard` + `ForcePwd` + `@RequireAnyPermission("users:manage", "users:provision_openday")` | [`admin-users.controller.ts`](../../apps/api/src/modules/users-rbac/admin-users.controller.ts) |
| 13 | `GET` | `/api/v1/admin/audit-logs` | `JwtAuthGuard` + `ForcePwd` + `@RequirePermissions("audit:read")` | [`audit-log.controller.ts`](../../apps/api/src/modules/audit-log/audit-log.controller.ts) |
| 14 | `GET` | `/api/v1/public/campus` | `@Public()` | [`public.controller.ts`](../../apps/api/src/modules/public/public.controller.ts) |
| 15 | `GET` | `/api/v1/public/buildings/:slug` | `@Public()` | [`public.controller.ts`](../../apps/api/src/modules/public/public.controller.ts) |
| 16 | `GET` | `/api/v1/public/buildings/:slug/floors` | `@Public()` | [`public.controller.ts`](../../apps/api/src/modules/public/public.controller.ts) |
| 17 | `GET` | `/api/v1/public/locations` | `@Public()` | [`public.controller.ts`](../../apps/api/src/modules/public/public.controller.ts) |
| 18 | `GET` | `/api/v1/public/locations/:slug` | `@Public()` | [`public.controller.ts`](../../apps/api/src/modules/public/public.controller.ts) |
| 19 | `GET` | `/api/v1/public/tour/nodes` | `@Public()` | [`public.controller.ts`](../../apps/api/src/modules/public/public.controller.ts) |
| 20 | `GET` | `/api/v1/public/tour/nodes/:slug` | `@Public()` | [`public.controller.ts`](../../apps/api/src/modules/public/public.controller.ts) |
| 21 | `GET` | `/api/v1/public/events` | `@Public()` | [`public.controller.ts`](../../apps/api/src/modules/public/public.controller.ts) |
| 22 | `POST` | `/api/v1/public/quiz/verify` | `@Public()` | [`public.controller.ts`](../../apps/api/src/modules/public/public.controller.ts) |

#### Đối chiếu thời điểm chạy & commit attribution

| Lệnh / Kiểm tra | Thuộc commit `3a13178` hay trước commit? | Kết quả quan sát thực tế |
|---|---|---|
| `pnpm --filter @fpt-campus/shared build` | **Trên commit `3a13178`** (`task-7074`, `11:27:08`) | **PASS** (exit `0`) |
| `pnpm --filter api typecheck` | **Trên commit `3a13178`** (`task-7074`) | **PASS** (`tsc --noEmit` exit `0`) |
| `pnpm --filter api lint` | **Trên commit `3a13178`** (`task-7074`) | **PASS** (ESLint `0` errors) |
| `pnpm --filter api build` | **Trên commit `3a13178`** (`task-7074`) | **PASS** (`nest build` exit `0`) |
| `pnpm --filter api test` | **Trên commit `3a13178`** (`task-7074`) | **PASS** (**`10/10` suites, `34/34` tests, `0` failed, `0` skipped, `109.071 s`**). *Lưu ý:* [`PHASE_2A_2_IMPLEMENTATION_REPORT.md:100`](./PHASE_2A_2_IMPLEMENTATION_REPORT.md#L100) ghi `100.304 s` (từ lần chạy trước commit `task-7040`) do được viết trước khi commit `3a13178`. |
| `pnpm typecheck` (`shared` + `web`) | **Trên commit `3a13178`** (`task-7074`) | **PASS** |
| `pnpm lint` (`web`) | **Trên commit `3a13178`** (`task-7074`) | **PASS** |
| `pnpm db:test` | **Trên commit `3a13178`** (`task-7074`) | **PASS** (**`13/13` checks PASS**, `0` failed, `11/11` local assets verified) |
| **Live API Smoke Test (`node apps/api/dist/main.js` cổng `4099`)** | **Trên commit `3a13178`** *(chạy bổ sung trong đợt rà soát này)* | `health` → `200` (`database: "up"`); `public/campus` → `200`; `public/locations` → `200`; `public/tour/nodes` → `200` (`items: []`); `public/tour/nodes/cong-chao-qtsc` → `404`; `public/events` → `200` (`sessions=4, faqs=4, quizItems=3`); `admin/users` (không JWT) → `401`. DB chính giữ nguyên `1\|1\|5\|11\|1\|6\|4\|3`. |
| `pnpm build` (`shared` + `apps/web` `Next.js 16.4.6`) | **TRƯỚC commit `3a13178`** (`task-7040`, `11:21:42–11:24:33`, cây làm việc trên `ae83c32`) | **PASS** (`29/29` routes). Chưa chạy lại `next build` sau `3a13178` để giữ nguyên `.next` cho Web daemon `:3000` đang chạy; `git diff 8b6c206..3a13178 -- apps/web` = `0` thay đổi; `GET` HTTP thực tế vào `:3000` (`/`, `/campus`, `/locations`, `/events`, `/login`, `/portal`, `/admin`) trong đợt rà soát trả `200`. |

---

## 4. Tổng hợp Phân loại `PASS` / `FAIL` / `NOT VERIFIED`

- **`PASS`:**
  - RBAC 3 role (`SUPER_ADMIN`, `TOUR_EDITOR`, `EVENT_OPERATOR`), `5` endpoint Admin Users & Audit Logs, object-level `STAFF`/`ADMIN` guard, chống self-escalation và chống tạo `ADMIN`.
  - Activation token (`32B` CSPRNG, `SHA-256` hash-only, TTL `72h`, atomic single-use `409`/`400`, `ADMIN_DIRECT` 1 lần, `EMAIL_SMS_INVITATION` ẩn token).
  - Session lifecycle (rotation `64B`, `family_id` reuse detection, `/auth/logout`, `/auth/me/password`, admin lock revoke JWT + cookie).
  - Public `TourNode` filter (`PUBLISHED + !deletedAt + isPreviewApproved`), `SCENE_LINK` filtering, DTO `/locations` tách biệt, `OpenDaySession.isPublic=true` (`4/6`), ẩn `correctIndex`/`explanation`/`originalObjectKey`/`sourceObjectKey`.
  - CSRF kép + CORS allowlist `WEB_ORIGIN` + `refresh_token` cookie flags + `GET /api/v1/health`.
  - Commit `3a13178` build/typecheck/lint/Jest `34/34`/`db:test` `13/13` và live API HTTP smoke test.
- **`FAIL` (Blocker cần xử lý trước khi merge):**
  1. **`OpenDayQuizItem` thiếu quan hệ an toàn với `OpenDayEvent` nhưng vẫn công khai (`D-2A2-03 §3.4` + Yêu cầu 3):** [`prisma/schema.prisma:694-710`](../../prisma/schema.prisma#L694-L710) không có `eventId` / FK tới `OpenDayEvent`, nhưng [`public.service.ts:1081-1123`](../../apps/api/src/modules/public/public.service.ts#L1081-L1123) vẫn query công khai toàn cục `3` quiz items thay vì tạm thời không công khai; `ae83c32` đã ghi lệch quy tắc này trong [`PHASE_2A_2_IMPLEMENTATION_PLAN.md:92`](../phase-2a/PHASE_2A_2_IMPLEMENTATION_PLAN.md#L92) & [`PHASE_2A_API_CONTRACT.md:202`](../phase-2a/PHASE_2A_API_CONTRACT.md#L202).
  2. **Thiếu negative tests bắt buộc ở [`public-isolation.integration.spec.ts`](../../apps/api/test/integration/public-isolation.integration.spec.ts#L1-L398):** chưa có test chứng minh giữ kín quiz không đủ quan hệ an toàn tới Event (hiện assert `toHaveLength(3)`), và chưa có synthetic fixture kiểm chứng loại bỏ `OpenDayEvent`/`OpenDaySession`/`OpenDayQuizItem` có `status = DRAFT` hoặc `deletedAt != null`.
- **`NOT VERIFIED` (Khoảng trống độ phủ không chặn kiến trúc cốt lõi, nên bổ sung cùng đợt vá):**
  - Test `EVENT_OPERATOR` gửi `PATCH /status` hoặc `POST /resend` trực tiếp vào user `ADMIN` (mã nguồn đã chặn tại `:641`, test mới kiểm trên target `STAFF`).
  - Test `FloorPlan.processingStatus !== READY` trên `GET /public/buildings/:slug/floors`.
  - Test chuỗi `Referer` sai cú pháp (`malformed URL`) trên `CsrfCookieGuard`.
  - `pnpm build` chạy lại trực tiếp trên SHA `3a13178` (hiện mới có log `task-7040` trước commit dù `apps/web` có `0` diff).

---

## 5. Scope Compliance

- `git diff --stat 8b6c206..3a13178 -- apps/web prisma docker-compose.yml .env.example` trả về **rỗng (`0` thay đổi)**.
- `rg -n -i "(redis|bullmq|ioredis|minio|aws-sdk|xlsx|exceljs|qrcode)" apps/api/package.json apps/api/src apps/api/test` trả về **exit `1` (`0` kết quả)** — không cài hoặc nhúng hạ tầng ngoài phạm vi Phase 2A-2, không lấn sang Phase 2A-3 (CRUD/Bulk import/FloorPlan/Tour Graph) hay Phase 2B.
- Chỉ mở rộng additive 2 tệp contract trong `@fpt-campus/shared` ([`api.ts`](../../packages/shared/src/api.ts), [`auth.ts`](../../packages/shared/src/auth.ts)), tạo `59` tệp trong `apps/api/`, cập nhật `pnpm-lock.yaml`, và báo cáo thực thi.

---

## 6. Trạng thái Git, Branch, Working Tree & Remote

- **HEAD Commit:** `3a13178321bd43c9f40f65309704470d4736321c` (`3a13178`, `2026-11-12 11:26:57 +0700`) — `63 files changed, 12213 insertions(+), 91 deletions(-)`.
- **Branch hiện tại:** `feat/phase-2a-2-core-backend` (gồm 3 commit mới trên nền `8b6c206`: `7f96e7c`, `ae83c32`, `3a13178`).
- **Branch `main` & `origin/main`:** cùng trỏ tại `8b6c20682d978cc8afc3abbafdabf791171f458c` (`8b6c206`). Nhánh `feat/phase-2a-2-core-backend` **chỉ nằm local, chưa push lên remote và chưa merge vào `main`**.
- **Working tree trước khi xuất báo cáo này:** sạch (`git status --short` rỗng); sau bước này chỉ phát sinh duy nhất tệp báo cáo [`PHASE_2A_2_FINAL_ACCEPTANCE_EVIDENCE.md`](./PHASE_2A_2_FINAL_ACCEPTANCE_EVIDENCE.md).

---

## 7. Kết luận Đề xuất

**Đề xuất:** **`NOT ACCEPTED`** — **Chưa cho phép merge `feat/phase-2a-2-core-backend` (`3a13178`) vào `main`.**

**Lý do & vị trí cần xử lý trước khi tái thẩm định:**
1. Xử lý blocker **`OpenDayQuizItem`** theo đúng quy tắc Chủ dự án (`D-2A2-03 §3.4`): hoặc **(a)** tạm thời không công khai `quizItems` qua `GET /api/v1/public/events` (trả `quizItems: []` và chặn `POST /api/v1/public/quiz/verify` phù hợp) + đính chính tài liệu `PHASE_2A_2_IMPLEMENTATION_PLAN.md:92` & `PHASE_2A_API_CONTRACT.md:202`, hoặc **(b)** xin phê duyệt bổ sung `eventId` FK cho `OpenDayQuizItem` trong Prisma schema/migration ở lượt chỉnh sửa tiếp theo; tại vị trí [`apps/api/src/modules/public/public.service.ts:1081-1123`](../../apps/api/src/modules/public/public.service.ts#L1081-L1123).
2. Bổ sung đầy đủ negative tests vào [`apps/api/test/integration/public-isolation.integration.spec.ts`](../../apps/api/test/integration/public-isolation.integration.spec.ts#L1-L398) cho các ca `OpenDayEvent` / `OpenDaySession` / `OpenDayQuizItem` `DRAFT`, soft-delete (`deletedAt != null`), và `OpenDayQuizItem` thiếu quan hệ an toàn với Event (cùng `3` case phụ `NOT VERIFIED` nếu cần chốt sạch 100%).
3. Đồng thời khi vá xong, cập nhật số thời gian chạy test (`PHASE_2A_2_IMPLEMENTATION_REPORT.md`) và chạy đủ `pnpm build`, `pnpm --filter api test`, `pnpm db:test` + live smoke check gắn rõ với commit SHA mới nhất.
