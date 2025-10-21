import { Env } from '../types';

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PaginationResult<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

export class BaseService {
  protected env: Env;
  protected tableName: string;
  protected primaryKey: string;

  constructor(env: Env, tableName: string, primaryKey: string = 'id') {
    this.env = env;
    this.tableName = tableName;
    this.primaryKey = primaryKey;
  }

  protected async executeQuery<T = any>(query: string, params: any[] = []): Promise<T[]> {
    try {
      const result = await this.env.DB.prepare(query).bind(...params).all();
      return (result.results || []) as T[];
    } catch (error: any) {
      console.error(`Query error in ${this.tableName}:`, error);
      throw new Error(error.message || 'Database query failed');
    }
  }

  protected async executeQueryFirst<T = any>(query: string, params: any[] = []): Promise<T | null> {
    try {
      const result = await this.env.DB.prepare(query).bind(...params).first();
      return result as T | null;
    } catch (error: any) {
      console.error(`Query error in ${this.tableName}:`, error);
      throw new Error(error.message || 'Database query failed');
    }
  }

  protected async executeRun(query: string, params: any[] = []): Promise<any> {
    try {
      const result = await this.env.DB.prepare(query).bind(...params).run();
      return result;
    } catch (error: any) {
      console.error(`Query error in ${this.tableName}:`, error);
      throw new Error(error.message || 'Database query failed');
    }
  }

  async getById(id: string, tenantId: string = 'default'): Promise<ServiceResponse> {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = ? AND COALESCE(tenant_id,'default') = ?`;
      const result = await this.executeQueryFirst(query, [id, tenantId]);

      if (!result) {
        return { success: false, error: 'Record not found' };
      }

      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to fetch record' };
    }
  }

  async findOne(where: Record<string, any>): Promise<ServiceResponse> {
    try {
      const conditions = Object.keys(where).map(key => key === 'tenant_id' ? `COALESCE(tenant_id,'default') = ?` : `${key} = ?`).join(' AND ');
      const values = Object.values(where);
      const query = `SELECT * FROM ${this.tableName} WHERE ${conditions} LIMIT 1`;
      const result = await this.executeQueryFirst(query, values);

      if (!result) {
        return { success: false, data: null };
      }

      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to find record' };
    }
  }

  async getAll(tenantId: string = 'default', page: number = 1, pageSize: number = 50): Promise<PaginationResult<any>> {
    try {
      const offset = (page - 1) * pageSize;

      const query = `SELECT * FROM ${this.tableName} WHERE COALESCE(tenant_id,'default') = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      const data = await this.executeQuery(query, [tenantId, pageSize, offset]);

      const countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE COALESCE(tenant_id,'default') = ?`;
      const countResult = await this.executeQueryFirst<{ total: number }>(countQuery, [tenantId]);
      const total = countResult?.total || 0;

      return {
        success: true,
        data,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        pagination: { page, pageSize, total: 0, totalPages: 0 },
        error: error.message || 'Failed to fetch records'
      };
    }
  }

  async create(dataOrTenantId: any, tenantIdOrOptions?: any): Promise<ServiceResponse> {
    try {
      // Handle both old (data, tenantId) and new (data, options) signatures
      let data: any;
      let tenantId: string;
      let options: any = {};

      if (typeof tenantIdOrOptions === 'string') {
        // Old signature: create(data, tenantId)
        data = dataOrTenantId;
        tenantId = tenantIdOrOptions;
      } else if (typeof dataOrTenantId === 'string') {
        // Called with tenantId as first param (from some services)
        tenantId = dataOrTenantId;
        data = tenantIdOrOptions || {};
      } else {
        // New signature: create(data, options)
        data = dataOrTenantId;
        tenantId = data.tenant_id || 'default';
        options = tenantIdOrOptions || {};
      }

      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      const fields = Object.keys(data);
      const values = Object.values(data);
      const placeholders = fields.map(() => '?').join(', ');

      const query = `
        INSERT INTO ${this.tableName} (${this.primaryKey}, tenant_id, ${fields.join(', ')}, created_at, updated_at)
        VALUES (?, ?, ${placeholders}, ?, ?)
      `;

      await this.executeRun(query, [id, tenantId, ...values, now, now]);

      if (options.returnId) {
        return { success: true, data: { [this.primaryKey]: id } };
      }

      const created = await this.getById(id, tenantId);
      return created;
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to create record' };
    }
  }

  async update(id: string, dataOrTenantId: any, tenantIdOrOptions?: any): Promise<ServiceResponse> {
    try {
      // Handle both old (id, data, tenantId) and new (id, data, options) signatures
      let data: any;
      let tenantId: string;
      let options: any = {};

      if (typeof tenantIdOrOptions === 'string') {
        // Old signature: update(id, data, tenantId)
        data = dataOrTenantId;
        tenantId = tenantIdOrOptions;
      } else if (typeof dataOrTenantId === 'string') {
        // Called with tenantId as second param
        tenantId = dataOrTenantId;
        data = tenantIdOrOptions || {};
      } else {
        // New signature: update(id, data, options)
        data = dataOrTenantId;
        tenantId = data.tenant_id || 'default';
        options = tenantIdOrOptions || {};
      }

      const fields = Object.keys(data);
      const values = Object.values(data);
      const setClause = fields.map(f => `${f} = ?`).join(', ');

      const query = `
        UPDATE ${this.tableName}
        SET ${setClause}, updated_at = ?
        WHERE ${this.primaryKey} = ? AND tenant_id = ?
      `;

      const now = new Date().toISOString();
      await this.executeRun(query, [...values, now, id, tenantId]);

      if (options.returnUpdated) {
        const updated = await this.getById(id, tenantId);
        return updated;
      }

      return { success: true, message: 'Record updated successfully' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to update record' };
    }
  }

  async delete(id: string, tenantId: string = 'default', options?: any): Promise<ServiceResponse> {
    try {
      const query = `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = ? AND tenant_id = ?`;
      const result = await this.executeRun(query, [id, tenantId]);

      if (result.changes === 0) {
        return { success: false, error: 'Record not found' };
      }

      return { success: true, message: 'Record deleted successfully' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to delete record' };
    }
  }

  // Alias methods for compatibility
  async findById(id: string, tenantId: string = 'default'): Promise<ServiceResponse> {
    return await this.getById(id, tenantId);
  }

  async findAll(options?: any): Promise<ServiceResponse> {
    const tenantId = options?.where?.tenant_id || 'default';
    const page = options?.pagination?.page || 1;
    const limit = options?.pagination?.limit || 50;

    const result = await this.getAll(tenantId, page, limit);
    return {
      success: result.success,
      data: result.data,
      error: result.error,
      pagination: result.pagination as any
    };
  }

  protected createPaginationOptions(page: number = 1, limit: number = 50) {
    return { page, limit };
  }
}
