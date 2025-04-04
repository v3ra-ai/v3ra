import { Prisma } from '@prisma/client';
import { AIValidator } from '../validators/types';

/**
 * Schema adapter for Prisma types
 * 
 * This file provides helpers to convert between our application types
 * and Prisma database types, ensuring proper type safety.
 */

// Type definitions matching our Prisma schema
export type ValidatorCreateInput = {
  profileName: string;
  provider: string;
  modelName: string;
  publicKey: string;
  isLeader?: boolean;
  active?: boolean;
  description?: string | null;
  avatarUrl?: string | null;
  validatorType?: string | null;
  reliability?: number;
  totalVotes?: number;
  correctVotes?: number;
};

export type ValidatorUpdateInput = {
  profileName?: string;
  provider?: string;
  modelName?: string;
  publicKey?: string;
  isLeader?: boolean;
  active?: boolean;
  description?: string | null;
  avatarUrl?: string | null;
  validatorType?: string | null;
  reliability?: number;
  totalVotes?: number;
  correctVotes?: number;
};

export interface ValidatorInclude {
  apiKeys?: boolean;
  responses?: boolean;
  graphEdges?: boolean;
}

/**
 * Convert AIValidator to database validator format
 */
export function aiValidatorToDbValidator(validator: AIValidator): ValidatorCreateInput {
  return {
    profileName: validator.name,
    provider: validator.provider,
    modelName: validator.modelName,
    publicKey: validator.keyId || crypto.randomUUID(),
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

/**
 * Create a type-safe include object for Prisma queries
 */
export function createValidatorInclude(include: ValidatorInclude) {
  // Use type assertion to match Prisma's expected structure
  const result: any = {};
  
  if (include.apiKeys) {
    result.apiKeys = true;
  }
  
  if (include.responses) {
    result.responses = true;
  }
  
  if (include.graphEdges) {
    result.graphEdges = true;
  }
  
  return result as Prisma.ValidatorInclude;
}
