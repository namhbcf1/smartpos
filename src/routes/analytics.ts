import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const app = new Hono();

// Validation schemas
const productSuggestionsSchema = z.object({
  supplier_id: z.string().optional(),
  category_id: z.string().optional(),
  limit: z.string().default('10')
});

const inventoryForecastSchema = z.object({
  category_id: z.string().optional(),
  supplier_id: z.string().optional(),
  forecast_days: z.string().default('30')
});

// Product Suggestions Endpoint
app.get('/product-suggestions', zValidator('query', productSuggestionsSchema), async (c) => {
  try {
    const { supplier_id, category_id, limit } = c.req.valid('query');
    const db = c.env.DB;

    // Mock intelligent product suggestions based on historical data
    // In a real implementation, this would use ML algorithms
    const suggestions = [
      {
        id: 1,
        name: 'CPU Intel Core i7-13700K',
        sku: 'CPU-I7-13700K',
        category_name: 'CPU',
        price: 8990000,
        cost_price: 7500000,
        stock_quantity: 2,
        suggestion_reason: 'Sắp hết hàng, bán chạy trong tháng',
        confidence_score: 95,
        historical_data: {
          avg_monthly_sales: 12,
          last_purchase_date: '2024-01-10',
          seasonal_trend: 'high',
          profit_margin: 19.9
        },
        supplier_info: {
          name: 'Intel Vietnam',
          rating: 4.8,
          avg_delivery_days: 2
        }
      },
      {
        id: 2,
        name: 'RAM Corsair Vengeance 32GB DDR5',
        sku: 'RAM-CORS-32GB-DDR5',
        category_name: 'RAM',
        price: 4590000,
        cost_price: 3800000,
        stock_quantity: 5,
        suggestion_reason: 'Xu hướng tăng, giá tốt từ nhà cung cấp',
        confidence_score: 87,
        historical_data: {
          avg_monthly_sales: 8,
          last_purchase_date: '2024-01-05',
          seasonal_trend: 'medium',
          profit_margin: 20.8
        },
        supplier_info: {
          name: 'Corsair Official',
          rating: 4.6,
          avg_delivery_days: 3
        }
      }
    ];

    return c.json({
      success: true,
      data: suggestions.slice(0, parseInt(limit))
    });
  } catch (error) {
    console.error('Error getting product suggestions:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi lấy gợi ý sản phẩm'
    }, 500);
  }
});

// Inventory Forecasting Endpoint
app.get('/inventory-forecast', zValidator('query', inventoryForecastSchema), async (c) => {
  try {
    const { category_id, supplier_id, forecast_days } = c.req.valid('query');
    const db = c.env.DB;

    // Mock forecasting data
    // In a real implementation, this would use time series analysis
    const forecasts = [
      {
        product_id: 1,
        product_name: 'CPU Intel Core i5-13400F',
        product_sku: 'CPU-I5-13400F',
        category_name: 'CPU',
        current_stock: 5,
        reorder_point: 8,
        suggested_order_quantity: 15,
        forecast_period_days: parseInt(forecast_days),
        predicted_demand: 12,
        confidence_level: 87,
        risk_level: 'medium',
        seasonal_factor: 1.2,
        trend_direction: 'up',
        historical_data: [
          { date: '2024-01-01', actual_sales: 8, predicted_sales: 7 },
          { date: '2024-01-02', actual_sales: 12, predicted_sales: 11 },
          { date: '2024-01-03', actual_sales: 6, predicted_sales: 8 },
          { date: '2024-01-04', actual_sales: 15, predicted_sales: 13 },
          { date: '2024-01-05', actual_sales: 9, predicted_sales: 10 }
        ],
        cost_impact: {
          current_value: 20950000,
          suggested_order_value: 62850000,
          potential_savings: 1500000
        }
      },
      {
        product_id: 2,
        product_name: 'RAM Corsair Vengeance 16GB',
        product_sku: 'RAM-CORS-16GB',
        category_name: 'RAM',
        current_stock: 12,
        reorder_point: 6,
        suggested_order_quantity: 0,
        forecast_period_days: parseInt(forecast_days),
        predicted_demand: 8,
        confidence_level: 92,
        risk_level: 'low',
        seasonal_factor: 0.9,
        trend_direction: 'stable',
        historical_data: [
          { date: '2024-01-01', actual_sales: 5, predicted_sales: 6 },
          { date: '2024-01-02', actual_sales: 7, predicted_sales: 7 },
          { date: '2024-01-03', actual_sales: 4, predicted_sales: 5 },
          { date: '2024-01-04', actual_sales: 9, predicted_sales: 8 },
          { date: '2024-01-05', actual_sales: 6, predicted_sales: 6 }
        ],
        cost_impact: {
          current_value: 27600000,
          suggested_order_value: 0,
          potential_savings: 0
        }
      }
    ];

    return c.json({
      success: true,
      data: forecasts
    });
  } catch (error) {
    console.error('Error getting inventory forecast:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi lấy dự báo tồn kho'
    }, 500);
  }
});

