import { prisma } from "../lib/db/client.js";
import crypto from "crypto";

async function test() {
  try {
    const validators = await prisma.validator.findMany();
    console.log("Validators:", validators);

    const newValidator = await prisma.validator.create({
      data: {
        id: crypto.randomUUID(),
        profileName: "Test Validator",
        provider: "Test",
        modelName: "TestModel",
        publicKey: "test-public-key",
        updatedAt: new Date(),
      },
    });
    console.log("Created Validator:", newValidator);
  } catch (error) {
    console.error("Prisma Test Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

test();