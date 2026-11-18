# Comprehensive Quality Remediation Backlog (Batches A–F)

## Batch Overview

| Batch | Focus | Severity Scope | Status |
|---|---|---|---|
| **Batch A** | Critical Security, Race Conditions, Integrity Guards, QR ISO Fix & Zero Fake Mutations (`B-A1`–`B-A3`) | **P0 / P1** | **COMPLETE (`ACCEPTED @ 6aa4427`)** |
| **Batch B** | Auth Seed/Reg Race (`B-B1`), Tour Studio PostgreSQL Sync (`B-B2`), Admin Dashboard Real Data (`B-B3`), SpinWheel Cleanup & News Media (`B-B4`) | **P1 / P2** | **COMPLETE (`ACCEPTED @ 1fee256`)** |
| **Batch C** | UI/UX & Real Content Remediation (`B-C1`: Portal Schedule `NOON`, inline alerts, AdminOverview shortcuts; `B-C2`: Events real countdown, Location/[slug] fake hardware specs removal, Contact honesty, About facts check; `B-C3`: Dynamic DB Sitemap & single `robots.ts`) | **P2** | **IMPLEMENTED & PUSHED (`fb519c3`, `6cdc3fe`, `74839f9`, `bd10727`, `968a871` — Pending Acceptance)** |
| **Batch D** | Code Quality, Dead Code & Cleanup (`DigitalPassCard`, `PersonalItineraryTimeline`, `StudentProfileHeader`, unused `news-items.ts` cleanup, shared spin rules helper unifying `PortalService` vs `GamificationService`, `ParentController.createLinkRequest` `APPROVED` guard, `puppeteer`/banner cleanup, `LOCAL_MEDIA_ROOT` test upload isolation) | **P2 / P3** | **Planned** |
| **Batch E** | Cross-Browser/E2E Regression, Accessibility, Mobile Responsive Sweep & Playwright E2E Suite Repair/Verification (`auth-integration` vs `admin-dashboard-b3` user isolation, `/auth/login` throttle isolation across specs, `/locations/[slug]` strict testid vs React SSR `S:0`, `gamification-flow.spec.ts` fake ticket removal) | **QA / Perf** | **Planned** |
| **Batch F** | Contemporary Documentation Synchronization (`PROJECT_STATUS.md`, `HANDOFF_TO_GPT.md`, `README.md`, API Contract deltas, DevOps/Production Runbooks) | **Docs** | **In Progress (`2026-11-18` Health Check Sync)** |

---

## Health Check Delta (`2026-11-18`) — Verified P1 Fixes Applied

- **P1 Fix 1 (`apps/web/src/lib/public/public-api.ts:451,545` + `apps/web/tests/unit/batch-a-qr-and-api.test.ts`):** `mapTourNodeDetailToScene()` previously mapped `tooltip: hs.body ?? undefined` instead of `infoText: hs.body ?? undefined`, hiding DB-loaded `INFO` hotspot descriptions on `/campus` (`PanoramaStage.tsx` reads `hs.infoText`), while `mapFallbackSceneToNodeDetail()` dropped `hs.infoText` (`body: null`). Fixed both mappings and added regression unit test (`web test:unit` 49/49 PASS).
- **P1 Fix 2 (`prisma/seed.ts:2012`):** Interactive `prisma.$transaction(async (tx) => ...)` previously hit Prisma's default 5000ms transaction timeout (`pnpm db:test` `AC-08` failed at `5075 ms`). Added `{ maxWait: 10_000, timeout: 60_000 }`; re-running `pnpm db:test` passed `14/14` (`EXIT_DB_TEST=0`).
- **Remaining Open Findings for Batches D–F & DevOps:** See `PROJECT_STATUS.md` and `docs/HANDOFF_TO_GPT.md` (local primary DB `virtual_campus_360` schema drift, E2E full-suite 6 failures, `PortalService` vs `GamificationService` spin bonus discrepancy, `4 high` advisories in `pnpm audit --prod`, zero CI/Dockerfiles/Nginx/Redis/S3 production infrastructure).

---

## Batch A Exact Scope (Current Target)

