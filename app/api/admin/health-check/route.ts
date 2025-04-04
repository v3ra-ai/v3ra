import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { keyService } from "@/lib/services/keyService";
import { validatorService } from "@/lib/services/validatorService";
import { decryptKey } from "@/lib/crypto";

/**
 * API endpoint to check the health of validators and API keys
 * 
 * This route analyzes the current state of validators and API keys
 * to detect potential issues before they cause problems.
 */
export async function GET(request: NextRequest) {
  console.log("Health Check - Environment Variables:");
  console.log("ENCRYPTION_KEY exists:", !!process.env.ENCRYPTION_KEY);
  console.log("ENCRYPTION_IV exists:", !!process.env.ENCRYPTION_IV);
  console.log("ENCRYPTION_KEY length:", process.env.ENCRYPTION_KEY?.length);
  console.log("ENCRYPTION_IV length:", process.env.ENCRYPTION_IV?.length);

  try {
    // Get active validators
    const activeValidators = await validatorService.getActiveValidators();
    
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
    
    // Count validators with properly linked API keys
    const validatorsWithLinkedKeys = validatorsWithKeys.filter(v => v.apiKeys.length > 0);
    
    // Test decryption of each key
    let decryptionSuccess = true;
    for (const key of apiKeys) {
      try {
        const decrypted = await keyService.getKeyValue(key.id);
        if (!decrypted) {
          console.error(`Failed to decrypt key ${key.id}`);
          decryptionSuccess = false;
          break;
        }
        console.log(`Successfully decrypted key ${key.id} (${key.provider})`);
      } catch (error) {
        console.error(`Error decrypting key ${key.id}:`, error);
        decryptionSuccess = false;
        break;
      }
    }
    
    // Compile health status
    const details = {
      apiKeysCount: apiKeys.length,
      activeValidatorsCount: activeValidators.length,
      validatorsWithKeysCount: validatorsWithLinkedKeys.length,
      lastVoteTimestamp: latestVoteSession?.timestamp?.toISOString() || undefined,
      decryptionSuccess
    };
    
    // Determine overall health status
    let status: 'healthy' | 'warning' | 'error' = 'healthy';
    let message = 'Validator system is healthy';
    
    // Check for critical errors
    if (apiKeys.length === 0) {
      status = 'error';
      message = 'No API keys found';
    } else if (!decryptionSuccess) {
      status = 'error';
      message = 'API key decryption is failing';
    } else if (activeValidators.length === 0) {
      status = 'error';
      message = 'No active validators found';
    } else if (validatorsWithLinkedKeys.length === 0) {
      status = 'error';
      message = 'No validators have API keys assigned';
    } else if (validatorsWithLinkedKeys.length < activeValidators.length) {
      status = 'warning';
      message = `${activeValidators.length - validatorsWithLinkedKeys.length} validators missing API keys`;
    }
    
    // Check vote session age
    if (status !== 'error' && latestVoteSession) {
      const voteAge = Date.now() - latestVoteSession.timestamp.getTime();
      const daysSinceLastVote = voteAge / (1000 * 60 * 60 * 24);
      
      if (daysSinceLastVote > 7) {
        status = 'warning';
        message = `No votes in the last ${Math.floor(daysSinceLastVote)} days`;
      }
    }
    
    return NextResponse.json({ status, message, details });
  } catch (error) {
    console.error("Error checking validator health:", error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Failed to check validator health',
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
