-- CreateEnum
CREATE TYPE "QuizAttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "quiz_config_attempts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "quiz_config_id" UUID NOT NULL,
    "attempt_number" INTEGER NOT NULL,
    "status" "QuizAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "submitted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_config_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_config_attempt_answers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "attempt_id" UUID NOT NULL,
    "quiz_config_question_id" UUID NOT NULL,
    "displayed_order" INTEGER NOT NULL,
    "option_order_json" JSONB NOT NULL,
    "selected_option_index" INTEGER,
    "answered_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_config_attempt_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_quiz_config_attempts_user_id" ON "quiz_config_attempts"("user_id");

-- CreateIndex
CREATE INDEX "idx_quiz_config_attempts_quiz_config_id" ON "quiz_config_attempts"("quiz_config_id");

-- CreateIndex
CREATE INDEX "idx_quiz_config_attempts_status" ON "quiz_config_attempts"("status");

-- CreateIndex
CREATE INDEX "idx_quiz_config_attempts_expires_at" ON "quiz_config_attempts"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_quiz_config_attempt_user_quiz_number" ON "quiz_config_attempts"("user_id", "quiz_config_id", "attempt_number");

-- CreateIndex
CREATE INDEX "idx_quiz_config_attempt_answers_order" ON "quiz_config_attempt_answers"("attempt_id", "displayed_order");

-- CreateIndex
CREATE UNIQUE INDEX "uq_quiz_config_attempt_answer_attempt_question" ON "quiz_config_attempt_answers"("attempt_id", "quiz_config_question_id");

-- AddForeignKey
ALTER TABLE "quiz_config_attempts" ADD CONSTRAINT "quiz_config_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_config_attempts" ADD CONSTRAINT "quiz_config_attempts_quiz_config_id_fkey" FOREIGN KEY ("quiz_config_id") REFERENCES "quiz_configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_config_attempt_answers" ADD CONSTRAINT "quiz_config_attempt_answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "quiz_config_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_config_attempt_answers" ADD CONSTRAINT "quiz_config_attempt_answers_quiz_config_question_id_fkey" FOREIGN KEY ("quiz_config_question_id") REFERENCES "quiz_config_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
