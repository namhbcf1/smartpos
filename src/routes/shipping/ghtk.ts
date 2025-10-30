import { Hono } from 'hono';
import { Env } from '../../types';
// import { authenticate } from '../../middleware/auth'; // Bỏ authentication
import { ShippingGHTKService } from '../../services/ShippingGHTKService';
import { ShippingPersistenceService } from '../../services/ShippingPersistenceService';

const app = new Hono<{ Bindings: Env }>();

// GHTK routes are PUBLIC - no authentication required
// app.use('*', authenticate);

// POST /shipping/ghtk/fee - calculate fee
app.post('/fee', async (c) => {
  try {
    const svc = new ShippingGHTKService(c.env);
    const body = await c.req.json();
    const res = await svc.calculateFee(body);
    return c.json(res, res.success ? 200 : 400);
  } catch (e: any) {
    return c.json({ success: false, error: e?.message || 'Failed to calculate fee' }, 500);
  }
});

// POST /shipping/ghtk/order - create order with idempotency
app.post('/order', async (c) => {
  const requestId = `create-order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`[GHTK Create Order] Starting order creation - Request ID: ${requestId}`);
    
    const svc = new ShippingGHTKService(c.env);
    const persist = new ShippingPersistenceService(c.env);
    const body = await c.req.json();
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId') || 'system';
    
    // Generate idempotency key from order ID
    const idempotencyKey = body?.order?.id || `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Check if order already exists (idempotency check)
    const existingOrder = await c.env.DB.prepare(`
      SELECT * FROM shipping_orders 
      WHERE COALESCE(tenant_id,'default') = ? AND order_id = ?
    `).bind(tenantId, idempotencyKey).first();
    
    if (existingOrder) {
      console.log(`[GHTK Create Order] Order already exists - Request ID: ${requestId}`);
      return c.json({
        success: true,
        data: existingOrder,
        message: 'Order already exists',
        order_code: (existingOrder as any).carrier_order_code
      }, 200);
    }
    
    // Create order with idempotency key
    const res = await svc.createOrder(body, idempotencyKey);
    
    if (res.success) {
      const orderCode = res.order_code || res.label || (res.data as any)?.order?.label || (res.data as any)?.label;
      const status = (res.data as any)?.order?.status || (res.data as any)?.status || 'created';
      const fee = res.fee || (res.data as any)?.fee || (res.data as any)?.order?.fee;
      
      console.log(`[GHTK Create Order] Order created successfully: ${orderCode} - Request ID: ${requestId}`);
      
      // Save to database
      await persist.upsertShippingOrder({
        tenant_id: tenantId,
        order_id: idempotencyKey,
        carrier: 'ghtk',
        carrier_order_code: orderCode,
        status: status,
        fee_amount: fee,
        service: (res.data as any)?.service || body?.order?.transport || 'road',
        payload: body,
        response: res.data,
        created_by: userId
      });
      
      // Add initial event
      await persist.addShippingEvent({
        tenant_id: tenantId,
        carrier: 'ghtk',
        carrier_order_code: orderCode,
        event_type: 'created',
        event_time: new Date().toISOString(),
        raw_event: { status: 'created', order_code: orderCode }
      });
      
      return c.json({
        success: true,
        data: res.data,
        order_code: orderCode,
        fee: fee,
        status: status
      }, 201);
    } else {
      console.error(`[GHTK Create Order] Failed to create order - Request ID: ${requestId}`, res.error);
      return c.json({
        success: false,
        error: res.error || 'Failed to create order',
        status_code: res.status_code
      }, 400);
    }
  } catch (e: any) {
    console.error(`[GHTK Create Order] Order creation failed - Request ID: ${requestId}`, e);
    return c.json({ 
      success: false, 
      error: e?.message || 'Failed to create order' 
    }, 500);
  }
});

// GET /shipping/ghtk/track/:order_code - tracking status
app.get('/track/:order_code', async (c) => {
  try {
    const svc = new ShippingGHTKService(c.env);
    const persist = new ShippingPersistenceService(c.env);
    const code = c.req.param('order_code');
    const res = await svc.trackingStatus(code);
    if (res.success) {
      await persist.addShippingEvent({
        tenant_id: (c.get as any)('tenantId') || 'default',
        carrier: 'ghtk',
        carrier_order_code: code,
        event_type: 'tracking_fetch',
        event_time: new Date().toISOString(),
        raw_event: res.data,
      });
    }
    return c.json(res, res.success ? 200 : 404);
  } catch (e: any) {
    return c.json({ success: false, error: e?.message || 'Failed to get tracking status' }, 500);
  }
});

