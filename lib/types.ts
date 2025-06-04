import { ApiKey } from "@prisma/client";
import {
  USER_FREE_CREDITS_DEFAULT,
  USER_PAID_CREDITS_DEFAULT,
  QUERIES_REQUESTED_DEFAULT,
  USER_CREDIT_CONVERSION_DEFAULT,
  QUERIES_COST_EACH_DEFAULT,
} from "@/lib/constants";
import { AIValidationResponse } from "./validators/types";
import { Transaction } from "@solana/web3.js";

// Define interface for custom event attributes
export interface TestRouteEventAttributes {
  time: string;
  route: string;
  method: string;
  environment: string;
  vercelDeploymentId?: string;
  userId?: string;
  userEmail?: string;
  queryParams: string;
  responseTimeMs: number;
  supabaseQuerySuccess: boolean;
  supabaseRowCount?: number;
  supabaseErrorMessage?: string;
  supabaseIsAuthenticated: boolean;
  isAuthorized: boolean;
  authorizationError?: string;
  requestOrigin?: string;
  userAgent?: string;
  isMobile: boolean;
  [key: string]: string | number | boolean | undefined;
}

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
  FREE_CREDITS_COOKIE_NAME: "verafy_free_credits",
};

// Request to validate content
export interface ValidationRequest {
  statement: string;
  context?: string;
  queryMode?: QueryMode;
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

export interface User {
  id: string;
  email?: string;
}

export interface VoteSession {
  id: string;
  queryText: string | null;
  isConsensusReached: boolean;
  consensusValue: boolean | null;
  validatorResponses:
    | {
        id: string;
        provider: string;
        profileName: string;
        vote: string;
        rationale: string;
      }[]
    | null;
  timestamp: string;
  votesYes: number | null;
  votesNo: number | null;
  notVoted: number | null;
}

export interface VoteStats {
  totalVotes: number;
  yesVotes: number;
  noVotes: number;
  consensusMatchPercentage: number;
  nonConsensusPercentage: number;
}

export interface Favorite {
  id: string;
  user_id: string;
  vote_session_id: string;
  created_at: string;
}

export interface Feedback {
  id: string;
  userId: string;
  rating: 'thumbs_up' | 'thumbs_down';
  username: string;
  email: string;
  url: string;
  component: string;
  action: string;
  explanation?: string;
  options?: string[];
  createdAt: string;
  voteSessionId?: string;
}

export interface TruthTransactionResult {
  signature: string;
  signedTx: Transaction;
  tokenAmount: number;
}