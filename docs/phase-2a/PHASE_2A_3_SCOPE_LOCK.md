# PHASE 2A-3 — SCOPE LOCK (`v1.0`)

- **Phiên bản:** `v1.0` *(Chốt chính thức tại Milestone M0)*
- **Ngày lập:** `2026-11-12`
- **Baseline Repository Ủy quyền:**
  - **Branch:** `main`
  - **HEAD Commit:** `ff13f14372a92738ee472a2577ceba50225b5021` (`ff13f14`)
- **Trạng thái Tiền đề Đã Nghiệm thu:**
  - `Phase 2A-1` (`Database Bootstrap`): **ACCEPTED** (`7e1753d`)
  - `Phase 2A-2` (`Core Backend & Auth/Public Read`): **ACCEPTED & MERGED** (`ff13f14`)
  - `Phase 2A-3` Discovery: **COMPLETED (READ-ONLY)**
- **Trạng thái Phê duyệt Quyết định:** Toàn bộ 8 quyết định `D-2A3-01` → `D-2A3-08` đạt trạng thái **`OWNER APPROVED`**.
- **Tài liệu Liên quan:**
  - Decision Register: [`PHASE_2A_3_DECISION_REGISTER.md`](./PHASE_2A_3_DECISION_REGISTER.md)
  - Implementation Plan (`M0–M7`): [`PHASE_2A_3_IMPLEMENTATION_PLAN.md`](./PHASE_2A_3_IMPLEMENTATION_PLAN.md)
  - Trạng thái tổng thể: [`PROJECT_STATUS.md`](../../PROJECT_STATUS.md)

---

## 1. Mục tiêu & Ranh giới Phạm vi Phase 2A-3

Phase 2A-3 tập trung hoàn thiện **tầng Backend Nghiệp vụ & Hợp đồng Dùng chung** (`@fpt-campus/shared` + `apps/api/` + Redis/BullMQ worker + Three-Zone Local Storage + Safe Quiz/Event migration) trên nền tảng Phase 2A-1 và Phase 2A-2 đã nghiệm thu, tuân thủ chiến lược **Backend First**:

- Toàn bộ thay đổi mã nguồn ứng dụng trong Phase 2A-3 nằm trong **`packages/shared/`**, **`prisma/`** (chỉ phần mở rộng được duyệt cho `OpenDayQuizItem.eventId` và bảng/trạng thái cần thiết cho single-use upload/job nếu có), **`apps/api/`**, và hạ tầng cục bộ **`docker-compose.yml`** (`redis:7-alpine`).
- **`apps/web/` được giữ nguyên hoàn toàn** (chạy độc lập với `DATA_SOURCE=mock` và không chỉnh sửa UI/logic frontend) trong suốt Phase 2A-3; toàn bộ việc nối API lên `apps/web`, `/login`, `/activate`, Admin CMS UI, Studio 3 vùng và FloorPlan Interactive Drawer thuộc **Phase 2B**.

---

## 2. Tám Quyết định Đã Được Chủ Dự án Phê duyệt (`OWNER APPROVED — DO NOT REOPEN`)

> [!IMPORTANT]
> Không diễn giải lại, không tự ý thu hẹp hoặc nới lỏng nội dung 8 quyết định đã chốt dưới đây khi chưa có Change Request được Project Owner phê duyệt lại.

### `D-2A3-01` — Frontend Scope (`OWNER APPROVED`)
- Chiến lược: **Backend First**.
- Giữ nguyên `apps/web` không thay đổi trong suốt Phase 2A-3.
- Việc nối frontend với API (`DATA_SOURCE=api`), giao diện `/login`, giao diện `/activate` và Admin UI thuộc **Phase 2B**.

