/**
 * Advanced Analytics API Service
 * Handles all advanced analytics and reporting API calls
 * Rules.md compliant - uses only real Cloudflare D1 data
 */

import apiService from './api';
import { API_ENDPOINTS } from '../config/constants';
import { AdvancedDashboardData, ApiResponse } from '../types/api';

export interface AnalyticsPeriod {
  period: 'today' | 'week' | 'month' | 'quarter' | 'year';
}

export interface DateRangeFilter {
  start_date: string;
  end_date: string;
}

export interface SalesAnalytics {
  total_revenue: number;
  total_transactions: number;
  average_order_value: number;
  growth_rate: number;
  hourly_breakdown: Array<{
    hour: number;
    sales: number;
    transactions: number;
    average_value: number;
  }>;
  daily_trends: Array<{
    date: string;
    sales: number;
    transactions: number;
    growth_rate: number;
  }>;
  payment_method_breakdown: Array<{
    method: string;
    amount: number;
    transaction_count: number;
    percentage: number;
  }>;
  top_performing_staff: Array<{
    user_id: number;
    user_name: string;
    sales_count: number;
    sales_amount: number;
    commission: number;
  }>;
}

export interface ProductAnalytics {
  top_selling_products: Array<{
    product_id: number;
    product_name: string;
    quantity_sold: number;
    revenue: number;
    profit: number;
    growth_rate: number;
  }>;
  category_performance: Array<{
    category_id: number;
    category_name: string;
    revenue: number;
    quantity_sold: number;
    profit_margin: number;
    growth_rate: number;
  }>;
  product_profitability: Array<{
    product_id: number;
    product_name: string;
    cost: number;
    revenue: number;
    profit: number;
    margin_percentage: number;
  }>;
  slow_moving_products: Array<{
    product_id: number;
    product_name: string;
    days_since_last_sale: number;
    current_stock: number;
    estimated_value: number;
  }>;
}

export interface CustomerAnalytics {
  total_customers: number;
  new_customers: number;
  returning_customers: number;
  customer_retention_rate: number;
  average_customer_lifetime_value: number;
  customer_segments: Array<{
    segment: string;
    customer_count: number;
    total_revenue: number;
    average_order_value: number;
    frequency: number;
  }>;
  top_customers: Array<{
    customer_id: number;
    customer_name: string;
    total_spent: number;
    order_count: number;
    last_purchase: string;
    loyalty_tier: string;
  }>;
  geographic_distribution: Array<{
    region: string;
    customer_count: number;
    revenue: number;
    percentage: number;
  }>;
}

export interface FinancialAnalytics {
  revenue: {
    gross_revenue: number;
    net_revenue: number;
    recurring_revenue: number;
    growth_rate: number;
  };
  costs: {
    cost_of_goods_sold: number;
    operating_expenses: number;
    total_costs: number;
  };
  profitability: {
    gross_profit: number;
    net_profit: number;
    gross_margin: number;
    net_margin: number;
  };
  cash_flow: {
    operating_cash_flow: number;
    free_cash_flow: number;
    cash_conversion_cycle: number;
  };
  financial_ratios: {
    current_ratio: number;
    quick_ratio: number;
    debt_to_equity: number;
    return_on_assets: number;
    return_on_equity: number;
  };
}

export interface PerformanceMetrics {
  operational: {
    sales_per_hour: number;
    transactions_per_hour: number;
    average_transaction_time: number;
    conversion_rate: number;
    cart_abandonment_rate: number;
  };
  staff: {
    productivity_score: number;
    sales_per_employee: number;
    customer_satisfaction: number;
    training_completion_rate: number;
  };
  inventory: {
    turnover_rate: number;
    stockout_rate: number;
    carrying_cost_ratio: number;
    obsolescence_rate: number;
  };
  customer: {
    acquisition_cost: number;
    lifetime_value: number;
    satisfaction_score: number;
    retention_rate: number;
  };
}

export interface TrendAnalysis {
  sales_trends: Array<{
    period: string;
    value: number;
    change_percentage: number;
    trend_direction: 'up' | 'down' | 'stable';
  }>;
  seasonal_patterns: Array<{
    season: string;
    average_sales: number;
    peak_months: string[];
    growth_opportunity: number;
  }>;
  market_insights: Array<{
    insight: string;
    impact: 'high' | 'medium' | 'low';
    recommendation: string;
    confidence: number;
  }>;
}

export interface ForecastingData {
  sales_forecast: Array<{
    period: string;
    predicted_sales: number;
    confidence_interval: {
      lower: number;
      upper: number;
    };
    factors: string[];
  }>;
  demand_forecast: Array<{
    product_id: number;
    product_name: string;
    predicted_demand: number;
    confidence_level: number;
    recommended_stock: number;
  }>;
  revenue_projection: {
    next_month: number;
    next_quarter: number;
    next_year: number;
    growth_assumptions: string[];
  };
}

class AdvancedAnalyticsApiService {
  /**
   * Get comprehensive dashboard analytics
   */
  async getDashboardAnalytics(): Promise<AdvancedDashboardData> {
    return apiService.get<AdvancedDashboardData>(API_ENDPOINTS.ANALYTICS_ADVANCED.DASHBOARD);
  }

  /**
   * Get sales analytics with optional period filter
   */
  async getSalesAnalytics(filter?: AnalyticsPeriod | DateRangeFilter): Promise<SalesAnalytics> {
    const params = new URLSearchParams();
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        params.append(key, value.toString());
      });
    }
    
    const url = `${API_ENDPOINTS.ANALYTICS_ADVANCED.SALES_ANALYTICS}${params.toString() ? `?${params}` : ''}`;
    return apiService.get<SalesAnalytics>(url);
  }

  /**
   * Get product analytics
   */
  async getProductAnalytics(filter?: AnalyticsPeriod | DateRangeFilter): Promise<ProductAnalytics> {
    const params = new URLSearchParams();
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        params.append(key, value.toString());
      });
    }
    
    const url = `${API_ENDPOINTS.ANALYTICS_ADVANCED.PRODUCT_ANALYTICS}${params.toString() ? `?${params}` : ''}`;
    return apiService.get<ProductAnalytics>(url);
  }

  /**
   * Get customer analytics
   */
  async getCustomerAnalytics(filter?: AnalyticsPeriod | DateRangeFilter): Promise<CustomerAnalytics> {
    const params = new URLSearchParams();
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        params.append(key, value.toString());
      });
    }
    
    const url = `${API_ENDPOINTS.ANALYTICS_ADVANCED.CUSTOMER_ANALYTICS}${params.toString() ? `?${params}` : ''}`;
    return apiService.get<CustomerAnalytics>(url);
  }

  /**
   * Get financial analytics
   */
  async getFinancialAnalytics(filter?: AnalyticsPeriod | DateRangeFilter): Promise<FinancialAnalytics> {
    const params = new URLSearchParams();
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        params.append(key, value.toString());
      });
    }
    
    const url = `${API_ENDPOINTS.ANALYTICS_ADVANCED.FINANCIAL_ANALYTICS}${params.toString() ? `?${params}` : ''}`;
    return apiService.get<FinancialAnalytics>(url);
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    return apiService.get<PerformanceMetrics>(API_ENDPOINTS.ANALYTICS_ADVANCED.PERFORMANCE_METRICS);
  }

  /**
   * Get trend analysis
   */
  async getTrendAnalysis(filter?: AnalyticsPeriod | DateRangeFilter): Promise<TrendAnalysis> {
    const params = new URLSearchParams();
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        params.append(key, value.toString());
      });
    }
    
    const url = `${API_ENDPOINTS.ANALYTICS_ADVANCED.TRENDS}${params.toString() ? `?${params}` : ''}`;
    return apiService.get<TrendAnalysis>(url);
  }

  /**
   * Get forecasting data
   */
  async getForecastingData(filter?: AnalyticsPeriod): Promise<ForecastingData> {
    const params = new URLSearchParams();
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        params.append(key, value.toString());
      });
    }
    
    const url = `${API_ENDPOINTS.ANALYTICS_ADVANCED.FORECASTING}${params.toString() ? `?${params}` : ''}`;
    return apiService.get<ForecastingData>(url);
  }

  /**
   * Generate custom report
   */
  async generateReport(reportConfig: {
    type: 'sales' | 'inventory' | 'financial' | 'customer';
    period: AnalyticsPeriod | DateRangeFilter;
    metrics: string[];
    format: 'json' | 'csv' | 'pdf';
  }): Promise<any> {
    return apiService.post<any>(API_ENDPOINTS.ANALYTICS_ADVANCED.REPORTS, reportConfig);
  }
}

export const advancedAnalyticsApi = new AdvancedAnalyticsApiService();
