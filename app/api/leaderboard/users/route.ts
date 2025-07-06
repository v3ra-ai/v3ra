import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

interface UserStats {
  userId: string;
  username: string;
  rank: number;
  balance: number;
  totalEarned: number;
  winRate: number;
  totalBets: number;
  wins: number;
  streak: number;
  level: number;
  avatar?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get("timeframe") || "weekly";
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Calculate date range based on timeframe
    const now = new Date();
    let startDate: Date;
    
    switch (timeframe) {
      case "daily":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case "weekly":
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case "monthly":
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case "alltime":
      default:
        startDate = new Date(0); // Beginning of time
    }

    // Get user points and statistics
    const users = await prisma.userPoints.findMany({
      orderBy: {
        totalEarned: "desc",
      },
      skip: offset,
      take: limit,
      include: {
        // We need to join with User table to get username
        // This requires adding a relation in the schema
      },
    });

    // Get betting statistics for each user
    const userStats: UserStats[] = await Promise.all(
      users.map(async (userPoints, index) => {
        // Get user info
        const user = await prisma.user.findUnique({
          where: { id: userPoints.userId },
          select: { name: true, email: true },
        });

        // Get betting statistics
        const betsQuery = timeframe === "alltime" 
          ? { userId: userPoints.userId }
          : { 
              userId: userPoints.userId,
              createdAt: { gte: startDate }
            };

        const [totalBets, winningBets] = await Promise.all([
          prisma.marketBet.count({
            where: betsQuery,
          }),
          prisma.marketBet.count({
            where: {
              ...betsQuery,
              status: "WON",
            },
          }),
        ]);

        const winRate = totalBets > 0 ? (winningBets / totalBets) * 100 : 0;

        return {
          userId: userPoints.userId,
          username: user?.name || user?.email?.split("@")[0] || "Anonymous",
          rank: index + offset + 1,
          balance: parseFloat(userPoints.balance.toString()),
          totalEarned: parseFloat(userPoints.totalEarned.toString()),
          winRate: Math.round(winRate * 10) / 10, // Round to 1 decimal
          totalBets,
          wins: winningBets,
          streak: userPoints.streak,
          level: userPoints.level,
        };
      })
    );

    // Get summary statistics
    const [totalV3RAInPlay, activeUsers] = await Promise.all([
      prisma.userPoints.aggregate({
        _sum: { balance: true },
      }),
      prisma.userPoints.count({
        where: {
          balance: { gt: 0 },
        },
      }),
    ]);

    // Calculate average win rate
    const avgWinRate = userStats.length > 0
      ? userStats.reduce((sum, user) => sum + user.winRate, 0) / userStats.length
      : 0;

    return NextResponse.json({
      leaderboard: userStats,
      summary: {
        totalV3RAInPlay: parseFloat(totalV3RAInPlay._sum.balance?.toString() || "0"),
        activeUsers,
        avgWinRate: Math.round(avgWinRate * 10) / 10,
      },
      pagination: {
        offset,
        limit,
        timeframe,
      },
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard data" },
      { status: 500 }
    );
  }
}