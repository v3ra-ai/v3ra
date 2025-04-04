import { AIValidator, ValidatorRegistry } from './types';
import { 
  dbValidatorToAIValidator,
  aiValidatorToDbValidator
} from '../db/validators';
import { OpenAIValidator } from './providers/openai';
import { AnthropicValidator } from './providers/anthropic';
import { GeminiValidator } from './providers/gemini';
import { validatorService } from '../services/validatorService';
import { keyService } from '../services/keyService';
import * as clientData from './client-data';

// Flag to determine if we're running on server or client
const isServer = typeof window === 'undefined';

/**
 * Singleton implementation of the ValidatorRegistry
 * This implementation uses API calls on client-side and direct database access on server-side
 */
export class ValidatorRegistryImpl implements ValidatorRegistry {
  private static instance: ValidatorRegistryImpl;
  private validators: Map<string, AIValidator>;

  private constructor() {
    this.validators = new Map<string, AIValidator>();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ValidatorRegistryImpl {
    if (!ValidatorRegistryImpl.instance) {
      ValidatorRegistryImpl.instance = new ValidatorRegistryImpl();
    }
    return ValidatorRegistryImpl.instance;
  }

  /**
   * Add a validator to the registry
   */
  async addValidator(validator: AIValidator): Promise<AIValidator> {
    if (isServer) {
      // Server-side: use validatorService
      return validatorService.addValidator(validator);
    } else {
      // Client-side: fetch from API
      console.warn('Adding validators from client is not fully implemented yet');
      // Store in local cache
      this.validators.set(validator.id, validator);
      return validator;
    }
  }

  /**
   * Remove a validator from the registry
   */
  async removeValidator(id: string): Promise<boolean> {
    try {
      if (isServer) {
        // Server-side: use validatorService
        return validatorService.removeValidator(id);
      } else {
        // Client-side: remove from local cache
        this.validators.delete(id);
        // API call would be implemented here
      }
      return true;
    } catch (error) {
      console.error('Failed to remove validator:', error);
      return false;
    }
  }

  /**
   * Get a validator by ID
   */
  async getValidator(id: string): Promise<AIValidator | undefined> {
    try {
      // Check local cache first
      if (this.validators.has(id)) {
        return this.validators.get(id);
      }
      
      if (isServer) {
        // Server-side: get validator from database
        const validators = await validatorService.getAllValidators();
        const validator = validators.find(v => v.id === id);
        if (!validator) return undefined;
        
        // Create the validator with the right implementation based on provider
        return this.createValidatorImplementation(validator);
      } else {
        // Client-side: get all validators
        const validators = await this.getAllValidators();
        return validators.find(v => v.id === id);
      }
    } catch (error) {
      console.error('Failed to get validator:', error);
      return undefined;
    }
  }

  /**
   * Create the correct validator implementation with real validate method
   */
  private async createValidatorImplementation(validator: any): Promise<AIValidator> {
    // Convert database validator to AIValidator format
    const aiValidator = dbValidatorToAIValidator(validator);
    
    // Handle based on provider
    switch (validator.provider) {
      case 'OpenAI': {
        // Create an OpenAI validator instance with the right key
        const openaiValidator = new OpenAIValidator({
          id: validator.id,
          name: validator.profileName,
          modelName: validator.modelName,
          keyId: validator.apiKeys?.[0]?.apiKeyId,
          active: validator.active
        });
        
        // Return the validator with real implementation
        return {
          ...aiValidator,
          validate: openaiValidator.validate.bind(openaiValidator)
        };
      }
      
      case 'Anthropic': {
        // Create an Anthropic validator instance with the right key
        const anthropicValidator = new AnthropicValidator({
          id: validator.id,
          name: validator.profileName,
          modelName: validator.modelName,
          keyId: validator.apiKeys?.[0]?.apiKeyId,
          active: validator.active
        });
        
        // Return the validator with real implementation
        return {
          ...aiValidator,
          validate: anthropicValidator.validate.bind(anthropicValidator)
        };
      }
      
      case 'Google': {
        // Create a Gemini validator instance with the right key
        const geminiValidator = new GeminiValidator({
          id: validator.id,
          name: validator.profileName,
          modelName: validator.modelName,
          keyId: validator.apiKeys?.[0]?.apiKeyId,
          active: validator.active
        });
        
        // Return the validator with real implementation
        return {
          ...aiValidator,
          validate: geminiValidator.validate.bind(geminiValidator)
        };
      }
      
      default:
        // For other providers, return the validator with basic validate function
        return aiValidator;
    }
  }

  /**
   * Get all validators
   */
  async getAllValidators(): Promise<AIValidator[]> {
    try {
      if (isServer) {
        // Server-side: use validatorService
        const dbValidators = await validatorService.getAllValidators();
        
        // Create the validator implementations
        const aiValidators = await Promise.all(
          dbValidators.map(validator => this.createValidatorImplementation(validator))
        );
        
        return aiValidators;
      } else {
        // Client-side: fetch from API
        const validators = await clientData.getValidators();
        
        // Update local cache
        validators.forEach(validator => {
          this.validators.set(validator.id, validator);
        });
        
        return validators;
      }
    } catch (error) {
      console.error('Failed to get all validators:', error);
      return [];
    }
  }

  /**
   * Get active validators
   */
  async getActiveValidators(): Promise<AIValidator[]> {
    try {
      if (isServer) {
        // Server-side: use validatorService
        const dbValidators = await validatorService.getActiveValidators();
        
        // Create the validator implementations
        const aiValidators = await Promise.all(
          dbValidators.map(validator => this.createValidatorImplementation(validator))
        );
        
        return aiValidators;
      } else {
        // Client-side: fetch from API
        const validators = await clientData.getActiveValidators();
        
        // Update local cache
        validators.forEach(validator => {
          this.validators.set(validator.id, validator);
        });
        
        return validators;
      }
    } catch (error) {
      console.error('Failed to get active validators:', error);
      return [];
    }
  }

  /**
   * Toggle a validator's active status
   */
  async toggleValidator(id: string, active: boolean): Promise<boolean> {
    try {
      if (isServer) {
        // Server-side: use validatorService
        return validatorService.toggleValidator(id, active);
      } else {
        // Client-side: API call
        const response = await fetch(`/api/admin/validators/toggle`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, active })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to toggle validator: ${response.statusText}`);
        }
        
        // Update local cache if we have the validator
        if (this.validators.has(id)) {
          const validator = this.validators.get(id);
          if (validator) {
            validator.active = active;
            this.validators.set(id, validator);
          }
        }
        
        return true;
      }
    } catch (error) {
      console.error('Failed to toggle validator:', error);
      return false;
    }
  }
}

// Export singleton instance
export const validatorRegistry = ValidatorRegistryImpl.getInstance();

// For testing/development, add this to window
if (typeof window !== 'undefined') {
  (window as any).validatorRegistry = validatorRegistry;
}
