-- AlterTable
ALTER TABLE "form_submissions" ADD COLUMN     "completed_at" TIMESTAMP(3),
ADD COLUMN     "started_at" TIMESTAMP(3),
ADD COLUMN     "time_spent" INTEGER;

-- AlterTable
ALTER TABLE "forms" ADD COLUMN     "last_response_at" TIMESTAMP(3),
ADD COLUMN     "total_responses" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_views" INTEGER NOT NULL DEFAULT 0;
