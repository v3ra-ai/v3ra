import { prisma } from "@/lib/db/client";
import { v4 as uuidv4 } from "uuid";

async function addClaude4Validators() {
  console.log("Adding Claude 4 validators...");

  const claude4Models = [
    {
      id: uuidv4(),
      profileName: "Claude Opus 4 Validator",
      provider: "Anthropic",
      modelName: "claude-opus-4-20250514",
      description: "Claude Opus 4 - Most powerful reasoning and analysis",
      avatarUrl: "https://example.com/claude-opus-4.png",
      validatorType: "reasoning",
    },
    {
      id: uuidv4(),
      profileName: "Claude Sonnet 4 Validator",
      provider: "Anthropic",
      modelName: "claude-sonnet-4-20250514",
      description: "Claude Sonnet 4 - Balanced performance and speed",
      avatarUrl: "https://example.com/claude-sonnet-4.png",
      validatorType: "general",
    },
    {
      id: uuidv4(),
      profileName: "Claude 3.5 Sonnet Validator",
      provider: "Anthropic",
      modelName: "claude-3-5-sonnet-20241022",
      description: "Claude 3.5 Sonnet - Latest 3.5 generation model",
      avatarUrl: "https://example.com/claude-3-5-sonnet.png",
      validatorType: "general",
    },
    {
      id: uuidv4(),
      profileName: "Claude 3.5 Haiku Validator",
      provider: "Anthropic",
      modelName: "claude-3-5-haiku-20241022",
      description: "Claude 3.5 Haiku - Fast and efficient",
      avatarUrl: "https://example.com/claude-3-5-haiku.png",
      validatorType: "speed",
    },
  ];

  try {
    // Check if Anthropic API key exists
    const anthropicKey = await prisma.apiKey.findFirst({
      where: {
        provider: "Anthropic",
        isActive: true,
      },
    });

    if (!anthropicKey) {
      console.error("No active Anthropic API key found!");
      console.log("Please add an Anthropic API key first using the admin interface.");
      return;
    }

    // Add validators
    for (const model of claude4Models) {
      // Check if validator already exists
      const existing = await prisma.validator.findFirst({
        where: {
          provider: model.provider,
          modelName: model.modelName,
        },
      });

      if (existing) {
        console.log(`Validator for ${model.modelName} already exists, skipping...`);
        continue;
      }

      // Create validator
      const validator = await prisma.validator.create({
        data: {
          id: model.id,
          profileName: model.profileName,
          provider: model.provider,
          modelName: model.modelName,
          publicKey: `${model.provider}-${model.modelName}-${Date.now()}`,
          isLeader: false,
          active: true,
          description: model.description,
          avatarUrl: model.avatarUrl,
          validatorType: model.validatorType,
          reliability: 0.0,
          totalVotes: 0,
          correctVotes: 0,
        },
      });

      // Link to API key
      await prisma.validatorKey.create({
        data: {
          id: uuidv4(),
          validatorId: validator.id,
          apiKeyId: anthropicKey.id,
        },
      });

      console.log(`✅ Added validator: ${model.profileName}`);
    }

    console.log("\nAll Claude 4 validators added successfully!");
    console.log("\nNote: Make sure you have a valid Anthropic API key that supports these models.");
    console.log("The model IDs used are:");
    console.log("- claude-opus-4-20250514");
    console.log("- claude-sonnet-4-20250514");
    console.log("- claude-3-5-sonnet-20241022");
    console.log("- claude-3-5-haiku-20241022");

  } catch (error) {
    console.error("Error adding validators:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addClaude4Validators();