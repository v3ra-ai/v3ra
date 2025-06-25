import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Create a fresh Prisma client with the direct connection
const prisma = new PrismaClient({
  datasources: {
    db: {
      // Force use of POSTGRES_URL which should be the direct connection
      url: process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL
    }
  }
});

export async function GET() {
  try {
    const validators = await prisma.validator.findMany({
      where: { active: true },
      include: { apiKeys: true },
      orderBy: { profileName: 'asc' }
    });
    
    // Format for frontend
    const formatted = validators.map(v => ({
      id: v.id,
      name: v.profileName,
      profileName: v.profileName,
      provider: v.provider,
      modelName: v.modelName || "unknown",
      description: v.description || undefined,
      validatorType: v.validatorType || undefined,
      active: v.active,
      avatarUrl: null
    }));
    
    return NextResponse.json(formatted);
  } catch (error) {
    console.error('[validators/simple] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch validators" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}