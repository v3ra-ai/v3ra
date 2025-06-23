#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { randomUUID } from 'crypto';

config();

const prisma = new PrismaClient();

async function fixOpenRouterModels() {
  console.log('🔧 Fixing OpenRouter Model IDs\n');
  console.log('='.repeat(80));

  try {
    // 1. Fix invalid model IDs
    console.log('\n📝 Step 1: Fixing invalid model IDs...');
    
    // Fix Mixtral 8x22B - model doesn't exist, deactivate it
    const mixtralResult = await prisma.validator.updateMany({
      where: {
        provider: 'OpenRouter',
        modelName: 'mistralai/mixtral-8x22b'
      },
      data: { active: false }
    });
    console.log(`  ❌ Deactivated invalid Mixtral 8x22B (${mixtralResult.count} updated)`);

    // 2. Add/activate some free models to reduce rate limiting
    console.log('\n✅ Step 2: Adding free OpenRouter models...');
    
    const freeModels = [
      {
        profileName: 'Mistral Small 3.2 24B (Free)',
        modelName: 'mistralai/mistral-small-3.2-24b-instruct:free',
        provider: 'OpenRouter'
      },
      {
        profileName: 'DeepSeek R1 (Free)',
        modelName: 'deepseek/deepseek-r1-0528:free',
        provider: 'OpenRouter'
      }
    ];

    for (const model of freeModels) {
      // Check if exists
      const existing = await prisma.validator.findFirst({
        where: {
          provider: model.provider,
          modelName: model.modelName
        }
      });

      if (existing) {
        // Activate if exists
        await prisma.validator.update({
          where: { id: existing.id },
          data: { active: true }
        });
        console.log(`  ✅ Activated existing: ${model.profileName}`);
      } else {
        // Create new
        const newValidator = await prisma.validator.create({
          data: {
            profileName: model.profileName,
            provider: model.provider,
            modelName: model.modelName,
            active: true,
            description: 'Free OpenRouter model',
            validatorType: 'LLM',
            reliability: 0.8,
            totalVotes: 0,
            correctVotes: 0,
            publicKey: randomUUID()
          }
        });

        // Link to OpenRouter API key
        const apiKeys = await prisma.apiKey.findMany({
          where: { provider: 'OpenRouter', isActive: true }
        });

        if (apiKeys.length > 0) {
          await prisma.validatorKey.create({
            data: {
              validatorId: newValidator.id,
              apiKeyId: apiKeys[0].id
            }
          });
        }

        console.log(`  ✅ Created new: ${model.profileName}`);
      }
    }

    // 3. Deactivate rate-limited free Gemini model temporarily
    console.log('\n⏸️  Step 3: Temporarily deactivating rate-limited models...');
    
    await prisma.validator.updateMany({
      where: {
        provider: 'OpenRouter',
        modelName: 'google/gemini-2.0-flash-exp:free'
      },
      data: { active: false }
    });
    console.log('  ⏸️  Deactivated Gemini 2.0 Flash Free (rate limited)');

    // 4. Summary
    console.log('\n📊 Final Status:');
    const activeOpenRouter = await prisma.validator.count({
      where: { provider: 'OpenRouter', active: true }
    });
    console.log(`  Active OpenRouter validators: ${activeOpenRouter}`);

    const activeTotal = await prisma.validator.count({ where: { active: true } });
    console.log(`  Total active validators: ${activeTotal}`);

    console.log('\n✨ OpenRouter models fixed!');

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixOpenRouterModels();