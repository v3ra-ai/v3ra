import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getHistoricalVoteSessions } from "@/lib/store";

export async function GET(request: Request) {
  // Force dynamic rendering
  headers();

  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit") || "10", 10) : 10;
    
    // Get historical vote sessions from the database
    try {
      const historicalVotes = await getHistoricalVoteSessions(limit);
      if (historicalVotes && historicalVotes.length > 0) {
        // Map to VoteResult type, ensuring ID is included and safeguarding against null values
        const voteHistory = historicalVotes.map(session => ({
          id: session.id, 
          isConsensusReached: session.isConsensusReached,
          consensusValue: session.consensusValue,
          queryText: session.queryText,
          validatorResponses: session.validatorResponses
            .filter((res: any) => res && res.validator) // Filter out invalid responses
            .map((res: any) => ({
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
        // Return empty array if no votes are found
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
