# PHASE 2A-3 — DECISION REGISTER

- **Baseline Repository:** `main` @ `ff13f14372a92738ee472a2577ceba50225b5021` (`ff13f14`)
- **Trạng thái Giai đoạn:** Phase 2A-3 Milestone `M0` (Sau khi đóng Discovery và nhận phê duyệt Owner cho 8 quyết định)
- **Nguyên tắc Truy xuất:** Mọi tham chiếu mã nguồn/tài liệu dưới đây đều được kiểm chứng trực tiếp trên repository tại baseline `ff13f14`. Ngày phê duyệt chi tiết của từng phiên trao đổi không lưu dưới dạng commit history được ghi nhận đúng ngữ cảnh nghiệm thu `ff13f14` mà không tự điền ngày không có trong Git.

---

## 1. Bảng Tổng hợp Quyết định (`D-2A3-01` → `D-2A3-08` & Chính sách Bổ sung)

| Decision ID | Chủ đề | Trạng thái | Milestone Phụ thuộc | Ràng buộc Cốt lõi |
|---|---|---|---|---|
| **`D-2A3-01`** | Phạm vi Frontend (`apps/web`) | **`OWNER APPROVED`** | `M0`, `M7` *(và Phase 2B)* | Backend First: giữ nguyên `apps/web` trong 2A-3; toàn bộ web wiring, `/login`, `/activate`, Admin UI chuyển sang Phase 2B. |
| **`D-2A3-02`** | Quiz/Event & Public Quiz + Rate Limit | **`OWNER APPROVED`** | `M1`, `M2`, `M7` | Migration 4 bước thêm `event_id NOT NULL` (`ON DELETE RESTRICT`); mở lại Public Quiz an toàn; `tourNodeSlug: null` nếu node chưa public; `GET` ẩn đáp án; `POST /verify` stateless giữ contract đáp án sau submit; **thêm route-specific `@Throttle` (ngưỡng phải luận giải trong M2 design)**. |
| **`D-2A3-03`** | Storage 3 Vùng & Single-Use Upload | **`OWNER APPROVED`** | `M3`, `M4`, `M5`, `M7` | 3 vùng (`Private Source`, `Private Staging`, `Public Output`), không đặt file gốc/staging vào `apps/web/public/`; token upload single-use tiêu thụ `jti` nguyên tử. |
| **`D-2A3-04`** | Hàng đợi Xử lý Bất đồng bộ | **`OWNER APPROVED`** | `M3`, `M4`, `M5`, `M7` | `Redis 7 + BullMQ`, ưu tiên worker tiến trình riêng; bắt buộc tài liệu hóa retry, idempotency, failure, recovery. |
| **`D-2A3-05`** | Bulk `ADMIN_DIRECT` Token Policy | **`OWNER APPROVED`** | `M1`, `M6`, `M7` | Tối đa `100` dòng/batch; plaintext token trả 1 lần trong HTTP response; DB chỉ lưu hash; cấm log/audit plaintext; `Cache-Control: no-store`. |
| **`D-2A3-06`** | Invitation Delivery Adapter | **`OWNER APPROVED`** | `M6`, `M7` | Mặc định `LocalStubInvitationDeliveryAdapter`; SMTP tùy chọn qua cấu hình; provider Email/SMS thật chuyển sang phase sau. |
| **`D-2A3-07`** | Duplicate Policy & `EVENT_OPERATOR` | **`OWNER APPROVED`** | `M1`, `M2`, `M6`, `M7` | Tái sử dụng an toàn `STUDENT`/`PARENT`, tạo `EventParticipation` nếu chưa có hoặc `SKIPPED` nếu đã tồn tại (`(user_id, event_id)`), bảo vệ `ADMIN`/`STAFF` & user `ACTIVATED`; `EVENT_OPERATOR` được đọc metadata Event read-only. |
| **`D-2A3-08`** | Quy chuẩn Kỹ thuật Media & FOV | **`OWNER APPROVED`** | `M1`, `M4`, `M5`, `M7` | `initialFov` `30..100`; AI panorama placeholder bị chặn Go-Live; `PHOTO_2D` duyệt thủ công (`isPreviewApproved = false` mặc định). |
| *`TECH-PDF-01`* | *Lựa chọn PDF Renderer (Non-Owner Tech Selection)* | **`DEFERRED TECHNICAL SELECTION`** | `M4`, `M5` | **Chặn triển khai nhánh PDF** cho tới khi PoC đạt trên **cả Windows host và Linux container**. Không chọn hoặc cài đặt trong `M0`. |

