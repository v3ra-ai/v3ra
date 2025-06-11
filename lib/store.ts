"use server";

import type { NetworkState, VoteResult } from "./types";
import {
  createValidators,
  rotateLeader,
  simulateValidatorResponse,
} from "./validators";
import {
  prisma,
  initDatabase,
  seedValidators,
  persistVoteSession,
} from "./database";
import { VoteSession, ValidatorResponse, Validator } from "@prisma/client";

// Sample queries that will be broadcast to the network
const SAMPLE_QUERIES = [
  "Should the network upgrade to version 2.0?",
  "Is the current transaction fee appropriate?",
  "Should we increase the validator count?",
  "Is the network performance satisfactory?",
  "Should we implement the new security protocol?",
  "Is the current block size optimal?",
  "Should we modify the staking requirements?",
  "Is the current reward distribution fair?",
  "Should we change the consensus algorithm?",
  "Is the network decentralized enough?",
];

// Initialize the network state with a small number of validators
const initialState: NetworkState = {
  validators: createValidators(8),
  currentLeaderIndex: 0,
  isVoting: false,
  lastQuery: null,
  lastNetworkResponse: null,
  lastConsensusValue: null,
  lastConsensusThreshold: 0.5,
  lastConsensusAchieved: null,
  lastVoteTimestamp: null,
};

let networkState = { ...initialState };

// Initialize the database and seed validators if necessary
export async function initializeSystem(): Promise<boolean> {
  try {
    const dbInitialized = await initDatabase();
    if (!dbInitialized) {
      console.error("Failed to initialize database");
      return false;
    }

    await seedValidators(networkState.validators);
    return true;
  } catch (error) {
    console.error("System initialization error:", error);
    return false;
  }
}

// Get the current network state
export async function getNetworkState(): Promise<NetworkState> {
  return { ...networkState };
}

// Get a random query from the sample list
function getRandomQuery(): string {
  const index = Math.floor(Math.random() * SAMPLE_QUERIES.length);
  return SAMPLE_QUERIES[index];
}

// Broadcast a query to all validators and collect votes
export async function broadcastQuery(): Promise<VoteResult> {
  if (networkState.isVoting) {
    throw new Error("Voting already in progress");
  }

  networkState.isVoting = true;
  const query = getRandomQuery();
  networkState.lastQuery = query;

  try {
    const validatorResponsePromises = networkState.validators.map((validator) =>
      simulateValidatorResponse(validator, query),
    );

    networkState.validators = await Promise.all(validatorResponsePromises);

    let yesCount = 0;
    let noCount = 0;
    let notVotedCount = 0;

    networkState.validators.forEach((validator) => {
      if (validator.lastVote === true) {
        yesCount++;
      } else if (validator.lastVote === false) {
        noCount++;
      } else {
        notVotedCount++;
      }
    });

    const totalVoted = yesCount + noCount;
    const isConsensusReached = totalVoted > 0;
    let finalOutcome: boolean | null = null;
    if (yesCount > noCount) {
      finalOutcome = true;
    } else if (noCount > yesCount) {
      finalOutcome = false;
    } else {
      finalOutcome = null;
    }

    const validatorResponses = networkState.validators
      .filter((v) => v.lastVote !== null)
      .map((v) => ({
        id: v.id,
        provider: v.provider,
        profileName: v.profileName,
        vote: v.lastVote ? "YES" : "NO",
        rationale: v.lastRationale || "",
      }));

    const responses = networkState.validators
      .filter((v) => v.lastRationale)
      .map((v) => `${v.profileName} (${v.provider}): ${v.lastRationale}`)
      .join("\n\n");

    const aggregatedResponse = `Query: "${query}"\n\n${responses}`;

    const voteResult: VoteResult = {
      id: crypto.randomUUID(),
      queryText: query,
      isConsensusReached,
      consensusValue: finalOutcome,
      timestamp: new Date().toISOString(),
      validatorResponses,
      votingResult: {
        yes: yesCount,
        no: noCount,
        notVoted: notVotedCount,
      },
    };

    networkState.lastNetworkResponse = aggregatedResponse;
    networkState.lastConsensusValue = finalOutcome;
    networkState.lastConsensusAchieved = isConsensusReached;
    networkState.lastVoteTimestamp = String(voteResult.timestamp ?? "");

    networkState.currentLeaderIndex = rotateLeader(
      networkState.validators,
      networkState.currentLeaderIndex,
    );

    networkState.isVoting = false;

    try {
      await persistVoteSession(voteResult, query, networkState.validators);
      console.log("Vote session persisted to database successfully");
    } catch (dbError) {
      console.error("Failed to persist vote session:", dbError);
    }

    return voteResult;
  } catch (error) {
    console.error("Error during broadcast:", error);
    networkState.isVoting = false;
    throw error;
  }
}

