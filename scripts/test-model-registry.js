const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function testModelRegistry() {
  console.log('🔍 Testing Model Registry and Database Connection...\n');

  // Check environment
  console.log('📍 Environment Check:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`   POSTGRES_URL_NON_POOLING: ${process.env.POSTGRES_URL_NON_POOLING ? '✅ Set' : '❌ Missing'}`);
  
  if (process.env.DATABASE_URL) {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl.includes('pooler.supabase.com:6543')) {
      console.log('   ✅ DATABASE_URL uses correct pooler port (6543)');
    } else if (dbUrl.includes('pooler.supabase.com:5432')) {
      console.log('   ⚠️  DATABASE_URL uses wrong port (5432) - should be 6543');
    }
  }
  
  try {
    console.log('\n📊 Testing Database Connection...');
    await prisma.$connect();
    console.log('   ✅ Connected to database');
    
    // Test 1: Direct query to ai_models
    console.log('\n1. Testing direct query to ai_models table:');
    const models = await prisma.$queryRaw`
      SELECT model_path, name, provider, category 
      FROM ai_models 
      WHERE is_active = true 
      LIMIT 5
    `;
    console.log(`   ✅ Found ${models.length} active models`);
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
          console.log(`   ✅ ${strategy}: ${result[0].model1.name} vs ${result[0].model2.name}`);
        } else {
          console.log(`   ❌ ${strategy}: Invalid response format`);
        }
      } catch (err) {
        console.log(`   ❌ ${strategy}: ${err.message}`);
      }
    }
    
    // Test 3: Verify the model registry service can parse the response
    console.log('\n3. Testing model registry service compatibility:');
    const result = await prisma.$queryRaw`
      SELECT * FROM get_blind_test_pair('SMART')
    `;
    
    if (result[0]) {
      console.log('   📋 Raw result structure:');
      console.log(`      - Has model1: ${!!result[0].model1}`);
      console.log(`      - Has model2: ${!!result[0].model2}`);
      
      // Check if we can extract the model data
      const model1 = result[0].model1;
      const model2 = result[0].model2;
      
      if (model1?.id && model2?.id) {
        console.log('   ✅ Models can be extracted correctly');
        console.log(`      Model 1: ${model1.name} (${model1.id})`);
        console.log(`      Model 2: ${model2.name} (${model2.id})`);
      } else {
        console.log('   ❌ Model extraction failed');
        console.log('   Raw data:', JSON.stringify(result[0], null, 2));
      }
    }
    
    console.log('\n✨ All tests completed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting Tips:');
    console.log('1. Check DATABASE_URL is set correctly in .env');
    console.log('2. Ensure the database is accessible');
    console.log('3. Verify ai_models table exists and has data');
    console.log('4. Run migrations: npx prisma migrate deploy');
  } finally {
    await prisma.$disconnect();
  }
}

testModelRegistry();