// GET /shipping/ghtk/label/:order_code - stream label PDF directly from GHTK
app.get('/label/:order_code', async (c) => {
  try {
    const code = c.req.param('order_code');
    const original = c.req.query('original') || 'portrait'; // portrait | landscape
    const pageSize = c.req.query('page_size') || 'A6'; // A5 | A6

    console.log(`[GHTK Label] Requesting label for order: ${code}, original: ${original}, pageSize: ${pageSize}`);

    const url = new URL(`https://services.giaohangtietkiem.vn/services/label/${encodeURIComponent(code)}`);
    if (original) url.searchParams.set('original', String(original));
    if (pageSize) url.searchParams.set('page_size', String(pageSize));

    const token = (c.env as any).GHTK_TOKEN;
    if (!token) {
      console.error('[GHTK Label] Missing GHTK_TOKEN in environment');
      return c.json({ success: false, error: 'Missing GHTK_TOKEN in environment' }, 500);
    }

    console.log(`[GHTK Label] Making request to: ${url.toString()}`);

    const resp = await fetch(url.toString(), {
      headers: {
        Token: token,
        'X-Client-Source': 'SmartPOS'
      }
    });

    console.log(`[GHTK Label] Response status: ${resp.status}, content-type: ${resp.headers.get('content-type')}`);

    // On success GHTK returns PDF or binary stream (sometimes octet-stream)
    if (resp.ok) {
      const buf = await resp.arrayBuffer();
      const upstreamType = resp.headers.get('content-type') || 'application/pdf';
      
      console.log(`[GHTK Label] Successfully got PDF, size: ${buf.byteLength} bytes`);
      
      return new Response(buf, {
        headers: {
          'Content-Type': upstreamType.includes('application/json') ? 'application/pdf' : upstreamType,
          'Content-Disposition': `inline; filename="${code}.pdf"`,
          'Cache-Control': 'no-store'
        },
        status: 200
      });
    }

    // Error path: forward JSON from GHTK
    let errJson: any = null;
    try { 
      errJson = await resp.json(); 
      console.error(`[GHTK Label] Error response:`, errJson);
    } catch { 
      errJson = { message: 'Label fetch failed' }; 
      console.error(`[GHTK Label] Failed to parse error response`);
    }
    return c.json({ success: false, error: errJson?.message || 'Failed to get label', data: errJson }, resp.status || 400);
  } catch (e: any) {
    console.error(`[GHTK Label] Exception:`, e);
    return c.json({ success: false, error: e?.message || 'Failed to get label' }, 500);
  }
});

// POST /shipping/ghtk/cancel/:order_code - cancel order
app.post('/cancel/:order_code', async (c) => {
  try {
    const svc = new ShippingGHTKService(c.env);
    const persist = new ShippingPersistenceService(c.env);
    const code = c.req.param('order_code');
    const body = await c.req.json().catch(() => undefined);
    const res = await svc.cancelOrder(code, body?.reason);
    if (res.success) {
      await persist.addShippingEvent({
        tenant_id: (c.get as any)('tenantId') || 'default',
        carrier: 'ghtk',
        carrier_order_code: code,
        event_type: 'cancel',
        event_time: new Date().toISOString(),
        raw_event: res.data,
      });
    }
    return c.json(res, res.success ? 200 : 400);
  } catch (e: any) {
    return c.json({ success: false, error: e?.message || 'Failed to cancel order' }, 500);
  }
});

// POST /shipping/ghtk/webhook - receive realtime status (config at GHTK portal)
app.post('/webhook', async (c) => {
  const requestId = `webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`[GHTK Webhook] Received webhook - Request ID: ${requestId}`);
    
    const svc = new ShippingGHTKService(c.env);
    const persist = new ShippingPersistenceService(c.env);
    const payload = await c.req.json();
    const tenantId = (c.get as any)('tenantId') || 'default';

    // Validate webhook signature if GHTK provides it
    const signature = c.req.header('X-GHTK-Signature') || c.req.header('X-Signature');
    if (signature) {
      const webhookSecret = (c.env as any).GHTK_WEBHOOK_SECRET;
      if (webhookSecret && !svc.validateWebhookSignature(payload, signature, webhookSecret)) {
        console.error(`[GHTK Webhook] Invalid signature - Request ID: ${requestId}`);
        return c.json({ success: false, error: 'Invalid webhook signature' }, 401);
      }
    }

    // Process webhook event
    const eventResult = await svc.processWebhookEvent(payload);
    if (!eventResult.success) {
      console.error(`[GHTK Webhook] Failed to process event - Request ID: ${requestId}`, eventResult.error);
      return c.json({ success: false, error: eventResult.error }, 400);
    }

    const { event_type, order_code, status } = eventResult;
    console.log(`[GHTK Webhook] Processing event: ${event_type} for order: ${order_code} - Request ID: ${requestId}`);

    // Add shipping event
    await persist.addShippingEvent({
      tenant_id: tenantId,
      carrier: 'ghtk',
      carrier_order_code: order_code,
      event_type: event_type,
      event_time: payload?.modified || payload?.timestamp || new Date().toISOString(),
      raw_event: payload,
    });

    // Update shipping order status
    await persist.upsertShippingOrder({
      tenant_id: tenantId,
      carrier: 'ghtk',
      carrier_order_code: order_code,
      status: status,
      response: payload,
    });

    // Handle specific events
    if (event_type === 'DELIVERED') {
      // Notify customer of successful delivery
      console.log(`[GHTK Webhook] Order ${order_code} delivered successfully - Request ID: ${requestId}`);
    } else if (event_type === 'FAILED' || event_type === 'RETURN') {
      // Handle failed delivery or return
      console.log(`[GHTK Webhook] Order ${order_code} failed/returned - Request ID: ${requestId}`);
    }

    console.log(`[GHTK Webhook] Successfully processed webhook - Request ID: ${requestId}`);
    return c.json({ success: true, event_type, order_code });
  } catch (e: any) {
    console.error(`[GHTK Webhook] Webhook processing failed - Request ID: ${requestId}`, e);
    return c.json({ success: false, error: e?.message || 'Webhook processing error' }, 500);
  }
});

// POST /shipping/ghtk/verify-purge - verify local orders against GHTK and purge missing
app.post('/verify-purge', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const db = c.env.DB;
    const { GHTKRealSyncService } = await import('../../services/GHTKRealSyncService');
    const syncService = new GHTKRealSyncService(c.env);

    // Load local GHTK orders
    const rows = await db.prepare(
      `SELECT id, carrier_order_code FROM shipping_orders 
       WHERE COALESCE(tenant_id,'default') = ? AND carrier = 'ghtk'`
    ).bind(tenantId).all();

    let checked = 0;
    let purged = 0;
    const errors: string[] = [];

    for (const r of (rows.results || [])) {
      const code = (r as any).carrier_order_code as string;
      checked += 1;
      try {
        const res = await syncService.fetchOrderFromGHTK(code);
        if (!res.success) {
          // Not found on GHTK -> purge locally
          await db.prepare('DELETE FROM shipping_orders WHERE id = ?').bind((r as any).id).run();
          purged += 1;
        }
      } catch (e: any) {
        errors.push(`${code}: ${e?.message || 'verify_failed'}`);
      }
    }

    return c.json({ success: true, checked, purged, errors });
  } catch (e: any) {
    return c.json({ success: false, error: e?.message || 'Failed to verify and purge' }, 500);
  }
});

// POST /shipping/ghtk/from-order/:id - create GHTK order from D1 order
app.post('/from-order/:id', async (c) => {
  try {
    const orderId = c.req.param('id');
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId') || 'system';

    // Minimal mapping example: fetch order and customer basics
    const order = await c.env.DB.prepare(`SELECT * FROM orders WHERE id = ? AND COALESCE(tenant_id,'default') = ?`).bind(orderId, tenantId).first();
    if (!order) return c.json({ success: false, error: 'Order not found' }, 404);

    const payload = {
      order: {
        id: orderId,
        name: (order as any).customer_name || 'Khách hàng',
        tel: (order as any).customer_phone || '',
        address: (order as any).shipping_address || (order as any).address || '',
        province: (order as any).province || '',
        district: (order as any).district || '',
        pick_name: 'SmartPOS Store',
        pick_tel: '0836768597',
        pick_address: (order as any).store_address || '',
        pick_province: (order as any).store_province || '',
        pick_district: (order as any).store_district || '',
        value: (order as any).total_cents ? Math.round((order as any).total_cents / 100) : 0,
        weight: 0.5, // Default weight
        transport: 'road' as 'road' | 'fly',
        is_freeship: 0,
      },
      products: []
    };

    const svc = new ShippingGHTKService(c.env);
    const persist = new ShippingPersistenceService(c.env);
    const res = await svc.createOrder(payload);
    if (res.success) {
      await persist.upsertShippingOrder({
        tenant_id: tenantId,
        order_id: orderId,
        carrier: 'ghtk',
        carrier_order_code: (res.data as any)?.order?.label || (res.data as any)?.order_code || (res.data as any)?.label,
        status: (res.data as any)?.order?.status || (res.data as any)?.status,
        payload,
        response: res.data,
        created_by: userId,
      });
      // also store quick lookup onto orders table
      const shippingCode = (res.data as any)?.order?.label || (res.data as any)?.order_code || (res.data as any)?.label
      if (shippingCode) {
        await c.env.DB.prepare(`UPDATE orders SET shipping_order_code = ? WHERE id = ? AND COALESCE(tenant_id,'default') = ?`).bind(shippingCode, orderId, tenantId).run()
      }
    }
    return c.json(res, res.success ? 201 : 400);
  } catch (e: any) {
    return c.json({ success: false, error: e?.message || 'Failed to create from order' }, 500);
  }
});

// GET /shipping/ghtk/pick-addresses - list configured pickup addresses
app.get('/pick-addresses', async (c) => {
  try {
    const svc = new ShippingGHTKService(c.env);
    const res = await svc.listPickAddresses();
    return c.json(res, res.success ? 200 : 400);
  } catch (e: any) {
    return c.json({ success: false, error: e?.message || 'Failed to list pick addresses' }, 500);
  }
});

// GET /shipping/ghtk/orders - list orders from GHTK system
app.get('/orders', async (c) => {
  try {
    const svc = new ShippingGHTKService(c.env);
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const res = await svc.listOrders(page, limit);
    return c.json(res, res.success ? 200 : 400);
  } catch (e: any) {
    return c.json({ success: false, error: e?.message || 'Failed to list orders from GHTK' }, 500);
  }
});

// GET /shipping/ghtk/orders/:order_code - get order details from GHTK
app.get('/orders/:order_code', async (c) => {
  try {
    const svc = new ShippingGHTKService(c.env);
    const orderCode = c.req.param('order_code');
    const res = await svc.getOrderDetails(orderCode);
    return c.json(res, res.success ? 200 : 404);
  } catch (e: any) {
    return c.json({ success: false, error: e?.message || 'Failed to get order details from GHTK' }, 500);
  }
});

// GET /shipping/ghtk/order-detail/:order_id - get detailed order info from GHTK (for specific order like ĐH 1103593474)
app.get('/order-detail/:order_id', async (c) => {
  const requestId = `order-detail-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`[GHTK Order Detail] Fetching order details for: ${c.req.param('order_id')} - Request ID: ${requestId}`);
    
    const svc = new ShippingGHTKService(c.env);
    const orderId = c.req.param('order_id');
    
    // Try multiple possible order codes for this specific order
    const possibleCodes = [
      orderId, // Direct order ID
      `ĐH ${orderId}`, // With ĐH prefix
      `S21632601.BO.MT19-08-K23.${orderId}`, // Full tracking code from image
      `1103593474`, // Just the number part
    ];
    
    let orderDetails = null;
    let usedCode = null;
    
    // Try each possible code until we find the order
    for (const code of possibleCodes) {
      try {
        console.log(`[GHTK Order Detail] Trying code: ${code} - Request ID: ${requestId}`);
        const res = await svc.getOrderDetails(code);
        
        if (res.success && res.data) {
          orderDetails = res.data;
          usedCode = code;
          console.log(`[GHTK Order Detail] Found order with code: ${code} - Request ID: ${requestId}`);
          break;
        }
      } catch (e) {
        console.log(`[GHTK Order Detail] Failed to get order with code: ${code} - Request ID: ${requestId}`, e);
        continue;
      }
    }
    
    if (!orderDetails) {
      console.log(`[GHTK Order Detail] Order not found with any code - Request ID: ${requestId}`);
      return c.json({
        success: false,
        error: `Order ${orderId} not found in GHTK system`,
        tried_codes: possibleCodes
      }, 404);
    }
    
    // Try to enrich with local order and customer information - GET FULL DATA
    let localOrder: any = null;
    let localCustomer: any = null;
    let shippingPayload: any = null;
    const tenantId = (c.get as any)('tenantId') || 'default';

    try {
      // Get full order data with customer info
      localOrder = await c.env.DB.prepare(
        `SELECT o.*, c.name as customer_full_name, c.phone as customer_full_phone,
                c.address, c.province_id, c.district_id, c.ward_id, c.street, c.hamlet,
                c.email as customer_email
         FROM orders o
         LEFT JOIN customers c ON o.customer_id = c.id
         WHERE o.id = ? AND COALESCE(o.tenant_id,'default') = ?`
      ).bind(orderId, tenantId).first();
    } catch {}

    // If not found by primary id, try by order_number
    if (!localOrder) {
      try {
        localOrder = await c.env.DB.prepare(
          `SELECT o.*, c.name as customer_full_name, c.phone as customer_full_phone,
                  c.address, c.province_id, c.district_id, c.ward_id, c.street, c.hamlet,
                  c.email as customer_email
           FROM orders o
           LEFT JOIN customers c ON o.customer_id = c.id
           WHERE o.order_number = ? AND COALESCE(o.tenant_id,'default') = ?`
        ).bind(orderId, tenantId).first();
      } catch {}
    }

    // Try with usedCode
    if (!localOrder && usedCode && usedCode !== orderId) {
      try {
        localOrder = await c.env.DB.prepare(
          `SELECT o.*, c.name as customer_full_name, c.phone as customer_full_phone,
                  c.address, c.province_id, c.district_id, c.ward_id, c.street, c.hamlet,
                  c.email as customer_email
           FROM orders o
           LEFT JOIN customers c ON o.customer_id = c.id
           WHERE o.order_number = ? AND COALESCE(o.tenant_id,'default') = ?`
        ).bind(usedCode, tenantId).first();
      } catch {}
    }

    // Try via shipping_orders table
    if (!localOrder) {
      try {
        const shipping = await c.env.DB.prepare(
          `SELECT order_id, payload FROM shipping_orders
           WHERE carrier = 'ghtk' AND carrier_order_code = ? AND COALESCE(tenant_id,'default') = ?`
        ).bind(usedCode, tenantId).first();
        if (shipping) {
          // Get payload for additional info
          try {
            shippingPayload = typeof (shipping as any).payload === 'string'
              ? JSON.parse((shipping as any).payload)
              : (shipping as any).payload;
          } catch {
            shippingPayload = {};
          }

          localOrder = await c.env.DB.prepare(
            `SELECT o.*, c.name as customer_full_name, c.phone as customer_full_phone,
                    c.address, c.province_id, c.district_id, c.ward_id, c.street, c.hamlet,
                    c.email as customer_email
             FROM orders o
             LEFT JOIN customers c ON o.customer_id = c.id
             WHERE o.id = ? AND COALESCE(o.tenant_id,'default') = ?`
          ).bind((shipping as any).order_id, tenantId).first();
        }
      } catch {}
    }

    // Try via orders.shipping_order_code
    if (!localOrder) {
      try {
        localOrder = await c.env.DB.prepare(
          `SELECT o.*, c.name as customer_full_name, c.phone as customer_full_phone,
                  c.address, c.province_id, c.district_id, c.ward_id, c.street, c.hamlet,
                  c.email as customer_email
           FROM orders o
           LEFT JOIN customers c ON o.customer_id = c.id
           WHERE o.shipping_order_code = ? AND COALESCE(o.tenant_id,'default') = ?`
        ).bind(usedCode, tenantId).first();
      } catch {}
    }

    // If still no order but have customer_id from GHTK, try to get customer directly
    if (!localOrder && orderDetails.customer_id) {
      try {
        localCustomer = await c.env.DB.prepare(
          `SELECT * FROM customers WHERE id = ? AND COALESCE(tenant_id,'default') = ?`
        ).bind(orderDetails.customer_id, tenantId).first();
      } catch {}
    }

    // Build complete customer data from all sources (Manual customer_info first, then DB, then GHTK, then payload)
    const customerName = shippingPayload?.customer_info?.name
      || (localOrder as any)?.customer_full_name
      || (localOrder as any)?.customer_name
      || (localCustomer as any)?.name
      || shippingPayload?.order?.name
      || orderDetails.customer_fullname
      || orderDetails.customer_name
      || orderDetails.pick_name
      || '';

    const customerPhone = shippingPayload?.customer_info?.phone
      || (localOrder as any)?.customer_full_phone
      || (localOrder as any)?.customer_phone
      || (localCustomer as any)?.phone
      || shippingPayload?.order?.tel
      || orderDetails.customer_tel
      || orderDetails.customer_phone
      || orderDetails.pick_tel
      || '';

    // Build full address from all components
    const buildFullAddress = (data: any) => {
      const parts = [];
      if (data?.street) parts.push(data.street);
      if (data?.hamlet) parts.push(data.hamlet);
      if (data?.ward_id) parts.push(`Ward ${data.ward_id}`);
      if (data?.district_id) parts.push(`District ${data.district_id}`);
      if (data?.province_id) parts.push(`Province ${data.province_id}`);
      return parts.filter(Boolean).join(', ');
    };

    // Extract GHTK order data first for use in address building
    const ghtkOrder = (orderDetails as any).order || orderDetails;

    const customerAddress = shippingPayload?.customer_info?.address
      || (localOrder as any)?.address
      || (localCustomer as any)?.address
      || buildFullAddress(localOrder)
      || buildFullAddress(localCustomer)
      || buildFullAddress(shippingPayload?.customer_info)
      || shippingPayload?.order?.address
      || ghtkOrder.address
      || ghtkOrder.customer_address
      || ghtkOrder.pick_address
      || '';

    // Enrich raw_data with database info to ensure frontend has everything
    const enrichedRawData = {
      ...orderDetails,
      // Add GHTK order data at root level
      order: ghtkOrder,
      // Add database customer data
      customer_fullname: customerName,
      customer_tel: customerPhone,
      customer_phone: customerPhone,
      address: customerAddress,
      // Add detailed address components from database and customer_info
      street: shippingPayload?.customer_info?.street || (localOrder as any)?.street || (localCustomer as any)?.street || ghtkOrder.street || '',
      hamlet: shippingPayload?.customer_info?.hamlet || (localOrder as any)?.hamlet || (localCustomer as any)?.hamlet || ghtkOrder.hamlet || '',
      ward: shippingPayload?.customer_info?.ward || (localOrder as any)?.ward_id || (localCustomer as any)?.ward_id || ghtkOrder.ward || '',
      district: shippingPayload?.customer_info?.district || (localOrder as any)?.district_id || (localCustomer as any)?.district_id || ghtkOrder.district || '',
      province: shippingPayload?.customer_info?.province || (localOrder as any)?.province_id || (localCustomer as any)?.province_id || ghtkOrder.province || '',
      // Keep pickup info from GHTK
      pick_name: shippingPayload?.order?.pick_name || ghtkOrder.pick_name || '',
      pick_tel: shippingPayload?.order?.pick_tel || ghtkOrder.pick_tel || '',
      pick_address: shippingPayload?.order?.pick_address || ghtkOrder.pick_address || '',
      pick_street: shippingPayload?.order?.pick_street || ghtkOrder.pick_street || '',
      pick_ward: shippingPayload?.order?.pick_ward || ghtkOrder.pick_ward || '',
      pick_district: shippingPayload?.order?.pick_district || ghtkOrder.pick_district || '',
      pick_province: shippingPayload?.order?.pick_province || ghtkOrder.pick_province || '',
      // Add email if available
      customer_email: (localOrder as any)?.customer_email || (localCustomer as any)?.email || ghtkOrder.customer_email || ''
    };

    // Transform to a complete data structure with ALL available info
    const transformedOrder = {
      order_id: orderId,
      tracking_code: usedCode,
      status: ghtkOrder.status || ghtkOrder.status_text || '',
      status_text: ghtkOrder.status_text || ghtkOrder.status || '',
      cod_amount: ghtkOrder.pick_money ?? ghtkOrder.cod_amount ?? (localOrder as any)?.total_amount ?? 0,
      final_service_fee: ghtkOrder.ship_money ?? 0,
      insurance_fee: ghtkOrder.insurance ?? 0,
      total_value: ghtkOrder.value ?? (localOrder as any)?.total_amount ?? 0,
      customer: {
        name: customerName,
        phone: customerPhone,
        address: customerAddress,
        email: enrichedRawData.customer_email,
        avatar: (customerName[0] || 'K').toUpperCase()
      },
      products: (ghtkOrder.products || []).map((p: any) => ({
        name: p.full_name || p.name || 'Sản phẩm',
        weight: p.weight || 0,
        quantity: p.quantity || 1,
        product_code: p.product_code,
        cost: p.cost,
        icon: 'circuit_board'
      })),
      notes: ghtkOrder.message || (localOrder as any)?.notes || '',
      tags: ghtkOrder.tags || [],
      order_info: {
        created: (localOrder as any)?.created_at || ghtkOrder.created || '',
        modified: ghtkOrder.modified || (localOrder as any)?.updated_at || '',
        pick_date: ghtkOrder.pick_date || '',
        deliver_date: ghtkOrder.deliver_date || '',
        storage_day: ghtkOrder.storage_day || 0,
        is_freeship: ghtkOrder.is_freeship || 0,
        total_weight: ghtkOrder.weight || 0
      },
      timeline: ghtkOrder.timeline || [],
      map: {
        center: {
          lat: ghtkOrder.lat || 0,
          lng: ghtkOrder.lng || 0
        },
        location: ghtkOrder.location || customerAddress,
        areas: ghtkOrder.areas || []
      },
      raw_data: enrichedRawData, // Use enriched data with DB info
      ghtk_integrated: true,
      ghtk_url: `https://khachhang.giaohangtietkiem.vn/web/van-hanh/don-hang/${usedCode}`,
      can_print: true,
      can_chat: false,
      can_add_notes: false,
      // Add debug info
      data_sources: {
        has_local_order: !!localOrder,
        has_local_customer: !!localCustomer,
        has_shipping_payload: !!shippingPayload,
        has_ghtk_data: !!orderDetails
      }
    };
    
    console.log(`[GHTK Order Detail] Successfully fetched order details - Request ID: ${requestId}`);
    
    return c.json({
      success: true,
      data: transformedOrder,
      used_code: usedCode,
      request_id: requestId
    });
    
  } catch (e: any) {
    console.error(`[GHTK Order Detail] Failed to fetch order details - Request ID: ${requestId}`, e);
    return c.json({ 
      success: false, 
      error: e?.message || 'Failed to get order details from GHTK',
      request_id: requestId
    }, 500);
  }
});

// GET /shipping/ghtk/health - health check for GHTK API
app.get('/health', async (c) => {
  try {
    const svc = new ShippingGHTKService(c.env);
    const res = await svc.healthCheck();
    return c.json(res, res.success ? 200 : 503);
  } catch (e: any) {
    return c.json({ success: false, error: e?.message || 'GHTK API health check failed' }, 503);
  }
});

// GET /shipping/ghtk/provinces - get provinces list
app.get('/provinces', async (c) => {
  try {
    const svc = new ShippingGHTKService(c.env);
    const res = await svc.getProvinces();
    return c.json(res, res.success ? 200 : 400);
  } catch (e: any) {
    return c.json({ success: false, error: e?.message || 'Failed to get provinces' }, 500);
  }
});

// GET /shipping/ghtk/districts/:province_code - get districts by province
app.get('/districts/:province_code', async (c) => {
  try {
    const svc = new ShippingGHTKService(c.env);
    const provinceCode = c.req.param('province_code');
    const res = await svc.getDistricts(provinceCode);
    return c.json(res, res.success ? 200 : 400);
  } catch (e: any) {
    return c.json({ success: false, error: e?.message || 'Failed to get districts' }, 500);
  }
});

// POST /shipping/ghtk/sync-by-codes - đồng bộ đơn hàng từ GHTK bằng order codes
app.post('/sync-by-codes', async (c) => {
  const requestId = `sync-codes-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    console.log(`[GHTK Sync Codes] Starting sync by codes - Request ID: ${requestId}`);

    const body = await c.req.json();
    const orderCodes: string[] = body.order_codes || body.codes || [];

    if (!orderCodes || orderCodes.length === 0) {
      return c.json({
        success: false,
        error: 'Please provide order_codes array'
      }, 400);
    }

    const { GHTKRealSyncService } = await import('../../services/GHTKRealSyncService');
    const syncService = new GHTKRealSyncService(c.env);

    // Sync orders by codes
    const syncResult = await syncService.syncOrdersByCodesBatch(orderCodes);

    console.log(`[GHTK Sync Codes] Sync completed - Request ID: ${requestId}`, {
      total: orderCodes.length,
      synced: syncResult.synced,
      errors: syncResult.errors.length
    });

    return c.json({
      success: syncResult.synced > 0,
      synced: syncResult.synced,
      total: orderCodes.length,
      errors: syncResult.errors,
      message: `Successfully synced ${syncResult.synced}/${orderCodes.length} orders from GHTK`
    });
  } catch (e: any) {
    console.error(`[GHTK Sync Codes] Sync failed - Request ID: ${requestId}`, e);
    return c.json({
      success: false,
      error: e?.message || 'Failed to sync orders by codes'
    }, 500);
  }
});

// POST /shipping/ghtk/sync-real - đồng bộ dữ liệu thật từ GHTK chính thức
app.post('/sync-real', async (c) => {
  const requestId = `sync-real-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`[GHTK Real Sync] Starting real data sync - Request ID: ${requestId}`);
    
    const { GHTKRealSyncService } = await import('../../services/GHTKRealSyncService');
    const syncService = new GHTKRealSyncService(c.env);
    
    // Lấy dữ liệu thật từ GHTK
    const ghtkResult = await syncService.getRealOrdersFromGHTK();
    
    if (!ghtkResult.success) {
      console.error(`[GHTK Real Sync] Failed to fetch from GHTK - Request ID: ${requestId}`, ghtkResult.error);
      return c.json({
        success: false,
        error: ghtkResult.error || 'Failed to fetch data from GHTK'
      }, 400);
    }

    // Đồng bộ vào database
    const syncResult = await syncService.syncOrdersToDatabase(ghtkResult.data || []);
    
    console.log(`[GHTK Real Sync] Sync completed - Request ID: ${requestId}`, {
      synced: syncResult.synced,
      errors: syncResult.errors.length
    });

    return c.json({
      success: syncResult.success,
      synced: syncResult.synced,
      total: ghtkResult.data?.length || 0,
      errors: syncResult.errors,
      message: `Successfully synced ${syncResult.synced} orders from GHTK`
    });
  } catch (e: any) {
    console.error(`[GHTK Real Sync] Sync failed - Request ID: ${requestId}`, e);
    return c.json({ 
      success: false, 
      error: e?.message || 'Failed to sync real data from GHTK' 
    }, 500);
  }
});

