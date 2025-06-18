#!/usr/bin/env ts-node
/**
 * Add performance indexes for vote sessions and validator responses
 * As recommended by Chris for improving query performance
 */

const { PrismaClient } = require('@prisma/client');
const { config } = require('dotenv');

config();

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function addPerformanceIndexes() {
  console.log('Adding performance indexes...\n');

  try {
    // Check if VoteSession indexes already exist
    const voteSessionIndexes = await prisma.$queryRaw`
      SELECT indexname FROM pg_indexes 
      WHERE tablename = 'VoteSession' 
      AND schemaname = 'public';
    `;

    console.log('Current VoteSession indexes:', voteSessionIndexes.map((i: any) => i.indexname));

    // Add VoteSession indexes if they don't exist
    const indexesToAdd = [
      {
        name: 'VoteSession_timestamp_idx',
        sql: 'CREATE INDEX IF NOT EXISTS "VoteSession_timestamp_idx" ON "VoteSession"("timestamp" DESC);'
      },
      {
        name: 'VoteSession_timestamp_consensus_idx',
        sql: 'CREATE INDEX IF NOT EXISTS "VoteSession_timestamp_consensus_idx" ON "VoteSession"("timestamp" DESC, "isConsensusReached");'
      },
      {
        name: 'ValidatorResponse_validatorId_idx',
        sql: 'CREATE INDEX IF NOT EXISTS "ValidatorResponse_validatorId_idx" ON "ValidatorResponse"("validatorId");'
      },
      {
        name: 'ValidatorResponse_voteSessionId_idx',
        sql: 'CREATE INDEX IF NOT EXISTS "ValidatorResponse_voteSessionId_idx" ON "ValidatorResponse"("voteSessionId");'
      },
      {
        name: 'ValidatorResponse_validatorId_vote_idx',
        sql: 'CREATE INDEX IF NOT EXISTS "ValidatorResponse_validatorId_vote_idx" ON "ValidatorResponse"("validatorId", "vote");'
      }
    ];

    for (const index of indexesToAdd) {
      try {
        console.log(`Creating index: ${index.name}`);
        await prisma.$executeRawUnsafe(index.sql);
        console.log(`✓ Created ${index.name}`);
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          console.log(`✓ ${index.name} already exists`);
        } else {
          console.error(`✗ Failed to create ${index.name}:`, error.message);
        }
      }
    }

    // Add DataSource enum if it doesn't exist (for future use)
    console.log('\nChecking for DataSource enum...');
    try {
      await prisma.$executeRaw`
        DO $$ BEGIN
          CREATE TYPE "DataSource" AS ENUM ('REAL', 'SIMULATED', 'TEST');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `;
      console.log('✓ DataSource enum created or already exists');
    } catch (error) {
      console.log('✗ Could not create DataSource enum:', error);
    }

    // Get index statistics
    console.log('\nIndex statistics:');
    const indexStats = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename IN ('VoteSession', 'ValidatorResponse', 'LLMHealthMetric')
      ORDER BY tablename, indexname;
    `;

    console.table(indexStats);

    console.log('\n✅ Performance indexes setup complete!');

  } catch (error) {
    console.error('Error adding performance indexes:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addPerformanceIndexes();