import 'dotenv/config';
import { getBlindTestComparison } from '../app/actions-blind-test';
import { prismaModelRegistry } from '../lib/services/prisma-model-registry';
import { validatorRegistry } from '../lib/validators/registry';
import { createLogger } from '../lib/logger';

const logger = createLogger('test-blind-api');

async function testBlindAPI() {
  console.log('🔍 Testing Blind Query API\n');

  // Test 1: Check API Keys
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

  // Test 2: Model Registry
  console.log('\n2️⃣ Testing Model Registry:');
  try {
    const models = await prismaModelRegistry.getActiveModels();
    console.log(`   ✅ Found ${models.length} active models`);
    
    const pair = await prismaModelRegistry.getRandomPair('SMART');
    console.log(`   ✅ Random pair: ${pair[0].name} vs ${pair[1].name}`);
  } catch (error) {
    console.log(`   ❌ Model registry error: ${error}`);
  }

  // Test 3: Validator Registry
  console.log('\n3️⃣ Testing Validator Registry:');
  try {
    const testModel = 'openai/gpt-4o';
    const validator = await validatorRegistry.getValidator(testModel);
    
    if (validator) {
      console.log(`   ✅ Validator for ${testModel} initialized`);
    } else {
      console.log(`   ❌ Failed to get validator for ${testModel}`);
    }
  } catch (error) {
    console.log(`   ❌ Validator error: ${error}`);
  }

  // Test 4: Blind Test Action
  console.log('\n4️⃣ Testing getBlindTestComparison:');
  try {
    const result = await getBlindTestComparison('What is the capital of France?', 'SMART');
    
    if ('error' in result) {
      console.log(`   ❌ Error: ${result.error}`);
    } else {
      console.log('   ✅ Success!');
      console.log(`   Session ID: ${result.id}`);
      console.log(`   Models: ${result.validatorResponses[0].profileName} vs ${result.validatorResponses[1].profileName}`);
      console.log(`   Response 1 length: ${result.validatorResponses[0].rationale.length} chars`);
      console.log(`   Response 2 length: ${result.validatorResponses[1].rationale.length} chars`);
    }
  } catch (error: any) {
    console.log(`   ❌ Action failed: ${error.message}`);
    if (error.stack) {
      console.log('   Stack trace:');
      console.log(error.stack.split('\n').slice(1, 5).join('\n'));
    }
  }

  // Test 5: Direct API Call
  console.log('\n5️⃣ Testing API endpoint directly:');
  try {
    const response = await fetch('http://localhost:3001/api/blind-test-query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        queryText: 'What is the capital of France?',
        pairingStrategy: 'SMART',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   ❌ API returned ${response.status}: ${errorText}`);
    } else {
      const result = await response.json();
      if ('error' in result) {
        console.log(`   ❌ API error: ${result.error}`);
      } else {
        console.log('   ✅ API call successful');
      }
    }
  } catch (error: any) {
    console.log(`   ❌ API call failed: ${error.message}`);
  }

  console.log('\n✨ Test complete!');
}

testBlindAPI().catch(console.error);