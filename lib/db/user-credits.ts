import { PrismaClient } from '@prisma/client';
import { addDays, isAfter } from 'date-fns';

const prisma = new PrismaClient();

export async function resetFreeCredits(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { freeCredits: true, lastResetDate: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const now = new Date();
  const nextReset = addDays(user.lastResetDate, 1);

  if (isAfter(now, nextReset)) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        freeCredits: 10,
        lastResetDate: now,
      },
    });
    return { freeCredits: 10, reset: true };
  }

  return { freeCredits: user.freeCredits, reset: false };
}