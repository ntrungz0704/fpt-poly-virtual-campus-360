# HANDOFF TO TECH LEAD (GPT) — FULL PROJECT HEALTH CHECK (`2026-11-18`) & REMEDIATION SYNC

**Kho lưu trữ:** `ntrungz0704/fpt-poly-virtual-campus-360`  
**Nhánh làm việc hiện tại:** `audit/comprehensive-quality-remediation` *(tạo từ `main @ ef03ce9`, đã merge `origin/main` Post-M8 `c0a268d` tại `bff4323`)*  
**Trạng thái nghiệm thu hiện tại:**
- **Batch A:** `ACCEPTED` (`6aa4427`)
- **Batch B (`B-B1` → `B-B4`):** `ACCEPTED` (`1fee256`, docs sync `3f446f5`)
- **Batch C (`B-C1` → `B-C3`):** `IMPLEMENTED & PUSHED` (`fb519c3`, `6cdc3fe`, `74839f9`, `bd10727`, `968a871` — **chưa có Tech Lead Acceptance chính thức**)
- **Full Health Check Remediation (`2026-11-18`):** Đã vá 2 bug P1 xác minh trực tiếp (`public-api.ts` INFO hotspot `infoText` + regression unit test; `prisma/seed.ts` transaction timeout `{ maxWait: 10_000, timeout: 60_000 }`) và đồng bộ tài liệu trạng thái.  
**Đối chiếu trạng thái tổng thể:** [`PROJECT_STATUS.md`](../PROJECT_STATUS.md) · [`REMEDIATION_BACKLOG.md`](comprehensive-audit/REMEDIATION_BACKLOG.md)

---

## 0. Kết quả Full Project Health Check (`2026-11-18`)

### A. Những gì đã xác minh hoạt động & đã sửa P1
1. **P1 Fix — Tour 360° INFO Hotspot `infoText` (`apps/web/src/lib/public/public-api.ts:451,545`):** `mapTourNodeDetailToScene()` từng gán nhầm `tooltip: hs.body ?? undefined` trong khi `PanoramaStage.tsx:668,683` đọc `hs.infoText`, và `mapFallbackSceneToNodeDetail()` bỏ `body: null`. Đã sửa cả hai chiều và bổ sung unit test tại `apps/web/tests/unit/batch-a-qr-and-api.test.ts`.
2. **P1 Fix — `prisma/seed.ts` 5000ms Transaction Timeout (`prisma/seed.ts:2012`):** `pnpm db:test` (`AC-08`) thất bại thực tế ở `5075 ms > 5000 ms` trong `prisma.$transaction(...)`. Đã bổ sung `{ maxWait: 10_000, timeout: 60_000 }`; chạy lại `pnpm db:test` đạt **`14/14 PASS`** (`EXIT_DB_TEST=0`).
3. **Chất lượng Build & Kiểm thử Sau Sửa P1:**
   - `pnpm --filter @fpt-campus/shared build` & `typecheck`: **PASS (`exit 0`)**.
   - `pnpm --filter api lint`, `typecheck`, `build`: **PASS (`exit 0`)**; `api test:unit`: **11/11 suites, 42/42 tests PASS**.
   - `pnpm --filter api test:integration` (chạy trên commit `968a871` ngay trước 2 sửa P1 trên `apps/web` & `seed.ts`): **22/22 suites, 198/198 tests PASS (`exit 0`, 660s)**. Lưu ý phụ: `test:integration` ghi file test upload vào `apps/web/public/images/` (`LOCAL_MEDIA_ROOT`), cần dọn tay nếu chạy tại máy local.
   - `pnpm --filter web lint`, `typecheck`, `build`: **PASS (`exit 0`, 28 pages + `/_not-found`, `/robots.txt`, `/sitemap.xml`)**; `web test:unit`: **49/49 tests PASS (`exit 0`)**.
   - `prisma/preflight-m1-quiz-event.sql` trên local DB `virtual_campus_360`: **3/3 `RESOLVED (R1_SESSION)`**.

