import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

interface ValidatorResponseWithVotes {
  id: string;
  profileName: string;
  provider: string;
  vote: string;
  rationale: string;
  confidence: number | null;
  matchedConsensus: boolean | null;
  upvotes: number;
  downvotes: number;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ voteSessionId: string }> }
) {
  try {
    const params = await context.params;
    const { voteSessionId } = params;
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "2");


    // Get vote session with validator responses
    const voteSession = await prisma.voteSession.findUnique({
      where: { id: voteSessionId },
      include: {
        validatorResponses: {
          include: {
            validator: true,
          },
        },
      },
    });

    if (!voteSession) {
      return NextResponse.json(
        { error: "Vote session not found" },
        { status: 404 }
      );
    }

    // Since we don't have a direct voting mechanism on validator responses yet,
    // we'll simulate it based on confidence scores and consensus matching
    // In a real implementation, you would have a separate voting table for responses
    
    const responsesWithVotes: ValidatorResponseWithVotes[] = voteSession.validatorResponses.map(
      (response) => {
        // Simulate voting based on confidence and consensus matching
        const baseVotes = Math.floor(Math.random() * 100) + 1;
        const confidenceMultiplier = response.confidence || 0.5;
        const consensusBonus = response.matchedConsensus ? 1.5 : 0.8;
        
        const upvotes = Math.floor(baseVotes * confidenceMultiplier * consensusBonus);
        const downvotes = Math.floor(baseVotes * (1 - confidenceMultiplier) * (response.matchedConsensus ? 0.5 : 1.2));

        return {
          id: response.id,
          profileName: response.validator.profileName,
          provider: response.validator.provider,
          vote: response.vote,
          rationale: response.rationale,
          confidence: response.confidence,
          matchedConsensus: response.matchedConsensus,
          upvotes,
          downvotes,
        };
      }
    );

    // Sort by upvotes and downvotes
    const topUpvoted = [...responsesWithVotes]
      .sort((a, b) => b.upvotes - a.upvotes)
      .slice(0, limit);

    const topDownvoted = [...responsesWithVotes]
      .sort((a, b) => b.downvotes - a.downvotes)
      .slice(0, limit);

    const result = {
      topUpvoted,
      topDownvoted,
      voteSessionId,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching top responses:", error);
    return NextResponse.json(
      { error: "Failed to fetch top responses" },
      { status: 500 }
    );
  }
}