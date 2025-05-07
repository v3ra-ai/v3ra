import { prisma } from "../lib/db/client.js";

async function test() {
  try {
    const validators = await prisma.validator.findMany();
    console.log("Validators:", validators);

    const newValidator = await prisma.validator.create({
      data: {
        profileName: "Test Validator",
        provider: "Test",
        modelName: "TestModel",
        publicKey: "test-public-key",
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