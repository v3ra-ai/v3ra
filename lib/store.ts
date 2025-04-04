"use server"

import type { NetworkState, VoteResult } from "./types"
import { createValidators, rotateLeader, simulateValidatorResponse, calculateConsensus } from "./validators"
import { prisma, initDatabase, seedValidators, persistVoteSession } from "./database"

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
]

// Initialize the network state with a small number of validators
const initialState: NetworkState = {
  validators: createValidators(8), // Create 8 validators with predefined profiles
  currentLeaderIndex: 0,
  isVoting: false,
  lastQuery: null,
  lastNetworkResponse: null,
  lastConsensusValue: null,
  lastConsensusThreshold: 0.5, // Default consensus threshold (50%)
  lastConsensusAchieved: null,
  lastVoteTimestamp: null,
}

let networkState = { ...initialState }

// Initialize the database and seed validators if necessary
export async function initializeSystem(): Promise<boolean> {
  try {
    // Initialize database connection
    const dbInitialized = await initDatabase();
    if (!dbInitialized) {
      console.error("Failed to initialize database");
      return false;
    }
    
    // Seed validators from our predefined list
    await seedValidators(networkState.validators);
    
    return true;
  } catch (error) {
    console.error("System initialization error:", error);
    return false;
  }
}

// Get the current network state
export async function getNetworkState(): Promise<NetworkState> {
  return { ...networkState }
}

// Get a random query from the sample list
function getRandomQuery(): string {
  const index = Math.floor(Math.random() * SAMPLE_QUERIES.length)
  return SAMPLE_QUERIES[index]
}

// Broadcast a query to all validators and collect votes
export async function broadcastQuery(): Promise<VoteResult> {
  if (networkState.isVoting) {
    throw new Error("Voting already in progress")
  }

  networkState.isVoting = true
  const query = getRandomQuery()
  networkState.lastQuery = query

  try {
    // Process each validator's response asynchronously, in parallel
    const validatorResponsePromises = networkState.validators.map(validator => 
      simulateValidatorResponse(validator, query)
    )
    
    // Wait for all validator responses
    networkState.validators = await Promise.all(validatorResponsePromises)

    // Calculate votes
    let yesCount = 0
    let noCount = 0
    let notVotedCount = 0

    networkState.validators.forEach(validator => {
      if (validator.lastVote === true) {
        yesCount++;
      } else if (validator.lastVote === false) {
        noCount++;
      } else {
        notVotedCount++;
      }
    });

    // Determine consensus with explicit tie handling
    const totalVoted = yesCount + noCount;
    const isConsensusReached = totalVoted > 0;
    
    // Handle ties explicitly
    let finalOutcome: boolean | null = null;
    if (yesCount > noCount) {
      finalOutcome = true;
    } else if (noCount > yesCount) {
      finalOutcome = false;
    } else {
      finalOutcome = null; // Explicit tie
    }

    // Create structured validator responses
    const validatorResponses = networkState.validators
      .filter(v => v.lastVote !== null)
      .map(v => ({
        id: v.id,
        provider: v.provider,
        profileName: v.profileName,
        vote: v.lastVote ? "YES" : "NO",
        rationale: v.lastRationale || ""
      }));

    // Create aggregated response for internal use
    const responses = networkState.validators
      .filter(v => v.lastRationale)
      .map(v => `${v.profileName} (${v.provider}): ${v.lastRationale}`)
      .join("\n\n");

    const aggregatedResponse = `Query: "${query}"\n\n${responses}`;

    // Create vote result
    const voteResult: VoteResult = {
      isConsensusReached,
      consensusValue: finalOutcome,
      validatorResponses,
      votingResult: {
        yes: yesCount,
        no: noCount,
        notVoted: notVotedCount
      }
    }

    // Update network state with results
    networkState.lastNetworkResponse = aggregatedResponse;
    networkState.lastConsensusValue = finalOutcome;
    networkState.lastConsensusAchieved = isConsensusReached;
    networkState.lastVoteTimestamp = new Date().toISOString();

    // Rotate leader
    networkState.currentLeaderIndex = rotateLeader(
      networkState.validators, 
      networkState.currentLeaderIndex
    );

    // Reset voting state
    networkState.isVoting = false;

    // ADDED: Persist vote results to database
    try {
      await persistVoteSession(voteResult, query, networkState.validators);
      console.log("Vote session persisted to database successfully");
    } catch (dbError) {
      // Log database persistence error but don't fail the overall operation
      console.error("Failed to persist vote session:", dbError);
    }

    return voteResult;
  } catch (error) {
    // Handle errors
    console.error("Error during broadcast:", error);
    
    // Reset voting state
    networkState.isVoting = false;
    
    throw error;
  }
}

// Reset the network state (for testing)
export async function resetNetwork(): Promise<void> {
  networkState = { ...initialState, validators: createValidators(8) };
  
  // Optionally reset database for testing purposes
  try {
    // This could clear certain tables or reset specific data
    // await prisma.voteSession.deleteMany({});
    console.log("Network reset (in-memory only, database preserved)");
  } catch (error) {
    console.error("Database reset error:", error);
  }
}

// Get historical vote sessions from the database
export async function getHistoricalVoteSessions(limit: number = 10): Promise<any[]> {
  try {
    const sessions = await prisma.voteSession.findMany({
      take: limit,
      orderBy: { timestamp: 'desc' },
      include: {
        validatorResponses: {
          include: {
            validator: true
          }
        }
      }
    });
    
    // Transform database records to match the expected VoteResult interface
    return sessions.map(session => {
      // Count yes/no votes from validatorResponses
      const yesCount = session.validatorResponses.filter(r => r.vote === 'YES').length;
      const noCount = session.validatorResponses.filter(r => r.vote === 'NO').length;
      const notVotedCount = session.validatorResponses.filter(r => !r.vote || r.vote === 'ABSTAIN').length;
      
      // Map validator responses to expected format with defensive coding
      const validatorResponses = session.validatorResponses.map(response => ({
        id: response.validator?.id || response.validatorId || 'unknown',
        provider: response.validator?.provider || 'unknown',
        profileName: response.validator?.profileName || 'Unknown Validator',
        vote: response.vote || 'ABSTAIN',
        rationale: response.rationale || 'No rationale provided'
      }));
      
      // Return properly formatted VoteResult object
      return {
        id: session.id,
        isConsensusReached: Boolean(session.isConsensusReached),
        consensusValue: session.consensusValue,
        queryText: session.queryText || 'Unknown query',
        timestamp: session.timestamp || new Date().toISOString(),
        validatorResponses,
        votingResult: {
          yes: yesCount,
          no: noCount,
          notVoted: notVotedCount
        }
      };
    });
  } catch (error) {
    console.error("Failed to retrieve historical vote sessions:", error);
    return [];
  }
}

// Search vote sessions by semantic similarity
export async function searchVoteSessions(query: string, limit: number = 5): Promise<any[]> {
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
    return sessions;
  } catch (error) {
    console.error("Failed to search vote sessions:", error);
    return [];
  }
}
