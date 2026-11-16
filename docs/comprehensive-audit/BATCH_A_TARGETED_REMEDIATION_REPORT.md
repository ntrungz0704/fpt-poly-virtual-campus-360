# Batch A Targeted Remediation Report — B-A1, B-A2 & B-A3 Analysis

**Repository:** `ntrungz0704/fpt-poly-virtual-campus-360`  
**Branch:** `audit/comprehensive-quality-remediation`  
**Base (`main`):** `ef03ce95f5ad7a746fb355eb0999aa94bfc1c2b2` *(bảo toàn nguyên vẹn)*  
**M8 Branch (untouched):** `feat/m8-open-day-checkin` (`a8b3833c9c134939b6f6ea97973728041d1b0b70`, PR [#2](https://github.com/ntrungz0704/fpt-poly-virtual-campus-360/pull/2) `OPEN`)  
**Code & Test Remediation Commit SHA:** `09d0bccb43768d14ddf36d502a5dbfaefa255dd3` *(bảo toàn nguyên vẹn `3cc520253a3828f2343af7c1586e41cf5e494897`, `6f04c39a872de8bef5180e220257d53a71ae2525`, `08f0c79741f02b77d7d1af0752afb921c5470b74`)*

---

## 1. Root Cause Analysis

### B-A1 — Anonymous Guest Identity Collision (`P0` Blocker)
- **Vị trí lỗi:** `apps/api/src/modules/gamification/gamification.service.ts` (`resolveParticipantScope()`, `getLeaderboard()`), thiếu định danh phiên ẩn danh trên `quiz_attempts`, `xp_ledgers`, `user_spin_histories`.
- **Nguyên nhân gốc rễ:**
  1. Ở nhánh Priority 3 (walk-in guest không có `userId` và không có `ticketCode`), `resolveParticipantScope()` lấy `rawName.toLowerCase()` làm `idempotencyIdentity` (`guest_${guestNameKey}`), `lockKey` (`gamification:guest:${guestNameKey}`), và bộ lọc `attendeeName: { equals: rawName, mode: "insensitive" }` cho `xpLedger`, `userSpinHistory`, `quizAttempt`.
  2. Mọi người dùng ẩn danh nhập hoặc để mặc định cùng tên (ví dụ `"Khách tham quan"` hoặc `"Trần Thị Trùng Tên"`) tự động dùng chung dữ liệu XP, lịch sử quiz, lượt quay và bị gộp vào cùng bucket `g:${name}` trên leaderboard. Kẻ tấn công chỉ cần gửi `attendeeName` trùng tên người khác để xem và tiêu lượt quay của nạn nhân.
  3. Trên schema gốc (`prisma/schema.prisma`), `UserSpinHistory` chỉ có `userId` (FK tới `users.id`), `ticketCode` và `attendeeName` — không có trường riêng để phân tách phiên khách ẩn danh mà không làm lẫn với mã vé `EventParticipation`.

### B-A2 — Unverified / Non-Existent Ticket Code Accepted as Identity (`P1` Blocker)
- **Vị trí lỗi:** `apps/api/src/modules/gamification/gamification.service.ts` (`resolveParticipantScope()`, `submitQuiz()`, `spinWheel()`, `getProfile()`, `getLeaderboard()`).
- **Nguyên nhân gốc rễ:**
  1. Khi request gửi `ticketCode`, `resolveParticipantScope()` truy vấn `eventParticipation.findUnique({ where: { ticketCode: rawTicket } })`, nhưng nếu `!ticketRow` (mã vé không tồn tại trong DB), hàm không throw lỗi mà âm thầm đi tiếp xuống Priority 1 (`safeStoredTicket`) hoặc Priority 2 (`ticketCode: rawTicket`, `idempotencyIdentity: "ticket_" + rawTicket`, `hasValidTicket: false`).
  2. `submitQuiz()` sau đó vẫn ghi `XpLedger` và `QuizAttempt` dưới `ticketCode` giả chưa từng tồn tại.
  3. Ngoài ra, `getProfile()` truyền `enforceTicketOwnership: false` nên vẫn trả profile cho vé đã `CANCELLED` hoặc thuộc sự kiện đã bị xóa mềm, còn `getLeaderboard()` dùng thẳng `rawTicket` query param để gắn `isCurrentAttendee` mà không kiểm tra vé tồn tại hay quyền sở hữu.

---

## 2. Thiết kế Identity được chọn cho B-A1 & Kiểm soát B-A2

### Thiết kế Anonymous Guest Session (B-A1)
1. **Additive Schema Column + Index (`guest_session_id VARCHAR(64)`):**
   - Thêm cột nullable `guestSessionId` (`guest_session_id`) + index tương ứng vào 3 model `QuizAttempt`, `XpLedger`, `UserSpinHistory` thông qua migration mới không đụng chạm migration cũ (`prisma/migrations/20261117000001_gamification_guest_session_id/migration.sql`).
   - *Lý do:* Tách bạch 3 trục danh tính ở tầng PostgreSQL (`userId` = thành viên đăng nhập, `ticketCode` = vé Open Day đã xác minh, `guestSessionId` = khách vãng lai ẩn danh); tránh nhét guest ID vào `ticketCode` (gây ô nhiễm dữ liệu `listQuizResults` và mâu thuẫn nguyên tắc B-A2) và tránh nhét vào `attendeeName` (làm hỏng tên hiển thị).
2. **Server-Issued, Cryptographically Signed `HttpOnly` Cookie (`gamification_guest`):**
   - Bổ sung endpoint `POST /api/v1/public/gamification/guest-session` (`@Throttle({ default: { limit: 30, ttl: 60_000 } })`).
   - Server sinh `guestId = crypto.randomUUID()` (128-bit CSPRNG UUID v4), ký HMAC-SHA256 với key dẫn xuất domain-separated từ `JWT_SECRET` (`"fpt-poly:gamification-guest-v1:" + jwtSecret`) qua format `v1.<uuidv4>.<expSec>.<hmacBase64Url>`.
   - Token chỉ được gửi qua **`HttpOnly; SameSite=Lax; Path=/api/v1/public/gamification`** cookie (`MaxAge = 7 ngày`, `Secure` theo `config.cookieSecure`). Response body chỉ trả `{ sessionActive: true, expiresAt }`, **không** để lộ `guestId` thô hoặc token ra JavaScript (chống XSS & payload spoofing).
   - Nếu client đã có cookie `gamification_guest` **còn hạn và đúng chữ ký**, gọi lại `POST /guest-session` tái sử dụng đúng `guestId` đã xác thực để ổn định phiên qua reload/tab. Mọi cookie giả mạo/sai định dạng/hết hạn đều bị `verifyGamificationGuestToken()` (dùng `crypto.timingSafeEqual`) loại bỏ và không bao giờ tái sử dụng `guestId` từ token lỗi.
3. **Fail-Closed Verification & Đồng bộ Xuyên Suốt:**
   - **Thao tác cá nhân (`GET /profile`, `POST /quiz/submit`, `POST /spin`):**
     - Mọi thao tác đều chạy trong `resolveParticipantScope(..., { requireAuthenticatedParticipant: true })`.
     - Nếu không có `userId` (Bearer JWT hợp lệ) và không có `ticketCode`:
       - Cookie `gamification_guest` sai chữ ký / hết hạn / malformed → **`401 UnauthorizedException` (`INVALID_GUEST_SESSION`)**.
       - Thiếu cookie `gamification_guest` (kể cả khi client truyền `attendeeName`) → **`401 UnauthorizedException` (`GUEST_SESSION_REQUIRED`)** — tuyệt đối fail-closed, **không** quay về name-only identity.
       - Cookie hợp lệ → cô lập hoàn toàn theo `{ userId: null, ticketCode: null, guestSessionId: verifiedGuestId }` cho `xpFilter`, `spinFilter`, `quizFilter`, `lockKey` (`gamification:guest:${guestId}`), `idempotencyIdentity` (`guest_${guestId}`) và lưu `guestSessionId` xuống DB. `attendeeName` chỉ còn vai trò nhãn hiển thị.
   - **Leaderboard (`GET /leaderboard`):**
     - Nếu cookie `gamification_guest` bị tamper/invalid → fail-closed **`401 INVALID_GUEST_SESSION`**.
     - Nếu không có danh tính (ẩn danh đọc bảng xếp hạng công khai) → trả top ranking công khai nhưng `leaderboardIdentityKey = null` (`isCurrentAttendee: false`, `currentEntry: null`), không match theo `attendeeName`.
     - Bucket key cho guest dùng `gs:${guestSessionId}` (legacy null rows tách riêng `legacy_g:...`), và đồng bộ `computeRealParticipantRank` trong `PortalService` để 2 guest cùng tên không bị cộng gộp XP vượt rank sinh viên thật.
   - **Payload Spoofing:** Global `ValidationPipe` (`whitelist: true, forbidNonWhitelisted: true`) chặn trường lạ (`guestSessionId`, `userId`, ...) ngay ở DTO (`400 Bad Request`).
   - **Frontend Browser Sync (`gamification-api.ts`):** Bổ sung `ensureGamificationGuestSession()` (single-flight) tự khởi tạo/gia hạn `HttpOnly` cookie cho khách walk-in trên `/games` mà không làm ảnh hưởng người dùng đã đăng nhập (`Bearer JWT`) hay người mang `ticketCode`.

### Kiểm soát B-A2 (Strict Ticket Verification)
- Bất kỳ request nào kèm `ticketCode` (`GET /profile`, `GET /leaderboard`, `POST /quiz/submit`, `POST /spin`) đều bắt buộc qua xác minh trên `event_participations`:
  1. Không tìm thấy bản ghi → **`404 NotFoundException` (`TICKET_NOT_FOUND`)**, **0** bản ghi `XpLedger`/`QuizAttempt`/`UserSpinHistory` được tạo.
  2. `ticketRow.userId !== null && ticketRow.userId !== params.userId` → **`403 ForbiddenException` (`TICKET_BELONGS_TO_ACCOUNT`)**.
  3. User đã đăng nhập gửi `ticketCode` có `userId === null` nhưng `attendeeEmail` không khớp email tài khoản → **`403 ForbiddenException` (`TICKET_OWNERSHIP_MISMATCH`)**.
  4. `ticketRow.participationStatus === "CANCELLED"` hoặc `ticketRow.event.deletedAt !== null` hoặc `ticketRow.event.status !== PublishStatus.PUBLISHED` → **`400 BadRequestException` (`TICKET_CANCELLED`)**.
- Trong `submitQuiz()`, `resolveParticipantScope()` được gọi **trước** khi chấm/ghi DB để chặn sớm mọi request unauthorized hoặc vé không hợp lệ.

---

## 3. Danh sách File sửa / tạo mới trong Đợt xử lý B-A1 & B-A2 (`09d0bcc`)

| # | Trạng thái | Đường dẫn file | Mô tả thay đổi |
|---|---|---|---|
| 1 | `M` | `prisma/schema.prisma` | Thêm `guestSessionId` (`guest_session_id`) + index cho `QuizAttempt`, `XpLedger`, `UserSpinHistory` |
| 2 | `A` | `prisma/migrations/20261117000001_gamification_guest_session_id/migration.sql` | Migration additive an toàn thêm `guest_session_id` + 3 index |
| 3 | `M` | `packages/shared/src/gamification.ts` | Thêm `GamificationGuestSessionDto` |
| 4 | `A` | `apps/api/src/modules/gamification/gamification-guest-token.ts` | Helper phát hành & kiểm chứng `v1` HMAC-SHA256 guest cookie token (`timingSafeEqual`) |
| 5 | `M` | `apps/api/src/modules/gamification/gamification.controller.ts` | Thêm `POST /public/gamification/guest-session`; verify cookie trên `profile`, `leaderboard`, `quiz/submit`, `spin` |
| 6 | `M` | `apps/api/src/modules/gamification/gamification.service.ts` | Triển khai B-A1 (verified guest session fail-closed, `guestSessionId` DB isolation & leaderboard bucket) và B-A2 (`404`/`400`/`403` strict ticket guard) |
| 7 | `M` | `apps/api/src/modules/portal/portal.service.ts` | Đồng bộ `guestSessionId` trong `computeRealParticipantRank` |
| 8 | `M` | `apps/web/src/lib/public/gamification-api.ts` | Single-flight `ensureGamificationGuestSession()` + `401` retry cho browser walk-in trên `/games` |
| 9 | `M` | `apps/api/test/unit/gamification.spec.ts` | Thêm 2 unit test xác minh phát hành/tamper/hết hạn HMAC token (`B-A1`) |
| 10 | `M` | `apps/api/test/integration/audit-batch-a.integration.spec.ts` | Cập nhật fail-closed check + thêm 3 integration test B-A1 & B-A2 trên PostgreSQL 16 |
| 11 | `A` | `docs/comprehensive-audit/BATCH_A_TARGETED_REMEDIATION_REPORT.md` | Báo cáo nghiệm thu đợt xử lý B-A1 / B-A2 / B-A3 *(commit tài liệu ngay sau `09d0bcc`)* |

---

## 4. Test Cases mới & Kết quả thực tế

### Unit Tests mới (`apps/api/test/unit/gamification.spec.ts` — 2 tests mới, PASS)
- `issues verifiable UUIDv4 HMAC-signed tokens and preserves valid existing guestId` — xác minh chữ ký, tái sử dụng `guestId` đã verified, và từ chối tự chọn `guestId` tùy ý (`"attacker-chosen-id"`).
- `fails closed on missing, malformed, tampered, wrong-secret, or expired tokens` — xác minh missing, kiểu sai, UUID sai, sửa `guestId` giữ nguyên độ dài chữ ký, sai secret và hết hạn `> 7 ngày` đều fail-closed.

### Integration Tests trên PostgreSQL 16 (`apps/api/test/integration/audit-batch-a.integration.spec.ts` — 9/9 PASS)
1. **Cập nhật case cũ (`blocks attendeeName cross-user spin/XP leakage...`):** Xác nhận anonymous không có guest cookie gửi `attendeeName` của sinh viên nhận `401 GUEST_SESSION_REQUIRED`; ngay cả khi có guest cookie hợp lệ vẫn thấy `0 XP` / `0 spins` và `400 NO_SPINS_REMAINING`.
2. **`B-A1: isolates two anonymous walk-in guests with identical attendeeName via server-signed guest sessions`:**
   - Hai `request.agent` độc lập nhận `gamification_guest` cookie (`HttpOnly`, `SameSite=Lax`, `Path=/api/v1/public/gamification`), không lộ `guestId`/`token` trong JSON body, giữ nguyên `guestId` khi gọi lại `guest-session`.
   - Guest A chơi quiz + quay thưởng dưới tên `"Trần Khách Trùng Tên"`; Guest B dùng đúng tên `"Trần Khách Trùng Tên"` vẫn có `0 XP`, `0 quizAttemptsCount`, `0 spinsAvailable`, `0 recentRewards`, không quay ké được lượt của A (`400 NO_SPINS_REMAINING`), và chơi quiz riêng để nhận 60 XP độc lập.
   - Leaderboard hiển thị 2 entry riêng biệt cho `"Trần Khách Trùng Tên"`, chỉ highlight đúng entry của người gọi có cookie; caller ẩn danh không có cookie gửi `?attendeeName=` nhận `isCurrentAttendee: false` và `currentEntry: null`.
3. **`B-A1: fails closed on missing, tampered, or payload-spoofed guest identity and handles concurrency atomically`:**
   - Thiếu cookie trên `POST /quiz/submit` → `401 GUEST_SESSION_REQUIRED`.
   - Tamper cookie (đổi 1 UUID giữ nguyên độ dài chữ ký) trên `GET /profile`, `GET /leaderboard`, `POST /spin` → `401 INVALID_GUEST_SESSION`.
   - Payload spoofing `{ guestSessionId: ... }` → `400` (`forbidNonWhitelisted`).
   - 5 concurrent `POST /quiz/submit` cùng verified guest cookie → đúng 1 lần cộng XP (`xp_ledgers` count = 1); 5 concurrent `POST /spin` tiếp theo → đúng 2 lượt thành công, 3 lần bị từ chối `400`, `user_spin_histories` count = 2.
   - Sinh viên B đã đăng nhập cố dùng vé guest `userId: null` khác email (`guestTicketCode`) → `403`.
4. **`B-A2: rejects unknown, cancelled, and deleted-event tickets with zero DB writes`:**
   - Vé không tồn tại (`OD26-FAKE-9999`) bị từ chối `404 TICKET_NOT_FOUND` trên `quiz/submit` (cả anonymous lẫn logged-in student), `spin`, `profile`, `leaderboard`.
   - Vé `CANCELLED` và vé thuộc event có `deletedAt !== null` bị từ chối `400 TICKET_CANCELLED` trên `quiz/submit`, `spin`, `profile`.
   - Xác minh trực tiếp PostgreSQL: `0` bản ghi `xp_ledgers`, `0` bản ghi `quiz_attempts`, `0` bản ghi `user_spin_histories` được ghi cho 3 loại vé trên.
   - Vé hợp lệ (`OD26-G999-9999`) vẫn nộp quiz nhận XP bình thường.

---

## 5. Exact Verification Commands, Exit Codes & Test Counts (Post-Final Edit)

*(Lưu ý minh bạch về chạy lần đầu `audit-batch-a`: lần chạy đơn đầu tiên `task-1469` gặp exit `1` tại `provisionScratchDatabase -> execFileSync("pnpm.cmd", ["exec", "tsx", "prisma/seed.ts"])` sau khi vừa `prisma generate`; kiểm tra chẩn đoán `task-1487` trả `PROVISIONED OK`, và ngay sau đó cả 2 lần chạy sạch trên PostgreSQL 16 (`task-1491` và `task-1499`) đều exit `0`.)*

| Hạng mục | Lệnh chạy thực tế sau chỉnh sửa cuối (`09d0bcc`) | Exit Code | Test Counts / Kết quả |
|---|---|---|---|
| Prisma Client | `pnpm exec prisma generate` | `0` | Generated Prisma Client `v6.19.3` |
| Shared Build | `pnpm --filter @fpt-campus/shared build` | `0` | `tsc` compiled cleanly |
| Workspace Typecheck | `pnpm typecheck` (`@fpt-campus/shared` + `web`) | `0` | `0` TS errors |
| Web Lint + Typecheck + Unit | `pnpm --filter web lint; pnpm --filter web typecheck; pnpm --filter web test:unit` (`task-1449`) | `0` | ESLint `0` lỗi; `tsc --noEmit` `0` lỗi; **16 passed, 0 failed, 0 skipped** |
| Web Build | `pnpm --filter web build` (`task-1495`) | `0` | `next build` thành công (**28/28 routes**) |
| API Lint + Typecheck + Build + Unit | `pnpm --filter api lint; pnpm --filter api typecheck; pnpm --filter api build; pnpm --filter api test:unit` (`task-1461`) | `0` | ESLint `0` lỗi; `tsc --noEmit` `0` lỗi; `nest build` thành công; **8/8 suites, 33/33 unit tests passed** |
| Batch A Integration Only | `pnpm --filter api exec jest --runInBand --forceExit test/integration/audit-batch-a.integration.spec.ts` (`task-1491`) | `0` | **1/1 suite passed, 9/9 tests passed** (PostgreSQL 16) |
| Batch A + Regression Integration (8 suites) | `pnpm --filter api exec jest --runInBand --forceExit test/integration/audit-batch-a.integration.spec.ts test/integration/m1-migration-schema.integration.spec.ts test/integration/csrf-cors.integration.spec.ts test/integration/public-isolation.integration.spec.ts test/integration/open-day-tickets-checkin.integration.spec.ts test/integration/open-day-rbac-crud.integration.spec.ts test/integration/quiz-submit.integration.spec.ts test/integration/quiz-results.integration.spec.ts` (`task-1499`) | `0` | **8/8 suites passed, 70/70 tests passed** (PostgreSQL 16) |

---

## 6. Các Test chưa chạy lại sau `09d0bcc` & Lý do

1. **`auth-session.integration.spec.ts` (Pre-existing baseline failure — `2 failed` trên `main @ ef03ce9`):**
   - Không chạy lại trong phạm vi nhiệm vụ này vì nguyên nhân đã xác định từ commit `d03b55a` (`prisma/seed.ts:1311` đặt `mustChangePassword: false` trái với assertion `true` ở `auth-session.integration.spec.ts:45`), ngoài phạm vi B-A1/B-A2 và Tech Lead đã chốt giữ `mustChangePassword = true` để xử lý đồng bộ ở Batch B.
2. **9 Integration suites còn lại trên `apps/api/test/integration/`:**
   - `health.integration.spec.ts`, `location-gis-crud.integration.spec.ts`, `media-library-advanced.integration.spec.ts`, `news-cms.integration.spec.ts`, `question-bank.integration.spec.ts`, `quiz-attempt.integration.spec.ts`, `quiz-config.integration.spec.ts`, `quiz-delivery.integration.spec.ts`, `rbac-provisioning-activation.integration.spec.ts`.
   - *Lý do:* Nằm ngoài phạm vi module gamification/guest migration B-A1/B-A2 *(lưu ý `location-gis-crud` và `media-library-advanced` đã pass trước đó sau `6f04c39`, chưa chạy lại lần hai sau `09d0bcc`)*.
3. **Playwright E2E (`4/4` specs: `auth-integration.spec.ts`, `gamification-flow.spec.ts`, `open-day-flow.spec.ts`, `portal-flow.spec.ts`):**
   - *Lý do:* Theo chỉ thị Tech Lead không yêu cầu chạy Playwright E2E hay thiết lập CI trong đợt targeted fix này (thuộc kế hoạch regression Batch E). Lưu ý kỹ thuật cho Batch E: `gamification-flow.spec.ts` dòng 23 & 54–63 hiện đang tiêm chuỗi vé giả `OD26-E2E-...` trực tiếp vào `localStorage` mà chưa đăng ký DB — với rule B-A2 chặt chẽ hơn, E2E spec này cần đăng ký vé Open Day thật hoặc kiểm tra luồng walk-in guest khi đến Batch E.
4. **GitHub CI Workflows:** Repository chưa có `.github/workflows` (`0` workflow runs).

---

## 7. B-A3 — Phân tích & Đề xuất cho Leaderboard Spin-Only (Không tự sửa Business Rule)

### Câu trả lời kiểm tra từ source code hiện tại
- **Kết luận:** Theo business rule gốc trên `main @ ef03ce9` và thiết kế hiện tại của hệ thống, người chỉ có `UserSpinHistory` nhưng **không có `XpLedger` (`totalXp === 0`) KHÔNG được tính là participant đã xếp hạng trên Bảng Xếp Hạng XP**.
- **Bằng chứng đối chiếu trong source code:**
  1. `main @ ef03ce9` (`apps/api/src/modules/gamification/gamification.service.ts` `getLeaderboard()`): nguồn dữ liệu chính luôn group từ `xpLedger.groupBy(...)`, còn `userSpinHistory.groupBy(...)` chỉ làm bảng phụ đếm `totalSpins` gắn vào người đã có XP.
  2. `apps/api/src/modules/portal/portal.service.ts:392` & `416-447`: `rank` trong Portal tính qua `totalXp > 0 ? await this.computeRealParticipantRank(userId, totalXp) : null`, và `computeRealParticipantRank()` chỉ group trên `xpLedger` (`0 XP` → `rank: null`).
  3. UI [QuizLeaderboard.tsx](file:///e:/Virtual%20Campus%20FPT%20Poly/apps/web/src/components/quiz/QuizLeaderboard.tsx#L79) định nghĩa rõ đây là `"Bảng Xếp Hạng XP QTSC"`.
  4. Toàn bộ 8 phần thưởng seed trong `prisma/seed.ts:1836-1915` đều cộng XP (`10`–`200` XP), nên spin-only không có `XpLedger` chỉ xảy ra nếu admin cấu hình phần thưởng có `amountXp = 0` và người chơi quay trúng phần thưởng đó khi đang `0 XP`.
- **Nguyên nhân gây hiểu nhầm trong Batch A (`6f04c39`):** Dòng `.filter((entry) => entry.totalXp > 0 || entry.totalSpins > 0)` (nay ở dòng ~945 `gamification.service.ts`) có điều kiện `|| entry.totalSpins > 0` thừa dù `entriesMap` chỉ được nạp từ `ledgerBuckets`.

### Hai phương án đề xuất tối thiểu chờ Tech Lead chọn
- **Phương án 1 (Khuyến nghị — Giữ đúng business rule XP Leaderboard, đồng bộ với Portal `rank = totalXp > 0 ? ... : null`):**
  - Sửa đúng 1 dòng trong `gamification.service.ts` `getLeaderboard()`: đổi `.filter((entry) => entry.totalXp > 0 || entry.totalSpins > 0)` thành `.filter((entry) => entry.totalXp > 0)`.
- **Phương án 2 (Nếu Tech Lead muốn hiển thị cả participant có `totalSpins > 0` dù `totalXp === 0`):**
  - Trong `getLeaderboard()`: nạp thêm `userNamesById` cho `userId` từ `spinBuckets` và duyệt `for (const row of spinBuckets)` để khởi tạo `entriesMap` (`totalXp: 0, totalSpins`) cho key chưa tồn tại trong `ledgerBuckets`, giữ nguyên `.filter((entry) => entry.totalXp > 0 || entry.totalSpins > 0)`. *(Khi đó cũng nên cân nhắc đồng bộ `PortalService.getGamification` nếu muốn user 0 XP nhưng đã quay vẫn có `rank`.)*

---

## 8. Trạng thái Git & Xác nhận Ranh giới

- **Code & Test Remediation Commit SHA:** `09d0bccb43768d14ddf36d502a5dbfaefa255dd3` *(trên `audit/comprehensive-quality-remediation`, sau các commit `3cc5202`, `6f04c39`, `08f0c79`)*
- **Remote Branch URL:** https://github.com/ntrungz0704/fpt-poly-virtual-campus-360/tree/audit/comprehensive-quality-remediation
- **Xác nhận ranh giới:**
  - `main` giữ nguyên tại `ef03ce95f5ad7a746fb355eb0999aa94bfc1c2b2` (không sửa).
  - `feat/m8-open-day-checkin` giữ nguyên tại `a8b3833c9c134939b6f6ea97973728041d1b0b70` (không sửa); PR [#2](https://github.com/ntrungz0704/fpt-poly-virtual-campus-360/pull/2) giữ nguyên trạng thái `OPEN` (không merge/đóng).
  - Chính sách `mustChangePassword = true` giữ nguyên; không nới lỏng bất kỳ assertion nào.
  - Không thực hiện Batch B, C, D, E hoặc F.

**Dừng tại đây chờ Tech Lead review B-A1, B-A2 và phản hồi quyết định B-A3.**
