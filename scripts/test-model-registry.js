const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function testModelRegistry() {
  try {
    console.log('Testing model registry...\n');
    
    // Test 1: Direct query to ai_models
    console.log('1. Testing direct query to ai_models table:');
    const models = await prisma.$queryRaw`
      SELECT model_path, name, provider, category 
      FROM ai_models 
      WHERE is_active = true 
      LIMIT 5
    `;
    console.log(`   ✓ Found ${models.length} active models`);
    models.forEach(m => console.log(`     - ${m.name} (${m.provider})`));
    
    // Test 2: Test get_blind_test_pair function
    console.log('\n2. Testing get_blind_test_pair function:');
    const strategies = ['SMART', 'UNDERDOG', 'TITANS', 'OPEN_SOURCE'];
    
    for (const strategy of strategies) {
      try {
        const result = await prisma.$queryRaw`
          SELECT * FROM get_blind_test_pair(${strategy})
        `;
        
        if (result[0]?.model1 && result[0]?.model2) {
          console.log(`   ✓ ${strategy}: ${result[0].model1.name} vs ${result[0].model2.name}`);
        } else {
          console.log(`   ✗ ${strategy}: Invalid response format`);
        }
      } catch (err) {
        console.log(`   ✗ ${strategy}: ${err.message}`);
      }
    }
    
    // Test 3: Verify the model registry service can parse the response
    console.log('\n3. Testing model registry service compatibility:');
    const result = await prisma.$queryRaw`
      SELECT * FROM get_blind_test_pair('SMART')
    `;
    
    if (result[0]) {
      console.log('   Raw result:', JSON.stringify(result[0], null, 2));
      
      // Check if we can extract the model data
      const model1 = result[0].model1;
      const model2 = result[0].model2;
      
      if (model1?.id && model2?.id) {
        console.log('   ✓ Models can be extracted correctly');
        console.log(`     Model 1: ${model1.name} (${model1.id})`);
        console.log(`     Model 2: ${model2.name} (${model2.id})`);
      } else {
        console.log('   ✗ Model extraction failed');
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testModelRegistry();