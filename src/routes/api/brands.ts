import { Hono } from 'hono';
import { Env } from '../../types';

const app = new Hono<{ Bindings: Env }>();

// GET /api/brands - List all brands
app.get('/', async (c: any) => {
  try {
    const tenantId = c.req.header('X-Tenant-ID') || 'default';
    
    // Check if brands table exists and create sample data if needed
    let hasBrands = true;
    try {
      await c.env.DB.prepare(`SELECT COUNT(*) as count FROM brands LIMIT 1`).first();
    } catch (tableError) {
      hasBrands = false;
    }
    
    if (!hasBrands) {
      // Create brands table and sample data
      try {
        await c.env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS brands (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            logo_url TEXT,
            website TEXT,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `).run();

        // Insert sample brands
        await c.env.DB.prepare(`
          INSERT OR IGNORE INTO brands (id, name, description, logo_url, website, is_active, created_at)
          VALUES 
            ('brand-001', 'Starbucks', 'Thương hiệu cà phê nổi tiếng thế giới', 'https://logo.clearbit.com/starbucks.com', 'https://starbucks.com', 1, '2025-09-14 10:00:00'),
            ('brand-002', 'McDonald\'s', 'Thương hiệu thức ăn nhanh toàn cầu', 'https://logo.clearbit.com/mcdonalds.com', 'https://mcdonalds.com', 1, '2025-09-14 10:00:00'),
            ('brand-003', 'KFC', 'Gà rán Kentucky', 'https://logo.clearbit.com/kfc.com', 'https://kfc.com', 1, '2025-09-14 10:00:00'),
            ('brand-004', 'Pizza Hut', 'Pizza và đồ ăn Ý', 'https://logo.clearbit.com/pizzahut.com', 'https://pizzahut.com', 1, '2025-09-14 10:00:00'),
            ('brand-005', 'Subway', 'Bánh mì sandwich tươi', 'https://logo.clearbit.com/subway.com', 'https://subway.com', 1, '2025-09-14 10:00:00')
        `).run();

        console.log('✅ Brands table created with sample data');
      } catch (createError) {
        console.error('Error creating brands table:', createError);
        return c.json({
          success: true,
          data: []
        });
      }
    }

    const brands = await c.env.DB.prepare(`
      SELECT id, name, description, logo_url, website, is_active, created_at, updated_at
      FROM brands 
      WHERE is_active = 1
      ORDER BY name
    `).all();

    return c.json({
      success: true,
      data: brands.results || []
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return c.json({
      success: false,
      message: 'Failed to fetch brands'
    }, 500);
  }
});

// GET /api/brands/:id - Get brand by ID
app.get('/:id', async (c: any) => {
  try {
    const id = c.req.param('id');
    
    const brand = await c.env.DB.prepare(`
      SELECT id, name, description, logo_url, website, is_active, created_at, updated_at
      FROM brands 
      WHERE id = ?
    `).bind(id).first();

    if (!brand) {
      return c.json({
        success: false,
        message: 'Brand not found'
      }, 404);
    }

    return c.json({
      success: true,
      data: brand
    });
  } catch (error) {
    console.error('Error fetching brand:', error);
    return c.json({
      success: false,
      message: 'Failed to fetch brand'
    }, 500);
  }
});

// POST /api/brands - Create new brand
app.post('/', async (c: any) => {
  try {
    const data = await c.req.json();
    
    if (!data.name) {
      return c.json({
        success: false,
        message: 'Brand name is required'
      }, 400);
    }

    const id = `brand-${Date.now()}`;
    
    await c.env.DB.prepare(`
      INSERT INTO brands (id, name, description, logo_url, website, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      id,
      data.name,
      data.description || null,
      data.logo_url || null,
      data.website || null,
      data.is_active !== false ? 1 : 0
    ).run();

    const newBrand = await c.env.DB.prepare(`
      SELECT id, name, description, logo_url, website, is_active, created_at, updated_at
      FROM brands 
      WHERE id = ?
    `).bind(id).first();

    return c.json({
      success: true,
      data: newBrand,
      message: 'Brand created successfully'
    }, 201);
  } catch (error) {
    console.error('Error creating brand:', error);
    return c.json({
      success: false,
      message: 'Failed to create brand'
    }, 500);
  }
});

// PUT /api/brands/:id - Update brand
app.put('/:id', async (c: any) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    
    const updateResult = await c.env.DB.prepare(`
      UPDATE brands 
      SET 
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        logo_url = COALESCE(?, logo_url),
        website = COALESCE(?, website),
        is_active = COALESCE(?, is_active),
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      data.name || null,
      data.description || null,
      data.logo_url || null,
      data.website || null,
      data.is_active !== undefined ? (data.is_active ? 1 : 0) : null,
      id
    ).run();

    if ((updateResult as any).changes === 0) {
      return c.json({
        success: false,
        message: 'Brand not found'
      }, 404);
    }

    const updatedBrand = await c.env.DB.prepare(`
      SELECT id, name, description, logo_url, website, is_active, created_at, updated_at
      FROM brands 
      WHERE id = ?
    `).bind(id).first();

    return c.json({
      success: true,
      data: updatedBrand,
      message: 'Brand updated successfully'
    });
  } catch (error) {
    console.error('Error updating brand:', error);
    return c.json({
      success: false,
      message: 'Failed to update brand'
    }, 500);
  }
});

// DELETE /api/brands/:id - Delete brand
app.delete('/:id', async (c: any) => {
  try {
    const id = c.req.param('id');
    
    const deleteResult = await c.env.DB.prepare(`
      DELETE FROM brands WHERE id = ?
    `).bind(id).run();

    if ((deleteResult as any).changes === 0) {
      return c.json({
        success: false,
        message: 'Brand not found'
      }, 404);
    }

    return c.json({
      success: true,
      message: 'Brand deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting brand:', error);
    return c.json({
      success: false,
      message: 'Failed to delete brand'
    }, 500);
  }
});

export default app;
