import { Hono } from 'hono';
import { authenticate } from '../../middleware/auth';

const app = new Hono();

// Apply authentication middleware to all routes
app.use('*', authenticate);

// GET /api/debug/schema - Check current database schema
app.get('/schema', async (c: any) => {
  try {
    const tables = [];

    // Get all table names
    const tableQuery = await c.env.DB.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all();

    for (const table of tableQuery.results || []) {
      const tableName = table.name;

      // Get table schema
      const schemaQuery = await c.env.DB.prepare(`PRAGMA table_info(${tableName})`).all();

      // Get indexes
      const indexQuery = await c.env.DB.prepare(`PRAGMA index_list(${tableName})`).all();

      // Get foreign keys
      const fkQuery = await c.env.DB.prepare(`PRAGMA foreign_key_list(${tableName})`).all();

      tables.push({
        name: tableName,
        columns: schemaQuery.results || [],
        indexes: indexQuery.results || [],
        foreign_keys: fkQuery.results || []
      });
    }

    // Get views
    const viewQuery = await c.env.DB.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='view'
      ORDER BY name
    `).all();

    // Get triggers
    const triggerQuery = await c.env.DB.prepare(`
      SELECT name, sql FROM sqlite_master
      WHERE type='trigger'
      ORDER BY name
    `).all();

    return c.json({
      success: true,
      data: {
        tables,
        views: viewQuery.results || [],
        triggers: triggerQuery.results || [],
        database_info: {
          total_tables: tables.length,
          total_views: (viewQuery.results || []).length,
          total_triggers: (triggerQuery.results || []).length
        }
      }
    });

  } catch (error) {
    console.error('Schema check error:', error);
    return c.json({
      success: false,
      message: 'Failed to check schema',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET /api/debug/tables - List all tables with row counts
app.get('/tables', async (c: any) => {
  try {
    const tables = [];

    // Get all table names
    const tableQuery = await c.env.DB.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all();

    for (const table of tableQuery.results || []) {
      const tableName = table.name;

      try {
        // Get row count
        const countQuery = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).first();

        tables.push({
          name: tableName,
          row_count: countQuery?.count || 0
        });
      } catch (e) {
        tables.push({
          name: tableName,
          row_count: 'Error',
          error: e instanceof Error ? e.message : 'Unknown error'
        });
      }
    }

    return c.json({
      success: true,
      data: tables
    });

  } catch (error) {
    console.error('Tables check error:', error);
    return c.json({
      success: false,
      message: 'Failed to check tables',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default app;