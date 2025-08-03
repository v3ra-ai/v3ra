import 'dotenv/config';
import { modelManager } from '../lib/services/model-manager';
import { prismaModelRegistry } from '../lib/services/prisma-model-registry';

async function testModelManager() {
  console.log('🔍 Testing Dynamic Model Manager\n');

  // Test 1: Get a random pair from database
  console.log('1️⃣ Getting random model pair:');
  const pair = await prismaModelRegistry.getRandomPair('SMART');
  
  if (!pair) {
    console.log('❌ Failed to get model pair');
    return;
  }

  console.log(`Model 1: ${pair[0].name} (${pair[0].model_path})`);
  console.log(`Model 2: ${pair[1].name} (${pair[1].model_path})`);

  // Test 2: Get validators for the models
  console.log('\n2️⃣ Getting validators dynamically:');
  
  const validator1 = await modelManager.getValidator(pair[0].model_path);
  const validator2 = await modelManager.getValidator(pair[1].model_path);

  console.log(`Validator 1: ${validator1 ? '✅ Created' : '❌ Failed'}`);
  console.log(`Validator 2: ${validator2 ? '✅ Created' : '❌ Failed'}`);

  // Test 3: Test validation
  if (validator1 && validator2) {
    console.log('\n3️⃣ Testing validators:');
    
    try {
      const [response1, response2] = await Promise.all([
        validator1.validate({
          statement: 'What is the capital of France?',
          context: '',
          queryMode: 'fact-check'
        }),
        validator2.validate({
          statement: 'What is the capital of France?',
          context: '',
          queryMode: 'fact-check'
        })
      ]);

      console.log(`\nResponse 1 (${pair[0].name}):`);
      console.log(`- Vote: ${response1.vote}`);
      console.log(`- Rationale: ${response1.rationale.substring(0, 100)}...`);
      
      console.log(`\nResponse 2 (${pair[1].name}):`);
      console.log(`- Vote: ${response2.vote}`);
      console.log(`- Rationale: ${response2.rationale.substring(0, 100)}...`);
    } catch (error: any) {
      console.log('❌ Validation error:', error.message);
    }
  }

  console.log('\n✨ Test complete!');
}

testModelManager().catch(console.error);