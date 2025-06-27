import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const voteSession = await prisma.voteSession.findUnique({
      where: { id },
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
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}