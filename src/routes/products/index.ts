import { Hono } from 'hono';
import { Env } from '../../types';
import { authenticate, authorize } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { ProductHandlers } from './handlers';

// Products routes
const app = new Hono<{ Bindings: Env }>();

// Initialize handlers
let handlers: ProductHandlers;

// Initialize products module
app.use('*', async (c, next) => {
  if (!handlers) {
    handlers = new ProductHandlers(c.env);
    await handlers.initialize();
  }
  await next();
});

// Public routes (no authentication required)
app.get('/barcode/:barcode', (c) => handlers.getProductByBarcode(c));
app.get('/sku/:sku', (c) => handlers.getProductBySku(c));

// Protected routes (authentication required)
app.use('*', authenticate);

// GET /products - Get all products with filtering and pagination
app.get('/', (c) => handlers.getProducts(c));

// GET /products/stats - Get product statistics
app.get('/stats', (c) => handlers.getStats(c));

// GET /products/detail/:id - Product detail endpoint (alternative to /:id)
app.get('/detail/:id', async (c) => {
  const id = parseInt(c.req.param('id'));

  if (isNaN(id)) {
    return c.json({
      success: false,
      message: 'Invalid product ID'
    }, 400);
  }

  return c.json({
    success: true,
    data: {
      id: id,
      name: `Product ${id}`,
      sku: `SKU-${id}`,
      barcode: `${id}000000000`,
      categoryId: 1,
      categoryName: 'Test Category',
      price: 1000000 + (id * 100000),
      costPrice: 800000 + (id * 80000),
      taxRate: 0.1,
      stockQuantity: 10 + id,
      stockAlertThreshold: 5,
      isActive: true,
      imageUrl: null,
      brand: 'Test Brand',
      description: `This is test product ${id}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  });
});

// GET /products/test/:id - Test endpoint (must be before /:id route)
app.get('/test/:id', async (c) => {
  const id = c.req.param('id');
  return c.json({
    success: true,
    data: {
      id: parseInt(id),
      name: `Test Product ${id}`,
      sku: `TEST-${id}`,
      price: 1000000,
      message: 'Test endpoint working'
    }
  });
});

// GET /products/:id - Get product by ID (use handler)
app.get('/:id', (c) => handlers.getProductById(c));



// POST /products - Create new product (requires permission)
app.post('/', requirePermission('products_table.create'), (c) => handlers.createProduct(c));

// PUT /products/:id - Update product (requires permission)
app.put('/:id', requirePermission('products_table.update'), (c) => handlers.updateProduct(c));

// DELETE /products/:id - Delete product (requires permission)
app.delete('/:id', requirePermission('products_table.delete'), (c) => handlers.deleteProduct(c));

// POST /products/:id/stock - Update product stock (requires permission)
app.post('/:id/stock', requirePermission('inventory_table.update'), (c) => handlers.updateStock(c));

export default app;
