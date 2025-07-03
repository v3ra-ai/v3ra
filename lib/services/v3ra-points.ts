import { prisma } from "@/lib/db/client";
import { Decimal } from "@prisma/client/runtime/library";

export class V3RAPointsService {
  /**
   * Get or create user points balance
   */
  static async getUserPoints(userId: string) {
    let userPoints = await prisma.userPoints.findUnique({
      where: { userId },
    });

    // Create account with initial grant if doesn't exist
    if (!userPoints) {
      userPoints = await prisma.userPoints.create({
        data: { userId },
      });

      // Record initial grant transaction
      await this.recordTransaction(
        userId,
        "INITIAL_GRANT",
        new Decimal(1000),
        new Decimal(1000),
        "Welcome to V3RA! Here's 1000 points to get started"
      );
    }

    return userPoints;
  }

  /**
   * Record a points transaction
   */
  static async recordTransaction(
    userId: string,
    type: string,
    amount: Decimal,
    balance: Decimal,
    description?: string,
    metadata?: any
  ) {
    return prisma.pointsTransaction.create({
      data: {
        userId,
        type: type as any,
        amount,
        balance,
        description,
        metadata,
      },
    });
  }

  /**
   * Transfer points for betting
   */
  static async deductPoints(userId: string, amount: number) {
    const userPoints = await this.getUserPoints(userId);
    
    if (userPoints.balance.lessThan(amount)) {
      throw new Error("Insufficient V3RA points");
    }

    const newBalance = userPoints.balance.minus(amount);
    
    const updated = await prisma.userPoints.update({
      where: { userId },
      data: {
        balance: newBalance,
        totalSpent: userPoints.totalSpent.plus(amount),
      },
    });

    return updated;
  }

  /**
   * Award points for winning
   */
  static async awardPoints(
    userId: string,
    amount: number,
    type: string,
    description: string
  ) {
    const userPoints = await this.getUserPoints(userId);
    const newBalance = userPoints.balance.plus(amount);

    const updated = await prisma.userPoints.update({
      where: { userId },
      data: {
        balance: newBalance,
        totalEarned: userPoints.totalEarned.plus(amount),
      },
    });

    await this.recordTransaction(
      userId,
      type as any,
      new Decimal(amount),
      newBalance,
      description
    );

    return updated;
  }

  /**
   * Get user's transaction history
   */
  static async getTransactionHistory(userId: string, limit = 20) {
    return prisma.pointsTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  /**
   * Check daily bonus eligibility
   */
  static async checkDailyBonus(userId: string): Promise<boolean> {
    const lastBonus = await prisma.pointsTransaction.findFirst({
      where: {
        userId,
        type: "DAILY_BONUS",
      },
      orderBy: { createdAt: "desc" },
    });

    if (!lastBonus) return true;

    const hoursSinceLastBonus =
      (Date.now() - lastBonus.createdAt.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceLastBonus >= 24;
  }

  /**
   * Claim daily bonus
   */
  static async claimDailyBonus(userId: string) {
    const eligible = await this.checkDailyBonus(userId);
    if (!eligible) {
      throw new Error("Daily bonus already claimed");
    }

    const userPoints = await this.getUserPoints(userId);
    const bonusAmount = 100; // Base bonus
    const streakBonus = Math.min(userPoints.streak * 10, 100); // Up to 100 extra
    const totalBonus = bonusAmount + streakBonus;

    await this.awardPoints(
      userId,
      totalBonus,
      "DAILY_BONUS",
      `Daily bonus claimed! Streak: ${userPoints.streak + 1}`
    );

    // Update streak
    await prisma.userPoints.update({
      where: { userId },
      data: { streak: userPoints.streak + 1 },
    });

    return totalBonus;
  }
}