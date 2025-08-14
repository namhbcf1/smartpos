// ==========================================
// COMPLETE SERIAL NUMBER FLOW API
// Tracking từ nhập hàng đến bảo hành
// ==========================================

import { Hono } from 'hono';
import { Env } from '../types';
import { authenticate, authorize } from '../middleware/auth';
import { z } from 'zod';

const app = new Hono<{ Bindings: Env }>();

// ==========================================
// SERIAL NUMBER FLOW TRACKING
// ==========================================

// GET /serial-number-flow/:serialNumber - Complete flow tracking
app.get('/:serialNumber', authenticate, async (c) => {
  try {
    const env = c.env as Env;
    const serialNumber = c.req.param('serialNumber');

    console.log('🔍 Tracking serial number flow:', serialNumber);

    // Get complete serial number flow using the view
    const flowData = await env.DB.prepare(`
      SELECT * FROM v_serial_number_flow 
      WHERE serial_number = ?
    `).bind(serialNumber).first();

    if (!flowData) {
      return c.json({
        success: false,
        message: 'Không tìm thấy serial number',
        data: null
      }, 404);
    }

    // Get detailed history
    const history = await env.DB.prepare(`
      SELECT 
        'stock_in' as event_type,
        si.created_at as event_date,
        'Nhập kho' as event_description,
        si.reference_number as reference,
        sup.name as related_entity,
        si.total_amount as amount
      FROM serial_numbers sn
      JOIN stock_ins si ON sn.stock_in_id = si.id
      LEFT JOIN suppliers sup ON si.supplier_id = sup.id
      WHERE sn.serial_number = ?
      
      UNION ALL
      
      SELECT 
        'sale' as event_type,
        s.created_at as event_date,
        'Bán hàng' as event_description,
        s.receipt_number as reference,
        c.full_name as related_entity,
        s.final_amount as amount
      FROM serial_numbers sn
      JOIN sales s ON sn.sale_id = s.id
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE sn.serial_number = ?
      
      UNION ALL
      
      SELECT 
        'warranty_registration' as event_type,
        wr.created_at as event_date,
        'Đăng ký bảo hành' as event_description,
        wr.warranty_number as reference,
        wr.warranty_type as related_entity,
        NULL as amount
      FROM serial_numbers sn
      JOIN warranty_registrations wr ON sn.id = wr.serial_number_id
      WHERE sn.serial_number = ?
      
      UNION ALL
      
      SELECT 
        'warranty_claim' as event_type,
        wc.reported_date as event_date,
        'Yêu cầu bảo hành' as event_description,
        wc.claim_number as reference,
        wc.claim_type as related_entity,
        wc.estimated_cost as amount
      FROM serial_numbers sn
      JOIN warranty_registrations wr ON sn.id = wr.serial_number_id
      JOIN warranty_claims wc ON wr.id = wc.warranty_registration_id
      WHERE sn.serial_number = ?
      
      ORDER BY event_date ASC
    `).bind(serialNumber, serialNumber, serialNumber, serialNumber).all();

    const response = {
      success: true,
      data: {
        serial_number: serialNumber,
        current_status: flowData.status,
        flow_summary: flowData,
        history: history.results || [],
        timeline: {
          received_date: flowData.received_date,
          sold_date: flowData.sold_date,
          warranty_start: flowData.warranty_start_date,
          warranty_end: flowData.warranty_end_date,
          days_since_purchase: flowData.sold_date ? 
            Math.floor((new Date().getTime() - new Date(flowData.sold_date).getTime()) / (1000 * 60 * 60 * 24)) : null,
          warranty_days_remaining: flowData.warranty_end_date ? 
            Math.floor((new Date(flowData.warranty_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null,
        }
      },
      message: 'Lấy thông tin luồng serial number thành công'
    };

    return c.json(response);

  } catch (error) {
    console.error('❌ Error tracking serial number flow:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi theo dõi luồng serial number',
      data: null
    }, 500);
  }
});

// GET /serial-number-flow/stats/overview - Overall flow statistics
app.get('/stats/overview', authenticate, async (c) => {
  try {
    const env = c.env as Env;

    const stats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_serial_numbers,
        COUNT(CASE WHEN status = 'in_stock' THEN 1 END) as in_stock,
        COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold,
        COUNT(CASE WHEN status = 'warranty_claim' THEN 1 END) as under_warranty_claim,
        COUNT(CASE WHEN status = 'defective' THEN 1 END) as defective,
        COUNT(CASE WHEN warranty_end_date > datetime('now') THEN 1 END) as active_warranties,
        COUNT(CASE WHEN warranty_end_date <= datetime('now') AND warranty_end_date IS NOT NULL THEN 1 END) as expired_warranties,
        AVG(CASE WHEN sold_date IS NOT NULL THEN 
          julianday('now') - julianday(received_date) 
        END) as avg_days_in_stock,
        COUNT(CASE WHEN warranty_end_date <= datetime('now', '+30 days') AND warranty_end_date > datetime('now') THEN 1 END) as warranties_expiring_soon
      FROM serial_numbers
    `).first();

    // Get warranty claim statistics
    const claimStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_claims,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_claims,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_claims,
        AVG(CASE WHEN status = 'completed' AND resolution_date IS NOT NULL THEN 
          julianday(resolution_date) - julianday(reported_date) 
        END) as avg_resolution_days
      FROM warranty_claims
    `).first();

    return c.json({
      success: true,
      data: {
        serial_numbers: stats,
        warranty_claims: claimStats,
        calculated_metrics: {
          warranty_claim_rate: stats && stats.sold > 0 ? 
            ((claimStats?.total_claims || 0) / stats.sold * 100).toFixed(2) + '%' : '0%',
          stock_turnover_days: stats?.avg_days_in_stock ? 
            Math.round(stats.avg_days_in_stock) : 0,
        }
      },
      message: 'Lấy thống kê tổng quan thành công'
    });

  } catch (error) {
    console.error('❌ Error fetching flow statistics:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi lấy thống kê',
      data: null
    }, 500);
  }
});

