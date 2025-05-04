
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