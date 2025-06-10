import { PrismaClient } from '@prisma/client';
import { addDays, isAfter } from 'date-fns';

const prisma = new PrismaClient();

export async function resetFreeCredits(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastResetDate: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const now = new Date();
  const nextReset = addDays(user.lastResetDate, 1);

  if (isAfter(now, nextReset)) {
    try {
      // Use secure function to reset credits
      const result = await prisma.$queryRaw<{ reset_free_credits: boolean }[]>`
        SELECT security.reset_free_credits(
          ${userId},
          10::integer,
          'Daily reset'
        ) as reset_free_credits;
      `;
      
      if (result[0].reset_free_credits) {
        // Also update the lastResetDate
        await prisma.user.update({
          where: { id: userId },
          data: { lastResetDate: now },
        });
        
        return { freeCredits: 10, reset: true };
      }
    } catch (error) {
      console.error('Error resetting free credits:', error);
      throw error;
    }
  }

  // Get current credits for return
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { freeCredits: true },
  });

  return { freeCredits: currentUser?.freeCredits ?? 0, reset: false };
}