import { BaseService, ServiceResponse, PaginationResult } from './BaseService';
import { Env } from '../types';

export interface Customer { id: string; name: string; email?: string; phone?: string; address?: string; date_of_birth?: string; gender?: string; customer_type?: string; loyalty_points: number; total_spent_cents: number; visit_count: number; total_orders: number; last_visit?: string; is_active: number; created_at: string; updated_at: string; tenant_id: string; }
export interface CustomerFilters { search?: string; customer_type?: string; is_active?: boolean; has_loyalty_points?: boolean; date_from?: string; date_to?: string; page?: number; limit?: number; }
export interface CustomerStats { total_customers: number; active_customers: number; new_customers_today: number; new_customers_this_month: number; total_loyalty_points: number; avg_customer_value: number; }
export interface LoyaltyPointsHistory { id: string; customer_id: string; points: number; type: string; reference_id?: string; reference_type?: string; description?: string; created_at: string; }
export type CustomerServiceResponse = ServiceResponse<Customer>;
export type CustomerListResponse = ServiceResponse<Customer[]> & { pagination?: PaginationResult<Customer> };

export class CustomerService_CustomerDirectorytsx extends BaseService {
  constructor(env: Env) { super(env, 'customers', 'id'); }

  async getCustomers(filters: CustomerFilters = {}, pagination?: any): Promise<CustomerListResponse> {
    const where: Record<string, any> = { tenant_id: 'default' };
    if (filters.search) where.name = `%${filters.search}%`;
    if (filters.customer_type) where.customer_type = filters.customer_type;
    if (filters.is_active !== undefined) where.is_active = filters.is_active ? 1 : 0;
    if (filters.has_loyalty_points) where.loyalty_points = '>0';
    if (filters.date_from) where.created_at = `>=${filters.date_from}`;
    if (filters.date_to) where.created_at = `<=${filters.date_to}`;
    const result = await this.findAll({ where, orderBy: 'created_at', orderDirection: 'DESC', pagination: pagination ? this.createPaginationOptions(pagination.page, pagination.limit) : undefined });
    return { success: result.success, data: result.data || [], error: result.error, pagination: result.pagination } as any;
  }

  getCustomerById(id: string): Promise<CustomerServiceResponse> { return this.findById(id) as any; }

  async createCustomer(customerData: Partial<Customer>): Promise<CustomerServiceResponse> {
    if (!customerData.name) return { success: false, error: 'Name is required' } as any;
    if (customerData.email) {
      const existingEmail = await this.findOne({ email: customerData.email, tenant_id: 'default' });
      if (existingEmail.success && existingEmail.data) return { success: false, error: 'Email already exists' } as any;
    }
    const data = { name: customerData.name, email: customerData.email || null, phone: customerData.phone || null, address: customerData.address || null, date_of_birth: customerData.date_of_birth || null, gender: customerData.gender || null, customer_type: customerData.customer_type || 'regular', loyalty_points: customerData.loyalty_points || 0, total_spent_cents: customerData.total_spent_cents || 0, visit_count: customerData.visit_count || 0, total_orders: customerData.total_orders || 0, last_visit: customerData.last_visit || null, is_active: customerData.is_active !== undefined ? customerData.is_active : 1, tenant_id: 'default' } as any;
    const result = await this.create(data, { returnId: true, validateUnique: true, uniqueFields: ['email'] });
    if (result.success && result.data) return this.getCustomerById(result.data.id) as any; return result as any;
  }

  async updateCustomer(id: string, customerData: Partial<Customer>): Promise<CustomerServiceResponse> {
    if (customerData.email) {
      const existing = await this.findById(id); if (existing.success && existing.data && existing.data.email !== customerData.email) {
        const existingEmail = await this.findOne({ email: customerData.email, tenant_id: 'default' });
        if (existingEmail.success && existingEmail.data) return { success: false, error: 'Email already exists' } as any;
      }
    }
    const result = await this.update(id, customerData, { validateExists: true, returnUpdated: true }) as any;
    if (result.success) return this.getCustomerById(id) as any; return result;
  }

  async deleteCustomer(id: string): Promise<ServiceResponse> {
    const orders = await (this as any).env.DB.prepare(`SELECT COUNT(*) as count FROM orders WHERE customer_id = ?`).bind(id).first();
    if ((orders as any)?.count > 0) return { success: false, error: 'Cannot delete customer: has associated orders' };
    return this.delete(id, 'default', { softDelete: false, validateReferences: true, referenceTables: ['orders'] });
  }

  async updateLoyaltyPoints(customerId: string, points: number, type: string, description?: string, referenceId?: string, referenceType?: string): Promise<ServiceResponse> {
    const customer = await this.findById(customerId); if (!customer.success || !customer.data) return { success: false, error: 'Customer not found' } as any;
    const currentPoints = customer.data.loyalty_points || 0; const newPoints = Math.max(0, currentPoints + points);
    const updateResult = await this.update(customerId, { loyalty_points: newPoints }); if (!updateResult.success) return updateResult as any;
    await (this as any).env.DB.prepare(`INSERT INTO loyalty_points_history (customer_id, points, type, reference_id, reference_type, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(customerId, points, type, referenceId || null, referenceType || null, description || null, new Date().toISOString()).run();
    return { success: true, data: { new_points: newPoints }, message: 'Loyalty points updated successfully' } as any;
  }

  async updateSpending(customerId: string, amount: number): Promise<ServiceResponse> {
    const customer = await this.findById(customerId); if (!customer.success || !customer.data) return { success: false, error: 'Customer not found' } as any;
    const currentSpent = customer.data.total_spent_cents || 0; const newSpent = currentSpent + amount; const newVisitCount = (customer.data.visit_count || 0) + 1;
    const updateResult = await this.update(customerId, { total_spent_cents: newSpent, visit_count: newVisitCount, last_visit: new Date().toISOString() }) as any;
    if (updateResult.success) { const pointsToAward = Math.floor(amount / 1000); if (pointsToAward > 0) await this.updateLoyaltyPoints(customerId, pointsToAward, 'purchase', `Earned ${pointsToAward} points from purchase`, null, 'order'); }
    return updateResult as any;
  }

  async getLoyaltyPointsHistory(customerId: string, limit: number = 50): Promise<ServiceResponse<LoyaltyPointsHistory[]>> {
    const result = await (this as any).env.DB.prepare(`SELECT * FROM loyalty_points_history WHERE customer_id = ? ORDER BY created_at DESC LIMIT ?`).bind(customerId, limit).all();
    return { success: true, data: result.results || [] } as any;
  }

  async getCustomerStats(): Promise<ServiceResponse<CustomerStats>> {
    const today = new Date().toISOString().split('T')[0]; const thisMonth = new Date().toISOString().slice(0, 7);
    const stats = await (this as any).env.DB.prepare(`SELECT COUNT(*) as total_customers, SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_customers, SUM(CASE WHEN DATE(created_at) = ? THEN 1 ELSE 0 END) as new_customers_today, SUM(CASE WHEN DATE(created_at) LIKE ? THEN 1 ELSE 0 END) as new_customers_this_month, SUM(loyalty_points) as total_loyalty_points, AVG(total_spent_cents) as avg_customer_value FROM customers WHERE tenant_id = 'default'`).bind(today, `${thisMonth}%`).first();
    return { success: true, data: { total_customers: (stats as any)?.total_customers || 0, active_customers: (stats as any)?.active_customers || 0, new_customers_today: (stats as any)?.new_customers_today || 0, new_customers_this_month: (stats as any)?.new_customers_this_month || 0, total_loyalty_points: (stats as any)?.total_loyalty_points || 0, avg_customer_value: ((stats as any)?.avg_customer_value || 0) / 100 } } as any;
  }

  async searchCustomers(query: string, limit: number = 20): Promise<CustomerListResponse> {
    const result = await this.findAll({ where: { name: `%${query}%`, is_active: 1, tenant_id: 'default' }, orderBy: 'name', pagination: { page: 1, limit } });
    return { success: result.success, data: result.data || [], error: result.error } as any;
  }

  async getVIPCustomers(limit: number = 10): Promise<CustomerListResponse> {
    const result = await this.findAll({ where: { is_active: 1, tenant_id: 'default' }, orderBy: 'loyalty_points', orderDirection: 'DESC', pagination: { page: 1, limit } });
    return { success: result.success, data: result.data || [], error: result.error } as any;
  }

  async getCustomersByType(customerType: string, limit: number = 50): Promise<CustomerListResponse> {
    const result = await this.findAll({ where: { customer_type: customerType, is_active: 1, tenant_id: 'default' }, orderBy: 'created_at', orderDirection: 'DESC', pagination: { page: 1, limit } });
    return { success: result.success, data: result.data || [], error: result.error } as any;
  }
}

export default CustomerService_CustomerDirectorytsx;

