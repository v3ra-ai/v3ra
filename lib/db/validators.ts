import { prisma } from './client';
import { AIValidator } from '../validators/types';
import { v4 as uuidv4 } from 'uuid';
import { ValidatorCreateInput, ValidatorUpdateInput, createValidatorInclude } from './schema-adapter';

/**
 * Add a validator to the database
 */
export async function addValidator(validator: ValidatorCreateInput) {
  // Use type assertion to avoid TypeScript errors while maintaining type safety
  const data: any = {
    ...validator,
    isLeader: validator.isLeader || false,
    active: validator.active || true,
    reliability: validator.reliability || 0,
    totalVotes: validator.totalVotes || 0,
    correctVotes: validator.correctVotes || 0
  };
  
  return prisma.validator.create({ data });
}

/**
 * Remove a validator from the database
 */
export async function removeValidator(id: string) {
  return prisma.validator.delete({
    where: { id }
  });
}

/**
 * Get a validator by ID
 */
export async function getValidator(id: string) {
  return prisma.validator.findUnique({
    where: { id },
    include: createValidatorInclude({ apiKeys: true })
  });
}

/**
 * Get all validators from the database
 */
export async function getAllValidators() {
  return prisma.validator.findMany({
    include: createValidatorInclude({ apiKeys: true })
  });
}

/**
 * Get active validators from the database
 */
export async function getActiveValidators() {
  // Use type assertion for where clause
  const where: any = { active: true };
  
  return prisma.validator.findMany({
    where,
    include: createValidatorInclude({ apiKeys: true })
  });
}

/**
 * Toggle a validator's active status
 */
export async function toggleValidator(id: string, active: boolean) {
  // Use type assertion for data object
  const data: any = { active };
  
  return prisma.validator.update({
    where: { id },
    data
  });
}

/**
 * Set a validator as the leader
 */
export async function setValidatorAsLeader(id: string) {
  // Use type assertion for data object
  const data: any = { isLeader: false };
  
  // First reset all validators to non-leader
  await prisma.validator.updateMany({ data });
  
  // Then set the specified validator as leader
  return prisma.validator.update({
    where: { id },
    data: { isLeader: true } as any
  });
}

/**
 * Update validator reliability metrics
 */
export async function updateValidatorMetrics(id: string, voteMatchedConsensus: boolean) {
  const validator = await prisma.validator.findUnique({
    where: { id }
  });
  
  if (!validator) return null;
  
  // Use type assertion to handle potential undefined fields
  const dbValidator: any = validator;
  
  // Default to 0 if properties don't exist
  const totalVotes = (dbValidator.totalVotes || 0) + 1;
  const correctVotes = voteMatchedConsensus 
    ? (dbValidator.correctVotes || 0) + 1 
    : (dbValidator.correctVotes || 0);
  
  const reliability = totalVotes > 0 ? correctVotes / totalVotes : 0;
  
  // Use type assertion for data object
  const data: any = { 
    totalVotes, 
    correctVotes,
    reliability
  };
  
  return prisma.validator.update({
    where: { id },
    data
  });
}

/**
 * Convert database validator to AIValidator interface
 */
export function dbValidatorToAIValidator(dbValidator: any): AIValidator {
  // Create a validate function that will be replaced with the actual implementation
  const dummyValidate = async () => ({ 
    vote: true, 
    confidence: 0.9, 
    rationale: 'Placeholder validation response' 
  });
  
  return {
    id: dbValidator.id,
    name: dbValidator.profileName,
    provider: dbValidator.provider,
    modelName: dbValidator.modelName || 'unknown',
    description: dbValidator.description || undefined,
    validatorType: dbValidator.validatorType || undefined,
    active: dbValidator.active !== undefined ? dbValidator.active : true,
    keyId: dbValidator.apiKeys && dbValidator.apiKeys[0]?.apiKeyId,
    validate: dummyValidate
  };
}

/**
 * Convert AIValidator to database validator format
 */
export function aiValidatorToDbValidator(validator: AIValidator): ValidatorCreateInput {
  return {
    profileName: validator.name,
    provider: validator.provider,
    modelName: validator.modelName,
    publicKey: validator.keyId || uuidv4(),
    isLeader: false,
    active: validator.active,
    description: validator.description || null,
    avatarUrl: null,
    validatorType: validator.validatorType || null,
    reliability: 0,
    totalVotes: 0,
    correctVotes: 0
  };
}