// GET /shipping/ghtk/real-orders - lấy danh sách đơn hàng thật từ GHTK
app.get('/real-orders', async (c) => {
  try {
    const { GHTKRealSyncService } = await import('../../services/GHTKRealSyncService');
    const syncService = new GHTKRealSyncService(c.env);
    
    const result = await syncService.getRealOrdersFromGHTK();
    
    if (result.success && result.data) {
      // Transform để frontend có thể hiển thị
      const transformedOrders = result.data.map(order => ({
        id: `ghtk-${order.order_id}`,
        order_id: order.order_id,
        carrier: 'ghtk',
        carrier_order_code: order.label,
        status: order.status_text,
        fee_amount: order.total_fee,
        service: 'road',
        created_at: order.created_at,
        updated_at: order.updated_at,
        payload: order,
        response: order,
        ghtk_integrated: true,
        ghtk_url: syncService.createGHTKDeepLink(order.label),
        can_sync: true,
        can_print_label: true,
        can_cancel: !['delivered', 'cancelled', 'returned', 'đã giao', 'đã hủy', 'đã trả hàng'].includes(order.status.toLowerCase()),
        // Thông tin chi tiết từ GHTK
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        customer_address: order.customer_address,
        cod_amount: order.cod_amount,
        products: order.products,
        tags: order.tags,
        timeline: order.timeline
      }));

      return c.json({
        success: true,
        data: transformedOrders,
        pagination: {
          page: 1,
          limit: transformedOrders.length,
          total: transformedOrders.length,
          totalPages: 1
        },
        ghtk_integration: {
          enabled: true,
          base_url: 'https://khachhang.giaohangtietkiem.vn',
          orders_url: 'https://khachhang.giaohangtietkiem.vn/web/van-hanh/don-hang',
          new_order_url: syncService.createNewOrderLink(),
          overview_url: syncService.createOverviewLink()
        }
      });
    }
    
    return c.json({
      success: false,
      error: result.error || 'Failed to fetch real orders from GHTK'
    }, 400);
  } catch (e: any) {
    return c.json({ 
      success: false, 
      error: e?.message || 'Failed to get real orders from GHTK' 
    }, 500);
  }
});

