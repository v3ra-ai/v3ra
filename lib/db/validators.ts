import { prisma } from "@/lib/db/client";
import { Validator } from "@prisma/client";
import { AIValidator } from "../validators/types";
import { VoteResult } from "@/lib/types";

// Fetch validator by ID from the database
export async function getValidatorById(id: string): Promise<Validator | null> {
  try {
    const validator = await prisma.validator.findUnique({ where: { id } });
    if (!validator) {
      if (process.env.NODE_ENV === "development") {
        console.log(`Validator not found for ID: ${id}`);
        const allValidators = await prisma.validator.findMany();
        console.log("Available validator IDs:", allValidators.map((v) => v.id));
      }
      return null;
    }
    // Log fetched validator data for debugging
    if (process.env.NODE_ENV === "development") {
      console.log(`Fetched validator for ID: ${id}`, validator);
    }
    return {
      id: validator.id,
      publicKey: validator.publicKey,
      isLeader: validator.isLeader,
      provider: validator.provider,
      profileName: validator.profileName,
      modelName: validator.modelName,
      description: validator.description,
      avatarUrl: validator.avatarUrl,
      validatorType: validator.validatorType,
      reliability: validator.reliability,
      totalVotes: validator.totalVotes,
      correctVotes: validator.correctVotes,
      active: validator.active,
      createdAt: validator.createdAt,
      updatedAt: validator.updatedAt,
    };
  } catch (error) {
    console.error(`Error fetching validator with ID ${id}:`, error);
    return null;
  }
}

// Fetch vote history for a specific validator using Prisma, filtering only by validatorId
export async function getValidatorVoteHistory(validatorId: string, limit: number = 50): Promise<VoteResult[]> {
  try {
    // Enforce maximum limit of 300
    const effectiveLimit = limit === 0 ? 300 : Math.min(limit, 300);
    const responses = await prisma.validatorResponse.findMany({
      where: { validatorId },
      include: {
        voteSession: {
          select: {
            id: true,
            queryText: true,
            isConsensusReached: true,
            consensusValue: true,
            timestamp: true,
            votesYes: true,
            votesNo: true,
            notVoted: true,
          },
        },
        validator: {
          select: {
            provider: true,
            profileName: true,
          },
        },
      },
      orderBy: {
        voteSession: {
          timestamp: 'desc'
        }
      },
      take: effectiveLimit
    });

    // Log raw responses for debugging
    if (process.env.NODE_ENV === "development") {
      console.log(`Raw ValidatorResponse records for validator ${validatorId} (limit: ${effectiveLimit}):`, responses);
      if (responses.length === 0) {
        console.log(`No ValidatorResponse records found for validatorId: ${validatorId}`);
        const allResponses = await prisma.validatorResponse.findMany({
          where: { validatorId },
          select: { id: true, voteSessionId: true },
        });
        console.log(`All ValidatorResponse records for validator (sanity check):`, allResponses);
        const voteSessions = await prisma.voteSession.findMany({
          where: { id: { in: allResponses.map((r) => r.voteSessionId) } },
          select: { id: true, queryText: true },
        });
        console.log(`Related VoteSession records:`, voteSessions);
      }
    }

    const voteHistory = responses.map((res) => {
      // Log each response for debugging
      if (process.env.NODE_ENV === "development") {
        console.log(`Processing ValidatorResponse ${res.id}:`, {
          voteSessionExists: !!res.voteSession,
          voteSessionId: res.voteSession?.id,
          queryText: res.voteSession?.queryText,
          validator: res.validator,
        });
      }

      return {
        id: res.voteSession?.id || `missing-session-${res.id}`,
        isConsensusReached: res.voteSession?.isConsensusReached || false,
        consensusValue: res.voteSession?.consensusValue || null,
        queryText: res.voteSession?.queryText || "N/A",
        validatorResponses: [
          {
            id: res.id,
            provider: res.validator?.provider || "Unknown",
            profileName: res.validator?.profileName || "Unknown",
            vote: res.vote,
            rationale: res.rationale,
          },
        ],
        votingResult: {
          yes: res.voteSession?.votesYes || 0,
          no: res.voteSession?.votesNo || 0,
          notVoted: res.voteSession?.notVoted || 0,
        },
        timestamp: res.voteSession?.timestamp?.toISOString() || res.createdAt.toISOString(),
      };
    });

    // Log filtered vote history for debugging
    if (process.env.NODE_ENV === "development") {
      console.log(`Filtered vote history for validator ${validatorId}:`, voteHistory);
      if (voteHistory.length === 0) {
        console.log(`Possible issues: No ValidatorResponse records or missing VoteSession links`);
      }
    }
    return voteHistory;
  } catch (error) {
    console.error(`Error fetching vote history for validator ${validatorId}:`, error);
    return [];
  }
}