// GET /serial-number-flow/alerts - Get alerts for serial numbers
app.get('/alerts', authenticate, async (c) => {
  try {
    const env = c.env as Env;

    const alerts = await env.DB.prepare(`
      SELECT 
        'warranty_expiring' as alert_type,
        'Bảo hành sắp hết hạn' as alert_title,
        sn.serial_number,
        p.name as product_name,
        c.full_name as customer_name,
        sn.warranty_end_date as alert_date,
        'warning' as severity
      FROM serial_numbers sn
      LEFT JOIN products p ON sn.product_id = p.id
      LEFT JOIN customers c ON sn.customer_id = c.id
      WHERE sn.warranty_end_date <= datetime('now', '+30 days') 
        AND sn.warranty_end_date > datetime('now')
        AND sn.status = 'sold'
      
      UNION ALL
      
      SELECT 
        'warranty_expired' as alert_type,
        'Bảo hành đã hết hạn' as alert_title,
        sn.serial_number,
        p.name as product_name,
        c.full_name as customer_name,
        sn.warranty_end_date as alert_date,
        'error' as severity
      FROM serial_numbers sn
      LEFT JOIN products p ON sn.product_id = p.id
      LEFT JOIN customers c ON sn.customer_id = c.id
      WHERE sn.warranty_end_date <= datetime('now')
        AND sn.warranty_end_date IS NOT NULL
        AND sn.status = 'sold'
      
      UNION ALL
      
      SELECT 
        'pending_claim' as alert_type,
        'Yêu cầu bảo hành chờ xử lý' as alert_title,
        sn.serial_number,
        p.name as product_name,
        c.full_name as customer_name,
        wc.reported_date as alert_date,
        'info' as severity
      FROM warranty_claims wc
      JOIN warranty_registrations wr ON wc.warranty_registration_id = wr.id
      JOIN serial_numbers sn ON wr.serial_number_id = sn.id
      LEFT JOIN products p ON sn.product_id = p.id
      LEFT JOIN customers c ON sn.customer_id = c.id
      WHERE wc.status IN ('submitted', 'approved', 'in_progress')
      
      ORDER BY alert_date DESC
      LIMIT 50
    `).all();

    return c.json({
      success: true,
      data: alerts.results || [],
      message: 'Lấy danh sách cảnh báo thành công'
    });

  } catch (error) {
    console.error('❌ Error fetching alerts:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi lấy danh sách cảnh báo',
      data: null
    }, 500);
  }
});

// POST /serial-number-flow/bulk-status-update - Bulk update serial number status
app.post('/bulk-status-update', 
  authenticate, 
  authorize(['admin', 'manager']), 
  async (c) => {
    try {
      const env = c.env as Env;
      const body = await c.req.json();

      const schema = z.object({
        serial_numbers: z.array(z.string()),
        new_status: z.enum(['in_stock', 'sold', 'returned', 'defective', 'warranty_claim', 'disposed']),
        reason: z.string().optional(),
      });

      const data = schema.parse(body);

      const statements = data.serial_numbers.map(serialNumber =>
        env.DB.prepare(`
          UPDATE serial_numbers 
          SET status = ?, updated_at = datetime('now')
          WHERE serial_number = ?
        `).bind(data.new_status, serialNumber)
      );

      const results = await env.DB.batch(statements);
      const successCount = results.filter(r => r.success).length;

      return c.json({
        success: true,
        data: {
          updated: successCount,
          total: data.serial_numbers.length,
          failed: data.serial_numbers.length - successCount
        },
        message: `Cập nhật trạng thái thành công cho ${successCount}/${data.serial_numbers.length} serial numbers`
      });

    } catch (error) {
      console.error('❌ Error bulk updating serial number status:', error);
      return c.json({
        success: false,
        message: 'Lỗi khi cập nhật hàng loạt trạng thái serial numbers',
        data: null
      }, 500);
    }
  }
);

export default app;
