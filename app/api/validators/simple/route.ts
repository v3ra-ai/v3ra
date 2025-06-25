import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
  }
}