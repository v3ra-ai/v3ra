import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixOpenRouterApiKeys() {
  console.log('🔧 Fixing OpenRouter API key associations\n');

  try {
    // 1. Check if we have an OpenRouter API key in the database
    let openRouterKey = await prisma.apiKey.findFirst({
      where: {
        provider: { in: ['OpenRouter', 'openrouter', 'OPENROUTER'] }
      }
    });

    if (!openRouterKey) {
      console.log('Creating OpenRouter API key entry in database...');
      // Create a placeholder API key entry (the actual key comes from env)
      openRouterKey = await prisma.apiKey.create({
        data: {
          name: 'OpenRouter API Key',
          provider: 'OpenRouter',
          key: 'env:OPENROUTER_API_KEY', // Placeholder to indicate it uses env var
          isActive: true
        }
      });
      console.log('✅ Created OpenRouter API key entry\n');
    } else {
      console.log('✅ Found existing OpenRouter API key in database\n');
    }

    // 2. Get all active OpenRouter validators without API keys
    const validatorsWithoutKeys = await prisma.validator.findMany({
      where: {
        provider: { in: ['OpenRouter', 'openrouter', 'OPENROUTER'] },
        active: true,
        apiKeys: {
          none: {}
        }
      }
    });

    console.log(`Found ${validatorsWithoutKeys.length} active OpenRouter validators without API keys\n`);

    // 3. Associate the API key with each validator
    for (const validator of validatorsWithoutKeys) {
      console.log(`Associating API key with validator: ${validator.profileName}`);
      
      try {
        await prisma.validatorKey.create({
          data: {
            validatorId: validator.id,
            apiKeyId: openRouterKey.id
          }
        });
        console.log(`✅ Associated API key with ${validator.profileName}`);
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`⚠️  API key already associated with ${validator.profileName}`);
        } else {
          throw error;
        }
      }
    }

    // 4. Verify the associations
    console.log('\n📊 Verification:');
    const updatedValidators = await prisma.validator.findMany({
      where: {
        provider: { in: ['OpenRouter', 'openrouter', 'OPENROUTER'] },
        active: true
      },
      include: {
        apiKeys: {
          include: {
            apiKey: true
          }
        }
      }
    });

    let validatorsWithKeys = 0;
    let validatorsWithoutKeys2 = 0;

    for (const validator of updatedValidators) {
      if (validator.apiKeys.length > 0 && validator.apiKeys.some(k => k.apiKey.isActive)) {
        validatorsWithKeys++;
      } else {
        validatorsWithoutKeys2++;
      }
    }

    console.log(`\n✅ Active OpenRouter validators with API keys: ${validatorsWithKeys}`);
    console.log(`❌ Active OpenRouter validators without API keys: ${validatorsWithoutKeys2}`);

    if (validatorsWithKeys > 0) {
      console.log('\n✅ OpenRouter validators should now work with health checks!');
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixOpenRouterApiKeys();