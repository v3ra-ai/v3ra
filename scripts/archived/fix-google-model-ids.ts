#!/usr/bin/env ts-node
/**
 * Fix incorrect Google model IDs for OpenRouter validators
 */

const { PrismaClient } = require('@prisma/client');
const { config } = require('dotenv');

config();

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function fixGoogleModelIds() {
  console.log('Fixing Google model IDs for OpenRouter...\n');

  try {
    // Find validators with incorrect Google model IDs
    const incorrectValidators = await prisma.validator.findMany({
      where: {
        provider: 'OpenRouter',
        modelName: {
          in: ['google/gemini-1.5-pro', 'google/gemini-1.5-flash']
        }
      }
    });

    console.log(`Found ${incorrectValidators.length} validators with incorrect Google model IDs`);

    if (incorrectValidators.length === 0) {
      console.log('No validators to fix!');
      return;
    }

    // Map old model IDs to correct OpenRouter model IDs
    const modelMapping: Record<string, string> = {
      'google/gemini-1.5-pro': 'google/gemini-2.0-flash-exp:free',
      'google/gemini-1.5-flash': 'google/gemini-2.0-flash-exp:free'
    };

    // Update each validator
    for (const validator of incorrectValidators) {
      const newModelName = modelMapping[validator.modelName];
      
      console.log(`\nUpdating validator ${validator.profileName}:`);
      console.log(`  Old model: ${validator.modelName}`);
      console.log(`  New model: ${newModelName}`);

      await prisma.validator.update({
        where: { id: validator.id },
        data: { modelName: newModelName }
      });
    }

    // Also update the health metrics
    console.log('\nUpdating health metrics...');
    
    for (const [oldModel, newModel] of Object.entries(modelMapping)) {
      // Delete old health metrics
      await prisma.lLMHealthMetric.deleteMany({
        where: {
          providerName: 'OpenRouter',
          modelName: oldModel
        }
      });

      // Create new health metric for the correct model
      await prisma.lLMHealthMetric.upsert({
        where: {
          providerName_modelName: {
            providerName: 'OpenRouter',
            modelName: newModel
          }
        },
        create: {
          providerName: 'OpenRouter',
          modelName: newModel,
          status: 'healthy',
          totalRequests: 0,
          failedRequests: 0,
          successRate: 100
        },
        update: {}
      });
    }

    console.log('\n✅ Successfully fixed Google model IDs!');

    // Show updated validators
    const updatedValidators = await prisma.validator.findMany({
      where: {
        provider: 'OpenRouter',
        modelName: 'google/gemini-2.0-flash-exp:free'
      },
      select: {
        profileName: true,
        modelName: true
      }
    });

    console.log('\nUpdated validators:');
    console.table(updatedValidators);

  } catch (error) {
    console.error('Error fixing Google model IDs:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixGoogleModelIds();