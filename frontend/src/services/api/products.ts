// Products API Service - DB Schema Compliant
import apiClient from './client';
// import { Product, ProductFormData, ProductFilters } from '../../pages/products/components/types';

export const productsService = {
  // Get all products with filters
  async getAll(filters?: any) {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.category_id) params.append('category_id', filters.category_id);
    if (filters?.brand_id) params.append('brand_id', filters.brand_id);
    if (filters?.supplier_id) params.append('supplier_id', filters.supplier_id);
    if (filters?.stock_status && filters.stock_status !== 'all') {
      if (filters.stock_status === 'low_stock') params.append('low_stock', 'true');
    }
    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }
    if (filters?.sort_by) params.append('sort_by', filters.sort_by);
    if (filters?.sort_order) params.append('sort_order', filters.sort_order);

    const response = await apiClient.get(`/products?${params.toString()}`);
    return response.data;
  },

  // Get product by ID
  async getById(id: string) {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  // Create new product
  async create(data: any) {
    // Transform form data to match DB schema
    const productData = {
      name: data.name,
      sku: data.sku,
      barcode: data.barcode,
      description: data.description,
      price_cents: Math.round(data.price! * 100), // Convert VND to cents
      cost_price_cents: Math.round((data.cost_price || 0) * 100),
      stock: data.stock || 0,
      min_stock: data.min_stock || 0,
      max_stock: data.max_stock || 100,
      unit: data.unit || 'piece',
      weight_grams: data.weight,
      dimensions: data.dimensions,
      category_id: data.category_id,
      brand_id: data.brand_id,
      supplier_id: data.supplier_id,
      image_url: data.image_url,
      images: data.images ? JSON.stringify(data.images) : null,
      is_serialized: data.track_inventory ? 1 : 0
    };

    const response = await apiClient.post('/products', productData);
    return response.data;
  },

  // Update product
  async update(id: string, data: any) {
    // Transform form data to match DB schema
    const productData: any = {};

    if (data.name) productData.name = data.name;
    if (data.sku) productData.sku = data.sku;
    if (data.barcode) productData.barcode = data.barcode;
    if (data.description) productData.description = data.description;
    if (data.price !== undefined) productData.price_cents = Math.round(data.price * 100);
    if (data.cost_price !== undefined) productData.cost_price_cents = Math.round(data.cost_price * 100);
    if (data.stock !== undefined) productData.stock = data.stock;
    if (data.min_stock !== undefined) productData.min_stock = data.min_stock;
    if (data.max_stock !== undefined) productData.max_stock = data.max_stock;
    if (data.unit) productData.unit = data.unit;
    if (data.weight !== undefined) productData.weight_grams = data.weight;
    if (data.dimensions) productData.dimensions = data.dimensions;
    if (data.category_id) productData.category_id = data.category_id;
    if (data.brand_id) productData.brand_id = data.brand_id;
    if (data.supplier_id) productData.supplier_id = data.supplier_id;
    if (data.image_url) productData.image_url = data.image_url;
    if (data.images) productData.images = JSON.stringify(data.images);
    if (data.track_inventory !== undefined) productData.is_serialized = data.track_inventory ? 1 : 0;

    const response = await apiClient.put(`/products/${id}`, productData);
    return response.data;
  },

  // Delete product (soft delete)
  async delete(id: string) {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  },

  // Get product by barcode
  async getByBarcode(barcode: string) {
    const response = await apiClient.get(`/products/barcode/${barcode}`);
    return response.data;
  },

  // Get low stock products
  async getLowStock(threshold?: number) {
    const params = threshold ? `?threshold=${threshold}` : '';
    const response = await apiClient.get(`/products/low-stock${params}`);
    return response.data;
  },

  // Adjust stock
  async adjustStock(id: string, data: {
    adjustment_type: 'increase' | 'decrease' | 'set';
    quantity: number;
    reason?: string;
    notes?: string;
  }) {
    const response = await apiClient.post(`/products/${id}/stock-adjustment`, data);
    return response.data;
  },

  // Get inventory movements for product
  async getMovements(id: string, page = 1, limit = 50) {
    const response = await apiClient.get(`/products/${id}/movements?page=${page}&limit=${limit}`);
    return response.data;
  }
};