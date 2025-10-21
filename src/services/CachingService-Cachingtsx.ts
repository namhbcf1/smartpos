import { Env } from '../types';

type Strategy = 'LRU' | 'LFU' | 'FIFO';

export class CachingService_Cachingtsx {
  private memory = new Map<string, { value: any; ts: number; ttl: number; hits: number }>();
  constructor(private env: Env, private defaultTtl: number = 3600, private maxSize: number = 1000, private strategy: Strategy = 'LRU') {}

  async get<T>(key: string): Promise<T | null> {
    const m = this.memory.get(key);
    if (m && Date.now() < m.ts + m.ttl * 1000) {
      m.hits++;
      return m.value as T;
    }
    this.memory.delete(key);
    const kv = await this.env.CACHE_KV?.get(key, 'json');
    if (kv != null) {
      this.setInMemory(key, kv, this.defaultTtl);
      return kv as T;
    }
    return null;
  }

  async set<T>(key: string, value: T, ttl: number = this.defaultTtl): Promise<void> {
    this.setInMemory(key, value, ttl);
    await this.env.CACHE_KV?.put(key, JSON.stringify(value), { expirationTtl: ttl });
  }

  async delete(key: string): Promise<void> {
    this.memory.delete(key);
    await this.env.CACHE_KV?.delete(key);
  }

  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttl: number = this.defaultTtl): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const data = await fetcher();
    await this.set(key, data, ttl);
    return data;
  }

  invalidatePrefix(prefix: string): void {
    for (const k of Array.from(this.memory.keys())) {
      if (k.startsWith(prefix)) this.memory.delete(k);
    }
  }

  stats() {
    return { memoryEntries: this.memory.size };
  }

  private setInMemory(key: string, value: any, ttl: number) {
    if (this.memory.size >= this.maxSize) this.evictOne();
    this.memory.set(key, { value, ts: Date.now(), ttl, hits: 1 });
  }

  private evictOne() {
    if (this.memory.size === 0) return;
    const entries = Array.from(this.memory.entries());
    let candidate = entries[0];
    for (const e of entries) {
      if (this.strategy === 'LRU') {
        if (e[1].ts < candidate[1].ts) candidate = e;
      } else if (this.strategy === 'LFU') {
        if (e[1].hits < candidate[1].hits) candidate = e;
      } else {
        // FIFO: older ts first
        if (e[1].ts < candidate[1].ts) candidate = e;
      }
    }
    this.memory.delete(candidate[0]);
  }
}

export default CachingService_Cachingtsx;

