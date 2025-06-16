-- CreateEnum
CREATE TYPE "LLMHealthStatus" AS ENUM ('healthy', 'degraded', 'deprecated', 'offline');

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

-- CreateIndex
CREATE UNIQUE INDEX "LLMHealthMetric_providerName_modelName_key" ON "LLMHealthMetric"("providerName", "modelName");

-- CreateIndex
CREATE INDEX "LLMHealthMetric_providerName_modelName_idx" ON "LLMHealthMetric"("providerName", "modelName");

-- CreateIndex
CREATE INDEX "LLMHealthMetric_status_idx" ON "LLMHealthMetric"("status");

-- CreateIndex
CREATE INDEX "LLMHealthMetric_createdAt_idx" ON "LLMHealthMetric"("createdAt");

-- CreateIndex
CREATE INDEX "ModelDeprecationAlert_alertSent_idx" ON "ModelDeprecationAlert"("alertSent");

-- CreateIndex
CREATE INDEX "ModelDeprecationAlert_resolvedAt_idx" ON "ModelDeprecationAlert"("resolvedAt");

-- CreateIndex
CREATE INDEX "ModelDeprecationAlert_providerName_modelName_idx" ON "ModelDeprecationAlert"("providerName", "modelName");

-- CreateIndex
CREATE INDEX "LLMHealthProbe_providerName_modelName_idx" ON "LLMHealthProbe"("providerName", "modelName");

-- CreateIndex
CREATE INDEX "LLMHealthProbe_testedAt_idx" ON "LLMHealthProbe"("testedAt");

-- CreateIndex
CREATE INDEX "LLMHealthProbe_success_idx" ON "LLMHealthProbe"("success");