import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Helper to encrypt API keys (matching the pattern in the backup)
function encryptApiKey(apiKey: string): string {
  // For demo purposes, we'll use a simple hex encoding
  // In production, use proper encryption
  return Buffer.from(apiKey).toString('hex');
}

async function createApiKeysAndLinkValidators() {
  try {
    console.log("Creating API keys and linking to validators...\n");
    
    // Define API keys for each provider
    const apiKeys = [
      {
        id: "openai-key-001",
        name: "OpenAI API Key",
        provider: "OpenAI",
        key: encryptApiKey(process.env.OPENAI_API_KEY || "sk-demo-key"),
      },
      {
        id: "anthropic-key-001",
        name: "Anthropic API Key",
        provider: "Anthropic",
        key: encryptApiKey(process.env.ANTHROPIC_API_KEY || "sk-ant-demo-key"),
      },
      {
        id: "google-key-001",
        name: "Google API Key",
        provider: "Google",
        key: encryptApiKey(process.env.GOOGLE_API_KEY || "AIza-demo-key"),
      },
      {
        id: "perplexity-key-001",
        name: "Perplexity API Key",
        provider: "Perplexity",
        key: encryptApiKey(process.env.PERPLEXITY_API_KEY || "pplx-demo-key"),
      },
      {
        id: "xai-key-001",
        name: "xAI API Key",
        provider: "xAI",
        key: encryptApiKey(process.env.XAI_API_KEY || "xai-demo-key"),
      },
      {
        id: "meta-key-001",
        name: "Meta API Key",
        provider: "Meta",
        key: encryptApiKey(process.env.META_API_KEY || "meta-demo-key"),
      },
      {
        id: "mistral-key-001",
        name: "Mistral API Key",
        provider: "Mistral",
        key: encryptApiKey(process.env.MISTRAL_API_KEY || "mistral-demo-key"),
      },
      {
        id: "cohere-key-001",
        name: "Cohere API Key",
        provider: "Cohere",
        key: encryptApiKey(process.env.COHERE_API_KEY || "cohere-demo-key"),
      },
      {
        id: "deepseek-key-001",
        name: "DeepSeek API Key",
        provider: "DeepSeek",
        key: encryptApiKey(process.env.DEEPSEEK_API_KEY || "deepseek-demo-key"),
      },
      {
        id: "openrouter-key-001",
        name: "OpenRouter API Key",
        provider: "OpenRouter",
        key: encryptApiKey(process.env.OPENROUTER_API_KEY || "sk-or-demo-key"),
      }
    ];

    // Create API keys
    for (const apiKey of apiKeys) {
      try {
        await prisma.apiKey.upsert({
          where: { id: apiKey.id },
          update: {
            isActive: true,
            updatedAt: new Date(),
          },
          create: {
            id: apiKey.id,
            name: apiKey.name,
            provider: apiKey.provider,
            key: apiKey.key,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        console.log(`✅ Created/Updated API key: ${apiKey.name}`);
      } catch (error) {
        console.error(`❌ Error with API key ${apiKey.name}:`, error);
      }
    }

    // Get all validators
    const validators = await prisma.validator.findMany({
      orderBy: { createdAt: 'desc' }
    });

    console.log(`\nFound ${validators.length} validators to link...\n`);

    // Map validators to appropriate API keys
    const validatorKeyMappings = validators.map(validator => {
      let apiKeyId: string;
      
      switch (validator.provider) {
        case "OpenAI":
          apiKeyId = "openai-key-001";
          break;
        case "Anthropic":
          apiKeyId = "anthropic-key-001";
          break;
        case "Google":
          apiKeyId = "google-key-001";
          break;
        case "Perplexity":
          apiKeyId = "perplexity-key-001";
          break;
        case "xAI":
          apiKeyId = "xai-key-001";
          break;
        case "Meta":
          apiKeyId = "meta-key-001";
          break;
        case "Mistral":
          apiKeyId = "mistral-key-001";
          break;
        case "Cohere":
          apiKeyId = "cohere-key-001";
          break;
        case "DeepSeek":
          apiKeyId = "deepseek-key-001";
          break;
        case "OpenRouter":
          apiKeyId = "openrouter-key-001";
          break;
        default:
          // Default to OpenRouter for unknown providers
          apiKeyId = "openrouter-key-001";
      }

      return {
        validatorId: validator.id,
        apiKeyId: apiKeyId,
        validatorName: validator.profileName,
      };
    });

    // Create ValidatorKey links
    let linkedCount = 0;
    for (const mapping of validatorKeyMappings) {
      try {
        await prisma.validatorKey.create({
          data: {
            id: crypto.randomUUID(),
            validatorId: mapping.validatorId,
            apiKeyId: mapping.apiKeyId,
            createdAt: new Date(),
          },
        });
        console.log(`✅ Linked: ${mapping.validatorName} -> ${mapping.apiKeyId}`);
        linkedCount++;
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`⚠️  Already linked: ${mapping.validatorName}`);
        } else {
          console.error(`❌ Error linking ${mapping.validatorName}:`, error.message);
        }
      }
    }

    console.log(`\n✨ API key creation and linking completed!`);
    console.log(`   Created/Updated: ${apiKeys.length} API keys`);
    console.log(`   Linked: ${linkedCount} validators to API keys`);
    
    // Show summary
    const summary = await prisma.validatorKey.groupBy({
      by: ['apiKeyId'],
      _count: true,
    });
    
    console.log("\n📊 Summary by API Key:");
    for (const item of summary) {
      const apiKey = await prisma.apiKey.findUnique({
        where: { id: item.apiKeyId },
        select: { name: true }
      });
      console.log(`   ${apiKey?.name}: ${item._count} validators`);
    }

  } catch (error) {
    console.error("Failed to create API keys:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the function
createApiKeysAndLinkValidators();