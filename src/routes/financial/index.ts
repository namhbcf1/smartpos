import { Hono } from 'hono';
import financialApi from '../api/financial';

const app = new Hono();

app.route('/', financialApi);

export default app;

