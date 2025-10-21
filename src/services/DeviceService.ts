import { BaseService } from './BaseService';
import { Env } from '../types';

export class DeviceService extends BaseService {
  constructor(env: Env) {
    super(env, 'devices', 'id');
  }

  async getDevices(tenantId: string = 'default', filters?: any) {
    return await this.getAll(tenantId, filters?.page || 1, filters?.limit || 50);
  }

  async createDevice(tenantId: string, data: any) {
    return await this.create(tenantId, data);
  }

  async updateDevice(id: string, tenantId: string, data: any) {
    return await this.update(id, tenantId, data);
  }

  async deleteDevice(id: string, tenantId: string) {
    return await this.delete(id, tenantId);
  }
}
