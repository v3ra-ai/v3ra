import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const newFlagshipModels = [
  {
    provider: 'OpenAI',
    modelName: 'gpt-4o',
    name: 'GPT-4o',
    description: 'OpenAI\'s latest multimodal flagship model',
    type: 'Flagship'
  },
  {
    provider: 'OpenAI',
    modelName: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Fast and efficient GPT-4o variant',
    type: 'Fast'
  },
  {
    provider: 'OpenAI',
    modelName: 'o1-preview',
    name: 'o1',
    description: 'OpenAI\'s advanced reasoning model',
    type: 'Reasoning'
  },
  {
    provider: 'Google',
    modelName: 'gemini-2.0-pro',
    name: 'Gemini 2.0 Pro',
    description: 'Google\'s latest flagship with January 2025 knowledge',
    type: 'Flagship'
  },
  {
    provider: 'Google',
    modelName: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    description: 'Fast Gemini 2.0 variant with recent knowledge',
    type: 'Fast'
  },
  {
    provider: 'xAI',
    modelName: 'xai/grok-3',
    name: 'Grok-3',
    description: 'xAI\'s latest model with February 2025 knowledge',
    type: 'Flagship'
  },
  {
    provider: 'Mistral',
    modelName: 'mistralai/mistral-large-latest',
    name: 'Mistral Large',
    description: 'Mistral\'s flagship model',
    type: 'Flagship'
  }
];

async function addNewFlagshipModels() {
  console.log('Adding new flagship models...');
  
  for (const model of newFlagshipModels) {
    try {
      // Check if already exists
      const existing = await prisma.validator.findFirst({
        where: {
          modelName: model.modelName,
          provider: model.provider
        }
      });
      
      if (!existing) {
        await prisma.validator.create({
          data: {
            id: uuidv4(),
            provider: model.provider,
            profileName: `${model.name} Validator`,
            modelName: model.modelName,
            active: true,
            publicKey: '',
            description: model.description,
            validatorType: model.type,
            updatedAt: new Date(),
          }
        });
        console.log(`✨ Added: ${model.name} (${model.provider})`);
      } else {
        console.log(`✅ Already exists: ${model.name}`);
      }
    } catch (error: any) {
      console.error(`❌ Error adding ${model.name}:`, error.message);
    }
  }
  
  const count = await prisma.validator.count();
  console.log(`\nTotal validators: ${count}`);
  
  await prisma.$disconnect();
}

addNewFlagshipModels();