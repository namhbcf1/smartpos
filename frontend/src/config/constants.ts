// Layout constants
export const drawerWidth = 240;

// API endpoints - Updated to include all advanced endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  USER: '/auth/me-fixed', // Using fixed endpoint that works
  REFRESH_TOKEN: '/auth/refresh-token',

  // Basic endpoints
  PRODUCTS: '/products',
  CATEGORIES: '/categories',
  SALES: '/sales',
  USERS: '/users',
  SETTINGS: '/settings',
  REPORTS: '/reports',
  INVENTORY: '/inventory',

  // Advanced Inventory Management
  INVENTORY_ADVANCED: {
    OVERVIEW: '/api/v1/inventory-advanced/overview',
    ITEMS: '/api/v1/inventory-advanced/items',
    STATS: '/api/v1/inventory-advanced/stats',
    ALERTS: '/api/v1/inventory-advanced/alerts',
    MOVEMENT: '/api/v1/inventory-advanced/movement',
    MOVEMENTS: '/api/v1/inventory-advanced/movements',
    FORECASTING: '/api/v1/inventory-advanced/forecasting',
    OPTIMIZATION: '/api/v1/inventory-advanced/optimization',
    VALUATION: '/api/v1/inventory-advanced/valuation',
    TURNOVER: '/api/v1/inventory-advanced/turnover'
  },

  // Advanced Analytics
  ANALYTICS_ADVANCED: {
    DASHBOARD: '/api/v1/analytics-advanced/dashboard',
    SALES_ANALYTICS: '/api/v1/analytics-advanced/sales',
    PRODUCT_ANALYTICS: '/api/v1/analytics-advanced/products',
    CUSTOMER_ANALYTICS: '/api/v1/analytics-advanced/customers',
    FINANCIAL_ANALYTICS: '/api/v1/analytics-advanced/financial',
    PERFORMANCE_METRICS: '/api/v1/analytics-advanced/performance',
    TRENDS: '/api/v1/analytics-advanced/trends',
    FORECASTING: '/api/v1/analytics-advanced/forecasting',
    REPORTS: '/api/v1/analytics-advanced/reports'
  },

  // User Management
  USER_MANAGEMENT: {
    USERS: '/api/v1/user-management/users',
    ROLES: '/api/v1/user-management/roles',
    PERMISSIONS: '/api/v1/user-management/permissions',
    ACTIVITIES: '/api/v1/user-management/activities',
    SESSIONS: '/api/v1/user-management/sessions',
    BULK_ACTIONS: '/api/v1/user-management/bulk-actions'
  },

  // Database Optimization
  DATABASE_OPTIMIZATION: {
    HEALTH: '/api/v1/database-optimization/health',
    PERFORMANCE: '/api/v1/database-optimization/performance',
    CLEANUP: '/api/v1/database-optimization/cleanup',
    INDEXES: '/api/v1/database-optimization/indexes',
    ANALYZE: '/api/v1/database-optimization/analyze',
    EXPLAIN: '/api/v1/database-optimization/explain'
  },

  // Real-time and WebSocket
  REALTIME: {
    NOTIFICATIONS: '/api/v1/realtime-notifications',
    STREAM: '/api/v1/realtime-notifications/stream',
    WEBSOCKET: '/ws'
  },

  // Enhanced Features
  ENHANCED_INVENTORY: '/api/v1/enhanced-inventory',
  BUSINESS_INTELLIGENCE: '/api/v1/business-intelligence',
  SYSTEM_MONITORING: '/api/v1/system-monitoring',

  // Warranty and Serial Numbers
  SERIAL_NUMBERS: '/api/v1/serial-numbers',
  WARRANTY: '/api/v1/warranty',
  ADVANCED_WARRANTY: '/api/v1/advanced-warranty',

  // Financial
  FINANCIAL: '/api/v1/financial',
  PAYMENTS: '/api/v1/payments',
  POS_PAYMENT: '/api/v1/pos-payment'
};

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Vietnamese currency formatter
export const formatCurrency = (amount: number | null | undefined): string => {
  // Handle null, undefined, or NaN values
  if (amount == null || isNaN(amount)) {
    return '0 ₫';
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Date formatter
export const formatDate = (dateString: string | null | undefined): string => {
  // Handle null, undefined, or empty string
  if (!dateString) {
    return 'Chưa có thông tin';
  }

  const date = new Date(dateString);

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Ngày không hợp lệ';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Short date formatter (without time)
export const formatDateShort = (dateString: string | null | undefined): string => {
  if (!dateString) {
    return 'Chưa có';
  }

  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return 'Không hợp lệ';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

// Number formatter
export const formatNumber = (num: number | null | undefined): string => {
  if (num == null || isNaN(num)) {
    return '0';
  }

  return new Intl.NumberFormat('vi-VN').format(num);
};

// Payment method options - Vietnamese localization
export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Tiền mặt' },
  { value: 'card', label: 'Thẻ' },
  { value: 'bank_transfer', label: 'Chuyển khoản' },
  { value: 'mobile_payment', label: 'Ví điện tử' },
  { value: 'other', label: 'Khác' },
];

// Sale status options - Vietnamese localization
export const SALE_STATUS = [
  { value: 'completed', label: 'Hoàn thành', color: 'success' },
  { value: 'refunded', label: 'Đã hoàn tiền', color: 'error' },
  { value: 'partially_refunded', label: 'Hoàn tiền một phần', color: 'warning' },
  { value: 'cancelled', label: 'Đã hủy', color: 'error' },
] as const;

// Product status options - Vietnamese localization
export const PRODUCT_STATUS = [
  { value: 'active', label: 'Đang hoạt động', color: 'success' },
  { value: 'inactive', label: 'Ngừng hoạt động', color: 'default' },
  { value: 'out_of_stock', label: 'Hết hàng', color: 'error' },
] as const;

// User roles - Vietnamese localization
export const USER_ROLES = [
  { value: 'admin', label: 'Quản trị viên' },
  { value: 'manager', label: 'Quản lý' },
  { value: 'cashier', label: 'Thu ngân' },
  { value: 'staff', label: 'Nhân viên' },
] as const;

// Default tax rate (10%)
export const DEFAULT_TAX_RATE = 0.1; 