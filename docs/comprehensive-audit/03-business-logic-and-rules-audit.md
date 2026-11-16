# 03 — Business Logic & Domain Rules Audit

## 1. Gamification & Open Day Economy (`gamification.service.ts`)

| Rule / Invariant | Current Implementation on `main @ ef03ce9` | Finding |
|---|---|---|
| **One-Time Quiz XP per Event** | Checks `xpLedger.findFirst({ where: { source: "QUIZ_COMPLETION", referenceId } })` BEFORE `prisma.$transaction(...)`, and inserts WITHOUT `idempotencyKey` (`schema.prisma:828` has unique `@unique idempotencyKey` unused here!). | **P0 Race Condition:** Parallel POSTs to `/public/gamification/quiz/submit` bypass `findFirst` check and award duplicate XP. |
| **Anonymous Default Identity Collision** | `attendeeName` defaults to `"Khách tham quan"` on `/games`; `referenceId = quiz_<eventId>_khách_tham_quan`; `calculateParticipantSpins` uses `OR` across `ticketCode`, `userId`, and `attendeeName`. | **P0 Logic & Security Bug:** Any guest supplying an existing attendee's `attendeeName` inherits and consumes their earned spins and merges their XP/quiz records. Unauthenticated visitors sharing default `"Khách tham quan"` also collide. |
| **Ticket Ownership vs Guest Use** | Does not verify whether `ticketCode` exists, is not `CANCELLED`, or is already bound to a registered `userId`. | **P0/P1 Impersonation:** Anonymous requests specifying another user's claimed `ticketCode` or cancelled ticket can query/spend their spins. |
| **Spendable Spins Quota & Stock** | `spinWheel` reads `spinsAvailable` outside `$transaction`, picks reward, then decrements `SpinRewardConfig.remainingQuantity` (`decrement: 1`) inside `$transaction` without row lock or `remainingQuantity > 0` check. | **P0 Race Condition:** Concurrent `/public/gamification/spin` calls can overspend `spinsAvailable` and drive `remainingQuantity` below `0`. |
| **Authentic Leaderboard Ranking** | `getLeaderboard` injects 5 hardcoded `baselineAmbassadors` (480 -> 160 XP), overwrites distinct entries with same display name in `entriesMap.set(name.toLowerCase(), ...)`, and matches `isCurrentAttendee` via substring `item.attendeeName.includes(rawTicket.slice(-4))`. | **P0 Authenticity + Logic Defect:** Fake students outrank real users; same-named participants collide; arbitrary 4-char substrings trigger false `isCurrentAttendee`. |

## 2. Virtual Tour Go-Live & CMS Rules (`tour-admin.service.ts`, `media.service.ts`)

| Rule / Invariant | Current Implementation on `main @ ef03ce9` | Finding |
|---|---|---|
| **D-02 / DEC-M1-A AI Placeholder Go-Live Block** | `packages/shared/src/tour.ts:302` provides `evaluateAiPlaceholderGoLiveStatus`, returning `AI_PLACEHOLDER_BLOCKED` (HTTP `422`), yet `TourAdminService.publishTour` calls `tourNode.updateMany({ where, data: { status: PUBLISHED } })` blindly! `MediaService.mapToAdminDto:649` also hardcodes `isAiPlaceholder: false`. | **P1 Rule Bypass:** AI synthetic placeholders or unapproved/`FAILED` assets can be flipped to `PUBLISHED` on `TourNode` directly via `POST /admin/tour/publish`. (`PublicService.isPublicTourNodeEligible` still hides unapproved panoramas, creating split-brain state where DB says `TourNode.PUBLISHED` while public tour hides it). |
| **Hotspot Cross-Node Isolation** | `TourAdminService.saveHotspot(user, nodeId, dto)` updates `where: { id: dto.id }` without enforcing `nodeId` match. | **P1 Integrity Defect:** Passing another node's hotspot UUID mutates the foreign node's hotspot (or throws raw Prisma `P2025` if nonexistent). |
| **Node Asset/Location Validation** | `TourAdminService.createNode` passes `dto.panoramaAssetId` and `dto.locationId` straight to Prisma `create` without checking deleted status (`P2003` -> generic 400). | **P1 Validation Gap:** No domain-clear 404/400 validation or transactional `AuditLog`. |

## 3. Portal Domain Rules (`portal.service.ts`)

- **`getSchedule` (`portal.service.ts:229`):** Queries `openDaySession.findMany({ where: { deletedAt: null, isPublic: true } })`, missing `status: PublishStatus.PUBLISHED` and `event: { deletedAt: null, status: PublishStatus.PUBLISHED }`. Draft or archived event sessions leak to logged-in students.
- **`getTickets` (`portal.service.ts:160`):** Omits `event: { deletedAt: null }` filter and does N+1 session lookups inside loop.
- **`getGamification` (`portal.service.ts:369`):** Hardcodes `rank: 1` for every student.
- **`createLinkRequest` (`portal.service.ts:603`):** `upsert` resets an existing `APPROVED` or `REJECTED` link back to `PENDING` if parent submits again (worth reviewing in Batch B; documented clearly).

## 4. Open Day Check-in & Auth Policy Status (`main` vs `feat/m8-open-day-checkin`)

- **`main` (`open-day.service.ts:1326-1413`):** `POST /admin/events/check-in` accepts `CheckInTicketDto` with `ticketCode` only (no `eventId` validation, non-atomic check-then-update, no `XpLedger` check-in reward). This domain is actively implemented and under review on `feat/m8-open-day-checkin` (`a8b3833`); Batch A avoids conflicting edits to `open-day.service.ts` unless directed to cherry-pick or merge M8 first.
- **`prisma/seed.ts:1311` vs `1346` (`d03b55a`):** Bootstrap admin created with `mustChangePassword: false`, contradicting `seed.ts:1346` audit note, `ADMIN_AUTH_AND_SECURITY_ARCHITECTURE.md`, and `auth-session.integration.spec.ts:45` (expecting `true`), while `open-day-flow.spec.ts` depends on direct admin login. Marked **`NEEDS OWNER DECISION`**.
