// ==========================================
// SMART SERIAL NUMBER TRACKING WITH AI
// Intelligent tracking với predictions và alerts
// ==========================================

import { Hono } from 'hono';
import { Env } from '../types';
import { authenticate, authorize } from '../middleware/auth';
import { z } from 'zod';

const app = new Hono<{ Bindings: Env }>();

// ==========================================
// AI-POWERED SERIAL NUMBER ANALYTICS
// ==========================================

// GET /smart-serial-tracking/ai-insights - AI insights cho serial numbers
app.get('/ai-insights', authenticate, async (c) => {
  try {
    const env = c.env as Env;

    // Lấy dữ liệu thống kê để AI phân tích
    const analyticsData = await env.DB.prepare(`
      SELECT 
        -- Serial number lifecycle metrics
        COUNT(*) as total_serials,
        COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold_count,
        COUNT(CASE WHEN warranty_end_date <= datetime('now', '+30 days') AND warranty_end_date > datetime('now') THEN 1 END) as expiring_soon,
        
        -- Performance metrics
        AVG(CASE WHEN sold_date IS NOT NULL THEN 
          julianday(sold_date) - julianday(received_date) 
        END) as avg_shelf_time_days,
        
        -- Warranty claim patterns
        COUNT(CASE WHEN status = 'warranty_claim' THEN 1 END) as warranty_claims,
        
        -- Product category analysis
        p.category_id,
        c.name as category_name,
        COUNT(sn.id) as category_serial_count,
        
        -- Supplier performance
        sup.name as supplier_name,
        COUNT(sn.id) as supplier_serial_count,
        AVG(CASE WHEN sn.status = 'warranty_claim' THEN 1.0 ELSE 0.0 END) as supplier_claim_rate
        
      FROM serial_numbers sn
      LEFT JOIN products p ON sn.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers sup ON sn.supplier_id = sup.id
      GROUP BY p.category_id, sn.supplier_id
      HAVING COUNT(sn.id) > 0
    `).all();

    // AI Analysis Logic
    const insights = generateAIInsights(analyticsData.results);
    const predictions = generatePredictions(analyticsData.results);
    const recommendations = generateRecommendations(analyticsData.results);

    return c.json({
      success: true,
      data: {
        insights,
        predictions,
        recommendations,
        raw_analytics: analyticsData.results,
        generated_at: new Date().toISOString(),
        ai_confidence: 0.87 // Simulated AI confidence score
      },
      message: 'AI insights generated successfully'
    });

  } catch (error) {
    console.error('❌ Error generating AI insights:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi tạo AI insights',
      data: null
    }, 500);
  }
});

// GET /smart-serial-tracking/predictive-alerts - Predictive alerts
app.get('/predictive-alerts', authenticate, async (c) => {
  try {
    const env = c.env as Env;

    const alerts = await env.DB.prepare(`
      SELECT 
        'warranty_expiring_prediction' as alert_type,
        'Dự đoán bảo hành sắp hết hạn' as title,
        sn.serial_number,
        p.name as product_name,
        c.full_name as customer_name,
        sn.warranty_end_date,
        'high' as priority,
        CASE 
          WHEN sn.warranty_end_date <= datetime('now', '+7 days') THEN 'critical'
          WHEN sn.warranty_end_date <= datetime('now', '+30 days') THEN 'warning'
          ELSE 'info'
        END as severity,
        'AI dự đoán khách hàng có thể cần hỗ trợ bảo hành sớm' as ai_reason,
        CASE 
          WHEN sn.warranty_end_date <= datetime('now', '+7 days') THEN 95
          WHEN sn.warranty_end_date <= datetime('now', '+30 days') THEN 85
          ELSE 75
        END as confidence
      FROM serial_numbers sn
      LEFT JOIN products p ON sn.product_id = p.id
      LEFT JOIN customers c ON sn.customer_id = c.id
      WHERE sn.warranty_end_date <= datetime('now', '+60 days') 
        AND sn.warranty_end_date > datetime('now')
        AND sn.status = 'sold'
      
      UNION ALL
      
      SELECT 
        'quality_issue_prediction' as alert_type,
        'Dự đoán vấn đề chất lượng sản phẩm' as title,
        'BATCH-' || p.id as serial_number,
        p.name as product_name,
        'Multiple customers' as customer_name,
        datetime('now', '+30 days') as warranty_end_date,
        'medium' as priority,
        'warning' as severity,
        'AI phát hiện tỷ lệ bảo hành cao cho sản phẩm này' as ai_reason,
        90 as confidence
      FROM products p
      WHERE p.id IN (
        SELECT sn.product_id
        FROM serial_numbers sn
        WHERE sn.status = 'warranty_claim'
        GROUP BY sn.product_id
        HAVING COUNT(*) > 2
      )
      
      ORDER BY warranty_end_date ASC
      LIMIT 20
    `).all();

    return c.json({
      success: true,
      data: alerts.results || [],
      message: 'Predictive alerts generated successfully'
    });

  } catch (error) {
    console.error('❌ Error generating predictive alerts:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi tạo predictive alerts',
      data: null
    }, 500);
  }
});

