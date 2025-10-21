import { Hono } from 'hono';
import { Env } from '../../types';
import { authenticate, authorize } from '../../middleware/auth';
import { UserHandlers } from './handlers';

// Users routes
const app = new Hono<{ Bindings: Env }>();
// Initialize handlers
let handlers: UserHandlers;

// Initialize users module
app.use('*', async (c, next) => {
  if (!handlers) {
    handlers = new UserHandlers(c.env);
    await handlers.initialize();
  }
  await next();
});

// All routes require authentication
app.use('*', authenticate);

// GET /users/me - Get current user profile
app.get('/me', (c) => handlers.getCurrentUser(c));

// PUT /users/me - Update current user profile
app.put('/me', (c) => handlers.updateCurrentUser(c));

// GET /users/stats - Get user statistics (requires admin or manager role)
app.get('/stats', authorize(['admin', 'manager']), (c) => handlers.getStats(c));

// GET /users - Get all users (requires admin or manager role)
app.get('/', authorize(['admin', 'manager']), (c) => handlers.getUsers(c));

// GET /users/username/:username - Get user by username (requires admin or manager role)
app.get('/username/:username', authorize(['admin', 'manager']), (c) => handlers.getUserByUsername(c));

// GET /users/employee/:employeeId - Get user by employee ID (requires admin or manager role)
app.get('/employee/:employeeId', authorize(['admin', 'manager']), (c) => handlers.getUserByEmployeeId(c));

// GET /users/:id - Get user by ID (requires admin or manager role)
app.get('/:id', authorize(['admin', 'manager']), (c) => handlers.getUserById(c));

// POST /users - Create new user (requires admin role)
app.post('/', authorize(['admin']), (c) => handlers.createUser(c));

// PUT /users/:id - Update user (requires admin role)
app.put('/:id', authorize(['admin']), (c) => handlers.updateUser(c));

// DELETE /users/:id - Delete user (requires admin role)
app.delete('/:id', authorize(['admin']), (c) => handlers.deleteUser(c));

export default app;
