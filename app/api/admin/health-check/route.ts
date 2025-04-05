// app/api/admin/health-check/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { keyService } from "@/lib/services/keyService";
import { validatorService } from "@/lib/services/validatorService";

export async function GET() {
  console.log("Health Check - Environment Variables:");
  console.log("ENCRYPTION_KEY exists:", !!process.env.ENCRYPTION_KEY);
  console.log("ENCRYPTION_IV exists:", !!process.env.ENCRYPTION_IV);
  console.log("ENCRYPTION_KEY length:", process.env.ENCRYPTION_KEY?.length);
  console.log("ENCRYPTION_IV length:", process.env.ENCRYPTION_IV?.length);

  try {
    // Get active validators with apiKeys
    const activeValidators = await validatorService.getActiveDbValidators(); // Changed to Prisma type

    // Get all API keys
    const apiKeys = await keyService.listKeys();

    // Get latest vote session
    const latestVoteSession = await prisma.voteSession.findFirst({
      orderBy: { timestamp: 'desc' },
      include: { validatorResponses: true }
    });

    // Get validators with associated API keys
    const validatorsWithKeys = await prisma.validator.findMany({
      where: { active: true },
      include: { apiKeys: true }
    });

    // Rest of your logic...
    const response = {
      status: 'healthy',
      message: 'System is operational',
      details: {
        apiKeysCount: apiKeys.length,
        activeValidatorsCount: activeValidators.length,
        validatorsWithKeysCount: validatorsWithKeys.filter(v => v.apiKeys.length > 0).length,
        lastVoteTimestamp: latestVoteSession?.timestamp.toISOString()
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      { status: 'error', message: 'Health check failed', details: String(error) },
      { status: 500 }
    );
  }
}