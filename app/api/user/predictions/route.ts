import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { logger } from "@/lib/utils/logger";
import { z } from "zod";
import { rateLimitRelaxed, rateLimitNormal } from "@/lib/middleware/rate-limit";

const getUserPredictionsSchema = z.object({
  userId: z.string().uuid(),
  status: z.enum(['active', 'resolved', 'all']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const GET = rateLimitRelaxed(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validate query parameters
    const params = {
      userId: searchParams.get('userId'),
      status: searchParams.get('status'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    };
    
    const validationResult = getUserPredictionsSchema.safeParse(params);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid query parameters", 
          details: validationResult.error.format() 
        },
        { status: 400 }
      );
    }
    
    const { userId, status, limit, offset } = validationResult.data;
    
    // Build query filters
    const where: any = {
      market: {
        bets: {
          some: { userId }
        }
      }
    };
    
    if (status === 'active') {
      where.resolutionStatus = 'pending';
    } else if (status === 'resolved') {
      where.resolutionStatus = { in: ['resolved', 'unresolved'] };
    }
    
    // Get user's predictions with bets
    const predictions = await prisma.prediction.findMany({
      where,
      include: {
        market: {
          include: {
            bets: {
              where: { userId }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });
    
    // Get total count for pagination
    const totalCount = await prisma.prediction.count({ where });
    
    // Format response with detailed bet information
    const formattedPredictions = predictions.map(p => {
      const userBet = p.market?.bets[0];
      const metadata = p.metadata as any || {};
      const isWinner = metadata.resolution && userBet && metadata.resolution === userBet.position;
      
      return {
        id: p.id,
        statement: p.queryText,
        category: p.category || 'general',
        status: p.resolutionStatus,
        resolution: metadata.resolution,
        createdAt: p.createdAt,
        resolvedAt: p.resolutionDate,
        difficulty: metadata.difficulty || 'medium',
        resolutionTime: metadata.resolutionTime || 168,
        
        // Market data
        market: p.market ? {
          id: p.market.id,
          initialProbability: p.market.initialProbability,
          currentProbability: p.market.currentProbability,
          totalStake: p.market.totalStake,
          yesPool: p.market.yesPool,
          noPool: p.market.noPool
        } : null,
        
        // User's bet data
        userBet: userBet ? {
          id: userBet.id,
          position: userBet.position,
          stake: Number(userBet.amount),
          potentialPayout: Number(userBet.potentialReturn),
          actualPayout: userBet.payout,
          isWinner,
          profit: isWinner ? Number(userBet.payout || 0) - Number(userBet.amount) : -Number(userBet.amount),
          createdAt: userBet.createdAt,
          resolvedAt: userBet.settledAt
        } : null
      };
    });
    
    // Calculate statistics
    const stats = {
      totalPredictions: totalCount,
      activePredictions: predictions.filter(p => p.resolutionStatus === 'pending').length,
      wonPredictions: formattedPredictions.filter(p => p.userBet?.isWinner).length,
      lostPredictions: formattedPredictions.filter(p => 
        p.status === 'resolved' && p.userBet && !p.userBet.isWinner
      ).length,
      totalStaked: formattedPredictions.reduce((sum, p) => sum + (p.userBet?.stake || 0), 0),
      totalWinnings: formattedPredictions.reduce((sum, p) => sum + Number(p.userBet?.actualPayout || 0), 0),
      netProfit: formattedPredictions.reduce((sum, p) => sum + (p.userBet?.profit || 0), 0),
      winRate: totalCount > 0 ? 
        (formattedPredictions.filter(p => p.userBet?.isWinner).length / 
         formattedPredictions.filter(p => p.status === 'resolved').length) * 100 : 0
    };
    
    return NextResponse.json({
      predictions: formattedPredictions,
      stats,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });
    
  } catch (error) {
    logger.error("Failed to fetch user predictions:", error);
    return NextResponse.json(
      { error: "Failed to fetch predictions" },
      { status: 500 }
    );
  }
});

const getPredictionStatsSchema = z.object({
  userId: z.string().uuid(),
  groupBy: z.enum(['category', 'difficulty', 'month', 'all']).default('category'),
});

// Get prediction statistics by category
export const POST = rateLimitNormal(async (request: NextRequest) => {
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = getPredictionStatsSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid request data", 
          details: validationResult.error.format() 
        },
        { status: 400 }
      );
    }
    
    const { userId, groupBy } = validationResult.data;
    
    // Get all user's resolved predictions
    const predictions = await prisma.prediction.findMany({
      where: {
        resolutionStatus: 'resolved',
        market: {
          bets: {
            some: { userId }
          }
        }
      },
      include: {
        market: {
          include: {
            bets: {
              where: { userId }
            }
          }
        }
      }
    });
    
    // Group statistics
    const groups = new Map<string, any>();
    
    predictions.forEach(p => {
      const userBet = p.market?.bets[0];
      if (!userBet) return;
      const metadata = p.metadata as any || {};
      
      const groupKey = groupBy === 'category' ? (p.category || 'general') :
                      groupBy === 'difficulty' ? (metadata.difficulty || 'medium') :
                      groupBy === 'month' ? new Date(p.createdAt).toISOString().substring(0, 7) :
                      'all';
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          name: groupKey,
          totalBets: 0,
          wins: 0,
          losses: 0,
          totalStaked: 0,
          totalWon: 0,
          netProfit: 0
        });
      }
      
      const group = groups.get(groupKey)!;
      group.totalBets++;
      
      if (metadata.resolution === userBet.position) {
        group.wins++;
        group.totalWon += userBet.payout || 0;
        group.netProfit += Number(userBet.payout || 0) - Number(userBet.amount);
      } else {
        group.losses++;
        group.netProfit -= Number(userBet.amount);
      }
      
      group.totalStaked += Number(userBet.amount);
    });
    
    // Convert to array and calculate win rates
    const groupStats = Array.from(groups.values()).map(g => ({
      ...g,
      winRate: g.totalBets > 0 ? (g.wins / g.totalBets) * 100 : 0,
      roi: g.totalStaked > 0 ? (g.netProfit / g.totalStaked) * 100 : 0
    }));
    
    // Sort by total bets descending
    groupStats.sort((a, b) => b.totalBets - a.totalBets);
    
    return NextResponse.json({
      groupBy,
      stats: groupStats,
      summary: {
        bestCategory: groupStats.reduce((best, current) => 
          current.winRate > (best?.winRate || 0) ? current : best, groupStats[0]
        ),
        worstCategory: groupStats.reduce((worst, current) => 
          current.winRate < (worst?.winRate || 100) ? current : worst, groupStats[0]
        ),
        mostProfitable: groupStats.reduce((best, current) => 
          current.netProfit > (best?.netProfit || -Infinity) ? current : best, groupStats[0]
        )
      }
    });
    
  } catch (error) {
    logger.error("Failed to calculate prediction statistics:", error);
    return NextResponse.json(
      { error: "Failed to calculate statistics" },
      { status: 500 }
    );
  }
});