-- AlterTable
ALTER TABLE "quiz_config_attempts" ADD COLUMN "total_questions" INTEGER,
ADD COLUMN "answered_count" INTEGER,
ADD COLUMN "correct_count" INTEGER,
ADD COLUMN "score_percent" INTEGER,
ADD COLUMN "passed" BOOLEAN,
ADD COLUMN "base_xp" INTEGER,
ADD COLUMN "bonus_xp" INTEGER,
ADD COLUMN "awarded_xp" INTEGER;

-- AlterTable
ALTER TABLE "xp_ledgers" ADD COLUMN "idempotency_key" VARCHAR(160);

-- CreateIndex
CREATE UNIQUE INDEX "uq_xp_ledgers_idempotency_key" ON "xp_ledgers"("idempotency_key");
