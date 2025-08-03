import { prisma } from "@/lib/db/client";
import { Decimal } from "@prisma/client/runtime/library";
import { Prisma, PointsTransactionType } from "@prisma/client";

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
      // Use transaction to ensure atomicity
      return await prisma.$transaction(async (tx) => {
        // First, verify that the user exists
        const user = await tx.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          throw new Error(`User with ID ${userId} does not exist`);
        }

        // Create user points with initial balance
        const newUserPoints = await tx.userPoints.create({
          data: { 
            userId,
            balance: new Decimal(1000) // Initial grant
          },
        });

        // Record initial grant transaction
        await tx.pointsTransaction.create({
          data: {
            userId,
            type: PointsTransactionType.INITIAL_GRANT,
            amount: new Decimal(1000),
            balance: new Decimal(1000),
            description: "Welcome to V3RA! Here's 1000 points to get started"
          }
        });

        return newUserPoints;
      });
    }

    return userPoints;
  }

  /**
   * Transfer points for betting - FIXED with proper transaction
   */
  static async deductPoints(userId: string, amount: number, description?: string) {
    if (amount <= 0) {
      throw new Error("Amount must be positive");
    }

    return await prisma.$transaction(async (tx) => {
      // Use SELECT FOR UPDATE to lock the row
      const userPoints = await tx.$queryRaw<Array<{
        userId: string;
        balance: Decimal;
        totalSpent: Decimal;
        version: number;
      }>>`
        SELECT "userId", balance, "totalSpent", version
        FROM "UserPoints"
        WHERE "userId" = ${userId}
        FOR UPDATE
      `;

      if (!userPoints.length) {
        throw new Error("User points not found");
      }

      const currentPoints = userPoints[0];
      
      if (currentPoints.balance.lessThan(amount)) {
        throw new Error("Insufficient V3RA points");
      }

      const newBalance = currentPoints.balance.minus(amount);
      const newTotalSpent = currentPoints.totalSpent.plus(amount);
      
      // Update balance atomically
      const updated = await tx.userPoints.update({
        where: { 
          userId,
          version: currentPoints.version // Optimistic locking
        },
        data: {
          balance: newBalance,
          totalSpent: newTotalSpent,
          version: { increment: 1 }
        },
      });

      // Record transaction
      await tx.pointsTransaction.create({
        data: {
          userId,
          type: PointsTransactionType.BET_PLACED,
          amount: new Decimal(-amount), // Negative for deductions
          balance: newBalance,
          description: description || "Points deducted",
        },
      });

      return updated;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    });
  }

  /**
   * Award points for winning - FIXED with proper transaction
   */
  static async awardPoints(
    userId: string,
    amount: number,
    type: string,
    description: string
  ) {
    if (amount <= 0) {
      throw new Error("Amount must be positive");
    }

    return await prisma.$transaction(async (tx) => {
      // Use SELECT FOR UPDATE to lock the row
      const userPoints = await tx.$queryRaw<Array<{
        userId: string;
        balance: Decimal;
        totalEarned: Decimal;
        version: number;
      }>>`
        SELECT "userId", balance, "totalEarned", version
        FROM "UserPoints"
        WHERE "userId" = ${userId}
        FOR UPDATE
      `;

      if (!userPoints.length) {
        throw new Error("User points not found");
      }

      const currentPoints = userPoints[0];
      const newBalance = currentPoints.balance.plus(amount);
      const newTotalEarned = currentPoints.totalEarned.plus(amount);

      // Update balance atomically
      const updated = await tx.userPoints.update({
        where: { 
          userId,
          version: currentPoints.version // Optimistic locking
        },
        data: {
          balance: newBalance,
          totalEarned: newTotalEarned,
          version: { increment: 1 }
        },
      });

      // Record transaction
      await tx.pointsTransaction.create({
        data: {
          userId,
          type: type as PointsTransactionType,
          amount: new Decimal(amount),
          balance: newBalance,
          description
        },
      });

      return updated;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    });
  }

  /**
   * Atomic balance update using single UPDATE query
   * More efficient for high-contention scenarios
   */
  static async updateBalanceAtomic(
    userId: string, 
    amount: number, 
    type: 'deduct' | 'award',
    description: string
  ) {
    const amountDecimal = new Decimal(amount);
    
    if (type === 'deduct') {
      // Use UPDATE ... WHERE balance >= amount for atomic deduction
      const result = await prisma.$queryRaw<Array<{
        userId: string;
        balance: Decimal;
        totalSpent: Decimal;
        totalEarned: Decimal;
      }>>`
        UPDATE "UserPoints"
        SET 
          balance = balance - ${amountDecimal},
          "totalSpent" = "totalSpent" + ${amountDecimal},
          version = version + 1,
          "updatedAt" = CURRENT_TIMESTAMP
        WHERE 
          "userId" = ${userId} 
          AND balance >= ${amountDecimal}
        RETURNING "userId", balance, "totalSpent", "totalEarned"
      `;

      if (!result.length) {
        throw new Error("Insufficient balance or user not found");
      }

      // Record transaction
      await prisma.pointsTransaction.create({
        data: {
          userId,
          type: PointsTransactionType.BET_PLACED,
          amount: new Decimal(-amount),
          balance: result[0].balance,
          description
        }
      });

      return result[0];
    } else {
      // Award points atomically
      const result = await prisma.$queryRaw<Array<{
        userId: string;
        balance: Decimal;
        totalSpent: Decimal;
        totalEarned: Decimal;
      }>>`
        UPDATE "UserPoints"
        SET 
          balance = balance + ${amountDecimal},
          "totalEarned" = "totalEarned" + ${amountDecimal},
          version = version + 1,
          "updatedAt" = CURRENT_TIMESTAMP
        WHERE "userId" = ${userId}
        RETURNING "userId", balance, "totalSpent", "totalEarned"
      `;

      if (!result.length) {
        throw new Error("User not found");
      }

      // Record transaction
      await prisma.pointsTransaction.create({
        data: {
          userId,
          type: type === 'award' ? PointsTransactionType.BET_WIN : PointsTransactionType.BET_PLACED,
          amount: amountDecimal,
          balance: result[0].balance,
          description
        }
      });

      return result[0];
    }
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
        type: PointsTransactionType.DAILY_BONUS,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!lastBonus) return true;

    const hoursSinceLastBonus =
      (Date.now() - lastBonus.createdAt.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceLastBonus >= 24;
  }

  /**
   * Claim daily bonus - Already properly transactional
   */
  static async claimDailyBonus(userId: string) {
    const eligible = await this.checkDailyBonus(userId);
    if (!eligible) {
      throw new Error("Daily bonus already claimed");
    }

    return await prisma.$transaction(async (tx) => {
      // Lock the row for update
      const userPoints = await tx.$queryRaw<Array<{
        userId: string;
        balance: Decimal;
        totalEarned: Decimal;
        streak: number;
        version: number;
      }>>`
        SELECT "userId", balance, "totalEarned", streak, version
        FROM "UserPoints"
        WHERE "userId" = ${userId}
        FOR UPDATE
      `;

      if (!userPoints.length) {
        throw new Error("User points not found");
      }

      const currentPoints = userPoints[0];
      const bonusAmount = 100; // Base bonus
      const streakBonus = Math.min(currentPoints.streak * 10, 100); // Up to 100 extra
      const totalBonus = bonusAmount + streakBonus;
      const newBalance = currentPoints.balance.plus(totalBonus);
      const newStreak = currentPoints.streak + 1;

      // Update points and streak atomically
      const updated = await tx.userPoints.update({
        where: { 
          userId,
          version: currentPoints.version
        },
        data: {
          balance: newBalance,
          totalEarned: currentPoints.totalEarned.plus(totalBonus),
          streak: newStreak,
          version: { increment: 1 }
        },
      });

      // Record transaction
      await tx.pointsTransaction.create({
        data: {
          userId,
          type: PointsTransactionType.DAILY_BONUS,
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
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    });
  }
}