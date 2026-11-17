-- ============================================================================
-- Audit Batch B Targeted Remediation (B-B1 / PUBLIC-REG-RACE):
-- Enforce active attendee email uniqueness per Open Day event at the database
-- layer using a PostgreSQL partial unique index.
-- Verified against prisma/schema.prisma: event_participations has no deleted_at
-- column; soft/cancelled lifecycle uses participation_status <> 'CANCELLED',
-- and attendee_email is nullable for portal-provisioned rows.
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS "uq_event_participations_active_email"
  ON "event_participations" ("event_id", LOWER("attendee_email"))
  WHERE "attendee_email" IS NOT NULL
    AND "participation_status" <> 'CANCELLED';