### `D-2A3-02` — Quiz/Event Data Model & Public Quiz (`OWNER APPROVED`)
- Bổ sung khóa ngoại Event (`event_id`) vào `OpenDayQuizItem` bằng quy trình migration an toàn 4 bước (`nullable -> deterministic backfill -> SQL validation gate aborting on nulls/orphans -> NOT NULL + FK ON DELETE RESTRICT`).
- Mở lại Public Quiz một cách an toàn (cả Event và Quiz đều phải `PUBLISHED` và `deletedAt === null`).
- Nếu `TourNode` liên kết chưa được publish/duyệt công khai, trả `tourNodeSlug: null` — **không ẩn Quiz**.
- Bảo toàn cấu trúc verify đã phê duyệt (`isCorrect`, `correctIndex`, `explanation` được phép trả **sau khi submit** `POST /public/quiz/verify`).
- Endpoint `GET /public/events` (`quizItems`) **tuyệt đối không** để lộ đáp án đúng (`correctIndex`) hoặc giải thích (`explanation`).
- **Không** lưu điểm số hay lịch sử làm Quiz của người dùng vào cơ sở dữ liệu.
- **Chính sách Rate Limit Bổ sung (`OWNER APPROVED` Policy Requirement):** Triển khai rate limit riêng, chặt hơn mức global (`120 req/60s`) cho `POST /api/v1/public/quiz/verify`; **ngưỡng chính xác (requests/TTL/key) bắt buộc phải được đặc tả và luận giải rõ ràng trong thiết kế kỹ thuật trước khi triển khai ở Milestone M2** *(tuyệt đối không tự bịa hoặc giả định ngưỡng ngầm)*.

### `D-2A3-03` — Storage Architecture & Upload Token Security (`OWNER APPROVED`)
- Tổ chức lưu trữ theo **3 vùng tách biệt**:
  1. **Zone 1 — `Private Source`:** Tệp gốc tải lên (`original.*`, `v*_source.*`), nằm ngoài `apps/web/public/`, không phục vụ trực tiếp qua HTTP static server.
  2. **Zone 2 — `Private Staging`:** Tệp đã qua xử lý của worker nhưng chưa đạt đủ điều kiện duyệt/phát hành, nằm ngoài `apps/web/public/`, chỉ phục vụ preview nội bộ qua Admin API đã xác thực.
  3. **Zone 3 — `Public Output`:** Tệp đã xử lý xong (`READY`) và thỏa mãn điều kiện phê duyệt để phục vụ công khai tại `LOCAL_PUBLIC_MEDIA_ROOT`.
- Upload token bắt buộc là **single-use**; việc tiêu thụ `jti` phải thực hiện **nguyên tử (atomic)** để chống replay attack và truy cập đồng thời dùng lại cùng token.

### `D-2A3-04` — Queue & Media Processing Architecture (`OWNER APPROVED`)
- Sử dụng **Redis 7 + BullMQ**.
- Ưu tiên triển khai theo mô hình **tiến trình worker tách biệt (separate worker process)**.
- Bắt buộc tài liệu hóa đầy đủ cơ chế **retry**, **idempotency**, **xử lý lỗi (failure handling)** và **khôi phục (recovery)**.

### `D-2A3-05` — Bulk `ADMIN_DIRECT` Token Handling (`OWNER APPROVED`)
- Giới hạn tối đa **100 dòng mỗi batch** (`maxRows <= 100`).
- Plaintext `activationToken` chỉ được phép xuất hiện **duy nhất 1 lần** trong HTTP response của thao tác `POST /admin/users/import/confirm`.
- Chỉ lưu **hash của token** (SHA-256) trong cơ sở dữ liệu.
- **Không bao giờ** lưu trữ hoặc ghi log plaintext token (bao gồm cả `audit_logs`, `user_import_batches.row_results_summary_json`, và application/HTTP logs).
- Áp dụng bảo vệ HTTP response bằng `Cache-Control: no-store` (cùng các header chống cache phù hợp).

### `D-2A3-06` — Invitation Delivery Adapters (`OWNER APPROVED`)
- Mặc định sử dụng **`LocalStubInvitationDeliveryAdapter`** trong Phase 2A-3.
- Cấu hình SMTP là **tùy chọn (optional)**.
- Tích hợp Email/SMS Provider thật (production gateway) được **chuyển sang phase sau**.

### `D-2A3-07` — Bulk Import Duplicate Policy & `EVENT_OPERATOR` Access (`OWNER APPROVED`)
- Tái sử dụng an toàn các định danh `STUDENT` / `PARENT` đã tồn tại.
- Tạo mới `EventParticipation` (`INVITED`) nếu user đó chưa gắn với sự kiện mục tiêu (tuân thủ unique constraint `(user_id, event_id)`).
- Nếu `EventParticipation` cho `(user_id, event_id)` đã tồn tại → đánh dấu dòng là **`SKIPPED`**.
- Bảo vệ tuyệt đối danh tính `ADMIN` / `STAFF` (`ROLE_CONFLICT`) và trạng thái/danh tính các tài khoản đã kích hoạt (`ACTIVATED`) — cũng như không ghi đè định danh gây xung đột trên user chưa kích hoạt (`IDENTITY_CONFLICT`).
- Cấp cho `EVENT_OPERATOR` quyền **đọc chỉ metadata Sự kiện (read-only Event metadata access)** phục vụ điều hướng nghiệp vụ Event/Quiz/Bulk Import.

### `D-2A3-08` — Technical Media & Validation Policies (`OWNER APPROVED`)
- `TourNode.initialFov` chuẩn hóa trong khoảng **`30–100`** (khớp với PostgreSQL CHECK constraint `initial_fov >= 30 AND initial_fov <= 100`).
- Các tệp panorama **AI placeholder** bắt buộc bị **chặn không cho Go-Live**.
- Tài sản **`PHOTO_2D`** yêu cầu **phê duyệt thủ công (manual approval)**.
- Trạng thái `isPreviewApproved` của `PHOTO_2D` mới tải lên mặc định là **`false`** cho đến khi được Admin phê duyệt tường minh trước khi promote ra `Public Output`.

---

## 3. Hợp đồng Bảo mật Public Quiz API (`Quiz API Security Contract`)

| Trạng thái Thời điểm | `GET /api/v1/public/events` | `POST /api/v1/public/quiz/verify` | Ràng buộc An toàn Bắt buộc |
|---|---|---|---|
| **Baseline `ff13f14` (Trước `M1 + M2`)** | Trả `quizItems: []` | Trả `404 NOT_FOUND` ngay đầu `verifyQuiz`, **0 truy vấn DB** | Không mở khóa cho đến khi migration `event_id NOT NULL` (`M1`) và service/rate-limit (`M2`) hoàn tất. |
| **Sau `M1 + M2` (`D-2A3-02`)** | Chỉ trả quiz items khi **cả** `Event` & `QuizItem` đều `status = PUBLISHED && deletedAt = null`. Payload **tuyệt đối không** chứa `correctIndex`, `explanation`, hoặc dữ liệu nội bộ. Nếu `TourNode` liên kết chưa public/approved → `tourNodeSlug: null` (giữ nguyên Quiz item). | Nhận `{ items }`; truy vấn lọc bắt buộc `status = PUBLISHED && deletedAt = null` cho **cả** `QuizItem` và `OpenDayEvent` cha. Thiếu/ẩn/xóa hoặc khác điều kiện → **fail-closed `404 NOT_FOUND`**. Hợp lệ → chấm trong RAM, trả `QuizVerifyResponse` (`isCorrect`, `correctIndex`, `explanation`, `correctCount`, `total`). | 1. **Zero DB Persistence:** Không INSERT/UPDATE bảng điểm hay lịch sử làm bài cá nhân.<br>2. **Route Rate Limit:** Gắn `@Throttle` riêng chặt hơn mức global (`120 req/60s`); ngưỡng cụ thể phải được chốt và luận giải trong thiết kế kỹ thuật `M2` trước khi viết code. |

---

## 4. Phân loại Tường minh Phạm vi (`In-Scope` vs `Out-of-Scope` vs `Deferred`)

### 4.1. In-Scope trong Phase 2A-3 (`M0–M7`)
- Mở rộng `@fpt-campus/shared`: bổ sung DTO/input/validation contracts còn thiếu cho Campus/Building/Floor, FloorPlan, Location/LocationType/LocationMedia, Media, TourNode/Hotspot/Edge/Validator/Publish, Events/Sessions/FAQs/Quiz, và Bulk Import preview/confirm (bao gồm `activationToken: string | null` cho dòng `ADMIN_DIRECT` tạo mới).
- Database migration & seed update có kiểm soát cho `open_day_quiz_items.event_id NOT NULL` (`ON DELETE RESTRICT`) và schema hỗ trợ single-use upload `jti` (hoặc store tương ứng) nếu dùng DB nonce.
- Triển khai đầy đủ các NestJS Business APIs trong `apps/api`:
  - `OpenDayModule` (Events, Sessions, FAQs, Quiz CRUD, read-only Event metadata lookup cho `EVENT_OPERATOR`) & mở lại an toàn Public Quiz + route-specific rate limit.
  - `StorageModule` 3 vùng (`Private Source`, `Private Staging`, `Public Output`) + upload single-use token (atomic `jti`) + endpoint upload cục bộ có xác thực JWT/RBAC.
  - Redis 7 (`docker-compose.yml`) + BullMQ queue/worker tách tiến trình cho `MediaPipelineModule` (`PANORAMA_2_1` 3 biến thể WebP, chặn `.insv`/`.insp`/RAW & cylinder `5.77:1`, `PHOTO_2D` tối ưu thủ công giữ `isPreviewApproved=false`) và `FloorPlanModule` (`PNG/JPG/WebP`, sanitize SVG; **nhánh PDF chỉ mở sau khi PDF Renderer PoC đạt trên Windows & Linux**).
  - `CampusGeoModule`, `LocationsModule`, `FloorPlanModule` (versioning + `FloorPlanAlignmentSnapshot` + `confirm-alignment` atomic transaction), `TourGraphModule` (CRUD, `DELETE /admin/tour/nodes/:id` transaction `OD-06`, Pre-Publish Validator 7 luật gồm `VAL_UNPLACED_NODE` theo `OD-10`, chặn Go-Live với AI placeholder, `initialFov` `30..100`, Publish cascade).
  - `UsersRbacModule` mở rộng Bulk Import `.xlsx`/`.csv` 5 bước trong RAM (max 100 rows, precedence chống `IDENTITY_CONFLICT`/`ROLE_CONFLICT`/ghi đè user `ACTIVATED`, idempotent `EventParticipation`, SHA-256 token hash, `Cache-Control: no-store`, `LocalStubInvitationDeliveryAdapter` mặc định + SMTP tùy chọn).
- `AuditLog` qua `scrubAuditDetails`, Unit tests + PostgreSQL 16 Integration tests + Security/Negative/Concurrency tests cho mọi module mới.

### 4.2. Deferred Selections & Giai đoạn Sau (`NOT in M0 / Moved Beyond 2A-3`)
1. **PDF Renderer Engine (`Deferred Technical Selection — Blocked until PoC`):**
   - **Không** phải quyết định của Owner; việc chọn thư viện PDF (cùng OS dependency nếu có) bị **khóa cứng** cho tới khi hoàn thành và kiểm chứng đạt **Technical PoC trên CẢ Windows host VÀ Linux container target** cho PDF đa trang (bounds page selection, WebP max `3200px`, `<= 64MP`, timeout bảo vệ worker, clean font/OOM handling).
2. **Phase 2B (Sau khi Phase 2A-3 nghiệm thu):**
   - Nối `apps/web` sang `DATA_SOURCE=api`, màn hình `/login`, `/activate`, Admin CMS UI, Admin Studio 3 vùng, Ghost Overlay UI trên Canvas, Public FloorPlan Interactive Drawer, dọn tab mock Check-in khỏi `/admin/events`.
3. **Phase 2C & Pre-Go-Live / Production:**
   - Đo đạc tọa độ QTSC thực tế & chụp ảnh Panorama 360°×180° thực địa thay cho 5 AI placeholder assets (`isPreviewApproved=false`).
   - Object Storage production (`S3` / `Cloudflare R2`) và Email/SMS Gateway thật của nhà trường.

### 4.3. Permanent Out-of-Scope (`Cấm triển khai trong Phase 2A-3 & MVP`)
- Tự đăng ký công khai (`/auth/register`), mật khẩu mặc định dùng chung, lưu plaintext `activationToken` trong DB/log/`AuditLog`.
- Lưu tệp Excel/CSV gốc, tên tệp gốc hoặc đường dẫn tệp Excel trong DB, Object Storage hay `AuditLog`.
- Check-in QR (`ticketCode`, `checked_in_at`, trạng thái `CHECKED_IN` — `OD-05`).
- Student/Parent Portal (`/portal`), lưu điểm XP cá nhân / lịch sử làm Quiz / Leaderboard DB (`OD-08`).
- CMS hóa `/news` hay `OFFICIAL_CAMPUS_INFO` (`OD-03`), 3D WebGL `.glb` Dollhouse, pathfinding xuyên tầng.

