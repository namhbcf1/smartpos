import { BaseService, ServiceResponse, PaginationResult } from './BaseService';
import { Env } from '../types';

export interface Branch { id: string; name: string; address?: string; phone?: string; email?: string; tax_number?: string; business_license?: string; logo_url?: string; timezone?: string; currency?: string; is_active: number; created_at: string; updated_at: string; tenant_id: string; }
export interface BranchFilters { search?: string; is_active?: boolean; timezone?: string; currency?: string; }
export interface BranchStats { total_branches: number; active_branches: number; branches_with_orders: number; total_revenue: number; avg_revenue_per_branch: number; }
export interface BranchRevenue { branch_id: string; branch_name: string; total_orders: number; total_revenue: number; avg_order_value: number; period: string; }
export type BranchServiceResponse = ServiceResponse<Branch>;
export type BranchListResponse = ServiceResponse<Branch[]> & { pagination?: PaginationResult };

export class BranchService_BranchesManagementtsx extends BaseService {
  constructor(env: Env) { super(env, 'stores', 'id'); }

  async getBranches(filters: BranchFilters = {}, pagination?: any): Promise<BranchListResponse> {
    const where: Record<string, any> = { tenant_id: 'default' };
    if (filters.search) where.name = `%${filters.search}%`;
    if (filters.is_active !== undefined) where.is_active = filters.is_active ? 1 : 0;
    if (filters.timezone) where.timezone = filters.timezone;
    if (filters.currency) where.currency = filters.currency;
    const result = await this.findAll({ where, orderBy: 'name', orderDirection: 'ASC', pagination: pagination ? this.createPaginationOptions(pagination.page, pagination.limit) : undefined });
    return { success: result.success, data: result.data || [], error: result.error, pagination: result.pagination } as any;
  }

  async getBranchById(id: string): Promise<BranchServiceResponse> { return this.findById(id) as any; }

  async createBranch(branchData: Partial<Branch>): Promise<BranchServiceResponse> {
    if (!branchData.name) return { success: false, error: 'Name is required' } as any;
    const data = { name: branchData.name, address: branchData.address || null, phone: branchData.phone || null, email: branchData.email || null, tax_number: branchData.tax_number || null, business_license: branchData.business_license || null, logo_url: branchData.logo_url || null, timezone: branchData.timezone || 'Asia/Ho_Chi_Minh', currency: branchData.currency || 'VND', is_active: branchData.is_active !== undefined ? branchData.is_active : 1, tenant_id: 'default' } as any;
    return this.create(data, { returnId: true }) as any;
  }

  async updateBranch(id: string, branchData: Partial<Branch>): Promise<BranchServiceResponse> { return this.update(id, branchData, { validateExists: true, returnUpdated: true }) as any; }

  async deleteBranch(id: string): Promise<ServiceResponse> {
    const orders = await (this as any).env.DB.prepare(`SELECT COUNT(*) as count FROM orders WHERE store_id = ?`).bind(id).first<any>();
    if (orders?.count > 0) return { success: false, error: 'Cannot delete branch: has associated orders' } as any;
    const products = await (this as any).env.DB.prepare(`SELECT COUNT(*) as count FROM products WHERE store_id = ?`).bind(id).first<any>();
    if (products?.count > 0) return { success: false, error: 'Cannot delete branch: has associated products' } as any;
    return this.delete(id, { softDelete: false, validateReferences: true, referenceTables: ['orders', 'products'] }) as any;
  }

  async getActiveBranches(): Promise<BranchListResponse> {
    const result = await this.findAll({ where: { is_active: 1, tenant_id: 'default' }, orderBy: 'name', orderDirection: 'ASC' });
    return { success: result.success, data: result.data || [], error: result.error } as any;
  }

  async getBranchStats(): Promise<ServiceResponse<BranchStats>> {
    const stats = await (this as any).env.DB.prepare(`SELECT COUNT(*) as total_branches, SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_branches FROM stores WHERE tenant_id = 'default'`).first<any>();
    const branchesWithOrders = await (this as any).env.DB.prepare(`SELECT COUNT(DISTINCT s.id) as branches_with_orders FROM stores s INNER JOIN orders o ON s.id = o.store_id WHERE s.tenant_id = 'default'`).first<any>();
    const revenueStats = await (this as any).env.DB.prepare(`SELECT SUM(total_cents) as total_revenue, AVG(total_cents) as avg_revenue_per_branch FROM orders o INNER JOIN stores s ON o.store_id = s.id WHERE s.tenant_id = 'default' AND o.status = 'completed'`).first<any>();
    return { success: true, data: { total_branches: stats?.total_branches || 0, active_branches: stats?.active_branches || 0, branches_with_orders: branchesWithOrders?.branches_with_orders || 0, total_revenue: (revenueStats?.total_revenue || 0) / 100, avg_revenue_per_branch: (revenueStats?.avg_revenue_per_branch || 0) / 100 } } as any;
  }
}

export default BranchService_BranchesManagementtsx;

