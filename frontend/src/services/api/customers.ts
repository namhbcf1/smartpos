// Customers API Service - DB Schema Compliant
import { apiClient } from './client';
import { Customer, CustomerFormData, CustomerFilters } from '../../pages/customers/components/types';

export const customersService = {
  // Get all customers with filters
  async getAll(filters?: Partial<CustomerFilters>) {
    const params = new URLSearchParams();

    if (filters?.search) params.append('q', filters.search);
    if (filters?.customer_type && filters.customer_type !== 'all') {
      params.append('customer_type', filters.customer_type);
    }
    if (filters?.is_active && filters.is_active !== 'all') {
      params.append('is_active', filters.is_active === 'active' ? '1' : '0');
    }

    const response = await apiClient.get(`/customers?${params.toString()}`);
    return response.data;
  },

  // Get customer by ID
  async getById(id: string) {
    const response = await apiClient.get(`/customers/${id}`);
    return response.data;
  },

  // Create new customer
  async create(data: CustomerFormData) {
    // Transform form data to match DB schema
    const customerData = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      date_of_birth: data.date_of_birth,
      gender: data.gender,
      customer_type: data.customer_type || 'regular'
    };

    const response = await apiClient.post('/customers', customerData);
    return response.data;
  },

  // Update customer
  async update(id: string, data: Partial<CustomerFormData>) {
    const customerData: any = {};

    if (data.name) customerData.name = data.name;
    if (data.email) customerData.email = data.email;
    if (data.phone) customerData.phone = data.phone;
    if (data.address) customerData.address = data.address;
    if (data.date_of_birth) customerData.date_of_birth = data.date_of_birth;
    if (data.gender) customerData.gender = data.gender;
    if (data.customer_type) customerData.customer_type = data.customer_type;

    const response = await apiClient.put(`/customers/${id}`, customerData);
    return response.data;
  },

  // Delete customer (soft delete)
  async delete(id: string) {
    const response = await apiClient.delete(`/customers/${id}`);
    return response.data;
  },

  // Get customer tiers for loyalty program
  async getTiers() {
    const response = await apiClient.get('/customers/tiers');
    return response.data;
  },

  // Get customer interactions/activity
  async getInteractions(customerId?: string) {
    const params = customerId ? `?customer_id=${customerId}` : '';
    const response = await apiClient.get(`/customers/interactions${params}`);
    return response.data;
  },

  // Convert cents to VND for display
  convertToVND(cents: number): number {
    return cents / 100;
  },

  // Convert VND to cents for API
  convertToCents(amount: number): number {
    return Math.round(amount * 100);
  }
};