import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { TruthMarket } from "@/lib/truth-market";
import { validatorRegistry } from "@/lib/validators/registry";
import { logger } from "@/lib/utils/logger";
import { rateLimitNormal } from "@/lib/middleware/rate-limit";

// Prediction types for better engagement
type PredictionType = 'binary_event' | 'statistical' | 'trend' | 'comparison';

interface PredictionTemplate {
  type: PredictionType;
  statement: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  resolutionTime: number; // hours
  resolutionSource?: string;
  verificationMethod?: string;
}

// Better prediction templates focused on verifiable outcomes
const PREDICTION_TEMPLATES: PredictionTemplate[] = [
  // Binary Events (clear yes/no outcomes)
  {
    type: 'binary_event',
    statement: "A major tech company (FAANG) will announce a new AI product or feature this week",
    category: "technology",
    difficulty: 'medium',
    resolutionTime: 168, // 1 week
    resolutionSource: "tech news sites",
    verificationMethod: "news_api"
  },
  {
    type: 'binary_event',
    statement: "Bitcoin will reach ${price} within the next 7 days",
    category: "finance",
    difficulty: 'medium',
    resolutionTime: 168,
    resolutionSource: "crypto exchanges",
    verificationMethod: "price_api"
  },
  {
    type: 'binary_event',
    statement: "A new COVID variant will be designated by WHO this week",
    category: "health",
    difficulty: 'hard',
    resolutionTime: 168,
    resolutionSource: "WHO announcements",
    verificationMethod: "official_api"
  },
  
  // Statistical Predictions (numerical outcomes)
  {
    type: 'statistical',
    statement: "The S&P 500 will close higher on Friday than on Monday",
    category: "finance",
    difficulty: 'easy',
    resolutionTime: 120, // 5 days
    resolutionSource: "market data",
    verificationMethod: "market_api"
  },
  {
    type: 'statistical',
    statement: "US gas prices will drop below $3.50/gallon national average this week",
    category: "economy",
    difficulty: 'medium',
    resolutionTime: 168,
    resolutionSource: "AAA gas prices",
    verificationMethod: "price_api"
  },
  {
    type: 'statistical',
    statement: "Total cryptocurrency market cap will increase by >5% in the next 3 days",
    category: "finance",
    difficulty: 'hard',
    resolutionTime: 72,
    resolutionSource: "CoinMarketCap",
    verificationMethod: "crypto_api"
  },
  
  // Trend Predictions (relative comparisons)
  {
    type: 'trend',
    statement: "AI-related news articles will outnumber crypto articles 2:1 this week",
    category: "technology",
    difficulty: 'medium',
    resolutionTime: 168,
    resolutionSource: "news aggregators",
    verificationMethod: "news_analysis"
  },
  {
    type: 'trend',
    statement: "'Climate change' mentions in major news will increase >20% vs last week",
    category: "climate",
    difficulty: 'medium',
    resolutionTime: 168,
    resolutionSource: "news analysis",
    verificationMethod: "trend_analysis"
  },
  
  // Comparison Predictions
  {
    type: 'comparison',
    statement: "Tesla stock will outperform the S&P 500 this week",
    category: "finance",
    difficulty: 'easy',
    resolutionTime: 168,
    resolutionSource: "market data",
    verificationMethod: "market_api"
  },
  {
    type: 'comparison',
    statement: "More people will search for 'AI' than 'Taylor Swift' on Google this week",
    category: "culture",
    difficulty: 'hard',
    resolutionTime: 168,
    resolutionSource: "Google Trends",
    verificationMethod: "trends_api"
  }
];

// Dynamic values for template placeholders
const DYNAMIC_VALUES = {
  price: () => {
    // Get current Bitcoin price and generate realistic targets
    const basePrice = 42000; // This would come from an API
    const variations = [-2000, -1000, 1000, 2000, 3000];
    const target = basePrice + variations[Math.floor(Math.random() * variations.length)];
    return Math.round(target / 1000) * 1000; // Round to nearest 1000
  }
};

function generateDailyPredictions(): PredictionTemplate[] {
  const predictions: PredictionTemplate[] = [];
  const usedIndices = new Set<number>();
  
  // Ensure variety: 1 easy, 1 medium, 1 hard
  const difficulties = ['easy', 'medium', 'hard'] as const;
  
  for (const difficulty of difficulties) {
    const availableTemplates = PREDICTION_TEMPLATES
      .map((t, i) => ({ template: t, index: i }))
      .filter(({ template, index }) => 
        template.difficulty === difficulty && !usedIndices.has(index)
      );
    
    if (availableTemplates.length > 0) {
      const selected = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
      usedIndices.add(selected.index);
      
      // Process dynamic values in statement
      let statement = selected.template.statement;
      statement = statement.replace(/\${(\w+)}/g, (match, key) => {
        const value = DYNAMIC_VALUES[key as keyof typeof DYNAMIC_VALUES]?.();
        return value ? String(value) : match;
      });
      
      predictions.push({
        ...selected.template,
        statement
      });
    }
  }
  
  // If we couldn't get exactly one of each difficulty, fill remaining slots
  while (predictions.length < 3) {
    const remaining = PREDICTION_TEMPLATES
      .map((t, i) => ({ template: t, index: i }))
      .filter(({ index }) => !usedIndices.has(index));
    
    if (remaining.length === 0) break;
    
    const selected = remaining[Math.floor(Math.random() * remaining.length)];
    usedIndices.add(selected.index);
    predictions.push(selected.template);
  }
  
  return predictions;
}

