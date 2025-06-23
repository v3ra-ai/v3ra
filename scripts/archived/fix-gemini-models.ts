#!/usr/bin/env ts-node
/**
 * Fix incorrect Gemini model IDs
 */

const { PrismaClient } = require('@prisma/client');
const { config } = require('dotenv');

config();

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function fixGeminiModels() {
  console.log('Fixing Gemini model IDs...\n');

  try {
    // Map incorrect model IDs to correct ones
    const modelMapping: Record<string, string> = {
      'gemini': 'gemini-1.5-flash',  // Current stable Gemini model
      'gemini2.5': 'gemini-1.5-flash' // gemini2.5 doesn't exist yet
    };

    // Find validators with incorrect Gemini model IDs
    const incorrectValidators = await prisma.validator.findMany({
      where: {
        provider: 'Google',
        modelName: {
          in: Object.keys(modelMapping)
        }
      }
    });

    console.log(`Found ${incorrectValidators.length} validators with incorrect Gemini model IDs`);

    if (incorrectValidators.length === 0) {
      console.log('No validators to fix!');
      return;
    }

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
          providerName: 'Google',
          modelName: oldModel
        }
      });

      // Create new health metric for the correct model
      await prisma.lLMHealthMetric.upsert({
        where: {
          providerName_modelName: {
            providerName: 'Google',
            modelName: newModel
          }
        },
        create: {
          providerName: 'Google',
          modelName: newModel,
          status: 'healthy',
          totalRequests: 0,
          failedRequests: 0,
          successRate: 100
        },
        update: {}
      });
    }

    console.log('\n✅ Successfully fixed Gemini model IDs!');

    // Show updated validators
    const updatedValidators = await prisma.validator.findMany({
      where: {
        provider: 'Google',
        modelName: 'gemini-1.5-flash'
      },
      select: {
        profileName: true,
        modelName: true
      }
    });

    console.log('\nUpdated validators:');
    console.table(updatedValidators);

  } catch (error) {
    console.error('Error fixing Gemini model IDs:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixGeminiModels();