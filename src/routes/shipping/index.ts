/**
 * Shipping API Module
 * Cloudflare Workers - Hono Framework
 */

import { Hono } from 'hono'
import { Env } from '../../types'
// import { authenticate } from '../../middleware/auth' // Bỏ authentication cho shipping routes
import { ShippingService_ShippingManagementtsx as ShippingService } from '../../services/ShippingService-ShippingManagementtsx'
import ghtk from './ghtk'
import geo from './geo'

const app = new Hono<{ Bindings: Env }>()

// ALL SHIPPING ROUTES ARE PUBLIC (no authentication required)
// Sub-route: geo lookup
app.route('/geo', geo)
// Sub-route: GHTK integration
app.route('/ghtk', ghtk)

// Manual sync endpoint: POST /api/shipping/sync/:carrier/:order_code
app.post('/sync/:carrier/:order_code', async (c) => {
  try {
    const carrier = c.req.param('carrier')
    const code = c.req.param('order_code')
    if (carrier !== 'ghtk') return c.json({ success: false, error: 'Unsupported carrier' }, 400)

    const { ShippingGHTKService } = await import('../../services/ShippingGHTKService')
    const { ShippingPersistenceService } = await import('../../services/ShippingPersistenceService')
    const svc = new (ShippingGHTKService as any)(c.env)
    const persist = new (ShippingPersistenceService as any)(c.env)
    const res = await svc.trackingStatus(code)
    if (res.success) {
      await persist.addShippingEvent({
        tenant_id: (c.get as any)('tenantId') || 'default',
        carrier: 'ghtk',
        carrier_order_code: code,
        event_type: 'sync',
        event_time: new Date().toISOString(),
        raw_event: res.data
      })
      await persist.upsertShippingOrder({
        tenant_id: (c.get as any)('tenantId') || 'default',
        carrier: 'ghtk',
        carrier_order_code: code,
        status: (res.data as any)?.status || undefined,
        response: res.data
      })
    }
    return c.json(res, res.success ? 200 : 404)
  } catch (e: any) {
    return c.json({ success: false, error: e?.message || 'Sync failed' }, 500)
  }
})

// GET /api/shipping/orders - list shipping orders (from local DB with GHTK sync capability)
app.get('/orders', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default'
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '20')
    const offset = (page - 1) * limit
    
    // Skip GHTKRealSyncService vì GHTK không có API list orders công khai
    // Lấy trực tiếp từ database và sync detail với GHTK
    console.log('[Shipping Orders] Loading orders from database and syncing with GHTK...')

    // Fallback: Lấy từ database local và sync với GHTK
    const rows = await c.env.DB.prepare(`
      SELECT * FROM shipping_orders
      WHERE COALESCE(tenant_id,'default') = ?
      ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).bind(tenantId, limit, offset).all()
    
    const total = await c.env.DB.prepare(`SELECT COUNT(*) as cnt FROM shipping_orders WHERE COALESCE(tenant_id,'default') = ?`).bind(tenantId).first()
    
    // Sync each order with GHTK to get real-time data
    const { ShippingGHTKService } = await import('../../services/ShippingGHTKService')
    const svc = new ShippingGHTKService(c.env)
    
    const transformedOrders = await Promise.all((rows.results || []).map(async (order: any) => {
      let ghtkData = null
      
      // If it's a GHTK order, get real-time data from GHTK
      if (order.carrier === 'ghtk' && order.carrier_order_code) {
        try {
          const ghtkResponse = await svc.getOrderDetails(order.carrier_order_code)
          if (ghtkResponse.success && ghtkResponse.data) {
            ghtkData = ghtkResponse.data
          }
        } catch (e) {
          console.log('Failed to sync with GHTK:', e)
        }
      }
      
      return {
        ...order,
        // Use GHTK data if available, otherwise use local data
        status: ghtkData?.status_text || ghtkData?.status || order.status || 'unknown',
        fee_amount: ghtkData?.fee || ghtkData?.ship_fee || ghtkData?.shipping_fee || order.fee_amount || 0,
        service: ghtkData?.service || ghtkData?.transport || order.service || 'road',
        updated_at: ghtkData?.modified || ghtkData?.updated_at || order.updated_at,
        payload: ghtkData || order.payload,
        response: ghtkData || order.response,
        ghtk_integrated: order.carrier === 'ghtk',
        ghtk_url: order.carrier === 'ghtk' ? `https://khachhang.giaohangtietkiem.vn/web/van-hanh/don-hang/${order.carrier_order_code}` : null,
        can_sync: order.carrier === 'ghtk',
        can_print_label: order.carrier === 'ghtk' && order.carrier_order_code,
        can_cancel: order.carrier === 'ghtk' && !['delivered', 'cancelled'].includes((ghtkData?.status_text || ghtkData?.status || order.status || '').toLowerCase())
      }
    }))
    
    return c.json({ 
      success: true, 
      data: transformedOrders, 
      pagination: { 
        page, 
        limit, 
        total: Number((total as any)?.cnt || 0),
        totalPages: Math.ceil(Number((total as any)?.cnt || 0) / limit)
      },
      ghtk_integration: {
        enabled: true,
        base_url: 'https://khachhang.giaohangtietkiem.vn',
        orders_url: 'https://khachhang.giaohangtietkiem.vn/web/van-hanh/don-hang',
        new_order_url: 'https://khachhang.giaohangtietkiem.vn/web/van-hanh/don-hang/new',
        overview_url: 'https://khachhang.giaohangtietkiem.vn/web/van-hanh',
        real_data: true,
        sync_status: 'synced_from_db'
      }
    })
  } catch (e: any) {
    return c.json({ success: false, error: e?.message || 'Failed to fetch orders' }, 500)
  }
})