export const GET = rateLimitNormal(async (request: NextRequest) => {
  try {
    // Get user ID from session if available
    const userId = request.headers.get('x-user-id');
    
    // Check if user already has active predictions for today
    if (userId) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const existingPredictions = await prisma.prediction.findMany({
        where: {
          createdAt: { gte: today },
          market: {
            bets: {
              some: { userId }
            }
          }
        },
        include: {
          market: true
        }
      });
      
      if (existingPredictions.length >= 3) {
        // User already completed today's predictions
        return NextResponse.json({
          headlines: existingPredictions.map(p => ({
            id: p.id,
            statement: p.queryText,
            category: p.category || 'general',
            aiConsensus: p.market?.currentProbability || 50,
            expiresAt: p.resolutionDate || new Date(Date.now() + 24 * 60 * 60 * 1000),
            difficulty: (p.metadata as any)?.difficulty || 'medium',
            resolutionTime: (p.metadata as any)?.resolutionTime || 168
          })),
          alreadyCompleted: true
        });
      }
    }
    
    // Generate new predictions
    const dailyPredictions = generateDailyPredictions();
    
    // Get AI consensus for each prediction
    const validators = await validatorRegistry.getActiveValidators();
    const limitedValidators = validators.slice(0, 3);
    
    const predictionsWithData = await Promise.all(
      dailyPredictions.map(async (template, index) => {
        // For development, just return mock data without DB
        if (process.env.NODE_ENV === 'development') {
          const mockId = `mock-${Date.now()}-${index}`;
          let aiConsensus = template.difficulty === 'easy' ? 65 : 
                           template.difficulty === 'hard' ? 35 : 50;
          
          return {
            id: mockId,
            statement: template.statement,
            category: template.category,
            aiConsensus,
            difficulty: template.difficulty,
            resolutionTime: template.resolutionTime,
            expiresAt: new Date(Date.now() + template.resolutionTime * 60 * 60 * 1000)
          };
        }
        
        try {
          // Create prediction in database
          const prediction = await prisma.prediction.create({
            data: {
              queryText: template.statement,
              category: template.category,
              resolutionStatus: 'pending',
              metadata: {
                type: template.type,
                difficulty: template.difficulty,
                resolutionTime: template.resolutionTime,
                resolutionSource: template.resolutionSource,
                verificationMethod: template.verificationMethod,
                source: 'daily_headlines'
              }
            }
          });
          
          // Get AI consensus
          let aiConsensus = 50;
          try {
            const { consensus } = await TruthMarket.processQuery(
              template.statement,
              limitedValidators
            );
            aiConsensus = consensus.probability;
          } catch (error) {
            logger.error("Failed to get AI consensus:", error);
            // Use difficulty-based defaults
            aiConsensus = template.difficulty === 'easy' ? 65 : 
                         template.difficulty === 'hard' ? 35 : 50;
          }
          
          // Create prediction market
          await prisma.predictionMarket.create({
            data: {
              predictionId: prediction.id,
              creatorId: userId || 'system',
              initialProbability: aiConsensus,
              currentProbability: aiConsensus,
              yesPool: 100,
              noPool: 100,
              totalStake: 200
            }
          });
          
          return {
            id: prediction.id,
            statement: template.statement,
            category: template.category,
            aiConsensus,
            difficulty: template.difficulty,
            resolutionTime: template.resolutionTime,
            expiresAt: new Date(Date.now() + template.resolutionTime * 60 * 60 * 1000)
          };
        } catch (error) {
          logger.error("Failed to create prediction:", error);
          // Return mock data on error
          const mockId = `mock-${Date.now()}-${index}`;
          return {
            id: mockId,
            statement: template.statement,
            category: template.category,
            aiConsensus: 50,
            difficulty: template.difficulty,
            resolutionTime: template.resolutionTime,
            expiresAt: new Date(Date.now() + template.resolutionTime * 60 * 60 * 1000)
          };
        }
      })
    );
    
    return NextResponse.json({
      headlines: predictionsWithData,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error("Daily headlines error:", error);
    return NextResponse.json(
      { error: "Failed to load daily predictions" },
      { status: 500 }
    );
  }
});

export const POST = rateLimitNormal(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { predictions, userId } = body;
    
    logger.info("Processing daily predictions", { userId, predictionsCount: predictions?.length });
    
    if (!userId || !predictions || predictions.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Process each prediction bet
    const betResults = await Promise.all(
      predictions.map(async ({ predictionId, vote }: { predictionId: string, vote: 'YES' | 'NO' }) => {
        try {
          // For development with mock IDs, just return success
          if (process.env.NODE_ENV === 'development' && predictionId.startsWith('mock-')) {
            return { success: true, betId: `bet-${predictionId}` };
          }
          
          // Check if prediction exists and is active
          const prediction = await prisma.prediction.findUnique({
            where: { id: predictionId },
            include: { market: true }
          });
          
          if (!prediction || !prediction.market) {
            throw new Error("Invalid prediction");
          }
          
          // Check if user already bet on this prediction
          const existingBet = await prisma.marketBet.findFirst({
            where: {
              userId,
              marketId: prediction.market.id
            }
          });
          
          if (existingBet) {
            throw new Error("Already placed bet on this prediction");
          }
          
          // Fixed bet amount of 10 V3RA
          const betAmount = 10;
          
          // Get or create user points
          let userPoints = await prisma.userPoints.findUnique({
            where: { userId }
          });
          
          if (!userPoints) {
            // Check if user exists first
            const user = await prisma.user.findUnique({
              where: { id: userId }
            });
            
            if (!user) {
              throw new Error("User not found");
            }
            
            // Create user points if not exists (for new users)
            userPoints = await prisma.userPoints.create({
              data: {
                userId,
                balance: 1000 // Starting balance
              }
            });
          }
          
          if (Number(userPoints.balance) < betAmount) {
            throw new Error("Insufficient balance");
          }
          
          if (!prediction.market) {
            throw new Error("Market not found for prediction");
          }
          
          // Create bet and update user points in transaction
          const result = await prisma.$transaction(async (tx) => {
            // Create bet
            const bet = await tx.marketBet.create({
              data: {
                userId,
                marketId: prediction.market!.id,
                position: vote,
                amount: betAmount,
                odds: 2.0,
                potentialReturn: vote === 'YES' 
                  ? betAmount * (100 / Number(prediction.market!.currentProbability))
                  : betAmount * (100 / (100 - Number(prediction.market!.currentProbability)))
              }
            });
            
            // Update user points
            await tx.userPoints.update({
              where: { userId },
              data: { balance: { decrement: betAmount } }
            });
            
            // Create transaction record
            await tx.pointsTransaction.create({
              data: {
                userId,
                amount: -betAmount,
                balance: Number(userPoints.balance) - betAmount,
                type: 'BET_PLACED',
                description: `Bet on prediction: ${prediction.queryText.substring(0, 50)}...`,
                metadata: {
                  predictionId: prediction.id,
                  betId: bet.id,
                  position: vote
                }
              }
            });
            
            // Update market pools
            if (vote === 'YES') {
              await tx.predictionMarket.update({
                where: { id: prediction.market!.id },
                data: {
                  yesPool: { increment: betAmount },
                  totalStake: { increment: betAmount }
                }
              });
            } else {
              await tx.predictionMarket.update({
                where: { id: prediction.market!.id },
                data: {
                  noPool: { increment: betAmount },
                  totalStake: { increment: betAmount }
                }
              });
            }
            
            return bet;
          });
          
          return { success: true, betId: result.id };
        } catch (error) {
          logger.error("Failed to process bet:", error);
          return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      })
    );
    
    // Award completion bonus if all 3 predictions were bet on
    const successfulBets = betResults.filter(r => r.success).length;
    let bonusAwarded = 0;
    
    if (successfulBets === 3) {
      // For development, just return mock bonus
      if (process.env.NODE_ENV === 'development' && predictions.some((p: any) => p.predictionId.startsWith('mock-'))) {
        bonusAwarded = 50;
      } else {
        try {
          await prisma.$transaction(async (tx) => {
            // Award 50 V3RA bonus
            bonusAwarded = 50;
            
            await tx.userPoints.update({
              where: { userId },
              data: { balance: { increment: bonusAwarded } }
            });
            
            // Get current balance for transaction record
            const currentUserPoints = await tx.userPoints.findUnique({
              where: { userId }
            });
            
            await tx.pointsTransaction.create({
              data: {
                userId,
                amount: bonusAwarded,
                balance: Number(currentUserPoints?.balance || 0) + bonusAwarded,
                type: 'DAILY_BONUS',
                description: 'Daily predictions completion bonus',
                metadata: {
                  bonusType: 'headlines_completion',
                  predictionsCompleted: successfulBets
                }
              }
            });
          });
        } catch (error) {
          logger.error("Failed to award bonus:", error);
        }
      }
    }
    
    // Get updated balance
    let newBalance = 1000; // Default for dev
    
    if (process.env.NODE_ENV === 'development') {
      // Return mock balance for development
      newBalance = 1000 + bonusAwarded - (successfulBets * 10);
    } else {
      const updatedUser = await prisma.userPoints.findUnique({
        where: { userId }
      });
      newBalance = Number(updatedUser?.balance || 0);
    }
    
    logger.info("Predictions processed successfully", { 
      userId, 
      betsPlaced: successfulBets, 
      bonusAwarded,
      newBalance
    });
    
    return NextResponse.json({
      success: true,
      betsPlaced: successfulBets,
      bonusAwarded,
      newBalance,
      results: betResults
    });
    
  } catch (error) {
    logger.error("Submit predictions error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit predictions" },
      { status: 500 }
    );
  }
});