### B. Vấn đề Mở / Blockers Cần Tech Lead Quyết định (Không tự sửa vượt scope)
1. **Local Primary DB Schema Drift (`virtual_campus_360`):** `pnpm db:status` FAIL (`exit 1`) do local `virtual_campus_360` thiếu bảng `_prisma_migrations` và thiếu cột/index của Batch A/B (`guest_session_id`, `uq_event_participations_active_email`). Cần `prisma migrate deploy` / re-provision sạch trước khi chạy app dev trực tiếp trên DB chính.
2. **Full Playwright E2E Suite (`pnpm --filter web test:e2e` trên nền `968a871`): `17 passed, 6 failed, 10 did not run` (`exit 1`):**
   - `batch-c1-ux.spec.ts #1`, `open-day-flow.spec.ts #5`, `portal-flow.spec.ts #4`: đụng `@Throttle({ default: { limit: 5, ttl: 60_000 } })` trên `POST /auth/login` (`429 RATE_LIMITED`) khi toàn bộ 8 specs chạy nối tiếp từ `127.0.0.1` trong <60s. (Không giảm throttle production vì `auth-session.integration.spec.ts` test chính sách 5 req/60s này.)
   - `auth-integration.spec.ts #4`: thất bại vì `admin-dashboard-b3.spec.ts` chạy trước (theo alphabet) và đã đổi mật khẩu tài khoản dùng chung `e2e_operator`.
   - `batch-c2-public-honesty.spec.ts #2`: `getByTestId("location-real-attributes")` gặp strict mode violation (`2` phần tử: bản trong React streaming `<div hidden id="S:0">` và bản trong `<main>`).
   - `gamification-flow.spec.ts #2`: spec vẫn cấy vé giả `localStorage` (`OD26-E2E-...`) và dùng selector `{ exact: true }` không khớp `(OD26-E2E-...)` (đã ghi nhận từ Batch A).
3. **Business Logic & Hygiene còn cho Batch D / E / DevOps:**
   - `PortalService.getGamification` (`+1 spin / 100 XP`, `tickets.length > 0`) lệch với `GamificationService.computeParticipantProfile` (không cộng spin theo XP).
   - `ParentController.createLinkRequest` (`upsert`) hạ trạng thái link `APPROVED` về `PENDING` nếu gửi lại yêu cầu.
   - Tài liệu `README.md` và `docs/project-audit-current/*` bị lỗi thời so với codebase (`26` vs `39` models, `Swagger /docs`, `.github/workflows` không tồn tại).
   - `pnpm audit --prod`: **4 HIGH** (`xlsx` 2 CVE chưa có bản vá trên npm registry, `zod <4.6.6`, `deepmerge-ts <8.0.0`).
   - Hạ tầng Production thiếu hoàn toàn CI/CD (`.github/workflows`), `Dockerfile` cho `api`/`web`, Nginx/SSL, Redis thật, S3/R2 buckets thật, SMTP/SMS adapter thật (`LocalStubInvitationDeliveryAdapter` vẫn đang stub), và thay 5 panorama AI synthetic placeholder bằng ảnh 360° QTSC thật trước Go-Live.

---

# HISTORICAL SECTION: HANDOFF TO TECH LEAD (GPT) — COMPREHENSIVE AUDIT BATCH B COMPLETION (`B-B1` → `B-B4`)

**Kho lưu trữ:** `ntrungz0704/fpt-poly-virtual-campus-360`  
**Nhánh làm việc hiện tại:** `audit/comprehensive-quality-remediation` *(tạo từ `main @ ef03ce9`, đã merge `origin/main` Post-M8 `c0a268d` tại `bff4323`)*  
**Trạng thái nghiệm thu Tech Lead:** **Batch A ACCEPTED (`6aa4427`)** · **Batch B COMPLETE (`B-B1` → `B-B4` ALL ACCEPTED tại `1fee256`)**  
**Báo cáo chi tiết Batch B:** [`docs/comprehensive-audit/BATCH_B_REMEDIATION_REPORT.md`](comprehensive-audit/BATCH_B_REMEDIATION_REPORT.md)  
**Đối chiếu trạng thái tổng thể:** [`PROJECT_STATUS.md`](../PROJECT_STATUS.md)

---

## 1. Tóm tắt Kết quả Batch B (Đã Nghiệm thu Theo Từng Gói)