// Reset the network state (for testing)
export async function resetNetwork(): Promise<void> {
  networkState = { ...initialState, validators: createValidators(8) };

  try {
    console.log("Network reset (in-memory only, database preserved)");
  } catch (error) {
    console.error("Database reset error:", error);
  }
}

// Get historical vote sessions from the database
export async function getHistoricalVoteSessions(
  limit: number = 10,
  offset: number = 0,
): Promise<VoteResult[]> {
  try {
    const sessions = await prisma.voteSession.findMany({
      take: limit,
      skip: offset,
      orderBy: { timestamp: "desc" },
      include: {
        validatorResponses: {
          include: {
            validator: true,
          },
        },
      },
    });

    return sessions.map(
      (
        session: VoteSession & {
          validatorResponses: (ValidatorResponse & { validator: Validator })[];
        },
      ) => {
        const yesCount = session.validatorResponses.filter(
          (r) => r.vote === "YES",
        ).length;
        const noCount = session.validatorResponses.filter(
          (r) => r.vote === "NO",
        ).length;
        const notVotedCount = session.validatorResponses.filter(
          (r) => !r.vote || r.vote === "ABSTAIN",
        ).length;

        const validatorResponses = session.validatorResponses.map(
          (response) => ({
            id: response.validator?.id || response.validatorId || "unknown",
            provider: response.validator?.provider || "unknown",
            profileName: response.validator?.profileName || "Unknown Validator",
            vote: response.vote || "ABSTAIN",
            rationale: response.rationale || "No rationale provided",
          }),
        );

        return {
          id: session.id,
          isConsensusReached: Boolean(session.isConsensusReached),
          consensusValue: session.consensusValue,
          queryText: session.queryText || "Unknown query",
          timestamp: session.timestamp.toISOString(),
          validatorResponses,
          votingResult: {
            yes: yesCount,
            no: noCount,
            notVoted: notVotedCount,
          },
        };
      },
    );
  } catch (error) {
    console.error("Failed to retrieve historical vote sessions:", error);
    return [];
  }
}

// Search vote sessions by semantic similarity
interface VoteSessionSearchResult {
  id: string;
  queryText: string;
  isConsensusReached: boolean;
  consensusValue: boolean | null;
  timestamp: Date;
  rationale: string;
  profileName: string;
}

export async function searchVoteSessions(
  query: string,
  limit: number = 5,
): Promise<VoteSessionSearchResult[]> {
  try {
    const sessions = await prisma.$queryRaw`
      SELECT vs.id, vs."queryText", vs."isConsensusReached", vs."consensusValue",
             vs."timestamp", vr.rationale, v."profileName"
      FROM "VoteSession" vs
      JOIN "ValidatorResponse" vr ON vr."voteSessionId" = vs.id
      JOIN "Validator" v ON vr."validatorId" = v.id
      WHERE vs."queryText" ILIKE ${`%${query}%`}
      ORDER BY vs."timestamp" DESC
      LIMIT ${limit};
    `;
    return sessions as VoteSessionSearchResult[];
  } catch (error) {
    console.error("Failed to search vote sessions:", error);
    return [];
  }
}
