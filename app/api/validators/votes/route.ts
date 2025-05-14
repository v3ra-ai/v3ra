import { NextRequest, NextResponse } from "next/server";
import { getValidatorVoteHistory } from "@/lib/db/validators";
import { MAX_VOTE_HISTORY_RESULTS, RECENT_HISTORY_RESULTS } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const validatorId = searchParams.get("validatorId");
  const limit = searchParams.get("limit");

  if (!validatorId || typeof validatorId !== "string") {
    if (process.env.NODE_ENV === "development") {
      console.error("Invalid or missing validatorId:", validatorId);
    }
    return NextResponse.json({ error: "Invalid or missing validatorId" }, { status: 400 });
  }

  try {
    const parsedLimit = limit ? parseInt(limit) : RECENT_HISTORY_RESULTS;
    if (isNaN(parsedLimit) && limit !== '') {
      if (process.env.NODE_ENV === "development") {
        console.error("Invalid limit parameter:", limit);
      }
      return NextResponse.json({ error: "Invalid limit parameter" }, { status: 400 });
    }
    // Enforce maximum limit of MAX_VOTE_HISTORY_RESULTS
    const effectiveLimit = limit === '' || parsedLimit === 0 ? MAX_VOTE_HISTORY_RESULTS : Math.min(parsedLimit, MAX_VOTE_HISTORY_RESULTS);
    if (process.env.NODE_ENV === "development") {
      console.log(`Fetching vote history for validator ${validatorId} with limit: ${effectiveLimit}`);
    }
    const voteHistory = await getValidatorVoteHistory(validatorId, effectiveLimit);
    return NextResponse.json(voteHistory);
  } catch (error) {
    // console.error(`Error fetching vote history for validator ${validatorId}:`, error);
    return NextResponse.json({ error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 });
  }
}