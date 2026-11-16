# 06 — Security, Privacy & Access Control Audit

## 1. Authentication, Tokens & Transport Security

- **Positives Observed (`auth`, `app.setup.ts`, `api-client.ts`):**
  - Passwords hashed with Argon2id (`memoryCost >= 65536`, `timeCost >= 3`, `parallelism = 1`).
  - Login runs dummy Argon2id hash comparison on missing user to prevent timing enumeration.
  - Refresh tokens are random bytes stored as SHA-256 hashes with rotation & token-family reuse revocation.
  - `HttpOnly; SameSite=Lax; Path=/api/v1/auth` refresh cookie; strict RAM-only `inMemoryAccessToken` on client (`0` JWTs in `localStorage`/`sessionStorage`).
  - `CsrfCookieGuard` + explicit `WEB_ORIGIN` allowlist (no wildcard `*` with credentials).
  - Global `ThrottlerGuard`, `JwtAuthGuard`, `ForcePasswordChangedGuard`, `PermissionsGuard` order in `AppModule`.
  - `AuditLogService.scrubAuditDetails` redacts password/secret/token/hash keys.

## 2. Verified Security Vulnerabilities

| ID | Location | Severity | Vulnerability & Exploit Vector | Remediation Batch |
|---|---|---|---|---|
| `SEC-01` | `apps/api/src/modules/gamification/gamification.controller.ts` & `gamification.service.ts` | **P0** | `@Public()` bypasses `JwtAuthGuard` completely so `@CurrentUser() user` is always `undefined`; `calculateParticipantSpins` uses `OR` over `{ attendeeName: { equals, mode: "insensitive" } }`, `{ ticketCode }`, `{ userId }`. An attacker knowing a student's or attendee's name can view and spend their earned spin quota via `/public/gamification/profile` and `/spin` without owning their ticket or session. An unauthenticated request supplying a `ticketCode` already bound to a `userId` can also impersonate the ticket. | **Batch A** |
| `SEC-02` | `apps/api/src/modules/portal/dto/portal.dto.ts:31` & `portal.service.ts:139` & `portal/profile/page.tsx:97` | **P1** | `UpdateProfileDto.avatarUrl` accepts any string up to 512 chars with no protocol check, permitting `javascript:` or arbitrary data URLs stored in DB and rendered into `<img src>`. | **Batch A** |
| `SEC-03` | `apps/api/src/modules/tour/tour-admin.service.ts:208-218` | **P1** | `saveHotspot` updates hotspot `where: { id: dto.id }` without verifying `hotspot.nodeId === nodeId`, enabling IDOR-like cross-node mutation within `tour:write`. | **Batch A** |
| `SEC-04` | `apps/api/src/modules/portal/portal.service.ts:229` | **P1** | `PortalService.getSchedule` returns `OpenDaySession` items matching `{ deletedAt: null, isPublic: true }` without enforcing `status: PUBLISHED` or parent `event` `PUBLISHED`/`!deletedAt` status, leaking unpublished event schedules to authenticated students. | **Batch A** |
| `SEC-05` | `apps/api/src/modules/public/public.service.ts:1328-1361` | **P2** | `GET /api/v1/public/events/tickets/:ticketCode` returns full unmasked `attendeeName`, `attendeeEmail`, `attendeePhone` anonymously if a ticket code is known/guessed (and `POST /public/events/register` echoes full message containing normalized email on 409 conflict). Review PII exposure masking or rate-limit tightening in Batch B/E. | **Batch B / E** |
| `SEC-06` | `prisma/seed.ts:1311` vs `d03b55a` | **NEEDS DECISION** | Seeded bootstrap admin has `mustChangePassword: false` (`d03b55a`), bypassing `ForcePasswordChangedGuard` on first bootstrap if `seed.ts` runs against a fresh DB with default convenience password (`Admin@123456` in `scripts/sync-single-admin.ts`). Marked for Tech Lead policy resolution (`env`-gated or enforced `true`). | **Decision Required** |
