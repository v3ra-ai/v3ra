// lib/db/voteSessions.ts
import { prisma } from '@/lib/db/client';
import { updateValidatorMetrics } from './validators';

// Example function (adjust based on your actual usage)
export async function recordVoteSession(sessionId: string) {
  try {
    const session = await prisma.voteSession.findUnique({
      where: { id: sessionId },
      include: { validatorResponses: true }
    });
    if (!session) throw new Error('Session not found');

    const consensusValue = session.consensusValue;
    if (consensusValue === null) return; // No consensus yet

    for (const response of session.validatorResponses) {
      await updateValidatorMetrics(
        response.validatorId,
        response.vote === 'YES',
        response.vote === (consensusValue ? 'YES' : 'NO')
      );
    }
  } catch (error) {
    console.error('Error recording vote session:', error);
    throw error;
  }
}