---

## 2. Hồ sơ Chi tiết Từng Quyết định (`Traceable Decision Records`)

### `D-2A3-01` — Phạm vi Frontend (`apps/web`)
- **Decision Statement:**
  - Áp dụng chiến lược **Backend First** cho Phase 2A-3.
  - Giữ nguyên toàn bộ `apps/web` không thay đổi trong Phase 2A-3.
  - Toàn bộ việc kết nối `apps/web` sang Backend API (`DATA_SOURCE=api`), giao diện `/login`, `/activate` và Admin UI thuộc phạm vi **Phase 2B**.
- **Owner Approval Status:** `OWNER APPROVED` *(chốt trên baseline `ff13f14`)*.
- **Consequences / Constraints:**
  - Mọi PR/commit trong Phase 2A-3 (`M0–M7`) **cấm** chỉnh sửa tệp trong `apps/web/` (trừ trường hợp cấu hình đọc public file đã promote ra `Public Output` ở `LOCAL_PUBLIC_MEDIA_ROOT` được kiểm chứng qua test/verify không làm biến đổi UI/code `apps/web`).
  - Việc kiểm chứng Phase 2A-3 dựa vào `@fpt-campus/shared` contracts, build/typecheck/lint toàn monorepo, Jest Unit tests, PostgreSQL 16 + Redis 7 Integration tests, Worker integration tests, và HTTP E2E checks trên `apps/api/`.
  - `docs/phase-2a/PHASE_2A_IMPLEMENTATION_ROADMAP.md` được đối soát để chuyển mốc nối `apps/web` từ `2A-3` sang `2B`.
- **Dependent Milestones:** `M0` (reconcile docs/scope), `M7` (gate kiểm chứng 0 thay đổi `apps/web`), và Phase 2B.
- **Related Discovery Evidence:**
  - `docs/phase-2a/PHASE_2A_IMPLEMENTATION_ROADMAP.md` (lịch sử `v2A.2` từng xếp `apps/web DATA_SOURCE=api` trong 2A-3).
  - `apps/web/src/data/` & 0 tham chiếu `/api/v1` tại `apps/web/src/` trên baseline `ff13f14`.

### `D-2A3-02` — Mô hình Quiz/Event, Mở khóa Public Quiz & Rate Limit Bổ sung
- **Decision Statement:**
  - Bổ sung khóa ngoại `event_id` vào `OpenDayQuizItem` bằng migration 4 bước an toàn (`nullable` → backfill xác định → SQL check gate abort khi lỗi → `NOT NULL + ON DELETE RESTRICT`).
  - Mở lại Public Quiz một cách an toàn; nếu `TourNode` liên kết chưa được publish/duyệt công khai thì trả `tourNodeSlug: null` (không ẩn Quiz).
  - Bảo toàn hợp đồng response xác minh đã phê duyệt (`isCorrect`, `correctIndex`, `explanation` được phép trả sau khi submit `POST /public/quiz/verify`).
  - `GET /public/events` không được trả đáp án đúng (`correctIndex`) hay giải thích (`explanation`).
  - Không lưu điểm số hay lịch sử làm bài Quiz vào cơ sở dữ liệu.
  - **Bổ sung bắt buộc:** Triển khai rate limit riêng, chặt hơn cho `POST /api/v1/public/quiz/verify`; **ngưỡng chính xác phải được đặc tả và luận giải rõ trong tài liệu thiết kế kỹ thuật trước khi code ở `M2`** (không tự ý giả định con số trong `M0`).
