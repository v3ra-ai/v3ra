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
      // Reset credits directly
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { 
          freeCredits: 10,
          lastResetDate: now 
        },
        select: { freeCredits: true }
      });
      
      return { freeCredits: updatedUser.freeCredits, reset: true };
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