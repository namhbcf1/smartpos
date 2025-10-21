import { api } from './api';

export interface Warehouse {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  address?: string;
  manager_id?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface CreateWarehouseRequest {
  code: string;
  name: string;
  address?: string;
  manager_id?: string;
  is_active?: number;
}

export interface UpdateWarehouseRequest {
  code?: string;
  name?: string;
  address?: string;
  manager_id?: string;
  is_active?: number;
}

export interface WarehouseFilters {
  status?: 'active' | 'inactive';
  search?: string;
  sortBy?: 'name' | 'code' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

export interface WarehouseAnalytics {
  totalWarehouses: number;
  activeWarehouses: number;
  inactiveWarehouses: number;
  healthScore: number;
  warehousesByStatus: Array<{
    status: string;
    count: number;
  }>;
  recentWarehouses: Warehouse[];
}

export const warehousesAPI = {
  // Get all warehouses with pagination and filtering
  getWarehouses: async (
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    filters?: WarehouseFilters
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    if (search) params.append('search', search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await api.get(`/warehouses?${params.toString()}`);
    return response.data;
  },

  // Get warehouse by ID
  getWarehouse: async (id: string) => {
    const response = await api.get(`/warehouses/${id}`);
    return response.data;
  },

  // Create new warehouse
  createWarehouse: async (data: CreateWarehouseRequest) => {
    const response = await api.post('/warehouses', data);
    return response.data;
  },

  // Update warehouse
  updateWarehouse: async (id: string, data: UpdateWarehouseRequest) => {
    const response = await api.put(`/warehouses/${id}`, data);
    return response.data;
  },

  // Delete warehouse
  deleteWarehouse: async (id: string) => {
    const response = await api.delete(`/warehouses/${id}`);
    return response.data;
  },

  // Get warehouse analytics
  getWarehouseAnalytics: async () => {
    const response = await api.get('/warehouses/analytics');
    return response.data;
  },

  // Validate warehouse code
  validateWarehouseCode: async (code: string, excludeId?: string) => {
    const params = new URLSearchParams({ code });
    if (excludeId) params.append('excludeId', excludeId);
    
    const response = await api.get(`/warehouses/validate-code?${params.toString()}`);
    return response.data;
  },

  // Bulk operations
  bulkDeleteWarehouses: async (ids: string[]) => {
    const response = await api.delete('/warehouses/bulk', { data: { ids } });
    return response.data;
  },

  bulkUpdateWarehouses: async (ids: string[], data: Partial<UpdateWarehouseRequest>) => {
    const response = await api.put('/warehouses/bulk', { ids, data });
    return response.data;
  },

  // Export warehouses
  exportWarehouses: async (format: 'csv' | 'excel' = 'csv') => {
    const response = await api.get(`/warehouses/export?format=${format}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Import warehouses
  importWarehouses: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/warehouses/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};