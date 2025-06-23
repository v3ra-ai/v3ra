#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function optimizePerformance() {
  console.log('🚀 Adding Performance Optimizations\n');

  try {
    // Add indexes for better query performance
    const indexes = [
      `CREATE INDEX IF NOT EXISTS idx_validator_active_provider ON "Validator"(active, provider);`,
      `CREATE INDEX IF NOT EXISTS idx_validator_response_session ON "ValidatorResponse"("voteSessionId");`,
      `CREATE INDEX IF NOT EXISTS idx_vote_session_timestamp ON "VoteSession"(timestamp DESC);`,
      `CREATE INDEX IF NOT EXISTS idx_validator_key_validator ON "ValidatorKey"("validatorId");`,
      `CREATE INDEX IF NOT EXISTS idx_api_key_provider ON "ApiKey"(provider, "isActive");`
    ];

    for (const sql of indexes) {
      try {
        await prisma.$executeRawUnsafe(sql);
        console.log(`✅ ${sql.match(/idx_\w+/)?.[0] || 'Index'} created/verified`);
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          console.log(`ℹ️  ${sql.match(/idx_\w+/)?.[0] || 'Index'} already exists`);
        } else {
          console.error(`❌ Failed to create index: ${error.message}`);
        }
      }
    }

    console.log('\n✨ Database optimization complete!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

optimizePerformance();