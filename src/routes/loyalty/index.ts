import { Hono } from 'hono';
import { Env } from '../../types';
import { LoyaltyProgramService } from '../../services/LoyaltyProgramService';

const app = new Hono<{ Bindings: Env }>();

app.post('/award', async (c) => {
  try {
    const { customerId, points, reason, orderId } = await c.req.json();
    const tenantId = c.get('tenantId') || 'default';
    const service = new LoyaltyProgramService(c.env.DB);
    await service.awardPoints(customerId, points, reason, orderId, tenantId);
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post('/redeem', async (c) => {
  try {
    const { customerId, points, reason } = await c.req.json();
    const tenantId = c.get('tenantId') || 'default';
    const service = new LoyaltyProgramService(c.env.DB);
    const success = await service.redeemPoints(customerId, points, reason, tenantId);
    return c.json({ success });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.get('/transactions/:customerId', async (c) => {
  try {
    const customerId = c.req.param('customerId');
    const tenantId = c.get('tenantId') || 'default';
    const service = new LoyaltyProgramService(c.env.DB);
    const data = await service.getTransactions(customerId, tenantId);
    return c.json({ success: true, data });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.get('/stats', async (c) => {
  try {
    const tenantId = c.get('tenantId') || 'default';
    const service = new LoyaltyProgramService(c.env.DB);
    const data = await service.getTierStats(tenantId);
    return c.json({ success: true, data });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post('/update-tiers', async (c) => {
  try {
    const tenantId = c.get('tenantId') || 'default';
    const service = new LoyaltyProgramService(c.env.DB);
    const result = await service.updateTiersForAllCustomers(tenantId);
    return c.json({ success: true, ...result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;
