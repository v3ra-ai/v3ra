import { prisma } from "./client";
import { Validator } from "@prisma/client";
import { AIValidator } from "../validators/types";
import { VoteResult } from "./../types";
import { MAX_VOTE_HISTORY_RESULTS, RECENT_HISTORY_RESULTS } from "./../constants";
import { logger } from "../utils/logger";

// Exception list of validator IDs to skip - REMOVED HARDCODED EXCLUSIONS
const EXCLUDED_VALIDATOR_IDS: string[] = [];

// Fetch all validators from the database
export async function getValidators(): Promise<Validator[]> {
  try {
    const validators = await prisma.validator.findMany();
    // Log fetched validators for debugging
    logger.debug("Fetched validators:", validators, { context: "getValidators" });


    return validators
      .filter((validator) => !EXCLUDED_VALIDATOR_IDS.includes(validator.id))
      .map((validator) => ({
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
      }));
  } catch (error) {
    logger.error("Error fetching validators:", error, { context: "getValidators" });
    return [];
  } finally {
    await prisma.$disconnect();
  }
}

// Fetch validator by ID from the database
export async function getValidatorById(id: string): Promise<Validator | null> {
  try {
    const validator = await prisma.validator.findUnique({ where: { id } });
    if (!validator) {
      logger.debug(`Validator not found for ID: ${id}`, null, { context: "getValidatorById" });
      const allValidators = await prisma.validator.findMany();
      logger.debug("Available validator IDs:", allValidators.map((v) => v.id), { context: "getValidatorById" });
      return null;
    }

    // Log fetched validator data for debugging
    logger.debug(`Fetched validator for ID: ${id}`, validator, { context: "getValidatorById" });

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
    logger.error(`Error fetching validator with ID ${id}:`, error, { context: "getValidatorById" });
    return null;
  }
}

// Fetch vote history for a specific validator using Prisma, filtering only by validatorId
export async function getValidatorVoteHistory(validatorId: string, limit: number = RECENT_HISTORY_RESULTS): Promise<VoteResult[]> {
  try {
    // Enforce maximum limit of MAX_VOTE_HISTORY_RESULTS
    const effectiveLimit = limit === 0 ? MAX_VOTE_HISTORY_RESULTS : Math.min(limit, MAX_VOTE_HISTORY_RESULTS);
    const responses = await prisma.validatorResponse.findMany({
      where: { validatorId },
      include: {
        VoteSession: {
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
        Validator: {
          select: {
            provider: true,
            profileName: true,
          },
        },
      },
      orderBy: {
        VoteSession: {
          timestamp: 'desc'
        }
      },
      take: effectiveLimit
    });

    // Log raw responses for debugging
    logger.debug(`Raw ValidatorResponse records for validator ${validatorId} (limit: ${effectiveLimit}):`, responses, { context: "getValidatorVoteHistory" });
    if (responses.length === 0) {
      logger.debug(`No ValidatorResponse records found for validatorId: ${validatorId}`, null, { context: "getValidatorVoteHistory" });
      const allResponses = await prisma.validatorResponse.findMany({
        where: { validatorId },
        select: { id: true, voteSessionId: true },
      });
      logger.debug(`All ValidatorResponse records for validator (sanity check):`, allResponses, { context: "getValidatorVoteHistory" });
      const voteSessions = await prisma.voteSession.findMany({
        where: { id: { in: allResponses.map((r) => r.voteSessionId) } },
        select: { id: true, queryText: true },
      });
      logger.debug(`Related VoteSession records:`, voteSessions, { context: "getValidatorVoteHistory" });
    }

    const voteHistory = responses.map((res) => {
      // Log each response for debugging
      logger.debug(`Processing ValidatorResponse ${res.id}:`, {
        voteSessionExists: !!res.VoteSession,
        voteSessionId: res.VoteSession?.id,
        queryText: res.VoteSession?.queryText,
        validator: res.Validator,
      }, { context: "getValidatorVoteHistory" });

      return {
        id: res.VoteSession?.id || `missing-session-${res.id}`,
        isConsensusReached: res.VoteSession?.isConsensusReached || false,
        consensusValue: res.VoteSession?.consensusValue || null,
        queryText: res.VoteSession?.queryText || "N/A",
        validatorResponses: [
          {
            id: res.id,
            provider: res.Validator?.provider || "Unknown",
            profileName: res.Validator?.profileName || "Unknown",
            vote: res.vote,
            rationale: res.rationale,
          },
        ],
        votingResult: {
          yes: res.VoteSession?.votesYes || 0,
          no: res.VoteSession?.votesNo || 0,
          notVoted: res.VoteSession?.notVoted || 0,
        },
        timestamp: res.VoteSession?.timestamp?.toISOString() || res.createdAt.toISOString(),
      };
    });

    // Log filtered vote history for debugging
    logger.debug(`Filtered vote history for validator ${validatorId}:`, voteHistory, { context: "getValidatorVoteHistory" });
    if (voteHistory.length === 0) {
      logger.debug(`Possible issues: No ValidatorResponse records or missing VoteSession links`, null, { context: "getValidatorVoteHistory" });
    }
    return voteHistory;
  } catch (error) {
    logger.error(`Error fetching vote history for validator ${validatorId}:`, error, { context: "getValidatorVoteHistory" });
    return [];
  }
}

// Fetch vote statistics for a specific validator (total votes, YES/NO counts, consensus match percentages)
export async function getValidatorVoteStats(validatorId: string, limit: number = RECENT_HISTORY_RESULTS): Promise<{
  totalVotes: number;
  yesVotes: number;
  noVotes: number;
  consensusMatchPercentage: number;
  nonConsensusPercentage: number;
}> {
  try {
    // Enforce maximum limit of MAX_VOTE_HISTORY_RESULTS
    const effectiveLimit = limit === 0 ? MAX_VOTE_HISTORY_RESULTS : Math.min(limit, MAX_VOTE_HISTORY_RESULTS);
    const responses = await prisma.validatorResponse.findMany({
      where: { validatorId },
      include: {
        VoteSession: {
          select: {
            isConsensusReached: true,
            consensusValue: true,
          },
        },
      },
      orderBy: {
        VoteSession: {
          timestamp: 'desc'
        }
      },
      take: effectiveLimit
    });

    // Log raw responses for debugging
    logger.debug(`Raw ValidatorResponse records for vote stats (validator ${validatorId}, limit: ${effectiveLimit}):`, responses, { context: "getValidatorVoteStats" });
    if (responses.length === 0) {
      logger.debug(`No ValidatorResponse records found for validatorId: ${validatorId}`, null, { context: "getValidatorVoteStats" });
    }

    const totalVotes = responses.length;
    const yesVotes = responses.filter(res => res.vote === "YES").length;
    const noVotes = responses.filter(res => res.vote === "NO").length;

    // Calculate consensus matches (vote matches consensusValue when consensus is reached)
    const consensusVotes = responses.filter(res => res.VoteSession?.isConsensusReached);
    const consensusMatches = consensusVotes.filter(res => {
      if (res.VoteSession?.consensusValue === true && res.vote === "YES") return true;
      if (res.VoteSession?.consensusValue === false && res.vote === "NO") return true;
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
    logger.debug(`Vote stats for validator ${validatorId}:`, stats, { context: "getValidatorVoteStats" });

    return stats;
  } catch (error) {
    logger.error(`Error fetching vote stats for validator ${validatorId}:`, error, { context: "getValidatorVoteStats" });
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
    active: validator.active,
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