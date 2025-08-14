// ==========================================
// REAL-TIME NOTIFICATION SYSTEM
// WebSocket-based real-time notifications
// ==========================================

import { Hono } from 'hono';
import { Env } from '../types';
import { authenticate, getUser } from '../middleware/auth';

const app = new Hono<{ Bindings: Env }>();

// ==========================================
// REAL-TIME NOTIFICATIONS
// ==========================================

// GET /realtime-notifications/stream - Server-Sent Events stream
app.get('/stream', authenticate, async (c) => {
  const user = getUser(c);
  
  // Set up Server-Sent Events
  c.header('Content-Type', 'text/event-stream');
  c.header('Cache-Control', 'no-cache');
  c.header('Connection', 'keep-alive');
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Headers', 'Cache-Control');

  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const data = JSON.stringify({
        type: 'connection',
        message: 'Connected to SmartPOS notifications',
        timestamp: new Date().toISOString(),
        user_id: user.sub
      });
      
      controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      
      // Set up periodic notifications check
      const interval = setInterval(async () => {
        try {
          const env = c.env as Env;
          
          // Check for new notifications
          const notifications = await env.DB.prepare(`
            SELECT 
              'warranty_expiring' as type,
              'Bảo hành sắp hết hạn' as title,
              sn.serial_number,
              p.name as product_name,
              c.full_name as customer_name,
              sn.warranty_end_date,
              'urgent' as priority
            FROM serial_numbers sn
            LEFT JOIN products p ON sn.product_id = p.id
            LEFT JOIN customers c ON sn.customer_id = c.id
            WHERE sn.warranty_end_date <= datetime('now', '+7 days') 
              AND sn.warranty_end_date > datetime('now')
              AND sn.status = 'sold'
              AND c.id IS NOT NULL
            
            UNION ALL
            
            SELECT 
              'low_stock' as type,
              'Sản phẩm sắp hết hàng' as title,
              '' as serial_number,
              p.name as product_name,
              '' as customer_name,
              datetime('now') as warranty_end_date,
              'medium' as priority
            FROM products p
            WHERE p.stock_quantity <= p.min_stock_level
              AND p.min_stock_level > 0
            
            UNION ALL
            
            SELECT 
              'new_warranty_claim' as type,
              'Yêu cầu bảo hành mới' as title,
              sn.serial_number,
              p.name as product_name,
              c.full_name as customer_name,
              wc.reported_date as warranty_end_date,
              'high' as priority
            FROM warranty_claims wc
            JOIN warranty_registrations wr ON wc.warranty_registration_id = wr.id
            JOIN serial_numbers sn ON wr.serial_number_id = sn.id
            JOIN products p ON wr.product_id = p.id
            JOIN customers c ON wr.customer_id = c.id
            WHERE wc.status = 'submitted'
              AND wc.reported_date >= datetime('now', '-1 hours')
            
            ORDER BY warranty_end_date ASC
            LIMIT 10
          `).all();

          if (notifications.results && notifications.results.length > 0) {
            const notificationData = JSON.stringify({
              type: 'notifications',
              data: notifications.results,
              timestamp: new Date().toISOString(),
              count: notifications.results.length
            });
            
            controller.enqueue(encoder.encode(`data: ${notificationData}\n\n`));
          }
          
          // Send heartbeat
          const heartbeat = JSON.stringify({
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          });
          
          controller.enqueue(encoder.encode(`data: ${heartbeat}\n\n`));
          
        } catch (error) {
          console.error('Error in notification stream:', error);
        }
      }, 30000); // Check every 30 seconds

      // Clean up on close
      return () => {
        clearInterval(interval);
      };
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    }
  });
});

// GET /realtime-notifications/latest - Get latest notifications
app.get('/latest', authenticate, async (c) => {
  try {
    const env = c.env as Env;
    const user = getUser(c);

    const notifications = await env.DB.prepare(`
      SELECT 
        'warranty_expiring' as type,
        'Bảo hành sắp hết hạn' as title,
        'Sản phẩm ' || p.name || ' (SN: ' || sn.serial_number || ') của khách hàng ' || c.full_name || ' sẽ hết bảo hành vào ' || sn.warranty_end_date as message,
        sn.warranty_end_date as created_at,
        CASE 
          WHEN sn.warranty_end_date <= datetime('now', '+3 days') THEN 'error'
          WHEN sn.warranty_end_date <= datetime('now', '+7 days') THEN 'warning'
          ELSE 'info'
        END as severity,
        'warranty' as category
      FROM serial_numbers sn
      LEFT JOIN products p ON sn.product_id = p.id
      LEFT JOIN customers c ON sn.customer_id = c.id
      WHERE sn.warranty_end_date <= datetime('now', '+30 days') 
        AND sn.warranty_end_date > datetime('now')
        AND sn.status = 'sold'
        AND c.id IS NOT NULL
      
      UNION ALL
      
      SELECT 
        'low_stock' as type,
        'Sản phẩm sắp hết hàng' as title,
        'Sản phẩm ' || p.name || ' chỉ còn ' || p.stock_quantity || ' trong kho' as message,
        datetime('now') as created_at,
        CASE 
          WHEN p.stock_quantity = 0 THEN 'error'
          WHEN p.stock_quantity <= 5 THEN 'warning'
          ELSE 'info'
        END as severity,
        'inventory' as category
      FROM products p
      WHERE p.stock_quantity <= p.min_stock_level
        AND p.min_stock_level > 0
      
      UNION ALL
      
      SELECT 
        'new_sale' as type,
        'Đơn hàng mới' as title,
        'Đơn hàng #' || s.receipt_number || ' trị giá ' || printf('%.0f', s.total_amount) || ' VNĐ' as message,
        s.created_at,
        'success' as severity,
        'sales' as category
      FROM sales s
      WHERE s.created_at >= datetime('now', '-2 hours')
      
      ORDER BY created_at DESC
      LIMIT 20
    `).all();

    return c.json({
      success: true,
      data: notifications.results || [],
      message: 'Latest notifications retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching latest notifications:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi tải thông báo',
      data: null
    }, 500);
  }
});

// POST /realtime-notifications/mark-read - Mark notifications as read
app.post('/mark-read', authenticate, async (c) => {
  try {
    const env = c.env as Env;
    const user = getUser(c);
    
    const { notification_ids } = await c.req.json();
    
    if (!Array.isArray(notification_ids)) {
      return c.json({
        success: false,
        message: 'notification_ids must be an array',
        data: null
      }, 400);
    }

    // Mark notifications as read in database
    const placeholders = notification_ids.map(() => '?').join(',');
    await env.DB.prepare(`
      UPDATE notification_logs 
      SET read_at = datetime('now')
      WHERE id IN (${placeholders})
        AND (user_id = ? OR user_id IS NULL)
    `).bind(...notification_ids, user.sub).run();

    return c.json({
      success: true,
      data: { marked_count: notification_ids.length },
      message: 'Notifications marked as read'
    });

  } catch (error) {
    console.error('❌ Error marking notifications as read:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi đánh dấu thông báo đã đọc',
      data: null
    }, 500);
  }
});

export default app;
