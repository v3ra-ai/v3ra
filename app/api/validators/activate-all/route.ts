import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/query-wrapper";

export async function POST() {
  try {
    // Update all validators to be active
    const result = await prisma.validator.updateMany({
      where: {},
      data: {
        active: true
      }
    });
    
    // Clear the cache after updating
    const { validatorCache } = await import("@/lib/cache/simple-validator-cache");
    await validatorCache.invalidateCache();
    
    return NextResponse.json({ 
      success: true, 
      message: `Activated ${result.count} validators`,
      count: result.count
    });
  } catch (error) {
    console.error('Failed to activate validators:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to activate validators',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Validator activation endpoint. Use POST to activate all validators.' 
  });
}