1. **B-B1 (`AUTH-SEED-POLICY` + `PUBLIC-REG-RACE`) — `ACCEPTED` (`a388652`, `c3096c5`):**
   - Khôi phục `mustChangePassword: true` trong `prisma/seed.ts:1311`; đồng bộ `E2E_ADMIN_BOOTSTRAP_PASSWORD`, `E2E_DB_URL` và luồng đổi mật khẩu đầu cho E2E (`open-day-flow.spec.ts` 5/5 PASS; `auth-session.integration.spec.ts` 4/4 PASS).
   - Bổ sung partial unique index PostgreSQL `uq_event_participations_active_email` (`prisma/migrations/20261117000002_event_participation_active_email_unique/migration.sql`) và xử lý atomic `P2002` (`409 DUPLICATE_REGISTRATION`) + retry `ticket_code` trong `PublicService.registerEvent()` (`audit-batch-b1.integration.spec.ts` 5/5 PASS).
2. **B-B2 (`TOUR-STUDIO-SYNC`) — `ACCEPTED` (`aca1ab5`, `4de2026`):**
   - Gỡ 100% `localStorage` (`vc_admin_tour_scenes`) và fallback tĩnh `TOUR_SCENES` khỏi `/admin/virtual-tour` và `/admin/locations`; PostgreSQL là Source of Truth duy nhất kèm Loading/Error/Empty states.
   - Bổ sung `DELETE /api/v1/admin/tour/nodes/:id` (`deleteNode()` dọn 3 FK nullable `Location.primaryNodeId`, `Building.defaultNodeId`, `Campus.defaultEntryNodeId`, xóa hotspots trước edges và ghi `AuditLog` cùng `$transaction`); đồng bộ `TourEdge`/hotspot trong `$transaction` của `batchSaveStudio()`.
   - Vá lỗ hổng phân quyền thực tế trên `PATCH /api/v1/admin/tour/nodes/:id`: bắt buộc quyền `tour:publish` khi đổi `status`, siết `@IsEnum`, bọc `unpublishTour()` trong `$transaction` (`audit-batch-b2.integration.spec.ts` 3/3 PASS).
3. **B-B3 (`REAL-05 / REAL-06 / UI-09`) — `ACCEPTED` (`fe1531b`):**
   - Tạo `GET /api/v1/admin/overview` (`@RequireAnyPermission(...)`) truy vấn số liệu thực PostgreSQL (`0`/`N/A` khi rỗng); gỡ sạch KPI/nhật ký giả (`128,450`, `3,820`, `95.5%`, `99.98%`, `Panorama 8K`, `RECENT_OPERATIONS`).
   - Tích hợp `GET /api/v1/admin/audit-logs?page=1&limit=8` giữ nguyên `@RequirePermissions("audit:read")`, thêm `apiRequestEnvelope()` trong `api-client.ts` đọc đúng phân trang `{ data, meta }` từ `ResponseEnvelopeInterceptor`, và xử lý `403` tường minh không giả lập dữ liệu (`audit-batch-b3.integration.spec.ts` 2/2 PASS; `e2e/admin-dashboard-b3.spec.ts` 2/2 PASS với ảnh Desktop/Mobile/`403`).
4. **B-B4 (`SPINWHEEL-CLEANUP + NEWS-MEDIA-POLISH`) — `ACCEPTED` (`1fee256`):**
   - Tách `createSpinTimerLifecycle()` (`epoch` + `isMountedRef` + `cancel()` khi unmount) cho `SpinWheel.tsx` ngăn cập nhật state/callback muộn, giữ nguyên logic quay/idempotency (`spinwheel-cleanup.test.ts` 3/3 PASS).
   - Loại bỏ `coverMedia: true` gây lỗi serialize `BigInt` (`fileSizeBytes`) ở `NewsAdminService.getArticle()`, loại trừ `MediaAsset` đã soft-delete (`deleted_at IS NOT NULL`) ở cả Admin & Public News API, từ chối media không tồn tại/đã xóa/`FAILED` (`400`), và bảo toàn bài viết legacy dùng `coverImageUrl` (`news-media-polish.spec.ts` 2/2 PASS; `news-cms.integration.spec.ts` 17/17 PASS).

## 2. Xác nhận Kiểm thử, Giới hạn & Phạm vi Còn Lại (Không tuyên bố Production-Ready)
- **Kiểm thử sau B-B4 (`1fee256`, `exit code = 0`):** Shared/API/Web build (`28/28` routes), lint, typecheck đều `0` lỗi; API unit **11/11 suites (42/42 PASS)**; Web unit **32/32 PASS**; PostgreSQL 16 integration 5 suites trọng tâm (**36/36 PASS**: `news-cms` 17/17, `audit-batch-a` 9/9, `audit-batch-b1` 5/5, `audit-batch-b2` 3/3, `audit-batch-b3` 2/2).
- **Giới hạn & việc còn lại:** Vẫn còn **Batches C–F** (`UI-09`/content cleanup ngoài dashboard, dead code, full cross-browser E2E Batch E sửa 2 lỗi pre-existing `auth-integration #5` & `portal-flow #4`, CI `.github/workflows`, cùng rà soát điều kiện vận hành/cutover `OPS-01/02/03` và preflight `prisma/preflight-m1-quiz-event.sql` `BLK-E1`). Batch B là **COMPLETE**, không tự động gộp lên `main` hoặc tự suy diễn trạng thái production-ready.

---

# PRESERVED HISTORICAL HANDOFF RECORD (MILESTONE M7.5 — 2026-11-16, BRANCH `fix/m4-acceptance-blockers`)

> [!NOTE]
> Tài liệu dưới đây được bảo toàn nguyên văn để lưu giữ lịch sử nghiệm thu Milestone M7.5 trước khi nhánh `audit/comprehensive-quality-remediation` triển khai Batch A & Batch B.

# BÁO CÁO NGHIỆM THU NGHIỆP VỤ & KỸ THUẬT MILESTONE M7.5 — TARGETED REMEDIATION (B01 & B02)
## ĐÃ KHẮC PHỤC TRIỆT ĐỂ READ-ONLY SEMANTICS VÀ BOOLEAN QUERY TRANSFORMATION TRÊN POSTGRESQL THỰC TẾ

**Dự án:** FPT Polytechnic Virtual Campus 360°  
**Kho lưu trữ:** `ntrungz0704/fpt-poly-virtual-campus-360`  
**Nhánh làm việc:** `fix/m4-acceptance-blockers` (Duy nhất 1 nhánh làm việc, không tạo nhánh phụ)  
**Pull Request trên GitHub:** PR #1  
**Thời gian hoàn thành:** 2026-11-16 22:15 (GMT+7)  

---

## 1. ĐỐI CHIẾU COMMIT SHA TRÊN GITHUB
- **HEAD Baseline Tech Lead thẩm định:** `63982d2` (Trạng thái: PENDING REMEDIATION)
- **M7.5 Remediation Code & Tests Commit:** `b37fc57` (`fix(quiz-results): restore read-only semantics for get endpoints and fix boolean query transformation`)
- **M7.5 Remediation Docs Commit:** Đi kèm ngay sau tài liệu này.
- **Quy chuẩn Git:** Phân tách hoàn toàn Code commit và Docs commit, 0 mock/stub, không force-push, 100% đồng bộ trên nhánh `fix/m4-acceptance-blockers`.

---

## 2. ROOT CAUSE & GIẢI TRÌNH XỬ LÝ TRIỆT ĐỂ B01 & B02

### 2.1. B01 — RESTORE READ-ONLY SEMANTICS (Loại bỏ DB Write trong API GET)
- **Root Cause xác định bởi Tech Lead:**
  Trong `portal-quiz.service.ts` (`getStudentQuizHistory`) và `quiz-config.service.ts` (`getQuizResults`), hệ thống trước đó đã chạy:
  ```typescript
  await this.prisma.quizConfigAttempt.updateMany({
    where: { status: "IN_PROGRESS", expiresAt: { lte: now } },
    data: { status: "EXPIRED" },
  });
  ```
  Hành vi này vi phạm nguyên tắc bất biến của HTTP GET: API đọc dữ liệu không được phép thực hiện mutation (`INSERT`, `UPDATE`, `DELETE`) làm thay đổi trạng thái attempt trong PostgreSQL.
