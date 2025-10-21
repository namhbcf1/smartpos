import { api } from './api';

export interface Debt {
  id: string;
  tenant_id: string;
  customer_id?: string;
  supplier_id?: string;
  debt_type: 'customer' | 'supplier';
  amount: number;
  paid_amount: number;
  remaining: number;
  status: 'unpaid' | 'partial' | 'paid';
  due_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDebtRequest {
  customer_id?: string;
  supplier_id?: string;
  debt_type: 'customer' | 'supplier';
  amount: number;
  paid_amount?: number;
  due_date?: string;
  notes?: string;
  status?: 'unpaid' | 'partial' | 'paid';
}

export interface UpdateDebtRequest {
  customer_id?: string;
  supplier_id?: string;
  debt_type?: 'customer' | 'supplier';
  amount?: number;
  paid_amount?: number;
  due_date?: string;
  notes?: string;
  status?: 'unpaid' | 'partial' | 'paid';
}

export interface DebtFilters {
  status?: 'unpaid' | 'partial' | 'paid';
  debt_type?: 'customer' | 'supplier';
  search?: string;
  sortBy?: 'amount' | 'due_date' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

export interface DebtAnalytics {
  totalDebts: number;
  totalAmount: number;
  totalPaid: number;
  totalRemaining: number;
  paidDebts: number;
  unpaidDebts: number;
  partialDebts: number;
  collectionRate: number;
  debtsByStatus: Array<{
    status: string;
    count: number;
    amount: number;
  }>;
  recentDebts: Debt[];
}

export const debtsAPI = {
  // Get all debts with pagination and filtering
  getDebts: async (
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    filters?: DebtFilters
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    if (search) params.append('search', search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.debt_type) params.append('debt_type', filters.debt_type);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await api.get(`/debts?${params.toString()}`);
    return response.data;
  },

  // Get debt by ID
  getDebt: async (id: string) => {
    const response = await api.get(`/debts/${id}`);
    return response.data;
  },

  // Create new debt
  createDebt: async (data: CreateDebtRequest) => {
    const response = await api.post('/debts', data);
    return response.data;
  },

  // Update debt
  updateDebt: async (id: string, data: UpdateDebtRequest) => {
    const response = await api.put(`/debts/${id}`, data);
    return response.data;
  },

  // Delete debt
  deleteDebt: async (id: string) => {
    const response = await api.delete(`/debts/${id}`);
    return response.data;
  },

  // Get debt analytics
  getDebtAnalytics: async () => {
    const response = await api.get('/debts/analytics');
    return response.data;
  },

  // Make payment
  makePayment: async (id: string, amount: number, notes?: string) => {
    const response = await api.post(`/debts/${id}/payment`, { amount, notes });
    return response.data;
  },

  // Bulk operations
  bulkDeleteDebts: async (ids: string[]) => {
    const response = await api.delete('/debts/bulk', { data: { ids } });
    return response.data;
  },

  bulkUpdateDebts: async (ids: string[], data: Partial<UpdateDebtRequest>) => {
    const response = await api.put('/debts/bulk', { ids, data });
    return response.data;
  },

  // Export debts
  exportDebts: async (format: 'csv' | 'excel' = 'csv') => {
    const response = await api.get(`/debts/export?format=${format}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Import debts
  importDebts: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/debts/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};