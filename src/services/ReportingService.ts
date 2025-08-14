/**
 * Advanced Reporting Service for SmartPOS
 */

import { Env } from '../types';
import { DatabaseExecutor, PaginationOptions } from '../utils/database';
import { cache, CacheConfigs } from '../utils/cache';

export interface ReportFilter {
  dateFrom?: string;
  dateTo?: string;
  storeId?: number;
  categoryId?: number;
  productId?: number;
  customerId?: number;
  userId?: number;
  paymentMethod?: string;
  saleStatus?: string;
}

export interface ReportColumn {
  key: string;
  label: string;
  type: 'string' | 'number' | 'currency' | 'date' | 'percentage';
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  format?: string;
}

export interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  category: 'sales' | 'inventory' | 'financial' | 'customer' | 'custom';
  query: string;
  columns: ReportColumn[];
  filters: ReportFilter;
  chartType?: 'line' | 'bar' | 'pie' | 'area' | 'table';
  refreshInterval?: number; // minutes
  isScheduled?: boolean;
  scheduleConfig?: ScheduleConfig;
}

export interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:MM format
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv';
}

export interface ReportResult {
  data: any[];
  summary: {
    totalRecords: number;
    aggregations: Record<string, number>;
  };
  metadata: {
    generatedAt: string;
    executionTime: number;
    filters: ReportFilter;
  };
}

export class ReportingService {
  private executor: DatabaseExecutor;

  constructor(private env: Env) {
    this.executor = new DatabaseExecutor(env);
  }

  /**
   * Generate a report based on definition
   */
  async generateReport(
    reportId: string,
    filters: ReportFilter = {},
    pagination?: PaginationOptions
  ): Promise<ReportResult> {
    const startTime = Date.now();
    
    try {
      const reportDef = await this.getReportDefinition(reportId);
      if (!reportDef) {
        throw new Error(`Report definition not found: ${reportId}`);
      }

      // Build query with filters
      const { query, bindings } = this.buildQuery(reportDef, filters);
      
      // Execute query
      let data: any[];
      if (pagination) {
        const result = await this.executor.paginate(query, bindings, pagination);
        data = result.data;
      } else {
        const result = await this.executor.execute(query, bindings);
        data = result.data || [];
      }

      // Calculate aggregations
      const aggregations = this.calculateAggregations(data, reportDef.columns);

      // Format data
      const formattedData = this.formatReportData(data, reportDef.columns);

      const result: ReportResult = {
        data: formattedData,
        summary: {
          totalRecords: data.length,
          aggregations,
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          executionTime: Date.now() - startTime,
          filters,
        },
      };

      // Cache result if appropriate
      if (reportDef.refreshInterval && reportDef.refreshInterval > 5) {
        await cache.set(
          this.env,
          `report:${reportId}:${JSON.stringify(filters)}`,
          result,
          { ttl: reportDef.refreshInterval * 60, namespace: 'reports' }
        );
      }

      return result;
    } catch (error) {
      console.error('Report generation failed:', error);
      throw error;
    }
  }

