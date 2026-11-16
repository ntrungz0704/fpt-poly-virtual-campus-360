# 09 — Routing, Navigation, SEO & Content Audit

## 1. Public & Protected Routing Table (`28` Verified Routes)

- **`(public)`:** `/`, `/about`, `/contact`, `/events`, `/games`, `/locations`, `/locations/[slug]`, `/news`, `/news/[slug]`
- **`(immersive)`:** `/campus`, `/map`
- **`(auth)`:** `/login`, `/change-password`
- **`(portal)`:** `/portal`, `/portal/profile`, `/portal/progress`, `/portal/quiz`, `/portal/schedule`, `/portal/tickets`, `/parent`
- **`/admin`:** `/admin`, `/admin/events`, `/admin/locations`, `/admin/media`, `/admin/news`, `/admin/questions`, `/admin/users`, `/admin/virtual-tour`

## 2. Navigation, 404 & SEO Issues

1. **Broken 404 on `/locations/[slug]` (`apps/web/src/lib/public/public-api.ts:398`):**
   - `fetchPublicLocationBySlug(slug)` catches `404` and returns `CAMPUS_LOCATIONS[0]`, so `(public)/locations/[slug]/page.tsx` renders Innovation Lobby instead of `NotFoundState` when visiting an unknown slug (e.g. `/locations/invalid-slug`). **(Fixed in Batch A)**
2. **Stale Sitemap (`apps/web/src/app/sitemap.ts`):**
   - Imports deprecated static `CAMPUS_GUIDE_ARTICLES` (3 hardcoded mock articles) and static `CAMPUS_LOCATIONS` rather than published DB news & locations from backend API, and hardcodes `lastModified = new Date("2026-11-11T00:00:00.000Z")`. **(Batch C)**
3. **Admin Dashboard Navigation Gap (`apps/web/src/components/admin/AdminOverviewContent.tsx:14-45`):**
   - `QUICK_WORKSPACES` renders shortcuts for `/admin/locations`, `/admin/virtual-tour`, `/admin/events`, `/admin/media`, `/admin/users`, omitting `/admin/questions` (Question Bank) and `/admin/news` (News CMS), which only appear in sidebar navigation. **(Batch C)**
4. **Campus Orientation / Footer / Metadata:**
   - Need end-to-end check on `/about` claims (e.g., whether QTSC Innovation & Building T are distinct vs `"Tòa nhà Innovation — Tòa T"`, `"42+ Điểm nhìn VR 360°"`) in **Batch C** & Section 19 review.
