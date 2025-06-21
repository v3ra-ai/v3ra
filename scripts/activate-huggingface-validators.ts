import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function activateHuggingFaceValidators() {
  console.log("Activating one validator for each working model...");
  
  try {
    // Define the working models
    const workingModels = [
      "microsoft/Phi-3-mini-4k-instruct",
      "mistralai/Mistral-7B-Instruct-v0.2",
      "HuggingFaceH4/zephyr-7b-beta"
    ];
    
    for (const model of workingModels) {
      // Find validators with this model
      const validators = await prisma.validator.findMany({
        where: {
          provider: "HuggingFace",
          modelName: model
        }
      });
      
      if (validators.length > 0) {
        // Deactivate all first
        await prisma.validator.updateMany({
          where: {
            provider: "HuggingFace",
            modelName: model
          },
          data: { active: false }
        });
        
        // Activate the first one
        await prisma.validator.update({
          where: { id: validators[0].id },
          data: { active: true }
        });
        
        console.log(`✅ Activated: ${validators[0].profileName} (${model})`);
      } else {
        console.log(`⚠️  No validator found for model: ${model}`);
      }
    }
    
    // Show all active HuggingFace validators
    const activeValidators = await prisma.validator.findMany({
      where: {
        provider: "HuggingFace",
        active: true
      },
      select: {
        profileName: true,
        modelName: true
      }
    });
    
    console.log("\n📊 Active HuggingFace Validators:");
    activeValidators.forEach(v => {
      console.log(`  - ${v.profileName}: ${v.modelName}`);
    });
    
  } catch (error) {
    console.error("Error activating validators:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
activateHuggingFaceValidators().catch(console.error);