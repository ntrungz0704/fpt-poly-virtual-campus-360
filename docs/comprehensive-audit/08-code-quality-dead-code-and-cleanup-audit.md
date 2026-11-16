# 08 — Code Quality, Dead Code & Cleanup Audit

## 1. Verified Dead / Deprecated Components & Static Registries

| Item | Evidence | Verdict | Target Batch |
|---|---|---|---|
| `apps/web/src/components/portal/DigitalPassCard.tsx` | Contains FNV-1a fake 15x15 QR bitmap (`buildMatrix`), only exported in `components/portal/index.ts`; replaced by real `/portal/tickets` + `QRCodeSVG`. **0 page imports.** | Unused dead component -> remove or confirm zero external refs in Batch D | **Batch D** |
| `apps/web/src/components/portal/PersonalItineraryTimeline.tsx` | Reads static `OPEN_DAY_SESSIONS` with hardcoded `selectedIds`; only exported in `components/portal/index.ts`. **0 page imports.** | Unused dead component -> remove in Batch D | **Batch D** |
| `apps/web/src/components/portal/StudentProfileHeader.tsx` & `portal-types.ts` | Legacy Phase 1 portal header; only exported in `components/portal/index.ts`. **0 page imports.** | Unused dead component -> remove in Batch D | **Batch D** |
| `apps/web/src/components/news/news-items.ts`, `FeaturedArticleCard.tsx`, `NewsArticleGrid.tsx` | Static Phase 1 news guide array & cards. `app/(public)/news` uses real PostgreSQL API (`news-public-api.ts`); **HOWEVER `app/sitemap.ts:2` STILL imports `CAMPUS_GUIDE_ARTICLES`**! | Migrate `sitemap.ts` first (Batch C), then archive/remove static news items if unused cleanly in Batch D. | **Batch C / D** |
| `puppeteer` in `apps/web/package.json` | Not imported anywhere in `apps/api/src`, `apps/web/src`, or `scripts/` (Playwright `chromium` is used everywhere). | Redundant devDependency candidate for Batch D removal. | **Batch D** |

## 2. Scripts & Artifacts Outside App Codebase (`scripts/`, `docs/`, `v10/`)

- `scripts/`: Contains bespoke HTML/gallery/audit generators (`build-redesign-audit-reports.mjs`, `build-ui-redesign-suite.mjs`, `render-full-stitch-gallery.mjs`, `render-all-bespoke-images.mjs`, `audit-modules/*`, `ui-redesign-generator/*`), `check-image-hashes.mjs`, `seed-news.ts`, `sync-single-admin.ts`, `verify-phase-ab.mjs`, `capture-c1-screenshots.mjs`.
  - **Note on `scripts/sync-single-admin.ts`:** Contains hardcoded password `"Admin@123456"` (dev helper from `d03b55a`). Keep only if classified clearly as local dev utility or parameterize via env var, never run in prod! **(Batch D / E)**
  - **Note on `v10` directory:** Checked via `Test-Path v10` -> `False` (does not exist on disk).
  - **Docs Drift (`PROJECT_STATUS.md`):** Claims `b23a5ce` + `91/91 PostgreSQL`, behind actual `main @ ef03ce9` (`17` integration specs). Update contemporary docs in **Batch E** cleanly without touching historical `docs/_archive` snapshots.

## 3. Code Duplication & Structural Debt

- Spin earning formula duplicated across `GamificationService.calculateParticipantSpins` (`apps/api/src/modules/gamification/gamification.service.ts:426-436`) and `PortalService.getGamification` (`apps/api/src/modules/portal/portal.service.ts:351-363`) — notice `PortalService` even includes `+1 spin per 100 XP` whereas `GamificationService` does NOT (contract mismatch between `/games` and `/portal/progress`!). Standardize single source of truth in Batch A/B!
- Slugification helpers duplicated (`questions`, `news-admin.service.ts`, `apps/web/src/app/admin/news/page.tsx`, `apps/web/src/lib/slug-utils.ts`). **(Batch D)**
- Error extraction/toast boilerplate duplicated across admin pages instead of shared hooks/toast helpers. **(Batch D)**