- **Owner Approval Status:** `OWNER APPROVED` *(chốt trên baseline `ff13f14`)*.
- **Consequences / Constraints:**
  - Migration trong `M1` phải gồm đủ 4 bước SQL nguyên tử:
    1. Thêm `event_id UUID NULL` và index tạm.
    2. Backfill xác định `event_id` cho các bản ghi hiện hữu (với dữ liệu seed hiện tại là `event_key = 'open-day-2026-qtsc' AND deleted_at IS NULL`; abort nếu không ánh xạ được duy nhất/rõ ràng).
    3. Validation gate `RAISE EXCEPTION` trong block SQL nếu còn dòng `event_id IS NULL` hoặc không tham chiếu được `open_day_events`.
    4. `SET NOT NULL` + `ADD CONSTRAINT ... FOREIGN KEY (event_id) REFERENCES open_day_events(id) ON DELETE RESTRICT ON UPDATE CASCADE`.
  - Cập nhật `prisma/seed.ts` để idempotent seed gán đúng `eventId` và `UpsertOpenDayQuizItemInput` trong `packages/shared/src/events.ts` bổ sung `eventId`.
  - `PublicService.getEvents` và `PublicService.verifyQuiz` chỉ mở lại trong `M2` sau khi có migration `M1` và route-specific `@Throttle` đã được chốt ngưỡng hợp lý; mọi Quiz hoặc Event chưa `PUBLISHED` hoặc `deletedAt !== null` phải bị từ chối fail-closed (`404 NOT_FOUND`).
- **Dependent Milestones:** `M1` (shared contract + 4-step migration + seed), `M2` (Admin Quiz CRUD + Public Quiz + `@Throttle` spec & impl), `M7` (security isolation & rate-limit E2E verification).
- **Related Discovery Evidence:**
  - `prisma/schema.prisma:694-710` & `prisma/migrations/20261111175635_init/migration.sql:492-506, 689` (`open_day_quiz_items` thiếu `event_id`).
  - `packages/shared/src/events.ts:53-88, 125-133` (`PublicQuizQuestionDto`, `QuizVerifyResponse`, `UpsertOpenDayQuizItemInput`).
  - `apps/api/src/modules/public/public.controller.ts:31-32, 89-93` & `apps/api/src/app.module.ts:27-35` (`verifyQuiz` dùng `@Public()`, chưa có `@Throttle` override ngoài global `120 req/60s`).
  - `apps/api/src/modules/public/public.service.ts:1075-1108` (`quizItems: []`, `verifyQuiz` throw `NotFoundException` trước DB query).
  - `docs/project-audit/PHASE_2A_2_FINAL_QUIZ_SECURITY_REMEDIATION_REPORT.md:15-51` & `docs/phase-2a/PHASE_2A_API_CONTRACT.md:197-206`.

### `D-2A3-03` — Storage 3 Vùng & Single-Use Upload Token (`Atomic jti`)
- **Decision Statement:**
  - Sử dụng kiến trúc **3 vùng Storage tách biệt**: `Private Source`, `Private Staging`, và `Public Output`.
  - Upload token bắt buộc là **single-use**; việc tiêu thụ `jti` phải thực hiện **nguyên tử (atomic)** để chống replay attack và truy cập đồng thời (concurrent reuse).
- **Owner Approval Status:** `OWNER APPROVED` *(chốt trên baseline `ff13f14`)*.
- **Consequences / Constraints:**
  - Loại bỏ thiết kế dùng chung `LOCAL_MEDIA_ROOT=apps/web/public/images` cho file upload thô/staging. Phải tách cấu hình môi trường để `Private Source` và `Private Staging` nằm **ngoài** thư mục `apps/web/public/`.
  - `StorageAdapter` và `LocalStorageAdapter` phải mở rộng các phương thức đọc/ghi stream, xóa an toàn, di chuyển/promote sang `Public Output`, kiểm soát chống traversal/symlink escape như hiện có.
  - Endpoint `presign` phát hành upload token gắn `jti` lưu trạng thái (PostgreSQL hoặc Redis nguyên tử), ràng buộc `sub`, `assetId`/`floorPlanId`, `objectKey`, `mimeType`, `maxSizeBytes`, `exp`. Handler upload kiểm tra auth + permission + consume `jti` nguyên tử trước/ngay khi tiếp nhận byte stream: dùng lại → `409 CONFLICT`, hết hạn → `410/401`, sai user → `403`.
- **Dependent Milestones:** `M3` (StorageAdapter 3 zones + upload security + cleanup), `M4` (worker đọc Zone 1, ghi Zone 2), `M5` (promote Zone 2 → Zone 3 sau điều kiện duyệt), `M7` (concurrency & security negative tests).
- **Related Discovery Evidence:**
  - `apps/api/src/config/env.schema.ts:112-113` (`STORAGE_DRIVER="local"`, `LOCAL_MEDIA_ROOT="apps/web/public/images"`).
  - `apps/api/src/modules/storage/storage.adapter.ts:9-15` (chỉ có 4 methods read-only: `resolveObjectKey`, `exists`, `getMetadata`, `getPublicUrl`).
  - `apps/api/src/modules/public/public.service.ts:319, 667` (ẩn `originalObjectKey`, `sourceObjectKey` khỏi DTO công khai).

