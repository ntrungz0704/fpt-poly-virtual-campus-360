# 00 — Project Baseline & Evolution History Audit

## 1. Repository & Branch Reality (Verified Baseline)

| Item | Verified Value |
|---|---|
| Repository | `ntrungz0704/fpt-poly-virtual-campus-360` |
| Single Source of Truth (`main`) | `ef03ce95f5ad7a746fb355eb0999aa94bfc1c2b2` (`106` commits since `20f85ad`) |
| Audit Branch | `audit/comprehensive-quality-remediation` (created cleanly from `main @ ef03ce9`) |
| Unmerged Feature Branch (Untouched) | `feat/m8-open-day-checkin` (`a8b3833` — 2 commits ahead of `main`: `10f8471`, `a8b3833`, awaiting Tech Lead review for M8) |
| Tech Stack | Next.js `16.4.6` App Router (`apps/web`), NestJS `11` (`apps/api`), Prisma `6.19.3` + PostgreSQL 16 (`prisma/`), Shared Contracts (`packages/shared`), `pnpm@10.33.2` workspace |

---

## 2. Codebase Inventory on `main @ ef03ce9`

- **Frontend Routes (`apps/web/src/app`):** `28` `page.tsx` routes across 4 route groups + root:
  - `(public)`: `/`, `/about`, `/contact`, `/events`, `/games`, `/locations`, `/locations/[slug]`, `/news`, `/news/[slug]`
  - `(immersive)`: `/campus`, `/map`
  - `(auth)`: `/login`, `/change-password`
  - `(portal)`: `/portal`, `/portal/profile`, `/portal/progress`, `/portal/quiz`, `/portal/schedule`, `/portal/tickets`, `/parent`
  - `/admin`: `/admin`, `/admin/events`, `/admin/locations`, `/admin/media`, `/admin/news`, `/admin/questions`, `/admin/users`, `/admin/virtual-tour`
- **Backend Modules (`apps/api/src/modules`):** `14` module folders (`audit-log`, `auth`, `gamification`, `health`, `media`, `news`, `open-day`, `portal`, `public`, `questions`, `quiz-config`, `storage`, `tour`, `users-rbac`).
- **Database Schema (`prisma/schema.prisma`):** Models & enums deployed via Prisma migrations (`prisma/migrations/*`), seeded by `prisma/seed.ts`.
- **Automated Test Suites on `main`:**
  - `apps/api/test/unit/*.spec.ts`: `8` suites (`enum-mappers`, `env.schema`, `gamification`, `local-storage.adapter`, `m1-shared-contracts`, `open-day-validation`, `phone-normalizer`, `token-crypto`).
  - `apps/api/test/integration/*.spec.ts`: `17` suites (`auth-session`, `csrf-cors`, `health`, `location-gis-crud`, `m1-migration-schema`, `media-library-advanced`, `news-cms`, `open-day-rbac-crud`, `open-day-tickets-checkin`, `public-isolation`, `question-bank`, `quiz-attempt`, `quiz-config`, `quiz-delivery`, `quiz-results`, `quiz-submit`, `rbac-provisioning-activation`) + `test-db.helper.ts`. Note: **0 integration test suites exist for `gamification`, `tour-admin`, or `portal` on `main`.**
  - `apps/web/tests/unit/*.test.ts`: `14` unit tests via `node --import tsx --test`.
  - `apps/web/e2e/*.spec.ts`: `4` Playwright specs (`auth-integration`, `gamification-flow`, `open-day-flow`, `portal-flow`).

---

## 3. Baseline Execution Matrix (`audit/comprehensive-quality-remediation` pre-edit)

| Check | Result on `main @ ef03ce9` | Notes |
|---|---|---|
| `pnpm --filter @fpt-campus/shared build` | **PASS** | Compiled cleanly |
| `pnpm --filter api lint` | **PASS** | 0 ESLint errors |
| `pnpm --filter api typecheck` | **PASS** | 0 TS errors |
| `pnpm --filter api test:unit` | **PASS** | 8/8 suites, 31/31 tests passed |
| `pnpm --filter web lint` | **PASS** | 0 ESLint errors |
| `pnpm typecheck` (`shared` + `web`) | **PASS** | 0 TS errors |
| `pnpm --filter web test:unit` | **PASS** | 14/14 tests passed |
| `public-isolation.integration.spec.ts` | **PASS** | 8/8 tests passed on PostgreSQL 16 scratch DB |
| `auth-session.integration.spec.ts` | **FAIL (2 failed)** | `seed.ts:1311` (`d03b55a`) changed `mustChangePassword` to `false` while `auth-session.integration.spec.ts:45` asserts `true`, cascading into line 206 (`401`) |

---

## 4. Evolution & Regression Provenance

Key historical commits explaining systemic defects found across the codebase:

1. `b4f1a94` -> `5c9fea0` -> `9062c58`: Initial Phase 0–1 frontend UI built entirely on static TypeScript registries (`apps/web/src/data/campus-data.ts`, `components/news/news-items.ts`, `components/portal/DigitalPassCard.tsx`, `PersonalItineraryTimeline.tsx`).
2. `ff13f14` / `3a13178` -> `b8aac75`: Phase 2A-2 backend modular monolith with strict PostgreSQL guards, Argon2id auth, JWT refresh rotation, and D-2A2-03 public isolation.
3. `d03b55a` (`fix(auth): enforce single super admin credentials...`): Mutated `prisma/seed.ts:1311` to `mustChangePassword: false` and `admin@poly.edu.vn` for local E2E convenience (`open-day-flow.spec.ts`), leaving `prisma/seed.ts:1346` audit `diffJson` saying `mustChangePassword: true` and breaking `auth-session.integration.spec.ts`.
4. `f9a0672` (`M3C`) & `a893b93` (`M3D`): Added Open Day ticketing & Gamification quiz/spin wheel/leaderboard, leaving non-transactional XP/spin race conditions, `OR`-based `attendeeName` identity mixing, `@Public()` blocking `CurrentUser`, and hardcoded fake `baselineAmbassadors`.
5. `fc725f8` & `f41ecf0`: Introduced silent offline fallbacks directly inside `apps/web/src/lib/public/public-api.ts` (including fabricated `OD26-...` tickets in `registerPublicOpenDay`, hardcoded `"Khách tham quan FPT Poly"` in `fetchPublicTicketByCode`, all-correct `verifyPublicQuiz`, and `[0]` array fallbacks on 404 lookups).
6. `63654c4` & UI redesign commits: Generated static showcase/redesign assets (`scripts/ui-redesign-generator`, `scripts/audit-modules`, `docs/ALL_PAGES_GALLERY`, `docs/project-redesign-audit`) and hardcoded marketing/editorial dashboard counters (`AdminDashboardMetrics`, `AdminRecentActivityLog`, `/locations/[slug]` hardware specs, static `/contact` form).
7. `3ddcfa5` / `2a4b837` -> `ef03ce9`: Iteratively replaced parts of Portal, News CMS, Question Bank, Quiz Engine (`M6`–`M7.5`) with real PostgreSQL modules while leaving legacy artifacts (`news-items.ts` in `sitemap.ts`, unused Phase 1 portal components, incomplete Tour Studio `publishTour` AI-placeholder gate, and `AdminOverviewContent` missing links to `/admin/questions` and `/admin/news`).
