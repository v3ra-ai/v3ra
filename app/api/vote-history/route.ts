
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getHistoricalVoteSessions } from "@/lib/store";
import { prisma } from "@/lib/db/client";
import { RESULT_QUERIES_CARDS } from "@/lib/constants";

// Log to confirm file is loaded
console.log("[vote-history] File loaded");

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
 * API endpoint to retrieve vote history or vote session count
 * GET /api/vote-history?limit=12&offset=0&countOnly=true
 * @param limit Number of items to return
 * @param offset Number of items to skip (for pagination)
 * @param countOnly If true, returns only the total number of vote sessions
 */
export async function GET(request: Request) {
  // Force dynamic rendering
  headers();

  try {
    const { searchParams } = new URL(request.url);
    const limitRaw = searchParams.get("limit");
    const offsetRaw = searchParams.get("offset");
    const countOnly = searchParams.get("countOnly") === "true";
    const limit = limitRaw
      ? parseInt(limitRaw, 10) || RESULT_QUERIES_CARDS
      : RESULT_QUERIES_CARDS;
    const offset = offsetRaw ? parseInt(offsetRaw, 10) || 0 : 0;

    console.log("[vote-history] Handling GET request:", { limitRaw, limit, offsetRaw, offset, countOnly });

    // Validate limit
    if (isNaN(limit) || limit < 1) {
      console.warn("[vote-history] Invalid limit, using default:", RESULT_QUERIES_CARDS);
      return NextResponse.json(
        { status: "error", message: "Invalid limit parameter" },
        { status: 400 }
      );
    }

    // Get historical vote sessions from the database
    try {
      if (countOnly) {
        // Query only the count of vote sessions
        const count = await prisma.voteSession.count();
        console.log("[vote-history] Returning vote session count:", count);
        return NextResponse.json({ count });
      }

      const historicalVotes = await getHistoricalVoteSessions(limit, offset);

      if (historicalVotes && historicalVotes.length > 0) {
        const voteHistory: VoteHistoryEntry[] = historicalVotes.map(
          (session) => ({
            id: session.id,
            isConsensusReached: session.isConsensusReached,
            consensusValue: session.consensusValue,
            queryText: session.queryText,
            validatorResponses: session.validatorResponses.map((res) => ({
              id: res.id,
              provider: res.provider,
              profileName: res.profileName,
              vote: res.vote,
              rationale: res.rationale,
            })),
            votingResult: {
              yes: session.votingResult.yes,
              no: session.votingResult.no,
              notVoted: session.votingResult.notVoted,
            },
            timestamp: session.timestamp
              ? new Date(session.timestamp).toISOString()
              : new Date().toISOString(),
          }),
        );
        console.log("[vote-history] Returning vote history:", voteHistory.length, "items");
        return NextResponse.json(voteHistory);
      } else {
        console.log("[vote-history] No vote sessions found");
        return NextResponse.json([]);
      }
    } catch (dbError) {
      console.error("[vote-history] Database error:", dbError);
      return NextResponse.json(
        {
          status: "error",
          message: "Database error: " + (dbError as Error).message,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("[vote-history] Unexpected error:", error);
    return NextResponse.json(
      { status: "error", message: (error as Error).message },
      { status: 500 },
    );
  }
}