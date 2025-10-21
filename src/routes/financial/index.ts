/**
 * Financial API Module
 * Cloudflare Workers - Hono Framework
 */

import { Hono } from 'hono'
import { Env } from '../../types'
import { FinancialService } from '../../services/FinancialService'

const app = new Hono<{ Bindings: Env }>()

// GET /api/financial/summary
app.get('/summary', async (c) => {
  const tenantId = (c.get as any)('tenantId') || 'default'
  const service = new FinancialService(c.env)
  const start_date = c.req.query('from') || new Date(Date.now() - 30*24*60*60*1000).toISOString()
  const end_date = c.req.query('to') || new Date().toISOString()
  const result = await service.getFinancialReport(tenantId, start_date, end_date)

  return c.json({
    success: true,
    data: result
  })
})

// GET /api/financial/revenue
app.get('/revenue', async (c) => {
  const tenantId = (c.get as any)('tenantId') || 'default'
  const service = new FinancialService(c.env)
  const start_date = c.req.query('from') || new Date(Date.now() - 30*24*60*60*1000).toISOString()
  const end_date = c.req.query('to') || new Date().toISOString()
  const result = await service.getRevenueAnalytics(tenantId, start_date, end_date)

  return c.json({
    success: true,
    data: result
  })
})

// GET /api/financial/expenses
app.get('/expenses', async (c) => {
  const tenantId = (c.get as any)('tenantId') || 'default'
  const service = new FinancialService(c.env)
  const start_date = c.req.query('from') || new Date(Date.now() - 30*24*60*60*1000).toISOString()
  const end_date = c.req.query('to') || new Date().toISOString()
  const result = await service.getExpenses(tenantId, start_date, end_date)

  return c.json({
    success: true,
    data: result
  })
})

// GET /api/financial/profit
app.get('/profit', async (c) => {
  const tenantId = (c.get as any)('tenantId') || 'default'
  const service = new FinancialService(c.env)
  const start_date = c.req.query('from') || new Date(Date.now() - 30*24*60*60*1000).toISOString()
  const end_date = c.req.query('to') || new Date().toISOString()
  const result = await service.getFinancialReport(tenantId, start_date, end_date)

  return c.json({
    success: true,
    data: result
  })
})

export default app
