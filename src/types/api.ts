/**
 * API Response Types
 * 
 * Định nghĩa types cho API responses của ComputerPOS Pro
 * Tuân thủ 100% rules.md
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  errors?: any[];
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}
