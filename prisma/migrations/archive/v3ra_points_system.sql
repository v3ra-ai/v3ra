-- V3RA Points System Tables

-- User points balance
CREATE TABLE IF NOT EXISTS "UserPoints" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  "balance" DECIMAL(20, 2) NOT NULL DEFAULT 1000.00, -- Start with 1000 V3RA
  "totalEarned" DECIMAL(20, 2) NOT NULL DEFAULT 1000.00,
  "totalSpent" DECIMAL(20, 2) NOT NULL DEFAULT 0.00,
  "level" INTEGER NOT NULL DEFAULT 1,
  "streak" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "UserPoints_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserPoints_userId_unique" UNIQUE ("userId")
);

-- Points transactions log
CREATE TABLE IF NOT EXISTS "PointsTransaction" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL, -- 'DAILY_BONUS', 'BET_WIN', 'BET_LOSS', 'MARKET_CREATE', 'VERIFICATION_REWARD'
  "amount" DECIMAL(20, 2) NOT NULL,
  "balance" DECIMAL(20, 2) NOT NULL,
  "description" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "PointsTransaction_pkey" PRIMARY KEY ("id")
);

-- Prediction markets
CREATE TABLE IF NOT EXISTS "PredictionMarket" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "predictionId" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'ACTIVE', 'RESOLVED', 'CANCELLED'
  "activationThreshold" DECIMAL(20, 2) NOT NULL DEFAULT 100.00,
  "currentStake" DECIMAL(20, 2) NOT NULL DEFAULT 0.00,
  "yesPool" DECIMAL(20, 2) NOT NULL DEFAULT 0.00,
  "noPool" DECIMAL(20, 2) NOT NULL DEFAULT 0.00,
  "initialProbability" DECIMAL(5, 4) NOT NULL, -- From AI consensus
  "currentProbability" DECIMAL(5, 4) NOT NULL, -- Dynamic based on betting
  "activatedAt" TIMESTAMP(3),
  "resolvedAt" TIMESTAMP(3),
  "winningOutcome" TEXT, -- 'YES' or 'NO'
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "PredictionMarket_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PredictionMarket_predictionId_unique" UNIQUE ("predictionId")
);

-- User bets
CREATE TABLE IF NOT EXISTS "MarketBet" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "marketId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "position" TEXT NOT NULL, -- 'YES' or 'NO'
  "amount" DECIMAL(20, 2) NOT NULL,
  "odds" DECIMAL(10, 4) NOT NULL, -- Odds at time of bet
  "potentialReturn" DECIMAL(20, 2) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'WON', 'LOST', 'CANCELLED'
  "settledAt" TIMESTAMP(3),
  "payout" DECIMAL(20, 2),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "MarketBet_pkey" PRIMARY KEY ("id")
);

-- Market stakes (for activation)
CREATE TABLE IF NOT EXISTS "MarketStake" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "marketId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "amount" DECIMAL(20, 2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "MarketStake_pkey" PRIMARY KEY ("id")
);

-- Indexes for performance
CREATE INDEX "UserPoints_userId_idx" ON "UserPoints"("userId");
CREATE INDEX "PointsTransaction_userId_idx" ON "PointsTransaction"("userId");
CREATE INDEX "PredictionMarket_status_idx" ON "PredictionMarket"("status");
CREATE INDEX "PredictionMarket_creatorId_idx" ON "PredictionMarket"("creatorId");
CREATE INDEX "MarketBet_marketId_idx" ON "MarketBet"("marketId");
CREATE INDEX "MarketBet_userId_idx" ON "MarketBet"("userId");
CREATE INDEX "MarketBet_status_idx" ON "MarketBet"("status");
CREATE INDEX "MarketStake_marketId_idx" ON "MarketStake"("marketId");