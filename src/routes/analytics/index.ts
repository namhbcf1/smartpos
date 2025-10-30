/**
 * Analytics API Module
 * Cloudflare Workers - Hono Framework
 */

import { Hono } from 'hono'
import { Env } from '../../types'
import { AdvancedAnalyticsService_DashboardOverviewtsx } from '../../services/AdvancedAnalyticsService-DashboardOverviewtsx'
import { CustomerAnalyticsService } from '../../services/CustomerAnalyticsService'

const app = new Hono<{ Bindings: Env }>()

// GET /api/analytics/dashboard
app.get('/dashboard', async (c) => {
const service = new AdvancedAnalyticsService_DashboardOverviewtsx(c.env)
  const result = await service.getDashboardAnalytics()

  return c.json({
    success: true,
    data: result
  })
})

// GET /api/analytics/sales
app.get('/sales', async (c) => {
  const period = c.req.query('period') as 'today' | 'week' | 'month' | 'quarter' | 'year' || 'month'

const service = new AdvancedAnalyticsService_DashboardOverviewtsx(c.env)
  const result = await service.getSalesAnalytics(period)

  return c.json({
    success: true,
    data: result
  })
})

// GET /api/analytics/products
app.get('/products', async (c) => {
const service = new AdvancedAnalyticsService_DashboardOverviewtsx(c.env)
  const result = await service.getInventoryAnalytics()

  return c.json({
    success: true,
    data: result
  })
})

// GET /api/analytics/customers
app.get('/customers', async (c) => {
const service = new AdvancedAnalyticsService_DashboardOverviewtsx(c.env)
  const result = await service.getCustomerAnalytics()

  return c.json({
    success: true,
    data: result
  })
})

app.get('/clv', async (c) => {
  try {
    const tenantId = c.get('tenantId') || 'default';
    const service = new CustomerAnalyticsService(c.env.DB);
    const data = await service.calculateCLV(tenantId);
    return c.json({ success: true, data, count: data.length });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.get('/clv/top', async (c) => {
  try {
    const tenantId = c.get('tenantId') || 'default';
    const limit = parseInt(c.req.query('limit') || '20');
    const service = new CustomerAnalyticsService(c.env.DB);
    const data = await service.getTopCustomersByValue(tenantId, limit);
    return c.json({ success: true, data });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.get('/cohort', async (c) => {
  try {
    const tenantId = c.get('tenantId') || 'default';
    const months = parseInt(c.req.query('months') || '12');
    const service = new CustomerAnalyticsService(c.env.DB);
    const data = await service.getCohortAnalysis(tenantId, months);
    return c.json({ success: true, data });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.get('/revenue', async (c) => {
  try {
    const tenantId = c.get('tenantId') || 'default';
    const days = parseInt(c.req.query('days') || '30');
    const service = new CustomerAnalyticsService(c.env.DB);
    const data = await service.getRevenueMetrics(tenantId, days);
    return c.json({ success: true, data });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.get('/churn', async (c) => {
  try {
    const tenantId = c.get('tenantId') || 'default';
    const service = new CustomerAnalyticsService(c.env.DB);
    const data = await service.getChurnPrediction(tenantId);
    return c.json({ success: true, data: data.slice(0, 100) });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app
