import { Hono } from 'hono';
import { Env, ApiResponse } from '../types';
import { authenticate, authorize } from '../middleware/auth';

// Tạo router
const app = new Hono<{ Bindings: Env }>();

// API endpoints
app.get('/', authenticate, async (c) => {
  try {
    // Return default settings since settings table doesn't exist yet
    const settings = {
      // Business settings
      business_name: 'SmartPOS',
      business_address: '123 Main Street, Ho Chi Minh City',
      business_phone: '0123456789',
      business_email: 'info@smartpos.com',

      // System settings
      currency: 'VND',
      currency_symbol: '₫',
      tax_rate: 0.1,
      timezone: 'Asia/Ho_Chi_Minh',
      language: 'vi',

      // POS settings
      receipt_footer: 'Cảm ơn quý khách!',
      auto_print_receipt: true,
      enable_barcode_scanner: true,

      // Inventory settings
      low_stock_threshold: 10,
      enable_stock_alerts: true,

      // Feature flags
      enable_warranty_system: true,
      enable_employee_management: true,
      enable_debt_tracking: true,
      enable_mobile_pwa: true,
      enable_analytics: true
    };

    return c.json<ApiResponse<Record<string, any>>>({
      success: true,
      data: settings,
      message: 'Lấy cài đặt thành công'
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return c.json<ApiResponse<null>>({
      success: false,
      data: null,
      message: 'Lỗi khi lấy cài đặt'
    }, 500);
  }
});

export default app; 