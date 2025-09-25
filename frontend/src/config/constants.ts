// Layout constants
export const drawerWidth = 240;

// API endpoints - Updated to remove /api prefix (backend adds it automatically)
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/simple-login',
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
    OVERVIEW: '/inventory-advanced/overview',
    ITEMS: '/inventory-advanced/items',
    STATS: '/inventory-advanced/stats',
    ALERTS: '/inventory-advanced/alerts',
    MOVEMENT: '/inventory-advanced/movement',
    MOVEMENTS: '/inventory-advanced/movements',
    FORECASTING: '/inventory-advanced/forecasting',
    OPTIMIZATION: '/inventory-advanced/optimization',
    VALUATION: '/inventory-advanced/valuation',
    TURNOVER: '/inventory-advanced/turnover'
  },

  // Advanced Analytics
  ANALYTICS_ADVANCED: {
    DASHBOARD: '/analytics-advanced/dashboard',
    SALES_ANALYTICS: '/analytics-advanced/sales',
    PRODUCT_ANALYTICS: '/analytics-advanced/products',
    CUSTOMER_ANALYTICS: '/analytics-advanced/customers',
    FINANCIAL_ANALYTICS: '/analytics-advanced/financial',
    PERFORMANCE_METRICS: '/analytics-advanced/performance',
    TRENDS: '/analytics-advanced/trends',
    FORECASTING: '/analytics-advanced/forecasting',
    REPORTS: '/analytics-advanced/reports'
  },

  // User Management
  USER_MANAGEMENT: {
    USERS: '/user-management/users',
    ROLES: '/user-management/roles',
    PERMISSIONS: '/user-management/permissions',
    ACTIVITIES: '/user-management/activities',
    SESSIONS: '/user-management/sessions',
    BULK_ACTIONS: '/user-management/bulk-actions'
  },

  // Database Optimization
  DATABASE_OPTIMIZATION: {
    HEALTH: '/database-optimization/health',
    PERFORMANCE: '/database-optimization/performance',
    CLEANUP: '/database-optimization/cleanup',
    INDEXES: '/database-optimization/indexes',
    ANALYZE: '/database-optimization/analyze',
    EXPLAIN: '/database-optimization/explain'
  },

  // Real-time and WebSocket
  REALTIME: {
    NOTIFICATIONS: '/realtime-notifications',
    STREAM: '/realtime-notifications/stream',
    WEBSOCKET: '/ws'
  },

  // Enhanced Features
  ENHANCED_INVENTORY: '/enhanced-inventory',
  BUSINESS_INTELLIGENCE: '/business-intelligence',
  SYSTEM_MONITORING: '/system-monitoring',

  // Warranty and Serial Numbers
  SERIAL_NUMBERS: '/serial-numbers',
  WARRANTY: '/warranty',
  ADVANCED_WARRANTY: '/advanced-warranty',

  // Financial
  FINANCIAL: '/financial',
  PAYMENTS: '/payments',
  POS_PAYMENT: '/pos-payment'
};

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Vietnamese currency formatter - D1 optimized (expects cents)
export const formatCurrency = (amountInCents: number | null | undefined): string => {
  // Handle null, undefined, or NaN values
  if (amountInCents == null || isNaN(amountInCents)) {
    return '0 ₫';
  }

  // Convert cents to VND (divide by 100)
  const amountInVND = Math.round(amountInCents / 100);

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountInVND);
};

// Legacy currency formatter for backward compatibility (expects VND)
export const formatCurrencyVND = (amount: number | null | undefined): string => {
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