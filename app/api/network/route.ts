import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { validatorService } from "@/lib/services/validatorService";
// import { validatorRegistry } from "@/lib/validators/registry";
// import { aiValidatorToUiValidator } from "@/lib/validators/types";
import { NetworkState } from "@/lib/types";
import { prisma } from "@/lib/db/client";

type DbValidator = {
  id: string;
  profileName: string;
  modelName: string;
  provider: string;
  validatorType?: string | null;
  description?: string | null;
};


export async function GET() {
  // Force dynamic rendering
  headers();

  try {
    // Initialize the network state
    const networkState: NetworkState = {
      validators: [],
      currentLeaderIndex: 0,
      isVoting: false,
      lastQuery: null,
      lastNetworkResponse: null,
      lastConsensusValue: null,
      lastConsensusThreshold: 0.5,
      lastConsensusAchieved: null,
      lastVoteTimestamp: null
    };

    // Try to get real validators from the validator service
    const dbValidators: DbValidator[] = await validatorService.getActiveDbValidators();



    // If we have active validators in the database, use those
    if (dbValidators && dbValidators.length > 0) {
      console.log(`Found ${dbValidators.length} active validators in the database`);

      // Get the real validators from the registry to ensure we have full objects
      // const registryValidators = await validatorRegistry.getActiveValidators();

      // Map to UI validators
      const uiValidators = dbValidators.map(dbValidator => {
        // Try to find the validator in the registry for additional info
        // const registryValidator = registryValidators.find(rv => rv.id === dbValidator.id);

        return {
          id: dbValidator.id,
          publicKey: dbValidator.id,
          provider: dbValidator.provider,
          profileName: dbValidator.profileName,
          modelName: dbValidator.modelName || undefined,
          description: dbValidator.description || undefined,
          validatorType: dbValidator.validatorType || undefined,
          avatarUrl: getAvatarForProvider(dbValidator.provider),
          lastVote: null,
          lastResponse: null,
          lastRationale: null,
          reliability: 95,
          isLeader: false
        };
      });

      if (uiValidators.length > 0) {
        // Set the first validator as the leader
        uiValidators[0].isLeader = true;
        networkState.validators = uiValidators;
      }

      // Try to get the most recent vote session to update last query/response info
      try {
        const latestVoteSession = await prisma.voteSession.findFirst({
          orderBy: { timestamp: 'desc' },
          include: {
            validatorResponses: {
              include: {
                validator: true
              }
            }
          }
        });

        if (latestVoteSession) {
          networkState.lastQuery = latestVoteSession.queryText;
          networkState.lastConsensusValue = latestVoteSession.consensusValue;
          networkState.lastConsensusAchieved = latestVoteSession.isConsensusReached;
          networkState.lastVoteTimestamp = latestVoteSession.timestamp.toISOString();

          // Update validator votes based on the latest session
          for (const response of latestVoteSession.validatorResponses) {
            const validator = networkState.validators.find(v => v.id === response.validatorId);
            if (validator) {
              validator.lastVote = response.vote === "YES";
              validator.lastRationale = response.rationale;
              validator.lastResponse = response.vote === "YES" ? "Voted YES" : "Voted NO";
            }
          }

          // Create network response summary
          networkState.lastNetworkResponse = latestVoteSession.validatorResponses
            .map(r => `${r.validator.profileName}: ${r.rationale}`)
            .join("\n\n");
        }
      } catch (dbError) {
        console.error("Error fetching latest vote session:", dbError);
      }
    } else {
      console.log("No active validators found in the database");
    }

    return NextResponse.json(networkState);
  } catch (error) {
    console.error("Network state error:", error);
    return NextResponse.json(
      { status: "error", message: (error as Error).message },
      { status: 500 }
    );
  }
}

// Helper function to get appropriate avatar URL based on provider
function getAvatarForProvider(provider: string): string {
  switch (provider) {
    case 'OpenAI':
      return 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/ChatGPT_logo.svg/512px-ChatGPT_logo.svg.png';
    case 'Anthropic':
      return 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Anthropic_logo.svg/1200px-Anthropic_logo.svg.png';
    case 'Google':
      return 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Google_Gemini_Logo.png/800px-Google_Gemini_Logo.png';
    case 'Cohere':
      return 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Cohere_logo.svg/512px-Cohere_logo.svg.png';
    case 'Eliza OS':
      return '/images/eliza-profile.png';
    default:
      return '/images/default-avatar.png';
  }
}