### `D-2A3-04` — Hàng đợi Xử lý (`Redis 7 + BullMQ` Worker Tách Biệt)
- **Decision Statement:**
  - Sử dụng **Redis 7 + BullMQ**.
  - Ưu tiên chạy dưới dạng **tiến trình worker tách biệt (separate worker process)**.
  - Bắt buộc tài liệu hóa chi tiết các yêu cầu về **retry**, **idempotency**, **xử lý lỗi (failure handling)** và **khôi phục (recovery)**.
  - *(Gắn kết Tech Selection bị hoãn):* **PDF renderer** là lựa chọn kỹ thuật trì hoãn (Deferred Technical Selection), không phải quyết định của Owner; bắt buộc phải làm **PoC trên cả Windows host và Linux container** trước khi chọn và triển khai; không chọn/implement trong `M0`.
- **Owner Approval Status:** `OWNER APPROVED` *(chốt trên baseline `ff13f14`)*.
- **Consequences / Constraints:**
  - `docker-compose.yml` cần bổ sung service `redis:7-alpine` (healthy check); `env.schema.ts` & `.env.example` bổ sung biến Redis/BullMQ validation.
  - Phải thiết kế tách riêng worker entrypoint (VD: `apps/api/src/worker.ts` hoặc `nest` worker bootstrap) chạy ngoài HTTP request thread, cùng thiết kế fencing/idempotency theo `assetId`/`floorPlanId`/`version`/trạng thái để không ghi đè dữ liệu mới khi retry, chiến lược dead-letter/FAILED đối với lỗi vĩnh viễn (sai magic bytes, `.insv`/`.insp`, `5.77:1`, quá `64MP`), và backoff retry với lỗi I/O tạm thời.
  - Nhánh PDF rendering trong worker bị **chặn mở** cho tới khi hoàn thành PDF PoC đa nền tảng (Windows + Linux container).
- **Dependent Milestones:** `M3` (cập nhật Redis infra hoặc M4 bootstrap), `M4` (Redis/BullMQ worker pipeline + Sharp/SVG sanitizer + PDF PoC gate), `M5` (FloorPlan v2 & Media processing lifecycle), `M7` (worker retry/crash recovery E2E tests).
- **Related Discovery Evidence:**
  - `docker-compose.yml:1-23` (hiện chỉ có service `postgres`).
  - `apps/api/package.json:17-35` (chưa có `bullmq`, `ioredis`, `sharp`, PDF/SVG libs).
  - `docs/phase-2a/PHASE_2A_SYSTEM_ARCHITECTURE.md:55-68` & `docs/phase-2a/PHASE_2A_PANORAMA_WORKFLOW.md:80-95`.

### `D-2A3-05` — Bulk `ADMIN_DIRECT` (`Max 100 Rows`, One-Time Hash-Only Tokens)
- **Decision Statement:**
  - Giới hạn tối đa **`100` dòng mỗi batch** bulk import.
  - Plaintext `activationToken` chỉ được xuất hiện **1 lần duy nhất** trong HTTP response của `POST /admin/users/import/confirm`.
  - Chỉ lưu **hash của token** (`tokenHash` SHA-256) trong cơ sở dữ liệu.
  - Tuyệt đối **không** lưu trữ hoặc ghi log plaintext token (bao gồm cả `audit_logs`, `user_import_batches`, exception/request logs).
  - Sử dụng header **`Cache-Control: no-store`** (hoặc cấu hình bảo vệ response cache tương đương).
- **Owner Approval Status:** `OWNER APPROVED` *(chốt trên baseline `ff13f14`)*.
- **Consequences / Constraints:**
  - DTO validation cho bulk preview/confirm phải enforce `rows.length <= 100` (trả `400 VALIDATION_ERROR` nếu vượt `100` dòng hoặc file quá ngưỡng).
  - `packages/shared/src/auth.ts` (`UserImportConfirmResultDto`) cần cập nhật trong `M1` để hỗ trợ trả `activationToken: string | null` cho từng dòng kết quả (chỉ có giá trị ở response HTTP khi dòng tạo mới/cấp mới theo `ADMIN_DIRECT`, không lưu vào `user_import_batches.row_results_summary_json`).
  - Controller bulk import bắt buộc set `Cache-Control: no-store, no-cache, must-revalidate, private` + `Pragma: no-cache`.
