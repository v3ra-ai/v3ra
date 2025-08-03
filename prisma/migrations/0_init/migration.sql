-- CreateEnum
CREATE TYPE "LLMHealthStatus" AS ENUM ('healthy', 'degraded', 'deprecated', 'offline');

-- CreateEnum
CREATE TYPE "QueryMode" AS ENUM ('factCheck', 'create', 'predict', 'shop');

-- CreateEnum
CREATE TYPE "QueryStatus" AS ENUM ('Pending', 'Voting', 'Completed', 'Failed');

-- CreateEnum
CREATE TYPE "ResolutionStatus" AS ENUM ('pending', 'resolved', 'disputed', 'unresolvable');

-- CreateEnum
CREATE TYPE "ResolutionMethod" AS ENUM ('automated', 'user_verified', 'consensus', 'official_source');

-- CreateEnum
CREATE TYPE "ConfidenceLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "PointsTransactionType" AS ENUM ('DAILY_BONUS', 'BET_WIN', 'BET_LOSS', 'BET_PLACED', 'MARKET_CREATE', 'VERIFICATION_REWARD', 'STAKE_REFUND', 'INITIAL_GRANT', 'PREDICTION_WIN');

-- CreateEnum
CREATE TYPE "MarketStatus" AS ENUM ('PENDING', 'ACTIVE', 'RESOLVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BetPosition" AS ENUM ('YES', 'NO');

-- CreateEnum
CREATE TYPE "BetStatus" AS ENUM ('PENDING', 'WON', 'LOST', 'CANCELLED');

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsed" TIMESTAMP(3),

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "vote_session_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "favoriteType" TEXT,
    "title" TEXT,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "rating" TEXT NOT NULL DEFAULT 'thumbs_up',
    "explanation" TEXT,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "includeBrowserInfo" BOOLEAN NOT NULL DEFAULT true,
    "browserInfo" JSONB,
    "url" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GraphEdge" (
    "id" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "weight" DOUBLE PRECISION,
    "properties" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validatorId" TEXT,
    "voteSessionId" TEXT,

    CONSTRAINT "GraphEdge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LLMHealthMetric" (
    "id" TEXT NOT NULL,
    "providerName" VARCHAR(50) NOT NULL,
    "modelName" VARCHAR(100) NOT NULL,
    "status" "LLMHealthStatus" NOT NULL DEFAULT 'healthy',
    "errorRate" DECIMAL(5,2),
    "avgLatency" INTEGER,
    "successRate" DECIMAL(5,2),
    "lastSuccessAt" TIMESTAMP(3),
    "lastErrorAt" TIMESTAMP(3),
    "lastErrorMessage" TEXT,
    "totalRequests" INTEGER NOT NULL DEFAULT 0,
    "failedRequests" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LLMHealthMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LLMHealthProbe" (
    "id" TEXT NOT NULL,
    "providerName" VARCHAR(50) NOT NULL,
    "modelName" VARCHAR(100) NOT NULL,
    "probeType" VARCHAR(50) NOT NULL,
    "success" BOOLEAN NOT NULL,
    "responseTimeMs" INTEGER,
    "errorMessage" TEXT,
    "httpStatus" INTEGER,
    "testedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LLMHealthProbe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelDeprecationAlert" (
    "id" TEXT NOT NULL,
    "modelName" VARCHAR(100) NOT NULL,
    "providerName" VARCHAR(50) NOT NULL,
    "deprecatedAt" TIMESTAMP(3) NOT NULL,
    "replacementModel" VARCHAR(100),
    "alertSent" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "errorSample" TEXT,
    "affectedValidators" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModelDeprecationAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentLog" (
    "id" TEXT NOT NULL,
    "walletPublicKey" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "solAmount" DOUBLE PRECISION,
    "otherAmount" DOUBLE PRECISION,
    "otherPayType" TEXT,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reply" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "threadId" TEXT NOT NULL,

    CONSTRAINT "Reply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Thread" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "voteSessionId" TEXT NOT NULL,
    "downvotes" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Thread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userCreditId" TEXT,
    "freeCredits" INTEGER NOT NULL DEFAULT 10,
    "lastResetDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "username" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCredit" (
    "id" TEXT NOT NULL,
    "walletPublicKey" TEXT NOT NULL,
    "credits" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "UserCredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Validator" (
    "id" TEXT NOT NULL,
    "profileName" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "isLeader" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "avatarUrl" TEXT,
    "validatorType" TEXT,
    "reliability" DOUBLE PRECISION DEFAULT 0.0,
    "totalVotes" INTEGER NOT NULL DEFAULT 0,
    "correctVotes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Validator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidatorKey" (
    "id" TEXT NOT NULL,
    "validatorId" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ValidatorKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidatorResponse" (
    "id" TEXT NOT NULL,
    "vote" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION DEFAULT 0.5,
    "rationaleEmbedding" TEXT,
    "latency" INTEGER,
    "matchedConsensus" BOOLEAN,
    "voteSessionId" TEXT NOT NULL,
    "validatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "error" TEXT,

    CONSTRAINT "ValidatorResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoteSession" (
    "id" TEXT NOT NULL,
    "queryText" TEXT NOT NULL,
    "context" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isConsensusReached" BOOLEAN NOT NULL,
    "consensusValue" BOOLEAN,
    "votesYes" INTEGER NOT NULL DEFAULT 0,
    "votesNo" INTEGER NOT NULL DEFAULT 0,
    "notVoted" INTEGER NOT NULL DEFAULT 0,
    "leaderId" TEXT,
    "txHash" TEXT,
    "blockchainNetwork" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "mode" "QueryMode",
    "queryAiCountReq" INTEGER,
    "queryCost" DOUBLE PRECISION,
    "responseLatency" INTEGER,
    "statusProcessing" "QueryStatus",
    "userId" TEXT,
    "walletPublicKey" TEXT,

    CONSTRAINT "VoteSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_audit_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "operation" TEXT NOT NULL,
    "credit_type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance_before" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "reason" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "ip_address" INET,
    "user_agent" TEXT,

    CONSTRAINT "credit_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "voteSessionId" TEXT,
    "queryText" TEXT NOT NULL,
    "category" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolutionDate" TIMESTAMP(3),
    "resolutionStatus" "ResolutionStatus" NOT NULL DEFAULT 'pending',
    "createdBy" VARCHAR(100),
    "metadata" JSONB,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PredictionOutcome" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "predictionId" TEXT NOT NULL,
    "outcomeText" TEXT NOT NULL,
    "consensusProbability" DECIMAL(5,4),
    "modelAgreement" DECIMAL(5,4),
    "modelCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PredictionOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelPrediction" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "predictionId" TEXT NOT NULL,
    "modelName" VARCHAR(100) NOT NULL,
    "outcomeText" TEXT NOT NULL,
    "probability" DECIMAL(5,4),
    "confidenceLevel" "ConfidenceLevel",
    "reasoning" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModelPrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PredictionResolution" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "predictionId" TEXT NOT NULL,
    "actualOutcome" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolutionMethod" "ResolutionMethod",
    "verificationSource" TEXT,
    "evidence" TEXT,
    "resolverId" VARCHAR(100),
    "confidenceScore" DECIMAL(3,2),
    "disputeCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PredictionResolution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelPerformance" (
    "modelName" VARCHAR(100) NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "totalPredictions" INTEGER NOT NULL DEFAULT 0,
    "accuratePredictions" INTEGER NOT NULL DEFAULT 0,
    "brierScore" DECIMAL(5,4),
    "calibrationScore" DECIMAL(5,4),
    "logScore" DECIMAL(6,4),
    "category" VARCHAR(50) NOT NULL DEFAULT 'general',
    "metadata" JSONB,

    CONSTRAINT "ModelPerformance_pkey" PRIMARY KEY ("modelName","periodStart","category")
);

-- CreateTable
CREATE TABLE "VerificationVote" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "predictionId" TEXT NOT NULL,
    "userId" VARCHAR(100) NOT NULL,
    "votedOutcome" TEXT NOT NULL,
    "evidence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPoints" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "balance" DECIMAL(20,2) NOT NULL DEFAULT 1000.00,
    "totalEarned" DECIMAL(20,2) NOT NULL DEFAULT 1000.00,
    "totalSpent" DECIMAL(20,2) NOT NULL DEFAULT 0.00,
    "level" INTEGER NOT NULL DEFAULT 1,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointsTransaction" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "type" "PointsTransactionType" NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,
    "balance" DECIMAL(20,2) NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointsTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PredictionMarket" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "predictionId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "status" "MarketStatus" NOT NULL DEFAULT 'PENDING',
    "activationThreshold" DECIMAL(20,2) NOT NULL DEFAULT 100.00,
    "currentStake" DECIMAL(20,2) NOT NULL DEFAULT 0.00,
    "totalStake" DECIMAL(20,2) NOT NULL DEFAULT 0.00,
    "yesPool" DECIMAL(20,2) NOT NULL DEFAULT 0.00,
    "noPool" DECIMAL(20,2) NOT NULL DEFAULT 0.00,
    "initialProbability" DECIMAL(5,4) NOT NULL,
    "currentProbability" DECIMAL(5,4) NOT NULL,
    "activatedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "winningOutcome" TEXT,
    "finalOutcome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PredictionMarket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketBet" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "marketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "position" "BetPosition" NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,
    "odds" DECIMAL(10,4) NOT NULL,
    "potentialReturn" DECIMAL(20,2) NOT NULL,
    "status" "BetStatus" NOT NULL DEFAULT 'PENDING',
    "settledAt" TIMESTAMP(3),
    "payout" DECIMAL(20,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketBet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketStake" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "marketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketStake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_demographics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "age_group" VARCHAR(20),
    "country" VARCHAR(2),
    "occupation_category" VARCHAR(50),
    "ai_experience_level" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_demographics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vote_details" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vote_session_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "winning_validator_id" TEXT NOT NULL,
    "losing_validator_id" TEXT NOT NULL,
    "vote_reason" VARCHAR(50) NOT NULL,
    "vote_strength" INTEGER NOT NULL,
    "time_to_decide" INTEGER NOT NULL,
    "scratch_card_reward" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vote_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_matchups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "model_a" VARCHAR(100) NOT NULL,
    "model_b" VARCHAR(100) NOT NULL,
    "model_a_wins" INTEGER NOT NULL DEFAULT 0,
    "model_b_wins" INTEGER NOT NULL DEFAULT 0,
    "total_comparisons" INTEGER NOT NULL DEFAULT 0,
    "category" VARCHAR(50) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "model_matchups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_elo_ratings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "model_name" VARCHAR(100) NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "elo_rating" INTEGER NOT NULL DEFAULT 1500,
    "games_played" INTEGER NOT NULL DEFAULT 0,
    "peak_rating" INTEGER NOT NULL DEFAULT 1500,
    "category" VARCHAR(50) NOT NULL DEFAULT 'overall',
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "model_elo_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_models" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "model_path" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "provider" VARCHAR(100) NOT NULL,
    "category" VARCHAR(50),
    "is_active" BOOLEAN DEFAULT true,
    "capabilities" JSONB DEFAULT '[]',
    "strengths" JSONB DEFAULT '[]',
    "cost_per_comparison" DECIMAL(10,4),
    "icon" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_models_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApiKey_provider_isActive_idx" ON "ApiKey"("provider", "isActive");

-- CreateIndex
CREATE INDEX "idx_api_key_provider" ON "ApiKey"("provider", "isActive");

-- CreateIndex
CREATE INDEX "Favorite_user_id_idx" ON "Favorite"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_user_id_vote_session_id_key" ON "Favorite"("user_id", "vote_session_id");

-- CreateIndex
CREATE INDEX "Feedback_createdAt_idx" ON "Feedback"("createdAt");

-- CreateIndex
CREATE INDEX "Feedback_userId_idx" ON "Feedback"("userId");

-- CreateIndex
CREATE INDEX "GraphEdge_relationship_idx" ON "GraphEdge"("relationship");

-- CreateIndex
CREATE INDEX "GraphEdge_sourceType_sourceId_idx" ON "GraphEdge"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "GraphEdge_targetType_targetId_idx" ON "GraphEdge"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "LLMHealthMetric_createdAt_idx" ON "LLMHealthMetric"("createdAt");

-- CreateIndex
CREATE INDEX "LLMHealthMetric_providerName_modelName_idx" ON "LLMHealthMetric"("providerName", "modelName");

-- CreateIndex
CREATE INDEX "LLMHealthMetric_status_idx" ON "LLMHealthMetric"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LLMHealthMetric_providerName_modelName_key" ON "LLMHealthMetric"("providerName", "modelName");

-- CreateIndex
CREATE INDEX "LLMHealthProbe_providerName_modelName_idx" ON "LLMHealthProbe"("providerName", "modelName");

-- CreateIndex
CREATE INDEX "LLMHealthProbe_success_idx" ON "LLMHealthProbe"("success");

-- CreateIndex
CREATE INDEX "LLMHealthProbe_testedAt_idx" ON "LLMHealthProbe"("testedAt");

-- CreateIndex
CREATE INDEX "ModelDeprecationAlert_alertSent_idx" ON "ModelDeprecationAlert"("alertSent");

-- CreateIndex
CREATE INDEX "ModelDeprecationAlert_providerName_modelName_idx" ON "ModelDeprecationAlert"("providerName", "modelName");

-- CreateIndex
CREATE INDEX "ModelDeprecationAlert_resolvedAt_idx" ON "ModelDeprecationAlert"("resolvedAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_userCreditId_key" ON "User"("userCreditId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "UserCredit_walletPublicKey_key" ON "UserCredit"("walletPublicKey");

-- CreateIndex
CREATE UNIQUE INDEX "UserCredit_userId_key" ON "UserCredit"("userId");

-- CreateIndex
CREATE INDEX "Validator_active_idx" ON "Validator"("active");

-- CreateIndex
CREATE INDEX "Validator_provider_idx" ON "Validator"("provider");

-- CreateIndex
CREATE INDEX "idx_validator_active_provider" ON "Validator"("active", "provider");

-- CreateIndex
CREATE INDEX "idx_validator_key_validator" ON "ValidatorKey"("validatorId");

-- CreateIndex
CREATE UNIQUE INDEX "ValidatorKey_validatorId_apiKeyId_key" ON "ValidatorKey"("validatorId", "apiKeyId");

-- CreateIndex
CREATE INDEX "ValidatorResponse_matchedConsensus_idx" ON "ValidatorResponse"("matchedConsensus");

-- CreateIndex
CREATE INDEX "ValidatorResponse_validatorId_idx" ON "ValidatorResponse"("validatorId");

-- CreateIndex
CREATE INDEX "ValidatorResponse_voteSessionId_idx" ON "ValidatorResponse"("voteSessionId");

-- CreateIndex
CREATE INDEX "ValidatorResponse_vote_idx" ON "ValidatorResponse"("vote");

-- CreateIndex
CREATE INDEX "idx_validator_response_session" ON "ValidatorResponse"("voteSessionId");

-- CreateIndex
CREATE INDEX "VoteSession_consensusValue_idx" ON "VoteSession"("consensusValue");

-- CreateIndex
CREATE INDEX "VoteSession_isConsensusReached_idx" ON "VoteSession"("isConsensusReached");

-- CreateIndex
CREATE INDEX "VoteSession_timestamp_idx" ON "VoteSession"("timestamp");

-- CreateIndex
CREATE INDEX "idx_vote_session_timestamp" ON "VoteSession"("timestamp" DESC);

-- CreateIndex
CREATE INDEX "idx_credit_audit_created_at" ON "credit_audit_log"("created_at");

-- CreateIndex
CREATE INDEX "idx_credit_audit_operation" ON "credit_audit_log"("operation");

-- CreateIndex
CREATE INDEX "idx_credit_audit_user_id" ON "credit_audit_log"("user_id");

-- CreateIndex
CREATE INDEX "Prediction_resolutionStatus_idx" ON "Prediction"("resolutionStatus");

-- CreateIndex
CREATE INDEX "Prediction_resolutionDate_idx" ON "Prediction"("resolutionDate");

-- CreateIndex
CREATE INDEX "Prediction_category_idx" ON "Prediction"("category");

-- CreateIndex
CREATE INDEX "PredictionOutcome_predictionId_idx" ON "PredictionOutcome"("predictionId");

-- CreateIndex
CREATE INDEX "ModelPrediction_predictionId_idx" ON "ModelPrediction"("predictionId");

-- CreateIndex
CREATE INDEX "PredictionResolution_predictionId_idx" ON "PredictionResolution"("predictionId");

-- CreateIndex
CREATE INDEX "ModelPerformance_periodStart_periodEnd_idx" ON "ModelPerformance"("periodStart", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationVote_predictionId_userId_key" ON "VerificationVote"("predictionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPoints_userId_key" ON "UserPoints"("userId");

-- CreateIndex
CREATE INDEX "UserPoints_userId_idx" ON "UserPoints"("userId");

-- CreateIndex
CREATE INDEX "PointsTransaction_userId_idx" ON "PointsTransaction"("userId");

-- CreateIndex
CREATE INDEX "PointsTransaction_userId_createdAt_idx" ON "PointsTransaction"("userId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "PredictionMarket_predictionId_key" ON "PredictionMarket"("predictionId");

-- CreateIndex
CREATE INDEX "PredictionMarket_status_idx" ON "PredictionMarket"("status");

-- CreateIndex
CREATE INDEX "PredictionMarket_creatorId_idx" ON "PredictionMarket"("creatorId");

-- CreateIndex
CREATE INDEX "MarketBet_marketId_idx" ON "MarketBet"("marketId");

-- CreateIndex
CREATE INDEX "MarketBet_userId_idx" ON "MarketBet"("userId");

-- CreateIndex
CREATE INDEX "MarketBet_status_idx" ON "MarketBet"("status");

-- CreateIndex
CREATE INDEX "MarketStake_marketId_idx" ON "MarketStake"("marketId");

-- CreateIndex
CREATE UNIQUE INDEX "user_demographics_user_id_key" ON "user_demographics"("user_id");

-- CreateIndex
CREATE INDEX "vote_details_user_id_idx" ON "vote_details"("user_id");

-- CreateIndex
CREATE INDEX "vote_details_vote_reason_idx" ON "vote_details"("vote_reason");

-- CreateIndex
CREATE INDEX "vote_details_vote_session_id_idx" ON "vote_details"("vote_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "model_matchups_model_a_model_b_category_key" ON "model_matchups"("model_a", "model_b", "category");

-- CreateIndex
CREATE INDEX "model_elo_ratings_elo_rating_idx" ON "model_elo_ratings"("elo_rating" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "model_elo_ratings_model_name_provider_category_key" ON "model_elo_ratings"("model_name", "provider", "category");

-- CreateIndex
CREATE UNIQUE INDEX "ai_models_model_path_key" ON "ai_models"("model_path");

-- CreateIndex
CREATE INDEX "idx_ai_models_active" ON "ai_models"("is_active");

-- CreateIndex
CREATE INDEX "idx_ai_models_category" ON "ai_models"("category");

-- CreateIndex
CREATE INDEX "idx_ai_models_provider" ON "ai_models"("provider");

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_vote_session_id_fkey" FOREIGN KEY ("vote_session_id") REFERENCES "VoteSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GraphEdge" ADD CONSTRAINT "GraphEdge_validatorId_fkey" FOREIGN KEY ("validatorId") REFERENCES "Validator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GraphEdge" ADD CONSTRAINT "GraphEdge_voteSessionId_fkey" FOREIGN KEY ("voteSessionId") REFERENCES "VoteSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reply" ADD CONSTRAINT "Reply_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Thread" ADD CONSTRAINT "Thread_voteSessionId_fkey" FOREIGN KEY ("voteSessionId") REFERENCES "VoteSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCredit" ADD CONSTRAINT "UserCredit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidatorKey" ADD CONSTRAINT "ValidatorKey_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidatorKey" ADD CONSTRAINT "ValidatorKey_validatorId_fkey" FOREIGN KEY ("validatorId") REFERENCES "Validator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidatorResponse" ADD CONSTRAINT "ValidatorResponse_validatorId_fkey" FOREIGN KEY ("validatorId") REFERENCES "Validator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidatorResponse" ADD CONSTRAINT "ValidatorResponse_voteSessionId_fkey" FOREIGN KEY ("voteSessionId") REFERENCES "VoteSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteSession" ADD CONSTRAINT "VoteSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserCredit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_voteSessionId_fkey" FOREIGN KEY ("voteSessionId") REFERENCES "VoteSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionOutcome" ADD CONSTRAINT "PredictionOutcome_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "Prediction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelPrediction" ADD CONSTRAINT "ModelPrediction_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "Prediction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionResolution" ADD CONSTRAINT "PredictionResolution_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "Prediction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationVote" ADD CONSTRAINT "VerificationVote_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "Prediction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPoints" ADD CONSTRAINT "UserPoints_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsTransaction" ADD CONSTRAINT "PointsTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionMarket" ADD CONSTRAINT "PredictionMarket_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionMarket" ADD CONSTRAINT "PredictionMarket_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "Prediction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketBet" ADD CONSTRAINT "MarketBet_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "PredictionMarket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketBet" ADD CONSTRAINT "MarketBet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketStake" ADD CONSTRAINT "MarketStake_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "PredictionMarket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