  /**
   * Get predefined report definitions
   */
  async getReportDefinitions(): Promise<ReportDefinition[]> {
    return [
      // Sales Reports
      {
        id: 'sales_summary',
        name: 'Sales Summary',
        description: 'Daily sales summary with totals and trends',
        category: 'sales',
        query: `
          SELECT 
            DATE(s.created_at) as sale_date,
            COUNT(*) as total_sales,
            SUM(s.final_amount) as total_revenue,
            AVG(s.final_amount) as avg_order_value,
            COUNT(DISTINCT s.customer_id) as unique_customers,
            SUM(CASE WHEN s.payment_method = 'cash' THEN s.final_amount ELSE 0 END) as cash_sales,
            SUM(CASE WHEN s.payment_method = 'card' THEN s.final_amount ELSE 0 END) as card_sales
          FROM sales s
          WHERE s.sale_status = 'completed'
            AND s.created_at >= ? AND s.created_at <= ?
            {{STORE_FILTER}}
          GROUP BY DATE(s.created_at)
          ORDER BY sale_date DESC
        `,
        columns: [
          { key: 'sale_date', label: 'Date', type: 'date' },
          { key: 'total_sales', label: 'Total Sales', type: 'number', aggregation: 'sum' },
          { key: 'total_revenue', label: 'Revenue', type: 'currency', aggregation: 'sum' },
          { key: 'avg_order_value', label: 'Avg Order Value', type: 'currency', aggregation: 'avg' },
          { key: 'unique_customers', label: 'Unique Customers', type: 'number', aggregation: 'sum' },
          { key: 'cash_sales', label: 'Cash Sales', type: 'currency', aggregation: 'sum' },
          { key: 'card_sales', label: 'Card Sales', type: 'currency', aggregation: 'sum' },
        ],
        filters: {},
        chartType: 'line',
        refreshInterval: 15,
      },
      
      {
        id: 'top_products',
        name: 'Top Selling Products',
        description: 'Best performing products by quantity and revenue',
        category: 'sales',
        query: `
          SELECT 
            p.name as product_name,
            p.sku,
            c.name as category_name,
            SUM(si.quantity) as total_quantity,
            SUM(si.subtotal) as total_revenue,
            COUNT(DISTINCT si.sale_id) as order_count,
            AVG(si.unit_price) as avg_price
          FROM sale_items si
          JOIN products p ON si.product_id = p.id
          JOIN categories c ON p.category_id = c.id
          JOIN sales s ON si.sale_id = s.id
          WHERE s.sale_status = 'completed'
            AND s.created_at >= ? AND s.created_at <= ?
            {{STORE_FILTER}}
            {{CATEGORY_FILTER}}
          GROUP BY p.id, p.name, p.sku, c.name
          ORDER BY total_quantity DESC
          LIMIT 50
        `,
        columns: [
          { key: 'product_name', label: 'Product', type: 'string' },
          { key: 'sku', label: 'SKU', type: 'string' },
          { key: 'category_name', label: 'Category', type: 'string' },
          { key: 'total_quantity', label: 'Qty Sold', type: 'number', aggregation: 'sum' },
          { key: 'total_revenue', label: 'Revenue', type: 'currency', aggregation: 'sum' },
          { key: 'order_count', label: 'Orders', type: 'number', aggregation: 'sum' },
          { key: 'avg_price', label: 'Avg Price', type: 'currency', aggregation: 'avg' },
        ],
        filters: {},
        chartType: 'bar',
        refreshInterval: 30,
      },

      // Inventory Reports
      {
        id: 'inventory_status',
        name: 'Inventory Status',
        description: 'Current stock levels and alerts',
        category: 'inventory',
        query: `
          SELECT 
            p.name as product_name,
            p.sku,
            c.name as category_name,
            p.stock_quantity,
            p.stock_alert_threshold,
            p.cost_price,
            p.price as selling_price,
            (p.price - p.cost_price) as profit_margin,
            CASE 
              WHEN p.stock_quantity = 0 THEN 'Out of Stock'
              WHEN p.stock_quantity <= p.stock_alert_threshold THEN 'Low Stock'
              ELSE 'In Stock'
            END as stock_status,
            p.stock_quantity * p.cost_price as inventory_value
          FROM products p
          JOIN categories c ON p.category_id = c.id
          WHERE p.is_active = 1
            {{CATEGORY_FILTER}}
          ORDER BY 
            CASE 
              WHEN p.stock_quantity = 0 THEN 1
              WHEN p.stock_quantity <= p.stock_alert_threshold THEN 2
              ELSE 3
            END,
            p.name
        `,
        columns: [
          { key: 'product_name', label: 'Product', type: 'string' },
          { key: 'sku', label: 'SKU', type: 'string' },
          { key: 'category_name', label: 'Category', type: 'string' },
          { key: 'stock_quantity', label: 'Stock Qty', type: 'number' },
          { key: 'stock_alert_threshold', label: 'Alert Level', type: 'number' },
          { key: 'cost_price', label: 'Cost Price', type: 'currency' },
          { key: 'selling_price', label: 'Selling Price', type: 'currency' },
          { key: 'profit_margin', label: 'Profit Margin', type: 'currency' },
          { key: 'stock_status', label: 'Status', type: 'string' },
          { key: 'inventory_value', label: 'Inventory Value', type: 'currency', aggregation: 'sum' },
        ],
        filters: {},
        chartType: 'table',
        refreshInterval: 60,
      },

      // Customer Reports
      {
        id: 'customer_analytics',
        name: 'Customer Analytics',
        description: 'Customer behavior and loyalty analysis',
        category: 'customer',
        query: `
          SELECT 
            c.full_name as customer_name,
            c.phone,
            c.customer_group,
            c.loyalty_points,
            COUNT(s.id) as total_orders,
            SUM(s.final_amount) as total_spent,
            AVG(s.final_amount) as avg_order_value,
            MAX(s.created_at) as last_order_date,
            MIN(s.created_at) as first_order_date,
            JULIANDAY('now') - JULIANDAY(MAX(s.created_at)) as days_since_last_order
          FROM customers c
          LEFT JOIN sales s ON c.id = s.customer_id AND s.sale_status = 'completed'
          WHERE c.deleted_at IS NULL
            AND s.created_at >= ? AND s.created_at <= ?
            {{STORE_FILTER}}
          GROUP BY c.id, c.full_name, c.phone, c.customer_group, c.loyalty_points
          HAVING total_orders > 0
          ORDER BY total_spent DESC
        `,
        columns: [
          { key: 'customer_name', label: 'Customer', type: 'string' },
          { key: 'phone', label: 'Phone', type: 'string' },
          { key: 'customer_group', label: 'Group', type: 'string' },
          { key: 'loyalty_points', label: 'Loyalty Points', type: 'number' },
          { key: 'total_orders', label: 'Total Orders', type: 'number', aggregation: 'sum' },
          { key: 'total_spent', label: 'Total Spent', type: 'currency', aggregation: 'sum' },
          { key: 'avg_order_value', label: 'Avg Order Value', type: 'currency', aggregation: 'avg' },
          { key: 'last_order_date', label: 'Last Order', type: 'date' },
          { key: 'days_since_last_order', label: 'Days Since Last Order', type: 'number' },
        ],
        filters: {},
        chartType: 'table',
        refreshInterval: 120,
      },

      // Financial Reports
      {
        id: 'financial_summary',
        name: 'Financial Summary',
        description: 'Revenue, expenses, and profit analysis',
        category: 'financial',
        query: `
          SELECT 
            DATE(date) as transaction_date,
            SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END) as total_income,
            SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) as total_expenses,
            SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE -amount END) as net_profit,
            COUNT(CASE WHEN transaction_type = 'income' THEN 1 END) as income_transactions,
            COUNT(CASE WHEN transaction_type = 'expense' THEN 1 END) as expense_transactions
          FROM financial_transactions
          WHERE date >= ? AND date <= ?
            {{STORE_FILTER}}
          GROUP BY DATE(date)
          ORDER BY transaction_date DESC
        `,
        columns: [
          { key: 'transaction_date', label: 'Date', type: 'date' },
          { key: 'total_income', label: 'Income', type: 'currency', aggregation: 'sum' },
          { key: 'total_expenses', label: 'Expenses', type: 'currency', aggregation: 'sum' },
          { key: 'net_profit', label: 'Net Profit', type: 'currency', aggregation: 'sum' },
          { key: 'income_transactions', label: 'Income Transactions', type: 'number', aggregation: 'sum' },
          { key: 'expense_transactions', label: 'Expense Transactions', type: 'number', aggregation: 'sum' },
        ],
        filters: {},
        chartType: 'area',
        refreshInterval: 30,
      },
    ];
  }

  /**
   * Get specific report definition
   */
  async getReportDefinition(reportId: string): Promise<ReportDefinition | null> {
    const definitions = await this.getReportDefinitions();
    return definitions.find(def => def.id === reportId) || null;
  }

  /**
   * Build SQL query with filters
   */
  private buildQuery(reportDef: ReportDefinition, filters: ReportFilter): { query: string; bindings: any[] } {
    let query = reportDef.query;
    const bindings: any[] = [];

    // Default date range (last 30 days if not specified)
    const dateFrom = filters.dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const dateTo = filters.dateTo || new Date().toISOString();
    
    bindings.push(dateFrom, dateTo);

    // Replace filter placeholders
    if (filters.storeId) {
      query = query.replace('{{STORE_FILTER}}', 'AND s.store_id = ?');
      bindings.push(filters.storeId);
    } else {
      query = query.replace('{{STORE_FILTER}}', '');
    }

    if (filters.categoryId) {
      query = query.replace('{{CATEGORY_FILTER}}', 'AND p.category_id = ?');
      bindings.push(filters.categoryId);
    } else {
      query = query.replace('{{CATEGORY_FILTER}}', '');
    }

    if (filters.customerId) {
      query = query.replace('{{CUSTOMER_FILTER}}', 'AND s.customer_id = ?');
      bindings.push(filters.customerId);
    } else {
      query = query.replace('{{CUSTOMER_FILTER}}', '');
    }

    // Clean up any remaining placeholders
    query = query.replace(/\{\{[^}]+\}\}/g, '');

    return { query, bindings };
  }

  /**
   * Calculate aggregations for report columns
   */
  private calculateAggregations(data: any[], columns: ReportColumn[]): Record<string, number> {
    const aggregations: Record<string, number> = {};

    columns.forEach(column => {
      if (column.aggregation && column.type === 'number' || column.type === 'currency') {
        const values = data.map(row => parseFloat(row[column.key]) || 0);
        
        switch (column.aggregation) {
          case 'sum':
            aggregations[column.key] = values.reduce((sum, val) => sum + val, 0);
            break;
          case 'avg':
            aggregations[column.key] = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
            break;
          case 'count':
            aggregations[column.key] = values.length;
            break;
          case 'min':
            aggregations[column.key] = Math.min(...values);
            break;
          case 'max':
            aggregations[column.key] = Math.max(...values);
            break;
        }
      }
    });

    return aggregations;
  }

  /**
   * Format report data based on column types
   */
  private formatReportData(data: any[], columns: ReportColumn[]): any[] {
    return data.map(row => {
      const formattedRow: any = {};
      
      columns.forEach(column => {
        const value = row[column.key];
        
        switch (column.type) {
          case 'currency':
            formattedRow[column.key] = {
              raw: value,
              formatted: this.formatCurrency(value),
            };
            break;
          case 'date':
            formattedRow[column.key] = {
              raw: value,
              formatted: this.formatDate(value),
            };
            break;
          case 'percentage':
            formattedRow[column.key] = {
              raw: value,
              formatted: `${(value * 100).toFixed(2)}%`,
            };
            break;
          default:
            formattedRow[column.key] = value;
        }
      });
      
      return formattedRow;
    });
  }

  /**
   * Format currency values
   */
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value || 0);
  }

  /**
   * Format date values
   */
  private formatDate(value: string): string {
    if (!value) return '';
    return new Date(value).toLocaleDateString('vi-VN');
  }

  /**
   * Export report to different formats
   */
  async exportReport(
    reportId: string,
    filters: ReportFilter,
    format: 'csv' | 'excel' | 'pdf'
  ): Promise<Buffer> {
    const report = await this.generateReport(reportId, filters);
    
    switch (format) {
      case 'csv':
        return this.exportToCSV(report);
      case 'excel':
        return this.exportToExcel(report);
      case 'pdf':
        return this.exportToPDF(report);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export to CSV format
   */
  private exportToCSV(report: ReportResult): Buffer {
    const reportDef = report.metadata;
    const headers = Object.keys(report.data[0] || {});
    const csvContent = [
      headers.join(','),
      ...report.data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'object' ? value.raw : value;
        }).join(',')
      )
    ].join('\n');
    
    return Buffer.from(csvContent, 'utf-8');
  }

  /**
   * Export to Excel format (simplified)
   */
  private exportToExcel(report: ReportResult): Buffer {
    // This would require a library like xlsx
    // For now, return CSV format
    return this.exportToCSV(report);
  }

  /**
   * Export to PDF format (simplified)
   */
  private exportToPDF(report: ReportResult): Buffer {
    // This would require a library like puppeteer or jsPDF
    // For now, return CSV format
    return this.exportToCSV(report);
  }
}