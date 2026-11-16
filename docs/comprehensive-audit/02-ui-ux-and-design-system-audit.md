# 02 — UI/UX & Design System Audit

## 1. Visual System, Layout & Accessibility

- **Typography & Tokens (`apps/web/src/app/layout.tsx`, `globals.css`):** Plus Jakarta Sans and Inter Google Fonts with semantic utility tokens (`bg-surface`, `text-on-surface`, `text-secondary`, `ui-card`, `ui-btn`).
- **Immersive Layout & Navigation (`PublicHeader.tsx`):** Clean responsive navbar separating 5 primary links (`/campus`, `/map`, `/locations`, `/events`, `/games`) and 3 secondary items under "Thêm" (`/news`, `/about`, `/contact`), mobile drawer with Escape/scroll-lock cleanup.

## 2. Verified UI/UX Defects

| ID | File | Severity | Observed Defect | Planned Batch |
|---|---|---|---|---|
| `UI-01` | `apps/web/src/components/ui/QRCodeSVG.tsx` | **P0** | Data modules overwrite ISO-18004 format information bits; quiet-zone margin is `2` instead of `4` -> unscannable QR tickets on `/events` and `/portal/tickets`. | **Batch A** |
| `UI-02` | `apps/web/src/components/events/EventsView.tsx:128-149` | **P1/P2** | Renders static hardcoded `12 : 08 : 45 : 30` HTML labeled "Live Countdown Timer Widget" that never ticks or reflects `event.eventDate`. | **Batch C** |
| `UI-03` | `apps/web/src/app/(portal)/portal/schedule/page.tsx:116-118` | **P2** | Only maps `period === "MORNING"` vs `"Chiều"` (`NOON` is mislabeled `"Chiều"`) and lacks `"NOON"` filter pill. | **Batch C** |
| `UI-04` | `apps/web/src/app/(portal)/portal/profile/page.tsx:68`, `parent/page.tsx:81,95` | **P2** | Uses blocking `window.alert(...)` on API mutation/load failure instead of inline banner or `StatusToast`. | **Batch C** |
| `UI-05` | `apps/web/src/components/admin/AdminOverviewContent.tsx:14-45` | **P2** | `QUICK_WORKSPACES` links 5 admin areas but omits `/admin/questions` and `/admin/news`, creating dashboard vs sidebar navigation inconsistency. | **Batch C** |
| `UI-06` | `apps/web/src/app/(portal)/portal/profile/page.tsx:97` | **P1** | Renders `profile.avatarUrl` in `<img src>` without URI protocol sanitization (paired with missing DTO validation in backend). | **Batch A / C** |
| `UI-07` | `apps/web/src/app/(public)/locations/[slug]/page.tsx:141-148` | **P2** | Hardcodes `"Sức chứa tối đa: 60 Sinh viên"` and `"Trang bị chính: GPU RTX 4080"` on all location detail pages regardless of facility type (library, auditorium, sports complex). | **Batch C** |
| `UI-08` | `apps/web/src/app/(public)/contact/page.tsx:9-22` | **P2** | Pre-fills dummy personal info (`"Nguyễn Văn An"`, `"0987 654 321"`, `"an.nguyen@gmail.com"`) and simulates submission success (`submitted = true`) with no backend delivery while promising a 24h callback. | **Batch C** |
| `UI-09` | `apps/web/src/components/admin/AdminDashboardMetrics.tsx` & `AdminRecentActivityLog.tsx` | **P2** | Displays fabricated static KPIs (`128,450`, `3,820`, `95.5%`, `99.98%`) and stale Nov 10-11 static logs instead of real API counts and `/admin/audit-logs`. | **Batch B / C** |
| `UI-10` | `apps/web/src/components/events/TicketRegistrationModal.tsx` | **P1** | Error handling for `409 Conflict` duplicate email (`status === 409`) is unreachable while `registerPublicOpenDay` swallows errors; loading stale `ticketCode` from `localStorage` also needs `404` cache invalidation so deleted/scratch DB tickets are cleared. | **Batch A** |
