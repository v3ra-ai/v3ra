import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Map old model names to VERIFIED WORKING models
const modelMapping: { [key: string]: string } = {
  // Map everything to the three working models based on size/capability
  
  // Small models -> Phi-3
  "microsoft/phi-2": "microsoft/Phi-3-mini-4k-instruct",
  "gpt2": "HuggingFaceH4/zephyr-7b-beta",
  "distilgpt2": "HuggingFaceH4/zephyr-7b-beta",
  "microsoft/DialoGPT-small": "microsoft/Phi-3-mini-4k-instruct",
  "stabilityai/stable-code-3b": "microsoft/Phi-3-mini-4k-instruct",
  "deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B": "microsoft/Phi-3-mini-4k-instruct",
  "Qwen/Qwen2.5-1.5B-Instruct": "microsoft/Phi-3-mini-4k-instruct",
  
  // Medium models -> Mistral or Zephyr
  "mistralai/Mistral-7B-Instruct-v0.1": "mistralai/Mistral-7B-Instruct-v0.2",
  "mistralai/Mixtral-8x7B-Instruct-v0.1": "mistralai/Mistral-7B-Instruct-v0.2",
  "mistralai/mixtral-8x7b-instruct": "mistralai/Mistral-7B-Instruct-v0.2",
  "meta-llama/Llama-2-7b-chat-hf": "HuggingFaceH4/zephyr-7b-beta",
  "tiiuae/falcon-7b-instruct": "HuggingFaceH4/zephyr-7b-beta",
  "Qwen/Qwen2-7B-Instruct": "mistralai/Mistral-7B-Instruct-v0.2",
  "Qwen/Qwen2.5-7B-Instruct": "mistralai/Mistral-7B-Instruct-v0.2",
  "deepseek-ai/DeepSeek-R1-Distill-Llama-8B": "mistralai/Mistral-7B-Instruct-v0.2",
  
  // Large models -> Also map to our best available (Mistral)
  "meta-llama/Llama-2-70b-chat-hf": "mistralai/Mistral-7B-Instruct-v0.2",
  "meta-llama/Llama-2-70b-hf": "mistralai/Mistral-7B-Instruct-v0.2",
  "meta-llama/Meta-Llama-3-8B-Instruct": "HuggingFaceH4/zephyr-7b-beta",
  "meta-llama/Meta-Llama-3.1-8B-Instruct": "HuggingFaceH4/zephyr-7b-beta",
  "meta-llama/Llama-3.1-8B": "HuggingFaceH4/zephyr-7b-beta",
  "meta-llama/Llama-3.1-70B-Instruct": "mistralai/Mistral-7B-Instruct-v0.2",
  "tiiuae/falcon-40b-instruct": "mistralai/Mistral-7B-Instruct-v0.2",
  "Qwen/Qwen2.5-72B-Instruct": "mistralai/Mistral-7B-Instruct-v0.2",
  
  // Keep Mistral v0.2 as is (it's already working)
  "mistralai/Mistral-7B-Instruct-v0.2": "mistralai/Mistral-7B-Instruct-v0.2",
};

async function updateHuggingFaceValidators() {
  console.log("Starting HuggingFace validator update...");
  
  try {
    // First, let's see what HuggingFace validators we have
    const hfValidators = await prisma.validator.findMany({
      where: {
        provider: "HuggingFace"
      }
    });
    
    console.log(`Found ${hfValidators.length} HuggingFace validators`);
    
    for (const validator of hfValidators) {
      console.log(`\nValidator: ${validator.profileName}`);
      console.log(`Current model: ${validator.modelName}`);
      
      // Check if we have a mapping for this model
      const newModel = modelMapping[validator.modelName || ""];
      
      if (newModel) {
        console.log(`Updating to new model: ${newModel}`);
        
        await prisma.validator.update({
          where: { id: validator.id },
          data: { 
            modelName: newModel,
            // Update the profile name to reflect the new model
            profileName: 
              newModel.includes("Phi-3-mini-4k") ? "Phi-3 Mini 4K Validator" :
              newModel.includes("Mistral-7B-Instruct-v0.2") ? "Mistral 7B v0.2 Validator" :
              newModel.includes("zephyr-7b-beta") ? "Zephyr 7B Beta Validator" : 
              validator.profileName || "HuggingFace Validator"
          }
        });
      } else if (!validator.modelName || validator.modelName === "") {
        console.log("No model name set, updating to default Zephyr 7B Beta");
        
        await prisma.validator.update({
          where: { id: validator.id },
          data: { 
            modelName: "HuggingFaceH4/zephyr-7b-beta",
            profileName: validator.profileName || "Zephyr 7B Beta Validator"
          }
        });
      } else {
        console.log(`⚠️  No mapping found for model: ${validator.modelName}`);
        console.log("Consider updating to one of these VERIFIED WORKING models:");
        console.log("  - microsoft/Phi-3-mini-4k-instruct");
        console.log("  - mistralai/Mistral-7B-Instruct-v0.2");
        console.log("  - HuggingFaceH4/zephyr-7b-beta");
      }
    }
    
    console.log("\n✅ Update complete!");
    
    // Show the updated validators
    const updatedValidators = await prisma.validator.findMany({
      where: {
        provider: "HuggingFace"
      },
      select: {
        id: true,
        profileName: true,
        modelName: true,
        active: true
      }
    });
    
    console.log("\nUpdated HuggingFace validators:");
    updatedValidators.forEach(v => {
      console.log(`- ${v.profileName}: ${v.modelName} (active: ${v.active})`);
    });
    
  } catch (error) {
    console.error("Error updating validators:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Add a function to create new HuggingFace validators if none exist
async function createHuggingFaceValidators() {
  const existingCount = await prisma.validator.count({
    where: { provider: "HuggingFace" }
  });
  
  if (existingCount === 0) {
    console.log("No HuggingFace validators found. Creating default ones...");
    
    const defaultValidators = [
      {
        profileName: "Phi-3 Mini 4K Validator",
        modelName: "microsoft/Phi-3-mini-4k-instruct",
        provider: "HuggingFace",
        active: true,
        publicKey: `hf_phi3_mini_${Date.now()}`,
        isLeader: false,
        reliability: 0.85,
        totalVotes: 0,
        correctVotes: 0,
        validatorType: "AI"
      },
      {
        profileName: "Mistral 7B v0.2 Validator", 
        modelName: "mistralai/Mistral-7B-Instruct-v0.2",
        provider: "HuggingFace",
        active: true,
        publicKey: `hf_mistral_7b_${Date.now()}`,
        isLeader: false,
        reliability: 0.88,
        totalVotes: 0,
        correctVotes: 0,
        validatorType: "AI"
      },
      {
        profileName: "Zephyr 7B Beta Validator", 
        modelName: "HuggingFaceH4/zephyr-7b-beta",
        provider: "HuggingFace",
        active: true,
        publicKey: `hf_zephyr_7b_${Date.now()}`,
        isLeader: false,
        reliability: 0.86,
        totalVotes: 0,
        correctVotes: 0,
        validatorType: "AI"
      }
    ];
    
    for (const validator of defaultValidators) {
      await prisma.validator.create({ data: validator });
      console.log(`Created: ${validator.profileName}`);
    }
  }
}

// Run the update
updateHuggingFaceValidators()
  .then(() => createHuggingFaceValidators())
  .catch(console.error);