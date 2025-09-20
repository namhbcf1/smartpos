import { Hono } from 'hono';
import { Env } from '../../types';
import suppliersApiRouter from '../api/suppliers';

const app = new Hono<{ Bindings: Env }>();

// Mount the suppliers API routes
app.route('/', suppliersApiRouter);

export default app;
