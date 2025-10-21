import { BaseService } from './BaseService';
import { Env } from '../types';

export class EmployeeManagementService extends BaseService {
  constructor(env: Env) {
    super(env, 'employees', 'id');
  }

  async getEmployees(tenantId: string = 'default', filters?: any) {
    return await this.getAll(tenantId, filters?.page || 1, filters?.limit || 50);
  }

  async getEmployeeById(id: string, tenantId: string = 'default') {
    return await this.getById(id, tenantId);
  }

  async createEmployee(tenantId: string, data: any) {
    return await this.create(tenantId, data);
  }

  async updateEmployee(id: string, tenantId: string, data: any) {
    return await this.update(id, tenantId, data);
  }

  async deleteEmployee(id: string, tenantId: string, userId?: string) {
    return await this.delete(id, tenantId);
  }

  async createEmployeeAccount(tenantId: string, employeeId: string, data: any) {
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();
    await this.env.DB.prepare(`
      INSERT INTO users (id, tenant_id, email, password_hash, name, role, employee_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(userId, tenantId, data.email, data.password_hash, data.name, data.role || 'employee', employeeId, now, now).run();
    return { success: true, user_id: userId };
  }

  async getEmployeeWithUser(employeeId: string, tenantId: string = 'default') {
    const employee = await this.getById(employeeId, tenantId);
    if (!employee.success) return employee;

    const user = await this.env.DB.prepare(`
      SELECT * FROM users WHERE employee_id = ? AND tenant_id = ?
    `).bind(employeeId, tenantId).first();

    return {
      success: true,
      data: {
        ...employee.data,
        user: user || null
      }
    };
  }
}
