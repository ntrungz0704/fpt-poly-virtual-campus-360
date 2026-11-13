-- ============================================================================
-- Milestone M3D: Gamification Migration
-- Adds quiz_attempts, xp_ledgers, spin_reward_configs, user_spin_histories
-- ============================================================================

-- CreateTable
CREATE TABLE "quiz_attempts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "user_id" UUID,
    "ticket_code" VARCHAR(64),
    "attendee_name" VARCHAR(160) NOT NULL,
    "total_questions" INTEGER NOT NULL,
    "correct_count" INTEGER NOT NULL,
    "score_percent" INTEGER NOT NULL,
    "score_xp" INTEGER NOT NULL DEFAULT 0,
    "answers_json" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "xp_ledgers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "ticket_code" VARCHAR(64),
    "attendee_name" VARCHAR(160) NOT NULL,
    "amount_xp" INTEGER NOT NULL,
    "source" VARCHAR(64) NOT NULL,
    "reference_id" VARCHAR(128),
    "metadata_json" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "xp_ledgers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spin_reward_configs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "label" VARCHAR(120) NOT NULL,
    "reward_type" VARCHAR(32) NOT NULL,
    "amount_xp" INTEGER NOT NULL DEFAULT 0,
    "probability_weight" INTEGER NOT NULL DEFAULT 10,
    "color_hex" VARCHAR(16) NOT NULL DEFAULT '#F27024',
    "icon" VARCHAR(64) NOT NULL DEFAULT 'stars',
    "stock_quantity" INTEGER,
    "remaining_quantity" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spin_reward_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_spin_histories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "ticket_code" VARCHAR(64),
    "attendee_name" VARCHAR(160) NOT NULL,
    "reward_config_id" UUID NOT NULL,
    "reward_label" VARCHAR(120) NOT NULL,
    "reward_type" VARCHAR(32) NOT NULL,
    "awarded_xp" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_spin_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_quiz_attempts_event_id" ON "quiz_attempts"("event_id");
CREATE INDEX "idx_quiz_attempts_ticket_code" ON "quiz_attempts"("ticket_code");
CREATE INDEX "idx_quiz_attempts_user_id" ON "quiz_attempts"("user_id");

-- CreateIndex
CREATE INDEX "idx_xp_ledgers_ticket_code" ON "xp_ledgers"("ticket_code");
CREATE INDEX "idx_xp_ledgers_user_id" ON "xp_ledgers"("user_id");
CREATE INDEX "idx_xp_ledgers_source_reference" ON "xp_ledgers"("source", "reference_id");

-- CreateIndex
CREATE INDEX "idx_user_spin_histories_ticket_code" ON "user_spin_histories"("ticket_code");
CREATE INDEX "idx_user_spin_histories_user_id" ON "user_spin_histories"("user_id");

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "open_day_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xp_ledgers" ADD CONSTRAINT "xp_ledgers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_spin_histories" ADD CONSTRAINT "user_spin_histories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "user_spin_histories" ADD CONSTRAINT "user_spin_histories_reward_config_id_fkey" FOREIGN KEY ("reward_config_id") REFERENCES "spin_reward_configs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
