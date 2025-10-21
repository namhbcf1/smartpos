import { Hono } from 'hono';
import { Env } from '../../types';

const app = new Hono<{ Bindings: Env }>();

// Helper functions
const createSuccessResponse = (data: any, message: string) => ({
  success: true,
  data,
  message
});

const createErrorResponse = (message: string) => ({
  success: false,
  error: message
});

// Get current cart (mock data for now)
app.get('/cart', async (c) => {
  try {
    const mockCart = {
      items: [],
      summary: {
        item_count: 0,
        total_quantity: 0,
        subtotal: 0,
        discount_amount: 0,
        tax_amount: 0,
        total: 0
      }
    };

    return c.json(createSuccessResponse(mockCart, 'Cart retrieved successfully'));
  } catch (error) {
    console.error('Get cart error:', error);
    return c.json(createErrorResponse('Failed to retrieve cart'), 500);
  }
});

// Add item to cart
app.post('/cart/items', async (c) => {
  try {
    const data = await c.req.json();
    
    const mockItem = {
      id: `item_${Date.now()}`,
      product_id: data.product_id,
      variant_id: data.variant_id,
      quantity: data.quantity,
      unit_price: data.unit_price,
      discount_percent: data.discount_percent || 0,
      notes: data.notes,
      line_total: data.quantity * data.unit_price * (1 - (data.discount_percent || 0) / 100)
    };

    return c.json(createSuccessResponse(mockItem, 'Item added to cart successfully'));
  } catch (error) {
    console.error('Add to cart error:', error);
    return c.json(createErrorResponse('Failed to add item to cart'), 500);
  }
});

// Update cart item
app.put('/cart/items/:id', async (c) => {
  try {
    const itemId = c.req.param('id');
    const data = await c.req.json();
    
    return c.json(createSuccessResponse({ id: itemId, ...data }, 'Cart item updated successfully'));
  } catch (error) {
    console.error('Update cart item error:', error);
    return c.json(createErrorResponse('Failed to update cart item'), 500);
  }
});

// Remove item from cart
app.delete('/cart/items/:id', async (c) => {
  try {
    const itemId = c.req.param('id');
    
    return c.json(createSuccessResponse(null, 'Cart item removed successfully'));
  } catch (error) {
    console.error('Remove cart item error:', error);
    return c.json(createErrorResponse('Failed to remove cart item'), 500);
  }
});

// Clear cart
app.delete('/cart', async (c) => {
  try {
    return c.json(createSuccessResponse(null, 'Cart cleared successfully'));
  } catch (error) {
    console.error('Clear cart error:', error);
    return c.json(createErrorResponse('Failed to clear cart'), 500);
  }
});

