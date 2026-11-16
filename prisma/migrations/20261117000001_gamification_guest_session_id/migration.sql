-- ============================================================================
-- Audit Batch A Targeted Remediation (B-A1): Anonymous Guest Session Identity
-- Adds nullable guest_session_id column + index to quiz_attempts, xp_ledgers,
-- and user_spin_histories without altering any prior migrations.
-- ============================================================================

ALTER TABLE "quiz_attempts"
  ADD COLUMN IF NOT EXISTS "guest_session_id" VARCHAR(64);

ALTER TABLE "xp_ledgers"
  ADD COLUMN IF NOT EXISTS "guest_session_id" VARCHAR(64);

ALTER TABLE "user_spin_histories"
  ADD COLUMN IF NOT EXISTS "guest_session_id" VARCHAR(64);

CREATE INDEX IF NOT EXISTS "idx_quiz_attempts_guest_session_id"
  ON "quiz_attempts"("guest_session_id");

CREATE INDEX IF NOT EXISTS "idx_xp_ledgers_guest_session_id"
  ON "xp_ledgers"("guest_session_id");

CREATE INDEX IF NOT EXISTS "idx_user_spin_histories_guest_session_id"
  ON "user_spin_histories"("guest_session_id");
