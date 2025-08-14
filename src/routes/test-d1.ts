/**
 * Test D1 Database Connection
 * Simple endpoint to test D1 database connectivity and data
 */

import { Hono } from 'hono';
import { Env } from '../types';

const app = new Hono<{ Bindings: Env }>();

// Test D1 connection and data
app.get('/', async (c) => {
  try {
    // Test products
    const products = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM products
    `).first<{ count: number }>();

    // Test customers
    const customers = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM customers
    `).first<{ count: number }>();

    // Test categories
    const categories = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM categories
    `).first<{ count: number }>();

    // Database health check (no sample data - rules.md compliant)
    const healthStatus = await c.env.DB.prepare(`
      SELECT 1 as healthy
    `).first<{ healthy: number }>();

    return c.json({
      success: true,
      message: 'Database health check passed',
      data: {
        status: 'healthy',
        connectivity: healthStatus?.healthy === 1,
        counts: {
          products: products?.count || 0,
          customers: customers?.count || 0,
          categories: categories?.count || 0
        }
      }
    });
  } catch (error) {
    console.error('D1 Test Error:', error);
    return c.json({
      success: false,
      message: 'D1 Database Error: ' + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});

export default app;
