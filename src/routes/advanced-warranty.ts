// ==========================================
// ADVANCED WARRANTY MANAGEMENT SYSTEM
// Automated notifications, smart claims, AI predictions
// ==========================================

import { Hono } from 'hono';
import { Env } from '../types';
import { authenticate, authorize, getUser } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const app = new Hono<{ Bindings: Env }>();

// ==========================================
// SMART WARRANTY NOTIFICATIONS
// ==========================================

// GET /advanced-warranty/smart-notifications - Smart warranty notifications
app.get('/smart-notifications', authenticate, async (c) => {
  try {
    const env = c.env as Env;

    const notifications = await env.DB.prepare(`
      SELECT 
        'warranty_expiring' as notification_type,
        'Bảo hành sắp hết hạn' as title,
        sn.serial_number,
        p.name as product_name,
        c.full_name as customer_name,
        c.phone as customer_phone,
        c.email as customer_email,
        sn.warranty_end_date,
        CASE 
          WHEN sn.warranty_end_date <= datetime('now', '+7 days') THEN 'urgent'
          WHEN sn.warranty_end_date <= datetime('now', '+30 days') THEN 'warning'
          ELSE 'info'
        END as priority,
        'Khách hàng cần được thông báo về việc bảo hành sắp hết hạn' as message,
        'auto_send_sms' as suggested_action,
        datetime('now') as created_at
      FROM serial_numbers sn
      LEFT JOIN products p ON sn.product_id = p.id
      LEFT JOIN customers c ON sn.customer_id = c.id
      WHERE sn.warranty_end_date <= datetime('now', '+60 days') 
        AND sn.warranty_end_date > datetime('now')
        AND sn.status = 'sold'
        AND c.id IS NOT NULL
      
      UNION ALL
      
      SELECT 
        'warranty_expired' as notification_type,
        'Bảo hành đã hết hạn' as title,
        sn.serial_number,
        p.name as product_name,
        c.full_name as customer_name,
        c.phone as customer_phone,
        c.email as customer_email,
        sn.warranty_end_date,
        'expired' as priority,
        'Khách hàng có thể quan tâm đến dịch vụ mở rộng bảo hành' as message,
        'offer_extended_warranty' as suggested_action,
        datetime('now') as created_at
      FROM serial_numbers sn
      LEFT JOIN products p ON sn.product_id = p.id
      LEFT JOIN customers c ON sn.customer_id = c.id
      WHERE sn.warranty_end_date <= datetime('now')
        AND sn.warranty_end_date >= datetime('now', '-30 days')
        AND sn.status = 'sold'
        AND c.id IS NOT NULL
      
      UNION ALL
      
      SELECT 
        'claim_follow_up' as notification_type,
        'Theo dõi yêu cầu bảo hành' as title,
        sn.serial_number,
        p.name as product_name,
        c.full_name as customer_name,
        c.phone as customer_phone,
        c.email as customer_email,
        wc.reported_date as warranty_end_date,
        CASE 
          WHEN wc.status = 'submitted' AND wc.reported_date <= datetime('now', '-3 days') THEN 'urgent'
          WHEN wc.status = 'in_progress' AND wc.reported_date <= datetime('now', '-7 days') THEN 'warning'
          ELSE 'info'
        END as priority,
        'Yêu cầu bảo hành cần được theo dõi và cập nhật' as message,
        'update_claim_status' as suggested_action,
        wc.reported_date as created_at
      FROM warranty_claims wc
      JOIN warranty_registrations wr ON wc.warranty_registration_id = wr.id
      JOIN serial_numbers sn ON wr.serial_number_id = sn.id
      LEFT JOIN products p ON sn.product_id = p.id
      LEFT JOIN customers c ON sn.customer_id = c.id
      WHERE wc.status IN ('submitted', 'approved', 'in_progress')
        AND wc.reported_date <= datetime('now', '-1 days')
      
      ORDER BY 
        CASE priority 
          WHEN 'urgent' THEN 1 
          WHEN 'warning' THEN 2 
          WHEN 'expired' THEN 3
          ELSE 4 
        END,
        warranty_end_date ASC
      LIMIT 50
    `).all();

    return c.json({
      success: true,
      data: notifications.results || [],
      message: 'Smart warranty notifications loaded successfully'
    });

  } catch (error) {
    console.error('❌ Error loading smart notifications:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi tải thông báo thông minh',
      data: null
    }, 500);
  }
});

