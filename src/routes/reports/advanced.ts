import { Hono } from 'hono';
import { Env } from '../../types';
import { AdvancedReportsService } from '../../services/AdvancedReportsService';

const app = new Hono<{ Bindings: Env }>();

// Sales by product
app.get('/sales/products', async (c) => {
  try {
    const tenantId = c.get('tenantId') || 'default';
    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');
    const categoryId = c.req.query('category_id');

    const service = new AdvancedReportsService(c.env.DB);
    const data = await service.getSalesByProduct(tenantId, startDate, endDate, categoryId);

    return c.json({ success: true, data });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Sales by category
app.get('/sales/categories', async (c) => {
  try {
    const tenantId = c.get('tenantId') || 'default';
    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');

    const service = new AdvancedReportsService(c.env.DB);
    const data = await service.getSalesByCategory(tenantId, startDate, endDate);

    return c.json({ success: true, data });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Sales by time period
app.get('/sales/timeline', async (c) => {
  try {
    const tenantId = c.get('tenantId') || 'default';
    const groupBy = (c.req.query('group_by') || 'day') as 'day' | 'week' | 'month' | 'year';
    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');

    const service = new AdvancedReportsService(c.env.DB);
    const data = await service.getSalesByTime(tenantId, groupBy, startDate, endDate);

    return c.json({ success: true, data });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Profit margin analysis
app.get('/profit-margin', async (c) => {
  try {
    const tenantId = c.get('tenantId') || 'default';
    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');

    const service = new AdvancedReportsService(c.env.DB);
    const data = await service.getProfitMarginAnalysis(tenantId, startDate, endDate);

    return c.json({ success: true, data });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Top performers
app.get('/top-performers', async (c) => {
  try {
    const tenantId = c.get('tenantId') || 'default';
    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');
    const limit = parseInt(c.req.query('limit') || '10');

    const service = new AdvancedReportsService(c.env.DB);
    const data = await service.getTopPerformers(tenantId, startDate, endDate, limit);

    return c.json({ success: true, data });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Comparative analysis (period over period)
app.get('/comparative', async (c) => {
  try {
    const tenantId = c.get('tenantId') || 'default';
    const period1Start = c.req.query('period1_start');
    const period1End = c.req.query('period1_end');
    const period2Start = c.req.query('period2_start');
    const period2End = c.req.query('period2_end');

    if (!period1Start || !period1End || !period2Start || !period2End) {
      return c.json({
        success: false,
        error: 'All period dates are required (period1_start, period1_end, period2_start, period2_end)'
      }, 400);
    }

    const service = new AdvancedReportsService(c.env.DB);
    const data = await service.getComparativeAnalysis(
      tenantId,
      period1Start,
      period1End,
      period2Start,
      period2End
    );

    return c.json({ success: true, data });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;
