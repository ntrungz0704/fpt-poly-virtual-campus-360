# Batch A Review Evidence — Comprehensive Quality Remediation

**Repository:** `ntrungz0704/fpt-poly-virtual-campus-360`  
**Audit Branch:** `audit/comprehensive-quality-remediation`  
**Base (`main`):** `ef03ce95f5ad7a746fb355eb0999aa94bfc1c2b2` (giữ nguyên, không sửa trực tiếp)  
**M8 Branch (untouched):** `feat/m8-open-day-checkin` (`a8b3833c9c134939b6f6ea97973728041d1b0b70`, PR [#2](https://github.com/ntrungz0704/fpt-poly-virtual-campus-360/pull/2))

---

## 1. Commit Lineage & Preservation Record

| Commit | SHA | Scope Summary | Diff Summary |
|---|---|---|---|
| Commit 1 | `3cc520253a3828f2343af7c1586e41cf5e494897` | 12 baseline audit reports + Batch A–F backlog (`docs/comprehensive-audit/*`) | `12 files changed, 365 insertions(+)` |
| Commit 2 | `6f04c39a872de8bef5180e220257d53a71ae2525` | Batch A P0/P1 source code fixes, integration suite & unit tests | `20 files changed, 1978 insertions(+), 682 deletions(-)` |
| Commit 3 | *(committed cleanly on top of `6f04c39`)* | This evidence dossier (`docs/comprehensive-audit/BATCH_A_REVIEW_EVIDENCE.md`) | Docs only — zero code modification |

> **Compatibility Note on `feat/m8-open-day-checkin`:** Both `feat/m8-open-day-checkin` (`a8b3833`) and Audit Commit `6f04c39` contain the exact same blob diff for `apps/web/src/components/ui/QRCodeSVG.tsx` (`9b0b2bc..d70618c`), minimizing merge/rebase risk after M8 lands in `main`.

---

## 2. Exact 20-File Inventory in Batch A (`3cc5202..6f04c39`)

| # | Status | File Path | Delta |
|---|---|---|---|
| 1 | `M` | `apps/api/src/common/decorators/auth.decorators.ts` | `+8` |
| 2 | `M` | `apps/api/src/common/guards/jwt-auth.guard.ts` | `+34 / -8` |
| 3 | `M` | `apps/api/src/modules/gamification/gamification.controller.ts` | `+6 / -2` |
| 4 | `M` | `apps/api/src/modules/gamification/gamification.service.ts` | `+553 / -283` |
| 5 | `M` | `apps/api/src/modules/media/media.service.ts` | `+2 / -1` |
| 6 | `M` | `apps/api/src/modules/portal/dto/portal.dto.ts` | `+46` |
| 7 | `M` | `apps/api/src/modules/portal/portal.service.ts` | `+120 / -78` |
| 8 | `M` | `apps/api/src/modules/tour/tour-admin.service.ts` | `+365 / -130` |
| 9 | `A` | `apps/api/test/integration/audit-batch-a.integration.spec.ts` | `+540` |
| 10 | `M` | `apps/web/e2e/gamification-flow.spec.ts` | `+4 / -6` |
| 11 | `M` | `apps/web/src/app/(portal)/portal/profile/page.tsx` | `+29 / -2` |
| 12 | `M` | `apps/web/src/app/(public)/locations/[slug]/page.tsx` | `+10 / -3` |
| 13 | `M` | `apps/web/src/components/events/EventsView.tsx` | `+10 / -6` |
| 14 | `M` | `apps/web/src/components/events/TicketRegistrationModal.tsx` | `+9 / -2` |
| 15 | `M` | `apps/web/src/components/quiz/CampusQuizStepper.tsx` | `+3 / -3` |
| 16 | `M` | `apps/web/src/components/ui/QRCodeSVG.tsx` | `+23 / -23` |
| 17 | `M` | `apps/web/src/lib/auth/api-client.ts` | `+20 / -7` |
| 18 | `M` | `apps/web/src/lib/public/gamification-api.ts` | `+4 / -4` |
| 19 | `M` | `apps/web/src/lib/public/public-api.ts` | `+25 / -168` |
| 20 | `A` | `apps/web/tests/unit/batch-a-qr-and-api.test.ts` | `+123` |

---

## 3. P0 / P1 Finding-to-Fix & Test Mapping

| Finding ID & Severity | Defect Remediated | Modified Source Files & Key Symbols | Protecting Tests |
|---|---|---|---|
| **P0 — `GAMIFICATION-P0-AUTH-IDENTITY-AND-RACE`** (Optional Auth + Identity Isolation) | `@Public()` skipped JWT parsing so `@CurrentUser()` was always `undefined`; `OR` query allowed unauthenticated `attendeeName` lookup to hijack another student's/ticket holder's spins/XP. | `auth.decorators.ts` (`IS_OPTIONAL_AUTH_KEY`, `@OptionalAuth`), `jwt-auth.guard.ts` (`resolveUserFromToken`), `gamification.controller.ts` (`@OptionalAuth()`), `gamification.service.ts` (`resolveParticipantScope`, `computeParticipantProfile`), `api-client.ts` (`auth: "optional"`), `gamification-api.ts` | `audit-batch-a.integration.spec.ts`: *"blocks attendeeName cross-user spin/XP leakage and rejects anonymous use of account-bound tickets"* |
| **P0 — `GAMIFICATION-P0-AUTH-IDENTITY-AND-RACE`** (Quiz XP Double-Credit Race) | Non-transactional `XpLedger` check allowed concurrent `POST /public/gamification/quiz/submit` calls to award duplicate `QUIZ_COMPLETION` XP. | `gamification.service.ts` (`submitQuiz` wrapped in `$transaction`, `pg_advisory_xact_lock`, deterministic `XpLedger.idempotencyKey`, `isUniqueConstraintError` for `P2002`) | `audit-batch-a.integration.spec.ts`: *"enforces atomic one-time quiz XP under 5 concurrent POST /public/gamification/quiz/submit calls"* + `quiz-submit.integration.spec.ts` |
| **P0 — `GAMIFICATION-P0-AUTH-IDENTITY-AND-RACE`** (Spin Quota & Inventory Race) | `spinWheel` checked available spins & stock outside `$transaction`, enabling negative inventory and double-spending spins. | `gamification.service.ts` (`spinWheel` wrapped in `$transaction`, `pg_advisory_xact_lock`, conditional `updateMany` with `remainingQuantity: { gt: 0 }` and in-tx infinite-stock fallback) | `audit-batch-a.integration.spec.ts`: *"serializes 6 concurrent spins via advisory lock and never allows negative spins or negative stock"* |
| **P0 — `GAMIFICATION-P0-FAKE-LEADERBOARD`** | `getLeaderboard` injected 5 hardcoded `baselineAmbassadors`, keyed `entriesMap` by lowercase name (colliding distinct people), and flagged `isCurrentAttendee` via `slice(-4)` substring match. | `gamification.service.ts` (`getLeaderboard`), `apps/web/e2e/gamification-flow.spec.ts` (Test 5 updated to assert real attendee ranking without fake `"Đặng Quốc Hưng"`) | `audit-batch-a.integration.spec.ts`: *"returns 100% real leaderboard without fake baselineAmbassadors or name-overwrite collisions"* |
| **P0 — `PUBLIC-API-P0-SILENT-FAKE-MUTATIONS`** | Catch blocks in `public-api.ts` fabricated fake `OD26-...` tickets on `409`/errors, fabricated `"Khách tham quan FPT Poly"` on `404`, marked all offline quiz answers `isCorrect: true`, and masked `404` locations with `[0]` fallback / fake event state. | `public-api.ts` (`fetchPublicBuilding`, `fetchPublicLocationBySlug`, `fetchPublicEvents`, `verifyPublicQuiz`, `registerPublicOpenDay`, `fetchPublicTicketByCode`), `EventsView.tsx`, `TicketRegistrationModal.tsx`, `CampusQuizStepper.tsx`, `locations/[slug]/page.tsx` | `batch-a-qr-and-api.test.ts`: *"public-api rejects 404/409/offline errors honestly instead of fabricating fake tickets or grading quiz responses"* |
| **P0 — `QR-CORRUPTION-P0`** | Format-information strips were written after data bits, overwriting payload modules; quiet-zone margin was `2` instead of ISO `4`. | `apps/web/src/components/ui/QRCodeSVG.tsx` (`generateQRMatrix` format reservation pre-data placement, `margin = includeMargin ? 4 : 0`) | `batch-a-qr-and-api.test.ts`: *"QRCodeSVG matrix preserves ISO-18004 format strips, dark module, and finder corners"* |
| **P1 — `TOUR-PUBLISH-P1-BYPASS` & BigInt Crash** | `publishTour` & `updateNode(PUBLISHED)` bypassed `evaluateAiPlaceholderGoLiveStatus` (`422 AI_PLACEHOLDER_BLOCKED`), `isPreviewApproved`, `READY`, and active parent `Location`/`Building`; `MediaService` hardcoded `isAiPlaceholder: false`; `saveHotspot` lacked `nodeId` check; raw `panoramaAsset: true` serialized `fileSizeBytes: BigInt` (`500`). | `tour-admin.service.ts` (`TOUR_PANORAMA_SAFE_SELECT`, `assertNodesReadyForPublish`, `createNode`, `updateNode`, `saveHotspot`, `publishTour` + `$transaction`), `media.service.ts` (`isAiPlaceholderCameraMetadata`) | `audit-batch-a.integration.spec.ts`: *"computes isAiPlaceholder dynamically and blocks Go-Live publish with 422 AI_PLACEHOLDER_BLOCKED or unapproved asset"* + `media-library-advanced.integration.spec.ts` |
| **P1 — `PORTAL-P1-DATA-AND-XSS`** | `avatarUrl` allowed unsafe URL schemes into `<img src>`; `getSchedule` leaked non-`PUBLISHED` / soft-deleted event sessions; `getTickets` & `getLinkedStudents` ran N+1 loops; `getGamification` hardcoded `rank: 1`. | `portal.dto.ts` (`IsSafeAvatarUrlConstraint`), `portal/profile/page.tsx` (`sanitizeSafeImageUrl`), `portal.service.ts` (`getSchedule`, `getTickets`, `getLinkedStudents`, `getGamification`, `computeRealParticipantRank`) | `audit-batch-a.integration.spec.ts`: *"rejects dangerous avatarUrl schemes (XSS guard), filters DRAFT schedule sessions, and computes real rank"* |

---

## 4. Verification Ledger (Observed Post-Commit `6f04c39` vs Untested Scope)

**CRITICAL:** Batch A is **NOT** claimed as a repository-wide `FULL PASS`. Only the exact commands below executed after Batch A code edits (`6f04c39`):

### 4.1 Checks Executed and Observed Passing After Batch A Code Edits

| Category | Exact Command / Suites | Result |
|---|---|---|
| Shared Build | `pnpm --filter @fpt-campus/shared build` | **PASS** (exit `0`) |
| Workspace Typecheck | `pnpm typecheck` (`@fpt-campus/shared` + `web`) | **PASS** (exit `0`) |
| API Static & Unit | `pnpm --filter api lint; api typecheck; api build; api test:unit` | **PASS** (**8/8** unit suites, **31/31** tests) |
| Web Static, Unit & Build | `pnpm --filter web lint; web test:unit; web typecheck; web build` | **PASS** (**16/16** unit tests across 4 files; `next build` **28/28** routes) |
| API Integration Run 1 (`task-1226`) | `location-gis-crud.integration.spec.ts`, `quiz-submit.integration.spec.ts`, `open-day-rbac-crud.integration.spec.ts`, `open-day-tickets-checkin.integration.spec.ts`, `quiz-results.integration.spec.ts` (PostgreSQL 16) | **PASS** (**5/5** suites, **63/63** tests) |
| API Integration Run 2 (`task-1254`) | `audit-batch-a.integration.spec.ts`, `csrf-cors.integration.spec.ts`, `media-library-advanced.integration.spec.ts`, `public-isolation.integration.spec.ts` (PostgreSQL 16) | **PASS** (**4/4** suites, **30/30** tests) |

### 4.2 Baseline Failure (Pre-Existing on `main @ ef03ce9`, Not Re-Run Post-`6f04c39`)

| Suite | Observed Baseline Status | Root Cause & Locked Policy Decision |
|---|---|---|
| `apps/api/test/integration/auth-session.integration.spec.ts` | **FAIL (2 failed tests)** when run on pre-edit baseline from `main @ ef03ce9` (not re-run post-`6f04c39`) | Commit `d03b55a` mutated `prisma/seed.ts:1311` (`mustChangePassword: false`), conflicting with `prisma/seed.ts:1346` (`true`) and `auth-session.integration.spec.ts:45` (`expect(true)`). **Tech Lead Decision Locked:** Keep `mustChangePassword = true` in policy & seed; do **not** lower security assertions — align seed & E2E login/change-password flow in **Batch B**. |

### 4.3 Integration & E2E Suites NOT Run Post-`6f04c39`

1. **Remaining 8 API Integration Suites (not executed after Batch A edits):**
   - `apps/api/test/integration/health.integration.spec.ts`
   - `apps/api/test/integration/m1-migration-schema.integration.spec.ts`
   - `apps/api/test/integration/news-cms.integration.spec.ts`
   - `apps/api/test/integration/question-bank.integration.spec.ts`
   - `apps/api/test/integration/quiz-attempt.integration.spec.ts`
   - `apps/api/test/integration/quiz-config.integration.spec.ts`
   - `apps/api/test/integration/quiz-delivery.integration.spec.ts`
   - `apps/api/test/integration/rbac-provisioning-activation.integration.spec.ts`
2. **Playwright E2E Suites (`4/4` files not executed):**
   - `apps/web/e2e/auth-integration.spec.ts`
   - `apps/web/e2e/gamification-flow.spec.ts` *(Test 5 updated in `6f04c39`, not yet run live)*
   - `apps/web/e2e/open-day-flow.spec.ts`
   - `apps/web/e2e/portal-flow.spec.ts`
3. **CI / Automated Status Checks:**
   - Verified `Test-Path ".github"` is `False` and `GET /repos/ntrungz0704/fpt-poly-virtual-campus-360/actions/runs` returns `total_count: 0`. No CI workflows or remote status checks are configured on commits `3cc5202`, `6f04c39`, or `a8b3833`.

---

## 5. Locked Next-Step Governance Decisions (Effective Batch B+)

1. **`mustChangePassword = true` Policy Locked:** Seeded/imported admin credentials enforce first-login password change; E2E helpers/fixtures will execute the `/change-password` flow instead of weakening seed policy or test assertions.
2. **Execution Sequence Locked:**
   1. Review & merge M8 PR [#2](https://github.com/ntrungz0704/fpt-poly-virtual-campus-360/pull/2) (`feat/m8-open-day-checkin` -> `main`).
   2. Rebase/sync `audit/comprehensive-quality-remediation` onto updated `main`.
   3. Complete Tech Lead review/acceptance of Batch A (`3cc5202`, `6f04c39`, and this dossier) and run full integration/E2E verification as authorized.
   4. Begin **Batch B** only after Tech Lead approval.
