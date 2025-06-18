#!/usr/bin/env ts-node
/**
 * Force delete a specific validator
 */

const { PrismaClient } = require('@prisma/client');
const { config } = require('dotenv');

config();

const prisma = new PrismaClient();

async function forceDeleteValidator() {
  const validatorId = '11b5d77c-9cb1-4a66-9c33-02bf982bb326';
  
  try {
    console.log(`Force deleting validator ${validatorId}...`);
    
    // Delete in correct order to avoid foreign key constraints
    const responses = await prisma.validatorResponse.deleteMany({
      where: { validatorId }
    });
    console.log(`Deleted ${responses.count} validator responses`);
    
    const keys = await prisma.validatorKey.deleteMany({
      where: { validatorId }
    });
    console.log(`Deleted ${keys.count} validator keys`);
    
    const validator = await prisma.validator.delete({
      where: { id: validatorId }
    });
    console.log(`Deleted validator: ${validator.profileName}`);
    
    console.log('\n✅ Successfully deleted validator!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

forceDeleteValidator();