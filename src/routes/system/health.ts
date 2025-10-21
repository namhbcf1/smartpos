import { Hono } from 'hono';
import { Env } from '../../types';

const router = new Hono<{ Bindings: Env }>();
router.get('/health', (c) => {
  return c.json({
    success: true,
    data: {
      status: 'healthy',
      service: 'smartpos-api',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    },
    message: 'SmartPOS API is running'
  });
});

router.get('/metrics', (c) => {
  return c.json({ success: true, message: 'metrics placeholder' });
});

export default router;

