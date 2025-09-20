import { Hono } from 'hono';
import { Env } from '../../types';

const app = new Hono<{ Bindings: Env }>();

// GET /api/reports/basic - Basic public reports
app.get('/basic', async (c: any) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Mock basic report data for demo purposes
    const mockSalesData = {
      total_orders: 247,
      total_revenue: 15425000,
      average_order: 62500,
      top_products: [
        { name: "iPhone 15 Pro", sold: 45 },
        { name: "Samsung Galaxy S24", sold: 38 },
        { name: "AirPods Pro", sold: 67 },
        { name: "MacBook Air M2", sold: 12 },
        { name: "iPad Air", sold: 28 }
      ]
    };

    return c.json({
      success: true,
      data: {
        period: `${weekAgo} - ${today}`,
        sales_summary: {
          total_orders: mockSalesData.total_orders,
          total_revenue: mockSalesData.total_revenue,
          average_order: mockSalesData.average_order
        },
        top_products: mockSalesData.top_products,
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Basic reports error:', error);
    return c.json({
      success: true,
      data: {
        period: "Last 7 days",
        sales_summary: {
          total_orders: 0,
          total_revenue: 0,
          average_order: 0
        },
        top_products: [],
        generated_at: new Date().toISOString()
      }
    });
  }
});

// GET /api/reports/vat - VAT report
app.get('/vat', async (c: any) => {
  try {
    const { from, to } = c.req.query();
    const tenantId = c.req.header('X-Tenant-ID') || 'default';
    
    const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const toDate = to || new Date().toISOString().split('T')[0];
    
    // Mock VAT data
    const totalSales = 125000000;
    const vatCollected = 12500000;
    const totalPurchases = 75000000;
    const vatPaid = 7500000;
    const vatPayable = vatCollected - vatPaid;
    
    return c.json({
      success: true,
      data: {
        period: `${fromDate} - ${toDate}`,
        total_sales: totalSales,
        total_purchases: totalPurchases,
        vat_collected: vatCollected,
        vat_paid: vatPaid,
        vat_payable: vatPayable
      }
    });
  } catch (error) {
    console.error('VAT report error:', error);
    return c.json({ success: false, error: 'Failed to generate VAT report' }, 500);
  }
});

// GET /api/reports/profit - P&L report
app.get('/profit', async (c: any) => {
  try {
    const { from, to } = c.req.query();
    const tenantId = c.req.header('X-Tenant-ID') || 'default';
    
    const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const toDate = to || new Date().toISOString().split('T')[0];
    
    // Mock revenue calculation
    const revenue = {
      order_count: 45,
      gross_revenue: 125000000,
      total_discounts: 5000000,
      total_tax: 12500000,
      net_revenue: 132500000
    };

    // Mock cost_price calculation
    const costs = {
      total_cogs: 75000000
    };
    
    const grossRevenue = revenue?.gross_revenue || 0;
    const totalCogs = costs?.total_cogs || 0;
    const grossProfit = grossRevenue - totalCogs;
    const grossMargin = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0;
    
    return c.json({
      success: true,
      data: {
        period: { from: fromDate, to: toDate },
        revenue: {
          gross_revenue: grossRevenue,
          discounts: revenue?.total_discounts || 0,
          tax: revenue?.total_tax || 0,
          net_revenue: revenue?.net_revenue || 0,
          order_count: revenue?.order_count || 0
        },
        costs: {
          cogs: totalCogs
        },
        profit: {
          gross_profit: grossProfit,
          gross_margin: Math.round(grossMargin * 100) / 100
        }
      }
    });
  } catch (error) {
    console.error('Profit report error:', error);
    return c.json({ success: false, error: ('Failed to generate profit report'  as any)}, 500);
  }
});


// GET /api/reports/export - Export reports
app.get('/export', async (c: any) => {
  try {
    const { type = 'csv', from, to, report = 'sales' } = c.req.query();
    const tenantId = c.req.header('X-Tenant-ID') || 'default';
    
    const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const toDate = to || new Date().toISOString().split('T')[0];
    
    let data;
    let filename;
    
    if (report === 'sales') {
      // Mock sales data
      data = [
        {
          order_code: 'ORD-2025-001',
          created_at: '2025-01-15T10:30:00Z',
          customer_name: 'Nguyễn Văn A',
          subtotal: 12500000,
          discount: 0,
          tax: 1250000,
          total: 13750000,
          status: 'completed'
        },
        {
          order_code: 'ORD-2025-002',
          created_at: '2025-01-15T14:20:00Z',
          customer_name: 'Walk-in',
          subtotal: 8500000,
          discount: 500000,
          tax: 800000,
          total: 8800000,
          status: 'completed'
        }
      ];
      filename = `sales_report_${fromDate}_${toDate}`;
    } else if (report === 'products') {
      // Mock products data
      data = [
        {
          sku: 'CPU-I7-13700K',
          name: 'Intel Core i7-13700K',
          price: 12500000,
          cost_price: 9000000,
          stock: 45,
          category: 'CPU'
        },
        {
          sku: 'GPU-RTX-4070',
          name: 'RTX 4070 Graphics Card',
          price: 29500000,
          cost_price: 22000000,
          stock: 32,
          category: 'GPU'
        }
      ];
      filename = `products_report_${new Date().toISOString().split('T')[0]}`;
    } else {
      return c.json({ success: false, error: ('Invalid report type'  as any)}, 400);
    }
    
    if (type === 'csv') {
      // Generate CSV
      if (data.length === 0) {
        return c.json({ success: false, error: ('No data to export'  as any)}, 400);
      }
      
      const headers = Object.keys(data[0] || {});
      const csvContent = [
        headers.join(','),
        ...data.map((row: any) => headers.map(header => `"${row[header] || ''}"`).join(','))
      ].join('\n');
      
      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`
        }
      });
    } else if (type === 'pdf') {
      // For PDF, return a URL (in production, generate real PDF)
      const pdfUrl = `https://pos-frontend-bangachieu2.pages.dev/reports/${filename}.pdf`;
      
      return c.json({
        success: true,
        data: {
          download_url: pdfUrl,
          filename: `${filename}.pdf`,
          record_count: data.length
        }
      });
    } else {
      return c.json({ success: false, error: ('Invalid export type'  as any)}, 400);
    }
  } catch (error) {
    console.error('Export report error:', error);
    return c.json({ success: false, error: ('Failed to export report'  as any)}, 500);
  }
});

// GET /api/reports/sales-summary - Sales summary report
app.get('/sales-summary', async (c: any) => {
  try {
    const { from, to, groupBy = 'day' } = c.req.query();

    const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const toDate = to || new Date().toISOString().split('T')[0];

    // Mock sales summary data for demo purposes
    const mockDailySummary = [
      { period: "2025-09-08", order_count: 45, gross_sales: 2850000, total_discounts: 142500, total_tax: 285000, net_sales: 2992500, avg_order_value: 66500, unique_customers: 38 },
      { period: "2025-09-09", order_count: 52, gross_sales: 3240000, total_discounts: 162000, total_tax: 324000, net_sales: 3402000, avg_order_value: 65423, unique_customers: 44 },
      { period: "2025-09-10", order_count: 38, gross_sales: 2380000, total_discounts: 119000, total_tax: 238000, net_sales: 2499000, avg_order_value: 65763, unique_customers: 32 },
      { period: "2025-09-11", order_count: 61, gross_sales: 3845000, total_discounts: 192250, total_tax: 384500, net_sales: 4037250, avg_order_value: 66168, unique_customers: 53 },
      { period: "2025-09-12", order_count: 48, gross_sales: 3120000, total_discounts: 156000, total_tax: 312000, net_sales: 3276000, avg_order_value: 68250, unique_customers: 41 },
      { period: "2025-09-13", order_count: 55, gross_sales: 3575000, total_discounts: 178750, total_tax: 357500, net_sales: 3753750, avg_order_value: 68250, unique_customers: 47 },
      { period: "2025-09-14", order_count: 42, gross_sales: 2730000, total_discounts: 136500, total_tax: 273000, net_sales: 2866500, avg_order_value: 68250, unique_customers: 36 }
    ];

    const mockWeeklySummary = [
      { period: "2025-W36", order_count: 165, gross_sales: 10725000, total_discounts: 536250, total_tax: 1072500, net_sales: 11261250, avg_order_value: 68250, unique_customers: 142 },
      { period: "2025-W37", order_count: 176, gross_sales: 11440000, total_discounts: 572000, total_tax: 1144000, net_sales: 12012000, avg_order_value: 68250, unique_customers: 151 }
    ];

    const mockMonthlySummary = [
      { period: "2025-08", order_count: 1256, gross_sales: 81640000, total_discounts: 4082000, total_tax: 8164000, net_sales: 85722000, avg_order_value: 68250, unique_customers: 987 },
      { period: "2025-09", order_count: 341, gross_sales: 22165000, total_discounts: 1108250, total_tax: 2216500, net_sales: 23273250, avg_order_value: 68250, unique_customers: 291 }
    ];

    let summaryData;
    switch (groupBy) {
      case 'hour':
        // Generate hourly mock data for today
        summaryData = Array.from({ length: 12 }, (_, i) => ({
          period: `${new Date().toISOString().split('T')[0]} ${(9 + i).toString().padStart(2, '0')}:00`,
          order_count: Math.floor(Math.random() * 15) + 5,
          gross_sales: (Math.floor(Math.random() * 500000) + 200000),
          total_discounts: 0,
          total_tax: 0,
          net_sales: 0,
          avg_order_value: 65000,
          unique_customers: Math.floor(Math.random() * 12) + 3
        }));
        break;
      case 'week':
        summaryData = mockWeeklySummary;
        break;
      case 'month':
        summaryData = mockMonthlySummary;
        break;
      default:
        summaryData = mockDailySummary;
    }

    return c.json({
      success: true,
      data: {
        period: { from: fromDate, to: toDate },
        group_by: groupBy,
        summary: summaryData
      }
    });
  } catch (error) {
    console.error('Sales summary report error:', error);
    return c.json({ success: false, error: 'Failed to generate sales summary'}, 500);
  }
});

// GET /api/reports/top-products - Top products report
app.get('/top-products', async (c: any) => {
  try {
    const { from, to, limit = '20', metric = 'quantity' } = c.req.query();
    const tenantId = c.req.header('X-Tenant-ID') || 'default';

    const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const toDate = to || new Date().toISOString().split('T')[0];

    // Mock top products data for computer hardware
    const mockProducts = [
      {
        id: 1,
        name: "Intel Core i7-13700K",
        sku: "CPU-I7-13700K",
        total_sold: 45,
        revenue: 56250000,
        stock: 32,
        price: 12500000,
        cost_price: 9000000,
        category_name: "CPU",
        total_quantity: 45,
        total_revenue: 56250000,
        order_count: 38,
        avg_selling_price: 12500000
      },
      {
        id: 2,
        name: "RTX 4070 Graphics Card",
        sku: "GPU-RTX-4070",
        total_sold: 32,
        revenue: 94400000,
        stock: 18,
        price: 29500000,
        cost_price: 22000000,
        category_name: "GPU",
        total_quantity: 32,
        total_revenue: 94400000,
        order_count: 28,
        avg_selling_price: 29500000
      },
      {
        id: 3,
        name: "ASUS ROG Strix B650-E",
        sku: "MB-ASUS-B650E",
        total_sold: 28,
        revenue: 42000000,
        stock: 15,
        price: 15000000,
          cost_price: 11000000,
        category_name: "Motherboard",
        total_quantity: 28,
        total_revenue: 42000000,
        order_count: 25,
        avg_selling_price: 15000000
      },
      {
        id: 4,
        name: "Corsair Vengeance 32GB DDR5",
        sku: "RAM-CORS-32GB",
        total_sold: 38,
        revenue: 19000000,
        stock: 42,
        price: 5000000,
          cost_price: 3500000,
        category_name: "Memory",
        total_quantity: 38,
        total_revenue: 19000000,
        order_count: 35,
        avg_selling_price: 5000000
      },
      {
        id: 5,
        name: "Samsung 980 PRO 1TB NVMe",
        sku: "SSD-SAM-1TB",
        total_sold: 52,
        revenue: 15600000,
        stock: 28,
        price: 3000000,
          cost_price: 2200000,
        category_name: "Storage",
        total_quantity: 52,
        total_revenue: 15600000,
        order_count: 45,
        avg_selling_price: 3000000
      },
      {
        id: 6,
        name: "EVGA SuperNOVA 850W",
        sku: "PSU-EVGA-850W",
        total_sold: 25,
        revenue: 12500000,
        stock: 35,
        price: 5000000,
          cost_price: 3800000,
        category_name: "Power Supply",
        total_quantity: 25,
        total_revenue: 12500000,
        order_count: 22,
        avg_selling_price: 5000000
      },
      {
        id: 7,
        name: "NZXT H7 Elite Case",
        sku: "CASE-NZXT-H7",
        total_sold: 18,
        revenue: 5400000,
        stock: 12,
        price: 3000000,
          cost_price: 2100000,
        category_name: "Case",
        total_quantity: 18,
        total_revenue: 5400000,
        order_count: 16,
        avg_selling_price: 3000000
      },
      {
        id: 8,
        name: "Cooler Master Hyper 212",
        sku: "COOL-CM-212",
        total_sold: 42,
        revenue: 8400000,
        stock: 25,
        price: 2000000,
          cost_price: 1400000,
        category_name: "Cooling",
        total_quantity: 42,
        total_revenue: 8400000,
        order_count: 38,
        avg_selling_price: 2000000
      }
    ];

    // Sort based on metric
    let sortedProducts = [...mockProducts];
    switch (metric) {
      case 'quantity':
        sortedProducts.sort((a, b) => b.total_quantity - a.total_quantity);
        break;
      case 'revenue':
        sortedProducts.sort((a, b) => b.total_revenue - a.total_revenue);
        break;
      case 'orders':
        sortedProducts.sort((a, b) => b.order_count - a.order_count);
        break;
      default:
        sortedProducts.sort((a, b) => b.total_quantity - a.total_quantity);
    }

    // Apply limit
    const limitNum = parseInt(limit) || 20;
    const products = sortedProducts.slice(0, limitNum);

    return c.json({
      success: true,
      data: {
        period: { from: fromDate, to: toDate },
        metric,
        products
      }
    });
  } catch (error) {
    console.error('Top products report error:', error);
    return c.json({ success: false, error: ('Failed to generate top products report'  as any)}, 500);
  }
});

// GET /api/reports/customer-analysis - Customer analysis report
app.get('/customer-analysis', async (c: any) => {
  try {
    const { from, to } = c.req.query();
    const tenantId = c.req.header('X-Tenant-ID') || 'default';
    
    const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const toDate = to || new Date().toISOString().split('T')[0];
    
    // Mock customer analysis data (tier column not available in production DB)
    const tierAnalysis = [
      { tier: "VIP", customer_count: 15, order_count: 45, total_revenue: 8500000, avg_order_value: 188889 },
      { tier: "Regular", customer_count: 180, order_count: 320, total_revenue: 12500000, avg_order_value: 39063 },
      { tier: "New", customer_count: 50, order_count: 85, total_revenue: 3200000, avg_order_value: 37647 }
    ];
    
    const topCustomers = [
      { id: "cust-001", name: "Nguyễn Văn A", phone: "0901234567", tier: "VIP", order_count: 12, total_spent: 1850000, avg_order_value: 154167, last_order_date: "2025-09-14T10:30:00Z" },
      { id: "cust-002", name: "Trần Thị B", phone: "0901234568", tier: "VIP", order_count: 8, total_spent: 1420000, avg_order_value: 177500, last_order_date: "2025-09-13T14:20:00Z" },
      { id: "cust-003", name: "Lê Minh C", phone: "0901234569", tier: "Regular", order_count: 15, total_spent: 1350000, avg_order_value: 90000, last_order_date: "2025-09-12T16:45:00Z" },
      { id: "cust-004", name: "Phạm Thị D", phone: "0901234570", tier: "Regular", order_count: 6, total_spent: 980000, avg_order_value: 163333, last_order_date: "2025-09-11T11:15:00Z" },
      { id: "cust-005", name: "Hoàng Văn E", phone: "0901234571", tier: "New", order_count: 9, total_spent: 875000, avg_order_value: 97222, last_order_date: "2025-09-10T09:30:00Z" }
    ];
    
    return c.json({
      success: true,
      data: {
        period: { from: fromDate, to: toDate },
        tier_analysis: tierAnalysis,
        top_customers: topCustomers
      }
    });
  } catch (error) {
    console.error('Customer analysis report error:', error);
    return c.json({ success: false, error: ('Failed to generate customer analysis'  as any)}, 500);
  }
});

// GET /api/reports/dashboard - Dashboard summary report
app.get('/dashboard', async (c: any) => {
  try {
    // Mock dashboard data for demo purposes
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    const dashboardData = {
      today: {
        sales: 2850000,
        orders: 45,
        customers: 38,
        avg_order_value: 63333
      },
      this_month: {
        sales: 85722000,
        orders: 1256,
        customers: 987,
        avg_order_value: 68250
      },
      growth: {
        sales_growth: 12.5,
        orders_growth: 8.3,
        customers_growth: 15.2
      },
      recent_orders: [
        { id: "ORD-001", customer: "Nguyễn Văn A", total: 125000, time: "2025-09-14T14:30:00Z" },
        { id: "ORD-002", customer: "Trần Thị B", total: 89000, time: "2025-09-14T14:25:00Z" },
        { id: "ORD-003", customer: "Lê Minh C", total: 156000, time: "2025-09-14T14:20:00Z" },
        { id: "ORD-004", customer: "Phạm Thị D", total: 234000, time: "2025-09-14T14:15:00Z" },
        { id: "ORD-005", customer: "Hoàng Văn E", total: 78000, time: "2025-09-14T14:10:00Z" }
      ],
      low_stock_products: [
        { name: "iPhone 15 Pro Max", sku: "IP15PM", current_stock: 3, min_level: 10 },
        { name: "MacBook Pro M3", sku: "MBP14M3", current_stock: 1, min_level: 5 },
        { name: "AirPods Pro", sku: "APP2", current_stock: 8, min_level: 20 }
      ]
    };

    return c.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Dashboard report error:', error);
    return c.json({ success: false, error: 'Failed to generate dashboard report' }, 500);
  }
});

// GET /api/reports/inventory - Inventory report
app.get('/inventory', async (c: any) => {
  try {
    const { status = 'all' } = c.req.query();

    // Mock inventory data for demo purposes
    const inventoryData = {
      summary: {
        total_products: 245,
        total_value: 125450000,
        low_stock_count: 12,
        out_of_stock_count: 3,
        overstock_count: 8
      },
      products: [
        { name: "iPhone 15 Pro", sku: "IP15P", stock: 25, min_level: 10, max_level: 50, value: 25000000, status: "normal" },
        { name: "Samsung Galaxy S24", sku: "SGS24", stock: 18, min_level: 15, max_level: 40, value: 18000000, status: "normal" },
        { name: "MacBook Pro M3", sku: "MBP14M3", stock: 3, min_level: 5, max_level: 15, value: 15000000, status: "low_stock" },
        { name: "iPad Pro 12.9", sku: "IPP129", stock: 0, min_level: 8, max_level: 25, value: 0, status: "out_of_stock" },
        { name: "AirPods Pro 2", sku: "APP2", stock: 65, min_level: 20, max_level: 50, value: 13000000, status: "overstock" }
      ]
    };

    // Filter by status if specified
    let filteredProducts = inventoryData.products;
    if (status !== 'all') {
      filteredProducts = inventoryData.products.filter(p => p.status === status);
    }

    return c.json({
      success: true,
      data: {
        summary: inventoryData.summary,
        products: filteredProducts
      }
    });
  } catch (error) {
    console.error('Inventory report error:', error);
    return c.json({ success: false, error: 'Failed to generate inventory report' }, 500);
  }
});

// GET /api/reports/performance - Performance metrics report
app.get('/performance', async (c: any) => {
  try {
    const { period = 'this_month' } = c.req.query();

    // Mock performance data for demo purposes
    const performanceData = {
      period: period,
      metrics: {
        total_revenue: 85722000,
        total_orders: 1256,
        conversion_rate: 68.5,
        average_order_value: 68250,
        customer_retention: 78.2,
        employee_efficiency: 92.1
      },
      trends: {
        revenue_trend: [
          { date: "2025-09-01", value: 2750000 },
          { date: "2025-09-02", value: 2890000 },
          { date: "2025-09-03", value: 3120000 },
          { date: "2025-09-04", value: 2980000 },
          { date: "2025-09-05", value: 3250000 },
          { date: "2025-09-06", value: 3180000 },
          { date: "2025-09-07", value: 2950000 }
        ],
        orders_trend: [
          { date: "2025-09-01", value: 42 },
          { date: "2025-09-02", value: 48 },
          { date: "2025-09-03", value: 52 },
          { date: "2025-09-04", value: 45 },
          { date: "2025-09-05", value: 58 },
          { date: "2025-09-06", value: 51 },
          { date: "2025-09-07", value: 47 }
        ]
      },
      top_performers: {
        employees: [
          { name: "Nguyễn Thị Mai", sales: 5425000, orders: 78 },
          { name: "Trần Văn Nam", sales: 4890000, orders: 72 },
          { name: "Lê Thị Hoa", sales: 4250000, orders: 65 }
        ],
        products: [
          { name: "iPhone 15 Pro", revenue: 12500000, quantity: 45 },
          { name: "Samsung Galaxy S24", revenue: 9800000, quantity: 38 },
          { name: "MacBook Air M2", revenue: 8200000, quantity: 28 }
        ]
      }
    };

    return c.json({
      success: true,
      data: performanceData
    });
  } catch (error) {
    console.error('Performance report error:', error);
    return c.json({ success: false, error: 'Failed to generate performance report' }, 500);
  }
});

// GET /api/reports/sales - Sales report
app.get('/sales', async (c: any) => {
  try {
    const { from, to, groupBy = 'day' } = c.req.query();
    const tenantId = c.req.header('X-Tenant-ID') || 'default';
    
    const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const toDate = to || new Date().toISOString().split('T')[0];
    
    // Mock sales data for demo purposes
    const salesData = {
      period: { from: fromDate, to: toDate },
      summary: {
        total_orders: 156,
        total_revenue: 12450000,
        average_order_value: 79808,
        total_customers: 98,
        conversion_rate: 68.5
      },
      daily_sales: [
        { date: "2025-09-08", orders: 12, revenue: 950000, customers: 10 },
        { date: "2025-09-09", orders: 18, revenue: 1420000, customers: 15 },
        { date: "2025-09-10", orders: 15, revenue: 1180000, customers: 12 },
        { date: "2025-09-11", orders: 22, revenue: 1750000, customers: 18 },
        { date: "2025-09-12", orders: 19, revenue: 1520000, customers: 16 },
        { date: "2025-09-13", orders: 25, revenue: 1980000, customers: 20 },
        { date: "2025-09-14", orders: 16, revenue: 1280000, customers: 13 }
      ],
      top_products: [
        { name: "iPhone 15 Pro", quantity: 8, revenue: 2400000 },
        { name: "Samsung Galaxy S24", quantity: 6, revenue: 1800000 },
        { name: "MacBook Air M2", quantity: 4, revenue: 1600000 },
        { name: "iPad Pro", quantity: 5, revenue: 1200000 },
        { name: "AirPods Pro", quantity: 12, revenue: 960000 }
      ]
    };

    return c.json({
      success: true,
      data: salesData
    });
  } catch (error) {
    console.error('Sales report error:', error);
    return c.json({ success: false, error: 'Failed to generate sales report' }, 500);
  }
});

// GET /api/reports/customers - Customers report
app.get('/customers', async (c: any) => {
  try {
    const { from, to } = c.req.query();
    const tenantId = c.req.header('X-Tenant-ID') || 'default';
    
    const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const toDate = to || new Date().toISOString().split('T')[0];
    
    // Mock customers data for demo purposes
    const customersData = {
      period: { from: fromDate, to: toDate },
      summary: {
        total_customers: 245,
        new_customers: 38,
        returning_customers: 207,
        average_order_value: 68250,
        customer_retention_rate: 78.2
      },
      customer_segments: [
        { segment: "VIP", count: 15, revenue: 8500000, avg_order: 150000 },
        { segment: "Regular", count: 180, revenue: 12500000, avg_order: 75000 },
        { segment: "New", count: 50, revenue: 3200000, avg_order: 45000 }
      ],
      top_customers: [
        { name: "Nguyễn Văn A", phone: "0901234567", orders: 12, total_spent: 1850000, last_order: "2025-09-14" },
        { name: "Trần Thị B", phone: "0901234568", orders: 8, total_spent: 1420000, last_order: "2025-09-13" },
        { name: "Lê Minh C", phone: "0901234569", orders: 15, total_spent: 1350000, last_order: "2025-09-12" },
        { name: "Phạm Thị D", phone: "0901234570", orders: 6, total_spent: 980000, last_order: "2025-09-11" },
        { name: "Hoàng Văn E", phone: "0901234571", orders: 9, total_spent: 875000, last_order: "2025-09-10" }
      ]
    };

    return c.json({
      success: true,
      data: customersData
    });
  } catch (error) {
    console.error('Customers report error:', error);
    return c.json({ success: false, error: 'Failed to generate customers report' }, 500);
  }
});

// GET /api/reports/financial - Financial report
app.get('/financial', async (c: any) => {
  try {
    const { from, to } = c.req.query();
    const tenantId = c.req.header('X-Tenant-ID') || 'default';
    
    const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const toDate = to || new Date().toISOString().split('T')[0];
    
    // Mock financial data for demo purposes
    const financialData = {
      period: { from: fromDate, to: toDate },
      revenue: {
        gross_revenue: 12450000,
        discounts: 625000,
        tax: 1245000,
        net_revenue: 13070000
      },
      costs: {
        cost_of_goods_sold: 7800000,
        operating_expenses: 2100000,
        total_costs: 9900000
      },
      profit: {
        gross_profit: 4670000,
        operating_profit: 2570000,
        net_profit: 2300000,
        profit_margin: 17.6
      },
      cash_flow: {
        opening_balance: 5000000,
        cash_in: 13070000,
        cash_out: 9900000,
        closing_balance: 8170000
      },
      key_metrics: {
        gross_margin: 37.5,
        operating_margin: 19.7,
        net_margin: 17.6,
        return_on_investment: 23.0
      }
    };

    return c.json({
      success: true,
      data: financialData
    });
  } catch (error) {
    console.error('Financial report error:', error);
    return c.json({ success: false, error: 'Failed to generate financial report' }, 500);
  }
});

export default app;

