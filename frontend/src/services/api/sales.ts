// Sales API Service - DB Schema Compliant
import { apiClient } from './client';
import { Sale, SalesFilters } from '../../pages/sales/components/types';

export const salesService = {
  // Get all sales/orders with filters
  async getAll(filters?: Partial<SalesFilters>) {
    const params = new URLSearchParams();

    if (filters?.search) params.append('q', filters.search);
    if (filters?.date_range?.start) params.append('from', filters.date_range.start);
    if (filters?.date_range?.end) params.append('to', filters.date_range.end);
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);

    const response = await apiClient.get(`/orders?${params.toString()}`);
    return response.data;
  },

  // Get sale/order by ID
  async getById(id: string) {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data;
  },

  // Create new sale/order
  async create(data: Partial<Sale>) {
    // Transform sale data to match DB schema
    const orderData = {
      customer_id: data.customer_id,
      user_id: data.user_id, // cashier
      store_id: data.store_id || 'store-1',
      status: data.status || 'pending',
      subtotal_cents: data.subtotal_cents || 0,
      discount_cents: data.discount_cents || 0,
      tax_cents: data.tax_cents || 0,
      total_cents: data.total_cents || 0,
      notes: data.notes,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone
    };

    const response = await apiClient.post('/orders', orderData);
    return response.data;
  },

  // Update sale/order
  async update(id: string, data: Partial<Sale>) {
    const orderData: any = {};

    if (data.status) orderData.status = data.status;
    if (data.subtotal_cents !== undefined) orderData.subtotal_cents = data.subtotal_cents;
    if (data.discount_cents !== undefined) orderData.discount_cents = data.discount_cents;
    if (data.tax_cents !== undefined) orderData.tax_cents = data.tax_cents;
    if (data.total_cents !== undefined) orderData.total_cents = data.total_cents;
    if (data.notes) orderData.notes = data.notes;
    if (data.customer_name) orderData.customer_name = data.customer_name;
    if (data.customer_phone) orderData.customer_phone = data.customer_phone;

    const response = await apiClient.put(`/orders/${id}`, orderData);
    return response.data;
  },

  // Delete sale/order
  async delete(id: string) {
    const response = await apiClient.delete(`/orders/${id}`);
    return response.data;
  },

  // Get sales statistics
  async getStats(dateRange?: { start: string; end: string }) {
    const params = new URLSearchParams();
    if (dateRange?.start) params.append('from', dateRange.start);
    if (dateRange?.end) params.append('to', dateRange.end);

    const response = await apiClient.get(`/analytics/sales?${params.toString()}`);
    return response.data;
  },

  // Convert VND to cents for API
  convertToCents(amount: number): number {
    return Math.round(amount * 100);
  },

  // Convert cents to VND for display
  convertToVND(cents: number): number {
    return cents / 100;
  }
};