import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const voteSession = await prisma.voteSession.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        queryText: true,
        isConsensusReached: true,
        consensusValue: true,
        votesYes: true,
        votesNo: true,
        timestamp: true,
      },
    });

    if (!voteSession) {
      return NextResponse.json({ error: "Vote session not found" }, { status: 404 });
    }

    return NextResponse.json(voteSession);
  } catch (error) {
    console.error("Error fetching vote session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}