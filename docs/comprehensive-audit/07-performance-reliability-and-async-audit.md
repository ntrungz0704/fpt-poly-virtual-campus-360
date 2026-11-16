# 07 — Performance, Reliability & Concurrency Audit

## 1. Concurrency & Race Conditions

- **CRITICAL (`GAMIFICATION-RACE-SPIN`):** `GamificationService.spinWheel` checks `spinsAvailable` BEFORE `$transaction`, then selects a reward and runs `spinRewardConfig.update({ data: { remainingQuantity: { decrement: 1 } } })` without locking (`SELECT ... FOR UPDATE`) or conditional update (`remainingQuantity: { gt: 0 }`). Under parallel requests:
  - Multiple requests read the same `spinsAvailable` and all execute spins, resulting in `spinsUsed > earnedSpins`.
  - Limited stock gifts (`stockQuantity !== null`) can decrement below `0`.
  - **Fix (Batch A):** Serialize per-participant inside `prisma.$transaction` using `pg_advisory_xact_lock`, lock/check `SpinRewardConfig` conditionally (`updateMany` where `{ id, isActive: true, OR: [{ remainingQuantity: null }, { remainingQuantity: { gt: 0 } }] }` or locked row fallback), and compute spin balance inside the transaction.
- **CRITICAL (`GAMIFICATION-RACE-QUIZ`):** `submitQuiz` checks `existingXpLedger` BEFORE `$transaction` and writes `XpLedger` without `idempotencyKey`, allowing parallel submissions to pass `existingXpLedger === null` simultaneously and award double `QUIZ_COMPLETION` XP.
  - **Fix (Batch A):** Populate unique `XpLedger.idempotencyKey` AND handle `P2002` inside `$transaction` + advisory lock per identity/event so only the first submission awards XP.
- **MEDIUM (`PUBLIC-REG-RACE`):** `PublicService.registerEvent` checks `existingParticipation` outside transaction (`public.service.ts:1245`), so rapid double-clicks could insert two non-cancelled participations for the same email/event if concurrent. **(Batch B)**

## 2. Database N+1 Queries

- **`PortalService.getTickets` (`portal.service.ts:168-216`):** Loops over `participations` and executes `await this.prisma.openDaySession.findMany(...)` per ticket.
  - **Fix (Batch A):** Collect all unique `sessionIds` across all participations first, execute ONE `findMany({ where: { id: { in: [...] }, deletedAt: null } })`, map by ID.
- **`PortalService.getLinkedStudents` (`portal.service.ts:486-520`):** Loops over `links` and runs `Promise.all([xpLedger.aggregate(...), eventParticipation.count(...)])` per approved student.
  - **Fix (Batch A):** Batch with `xpLedger.groupBy({ by: ["userId"], ... })` and `eventParticipation.groupBy({ by: ["userId"], ... })` across all approved student IDs!

## 3. Frontend Timer / Async Hygiene & Bundle Size

- **`SpinWheel.tsx:85-91`:** Calls `setTimeout(..., 4200)` in `handleSpin` without clearing the timeout in a `useEffect` unmount cleanup -> can fire `setState` / `onSpinComplete` after navigation away from `/games`. **(Batch B)**
- **`Toast` timers (`admin/questions/page.tsx:59`, `parent/page.tsx:79`, `TicketRegistrationModal.tsx:120`):** Minor uncleaned `setTimeout` callbacks. **(Batch B/C)**
- **`PanoramaStage.tsx` / `Leaflet`:** Properly dynamic-imported (`ssr: false`) on `/`, `/campus`, `/map`, and `/admin/virtual-tour`, keeping initial bundle free of WebGL/Leaflet SSR issues.
- **Test Dependencies:** `@playwright/test` AND `puppeteer` are both present in `apps/web/package.json` `devDependencies` (`task`: check `puppeteer` removal candidate in Batch D).
