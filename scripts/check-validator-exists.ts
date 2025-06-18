#!/usr/bin/env ts-node

const { PrismaClient } = require('@prisma/client');
const { config } = require('dotenv');

config();

const prisma = new PrismaClient();

async function checkValidator() {
  const validatorId = '11b5d77c-9cb1-4a66-9c33-02bf982bb326';
  
  try {
    const validator = await prisma.validator.findUnique({
      where: { id: validatorId }
    });
    
    if (validator) {
      console.log('Validator still exists:', validator);
      
      // Force delete it
      console.log('\nForce deleting...');
      await prisma.validator.delete({
        where: { id: validatorId }
      });
      console.log('✅ Deleted!');
    } else {
      console.log('Validator does not exist in database');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkValidator();