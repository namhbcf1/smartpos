import { Hono } from 'hono';
import { Env } from '../../types';
import { authenticate, authorize } from '../../middleware/auth';
import { ReturnsHandlers } from './handlers';

// Returns routes
const app = new Hono<{ Bindings: Env }>();

// Initialize handlers
let handlers: ReturnsHandlers;

// Initialize returns module
app.use('*', async (c, next) => {
  if (!handlers) {
    handlers = new ReturnsHandlers(c.env);
    await handlers.initialize();
  }
  await next();
});

// All routes require authentication
app.use('*', authenticate);

// GET /returns/stats - Get returns statistics (requires manager or admin role)
app.get('/stats', authorize(['admin', 'manager']), (c) => handlers.getStats(c));

// GET /returns/recent - Get recent returns
app.get('/recent', (c) => handlers.getRecentReturns(c));

// GET /returns/pending - Get pending returns
app.get('/pending', (c) => handlers.getPendingReturns(c));

// GET /returns - Get all returns with filtering and pagination
app.get('/', (c) => handlers.getReturns(c));

// GET /returns/:id - Get return by ID
app.get('/:id', (c) => handlers.getReturnById(c));

// POST /returns - Create new return
app.post('/', (c) => handlers.createReturn(c));

// PUT /returns/:id - Update return
app.put('/:id', (c) => handlers.updateReturn(c));

// POST /returns/:id/approve - Approve return (requires manager or admin role)
app.post('/:id/approve', authorize(['admin', 'manager']), (c) => handlers.approveReturn(c));

// POST /returns/:id/reject - Reject return (requires manager or admin role)
app.post('/:id/reject', authorize(['admin', 'manager']), (c) => handlers.rejectReturn(c));

// POST /returns/:id/complete - Complete return processing
app.post('/:id/complete', (c) => handlers.completeReturn(c));

export default app;
