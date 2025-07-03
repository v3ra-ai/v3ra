import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { allValidatorModels } from './validator-models';

const prisma = new PrismaClient();

// Models to remove (deprecated/outdated)
const modelsToRemove = [
  // Deprecated Anthropic models
  "claude-2",
  "claude-2.1",
  "claude-instant-1.2",
  "claude-3-sonnet-20240229", // Keep only 3.5+
  
  // Deprecated OpenAI models
  "gpt-3.5-turbo-16k",
  
  // Deprecated Google models
  "gemini-1.0-pro",
  
  // Old Meta models
  "meta-llama/llama-2-70b-chat",
  "meta-llama/llama-2-13b-chat",
  "meta-llama/llama-2-7b-chat-hf",
  "meta-llama/Llama-2-70b-chat-hf",
  "meta-llama/Llama-2-7b-chat-hf",
  
  // Low quality community models
  "undi95/toppy-m-7b",
  "gryphe/mythomax-l2-13b",
  "01-ai/yi-6b",
  "cognitivecomputations/dolphin-mixtral-8x7b",
  "01-ai/yi-34b-chat",
  "huggingfaceh4/zephyr-7b-alpha",
  "intel/neural-chat-7b",
  "open-orca/mistral-7b-openorca",
  "phind/phind-codellama-34b-v2",
  "wizardlm/wizardcoder-15b",
];

async function updateValidators() {
  try {
    console.log("Starting validator update for 2025...");
    
    // Step 1: Remove deprecated models
    console.log("\n1. Removing deprecated models:");
    for (const modelId of modelsToRemove) {
      try {
        const result = await prisma.validator.deleteMany({
          where: {
            OR: [
              { modelName: modelId },
              { modelName: { contains: modelId } }
            ]
          }
        });
        if (result.count > 0) {
          console.log(`❌ Removed ${result.count} validator(s) for model: ${modelId}`);
        }
      } catch (error) {
        console.error(`Error removing ${modelId}:`, error);
      }
    }
    
    // Step 2: Add/Update current models from validator-models.ts
    console.log("\n2. Adding/updating current models:");
    
    for (const model of allValidatorModels) {
      try {
        // Check if validator exists
        const existing = await prisma.validator.findFirst({
          where: {
            modelName: model.model_id,
            provider: model.provider
          }
        });
        
        if (existing) {
          // Update existing validator
          await prisma.validator.update({
            where: { id: existing.id },
            data: {
              profileName: `${model.name} Validator`,
              active: true,
            }
          });
          console.log(`✅ Updated: ${model.name} (${model.provider})`);
        } else {
          // Create new validator
          await prisma.validator.create({
            data: {
              id: uuidv4(),
              provider: model.provider,
              profileName: `${model.name} Validator`,
              modelName: model.model_id,
              active: true,
              publicKey: "", // Required field
              description: getModelDescription(model.name),
              validatorType: getValidatorType(model.name),
              updatedAt: new Date(),
            }
          });
          console.log(`✨ Added: ${model.name} (${model.provider})`);
        }
      } catch (error: any) {
        console.error(`❌ Error with ${model.name}:`, error.message);
      }
    }
    
    // Step 3: Ensure flagship models are active
    console.log("\n3. Activating flagship models:");
    const flagshipModels = [
      "claude-opus-4-20250514",
      "claude-sonnet-4-20250514",
      "gpt-4o",
      "gpt-4o-mini",
      "o1-preview",
      "gemini-2.0-pro",
      "gemini-2.0-flash",
      "xai/grok-3",
      "mistralai/mistral-large-latest",
      "meta-llama/llama-3.1-405b-instruct",
    ];
    
    for (const modelId of flagshipModels) {
      await prisma.validator.updateMany({
        where: { modelName: modelId },
        data: { active: true }
      });
    }
    
    // Step 4: Display summary
    console.log("\n4. Summary:");
    const activeCount = await prisma.validator.count({ where: { active: true } });
    const totalCount = await prisma.validator.count();
    console.log(`Total validators: ${totalCount}`);
    console.log(`Active validators: ${activeCount}`);
    
    // List by provider
    const providers = await prisma.validator.groupBy({
      by: ['provider'],
      _count: true,
      where: { active: true }
    });
    
    console.log("\nActive validators by provider:");
    for (const provider of providers) {
      console.log(`  ${provider.provider}: ${provider._count}`);
    }
    
    console.log("\n✅ Validator update completed!");
    
  } catch (error) {
    console.error("Failed to update validators:", error);
  } finally {
    await prisma.$disconnect();
  }
}

function getModelDescription(modelName: string): string {
  const descriptions: Record<string, string> = {
    "Claude Opus 4": "Most powerful Claude model with March 2025 knowledge",
    "Claude Sonnet 4": "Balanced Claude model with March 2025 knowledge",
    "GPT-4o": "OpenAI's latest multimodal flagship",
    "o1": "OpenAI's advanced reasoning model",
    "Gemini 2.0 Pro": "Google's latest flagship with January 2025 knowledge",
    "Grok-3": "xAI's latest model with February 2025 knowledge",
    "Llama 3.1 405B": "Meta's largest open-source model",
    "Mistral Large": "Mistral's flagship model",
    "Perplexity Online": "Real-time web search capabilities",
  };
  
  return descriptions[modelName] || "";
}

function getValidatorType(modelName: string): string {
  if (modelName.includes("o1") || modelName.includes("reasoning")) return "Reasoning";
  if (modelName.includes("Code") || modelName.includes("Coder")) return "Code";
  if (modelName.includes("Online") || modelName.includes("real-time")) return "Real-time";
  if (modelName.includes("Opus") || modelName.includes("Large") || modelName.includes("405B")) return "Flagship";
  if (modelName.includes("Haiku") || modelName.includes("Flash") || modelName.includes("Mini")) return "Fast";
  return "General";
}

// Execute the function
updateValidators();