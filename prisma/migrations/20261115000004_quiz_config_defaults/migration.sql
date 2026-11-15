-- AlterTable: Update default values for quiz_configurations to match unified specs (3, true, true)
ALTER TABLE "quiz_configurations" ALTER COLUMN "max_attempts" SET DEFAULT 3;
ALTER TABLE "quiz_configurations" ALTER COLUMN "is_shuffle_questions" SET DEFAULT true;
ALTER TABLE "quiz_configurations" ALTER COLUMN "is_shuffle_options" SET DEFAULT true;
