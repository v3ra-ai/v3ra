import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function addModelApiNames() {
  console.log('🔧 Adding API names for models\n');

  // Map of model_path to actual API model names
  const apiNameMappings = [
    // OpenAI models
    { model_path: 'openai/gpt-4o', api_name: 'gpt-4o' },
    { model_path: 'openai/gpt-4', api_name: 'gpt-4' },
    { model_path: 'openai/gpt-4-turbo', api_name: 'gpt-4-turbo' },
    { model_path: 'openai/gpt-3.5-turbo', api_name: 'gpt-3.5-turbo' },
    
    // Anthropic models
    { model_path: 'anthropic/claude-3.5-sonnet', api_name: 'claude-3-5-sonnet-20241022' },
    { model_path: 'anthropic/claude-3-opus', api_name: 'claude-3-opus-20240229' },
    { model_path: 'anthropic/claude-3-sonnet', api_name: 'claude-3-sonnet-20240229' },
    { model_path: 'anthropic/claude-3-haiku', api_name: 'claude-3-haiku-20240307' },
    
    // Google models
    { model_path: 'google/gemini-2.5-pro', api_name: 'gemini-1.5-pro' },
    { model_path: 'google/gemini-pro', api_name: 'gemini-1.5-pro' },
    { model_path: 'google/gemini-flash', api_name: 'gemini-1.5-flash' },
  ];

  for (const mapping of apiNameMappings) {
    try {
      // Find the model
      const model = await prisma.ai_models.findFirst({
        where: { model_path: mapping.model_path }
      });

      if (!model) {
        console.log(`⚠️  Model not found: ${mapping.model_path}`);
        continue;
      }

      // Update capabilities to include api_name
      const currentCapabilities = model.capabilities as any[] || [];
      const updatedCapabilities = [
        ...currentCapabilities.filter((cap: any) => 
          typeof cap !== 'object' || !cap.api_name
        ),
        { api_name: mapping.api_name }
      ];

      await prisma.ai_models.update({
        where: { id: model.id },
        data: {
          capabilities: updatedCapabilities
        }
      });

      console.log(`✅ Updated ${mapping.model_path} with API name: ${mapping.api_name}`);
    } catch (error) {
      console.error(`❌ Error updating ${mapping.model_path}:`, error);
    }
  }

  console.log('\n✨ Done!');
  await prisma.$disconnect();
}

addModelApiNames().catch(console.error);