import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY;

if (!HUGGING_FACE_API_KEY) {
  console.error('❌ HUGGING_FACE_API_KEY not found');
  process.exit(1);
}

// Test our three working models with different endpoints
const workingModels = [
  "microsoft/Phi-3-mini-4k-instruct",
  "mistralai/Mistral-7B-Instruct-v0.2",
  "HuggingFaceH4/zephyr-7b-beta"
];

async function testEndpoint(modelId: string, endpointType: 'router' | 'legacy') {
  console.log(`\n🔍 Testing ${modelId} with ${endpointType} endpoint...`);
  
  let endpoint: string;
  let payload: any;
  
  if (endpointType === 'router') {
    endpoint = 'https://router.huggingface.co/v1/chat/completions';
    payload = {
      model: modelId,
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Answer with just Yes or No: Is 2+2 equal to 4?" }
      ],
      max_tokens: 50,
      temperature: 0.3
    };
  } else {
    endpoint = `https://api-inference.huggingface.co/models/${modelId}`;
    payload = {
      inputs: "Answer with just Yes or No: Is 2+2 equal to 4?",
      parameters: {
        max_new_tokens: 50,
        temperature: 0.3,
        return_full_text: false
      }
    };
  }
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUGGING_FACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    const responseText = await response.text();
    
    if (response.ok) {
      console.log(`✅ SUCCESS with ${endpointType} endpoint`);
      console.log(`Response: ${responseText.substring(0, 200)}`);
      return true;
    } else {
      console.log(`❌ FAILED with ${endpointType} endpoint: ${response.status}`);
      console.log(`Error: ${responseText.substring(0, 200)}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ERROR with ${endpointType} endpoint:`, error);
    return false;
  }
}

async function main() {
  console.log('🚀 Testing HuggingFace Endpoints for Working Models');
  console.log(`🔑 Using API key: ${HUGGING_FACE_API_KEY.substring(0, 10)}...`);
  
  const results: { model: string; router: boolean; legacy: boolean }[] = [];
  
  for (const model of workingModels) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`MODEL: ${model}`);
    console.log('='.repeat(60));
    
    const routerWorks = await testEndpoint(model, 'router');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Delay to avoid rate limiting
    
    const legacyWorks = await testEndpoint(model, 'legacy');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    results.push({ model, router: routerWorks, legacy: legacyWorks });
  }
  
  console.log('\n\n📊 SUMMARY:');
  console.log('='.repeat(80));
  results.forEach(r => {
    console.log(`\n${r.model}:`);
    console.log(`  Router endpoint (chat/completions): ${r.router ? '✅ WORKS' : '❌ FAILS'}`);
    console.log(`  Legacy endpoint (models/): ${r.legacy ? '✅ WORKS' : '❌ FAILS'}`);
    
    if (!r.router && r.legacy) {
      console.log(`  ⚠️  RECOMMENDATION: Use legacy endpoint for this model`);
    } else if (r.router && !r.legacy) {
      console.log(`  ⚠️  RECOMMENDATION: Use router endpoint for this model`);
    }
  });
}

main().catch(console.error);