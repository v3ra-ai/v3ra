import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getHistoricalVoteSessions } from "@/lib/store";

// Define types based on Prisma schema and expected output
interface Validator {
  id: string;
  provider: string;
  profileName: string;
}

interface ValidatorResponse {
  validatorId: string;
  validator?: Validator;  // Optional, may be included in include clause
  vote: string;
  rationale: string;
}

interface VoteSession {
  id: string;
  isConsensusReached: boolean;
  consensusValue: boolean | null;
  queryText: string;
  validatorResponses: ValidatorResponse[];
  votesYes: number;
  votesNo: number;
  notVoted: number;
  timestamp: Date;
}

interface VoteHistoryEntry {
  id: string;
  isConsensusReached: boolean;
  consensusValue: boolean | null;
  queryText: string;
  validatorResponses: {
    id: string;
    provider: string;
    profileName: string;
    vote: string;
    rationale: string;
  }[];
  votingResult: {
    yes: number;
    no: number;
    notVoted: number;
  };
  timestamp: string;
}

/**
 * API endpoint to retrieve vote history
 * GET /api/vote-history
 */
export async function GET(request: Request) {
  // Force dynamic rendering
  headers();

  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit") || "10", 10) : 10;

    // Get historical vote sessions from the database
    try {
      const historicalVotes: VoteSession[] = await getHistoricalVoteSessions(limit);
      if (historicalVotes && historicalVotes.length > 0) {
        const voteHistory: VoteHistoryEntry[] = historicalVotes.map(session => ({
          id: session.id,
          isConsensusReached: session.isConsensusReached,
          consensusValue: session.consensusValue,
          queryText: session.queryText,
          validatorResponses: session.validatorResponses
            .filter(res => res && (res.validator || res.validatorId)) // Filter out invalid responses
            .map(res => ({
              id: res.validator?.id || res.validatorId || 'unknown',
              provider: res.validator?.provider || 'unknown',
              profileName: res.validator?.profileName || 'Unknown Validator',
              vote: res.vote || 'UNKNOWN',
              rationale: res.rationale || 'No rationale provided',
            })),
          votingResult: {
            yes: session.votesYes,
            no: session.votesNo,
            notVoted: session.notVoted,
          },
          timestamp: session.timestamp.toISOString(),
        }));
        return NextResponse.json(voteHistory);
      } else {
        return NextResponse.json([]);
      }
    } catch (dbError) {
      console.error("Failed to get historical votes from DB:", dbError);
      return NextResponse.json(
        { status: "error", message: "Database error: " + (dbError as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Vote history error:", error);
    return NextResponse.json(
      { status: "error", message: (error as Error).message },
      { status: 500 }
    );
  }
}