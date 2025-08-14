/**
 * ADVANCED CACHING SERVICE
 * 
 * Multi-layer caching system with Cloudflare KV, memory cache,
 * intelligent invalidation, and cache analytics.
 */

import { Env } from '../types';
import { log } from '../utils/logger';

// Cache Configuration
interface CacheConfig {
  ttl: number; // Time to live in seconds
  maxSize?: number; // Max items in memory cache
  strategy: 'LRU' | 'LFU' | 'FIFO';
  compression?: boolean;
  encryption?: boolean;
}

// Cache Entry
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
}

// Cache Statistics
interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  totalSize: number;
  hitRate: number;
}

// Cache Layer Types
enum CacheLayer {
  MEMORY = 'memory',
  KV = 'kv',
  DATABASE = 'database'
}

export class CachingService {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    totalSize: 0,
    hitRate: 0
  };

  private defaultConfig: CacheConfig = {
    ttl: 3600, // 1 hour
    maxSize: 1000,
    strategy: 'LRU',
    compression: false,
    encryption: false
  };

  constructor(private env: Env) {
    // Start cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Get data from cache with multi-layer fallback
   */
  async get<T>(key: string, config?: Partial<CacheConfig>): Promise<T | null> {
    const cacheConfig = { ...this.defaultConfig, ...config };
    
    try {
      // Layer 1: Memory cache
      const memoryResult = this.getFromMemory<T>(key);
      if (memoryResult !== null) {
        this.stats.hits++;
        this.updateHitRate();
        log.debug(`Cache HIT (memory): ${key}`);
        return memoryResult;
      }

      // Layer 2: Cloudflare KV
      const kvResult = await this.getFromKV<T>(key);
      if (kvResult !== null) {
        // Store in memory for faster access
        this.setInMemory(key, kvResult, cacheConfig);
        this.stats.hits++;
        this.updateHitRate();
        log.debug(`Cache HIT (KV): ${key}`);
        return kvResult;
      }

      // Cache miss
      this.stats.misses++;
      this.updateHitRate();
      log.debug(`Cache MISS: ${key}`);
      return null;

    } catch (error) {
      log.error(`Cache get error for key ${key}`, { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Set data in cache with multi-layer storage
   */
  async set<T>(key: string, data: T, config?: Partial<CacheConfig>): Promise<void> {
    const cacheConfig = { ...this.defaultConfig, ...config };
    
    try {
      // Store in memory cache
      this.setInMemory(key, data, cacheConfig);
      
      // Store in Cloudflare KV for persistence
      await this.setInKV(key, data, cacheConfig);
      
      this.stats.sets++;
      log.debug(`Cache SET: ${key}`, { ttl: cacheConfig.ttl });

    } catch (error) {
      log.error(`Cache set error for key ${key}`, { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Delete from all cache layers
   */
  async delete(key: string): Promise<void> {
    try {
      // Delete from memory
      this.memoryCache.delete(key);
      
      // Delete from KV
      if (this.env.CACHE_KV) {
        await this.env.CACHE_KV.delete(key);
      }
      
      this.stats.deletes++;
      log.debug(`Cache DELETE: ${key}`);

    } catch (error) {
      log.error(`Cache delete error for key ${key}`, { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get or set pattern (cache-aside)
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    config?: Partial<CacheConfig>
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key, config);
    if (cached !== null) {
      return cached;
    }

    // Fetch data and cache it
    const data = await fetcher();
    await this.set(key, data, config);
    return data;
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      // Invalidate memory cache
      const keysToDelete: string[] = [];
      for (const key of this.memoryCache.keys()) {
        if (this.matchesPattern(key, pattern)) {
          keysToDelete.push(key);
        }
      }
      
      keysToDelete.forEach(key => this.memoryCache.delete(key));
      
      // Note: KV doesn't support pattern deletion, would need to track keys
      log.info(`Invalidated ${keysToDelete.length} cache entries matching pattern: ${pattern}`);

    } catch (error) {
      log.error(`Cache invalidation error for pattern ${pattern}`, { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    try {
      const keysToDelete: string[] = [];
      
      for (const key of this.memoryCache.keys()) {
        // Check if key contains any of the tags
        if (tags.some(tag => key.includes(tag))) {
          keysToDelete.push(key);
        }
      }
      
      keysToDelete.forEach(key => this.memoryCache.delete(key));
      
      log.info(`Invalidated ${keysToDelete.length} cache entries for tags: ${tags.join(', ')}`);

    } catch (error) {
      log.error(`Cache invalidation error for tags ${tags.join(', ')}`, { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get from memory cache
   */
  private getFromMemory<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.timestamp + (entry.ttl * 1000)) {
      this.memoryCache.delete(key);
      this.stats.evictions++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    return entry.data;
  }

  /**
   * Set in memory cache with eviction
   */
  private setInMemory<T>(key: string, data: T, config: CacheConfig): void {
    const dataSize = this.calculateSize(data);
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: config.ttl,
      accessCount: 1,
      lastAccessed: Date.now(),
      size: dataSize
    };

    // Check if we need to evict
    if (config.maxSize && this.memoryCache.size >= config.maxSize) {
      this.evictEntries(config.strategy);
    }

    this.memoryCache.set(key, entry);
    this.stats.totalSize += dataSize;
  }

  /**
   * Get from Cloudflare KV
   */
  private async getFromKV<T>(key: string): Promise<T | null> {
    try {
      if (!this.env.CACHE_KV) {
        return null;
      }

      const value = await this.env.CACHE_KV.get(key, 'json');
      return value as T;

    } catch (error) {
      log.error(`KV get error for key ${key}`, { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Set in Cloudflare KV
   */
  private async setInKV<T>(key: string, data: T, config: CacheConfig): Promise<void> {
    try {
      if (!this.env.CACHE_KV) {
        return;
      }

      const options: any = {};
      if (config.ttl > 0) {
        options.expirationTtl = config.ttl;
      }

      await this.env.CACHE_KV.put(key, JSON.stringify(data), options);

    } catch (error) {
      log.error(`KV set error for key ${key}`, { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Evict entries based on strategy
   */
  private evictEntries(strategy: 'LRU' | 'LFU' | 'FIFO'): void {
    if (this.memoryCache.size === 0) return;

    let keyToEvict: string;
    const entries = Array.from(this.memoryCache.entries());

    switch (strategy) {
      case 'LRU': // Least Recently Used
        keyToEvict = entries.reduce((oldest, [key, entry]) => {
          const [oldestKey, oldestEntry] = oldest;
          return entry.lastAccessed < oldestEntry.lastAccessed ? [key, entry] : oldest;
        })[0];
        break;

      case 'LFU': // Least Frequently Used
        keyToEvict = entries.reduce((least, [key, entry]) => {
          const [leastKey, leastEntry] = least;
          return entry.accessCount < leastEntry.accessCount ? [key, entry] : least;
        })[0];
        break;

      case 'FIFO': // First In, First Out
        keyToEvict = entries.reduce((oldest, [key, entry]) => {
          const [oldestKey, oldestEntry] = oldest;
          return entry.timestamp < oldestEntry.timestamp ? [key, entry] : oldest;
        })[0];
        break;

      default:
        keyToEvict = entries[0][0]; // Fallback to first entry
    }

    const evictedEntry = this.memoryCache.get(keyToEvict);
    if (evictedEntry) {
      this.stats.totalSize -= evictedEntry.size;
      this.stats.evictions++;
    }
    
    this.memoryCache.delete(keyToEvict);
    log.debug(`Evicted cache entry: ${keyToEvict} (strategy: ${strategy})`);
  }

  /**
   * Calculate approximate size of data
   */
  private calculateSize(data: any): number {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 1; // Fallback size
    }
  }

  /**
   * Check if key matches pattern
   */
  private matchesPattern(key: string, pattern: string): boolean {
    // Simple pattern matching with wildcards
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(key);
  }

  /**
   * Update hit rate statistics
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  /**
   * Start cleanup interval for expired entries
   */
  private startCleanupInterval(): void {
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 5 * 60 * 1000);
  }

  /**
   * Clean up expired entries from memory cache
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now > entry.timestamp + (entry.ttl * 1000)) {
        this.stats.totalSize -= entry.size;
        this.memoryCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      log.debug(`Cleaned up ${cleanedCount} expired cache entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { memoryEntries: number } {
    return {
      ...this.stats,
      memoryEntries: this.memoryCache.size
    };
  }

  /**
   * Clear all cache layers
   */
  async clear(): Promise<void> {
    try {
      // Clear memory cache
      this.memoryCache.clear();
      
      // Note: Cannot clear all KV entries without listing them first
      // In production, you'd maintain a list of cache keys
      
      // Reset stats
      this.stats = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        evictions: 0,
        totalSize: 0,
        hitRate: 0
      };

      log.info('Cache cleared');

    } catch (error) {
      log.error('Cache clear error', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmUp(keys: string[], fetcher: (key: string) => Promise<any>): Promise<void> {
    try {
      const promises = keys.map(async (key) => {
        try {
          const data = await fetcher(key);
          await this.set(key, data);
        } catch (error) {
          log.warn(`Cache warm-up failed for key: ${key}`, { 
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });

      await Promise.all(promises);
      log.info(`Cache warmed up with ${keys.length} entries`);

    } catch (error) {
      log.error('Cache warm-up error', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
