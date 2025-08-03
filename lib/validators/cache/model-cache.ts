// Simple in-memory cache for model instances to avoid recreation
import { OpenRouterValidator } from "../providers/openrouter";

interface CachedValidator {
  validator: OpenRouterValidator;
  lastUsed: number;
}

class ModelCache {
  private cache = new Map<string, CachedValidator>();
  private maxAge = 5 * 60 * 1000; // 5 minutes
  private maxSize = 20; // Maximum number of cached validators

  get(modelId: string): OpenRouterValidator | null {
    const cached = this.cache.get(modelId);
    if (!cached) return null;

    // Check if cache is expired
    if (Date.now() - cached.lastUsed > this.maxAge) {
      this.cache.delete(modelId);
      return null;
    }

    // Update last used time
    cached.lastUsed = Date.now();
    return cached.validator;
  }

  set(modelId: string, validator: OpenRouterValidator): void {
    // Evict oldest if cache is full
    if (this.cache.size >= this.maxSize) {
      let oldestKey = "";
      let oldestTime = Date.now();
      
      for (const [key, value] of this.cache.entries()) {
        if (value.lastUsed < oldestTime) {
          oldestTime = value.lastUsed;
          oldestKey = key;
        }
      }
      
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(modelId, {
      validator,
      lastUsed: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

export const modelCache = new ModelCache();