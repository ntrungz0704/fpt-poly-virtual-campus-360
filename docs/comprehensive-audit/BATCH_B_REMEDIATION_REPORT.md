# Batch B Comprehensive Remediation Report — B-B1, B-B2, B-B3 & B-B4

**Repository:** `ntrungz0704/fpt-poly-virtual-campus-360`  
**Branch:** `audit/comprehensive-quality-remediation`  
**`origin/main` HEAD (Post-M8 Merge PR #2, untouched):** `c0a268dafaeb84c537f667cabad82b63ee3d39bb`  
**Batch A Accepted Baseline HEAD:** `6aa4427` *(with `bff4323`, `09d0bcc`, `a9bbfaa`)*  
**Tech Lead Verdict:** **Batch B — COMPLETE (`B-B1`, `B-B2`, `B-B3`, `B-B4` ALL ACCEPTED)**  
*(Lưu ý phạm vi: `Batch B COMPLETE` áp dụng cho 4 gói sửa lỗi B-B1 → B-B4 và các bộ test đã chạy; không tuyên bố toàn bộ hệ thống đã production-ready khi Batches C–F, full E2E regression và điều kiện cutover/OPS chưa hoàn tất.)*

---

## 1. Commit Lineage trên nhánh `audit/comprehensive-quality-remediation`

| Gói | Commit SHA (Full) | Nội dung chính | Trạng thái Tech Lead |
|---|---|---|---|
| **B-B1** (`AUTH-SEED-POLICY` + `PUBLIC-REG-RACE`) | `a38865295399e47c4054ae8d950c734354ca188` | Khôi phục `mustChangePassword: true` trong `prisma/seed.ts:1311`; thêm migration partial unique index `uq_event_participations_active_email` (`(event_id, LOWER(attendee_email)) WHERE attendee_email IS NOT NULL AND participation_status <> 'CANCELLED'`) + xử lý atomic `P2002` `409 DUPLICATE_REGISTRATION` & retry `ticket_code` | **ACCEPTED** |
| **B-B1** (E2E Harness Sync) | `c3096c503b82251cff92fb331df27a95896703c2` | Đồng bộ `E2E_ADMIN_BOOTSTRAP_PASSWORD`, ưu tiên `E2E_DB_URL` trong `portal-fixtures.ts`, căn chỉnh `open-day-flow.spec.ts` cho luồng bắt buộc đổi mật khẩu admin lần đầu (không hạ chuẩn bảo mật) | **ACCEPTED** |
| **B-B2** (`TOUR-STUDIO-SYNC`) | `aca1ab5f282183c55dfe12f962a3e6dbd385705b` | Loại bỏ 100% `localStorage` (`vc_admin_tour_scenes`) và `TOUR_SCENES` fallback khỏi Tour Studio (`/admin/virtual-tour`) & `/admin/locations`; đồng bộ CRUD `TourNode`, `batch-save` hotspots/edges/`panoramaAssetId`/`initialFov`, `DELETE /admin/tour/nodes/:id`, Loading/Error/Empty states dùng PostgreSQL làm Source of Truth duy nhất | **ACCEPTED** |
| **B-B2** (Verification & Guard Fix) | `4de20265e4c086110e1f00a151b3c05564d2c03f` | Vá lỗ hổng phân quyền trên `PATCH /api/v1/admin/tour/nodes/:id` (`updateNode()` bắt buộc `tour:publish` mới được đổi `status`, trả `403 FORBIDDEN`), thêm `@IsEnum` DTO, bọc `unpublishTour()` trong `$transaction`, bổ sung regression tests rollback multi-scene / xóa edge chọn lọc / 3-FK `deleteNode()` + atomic `AuditLog` / `403 tour:publish` | **ACCEPTED** |
| **B-B3** (`REAL-05 / REAL-06 / UI-09`) | `fe1531b07202f950623047fea8c3a7e329663fb8` | Triển khai `GET /api/v1/admin/overview` truy vấn số liệu thực PostgreSQL + công thức `0`/`N/A`; tích hợp `GET /api/v1/admin/audit-logs?page=1&limit=8` (`audit:read` + `403`); bổ sung `apiRequestEnvelope()` sửa unwrap pagination `{ data, meta }`; gỡ 100% KPI/log giả (`128,450`, `3,820`, `95.5%`, `99.98%`, `Panorama 8K`, `RECENT_OPERATIONS`); kiểm chứng Playwright Desktop/Mobile/`403` | **ACCEPTED** |
| **B-B4** (`SPINWHEEL-CLEANUP + NEWS-MEDIA-POLISH`) | `1fee2567a4cfb1841888f15bddd030ea5cf54c22` | Tách `createSpinTimerLifecycle()` (`epoch` + `isMountedRef` + unmount `cancel()` trong `SpinWheel.tsx`); sửa crash `BigInt` (`fileSizeBytes`) tại `NewsAdminService.getArticle()`, loại trừ `MediaAsset` đã soft-delete (`deleted_at IS NOT NULL`) ở cả Admin & Public News API trong khi bảo toàn bài legacy chỉ dùng `coverImageUrl` | **ACCEPTED** |

---

## 2. Chi tiết Mục tiêu, Lỗi phát hiện & Cách khắc phục từng Gói

### 2.1. B-B1 — `AUTH-SEED-POLICY` + `PUBLIC-REG-RACE` (`a388652`, `c3096c5`)
- **Mục tiêu:** Giải quyết xung đột chính sách `mustChangePassword` trên bootstrap admin (vốn khiến `auth-session.integration.spec.ts` fail từ `d03b55a`) mà vẫn giữ chặt bảo mật; đồng thời loại bỏ race condition trùng email khi đăng ký Open Day đồng thời.
- **Lỗi thực tế & khắc phục:**
  1. `prisma/seed.ts:1311` trước đó bị đổi thành `mustChangePassword: false`, mâu thuẫn với `diffJson` (`true`) và `auth-session.integration.spec.ts`. Đã khôi phục `mustChangePassword: true` và đồng bộ biến môi trường `E2E_ADMIN_BOOTSTRAP_PASSWORD` + `E2E_DB_URL` trong E2E runner (`run-e2e.mjs`, `portal-fixtures.ts`, `open-day-flow.spec.ts`).
  2. `PublicService.registerEvent()` chỉ pre-check bằng query thường nên 2 request cùng email song song vượt qua pre-check gây trùng vé hoặc crash 500. Đã bổ sung migration `prisma/migrations/20261117000002_event_participation_active_email_unique/migration.sql` tạo partial unique index `uq_event_participations_active_email` (`("event_id", LOWER("attendee_email")) WHERE "attendee_email" IS NOT NULL AND "participation_status" <> 'CANCELLED'`) và bắt `P2002` phân biệt email collision (`409 DUPLICATE_REGISTRATION`) vs `ticket_code` collision (retry).
- **Kiểm chứng:** `auth-session.integration.spec.ts` (**4/4 PASS**), `audit-batch-b1.integration.spec.ts` (**5/5 PASS**), 8 suites PG16 (**51/51 PASS**), `open-day-flow.spec.ts` (**5/5 PASS**), `auth-integration.spec.ts` case `#4` (**1/1 PASS**).

### 2.2. B-B2 — `TOUR-STUDIO-SYNC` (`aca1ab5`, `4de2026`)
- **Mục tiêu:** Đưa Tour Studio (`/admin/virtual-tour`) và Admin Locations (`/admin/locations`) dùng PostgreSQL làm Source of Truth duy nhất; xóa `localStorage` & `TOUR_SCENES` fallback; kiểm soát chặt quyền xuất bản.
- **Lỗi thực tế & khắc phục:**
  1. `Tour Studio` và `Admin Locations` trước đó khởi tạo từ `TOUR_SCENES`, lưu bản nháp `localStorage` (`vc_admin_tour_scenes`) tạo cảm giác lưu thành công giả; `batch-save` chưa đồng bộ `panoramaAssetId`, `initialFov`, xóa hotspot và `TourEdge`, thiếu `DELETE /admin/tour/nodes/:id`. Đã loại bỏ hoàn toàn `localStorage`/`TOUR_SCENES` (`rg` = 0 hits), triển khai `LoadingState`/`ErrorState`/`EmptyState`, thêm `DELETE /api/v1/admin/tour/nodes/:id` (`deleteNode()` dọn sạch 3 FK nullable `Location.primaryNodeId`, `Building.defaultNodeId`, `Campus.defaultEntryNodeId`, xóa hotspots trước edges tránh vi phạm CHECK `chk_hotspots_scene_link_edge_consistency`, ghi `AuditLog` cùng `$transaction`), nâng cấp `batchSaveStudio()` & `syncHotspotEdgeInTx()` xử lý đồng bộ `TourEdge` nguyên tử trong `$transaction`.
  2. **Lỗ hổng phân quyền phát hiện trong quá trình xác minh:** `PATCH /api/v1/admin/tour/nodes/:id` chỉ gắn `@RequirePermissions("tour:write")` nhưng `TourAdminService.updateNode()` cho phép truyền `dto.status` đổi sang `PUBLISHED`/`DRAFT`/`ARCHIVED` không kiểm tra quyền `tour:publish`. Đã vá kiểm tra `user.permissions.includes("tour:publish")` (`403 FORBIDDEN`), thêm `@IsEnum` ở `UpdateTourNodeDto.status`, và bọc `unpublishTour()` trong `$transaction`.
- **Kiểm chứng:** Web unit (`tour-studio-sync.test.ts` **4/4 PASS**), PG16 integration `audit-batch-b2.integration.spec.ts` (**3/3 PASS**, chứng minh rollback đa cảnh, xóa edge chọn lọc, 3-FK `deleteNode` + atomic `AuditLog`, và `403` cho user chỉ có `tour:write`), hồi quy `audit-batch-a` (**9/9 PASS**), `location-gis-crud` (**13/13 PASS**), `public-isolation` (**6/6 PASS**), `auth-session` (**4/4 PASS**).

### 2.3. B-B3 — `REAL-05 / REAL-06 / UI-09` (`fe1531b`)
- **Mục tiêu:** Thay thế 100% số liệu giả trên Dashboard Admin (`AdminDashboardMetrics`, `AdminRecentActivityLog`) bằng dữ liệu truy vấn thực từ PostgreSQL và xử lý rõ ràng quyền `audit:read` / `403`.
- **Lỗi thực tế & khắc phục:**
  1. `AdminDashboardMetrics` trước đây hardcode `"128,450"`, `"3,820"`, `"95.5%"`, `"99.98% SLA"`, `"Panorama 8K"` và `AdminRecentActivityLog` hardcode `RECENT_OPERATIONS`. Đã tạo `GET /api/v1/admin/overview` (`AdminOverviewController` + `AdminOverviewService` bảo vệ bởi `@RequireAnyPermission(...)`) truy vấn count thực từ `tour_nodes`, `hotspots`, `open_day_events`, `event_participations`, `locations`, `media_assets`, `users` (hiển thị `0` hoặc `N/A` khi rỗng, không chế số).
  2. **Lỗi phân trang phát hiện qua integration test:** `AuditLogController.list` trả `createPaginatedPayload()` được `ResponseEnvelopeInterceptor` biến thành `{ success: true, data: AuditLogEntryDto[], meta: { page, limit, total } }`, không phải `{ items }`. Đã bổ sung `apiRequestEnvelope<T>()` trong `apps/web/src/lib/auth/api-client.ts` và cập nhật `fetchAdminAuditLogs()` đọc đúng `{ data, meta }`.
  3. Frontend `AdminRecentActivityLog` kiểm tra quyền `audit:read` và bắt `HTTP 403` (`isForbiddenApiError`) để hiển thị panel `403 · audit:read` (`audit-log-forbidden`), không bao giờ hiển thị log giả; đồng thời có skeleton loading, empty và error retry cho cả 2 khối.
- **Kiểm chứng:** Web unit (`admin-dashboard.test.ts` **5/5 PASS**), PG16 integration (`audit-batch-b3` **2/2 PASS**, `open-day-rbac-crud` **2/2 PASS**, `rbac-provisioning-activation` **2/2 PASS**), Playwright E2E `e2e/admin-dashboard-b3.spec.ts` (**2/2 PASS**, `8.7s`, kiểm chứng live Desktop `1440×900`, Mobile `390×844`, `EVENT_OPERATOR` `403 · audit:read`, và mô phỏng `500 -> Retry`).

### 2.4. B-B4 — `SPINWHEEL-CLEANUP + NEWS-MEDIA-POLISH` (`1fee256`)
- **Mục tiêu:** Đảm bảo `SpinWheel` cleanup timer khi unmount và không cập nhật state muộn; sửa serialization `BigInt` và lọc bỏ `MediaAsset` đã soft-delete trong News API.
- **Lỗi thực tế & khắc phục:**
  1. `SpinWheel.tsx` trước đó dùng `setTimeout(..., 4200)` trần không cleanup, không chặn callback trễ sau unmount. Đã tách `createSpinTimerLifecycle()` (`spinwheel-timer.ts`) có `epoch` guard + `cancel()` ở `useEffect` unmount và `isMountedRef.current` check trước mọi `setState`/`onSpinComplete` (giữ nguyên toán học quay, xác suất, `4200ms` CSS animation và cơ chế idempotency).
  2. `NewsAdminService.getArticle()` dùng `coverMedia: true` kéo trường `fileSizeBytes: BigInt` làm `JSON.stringify` sập `500`; đồng thời `listArticles()`, `NewsPublicService.listPublished()` và `getBySlug()` không kiểm tra `coverMedia.deletedAt !== null` nên vẫn trả URL ảnh đã soft-delete. Đã tạo `news-media.helper.ts` chuẩn hóa `SAFE_NEWS_MEDIA_SELECT`, `serializeSafeBigInt()`, loại bỏ media có `deletedAt !== null` khỏi Admin & Public responses, từ chối gán media đã xóa/không tồn tại/`FAILED` (`400`), và bảo toàn bài legacy (`coverMediaId: null` giữ `coverImageUrl`).
- **Kiểm chứng (chạy mới nhất sau commit `1fee256`, `exit code = 0`):**
  - `pnpm --filter @fpt-campus/shared build`, `api build/lint/typecheck`, `web lint/typecheck` -> **PASS (`exit 0`)**
  - `pnpm --filter api exec jest --runInBand --verbose test/unit` -> **11/11 suites, 42/42 PASS, 0 FAIL, 0 SKIP** (`news-media-polish.spec.ts` **2/2 PASS**)
  - `pnpm --filter web test:unit` -> **32/32 PASS, 0 FAIL, 0 SKIP** (`spinwheel-cleanup.test.ts` **3/3 PASS**)
  - `pnpm --filter web build` -> **PASS (`28/28` routes)**
  - `pnpm --filter api exec jest --runInBand --verbose test/integration/news-cms.integration.spec.ts test/integration/audit-batch-a.integration.spec.ts test/integration/audit-batch-b1.integration.spec.ts test/integration/audit-batch-b2.integration.spec.ts test/integration/audit-batch-b3.integration.spec.ts` -> **5/5 suites, 36/36 PASS, 0 FAIL, 0 SKIP** (`news-cms`: **17/17**, `audit-batch-a`: **9/9**, `audit-batch-b1`: **5/5**, `audit-batch-b2`: **3/3**, `audit-batch-b3`: **2/2**).

---

## 3. Giới hạn Kiểm thử, Vấn đề Ngoài phạm vi & Việc Còn Lại Sau Batch B

1. **Các lỗi E2E pre-existing ngoài phạm vi Batch B (ghi nhận minh bạch, chưa sửa trong Batch B):**
   - `apps/web/e2e/auth-integration.spec.ts` Test `#5`: sai lệch heading trang chủ ngoài scope B-B1.
   - `apps/web/e2e/portal-flow.spec.ts` Test `#4`: gặp rate limit `429` khi chạy tuần tự nhanh.
   - `apps/web/e2e/gamification-flow.spec.ts`: cần kiểm tra tổng thể theo rule B-A2 chặt chẽ tại Batch E.
2. **Giới hạn độ phủ tại thời điểm đóng Batch B:**
   - Sau `1fee256` (B-B4), hệ thống chạy hồi quy tập trung 5 suites tích hợp cốt lõi (`36/36 PASS`), unit tests (`42/42` API + `32/32` Web) và build `28/28` Web routes; không chạy đồng loạt toàn bộ 20 API integration suites hay toàn bộ 4 E2E specs cũ trong 1 phiên. (Các suite còn lại như `location-gis-crud`, `public-isolation`, `auth-session`, `rbac-provisioning-activation`, `open-day-rbac-crud` và `admin-dashboard-b3.spec.ts` đã pass trực tiếp ở các bước B-B1/B-B2/B-B3.)
   - **Banner trạng thái nội bộ trong `apps/web/src/app/admin/layout.tsx`:** Dòng mô tả `"Các màn hình biên tập CMS chi tiết... đang ở chế độ Preview"` nằm ngoài phạm vi 2 component B-B3, sẽ rà soát ở Batch C/D.
3. **Các Batch & Điều kiện Vận hành còn lại (Chưa bắt đầu):**
   - **Batches C–F** (`UI/UX Real Content Remediation`, `Dead Code Cleanup`, `Batch E Full Cross-Browser E2E & Accessibility Regression`, `Batch F Final Synchronization`).
   - **Điều kiện vận hành / Cutover (`OPS-01/02/03`, CI `.github/workflows`, `prisma/preflight-m1-quiz-event.sql` / `BLK-E1`):** Chưa thiết lập CI và chưa thực hiện đánh giá production cutover.
