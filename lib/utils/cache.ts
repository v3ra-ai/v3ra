/**
 * Enhanced in-memory cache with TTL support and better expiration handling
 */
class MemoryCache<T> {
  private cache = new Map<string, { value: T; expiry: number }>();
  
  constructor(private defaultTTL: number = 60 * 60 * 1000) {} // 1 hour default
  
  set(key: string, value: T, ttl?: number): void {
    const expiry = Date.now() + (ttl ?? this.defaultTTL);
    this.cache.set(key, { value, expiry });
  }
  
  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  // Check if key exists and is not expired
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  // Refresh TTL for existing key
  refresh(key: string, ttl?: number): boolean {
    const item = this.cache.get(key);
    if (!item || Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    item.expiry = Date.now() + (ttl ?? this.defaultTTL);
    return true;
  }
  
  // Get remaining TTL for a key
  getTTL(key: string): number {
    const item = this.cache.get(key);
    if (!item) return 0;
    
    const remaining = item.expiry - Date.now();
    if (remaining <= 0) {
      this.cache.delete(key);
      return 0;
    }
    
    return remaining;
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    this.cleanup(); // Clean before returning size
    return this.cache.size;
  }
  
  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

// Create singleton instances
export const csrfCache = new MemoryCache<string>(30 * 60 * 1000); // 30 minutes for CSRF tokens
export const sessionCache = new MemoryCache<any>(60 * 60 * 1000); // 1 hour for sessions

// Run cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    csrfCache.cleanup();
    sessionCache.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * Request deduplication to prevent duplicate API calls
 */
class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();
  
  async dedupe<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>;
    }
    
    // Create new request and store promise
    const promise = fetcher().finally(() => {
      // Clean up after request completes
      this.pendingRequests.delete(key);
    });
    
    this.pendingRequests.set(key, promise);
    return promise;
  }
  
  // Check if a request is currently pending
  isPending(key: string): boolean {
    return this.pendingRequests.has(key);
  }
  
  // Cancel/clear all pending requests
  clear(): void {
    this.pendingRequests.clear();
  }
}

export const requestDeduplicator = new RequestDeduplicator();