import { Hono } from 'hono';
import paymentsApi from '../api/payments';

const app = new Hono();

app.route('/', paymentsApi);

export default app;