- **Dependent Milestones:** `M1` (cập nhật `UserImportConfirmResultDto` trong `packages/shared/src/auth.ts`), `M6` (triển khai bulk import preview/confirm + test leak/log/cache), `M7` (xác minh bảo mật đầu-cuối).
- **Related Discovery Evidence:**
  - `packages/shared/src/auth.ts:138-149` (`UserImportConfirmResultDto` hiện chưa có `activationToken`).
  - `apps/api/src/modules/users-rbac/users-rbac.service.ts:367-370, 625-627` (cách đơn lẻ `ADMIN_DIRECT` trả `rawToken` 1 lần).
  - `apps/api/src/modules/audit-log/audit-log.service.ts:12-47` (`scrubAuditDetails` redact các key khớp regex `/token/i`).
  - `prisma/schema.prisma:528-546, 565-580` (`AccountInvitation.tokenHash` `@db.Char(64)`, `UserImportBatch`).

### `D-2A3-06` — Kênh Gửi Lời mời `EMAIL_SMS_INVITATION`
- **Decision Statement:**
  - Sử dụng **`LocalStubInvitationDeliveryAdapter`** làm mặc định.
  - Hỗ trợ cấu hình SMTP dưới dạng **tùy chọn (optional)**.
  - Tích hợp Email/SMS Provider thật (production gateway) được **chuyển sang giai đoạn sau**.
- **Owner Approval Status:** `OWNER APPROVED` *(chốt trên baseline `ff13f14`)*.
- **Consequences / Constraints:**
  - Giữ nguyên interface `InvitationDeliveryAdapter` và `LocalStubInvitationDeliveryAdapter` mặc định hoạt động ngay không phụ thuộc bên thứ ba ở local/CI (và tuyệt đối không log `activationToken`).
  - Nếu triển khai `SmtpInvitationDeliveryAdapter` tùy chọn trong `M6`, chỉ kích hoạt khi có đủ env SMTP hợp lệ, sử dụng validation Zod rõ ràng và test được bằng mock/stub SMTP transport mà không làm fail suite mặc định khi vắng env SMTP.
- **Dependent Milestones:** `M6` (wiring Bulk Import + Resend với Adapter & optional SMTP), `M7` (kiểm thử với `LocalStub` làm đường mặc định).
- **Related Discovery Evidence:**
  - `apps/api/src/modules/users-rbac/invitation-delivery.adapter.ts:1-46` (đã có `InvitationDeliveryAdapter` & `LocalStubInvitationDeliveryAdapter` ghi rõ không log token).

### `D-2A3-07` — Chính sách Trùng lặp Bulk Import & Quyền `EVENT_OPERATOR`
- **Decision Statement:**
  - Tái sử dụng an toàn các định danh `STUDENT` / `PARENT` đã tồn tại.
  - Tạo mới `EventParticipation` (`INVITED`) nếu user đó chưa gắn với sự kiện mục tiêu.
  - Nếu `EventParticipation` đã tồn tại → đánh dấu dòng đó là **`SKIPPED`**.
  - Bảo vệ tuyệt đối danh tính `ADMIN` / `STAFF` và trạng thái/định danh của các tài khoản đã kích hoạt (`ACTIVATED`) *(và chặn ghi đè xung đột định danh trên tài khoản chưa kích hoạt)*.
  - Cấp cho `EVENT_OPERATOR` quyền **đọc chỉ metadata Sự kiện (read-only Event metadata access)**.
- **Owner Approval Status:** `OWNER APPROVED` *(chốt trên baseline `ff13f14`)*.
- **Consequences / Constraints:**
  - Thực thi thứ tự đánh giá (precedence) nghiêm ngặt cho mỗi dòng: (1) validate định dạng & xung đột nội bộ file → (2) kiểm tra `IDENTITY_CONFLICT` (`uEmail !== uPhone` hoặc xung đột email/phone với record đang giữ trên user) → (3) kiểm tra `ROLE_CONFLICT` nếu khớp `ADMIN`/`STAFF` (hoặc có admin roles) trước mọi update/participation → (4) bảo vệ user đã `ACTIVATED` (cấm sửa `email`/`phone`/`passwordHash`/`activationStatus`/`mustChangePassword`) → (5) idempotency trên unique constraint `event_participations_user_id_event_id_key` (`(user_id, event_id)`): có rồi → `SKIPPED`; chưa có → chèn an toàn `EventParticipation(INVITED)` (`UPDATED`) không reset mật khẩu/trạng thái user đã kích hoạt → (6) user hoàn toàn mới (`CREATED`).
  - Trong `M2`, cấp cho `EVENT_OPERATOR` (đang có `events:write`, `users:provision_openday`) endpoint/quyền đọc danh sách & metadata Events (kể cả `DRAFT`) + lookup nhẹ cần thiết, trong khi vẫn **giữ nguyên `403`** trên `GET /admin/users` và `GET /admin/audit-logs` (`D-2A2-01`).
