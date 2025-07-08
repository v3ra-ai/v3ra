import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Curated list of top 10-20 newest and best models
const curatedValidators = [
  // Latest Claude models
  {
    id: uuidv4(),
    provider: "Anthropic",
    profileName: "Claude Opus 4",
    modelName: "claude-opus-4-20250514",
    description: "Anthropic's most powerful model with advanced reasoning capabilities",
    validatorType: "Advanced Reasoning Engine",
    avatarUrl: "/validators/anthropic.jpg",
    active: true
  },
  {
    id: uuidv4(),
    provider: "Anthropic",
    profileName: "Claude Sonnet 4",
    modelName: "claude-sonnet-4-20250514",
    description: "High performance model balancing speed and intelligence",
    validatorType: "Balanced Performance Engine",
    avatarUrl: "/validators/anthropic.jpg",
    active: true
  },
  {
    id: uuidv4(),
    provider: "Anthropic",
    profileName: "Claude 3.5 Sonnet",
    modelName: "claude-3-5-sonnet-20241022",
    description: "Enhanced Sonnet with improved capabilities",
    validatorType: "Enhanced Reasoning Engine",
    avatarUrl: "/validators/anthropic.jpg",
    active: true
  },

  // Latest OpenAI models
  {
    id: uuidv4(),
    provider: "OpenAI",
    profileName: "GPT-4o",
    modelName: "gpt-4o",
    description: "OpenAI's flagship omnimodal model with vision and advanced reasoning",
    validatorType: "Multimodal Intelligence",
    avatarUrl: "/validators/openai.jpg",
    active: true
  },
  {
    id: uuidv4(),
    provider: "OpenAI",
    profileName: "GPT-4 Turbo",
    modelName: "gpt-4-turbo-preview",
    description: "Fast and efficient GPT-4 with extended context window",
    validatorType: "Extended Context Engine",
    avatarUrl: "/validators/openai.jpg",
    active: true
  },

  // Google's latest
  {
    id: uuidv4(),
    provider: "Google",
    profileName: "Gemini 2.0 Flash",
    modelName: "gemini-2.0-flash-exp",
    description: "Google's latest experimental model with blazing fast performance",
    validatorType: "Ultra-Fast Intelligence",
    avatarUrl: "/validators/gemini.jpg",
    active: true
  },
  {
    id: uuidv4(),
    provider: "Google",
    profileName: "Gemini 1.5 Pro",
    modelName: "gemini-1.5-pro",
    description: "Google's advanced model with 1M+ context window",
    validatorType: "Extended Memory Engine",
    avatarUrl: "/validators/gemini.jpg",
    active: true
  },

  // Perplexity Online
  {
    id: uuidv4(),
    provider: "Perplexity",
    profileName: "Perplexity Online",
    modelName: "pplx-70b-online",
    description: "Real-time web-connected AI with up-to-date information",
    validatorType: "Web-Connected Intelligence",
    avatarUrl: "/validators/perplexity.jpg",
    active: true
  },

  // xAI's Grok
  {
    id: uuidv4(),
    provider: "xAI",
    profileName: "Grok-2",
    modelName: "grok-2",
    description: "xAI's latest model with real-time knowledge and wit",
    validatorType: "Real-Time Reasoning",
    avatarUrl: "/validators/grok.jpg",
    active: true
  },

  // Meta's best open models
  {
    id: uuidv4(),
    provider: "Meta",
    profileName: "Llama 3.1 405B",
    modelName: "meta-llama/llama-3.1-405b-instruct",
    description: "Meta's largest open model competing with GPT-4",
    validatorType: "Open Frontier Model",
    avatarUrl: "/validators/meta.jpg",
    active: true
  },
  {
    id: uuidv4(),
    provider: "Meta",
    profileName: "Llama 3.1 70B",
    modelName: "meta-llama/llama-3.1-70b-instruct",
    description: "Efficient open model with strong performance",
    validatorType: "Open Performance Model",
    avatarUrl: "/validators/meta.jpg",
    active: true
  },

  // Mistral's latest
  {
    id: uuidv4(),
    provider: "Mistral",
    profileName: "Mistral Large 2",
    modelName: "mistral-large-2",
    description: "Mistral's flagship model with 128k context",
    validatorType: "European AI Excellence",
    avatarUrl: "/validators/mistral.jpg",
    active: true
  },
  {
    id: uuidv4(),
    provider: "Mistral",
    profileName: "Mixtral 8x22B",
    modelName: "mixtral-8x22b",
    description: "Powerful mixture of experts model",
    validatorType: "MoE Architecture",
    avatarUrl: "/validators/mistral.jpg",
    active: true
  },

  // Cohere's latest
  {
    id: uuidv4(),
    provider: "Cohere",
    profileName: "Command R+",
    modelName: "command-r-plus",
    description: "Cohere's most powerful model for enterprise use",
    validatorType: "Enterprise Intelligence",
    avatarUrl: "/validators/cohere.jpg",
    active: true
  },

  // DeepSeek
  {
    id: uuidv4(),
    provider: "DeepSeek",
    profileName: "DeepSeek-V3",
    modelName: "deepseek-v3",
    description: "Advanced Chinese model with strong reasoning",
    validatorType: "Deep Reasoning Engine",
    avatarUrl: "/validators/deepseek.jpg",
    active: true
  },

  // Best open-source alternatives
  {
    id: uuidv4(),
    provider: "OpenRouter",
    profileName: "Qwen 2.5 72B",
    modelName: "qwen/qwen-2.5-72b-instruct",
    description: "Alibaba's powerful open model",
    validatorType: "Open Multilingual Model",
    avatarUrl: "/validators/qwen.jpg",
    active: true
  },
  {
    id: uuidv4(),
    provider: "OpenRouter",
    profileName: "Yi-Large",
    modelName: "01-ai/yi-large",
    description: "01.AI's flagship model with strong performance",
    validatorType: "Bilingual Excellence",
    avatarUrl: "/validators/yi.jpg",
    active: true
  }
];

async function addCuratedValidators() {
  try {
    console.log("Starting to add curated validators...\n");
    
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const validator of curatedValidators) {
      try {
        const created = await prisma.validator.create({
          data: {
            ...validator,
            publicKey: validator.id, // Use ID as publicKey for now
            isLeader: false,
            reliability: 0,
            totalVotes: 0,
            correctVotes: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          },
        });
        console.log(`✅ Added: ${created.profileName} (${created.modelName})`);
        addedCount++;
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`⚠️  Skipped: ${validator.profileName} - already exists`);
          skippedCount++;
        } else {
          console.error(`❌ Error adding ${validator.profileName}:`, error.message);
        }
      }
    }
    
    console.log(`\n✨ Curated validator addition completed!`);
    console.log(`   Added: ${addedCount} validators`);
    console.log(`   Skipped: ${skippedCount} validators`);
    console.log(`   Total curated models: ${curatedValidators.length}`);
    
  } catch (error) {
    console.error("Failed to add validators:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the function
addCuratedValidators();