// Online-only API client for ComputerPOS Pro
import axios from 'axios';

// Get API URL from environment or use production default
const getApiUrl = () => {
  // Check for environment variable first
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Production URL - your actual worker URL
  if (import.meta.env.PROD) {
    return 'https://pos-backend-bangachieu2.bangachieu2.workers.dev';
  }

  // Development URL is disabled per policy (no localhost). Fallback to same as production.
  return 'https://pos-backend-bangachieu2.bangachieu2.workers.dev';
};

const apiClient = axios.create({
  baseURL: `${getApiUrl()}/api/v1`,
  timeout: 30000, // Increased timeout for Cloudflare Workers
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Enable credentials for cross-origin cookie authentication
});

// Request interceptor - yêu cầu online
apiClient.interceptors.request.use((config) => {
  if (!navigator.onLine) {
    throw new Error('Không có kết nối internet. Vui lòng kiểm tra kết nối.');
  }

  // Get token from secure cookie (set by backend)
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('auth_token='))
    ?.split('=')[1];
  if (token) {
    config.headers = config.headers ?? {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  // Add request ID for tracking
  config.headers['X-Request-ID'] = crypto.randomUUID();

  return config;
});

// Rate limiting for auth endpoints
let authRequestCount = 0;
let lastAuthRequest = 0;
const AUTH_RATE_LIMIT = 5; // Max 5 requests
const AUTH_RATE_WINDOW = 10000; // Per 10 seconds

// Response interceptor - xử lý lỗi mạng và authentication
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!navigator.onLine) {
      throw new Error('Mất kết nối internet. Vui lòng thử lại.');
    }

    // Handle authentication errors - NO AUTO REDIRECTS
    if (error.response?.status === 401) {
      console.log('❌ 401 Unauthorized - No auto redirect');

      // Clear auth cookie on unauthorized
      document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      // No localStorage usage - security compliance

      // DO NOT AUTO REDIRECT - Let components handle this manually
      // This prevents infinite loops
    }

    // Handle rate limiting
    if (error.response?.status === 429) {
      throw new Error('Quá nhiều yêu cầu. Vui lòng thử lại sau.');
    }

    // Handle server errors
    if (error.response?.status >= 500) {
      throw new Error('Lỗi server. Vui lòng thử lại sau.');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
