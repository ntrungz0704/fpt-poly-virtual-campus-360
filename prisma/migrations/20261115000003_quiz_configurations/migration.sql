-- CreateEnum
CREATE TYPE "QuizConfigStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "quiz_configurations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "event_id" UUID,
    "time_limit_minutes" INTEGER NOT NULL DEFAULT 15,
    "passing_score" INTEGER NOT NULL DEFAULT 70,
    "max_attempts" INTEGER NOT NULL DEFAULT 1,
    "is_shuffle_questions" BOOLEAN NOT NULL DEFAULT false,
    "is_shuffle_options" BOOLEAN NOT NULL DEFAULT false,
    "status" "QuizConfigStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by_id" UUID,
    "updated_by_id" UUID,
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "quiz_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_config_questions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "quiz_config_id" UUID NOT NULL,
    "question_bank_item_id" UUID,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "question_text" TEXT NOT NULL,
    "options_json" JSONB NOT NULL,
    "correct_index" INTEGER NOT NULL,
    "explanation" TEXT,
    "topic" VARCHAR(120) NOT NULL DEFAULT 'Chung',
    "difficulty" "QuestionDifficulty" NOT NULL DEFAULT 'MEDIUM',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_config_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_quiz_configs_status" ON "quiz_configurations"("status");

-- CreateIndex
CREATE INDEX "idx_quiz_configs_event_id" ON "quiz_configurations"("event_id");

-- CreateIndex
CREATE INDEX "idx_quiz_configs_deleted_at" ON "quiz_configurations"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_quiz_configs_created_at" ON "quiz_configurations"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_quiz_config_question_bank_item" ON "quiz_config_questions"("quiz_config_id", "question_bank_item_id");

-- CreateIndex
CREATE INDEX "idx_quiz_config_questions_order" ON "quiz_config_questions"("quiz_config_id", "sort_order");

-- AddForeignKey
ALTER TABLE "quiz_configurations" ADD CONSTRAINT "quiz_configurations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "open_day_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_configurations" ADD CONSTRAINT "quiz_configurations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_configurations" ADD CONSTRAINT "quiz_configurations_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_config_questions" ADD CONSTRAINT "quiz_config_questions_quiz_config_id_fkey" FOREIGN KEY ("quiz_config_id") REFERENCES "quiz_configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_config_questions" ADD CONSTRAINT "quiz_config_questions_question_bank_item_id_fkey" FOREIGN KEY ("question_bank_item_id") REFERENCES "question_bank_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
