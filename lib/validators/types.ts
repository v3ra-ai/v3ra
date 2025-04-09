import { Validator } from "../types";

// Response from an AI model validator
export interface AIValidationResponse {
  vote: boolean;
  confidence: number;
  rationale: string;
  error?: string;
  latency?: number; // Add latency field for performance tracking
}

// Request to validate content
export interface ValidationRequest {
  statement: string;
  context?: string;
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
  id: string;
  name: string;
  provider: string;
  modelName: string;
  description?: string;
  validatorType?: string;
  active: boolean;
  keyId?: string; // Reference to the API key ID, not the actual key
  validate: (request: ValidationRequest) => Promise<AIValidationResponse>;
}

// Registry of all available validators
export interface ValidatorRegistry {
  addValidator(validator: AIValidator): Promise<AIValidator>;
  removeValidator(id: string): Promise<boolean>;
  getValidator(id: string): Promise<AIValidator | undefined>;
  getAllValidators(): Promise<AIValidator[]>;
  getActiveValidators(): Promise<AIValidator[]>; // Line 48, likely
  toggleValidator(id: string, active: boolean): Promise<boolean>;
}

// Convert AIValidator to our UI Validator type
export function aiValidatorToUiValidator(validator: AIValidator): Validator {
  return {
    id: validator.id,
    publicKey: validator.keyId || validator.id, // Use keyId if available, fallback to id
    provider: validator.provider,
    profileName: validator.name,
    isLeader: false, // Can be determined elsewhere
    lastVote: null,
    lastResponse: null,
    lastRationale: null,
    modelName: validator.modelName || "unknown",
    description:
      validator.description ||
      `${validator.provider} ${validator.modelName} AI model`,
    avatarUrl: undefined, // Optional avatar URL
    reliability: undefined, // Optional reliability score
    validatorType: validator.validatorType || `${validator.provider} AI`,
  };
}