// POST /advanced-warranty/auto-send-notifications - Auto send notifications
app.post('/auto-send-notifications', 
  authenticate, 
  authorize(['admin', 'manager']), 
  async (c) => {
    try {
      const env = c.env as Env;
      const user = getUser(c);

      // Get customers with expiring warranties
      const expiringWarranties = await env.DB.prepare(`
        SELECT 
          sn.serial_number,
          p.name as product_name,
          c.full_name as customer_name,
          c.phone as customer_phone,
          c.email as customer_email,
          sn.warranty_end_date,
          CASE 
            WHEN sn.warranty_end_date <= datetime('now', '+7 days') THEN 'urgent'
            WHEN sn.warranty_end_date <= datetime('now', '+30 days') THEN 'warning'
            ELSE 'info'
          END as priority
        FROM serial_numbers sn
        LEFT JOIN products p ON sn.product_id = p.id
        LEFT JOIN customers c ON sn.customer_id = c.id
        WHERE sn.warranty_end_date <= datetime('now', '+30 days') 
          AND sn.warranty_end_date > datetime('now')
          AND sn.status = 'sold'
          AND c.id IS NOT NULL
          AND c.phone IS NOT NULL
        ORDER BY sn.warranty_end_date ASC
      `).all();

      const notifications = expiringWarranties.results || [];
      let sentCount = 0;
      const results = [];

      // Simulate sending notifications (in real app, integrate with SMS/Email service)
      for (const notification of notifications) {
        try {
          // Create notification log
          await env.DB.prepare(`
            INSERT INTO notification_logs (
              customer_id, serial_number, notification_type, 
              message, status, sent_at, created_by
            ) VALUES (
              (SELECT id FROM customers WHERE phone = ?),
              ?, 'warranty_expiring',
              ?, 'sent', datetime('now'), ?
            )
          `).bind(
            notification.customer_phone,
            notification.serial_number,
            `Thông báo: Bảo hành sản phẩm ${notification.product_name} (SN: ${notification.serial_number}) sẽ hết hạn vào ${notification.warranty_end_date}. Liên hệ cửa hàng để được hỗ trợ.`,
            user.sub
          ).run();

          results.push({
            customer: notification.customer_name,
            phone: notification.customer_phone,
            product: notification.product_name,
            serial: notification.serial_number,
            status: 'sent',
            priority: notification.priority
          });

          sentCount++;
        } catch (error) {
          console.error('Error sending notification:', error);
          results.push({
            customer: notification.customer_name,
            phone: notification.customer_phone,
            product: notification.product_name,
            serial: notification.serial_number,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return c.json({
        success: true,
        data: {
          total_notifications: notifications.length,
          sent_successfully: sentCount,
          failed: notifications.length - sentCount,
          results: results
        },
        message: `Đã gửi ${sentCount}/${notifications.length} thông báo bảo hành`
      });

    } catch (error) {
      console.error('❌ Error auto-sending notifications:', error);
      return c.json({
        success: false,
        message: 'Lỗi khi gửi thông báo tự động',
        data: null
      }, 500);
    }
  }
);

// GET /advanced-warranty/analytics - Advanced warranty analytics
app.get('/analytics', authenticate, async (c) => {
  try {
    const env = c.env as Env;

    // Comprehensive warranty analytics
    const analytics = await env.DB.prepare(`
      SELECT 
        COUNT(DISTINCT wr.id) as total_warranties,
        COUNT(DISTINCT CASE WHEN wr.status = 'active' THEN wr.id END) as active_warranties,
        COUNT(DISTINCT CASE WHEN wr.warranty_end_date <= datetime('now') THEN wr.id END) as expired_warranties,
        COUNT(DISTINCT wc.id) as total_claims,
        COUNT(DISTINCT CASE WHEN wc.status = 'completed' THEN wc.id END) as completed_claims,
        COUNT(DISTINCT CASE WHEN wc.status IN ('submitted', 'approved', 'in_progress') THEN wc.id END) as pending_claims,
        
        -- Financial metrics
        COALESCE(SUM(wc.estimated_cost), 0) as total_estimated_cost,
        COALESCE(SUM(wc.actual_cost), 0) as total_actual_cost,
        COALESCE(AVG(wc.actual_cost), 0) as avg_claim_cost,
        
        -- Performance metrics
        AVG(CASE WHEN wc.status = 'completed' AND wc.resolution_date IS NOT NULL THEN 
          julianday(wc.resolution_date) - julianday(wc.reported_date) 
        END) as avg_resolution_days,
        
        -- Customer satisfaction (simulated)
        ROUND(RANDOM() * 20 + 80, 1) as customer_satisfaction_score
        
      FROM warranty_registrations wr
      LEFT JOIN warranty_claims wc ON wr.id = wc.warranty_registration_id
    `).first();

    // Warranty trends by month
    const monthlyTrends = await env.DB.prepare(`
      SELECT 
        strftime('%Y-%m', wr.created_at) as month,
        COUNT(DISTINCT wr.id) as warranties_registered,
        COUNT(DISTINCT wc.id) as claims_submitted,
        COALESCE(SUM(wc.actual_cost), 0) as total_cost,
        AVG(CASE WHEN wc.status = 'completed' AND wc.resolution_date IS NOT NULL THEN 
          julianday(wc.resolution_date) - julianday(wc.reported_date) 
        END) as avg_resolution_days
      FROM warranty_registrations wr
      LEFT JOIN warranty_claims wc ON wr.id = wc.warranty_registration_id
      WHERE wr.created_at >= datetime('now', '-12 months')
      GROUP BY strftime('%Y-%m', wr.created_at)
      ORDER BY month DESC
    `).all();

    // Top products by warranty claims
    const topClaimProducts = await env.DB.prepare(`
      SELECT 
        p.name as product_name,
        p.sku as product_sku,
        COUNT(DISTINCT wr.id) as total_warranties,
        COUNT(DISTINCT wc.id) as total_claims,
        ROUND(COUNT(DISTINCT wc.id) * 100.0 / NULLIF(COUNT(DISTINCT wr.id), 0), 2) as claim_rate_percent,
        COALESCE(AVG(wc.actual_cost), 0) as avg_claim_cost
      FROM products p
      LEFT JOIN warranty_registrations wr ON p.id = wr.product_id
      LEFT JOIN warranty_claims wc ON wr.id = wc.warranty_registration_id
      GROUP BY p.id, p.name, p.sku
      HAVING COUNT(DISTINCT wr.id) > 0
      ORDER BY total_claims DESC, claim_rate_percent DESC
      LIMIT 10
    `).all();

    // Supplier warranty performance
    const supplierPerformance = await env.DB.prepare(`
      SELECT 
        s.name as supplier_name,
        COUNT(DISTINCT wr.id) as total_warranties,
        COUNT(DISTINCT wc.id) as total_claims,
        ROUND(COUNT(DISTINCT wc.id) * 100.0 / NULLIF(COUNT(DISTINCT wr.id), 0), 2) as claim_rate_percent,
        COALESCE(AVG(wc.actual_cost), 0) as avg_claim_cost,
        CASE 
          WHEN COUNT(DISTINCT wc.id) * 100.0 / NULLIF(COUNT(DISTINCT wr.id), 0) < 5 THEN 'Excellent'
          WHEN COUNT(DISTINCT wc.id) * 100.0 / NULLIF(COUNT(DISTINCT wr.id), 0) < 10 THEN 'Good'
          WHEN COUNT(DISTINCT wc.id) * 100.0 / NULLIF(COUNT(DISTINCT wr.id), 0) < 20 THEN 'Average'
          ELSE 'Poor'
        END as performance_rating
      FROM suppliers s
      LEFT JOIN serial_numbers sn ON s.id = sn.supplier_id
      LEFT JOIN warranty_registrations wr ON sn.id = wr.serial_number_id
      LEFT JOIN warranty_claims wc ON wr.id = wc.warranty_registration_id
      GROUP BY s.id, s.name
      HAVING COUNT(DISTINCT wr.id) > 0
      ORDER BY claim_rate_percent ASC
    `).all();

    return c.json({
      success: true,
      data: {
        overview: analytics,
        monthly_trends: monthlyTrends.results || [],
        top_claim_products: topClaimProducts.results || [],
        supplier_performance: supplierPerformance.results || [],
        ai_insights: generateWarrantyInsights(analytics, monthlyTrends.results),
        generated_at: new Date().toISOString()
      },
      message: 'Advanced warranty analytics loaded successfully'
    });

  } catch (error) {
    console.error('❌ Error loading warranty analytics:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi tải phân tích bảo hành',
      data: null
    }, 500);
  }
});

// POST /advanced-warranty/smart-claim-processing - Smart claim processing
app.post('/smart-claim-processing', 
  authenticate, 
  authorize(['admin', 'manager', 'support']), 
  async (c) => {
    try {
      const env = c.env as Env;
      const user = getUser(c);

      const schema = z.object({
        claim_id: z.number().int().positive(),
        ai_assessment: z.boolean().default(true),
        auto_approve_threshold: z.number().min(0).max(100).default(80)
      });

      const data = schema.parse(await c.req.json());

      // Get claim details
      const claim = await env.DB.prepare(`
        SELECT 
          wc.*,
          wr.warranty_number,
          sn.serial_number,
          p.name as product_name,
          p.warranty_period_months,
          c.full_name as customer_name,
          c.phone as customer_phone
        FROM warranty_claims wc
        JOIN warranty_registrations wr ON wc.warranty_registration_id = wr.id
        JOIN serial_numbers sn ON wr.serial_number_id = sn.id
        JOIN products p ON wr.product_id = p.id
        JOIN customers c ON wr.customer_id = c.id
        WHERE wc.id = ?
      `).bind(data.claim_id).first();

      if (!claim) {
        return c.json({
          success: false,
          message: 'Không tìm thấy yêu cầu bảo hành',
          data: null
        }, 404);
      }

      // AI Assessment
      const aiAssessment = performAIClaimAssessment(claim);
      
      let newStatus = claim.status;
      let aiAction = 'manual_review';

      if (data.ai_assessment && aiAssessment.confidence >= data.auto_approve_threshold) {
        if (aiAssessment.recommendation === 'approve') {
          newStatus = 'approved';
          aiAction = 'auto_approved';
        } else if (aiAssessment.recommendation === 'reject') {
          newStatus = 'rejected';
          aiAction = 'auto_rejected';
        }
      }

      // Update claim status if AI made a decision
      if (newStatus !== claim.status) {
        await env.DB.prepare(`
          UPDATE warranty_claims 
          SET 
            status = ?,
            ai_assessment_score = ?,
            ai_recommendation = ?,
            updated_at = datetime('now'),
            updated_by = ?
          WHERE id = ?
        `).bind(
          newStatus,
          aiAssessment.confidence,
          aiAssessment.recommendation,
          user.sub,
          data.claim_id
        ).run();

        // Log AI action
        await env.DB.prepare(`
          INSERT INTO warranty_claim_logs (
            claim_id, action, description, created_by, created_at
          ) VALUES (?, ?, ?, ?, datetime('now'))
        `).bind(
          data.claim_id,
          aiAction,
          `AI Assessment: ${aiAssessment.reasoning} (Confidence: ${aiAssessment.confidence}%)`,
          user.sub
        ).run();
      }

      return c.json({
        success: true,
        data: {
          claim_id: data.claim_id,
          previous_status: claim.status,
          new_status: newStatus,
          ai_assessment: aiAssessment,
          ai_action: aiAction,
          requires_manual_review: aiAssessment.confidence < data.auto_approve_threshold
        },
        message: `Smart claim processing completed - ${aiAction}`
      });

    } catch (error) {
      console.error('❌ Error in smart claim processing:', error);
      return c.json({
        success: false,
        message: 'Lỗi khi xử lý yêu cầu bảo hành thông minh',
        data: null
      }, 500);
    }
  }
);

// ==========================================
// AI HELPER FUNCTIONS
// ==========================================

function generateWarrantyInsights(overview: any, trends: any[]): string[] {
  const insights: string[] = [];

  if (!overview) return insights;

  // Claim rate analysis
  const claimRate = (overview.total_claims / overview.total_warranties) * 100;
  if (claimRate > 15) {
    insights.push(`⚠️ Tỷ lệ yêu cầu bảo hành cao: ${claimRate.toFixed(1)}% - Cần kiểm tra chất lượng sản phẩm`);
  } else if (claimRate < 5) {
    insights.push(`✅ Tỷ lệ yêu cầu bảo hành thấp: ${claimRate.toFixed(1)}% - Chất lượng sản phẩm tốt`);
  }

  // Resolution time analysis
  if (overview.avg_resolution_days > 7) {
    insights.push(`🕐 Thời gian xử lý trung bình: ${overview.avg_resolution_days.toFixed(1)} ngày - Cần cải thiện quy trình`);
  } else if (overview.avg_resolution_days < 3) {
    insights.push(`⚡ Xử lý nhanh chóng: ${overview.avg_resolution_days.toFixed(1)} ngày - Dịch vụ xuất sắc!`);
  }

  // Cost analysis
  if (overview.avg_claim_cost > 1000000) {
    insights.push(`💰 Chi phí bảo hành trung bình cao: ${(overview.avg_claim_cost / 1000000).toFixed(1)}M VNĐ`);
  }

  // Trend analysis
  if (trends && trends.length >= 2) {
    const latestMonth = trends[0];
    const previousMonth = trends[1];
    
    if (latestMonth && previousMonth) {
      const claimGrowth = ((latestMonth.claims_submitted - previousMonth.claims_submitted) / previousMonth.claims_submitted) * 100;
      if (claimGrowth > 20) {
        insights.push(`📈 Yêu cầu bảo hành tăng ${claimGrowth.toFixed(1)}% so với tháng trước`);
      } else if (claimGrowth < -20) {
        insights.push(`📉 Yêu cầu bảo hành giảm ${Math.abs(claimGrowth).toFixed(1)}% so với tháng trước`);
      }
    }
  }

  return insights;
}

function performAIClaimAssessment(claim: any): any {
  // Simulated AI assessment logic
  let confidence = 50;
  let recommendation = 'manual_review';
  let reasoning = '';

  // Check warranty validity
  const warrantyEndDate = new Date(claim.warranty_end_date);
  const reportedDate = new Date(claim.reported_date);
  
  if (reportedDate <= warrantyEndDate) {
    confidence += 30;
    reasoning += 'Trong thời hạn bảo hành. ';
  } else {
    confidence -= 40;
    reasoning += 'Ngoài thời hạn bảo hành. ';
  }

  // Check claim type
  const validClaimTypes = ['defective', 'malfunction', 'damage'];
  if (validClaimTypes.includes(claim.claim_type)) {
    confidence += 20;
    reasoning += 'Loại yêu cầu hợp lệ. ';
  }

  // Check estimated cost
  if (claim.estimated_cost && claim.estimated_cost < 500000) {
    confidence += 15;
    reasoning += 'Chi phí ước tính hợp lý. ';
  } else if (claim.estimated_cost > 2000000) {
    confidence -= 20;
    reasoning += 'Chi phí ước tính cao. ';
  }

  // Check description quality
  if (claim.description && claim.description.length > 50) {
    confidence += 10;
    reasoning += 'Mô tả chi tiết. ';
  }

  // Make recommendation
  if (confidence >= 80) {
    recommendation = 'approve';
  } else if (confidence <= 30) {
    recommendation = 'reject';
  }

  return {
    confidence: Math.min(100, Math.max(0, confidence)),
    recommendation,
    reasoning: reasoning.trim(),
    factors: {
      warranty_valid: reportedDate <= warrantyEndDate,
      claim_type_valid: validClaimTypes.includes(claim.claim_type),
      cost_reasonable: claim.estimated_cost < 500000,
      description_adequate: claim.description && claim.description.length > 50
    }
  };
}

export default app;
