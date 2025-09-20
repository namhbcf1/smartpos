// Production API client for ComputerPOS Pro - 100% Real-time D1 Cloudflare
import axios from 'axios';

// Production API URL - use VITE_API_BASE_URL from env (do NOT append /api/v1 here).
// We will normalize the path in the request interceptor to avoid double-prefix issues.
const RAW_API_URL = import.meta.env.VITE_API_BASE_URL || 'https://namhbcf-api.bangachieu2.workers.dev';
const API_BASE_URL = RAW_API_URL.replace(/\/$/, '');

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 30000, // 30 seconds timeout for Cloudflare Workers
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  },
  withCredentials: true, // Enable credentials for cross-origin cookie authentication
});

// Removed unused session id helper to satisfy linter

// Request interceptor - Ensure online connection only
apiClient.interceptors.request.use((config) => {
  // Check for internet connection
  if (!navigator.onLine) {
    throw new Error('Không có kết nối internet. Vui lòng kiểm tra kết nối mạng.');
  }

  // Get authentication token from sessionStorage or cookie (JWT only)
  let token = sessionStorage.getItem('auth_token');
  if (!token) {
    token = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth_token='))
      ?.split('=')[1] || null;
  }
  // Enforce JWT format
  if (token && token.split('.').length !== 3) {
    token = null as any;
  }
  
  if (token) {
    config.headers = config.headers ?? {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  // Always send browser timezone
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  config.headers = config.headers ?? {};
  config.headers['X-Timezone'] = tz;

  // Remove X-Session-ID header to avoid CORS issues  
  // const sessionId = getOrCreateSessionId();
  // config.headers['X-Session-ID'] = sessionId;

  // Optional tenant header if stored by app (supports multi-tenant)
  const tenantId = sessionStorage.getItem('tenant_id') || localStorage.getItem('tenant_id');
  if (tenantId) {
    config.headers['X-Tenant-ID'] = tenantId;
  }

  // baseURL already includes /api/v1, no need to modify the URL

  return config;
});

// Response interceptor - Handle errors and authentication
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check for network connectivity
    if (!navigator.onLine) {
      throw new Error('Mất kết nối internet. Vui lòng thử lại sau.');
    }

    // Handle authentication errors
    if (error.response?.status === 401) {
      // Try to get fresh token first before clearing
      const freshToken = sessionStorage.getItem('auth_token');
      if (freshToken && error.config && !error.config.__isRetry) {
        // Mark this request as retry to prevent infinite loops
        error.config.__isRetry = true;
        // Update headers with fresh token
        error.config.headers['Authorization'] = `Bearer ${freshToken}`;
        // Retry the request
        return apiClient.request(error.config);
      }
      // Only clear token if retry fails or no fresh token
      sessionStorage.removeItem('auth_token');
      document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      // Let components handle redirect manually
    }

    // Handle rate limiting
    if (error.response?.status === 429) {
      throw new Error('Quá nhiều yêu cầu. Vui lòng thử lại sau.');
    }

    // Handle server errors
    if (error.response?.status >= 500) {
      throw new Error('Lỗi server. Vui lòng thử lại sau.');
    }

    // Handle network errors - return a structured error response
    if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK' ||
        error.message?.includes('Lỗi kết nối mạng') ||
        error.message?.includes('ERR_CONNECTION_CLOSED')) {
      // Return a structured error response instead of throwing
      return {
        data: {
          success: false,
          error: 'Network error',
          message: 'Connection failed'
        }
      };
    }

    // Handle 404 errors - return a structured error response
    if (error.response?.status === 404) {
      // Return a structured error response instead of throwing
      return {
        data: {
          success: false,
          error: 'Not found',
          message: error.response?.data?.message || 'Resource not found'
        }
      };
    }

    // For other errors, still reject
    return Promise.reject(error);
  }
);

export default apiClient;
