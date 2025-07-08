import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkApiKeys() {
  try {
    const apiKeys = await prisma.apiKey.findMany({
      select: {
        id: true,
        name: true,
        provider: true,
        key: true,
        isActive: true,
        _count: {
          select: {
            ValidatorKey: true
          }
        }
      },
      orderBy: {
        provider: 'asc'
      }
    });

    console.log("API Keys in database:\n");
    console.log("=".repeat(80));
    
    for (const apiKey of apiKeys) {
      console.log(`Provider: ${apiKey.provider}`);
      console.log(`Name: ${apiKey.name}`);
      console.log(`ID: ${apiKey.id}`);
      console.log(`Key (hex): ${apiKey.key}`);
      console.log(`Key (decoded): ${Buffer.from(apiKey.key, 'hex').toString()}`);
      console.log(`Active: ${apiKey.isActive}`);
      console.log(`Linked Validators: ${apiKey._count.ValidatorKey}`);
      console.log("-".repeat(80));
    }

    console.log(`\nTotal API Keys: ${apiKeys.length}`);

  } catch (error) {
    console.error("Error checking API keys:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkApiKeys();