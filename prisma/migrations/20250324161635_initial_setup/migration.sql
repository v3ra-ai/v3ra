-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastUsed" DATETIME
);

-- CreateTable
CREATE TABLE "ValidatorKey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "validatorId" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ValidatorKey_validatorId_fkey" FOREIGN KEY ("validatorId") REFERENCES "Validator" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ValidatorKey_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Validator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileName" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "isLeader" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "avatarUrl" TEXT,
    "validatorType" TEXT,
    "reliability" REAL DEFAULT 0.0,
    "totalVotes" INTEGER NOT NULL DEFAULT 0,
    "correctVotes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VoteSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "queryText" TEXT NOT NULL,
    "context" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isConsensusReached" BOOLEAN NOT NULL,
    "consensusValue" BOOLEAN,
    "votesYes" INTEGER NOT NULL DEFAULT 0,
    "votesNo" INTEGER NOT NULL DEFAULT 0,
    "notVoted" INTEGER NOT NULL DEFAULT 0,
    "leaderId" TEXT,
    "txHash" TEXT,
    "blockchainNetwork" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ValidatorResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vote" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "confidence" REAL DEFAULT 0.5,
    "rationaleEmbedding" TEXT,
    "latency" INTEGER,
    "matchedConsensus" BOOLEAN,
    "voteSessionId" TEXT NOT NULL,
    "validatorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "error" TEXT,
    CONSTRAINT "ValidatorResponse_voteSessionId_fkey" FOREIGN KEY ("voteSessionId") REFERENCES "VoteSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ValidatorResponse_validatorId_fkey" FOREIGN KEY ("validatorId") REFERENCES "Validator" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GraphEdge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceType" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "weight" REAL,
    "properties" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validatorId" TEXT,
    "voteSessionId" TEXT,
    CONSTRAINT "GraphEdge_validatorId_fkey" FOREIGN KEY ("validatorId") REFERENCES "Validator" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GraphEdge_voteSessionId_fkey" FOREIGN KEY ("voteSessionId") REFERENCES "VoteSession" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ApiKey_provider_isActive_idx" ON "ApiKey"("provider", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ValidatorKey_validatorId_apiKeyId_key" ON "ValidatorKey"("validatorId", "apiKeyId");

-- CreateIndex
CREATE INDEX "Validator_provider_idx" ON "Validator"("provider");

-- CreateIndex
CREATE INDEX "Validator_active_idx" ON "Validator"("active");

-- CreateIndex
CREATE INDEX "VoteSession_timestamp_idx" ON "VoteSession"("timestamp");

-- CreateIndex
CREATE INDEX "VoteSession_consensusValue_idx" ON "VoteSession"("consensusValue");

-- CreateIndex
CREATE INDEX "VoteSession_isConsensusReached_idx" ON "VoteSession"("isConsensusReached");

-- CreateIndex
CREATE INDEX "ValidatorResponse_vote_idx" ON "ValidatorResponse"("vote");

-- CreateIndex
CREATE INDEX "ValidatorResponse_voteSessionId_idx" ON "ValidatorResponse"("voteSessionId");

-- CreateIndex
CREATE INDEX "ValidatorResponse_validatorId_idx" ON "ValidatorResponse"("validatorId");

-- CreateIndex
CREATE INDEX "ValidatorResponse_matchedConsensus_idx" ON "ValidatorResponse"("matchedConsensus");

-- CreateIndex
CREATE INDEX "GraphEdge_sourceType_sourceId_idx" ON "GraphEdge"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "GraphEdge_targetType_targetId_idx" ON "GraphEdge"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "GraphEdge_relationship_idx" ON "GraphEdge"("relationship");
