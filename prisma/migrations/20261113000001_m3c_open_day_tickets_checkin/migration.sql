-- AlterEnum
ALTER TYPE "ParticipationStatus" ADD VALUE 'CHECKED_IN';

-- DropForeignKey
ALTER TABLE "event_participations" DROP CONSTRAINT IF EXISTS "event_participations_user_id_fkey";

-- AlterTable
ALTER TABLE "event_participations" ADD COLUMN     "attendee_email" VARCHAR(160),
ADD COLUMN     "attendee_name" VARCHAR(160),
ADD COLUMN     "attendee_phone" VARCHAR(32),
ADD COLUMN     "checked_in_at" TIMESTAMPTZ(6),
ADD COLUMN     "checked_in_by" UUID,
ADD COLUMN     "metadata_json" JSONB,
ADD COLUMN     "ticket_code" VARCHAR(32) NOT NULL,
ALTER COLUMN "user_id" DROP NOT NULL,
ALTER COLUMN "participation_status" SET DEFAULT 'CONFIRMED';

-- CreateIndex
CREATE UNIQUE INDEX "event_participations_ticket_code_key" ON "event_participations"("ticket_code");

-- CreateIndex
CREATE INDEX "idx_event_participations_event_id" ON "event_participations"("event_id");

-- CreateIndex
CREATE INDEX "idx_event_participations_attendee_email" ON "event_participations"("attendee_email");

-- AddForeignKey
ALTER TABLE "event_participations" ADD CONSTRAINT "event_participations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participations" ADD CONSTRAINT "event_participations_checked_in_by_fkey" FOREIGN KEY ("checked_in_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
