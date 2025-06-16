import { NextRequest, NextResponse } from "next/server";
import { getValidatorVoteStats } from "@/lib/db/validators";
import { MAX_VOTE_HISTORY_RESULTS, RECENT_HISTORY_RESULTS } from "@/lib/constants";
import { validate as uuidValidate } from "uuid";

function sanitizeInput(input: string | undefined | null): string {
  if (!input) return "";
  // Simple sanitization to remove potentially malicious characters
  // Replace with sanitize-html if preferred
  return input.replace(/[<>]/g, "");
}

function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    return `Error: ${sanitizeInput(error.message)}`;
  }
  return "Unknown error occurred";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const validatorId = searchParams.get("validatorId");
    const validatorIds = searchParams.get("validatorIds");
    const limitParam = searchParams.get("limit") || RECENT_HISTORY_RESULTS.toString();

    // Sanitize and validate limit
    const sanitizedLimit = sanitizeInput(limitParam);
    const parsedLimit = parseInt(sanitizedLimit);
    if (isNaN(parsedLimit) && sanitizedLimit !== "") {
      if (process.env.NODE_ENV === "development") {
        console.error("Invalid limit parameter:", limitParam);
      }
      return NextResponse.json({ error: "Invalid limit parameter" }, { status: 400 });
    }
    const effectiveLimit =
      sanitizedLimit === "" || parsedLimit === 0
        ? MAX_VOTE_HISTORY_RESULTS
        : Math.min(parsedLimit, MAX_VOTE_HISTORY_RESULTS);

    // Handle single validatorId (for VoteHistoryTable)
    if (validatorId) {
      const sanitizedValidatorId = sanitizeInput(validatorId);
      if (!sanitizedValidatorId || !uuidValidate(sanitizedValidatorId)) {
        if (process.env.NODE_ENV === "development") {
          console.error("Invalid or missing validatorId:", validatorId);
        }
        return NextResponse.json(
          { error: "Invalid or missing validatorId" },
          { status: 400 }
        );
      }

      if (process.env.NODE_ENV === "development") {
        console.log(
          `Fetching vote stats for validator ${sanitizedValidatorId} with limit: ${effectiveLimit}`
        );
      }

      const stats = await getValidatorVoteStats(sanitizedValidatorId, effectiveLimit);
      return NextResponse.json(stats);
    }

    // Handle multiple validatorIds (for NetworkVisualization)
    if (validatorIds) {
      const sanitizedIds = sanitizeInput(validatorIds);
      const validatorIdArray = sanitizedIds
        .split(",")
        .filter((id) => id && uuidValidate(id));

      if (process.env.NODE_ENV === "development") {
        console.log("Processed validator IDs:", validatorIdArray);
      }

      if (validatorIdArray.length === 0) {
        if (process.env.NODE_ENV === "development") {
          console.warn("No valid validator IDs provided, returning empty stats");
        }
        return NextResponse.json([]);
      }

      const statsPromises = validatorIdArray.map(async (id) => {
        try {
          const stats = await getValidatorVoteStats(id, effectiveLimit);
          return {
            validatorId: id,
            totalVotes: stats.totalVotes || 0,
            consensusMatchPercentage: stats.consensusMatchPercentage || 0,
          };
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.error(`Error fetching stats for validator ${id}:`, error);
          }
          return {
            validatorId: id,
            totalVotes: 0,
            consensusMatchPercentage: 0,
          };
        }
      });

      const stats = await Promise.all(statsPromises);
      return NextResponse.json(stats);
    }

    // No valid parameters provided
    return NextResponse.json(
      { error: "Must provide validatorId or validatorIds" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error fetching vote stats:", sanitizeError(error));
    return NextResponse.json(
      { error: "Failed to fetch vote stats" },
      { status: 500 }
    );
  }
}