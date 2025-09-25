// Main types export file for SmartPOS API
export type { Category, Customer, Order, Product, User, Pagination, ApiResponse } from './api';
export * from './database';
export * from './warranty';

// Cloudflare Bindings
export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  SESSIONS_KV: KVNamespace;
  CONFIG: KVNamespace;
  ANALYTICS: KVNamespace;
  R2_BUCKET: any; // R2Bucket;

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
}