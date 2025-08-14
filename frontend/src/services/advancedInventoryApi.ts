/**
 * Advanced Inventory API Service
 * Handles all advanced inventory management API calls
 * Rules.md compliant - uses only real Cloudflare D1 data
 */

import apiService from './api';
import { API_ENDPOINTS } from '../config/constants';
import {
  InventoryItem,
  InventoryStats,
  InventoryAlert,
  StockMovement,
  ApiResponse,
  PaginatedResponse
} from '../types/api';

export interface InventoryOverview {
  items: InventoryItem[];
  stats: InventoryStats;
  alerts: InventoryAlert[];
}

export interface StockMovementRequest {
  product_id: number;
  movement_type: 'in' | 'out' | 'adjustment' | 'transfer' | 'reserved' | 'released';
  quantity: number;
  reference_type?: string;
  reference_id?: number;
  notes?: string;
}

export interface InventoryFilters {
  search?: string;
  category_id?: number;
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock';
  location?: string;
  supplier_id?: number;
  page?: number;
  limit?: number;
}

export interface MovementFilters {
  product_id?: number;
  movement_type?: string;
  start_date?: string;
  end_date?: string;
  created_by?: number;
  page?: number;
  limit?: number;
}

export interface InventoryForecast {
  product_id: number;
  product_name: string;
  current_stock: number;
  predicted_demand: number;
  recommended_order_quantity: number;
  reorder_date: string;
  confidence_level: number;
  factors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
}

export interface InventoryOptimization {
  total_value_reduction: number;
  storage_cost_savings: number;
  recommendations: Array<{
    product_id: number;
    product_name: string;
    current_stock: number;
    optimal_stock: number;
    action: 'reduce' | 'increase' | 'maintain';
    potential_savings: number;
    priority: 'low' | 'medium' | 'high';
  }>;
}

export interface InventoryValuation {
  total_value: number;
  valuation_method: 'fifo' | 'lifo' | 'average_cost';
  by_category: Array<{
    category_id: number;
    category_name: string;
    total_value: number;
    item_count: number;
    percentage: number;
  }>;
  by_location: Array<{
    location: string;
    total_value: number;
    item_count: number;
    percentage: number;
  }>;
  aging_analysis: Array<{
    age_range: string;
    total_value: number;
    item_count: number;
    percentage: number;
  }>;
}

export interface TurnoverAnalysis {
  overall_turnover_rate: number;
  by_product: Array<{
    product_id: number;
    product_name: string;
    turnover_rate: number;
    days_of_supply: number;
    classification: 'fast' | 'medium' | 'slow' | 'dead';
  }>;
  by_category: Array<{
    category_id: number;
    category_name: string;
    turnover_rate: number;
    total_value: number;
  }>;
  recommendations: Array<{
    product_id: number;
    product_name: string;
    current_stock: number;
    recommended_action: string;
    potential_impact: string;
  }>;
}

class AdvancedInventoryApiService {
  /**
   * Get comprehensive inventory overview
   */
  async getInventoryOverview(): Promise<InventoryOverview> {
    return apiService.get<InventoryOverview>(API_ENDPOINTS.INVENTORY_ADVANCED.OVERVIEW);
  }

  /**
   * Get inventory items with advanced filtering
   */
  async getInventoryItems(filters?: InventoryFilters): Promise<PaginatedResponse<InventoryItem>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    
    const url = `${API_ENDPOINTS.INVENTORY_ADVANCED.ITEMS}${params.toString() ? `?${params}` : ''}`;
    return apiService.get<PaginatedResponse<InventoryItem>>(url);
  }

  /**
   * Get inventory statistics
   */
  async getInventoryStats(): Promise<InventoryStats> {
    return apiService.get<InventoryStats>(API_ENDPOINTS.INVENTORY_ADVANCED.STATS);
  }

  /**
   * Get inventory alerts
   */
  async getInventoryAlerts(): Promise<InventoryAlert[]> {
    return apiService.get<InventoryAlert[]>(API_ENDPOINTS.INVENTORY_ADVANCED.ALERTS);
  }

  /**
   * Record stock movement
   */
  async recordStockMovement(movement: StockMovementRequest): Promise<StockMovement> {
    return apiService.post<StockMovement>(API_ENDPOINTS.INVENTORY_ADVANCED.MOVEMENT, movement);
  }

  /**
   * Get stock movements with filtering
   */
  async getStockMovements(filters?: MovementFilters): Promise<PaginatedResponse<StockMovement>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    
    const url = `${API_ENDPOINTS.INVENTORY_ADVANCED.MOVEMENTS}${params.toString() ? `?${params}` : ''}`;
    return apiService.get<PaginatedResponse<StockMovement>>(url);
  }

  /**
   * Get inventory forecasting data
   */
  async getInventoryForecasting(productIds?: number[]): Promise<InventoryForecast[]> {
    const params = new URLSearchParams();
    if (productIds && productIds.length > 0) {
      params.append('product_ids', productIds.join(','));
    }
    
    const url = `${API_ENDPOINTS.INVENTORY_ADVANCED.FORECASTING}${params.toString() ? `?${params}` : ''}`;
    return apiService.get<InventoryForecast[]>(url);
  }

  /**
   * Get inventory optimization recommendations
   */
  async getInventoryOptimization(): Promise<InventoryOptimization> {
    return apiService.get<InventoryOptimization>(API_ENDPOINTS.INVENTORY_ADVANCED.OPTIMIZATION);
  }

  /**
   * Get inventory valuation analysis
   */
  async getInventoryValuation(method?: 'fifo' | 'lifo' | 'average_cost'): Promise<InventoryValuation> {
    const params = new URLSearchParams();
    if (method) {
      params.append('method', method);
    }
    
    const url = `${API_ENDPOINTS.INVENTORY_ADVANCED.VALUATION}${params.toString() ? `?${params}` : ''}`;
    return apiService.get<InventoryValuation>(url);
  }

  /**
   * Get inventory turnover analysis
   */
  async getTurnoverAnalysis(): Promise<TurnoverAnalysis> {
    return apiService.get<TurnoverAnalysis>(API_ENDPOINTS.INVENTORY_ADVANCED.TURNOVER);
  }

  /**
   * Acknowledge inventory alert
   */
  async acknowledgeAlert(alertId: number): Promise<void> {
    return apiService.post<void>(`${API_ENDPOINTS.INVENTORY_ADVANCED.ALERTS}/${alertId}/acknowledge`);
  }

  /**
   * Bulk acknowledge alerts
   */
  async bulkAcknowledgeAlerts(alertIds: number[]): Promise<void> {
    return apiService.post<void>(`${API_ENDPOINTS.INVENTORY_ADVANCED.ALERTS}/bulk-acknowledge`, {
      alert_ids: alertIds
    });
  }
}

export const advancedInventoryApi = new AdvancedInventoryApiService();
