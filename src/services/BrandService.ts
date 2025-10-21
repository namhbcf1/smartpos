import { BaseService } from './BaseService';
import { Env } from '../types';

export class BrandService extends BaseService {
  constructor(env: Env) {
    super(env, 'brands', 'id');
  }

  async getBrands(tenantId: string = 'default', filters?: any) {
    return await this.getAll(tenantId, filters?.page || 1, filters?.limit || 50);
  }

  async getBrandById(id: string, tenantId: string = 'default') {
    return await this.getById(id, tenantId);
  }

  async createBrand(tenantId: string, data: any) {
    return await this.create(tenantId, data);
  }

  async updateBrand(id: string, tenantId: string, data: any) {
    return await this.update(id, tenantId, data);
  }

  async deleteBrand(id: string, tenantId: string) {
    return await this.delete(id, tenantId);
  }
}
