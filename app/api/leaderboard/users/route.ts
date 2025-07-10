import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { rateLimitRelaxed } from "@/lib/middleware/rate-limit";

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

export const GET = rateLimitRelaxed(async (request: Request) => {
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
    let users: any[] = [];
    try {
      users = await prisma.userPoints.findMany({
        orderBy: {
          totalEarned: "desc",
        },
        skip: offset,
        take: limit,
      });
    } catch (error) {
      console.error("Error fetching user points:", error);
      users = [];
    }

    // If no users found, return mock data for demo
    if (users.length === 0) {
      const mockUsers: UserStats[] = [
        {
          userId: "demo-user-1",
          username: "CryptoOracle",
          rank: 1,
          balance: 12500,
          totalEarned: 15000,
          winRate: 68.5,
          totalBets: 42,
          wins: 29,
          streak: 5,
          level: 8,
        },
        {
          userId: "demo-user-2",
          username: "MarketMaven",
          rank: 2,
          balance: 9800,
          totalEarned: 11200,
          winRate: 62.3,
          totalBets: 38,
          wins: 24,
          streak: 3,
          level: 6,
        },
        {
          userId: "demo-user-3",
          username: "PredictionPro",
          rank: 3,
          balance: 8200,
          totalEarned: 9500,
          winRate: 58.9,
          totalBets: 35,
          wins: 21,
          streak: 2,
          level: 5,
        },
      ];

      return NextResponse.json({
        leaderboard: mockUsers.slice(offset, offset + limit),
        summary: {
          totalV3RAInPlay: 30500,
          activeUsers: 3,
          avgWinRate: 63.2,
        },
        pagination: {
          offset,
          limit,
          timeframe,
        },
      });
    }

    // Get betting statistics for each user
    const userStats: UserStats[] = await Promise.all(
      users.map(async (userPoints, index) => {
        // Get user info
        let user;
        try {
          user = await prisma.user.findUnique({
            where: { id: userPoints.userId },
            select: { name: true, email: true },
          });
        } catch (error) {
          console.error(`Error fetching user ${userPoints.userId}:`, error);
          user = null;
        }

        // Get betting statistics
        const betsQuery = timeframe === "alltime" 
          ? { userId: userPoints.userId }
          : { 
              userId: userPoints.userId,
              createdAt: { gte: startDate }
            };

        let totalBets = 0;
        let winningBets = 0;
        
        try {
          [totalBets, winningBets] = await Promise.all([
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
        } catch (error) {
          console.error(`Error fetching bet statistics for user ${userPoints.userId}:`, error);
          // Use default values if query fails
          totalBets = 0;
          winningBets = 0;
        }

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
    let totalV3RAInPlay;
    let activeUsers = 0;
    
    try {
      [totalV3RAInPlay, activeUsers] = await Promise.all([
        prisma.userPoints.aggregate({
          _sum: { balance: true },
        }),
        prisma.userPoints.count({
          where: {
            balance: { gt: 0 },
          },
        }),
      ]);
    } catch (error) {
      console.error("Error fetching summary statistics:", error);
      totalV3RAInPlay = { _sum: { balance: null } };
      activeUsers = userStats.length;
    }

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
});