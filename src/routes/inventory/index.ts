import { Hono } from 'hono';
import { Env } from '../../types';
import { authenticate, authorize } from '../../middleware/auth';
import { InventoryHandlers } from './handlers';

// Inventory routes
const app = new Hono<{ Bindings: Env }>();

// Initialize handlers
let handlers: InventoryHandlers;

// Initialize inventory module
app.use('*', async (c, next) => {
  if (!handlers) {
    handlers = new InventoryHandlers(c.env);
    await handlers.initialize();
  }
  await next();
});

// All routes require authentication
app.use('*', authenticate);

// GET /inventory/stats - Get inventory statistics (requires manager or admin role)
app.get('/stats', authorize(['admin', 'manager']), (c) => handlers.getStats(c));

// GET /inventory/locations - Get all locations
app.get('/locations', (c) => handlers.getLocations(c));

// GET /inventory/suppliers - Get all suppliers
app.get('/suppliers', (c) => handlers.getSuppliers(c));

// GET /inventory/low-stock - Get low stock items
app.get('/low-stock', (c) => handlers.getLowStockItems(c));

// GET /inventory/out-of-stock - Get out of stock items
app.get('/out-of-stock', (c) => handlers.getOutOfStockItems(c));

// GET /inventory - Get all inventory items with filtering and pagination
app.get('/', (c) => handlers.getInventoryItems(c));

// GET /inventory/:id - Get inventory item by ID
app.get('/:id', (c) => handlers.getInventoryItemById(c));

// POST /inventory - Create new inventory item (requires manager or admin role)
app.post('/', authorize(['admin', 'manager']), (c) => handlers.createInventoryItem(c));

// PUT /inventory/:id - Update inventory item (requires manager or admin role)
app.put('/:id', authorize(['admin', 'manager']), (c) => handlers.updateInventoryItem(c));

// POST /inventory/bulk-update - Bulk update inventory items (requires manager or admin role)
app.post('/bulk-update', authorize(['admin', 'manager']), (c) => handlers.bulkUpdateInventory(c));

export default app;
