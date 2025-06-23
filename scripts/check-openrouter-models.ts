#!/usr/bin/env npx tsx

import { config } from 'dotenv';
config();

async function checkOpenRouterModels() {
  console.log('🔍 Checking OpenRouter Model Availability\n');
  console.log('='.repeat(80));

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENROUTER_API_KEY not found in environment');
    return;
  }

  try {
    // Get available models from OpenRouter
    console.log('\n📋 Fetching available models from OpenRouter...\n');
    
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'V3RA Validator Check'
      }
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch models:', response.status, response.statusText);
      return;
    }

    const data = await response.json();
    const models = data.data;

    // Check our model IDs
    const ourModels = [
      'mistralai/mixtral-8x7b-instruct',
      'mistralai/mixtral-8x22b',
      'mistralai/mistral-7b-instruct',
      'google/gemini-pro-1.5',
      'google/gemini-2.0-flash-exp:free',
      'meta-llama/llama-3-70b-instruct',
      'anthropic/claude-3-sonnet'
    ];

    console.log('📊 Checking our model IDs:\n');
    
    for (const modelId of ourModels) {
      const found = models.find((m: any) => m.id === modelId);
      if (found) {
        console.log(`✅ ${modelId}`);
        console.log(`   Name: ${found.name}`);
        console.log(`   Context: ${found.context_length} tokens`);
        console.log(`   Pricing: $${found.pricing.prompt}/1M input, $${found.pricing.completion}/1M output`);
      } else {
        console.log(`❌ ${modelId} - NOT FOUND`);
        
        // Try to find similar models
        const provider = modelId.split('/')[0];
        const similar = models.filter((m: any) => m.id.startsWith(provider + '/'));
        if (similar.length > 0) {
          console.log(`   Alternatives:`);
          similar.slice(0, 3).forEach((m: any) => {
            console.log(`     - ${m.id} (${m.name})`);
          });
        }
      }
      console.log('');
    }

    // Show some free/cheap models
    console.log('\n💰 Free/Cheap Models Available:');
    const freeModels = models
      .filter((m: any) => m.id.includes(':free') || (m.pricing.prompt === 0 && m.pricing.completion === 0))
      .slice(0, 5);
    
    freeModels.forEach((m: any) => {
      console.log(`  - ${m.id} (${m.name})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkOpenRouterModels();