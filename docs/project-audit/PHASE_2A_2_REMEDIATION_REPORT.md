# PHASE 2A-2 — PUBLIC DATA ISOLATION REMEDIATION & FINAL RE-VERIFICATION REPORT

**Ngày hoàn tất:** 12/11/2026  
**Nhánh Git:** `feat/phase-2a-2-core-backend` (tách từ `main` `8b6c206`, baseline trước khắc phục `3a13178`)  
**Commit khắc phục mã nguồn, test & hợp đồng API:** `1eb2528fd1c03508a35d716b52b7261d4af3ae1f` (`1eb2528`)  
**Tài liệu đối chiếu:** [`PHASE_2A_2_FINAL_ACCEPTANCE_EVIDENCE.md`](./PHASE_2A_2_FINAL_ACCEPTANCE_EVIDENCE.md) · [`PHASE_2A_2_IMPLEMENTATION_PLAN.md`](../phase-2a/PHASE_2A_2_IMPLEMENTATION_PLAN.md) · [`PHASE_2A_API_CONTRACT.md`](../phase-2a/PHASE_2A_API_CONTRACT.md)

---

## 1. Root Cause & Thay đổi Đã Thực hiện

### 1.1. Blocker Bắt buộc — `OpenDayQuizItem` Public Exposure (`D-2A2-03 §3.4`)
- **Root Cause:** Trong [`prisma/schema.prisma:694-710`](../../prisma/schema.prisma#L694-L710), bảng `open_day_quiz_items` chỉ có cột `tour_node_id` (nullable), **không có cột `event_id` hoặc khóa ngoại liên kết tới `open_day_events`**. Tuy nhiên ở commit `3a13178`, [`public.service.ts:1081-1123`](../../apps/api/src/modules/public/public.service.ts#L1081-L1123) vẫn truy vấn toàn bộ `open_day_quiz_items` (`status = PUBLISHED && deletedAt = null`) ngoài khối `if (event)` và trả ra `3` quiz items trong `GET /api/v1/public/events`, không chứng minh được quan hệ công khai an toàn với một `OpenDayEvent` hợp lệ.
- **Thay đổi đã thực hiện ([`apps/api/src/modules/public/public.service.ts:1081-1085`](../../apps/api/src/modules/public/public.service.ts#L1081-L1085)):**
  - Gỡ bỏ truy vấn `prisma.openDayQuizItem.findMany` khỏi `getEvents()`.
  - Tạm thời không công khai `quizItems` qua `GET /api/v1/public/events` — gán `const quizItems: PublicQuizQuestionDto[] = [];` đúng cấu trúc DTO hiện tại.
  - Không tự suy diễn quan hệ tới `OpenDayEvent`, không sửa `prisma/schema.prisma`/migration/seed, không xóa dữ liệu quiz trong PostgreSQL (`3` bản ghi seed vẫn giữ nguyên), và không thay đổi các chức năng Open Day khác (`event`, `sessions`, `faqs`, `verifyQuiz`).

### 1.2. Bổ sung Negative Tests & Khắc phục 2 Gap Kiểm thử Phụ
- **Public Isolation ([`public-isolation.integration.spec.ts`](../../apps/api/test/integration/public-isolation.integration.spec.ts)):** Cập nhật test baseline Open Day và bổ sung test tổng hợp cho `OpenDayEvent`, `OpenDaySession`, `OpenDayQuizItem`.
- **RBAC ([`rbac-provisioning-activation.integration.spec.ts:270-303`](../../apps/api/test/integration/rbac-provisioning-activation.integration.spec.ts#L270-L303)):** Bổ sung test `EVENT_OPERATOR` gọi trực tiếp `PATCH /api/v1/admin/users/:id/status` và `POST /api/v1/admin/users/:id/invitations/resend` với ID của root `admin` (`UserType.ADMIN`), xác nhận trả `403` và tài khoản `admin` vẫn giữ nguyên `ACTIVE`. Logic guard không thay đổi.
- **CSRF ([`csrf-cors.integration.spec.ts:87-105`](../../apps/api/test/integration/csrf-cors.integration.spec.ts#L87-L105)):** Bổ sung test gửi header `Referer` sai cú pháp URL (`://not-a-valid-url[broken]`, `not a url with spaces`) khi thiếu `Origin` lên `POST /api/v1/auth/refresh` và `POST /api/v1/auth/logout`, xác nhận bị [`CsrfCookieGuard`](../../apps/api/src/common/guards/csrf-cookie.guard.ts#L64-L71) từ chối an toàn `403 FORBIDDEN` (không gây `500`).

### 1.3. Đồng bộ Tài liệu
- Cập nhật [`PHASE_2A_2_IMPLEMENTATION_PLAN.md`](../phase-2a/PHASE_2A_2_IMPLEMENTATION_PLAN.md#L92) (`§3.3 mục 4` và bảng endpoint `§5`) và [`PHASE_2A_API_CONTRACT.md`](../phase-2a/PHASE_2A_API_CONTRACT.md#L202) (`§2.5`), ghi rõ `GET /api/v1/public/events` hiện không công khai `quizItems` (`[]`) do giới hạn có chủ đích vì `OpenDayQuizItem` chưa có quan hệ Event, muốn công khai theo Event trong tương lai phải có quyết định thiết kế dữ liệu & phê duyệt riêng, đồng thời giữ nguyên lịch sử quyết định `D-2A2-03`.

---

## 2. Danh sách File Thay đổi (So với Baseline `3a13178`)

| Commit | File | Mục đích |
|---|---|---|
| `19f6596` | [`docs/project-audit/PHASE_2A_2_FINAL_ACCEPTANCE_EVIDENCE.md`](./PHASE_2A_2_FINAL_ACCEPTANCE_EVIDENCE.md) | Lưu báo cáo thẩm định READ-ONLY mốc `3a13178`. |
| `1eb2528` | [`apps/api/src/modules/public/public.service.ts`](../../apps/api/src/modules/public/public.service.ts#L1081-L1101) | Trả `quizItems: []` trong `getEvents()`, bỏ query suy diễn toàn cục `openDayQuizItem`. |
| `1eb2528` | [`apps/api/test/integration/public-isolation.integration.spec.ts`](../../apps/api/test/integration/public-isolation.integration.spec.ts#L97-L167) | Test cô lập Event (`DRAFT`/deleted), Session (`isPublic=false`/`DRAFT`/deleted/parent không hợp lệ), và Quiz (`[]`, zero `correctIndex`/`explanation`, stateless verify từ chối `DRAFT`/deleted). |
| `1eb2528` | [`apps/api/test/integration/rbac-provisioning-activation.integration.spec.ts`](../../apps/api/test/integration/rbac-provisioning-activation.integration.spec.ts#L270-L303) | Bổ sung case `EVENT_OPERATOR` tác động trực tiếp ID của root `admin` (`ADMIN`) → `403`. |
| `1eb2528` | [`apps/api/test/integration/csrf-cors.integration.spec.ts`](../../apps/api/test/integration/csrf-cors.integration.spec.ts#L87-L105) | Bổ sung case `Referer` sai cú pháp URL trên `/auth/refresh` & `/auth/logout` → `403 FORBIDDEN`. |
| `1eb2528` | [`docs/phase-2a/PHASE_2A_2_IMPLEMENTATION_PLAN.md`](../phase-2a/PHASE_2A_2_IMPLEMENTATION_PLAN.md#L92) | Đồng bộ giới hạn có chủ đích `OpenDayQuizItem` theo `D-2A2-03 §3.4`. |
| `1eb2528` | [`docs/phase-2a/PHASE_2A_API_CONTRACT.md`](../phase-2a/PHASE_2A_API_CONTRACT.md#L202) | Đồng bộ đặc tả `GET /api/v1/public/events` trả `quizItems: []`. |
| *(Báo cáo này)* | [`docs/project-audit/PHASE_2A_2_REMEDIATION_REPORT.md`](./PHASE_2A_2_REMEDIATION_REPORT.md) | Báo cáo remediation & tái kiểm chứng trên `1eb2528`. |

---

## 3. Bằng chứng Từng Negative Test

| Nhóm Kiểm tra | Vị trí & Test Case | Kịch bản & Dữ liệu Khẳng định | Kết quả Quan sát (`1eb2528`) |
|---|---|---|---|
| **Baseline Open Day Isolation** | [`public-isolation.integration.spec.ts:97-167`](../../apps/api/test/integration/public-isolation.integration.spec.ts#L97-L167) | Kiểm `GET /public/events` chỉ trả `4` session `isPublic=true && eventId=payload.event.id`; đối chiếu `2` private sessions theo `id` & `title` không xuất hiện; `3` quiz seed `PUBLISHED` không có Event FK **không** bị công khai (`quizItems === []`, `id`/`questionText`/`explanation` vắng mặt); không chứa chuỗi `"correctIndex"` / `"explanation"`; `verifyQuiz` vẫn chấm stateless `200` trên DB ID. | **PASS** |
| **OpenDayEvent (`DRAFT` & `deletedAt`)** | [`public-isolation.integration.spec.ts:608-642,710-735`](../../apps/api/test/integration/public-isolation.integration.spec.ts#L608-L642) | Query `?eventKey=fixture-draft-event` (`status="DRAFT"`) và `?eventKey=fixture-deleted-event` (`deletedAt!=null`) đều trả `{ event: null, sessions: [], faqs: [], quizItems: [] }` không lộ ID/title Event hay Session con; khi không còn Event `PUBLISHED` nào, `GET /public/events` mặc định cũng trả `event: null`, toàn bộ mảng rỗng. | **PASS** |
| **OpenDaySession Matrix** | [`public-isolation.integration.spec.ts:644-685`](../../apps/api/test/integration/public-isolation.integration.spec.ts#L644-L685) | Trên cùng Event `PUBLISHED`, trả đúng `eligibleSession` (`isPublic=true`, `status="PUBLISHED"`, `deletedAt=null`, `eventId=publishedEvent.id`, `accessType="public"`); loại bỏ hoàn toàn cả ID và title của `privateSession` (`isPublic=false`), `draftSession` (`DRAFT`), `deletedSession` (`deletedAt!=null`), `sessionUnderDraftEvent`, và `sessionUnderDeletedEvent`. | **PASS** |
| **OpenDayQuizItem Matrix** | [`public-isolation.integration.spec.ts:665-708`](../../apps/api/test/integration/public-isolation.integration.spec.ts#L665-L708) | Quiz `PUBLISHED` gắn `TourNode` hợp lệ nhưng thiếu Event FK (`publishedUnlinkedQuiz`), `draftQuiz` (`DRAFT`), và `deletedQuiz` (`deletedAt!=null`) đều **không** xuất hiện trong `GET /public/events` (`quizItems: []`, zero `id`/`questionText`/`explanation`/`correctIndex`); `POST /public/quiz/verify` từ chối `draftQuiz` và `deletedQuiz` với `404 NOT_FOUND` không lộ đáp án/giải thích. | **PASS** |
| **RBAC Direct `ADMIN` ID** | [`rbac-provisioning-activation.integration.spec.ts:270-303`](../../apps/api/test/integration/rbac-provisioning-activation.integration.spec.ts#L270-L303) | `EVENT_OPERATOR` gọi trực tiếp `PATCH /api/v1/admin/users/${rootAdminDb.id}/status` (`LOCKED`) và `POST /api/v1/admin/users/${rootAdminDb.id}/invitations/resend` trên tài khoản `UserType.ADMIN` → cả hai trả **`403`**; DB xác nhận `admin.accountStatus` giữ nguyên `"ACTIVE"`. | **PASS** |
| **CSRF Malformed `Referer`** | [`csrf-cors.integration.spec.ts:87-105`](../../apps/api/test/integration/csrf-cors.integration.spec.ts#L87-L105) | Gửi `Referer: "://not-a-valid-url[broken]"` lên `POST /auth/refresh` và `Referer: "not a url with spaces"` lên `POST /auth/logout` (khi thiếu `Origin`, có `X-Requested-With: XMLHttpRequest`) → trả **`403 FORBIDDEN`** an toàn, không lỗi `500`. | **PASS** |

---

## 4. Kết quả Từng Lệnh Kiểm tra trên Commit `1eb2528fd1c03508a35d716b52b7261d4af3ae1f`

Toàn bộ `7` bước sau được thực thi trực tiếp sau khi commit `1eb2528` (`VERIFY_COMMIT=VERIFY_END_COMMIT=1eb2528fd1c03508a35d716b52b7261d4af3ae1f`, `git status` sạch):

| # | Lệnh Kiểm tra | Commit SHA | Kết quả Thực tế Quan sát |
|---:|---|---|---|
| 1 | `pnpm build` | `1eb2528fd1c03508a35d716b52b7261d4af3ae1f` | **PASS** — `@fpt-campus/shared` (`tsc`) + `apps/web` (`Next.js 16.4.6 Turbopack`, `29/29` static/SSG/dynamic routes) exit `0`. |
| 2 | `pnpm --filter api typecheck` | `1eb2528fd1c03508a35d716b52b7261d4af3ae1f` | **PASS** (`tsc --noEmit`, `0` errors). |
| 3 | `pnpm --filter api lint` | `1eb2528fd1c03508a35d716b52b7261d4af3ae1f` | **PASS** (`eslint "src/**/*.ts" "test/**/*.ts"`, `0` errors). |
| 4 | `pnpm --filter api build` | `1eb2528fd1c03508a35d716b52b7261d4af3ae1f` | **PASS** (`nest build`, exit `0`). |
| 5 | `pnpm --filter api test` | `1eb2528fd1c03508a35d716b52b7261d4af3ae1f` | **PASS** — **`10/10` test suites, `35/35` tests passed, `0` failed, `0` skipped, `87.898 s`** (`5` PostgreSQL 16 integration suites + `5` unit suites). |
| 6 | `pnpm db:test` | `1eb2528fd1c03508a35d716b52b7261d4af3ae1f` | **PASS** — **`13/13` checks PASS, `0` failed** (`PRIMARY-DB`, `AC-03`, `AC-05-*`, `AC-06.1..7`, `AC-07` `11/11` local assets, `AC-07-NEG` `14` cases, `AC-08`). |
| 7 | Live API smoke test (`node apps/api/dist/main.js`, cổng `4099`) | `1eb2528fd1c03508a35d716b52b7261d4af3ae1f` | **PASS** — `API_READY=True`, toàn bộ endpoint kiểm tra đạt kỳ vọng, DB chính không bị biến đổi. |

---

## 5. Log Live API Smoke Test (`1eb2528`, `node apps/api/dist/main.js`)

```text
DB_BEFORE=1|1|5|11|1|6|4|3
API_READY=True PID=34088
GET /api/v1/health -> HTTP 200 len=197
  {"success":true,"data":{"status":"ok","database":"up","timestamp":"2026-11-12T05:01:33.795Z"},"meta":{"requestId":"req_9adc6aad-282b-4806-92c9-3e3d753ae487","timestamp":"2026-11-12T05:01:33.795Z"}}
GET /api/v1/public/campus -> HTTP 200 len=6016
  campus.defaultEntryNodeSlug= buildings=5
GET /api/v1/public/locations -> HTTP 200 len=5495
GET /api/v1/public/tour/nodes -> HTTP 200 {"success":true,"data":[],...}
GET /api/v1/public/tour/nodes/cong-chao-qtsc -> HTTP 404 {"success":false,"error":{"code":"NOT_FOUND","message":"Không tìm thấy điểm tham quan 360° công khai."},...}
GET /api/v1/public/events -> HTTP 200 {"success":true,"eventKey":"open-day-2026-qtsc","sessionCount":4,"faqCount":4,"quizItems":[]} (hasSensitive=False)
GET /api/v1/admin/users -> HTTP 401 {"success":false,"error":{"code":"UNAUTHORIZED","message":"Xác thực không hợp lệ hoặc phiên đã hết hạn."},...}
GET /api/v1/admin/audit-logs -> HTTP 401
DB_AFTER=1|1|5|11|1|6|4|3
```

*(Ý nghĩa `DB_BEFORE` / `DB_AFTER = 1|1|5|11|1|6|4|3`: `users=1`, `audit_logs=1`, `tour_nodes=5`, `media_assets=11`, `open_day_events=1`, `open_day_sessions=6`, `open_day_faqs=4`, `open_day_quiz_items=3` — bảo toàn nguyên vẹn `3` bản ghi quiz và dữ liệu QTSC trong PostgreSQL.)*

---

## 6. Xác nhận Tuân thủ Phạm vi (Scope Compliance)

- **`git diff --stat 8b6c206..1eb2528 -- prisma apps/web docker-compose.yml .env.example`:** Rỗng (`0` thay đổi đối với Prisma schema, SQL migration, `seed.ts`, `verify-db-integrity.ts`, toàn bộ `apps/web/`, Docker & env).
- **Quét từ khóa hạ tầng cấm (`rg -n -i "(redis|bullmq|ioredis|minio|aws-sdk|xlsx|exceljs|qrcode)" apps/api/package.json apps/api/src apps/api/test`):** Exit `1` (`0` kết quả).
- Không thêm endpoint mới, không bật tự đăng ký công khai, không lấn sang Phase 2A-3 (Bulk import, Admin CRUD nghiệp vụ, FloorPlan, Tour Graph) hoặc Phase 2B.

---

## 7. Trạng thái Git, Branch, HEAD & Vấn đề Còn Tồn tại

- **Branch hiện tại:** `feat/phase-2a-2-core-backend` (giữ nhánh riêng, **chưa merge** vào `main`, **chưa push** lên `origin`).
- **Chuỗi Commit Remediation atop `3a13178`:**
  - `19f6596` — `docs(phase-2a-2): add final acceptance evidence review of 3a13178`
  - `1eb2528` (`1eb2528fd1c03508a35d716b52b7261d4af3ae1f`) — `fix(api): withhold unlinked quiz items in public events and complete isolation tests`
  - Commit kế tiếp chỉ bổ sung tệp báo cáo [`PHASE_2A_2_REMEDIATION_REPORT.md`](./PHASE_2A_2_REMEDIATION_REPORT.md) (không đụng mã nguồn, test, schema hay contract) và sẽ chạy kiểm chứng lại ngay trên commit báo cáo cuối.
- **Branch `main` & `origin/main`:** Cùng giữ nguyên ở `8b6c206`.
- **Vấn đề / Giới hạn có chủ đích còn tồn tại:**
  - `GET /api/v1/public/events` trả `quizItems: []` cho đến khi Chủ dự án phê duyệt thay đổi thiết kế dữ liệu liên kết `OpenDayQuizItem` với `OpenDayEvent` trong giai đoạn sau.
  - Hai ghi chú độ phủ test phụ mức `NOT VERIFIED` từ báo cáo trước không thuộc danh mục blocker đợt này: test `FloorPlan.processingStatus !== READY` trên `/public/buildings/:slug/floors`.
