import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY;

if (!HUGGING_FACE_API_KEY) {
  console.error('❌ HUGGING_FACE_API_KEY not found in environment variables');
  process.exit(1);
}

// List of models to test - including the ones we think should work
const modelsToTest = [
  // Current models in our system
  "meta-llama/Meta-Llama-3-8B-Instruct",
  "meta-llama/Meta-Llama-3.1-8B-Instruct",
  "Qwen/Qwen2.5-72B-Instruct",
  "microsoft/Phi-3-mini-4k-instruct",
  "gpt2",
  "distilgpt2",
  
  // Alternative variations to try
  "meta-llama/Llama-3-8b-instruct",
  "meta-llama/Llama-3.1-8B-Instruct",
  "microsoft/phi-3-mini-4k-instruct",
  "HuggingFaceH4/zephyr-7b-beta",
  
  // Popular models that might work
  "mistralai/Mistral-7B-Instruct-v0.1",
  "tiiuae/falcon-7b-instruct",
  "google/flan-t5-base",
  "EleutherAI/gpt-neo-2.7B",
  "bigscience/bloom-560m",
  
  // Small models for testing
  "gpt2-medium",
  "gpt2-large",
  "microsoft/DialoGPT-small",
];

interface TestResult {
  model: string;
  status: 'working' | 'error' | 'loading';
  responseTime?: number;
  error?: string;
  details?: any;
}

async function testModel(modelId: string): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    // First, try the new router endpoint for chat models
    if (modelId.toLowerCase().includes('instruct') || modelId.toLowerCase().includes('chat')) {
      console.log(`\n🔍 Testing ${modelId} with router endpoint...`);
      
      const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUGGING_FACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: "Say 'Hello, I am working!'" }
          ],
          max_tokens: 50,
          temperature: 0.7
        }),
      });

      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${modelId} - WORKING (${responseTime}ms)`);
        console.log(`   Response: ${JSON.stringify(data).substring(0, 100)}...`);
        return { model: modelId, status: 'working', responseTime, details: data };
      } else {
        const errorText = await response.text();
        console.log(`❌ ${modelId} - ERROR ${response.status}: ${errorText.substring(0, 100)}`);
        
        if (response.status === 503) {
          return { model: modelId, status: 'loading', error: 'Model is loading' };
        }
        
        return { model: modelId, status: 'error', error: `${response.status}: ${errorText}` };
      }
    }
    
    // For non-chat models, try the legacy endpoint
    console.log(`\n🔍 Testing ${modelId} with legacy endpoint...`);
    
    const response = await fetch(`https://api-inference.huggingface.co/models/${modelId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUGGING_FACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: "The answer to life, the universe, and everything is",
        parameters: {
          max_new_tokens: 50,
          temperature: 0.7,
          return_full_text: false
        }
      }),
    });

    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${modelId} - WORKING (${responseTime}ms)`);
      console.log(`   Response: ${JSON.stringify(data).substring(0, 100)}...`);
      return { model: modelId, status: 'working', responseTime, details: data };
    } else {
      const errorText = await response.text();
      console.log(`❌ ${modelId} - ERROR ${response.status}: ${errorText.substring(0, 100)}`);
      
      if (response.status === 503) {
        return { model: modelId, status: 'loading', error: 'Model is loading' };
      }
      
      return { model: modelId, status: 'error', error: `${response.status}: ${errorText}` };
    }
    
  } catch (error) {
    console.log(`❌ ${modelId} - NETWORK ERROR: ${error}`);
    return { model: modelId, status: 'error', error: `Network error: ${error}` };
  }
}

async function main() {
  console.log('🚀 Starting HuggingFace Model Testing');
  console.log(`📋 Testing ${modelsToTest.length} models...`);
  console.log(`🔑 Using API key: ${HUGGING_FACE_API_KEY.substring(0, 10)}...`);
  
  const results: TestResult[] = [];
  
  // Test models sequentially to avoid rate limiting
  for (const model of modelsToTest) {
    const result = await testModel(model);
    results.push(result);
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n\n📊 SUMMARY OF RESULTS:');
  console.log('='.repeat(80));
  
  const workingModels = results.filter(r => r.status === 'working');
  const loadingModels = results.filter(r => r.status === 'loading');
  const errorModels = results.filter(r => r.status === 'error');
  
  console.log(`\n✅ WORKING MODELS (${workingModels.length}):`);
  workingModels.forEach(m => {
    console.log(`   - ${m.model} (${m.responseTime}ms)`);
  });
  
  if (loadingModels.length > 0) {
    console.log(`\n⏳ LOADING MODELS (${loadingModels.length}) - Try again later:`);
    loadingModels.forEach(m => {
      console.log(`   - ${m.model}`);
    });
  }
  
  console.log(`\n❌ FAILED MODELS (${errorModels.length}):`);
  errorModels.forEach(m => {
    console.log(`   - ${m.model}: ${m.error?.substring(0, 50)}...`);
  });
  
  // Generate update script
  if (workingModels.length > 0) {
    console.log('\n\n🔧 SUGGESTED MODEL UPDATES:');
    console.log('Add these to your huggingfaceModels array in validator-models.ts:');
    console.log('\n```typescript');
    workingModels.forEach(m => {
      const isChat = m.model.toLowerCase().includes('instruct') || m.model.toLowerCase().includes('chat');
      const displayName = m.model.split('/').pop()?.replace(/-/g, ' ').replace(/_/g, ' ') || m.model;
      console.log(`  {
    name: "${displayName}",
    provider: "HuggingFace",
    model_id: "${m.model}",
  },`);
    });
    console.log('```');
  }
}

// Run the test
main().catch(console.error);