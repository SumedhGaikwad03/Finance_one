-- CreateEnum
CREATE TYPE "Category" AS ENUM ('FOOD', 'FUEL', 'SHOPPING', 'BILLS', 'ENTERTAINMENT', 'HEALTH', 'TRAVEL', 'EDUCATION', 'SUBSCRIPTION', 'GIFT', 'OTHER');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('ESSENTIAL', 'GOOD_TO_HAVE', 'LUXURY');

-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "category" "Category" NOT NULL,
    "priority" "Priority" NOT NULL,
    "title" TEXT,
    "notes" TEXT,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
