import { ApiKey } from "@prisma/client";
import {
  USER_FREE_CREDITS_DEFAULT,
  USER_PAID_CREDITS_DEFAULT,
  QUERIES_REQUESTED_DEFAULT,
  USER_CREDIT_CONVERSION_DEFAULT,
  QUERIES_COST_EACH_DEFAULT,
} from "@/lib/constants";
import { AIValidationResponse } from "./validators/types";

// Network state and validator interfaces
export interface Validator {
  id: string;
  publicKey: string;
  isLeader: boolean;
  provider: string;
  profileName: string;
  modelName: string;
  description: string | null;
  avatarUrl: string | null;
  validatorType: string | null;
  reliability: number | null;
  totalVotes: number;
  correctVotes: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastVote?: boolean | null;
  lastRationale?: string | null;
  lastResponse?: string | null;
}

export interface ValidatorResponse {
  id: string;
  provider: string;
  profileName: string;
  vote?: "YES" | "NO" | "ERROR";
  rationale?: string;
  modelName?: string;
  validatorType?: string;
  active?: boolean;
  hasKey?: boolean;
  keyIds?: string[];
}

export type ValidatorKey = {
  id: string;
  validatorId: string;
  apiKeyId: string;
  createdAt: Date;
  apiKey: ApiKey;
  validator: Validator;
};

export interface LlmResponse {
  decision: boolean;
  rationale: string;
}

export interface NetworkState {
  validators: Validator[];
  currentLeaderIndex: number;
  isVoting: boolean;
  lastQuery: string | null;
  lastNetworkResponse: string | null;
  lastConsensusValue: boolean | null;
  lastConsensusThreshold: number;
  lastConsensusAchieved: boolean | null;
  lastVoteTimestamp: string | null;
}

export interface VoteResult {
  id: string;
  isConsensusReached: boolean;
  consensusValue: boolean | null;
  queryText: string;
  validatorResponses: {
    id: string;
    provider: string;
    profileName: string;
    vote: string;
    rationale: string;
  }[];
  votingResult: {
    yes: number;
    no: number;
    notVoted: number;
  };
  timestamp?: string | number;
}

export interface VoteValidatorResponse extends ValidatorResponse {
  vote: "YES" | "NO" | "ERROR";
  rationale: string;
}

export interface ExtendedApiKey extends ApiKey {
  decryptable: boolean;
  keyPattern: string | null;
  linkedValidators: number;
}

// Query-related types
export type QueryMode = "fact-check" | "predict" | "create" | "shop";
export type ViewMode = "viewStandard" | "viewExpert";

// Cookie-related types
export interface FreeCreditsCookie {
  freeCredits: number;
  lastResetDate: string;
}

// Constants
export const DEFAULTS = {
  USER_FREE_CREDITS: USER_FREE_CREDITS_DEFAULT,
  USER_PAID_CREDITS: USER_PAID_CREDITS_DEFAULT,
  QUERIES_REQUESTED: QUERIES_REQUESTED_DEFAULT,
  USER_CREDIT_CONVERSION: USER_CREDIT_CONVERSION_DEFAULT,
  QUERIES_COST_EACH: QUERIES_COST_EACH_DEFAULT,
  FREE_CREDITS_COOKIE_NAME: "verafy_free_credits", // Define directly, no import
};

// Request to validate content
export interface ValidationRequest {
  statement: string;
  context?: string;
  queryMode?: QueryMode; // Added to support mode-specific validation
}

// Result of validation across multiple models
export interface ValidationResult {
  validatorId: string;
  validatorName: string;
  vote: boolean;
  confidence: number;
  rationale: string;
  timestamp: number;
  latency?: number;
}

// Shared interface for all AI validators
export interface AIValidator {
  id?: string;
  name: string;
  provider: string;
  modelName: string;
  description?: string;
  validatorType?: string;
  active: boolean;
  keyId?: string;
  validate: (request: ValidationRequest) => Promise<AIValidationResponse>;
}

// Registry of all available validators
export interface ValidatorRegistry {
  addValidator(validator: AIValidator): Promise<AIValidator>;
  removeValidator(id: string): Promise<boolean>;
  getValidator(id: string): Promise<AIValidator | undefined>;
  getAllValidators(): Promise<AIValidator[]>;
  getActiveValidators(): Promise<AIValidator[]>;
  toggleValidator(id: string, active: boolean): Promise<boolean>;
}

// Convert AIValidator to our UI Validator type
export function aiValidatorToUiValidator(aiValidator: AIValidator): AIValidator {
  return {
    id: aiValidator.id,
    name: aiValidator.name,
    provider: aiValidator.provider,
    modelName: aiValidator.modelName,
    description: aiValidator.description,
    validatorType: aiValidator.validatorType,
    active: aiValidator.active,
    keyId: aiValidator.keyId,
    validate: aiValidator.validate,
  };
}