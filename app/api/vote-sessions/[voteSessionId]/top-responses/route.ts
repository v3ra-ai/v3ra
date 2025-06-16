import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import sanitizeHtml from "sanitize-html";
import { validate as uuidValidate } from "uuid";

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

/**
 * Sanitizes input string using sanitize-html to prevent XSS.
 * @param input - The input string to sanitize.
 * @returns A sanitized string, or empty string if input is null/undefined.
 */
function sanitizeInput(input: string | undefined | null): string {
  if (!input) return "";
  try {
    return sanitizeHtml(input, {
      allowedTags: [], // Disallow all HTML tags
      allowedAttributes: {}, // Disallow all attributes
    });
  } catch (error) {
    console.warn("sanitize-html failed:", error, "Input:", input);
    return ""; // Return empty string on failure
  }
}

/**
 * Sanitizes error messages for safe logging.
 * @param error - The error to sanitize.
 * @returns A safe string representation of the error.
 */
function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    return `Error: ${sanitizeInput(error.message)}`;
  }
  return "Unknown error occurred";
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ voteSessionId: string }> }
) {
  try {
    const params = await context.params;
    let { voteSessionId } = params;
    const url = new URL(request.url);
    let limitParam = url.searchParams.get("limit") || "2";

    // Sanitize and validate voteSessionId
    voteSessionId = sanitizeInput(voteSessionId);
    if (!voteSessionId || !uuidValidate(voteSessionId)) {
      return NextResponse.json(
        { error: "Invalid voteSessionId format" },
        { status: 400 }
      );
    }

    // Sanitize and validate limit
    limitParam = sanitizeInput(limitParam);
    const limit = Math.min(Math.max(parseInt(limitParam, 10) || 2, 1), 10);
    if (isNaN(limit)) {
      return NextResponse.json(
        { error: "Invalid limit parameter" },
        { status: 400 }
      );
    }

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

    // Process validator responses with simulated voting
    const responsesWithVotes: ValidatorResponseWithVotes[] = voteSession.validatorResponses.map(
      (response) => {
        const baseVotes = Math.floor(Math.random() * 100) + 1;
        const confidenceMultiplier = response.confidence || 0.5;
        const consensusBonus = response.matchedConsensus ? 1.5 : 0.8;

        const upvotes = Math.floor(
          baseVotes * confidenceMultiplier * consensusBonus
        );
        const downvotes = Math.floor(
          baseVotes *
            (1 - confidenceMultiplier) *
            (response.matchedConsensus ? 0.5 : 1.2)
        );

        return {
          id: response.id,
          profileName: sanitizeInput(response.validator.profileName), // Sanitize database fields
          provider: sanitizeInput(response.validator.provider),
          vote: response.vote,
          rationale: sanitizeInput(response.rationale),
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
    console.error("Error fetching top responses:", sanitizeError(error));
    return NextResponse.json(
      { error: "Failed to fetch top responses" },
      { status: 500 }
    );
  }
}