import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// OpenRouter models to add
const openRouterModels = [
  // Anthropic models
  { id: "anthropic/claude-3-opus", displayName: "Claude 3 Opus" },
  { id: "anthropic/claude-3-sonnet", displayName: "Claude 3 Sonnet" },
  { id: "anthropic/claude-3-haiku", displayName: "Claude 3 Haiku" },
  { id: "anthropic/claude-2", displayName: "Claude 2" },
  
  // Meta Llama models
  { id: "meta-llama/llama-3-70b-instruct", displayName: "Llama 3 70B" },
  { id: "meta-llama/llama-3-8b-instruct", displayName: "Llama 3 8B" },
  { id: "meta-llama/llama-3.1-70b-instruct", displayName: "Llama 3.1 70B" },
  { id: "meta-llama/llama-3.1-8b-instruct", displayName: "Llama 3.1 8B" },
  { id: "meta-llama/llama-3.2-11b-instruct", displayName: "Llama 3.2 11B" },
  { id: "meta-llama/llama-3.2-3b-instruct", displayName: "Llama 3.2 3B" },
  { id: "meta-llama/llama-2-70b-chat", displayName: "Llama 2 70B" },
  { id: "meta-llama/llama-2-13b-chat", displayName: "Llama 2 13B" },
  
  // Mistral models
  { id: "mistralai/mistral-large", displayName: "Mistral Large" },
  { id: "mistralai/mistral-medium", displayName: "Mistral Medium" },
  { id: "mistralai/mistral-small", displayName: "Mistral Small" },
  { id: "mistralai/mixtral-8x7b-instruct", displayName: "Mixtral 8x7B" },
  
  // Google models
  { id: "google/gemini-1.5-pro", displayName: "Gemini 1.5 Pro" },
  { id: "google/gemini-1.5-flash", displayName: "Gemini 1.5 Flash" },
  
  // OpenAI models
  { id: "openai/gpt-4o", displayName: "GPT-4o" },
  { id: "openai/gpt-4-turbo", displayName: "GPT-4 Turbo" },
  
  // Other notable models
  { id: "cohere/command-r", displayName: "Cohere Command-R" },
  { id: "01-ai/yi-large", displayName: "Yi Large" },
  { id: "01-ai/yi-34b", displayName: "Yi 34B" },
  { id: "deepseek/deepseek-chat-v3-0324", displayName: "DeepSeek Chat V3" },
  { id: "perplexity/pplx-70b-online", displayName: "Perplexity 70B" }
];

// Hugging Face models to add
const huggingFaceModels = [
  { id: "meta-llama/Meta-Llama-3-8B-Instruct", displayName: "Meta Llama 3 8B" },
  { id: "meta-llama/Llama-3.1-70B-Instruct", displayName: "Meta Llama 3.1 70B" },
  { id: "meta-llama/Llama-3.1-8B", displayName: "Meta Llama 3.1 8B" },
  { id: "meta-llama/Llama-2-70b-chat-hf", displayName: "Meta Llama 2 70B" },
  { id: "meta-llama/Llama-2-7b-chat-hf", displayName: "Meta Llama 2 7B" },
  { id: "mistralai/Mistral-7B-Instruct-v0.2", displayName: "Mistral 7B v0.2" },
  { id: "mistralai/Mixtral-8x7B-Instruct-v0.1", displayName: "Mixtral 8x7B" },
  { id: "Qwen/Qwen2.5-1.5B-Instruct", displayName: "Qwen 2.5 1.5B" },
  { id: "Qwen/Qwen2.5-7B-Instruct", displayName: "Qwen 2.5 7B" },
  { id: "Qwen/Qwen2-7B-Instruct", displayName: "Qwen 2 7B" },
  { id: "deepseek-ai/DeepSeek-R1-Distill-Llama-8B", displayName: "DeepSeek R1 Llama 8B" },
  { id: "deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B", displayName: "DeepSeek R1 Qwen 1.5B" },
  { id: "stabilityai/stable-code-3b", displayName: "Stable Code 3B" },
  { id: "tiiuae/falcon-7b-instruct", displayName: "Falcon 7B" },
  { id: "tiiuae/falcon-40b-instruct", displayName: "Falcon 40B" }
];

async function addValidators() {
  try {
    console.log("Starting to add validators...");
    
    // Add OpenRouter models
    console.log("\nAdding OpenRouter models:");
    for (const model of openRouterModels) {
      try {
        const validator = await prisma.validator.create({
          data: {
            id: uuidv4(),
            provider: "OpenRouter",
            profileName: `${model.displayName} Validator`,
            modelName: model.id,
            active: true,
            publicKey: "", // Add empty string for required field
          },
        });
        console.log(`✅ Added: ${validator.profileName} (${validator.modelName})`);
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`⚠️ Skipped: ${model.displayName} - already exists`);
        } else {
          console.error(`❌ Error adding ${model.displayName}:`, error);
        }
      }
    }
    
    // Add Hugging Face models
    console.log("\nAdding Hugging Face models:");
    for (const model of huggingFaceModels) {
      try {
        const validator = await prisma.validator.create({
          data: {
            id: uuidv4(),
            provider: "HuggingFace",
            profileName: `${model.displayName} Validator`,
            modelName: model.id,
            active: true,
            publicKey: "", // Add empty string for required field
          },
        });
        console.log(`✅ Added: ${validator.profileName} (${validator.modelName})`);
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`⚠️ Skipped: ${model.displayName} - already exists`);
        } else {
          console.error(`❌ Error adding ${model.displayName}:`, error);
        }
      }
    }
    
    console.log("\nValidator addition completed!");
  } catch (error) {
    console.error("Failed to add validators:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the function
addValidators();
