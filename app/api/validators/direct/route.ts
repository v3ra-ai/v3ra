import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/query-wrapper";

// Direct database query to bypass cache
export async function GET() {
  try {
    const validators = await prisma.validator.findMany({
      include: { ValidatorKey: true },
    });
    
    return NextResponse.json({
      count: validators.length,
      validators: validators.map(v => ({
        id: v.id,
        name: v.profileName,
        active: v.active,
        provider: v.provider,
        modelName: v.modelName,
      }))
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch validators" },
      { status: 500 }
    );
  }
}