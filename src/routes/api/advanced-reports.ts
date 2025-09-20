import { Hono } from 'hono';
import { Env } from '../../types';

const app = new Hono<{ Bindings: Env }>();

// Simple test endpoint
app.get('/', async (c: any) => {
  return c.json({
    success: true,
    data: [],
    message: 'Advanced Reports endpoint working - simplified version'
  });
});

/*

// Helper function to get date range
const getDateRange = (period: string) => {
  const now = new Date();
  const start = new Date();
  
  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      return { start: start.toISOString(), end: now.toISOString() };
    case 'yesterday':
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      return { start: start.toISOString(), end: end.toISOString() };
    case 'this_week':
      start.setDate(start.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      return { start: start.toISOString(), end: now.toISOString() };
    case 'last_week':
      start.setDate(start.getDate() - now.getDay() - 7);
      start.setHours(0, 0, 0, 0);
      const endLastWeek = new Date(start);
      endLastWeek.setDate(endLastWeek.getDate() + 6);
      endLastWeek.setHours(23, 59, 59, 999);
      return { start: start.toISOString(), end: endLastWeek.toISOString() };
    case 'this_month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      return { start: start.toISOString(), end: now.toISOString() };
    case 'last_month':
      start.setMonth(start.getMonth() - 1);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      const endLastMonth = new Date(start);
      endLastMonth.setMonth(endLastMonth.getMonth() + 1);
      endLastMonth.setDate(0);
      endLastMonth.setHours(23, 59, 59, 999);
      return { start: start.toISOString(), end: endLastMonth.toISOString() };
    case 'this_year':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      return { start: start.toISOString(), end: now.toISOString() };
    case 'last_year':
      start.setFullYear(start.getFullYear() - 1);
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      const endLastYear = new Date(start);
      endLastYear.setMonth(11, 31);
      endLastYear.setHours(23, 59, 59, 999);
      return { start: start.toISOString(), end: endLastYear.toISOString() };
    default:
      return { start: start.toISOString(), end: now.toISOString() };
  }
};

// GET /api/advanced-reports/sales-performance - Sales performance report
app.get('/sales-performance', async (c: any) => {
  try {
    const period = c.req.query('period') || 'this_month';
    const { start, end } = getDateRange(period);

    // Mock sales performance data
    const mockSalesSummary = {
      total_orders: 1256,
      total_revenue: 85722000,
      average_order_value: 68250,
      cash_revenue: 34288800,
      card_revenue: 42861000,
      transfer_revenue: 8572200,
      total_discounts: 4286100,
      total_tax: 8572200
    };

    const mockDailyTrend = [
      { date: "2025-09-07", orders: 47, revenue: 3205750 },
      { date: "2025-09-08", orders: 45, revenue: 3071250 },
      { date: "2025-09-09", orders: 52, revenue: 3549000 },
      { date: "2025-09-10", orders: 38, revenue: 2593500 },
      { date: "2025-09-11", orders: 61, revenue: 4163250 },
      { date: "2025-09-12", orders: 48, revenue: 3276000 },
      { date: "2025-09-13", orders: 55, revenue: 3753750 },
      { date: "2025-09-14", orders: 42, revenue: 2866500 }
    ];

    const mockTopProducts = [
      { product_name: "iPhone 15 Pro", sku: "IP15P", total_quantity: 45, total_revenue: 12375000, order_count: 42 },
      { product_name: "Samsung Galaxy S24", sku: "SGS24", total_quantity: 38, total_revenue: 9310000, order_count: 35 },
      { product_name: "MacBook Air M2", sku: "MBA14M2", total_quantity: 28, total_revenue: 8540000, order_count: 27 },
      { product_name: "AirPods Pro 2", sku: "APP2", total_quantity: 67, total_revenue: 6700000, order_count: 58 },
      { product_name: "iPad Pro 11", sku: "IPP11", total_quantity: 22, total_revenue: 5280000, order_count: 21 }
    ];

    const mockPaymentBreakdown = [
      { payment_method: "card", order_count: 628, revenue: 42861000, percentage: 50.0 },
      { payment_method: "cash", order_count: 502, revenue: 34288800, percentage: 40.0 },
      { payment_method: "transfer", order_count: 126, revenue: 8572200, percentage: 10.0 }
    ];

    return c.json({
      success: true,
      data: {
        summary: mockSalesSummary,
        daily_trend: mockDailyTrend,
        top_products: mockTopProducts,
        payment_breakdown: mockPaymentBreakdown,
        period: {
          start,
          end,
          label: period
        }
      }
    });

  } catch (error) {
    console.error('Sales performance report error:', error);
    return c.json({
      success: false,
      message: 'Failed to generate sales performance report',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET /api/advanced-reports/inventory-analysis - Inventory analysis report
app.get('/inventory-analysis', async (c: any) => {
  try {
    // Get inventory summary
    const inventorySummary = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_products,
        COALESCE(SUM(stock), 0) as total_stock,
        COALESCE(SUM(stock * cost_price), 0) as total_inventory_value,
        COUNT(CASE WHEN stock <= min_stock THEN 1 END) as low_stock_count,
        COUNT(CASE WHEN stock = 0 THEN 1 END) as out_of_stock_count,
        COUNT(CASE WHEN stock > max_stock THEN 1 END) as overstock_count
      FROM products
    `).first() as any;

    // Get low stock products
    const lowStockProducts = await c.env.DB.prepare(`
      SELECT 
        name,
        sku,
        stock,
        min_stock,
        max_stock,
        cost_price,
        (stock * cost_price) as inventory_value
      FROM products
      WHERE stock <= min_stock
      ORDER BY (stock - min_stock) ASC
      LIMIT 20
    `).all();

    // Get top selling products (last 30 days)
    const topSellingProducts = await c.env.DB.prepare(`
      SELECT 
        p.name as product_name,
        p.sku,
        SUM(oi.quantity) as total_sold,
        SUM(oi.total_price) as total_revenue,
        p.stock,
        p.cost_price,
        (p.stock * p.cost_price) as current_inventory_value
      FROM pos_order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN pos_orders o ON oi.order_id = o.id
      WHERE o.created_at >= datetime('now', '-30 days') AND o.status = 'completed'
      GROUP BY p.id, p.name, p.sku, p.stock, p.cost_price
      ORDER BY total_sold DESC
      LIMIT 20
    `).all();

    // Get inventory turnover analysis
    const turnoverAnalysis = await c.env.DB.prepare(`
      SELECT 
        p.name as product_name,
        p.sku,
        p.stock,
        p.cost_price,
        COALESCE(SUM(oi.quantity), 0) as total_sold_30_days,
        CASE 
          WHEN p.stock > 0 THEN ROUND(COALESCE(SUM(oi.quantity), 0) * 30.0 / p.stock, 2)
          ELSE 0
        END as turnover_rate
      FROM products p
      LEFT JOIN pos_order_items oi ON p.id = oi.product_id
      LEFT JOIN pos_orders o ON oi.order_id = o.id AND o.created_at >= datetime('now', '-30 days') AND o.status = 'completed'
      GROUP BY p.id, p.name, p.sku, p.stock, p.cost_price
      HAVING p.stock > 0
      ORDER BY turnover_rate DESC
      LIMIT 20
    `).all();

    return c.json({
      success: true,
      data: {
        summary: inventorySummary,
        low_stock_products: lowStockProducts.results || [],
        top_selling_products: topSellingProducts.results || [],
        turnover_analysis: turnoverAnalysis.results || []
      }
    });

  } catch (error) {
    console.error('Inventory analysis report error:', error);
    return c.json({
      success: false,
      message: 'Failed to generate inventory analysis report',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET /api/advanced-reports/customer-insights - Customer insights report
app.get('/customer-insights', async (c: any) => {
  try {
    const period = c.req.query('period') || 'this_month';
    const { start, end } = getDateRange(period);

    // Get customer summary
    const customerSummary = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN last_purchase_date >= ? THEN 1 END) as active_customers,
        COUNT(CASE WHEN last_purchase_date < ? THEN 1 END) as inactive_customers,
        COALESCE(AVG(total_spent), 0) as average_spent,
        COALESCE(MAX(total_spent), 0) as highest_spent,
        COALESCE(SUM(total_spent), 0) as total_customer_revenue
      FROM customers
    `).bind(start, end).first() as any;

    // Get customer segments
    const customerSegments = await c.env.DB.prepare(`
      SELECT 
        CASE 
          WHEN total_spent >= 10000000 THEN 'VIP'
          WHEN total_spent >= 5000000 THEN 'Gold'
          WHEN total_spent >= 1000000 THEN 'Silver'
          ELSE 'Bronze'
        END as segment,
        COUNT(*) as customer_count,
        COALESCE(SUM(total_spent), 0) as total_revenue,
        COALESCE(AVG(total_spent), 0) as average_spent
      FROM customers
      GROUP BY 
        CASE 
          WHEN total_spent >= 10000000 THEN 'VIP'
          WHEN total_spent >= 5000000 THEN 'Gold'
          WHEN total_spent >= 1000000 THEN 'Silver'
          ELSE 'Bronze'
        END
      ORDER BY total_revenue DESC
    `).all();

    // Get top customers
    const topCustomers = await c.env.DB.prepare(`
      SELECT 
        full_name,
        phone,
        email,
        total_spent,
        loyalty_points,
        purchase_count,
        last_purchase_date
      FROM customers
      ORDER BY total_spent DESC
      LIMIT 20
    `).all();

    // Get customer acquisition trend
    const acquisitionTrend = await c.env.DB.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_customers
      FROM customers
      WHERE created_at BETWEEN ? AND ?
      GROUP BY DATE(created_at)
      ORDER BY date
    `).bind(start, end).all();

    // Get customer retention analysis
    const retentionAnalysis = await c.env.DB.prepare(`
      SELECT 
        CASE 
          WHEN last_purchase_date >= datetime('now', '-30 days') THEN 'Active (30 days)'
          WHEN last_purchase_date >= datetime('now', '-90 days') THEN 'At Risk (90 days)'
          WHEN last_purchase_date >= datetime('now', '-180 days') THEN 'Inactive (180 days)'
          ELSE 'Lost (180+ days)'
        END as retention_status,
        COUNT(*) as customer_count,
        COALESCE(SUM(total_spent), 0) as total_revenue
      FROM customers
      WHERE last_purchase_date IS NOT NULL
      GROUP BY 
        CASE 
          WHEN last_purchase_date >= datetime('now', '-30 days') THEN 'Active (30 days)'
          WHEN last_purchase_date >= datetime('now', '-90 days') THEN 'At Risk (90 days)'
          WHEN last_purchase_date >= datetime('now', '-180 days') THEN 'Inactive (180 days)'
          ELSE 'Lost (180+ days)'
        END
      ORDER BY total_revenue DESC
    `).all();

    return c.json({
      success: true,
      data: {
        summary: customerSummary,
        segments: customerSegments.results || [],
        top_customers: topCustomers.results || [],
        acquisition_trend: acquisitionTrend.results || [],
        retention_analysis: retentionAnalysis.results || [],
        period: {
          start,
          end,
          label: period
        }
      }
    });

  } catch (error) {
    console.error('Customer insights report error:', error);
    return c.json({
      success: false,
      message: 'Failed to generate customer insights report',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET /api/advanced-reports/financial-summary - Financial summary report
app.get('/financial-summary', async (c: any) => {
  try {
    const period = c.req.query('period') || 'this_month';
    const { start, end } = getDateRange(period);

    // Get revenue summary
    const revenueSummary = await c.env.DB.prepare(`
      SELECT 
        COALESCE(SUM(total), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END), 0) as cash_revenue,
        COALESCE(SUM(CASE WHEN payment_method = 'card' THEN total ELSE 0 END), 0) as card_revenue,
        COALESCE(SUM(CASE WHEN payment_method = 'transfer' THEN total ELSE 0 END), 0) as transfer_revenue,
        COALESCE(SUM(discount), 0) as total_discounts,
        COALESCE(SUM(tax), 0) as total_tax,
        COUNT(*) as total_orders
      FROM pos_orders 
      WHERE created_at BETWEEN ? AND ? AND status = 'completed'
    `).bind(start, end).first() as any;

    // Get cost_price of goods sold
    const cogsSummary = await c.env.DB.prepare(`
      SELECT 
        COALESCE(SUM(oi.quantity * p.cost_price), 0) as total_cogs,
        COALESCE(SUM(oi.total_price), 0) as total_sales,
        COALESCE(SUM(oi.total_price) - SUM(oi.quantity * p.cost_price), 0) as gross_profit,
        CASE 
          WHEN COALESCE(SUM(oi.total_price), 0) > 0 
          THEN ROUND((COALESCE(SUM(oi.total_price), 0) - COALESCE(SUM(oi.quantity * p.cost_price), 0)) * 100.0 / COALESCE(SUM(oi.total_price), 0), 2)
          ELSE 0
        END as gross_margin_percentage
      FROM pos_order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN pos_orders o ON oi.order_id = o.id
      WHERE o.created_at BETWEEN ? AND ? AND o.status = 'completed'
    `).bind(start, end).first() as any;

    // Get daily revenue trend
    const dailyRevenue = await c.env.DB.prepare(`
      SELECT 
        DATE(created_at) as date,
        COALESCE(SUM(total), 0) as revenue,
        COUNT(*) as orders
      FROM pos_orders 
      WHERE created_at BETWEEN ? AND ? AND status = 'completed'
      GROUP BY DATE(created_at)
      ORDER BY date
    `).bind(start, end).all();

    // Get product profitability
    const productProfitability = await c.env.DB.prepare(`
      SELECT 
        p.name as product_name,
        p.sku,
        SUM(oi.quantity) as total_sold,
        SUM(oi.total_price) as total_revenue,
        SUM(oi.quantity * p.cost_price) as total_cost,
        SUM(oi.total_price) - SUM(oi.quantity * p.cost_price) as profit,
        CASE 
          WHEN SUM(oi.total_price) > 0 
          THEN ROUND((SUM(oi.total_price) - SUM(oi.quantity * p.cost_price)) * 100.0 / SUM(oi.total_price), 2)
          ELSE 0
        END as margin_percentage
      FROM pos_order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN pos_orders o ON oi.order_id = o.id
      WHERE o.created_at BETWEEN ? AND ? AND o.status = 'completed'
      GROUP BY p.id, p.name, p.sku
      HAVING SUM(oi.total_price) > 0
      ORDER BY profit DESC
      LIMIT 20
    `).bind(start, end).all();

    return c.json({
      success: true,
      data: {
        revenue_summary: revenueSummary,
        cogs_summary: cogsSummary,
        daily_revenue: dailyRevenue.results || [],
        product_profitability: productProfitability.results || [],
        period: {
          start,
          end,
          label: period
        }
      }
    });

  } catch (error) {
    console.error('Financial summary report error:', error);
    return c.json({
      success: false,
      message: 'Failed to generate financial summary report',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET /api/advanced-reports/export - Export report to file
app.get('/export', async (c: any) => {
  try {
    const reportType = c.req.query('type'); // 'sales', 'inventory', 'customer', 'financial'
    const format = c.req.query('format') || 'csv'; // 'csv', 'excel', 'pdf'
    const period = c.req.query('period') || 'this_month';

    if (!reportType) {
      return c.json({
        success: false,
        message: 'Report type is required'
      }, 400);
    }

    // Generate report data based on type
    let reportData: any = {};
    
    switch (reportType) {
      case 'sales':
        const salesResponse = await c.env.fetch(`${c.req.url.replace('/export', '/sales-performance')}?period=${period}`);
        reportData = await salesResponse.json();
        break;
      case 'inventory':
        const inventoryResponse = await c.env.fetch(`${c.req.url.replace('/export', '/inventory-analysis')}`);
        reportData = await inventoryResponse.json();
        break;
      case 'customer':
        const customerResponse = await c.env.fetch(`${c.req.url.replace('/export', '/customer-insights')}?period=${period}`);
        reportData = await customerResponse.json();
        break;
      case 'financial':
        const financialResponse = await c.env.fetch(`${c.req.url.replace('/export', '/financial-summary')}?period=${period}`);
        reportData = await financialResponse.json();
        break;
      default:
        return c.json({
          success: false,
          message: 'Invalid report type'
        }, 400);
    }

    // In a real implementation, you would generate the actual file
    // For now, we'll return the data with export instructions
    return c.json({
      success: true,
      data: {
        report_type: reportType,
        format: format,
        period: period,
        data: reportData.data,
        export_url: `/api/advanced-reports/download/${reportType}_${period}_${Date.now()}.${format}`,
        message: 'Report data prepared for export'
      }
    });

  } catch (error) {
    console.error('Report export error:', error);
    return c.json({
      success: false,
      message: 'Failed to export report',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

*/

export default app;
