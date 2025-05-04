import { NextRequest, NextResponse } from "next/server";
import { getValidatorVoteStats } from "@/lib/db/validators";

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
    const parsedLimit = limit ? parseInt(limit) : 50;
    if (isNaN(parsedLimit) && limit !== '') {
      if (process.env.NODE_ENV === "development") {
        console.error("Invalid limit parameter:", limit);
      }
      return NextResponse.json({ error: "Invalid limit parameter" }, { status: 400 });
    }
    // Enforce maximum limit of 300
    const effectiveLimit = limit === '' || parsedLimit === 0 ? 300 : Math.min(parsedLimit, 300);
    if (process.env.NODE_ENV === "development") {
      console.log(`Fetching vote stats for validator ${validatorId} with limit: ${effectiveLimit}`);
    }
    const stats = await getValidatorVoteStats(validatorId, effectiveLimit);
    return NextResponse.json(stats);
  } catch (error) {
    console.error(`Error fetching vote stats for validator ${validatorId}:`, error);
    return NextResponse.json({ error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 });
  }
}