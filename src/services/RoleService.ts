import { BaseService } from './BaseService';
import { Env } from '../types';

export class RoleService extends BaseService {
  constructor(env: Env) {
    super(env, 'roles', 'id');
  }

  async getRoles(tenantId: string = 'default', filters?: any) {
    const result = await this.getAll(tenantId, filters?.page || 1, filters?.limit || 50);
    return { ...result, roles: result.data };
  }

  async getRoleById(id: string, tenantId: string = 'default') {
    return await this.getById(id, tenantId);
  }

  async createRole(tenantId: string, data: any, userId?: string) {
    return await this.create(tenantId, data);
  }

  async updateRole(id: string, tenantId: string, data: any, userId?: string) {
    return await this.update(id, tenantId, data);
  }

  async deleteRole(id: string, tenantId: string, userId?: string) {
    return await this.delete(id, tenantId);
  }
}
