-- Add foreign key constraints for UserPoints
ALTER TABLE "UserPoints" 
ADD CONSTRAINT "UserPoints_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

-- Add foreign key constraints for PointsTransaction
ALTER TABLE "PointsTransaction" 
ADD CONSTRAINT "PointsTransaction_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

-- Add foreign key constraints for PredictionMarket
ALTER TABLE "PredictionMarket" 
ADD CONSTRAINT "PredictionMarket_creatorId_fkey" 
FOREIGN KEY ("creatorId") REFERENCES "User"("id");

-- Add foreign key constraints for MarketBet
ALTER TABLE "MarketBet" 
ADD CONSTRAINT "MarketBet_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id");

-- Add missing columns to PredictionMarket
ALTER TABLE "PredictionMarket" 
ADD COLUMN IF NOT EXISTS "totalStake" DECIMAL(20, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS "isResolved" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "finalOutcome" TEXT;

-- Add version column for optimistic locking
ALTER TABLE "UserPoints" 
ADD COLUMN IF NOT EXISTS "version" INTEGER DEFAULT 0;

-- Add check constraints
ALTER TABLE "UserPoints" 
ADD CONSTRAINT "UserPoints_balance_check" CHECK ("balance" >= 0);

ALTER TABLE "MarketBet" 
ADD CONSTRAINT "MarketBet_amount_check" CHECK ("amount" > 0);

-- Add new transaction types to enum (if PostgreSQL supports it)
-- Note: This might need to be done differently depending on your PostgreSQL version
-- For older versions, you might need to recreate the enum

-- Add composite index for better performance
CREATE INDEX IF NOT EXISTS "PointsTransaction_userId_createdAt_idx" 
ON "PointsTransaction"("userId", "createdAt" DESC);

-- Add new enum values (PostgreSQL 9.1+)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'BET_PLACED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PointsTransactionType')) THEN
    ALTER TYPE "PointsTransactionType" ADD VALUE 'BET_PLACED';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PREDICTION_WIN' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PointsTransactionType')) THEN
    ALTER TYPE "PointsTransactionType" ADD VALUE 'PREDICTION_WIN';
  END IF;
END$$;