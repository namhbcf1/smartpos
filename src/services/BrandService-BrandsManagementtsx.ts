import { BaseService, ServiceResponse, PaginationResult } from './BaseService';
import { Env } from '../types';

export interface Brand {
  id: string;
  name: string;
  description?: string;
  website?: string;
  logo_url?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
  tenant_id: string;
}

export interface BrandFilters {
  search?: string;
  is_active?: boolean;
}

export interface BrandStats {
  total_brands: number;
  active_brands: number;
  brands_with_products: number;
  brands_with_logo: number;
}

export type BrandServiceResponse = ServiceResponse<Brand>;
export type BrandListResponse = ServiceResponse<Brand[]> & { pagination?: PaginationResult };

export class BrandService_BrandsManagementtsx extends BaseService {
  constructor(env: Env) {
    super(env, 'brands', 'id');
  }

  async getBrands(filters: BrandFilters = {}, pagination?: any): Promise<BrandListResponse> {
    try {
      const where: Record<string, any> = { tenant_id: 'default' };
      if (filters.search) where.name = `%${filters.search}%`;
      if (filters.is_active !== undefined) where.is_active = filters.is_active ? 1 : 0;
      const result = await this.findAll({
        where,
        orderBy: 'name',
        orderDirection: 'ASC',
        pagination: pagination ? this.createPaginationOptions(pagination.page, pagination.limit) : undefined
      });
      return { success: result.success, data: result.data || [], error: result.error, pagination: result.pagination };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error', data: [] } as any;
    }
  }

  async getBrandById(id: string): Promise<BrandServiceResponse> {
    try { return await this.findById(id); } 
    catch (error) { return { success: false, error: (error as Error).message }; }
  }

  async createBrand(brandData: Partial<Brand>): Promise<BrandServiceResponse> {
    try {
      if (!brandData.name) return { success: false, error: 'Name is required' };
      const data = { name: brandData.name, description: brandData.description || null, website: brandData.website || null, logo_url: brandData.logo_url || null, is_active: brandData.is_active !== undefined ? brandData.is_active : 1, tenant_id: 'default' } as any;
      return await this.create(data, { returnId: true });
    } catch (error) { return { success: false, error: (error as Error).message }; }
  }

  async updateBrand(id: string, brandData: Partial<Brand>): Promise<BrandServiceResponse> {
    try { return await this.update(id, brandData, { validateExists: true, returnUpdated: true }); }
    catch (error) { return { success: false, error: (error as Error).message }; }
  }

  async deleteBrand(id: string): Promise<ServiceResponse> {
    try {
      const products = await (this as any).env.DB.prepare(`SELECT COUNT(*) as count FROM products WHERE brand_id = ?`).bind(id).first();
      if (products?.count > 0) return { success: false, error: 'Cannot delete brand: has associated products' };
      return await this.delete(id, { softDelete: false, validateReferences: true, referenceTables: ['products'] });
    } catch (error) { return { success: false, error: (error as Error).message }; }
  }

  async getActiveBrands(): Promise<BrandListResponse> {
    try {
      const result = await this.findAll({ where: { is_active: 1, tenant_id: 'default' }, orderBy: 'name', orderDirection: 'ASC' });
      return { success: result.success, data: result.data || [], error: result.error };
    } catch (error) { return { success: false, error: (error as Error).message, data: [] } as any; }
  }

  async getBrandsWithProducts(): Promise<BrandListResponse> {
    try {
      const result = await (this as any).env.DB.prepare(`
        SELECT DISTINCT b.* FROM brands b
        INNER JOIN products p ON b.id = p.brand_id
        WHERE b.is_active = 1 AND b.tenant_id = 'default'
        ORDER BY b.name
      `).all<any>();
      return { success: true, data: result.results || [] };
    } catch (error) { return { success: false, error: (error as Error).message, data: [] } as any; }
  }

  async getBrandStats(): Promise<ServiceResponse<BrandStats>> {
    try {
      const stats = await (this as any).env.DB.prepare(`
        SELECT COUNT(*) as total_brands,
               SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_brands,
               SUM(CASE WHEN logo_url IS NOT NULL AND logo_url != '' THEN 1 ELSE 0 END) as brands_with_logo
        FROM brands WHERE tenant_id = 'default'
      `).first<any>();
      const brandsWithProducts = await (this as any).env.DB.prepare(`
        SELECT COUNT(DISTINCT b.id) as brands_with_products
        FROM brands b INNER JOIN products p ON b.id = p.brand_id
        WHERE b.tenant_id = 'default'
      `).first<any>();
      return { success: true, data: { total_brands: stats?.total_brands || 0, active_brands: stats?.active_brands || 0, brands_with_products: brandsWithProducts?.brands_with_products || 0, brands_with_logo: stats?.brands_with_logo || 0 } };
    } catch (error) { return { success: false, error: (error as Error).message } as any; }
  }

  async searchBrands(query: string, limit: number = 20): Promise<BrandListResponse> {
    try {
      const result = await this.findAll({ where: { name: `%${query}%`, is_active: 1, tenant_id: 'default' }, orderBy: 'name', pagination: { page: 1, limit } });
      return { success: result.success, data: result.data || [], error: result.error };
    } catch (error) { return { success: false, error: (error as Error).message, data: [] } as any; }
  }

  async getBrandByName(name: string): Promise<BrandServiceResponse> {
    try { return await this.findOne({ name, tenant_id: 'default' }); }
    catch (error) { return { success: false, error: (error as Error).message }; }
  }
}

export default BrandService_BrandsManagementtsx;

