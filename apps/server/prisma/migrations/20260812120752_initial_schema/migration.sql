-- CreateTable

-- this is to add vectors 
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE "SkillEmbedding" (
    "id" SERIAL NOT NULL,
    "skillId" TEXT NOT NULL,
    "exampleText" TEXT NOT NULL,
    "embedding" vector(2560) NOT NULL,
    "model" TEXT NOT NULL,
    "dimensions" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SkillEmbedding_skillId_idx" ON "SkillEmbedding"("skillId");
