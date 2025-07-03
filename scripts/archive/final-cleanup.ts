import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function finalCleanup() {
  console.log('Performing final cleanup of validators...');
  
  // First, get all validators grouped by modelName
  const validators = await prisma.validator.findMany({
    orderBy: { updatedAt: 'desc' }
  });
  
  // Find duplicates
  const seen = new Map();
  const toDelete = [];
  
  for (const validator of validators) {
    const key = validator.modelName;
    if (seen.has(key)) {
      // Keep the newer one, mark older for deletion
      toDelete.push(validator.id);
      console.log(`Found duplicate: ${validator.profileName} (${key})`);
    } else {
      seen.set(key, validator);
    }
  }
  
  // Delete duplicates
  if (toDelete.length > 0) {
    const result = await prisma.validator.deleteMany({
      where: { id: { in: toDelete } }
    });
    console.log(`\nDeleted ${result.count} duplicate validators`);
  }
  
  // Deactivate certain old models
  const modelsToDeactivate = [
    'codellama/codellama-70b-instruct',
    'microsoft/wizardlm-2-8x22b',
    'xai/grok-1',
    'xai/grok-beta'
  ];
  
  for (const modelName of modelsToDeactivate) {
    await prisma.validator.updateMany({
      where: { modelName },
      data: { active: false }
    });
  }
  
  // Final count
  const activeCount = await prisma.validator.count({ where: { active: true } });
  const totalCount = await prisma.validator.count();
  
  console.log(`\nFinal state:`);
  console.log(`Total validators: ${totalCount}`);
  console.log(`Active validators: ${activeCount}`);
  
  // List active models by provider
  const activeModels = await prisma.validator.findMany({
    where: { active: true },
    orderBy: [{ provider: 'asc' }, { profileName: 'asc' }],
    select: { provider: true, profileName: true, modelName: true }
  });
  
  let currentProvider = '';
  for (const model of activeModels) {
    if (model.provider !== currentProvider) {
      currentProvider = model.provider;
      console.log(`\n${currentProvider}:`);
    }
    console.log(`  - ${model.profileName.replace(' Validator', '')}`);
  }
  
  await prisma.$disconnect();
}

finalCleanup();