-- Add Truth Market fields to VoteSession table
ALTER TABLE "VoteSession" 
ADD COLUMN IF NOT EXISTS "statement" TEXT,
ADD COLUMN IF NOT EXISTS "probability" DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS "averageConfidence" DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS "consensusStrength" VARCHAR(20);

-- Add calibration score to Validator table
ALTER TABLE "Validator"
ADD COLUMN IF NOT EXISTS "calibrationScore" DECIMAL(5,4) DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS "marketPerformance" JSONB DEFAULT '{}';

-- Create MarketPosition table for detailed position tracking
CREATE TABLE IF NOT EXISTS "MarketPosition" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "sessionId" TEXT REFERENCES "VoteSession"("id") ON DELETE CASCADE,
  "validatorId" TEXT REFERENCES "Validator"("id") ON DELETE CASCADE,
  "position" VARCHAR(10) NOT NULL CHECK ("position" IN ('YES', 'NO', 'UNCERTAIN')),
  "confidence" INTEGER NOT NULL CHECK ("confidence" >= 0 AND "confidence" <= 100),
  "reasoning" TEXT,
  "responseTime" INTEGER,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT "MarketPosition_sessionId_validatorId_key" UNIQUE ("sessionId", "validatorId")
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_market_position_session" ON "MarketPosition"("sessionId");
CREATE INDEX IF NOT EXISTS "idx_market_position_validator" ON "MarketPosition"("validatorId");
CREATE INDEX IF NOT EXISTS "idx_vote_session_probability" ON "VoteSession"("probability");
CREATE INDEX IF NOT EXISTS "idx_vote_session_consensus_strength" ON "VoteSession"("consensusStrength");

-- Add comment
COMMENT ON COLUMN "VoteSession"."probability" IS 'Truth Market consensus probability (0-100)';
COMMENT ON COLUMN "VoteSession"."averageConfidence" IS 'Average confidence of all AI traders';
COMMENT ON COLUMN "VoteSession"."consensusStrength" IS 'STRONG, MODERATE, or WEAK consensus';
COMMENT ON COLUMN "Validator"."calibrationScore" IS 'How well calibrated the validator predictions are (0-1)';
COMMENT ON COLUMN "Validator"."marketPerformance" IS 'Performance metrics by topic/category';