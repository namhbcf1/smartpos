import { Hono } from 'hono';
import { Env } from '../../types';
import { InventoryForecastService } from '../../services/InventoryForecastService';

const app = new Hono<{ Bindings: Env }>();

// Get demand forecast for a specific product
app.get('/demand/:productId', async (c) => {
  try {
    const productId = c.req.param('productId');
    const tenantId = c.get('tenantId') || 'default';
    const forecastDays = parseInt(c.req.query('days') || '30');

    const service = new InventoryForecastService(c.env.DB);
    const forecast = await service.forecastDemand(productId, tenantId, forecastDays);

    if (!forecast) {
      return c.json({
        success: false,
        error: 'Product not found'
      }, 404);
    }

    return c.json({
      success: true,
      data: forecast
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get stockout risk analysis
app.get('/stockout-risks', async (c) => {
  try {
    const tenantId = c.get('tenantId') || 'default';
    const daysThreshold = parseInt(c.req.query('days') || '7');

    const service = new InventoryForecastService(c.env.DB);
    const risks = await service.getStockoutRisks(tenantId, daysThreshold);

    return c.json({
      success: true,
      data: risks,
      count: risks.length
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get reorder recommendations
app.get('/reorder-recommendations', async (c) => {
  try {
    const tenantId = c.get('tenantId') || 'default';

    const service = new InventoryForecastService(c.env.DB);
    const recommendations = await service.getReorderRecommendations(tenantId);

    return c.json({
      success: true,
      data: recommendations,
      count: recommendations.length
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get inventory health overview
app.get('/health', async (c) => {
  try {
    const tenantId = c.get('tenantId') || 'default';

    const service = new InventoryForecastService(c.env.DB);
    const health = await service.getInventoryHealth(tenantId);

    return c.json({
      success: true,
      data: health
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;
