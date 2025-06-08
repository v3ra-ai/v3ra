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

type DbValidatorWithKeys = Validator & { apiKeys: ValidatorKey[] };

export class ValidatorRegistryImpl implements ValidatorRegistry {
  private static instance: ValidatorRegistryImpl;
  private validators: Map<string, AIValidator>;

  private constructor() {
    this.validators = new Map<string, AIValidator>();
  }

  static getInstance(): ValidatorRegistryImpl {
    if (!ValidatorRegistryImpl.instance) {
      ValidatorRegistryImpl.instance = new ValidatorRegistryImpl();
    }
    return ValidatorRegistryImpl.instance;
  }

  async addValidator(validator: AIValidator): Promise<AIValidator> {
    if (isServer) {
      return validatorService.addValidator(validator);
    } else {
      console.warn("Adding validators from client is not fully implemented yet");
      if (validator.id) {
        this.validators.set(validator.id, validator);
      } else {
        console.warn("Skipping validator without id:", validator);
      }
      return validator;
    }
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
            keyId: validator.apiKeys?.[0]?.apiKeyId,
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
            keyId: validator.apiKeys?.[0]?.apiKeyId,
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
            keyId: validator.apiKeys?.[0]?.apiKeyId,
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
            keyId: validator.apiKeys?.[0]?.apiKeyId,
            active: validator.active,
          });
          return {
            ...aiValidator,
            validate: hfValidator.validate.bind(hfValidator),
          };
        }

        default:
          console.log(`Creating generic validator for provider: ${validator.provider}`);
          return {
            ...aiValidator,
            validate: async (request: ValidationRequest): Promise<AIValidationResponse> => {
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
      console.error(`[ValidatorRegistry] Error creating validator for ${validator.profileName} (${validator.provider}):`, error);
      return {
        ...aiValidator,
        validate: async (request: ValidationRequest): Promise<AIValidationResponse> => {
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
      console.log("[ValidatorRegistry] getAllValidators called");
      if (isServer) {
        console.log("[ValidatorRegistry] Running on server, fetching from database...");
        const dbValidators = await validatorService.getAllValidators();
        console.log(`[ValidatorRegistry] Found ${dbValidators.length} validators in database`);
        
        const aiValidators = await Promise.all(
          dbValidators.map((v) => this.createValidatorImplementation(v)),
        );
        
        // Cache them in memory
        aiValidators.forEach((validator) => {
          if (validator.id) {
            this.validators.set(validator.id, validator);
          }
        });
        
        console.log(`[ValidatorRegistry] Returning ${aiValidators.length} AI validators`);
        return aiValidators;
      } else {
        console.log("[ValidatorRegistry] Running on client, returning cached validators");
        return Array.from(this.validators.values());
      }
    } catch (error) {
      console.error("[ValidatorRegistry] Error getting all validators:", error);
      return [];
    }
  }

  async getActiveValidators(): Promise<AIValidator[]> {
    try {
      if (isServer) {
        const dbValidators = await validatorService.getActiveDbValidators();
        const aiValidators = await Promise.all(
          dbValidators.map((validator) => this.createValidatorImplementation(validator)),
        );
        aiValidators.forEach((validator) => {
          if (validator.id) {
            this.validators.set(validator.id, validator);
          }
        });
        return aiValidators;
      } else {
        const validators = await Promise.resolve<AIValidator[]>([]);
        validators.forEach((validator) => {
          if (validator.id) {
            this.validators.set(validator.id, validator);
          }
        });
        return validators;
      }
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