/**
 * API Routes Aggregator
 * Cloudflare Workers - Hono Framework
 *
 * Tổng hợp tất cả API routes theo module
 */

import { Hono } from 'hono'
import { Env } from '../../types'

// Import module routes
import authRouter from '../auth'
import catalogRouter from '../catalog'
import ordersRouter from '../orders'
import customersRouter from '../customers'
import inventoryRouter from '../inventory'
import financialsRouter from '../financials'
import usersRouter from '../users-module'
// duplicate imports removed
import reportsRouter from '../reports'
import dashboardRouter from '../dashboard'
import serialNumbersRouter from '../serial-numbers'
import promosRouter from '../promos'
import warrantyRouter from '../warranty'
import integrationsRouter from '../integrations'
import publicWarrantyRouter from '../public/warranty-check-WarrantyChecktsx'
import publicCustomerRegister from '../public/customer-register'
import publicTradeIn from '../public/trade-in'
import supportRouter from '../support'
import settingsRouter from '../settings'
import posRouter from '../pos'
import suppliersRouter from '../suppliers'
import promotionsRouter from '../promotions'
import warehousesRouter from '../warehouses'
import debtsRouter from '../debts'
import alertsRouter from '../alerts'
import auditLogsRouter from '../audit-logs'
import permissionsRouter from '../permissions'
import cronRouter from '../cron'
import notificationsRouter from '../notifications'
import shippingRouter from '../shipping'
import adminRouter from '../admin'
// (duplicates removed)
import aiRouter from '../ai'
import loyaltyRouter from '../loyalty'
import analyticsRouter from '../analytics'
import recommendationsRouter from '../recommendations'

const app = new Hono<{ Bindings: Env }>()

// Health check endpoint - MUST be first
app.get('/health', (c) => {
  return c.json({
    success: true,
    message: 'SmartPOS API is healthy',
    timestamp: new Date().toISOString(),
    database: 'connected',
    version: '2.0.0'
  })
})

// API info endpoint - MUST be before generic routes to avoid conflicts
app.get('/info', (c) => {
  return c.json({
    success: true,
    message: 'SmartPOS API is running',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    features: {
      authentication: true,
      rateLimit: true,
      multiTenant: true,
      realtime: false
    },
    endpoints: {
      catalog: {
        products: '/api/products',
        categories: '/api/categories',
        brands: '/api/brands'
      },
      orders: {
        orders: '/api/orders'
      },
      pos: {
        cart: '/api/pos/cart',
        checkout: '/api/pos/checkout'
      },
      customers: '/api/customers',
      inventory: '/api/inventory',
      financials: {
        invoices: '/api/invoices',
        payments: '/api/payments',
        debts: '/api/debts'
      },
      users: {
        users: '/api/users',
        roles: '/api/roles',
        employees: '/api/employees'
      },
      reportsModule: {
        reports: '/api/reports',
        analytics: '/api/reports/analytics',
        dashboard: '/api/dashboard'
      },
      integrations: {
        vnpay: '/api/vnpay',
        momo: '/api/momo'
      },
      suppliers: {
        suppliers: '/api/suppliers',
        analytics: '/api/suppliers/analytics'
      },
      promotions: {
        promotions: '/api/promotions',
        analytics: '/api/promotions/analytics'
      },
      warehouses: {
        warehouses: '/api/warehouses',
        analytics: '/api/warehouses/analytics'
      },
      debts: {
        debts: '/api/debts',
        analytics: '/api/debts/analytics'
      },
      support: {
        tickets: '/api/support/tickets',
        analytics: '/api/support/tickets/analytics'
      },
      // reports key defined once below
      dashboard: {
        overview: '/api/dashboard/overview',
        widgets: '/api/dashboard/widgets',
        analytics: '/api/dashboard/analytics'
      },
      serials: {
        list: '/api/serial-numbers',
        search: '/api/serial-numbers/search',
        stats: '/api/serial-numbers/stats'
      }
    }
  })
})

// Mount all API modules (order matters: specific base paths before generic "/:id" routers)
app.route('/auth', authRouter)           // /api/auth/login, /api/auth/register
app.route('/warranties', warrantyRouter) // /api/warranties
app.route('/customers', customersRouter) // /api/customers
app.route('/inventory', inventoryRouter) // /api/inventory, /api/warehouses
app.route('/dashboard', dashboardRouter) // /api/dashboard
app.route('/settings', settingsRouter)   // /api/settings
app.route('/suppliers', suppliersRouter) // /api/suppliers - MUST be before generic routes
app.route('/promotions', promotionsRouter) // /api/promotions - MUST be before generic routes
app.route('/warehouses', warehousesRouter) // /api/warehouses - MUST be before generic routes
app.route('/debts', debtsRouter) // /api/debts - MUST be before generic routes
app.route('/support', supportRouter) // /api/support/tickets - MUST be before generic routes
app.route('/reports', reportsRouter) // /api/reports - MUST be before generic routes
app.route('/serial-numbers', serialNumbersRouter) // /api/serial-numbers
app.route('/audit-logs', auditLogsRouter) // /api/audit-logs
app.route('/permissions', permissionsRouter) // /api/permissions
app.route('/cron', cronRouter) // /api/cron - manual cron triggers
app.route('/notifications', notificationsRouter) // /api/notifications - admin notifications
app.route('/shipping', shippingRouter)   // /api/shipping - shipping methods and GHTK integration
app.route('/admin', adminRouter)          // /api/admin - administrative endpoints
app.route('/alerts', alertsRouter)       // /api/alerts, /api/alerts/dashboard - MUST be before generic routes
app.route('/pos', posRouter)             // /api/pos/cart, /api/pos/checkout
app.route('/ai', aiRouter)               // /api/ai/chat, /api/ai/models
app.route('/loyalty', loyaltyRouter)     // /api/loyalty/award, /api/loyalty/redeem
app.route('/analytics', analyticsRouter) // /api/analytics/clv, /api/analytics/cohort
app.route('/recommendations', recommendationsRouter) // /api/recommendations - product recommendations
app.route('/', catalogRouter)            // /api/products, /api/categories, /api/brands
app.route('/', ordersRouter)             // /api/orders, /api/pos
app.route('/', financialsRouter)         // /api/invoices, /api/payments, /api/debts
app.route('/', usersRouter)              // /api/users, /api/roles, /api/employees
app.route('/', promosRouter)             // /api/promotions, /api/discounts
app.route('/', integrationsRouter)       // /api/vnpay, /api/momo
app.route('/public', publicWarrantyRouter) // /api/public/warranty-check
app.route('/public', publicCustomerRegister) // /api/public/customer-register
app.route('/public', publicTradeIn) // /api/public/trade-in/*
app.route('/support', supportRouter)     // /api/support (duplicate mount removed)

export default app