// Fetch vote statistics for a specific validator (total votes, YES/NO counts, consensus match percentages)
export async function getValidatorVoteStats(validatorId: string, limit: number = 50): Promise<{
  totalVotes: number;
  yesVotes: number;
  noVotes: number;
  consensusMatchPercentage: number;
  nonConsensusPercentage: number;
}> {
  try {
    // Enforce maximum limit of 300
    const effectiveLimit = limit === 0 ? 300 : Math.min(limit, 300);
    const responses = await prisma.validatorResponse.findMany({
      where: { validatorId },
      include: {
        voteSession: {
          select: {
            isConsensusReached: true,
            consensusValue: true,
          },
        },
      },
      orderBy: {
        voteSession: {
          timestamp: 'desc'
        }
      },
      take: effectiveLimit
    });

    // Log raw responses for debugging
    if (process.env.NODE_ENV === "development") {
      console.log(`Raw ValidatorResponse records for vote stats (validator ${validatorId}, limit: ${effectiveLimit}):`, responses);
      if (responses.length === 0) {
        console.log(`No ValidatorResponse records found for validatorId: ${validatorId}`);
      }
    }

    const totalVotes = responses.length;
    const yesVotes = responses.filter(res => res.vote === "YES").length;
    const noVotes = responses.filter(res => res.vote === "NO").length;

    // Calculate consensus matches (vote matches consensusValue when consensus is reached)
    const consensusVotes = responses.filter(res => res.voteSession?.isConsensusReached);
    const consensusMatches = consensusVotes.filter(res => {
      if (res.voteSession?.consensusValue === true && res.vote === "YES") return true;
      if (res.voteSession?.consensusValue === false && res.vote === "NO") return true;
      return false;
    }).length;

    const consensusMatchPercentage = totalVotes > 0 ? (consensusMatches / totalVotes) * 100 : 0;
    const nonConsensusPercentage = totalVotes > 0 ? ((totalVotes - consensusMatches) / totalVotes) * 100 : 0;

    const stats = {
      totalVotes,
      yesVotes,
      noVotes,
      consensusMatchPercentage: Number(consensusMatchPercentage.toFixed(2)),
      nonConsensusPercentage: Number(nonConsensusPercentage.toFixed(2)),
    };

    // Log vote statistics for debugging
    if (process.env.NODE_ENV === "development") {
      console.log(`Vote stats for validator ${validatorId}:`, stats);
    }

    return stats;
  } catch (error) {
    console.error(`Error fetching vote stats for validator ${validatorId}:`, error);
    return {
      totalVotes: 0,
      yesVotes: 0,
      noVotes: 0,
      consensusMatchPercentage: 0,
      nonConsensusPercentage: 0,
    };
  }
}

export function dbValidatorToAIValidator(validator: Validator): AIValidator {
  return {
    id: validator.id,
    name: validator.profileName,
    provider: validator.provider,
    modelName: validator.modelName,
    description: validator.description || undefined,
    validatorType: validator.validatorType || undefined,
    active: validator.active,
    keyId: undefined,
    validate: async () => ({
      vote: false,
      confidence: 0,
      rationale: "Not implemented",
    }),
  };
}

export async function updateValidatorMetrics(
  validatorId: string,
  vote: boolean,
  matchedConsensus: boolean,
): Promise<void> {
  const validator = await prisma.validator.findUnique({
    where: { id: validatorId },
  });
  if (!validator) {
    throw new Error(`Validator with ID ${validatorId} not found`);
  }

  const newTotalVotes = validator.totalVotes + 1;
  const newCorrectVotes = matchedConsensus
    ? validator.correctVotes + 1
    : validator.correctVotes;
  const newReliability = newCorrectVotes / newTotalVotes;

  await prisma.validator.update({
    where: { id: validatorId },
    data: {
      totalVotes: newTotalVotes,
      correctVotes: newCorrectVotes,
      reliability: newReliability,
    },
  });
}