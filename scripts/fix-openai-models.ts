#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixOpenAIModels() {
  console.log('🔧 Fixing OpenAI Model Names\n');

  // Fix model names that have "openai/" prefix
  const updates = [
    { old: 'openai/gpt-4o', new: 'gpt-4o-2024-08-06' },
    { old: 'openai/gpt-4o-mini', new: 'gpt-4o-mini-2024-07-18' },
    { old: 'gpt-4', new: 'gpt-4-0613' },
    { old: 'gpt-4-1106-preview', new: 'gpt-4-turbo-preview' },
  ];

  for (const { old, new: newName } of updates) {
    const result = await prisma.validator.updateMany({
      where: {
        provider: 'OpenAI',
        modelName: old
      },
      data: { 
        modelName: newName,
        active: ['gpt-3.5-turbo', 'gpt-4o-2024-08-06', 'gpt-4o-mini-2024-07-18'].includes(newName)
      }
    });
    
    if (result.count > 0) {
      console.log(`✅ Fixed: ${old} → ${newName} (${result.count} validators)`);
    }
  }

  // Ensure gpt-3.5-turbo is active
  await prisma.validator.updateMany({
    where: {
      provider: 'OpenAI',
      modelName: 'gpt-3.5-turbo'
    },
    data: { active: true }
  });

  console.log('\n📊 Final OpenAI validators:');
  const openaiValidators = await prisma.validator.findMany({
    where: { provider: 'OpenAI', active: true },
    select: { profileName: true, modelName: true }
  });

  openaiValidators.forEach(v => {
    console.log(`  ✅ ${v.profileName}: ${v.modelName}`);
  });

  await prisma.$disconnect();
}

fixOpenAIModels();