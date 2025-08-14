import { Hono } from 'hono';
import { Env } from '../../types';
import { authenticate, authorize } from '../../middleware/auth';
import { SalesHandlers } from './handlers';

// Sales routes
const app = new Hono<{ Bindings: Env }>();

// Initialize handlers
let handlers: SalesHandlers;

// Initialize sales module
app.use('*', async (c, next) => {
  try {
    if (!handlers) {
      console.log('Initializing SalesHandlers...');
      handlers = new SalesHandlers(c.env);
      await handlers.initialize();
      console.log('SalesHandlers initialized successfully');
    }
    await next();
  } catch (error) {
    console.error('Error initializing SalesHandlers:', error);
    return c.json({
      success: false,
      message: 'Failed to initialize sales module: ' + (error as Error).message
    }, 500);
  }
});

// All routes require authentication except test and summary
app.use('*', async (c, next) => {
  if (c.req.path.endsWith('/test') || c.req.path.endsWith('/summary')) {
    await next();
  } else {
    await authenticate(c, next);
  }
});

// Test endpoint (no auth required)
app.get('/test', async (c) => {
  try {
    return c.json({
      success: true,
      message: 'Sales module is working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      success: false,
      message: 'Sales module test failed: ' + (error as Error).message
    }, 500);
  }
});

// GET /sales/summary - Get sales summary for a specific date
app.get('/summary', (c) => handlers.getSalesSummary(c));

// GET /sales/stats - Get sales statistics (no auth for testing)
app.get('/stats', (c) => handlers.getStats(c));

// GET /sales/today - Get today's sales summary
app.get('/today', (c) => handlers.getTodaysSummary(c));

// GET /sales/recent - Get recent sales
app.get('/recent', (c) => handlers.getRecentSales(c));

// GET /sales - Get all sales with filtering and pagination
app.get('/', (c) => handlers.getSales(c));

// GET /sales/:id - Get sale by ID
app.get('/:id', (c) => handlers.getSaleById(c));

// POST /sales - Create new sale
app.post('/', (c) => handlers.createSale(c));

// POST /sales/quick - Create quick sale for POS
app.post('/quick', (c) => handlers.createQuickSale(c));

// PUT /sales/:id - Update sale
app.put('/:id', (c) => handlers.updateSale(c));

// POST /sales/:id/print-receipt - Print receipt
app.post('/:id/print-receipt', (c) => handlers.printReceipt(c));

export default app;