1. **`GamificationModule` (`apps/api/src/modules/gamification/*` + `JwtAuthGuard` optional auth + `apps/web/src/lib/auth/api-client.ts` & `gamification-api.ts`):**
   - Support `@OptionalAuth()` on public gamification endpoints so valid Bearer JWT populates `@CurrentUser()` (`userId`), while invalid/missing Bearer degrades cleanly to anonymous (without failing public page).
   - Remove `OR` cross-tier matching on `attendeeName` (`calculateParticipantSpins` strictly isolates `userId` vs verified `ticketCode` vs `userId: null && ticketCode: null && attendeeName`); reject unauthenticated impersonation when `ticket.userId !== null` (`403 FORBIDDEN`).
   - Wrap `submitQuiz` in `$transaction` with per-participant advisory lock + `XpLedger.idempotencyKey` unique key handling (`P2002` guard) so concurrent submits cannot duplicate `QUIZ_COMPLETION` XP.
   - Wrap `spinWheel` in `$transaction` with per-participant advisory lock (`pg_advisory_xact_lock`) + conditional atomic stock decrement (`remainingQuantity > 0`, falling back inside transaction to infinite-stock reward only when locked update yields `0` rows).
   - Remove hardcoded fake `baselineAmbassadors` from `getLeaderboard`, fix distinct participant aggregation key (`userId ?? ticketCode ?? attendeeName`) instead of naive name overwrite, and fix `isCurrentAttendee` exact identity match (never substring `slice(-4)`).
   - Update `apps/web/e2e/gamification-flow.spec.ts` Test 5 to assert genuine PostgreSQL leaderboard behavior rather than removed `"Đặng Quốc Hưng (K19 CNTT)"`.
2. **`PublicApi` & Ticket Lookup (`apps/web/src/lib/public/public-api.ts`, `TicketRegistrationModal.tsx`, `EventsView.tsx`, `CampusQuizStepper.tsx`):**
   - Remove silent mock catch blocks in `registerPublicOpenDay`, `fetchPublicTicketByCode`, `verifyPublicQuiz`, `fetchPublicBuilding`, `fetchPublicLocationBySlug`, and `loadEvents()`.
   - Preserve SSR/page NotFound semantics on unknown `/locations/[slug]`; clear stale `localStorage` tickets cleanly on 404 inside `TicketRegistrationModal`; prevent fallback non-UUID `"ev-openday-2026"` from hitting registration or hardcoded quiz UUID masking absent events.
3. **Tour Publish Go-Live Guard & Media `isAiPlaceholder` (`apps/api/src/modules/tour/tour-admin.service.ts`, `apps/api/src/modules/media/media.service.ts`):**
   - Enforce `evaluateAiPlaceholderGoLiveStatus` (`422 AI_PLACEHOLDER_BLOCKED`), `panoramaAsset.isPreviewApproved === true`, `processingStatus === "READY"`, and active parent `Location`/`Building` in `publishTour`.
   - Fix `saveHotspot` cross-node ownership check (`id + nodeId`) & `createNode` asset/location existence + transactional `AuditLog`.
   - Compute `isAiPlaceholder` using `isAiPlaceholderCameraMetadata` in `MediaService.mapToAdminDto`.
4. **Portal Integrity, XSS Guard, N+1 Elimination & Real Rank (`apps/api/src/modules/portal/portal.service.ts`, `dto/portal.dto.ts`):**
   - Enforce safe `http:`/`https:` or `/...` URL protocol validation on `UpdateProfileDto.avatarUrl`.
   - Enforce `status: PUBLISHED` and `event: { deletedAt: null, status: PUBLISHED }` in `getSchedule`; filter `event: { deletedAt: null }` in `getTickets`.
   - Eliminate N+1 queries in `getTickets` and `getLinkedStudents`.
   - Compute actual leaderboard `rank` from PostgreSQL `xp_ledgers` (`rank: null` when 0 XP) in `getGamification`.
5. **ISO-18004 QR Fix (`apps/web/src/components/ui/QRCodeSVG.tsx`):**
   - Reserve & write format-information coordinates (`isFunction`) BEFORE placing data bits, and apply standard 4-module quiet zone margin so rendered QR tickets on `/events` and `/portal/tickets` scan reliably.
6. **Tests & Verification:**
   - Add new real PostgreSQL integration test suite(s) covering `Gamification` (concurrency spin/quiz races, `attendeeName` takeover prevention, real leaderboard without fake baselines), `TourAdmin` (`422 AI_PLACEHOLDER_BLOCKED`, unapproved panorama block, cross-node hotspot isolation), and `Portal` (`avatarUrl` validation, schedule `PUBLISHED` isolation, real rank computation), plus unit tests for `QRCodeSVG` matrix integrity & `public-api` error propagation!
