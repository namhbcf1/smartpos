// Production API client for ComputerPOS Pro - 100% Real-time D1 Cloudflare
import axios from 'axios';

// Production API URL - use VITE_API_BASE_URL from env.
// We will normalize the path in the request interceptor to avoid double-prefix issues.
const RAW_API_URL = import.meta.env.VITE_API_BASE_URL || 'https://namhbcf-api.bangachieu2.workers.dev';
const API_BASE_URL = RAW_API_URL.replace(/\/$/, '');

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000, // 30 seconds timeout for Cloudflare Workers
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  },
  withCredentials: true, // Enable credentials for cross-origin cookie authentication
});

// Removed unused session id helper to satisfy linter

// Helper: resolve auth token from multiple sources consistently
function resolveAuthToken(): string | null {
  try {
    let token: string | null = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || null;
    if (!token) {
      try {
        token = document.cookie
          .split('; ')
          .find(row => row.startsWith('auth_token='))
          ?.split('=')[1] || null;
      } catch {}
    }
    if (!token && (window as any)?.SMARTPOS_TOKEN) {
      token = (window as any).SMARTPOS_TOKEN;
    }
    if (!token) return null;

    // Normalize quotes and Bearer prefix
    if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
      token = token.slice(1, -1);
    }
    if (token.startsWith('Bearer ')) {
      token = token.substring(7);
    }

    token = token.trim();
    const parts = token.split('.');
    if (parts.length !== 3 || token.length < 20) {
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

// Request interceptor - Ensure online connection only
apiClient.interceptors.request.use((config: any) => {
  // Check for internet connection
  if (!navigator.onLine) {
    throw new Error('Không có kết nối internet. Vui lòng kiểm tra kết nối mạng.');
  }

  // Get authentication token from unified resolver
  const token = resolveAuthToken();

  console.log(`🔧 CLIENT INTERCEPTOR: Token found: ${!!token}, URL: ${config.url}`);

  if (token) {
    // Ensure headers object exists and set Authorization
    if (!config.headers) {
      config.headers = {} as any;
    }
    (config.headers as any)['Authorization'] = `Bearer ${token}`;

    // Verify the header was set
    const authHeader = (config.headers as any)['Authorization'];
    const authHeaderPreview = String(authHeader ?? '').substring(0, 20);
    console.log(`✅ CLIENT INTERCEPTOR: Authorization header set for ${config.url}`);
    console.log(`🔍 HEADER VERIFY: ${authHeaderPreview}...`);
  } else {
    console.log(`❌ CLIENT INTERCEPTOR: No token available for ${config.url}`);
  }

  // Always send browser timezone (but don't override existing headers)
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  if (!config.headers) {
    config.headers = {} as any;
  }
  (config.headers as any)['X-Timezone'] = tz;

  // Remove X-Session-ID header to avoid CORS issues  
  // const sessionId = getOrCreateSessionId();
  // config.headers['X-Session-ID'] = sessionId;

  // Optional tenant header if stored by app (supports multi-tenant)
  const tenantId = sessionStorage.getItem('tenant_id') || localStorage.getItem('tenant_id');
  if (tenantId) {
    (config.headers as any)['X-Tenant-ID'] = tenantId;
  }

  // baseURL already includes /api, no need to modify the URL

  return config;
});

// Response interceptor - Handle errors and authentication
apiClient.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    // Check for network connectivity
    if (!navigator.onLine) {
      throw new Error('Mất kết nối internet. Vui lòng thử lại sau.');
    }

    // Handle authentication errors
    if (error.response?.status === 401) {
      console.log(`🔴 RESPONSE INTERCEPTOR: 401 error for ${error.config?.url}`);
      console.log(`🔍 REQUEST HEADERS:`, error.config?.headers);

      // Only clear tokens if we actually sent an Authorization header
      const sentAuthHeader = error.config?.headers?.['Authorization'];
      console.log(`🔍 SENT AUTH HEADER: ${sentAuthHeader ? 'YES' : 'NO'}`);

      if (sentAuthHeader) {
        console.log(`🗑️ RESPONSE DEBUG: Clearing tokens - server rejected valid auth header`);
        sessionStorage.removeItem('auth_token');
        document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      } else {
        console.log(`⚠️ RESPONSE DEBUG: 401 but no auth header sent - keeping token`);
      }
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
