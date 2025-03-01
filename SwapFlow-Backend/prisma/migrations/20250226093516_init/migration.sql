/*
  Warnings:

  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - Added the required column `passwordHash` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ApiKey_userId_idx";

-- DropIndex
DROP INDEX "CompletedTransaction_userId_idx";

-- DropIndex
DROP INDEX "InitialTransaction_userId_idx";

-- DropIndex
DROP INDEX "WalletAddress_userId_idx";

-- AlterTable
ALTER TABLE "ApiKey" ALTER COLUMN "lastUsed" DROP NOT NULL,
ALTER COLUMN "lastUsed" DROP DEFAULT;

-- AlterTable
ALTER TABLE "CompletedTransaction" ALTER COLUMN "status" SET DEFAULT 'success';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "password",
ADD COLUMN     "passwordHash" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "inputMint" TEXT NOT NULL,
    "outputMint" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "slippageBps" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "transactionHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
