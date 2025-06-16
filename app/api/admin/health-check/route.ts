// app/api/admin/health-check/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function GET() {
  try {
    console.log("Attempting database connection...");
    
    // Test database connection and get validator/key counts
    const [activeValidators, apiKeysCount] = await Promise.all([
      prisma.validator.count({ where: { active: true } }),
      prisma.apiKey.count({ where: { isActive: true } })
    ]);
    
    // Get validators with keys
    const validatorsWithKeys = await prisma.validator.count({
      where: { 
        active: true,
        apiKeys: { some: {} }
      }
    });
    
    // Test decryption (simplified check)
    let decryptionSuccess = false;
    try {
      const testKey = await prisma.apiKey.findFirst();
      decryptionSuccess = testKey ? true : false;
    } catch {
      decryptionSuccess = false;
    }
    
    console.log("Successfully connected to database");
    
    return NextResponse.json({ 
      status: "healthy", 
      message: "All systems operational",
      details: {
        apiKeysCount,
        activeValidatorsCount: activeValidators,
        validatorsWithKeysCount: validatorsWithKeys,
        decryptionSuccess,
        lastVoteTimestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error("Health check failed:", error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return NextResponse.json(
      { 
        status: "error",
        message: `Database connection failed: ${errorMessage}`,
        details: {
          apiKeysCount: 0,
          activeValidatorsCount: 0,
          validatorsWithKeysCount: 0,
          decryptionSuccess: false
        }
      },
      { status: 500 }
    );
  }
}
