import apiClient from '../api/client';
import { ApiResponse, PaginatedResponse } from '../../types/api';

// Employee Types
export interface Employee {
  id: number;
  employee_code: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: 'admin' | 'cashier' | 'sales_agent' | 'affiliate';
  commission_rate: number;
  base_salary: number;
  hire_date: string;
  status: 'active' | 'inactive';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeFormData {
  full_name: string;
  email: string;
  phone: string;
  role: Employee['role'];
  commission_rate: number;
  base_salary: number;
  status: Employee['status'];
  notes: string;
}

export interface EmployeeFilters {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface EmployeeStats {
  totalEmployees: number;
  activeEmployees: number;
  totalBaseSalary: number;
  averageCommission: number;
}

export interface PaginatedEmployees {
  data: Employee[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Validation utilities
export const validateEmployee = (data: Partial<EmployeeFormData>): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.full_name?.trim()) {
    errors.full_name = 'Họ và tên là bắt buộc';
  } else if (data.full_name.length < 2) {
    errors.full_name = 'Họ và tên phải có ít nhất 2 ký tự';
  } else if (data.full_name.length > 100) {
    errors.full_name = 'Họ và tên không được quá 100 ký tự';
  }

  if (data.email && data.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.email = 'Email không hợp lệ';
    }
  }

  if (data.phone && data.phone.trim()) {
    // Vietnamese phone number validation
    const phoneRegex = /^(0|\+84)[3-9]\d{8}$/;
    const cleanPhone = data.phone.replace(/\s|-/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      errors.phone = 'Số điện thoại không hợp lệ (VD: 0901234567)';
    }
  }

  if (data.commission_rate !== undefined) {
    if (data.commission_rate < 0 || data.commission_rate > 100) {
      errors.commission_rate = 'Tỷ lệ hoa hồng phải từ 0% đến 100%';
    }
  }

  if (data.base_salary !== undefined && data.base_salary < 0) {
    errors.base_salary = 'Lương cơ bản không được âm';
  }

  return errors;
};

// Format utilities
export const formatEmployeeRole = (role: Employee['role']): string => {
  const roleMap = {
    admin: 'Quản trị viên',
    cashier: 'Thu ngân',
    sales_agent: 'Nhân viên kinh doanh',
    affiliate: 'Cộng tác viên'
  };
  return roleMap[role] || role;
};

export const formatEmployeeStatus = (status: Employee['status']): string => {
  return status === 'active' ? 'Hoạt động' : 'Không hoạt động';
};

// Employee API Service
class EmployeeApiService {
  private baseUrl = '/employees';

  /**
   * Get paginated list of employees with filters
   */
  async getEmployees(filters: EmployeeFilters = {}): Promise<PaginatedEmployees> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.role) params.append('role', filters.role);
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const url = `${this.baseUrl}${params.toString() ? `?${params}` : ''}`;
    const response = await apiClient.get<ApiResponse<PaginatedEmployees>>(url);
    
    if (!response.data.success || response.data.data === undefined) {
      throw new Error(response.data.message || 'Không thể tải danh sách nhân viên');
    }
    
    return response.data.data;
  }

  /**
   * Get list of active employees
   */
  async getActiveEmployees(): Promise<Employee[]> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Employee>>>(`${this.baseUrl}?status=active&limit=100`);

    if (!response.data.success || response.data.data === undefined) {
      throw new Error(response.data.message || 'Không thể tải danh sách nhân viên');
    }

    return response.data.data.data;
  }

  /**
   * Get employee by ID
   */
  async getEmployee(id: number): Promise<Employee> {
    const response = await apiClient.get<ApiResponse<Employee>>(`${this.baseUrl}/${id}`);
    
    if (!response.data.success || response.data.data === undefined) {
      throw new Error(response.data.message || 'Không thể tải thông tin nhân viên');
    }
    
    return response.data.data;
  }

  /**
   * Create new employee
   */
  async createEmployee(data: EmployeeFormData): Promise<Employee> {
    // Validate data
    const errors = validateEmployee(data);
    if (Object.keys(errors).length > 0) {
      throw new Error(`Dữ liệu không hợp lệ: ${Object.values(errors).join(', ')}`);
    }

    const response = await apiClient.post<ApiResponse<Employee>>(this.baseUrl, data);
    
    if (!response.data.success || response.data.data === undefined) {
      throw new Error(response.data.message || 'Không thể tạo nhân viên');
    }
    
    return response.data.data;
  }

  /**
   * Update employee
   */
  async updateEmployee(id: number, data: Partial<EmployeeFormData>): Promise<Employee> {
    // Validate data
    const errors = validateEmployee(data);
    if (Object.keys(errors).length > 0) {
      throw new Error(`Dữ liệu không hợp lệ: ${Object.values(errors).join(', ')}`);
    }

    const response = await apiClient.put<ApiResponse<Employee>>(`${this.baseUrl}/${id}`, data);
    
    if (!response.data.success || response.data.data === undefined) {
      throw new Error(response.data.message || 'Không thể cập nhật nhân viên');
    }
    
    return response.data.data;
  }

  /**
   * Delete employee (soft delete)
   */
  async deleteEmployee(id: number): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Không thể xóa nhân viên');
    }
  }

  /**
   * Get employee statistics
   */
  async getEmployeeStats(): Promise<EmployeeStats> {
    const response = await apiClient.get<ApiResponse<EmployeeStats>>(`${this.baseUrl}/stats`);
    
    if (!response.data.success || response.data.data === undefined) {
      throw new Error(response.data.message || 'Không thể tải thống kê nhân viên');
    }
    
    return response.data.data;
  }

  /**
   * Bulk update employee status
   */
  async bulkUpdateStatus(employeeIds: number[], status: Employee['status']): Promise<void> {
    const response = await apiClient.post<ApiResponse<void>>(`${this.baseUrl}/bulk-status`, {
      employee_ids: employeeIds,
      status
    });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Không thể cập nhật trạng thái nhân viên');
    }
  }

  /**
   * Check if email exists
   */
  async checkEmailExists(email: string, excludeId?: number): Promise<boolean> {
    const params = new URLSearchParams({ email });
    if (excludeId) params.append('exclude_id', excludeId.toString());
    
    const response = await apiClient.get<ApiResponse<{ exists: boolean }>>(`${this.baseUrl}/check-email?${params}`);
    
    if (!response.data.success || response.data.data === undefined) {
      return false; // Assume doesn't exist on error
    }
    
    return response.data.data.exists;
  }
}

export const employeeApi = new EmployeeApiService();
export default employeeApi;