// Simple checkout (no auth required)
app.post('/checkout', async (c) => {
  try {
    const data = await c.req.json();
    
    // Generate order ID and number
    const orderId = `order_${Date.now()}`;
    const orderNumber = `ORD-${Date.now()}`;
    const now = new Date().toISOString();
    
    // Get cart items from request
    const cartItems = data.cart_items || [];
    const customerInfo = data.customer_info || {};
    const paymentMethod = data.payment_method || 'cash';
    const totalAmount = data.total_amount || 0;
    
    console.log('Checkout data:', JSON.stringify(data, null, 2));
    console.log('Cart items:', cartItems);
    
    // Validate serialized items: require serial numbers and prevent duplicates
    const providedSerialsSet = new Set<string>();
    for (const item of cartItems) {
      // Check if product requires serials
      const product = await c.env.DB.prepare(`
        SELECT id, name, sku, COALESCE(is_serialized, 0) AS is_serialized
        FROM products
        WHERE id = ? AND COALESCE(tenant_id, 'default') = 'default'
      `).bind(item.product_id).first();

      const serials: string[] = Array.isArray(item.serial_numbers) ? item.serial_numbers : [];
      const requiresSerial = (product && (product as any).is_serialized === 1) || serials.length > 0;
      if (product && requiresSerial) {
        if (serials.length !== Number(item.quantity || 0)) {
          return c.json(createErrorResponse(`Sản phẩm yêu cầu serial: ${product.name}. Cần ${item.quantity}, hiện có ${serials.length}`), 400);
        }
        // Check duplicates in payload
        for (const s of serials) {
          const key = `${item.product_id}::${String(s).trim()}`;
          if (providedSerialsSet.has(key)) {
            return c.json(createErrorResponse(`Serial bị trùng trong đơn: ${s}`), 400);
          }
          providedSerialsSet.add(key);
        }
        // Validate existence and availability in DB (and not sold/linked to another order)
        for (const s of serials) {
          const sn = await c.env.DB.prepare(`
            SELECT id, serial_number, status
            , order_id, reserved_by, reserved_until
            FROM serial_numbers
            WHERE product_id = ?
              AND serial_number = ?
              AND COALESCE(tenant_id, 'default') = 'default'
          `).bind(item.product_id, String(s).trim()).first();

          if (!sn) {
            return c.json(createErrorResponse(`Không tìm thấy serial: ${s} cho sản phẩm ${product.name}`), 400);
          }
          const status = (sn as any).status;
          const linkedOrderId = (sn as any).order_id;
          const reservedBy = (sn as any).reserved_by;
          const reservedUntil = (sn as any).reserved_until as string | null;

          // Already sold or linked
          if (status === 'sold' || (linkedOrderId && linkedOrderId !== null)) {
            return c.json(createErrorResponse(`Serial ${s} đã được bán hoặc gán cho đơn khác`), 409);
          }

          // If currently reserved and not expired, block
          if (reservedUntil && new Date(reservedUntil).getTime() > Date.now()) {
            return c.json(createErrorResponse(`Serial ${s} đang được giữ chỗ, vui lòng chọn serial khác`), 409);
          }
          if (status !== 'in_stock' && status !== 'available' && status !== 'reserved') {
            return c.json(createErrorResponse(`Serial ${s} không ở trạng thái sẵn sàng (hiện tại: ${status})`), 400);
          }
        }
      }
    }

    // Create order in database
    const orderResult = await c.env.DB.prepare(`
      INSERT INTO orders (
        id, order_number, customer_id, user_id, store_id, status,
        subtotal_cents, discount_cents, tax_cents, total_cents,
        payment_method, payment_status, customer_name, customer_phone,
        created_at, updated_at, tenant_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      orderId,
      orderNumber,
      customerInfo.customer_id || null,
      'admin', // Default user
      'default', // Default store
      'completed',
      Math.round(totalAmount * 0.9), // Subtotal (before tax)
      0, // Discount
      Math.round(totalAmount * 0.1), // Tax
      Math.round(totalAmount), // Total
      paymentMethod,
      'completed',
      customerInfo.name || 'Khách lẻ',
      customerInfo.phone || '',
      now,
      now,
      'default'
    ).run();
    
    // Create order items
    console.log('Creating order items for order:', orderId);
    for (const item of cartItems) {
      const itemId = `item_${Date.now()}_${Math.random()}`;
      console.log('Creating order item:', itemId, item);
      console.log('Unit price cents:', item.unit_price_cents, 'Type:', typeof item.unit_price_cents);
      console.log('Total price cents:', item.total_price_cents, 'Type:', typeof item.total_price_cents);
      
      const unitPrice = Math.round(Number(item.unit_price_cents) || 0);
      const totalPrice = Math.round(Number(item.total_price_cents) || 0);
      
      console.log('Rounded unit price:', unitPrice);
      console.log('Rounded total price:', totalPrice);
      
      const result = await c.env.DB.prepare(`
        INSERT INTO order_items (
          id, order_id, product_id, quantity, unit_price_cents,
          total_price_cents, product_name, product_sku, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        itemId,
        orderId,
        item.product_id,
        item.quantity,
        unitPrice,
        totalPrice,
        item.product_name,
        item.sku || '',
        now
      ).run();
      
      console.log('Order item created:', result);

      // If product is serialized, mark serials as sold and link to order
      const product = await c.env.DB.prepare(`
        SELECT COALESCE(is_serialized, 0) AS is_serialized, name
        FROM products WHERE id = ? AND COALESCE(tenant_id, 'default') = 'default'
      `).bind(item.product_id).first();
      const serials: string[] = Array.isArray(item.serial_numbers) ? item.serial_numbers : [];
      const requiresSerial = (product && (product as any).is_serialized === 1) || serials.length > 0;
      if (product && requiresSerial) {
        for (const s of serials) {
          // Determine warranty dates (start now, end after warranty_months if available)
          const snInfo = await c.env.DB.prepare(`
            SELECT id, warranty_months FROM serial_numbers
            WHERE product_id = ? AND serial_number = ? AND COALESCE(tenant_id, 'default') = 'default'
          `).bind(item.product_id, String(s).trim()).first();

          const warrantyMonths = Number((snInfo as any)?.warranty_months || 12);
          const startDate = new Date(now);
          const endDate = new Date(startDate);
          endDate.setMonth(endDate.getMonth() + (isNaN(warrantyMonths) ? 12 : warrantyMonths));
          const warrantyStart = startDate.toISOString();
          const warrantyEnd = endDate.toISOString();

          // Re-check availability atomically and update to sold
          const updated = await c.env.DB.prepare(`
            UPDATE serial_numbers
            SET status = 'sold',
                sold_date = ?,
                warranty_start_date = ?,
                warranty_end_date = ?,
                order_id = ?,
                order_item_id = ?,
                reserved_at = NULL,
                reserved_by = NULL,
                reserved_until = NULL,
                updated_at = ?
            WHERE product_id = ?
              AND serial_number = ?
              AND COALESCE(tenant_id, 'default') = 'default'
              AND status IN ('in_stock','available','reserved')
          `).bind(now, warrantyStart, warrantyEnd, orderId, itemId, now, item.product_id, String(s).trim()).run();

          if ((updated as any).success === false || (updated as any).meta?.changes === 0) {
            return c.json(createErrorResponse(`Không thể cập nhật serial ${s}`), 409);
          }
        }
      }
    }
    
    // Update inventory (reduce stock)
    for (const item of cartItems) {
      await c.env.DB.prepare(`
        UPDATE products 
        SET stock = stock - ?, updated_at = ?
        WHERE id = ? AND tenant_id = ?
      `).bind(item.quantity, now, item.product_id, 'default').run();
    }
    
    // Create inventory movement record
    for (const item of cartItems) {
      await c.env.DB.prepare(`
        INSERT INTO inventory_movements (
          id, product_id, transaction_type, quantity, unit_cost_cents,
          reference_id, reference_type, reason, user_id, store_id,
          product_name, product_sku, created_at, tenant_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        `movement_${Date.now()}_${Math.random()}`,
        item.product_id,
        'sale',
        -item.quantity, // Negative for sale
        Math.round(item.unit_price_cents),
        orderId,
        'order',
        'POS Sale',
        'admin',
        'default',
        item.product_name,
        item.sku || '',
        now,
        'default'
      ).run();
    }
    
    // Update customer statistics if customer exists
    if (customerInfo.customer_id) {
      console.log('Updating customer statistics for:', customerInfo.customer_id);
      
      // Get current customer data
      const customer = await c.env.DB.prepare(`
        SELECT total_spent_cents, visit_count, loyalty_points, total_orders 
        FROM customers 
        WHERE id = ? AND tenant_id = ?
      `).bind(customerInfo.customer_id, 'default').first();
      
      if (customer) {
        const currentSpent = Number((customer as any).total_spent_cents) || 0;
        const currentVisits = Number((customer as any).visit_count) || 0;
        const currentPoints = Number((customer as any).loyalty_points) || 0;
        const currentOrders = Number((customer as any).total_orders) || 0;
        
        // Calculate subtotal (before tax) from cart items
        const subtotalCents = cartItems.reduce((sum, item) => sum + Math.round(Number(item.total_price_cents) || 0), 0);
        
        // Calculate new values
        const newSpent = currentSpent + subtotalCents;
        const newVisits = currentVisits + 1;
        const newPoints = currentPoints + Math.round(subtotalCents * 0.01); // 1% of subtotal as points
        const newOrders = currentOrders + 1; // Increment order count
        
        console.log('Customer stats update:', {
          subtotalCents,
          currentSpent,
          newSpent,
          currentVisits,
          newVisits,
          currentPoints,
          newPoints,
          currentOrders,
          newOrders
        });
        
        // Update customer statistics
        await c.env.DB.prepare(`
          UPDATE customers 
          SET total_spent_cents = ?, visit_count = ?, loyalty_points = ?, total_orders = ?,
              last_visit = ?, updated_at = ?
          WHERE id = ? AND tenant_id = ?
        `).bind(
          newSpent,
          newVisits,
          newPoints,
          newOrders,
          now,
          now,
          customerInfo.customer_id,
          'default'
        ).run();
        
        console.log('Customer statistics updated successfully');
      }
    }
    
    const orderData = {
      id: orderId,
      order_number: orderNumber,
      status: 'completed',
      total_amount: totalAmount,
      payment_method: paymentMethod,
      created_at: now,
      items: cartItems
    };
    
    return c.json(createSuccessResponse(orderData, 'Checkout completed successfully'));
  } catch (error) {
    console.error('Checkout error:', error);
    return c.json(createErrorResponse('Failed to process checkout'), 500);
  }
});

// Test API to check order items
app.get('/test-order/:orderId', async (c) => {
  try {
    const orderId = c.req.param('orderId');
    
    // Get order
    const order = await c.env.DB.prepare(`
      SELECT * FROM orders WHERE id = ?
    `).bind(orderId).first();
    
    // Get order items
    const items = await c.env.DB.prepare(`
      SELECT * FROM order_items WHERE order_id = ?
    `).bind(orderId).all();
    
    console.log('Order items from DB:', items.results);
    
    return c.json({
      success: true,
      data: {
        order,
        items: items.results || []
      }
    });
  } catch (error) {
    console.error('Test order error:', error);
    return c.json(createErrorResponse('Failed to get order'), 500);
  }
});

export default app;