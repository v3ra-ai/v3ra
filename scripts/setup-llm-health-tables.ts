#!/usr/bin/env ts-node
/**
 * Setup script for LLM health monitoring tables
 * This creates the necessary database tables if they don't exist
 */

const { PrismaClient } = require('@prisma/client');
const { config } = require('dotenv');

config();

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function setupLLMHealthTables() {
  console.log('Setting up LLM Health Monitoring tables...\n');

  try {
    // Check if tables already exist
    const tableCheck = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'LLMHealthMetric'
      ) as exists;
    `;

    if (tableCheck[0]?.exists) {
      console.log('✓ LLM Health tables already exist');
      
      // Get table info
      const metrics = await prisma.lLMHealthMetric.count();
      const probes = await prisma.lLMHealthProbe.count();
      const alerts = await prisma.modelDeprecationAlert.count();
      
      console.log(`\nCurrent data:`);
      console.log(`- Health Metrics: ${metrics}`);
      console.log(`- Health Probes: ${probes}`);
      console.log(`- Deprecation Alerts: ${alerts}`);
      
      return;
    }

    console.log('Creating LLM Health Monitoring tables...');

    // Create the enum type
    await prisma.$executeRaw`
      CREATE TYPE "LLMHealthStatus" AS ENUM ('healthy', 'degraded', 'deprecated', 'offline');
    `;
    console.log('✓ Created LLMHealthStatus enum');

    // Create LLMHealthMetric table
    await prisma.$executeRaw`
      CREATE TABLE "LLMHealthMetric" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
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
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "LLMHealthMetric_pkey" PRIMARY KEY ("id")
      );
    `;
    console.log('✓ Created LLMHealthMetric table');

    // Create ModelDeprecationAlert table
    await prisma.$executeRaw`
      CREATE TABLE "ModelDeprecationAlert" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
        "modelName" VARCHAR(100) NOT NULL,
        "providerName" VARCHAR(50) NOT NULL,
        "deprecatedAt" TIMESTAMP(3) NOT NULL,
        "replacementModel" VARCHAR(100),
        "alertSent" BOOLEAN NOT NULL DEFAULT false,
        "resolvedAt" TIMESTAMP(3),
        "errorSample" TEXT,
        "affectedValidators" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ModelDeprecationAlert_pkey" PRIMARY KEY ("id")
      );
    `;
    console.log('✓ Created ModelDeprecationAlert table');

    // Create LLMHealthProbe table
    await prisma.$executeRaw`
      CREATE TABLE "LLMHealthProbe" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
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
    `;
    console.log('✓ Created LLMHealthProbe table');

    // Create indexes
    console.log('\nCreating indexes...');
    
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX "LLMHealthMetric_providerName_modelName_key" 
      ON "LLMHealthMetric"("providerName", "modelName");
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX "LLMHealthMetric_status_idx" ON "LLMHealthMetric"("status");
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX "ModelDeprecationAlert_alertSent_idx" 
      ON "ModelDeprecationAlert"("alertSent");
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX "LLMHealthProbe_providerName_modelName_idx" 
      ON "LLMHealthProbe"("providerName", "modelName");
    `;
    
    console.log('✓ Created all indexes');

    // Initialize with current validators
    console.log('\nInitializing health metrics from existing validators...');
    
    const validators = await prisma.validator.findMany({
      where: { active: true },
      distinct: ['provider', 'modelName'],
    });

    for (const validator of validators) {
      await prisma.lLMHealthMetric.create({
        data: {
          providerName: validator.provider,
          modelName: validator.modelName,
          status: 'healthy',
          successRate: 100,
          totalRequests: 0,
          failedRequests: 0,
        },
      }).catch(() => {
        // Ignore duplicates
      });
    }

    console.log(`✓ Initialized ${validators.length} health metrics`);
    console.log('\n✅ LLM Health Monitoring setup complete!');

  } catch (error) {
    console.error('Error setting up LLM Health tables:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupLLMHealthTables();