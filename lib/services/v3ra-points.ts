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
      // First, verify that the user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error(`User with ID ${userId} does not exist`);
      }

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

    return await prisma.$transaction(async (tx) => {
      const userPoints = await tx.userPoints.findUnique({
        where: { userId },
      });

      if (!userPoints) {
        throw new Error("User points not found");
      }

      const bonusAmount = 100; // Base bonus
      const streakBonus = Math.min(userPoints.streak * 10, 100); // Up to 100 extra
      const totalBonus = bonusAmount + streakBonus;
      const newBalance = userPoints.balance.plus(totalBonus);
      const newStreak = userPoints.streak + 1;

      // Update points and streak atomically
      const updated = await tx.userPoints.update({
        where: { 
          userId,
          version: userPoints.version
        },
        data: {
          balance: newBalance,
          totalEarned: userPoints.totalEarned.plus(totalBonus),
          streak: newStreak,
          version: { increment: 1 }
        },
      });

      // Record transaction
      await tx.pointsTransaction.create({
        data: {
          userId,
          type: "DAILY_BONUS",
          amount: new Decimal(totalBonus),
          balance: newBalance,
          description: `Daily bonus claimed! Streak: ${newStreak}`,
          metadata: {
            bonusAmount,
            streakBonus,
            streak: newStreak,
          },
        },
      });

      return {
        awarded: totalBonus,
        newBalance: updated.balance,
        streak: updated.streak,
      };
    });
  }
}