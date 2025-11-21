-- DropIndex
DROP INDEX "form_submissions_created_at_idx";

-- DropIndex
DROP INDEX "form_submissions_form_id_idx";

-- CreateIndex
CREATE INDEX "form_submissions_form_id_created_at_idx" ON "form_submissions"("form_id", "created_at" DESC);
