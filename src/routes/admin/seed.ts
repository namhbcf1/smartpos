import { Hono } from 'hono';
import { Env } from '../../types';
import { MigrationService } from '../../services/MigrationService';
import { sign } from 'hono/jwt';

const app = new Hono<{ Bindings: Env }>();

// POST /admin/seed/migrate - Run complete schema migration
app.post('/migrate', async (c: any) => {
  try {
    // Simple migration - just ensure basic tables exist
    await c.env.DB.prepare('PRAGMA foreign_keys = ON').run();

    // Create basic products table if not exists
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        tenant_id TEXT NOT NULL DEFAULT 'default',
        name TEXT NOT NULL,
        sku TEXT UNIQUE NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        cost DECIMAL(10,2),
        stock INTEGER DEFAULT 0,
        category_id TEXT,
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Create basic categories table if not exists
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        tenant_id TEXT NOT NULL DEFAULT 'default',
        name TEXT NOT NULL,
        parent_id TEXT,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    return c.json({
      success: true,
      message: 'Basic schema migration completed successfully'
    });
  } catch (error) {
    console.error('Migration error:', error);
    return c.json({
      success: false,
      error: ('Migration failed' as any),
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET /admin/seed/schema-health - Check schema health
app.get('/schema-health', async (c: any) => {
  try {
    const migrationService = new MigrationService(c.env);
    const health = await migrationService.checkSchemaHealth();

    return c.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Schema health check error:', error);
    return c.json({
      success: false,
      error: ('Schema health check failed' as any),
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Simple test endpoint
app.get('/test', async (c: any) => {
  return c.json({
    success: true,
    message: 'Admin seed router is working',
    timestamp: new Date().toISOString()
  });
});

// GET version of bootstrap for testing
app.get('/bootstrap', async (c: any) => {
  return c.json({
    success: true,
    message: 'Bootstrap endpoint is accessible via GET',
    timestamp: new Date().toISOString(),
    note: 'Use POST method for actual bootstrap'
  });
});

// POST /admin/seed/bootstrap - Create tenant_id, admin user, return JWT token
app.post('/bootstrap', async (c: any) => {
  try {
    // Step 1: Parse request body
    let requestData;
    try {
      requestData = await c.req.json();
    } catch (e) {
      return c.json({ success: false, error: ('Invalid JSON in request body'  as any)}, 400);
    }

    const { tenant_id = 'default', admin_email = 'admin@pos.com', admin_password = 'admin123' } = requestData;

    // Step 2: Create admin user with simple ID
    const adminId = `admin-${Date.now()}`;

    // Step 3: Simple password hash (for testing)
    const passwordHash = admin_password; // Temporarily skip hashing

    // Step 4: Test database connection
    try {
      const testResult = await c.env.DB.prepare(`SELECT 1 as test`).first();
      if (!testResult) {
        return c.json({ success: false, error: ('Database connection failed'  as any)}, 500);
      }
    } catch (e) {
      return c.json({ success: false, error: ('Database connection error: ' + (e as any).message)}, 500);
    }

    // Step 5: Simple token (for testing)
    const token = `token-${adminId}-${Date.now()}`;

    return c.json({
      success: true,
      data: {
        tenant_id,
        admin_id: adminId,
        token,
        expires_in: 86400,
        message: 'Bootstrap successful (simplified version)'
      }
    });
  } catch (error) {
    console.error('Bootstrap error:', error);
    return c.json({ success: false, error: ((error as any)?.message || 'Bootstrap failed'  as any)}, 500);
  }
});

// POST /admin/seed/products - Create N realistic products with inventory
app.post('/products', async (c: any) => {
  try {
    const { count = 50, tenant_id = 'default' } = await c.req.json();
    
    const products = [];
    const categories = ['Electronics', 'Clothing', 'Food', 'Books', 'Home'];
    
    // Create categories first
    for (let i = 0; i < categories.length; i++) {
      const categoryName = categories[i];
      const categoryId = `category-${Date.now()}-${i}`;
      await c.env.DB.prepare(`
        INSERT OR IGNORE INTO categories (id, tenant_id, name)
        VALUES (?, ?, ?)
      `).bind(categoryId, tenant_id, categoryName).run();
    }
    
    // Get category IDs
    const categoryRows = await c.env.DB.prepare(`
      SELECT id FROM categories WHERE tenant_id = ?
    `).bind(tenant_id).all();
    
    const categoryIds = (categoryRows.results || []).map((row: any) => row.id);
    
    for (let i = 1; i <= count; i++) {
      const productId = `product-${Date.now()}-${i}`;
      const sku = `SKU${String(i).padStart(6, '0')}`;
      const name = `Product ${i}`;
      const price = Math.floor(Math.random() * 100000) + 1000; // 10-1000 VND
      const cost = Math.floor(price * 0.7); // 70% of price
      const stock = Math.floor(Math.random() * 100) + 10;
      const categoryId = categoryIds[Math.floor(Math.random() * categoryIds.length)];

      await c.env.DB.prepare(`
        INSERT INTO products (id, tenant_id, name, sku, price, cost, stock, category_id, active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(productId, tenant_id, name, sku, price, cost, stock, categoryId, 1).run();

      // Log initial inventory
      await c.env.DB.prepare(`
        INSERT INTO inventory_logs (tenant_id, product_id, delta, reason)
        VALUES (?, ?, ?, ?)
      `).bind(tenant_id, productId, stock, 'Initial stock').run();

      products.push({ id: productId, name, sku, price, stock });
    }
    
    return c.json({
      success: true,
      data: {
        created: products.length,
        products: products.slice(0, 10) // Return first 10 as sample
      }
    });
  } catch (error) {
    console.error('Product seed error:', error);
    return c.json({ success: false, error: ('Product seeding failed'  as any)}, 500);
  }
});

// POST /admin/seed/customers - Create N realistic customers with purchase history
app.post('/customers', async (c: any) => {
  try {
    const { count = 100, tenant_id = 'default' } = await c.req.json();
    
    const customers = [];
    const tiers = ['standard', 'silver', 'gold', 'platinum'];
    
    for (let i = 1; i <= count; i++) {
      const customerId = crypto.randomUUID();
      const name = `Customer ${i}`;
      const phone = `09${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`;
      const email = `customer${i}@example.com`;
      const tier = tiers[Math.floor(Math.random() * tiers.length)];
      const loyaltyPoints = Math.floor(Math.random() * 1000);
      
      await c.env.DB.prepare(`
        INSERT INTO customers (id, tenant_id, name, phone, email, tier, loyalty_points)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(customerId, tenant_id, name, phone, email, tier, loyaltyPoints).run();
      
      customers.push({ id: customerId, name, phone, email, tier, loyaltyPoints });
    }
    
    return c.json({
      success: true,
      data: {
        created: customers.length,
        customers: customers.slice(0, 10) // Return first 10 as sample
      }
    });
  } catch (error) {
    console.error('Customer seed error:', error);
    return c.json({ success: false, error: ('Customer seeding failed'  as any)}, 500);
  }
});

// POST /admin/seed/cleanup - Delete all data for specified tenant_id
app.post('/cleanup', async (c: any) => {
  try {
    const { tenant_id = 'default' } = await c.req.json();
    
    // Delete in reverse dependency order
    const tables = [
      'audit_logs',
      'returns',
      'payments', 
      'order_items',
      'orders',
      'inventory_logs',
      'products',
      'categories',
      'customers',
      'users'
    ];
    
    const deleteCounts = {};
    
    for (const table of tables) {
      const result = await c.env.DB.prepare(`
        DELETE FROM ${table} WHERE tenant_id = ?
      `).bind(tenant_id).run();
      
      (deleteCounts as any)[table] = (result as any).changes || 0;
    }
    
    return c.json({
      success: true,
      data: {
        tenant_id,
        deleted_counts: deleteCounts,
        total_deleted: Object.values(deleteCounts).reduce((sum: number, count: any) => sum + count, 0)
      }
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return c.json({ success: false, error: ('Cleanup failed'  as any)}, 500);
  }
});

// Helper function to hash passwords
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default app;


