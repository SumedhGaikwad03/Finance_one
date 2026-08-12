-- DropIndex
DROP INDEX "SkillEmbedding_skillId_idx";

-- CreateIndex
CREATE INDEX "SkillEmbedding_skillId_exampleText_idx" ON "SkillEmbedding"("skillId", "exampleText");
