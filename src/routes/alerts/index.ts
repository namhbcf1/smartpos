import { Hono } from 'hono';
import alertsApi from '../api/alerts';

const app = new Hono();

app.route('/', alertsApi);

export default app;

