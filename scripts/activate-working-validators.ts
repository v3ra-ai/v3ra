#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

config();

const prisma = new PrismaClient();

async function activateWorkingValidators() {
  console.log('🎯 Simplifying Validator Setup - Jobs/Dorsey Style\n');
  console.log('Keep it simple. Make it work. Ship it.\n');
  console.log('='.repeat(80));

  try {
    // 1. Deactivate ALL validators first
    console.log('\n🔄 Step 1: Clean slate - deactivating all validators...');
    await prisma.validator.updateMany({
      data: { active: false }
    });

    // 2. Only activate validators we KNOW work
    console.log('\n✅ Step 2: Activating only proven working validators...');
    
    const workingValidators = [
      // OpenRouter validators that work
      { provider: 'OpenRouter', modelName: 'mistralai/mixtral-8x7b-instruct', name: 'Mixtral 8x7B' },
      { provider: 'OpenRouter', modelName: 'meta-llama/llama-3-70b-instruct', name: 'Llama 3 70B' },
      { provider: 'OpenRouter', modelName: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet' },
      { provider: 'OpenRouter', modelName: 'mistralai/mistral-7b-instruct', name: 'Mistral 7B Validator' },
      { provider: 'OpenRouter', modelName: 'mistralai/mixtral-8x22b', name: 'Mixtral 8x22B Validator' },
      
      // OpenAI validators (if API key has credits)
      { provider: 'OpenAI', modelName: 'gpt-4o', name: 'GPT-4o Validator' },
      { provider: 'OpenAI', modelName: 'gpt-4o-mini', name: 'GPT-4o Mini Validator' },
      { provider: 'OpenAI', modelName: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo Validator' },
      
      // Grok validators (if API key works)
      { provider: 'Grok', modelName: 'grok-1', name: 'Grok 1 Validator' },
      { provider: 'Grok', modelName: 'grok-beta', name: 'Grok Beta Validator' },
    ];

    for (const validator of workingValidators) {
      const updated = await prisma.validator.updateMany({
        where: {
          provider: validator.provider,
          modelName: validator.modelName
        },
        data: { active: true }
      });
      
      if (updated.count > 0) {
        console.log(`  ✅ Activated: ${validator.name}`);
      }
    }

    // 3. Fix the Gemini validators on OpenRouter
    console.log('\n🔧 Step 3: Fixing OpenRouter Gemini model names...');
    
    // Update Gemini Pro to correct OpenRouter model ID
    await prisma.validator.updateMany({
      where: {
        provider: 'OpenRouter',
        modelName: 'google/gemini-pro'
      },
      data: { 
        modelName: 'google/gemini-pro-1.5',
        active: true 
      }
    });

    // Update free Gemini models
    await prisma.validator.updateMany({
      where: {
        provider: 'OpenRouter',
        profileName: { contains: 'Gemini 2.0' }
      },
      data: { active: true }
    });

    // 4. Final count
    console.log('\n📊 Final Status:');
    const activeCount = await prisma.validator.count({ where: { active: true } });
    const totalCount = await prisma.validator.count();
    
    console.log(`  Active validators: ${activeCount}`);
    console.log(`  Total validators: ${totalCount}`);
    console.log(`  Simplification ratio: ${Math.round((1 - activeCount/totalCount) * 100)}% reduction`);

    console.log('\n✨ Done. Simple. Clean. Working.');

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

activateWorkingValidators();