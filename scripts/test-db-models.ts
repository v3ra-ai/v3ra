import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testDatabaseModels() {
  console.log('🔍 Testing Database Models\n');

  try {
    // Test 1: Get all models from ai_models table
    console.log('1️⃣ Fetching all AI models:');
    const allModels = await prisma.ai_models.findMany({
      where: { is_active: true },
      select: {
        id: true,
        model_path: true,
        name: true,
        provider: true,
        category: true
      },
      take: 10
    });

    console.log(`Found ${allModels.length} active models:`);
    allModels.forEach(model => {
      console.log(`  - ${model.name}`);
      console.log(`    ID: ${model.id}`);
      console.log(`    Path: ${model.model_path}`);
      console.log(`    Provider: ${model.provider}`);
    });

    // Test 2: Test get_blind_test_pair function
    console.log('\n2️⃣ Testing get_blind_test_pair function:');
    const result = await prisma.$queryRaw<any[]>`
      SELECT * FROM get_blind_test_pair('SMART');
    `;

    if (result && result.length > 0) {
      console.log('Raw result:', JSON.stringify(result[0], null, 2));
      
      const { model1, model2 } = result[0];
      console.log('\nModel 1:');
      console.log('  ID:', model1.id);
      console.log('  model_path:', model1.model_path);
      console.log('  Name:', model1.name);
      
      console.log('\nModel 2:');
      console.log('  ID:', model2.id);
      console.log('  model_path:', model2.model_path);
      console.log('  Name:', model2.name);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseModels();