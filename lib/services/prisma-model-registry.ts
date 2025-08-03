/**
 * Prisma Model Registry Service
 * 
 * Production-ready service that uses Prisma to access AI models in the database.
 * This bypasses Supabase RLS issues while still using the database as the source of truth.
 */

import { prisma } from '@/lib/db/client';
import { createLogger } from '@/lib/logger';

const logger = createLogger('prisma-model-registry');

export interface AIModel {
  id: string;
  model_path: string;
  name: string;
  provider: string;
  category?: string;
  is_active: boolean;
  capabilities?: string[];
  strengths?: string[];
  cost_per_comparison?: number;
  icon?: string;
  created_at?: string;
  updated_at?: string;
}

class PrismaModelRegistry {
  private static instance: PrismaModelRegistry;
  private modelCache = new Map<string, AIModel>();
  private lastCacheUpdate: Date | null = null;
  private cacheExpiryMs = 5 * 60 * 1000; // 5 minutes
  private activeModelsCache: AIModel[] = [];

  private constructor() {}

  static getInstance(): PrismaModelRegistry {
    if (!PrismaModelRegistry.instance) {
      PrismaModelRegistry.instance = new PrismaModelRegistry();
    }
    return PrismaModelRegistry.instance;
  }

  async isValidModel(modelPath: string): Promise<boolean> {
    await this.ensureCacheValid();
    return this.modelCache.has(modelPath);
  }

  async getActiveModels(): Promise<AIModel[]> {
    await this.ensureCacheValid();
    return this.activeModelsCache;
  }

  async getModelByPath(modelPath: string): Promise<AIModel | null> {
    await this.ensureCacheValid();
    return this.modelCache.get(modelPath) || null;
  }

  async getRandomPair(strategy: 'SMART' | 'UNDERDOG' | 'TITANS' | 'OPEN_SOURCE' = 'SMART'): Promise<[AIModel, AIModel] | null> {
    try {
      const result = await prisma.$queryRaw<Array<{
        model1: any;
        model2: any;
      }>>`
        SELECT * FROM get_blind_test_pair(${strategy});
      `;

      if (!result || result.length === 0 || !result[0].model1 || !result[0].model2) {
        logger.error('Invalid response from get_blind_test_pair');
        return null;
      }

      // The SQL function returns JSONB objects, we need to construct proper AIModel objects
      const model1Data = result[0].model1;
      const model2Data = result[0].model2;

      const model1: AIModel = {
        id: model1Data.id,
        model_path: model1Data.id, // The function uses 'id' for model_path
        name: model1Data.name,
        provider: model1Data.provider,
        category: model1Data.category,
        is_active: true
      };

      const model2: AIModel = {
        id: model2Data.id,
        model_path: model2Data.id, // The function uses 'id' for model_path
        name: model2Data.name,
        provider: model2Data.provider,
        category: model2Data.category,
        is_active: true
      };

      return [model1, model2];
    } catch (error) {
      logger.error('Error in getRandomPair', { error });
      // Fallback to manual selection
      await this.ensureCacheValid();
      
      let candidates = this.activeModelsCache;
      
      // Filter based on strategy
      switch (strategy) {
        case 'UNDERDOG':
          // Prefer open-source and budget models
          candidates = candidates.filter(m => m.category === 'open-source' || m.category === 'budget');
          break;
        case 'TITANS':
          // Only premium models
          candidates = candidates.filter(m => m.category === 'premium');
          break;
        case 'OPEN_SOURCE':
          // Only open-source models
          candidates = candidates.filter(m => m.category === 'open-source');
          break;
        // SMART: use all models
      }
      
      // If not enough candidates after filtering, use all models
      if (candidates.length < 2) {
        candidates = this.activeModelsCache;
      }
      
      if (candidates.length < 2) {
        return null;
      }
      
      // Randomly select 2 different models
      const shuffled = [...candidates].sort(() => Math.random() - 0.5);
      return [shuffled[0], shuffled[1]];
    }
  }

  private async ensureCacheValid() {
    const now = new Date();
    
    if (!this.lastCacheUpdate || 
        now.getTime() - this.lastCacheUpdate.getTime() > this.cacheExpiryMs) {
      await this.refreshCache();
    }
  }

  private async refreshCache() {
    try {
      const models = await prisma.$queryRaw<AIModel[]>`
        SELECT 
          id::text as id,
          model_path,
          name,
          provider,
          category,
          is_active,
          capabilities,
          strengths,
          cost_per_comparison,
          icon,
          created_at::text as created_at,
          updated_at::text as updated_at
        FROM ai_models
        WHERE is_active = true
        ORDER BY provider, name;
      `;

      // Clear and rebuild cache
      this.modelCache.clear();
      this.activeModelsCache = [];

      if (models) {
        models.forEach(model => {
          this.modelCache.set(model.model_path, model);
          this.activeModelsCache.push(model);
        });
      }

      this.lastCacheUpdate = new Date();
    } catch (error) {
      logger.error('Error refreshing model cache', { error });
    }
  }

  // Helper method to get models by category
  async getModelsByCategory(category: string): Promise<AIModel[]> {
    await this.ensureCacheValid();
    return this.activeModelsCache.filter(model => model.category === category);
  }

  // Helper method to get models by provider
  async getModelsByProvider(provider: string): Promise<AIModel[]> {
    await this.ensureCacheValid();
    return this.activeModelsCache.filter(model => model.provider === provider);
  }

  // Clear cache (useful for testing or when models are updated)
  clearCache() {
    this.modelCache.clear();
    this.activeModelsCache = [];
    this.lastCacheUpdate = null;
  }
}

export const prismaModelRegistry = PrismaModelRegistry.getInstance();