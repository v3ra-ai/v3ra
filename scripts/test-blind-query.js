require('dotenv').config();

async function testBlindQuery() {
  console.log('🔍 Testing Blind Query Functionality\n');

  // Test environment variables
  console.log('1️⃣ Checking API Keys:');
  const apiKeys = {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  };

  let allKeysPresent = true;
  for (const [key, value] of Object.entries(apiKeys)) {
    if (value) {
      console.log(`   ✅ ${key}: Set`);
    } else {
      console.log(`   ❌ ${key}: Missing`);
      allKeysPresent = false;
    }
  }

  if (!allKeysPresent) {
    console.log('\n⚠️  Some API keys are missing. This will cause validator initialization to fail.');
  }

  // Test the action directly
  console.log('\n2️⃣ Testing getBlindTestComparison directly:');
  try {
    const { getBlindTestComparison } = await import('../app/actions-blind-test.js');
    
    const result = await getBlindTestComparison('What is the capital of France?', 'SMART');
    
    if ('error' in result) {
      console.log('   ❌ Error:', result.error);
    } else {
      console.log('   ✅ Success!');
      console.log('   Models:', result.validatorResponses.map(r => r.profileName).join(' vs '));
      console.log('   Responses received:', result.validatorResponses.length);
    }
  } catch (error) {
    console.log('   ❌ Failed:', error.message);
    console.log('   Stack:', error.stack);
  }

  // Test model registry
  console.log('\n3️⃣ Testing Model Registry:');
  try {
    const { PrismaModelRegistry } = await import('../lib/services/prisma-model-registry.js');
    const registry = new PrismaModelRegistry();
    
    const models = await registry.getActiveModels();
    console.log(`   Found ${models.length} active models`);
    
    const pair = await registry.getRandomPair('SMART');
    console.log(`   Random pair: ${pair[0].name} vs ${pair[1].name}`);
  } catch (error) {
    console.log('   ❌ Model registry error:', error.message);
  }

  // Test validator registry
  console.log('\n4️⃣ Testing Validator Registry:');
  try {
    const { validatorRegistry } = await import('../lib/validators/registry.js');
    
    // Try to get a validator
    const testModel = 'openai/gpt-4o';
    console.log(`   Testing validator for ${testModel}:`);
    
    const validator = await validatorRegistry.getValidator(testModel);
    if (validator) {
      console.log('   ✅ Validator initialized');
      
      // Test validation
      const response = await validator.validate({
        statement: 'Paris is the capital of France',
        context: '',
        queryMode: 'fact-check'
      });
      
      console.log('   ✅ Validation successful');
      console.log('   Vote:', response.vote);
    } else {
      console.log('   ❌ Failed to get validator');
    }
  } catch (error) {
    console.log('   ❌ Validator error:', error.message);
  }

  console.log('\n✨ Test complete!');
}

testBlindQuery().catch(console.error);