- **Biện pháp khắc phục (Purely Read-Only Semantics):**
  1. Loại bỏ hoàn toàn lệnh `updateMany` khỏi `getStudentQuizHistory()` và `getQuizResults()`.
  2. Xử lý trạng thái hiển thị (display/effective status) trong bộ nhớ:
     ```typescript
     const isExpiredInProgress = att.status === "IN_PROGRESS" && now >= att.expiresAt;
     const effectiveStatus = isExpiredInProgress ? "EXPIRED" : att.status;
     ```
  3. Xử lý bộ lọc truy vấn thông minh không cần cập nhật database:
     ```typescript
     if (query.status === "EXPIRED") {
       where.OR = [
         { status: "EXPIRED" },
         { status: "IN_PROGRESS", expiresAt: { lte: now } },
       ];
     } else if (query.status === "IN_PROGRESS") {
       where.status = "IN_PROGRESS";
       where.expiresAt = { gt: now };
     } else if (query.status) {
       where.status = query.status;
     }
     ```
  4. Đảm bảo tính nguyên vẹn: Các hàm `getStudentQuizHistoryDetail()`, `getQuizResultDetail()`, và `getStudentQuizAttemptHistory()` đều áp dụng `effectiveStatus` thuần túy trong RAM, không ghi bất kỳ dữ liệu nào vào database.
- **Bằng chứng PostgreSQL Integration Test (Test 11):**
  - Khởi tạo attempt `IN_PROGRESS` có `expiresAt` trong quá khứ (1 giờ trước).
  - Chụp snapshot toàn bộ thuộc tính của bản ghi trong bảng `quiz_config_attempts`.
  - Gọi `GET /api/v1/portal/quiz/history` 3 lần liên tiếp: Response hiển thị `status: "EXPIRED"`, nhưng truy vấn trực tiếp PostgreSQL xác nhận `status` trong DB vẫn giữ nguyên `IN_PROGRESS` và `updatedAt` không đổi.
  - Gọi `GET /api/v1/admin/quiz-configs/results` 3 lần liên tiếp: Response hiển thị `status: "EXPIRED"`, nhưng truy vấn trực tiếp PostgreSQL xác nhận `status` trong DB vẫn giữ nguyên `IN_PROGRESS` và `updatedAt` không đổi.
  - Số lượng bản ghi `quiz_xp_claims` và `xp_ledger` giữ nguyên 100%, không phát sinh bất kỳ thay đổi nào.

---

### 2.2. B02 — FIX BOOLEAN QUERY TRANSFORMATION (`passed=false`)
- **Root Cause xác định bởi Tech Lead:**
  Trong cả 2 file DTO:
  - `apps/api/src/modules/portal/dto/portal.dto.ts`
  - `apps/api/src/modules/quiz-config/dto/quiz-config.dto.ts`
  Trước đó khai báo:
  ```typescript
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  passed?: boolean;
  ```
  Hàm chuyển đổi `Boolean("false")` của JavaScript trả về `true` (do chuỗi không rỗng luôn là truthy). Dẫn đến khi query `passed=false`, giá trị bị ép kiểu thành `true`, khiến chức năng lọc bài thi trượt trả về kết quả sai lệch.
- **Biện pháp khắc phục (Explicit Boolean Transformation):**
  Thay thế `@Type(() => Boolean)` bằng bộ chuyển đổi tường minh `@Transform`:
  ```typescript
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === "") return undefined;
    if (value === true || value === "true" || value === 1 || value === "1") return true;
    if (value === false || value === "false" || value === 0 || value === "0") return false;
    return value; // Giữ nguyên chuỗi không hợp lệ để @IsBoolean() phát hiện và từ chối
  })
  @IsBoolean()
  @IsOptional()
  passed?: boolean;
  ```
- **Bằng chứng PostgreSQL Integration Test (Test 5 & Test 14):**
  - **Phía Sinh viên (Test 5):**
    - `GET /api/v1/portal/quiz/history?passed=true`: Trả về chính xác 2 attempt đạt (100% và 50% PASS của Sinh viên 1).
    - `GET /api/v1/portal/quiz/history?passed=false`:
      - Với Sinh viên 1: Trả về `total: 0` (không có bài thi trượt).
      - Với Sinh viên 2: Trả về `total: 1` (đúng bài thi trượt `scorePercent: 0, passed: false`).
    - `GET /api/v1/portal/quiz/history?passed=invalid_boolean`: Bị class-validator từ chối ngay lập tức với `400 Bad Request`.
  - **Phía Quản trị viên (Test 14):**
    - `GET /api/v1/admin/quiz-configs/results?passed=true`: Trả về chính xác 2 attempt đỗ toàn trường.
    - `GET /api/v1/admin/quiz-configs/results?passed=false`: Trả về chính xác 1 attempt trượt toàn trường của Sinh viên 2.
    - `GET /api/v1/admin/quiz-configs/results?passed=not_a_bool`: Bị class-validator từ chối ngay lập tức với `400 Bad Request`.

