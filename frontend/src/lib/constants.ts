// SmartPOS Constants

export const APP_CONFIG = {
  NAME: 'SmartPOS',
  VERSION: '1.0.0',
  DESCRIPTION: 'Smart Point of Sale System',
} as const;

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  PROFILE: '/auth/profile',
  
  // Products
  PRODUCTS: '/products',
  PRODUCT_DETAIL: (id: string | number) => `/products/${id}`,
  PRODUCT_CATEGORIES: '/categories',
  
  // Orders
  ORDERS: '/orders',
  ORDER_DETAIL: (id: string | number) => `/orders/${id}`,
  ORDER_STATUS: (id: string | number) => `/orders/${id}/status`,
  
  // Customers
  CUSTOMERS: '/customers',
  CUSTOMER_DETAIL: (id: string | number) => `/customers/${id}`,
  
  // Inventory
  INVENTORY: '/inventory',
  STOCK_ADJUSTMENT: '/inventory/adjustments',
  STOCK_TRANSFER: '/inventory/transfers',
  
  // Reports
  SALES_REPORT: '/reports/sales',
  INVENTORY_REPORT: '/reports/inventory',
  CUSTOMER_REPORT: '/reports/customers',
  
  // Settings
  SETTINGS: '/settings',
  STORE_SETTINGS: '/settings/store',
  USER_SETTINGS: '/settings/user',
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  
  // Products
  PRODUCTS: '/products',
  PRODUCT_DETAIL: (id: string | number) => `/products/${id}`,
  
  // Orders
  ORDERS: '/orders',
  ORDER_DETAIL: (id: string | number) => `/orders/${id}`,
  
  // Customers
  CUSTOMERS: '/customers',
  CUSTOMER_DETAIL: (id: string | number) => `/customers/${id}`,
  
  // Inventory
  INVENTORY: '/inventory',
  STOCK_ADJUSTMENT: '/inventory/adjustments',
  
  // Reports
  REPORTS: '/reports',
  SALES_REPORT: '/reports/sales',
  
  // Settings
  SETTINGS: '/settings',
} as const;

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
  CASHIER: 'CASHIER',
} as const;

export const ORDER_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  BANK_TRANSFER: 'bank_transfer',
  QR_CODE: 'qr_code',
} as const;

export const PERMISSIONS = {
  // Products
  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_EDIT: 'products.edit',
  PRODUCTS_DELETE: 'products.delete',
  
  // Orders
  ORDERS_VIEW: 'orders.view',
  ORDERS_CREATE: 'orders.create',
  ORDERS_EDIT: 'orders.edit',
  ORDERS_DELETE: 'orders.delete',
  
  // Customers
  CUSTOMERS_VIEW: 'customers.view',
  CUSTOMERS_CREATE: 'customers.create',
  CUSTOMERS_EDIT: 'customers.edit',
  CUSTOMERS_DELETE: 'customers.delete',
  
  // Inventory
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_ADJUST: 'inventory.adjust',
  INVENTORY_TRANSFER: 'inventory.transfer',
  
  // Reports
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',
  
  // Settings
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_EDIT: 'settings.edit',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  DISPLAY_WITH_TIME: 'DD/MM/YYYY HH:mm',
  API: 'YYYY-MM-DD',
  API_WITH_TIME: 'YYYY-MM-DD HH:mm:ss',
} as const;

export const CURRENCY = {
  SYMBOL: '₫',
  CODE: 'VND',
  DECIMAL_PLACES: 0,
} as const;

export const TOAST_DURATION = {
  SUCCESS: 3000,
  ERROR: 5000,
  WARNING: 4000,
  INFO: 3000,
} as const;

export const VALIDATION_RULES = {
  REQUIRED: 'Trường này là bắt buộc',
  EMAIL: 'Email không hợp lệ',
  PHONE: 'Số điện thoại không hợp lệ',
  MIN_LENGTH: (min: number) => `Tối thiểu ${min} ký tự`,
  MAX_LENGTH: (max: number) => `Tối đa ${max} ký tự`,
  MIN_VALUE: (min: number) => `Giá trị tối thiểu là ${min}`,
  MAX_VALUE: (max: number) => `Giá trị tối đa là ${max}`,
} as const;

export const THEME_COLORS = {
  PRIMARY: '#1976d2',
  SECONDARY: '#dc004e',
  SUCCESS: '#2e7d32',
  WARNING: '#ed6c02',
  ERROR: '#d32f2f',
  INFO: '#0288d1',
} as const;