// POST /shipping/ghtk/create-sample - tạo đơn hàng GHTK mẫu để test
app.post('/create-sample', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId') || 'system';

    // Tạo đơn hàng mẫu
    const sampleOrder = {
      order: {
        id: `sample-${Date.now()}`,
        name: 'Nguyễn Văn A',
        tel: '0912345678',
        address: '123 Nguyễn Huệ, Quận 1, TP Hồ Chí Minh',
        province: 'TP Hồ Chí Minh',
        district: 'Quận 1',
        pick_name: 'SmartPOS Store',
        pick_tel: '0912345679',
        pick_address: '456 Lê Lợi, Quận 1, TP Hồ Chí Minh',
        pick_province: 'TP Hồ Chí Minh',
        pick_district: 'Quận 1',
        value: 0, // COD = 0 (đơn không thu tiền)
        weight: 500,
        is_freeship: 0,
        transport: 'road' as 'road' | 'fly',
      },
      products: [
        {
          name: 'Sản phẩm mẫu',
          weight: 500,
          quantity: 1,
          price: 0
        }
      ]
    };

    const svc = new ShippingGHTKService(c.env);
    const persist = new ShippingPersistenceService(c.env);
    
    // Tạo đơn hàng thật trên GHTK
    const ghtkResult = await svc.createOrder(sampleOrder);
    
    if (ghtkResult.success && ghtkResult.data) {
      const orderData = ghtkResult.data;
      
      // Lưu vào database local
      await persist.upsertShippingOrder({
        tenant_id: tenantId,
        carrier: 'ghtk',
        carrier_order_code: orderData.label_id,
        status: orderData.status_text || 'Chưa tiếp nhận',
        fee_amount: orderData.ship_money || 0,
        service: 'road',
        payload: sampleOrder,
        response: orderData
      });

      return c.json({
        success: true,
        data: {
          label_id: orderData.label_id,
          status: orderData.status_text,
          fee: orderData.ship_money,
          created_at: new Date().toISOString(),
          ghtk_url: `https://khachhang.giaohangtietkiem.vn/web/van-hanh/don-hang/${orderData.label_id}`
        },
        message: 'Sample GHTK order created successfully'
      });
    }

    return c.json({
      success: false,
      error: ghtkResult.error || 'Failed to create sample order'
    });
  } catch (e: any) {
    console.error('❌ Create sample order error:', e);
    return c.json({ success: false, error: e?.message || 'Failed to create sample order' }, 500);
  }
});

