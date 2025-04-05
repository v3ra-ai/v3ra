// lib/db/validators.ts
import { prisma } from '@/lib/db/client';
import { Validator } from '@prisma/client';
import { AIValidator } from '../validators/types';

export function dbValidatorToAIValidator(validator: Validator): AIValidator {
  return {
    id: validator.id,
    name: validator.profileName,
    provider: validator.provider,
    modelName: validator.modelName,
    description: validator.description || undefined,
    validatorType: validator.validatorType || undefined,
    active: validator.active,
    keyId: undefined,
    validate: async () => ({ vote: false, confidence: 0, rationale: 'Not implemented' })
  };
}

export async function updateValidatorMetrics(
  validatorId: string,
  vote: boolean,
  matchedConsensus: boolean
): Promise<void> {
  const validator = await prisma.validator.findUnique({ where: { id: validatorId } });
  if (!validator) {
    throw new Error(`Validator with ID ${validatorId} not found`);
  }

  const newTotalVotes = validator.totalVotes + 1;
  const newCorrectVotes = matchedConsensus ? validator.correctVotes + 1 : validator.correctVotes;
  const newReliability = newCorrectVotes / newTotalVotes;

  await prisma.validator.update({
    where: { id: validatorId },
    data: {
      totalVotes: newTotalVotes,
      correctVotes: newCorrectVotes,
      reliability: newReliability
    }
  });
}