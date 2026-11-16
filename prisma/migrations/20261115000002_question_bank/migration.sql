-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'QuestionDifficulty') THEN
        CREATE TYPE "QuestionDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'QuestionReviewStatus') THEN
        CREATE TYPE "QuestionReviewStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'REJECTED');
    END IF;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "question_bank_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question_text" TEXT NOT NULL,
    "options_json" JSONB NOT NULL,
    "correct_index" INTEGER NOT NULL,
    "explanation" TEXT,
    "topic" VARCHAR(120) NOT NULL DEFAULT 'Chung',
    "difficulty" "QuestionDifficulty" NOT NULL DEFAULT 'MEDIUM',
    "status" "QuestionReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "tags" JSONB NOT NULL DEFAULT '[]',
    "created_by_id" UUID,
    "updated_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "question_bank_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_question_bank_status" ON "question_bank_items"("status");
CREATE INDEX IF NOT EXISTS "idx_question_bank_difficulty" ON "question_bank_items"("difficulty");
CREATE INDEX IF NOT EXISTS "idx_question_bank_topic" ON "question_bank_items"("topic");
CREATE INDEX IF NOT EXISTS "idx_question_bank_deleted_at" ON "question_bank_items"("deleted_at");
CREATE INDEX IF NOT EXISTS "idx_question_bank_created_at" ON "question_bank_items"("created_at");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'question_bank_items_created_by_id_fkey'
    ) THEN
        ALTER TABLE "question_bank_items" ADD CONSTRAINT "question_bank_items_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'question_bank_items_updated_by_id_fkey'
    ) THEN
        ALTER TABLE "question_bank_items" ADD CONSTRAINT "question_bank_items_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