// PUT /shipping/ghtk/order-detail/:order_id/customer - update customer info manually
app.put('/order-detail/:order_id/customer', async (c) => {
  const requestId = `update-customer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    console.log(`[GHTK Update Customer] Starting update for order: ${c.req.param('order_id')} - Request ID: ${requestId}`);

    const orderId = c.req.param('order_id');
    const body = await c.req.json();
    const tenantId = (c.get as any)('tenantId') || 'default';

    const { name, phone, address, street, hamlet, ward, district, province } = body;

    // Find shipping order by carrier_order_code containing orderId
    let shippingOrder: any = await c.env.DB.prepare(
      `SELECT * FROM shipping_orders
       WHERE carrier = 'ghtk' AND carrier_order_code LIKE ? AND COALESCE(tenant_id,'default') = ?`
    ).bind(`%${orderId}%`, tenantId).first();

    // If not found, create new record
    if (!shippingOrder) {
      const fullCode = `S21632601.BO.MT19-08-K23.${orderId}`;
      await c.env.DB.prepare(
        `INSERT INTO shipping_orders
         (tenant_id, carrier, carrier_order_code, order_id, status, payload, created_at)
         VALUES (?, 'ghtk', ?, ?, 'manual', '{}', datetime('now'))`
      ).bind(tenantId, fullCode, orderId).run();

      shippingOrder = await c.env.DB.prepare(
        `SELECT * FROM shipping_orders
         WHERE carrier = 'ghtk' AND carrier_order_code = ? AND COALESCE(tenant_id,'default') = ?`
      ).bind(fullCode, tenantId).first();
    }

    // Get current payload
    let payload: any = {};
    try {
      payload = typeof (shippingOrder as any).payload === 'string'
        ? JSON.parse((shippingOrder as any).payload || '{}')
        : (shippingOrder as any).payload || {};
    } catch {}

    // Update payload with customer info
    payload.customer_info = {
      name,
      phone,
      address,
      street,
      hamlet,
      ward,
      district,
      province,
      updated_at: new Date().toISOString()
    };

    // Save back to database
    await c.env.DB.prepare(
      `UPDATE shipping_orders
       SET payload = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).bind(JSON.stringify(payload), (shippingOrder as any).id).run();

    console.log(`[GHTK Update Customer] Successfully updated customer info - Request ID: ${requestId}`);

    return c.json({
      success: true,
      message: 'Customer information updated successfully',
      data: payload.customer_info
    });

  } catch (e: any) {
    console.error(`[GHTK Update Customer] Failed to update - Request ID: ${requestId}`, e);
    return c.json({
      success: false,
      error: e?.message || 'Failed to update customer information'
    }, 500);
  }
});

