import { Hono } from 'hono';
import { Env } from '../../types';

const router = new Hono<{ Bindings: Env }>();

router.get('/openapi.json', (c) => {
  const doc = {
    openapi: '3.0.0',
    info: { title: 'SmartPOS API', version: '1.0.0' },
    servers: [{ url: '/api/v1' }],
    paths: {
      '/health': { get: { summary: 'Health', responses: { '200': { description: 'ok' } } } },
      '/products': { get: { summary: 'List products', responses: { '200': { description: 'ok' } } } },
      '/customers': { get: { summary: 'List customers', responses: { '200': { description: 'ok' } } } },
    },
  };
  return c.json(doc);
});

export default router;


