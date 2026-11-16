-- CreateTable
CREATE TABLE IF NOT EXISTS "quiz_xp_claims" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "quiz_config_id" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "awarded_xp" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_xp_claims_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "fk_quiz_xp_claims_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "fk_quiz_xp_claims_quiz_config" FOREIGN KEY ("quiz_config_id") REFERENCES "quiz_configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "fk_quiz_xp_claims_attempt" FOREIGN KEY ("attempt_id") REFERENCES "quiz_config_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "uq_quiz_xp_claims_user_quiz" ON "quiz_xp_claims"("user_id", "quiz_config_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_quiz_xp_claims_user_id" ON "quiz_xp_claims"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_quiz_xp_claims_attempt_id" ON "quiz_xp_claims"("attempt_id");