// GET /shipping/ghtk/calculate-fee - tính phí vận chuyển GHTK
app.get('/calculate-fee', async (c) => {
  try {
    const query = c.req.query();
    const {
      pick_province,
      pick_district,
      pick_ward,
      pick_street,
      pick_address,
      province,
      district,
      ward,
      street,
      address,
      weight,
      value,
      transport,
      tags
    } = query;

    // Validate required parameters
    if (!pick_province || !pick_district || !province || !district || !weight) {
      return c.json({
        success: false,
        error: 'Missing required parameters: pick_province, pick_district, province, district, weight'
      }, 400);
    }

    const svc = new ShippingGHTKService(c.env);
    
    // Build query parameters for GHTK API
    const feeParams = new URLSearchParams();
    feeParams.append('pick_province', pick_province);
    feeParams.append('pick_district', pick_district);
    feeParams.append('province', province);
    feeParams.append('district', district);
    feeParams.append('weight', weight);

    // Optional parameters
    if (pick_ward) feeParams.append('pick_ward', pick_ward);
    if (pick_street) feeParams.append('pick_street', pick_street);
    if (pick_address) feeParams.append('pick_address', pick_address);
    if (ward) feeParams.append('ward', ward);
    if (street) feeParams.append('street', street);
    if (address) feeParams.append('address', address);
    if (value) feeParams.append('value', value);
    if (transport) feeParams.append('transport', transport);
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      tagArray.forEach(tag => feeParams.append('tags[]', tag));
    }

    // Call GHTK fee calculation API
    const feeResult = await svc.calculateFee(feeParams);
    
    if (feeResult.success) {
      return c.json({
        success: true,
        data: feeResult.data,
        message: 'Fee calculated successfully'
      });
    }

    return c.json({
      success: false,
      error: feeResult.error || 'Failed to calculate shipping fee'
    }, 400);
  } catch (e: any) {
    console.error('❌ Calculate fee error:', e);
    return c.json({ success: false, error: e?.message || 'Failed to calculate fee' }, 500);
  }
});

export default app;


