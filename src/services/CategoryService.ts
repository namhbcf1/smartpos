import { BaseService } from './BaseService';
import { Env } from '../types';

export class CategoryService extends BaseService {
  constructor(env: Env) {
    super(env, 'categories', 'id');
  }
}

export class SimpleCategoryService extends BaseService {
  constructor(env: Env) {
    super(env, 'categories', 'id');
  }

  async getCategories(page: number = 1, limit: number = 100, tenantId: string = 'default') {
    const result = await this.getAll(tenantId, page, limit);
    return { success: result.success, categories: result.data, pagination: result.pagination };
  }
}
