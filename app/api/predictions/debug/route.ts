import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function GET() {
  try {
    // Get recent predictions
    const recentPredictions = await prisma.prediction.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        outcomes: true,
        modelPredictions: true,
      }
    });

    // Get recent vote sessions that might be predictions
    const recentSessions = await prisma.voteSession.findMany({
      where: {
        queryText: {
          contains: "win",
          mode: 'insensitive'
        }
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      predictionsCount: recentPredictions.length,
      predictions: recentPredictions,
      recentSessions: recentSessions.map(s => ({
        id: s.id,
        query: s.queryText,
        created: s.createdAt,
      })),
      databaseConnected: true,
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      databaseConnected: false,
    }, { status: 500 });
  }
}