import { HfInference } from '@huggingface/inference';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY;

if (!HUGGING_FACE_API_KEY) {
  console.error('❌ HUGGING_FACE_API_KEY not found in environment variables');
  process.exit(1);
}

const hf = new HfInference(HUGGING_FACE_API_KEY);

// Test different model categories
async function testTextGeneration() {
  console.log('\n🔍 Testing Text Generation Models...');
  
  const models = [
    'gpt2',
    'microsoft/DialoGPT-small',
    'EleutherAI/gpt-neo-125M',
    'distilgpt2',
    'HuggingFaceH4/zephyr-7b-beta',
  ];
  
  for (const model of models) {
    try {
      console.log(`\nTesting ${model}...`);
      const result = await hf.textGeneration({
        model,
        inputs: 'The weather today is',
        parameters: {
          max_new_tokens: 20,
        },
      });
      console.log(`✅ ${model} WORKS:`, result.generated_text);
    } catch (error: any) {
      console.log(`❌ ${model} FAILED:`, error.message);
    }
  }
}

async function testChatCompletion() {
  console.log('\n\n🔍 Testing Chat Completion Models...');
  
  const models = [
    'microsoft/Phi-3-mini-4k-instruct',
    'meta-llama/Llama-3-8b-chat-hf',
    'mistralai/Mistral-7B-Instruct-v0.2',
    'HuggingFaceH4/zephyr-7b-beta',
    'tiiuae/falcon-7b-instruct',
  ];
  
  for (const model of models) {
    try {
      console.log(`\nTesting ${model}...`);
      const result = await hf.chatCompletion({
        model,
        messages: [
          { role: 'user', content: 'Hello, can you help me?' }
        ],
        max_tokens: 50,
      });
      console.log(`✅ ${model} WORKS:`, result.choices[0].message.content);
    } catch (error: any) {
      console.log(`❌ ${model} FAILED:`, error.message);
    }
  }
}

async function listAvailableModels() {
  console.log('\n\n🔍 Attempting to list recommended models...');
  
  try {
    // Try to get model recommendations
    const recommendedModels = {
      'text-generation': [
        'gpt2',
        'EleutherAI/gpt-neo-125M',
        'microsoft/DialoGPT-small',
        'HuggingFaceH4/zephyr-7b-beta',
      ],
      'text2text-generation': [
        'google/flan-t5-small',
        'google/flan-t5-base',
      ],
      'conversational': [
        'microsoft/DialoGPT-medium',
        'facebook/blenderbot-400M-distill',
      ]
    };
    
    console.log('📋 Recommended models by task:');
    for (const [task, models] of Object.entries(recommendedModels)) {
      console.log(`\n${task}:`);
      models.forEach(m => console.log(`  - ${m}`));
    }
  } catch (error) {
    console.error('Error listing models:', error);
  }
}

async function testWithInferenceEndpoint() {
  console.log('\n\n🔍 Testing with Inference Endpoints (serverless)...');
  
  try {
    // Test the most basic model
    const result = await hf.textGeneration({
      model: 'gpt2',
      inputs: 'Hello world',
    });
    console.log('✅ Basic inference works:', result);
  } catch (error: any) {
    console.log('❌ Basic inference failed:', error.message);
    
    // Try to understand the error
    if (error.message.includes('404')) {
      console.log('\n⚠️  The model might not be available on the free tier.');
      console.log('Consider using Inference Endpoints or other providers.');
    }
  }
}

async function main() {
  console.log('🚀 Testing HuggingFace Inference Client');
  console.log(`🔑 Using API key: ${HUGGING_FACE_API_KEY.substring(0, 10)}...`);
  
  await testTextGeneration();
  await testChatCompletion();
  await listAvailableModels();
  await testWithInferenceEndpoint();
  
  console.log('\n\n📊 RECOMMENDATIONS:');
  console.log('1. Use HuggingFaceH4/zephyr-7b-beta - it seems to be the most reliable');
  console.log('2. Consider using OpenRouter for HuggingFace models - better availability');
  console.log('3. Set up dedicated Inference Endpoints for production use');
  console.log('4. Monitor HuggingFace status page for API availability');
}

main().catch(console.error);