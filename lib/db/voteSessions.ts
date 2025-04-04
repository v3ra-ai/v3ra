import { VoteSession, ValidatorResponse, Validator } from '@prisma/client';
import { prisma } from './client';
import { updateValidatorMetrics } from './validators';

/**
 * Create a new vote session
 */
export async function createVoteSession(data: {
  queryText: string;
  context?: string;
  leaderId?: string;
}) {
  return prisma.voteSession.create({
    data: {
      queryText: data.queryText,
      context: data.context || null,
      isConsensusReached: false,
      leaderId: data.leaderId || null,
      votesYes: 0,
      votesNo: 0,
      notVoted: 0
    }
  });
}

/**
 * Get a vote session by ID
 */
export async function getVoteSession(id: string) {
  return prisma.voteSession.findUnique({
    where: { id },
    include: {
      validatorResponses: {
        include: {
          validator: true
        }
      }
    }
  });
}

/**
 * Add a validator response to a vote session
 */
export async function addValidatorResponse(data: {
  voteSessionId: string;
  validatorId: string;
  vote: string;
  rationale: string;
  confidence?: number;
  latency?: number;
  error?: string;
}) {
  return prisma.validatorResponse.create({
    data: {
      voteSessionId: data.voteSessionId,
      validatorId: data.validatorId,
      vote: data.vote.toUpperCase(),
      rationale: data.rationale,
      confidence: data.confidence || 0.5,
      latency: data.latency || null,
      error: data.error || null
    }
  });
}

/**
 * Calculate consensus for a vote session
 */
export async function calculateConsensus(voteSessionId: string) {
  // Get all validator responses for this session
  const validatorResponses = await prisma.validatorResponse.findMany({
    where: { voteSessionId },
    include: {
      validator: true
    }
  });
  
  if (validatorResponses.length === 0) {
    return null;
  }
  
  // Count votes
  let yesVotes = 0;
  let noVotes = 0;
  let weightedYesVotes = 0;
  let weightedNoVotes = 0;
  let totalWeight = 0;
  
  for (const response of validatorResponses) {
    const vote = response.vote.toUpperCase();
    const weight = response.validator.reliability || 1; // Use reliability as weight, default to 1
    
    if (vote === 'YES') {
      yesVotes++;
      weightedYesVotes += weight;
    } else if (vote === 'NO') {
      noVotes++;
      weightedNoVotes += weight;
    }
    
    totalWeight += weight;
  }
  
  // Calculate consensus
  const isConsensusReached = yesVotes > 0 || noVotes > 0;
  const consensusValue = weightedYesVotes >= weightedNoVotes; // Weighted majority (true for ties)
  
  // Update vote session with consensus result
  const updatedSession = await prisma.voteSession.update({
    where: { id: voteSessionId },
    data: {
      isConsensusReached,
      consensusValue: isConsensusReached ? consensusValue : null,
      votesYes: yesVotes,
      votesNo: noVotes,
      notVoted: 0, // For now, assume all validators vote
      updatedAt: new Date()
    }
  });
  
  // Update validator metrics based on consensus
  for (const response of validatorResponses) {
    const vote = response.vote.toUpperCase() === 'YES';
    const matchedConsensus = vote === consensusValue;
    
    // Update response record
    await prisma.validatorResponse.update({
      where: { id: response.id },
      data: { matchedConsensus }
    });
    
    // Update validator metrics
    await updateValidatorMetrics(response.validatorId, matchedConsensus);
  }
  
  return updatedSession;
}

/**
 * Get recent vote sessions with optional limit
 */
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
    
    // Format for client consumption (match the UI expected format)
    return sessions.map(session => {
      const validatorResponses = session.validatorResponses.map(response => ({
        id: response.validator.id,
        provider: response.validator.provider,
        profileName: response.validator.profileName,
        vote: response.vote.toLowerCase(),
        rationale: response.rationale,
        confidence: response.confidence || undefined,
        avatarUrl: response.validator.avatarUrl || undefined
      }));
      
      return {
        isConsensusReached: session.isConsensusReached,
        consensusValue: session.consensusValue,
        queryText: session.queryText,
        validatorResponses,
        votingResult: {
          yes: session.votesYes,
          no: session.votesNo,
          notVoted: session.notVoted
        },
        timestamp: session.timestamp.getTime(),
        id: session.id,
        txHash: session.txHash || undefined,
        blockchainNetwork: session.blockchainNetwork || undefined
      };
    });
  } catch (error) {
    console.error("Failed to fetch vote history:", error);
    return [];
  }
}

/**
 * Update vote session with blockchain transaction information
 */
export async function updateVoteSessionBlockchainInfo(
  voteSessionId: string, 
  txHash: string, 
  network: string
) {
  return prisma.voteSession.update({
    where: { id: voteSessionId },
    data: {
      txHash,
      blockchainNetwork: network
    }
  });
}
