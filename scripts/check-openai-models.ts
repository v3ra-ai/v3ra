#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOpenAIModels() {
  const openaiValidators = await prisma.validator.findMany({
    where: { provider: 'OpenAI' },
    select: { id: true, profileName: true, modelName: true, active: true }
  });

  console.log('OpenAI Validators:');
  openaiValidators.forEach(v => {
    console.log(`${v.active ? '✅' : '❌'} ${v.profileName}: ${v.modelName}`);
  });

  await prisma.$disconnect();
}

checkOpenAIModels();