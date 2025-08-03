/**
 * Dynamic Model Manager
 * 
 * Manages AI models from the database and routes to appropriate providers
 * No hardcoded mappings - everything comes from the database
 */

import { prisma } from '@/lib/db/client';
import { createLogger } from '@/lib/logger';
import { OpenAIValidator } from '@/lib/validators/providers/openai';
import { AnthropicValidator } from '@/lib/validators/providers/anthropic';
import { GeminiValidator } from '@/lib/validators/providers/gemini';
import { OpenRouterValidator } from '@/lib/validators/providers/openrouter';
import { AIValidator } from '@/lib/validators/types';

const logger = createLogger('model-manager');

export interface ModelConfig {
  id: string;
  model_path: string;
  name: string;
  provider: string;
  api_name?: string; // The actual model name to use with the API
  use_openrouter?: boolean; // Force OpenRouter even for direct providers
}

export class ModelManager {
  private static instance: ModelManager;
  private modelCache = new Map<string, ModelConfig>();
  private lastCacheUpdate: Date | null = null;
  private cacheExpiryMs = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): ModelManager {
    if (!ModelManager.instance) {
      ModelManager.instance = new ModelManager();
    }
    return ModelManager.instance;
  }

  /**
   * Get validator for a specific model path
   */
  async getValidator(modelPath: string): Promise<AIValidator | null> {
    try {
      // Get model config from database
      const model = await this.getModelConfig(modelPath);
      if (!model) {
        logger.error('Model not found', { modelPath });
        return null;
      }

      // Create appropriate validator based on provider
      return this.createValidator(model);
    } catch (error) {
      logger.error('Error getting validator', { error, modelPath });
      return null;
    }
  }

  /**
   * Get model configuration from database
   */
  private async getModelConfig(modelPath: string): Promise<ModelConfig | null> {
    // Check cache first
    if (this.modelCache.has(modelPath)) {
      const cached = this.modelCache.get(modelPath)!;
      if (this.lastCacheUpdate && Date.now() - this.lastCacheUpdate.getTime() < this.cacheExpiryMs) {
        return cached;
      }
    }

    try {
      // Fetch from database
      const dbModel = await prisma.ai_models.findFirst({
        where: { 
          model_path: modelPath,
          is_active: true 
        }
      });

      if (!dbModel) {
        return null;
      }

      // Convert to ModelConfig
      const config: ModelConfig = {
        id: dbModel.id,
        model_path: dbModel.model_path,
        name: dbModel.name,
        provider: dbModel.provider,
        // Check if model has custom API name in capabilities
        api_name: this.extractApiName(dbModel),
        // Check if we should use OpenRouter for this provider
        use_openrouter: this.shouldUseOpenRouter(dbModel.provider)
      };

      // Cache it
      this.modelCache.set(modelPath, config);
      this.lastCacheUpdate = new Date();

      return config;
    } catch (error) {
      logger.error('Error fetching model from database', { error, modelPath });
      return null;
    }
  }

  /**
   * Extract API name from model capabilities or use defaults
   */
  private extractApiName(dbModel: any): string | undefined {
    // If capabilities contains api_name, use it
    if (dbModel.capabilities && Array.isArray(dbModel.capabilities)) {
      const apiNameCap = dbModel.capabilities.find((cap: any) => 
        typeof cap === 'object' && cap.api_name
      );
      if (apiNameCap) {
        return apiNameCap.api_name;
      }
    }

    // Otherwise, return undefined to use model_path as default
    return undefined;
  }

  /**
   * Determine if we should use OpenRouter for a provider
   */
  private shouldUseOpenRouter(provider: string): boolean {
    // These providers we can access directly
    const directProviders = ['OpenAI', 'Anthropic', 'Google'];
    
    // All others go through OpenRouter
    return !directProviders.includes(provider);
  }

  /**
   * Create appropriate validator for the model
   */
  private createValidator(model: ModelConfig): AIValidator {
    const modelName = model.api_name || model.model_path;

    // If forced to use OpenRouter or provider not directly supported
    if (model.use_openrouter) {
      logger.info('Using OpenRouter for model', { model: model.name, provider: model.provider });
      return new OpenRouterValidator({
        modelName: model.model_path,
        name: model.name,
        active: true
      });
    }

    // Route to appropriate provider
    switch (model.provider) {
      case 'OpenAI':
        logger.info('Using OpenAI direct for model', { model: model.name });
        return new OpenAIValidator({
          modelName: modelName,
          name: model.name,
          active: true
        });

      case 'Anthropic':
        logger.info('Using Anthropic direct for model', { model: model.name });
        return new AnthropicValidator({
          modelName: modelName,
          name: model.name,
          active: true
        });

      case 'Google':
        logger.info('Using Google/Gemini direct for model', { model: model.name });
        return new GeminiValidator({
          modelName: modelName,
          name: model.name,
          active: true
        });

      default:
        // All other providers go through OpenRouter
        logger.info('Using OpenRouter for provider', { model: model.name, provider: model.provider });
        return new OpenRouterValidator({
          modelName: model.model_path,
          name: model.name,
          active: true
        });
    }
  }

  /**
   * Get multiple validators at once (for efficiency)
   */
  async getValidators(modelPaths: string[]): Promise<(AIValidator | null)[]> {
    return Promise.all(modelPaths.map(path => this.getValidator(path)));
  }

  /**
   * Clear the cache (useful for testing or when models are updated)
   */
  clearCache(): void {
    this.modelCache.clear();
    this.lastCacheUpdate = null;
    logger.info('Model cache cleared');
  }
}

// Export singleton instance
export const modelManager = ModelManager.getInstance();