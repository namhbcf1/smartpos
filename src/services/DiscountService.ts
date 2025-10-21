import { BaseService } from './BaseService';
import { Env } from '../types';

export class DiscountService extends BaseService {
  constructor(env: Env) {
    super(env, 'promotions', 'id');
  }

  async getDiscountRules(tenantId: string = 'default', filters?: any) {
    return await this.getAll(tenantId, filters?.page || 1, filters?.limit || 50);
  }

  async createDiscountRule(tenantId: string, data: any) {
    return await this.create(tenantId, data);
  }

  async updateDiscountRule(id: string, tenantId: string, data: any) {
    return await this.update(id, tenantId, data);
  }
}
