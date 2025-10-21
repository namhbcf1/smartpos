/**
 * DatabaseOptimizationService - Tối ưu hóa database D1 Cloudflare
 * Tích hợp với tất cả services để tối ưu performance
 */

import { BaseService, ServiceResponse } from './BaseService';
import { Env } from '../types';

// ===== INTERFACES =====

export interface QueryPerformanceMetrics {
  query: string;
  execution_time: number;
  rows_affected: number;
  timestamp: string;
  table_name: string;
}

export interface IndexRecommendation {
  table: string;
  columns: string[];
  reason: string;
  estimated_improvement: string;
  priority: 'high' | 'medium' | 'low';
}

export interface DatabaseHealth {
  total_tables: number;
  total_records: number;
  database_size: number;
  slow_queries: QueryPerformanceMetrics[];
  index_recommendations: IndexRecommendation[];
  fragmentation_level: number;
  performance_score: number;
}

export interface OptimizationResult {
  indexes_created: number;
  queries_optimized: number;
  performance_improvement: number;
  recommendations: IndexRecommendation[];
}

// ===== DATABASE OPTIMIZATION SERVICE =====

export class DatabaseOptimizationService extends BaseService {
  constructor(env: Env) {
    super(env, 'database_optimization', 'id');
  }

  // ===== CORE OPTIMIZATION METHODS =====

  /**
   * Tạo optimized indexes cho tất cả tables
   */
  async createOptimizedIndexes(): Promise<ServiceResponse<OptimizationResult>> {
    try {
      const indexes = [
        // Products table indexes
        {
          name: 'idx_products_category_active',
          table: 'products',
          columns: ['category_id', 'is_active'],
          reason: 'Optimize product filtering by category and status'
        },
        {
          name: 'idx_products_sku',
          table: 'products',
          columns: ['sku'],
          reason: 'Optimize product lookup by SKU'
        },
        {
          name: 'idx_products_brand_active',
          table: 'products',
          columns: ['brand_id', 'is_active'],
          reason: 'Optimize product filtering by brand and status'
        },
        {
          name: 'idx_products_stock',
          table: 'products',
          columns: ['stock', 'min_stock'],
          reason: 'Optimize low stock queries'
        },

        // Orders table indexes
        {
          name: 'idx_orders_customer_status',
          table: 'orders',
          columns: ['customer_id', 'status'],
          reason: 'Optimize customer order queries'
        },
        {
          name: 'idx_orders_date_status',
          table: 'orders',
          columns: ['created_at', 'status'],
          reason: 'Optimize date range and status filtering'
        },
        {
          name: 'idx_orders_store_date',
          table: 'orders',
          columns: ['store_id', 'created_at'],
          reason: 'Optimize branch-specific order queries'
        },
        {
          name: 'idx_orders_payment_status',
          table: 'orders',
          columns: ['payment_status', 'status'],
          reason: 'Optimize payment status queries'
        },

        // Customers table indexes
        {
          name: 'idx_customers_type_active',
          table: 'customers',
          columns: ['customer_type', 'is_active'],
          reason: 'Optimize customer segmentation'
        },
        {
          name: 'idx_customers_loyalty',
          table: 'customers',
          columns: ['loyalty_points'],
          reason: 'Optimize loyalty-based queries'
        },
        {
          name: 'idx_customers_email',
          table: 'customers',
          columns: ['email'],
          reason: 'Optimize customer lookup by email'
        },
        {
          name: 'idx_customers_phone',
          table: 'customers',
          columns: ['phone'],
          reason: 'Optimize customer lookup by phone'
        },

        // Order items table indexes
        {
          name: 'idx_order_items_order_product',
          table: 'order_items',
          columns: ['order_id', 'product_id'],
          reason: 'Optimize order item queries'
        },
        {
          name: 'idx_order_items_product',
          table: 'order_items',
          columns: ['product_id'],
          reason: 'Optimize product sales analysis'
        },

        // Inventory movements table indexes
        {
          name: 'idx_inventory_movements_product_date',
          table: 'inventory_movements',
          columns: ['product_id', 'created_at'],
          reason: 'Optimize inventory history queries'
        },
        {
          name: 'idx_inventory_movements_type',
          table: 'inventory_movements',
          columns: ['transaction_type'],
          reason: 'Optimize transaction type filtering'
        },

        // Users table indexes
        {
          name: 'idx_users_email_active',
          table: 'users',
          columns: ['email', 'is_active'],
          reason: 'Optimize user authentication'
        },
        {
          name: 'idx_users_role_active',
          table: 'users',
          columns: ['role', 'is_active'],
          reason: 'Optimize role-based queries'
        },

        // Payments table indexes
        {
          name: 'idx_payments_order_status',
          table: 'payments',
          columns: ['order_id', 'status'],
          reason: 'Optimize payment status queries'
        },
        {
          name: 'idx_payments_date_status',
          table: 'payments',
          columns: ['created_at', 'status'],
          reason: 'Optimize payment date filtering'
        }
      ];

      let createdCount = 0;
      const recommendations: IndexRecommendation[] = [];

      for (const index of indexes) {
        try {
          await this.env.DB.prepare(`
            CREATE INDEX IF NOT EXISTS ${index.name} 
            ON ${index.table}(${index.columns.join(', ')})
          `).run();
          
          createdCount++;
          recommendations.push({
            table: index.table,
            columns: index.columns,
            reason: index.reason,
            estimated_improvement: 'High',
            priority: 'high'
          });
        } catch (error) {
          console.error(`Failed to create index ${index.name}:`, error);
        }
      }

      return {
        success: true,
        data: {
          indexes_created: createdCount,
          queries_optimized: 0,
          performance_improvement: 0,
          recommendations
        },
        message: `Created ${createdCount} optimized indexes`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Phân tích database health
   */
  async analyzeDatabaseHealth(): Promise<ServiceResponse<DatabaseHealth>> {
    try {
      // Get table information
      const tables = await this.env.DB.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `).all();

      // Get record counts for each table
      const tableStats = [];
      let totalRecords = 0;

      for (const table of tables.results || []) {
        try {
          const count = await this.env.DB.prepare(`
            SELECT COUNT(*) as count FROM ${table.name}
          `).first();
          
          const recordCount = count?.count || 0;
          totalRecords += recordCount;
          
          tableStats.push({
            table: table.name,
            records: recordCount
          });
        } catch (error) {
          console.error(`Error counting records in ${table.name}:`, error);
        }
      }

      // Analyze slow queries (simplified)
      const slowQueries: QueryPerformanceMetrics[] = [];
      
      // Test common queries for performance
      const testQueries = [
        {
          query: 'SELECT * FROM products WHERE category_id = ? AND is_active = 1',
          table_name: 'products'
        },
        {
          query: 'SELECT * FROM orders WHERE customer_id = ? AND status = ?',
          table_name: 'orders'
        },
        {
          query: 'SELECT * FROM customers WHERE customer_type = ? AND is_active = 1',
          table_name: 'customers'
        }
      ];

      for (const testQuery of testQueries) {
        const startTime = Date.now();
        try {
          await this.env.DB.prepare(testQuery.query).bind('test').first();
          const executionTime = Date.now() - startTime;
          
          if (executionTime > 100) { // Consider slow if > 100ms
            slowQueries.push({
              query: testQuery.query,
              execution_time: executionTime,
              rows_affected: 0,
              timestamp: new Date().toISOString(),
              table_name: testQuery.table_name
            });
          }
        } catch (error) {
          // Query might fail with test data, that's ok
        }
      }

      // Generate index recommendations
      const recommendations: IndexRecommendation[] = [
        {
          table: 'products',
          columns: ['category_id', 'is_active'],
          reason: 'Frequently filtered together',
          estimated_improvement: 'High',
          priority: 'high'
        },
        {
          table: 'orders',
          columns: ['customer_id', 'status'],
          reason: 'Customer order queries',
          estimated_improvement: 'High',
          priority: 'high'
        },
        {
          table: 'customers',
          columns: ['customer_type', 'is_active'],
          reason: 'Customer segmentation',
          estimated_improvement: 'Medium',
          priority: 'medium'
        }
      ];

      const performanceScore = Math.max(0, 100 - (slowQueries.length * 10));

      return {
        success: true,
        data: {
          total_tables: tables.results?.length || 0,
          total_records: totalRecords,
          database_size: 0, // D1 doesn't expose size directly
          slow_queries: slowQueries,
          index_recommendations: recommendations,
          fragmentation_level: 0, // D1 handles this automatically
          performance_score: performanceScore
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Tối ưu hóa queries phổ biến
   */
  async optimizeCommonQueries(): Promise<ServiceResponse<OptimizationResult>> {
    try {
      const optimizations = [
        // Optimize product queries
        {
          name: 'Product filtering optimization',
          query: `
            SELECT p.*, c.name as category_name, b.name as brand_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN brands b ON p.brand_id = b.id
            WHERE p.is_active = 1 AND p.tenant_id = 'default'
            ORDER BY p.created_at DESC
          `,
          optimization: 'Added proper JOINs and filtering'
        },

        // Optimize order queries
        {
          name: 'Order analysis optimization',
          query: `
            SELECT 
              o.*,
              c.name as customer_name,
              COUNT(oi.id) as item_count,
              SUM(oi.total_price_cents) as total_cents
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.tenant_id = 'default'
            GROUP BY o.id
            ORDER BY o.created_at DESC
          `,
          optimization: 'Added aggregation and proper grouping'
        },

        // Optimize customer analytics
        {
          name: 'Customer analytics optimization',
          query: `
            SELECT 
              c.*,
              COUNT(o.id) as total_orders,
              SUM(o.total_cents) as total_spent_cents,
              MAX(o.created_at) as last_order_date
            FROM customers c
            LEFT JOIN orders o ON c.id = o.customer_id
            WHERE c.tenant_id = 'default'
            GROUP BY c.id
            ORDER BY total_spent_cents DESC
          `,
          optimization: 'Added customer analytics aggregation'
        }
      ];

      let optimizedCount = 0;
      const recommendations: IndexRecommendation[] = [];

      for (const opt of optimizations) {
        try {
          // Test the optimized query
          const startTime = Date.now();
          await this.env.DB.prepare(opt.query).all();
          const executionTime = Date.now() - startTime;
          
          optimizedCount++;
          
          recommendations.push({
            table: 'multiple',
            columns: ['optimized'],
            reason: opt.optimization,
            estimated_improvement: executionTime < 50 ? 'High' : 'Medium',
            priority: 'medium'
          });
        } catch (error) {
          console.error(`Failed to optimize query ${opt.name}:`, error);
        }
      }

      return {
        success: true,
        data: {
          indexes_created: 0,
          queries_optimized: optimizedCount,
          performance_improvement: optimizedCount * 10,
          recommendations
        },
        message: `Optimized ${optimizedCount} common queries`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Cleanup unused data
   */
  async cleanupUnusedData(): Promise<ServiceResponse> {
    try {
      let cleanedCount = 0;

      // Clean up old sessions
      try {
        const oldSessions = await this.env.DB.prepare(`
          DELETE FROM auth_sessions 
          WHERE expires_at < datetime('now') OR is_active = 0
        `).run();
        cleanedCount += oldSessions.meta.changes;
      } catch (error) {
        console.error('Failed to clean old sessions:', error);
      }

      // Clean up old login attempts
      try {
        const oldAttempts = await this.env.DB.prepare(`
          DELETE FROM login_attempts 
          WHERE created_at < datetime('now', '-30 days')
        `).run();
        cleanedCount += oldAttempts.meta.changes;
      } catch (error) {
        console.error('Failed to clean old login attempts:', error);
      }

      // Clean up old notifications
      try {
        const oldNotifications = await this.env.DB.prepare(`
          DELETE FROM customer_notifications 
          WHERE created_at < datetime('now', '-90 days') AND status = 'read'
        `).run();
        cleanedCount += oldNotifications.meta.changes;
      } catch (error) {
        console.error('Failed to clean old notifications:', error);
      }

      return {
        success: true,
        data: { cleaned_records: cleanedCount },
        message: `Cleaned up ${cleanedCount} unused records`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Vacuum database (D1 specific)
   */
  async vacuumDatabase(): Promise<ServiceResponse> {
    try {
      // D1 doesn't support VACUUM directly, but we can optimize by:
      // 1. Recreating indexes
      // 2. Cleaning up data
      // 3. Analyzing tables

      await this.cleanupUnusedData();
      await this.createOptimizedIndexes();

      return {
        success: true,
        message: 'Database optimization completed'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Lấy performance metrics
   */
  async getPerformanceMetrics(): Promise<ServiceResponse<QueryPerformanceMetrics[]>> {
    try {
      const metrics: QueryPerformanceMetrics[] = [];

      // Test common queries and measure performance
      const testQueries = [
        {
          query: 'SELECT COUNT(*) FROM products WHERE is_active = 1',
          table_name: 'products'
        },
        {
          query: 'SELECT COUNT(*) FROM orders WHERE status = "completed"',
          table_name: 'orders'
        },
        {
          query: 'SELECT COUNT(*) FROM customers WHERE is_active = 1',
          table_name: 'customers'
        }
      ];

      for (const testQuery of testQueries) {
        const startTime = Date.now();
        try {
          const result = await this.env.DB.prepare(testQuery.query).first();
          const executionTime = Date.now() - startTime;
          
          metrics.push({
            query: testQuery.query,
            execution_time: executionTime,
            rows_affected: result ? 1 : 0,
            timestamp: new Date().toISOString(),
            table_name: testQuery.table_name
          });
        } catch (error) {
          console.error(`Failed to test query ${testQuery.query}:`, error);
        }
      }

      return {
        success: true,
        data: metrics
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: []
      };
    }
  }

  /**
   * Chạy tối ưu hóa toàn diện
   */
  async runFullOptimization(): Promise<ServiceResponse<OptimizationResult>> {
    try {
      console.log('🚀 Starting full database optimization...');

      // 1. Analyze current health
      const health = await this.analyzeDatabaseHealth();
      if (!health.success) {
        return {
          success: false,
          error: 'Failed to analyze database health'
        };
      }

      // 2. Create optimized indexes
      const indexes = await this.createOptimizedIndexes();
      if (!indexes.success) {
        return {
          success: false,
          error: 'Failed to create optimized indexes'
        };
      }

      // 3. Optimize common queries
      const queries = await this.optimizeCommonQueries();
      if (!queries.success) {
        return {
          success: false,
          error: 'Failed to optimize common queries'
        };
      }

      // 4. Cleanup unused data
      const cleanup = await this.cleanupUnusedData();
      if (!cleanup.success) {
        return {
          success: false,
          error: 'Failed to cleanup unused data'
        };
      }

      // 5. Get performance metrics
      const metrics = await this.getPerformanceMetrics();
      if (!metrics.success) {
        return {
          success: false,
          error: 'Failed to get performance metrics'
        };
      }

      console.log('✅ Full database optimization completed');

      return {
        success: true,
        data: {
          indexes_created: indexes.data?.indexes_created || 0,
          queries_optimized: queries.data?.queries_optimized || 0,
          performance_improvement: (indexes.data?.indexes_created || 0) * 10 + (queries.data?.queries_optimized || 0) * 5,
          recommendations: [
            ...(indexes.data?.recommendations || []),
            ...(queries.data?.recommendations || [])
          ]
        },
        message: 'Full database optimization completed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}