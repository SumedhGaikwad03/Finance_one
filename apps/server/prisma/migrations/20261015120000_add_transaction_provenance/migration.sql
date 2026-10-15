-- CreateEnum
CREATE TYPE "TransactionSource" AS ENUM ('MANUAL', 'CSV_IMPORT', 'BANK_STATEMENT', 'RECEIPT_OCR', 'SYSTEM');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "source" "TransactionSource" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "sourceMetadata" JSONB;

-- CreateIndex
CREATE INDEX "Transaction_userId_transactionDate_idx" ON "Transaction"("userId", "transactionDate");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_userId_source_externalId_key" ON "Transaction"("userId", "source", "externalId");