---

## 3. DANH SÁCH FILE SỬA ĐỔI TRONG ĐỢT REMEDIATION

1. `apps/api/src/modules/portal/dto/portal.dto.ts` — Chuyển sang `@Transform` tường minh cho `passed`.
2. `apps/api/src/modules/quiz-config/dto/quiz-config.dto.ts` — Chuyển sang `@Transform` tường minh cho `passed`.
3. `apps/api/src/modules/portal/portal-quiz.service.ts` — Loại bỏ `updateMany`, chuyển sang pure read-only semantics.
4. `apps/api/src/modules/quiz-config/quiz-config.service.ts` — Loại bỏ `updateMany`, chuyển sang pure read-only semantics.
5. `apps/api/test/integration/quiz-results.integration.spec.ts` — Bổ sung test case kiểm chứng triệt để B01 (Zero DB mutation) và B02 (passed=false, passed=true, invalid boolean rejection).
6. `docs/HANDOFF_TO_GPT.md` — Tài liệu nghiệm thu remediation chính thức.

---

## 4. KẾT QUẢ KIỂM THỬ POSTGRESQL & BỘ TEST HỒI QUY TOÀN DỰ ÁN

Toàn bộ test suite được thực thi trực tiếp trên cơ sở dữ liệu PostgreSQL thực tế (`provisionScratchDatabase`):

### 4.1. Bộ test tích hợp M7.5 (`quiz-results.integration.spec.ts`) — 20/20 PASS
```
PASS test/integration/quiz-results.integration.spec.ts (40.17 s)
  Quiz Results & History Review Dashboard Integration Suite (M7.5)
    √ Test 1: Student 1 queries quiz history list returns paginated attempts ordered by startedAt desc (30 ms)
    √ Test 2: Student history distinguishes first attempt (isRetake: false) from retakes (isRetake: true) (13 ms)
    √ Test 3: Student history reflects awarded XP and reason (first submit vs retake 0 XP) (9 ms)
    √ Test 4: Student history filter by status=SUBMITTED returns only submitted attempts (9 ms)
    √ Test 5: Student history filter by passed=true and passed=false strictly distinguishes PASS/FAIL (38 ms)
    √ Test 6: Student history filter by quizConfigId isolates attempts for that quiz (19 ms)
    √ Test 7: Student views SUBMITTED attempt detail returns full questions review with options, student selection, correct answer and explanation (12 ms)
    √ Test 8: Zero-Leak Invariant: Student viewing EXPIRED attempt detail returns results: [] and NEVER leaks correct answers or explanations (11 ms)
    √ Test 9: Zero-Leak Invariant: Student viewing IN_PROGRESS attempt detail returns results: [] and NEVER leaks correct answers (9 ms)
    √ Test 10: IDOR Protection: Student 2 attempting to view Student 1 attempt detail is rejected with 403 Forbidden (22 ms)
    √ Test 11: Strict Read-Only Semantics: Viewing history or results NEVER mutates PostgreSQL attempt records or XP claims (265 ms)
    √ Test 12: Admin queries quiz results with pagination returns all campus attempts with student profiles (11 ms)
    √ Test 13: Admin search by student (studentCode PS67890) returns only Student 2 attempts (13 ms)
    √ Test 14: Admin filter by passed=true and passed=false distinguishes PASS and FAIL attempts campus-wide (27 ms)
    √ Test 15: Admin sorting by scorePercent desc orders highest score first (11 ms)
    √ Test 16: Admin summary KPI metrics computes accurate aggregate counts and pass rate (23 ms)
    √ Test 17: Admin view attempt detail returns complete question answers and explanation for admin review (21 ms)
    √ Test 18: Admin student retake history endpoint returns all attempts for user and quiz in ascending order (17 ms)
    √ Test 19: RBAC: Student calling admin results endpoints is rejected with 403 Forbidden (21 ms)
    √ Test 20: RBAC: Parent calling portal quiz history is rejected with 403 Forbidden (FORBIDDEN_STUDENT_ONLY) (13 ms)

Test Suites: 1 passed, 1 total
Tests:       20 passed, 20 total
Time:        40.387 s
```