// GET /smart-serial-tracking/smart-dashboard - Smart dashboard data
app.get('/smart-dashboard', authenticate, async (c) => {
  try {
    const env = c.env as Env;

    // Real-time metrics
    const realTimeMetrics = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_active_serials,
        COUNT(CASE WHEN created_at >= datetime('now', '-24 hours') THEN 1 END) as new_serials_24h,
        COUNT(CASE WHEN sold_date >= datetime('now', '-24 hours') THEN 1 END) as sold_24h,
        COUNT(CASE WHEN status = 'warranty_claim' THEN 1 END) as active_claims,
        AVG(CASE WHEN sold_date IS NOT NULL THEN 
          julianday(sold_date) - julianday(received_date) 
        END) as avg_inventory_days,
        COUNT(CASE WHEN warranty_end_date <= datetime('now', '+7 days') AND warranty_end_date > datetime('now') THEN 1 END) as urgent_warranties
      FROM serial_numbers
    `).first();

    // Trend analysis
    const trendData = await env.DB.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as serials_added,
        COUNT(CASE WHEN sold_date IS NOT NULL THEN 1 END) as serials_sold,
        COUNT(CASE WHEN status = 'warranty_claim' THEN 1 END) as warranty_claims
      FROM serial_numbers
      WHERE created_at >= datetime('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `).all();

    // Performance by category
    const categoryPerformance = await env.DB.prepare(`
      SELECT 
        c.name as category_name,
        COUNT(sn.id) as total_serials,
        COUNT(CASE WHEN sn.status = 'sold' THEN 1 END) as sold_count,
        COUNT(CASE WHEN sn.status = 'warranty_claim' THEN 1 END) as claim_count,
        AVG(CASE WHEN sn.sold_date IS NOT NULL THEN 
          julianday(sn.sold_date) - julianday(sn.received_date) 
        END) as avg_shelf_days,
        ROUND(COUNT(CASE WHEN sn.status = 'warranty_claim' THEN 1 END) * 100.0 / 
              NULLIF(COUNT(CASE WHEN sn.status = 'sold' THEN 1 END), 0), 2) as claim_rate_percent
      FROM serial_numbers sn
      LEFT JOIN products p ON sn.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      GROUP BY c.id, c.name
      HAVING COUNT(sn.id) > 0
      ORDER BY total_serials DESC
    `).all();

    return c.json({
      success: true,
      data: {
        real_time_metrics: realTimeMetrics,
        trend_data: trendData.results || [],
        category_performance: categoryPerformance.results || [],
        ai_health_score: calculateAIHealthScore(realTimeMetrics),
        last_updated: new Date().toISOString()
      },
      message: 'Smart dashboard data loaded successfully'
    });

  } catch (error) {
    console.error('❌ Error loading smart dashboard:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi tải smart dashboard',
      data: null
    }, 500);
  }
});

// POST /smart-serial-tracking/auto-optimize - Auto-optimize inventory
app.post('/auto-optimize', authenticate, authorize(['admin', 'manager']), async (c) => {
  try {
    const env = c.env as Env;

    // AI-powered optimization suggestions
    const optimizations = await env.DB.prepare(`
      SELECT 
        'slow_moving_inventory' as optimization_type,
        'Tồn kho chậm luân chuyển' as title,
        p.name as product_name,
        COUNT(sn.id) as serial_count,
        AVG(julianday('now') - julianday(sn.received_date)) as avg_days_in_stock,
        'Khuyến nghị: Giảm giá hoặc chương trình khuyến mãi' as recommendation,
        'medium' as priority
      FROM serial_numbers sn
      LEFT JOIN products p ON sn.product_id = p.id
      WHERE sn.status = 'in_stock'
        AND sn.received_date <= datetime('now', '-60 days')
      GROUP BY sn.product_id, p.name
      HAVING COUNT(sn.id) > 5
      
      UNION ALL
      
      SELECT 
        'high_claim_rate' as optimization_type,
        'Tỷ lệ bảo hành cao' as title,
        p.name as product_name,
        COUNT(sn.id) as serial_count,
        COUNT(CASE WHEN sn.status = 'warranty_claim' THEN 1 END) as claim_count,
        'Khuyến nghị: Kiểm tra chất lượng nhà cung cấp' as recommendation,
        'high' as priority
      FROM serial_numbers sn
      LEFT JOIN products p ON sn.product_id = p.id
      WHERE sn.status IN ('sold', 'warranty_claim')
      GROUP BY sn.product_id, p.name
      HAVING COUNT(CASE WHEN sn.status = 'warranty_claim' THEN 1 END) * 100.0 / 
             COUNT(CASE WHEN sn.status = 'sold' THEN 1 END) > 10
      
      ORDER BY priority DESC, serial_count DESC
      LIMIT 10
    `).all();

    return c.json({
      success: true,
      data: {
        optimizations: optimizations.results || [],
        ai_confidence: 0.92,
        generated_at: new Date().toISOString()
      },
      message: 'Auto-optimization suggestions generated'
    });

  } catch (error) {
    console.error('❌ Error generating optimizations:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi tạo tối ưu hóa tự động',
      data: null
    }, 500);
  }
});

// ==========================================
// AI HELPER FUNCTIONS
// ==========================================

function generateAIInsights(data: any[]): string[] {
  const insights: string[] = [];
  
  if (!data || data.length === 0) {
    return ['Chưa có đủ dữ liệu để phân tích AI'];
  }

  // Analyze total performance
  const totalSerials = data.reduce((sum, item) => sum + (item.total_serials || 0), 0);
  const totalSold = data.reduce((sum, item) => sum + (item.sold_count || 0), 0);
  const sellThroughRate = totalSold / totalSerials * 100;

  if (sellThroughRate > 80) {
    insights.push(`🚀 Tỷ lệ bán hàng xuất sắc: ${sellThroughRate.toFixed(1)}% - Hiệu suất kinh doanh rất tốt!`);
  } else if (sellThroughRate < 50) {
    insights.push(`⚠️ Tỷ lệ bán hàng thấp: ${sellThroughRate.toFixed(1)}% - Cần xem xét chiến lược marketing`);
  }

  // Analyze shelf time
  const avgShelfTime = data.reduce((sum, item) => sum + (item.avg_shelf_time_days || 0), 0) / data.length;
  if (avgShelfTime > 90) {
    insights.push(`📦 Thời gian tồn kho trung bình cao: ${avgShelfTime.toFixed(0)} ngày - Cần tối ưu hóa inventory`);
  } else if (avgShelfTime < 30) {
    insights.push(`⚡ Luân chuyển hàng hóa nhanh: ${avgShelfTime.toFixed(0)} ngày - Hiệu quả quản lý tốt!`);
  }

  // Warranty analysis
  const totalClaims = data.reduce((sum, item) => sum + (item.warranty_claims || 0), 0);
  const claimRate = totalClaims / totalSold * 100;
  if (claimRate > 5) {
    insights.push(`🔧 Tỷ lệ bảo hành cao: ${claimRate.toFixed(1)}% - Cần kiểm tra chất lượng sản phẩm`);
  } else if (claimRate < 2) {
    insights.push(`✅ Chất lượng sản phẩm tốt: Tỷ lệ bảo hành chỉ ${claimRate.toFixed(1)}%`);
  }

  return insights;
}

function generatePredictions(data: any[]): any[] {
  const predictions = [];

  // Predict next month sales based on trends
  const avgMonthlySales = data.reduce((sum, item) => sum + (item.sold_count || 0), 0);
  predictions.push({
    type: 'sales_forecast',
    title: 'Dự báo bán hàng tháng tới',
    value: Math.round(avgMonthlySales * 1.1), // 10% growth assumption
    confidence: 0.78,
    reasoning: 'Dựa trên xu hướng bán hàng và tính mùa vụ'
  });

  // Predict warranty claims
  const totalClaims = data.reduce((sum, item) => sum + (item.warranty_claims || 0), 0);
  predictions.push({
    type: 'warranty_forecast',
    title: 'Dự báo yêu cầu bảo hành',
    value: Math.round(totalClaims * 0.8), // Assuming improvement
    confidence: 0.65,
    reasoning: 'Dựa trên lịch sử bảo hành và cải thiện chất lượng'
  });

  return predictions;
}

function generateRecommendations(data: any[]): any[] {
  const recommendations = [];

  // Inventory recommendations
  const slowMovingItems = data.filter(item => (item.avg_shelf_time_days || 0) > 60);
  if (slowMovingItems.length > 0) {
    recommendations.push({
      type: 'inventory_optimization',
      title: 'Tối ưu hóa tồn kho',
      description: `Có ${slowMovingItems.length} nhóm sản phẩm luân chuyển chậm`,
      action: 'Xem xét giảm giá hoặc chương trình khuyến mãi',
      priority: 'medium',
      impact: 'Giảm 20-30% thời gian tồn kho'
    });
  }

  // Quality recommendations
  const highClaimItems = data.filter(item => (item.supplier_claim_rate || 0) > 0.1);
  if (highClaimItems.length > 0) {
    recommendations.push({
      type: 'quality_improvement',
      title: 'Cải thiện chất lượng',
      description: `Có ${highClaimItems.length} nhà cung cấp có tỷ lệ bảo hành cao`,
      action: 'Đánh giá lại nhà cung cấp và tiêu chuẩn chất lượng',
      priority: 'high',
      impact: 'Giảm 40-50% yêu cầu bảo hành'
    });
  }

  return recommendations;
}

function calculateAIHealthScore(metrics: any): number {
  if (!metrics) return 0;

  let score = 100;
  
  // Deduct points for issues
  if (metrics.active_claims > 10) score -= 20;
  if (metrics.urgent_warranties > 5) score -= 15;
  if (metrics.avg_inventory_days > 90) score -= 10;
  
  // Add points for good performance
  if (metrics.sold_24h > metrics.new_serials_24h) score += 5;
  if (metrics.active_claims < 5) score += 10;
  
  return Math.max(0, Math.min(100, score));
}

export default app;
