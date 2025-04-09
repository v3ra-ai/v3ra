// Network state and validator interfaces

export interface Validator {
  id: string;
  publicKey: string;
  isLeader: boolean;
  lastVote: boolean | null;
  lastResponse: string | null;
  provider: string;
  profileName: string;
  lastRationale: string | null;
  modelName?: string;
  description?: string;
  avatarUrl?: string;
  reliability?: number;
  validatorType?: string;
}

type ApiKey = {
  id: string;
  name: string;
  provider: string;
  key: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastUsed?: Date;
  validatorKeys: ValidatorKey[];
};

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
