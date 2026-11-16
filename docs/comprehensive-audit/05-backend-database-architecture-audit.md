# 05 — Backend & Database Architecture Audit

## 1. Schema, Migrations & Constraints (`prisma/schema.prisma`)

- Schema models and constraints are well-structured for PostgreSQL 16 (3NF separation of `User`, `Role`, `Permission`, `RefreshToken`, `AuditLog`, `Campus`, `Building`, `Floor`, `FloorPlan`, `Location`, `MediaAsset`, `TourNode`, `TourEdge`, `Hotspot`, `OpenDayEvent`, `EventParticipation`, `QuizConfiguration`, `QuizConfigAttempt`, `XpLedger`, `UserSpinHistory`, `SpinRewardConfig`, `NewsArticle`, `QuestionBankItem`, `ParentStudentLink`).
- **Observed Schema Utilization Gaps:**
  - `XpLedger.idempotencyKey` (`@unique`, `prisma/schema.prisma:828`) IS used in `PortalQuizService` (`quiz_xp:...`) and tested in `quiz-submit.integration.spec.ts`, **but NOT populated by `GamificationService.submitQuiz`!** Setting deterministic `idempotencyKey` (`gamification:quiz:${eventId}:${identityKey}`) directly leverages the database unique index as the concurrency safety net!
  - `EventParticipation` unique constraint `@@unique([userId, eventId])` protects authenticated multi-registration per event; anonymous email uniqueness per active event is enforced in `PublicService.registerEvent` (note: check race window between `findFirst` and `create` — documented for Batch B concurrency polish or partial unique index inspection).

## 2. Backend Module Quality Summary

| Module | Strengths | Verified Issues |
|---|---|---|
| `auth`, `users-rbac` | Argon2id hashing, constant-time dummy hash check, refresh token family reuse revocation, CSRF guard, RBAC + `ForcePasswordChangedGuard`, audit scrubbing. | Seed conflict `d03b55a` (`mustChangePassword: false` vs `auth-session.integration.spec.ts`); Excel template/import uses `xlsx` cleanly in memory. |
| `public` | Strict `isPublicTourNodeEligible` gate preventing leak of DRAFT/unapproved/soft-deleted nodes or private sessions. | `registerEvent` email duplicate check lacks transaction/lock around concurrent double-submit; `getEvents` session `building` fallback `"INNOVATION"` if `session.building` non-published (`public.service.ts:1050` — Batch B review). |
| `gamification` | Authoritative server-side scoring formula & crypto weighted RNG. | `@Public()` drops `userId`, unsafe `OR` `attendeeName` collision, non-atomic spin stock/quota races, un-locked quiz XP race, fake `baselineAmbassadors`. **(Batch A)** |
| `tour` | AuditLog on mutations, `LocalStorage`/`S3Storage` adapter separation. | `publishTour` skips `evaluateAiPlaceholderGoLiveStatus` + `isPreviewApproved` + `READY` check; `saveHotspot` lacks `nodeId` ownership check; `createNode` misses FK existence/non-deleted validation + transactional audit. **(Batch A)** |
| `media` | Magic-byte inspection (`JPEG`/`PNG`/`WebP`), Sharp re-encoding, upload token JTI single-use consumption, 4-way delete guard (`coverForBuildings`, `panoramaTourNodes`, `locationMedia`, `newsArticles`). | `mapToAdminDto` hardcodes `isAiPlaceholder: false` (`media.service.ts:649`). **(Batch A)** |
| `portal`, `portal-quiz` | `PortalQuizService` enforces pessimistic `FOR UPDATE` row locks, zero-leak answer stripping on delivery, transactional `QuizXpClaim` idempotency (`M7.1`–`M7.5` high standard). | `PortalService`: `rank: 1` hardcoded; N+1 queries in `getTickets` & `getLinkedStudents`; `getSchedule` omits `PUBLISHED` check; `getTickets` omits `event: { deletedAt: null }`; `UpdateProfileDto.avatarUrl` lacks protocol validation. **(Batch A)** |
| `news` | `NewsAdminService` transactional `AuditLog` + P2002 conflict check. | `NewsPublicService.listPublished` returns `art.coverMedia?.thumbnailKey || ...` raw objectKey without `StorageAdapter.getPublicUrl` or `deletedAt === null` filter on `coverMedia` relation (`news-public.service.ts:40-62`). **(Batch B)** |
| `questions`, `quiz-config` | Strict enum validation, server-side import trust boundary, published config immutability (`M6`–`M7.1`). | Covered cleanly by integration suites. |
