import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Helper to encrypt API keys
function encryptApiKey(apiKey: string): string {
  return Buffer.from(apiKey).toString('hex');
}

async function setupBestValidators() {
  try {
    console.log("Setting up the best, most current LLM validators...\n");
    
    // First, clean up existing data
    console.log("Cleaning up existing validators and keys...");
    await prisma.validatorKey.deleteMany({});
    await prisma.validator.deleteMany({});
    await prisma.apiKey.deleteMany({});
    
    // Create API keys from environment variables
    const apiKeys = [
      {
        id: "openai-api-key",
        name: "OpenAI Production Key",
        provider: "OpenAI",
        key: encryptApiKey(process.env.OPENAI_API_KEY!),
      },
      {
        id: "anthropic-api-key",
        name: "Anthropic Production Key",
        provider: "Anthropic",
        key: encryptApiKey(process.env.ANTHROPIC_API_KEY!),
      },
      {
        id: "gemini-api-key",
        name: "Google Gemini Key",
        provider: "Google",
        key: encryptApiKey(process.env.GEMINI_API_KEY!),
      },
      {
        id: "grok-api-key",
        name: "xAI Grok Key",
        provider: "xAI",
        key: encryptApiKey(process.env.GROK_API_KEY!),
      },
      {
        id: "openrouter-api-key",
        name: "OpenRouter Universal Key",
        provider: "OpenRouter",
        key: encryptApiKey(process.env.OPENROUTER_API_KEY!),
      },
      {
        id: "huggingface-api-key",
        name: "HuggingFace Key",
        provider: "HuggingFace",
        key: encryptApiKey(process.env.HUGGING_FACE_API_KEY!),
      }
    ];

    // Create API keys
    console.log("\nCreating API keys...");
    for (const apiKey of apiKeys) {
      await prisma.apiKey.create({
        data: {
          ...apiKey,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log(`✅ Created: ${apiKey.name}`);
    }

    // Define the best, most current validators
    const bestValidators = [
      // Direct API providers (using their own keys)
      {
        id: crypto.randomUUID(),
        provider: "OpenAI",
        profileName: "GPT-4o",
        modelName: "gpt-4o",
        description: "OpenAI's flagship omnimodal model - handles text, vision, and complex reasoning",
        validatorType: "Multimodal Intelligence",
        avatarUrl: "/validators/openai.jpg",
        apiKeyId: "openai-api-key"
      },
      {
        id: crypto.randomUUID(),
        provider: "OpenAI",
        profileName: "GPT-4o Mini",
        modelName: "gpt-4o-mini",
        description: "Fast, affordable model for simple tasks with GPT-4 intelligence",
        validatorType: "Efficient Intelligence",
        avatarUrl: "/validators/openai.jpg",
        apiKeyId: "openai-api-key"
      },
      {
        id: crypto.randomUUID(),
        provider: "Anthropic",
        profileName: "Claude 3.5 Sonnet",
        modelName: "claude-3-5-sonnet-20241022",
        description: "Most intelligent Claude model - excels at analysis, coding, and creative tasks",
        validatorType: "Advanced Reasoning",
        avatarUrl: "/validators/anthropic.jpg",
        apiKeyId: "anthropic-api-key"
      },
      {
        id: crypto.randomUUID(),
        provider: "Anthropic",
        profileName: "Claude 3.5 Haiku",
        modelName: "claude-3-5-haiku-20241022",
        description: "Fastest Claude model - instant responses with strong performance",
        validatorType: "Speed-Optimized AI",
        avatarUrl: "/validators/anthropic.jpg",
        apiKeyId: "anthropic-api-key"
      },
      {
        id: crypto.randomUUID(),
        provider: "Google",
        profileName: "Gemini 2.0 Flash",
        modelName: "gemini-2.0-flash-exp",
        description: "Google's latest experimental model with blazing fast multimodal performance",
        validatorType: "Experimental Multimodal",
        avatarUrl: "/validators/gemini.jpg",
        apiKeyId: "gemini-api-key"
      },
      {
        id: crypto.randomUUID(),
        provider: "Google",
        profileName: "Gemini 1.5 Pro",
        modelName: "gemini-1.5-pro-002",
        description: "Advanced model with 2M token context window - handles massive documents",
        validatorType: "Long Context Expert",
        avatarUrl: "/validators/gemini.jpg",
        apiKeyId: "gemini-api-key"
      },
      {
        id: crypto.randomUUID(),
        provider: "xAI",
        profileName: "Grok 2",
        modelName: "grok-2-1212",
        description: "xAI's latest model with real-time knowledge and unique personality",
        validatorType: "Real-Time Intelligence",
        avatarUrl: "/validators/grok.jpg",
        apiKeyId: "grok-api-key"
      },
      
      // OpenRouter models (best available through their platform)
      {
        id: crypto.randomUUID(),
        provider: "OpenRouter",
        profileName: "Anthropic Opus",
        modelName: "anthropic/claude-3-opus",
        description: "Most capable Claude model for complex analysis and research",
        validatorType: "Research Grade AI",
        avatarUrl: "/validators/anthropic.jpg",
        apiKeyId: "openrouter-api-key"
      },
      {
        id: crypto.randomUUID(),
        provider: "OpenRouter",
        profileName: "DeepSeek V3",
        modelName: "deepseek/deepseek-chat",
        description: "Powerful Chinese model with excellent reasoning and coding abilities",
        validatorType: "Deep Reasoning",
        avatarUrl: "/validators/deepseek.jpg",
        apiKeyId: "openrouter-api-key"
      },
      {
        id: crypto.randomUUID(),
        provider: "OpenRouter",
        profileName: "Llama 3.3 70B",
        modelName: "meta-llama/llama-3.3-70b-instruct",
        description: "Meta's latest open model - rivals GPT-4 class performance",
        validatorType: "Open Frontier Model",
        avatarUrl: "/validators/meta.jpg",
        apiKeyId: "openrouter-api-key"
      },
      {
        id: crypto.randomUUID(),
        provider: "OpenRouter",
        profileName: "Qwen 2.5 72B",
        modelName: "qwen/qwen-2.5-72b-instruct",
        description: "Alibaba's flagship model - excellent for multilingual tasks",
        validatorType: "Multilingual Expert",
        avatarUrl: "/validators/qwen.jpg",
        apiKeyId: "openrouter-api-key"
      },
      {
        id: crypto.randomUUID(),
        provider: "OpenRouter",
        profileName: "Mistral Large",
        modelName: "mistral/mistral-large",
        description: "European AI powerhouse - strong reasoning with 128k context",
        validatorType: "European Excellence",
        avatarUrl: "/validators/mistral.jpg",
        apiKeyId: "openrouter-api-key"
      },
      {
        id: crypto.randomUUID(),
        provider: "OpenRouter",
        profileName: "Perplexity Online",
        modelName: "perplexity/llama-3.1-sonar-large-128k-online",
        description: "Real-time web search integrated AI - always up to date",
        validatorType: "Web-Connected AI",
        avatarUrl: "/validators/perplexity.jpg",
        apiKeyId: "openrouter-api-key"
      },
      {
        id: crypto.randomUUID(),
        provider: "OpenRouter",
        profileName: "Nous Hermes 3 405B",
        modelName: "nousresearch/hermes-3-llama-3.1-405b",
        description: "Uncensored 405B model - excellent for creative and unrestricted tasks",
        validatorType: "Unrestricted AI",
        avatarUrl: "/validators/nous.jpg",
        apiKeyId: "openrouter-api-key"
      },
      
      // Free/Open models via HuggingFace
      {
        id: crypto.randomUUID(),
        provider: "HuggingFace",
        profileName: "Mixtral 8x7B",
        modelName: "mistralai/Mixtral-8x7B-Instruct-v0.1",
        description: "Free mixture-of-experts model - great performance without cost",
        validatorType: "Free MoE Model",
        avatarUrl: "/validators/mistral.jpg",
        apiKeyId: "huggingface-api-key"
      },
      {
        id: crypto.randomUUID(),
        provider: "HuggingFace",
        profileName: "Zephyr 7B",
        modelName: "HuggingFaceH4/zephyr-7b-beta",
        description: "Free fine-tuned model - excellent for general tasks",
        validatorType: "Free Assistant",
        avatarUrl: "/validators/huggingface.jpg",
        apiKeyId: "huggingface-api-key"
      }
    ];

    // Create validators
    console.log("\nCreating validators...");
    for (const validator of bestValidators) {
      const { apiKeyId, ...validatorData } = validator;
      
      const created = await prisma.validator.create({
        data: {
          ...validatorData,
          publicKey: validator.id,
          isLeader: false,
          active: true,
          reliability: 0,
          totalVotes: 0,
          correctVotes: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        },
      });
      
      // Create ValidatorKey link
      await prisma.validatorKey.create({
        data: {
          id: crypto.randomUUID(),
          validatorId: created.id,
          apiKeyId: apiKeyId,
          createdAt: new Date(),
        },
      });
      
      console.log(`✅ Created: ${created.profileName} (${created.provider})`);
    }

    // Summary
    const summary = await prisma.validator.groupBy({
      by: ['provider'],
      _count: true,
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });
    
    console.log("\n✨ Setup completed!");
    console.log("\n📊 Validators by provider:");
    for (const item of summary) {
      console.log(`   ${item.provider}: ${item._count} models`);
    }
    
    console.log("\n🎯 Key features:");
    console.log("   - Latest models only (no deprecated versions)");
    console.log("   - Real API keys from environment");
    console.log("   - Mix of premium and free options");
    console.log("   - Web-connected models (Perplexity)");
    console.log("   - Long context models (Gemini 1.5 Pro)");
    console.log("   - Multimodal models (GPT-4o, Gemini)");
    console.log("   - Open source alternatives (Llama, Mixtral)");

  } catch (error) {
    console.error("Failed to setup validators:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute
setupBestValidators();