# PHASE 2A — CONTRACT & DESIGN ALIGNMENT REPORT

**Ngày lập báo cáo:** 2026-11-12  
**Baseline trước Alignment:** Commit `d331ae7` trên nhánh `main` ([PHASE_2A_READINESS_AND_DATA_CONTRACT_VERIFICATION.md](./PHASE_2A_READINESS_AND_DATA_CONTRACT_VERIFICATION.md))  
**Phiên bản Spec sau Alignment:** `v2A.2`  
**Trạng thái cổng (Gate Decision):** **`READY TO PROCEED TO PHASE 2A-1`**

---

## 1. Executive Summary

Toàn bộ tài liệu kiến trúc Phase 2A, package hợp đồng dùng chung [`@fpt-campus/shared`](../../packages/shared/package.json), và cấu trúc type/sample data phía frontend [`apps/web`](../../apps/web/package.json) đã được đồng bộ hoàn chỉnh theo các quyết định chủ dự án **`OD-01` → `OD-10`**.

Các mục tiêu đạt được trong đợt Alignment này:

1. **Khóa nhất quán Schema – API – Shared DTO – Frontend Mock:** Loại bỏ toàn bộ sai lệch giữa mô tả tài liệu cũ và ứng dụng Next.js thực tế (Leaflet WGS84, mối quan hệ `1:N` `Location -> TourNode`, phạm vi CMS Open Day, nhận diện người dùng đa kênh qua `username | email | phone`, bỏ Check-in QR & Quiz XP khỏi MVP).
2. **Đóng gói chuẩn workspace `@fpt-campus/shared`:** Tách module theo domain (`common`, `api`, `campus`, `location`, `tour`, `auth`, `events`), biên dịch ra `./dist/*.{js,d.ts,map}` và gắn trực tiếp vào [`apps/web`](../../apps/web/package.json) qua `"@fpt-campus/shared": "workspace:*"`.
3. **Dọn sạch biểu tượng lỗi thời trong Contract & Adapter:** Không còn tồn tại bất kỳ ký hiệu lỗi thời hay ngoài phạm vi MVP nào (`CampusCode`, `PanoramaScene`, `LocationRoom`, `UserRole`, `xpPoints`, `xpReward`, `QuizAttemptResult`, `EventRegistrationRequest`, `checkedIn`, `ticketCode`, `checkIn`) trong `packages/shared/src` và [`apps/web/src/lib/shared-contracts.ts`](../../apps/web/src/lib/shared-contracts.ts) (các màn hình UI preview chưa sửa của `/admin/*` và `/portal` tạm giữ `checkedIn`/`ticketCode` trên mock UI theo ranh giới không sửa giao diện).
4. **Giữ đúng ranh giới phạm vi trước Phase 2A-1:** Chưa tạo `apps/api/`, chưa tạo `prisma/`, chưa chạy Docker/PostgreSQL/Redis/MinIO, chưa triển khai Auth/Backend handler thực tế, và giữ nguyên toàn bộ 19 route UI hiện tại.

---

## 2. Files Modified & Created

### 2.1. Tài liệu Phase 2A (`docs/phase-2a/*` — Phiên bản `v2A.2`)

| File | Quy mô | Nội dung cập nhật chính |
| --- | --- | --- |
| [PHASE_2A_DATABASE_DESIGN.md](../phase-2a/PHASE_2A_DATABASE_DESIGN.md) | 512 dòng | ERD, GIS WGS84 `NOT NULL` + `gis_x/gis_y` `NULLABLE`, `floors.requires_floor_plan`, `locations.primary_node_id` `NULLABLE`, `tour_nodes.floor_plan_id` `NULLABLE`, 18 Prisma enums, partial unique indexes `WHERE deleted_at IS NULL`, `hotspots` `CHECK` constraint, cleanup khi soft-delete `TourNode`, bảng `open_day_*` (`OD-03`), `users.phone` unique & dedup (`OD-04`), bỏ `CHECKED_IN`/`quiz_attempts` (`OD-05`/`OD-08`), thứ tự FK seed & `OD-10`. |
| [PHASE_2A_API_CONTRACT.md](../phase-2a/PHASE_2A_API_CONTRACT.md) | 319 dòng | Hợp đồng `GET /public/campus`, `GET /public/buildings/:slug`, `GET /public/tour/nodes` & `/:slug`, `GET /public/locations` & `/:slug`, `GET /public/events` (ẩn đáp án) + `POST /public/quiz/verify`, `POST /auth/login` (`identifier` = `username \| email \| phone`), Admin `/campus`, `/events/*` CRUD, `/tour/nodes/:nodeId/publish` (cho phép independent node `OD-10`), `DELETE /tour/nodes/:id`, `confirm-alignment`, `StorageAdapter` (`local \| s3`), ranh giới static config (`/news`, `OFFICIAL_CAMPUS_INFO`). |
| [PHASE_2A_SYSTEM_ARCHITECTURE.md](../phase-2a/PHASE_2A_SYSTEM_ARCHITECTURE.md) | 202 dòng | Kiến trúc Leaflet WGS84, FloorPlan tùy chọn (`OD-10`), `StorageAdapter` (`LOCAL_FS` vs `S3_MINIO`), phân tầng PG-only `2A-1` vs Redis/BullMQ/MinIO `2A-2+` (`OD-07`), xác thực & import Excel qua `email`/`phone`, ranh giới CMS Open Day vs static config, quyết định `DEC-01..DEC-05`. |
| [PHASE_2A_PANORAMA_WORKFLOW.md](../phase-2a/PHASE_2A_PANORAMA_WORKFLOW.md) | 139 dòng | Quy trình xử lý panorama 2:1, quy tắc kiểm định `VAL_UNPLACED_NODE` có điều kiện (`active_floor_plan_id != null \|\| requires_floor_plan === true`) theo `OD-10`. |
| [PHASE_2A_IMPLEMENTATION_ROADMAP.md](../phase-2a/PHASE_2A_IMPLEMENTATION_ROADMAP.md) | 124 dòng | Sơ đồ phụ thuộc `v2A.2`, chia phase `2A-1` (PG-only), `2A-2`, `2A-3`, ma trận đồng nhất liên tài liệu (Consistency Matrix) và Checklist Section 5. |
| [PHASE_2A_CONTRACT_ALIGNMENT_REPORT.md](./PHASE_2A_CONTRACT_ALIGNMENT_REPORT.md) | Tài liệu này | Báo cáo tổng hợp kết quả đồng bộ Phase 2A và cổng sẵn sàng sang `Phase 2A-1`. |

### 2.2. Package hợp đồng dùng chung (`packages/shared/*`)

| File | Quy mô / Vai trò | Ghi chú |
| --- | --- | --- |
| [packages/shared/package.json](../../packages/shared/package.json) | Cấu hình package CJS/NodeNext + TypeScript declarations | `main`, `module`, `types`, `exports["."]` trỏ vào `./dist/index.js` và `./dist/index.d.ts`; `files: ["dist"]`. |
| [packages/shared/src/common.ts](../../packages/shared/src/common.ts) | 24 dòng | Primitive & core union types (`UUID`, `ISO8601Timestamp`, `PublishStatus`, `ProcessingStatus`, `FloorPlanFormat`, `MediaKind`, `AlignmentStatus`, `StorageDriver`, `NormCoord2D`, `GeoLatLngTuple`) và constants (`DEFAULT_QTSC_CAMPUS_CODE`, `DEFAULT_ENTRY_NODE_SLUG`). |
| [packages/shared/src/api.ts](../../packages/shared/src/api.ts) | 66 dòng | `ApiErrorCode`, `ApiMeta`, `ApiErrorDetail`, `ApiErrorBody`, `ApiSuccessEnvelope<T>`, `ApiErrorEnvelope`, `ApiEnvelope<T>`, type guards `isApiSuccessEnvelope`, `isApiErrorEnvelope`. |
| [packages/shared/src/campus.ts](../../packages/shared/src/campus.ts) | 283 dòng | GIS & Campus DTO (`BuildingCode`, `BuildingCategory`, `MapBuildingIconKey`, `CampusGeoPoint`, `CampusLandmarkItem`, `CampusOfficialStaticInfo`, `PublicCampusSummaryDto`, `PublicBuildingDto`, `PublicCampusResponseDto`, `FloorPlanDto`, `PublicFloorSummaryDto`, `PublicBuildingDetailDto`, `UpsertBuildingInput`, `FloorPlanPresign*`, `ConfirmFloorPlanAlignmentRequest`) + shared geo helpers (`haversineDistanceMeters`, `computeRouteDistanceMeters`, `formatDistanceEstimate`). |
| [packages/shared/src/location.ts](../../packages/shared/src/location.ts) | 78 dòng | Location DTO (`LocationTypeCode`, `LocationCategoryKey`, `LocationCategoryGroup`, `MediaGalleryItemDto`, `PublicLocationSummaryDto`, `PublicLocationDetailDto`, `UpsertLocationInput`). |
| [packages/shared/src/tour.ts](../../packages/shared/src/tour.ts) | 164 dòng | Virtual Tour & Media DTO (`TourNodeCategory`, `HotspotType`, `TourEdgeType`, `TourValidationSeverity`, `TourValidationRuleCode`, `TourValidationScope`, `TourHotspotDto`, `TourNodeSummaryDto`, `PublicTourNodeDetailDto`, `TourValidationIssueDto`, `TourValidationReportDto`, `CreateTourNodeHotspotInput`, `MediaPresign*`, `MediaAssetSummaryDto`). |
| [packages/shared/src/auth.ts](../../packages/shared/src/auth.ts) | 149 dòng | Auth, RBAC & Provisioning DTO (`UserType`, `RoleCode`, `PermissionCode`, `AccountStatus`, `ActivationStatus`, `ProvisioningMethod`, `InvitationChannel`, `InvitationStatus`, `AuthUserProfileDto`, `LoginRequest`, `LoginResponse`, `ChangePasswordRequest`, `Activate*`, `AdminCreateUserRequest`, `UserImport*`). |
| [packages/shared/src/events.ts](../../packages/shared/src/events.ts) | 133 dòng | Open Day & Quiz DTO (`SessionPeriod`, `SessionAccessType`, `ParticipationStatus`, `EventParticipationSummaryDto`, `PublicOpenDayEventDto`, `PublicOpenDaySessionDto`, `PublicOpenDayFaqDto`, `PublicQuizQuestionDto`, `QuizVerify*`, `PublicEventsResponseDto`, `UpsertOpenDay*Input`). |
| [packages/shared/src/index.ts](../../packages/shared/src/index.ts) | 7 dòng | Barrel export cho toàn bộ 7 module trên. |

### 2.3. Frontend Workspace (`apps/web/*` & `pnpm-lock.yaml`)

| File | Thay đổi chính |
| --- | --- |
| [apps/web/package.json](../../apps/web/package.json) | Bổ sung dependency `"@fpt-campus/shared": "workspace:*"`. |
| [apps/web/src/data/campus-data.ts](../../apps/web/src/data/campus-data.ts) | Import & re-export type chuẩn từ `@fpt-campus/shared`, bỏ hàm tính khoảng cách trùng lặp (re-export `haversineDistanceMeters`, `computeRouteDistanceMeters`, `formatDistanceEstimate` từ `@fpt-campus/shared`), cập nhật `loc-the-thao` (`khu-the-thao-qtsc`) với `sceneId: null` (`OD-02`). |
| [apps/web/src/lib/shared-contracts.ts](../../apps/web/src/lib/shared-contracts.ts) | 317 dòng — Lớp mapper fallback từ mock data sang DTO chuẩn `@fpt-campus/shared` (`mapBuildingToPublicDto`, `getFallbackPublicCampusDto`, `mapLocationToPublicSummaryDto`, `getFallbackPublicLocationsDto`, `mapSceneToTourNodeSummaryDto`, `getFallbackPublicTourNodeDetailDto`, `getFallbackPublicEventsDto`, `verifyFallbackQuizStateless`). |
| [pnpm-lock.yaml](../../pnpm-lock.yaml) | Ghi nhận workspace link `version: link:../../packages/shared` (cài offline, `downloaded 0, added 0`). |

---

## 3. Decision Resolution Matrix (`OD-01` → `OD-10`)

| ID | Vấn đề gốc | Quyết định áp dụng | Vị trí đã đồng bộ | Kết quả kiểm chứng |
| --- | --- | --- | --- | --- |
| **OD-01** | GIS SVG và Leaflet không đồng nhất | Leaflet + OpenStreetMap + WGS84 (`lat`, `lng` `NOT NULL`) là chuẩn chính; giữ `gis_x`/`gis_y` `NULLABLE`; bổ sung đầy đủ metadata building & campus `originPoint` / `landmarks`. | `PHASE_2A_DATABASE_DESIGN.md`, `PHASE_2A_API_CONTRACT.md`, `PHASE_2A_SYSTEM_ARCHITECTURE.md`, `packages/shared/src/campus.ts`, `campus-data.ts` | Type `PublicCampusSummaryDto`, `PublicBuildingDto` và helper geo dùng chung giữa `@fpt-campus/shared` và `apps/web`. |
| **OD-02** | Hai Location dùng chung một `sceneId` giả | Quan hệ chặt `Location (1) — (N) TourNode`; đặt `loc-the-thao.sceneId = null` (`primary_node_id = NULL`) cho tới khi có ảnh 360° riêng. | `PHASE_2A_DATABASE_DESIGN.md`, `campus-data.ts`, `shared-contracts.ts` | `/locations` hiển thị `"Định vị GIS"`, `/locations/khu-the-thao-qtsc` ẩn CTA `"Mở góc nhìn 360°"` và giữ link `/map?building=SPORTS`. |
| **OD-03** | Thiếu bảng và API cho Open Day / CMS (Option B) | Đưa `open_day_events`, `open_day_sessions`, `open_day_faqs`, `open_day_quiz_items` và `/admin/events/*` CRUD vào DB/API; giữ `/news` (`CAMPUS_GUIDE_ARTICLES`) và `OFFICIAL_CAMPUS_INFO` trong static web config. | `PHASE_2A_DATABASE_DESIGN.md`, `PHASE_2A_API_CONTRACT.md`, `PHASE_2A_SYSTEM_ARCHITECTURE.md`, `packages/shared/src/events.ts`, `shared-contracts.ts` | `CampusOfficialStaticInfo` phân định rõ phần static; `PublicEventsResponseDto` ánh xạ đầy đủ lịch trình, FAQ, quiz. |
| **OD-04** | Chênh lệch đăng nhập & deduplication Excel | `POST /auth/login` nhận `identifier` (`username \| email \| normalized phone` E.164/VN); `users.phone` có partial unique; import Excel match ưu tiên `email` rồi normalized `phone` (không match theo `fullName`), báo `IDENTITY_CONFLICT` khi khớp tách biệt 2 user. | `PHASE_2A_DATABASE_DESIGN.md`, `PHASE_2A_API_CONTRACT.md`, `PHASE_2A_SYSTEM_ARCHITECTURE.md`, `packages/shared/src/auth.ts`, `api.ts` | `LoginRequest.identifier` và `ApiErrorCode` (`"IDENTITY_CONFLICT"`) đã có mặt trong `@fpt-campus/shared`. |
| **OD-05** | Nghiệp vụ Check-in QR & vé sự kiện (Option A) | Không triển khai Check-in QR, `ticketCode`, `checkedInAt`, hay trạng thái `CHECKED_IN` trong MVP. | `PHASE_2A_DATABASE_DESIGN.md`, `PHASE_2A_API_CONTRACT.md`, `packages/shared/src/events.ts` | `ParticipationStatus` chỉ còn `"INVITED" \| "CONFIRMED" \| "CANCELLED"`; `rg` xác nhận 0 kết quả cho `checkedIn`/`ticketCode`/`checkIn` trong `packages/shared/src` và `shared-contracts.ts` (mock UI preview cũ ở `/admin/*` & `/portal` chưa đụng tới giữ nguyên tới bước nối API). |
| **OD-06** | 5 điểm toàn vẹn Schema cần khóa chặt | (1) Partial unique `WHERE deleted_at IS NULL` cho mọi unique key có soft-delete; (2) Đủ 18 Prisma enums; (3) `hotspots` `CHECK` ràng buộc `SCENE_LINK <-> edge_id`; (4) Transaction hard-cleanup `tour_edges`/`hotspots` khi soft-delete `TourNode`; (5) `confirm-alignment` cập nhật tường minh `tour_nodes.floor_plan_id = floorPlanId`. | `PHASE_2A_DATABASE_DESIGN.md`, `PHASE_2A_API_CONTRACT.md` | Khớp 100% giữa ERD, bảng chi tiết Section 3, ràng buộc Section 4 và API Contract. |
| **OD-07** | Hạ tầng `2A-1` vs Storage driver | Phase `2A-1` chỉ chạy **PostgreSQL 16** (`docker compose up -d postgres`); `StorageAdapter` (`STORAGE_DRIVER=local \| s3`) trừu tượng hóa lưu trữ file; Redis/BullMQ & MinIO chuyển sang `2A-2+`. | `PHASE_2A_SYSTEM_ARCHITECTURE.md`, `PHASE_2A_API_CONTRACT.md`, `PHASE_2A_IMPLEMENTATION_ROADMAP.md`, `common.ts`, `campus.ts`, `tour.ts` | `StorageDriver = "local" \| "s3"` nằm trong `FloorPlanPresignResponse` & `MediaPresignResponse`. |
| **OD-08** | Quiz định hướng chưa tách khỏi XP / tài khoản | Orientation Quiz public không cần đăng nhập, không lưu `quiz_attempts`, bỏ `xpPoints` / `xpReward` / `QuizAttemptResult`; `GET /public/events` không trả `correctIndex`/`explanation`; thêm `POST /public/quiz/verify` stateless. | `PHASE_2A_DATABASE_DESIGN.md`, `PHASE_2A_API_CONTRACT.md`, `packages/shared/src/events.ts`, `shared-contracts.ts` | `PublicQuizQuestionDto` ẩn đáp án; `verifyFallbackQuizStateless` chấm điểm stateless khớp `QuizVerifyResponse`. |
| **OD-09** | `packages/shared` chưa đóng gói và chưa gắn `apps/web` | Viết lại `@fpt-campus/shared` theo module, compile `./dist`, cập nhật `exports` trong `package.json`, gắn `"@fpt-campus/shared": "workspace:*"` vào `apps/web`. | `packages/shared/*`, `apps/web/package.json`, `campus-data.ts`, `shared-contracts.ts`, `pnpm-lock.yaml` | `pnpm --filter @fpt-campus/shared build`, `pnpm typecheck`, `pnpm lint`, `pnpm build` đều PASS (exit 0). |
| **OD-10** | Xung đột giữa independent `TourNode` và rule `FloorPlan` | Cho phép `TourNode` độc lập (`floor_plan_id = NULL`) được `PUBLISH` khi panorama 2:1 `READY`, preview đã duyệt và `TourGraph` hợp lệ; `VAL_UNPLACED_NODE` chỉ kích hoạt khi `Floor.active_floor_plan_id != null` hoặc `Floor.requires_floor_plan === true`. | `PHASE_2A_DATABASE_DESIGN.md`, `PHASE_2A_API_CONTRACT.md`, `PHASE_2A_SYSTEM_ARCHITECTURE.md`, `PHASE_2A_PANORAMA_WORKFLOW.md`, `PHASE_2A_IMPLEMENTATION_ROADMAP.md`, `tour.ts` | `TourNodeSummaryDto.floorPlanId` có kiểu `UUID \| null`; không còn ép tạo `FloorPlan` giả khi seed. |

---

## 4. Synchronized Database Model Summary

Đặc tả dữ liệu chuẩn `v2A.2` tại [PHASE_2A_DATABASE_DESIGN.md](../phase-2a/PHASE_2A_DATABASE_DESIGN.md) đồng bộ các điểm cốt lõi sau:

- **Campus & Spatial Layer:**
  - `campuses`: bổ sung `origin_point_json`, `landmarks_json`.
  - `buildings`: tọa độ Leaflet WGS84 `lat`, `lng` (`NOT NULL`), bổ sung metadata map/drawer (`short_name`, `category`, `category_label`, `floors_label`, `summary`, `description`, `highlights`, `address_note`, `status_note`, `map_icon_key`, `route_waypoints`, `default_node_id`), giữ `gis_x`/`gis_y` ở trạng thái `NULLABLE`.
  - `floors`: thêm cờ `requires_floor_plan` và khóa tham chiếu nullable `active_floor_plan_id`.
- **Locations & Virtual Tour Layer:**
  - `location_types`: thêm `filter_group`.
  - `locations`: thêm `highlights_json`, `category_label`, đặt `primary_node_id` thành `NULLABLE` để đảm bảo mỗi location gắn với node 360° riêng (hoặc `NULL` như `loc-the-thao` theo `OD-02`).
  - `tour_nodes`: bổ sung `intro`, `category`, `sort_order`, đặt `floor_plan_id` thành `NULLABLE` (`OD-10`), cập nhật tường minh `floor_plan_id = floorPlanId` khi gọi `confirm-alignment` (`OD-06`).
  - `tour_edges` & `hotspots`: ràng buộc `CHECK` trên `hotspots` đảm bảo `SCENE_LINK <-> edge_id` nhất quán; transaction soft-delete `TourNode` thực hiện hard-cleanup các `tour_edges`/`hotspots` liên đới (`OD-06`).
- **Identity, Provisioning & Open Day CMS:**
  - `users`: hỗ trợ đăng nhập qua `username`, lowercase `email`, hoặc normalized `phone` (`E.164/VN`) với partial unique `WHERE deleted_at IS NULL AND phone IS NOT NULL`. Excel/CSV import deduplicate theo thứ tự `email -> phone`, báo `IDENTITY_CONFLICT` nếu 2 field trỏ tới 2 tài khoản khác nhau (`OD-04`).
  - `event_participations`: gắn trực tiếp `event_id` với trạng thái `INVITED | CONFIRMED | CANCELLED` (không có Check-in QR hay `ticketCode` theo `OD-05`).
  - **Open Day CMS (`OD-03` Option B):** `open_day_events`, `open_day_sessions`, `open_day_faqs`, `open_day_quiz_items`. Không tạo bảng `quiz_attempts` và không lưu XP (`OD-08`).
- **Schema Integrity Rules (`OD-06`):**
  - 18 Prisma enums đồng bộ đầy đủ với union types trong `@fpt-campus/shared`.
  - Partial unique indexes `WHERE deleted_at IS NULL` cho tất cả các khóa duy nhất có soft-delete (`campuses`, `buildings`, `floors`, `locations`, `tour_nodes`, `users(username/email/phone)`, `open_day_events`).
  - Thứ tự FK Seed chuẩn (Campus -> Buildings -> Floors -> FloorPlans optional -> MediaAssets -> TourNodes -> TourEdges/Hotspots -> Locations -> Users/Roles -> OpenDay Events/Sessions/FAQs/Quiz).

---

## 5. Synchronized API Contract Summary

Đặc tả tại [PHASE_2A_API_CONTRACT.md](../phase-2a/PHASE_2A_API_CONTRACT.md) chuẩn hóa envelope `ApiEnvelope<T>` (`ApiSuccessEnvelope<T> | ApiErrorEnvelope`) và các nhóm endpoint chính:

- **Public Read & Orientation Quiz:**
  - `GET /public/campus` — Thông tin campus QTSC (`originPoint`, `landmarks`) và danh sách buildings chuẩn WGS84.
  - `GET /public/buildings/:slug` — Chi tiết tòa nhà và danh sách tầng (`activeFloorPlan` nullable).
  - `GET /public/locations` & `GET /public/locations/:slug` — Danh sách và chi tiết địa điểm (`primaryNodeSlug` nullable theo `OD-02`).
  - `GET /public/tour/nodes` & `GET /public/tour/nodes/:slug` — Danh sách node và chi tiết panorama + hotspots + sibling nodes (`floorPlanId` nullable theo `OD-10`).
  - `GET /public/events` — Trả `event`, `sessions`, `faqs`, `quizItems` (tuyệt đối không kèm `correctIndex` và `explanation` theo `OD-08`).
  - `POST /public/quiz/verify` — Chấm điểm Orientation Quiz stateless theo `QuizVerifyRequest -> QuizVerifyResponse` (`OD-08`).
- **Authentication & Provisioning:**
  - `POST /auth/login` — Nhận `{ identifier, password }` (`username | email | normalized phone` theo `OD-04`), trả `{ accessToken, user }`.
  - Kích hoạt tài khoản qua token và import danh sách Excel/CSV (trả mã lỗi `IDENTITY_CONFLICT` khi phát hiện xung đột `email` vs `phone`).
- **Admin CMS & Workflow (`StorageAdapter` `local | s3`):**
  - Nhóm endpoint `/campus`, `/events/*` CRUD, `/tour/nodes/:nodeId/publish` (cho phép independent node hợp lệ theo `OD-10`), `DELETE /tour/nodes/:id` (kèm cleanup edge/hotspot trong transaction), và `confirm-alignment` (gắn `tour_nodes.floor_plan_id = floorPlanId`).
  - Presign media/floorplan trả về `storageDriver: "local" | "s3"`.
  - **Ranh giới phạm vi:** Không có endpoint Check-in QR (`OD-05`), không có endpoint lưu điểm/XP quiz (`OD-08`); bài viết `/news` (`CAMPUS_GUIDE_ARTICLES`) và `OFFICIAL_CAMPUS_INFO` tiếp tục đọc từ static config ở `apps/web` (`OD-03` Option B).

---

## 6. Shared Contracts (`@fpt-campus/shared`) & Frontend Integration

1. **Cấu trúc module sạch (`packages/shared/src/*`):** Thay thế file đơn cũ bằng 7 module domain (`common.ts`, `api.ts`, `campus.ts`, `location.ts`, `tour.ts`, `auth.ts`, `events.ts`) và `index.ts`.
2. **Đóng gói build (`packages/shared/package.json`):** Xuất `./dist/index.js` và `./dist/index.d.ts` kèm sourcemaps/declarations cho cả ESM `import` và CJS `require`, tương thích đồng thời với Next.js 16 Turbopack (`apps/web`) và NestJS (`apps/api` ở Phase 2A-1).
3. **Runtime & Math Helpers:** Xuất khẩu và sử dụng chung `DEFAULT_QTSC_CAMPUS_CODE`, `DEFAULT_ENTRY_NODE_SLUG`, `isApiSuccessEnvelope`, `isApiErrorEnvelope`, `haversineDistanceMeters`, `computeRouteDistanceMeters`, `formatDistanceEstimate` — loại bỏ hàm tính khoảng cách trùng lặp trong `campus-data.ts`.
4. **Dọn dẹp ký hiệu cũ:** Rà soát bằng `rg` xác nhận `rg exit code: 1` (0 kết quả) cho `CampusCode`, `PanoramaScene`, `LocationRoom`, `UserRole`, `xpPoints`, `xpReward`, `QuizAttemptResult`, `EventRegistrationRequest`, `checkedIn`, `ticketCode`, `checkIn` trong toàn bộ `packages/shared/src` và [`apps/web/src/lib/shared-contracts.ts`](../../apps/web/src/lib/shared-contracts.ts); trong `apps/web/src`, chỉ còn `checkedIn`/`ticketCode` tại UI preview chưa chỉnh sửa (`admin/events`, `admin/users`, `AdminDashboardMetrics`, `/portal` và bản ghi `AdminUserMockRecord` trong `campus-data.ts`).
5. **Tích hợp kiểu chặt vào `apps/web`:** File [apps/web/src/lib/shared-contracts.ts](../../apps/web/src/lib/shared-contracts.ts) chuẩn hóa mapper chuyển đổi toàn bộ QTSC fallback data sang DTO của `@fpt-campus/shared`, sẵn sàng cho lớp chuyển nguồn `DATA_SOURCE=api` ở Phase 2A-1 mà không làm thay đổi hành vi UI hiện tại.

---

## 7. Sample Data & Verification Results

### 7.1. Kiểm tra dữ liệu mẫu (`OD-02` & `OD-10`)

- **`OD-02` (`loc-the-thao` / `khu-the-thao-qtsc`):**
  - Trong `campus-data.ts`, `loc-the-thao.sceneId` đã đặt thành `null`.
  - Kiểm tra HTML thực tế trên server đang chạy (`http://localhost:3000`):
    - `/locations` trả HTTP `200` (`len=43050`), có badge/nút fallback `"Định vị GIS"` (`True`).
    - `/locations/khu-the-thao-qtsc` trả HTTP `200` (`len=39910`), `has360Cta=False` (đã ẩn `"Mở góc nhìn 360°"`) và giữ nguyên liên kết `href="/map?building=SPORTS"`.
- **`OD-10` (Independent `TourNode`):**
  - `TourNodeSummaryDto` giữ `floorPlanId: UUID | null`, `floorNormX: number | null`, `floorNormY: number | null` và cho phép `PUBLISH` khi không có `FloorPlan` nếu đáp ứng kiểm định `TourGraph` và panorama `2:1`.

### 7.2. Kết quả kiểm tra tự động & Live Server

| Hạng mục kiểm tra | Lệnh / Đường dẫn | Kết quả quan sát thực tế |
| --- | --- | --- |
| Build `@fpt-campus/shared` | `pnpm --filter @fpt-campus/shared build` | **PASS** (exit `0`, xuất `packages/shared/dist/*.{js,d.ts,map}`). |
| Runtime Shared Contract Script | `verify_shared.cjs` | **PASS** (exit `0`, `sampleRouteMeters: 297`, `od02LocTheThaoSceneNull: true`). |
| TypeScript & ESLint toàn repo | `pnpm typecheck && pnpm lint` | **PASS** (exit `0` cho cả `packages/shared` và `apps/web`). |
| Next.js Production Build | `pnpm build` (`Next.js 16.4.6` Turbopack) | **PASS** (exit `0`, compiled in `51s`, TypeScript `3.5s`, generated `29/29` static pages in `18.4s`). |
| Live Production Server | `pnpm --filter web start` (`http://localhost:3000`) | **PASS** (Ready in `1012ms`; toàn bộ 18 route được probe `/`, `/map`, `/campus`, `/locations`, `/locations/khu-the-thao-qtsc`, `/events`, `/games`, `/login`, `/about`, `/contact`, `/news`, `/portal`, `/admin`, `/admin/events`, `/admin/locations`, `/admin/media`, `/admin/users`, `/admin/virtual-tour` trả **HTTP 200**). |
| Ràng buộc âm tính (`2A-0` Boundary) | `Test-Path apps/api`, `Test-Path prisma` | **PASS** (`False`, `False`; chưa khởi tạo backend/database). |
| Markdown Links Integrity | `check_md_links.cjs` | **PASS** (`Checked Markdown files: 47, Broken links: 0`). |

---

## 8. Remaining Design Notes & Deferred Items

Các hạng mục sau được giữ nguyên trạng thái trì hoãn có chủ đích theo ranh giới MVP và lộ trình:

1. **Chuyển `apps/web` sang đọc API thật (`DATA_SOURCE=api`):** Các page/component giao diện công khai hiện vẫn dùng dữ liệu từ `campus-data.ts`; mapper [shared-contracts.ts](../../apps/web/src/lib/shared-contracts.ts) đã khóa hợp đồng DTO để bước kết nối API tại `Phase 2A-1` & `2A-2` thay thế nguồn dữ liệu sạch sẽ.
2. **Hạ tầng Async & Object Storage (`Phase 2A-2+`):** Redis, BullMQ worker, pipeline cắt/nén panorama đa tầng, PDF FloorPlan rasterizer, và MinIO/S3 (`STORAGE_DRIVER=s3`) chưa cần khởi động ở `2A-1`.
3. **Excel Batch Import & Invitation Delivery (`Phase 2A-3`):** DTO preview/confirm đã có trong `packages/shared/src/auth.ts`; triển khai endpoint & worker gửi Email/SMS được xếp lịch sau `Core Read & Auth`.
4. **Static Content Boundary (`OD-03` Option B):** Chuyên mục `/news` (`CAMPUS_GUIDE_ARTICLES`) và hằng số thể chế `OFFICIAL_CAMPUS_INFO` tiếp tục nằm ở static config phía web trong MVP.
5. **Post-MVP Scope:** Student/Parent Portal (`/portal`), 3D WebGL, hệ thống Check-in QR/vé (`OD-05`), và Quiz XP/Bảng xếp hạng (`OD-08`) nằm ngoài phạm vi MVP.

---

## 9. Exact Scope & Readiness Gate for `Phase 2A-1`

**Điều kiện mở cổng `Phase 2A-1` đã thỏa mãn 100%:** Toàn bộ Contract (`OD-01..OD-10`), Shared Package (`@fpt-campus/shared`), và Frontend Type Alignment đã chốt và build xanh.

### Trong phạm vi `Phase 2A-1` (Database + Core Backend Bootstrap):
- Khởi chạy duy nhất dịch vụ **PostgreSQL 16** (`docker compose up -d postgres`).
- Khởi tạo workspace `apps/api/` (NestJS + Prisma ORM) dùng trực tiếp `@fpt-campus/shared`.
- Tạo `prisma/schema.prisma`, migration đầu tiên (bao gồm toàn bộ partial unique indexes `WHERE deleted_at IS NULL`, 18 enums, và `hotspots` `CHECK` constraint).
- Viết Seed dữ liệu QTSC Quận 12 chuẩn FK-order (`loc-the-thao.primary_node_id = NULL`, không tạo `FloorPlan` giả nhờ `OD-10`, tạo tài khoản Admin bootstrap đổi mật khẩu lần đầu).
- Triển khai `StorageAdapter` ở chế độ `STORAGE_DRIVER=local`.
- Triển khai `POST /auth/login` (`username | email | phone`), `POST /auth/change-password`, `GET /auth/me` và các Public Read APIs (`/public/campus`, `/public/buildings/:slug`, `/public/locations`, `/public/locations/:slug`, `/public/tour/nodes`, `/public/tour/nodes/:slug`, `/public/events`, `POST /public/quiz/verify`).

### Ngoài phạm vi `Phase 2A-1`:
- Redis / BullMQ workers, MinIO (`STORAGE_DRIVER=s3`), Upload & xử lý Panorama / PDF FloorPlan bất đồng bộ (`2A-2`).
- Nhập danh sách sinh viên/phụ huynh từ Excel & gửi link kích hoạt Email/SMS (`2A-3`).
- Bất kỳ thay đổi giao diện ngoài việc nối `DATA_SOURCE=api` hoặc các module Post-MVP (`/portal`, 3D WebGL, QR Check-in, Quiz XP).
