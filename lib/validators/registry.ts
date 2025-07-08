import { AIValidator, ValidatorRegistry, ValidationRequest, AIValidationResponse } from "./types";
import { dbValidatorToAIValidator } from "../db/validators";
import { OpenAIValidator } from "./providers/openai";
import { AnthropicValidator } from "./providers/anthropic";
import { GeminiValidator } from "./providers/gemini";
import { OpenRouterValidator } from "./providers/openrouter";
import { HuggingFaceValidator } from "./providers/huggingface";
import { validatorService } from "../services/validatorService";
import { Validator, ValidatorKey } from "@prisma/client";

const isServer = typeof window === "undefined";

interface WindowWithValidatorRegistry extends Window {
  validatorRegistry: ValidatorRegistryImpl;
}

type DbValidatorWithKeys = Validator & { ValidatorKey: ValidatorKey[] };

// List of providers with actual implementations
const IMPLEMENTED_PROVIDERS = [
  'OpenAI',
  'Anthropic', 
  'Google',
  'OpenRouter',
  'HuggingFace'
];

export class ValidatorRegistryImpl implements ValidatorRegistry {
  private static instance: ValidatorRegistryImpl;
  private validators: Map<string, AIValidator>;
  private validatorCache: Map<string, { data: AIValidator[]; timestamp: number }>;
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.validators = new Map<string, AIValidator>();
    this.validatorCache = new Map();
  }

  static getInstance(): ValidatorRegistryImpl {
    if (!ValidatorRegistryImpl.instance) {
      ValidatorRegistryImpl.instance = new ValidatorRegistryImpl();
    }
    return ValidatorRegistryImpl.instance;
  }

  async addValidator(validator: AIValidator): Promise<AIValidator> {
    // Always store in memory first
    if (validator.id) {
      this.validators.set(validator.id, validator);
    }
    
    if (isServer) {
      // Try to save to database, but don't fail if it doesn't work
      try {
        await validatorService.addValidator(validator);
      } catch (error) {
        console.log('[ValidatorRegistry] Database not available, using in-memory storage');
      }
    }
    
    return validator;
  }

  async removeValidator(id: string): Promise<boolean> {
    try {
      if (isServer) {
        return validatorService.removeValidator(id);
      } else {
        this.validators.delete(id);
      }
      return true;
    } catch (error) {
      console.error("Failed to remove validator:", error);
      return false;
    }
  }

  async getValidator(id: string): Promise<AIValidator | undefined> {
    try {
      if (this.validators.has(id)) {
        return this.validators.get(id);
      }

      if (isServer) {
        const dbValidators = await validatorService.getAllValidators();
        const dbValidator = dbValidators.find((v) => v.id === id);
        if (!dbValidator) return undefined;
        return this.createValidatorImplementation(dbValidator);
      } else {
        const validators = await this.getAllValidators();
        return validators.find((v) => v.id === id);
      }
    } catch (error) {
      console.error("Failed to get validator:", error);
      return undefined;
    }
  }


  private async createValidatorImplementation(
    validator: DbValidatorWithKeys,
  ): Promise<AIValidator> {
    const aiValidator = dbValidatorToAIValidator(validator);

    try {
      switch (validator.provider) {
        case "OpenAI": {
          const openaiValidator = new OpenAIValidator({
            id: validator.id,
            name: validator.profileName,
            modelName: validator.modelName,
            keyId: validator.ValidatorKey?.[0]?.apiKeyId,
            active: validator.active,
          });
          return {
            ...aiValidator,
            validate: openaiValidator.validate.bind(openaiValidator),
          };
        }

        case "Anthropic": {
          const anthropicValidator = new AnthropicValidator({
            id: validator.id,
            name: validator.profileName,
            modelName: validator.modelName,
            keyId: validator.ValidatorKey?.[0]?.apiKeyId,
            active: validator.active,
          });
          return {
            ...aiValidator,
            validate: anthropicValidator.validate.bind(anthropicValidator),
          };
        }

        case "OpenRouter": {
          const orValidator = new OpenRouterValidator({
            id: validator.id,
            name: validator.profileName,
            modelName: validator.modelName,
            active: validator.active,
          });
          return {
            ...aiValidator,
            validate: orValidator.validate.bind(orValidator),
          };
        }

        case "Google": {
          const geminiValidator = new GeminiValidator({
            id: validator.id,
            name: validator.profileName,
            modelName: validator.modelName,
            keyId: validator.ValidatorKey?.[0]?.apiKeyId,
            active: validator.active,
          });
          return {
            ...aiValidator,
            validate: geminiValidator.validate.bind(geminiValidator),
          };
        }

        case "HuggingFace": {
          const hfValidator = new HuggingFaceValidator({
            id: validator.id,
            name: validator.profileName,
            modelName: validator.modelName,
            keyId: validator.ValidatorKey?.[0]?.apiKeyId,
            active: validator.active,
          });
          return {
            ...aiValidator,
            validate: hfValidator.validate.bind(hfValidator),
          };
        }

        default:
          // Skip generic validators - they don't have real implementations
          return {
            ...aiValidator,
            validate: async (_request: ValidationRequest): Promise<AIValidationResponse> => {
              return {
                vote: false,
                confidence: 0.5,
                rationale: `Validation not implemented for ${validator.provider} provider. This is a placeholder response.`,
                providerName: validator.provider,
                modelName: validator.modelName,
                error: `Provider ${validator.provider} not fully supported yet`,
              };
            },
          };
      }
    } catch (error) {
      return {
        ...aiValidator,
        validate: async (_request: ValidationRequest): Promise<AIValidationResponse> => {
          return {
            vote: false,
            confidence: 0,
            rationale: `Validator initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            providerName: validator.provider,
            modelName: validator.modelName,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        },
      };
    }
  }

  async getAllValidators(): Promise<AIValidator[]> {
    try {
      // Check cache first
      const cacheKey = 'all-validators';
      const cached = this.validatorCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data;
      }

      if (isServer) {
        try {
          const dbValidators = await validatorService.getAllValidators();
          
          // If we got validators from DB
          if (dbValidators.length > 0) {
            // Filter only implemented providers
            const implementedValidators = dbValidators.filter(v => 
              IMPLEMENTED_PROVIDERS.includes(v.provider)
            );
            
            const aiValidators = await Promise.all(
              implementedValidators.map((v) => this.createValidatorImplementation(v)),
            );
            
            // Cache them in memory
            aiValidators.forEach((validator) => {
              if (validator.id) {
                this.validators.set(validator.id, validator);
              }
            });
            
            // Store in cache
            this.validatorCache.set(cacheKey, {
              data: aiValidators,
              timestamp: Date.now()
            });
            
            return aiValidators;
          }
        } catch (dbError) {
          console.log('[ValidatorRegistry] Database not available, using in-memory validators');
        }
        
        // Fallback to in-memory validators
        const memoryValidators = Array.from(this.validators.values());
        
        // Store in cache
        if (memoryValidators.length > 0) {
          this.validatorCache.set(cacheKey, {
            data: memoryValidators,
            timestamp: Date.now()
          });
        }
        
        return memoryValidators;
      } else {
        return Array.from(this.validators.values());
      }
    } catch (error) {
      console.error("[ValidatorRegistry] Error getting all validators:", error);
      return Array.from(this.validators.values());
    }
  }

  async getActiveValidators(page: number = 1, limit: number = 50): Promise<AIValidator[]> {
    try {
      if (isServer) {
        const skip = (page - 1) * limit;
        const dbValidators = await validatorService.getActiveValidators(page, limit);
        
        if (dbValidators.length > 0) {
          // Filter only implemented providers
          const implementedValidators = dbValidators.filter(v => 
            IMPLEMENTED_PROVIDERS.includes(v.provider)
          );
          
          const aiValidators = await Promise.all(
            implementedValidators.map((v) => this.createValidatorImplementation(v)),
          );
          
          return aiValidators;
        }
      }
      
      // Fallback to in-memory active validators
      const allValidators = await this.getAllValidators();
      const activeValidators = allValidators.filter(v => v.active);
      const start = (page - 1) * limit;
      return activeValidators.slice(start, start + limit);
    } catch (error) {
      console.error("Failed to get active validators:", error);
      return [];
    }
  }

  async toggleValidator(id: string, active: boolean): Promise<boolean> {
    try {
      if (isServer) {
        return validatorService.toggleValidator(id, active);
      } else {
        const validator = this.validators.get(id);
        if (validator) {
          validator.active = active;
          this.validators.set(id, validator);
        }
        return true;
      }
    } catch (error) {
      console.error("Failed to toggle validator:", error);
      return false;
    }
  }
}

export const validatorRegistry = ValidatorRegistryImpl.getInstance();

if (typeof window !== "undefined") {
  (window as unknown as WindowWithValidatorRegistry).validatorRegistry =
    validatorRegistry;
}