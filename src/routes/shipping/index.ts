import { Hono } from 'hono';
import shippingApi from '../api/shipping';

const app = new Hono();

app.route('/', shippingApi);

export default app;