// GET /api/shipping/track/:tracking_number
app.get('/track/:tracking_number', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default'
    const service = new ShippingService(c.env)
    const trackingNumber = c.req.param('tracking_number')
    const result = await service.getTrackingEvents(trackingNumber, tenantId)

    if (!result.success) {
      return c.json({ success: false, error: result.error || 'Shipment not found' }, 404)
    }

    return c.json({ success: true, events: result.events || [] })
  } catch (error: any) {
    return c.json({ success: false, error: 'Shipment not found' }, 404)
  }
})

// GET /api/shipping (Get shipping methods)
app.get('/', async (c) => {
  const tenantId = (c.get as any)('tenantId') || 'default'
  const service = new ShippingService(c.env)
  const result = await service.getShippingMethods(tenantId)

  return c.json({
    success: true,
    methods: result.methods || []
  })
})

// POST /api/shipping
app.post('/', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default'
    const service = new ShippingService(c.env)
    const body = await c.req.json()
    const result = await service.createShippingMethod(tenantId, body)

    if (!result.success) {
      return c.json({ success: false, error: result.error }, 400)
    }

    return c.json({
      success: true,
      data: result.data,
      message: 'Shipping method created successfully'
    }, 201)
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400)
  }
})

// GET /api/shipping/:id
app.get('/:id', async (c) => {
  const tenantId = (c.get as any)('tenantId') || 'default'
  const service = new ShippingService(c.env)
  const id = c.req.param('id')
  const result = await service.getShippingMethodById(id, tenantId)

  if (!result.success) {
    return c.json({ success: false, error: result.error || 'Shipping method not found' }, 404)
  }

  return c.json({ success: true, data: result.data })
})

// PUT /api/shipping/:id
app.put('/:id', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default'
    const service = new ShippingService(c.env)
    const id = c.req.param('id')
    const body = await c.req.json()
    const result = await service.updateShippingMethod(id, tenantId, body)

    if (!result.success) {
      return c.json({ success: false, error: result.error }, 400)
    }

    return c.json({ success: true, data: result.data, message: 'Shipping method updated successfully' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400)
  }
})

// DELETE /api/shipping/:id
app.delete('/:id', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default'
    const service = new ShippingService(c.env)
    const id = c.req.param('id')
    const result = await service.deleteShippingMethod(id, tenantId)

    if (!result.success) {
      return c.json({ success: false, error: result.error }, 404)
    }

    return c.json({ success: true, message: 'Shipping method deleted successfully' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400)
  }
})

export default app