// Dashboard Data Endpoint
app.get('/dashboard', async (c) => {
  try {
    const db = c.env.DB;

    // Mock dashboard data
    // In a real implementation, this would aggregate data from various tables
    const dashboardData = {
      summary: {
        total_products: 1247,
        total_value: 2850000000,
        low_stock_count: 23,
        out_of_stock_count: 5,
        pending_orders: 12,
        monthly_revenue: 450000000,
        monthly_growth: 12.5
      },
      stock_levels: [
        { category: 'CPU', in_stock: 145, low_stock: 8, out_of_stock: 2, total_value: 850000000 },
        { category: 'GPU', in_stock: 89, low_stock: 5, out_of_stock: 1, total_value: 1200000000 },
        { category: 'RAM', in_stock: 234, low_stock: 6, out_of_stock: 1, total_value: 320000000 },
        { category: 'Storage', in_stock: 178, low_stock: 4, out_of_stock: 1, total_value: 480000000 }
      ],
      recent_activities: [
        {
          id: 1,
          type: 'stock_in',
          product_name: 'CPU Intel Core i7-13700K',
          quantity: 10,
          timestamp: new Date().toISOString(),
          user_name: 'Nguyễn Văn A'
        },
        {
          id: 2,
          type: 'stock_out',
          product_name: 'GPU RTX 4070',
          quantity: -2,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          user_name: 'Trần Thị B'
        }
      ],
      top_products: [
        {
          product_name: 'CPU Intel Core i5-13400F',
          category: 'CPU',
          quantity_sold: 45,
          revenue: 189000000,
          growth_rate: 15.2
        },
        {
          product_name: 'RAM Corsair 16GB DDR4',
          category: 'RAM',
          quantity_sold: 78,
          revenue: 156000000,
          growth_rate: 8.7
        }
      ],
      alerts: [
        {
          id: 1,
          type: 'low_stock',
          message: 'Sắp hết hàng',
          product_name: 'CPU Intel Core i9-13900K',
          severity: 'high',
          created_at: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: 2,
          type: 'out_of_stock',
          message: 'Hết hàng',
          product_name: 'GPU RTX 4090',
          severity: 'high',
          created_at: new Date(Date.now() - 10800000).toISOString()
        }
      ]
    };

    return c.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi lấy dữ liệu dashboard'
    }, 500);
  }
});

// Price Analytics Endpoint
app.get('/price-analytics', async (c) => {
  try {
    const db = c.env.DB;

    // Mock price analytics data
    const priceAnalytics = {
      price_trends: [
        {
          product_id: 1,
          product_name: 'CPU Intel Core i7-13700K',
          current_price: 8990000,
          price_history: [
            { date: '2024-01-01', price: 9200000 },
            { date: '2024-01-08', price: 9100000 },
            { date: '2024-01-15', price: 8990000 }
          ],
          trend: 'decreasing',
          recommendation: 'Thời điểm tốt để mua'
        }
      ],
      market_insights: {
        avg_price_change: -2.3,
        volatile_categories: ['GPU', 'RAM'],
        stable_categories: ['Storage', 'Cooling']
      }
    };

    return c.json({
      success: true,
      data: priceAnalytics
    });
  } catch (error) {
    console.error('Error getting price analytics:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi lấy phân tích giá'
    }, 500);
  }
});

export default app;
