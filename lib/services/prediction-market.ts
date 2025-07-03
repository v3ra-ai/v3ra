import { prisma } from "@/lib/db/client";
import { Decimal } from "@prisma/client/runtime/library";
import { V3RAPointsService } from "./v3ra-points";

export class PredictionMarketService {
  /**
   * Create a new prediction market
   */
  static async createMarket(
    predictionId: string,
    creatorId: string,
    initialProbability: number
  ) {
    // Check if market already exists
    const existing = await prisma.predictionMarket.findUnique({
      where: { predictionId },
    });

    if (existing) return existing;

    // Create the market
    const market = await prisma.predictionMarket.create({
      data: {
        predictionId,
        creatorId,
        initialProbability: new Decimal(initialProbability / 100),
        currentProbability: new Decimal(initialProbability / 100),
      },
    });

    // Award creator bonus
    await V3RAPointsService.awardPoints(
      creatorId,
      50,
      "MARKET_CREATE",
      "Created a new prediction market"
    );

    return market;
  }

  /**
   * Stake points to activate a market
   */
  static async stakeToMarket(predictionId: string, userId: string, amount: number) {
    const market = await prisma.predictionMarket.findUnique({
      where: { predictionId },
    });

    if (!market) throw new Error("Market not found");
    if (market.status !== "PENDING") throw new Error("Market already active");

    // Deduct points from user
    await V3RAPointsService.deductPoints(userId, amount);

    // Record stake
    await prisma.marketStake.create({
      data: {
        marketId: market.id,
        userId,
        amount: new Decimal(amount),
      },
    });

    // Update market stake total
    const newStake = market.currentStake.plus(amount);
    const updated = await prisma.predictionMarket.update({
      where: { id: market.id },
      data: {
        currentStake: newStake,
        status: newStake.gte(market.activationThreshold) ? "ACTIVE" : "PENDING",
        activatedAt: newStake.gte(market.activationThreshold) ? new Date() : null,
      },
    });

    return updated;
  }

  /**
   * Calculate odds using bonding curve
   * Uses a simple constant product AMM formula: x * y = k
   */
  static calculateOdds(yesPool: Decimal, noPool: Decimal, betAmount: number, position: "YES" | "NO") {
    const k = yesPool.mul(noPool); // Constant product
    
    if (position === "YES") {
      const newYesPool = yesPool.plus(betAmount);
      const newNoPool = k.div(newYesPool);
      const tokensOut = noPool.minus(newNoPool);
      const odds = new Decimal(betAmount).div(tokensOut);
      return {
        odds: odds.toNumber(),
        probability: newYesPool.div(newYesPool.plus(newNoPool)).mul(100).toNumber(),
        payout: tokensOut.toNumber(),
      };
    } else {
      const newNoPool = noPool.plus(betAmount);
      const newYesPool = k.div(newNoPool);
      const tokensOut = yesPool.minus(newYesPool);
      const odds = new Decimal(betAmount).div(tokensOut);
      return {
        odds: odds.toNumber(),
        probability: newYesPool.div(newYesPool.plus(newNoPool)).mul(100).toNumber(),
        payout: tokensOut.toNumber(),
      };
    }
  }

  /**
   * Place a bet on a market
   */
  static async placeBet(
    predictionId: string,
    userId: string,
    position: "YES" | "NO",
    amount: number
  ) {
    const market = await prisma.predictionMarket.findUnique({
      where: { predictionId },
    });

    if (!market) throw new Error("Market not found");
    if (market.status !== "ACTIVE") throw new Error("Market not active");

    // Initialize pools if empty
    let yesPool = market.yesPool;
    let noPool = market.noPool;
    
    if (yesPool.equals(0) && noPool.equals(0)) {
      // Initialize with liquidity based on probability
      const prob = market.initialProbability.toNumber();
      yesPool = new Decimal(1000 * prob);
      noPool = new Decimal(1000 * (1 - prob));
    }

    // Calculate odds
    const { odds, probability, payout } = this.calculateOdds(yesPool, noPool, amount, position);

    // Deduct points from user
    await V3RAPointsService.deductPoints(userId, amount);

    // Create bet record
    const bet = await prisma.marketBet.create({
      data: {
        marketId: market.id,
        userId,
        position: position as any,
        amount: new Decimal(amount),
        odds: new Decimal(odds),
        potentialReturn: new Decimal(payout),
      },
    });

    // Update market pools
    await prisma.predictionMarket.update({
      where: { id: market.id },
      data: {
        yesPool: position === "YES" ? yesPool.plus(amount) : yesPool,
        noPool: position === "NO" ? noPool.plus(amount) : noPool,
        currentProbability: new Decimal(probability / 100),
      },
    });

    return bet;
  }

  /**
   * Get market details with current odds
   */
  static async getMarketDetails(predictionId: string) {
    const market = await prisma.predictionMarket.findUnique({
      where: { predictionId },
      include: {
        prediction: true,
        bets: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        stakes: true,
      },
    });

    if (!market) return null;

    // Calculate current odds for both sides
    let yesPool = market.yesPool;
    let noPool = market.noPool;
    
    if (yesPool.equals(0) && noPool.equals(0)) {
      const prob = market.initialProbability.toNumber();
      yesPool = new Decimal(1000 * prob);
      noPool = new Decimal(1000 * (1 - prob));
    }

    const yesOdds = this.calculateOdds(yesPool, noPool, 100, "YES");
    const noOdds = this.calculateOdds(yesPool, noPool, 100, "NO");

    return {
      ...market,
      currentOdds: {
        yes: yesOdds.odds,
        no: noOdds.odds,
      },
      volume: market.yesPool.plus(market.noPool).toNumber(),
      participants: new Set(market.bets.map(b => b.userId)).size,
    };
  }

  /**
   * Resolve a market and distribute winnings
   */
  static async resolveMarket(marketId: string, winningOutcome: "YES" | "NO") {
    const market = await prisma.predictionMarket.findUnique({
      where: { id: marketId },
      include: { bets: true },
    });

    if (!market) throw new Error("Market not found");
    if (market.status !== "ACTIVE") throw new Error("Market not active");

    // Calculate total pool
    const totalPool = market.yesPool.plus(market.noPool);
    const winningBets = market.bets.filter(b => b.position === winningOutcome);

    // Distribute winnings proportionally
    for (const bet of winningBets) {
      const winnings = bet.potentialReturn.toNumber();
      
      await V3RAPointsService.awardPoints(
        bet.userId,
        winnings,
        "BET_WIN",
        `Won bet on prediction market`
      );

      await prisma.marketBet.update({
        where: { id: bet.id },
        data: {
          status: "WON",
          settledAt: new Date(),
          payout: new Decimal(winnings),
        },
      });
    }

    // Mark losing bets
    const losingBets = market.bets.filter(b => b.position !== winningOutcome);
    for (const bet of losingBets) {
      await prisma.marketBet.update({
        where: { id: bet.id },
        data: {
          status: "LOST",
          settledAt: new Date(),
          payout: new Decimal(0),
        },
      });
    }

    // Update market status
    await prisma.predictionMarket.update({
      where: { id: marketId },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
        winningOutcome,
      },
    });

    return true;
  }
}