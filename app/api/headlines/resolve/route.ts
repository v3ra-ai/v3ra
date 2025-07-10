import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { logger } from "@/lib/utils/logger";

// This endpoint handles resolution of predictions
// In production, this would be called by a cron job or automated system

interface ResolutionData {
  predictionId: string;
  outcome: 'YES' | 'NO' | 'UNRESOLVED';
  evidence?: string;
  confidence?: number;
}

export async function POST(request: NextRequest) {
  try {
    // In production, verify this is called by authorized system
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.RESOLUTION_API_KEY}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const resolutions: ResolutionData[] = body.resolutions;
    
    if (!Array.isArray(resolutions)) {
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }
    
    const results = await Promise.all(
      resolutions.map(async (resolution) => {
        try {
          // Get prediction and market
          const prediction = await prisma.prediction.findUnique({
            where: { id: resolution.predictionId },
            include: {
              market: {
                include: {
                  bets: true
                }
              }
            }
          });
          
          if (!prediction || !prediction.market) {
            throw new Error("Prediction not found");
          }
          
          if (prediction.resolutionStatus !== 'pending') {
            throw new Error("Prediction already resolved");
          }
          
          // Process resolution in transaction
          const result = await prisma.$transaction(async (tx) => {
            // Update prediction status
            await tx.prediction.update({
              where: { id: prediction.id },
              data: {
                resolutionStatus: resolution.outcome === 'UNRESOLVED' ? 'pending' : 'resolved',
                resolutionDate: new Date(),
                metadata: {
                  ...(prediction.metadata as any || {}),
                  resolution: resolution.outcome,
                  resolutionEvidence: resolution.evidence,
                  resolutionConfidence: resolution.confidence
                }
              }
            });
            
            // Update market
            if (prediction.market) {
              await tx.predictionMarket.update({
                where: { id: prediction.market.id },
                data: {
                  isResolved: true,
                  finalOutcome: resolution.outcome,
                  resolvedAt: new Date()
                }
              });
            }
            
            // Process payouts for resolved predictions
            if (resolution.outcome !== 'UNRESOLVED' && prediction.market) {
              const winningBets = prediction.market.bets.filter(
                bet => bet.position === resolution.outcome
              );
              
              // Calculate and distribute winnings
              for (const bet of winningBets) {
                // Calculate payout based on amount and odds
                const totalPool = Number(prediction.market.yesPool) + Number(prediction.market.noPool);
                const winningPool = resolution.outcome === 'YES' 
                  ? Number(prediction.market.yesPool) 
                  : Number(prediction.market.noPool);
                
                // Payout = amount * (totalPool / winningPool)
                const payout = Math.floor(Number(bet.amount) * (totalPool / winningPool));
                
                // Update user balance
                const updatedUserPoints = await tx.userPoints.update({
                  where: { userId: bet.userId },
                  data: { 
                    balance: { increment: payout },
                    totalEarned: { increment: payout }
                  }
                });
                
                // Record transaction
                await tx.pointsTransaction.create({
                  data: {
                    userId: bet.userId,
                    amount: payout,
                    balance: updatedUserPoints.balance,
                    type: 'BET_WIN',
                    description: `Won prediction: ${prediction.queryText.substring(0, 50)}...`,
                    metadata: {
                      predictionId: prediction.id,
                      betId: bet.id,
                      position: bet.position,
                      stake: Number(bet.amount),
                      payout
                    }
                  }
                });
                
                // Update bet with payout info
                await tx.marketBet.update({
                  where: { id: bet.id },
                  data: {
                    status: 'WON',
                    payout,
                    settledAt: new Date()
                  }
                });
              }
              
              // Record losses for losing bets
              const losingBets = prediction.market.bets.filter(
                bet => bet.position !== resolution.outcome
              );
              
              for (const bet of losingBets) {
                await tx.marketBet.update({
                  where: { id: bet.id },
                  data: {
                    status: 'LOST',
                    payout: 0,
                    settledAt: new Date()
                  }
                });
                
                // Record loss transaction
                await tx.pointsTransaction.create({
                  data: {
                    userId: bet.userId,
                    amount: 0,
                    balance: await tx.userPoints.findUnique({ where: { userId: bet.userId } }).then(u => u?.balance || 0),
                    type: 'BET_LOSS',
                    description: `Lost prediction: ${prediction.queryText.substring(0, 50)}...`,
                    metadata: {
                      predictionId: prediction.id,
                      betId: bet.id,
                      position: bet.position,
                      stake: Number(bet.amount)
                    }
                  }
                });
              }
            }
            
            return {
              predictionId: prediction.id,
              resolved: true,
              outcome: resolution.outcome,
              payoutsProcessed: prediction.market?.bets.length || 0
            };
          });
          
          return { success: true, ...result };
        } catch (error) {
          logger.error(`Failed to resolve prediction ${resolution.predictionId}:`, error);
          return { 
            success: false, 
            predictionId: resolution.predictionId,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );
    
    const successCount = results.filter(r => r.success).length;
    
    return NextResponse.json({
      success: true,
      resolved: successCount,
      failed: results.length - successCount,
      results
    });
    
  } catch (error) {
    logger.error("Resolution endpoint error:", error);
    return NextResponse.json(
      { error: "Failed to process resolutions" },
      { status: 500 }
    );
  }
}

// Mock resolution endpoint for testing
export async function GET(_request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  
  try {
    // Get all pending predictions that should be resolved
    const pendingPredictions = await prisma.prediction.findMany({
      where: {
        resolutionStatus: 'pending',
        metadata: {
          path: ['source'],
          equals: 'daily_headlines'
        },
        resolutionDate: null,
        createdAt: {
          // Only predictions older than their resolution time
          lte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      include: {
        market: true
      }
    });
    
    // Mock resolutions for testing
    const mockResolutions: ResolutionData[] = pendingPredictions.map(p => ({
      predictionId: p.id,
      // Random outcome weighted by AI consensus
      outcome: Math.random() * 100 < (Number(p.market?.currentProbability) || 50) ? 'YES' : 'NO',
      evidence: "Mock resolution for testing",
      confidence: 80 + Math.random() * 20
    }));
    
    return NextResponse.json({
      pendingCount: pendingPredictions.length,
      mockResolutions
    });
  } catch (error) {
    logger.error("Mock resolution error:", error);
    return NextResponse.json(
      { error: "Failed to generate mock resolutions" },
      { status: 500 }
    );
  }
}