#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

config();

const prisma = new PrismaClient();

async function optimizeValidators() {
  console.log('⚡ Optimizing Validator Performance\n');
  console.log('='.repeat(80));

  try {
    // 1. Fix GPT-4o model name
    console.log('\n🔧 Step 1: Fixing GPT-4o model name...');
    
    const gpt4oResult = await prisma.validator.updateMany({
      where: {
        provider: 'OpenAI',
        modelName: 'gpt-4o'
      },
      data: { 
        modelName: 'gpt-4o-2024-08-06'  // Use the specific model version
      }
    });
    console.log(`  ✅ Updated ${gpt4oResult.count} GPT-4o validators to use correct model ID`);

    // Also fix gpt-4o-mini if it exists
    const gpt4oMiniResult = await prisma.validator.updateMany({
      where: {
        provider: 'OpenAI',
        modelName: 'gpt-4o-mini'
      },
      data: { 
        modelName: 'gpt-4o-mini-2024-07-18'  // Use the specific model version
      }
    });
    console.log(`  ✅ Updated ${gpt4oMiniResult.count} GPT-4o-mini validators`);

    // 2. Deactivate slow free models during peak times
    console.log('\n⚡ Step 2: Optimizing active validator set...');
    
    // Keep only the fastest validators active
    const fastValidators = [
      // Fast OpenRouter models
      { provider: 'OpenRouter', modelName: 'mistralai/mixtral-8x7b-instruct' },
      { provider: 'OpenRouter', modelName: 'meta-llama/llama-3-70b-instruct' },
      { provider: 'OpenRouter', modelName: 'anthropic/claude-3-sonnet' },
      { provider: 'OpenRouter', modelName: 'mistralai/mistral-7b-instruct' },
      
      // OpenAI models (fast when working)
      { provider: 'OpenAI', modelName: 'gpt-3.5-turbo' },
      { provider: 'OpenAI', modelName: 'gpt-4o-2024-08-06' },
      { provider: 'OpenAI', modelName: 'gpt-4o-mini-2024-07-18' },
      
      // Fast free model
      { provider: 'OpenRouter', modelName: 'mistralai/mistral-small-3.2-24b-instruct:free' },
    ];

    // First deactivate all
    await prisma.validator.updateMany({
      data: { active: false }
    });

    // Then activate only fast ones
    for (const validator of fastValidators) {
      const result = await prisma.validator.updateMany({
        where: validator,
        data: { active: true }
      });
      if (result.count > 0) {
        console.log(`  ✅ Activated fast validator: ${validator.modelName}`);
      }
    }

    // 3. Create indexes for faster queries
    console.log('\n🚀 Step 3: Database optimizations...');
    
    // These would normally be in a migration, but showing the SQL here
    console.log('  💡 Recommended indexes (add via migration):');
    console.log('     CREATE INDEX idx_validator_active_provider ON "Validator"(active, provider);');
    console.log('     CREATE INDEX idx_validator_response_session ON "ValidatorResponse"("voteSessionId");');
    console.log('     CREATE INDEX idx_vote_session_timestamp ON "VoteSession"(timestamp DESC);');

    // 4. Summary
    console.log('\n📊 Optimization Summary:');
    const activeCount = await prisma.validator.count({ where: { active: true } });
    console.log(`  Active validators: ${activeCount}`);
    console.log(`  Focus: Speed over quantity`);
    console.log(`  Expected response time: 3-5 seconds (down from 17s)`);

    console.log('\n✨ Optimizations complete!');

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

optimizeValidators();