### 4.2. Toàn bộ chuỗi kiểm thử hồi quy (Full Regression Suites) — 91/91 PASS
- **M7.5 — Quiz Results & History Review:** 20/20 PASSED
- **M7.4 — Quiz Submission & Scoring:** 16/16 PASSED
- **M7.3 — Quiz Attempt Engine & Live Timer:** 20/20 PASSED
- **M7.2 — Quiz Delivery & Shuffle Logic:** 10/10 PASSED
- **M7.1 — Quiz Configuration & Snapshot:** 13/13 PASSED
- **M6 — Question Bank Management:** 12/12 PASSED
- **TỔNG CỘNG:** **91/91 PostgreSQL Integration Tests Passed (0 Failure, 0 Regression)**.

---

## 5. BÁO CÁO CỔNG CHẤT LƯỢNG (QUALITY GATES)

| Lệnh kiểm tra | Kết quả | Ghi chú |
| :--- | :---: | :--- |
| `pnpm --filter shared build` | **PASS (Exit 0)** | Shared DTOs biên dịch sạch sẽ |
| `pnpm --filter api typecheck` | **PASS (Exit 0)** | 0 lỗi TypeScript NestJS API |
| `pnpm --filter web typecheck` | **PASS (Exit 0)** | 0 lỗi TypeScript Next.js Web |
| `pnpm --filter api lint` | **PASS (Exit 0)** | 0 warnings, 0 errors |
| `pnpm --filter web lint` | **PASS (Exit 0)** | 0 warnings, 0 errors |
| `pnpm --filter web test:unit` | **PASS (Exit 0)** | 14/14 tests pass |
| `pnpm --filter web build` | **PASS (Exit 0)** | Next.js 16.4.6 build thành công toàn bộ 28 routes |

---

## 6. MA TRẬN NGHIỆM THU REMEDIATION (ACCEPTANCE MATRIX)

| Mã Blocker | Yêu cầu kỹ thuật | Trạng thái | Bằng chứng kiểm chứng |
| :---: | :--- | :---: | :--- |
| **B01** | Restore Read-Only Semantics (Không INSERT/UPDATE/DELETE trong API GET) | **PASS** | Loại bỏ hoàn toàn `updateMany` trong `portal-quiz.service.ts` và `quiz-config.service.ts`. Test 11 chứng minh attempt `IN_PROGRESS` quá hạn gọi GET 3 lần qua Student và 3 lần qua Admin nhưng row trong PostgreSQL hoàn toàn bất biến (`updatedAt` không đổi, status DB giữ nguyên, 0 XP claim phát sinh). |
| **B02** | Sửa lỗi Boolean Query Transformation (`passed=false`) | **PASS** | Sử dụng `@Transform` tường minh trong cả `portal.dto.ts` và `quiz-config.dto.ts`. Test 5 & Test 14 chứng minh `passed=true` chỉ trả về attempt PASS, `passed=false` chỉ trả về attempt FAIL, và giá trị không hợp lệ bị từ chối với `400 Bad Request`. |

---

## 7. ĐỀ XUẤT NGHIỆM THU CHO TECH LEAD (MENTOR GPT)

Cả hai blocker **B01** và **B02** đã được giải quyết triệt để trên mã nguồn thực tế và kiểm chứng bằng các test case PostgreSQL mới:
- API GET bảo toàn tính chất Read-Only 100%.
- Tham số truy vấn `passed=false` hoạt động chuẩn xác và an toàn.
- Toàn bộ 91 integration tests và 14 unit tests đều đạt FULL PASS, không có bất kỳ regression nào.

Kính đề nghị Tech Lead (Mentor GPT) xem xét và cấp quyết định **FULL PASS** chính thức cho **Milestone M7.5**!
