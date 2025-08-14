/**
 * Advanced caching utilities for SmartPOS
 */

import { Env } from '../types';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  namespace?: string;
  compress?: boolean;
  tags?: string[];
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  tags?: string[];
  compressed?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
}

/**
 * Multi-layer cache manager with compression and tagging
 */
export class CacheManager {
  private static instance: CacheManager;
  private memoryCache: Map<string, CacheEntry> = new Map();
  private stats: CacheStats = { hits: 0, misses: 0, sets: 0, deletes: 0, hitRate: 0 };
  private maxMemoryItems = 1000;
  private defaultTTL = 3600; // 1 hour

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Get value from cache (memory first, then KV)
   */
  async get<T = any>(
    env: Env,
    key: string,
    options: CacheOptions = {}
  ): Promise<T | null> {
    const fullKey = this.buildKey(key, options.namespace);
    
    // Try memory cache first
    const memoryEntry = this.memoryCache.get(fullKey);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      this.stats.hits++;
      this.updateHitRate();
      return this.deserializeData<T>(memoryEntry);
    }

    // Try KV cache
    try {
      const kvValue = await env.CACHE.get(fullKey);
      if (kvValue) {
        const entry: CacheEntry<T> = JSON.parse(kvValue);
        if (!this.isExpired(entry)) {
          // Store in memory cache for faster access
          this.setMemoryCache(fullKey, entry);
          this.stats.hits++;
          this.updateHitRate();
          return this.deserializeData<T>(entry);
        } else {
          // Remove expired entry
          await env.CACHE.delete(fullKey);
        }
      }
    } catch (error) {
      console.warn('KV cache read error:', error);
    }

    this.stats.misses++;
    this.updateHitRate();
    return null;
  }

  /**
   * Set value in cache (both memory and KV)
   */
  async set<T = any>(
    env: Env,
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<void> {
    const fullKey = this.buildKey(key, options.namespace);
    const ttl = options.ttl || this.defaultTTL;
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl: ttl * 1000, // Convert to milliseconds
      tags: options.tags,
      compressed: options.compress
    };

    // Compress data if requested
    if (options.compress) {
      entry.data = await this.compressData(value);
      entry.compressed = true;
    }

    // Set in memory cache
    this.setMemoryCache(fullKey, entry);

    // Set in KV cache
    try {
      await env.CACHE.put(
        fullKey,
        JSON.stringify(entry),
        { expirationTtl: ttl }
      );
      this.stats.sets++;
    } catch (error) {
      console.warn('KV cache write error:', error);
    }
  }

  /**
   * Delete from cache
   */
  async delete(env: Env, key: string, namespace?: string): Promise<void> {
    const fullKey = this.buildKey(key, namespace);
    
    // Remove from memory cache
    this.memoryCache.delete(fullKey);
    
    // Remove from KV cache
    try {
      await env.CACHE.delete(fullKey);
      this.stats.deletes++;
    } catch (error) {
      console.warn('KV cache delete error:', error);
    }
  }

  /**
   * Clear cache by tags
   */
  async clearByTags(env: Env, tags: string[]): Promise<void> {
    // Clear from memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.tags && entry.tags.some(tag => tags.includes(tag))) {
        this.memoryCache.delete(key);
      }
    }

    // For KV cache, we'd need to maintain a tag index
    // This is a simplified implementation
    console.log(`Cleared cache entries with tags: ${tags.join(', ')}`);
  }

  /**
   * Get or set pattern (cache-aside)
   */
  async getOrSet<T = any>(
    env: Env,
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(env, key, options);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(env, key, value, options);
    return value;
  }

  /**
   * Batch get multiple keys
   */
  async getMultiple<T = any>(
    env: Env,
    keys: string[],
    options: CacheOptions = {}
  ): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();
    
    // Use Promise.all for parallel fetching
    const promises = keys.map(async (key) => {
      const value = await this.get<T>(env, key, options);
      return { key, value };
    });

    const resolved = await Promise.all(promises);
    resolved.forEach(({ key, value }) => {
      results.set(key, value);
    });

    return results;
  }

  /**
   * Batch set multiple keys
   */
  async setMultiple<T = any>(
    env: Env,
    entries: Map<string, T>,
    options: CacheOptions = {}
  ): Promise<void> {
    const promises = Array.from(entries.entries()).map(([key, value]) =>
      this.set(env, key, value, options)
    );

    await Promise.all(promises);
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0, hitRate: 0 };
  }

  /**
   * Get memory cache size
   */
  getMemoryCacheSize(): number {
    return this.memoryCache.size;
  }

  /**
   * Clear memory cache
   */
  clearMemoryCache(): void {
    this.memoryCache.clear();
  }

  // Private methods

  private buildKey(key: string, namespace?: string): string {
    return namespace ? `${namespace}:${key}` : key;
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private setMemoryCache(key: string, entry: CacheEntry): void {
    // Implement LRU eviction if cache is full
    if (this.memoryCache.size >= this.maxMemoryItems) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }
    
    this.memoryCache.set(key, entry);
  }

  private deserializeData<T>(entry: CacheEntry): T {
    if (entry.compressed) {
      return this.decompressData(entry.data);
    }
    return entry.data;
  }

  private async compressData<T>(data: T): Promise<any> {
    // Simple compression using JSON stringification
    // In production, you might want to use actual compression algorithms
    const jsonString = JSON.stringify(data);
    return { compressed: true, data: jsonString };
  }

  private decompressData<T>(compressedData: any): T {
    if (compressedData.compressed) {
      return JSON.parse(compressedData.data);
    }
    return compressedData;
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }
}

/**
 * Cache decorators for common patterns
 */
export class CacheDecorators {
  /**
   * Cache the result of a function
   */
  static cached<T extends any[], R>(
    keyGenerator: (...args: T) => string,
    options: CacheOptions = {}
  ) {
    return function (
      target: any,
      propertyName: string,
      descriptor: PropertyDescriptor
    ) {
      const method = descriptor.value;
      
      descriptor.value = async function (...args: T): Promise<R> {
        const env = this.env || args.find((arg: any) => arg?.CACHE);
        if (!env) {
          return method.apply(this, args);
        }

        const cache = CacheManager.getInstance();
        const key = keyGenerator(...args);
        
        return cache.getOrSet(
          env,
          key,
          () => method.apply(this, args),
          options
        );
      };
    };
  }

  /**
   * Invalidate cache when method is called
   */
  static invalidate(
    keyPattern: string | ((args: any[]) => string[]),
    namespace?: string
  ) {
    return function (
      target: any,
      propertyName: string,
      descriptor: PropertyDescriptor
    ) {
      const method = descriptor.value;
      
      descriptor.value = async function (...args: any[]): Promise<any> {
        const result = await method.apply(this, args);
        
        const env = this.env || args.find((arg: any) => arg?.CACHE);
        if (env) {
          const cache = CacheManager.getInstance();
          
          if (typeof keyPattern === 'string') {
            await cache.delete(env, keyPattern, namespace);
          } else {
            const keys = keyPattern(args);
            await Promise.all(
              keys.map(key => cache.delete(env, key, namespace))
            );
          }
        }
        
        return result;
      };
    };
  }
}

/**
 * Predefined cache configurations
 */
export const CacheConfigs = {
  // Short-term cache for frequently accessed data
  SHORT: { ttl: 300, namespace: 'short' }, // 5 minutes
  
  // Medium-term cache for semi-static data
  MEDIUM: { ttl: 3600, namespace: 'medium' }, // 1 hour
  
  // Long-term cache for static data
  LONG: { ttl: 86400, namespace: 'long' }, // 24 hours
  
  // User session cache
  SESSION: { ttl: 1800, namespace: 'session' }, // 30 minutes
  
  // Product catalog cache
  PRODUCTS: { ttl: 7200, namespace: 'products', tags: ['products'] }, // 2 hours
  
  // Reports cache
  REPORTS: { ttl: 1800, namespace: 'reports', tags: ['reports'] }, // 30 minutes
  
  // Settings cache
  SETTINGS: { ttl: 3600, namespace: 'settings', tags: ['settings'] } // 1 hour
};

/**
 * Cache key builders
 */
export const CacheKeys = {
  user: (id: number) => `user:${id}`,
  product: (id: number) => `product:${id}`,
  products: (filters: any) => `products:${JSON.stringify(filters)}`,
  sales: (storeId: number, date: string) => `sales:${storeId}:${date}`,
  dashboard: (userId: number, storeId: number) => `dashboard:${userId}:${storeId}`,
  reports: (type: string, params: any) => `reports:${type}:${JSON.stringify(params)}`,
  settings: (storeId: number) => `settings:${storeId}`,
  inventory: (productId: number) => `inventory:${productId}`,

  // Sales cache keys
  sale: (id: number) => `sale:${id}`,
  salesList: (params?: string) => `sales:list${params ? `:${params}` : ''}`,
  salesStats: () => 'sales:stats',

  // Returns cache keys
  return: (id: number) => `return:${id}`,
  returnsList: (params?: string) => `returns:list${params ? `:${params}` : ''}`,
  returnsStats: () => 'returns:stats',

  // Inventory cache keys
  inventoryItem: (id: number) => `inventory:${id}`,
  inventoryList: (params?: string) => `inventory:list${params ? `:${params}` : ''}`,
  inventoryStats: () => 'inventory:stats',

  // Customer cache keys
  customer: (id: number) => `customer:${id}`,
  customersList: (params?: string) => `customers:list${params ? `:${params}` : ''}`,
  customersStats: () => 'customers:stats'
};

// Export singleton instance
export const cache = CacheManager.getInstance();