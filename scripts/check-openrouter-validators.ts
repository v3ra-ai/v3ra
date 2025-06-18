import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOpenRouterValidators() {
  console.log('🔍 Checking OpenRouter validators and their API key associations\n');

  try {
    // 1. Check if OPENROUTER_API_KEY environment variable is set
    console.log('1. Environment Variable Check:');
    const hasEnvKey = !!process.env.OPENROUTER_API_KEY;
    console.log(`   OPENROUTER_API_KEY is ${hasEnvKey ? '✅ SET' : '❌ NOT SET'}\n`);

    // 2. Get all OpenRouter validators
    console.log('2. OpenRouter Validators:');
    const openRouterValidators = await prisma.validator.findMany({
      where: { 
        provider: { in: ['OpenRouter', 'openrouter', 'OPENROUTER'] }
      },
      include: {
        apiKeys: {
          include: {
            apiKey: true
          }
        }
      }
    });

    console.log(`   Found ${openRouterValidators.length} OpenRouter validators\n`);

    if (openRouterValidators.length === 0) {
      console.log('   ⚠️  No OpenRouter validators found in the database\n');
    }

    // 3. Check each validator's API key status
    console.log('3. Validator Details:');
    for (const validator of openRouterValidators) {
      console.log(`\n   Validator: ${validator.profileName} (${validator.id})`);
      console.log(`   - Provider: ${validator.provider}`);
      console.log(`   - Model: ${validator.modelName}`);
      console.log(`   - Active: ${validator.active ? '✅' : '❌'}`);
      console.log(`   - API Keys: ${validator.apiKeys.length}`);
      
      if (validator.apiKeys.length > 0) {
        console.log('   - API Key Details:');
        for (const keyRelation of validator.apiKeys) {
          console.log(`     • Key ID: ${keyRelation.apiKeyId}`);
          console.log(`       Name: ${keyRelation.apiKey.name}`);
          console.log(`       Provider: ${keyRelation.apiKey.provider}`);
          console.log(`       Active: ${keyRelation.apiKey.isActive ? '✅' : '❌'}`);
        }
      } else {
        console.log('   - ⚠️  No API keys associated with this validator');
      }
    }

    // 4. Check for OpenRouter API keys in the database
    console.log('\n4. OpenRouter API Keys in Database:');
    const openRouterKeys = await prisma.apiKey.findMany({
      where: {
        provider: { in: ['OpenRouter', 'openrouter', 'OPENROUTER'] }
      }
    });

    console.log(`   Found ${openRouterKeys.length} OpenRouter API keys\n`);
    
    for (const key of openRouterKeys) {
      console.log(`   - Key: ${key.name} (${key.id})`);
      console.log(`     Provider: ${key.provider}`);
      console.log(`     Active: ${key.isActive ? '✅' : '❌'}`);
      console.log(`     Created: ${key.createdAt.toISOString()}`);
      console.log(`     Last Used: ${key.lastUsed?.toISOString() || 'Never'}\n`);
    }

    // 5. Identify the issue
    console.log('5. Analysis:');
    if (!hasEnvKey && openRouterValidators.length > 0) {
      console.log('   ❌ ISSUE: OpenRouter validators exist but OPENROUTER_API_KEY environment variable is not set');
      console.log('   The OpenRouter validator implementation only uses environment variables, not database keys');
    } else if (hasEnvKey && openRouterValidators.length === 0) {
      console.log('   ⚠️  OPENROUTER_API_KEY is set but no OpenRouter validators exist in the database');
    } else if (!hasEnvKey && openRouterValidators.length === 0) {
      console.log('   ℹ️  No OpenRouter setup found (no env key, no validators)');
    } else {
      console.log('   ✅ OpenRouter setup appears correct (env key set and validators exist)');
    }

    // 6. Check if health service would find validator instances
    console.log('\n6. Health Service Compatibility Check:');
    let foundValidInstance = false;
    for (const validator of openRouterValidators) {
      if (validator.active && validator.apiKeys.some(k => k.apiKey.isActive)) {
        foundValidInstance = true;
        console.log(`   ✅ Validator "${validator.profileName}" has active API key association`);
      } else if (validator.active) {
        console.log(`   ⚠️  Validator "${validator.profileName}" is active but has no active API key`);
      }
    }

    if (!foundValidInstance && openRouterValidators.length > 0) {
      console.log('\n   ❌ No OpenRouter validators have active API key associations');
      console.log('   This explains why health checks fail with "No validator instance available"');
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkOpenRouterValidators();