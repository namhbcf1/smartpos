/**
 * Database Optimization API Service
 * Handles all database optimization and health monitoring API calls
 * Rules.md compliant - uses only real Cloudflare D1 data
 */

import apiService from './api';
import { API_ENDPOINTS } from '../config/constants';
import {
  DatabaseHealth,
  DatabasePerformanceMetrics,
  ApiResponse
} from '../types/api';

export interface CleanupOptions {
  keep_sales_days?: number;
  keep_activities_days?: number;
  keep_notifications_days?: number;
}

export interface QueryExplainRequest {
  query: string;
}

export interface QueryExplainResult {
  query: string;
  execution_plan: Array<{
    step: number;
    operation: string;
    table: string;
    index_used?: string;
    rows_examined: number;
    cost: number;
  }>;
  performance_analysis: {
    estimated_execution_time: number;
    complexity_score: number;
    optimization_suggestions: string[];
  };
  recommendations: Array<{
    type: 'index' | 'query_rewrite' | 'table_structure';
    description: string;
    impact: 'low' | 'medium' | 'high';
    implementation: string;
  }>;
}

export interface OptimizationReport {
  overall_score: number;
  performance_improvements: Array<{
    area: string;
    current_score: number;
    potential_score: number;
    improvement_percentage: number;
    actions_required: string[];
  }>;
  critical_issues: Array<{
    issue: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    solution: string;
    estimated_impact: string;
  }>;
  maintenance_schedule: Array<{
    task: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    last_performed?: string;
    next_due: string;
    priority: 'low' | 'medium' | 'high';
  }>;
}

export interface CleanupResult {
  tables_cleaned: Array<{
    table_name: string;
    rows_deleted: number;
    space_freed_mb: number;
  }>;
  total_rows_deleted: number;
  total_space_freed_mb: number;
  cleanup_duration_ms: number;
  next_recommended_cleanup: string;
}

export interface IndexCreationResult {
  indexes_created: Array<{
    table_name: string;
    index_name: string;
    columns: string[];
    type: 'btree' | 'hash' | 'unique';
    estimated_performance_gain: string;
  }>;
  total_indexes_created: number;
  estimated_query_improvement: string;
  storage_overhead_mb: number;
}

export interface DatabaseBackupInfo {
  backup_id: string;
  created_at: string;
  size_mb: number;
  tables_included: string[];
  backup_type: 'full' | 'incremental';
  status: 'completed' | 'in_progress' | 'failed';
  retention_until: string;
}

class DatabaseOptimizationApiService {
  /**
   * Get database health metrics
   */
  async getDatabaseHealth(): Promise<DatabaseHealth> {
    return apiService.get<DatabaseHealth>(API_ENDPOINTS.DATABASE_OPTIMIZATION.HEALTH);
  }

  /**
   * Get database performance metrics
   */
  async getPerformanceMetrics(): Promise<DatabasePerformanceMetrics> {
    return apiService.get<DatabasePerformanceMetrics>(API_ENDPOINTS.DATABASE_OPTIMIZATION.PERFORMANCE);
  }

  /**
   * Perform database cleanup
   */
  async performCleanup(options?: CleanupOptions): Promise<CleanupResult> {
    return apiService.post<CleanupResult>(API_ENDPOINTS.DATABASE_OPTIMIZATION.CLEANUP, options || {});
  }

  /**
   * Create optimized database indexes
   */
  async createOptimizedIndexes(): Promise<IndexCreationResult> {
    return apiService.post<IndexCreationResult>(API_ENDPOINTS.DATABASE_OPTIMIZATION.INDEXES);
  }

  /**
   * Analyze database performance
   */
  async analyzeDatabase(): Promise<OptimizationReport> {
    return apiService.post<OptimizationReport>(API_ENDPOINTS.DATABASE_OPTIMIZATION.ANALYZE);
  }

  /**
   * Explain query execution plan
   */
  async explainQuery(queryData: QueryExplainRequest): Promise<QueryExplainResult> {
    return apiService.post<QueryExplainResult>(API_ENDPOINTS.DATABASE_OPTIMIZATION.EXPLAIN, queryData);
  }

  /**
   * Get database size and usage statistics
   */
  async getDatabaseStats(): Promise<{
    total_size_mb: number;
    table_sizes: Array<{
      table_name: string;
      size_mb: number;
      row_count: number;
      last_updated: string;
    }>;
    index_sizes: Array<{
      table_name: string;
      index_name: string;
      size_mb: number;
      usage_frequency: number;
    }>;
    growth_trend: Array<{
      date: string;
      size_mb: number;
      growth_rate: number;
    }>;
  }> {
    return apiService.get<{
      total_size_mb: number;
      table_sizes: Array<{
        table_name: string;
        size_mb: number;
        row_count: number;
        last_updated: string;
      }>;
      index_sizes: Array<{
        table_name: string;
        index_name: string;
        size_mb: number;
        usage_frequency: number;
      }>;
      growth_trend: Array<{
        date: string;
        size_mb: number;
        growth_rate: number;
      }>;
    }>(`${API_ENDPOINTS.DATABASE_OPTIMIZATION.HEALTH}/stats`);
  }

  /**
   * Get slow query analysis
   */
  async getSlowQueries(): Promise<Array<{
    query: string;
    execution_time_ms: number;
    frequency: number;
    last_executed: string;
    optimization_suggestions: string[];
  }>> {
    return apiService.get<Array<{
      query: string;
      execution_time_ms: number;
      frequency: number;
      last_executed: string;
      optimization_suggestions: string[];
    }>>(`${API_ENDPOINTS.DATABASE_OPTIMIZATION.PERFORMANCE}/slow-queries`);
  }

  /**
   * Get database connection pool status
   */
  async getConnectionPoolStatus(): Promise<{
    active_connections: number;
    idle_connections: number;
    max_connections: number;
    connection_utilization: number;
    average_connection_time: number;
    failed_connections: number;
  }> {
    return apiService.get<{
      active_connections: number;
      idle_connections: number;
      max_connections: number;
      connection_utilization: number;
      average_connection_time: number;
      failed_connections: number;
    }>(`${API_ENDPOINTS.DATABASE_OPTIMIZATION.PERFORMANCE}/connections`);
  }

  /**
   * Schedule database maintenance
   */
  async scheduleMaintenanceTask(task: {
    type: 'cleanup' | 'analyze' | 'reindex' | 'backup';
    schedule: string; // cron expression
    options?: any;
  }): Promise<{
    task_id: string;
    scheduled_for: string;
    estimated_duration: string;
  }> {
    return apiService.post<{
      task_id: string;
      scheduled_for: string;
      estimated_duration: string;
    }>(`${API_ENDPOINTS.DATABASE_OPTIMIZATION.HEALTH}/schedule-maintenance`, task);
  }

  /**
   * Get maintenance history
   */
  async getMaintenanceHistory(): Promise<Array<{
    task_id: string;
    type: string;
    started_at: string;
    completed_at?: string;
    status: 'completed' | 'failed' | 'in_progress';
    duration_ms?: number;
    results?: any;
    error_message?: string;
  }>> {
    return apiService.get<Array<{
      task_id: string;
      type: string;
      started_at: string;
      completed_at?: string;
      status: 'completed' | 'failed' | 'in_progress';
      duration_ms?: number;
      results?: any;
      error_message?: string;
    }>>(`${API_ENDPOINTS.DATABASE_OPTIMIZATION.HEALTH}/maintenance-history`);
  }

  /**
   * Create database backup
   */
  async createBackup(options?: {
    type?: 'full' | 'incremental';
    tables?: string[];
    compression?: boolean;
  }): Promise<DatabaseBackupInfo> {
    return apiService.post<DatabaseBackupInfo>(`${API_ENDPOINTS.DATABASE_OPTIMIZATION.HEALTH}/backup`, options || {});
  }

  /**
   * Get backup history
   */
  async getBackupHistory(): Promise<DatabaseBackupInfo[]> {
    return apiService.get<DatabaseBackupInfo[]>(`${API_ENDPOINTS.DATABASE_OPTIMIZATION.HEALTH}/backups`);
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupId: string): Promise<{
    restore_id: string;
    status: 'started' | 'completed' | 'failed';
    estimated_duration?: string;
    progress_percentage?: number;
  }> {
    return apiService.post<{
      restore_id: string;
      status: 'started' | 'completed' | 'failed';
      estimated_duration?: string;
      progress_percentage?: number;
    }>(`${API_ENDPOINTS.DATABASE_OPTIMIZATION.HEALTH}/restore/${backupId}`);
  }
}

export const databaseOptimizationApi = new DatabaseOptimizationApiService();
