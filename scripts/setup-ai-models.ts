/**
 * Script to set up AI models in the database
 * Run with: npx tsx scripts/setup-ai-models.ts
 */

import { prisma } from '../lib/db/client';

async function setupAIModels() {
  console.log('Setting up AI models in database...');
  
  try {
    // Check if we have access to raw SQL
    const result = await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS ai_models (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        model_path VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        provider VARCHAR(100) NOT NULL,
        category VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        capabilities JSONB DEFAULT '[]',
        strengths JSONB DEFAULT '[]',
        cost_per_comparison DECIMAL(10,4),
        icon VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    console.log('Table created successfully');
    
    // Insert models
    const models = [
      // OpenAI
      { model_path: 'openai/gpt-4', name: 'GPT-4', provider: 'OpenAI', category: 'premium' },
      { model_path: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI', category: 'premium' },
      { model_path: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', category: 'budget' },
      
      // Anthropic
      { model_path: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', category: 'premium' },
      { model_path: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', category: 'premium' },
      { model_path: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic', category: 'budget' },
      
      // Google
      { model_path: 'google/gemini-pro', name: 'Gemini Pro', provider: 'Google', category: 'premium' },
      { model_path: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', provider: 'Google', category: 'premium' },
      
      // Meta
      { model_path: 'meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1 405B', provider: 'Meta', category: 'open-source' },
      { model_path: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', provider: 'Meta', category: 'open-source' },
      
      // Mistral
      { model_path: 'mistralai/mistral-large', name: 'Mistral Large', provider: 'Mistral', category: 'premium' },
      { model_path: 'mistralai/mixtral-8x22b-instruct', name: 'Mixtral 8x22B', provider: 'Mistral', category: 'specialist' },
      
      // Others
      { model_path: 'perplexity/sonar-large-online', name: 'Perplexity Sonar', provider: 'Perplexity', category: 'specialist' }
    ];
    
    for (const model of models) {
      try {
        await prisma.$executeRaw`
          INSERT INTO ai_models (model_path, name, provider, category)
          VALUES (${model.model_path}, ${model.name}, ${model.provider}, ${model.category})
          ON CONFLICT (model_path) DO NOTHING;
        `;
      } catch (err) {
        console.error(`Error inserting ${model.name}:`, err);
      }
    }
    
    console.log('AI models setup complete!');
    
  } catch (error) {
    console.error('Error setting up AI models:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupAIModels();