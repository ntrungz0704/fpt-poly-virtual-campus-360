# 01 — Executive Audit Summary

## Scope & Methodology

This comprehensive audit evaluates `FPT Polytechnic Virtual Campus 360°` at `main @ ef03ce9` across business logic, UI/UX, frontend–API contracts, backend/PostgreSQL data integrity, security/RBAC, performance/concurrency, dead code/cleanup, SEO/routing/content, and Section 19 Real Data Authenticity. Every finding below was directly verified by inspecting source files, database schema, migrations, seed scripts, and running tests.

---

## Executive Severity Breakdown

### P0 — Critical Blockers (Fix Immediately in Batch A)

1. **`GAMIFICATION-P0-AUTH-IDENTITY-AND-RACE` (`apps/api/src/modules/gamification/`)**
   - `GamificationController` uses class-level `@Public()`, causing `JwtAuthGuard` to skip Bearer token parsing entirely -> `@CurrentUser() user` is always `undefined`.
   - `calculateParticipantSpins` merges records with `OR` across `{ ticketCode }`, `{ userId }`, and `{ attendeeName: { equals, mode: "insensitive" } }` -> any unauthenticated visitor supplying `?attendeeName=<student or ticket holder name>` reads and spends another user's earned spins.
   - `spinWheel` validates `spinsAvailable` outside `$transaction` without locking -> concurrent requests double-spend spins and decrement `SpinRewardConfig.remainingQuantity` without a conditional `remainingQuantity > 0` guard (negative inventory risk).
   - `submitQuiz` checks `XpLedger` outside `$transaction` and omits `idempotencyKey` -> concurrent quiz submissions duplicate `QUIZ_COMPLETION` XP.
2. **`GAMIFICATION-P0-FAKE-LEADERBOARD` (`apps/api/src/modules/gamification/gamification.service.ts:515-533`)**
   - `getLeaderboard` injects 5 fabricated students (`baselineAmbassadors`: `"Đặng Quốc Hưng (K19 CNTT)"` 480 XP, etc.) into the live leaderboard response, overwrites distinct attendees sharing the same name via `entriesMap.set(name.toLowerCase(), ...)`, and matches `isCurrentAttendee` via `attendeeName.includes(rawTicket.slice(-4))`.
3. **`PUBLIC-API-P0-SILENT-FAKE-MUTATIONS` (`apps/web/src/lib/public/public-api.ts`)**
   - `registerPublicOpenDay` catches all backend errors (`400`, `409` duplicate email, `500`) and fabricates a fake client-only ticket (`OD26-${Math.random()...}`, invalid `FPT-OPENDAY-2026:` QR payload) that does not exist in PostgreSQL, silencing conflict errors in `TicketRegistrationModal`.
   - `fetchPublicTicketByCode` catches `404`/errors and returns a fabricated `"Khách tham quan FPT Poly"` (`visitor@fpt.edu.vn`, `0900000000`) ticket.
   - `verifyPublicQuiz` catches errors and marks every submitted answer `isCorrect: true`.
   - `fetchPublicBuilding` & `fetchPublicLocationBySlug` catch `404` and return `CAMPUS_BUILDINGS[0]` / `CAMPUS_LOCATIONS[0]`, breaking `NotFoundState` on unknown `/locations/[slug]`.
4. **`QR-CORRUPTION-P0` (`apps/web/src/components/ui/QRCodeSVG.tsx`)**
   - On `main`, `generateQRMatrix` writes format-information coordinates AFTER data bit placement, overwriting payload/EC modules and corrupting generated QR codes on `/events` and `/portal/tickets`; quiet-zone margin is `2` instead of ISO-18004 `4`.

### P1 — High Severity Integrity & Security Defects (Fix in Batch A)

5. **`TOUR-PUBLISH-P1-BYPASS` (`apps/api/src/modules/tour/tour-admin.service.ts` & `media.service.ts`)**
   - `publishTour` bulk-publishes `TourNode` rows without invoking `evaluateAiPlaceholderGoLiveStatus` (`packages/shared/src/tour.ts:302`), bypassing the D-02 `AI_PLACEHOLDER_BLOCKED` (`422`) Go-Live safety block, without requiring `panoramaAsset.isPreviewApproved === true`, `processingStatus === "READY"`, and active parent `Location`/`Building`.
   - `MediaService.mapToAdminDto` hardcodes `isAiPlaceholder: false` instead of computing `isAiPlaceholderCameraMetadata(metadata)`.
   - `saveHotspot` updates `where: { id: dto.id }` without checking `nodeId` ownership (allowing cross-node hotspot mutation).
   - `createNode` does not validate that `panoramaAssetId` / `locationId` exist and are active (`deletedAt: null`), nor wrap node creation + `AuditLog` atomically.
6. **`PORTAL-P1-DATA-AND-XSS` (`apps/api/src/modules/portal/portal.service.ts` & `dto/portal.dto.ts`)**
   - `UpdateProfileDto.avatarUrl` accepts arbitrary string schemes (`javascript:...`, `data:...`), which render directly into `<img src={profile.avatarUrl} />` in `portal/profile/page.tsx`.
   - `getSchedule` omits `status: PublishStatus.PUBLISHED` and `event: { deletedAt: null, status: PublishStatus.PUBLISHED }` (leaking DRAFT/archived sessions to students).
   - `getTickets` omits `event: { deletedAt: null }` and triggers an N+1 query loop per ticket.
   - `getGamification` hardcodes `rank: 1` instead of computing actual leaderboard rank (`rank: number | null`).
   - `getLinkedStudents` runs an N+1 query loop per approved student link.

### P2–P3 Backlog Highlights (Scheduled for Batches B–F)

- **UI/Fake Content (Batch B/C):**
  - `AdminDashboardMetrics.tsx`: hardcoded `"128,450"`, `"3,820"`, `"95.5%"`, `"99.98% SLA"`, `"8K"`.
  - `AdminRecentActivityLog.tsx`: hardcoded 4 fake entries instead of `GET /api/v1/admin/audit-logs`.
  - `EventsView.tsx`: hardcoded static `12 : 08 : 45 : 30` countdown instead of live computation from `event.eventDate` / honest date state.
  - `(public)/locations/[slug]/page.tsx`: hardcoded `"60 Sinh viên"` and `"GPU RTX 4080"` displayed for every facility.
  - `(public)/contact/page.tsx`: prefilled fake PII (`"Nguyễn Văn An"`, `"0987 654 321"`, `"an.nguyen@gmail.com"`) and simulated form submission claiming staff will contact within 24h with zero backend API call.
  - `(portal)/portal/schedule/page.tsx`: `NOON` rendered as `"Chiều"` and missing `NOON` filter tab.
  - `(portal)/portal/profile/page.tsx` & `(portal)/parent/page.tsx`: `window.alert(...)` error dialogs instead of inline UI alerts/toasts.
  - `AdminOverviewContent.tsx`: omits workspace cards for `/admin/questions` and `/admin/news`.
  - `admin/virtual-tour/page.tsx`: initializes from static `TOUR_SCENES` + `localStorage` and silently masks API failure when saving.
  - `sitemap.ts`: still imports deprecated mock `CAMPUS_GUIDE_ARTICLES` (`components/news/news-items.ts`) instead of querying published DB news/locations.
- **Tech/Auth Policy Conflict Requiring Decision (`UNVERIFIED / OWNER DECISION`):**
  - `prisma/seed.ts:1311` (`mustChangePassword: false` from `d03b55a`) conflicts with `prisma/seed.ts:1346` (`mustChangePassword: true`), `ADMIN_AUTH_AND_SECURITY_ARCHITECTURE.md`, and `auth-session.integration.spec.ts:45` (causing 2 tests in `auth-session.integration.spec.ts` to fail on `main`), whereas `open-day-flow.spec.ts` relies on direct admin login without `/change-password`. Requires Owner/Tech Lead policy confirmation before mutating `seed.ts`.
