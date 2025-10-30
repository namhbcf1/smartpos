// Main types export file for SmartPOS API
export type { Category, Customer, Order, Product, User, Pagination, ApiResponse } from './api';
export * from './database';
export * from './warranty';

// Additional type definitions
export type UserRole = 'admin' | 'manager' | 'cashier' | 'employee' | 'inventory' | 'sales_agent' | 'affiliate';

export interface JwtPayload {
  sub: string;
  username: string;
  role: UserRole;
  store: number;
  iat: number;
  exp: number;
  tenantId?: string;
}

// Cloudflare Bindings
export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  SESSIONS_KV: KVNamespace;
  CONFIG: KVNamespace;
  ANALYTICS: KVNamespace;
  R2_BUCKET: any; // R2Bucket;
  AI: any; // Cloudflare Workers AI

  // Durable Objects - Match wrangler.toml bindings
  INVENTORY: DurableObjectNamespace;
  SESSIONS: DurableObjectNamespace;
  NOTIFICATIONS: DurableObjectNamespace;
  INVENTORY_SYNC: DurableObjectNamespace;
  POS_SYNC: DurableObjectNamespace;
  WARRANTY_SYNC: DurableObjectNamespace;

  // Environment variables
  JWT_SECRET: string;
  ENCRYPTION_KEY: string;
  ENVIRONMENT: string;
  RATE_LIMIT_ENABLED: string;
  ENABLE_REAL_TIME: string;

  // AI / Ollama proxy (Legacy - now using Cloudflare AI)
  OLLAMA_BASE_URL?: string; // e.g. http://your-vm:11434
  OLLAMA_MODEL?: string;    // default: llama3:8b
  OLLAMA_PROXY_KEY?: string; // optional x-api-key to protect the proxy
  AI_PROVIDER?: 'cloudflare' | 'ollama' | 'openai'; // 'cloudflare' (default) or 'ollama' or 'openai'
  OLLAMA_DEFAULT_OPTIONS_JSON?: string; // JSON string for default options (ollama only)
}