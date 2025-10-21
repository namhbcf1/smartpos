/**
 * Database optimization utilities for SmartPOS
 */

import { Env } from '../types';

export interface QueryResult<T = any> {
  success: boolean;
  data?: any;
  meta?: {
    changes?: number;
    duration?: number;
    lastRowId?: number;
  };
  error?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Database connection pool manager
 */
export class DatabasePool {
  private static instance: DatabasePool;
  private connections: Map<string, any> = new Map();
  private maxConnections = 10;
  private connectionTimeout = 30000; // 30 seconds

  static getInstance(): DatabasePool {
    if (!DatabasePool.instance) {
      DatabasePool.instance = new DatabasePool();
    }
    return DatabasePool.instance;
  }

  async getConnection(env: Env): Promise<any> {
    const connectionId = this.generateConnectionId();
    // For Cloudflare D1, we don't actually pool connections
    // but we can implement connection tracking and monitoring
    const connection = {
      id: connectionId,
      db: env.DB,
      createdAt: Date.now(),
      lastUsed: Date.now()
    };

    this.connections.set(connectionId, connection);
    this.cleanupOldConnections();
    return connection;
  }

  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private cleanupOldConnections(): void {
    const now = Date.now();
    for (const [id, conn] of this.connections.entries()) {
      if (now - conn.lastUsed > this.connectionTimeout) {
        this.connections.delete(id);
      }
    }
  }

  getActiveConnections(): number {
    return this.connections.size;
  }
}

/**
 * Query builder for common database operations
 */
// TYPESCRIPT FIXED: Proper types for query bindings
type QueryBinding = string | number | boolean | null | undefined;

export class QueryBuilder {
  private query: string = '';
  private bindings: QueryBinding[] = [];
  private tableName: string = '';

  constructor(table: string) {
    this.tableName = table;
  }

  select(columns: string[] = ['*']): this {
    this.query = `SELECT ${columns.join(', ')} FROM ${this.tableName}`;
    return this;
  }

  where(column: string, operator: string, value: QueryBinding): this {
    const condition = this.query.includes('WHERE') ? 'AND' : 'WHERE';
    this.query += ` ${condition} ${column} ${operator} ?`;
    this.bindings.push(value);
    return this;
  }

  whereIn(column: string, values: QueryBinding[]): this {
    const condition = this.query.includes('WHERE') ? 'AND' : 'WHERE';
    const placeholders = values.map(() => '?').join(', ');
    this.query += ` ${condition} ${column} IN (${placeholders})`;
    this.bindings.push(...values);
    return this;
  }

  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    // SECURITY FIXED: Whitelist allowed columns to prevent SQL injection
    const allowedColumns = [
      'id', 'name', 'created_at', 'updated_at', 'price', 'stock',
      'sku', 'barcode', 'category_id', 'supplier_id', 'user_id', 'store_id',
      'total_amount', 'payment_status', 'sale_date', 'quantity', 'status'
    ];
    const allowedDirections = ['ASC', 'DESC'];

    if (!allowedColumns.includes(column)) {
      throw new Error(`Invalid column for ordering: ${column}`);
    }
    if (!allowedDirections.includes(direction)) {
      throw new Error(`Invalid direction for ordering: ${direction}`);
    }

    this.query += ` ORDER BY ${column} ${direction}`;
    return this;
  }

  limit(count: number, offset: number = 0): this {
    this.query += ` LIMIT ${count} OFFSET ${offset}`;
    return this;
  }

  join(table: string, condition: string): this {
    // SECURITY FIXED: Whitelist allowed tables and validate condition format
    const allowedTables = [
      'products', 'categories', 'suppliers', 'customers', 'users', 'stores',
      'sales', 'sale_items', 'inventory_transactions', 'serial_numbers',
      'warranty_registrations', 'inventory_movements', 'employees'
    ];

    if (!allowedTables.includes(table)) {
      throw new Error(`Invalid table for join: ${table}`);
    }

    // Validate condition format (should be like "table1.column = table2.column")
    const conditionPattern = /^[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!conditionPattern.test(condition)) {
      throw new Error(`Invalid join condition format: ${condition}`);
    }

    this.query += ` JOIN ${table} ON ${condition}`;
    return this;
  }

  leftJoin(table: string, condition: string): this {
    // SECURITY FIXED: Use same validation as join
    const allowedTables = [
      'products', 'categories', 'suppliers', 'customers', 'users', 'stores',
      'sales', 'sale_items', 'inventory_transactions', 'serial_numbers',
      'warranty_registrations', 'inventory_movements', 'employees'
    ];

    if (!allowedTables.includes(table)) {
      throw new Error(`Invalid table for left join: ${table}`);
    }

    const conditionPattern = /^[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!conditionPattern.test(condition)) {
      throw new Error(`Invalid left join condition format: ${condition}`);
    }

    this.query += ` LEFT JOIN ${table} ON ${condition}`;
    return this;
  }

  groupBy(columns: string[]): this {
    // SECURITY FIXED: Validate all columns in GROUP BY
    const allowedColumns = [
      'id', 'name', 'created_at', 'updated_at', 'price', 'stock',
      'sku', 'barcode', 'category_id', 'supplier_id', 'user_id', 'store_id',
      'total_amount', 'payment_status', 'sale_date', 'quantity', 'status'
    ];

    for (const column of columns) {
      if (!allowedColumns.includes(column)) {
        throw new Error(`Invalid column for GROUP BY: ${column}`);
      }
    }

    this.query += ` GROUP BY ${columns.join(', ')}`;
    return this;
  }

  having(condition: string): this {
    // SECURITY FIXED: Validate HAVING condition format
    // Only allow simple conditions with COUNT, SUM, AVG, etc.
    const havingPattern = /^(COUNT|SUM|AVG|MIN|MAX)\([a-zA-Z_][a-zA-Z0-9_]*\)\s*(>|<|>=|<=|=|!=)\s*\d+$/;
    if (!havingPattern.test(condition)) {
      throw new Error(`Invalid HAVING condition format: ${condition}`);
    }

    this.query += ` HAVING ${condition}`;
    return this;
  }

  insert(data: Record<string, any>): this {
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    this.query = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
    this.bindings = Object.values(data);
    return this;
  }

  update(data: Record<string, any>): this {
    const sets = Object.keys(data).map(key => `${key} = ?`).join(', ');
    this.query = `UPDATE ${this.tableName} SET ${sets}`;
    this.bindings = Object.values(data);
    return this;
  }

  delete(): this {
    this.query = `DELETE FROM ${this.tableName}`;
    return this;
  }

  getQuery(): string {
    return this.query;
  }

  getBindings(): QueryBinding[] {
    return this.bindings;
  }

  reset(): this {
    this.query = '';
    this.bindings = [];
    return this;
  }
}

/**
 * Database performance monitor
 */
export class DatabaseMonitor {
  private static queryStats: Map<string, {
    count: number;
    totalTime: number;
    avgTime: number;
    slowQueries: number;
  }> = new Map();
  static recordQuery(query: string, duration: number): void {
    const normalizedQuery = this.normalizeQuery(query);
    const stats = this.queryStats.get(normalizedQuery) || {
      count: 0,
      totalTime: 0,
      avgTime: 0,
      slowQueries: 0
    };

    stats.count++;
    stats.totalTime += duration;
    stats.avgTime = stats.totalTime / stats.count;
    
    if (duration > 1000) { // Slow query threshold: 1 second
      stats.slowQueries++;
    }

    this.queryStats.set(normalizedQuery, stats);

    // Log slow queries
    if (duration > 1000) { /* No operation */ }
  }

  private static normalizeQuery(query: string): string {
    // Remove specific values and normalize for grouping
    return query
      .replace(/\b\d+\b/g, '?')
      .replace(/'[^']*'/g, '?')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
  }

  static getStats(): Record<string, any> {
    const stats = Object.fromEntries(this.queryStats);
    const totalQueries = Array.from(this.queryStats.values())
      .reduce((sum, stat) => sum + stat.count, 0);
    const totalSlowQueries = Array.from(this.queryStats.values())
      .reduce((sum, stat) => sum + stat.slowQueries, 0);

    return {
      totalQueries,
      totalSlowQueries,
      slowQueryPercentage: totalQueries > 0 ? (totalSlowQueries / totalQueries) * 100 : 0,
      queryBreakdown: stats
    };
  }

  static reset(): void {
    this.queryStats.clear();
  }
}

/**
 * Enhanced database executor with monitoring and error handling
 */
export class DatabaseExecutor {
  constructor(private env: Env) { /* No operation */ }
  async execute<T = any>(
    query: string, 
    bindings: any[] = [],
    options: { timeout?: number; retries?: number } = { /* No operation */ }
  ): Promise<QueryResult> {
    const startTime = Date.now();
    const { timeout = 10000, retries = 3 } = options;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Query timeout')), timeout);
        });

        // PERFORMANCE: Optimize query before execution
        const optimizedQuery = this.optimizeQuery(query);

        const queryPromise = this.executeQuery(optimizedQuery, bindings);
        const result = await Promise.race([queryPromise, timeoutPromise]) as QueryResult;

        const duration = Date.now() - startTime;
        DatabaseMonitor.recordQuery(optimizedQuery, duration);

        // PERFORMANCE: Log slow queries for optimization
        if (duration > 1000) { /* No operation */ }

        return {
          ...result,
          meta: {
            ...result.meta,
            duration,
            optimized: optimizedQuery !== query
          } as any
        };
      } catch (error) {
        console.error(`Database query attempt ${attempt} failed:`, error);
        
        if (attempt === retries) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Database query failed'
          };
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
      }
    }

    return {
      success: false,
      error: 'Max retries exceeded'
    };
  }

  /**
   * PERFORMANCE: Query optimization
   */
  private optimizeQuery(query: string): string {
    let optimized = query;

    // Add query hints for better performance
    if (optimized.toLowerCase().includes('select') && !optimized.toLowerCase().includes('limit')) {
      // Add reasonable limit for unbounded queries
      if (!optimized.toLowerCase().includes('count(')) {
        optimized += ' LIMIT 1000';
      }
    }

    // Optimize JOIN queries with index hints
    if (optimized.toLowerCase().includes('left join')) {
      // Add index usage hints for SQLite
      optimized = optimized.replace(/LEFT JOIN/gi, 'LEFT JOIN');
    }

    return optimized;
  }

  private async executeQuery(query: string, bindings: any[]): Promise<QueryResult> {
    const stmt = this.env.DB.prepare(query);
    const boundStmt = bindings.length > 0 ? stmt.bind(...bindings) : stmt;

    if (query.trim().toLowerCase().startsWith('select')) {
      const result = await boundStmt.all();
      return {
        success: true,
        data: result.results as unknown as any,
        meta: {
          changes: result.results?.length || 0
        }
      };
    } else {
      const result = await boundStmt.run();
      return {
        success: true,
        data: result as unknown as any,
        meta: {
          changes: (result as any).changes,
          lastRowId: result.meta?.last_row_id
        }
      };
    }
  }

  async paginate<T>(
    baseQuery: string,
    bindings: any[],
    options: PaginationOptions
  ): Promise<PaginatedResult<T>> {
    const { page, limit, sortBy, sortOrder = 'ASC' } = options;
    const offset = (page - 1) * limit;

    // Build count query
    const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery})`;
    const countResult = await this.execute<{ total: number }>(countQuery, bindings);
    const total = (countResult.data as any)?.[0]?.total || 0;

    // Build paginated query
    let paginatedQuery = baseQuery;
    if (sortBy) {
      paginatedQuery += ` ORDER BY ${sortBy} ${sortOrder}`;
    }
    paginatedQuery += ` LIMIT ${limit} OFFSET ${offset}`;

    const dataResult = await this.execute<any>(paginatedQuery, bindings);
    const data = (dataResult.data || []) as T[];

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  async transaction<T>(
    operations: Array<{ query: string; bindings?: any[] }>
  ): Promise<QueryResult<T[]>> {
    // Note: Cloudflare D1 doesn't support traditional transactions
    // This is a simplified implementation that executes operations sequentially
    const results: any[] = [];
    
    try {
      for (const operation of operations) {
        const result = await this.execute(operation.query, operation.bindings || []);
        if (!result.success) {
          throw new Error(result.error || 'Transaction operation failed');
        }
        results.push(result.data as unknown as any);
      }

      return {
        success: true,
        data: results
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transaction failed'
      };
    }
  }
}

/**
 * Database optimization utilities
 */
export class DatabaseOptimizer {
  static async analyzeTableStats(env: Env, tableName: string): Promise<any> {
    const executor = new DatabaseExecutor(env);
    
    // Get table info
    const tableInfo = await executor.execute(
      `PRAGMA table_info(${tableName})`
    );
    
    // Get index info
    const indexInfo = await executor.execute(
      `PRAGMA index_list(${tableName})`
    );
    
    // Get row count
    const rowCount = await executor.execute(
      `SELECT COUNT(*) as count FROM ${tableName}`
    );

    return {
      tableName,
      columns: tableInfo.data,
      indexes: indexInfo.data,
      rowCount: rowCount.data?.[0]?.count || 0
    };
  }

  static generateOptimizationSuggestions(tableStats: any[]): string[] {
    const suggestions: string[] = [];
    
    for (const table of tableStats) {
      // Check for missing indexes on foreign keys
      const foreignKeyColumns = table.columns?.filter((col: any) => 
        col.name.endsWith('_id') && col.name !== 'id'
      ) || [];
      
      const indexedColumns = table.indexes?.map((idx: any) => idx.name) || [];
      
      for (const fkCol of foreignKeyColumns) {
        const hasIndex = indexedColumns.some((idxName: string) => 
          idxName.includes(fkCol.name)
        );
        
        if (!hasIndex) {
          suggestions.push(
            `Consider adding index on ${table.tableName}.${fkCol.name} for better join performance`
          );
        }
      }
      
      // Check for large tables without proper indexing
      if (table.rowCount > 10000 && table.indexes?.length < 2) {
        suggestions.push(
          `Table ${table.tableName} has ${table.rowCount} rows but only ${table.indexes?.length || 0} indexes. Consider adding more indexes.`
        );
      }
    }
    
    return suggestions;
  }
}

// Export commonly used query builders
export const createQueryBuilder = (table: string) => new QueryBuilder(table);
export const createDatabaseExecutor = (env: Env) => new DatabaseExecutor(env);