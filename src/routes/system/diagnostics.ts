import { Hono } from 'hono';
import { Env } from '../../types';

const router = new Hono<{ Bindings: Env }>();

router.get('/db/test', async (c: any) => {
  try {
    const result = await c.env.DB.prepare('SELECT 1 as test').first();
    return c.json({ success: true, data: result });
  } catch (e) {
    return c.json({ success: false, error: e instanceof Error ? e.message : 'Unknown error' }, 500);
  }
});

export default router;


