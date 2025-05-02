-- CreateEnum
CREATE TYPE "QueryMode" AS ENUM ('factCheck', 'create', 'predict', 'shop');

-- CreateEnum
CREATE TYPE "QueryStatus" AS ENUM ('Pending', 'Voting', 'Completed', 'Failed');

-- AlterTable
ALTER TABLE "GraphEdge" ALTER COLUMN "properties" SET DEFAULT '';

-- AlterTable
ALTER TABLE "UserCredit" DROP COLUMN "email",
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "VoteSession" ADD COLUMN     "mode" "QueryMode",
ADD COLUMN     "queryAiCountReq" INTEGER,
ADD COLUMN     "queryCost" DOUBLE PRECISION,
ADD COLUMN     "responseLatency" INTEGER,
ADD COLUMN     "statusProcessing" "QueryStatus",
ADD COLUMN     "userId" TEXT,
ADD COLUMN     "walletPublicKey" TEXT;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "userCreditId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_userCreditId_key" ON "User"("userCreditId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCredit_userId_key" ON "UserCredit"("userId");

-- AddForeignKey
ALTER TABLE "UserCredit" ADD CONSTRAINT "UserCredit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteSession" ADD CONSTRAINT "VoteSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserCredit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

