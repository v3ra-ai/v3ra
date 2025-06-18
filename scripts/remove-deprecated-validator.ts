#!/usr/bin/env ts-node
/**
 * Remove deprecated validator
 */

const { PrismaClient } = require('@prisma/client');
const { config } = require('dotenv');

config();

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function removeDeprecatedValidator() {
  console.log('Removing deprecated validator...\n');

  try {
    // Find the deprecated validator
    const deprecatedValidator = await prisma.validator.findFirst({
      where: {
        profileName: '[Deprecated] Gemini 1.5 Flash Validator'
      }
    });

    if (!deprecatedValidator) {
      console.log('Deprecated validator not found!');
      return;
    }

    console.log(`Found deprecated validator: ${deprecatedValidator.profileName} (${deprecatedValidator.id})`);
    
    // First, delete any related records
    console.log('\nDeleting related records...');
    
    // Delete validator API key relationships
    await prisma.validatorKey.deleteMany({
      where: { validatorId: deprecatedValidator.id }
    });
    
    // Delete validator responses
    await prisma.validatorResponse.deleteMany({
      where: { validatorId: deprecatedValidator.id }
    });
    
    // Delete the validator
    console.log('Deleting validator...');
    await prisma.validator.delete({
      where: { id: deprecatedValidator.id }
    });

    console.log('\n✅ Successfully removed deprecated validator!');

    // Show remaining Gemini validators
    const remainingValidators = await prisma.validator.findMany({
      where: {
        OR: [
          { profileName: { contains: 'Gemini' } },
          { modelName: { contains: 'gemini' } }
        ]
      },
      select: {
        profileName: true,
        provider: true,
        modelName: true,
        active: true
      }
    });

    console.log('\nRemaining Gemini validators:');
    console.table(remainingValidators);

  } catch (error) {
    console.error('Error removing deprecated validator:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

removeDeprecatedValidator();