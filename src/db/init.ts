import { Env } from '../types';
// SCHEMA FIXED: Use unified schema as single source of truth
import { schema } from '../schema';

/**
 * Initialize the database with schema and seed data
 */
export async function initializeDatabase(env: Env): Promise<boolean> {
  try {
    // Split the SQL commands by semicolon
    const commands = schema
      .split(';')
      .map(command => command.trim())
      .filter(command => command.length > 0);

    // Execute each command
    for (const command of commands) {
      await env.DB.exec(command + ';');
    }

    // Cache initial data in KV
    await cacheInitialData(env);
    
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}

/**
 * Cache frequently accessed data in KV store
 */
async function cacheInitialData(env: Env): Promise<void> {
  // Cache all categories
  const categories = await env.DB.prepare(`
    SELECT * FROM categories ORDER BY sort_order, name
  `).all();
  await env.CACHE.put('categories:all', JSON.stringify(categories.results));
  
  // Cache active products
  const products = await env.DB.prepare(`
    SELECT
      p.id, p.name, p.description, p.sku, p.barcode,
      p.price_cents, p.cost_price_cents,
      p.stock, p.is_active,
      p.category_id, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = 1
    ORDER BY p.name
    LIMIT 100
  `).all();
  await env.CACHE.put('products:active', JSON.stringify(products.results));
  
  // Cache settings
  const settings = await env.DB.prepare(`
    SELECT key, value FROM settings
  `).all();
  const settingsObject = settings.results.reduce((acc: Record<string, string>, setting: any) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {});
  
  await env.CACHE.put('settings:1', JSON.stringify(settingsObject));
}

/**
 * Check if database is initialized
 */
export async function isDatabaseInitialized(env: Env): Promise<boolean> {
  try {
    // Check if users table exists and has at least one record
    const result = await env.DB.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='users'
    `).first();
    if (!result) {
      return false;
    }
    
    const userCount = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first();
    return userCount && (userCount.count as number) > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Reset database for development
 */
export async function resetDatabase(env: Env): Promise<boolean> {
  // Only allowed in development environment
  if (env.ENVIRONMENT !== 'development') {
    return false;
  }
  
  try {
    // Get all tables
    const tables = await env.DB.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all();
    // Drop all tables
    for (const table of tables.results) {
      await env.DB.exec(`DROP TABLE IF EXISTS ${table.name}`);
    }
    
    // Clear all KV data
    const cacheKeys = await env.CACHE.list();
    for (const key of cacheKeys.keys) {
      await env.CACHE.delete(key.name);
    }
    
    // Initialize fresh database
    return await initializeDatabase(env);
  } catch (error) {
    console.error('Error resetting database:', error);
    return false;
  }
} 