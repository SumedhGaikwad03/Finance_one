/*
  Warnings:

  - A unique constraint covering the columns `[skillId,exampleText]` on the table `SkillEmbedding` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "SkillEmbedding_skillId_exampleText_idx";

-- CreateIndex
CREATE UNIQUE INDEX "SkillEmbedding_skillId_exampleText_key" ON "SkillEmbedding"("skillId", "exampleText");
