#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';
import { keyService } from '../lib/services/keyService';
import { config } from 'dotenv';

config();

const prisma = new PrismaClient();

async function fixValidatorSetup() {
  console.log('🔧 Fixing Validator Setup\n');
  console.log('='.repeat(80));

  try {
    // 1. Create API keys from environment variables
    console.log('\n📝 Step 1: Creating API keys from environment variables...');
    console.log('-'.repeat(60));

    const envKeys = [
      { provider: 'OpenAI', envVar: 'OPENAI_API_KEY', name: 'OpenAI API Key' },
      { provider: 'Anthropic', envVar: 'ANTHROPIC_API_KEY', name: 'Anthropic API Key' },
      { provider: 'Google', envVar: 'GOOGLE_API_KEY', name: 'Google API Key' },
      { provider: 'xAI', envVar: 'GROK_API_KEY', name: 'Grok API Key' },
      { provider: 'OpenRouter', envVar: 'OPENROUTER_API_KEY', name: 'OpenRouter API Key' },
      { provider: 'HuggingFace', envVar: 'HUGGINGFACE_API_KEY', name: 'HuggingFace API Key' },
    ];

    for (const { provider, envVar, name } of envKeys) {
      const value = process.env[envVar];
      if (value) {
        // Check if key already exists
        const existingKeys = await keyService.getKeysByProvider(provider);
        if (existingKeys.length === 0) {
          console.log(`  ✅ Creating ${name}...`);
          await keyService.addKey({
            name,
            provider,
            value,
            active: true
          });
        } else {
          console.log(`  ℹ️  ${name} already exists`);
        }
      } else {
        console.log(`  ⚠️  ${envVar} not set, skipping`);
      }
    }

    // 2. Link API keys to validators
    console.log('\n🔗 Step 2: Linking API keys to validators...');
    console.log('-'.repeat(60));

    const supportedProviders = ['OpenAI', 'Anthropic', 'Google', 'xAI', 'OpenRouter', 'HuggingFace'];
    
    for (const provider of supportedProviders) {
      const apiKeys = await keyService.getKeysByProvider(provider);
      
      if (apiKeys.length > 0) {
        const validators = await prisma.validator.findMany({
          where: { 
            provider: provider === 'xAI' ? 'xAI' : provider,
            active: true 
          },
          include: { apiKeys: true }
        });

        for (const validator of validators) {
          if (validator.apiKeys.length === 0) {
            console.log(`  🔗 Linking ${provider} key to ${validator.profileName}`);
            await prisma.validatorKey.create({
              data: {
                validatorId: validator.id,
                apiKeyId: apiKeys[0].id,
              }
            });
          }
        }
      }
    }

    // 3. Deactivate validators with unsupported providers
    console.log('\n🚫 Step 3: Deactivating validators with unsupported providers...');
    console.log('-'.repeat(60));

    const unsupportedProviders = [
      '01-AI', 'Cognitive Computations', 'DeepSeek', 'Gryphe', 'Intel', 
      'Meta', 'Mistral', 'Nous Research', 'OpenOrca', 'Perplexity', 
      'Phind', 'Qwen', 'Undi95', 'WizardLM', 'Zephyr'
    ];

    for (const provider of unsupportedProviders) {
      const result = await prisma.validator.updateMany({
        where: { provider, active: true },
        data: { active: false }
      });
      
      if (result.count > 0) {
        console.log(`  ❌ Deactivated ${result.count} ${provider} validators`);
      }
    }

    // 4. Fix xAI/Grok mapping
    console.log('\n🔄 Step 4: Fixing xAI/Grok provider mapping...');
    console.log('-'.repeat(60));

    // Update xAI validators to use Grok provider (since the code expects "Grok")
    const xaiValidators = await prisma.validator.updateMany({
      where: { provider: 'xAI' },
      data: { provider: 'Grok' }
    });
    
    if (xaiValidators.count > 0) {
      console.log(`  ✅ Updated ${xaiValidators.count} xAI validators to Grok provider`);
    }

    // 5. Final verification
    console.log('\n✅ Step 5: Verifying setup...');
    console.log('-'.repeat(60));

    const activeValidators = await prisma.validator.findMany({
      where: { active: true },
      include: { apiKeys: true }
    });

    const withKeys = activeValidators.filter(v => v.apiKeys.length > 0);
    const withoutKeys = activeValidators.filter(v => 
      v.apiKeys.length === 0 && !['OpenRouter', 'HuggingFace'].includes(v.provider)
    );

    console.log(`  Total active validators: ${activeValidators.length}`);
    console.log(`  Validators with API keys: ${withKeys.length}`);
    console.log(`  Validators without keys (excluding OpenRouter/HF): ${withoutKeys.length}`);

    if (withoutKeys.length > 0) {
      console.log('\n  ⚠️  Still missing keys for:');
      withoutKeys.forEach(v => {
        console.log(`    - ${v.profileName} (${v.provider})`);
      });
    }

    console.log('\n✨ Setup complete! Try running a query now.');

  } catch (error) {
    console.error('\n❌ Error during setup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixValidatorSetup();