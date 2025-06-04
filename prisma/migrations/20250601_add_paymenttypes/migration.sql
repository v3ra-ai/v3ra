-- AlterTable
ALTER TABLE "PaymentLog" ADD COLUMN     "otherAmount" DOUBLE PRECISION,
ADD COLUMN     "otherPayType" TEXT,
ALTER COLUMN "solAmount" DROP NOT NULL;