---

## 5. Ràng buộc Bảo mật & Quy tắc Bất khả xâm phạm (`Non-Negotiable Rules`)

1. **Cách ly Storage Tuyệt đối:** Không một tệp gốc (`Private Source`) hoặc bản xử lý chưa duyệt/chưa phát hành (`Private Staging`) nào được đặt trong `apps/web/public/`.
2. **Chống Replay Upload Token:** Single-use upload `jti` phải được kiểm tra và đánh dấu đã dùng bằng **thao tác nguyên tử**; khóa chéo `sub`, `assetId`/`floorPlanId`, `objectKey`, `mimeType`, `maxSizeBytes`, `exp`.
3. **Chống Rò rỉ Token Kích hoạt:** DB chỉ lưu SHA-256 hash; không log body request/response, không ghi token vào `AuditLog` hay `user_import_batches`; HTTP response `ADMIN_DIRECT` phải có `Cache-Control: no-store`.
4. **Cách ly Dữ liệu Công khai (`Fail-Closed`):** Public endpoints tuyệt đối không trả `DRAFT`/`ARCHIVED`/`deletedAt != null`, `originalObjectKey`/`sourceObjectKey`, media có `isPreviewApproved = false`, hoặc session `isPublic = false`; `GET /public/events` không trả đáp án/giải thích; `POST /public/quiz/verify` không tạo bản ghi DB.
5. **Toàn vẹn Định danh & RBAC (`D-2A2-01` + `D-2A3-07`):** Mọi endpoint `/admin/*` đều qua full guard pipeline (`JwtAuthGuard -> ForcePasswordChangedGuard -> PermissionsGuard`) + kiểm tra object-level ownership/scope. `ADMIN`/`STAFF` bất khả xâm phạm qua Bulk Import; `EVENT_OPERATOR` không xem được danh sách user nội bộ (`GET /admin/users`) hay `audit-logs`.
6. **Zero-Artifact Import:** Parse `.xlsx`/`.csv` thuần RAM bằng parser an toàn (chống formula injection / memory exhaustion), chuẩn hóa VN phone sang E.164 (`+84...`), không lưu file hay filename gốc.
7. **Tính Nguyên tử của Đồ thị Tour & CSDL:** `confirm-alignment` và `DELETE /admin/tour/nodes/:id` chạy trong 1 database transaction; Graph Validator bắt buộc chặn publish (`422`) khi còn bất kỳ lỗi mức `ERROR`, bao gồm chặn AI placeholders khỏi Go-Live.

---

## 6. Quy trình Kiểm soát Thay đổi Phạm vi (`Change-Control Procedure`)

Mọi yêu cầu thay đổi nội dung Scope Lock này hoặc 1 trong 8 quyết định `D-2A3-01` → `D-2A3-08` (bao gồm chuyển đổi phương án đã chốt, bổ sung/gỡ tính năng Milestone, hoặc nới lỏng ràng buộc bảo mật) đều bị **cấm áp dụng ngầm trong lúc lập trình** và phải trải qua đúng 4 bước:
1. **Change Proposal:** Tạm dừng milestone chịu ảnh hưởng; lập văn bản đề xuất nêu rõ quyết định/điều khoản cần sửa, nguyên nhân kỹ thuật từ codebase, và mức độ ảnh hưởng đến `M1–M7` / bảo mật / schema.
2. **Contract & Risk Assessment:** Rà soát tác động lên `@fpt-campus/shared`, Prisma migrations, API contracts và các Acceptance Criteria liên quan.
3. **Explicit Owner Re-Approval:** Gửi đề xuất cho **Project Owner** phê duyệt tường minh bằng văn bản.
4. **Document & Register Update:** Chỉ sau khi có phê duyệt, cập nhật phiên bản mới cho `PHASE_2A_3_SCOPE_LOCK.md`, `PHASE_2A_3_DECISION_REGISTER.md` và `PHASE_2A_3_IMPLEMENTATION_PLAN.md` trước khi tiếp tục triển khai code.