- **Dependent Milestones:** `M1` (cập nhật contract nếu cần reasonCode/metadata DTO), `M2` (read-only Event metadata access cho `EVENT_OPERATOR`), `M6` (Bulk Import precedence & idempotency), `M7` (tổ hợp test trùng lặp & RBAC).
- **Related Discovery Evidence:**
  - `prisma/schema.prisma:548-563` (`EventParticipation` với `@@unique([userId, eventId])` tại `L561`, không có `deletedAt`).
  - `apps/api/src/modules/users-rbac/admin-users.controller.ts:40-41` (`GET /admin/users` đòi `users:manage`) & `apps/api/src/modules/users-rbac/users-rbac.service.ts:140-170, 634-648` (`assertActorCanManageTarget`).
  - `packages/shared/src/auth.ts:103-149` (`DUPLICATE_UPDATE`, `CREATED | UPDATED | SKIPPED | FAILED`).

### `D-2A3-08` — Quy chuẩn `initialFov`, AI Placeholders & `PHOTO_2D` Manual Approval
- **Decision Statement:**
  - `TourNode.initialFov` chuẩn hóa trong biên **`30–100`**.
  - Các panorama **AI placeholder** bắt buộc bị **chặn khỏi Go-Live**.
  - Tài sản **`PHOTO_2D`** yêu cầu **phê duyệt thủ công (manual approval)**.
  - Trạng thái `isPreviewApproved` cho `PHOTO_2D` mặc định là **`false`** cho đến khi được Admin phê duyệt tường minh.
- **Owner Approval Status:** `OWNER APPROVED` *(chốt trên baseline `ff13f14`)*.
- **Consequences / Constraints:**
  - `M1`/`M5` phải cập nhật/đồng bộ tài liệu `PHASE_2A_DATABASE_DESIGN.md:270` (`45..100` → `30..100`) và DTO `TourNode` validate `@Min(30) @Max(100)` khớp PostgreSQL CHECK `"initial_fov" >= 30 AND "initial_fov" <= 100`.
  - Worker `M4` khi xử lý xong `PHOTO_2D` chỉ chuyển `processingStatus = READY` và giữ ảnh ở Zone 2 (`Private Staging`), **tuyệt đối giữ `isPreviewApproved = false`**. Chỉ sau khi gọi `approve-preview` thành công mới promote `PHOTO_2D` sang Zone 3 (`Public Output`).
  - Hệ thống `TourGraphModule` (`M5`) phải bảo vệ rule chặn AI placeholder assets (`requiresReal360ReplacementBeforeGoLive === true`) không thể vượt qua cổng Go-Live / publish sản xuất (kiểm chứng rõ bằng mã lỗi/validator rule + integration tests).
- **Dependent Milestones:** `M1` (shared validation/docs sync notes), `M4` (worker giữ `isPreviewApproved = false` cho `PHOTO_2D`), `M5` (`initialFov 30..100`, `approve-preview`, AI placeholder Go-Live block), `M7` (end-to-end verification).
- **Related Discovery Evidence:**
  - `prisma/migrations/20261111175635_init/migration.sql:823-824` (`CHECK ("initial_fov" >= 30 AND "initial_fov" <= 100)`) vs `docs/phase-2a/PHASE_2A_DATABASE_DESIGN.md:270` (ghi `45..100`).
  - `prisma/seed.ts:211-362, 393-483` (5 AI placeholders `isPreviewApproved: false`, `requiresReal360ReplacementBeforeGoLive` trong seed; 6 `PHOTO_2D` `isPreviewApproved: true`).
  - `apps/api/src/modules/public/public.service.ts` lọc `isPreviewApproved === true` trên public media/panorama.
