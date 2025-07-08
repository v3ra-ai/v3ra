import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function fixOpenRouterModels() {
  try {
    console.log("Fixing OpenRouter model IDs...\n");
    
    // Correct model IDs based on OpenRouter's current offerings
    const modelUpdates = [
      {
        currentModelName: "mistral/mistral-large",
        correctModelName: "mistralai/mistral-large-latest",
        profileName: "Mistral Large"
      },
      {
        currentModelName: "perplexity/llama-3.1-sonar-large-128k-online",
        correctModelName: "perplexity/llama-3.1-sonar-huge-128k-online",
        profileName: "Perplexity Online"
      }
    ];

    // Additional commonly available OpenRouter models to replace any broken ones
    const additionalModels = [
      {
        profileName: "Command R Plus",
        modelName: "cohere/command-r-plus",
        description: "Cohere's flagship model for enterprise tasks with 128k context",
        validatorType: "Enterprise AI"
      },
      {
        profileName: "Dolphin Mixtral 8x22B",
        modelName: "cognitivecomputations/dolphin-mixtral-8x22b",
        description: "Uncensored Mixtral variant - excellent for creative tasks",
        validatorType: "Creative AI"
      }
    ];

    // First, fix the existing broken models
    for (const update of modelUpdates) {
      const result = await prisma.validator.updateMany({
        where: { 
          modelName: update.currentModelName,
          provider: "OpenRouter"
        },
        data: { 
          modelName: update.correctModelName,
          updatedAt: new Date()
        }
      });
      
      if (result.count > 0) {
        console.log(`✅ Fixed: ${update.profileName} -> ${update.correctModelName}`);
      } else {
        console.log(`⚠️  Not found: ${update.profileName} (${update.currentModelName})`);
      }
    }

    // Check if we need to remove any broken models
    const brokenModels = await prisma.validator.findMany({
      where: {
        provider: "OpenRouter",
        modelName: {
          in: ["mistral/mistral-large", "perplexity/llama-3.1-sonar-large-128k-online"]
        }
      }
    });

    if (brokenModels.length > 0) {
      console.log("\nRemoving unfixable broken models...");
      for (const model of brokenModels) {
        await prisma.validatorKey.deleteMany({
          where: { validatorId: model.id }
        });
        await prisma.validator.delete({
          where: { id: model.id }
        });
        console.log(`❌ Removed: ${model.profileName}`);
      }
    }

    // List of definitely working OpenRouter models
    const workingOpenRouterModels = [
      {
        profileName: "Claude 3 Opus",
        modelName: "anthropic/claude-3-opus-20240229",
        description: "Most capable Claude model for complex analysis",
        validatorType: "Research Grade AI"
      },
      {
        profileName: "Claude 3.5 Sonnet",
        modelName: "anthropic/claude-3.5-sonnet-20241022",
        description: "Latest Claude with excellent performance",
        validatorType: "Advanced Reasoning"
      },
      {
        profileName: "GPT-4 Turbo",
        modelName: "openai/gpt-4-turbo",
        description: "OpenAI's GPT-4 Turbo via OpenRouter",
        validatorType: "Turbo Intelligence"
      },
      {
        profileName: "Llama 3.1 405B",
        modelName: "meta-llama/llama-3.1-405b-instruct",
        description: "Meta's largest open model",
        validatorType: "Open Frontier Model"
      },
      {
        profileName: "Llama 3.1 70B",
        modelName: "meta-llama/llama-3.1-70b-instruct",
        description: "Efficient large language model from Meta",
        validatorType: "Efficient LLM"
      },
      {
        profileName: "Qwen 2.5 72B",
        modelName: "qwen/qwen-2.5-72b-instruct",
        description: "Alibaba's multilingual powerhouse",
        validatorType: "Multilingual Expert"
      },
      {
        profileName: "DeepSeek Chat",
        modelName: "deepseek/deepseek-chat",
        description: "Powerful reasoning model from DeepSeek",
        validatorType: "Deep Reasoning"
      },
      {
        profileName: "Mixtral 8x7B",
        modelName: "mistralai/mixtral-8x7b-instruct",
        description: "Mixture of experts model with great performance",
        validatorType: "MoE Architecture"
      },
      {
        profileName: "Command R Plus",
        modelName: "cohere/command-r-plus",
        description: "Cohere's enterprise-grade model",
        validatorType: "Enterprise AI"
      },
      {
        profileName: "Gemini Pro 1.5",
        modelName: "google/gemini-pro-1.5",
        description: "Google's Gemini via OpenRouter",
        validatorType: "Multimodal AI"
      }
    ];

    // Update all OpenRouter validators to use verified working models
    console.log("\nUpdating OpenRouter validators with verified models...");
    
    const openRouterValidators = await prisma.validator.findMany({
      where: { provider: "OpenRouter" },
      include: { ValidatorKey: true }
    });

    // If we have more validators than working models, remove extras
    if (openRouterValidators.length > workingOpenRouterModels.length) {
      const toRemove = openRouterValidators.slice(workingOpenRouterModels.length);
      for (const validator of toRemove) {
        await prisma.validatorKey.deleteMany({
          where: { validatorId: validator.id }
        });
        await prisma.validator.delete({
          where: { id: validator.id }
        });
        console.log(`❌ Removed excess: ${validator.profileName}`);
      }
    }

    // Update existing validators with working models
    const toUpdate = openRouterValidators.slice(0, workingOpenRouterModels.length);
    for (let i = 0; i < toUpdate.length; i++) {
      const validator = toUpdate[i];
      const newModel = workingOpenRouterModels[i];
      
      await prisma.validator.update({
        where: { id: validator.id },
        data: {
          profileName: newModel.profileName,
          modelName: newModel.modelName,
          description: newModel.description,
          validatorType: newModel.validatorType,
          updatedAt: new Date()
        }
      });
      
      console.log(`✅ Updated: ${newModel.profileName} (${newModel.modelName})`);
    }

    // If we need more validators, add them
    if (openRouterValidators.length < workingOpenRouterModels.length) {
      const openRouterKey = await prisma.apiKey.findFirst({
        where: { provider: "OpenRouter" }
      });
      
      if (openRouterKey) {
        for (let i = openRouterValidators.length; i < workingOpenRouterModels.length; i++) {
          const newModel = workingOpenRouterModels[i];
          const validatorId = crypto.randomUUID();
          
          await prisma.validator.create({
            data: {
              id: validatorId,
              provider: "OpenRouter",
              profileName: newModel.profileName,
              modelName: newModel.modelName,
              description: newModel.description,
              validatorType: newModel.validatorType,
              avatarUrl: "/validators/openrouter.jpg",
              publicKey: validatorId,
              isLeader: false,
              active: true,
              reliability: 0,
              totalVotes: 0,
              correctVotes: 0,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          
          await prisma.validatorKey.create({
            data: {
              id: crypto.randomUUID(),
              validatorId: validatorId,
              apiKeyId: openRouterKey.id,
              createdAt: new Date()
            }
          });
          
          console.log(`➕ Added: ${newModel.profileName} (${newModel.modelName})`);
        }
      }
    }

    console.log("\n✨ OpenRouter models fixed!");
    
    // Show final count
    const finalCount = await prisma.validator.count({
      where: { provider: "OpenRouter" }
    });
    console.log(`\nTotal OpenRouter validators: ${finalCount}`);

  } catch (error) {
    console.error("Failed to fix models:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute
fixOpenRouterModels();