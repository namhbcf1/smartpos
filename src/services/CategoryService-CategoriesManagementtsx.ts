import { BaseService, ServiceResponse, PaginationResult } from './BaseService';
import { Env } from '../types';

export interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  image_url?: string;
  sort_order?: number;
  is_active: number;
  created_at: string;
  updated_at: string;
  tenant_id: string;
}

export interface CategoryFilters { search?: string; parent_id?: string; is_active?: boolean; }
export interface CategoryStats { total_categories: number; active_categories: number; root_categories: number; sub_categories: number; }
export type CategoryServiceResponse = ServiceResponse<Category>;
export type CategoryListResponse = ServiceResponse<Category[]> & { pagination?: PaginationResult<Category> };

export class CategoryService_CategoriesManagementtsx extends BaseService {
  constructor(env: Env) { super(env, 'categories', 'id'); }

  async getCategories(filters: CategoryFilters = {}, pagination?: any): Promise<CategoryListResponse> {
    const where: Record<string, any> = { tenant_id: 'default' };
    if (filters.search) where.name = `%${filters.search}%`;
    if (filters.parent_id !== undefined) where.parent_id = filters.parent_id;
    if (filters.is_active !== undefined) where.is_active = filters.is_active ? 1 : 0;
    const result = await this.findAll({ where, orderBy: 'sort_order', orderDirection: 'ASC', pagination: pagination ? this.createPaginationOptions(pagination.page, pagination.limit) : undefined });
    return { success: result.success, data: result.data || [], error: result.error, pagination: result.pagination as any };
  }

  async getCategoryById(id: string): Promise<CategoryServiceResponse> { return this.findById(id); }

  async createCategory(categoryData: Partial<Category>): Promise<CategoryServiceResponse> {
    if (!categoryData.name) return { success: false, error: 'Name is required' } as any;
    const data = { name: categoryData.name, description: categoryData.description || null, parent_id: categoryData.parent_id || null, image_url: categoryData.image_url || null, sort_order: categoryData.sort_order || 0, is_active: categoryData.is_active !== undefined ? categoryData.is_active : 1, tenant_id: 'default' } as any;
    return this.create(data, { returnId: true }) as any;
  }

  async updateCategory(id: string, categoryData: Partial<Category>): Promise<CategoryServiceResponse> { return this.update(id, categoryData, { validateExists: true, returnUpdated: true }) as any; }

  async deleteCategory(id: string): Promise<ServiceResponse> {
    const subcategories = await (this as any).env.DB.prepare(`SELECT COUNT(*) as count FROM categories WHERE parent_id = ?`).bind(id).first();
    if ((subcategories as any)?.count > 0) return { success: false, error: 'Cannot delete category: has subcategories' };
    const products = await (this as any).env.DB.prepare(`SELECT COUNT(*) as count FROM products WHERE category_id = ?`).bind(id).first();
    if ((products as any)?.count > 0) return { success: false, error: 'Cannot delete category: has associated products' };
    return this.delete(id, 'default', { softDelete: false, validateReferences: true, referenceTables: ['categories', 'products'] });
  }

  async getRootCategories(): Promise<CategoryListResponse> {
    const result = await this.findAll({ where: { parent_id: null, is_active: 1, tenant_id: 'default' }, orderBy: 'sort_order', orderDirection: 'ASC' });
    return { success: result.success, data: result.data || [], error: result.error } as any;
  }

  async getSubCategories(parentId: string): Promise<CategoryListResponse> {
    const result = await this.findAll({ where: { parent_id: parentId, is_active: 1, tenant_id: 'default' }, orderBy: 'sort_order', orderDirection: 'ASC' });
    return { success: result.success, data: result.data || [], error: result.error } as any;
  }

  async getCategoryTree(): Promise<ServiceResponse<any[]>> {
    const result = await (this as any).env.DB.prepare(`
      WITH RECURSIVE category_tree AS (
        SELECT id, name, description, parent_id, image_url, sort_order, is_active, 0 as level
        FROM categories WHERE parent_id IS NULL AND tenant_id = 'default'
        UNION ALL
        SELECT c.id, c.name, c.description, c.parent_id, c.image_url, c.sort_order, c.is_active, ct.level + 1
        FROM categories c INNER JOIN category_tree ct ON c.parent_id = ct.id
        WHERE c.tenant_id = 'default'
      )
      SELECT * FROM category_tree WHERE is_active = 1 ORDER BY level, sort_order
    `).all();
    return { success: true, data: result.results || [] } as any;
  }

  async getCategoryStats(): Promise<ServiceResponse<CategoryStats>> {
    const stats = await (this as any).env.DB.prepare(`
      SELECT COUNT(*) as total_categories,
             SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_categories,
             SUM(CASE WHEN parent_id IS NULL THEN 1 ELSE 0 END) as root_categories,
             SUM(CASE WHEN parent_id IS NOT NULL THEN 1 ELSE 0 END) as sub_categories
      FROM categories WHERE tenant_id = 'default'
    `).first();
    return { success: true, data: { total_categories: (stats as any)?.total_categories || 0, active_categories: (stats as any)?.active_categories || 0, root_categories: (stats as any)?.root_categories || 0, sub_categories: (stats as any)?.sub_categories || 0 } } as any;
  }

  async searchCategories(query: string, limit: number = 20): Promise<CategoryListResponse> {
    const result = await this.findAll({ where: { name: `%${query}%`, is_active: 1, tenant_id: 'default' }, orderBy: 'name', pagination: { page: 1, limit } });
    return { success: result.success, data: result.data || [], error: result.error } as any;
  }
}

