import { Hono } from 'hono';
import { Env } from '../../types';
import { authenticate, authorize } from '../../middleware/auth';
import { CustomersHandlers } from './handlers';

// Customers routes
const app = new Hono<{ Bindings: Env }>();

// Initialize handlers
let handlers: CustomersHandlers;

// Initialize customers module
app.use('*', async (c, next) => {
  if (!handlers) {
    handlers = new CustomersHandlers(c.env);
    await handlers.initialize();
  }
  await next();
});

// All routes require authentication
app.use('*', authenticate);

// GET /customers/stats - Get customer statistics (no auth for testing)
app.get('/stats', (c) => handlers.getStats(c));

// GET /customers/cities - Get customer cities (no auth for testing)
app.get('/cities', (c) => handlers.getCities(c));

// GET /customers/search - Search customers
app.get('/search', (c) => handlers.searchCustomers(c));

// GET /customers/vip - Get VIP customers
app.get('/vip', (c) => handlers.getVIPCustomers(c));

// GET /customers/recent - Get recent customers
app.get('/recent', (c) => handlers.getRecentCustomers(c));

// GET /customers/simple - Simple test endpoint
app.get('/simple', async (c) => {
  try {
    const customers = await c.env.DB.prepare(`
      SELECT id, full_name, phone, email, loyalty_points
      FROM customers
      LIMIT 10
    `).all();

    return c.json({
      success: true,
      data: customers.results || [],
      message: 'Simple customers query successful'
    });
  } catch (error) {
    return c.json({
      success: false,
      message: 'Error: ' + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});

// GET /customers - Get all customers with filtering and pagination
app.get('/', (c) => handlers.getCustomers(c));

// GET /customers/:id - Get customer by ID
app.get('/:id', (c) => handlers.getCustomerById(c));

// POST /customers - Create new customer
app.post('/', (c) => handlers.createCustomer(c));

// PUT /customers/:id - Update customer
app.put('/:id', (c) => handlers.updateCustomer(c));

// POST /customers/:id/loyalty-points - Add loyalty points
app.post('/:id/loyalty-points', (c) => handlers.addLoyaltyPoints(c));

export default app;
