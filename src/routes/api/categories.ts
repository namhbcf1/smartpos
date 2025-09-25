import { Hono } from 'hono';
import { Env } from '../../types';
import { authenticate } from '../../middleware/auth';

const app = new Hono<{ Bindings: Env }>();

// Apply authentication middleware to all routes
app.use('*', authenticate);

// GET /api/categories/names - Get category names only (D1)
app.get('/names', async (c: any) => {
  try {
    const query = `
      SELECT id, name
      FROM categories
      WHERE is_active = 1
      ORDER BY name ASC
    `;

    const dataRes = await c.env.DB.prepare(query).all();

    return c.json({
      success: true,
      data: dataRes.results || [],
      message: 'Category names retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching category names:', error);
    return c.json({ 
      success: false, 
      message: 'Failed to fetch category names: ' + (error as Error).message 
    }, 500);
  }
});

// GET /api/categories - List all categories with search and pagination (D1)
app.get('/', async (c: any) => {
  try {
    const { q, page = '1', limit = '50', sortBy = 'name', sortDirection = 'asc' } = c.req.query();
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const allowedSortFields = ['name', 'description'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'name';
    const sortDir = sortDirection && sortDirection.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    let whereClause = '';
    const params: any[] = [];
    if (q) {
      whereClause = 'WHERE name LIKE ? OR description LIKE ?';
      params.push(`%${q}%`, `%${q}%`);
    }

    // Simplified query with only basic columns that exist
    const query = `
      SELECT
        id, name, description
      FROM categories
      ${whereClause}
      ORDER BY ${sortField} ${sortDir}
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM categories
      ${whereClause}
    `;

    // First ensure categories table exists and has some data
    let hasData = false;
    try {
      const testRes = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM categories`).first();
      hasData = testRes?.count > 0;
    } catch {
      // Table doesn't exist, return empty result
      return c.json({
        success: true,
        data: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          totalPages: 0
        },
        message: 'Categories table not initialized'
      });
    }

    const [dataRes, countRes] = await Promise.all([
      c.env.DB.prepare(query).bind(...params, parseInt(limit), offset).all(),
      c.env.DB.prepare(countQuery).bind(...params).first()
    ]);

    return c.json({
      success: true,
      data: dataRes.results || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countRes?.total || 0,
        totalPages: Math.ceil((countRes?.total || 0) / parseInt(limit))
      },
      message: 'Categories retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return c.json({ success: false, message: 'Failed to fetch categories: ' + (error as Error).message }, 500);
  }
});

// GET /api/categories/:id - Get category by ID (D1)
app.get('/:id', async (c: any) => {
  try {
    const id = c.req.param('id');

    // Simplified query to avoid GROUP BY issues
    const category = await c.env.DB.prepare(`
      SELECT id, name, description, is_active, created_at, updated_at
      FROM categories
      WHERE id = ?
    `).bind(id).first();

    if (!category) {
      return c.json({
        success: false,
        message: 'Category not found'
      }, 404);
    }

    // Get product count separately if needed
    const productCount = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM products
      WHERE category_id = ? AND (is_active = 1 OR isActive = 1)
    `).bind(id).first();

    return c.json({
      success: true,
      data: {
        ...category,
        product_count: productCount?.count || 0
      }
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    return c.json({
      success: false,
      message: 'Failed to fetch category'
    }, 500);
  }
});

// POST /api/categories - Create new category (D1)
app.post('/', async (c: any) => {
  try {
    const data = await c.req.json();
    console.log('Category creation request:', JSON.stringify(data, null, 2));
    
    if (!data || !data.name) {
      return c.json({
        success: false,
        message: 'Category name is required'
      }, 400);
    }

    // Generate unique ID for category
    const category_id = `cat-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    // Insert new category with normalized schema (snake_case)
    const result = await c.env.DB.prepare(`
      INSERT INTO categories (id, name, description, is_active, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(
      category_id,
      data.name,
      data.description || null,
      data.is_active !== undefined ? data.is_active : (data.isActive !== undefined ? data.isActive : 1)
    ).run();

    if (!result.success) {
      throw new Error('Failed to create category');
    }

    // Get the created category - simplified query
    const category = await c.env.DB.prepare(`
      SELECT id, name, description, is_active, created_at, updated_at
      FROM categories
      WHERE id = ?
    `).bind(category_id).first();

    console.log('Category created successfully:', category);

    return c.json({
      success: true,
      data: category,
      message: 'Category created successfully'
    }, 201);
  } catch (error) {
    console.error('Error creating category:', error);
    console.error('Error details:', (error as any).message);
    console.error('Error stack:', (error as any).stack);
    return c.json({
      success: false,
      message: 'Failed to create category: ' + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});

// PUT /api/categories/:id - Update category (D1)
app.put('/:id', async (c: any) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    console.log('Category update request:', JSON.stringify(data, null, 2));
    
    if (!data) {
      return c.json({
        success: false,
        message: 'Request body is required'
      }, 400);
    }

    // Check if category exists
    const existingCategory = await c.env.DB.prepare(`
      SELECT id FROM categories WHERE id = ?
    `).bind(id).first();

    if (!existingCategory) {
      return c.json({
        success: false,
        message: 'Category not found'
      }, 404);
    }

    // Update category using normalized schema
    const result = await c.env.DB.prepare(`
      UPDATE categories
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          is_active = COALESCE(?, is_active),
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      data.name || null,
      data.description || null,
      (data.is_active !== undefined ? data.is_active : (data.isActive !== undefined ? data.isActive : null)),
      id
    ).run();

    if (!result.success) {
      throw new Error('Failed to update category');
    }

    // Get the updated category - simplified query
    const category = await c.env.DB.prepare(`
      SELECT id, name, description, is_active, created_at, updated_at
      FROM categories
      WHERE id = ?
    `).bind(id).first();

    console.log('Category updated successfully:', category);

    return c.json({
      success: true,
      data: category,
      message: 'Category updated successfully'
    });
  } catch (error) {
    console.error('Error updating category:', error);
    console.error('Error details:', (error as any).message);
    console.error('Error stack:', (error as any).stack);
    return c.json({
      success: false,
      message: 'Failed to update category: ' + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});

// DELETE /api/categories/:id - Delete category (D1)
app.delete('/:id', async (c: any) => {
  try {
    const id = c.req.param('id');
    console.log('Category delete request for ID:', id);
    
    // Check if category exists
    const existingCategory = await c.env.DB.prepare(`
      SELECT id, name FROM categories WHERE id = ?
    `).bind(id).first();

    if (!existingCategory) {
      return c.json({
        success: false,
        message: 'Category not found'
      }, 404);
    }

    // Check if category has products
    const productCount = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM products WHERE category_id = ? AND is_active = 1
    `).bind(id).first();

    if (productCount && productCount.count > 0) {
      return c.json({
        success: false,
        message: `Cannot delete category. It has ${productCount.count} active products. Please move or delete the products first.`
      }, 400);
    }

    // Delete category
    const result = await c.env.DB.prepare(`
      DELETE FROM categories WHERE id = ?
    `).bind(id).run();

    if (!result.success) {
      throw new Error('Failed to delete category');
    }

    console.log('Category deleted successfully:', existingCategory);

    return c.json({
      success: true,
      message: 'Category deleted successfully',
      data: {
        id: id,
        name: existingCategory.name,
        deleted_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    console.error('Error details:', (error as any).message);
    console.error('Error stack:', (error as any).stack);
    return c.json({
      success: false,
      message: 'Failed to delete category: ' + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});

export default app;