import { ApiKey } from "@prisma/client";
import { USER_FREE_CREDITS_DEFAULT, USER_PAID_CREDITS_DEFAULT, QUERIES_REQUESTED_DEFAULT, USER_CREDIT_CONVERSION_DEFAULT, QUERIES_COST_EACH_DEFAULT } from "@/lib/constants";

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
  lastVote?: boolean | null; // Added for legacy profile support
  lastRationale?: string | null; // Added for legacy profile support
  lastResponse?: string | null; // Added for legacy simulation support
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
export type QueryMode = "factCheck" | "predict" | "create" | "shop";
export type ViewMode = "viewStandard" | "viewExpert";

// Constants
export const DEFAULTS = {
  USER_FREE_CREDITS: USER_FREE_CREDITS_DEFAULT,
  USER_PAID_CREDITS: USER_PAID_CREDITS_DEFAULT,
  QUERIES_REQUESTED: QUERIES_REQUESTED_DEFAULT,
  USER_CREDIT_CONVERSION: USER_CREDIT_CONVERSION_DEFAULT,
  QUERIES_COST_EACH: QUERIES_COST_EACH_DEFAULT,
};