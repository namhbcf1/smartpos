/**
 * Analytics API Module
 * Cloudflare Workers - Hono Framework
 */

import { Hono } from 'hono'
import { Env } from '../../types'
import { AdvancedAnalyticsService_DashboardOverviewtsx } from '../../services/AdvancedAnalyticsService-DashboardOverviewtsx'

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

export default app
