#!/usr/bin/env ts-node
/**
 * Clean up duplicate validators and update profile names
 */

const { PrismaClient } = require('@prisma/client');
const { config } = require('dotenv');

config();

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function cleanupDuplicateValidators() {
  console.log('Cleaning up duplicate validators...\n');

  try {
    // Find the duplicate Gemini validators
    const geminiValidators = await prisma.validator.findMany({
      where: {
        provider: 'OpenRouter',
        modelName: 'google/gemini-2.0-flash-exp:free',
        profileName: {
          contains: 'Gemini 1.5'
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`Found ${geminiValidators.length} Gemini validators using the same model`);

    if (geminiValidators.length > 1) {
      // Keep the first one and update its name
      const keepValidator = geminiValidators[0];
      const removeValidators = geminiValidators.slice(1);

      console.log(`\nKeeping validator: ${keepValidator.profileName} (${keepValidator.id})`);
      console.log('Updating its profile name to match the model...');

      // Update the profile name to reflect the actual model
      await prisma.validator.update({
        where: { id: keepValidator.id },
        data: { 
          profileName: 'Gemini 2.0 Flash (Free) Validator'
        }
      });

      // Deactivate the duplicate validators instead of deleting them
      // This preserves historical data
      for (const validator of removeValidators) {
        console.log(`\nDeactivating duplicate validator: ${validator.profileName} (${validator.id})`);
        
        await prisma.validator.update({
          where: { id: validator.id },
          data: { 
            active: false,
            profileName: `[Deprecated] ${validator.profileName}`
          }
        });
      }
    } else if (geminiValidators.length === 1) {
      // Just update the name of the single validator
      const validator = geminiValidators[0];
      console.log(`\nUpdating validator name: ${validator.profileName}`);
      
      await prisma.validator.update({
        where: { id: validator.id },
        data: { 
          profileName: 'Gemini 2.0 Flash (Free) Validator'
        }
      });
    }

    console.log('\n✅ Successfully cleaned up validators!');

    // Show active validators
    const activeValidators = await prisma.validator.findMany({
      where: {
        provider: 'OpenRouter',
        modelName: 'google/gemini-2.0-flash-exp:free',
        active: true
      },
      select: {
        profileName: true,
        modelName: true,
        active: true
      }
    });

    console.log('\nActive validators:');
    console.table(activeValidators);

  } catch (error) {
    console.error('Error cleaning up validators:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDuplicateValidators();