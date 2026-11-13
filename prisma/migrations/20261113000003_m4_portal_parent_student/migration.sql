-- CreateEnum
CREATE TYPE "LinkStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "student_code" VARCHAR(32),
ADD COLUMN IF NOT EXISTS "major" VARCHAR(120),
ADD COLUMN IF NOT EXISTS "avatar_url" VARCHAR(512),
ADD COLUMN IF NOT EXISTS "bio" VARCHAR(500);

-- CreateTable
CREATE TABLE IF NOT EXISTS "parent_student_links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "parent_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "status" "LinkStatus" NOT NULL DEFAULT 'PENDING',
    "relationship" VARCHAR(64),
    "notes" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parent_student_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_parent_student_links_parent_id" ON "parent_student_links"("parent_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_parent_student_links_student_id" ON "parent_student_links"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "parent_student_links_parent_id_student_id_key" ON "parent_student_links"("parent_id", "student_id");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'parent_student_links_parent_id_fkey'
    ) THEN
        ALTER TABLE "parent_student_links" ADD CONSTRAINT "parent_student_links_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'parent_student_links_student_id_fkey'
    ) THEN
        ALTER TABLE "parent_student_links" ADD CONSTRAINT "parent_student_links_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
