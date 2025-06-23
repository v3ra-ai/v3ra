#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';
import { keyService } from '../lib/services/keyService';
import { config } from 'dotenv';

config();

const prisma = new PrismaClient();

async function diagnoseValidators() {
  console.log('🔍 Validator System Diagnostics\n');
  console.log('='.repeat(80));

  try {
    // 1. Check validators
    console.log('\n📋 VALIDATORS IN DATABASE:');
    console.log('-'.repeat(60));
    
    const validators = await prisma.validator.findMany({
      include: { apiKeys: true },
      orderBy: { provider: 'asc' }
    });

    console.log(`Total validators: ${validators.length}`);
    console.log(`Active validators: ${validators.filter(v => v.active).length}\n`);

    const providerSummary: Record<string, { total: number; active: number; withKeys: number }> = {};

    validators.forEach(validator => {
      if (!providerSummary[validator.provider]) {
        providerSummary[validator.provider] = { total: 0, active: 0, withKeys: 0 };
      }
      providerSummary[validator.provider].total++;
      if (validator.active) providerSummary[validator.provider].active++;
      if (validator.apiKeys.length > 0) providerSummary[validator.provider].withKeys++;
    });

    console.log('Provider Summary:');
    Object.entries(providerSummary).forEach(([provider, stats]) => {
      console.log(`  ${provider}: ${stats.total} total, ${stats.active} active, ${stats.withKeys} with keys`);
    });

    // 2. Check API keys
    console.log('\n🔑 API KEYS IN DATABASE:');
    console.log('-'.repeat(60));
    
    const apiKeys = await keyService.listKeys();
    console.log(`Total API keys: ${apiKeys.length}`);
    console.log(`Active API keys: ${apiKeys.filter(k => k.isActive).length}\n`);

    const keysByProvider: Record<string, number> = {};
    apiKeys.forEach(key => {
      keysByProvider[key.provider] = (keysByProvider[key.provider] || 0) + 1;
    });

    console.log('Keys by Provider:');
    Object.entries(keysByProvider).forEach(([provider, count]) => {
      console.log(`  ${provider}: ${count} keys`);
    });

    // 3. Check environment variables
    console.log('\n🔐 ENVIRONMENT VARIABLES:');
    console.log('-'.repeat(60));
    
    const envVars = {
      'OPENAI_API_KEY': !!process.env.OPENAI_API_KEY,
      'ANTHROPIC_API_KEY': !!process.env.ANTHROPIC_API_KEY,
      'GOOGLE_API_KEY': !!process.env.GOOGLE_API_KEY,
      'GROK_API_KEY': !!process.env.GROK_API_KEY,
      'OPENROUTER_API_KEY': !!process.env.OPENROUTER_API_KEY,
      'HUGGINGFACE_API_KEY': !!process.env.HUGGINGFACE_API_KEY,
    };

    Object.entries(envVars).forEach(([key, exists]) => {
      console.log(`  ${key}: ${exists ? '✅ Set' : '❌ Not set'}`);
    });

    // 4. Check problematic validators
    console.log('\n⚠️  VALIDATORS WITHOUT API KEYS:');
    console.log('-'.repeat(60));
    
    const validatorsWithoutKeys = validators.filter(v => 
      v.active && 
      v.apiKeys.length === 0 && 
      !['OpenRouter', 'HuggingFace'].includes(v.provider)
    );

    if (validatorsWithoutKeys.length === 0) {
      console.log('✅ All active validators have API keys (except OpenRouter/HuggingFace)');
    } else {
      validatorsWithoutKeys.forEach(v => {
        console.log(`  ❌ ${v.profileName} (${v.provider}) - ID: ${v.id}`);
      });
    }

    // 5. Check unsupported providers
    console.log('\n🚫 UNSUPPORTED PROVIDERS:');
    console.log('-'.repeat(60));
    
    const supportedProviders = ['OpenAI', 'Anthropic', 'Google', 'Grok', 'OpenRouter', 'HuggingFace'];
    const unsupportedValidators = validators.filter(v => 
      v.active && !supportedProviders.includes(v.provider)
    );

    if (unsupportedValidators.length === 0) {
      console.log('✅ All active validators use supported providers');
    } else {
      unsupportedValidators.forEach(v => {
        console.log(`  ❌ ${v.profileName} uses unsupported provider: ${v.provider}`);
      });
    }

    // 6. Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('-'.repeat(60));
    
    if (validatorsWithoutKeys.length > 0) {
      console.log('1. Add API keys for validators without keys:');
      console.log('   - Use the admin panel at /admin/validators');
      console.log('   - Or add environment variables for the providers');
    }

    if (unsupportedValidators.length > 0) {
      console.log('\n2. Deactivate or remove validators with unsupported providers');
    }

    if (apiKeys.length === 0 && Object.values(envVars).every(v => !v)) {
      console.log('\n3. You need to add API keys to use validators!');
      console.log('   - Add them via environment variables in .env file');
      console.log('   - Or use the admin panel to add encrypted keys');
    }

  } catch (error) {
    console.error('Error during diagnostics:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseValidators();