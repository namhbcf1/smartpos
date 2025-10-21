/**
 * Enterprise Store Access Middleware
 *
 * Comprehensive store access control cho ComputerPOS Pro
 * Tuân thủ 100% rules.md với advanced permission system
 */

import { Context, Next } from 'hono';
import { HonoEnv, ApiResponse } from '../types';

// Store permission levels
export enum StorePermissionLevel {
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin',
  OWNER = 'owner'
}

// Store access result interface
interface StoreAccessResult {
  store_id: number;
  store_name: string;
  permissions: string[];
  access_level: StorePermissionLevel;
  features_enabled: string[];
  restrictions: string[];
  business_hours: {
    start: string;
    end: string;
    is_open: boolean;
  };
  settings: Record<string, any>;
}

/**
 * Enterprise-level store access control with comprehensive permissions
 */
export const storeAccess = async (c: Context<HonoEnv>, next: Next) => {
  const startTime = Date.now();
  try {
    // Get user from authentication context
    const user = c.get('user');
    const jwtPayload = c.get('jwtPayload');

    if (!user || !jwtPayload) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Không có thông tin xác thực người dùng'
      }, 401);
    }

    // Determine target store (from user context or request)
    const requestedStoreId = c.req.query('store_id') ?
      parseInt(c.req.query('store_id')!) :
      Number(user.store_id);

    // Validate store access permissions
    const storeAccess = await validateStoreAccess(c.env, Number(user.id), requestedStoreId);

    if (!storeAccess.hasAccess) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: `Không có quyền truy cập cửa hàng ${requestedStoreId}`
      }, 403);
    }

    // Get comprehensive store information
    const storeInfo = await getStoreInformation(c.env, requestedStoreId);

    if (!storeInfo) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Cửa hàng không tồn tại'
      }, 404);
    }

    // Check business hours and operational status
    const businessHours = await checkBusinessHours(c.env, requestedStoreId);

    // Determine user permissions for this store
    const permissions = await getUserStorePermissions(c.env, Number(user.id), requestedStoreId, user.role);

    // Get enabled features for this store
    const featuresEnabled = await getStoreFeatures(c.env, requestedStoreId);

    // Check for any restrictions
    const restrictions = await getStoreRestrictions(c.env, requestedStoreId, Number(user.id));

    // Get store-specific settings
    const storeSettings = await getStoreSettings(c.env, requestedStoreId);

    // Create comprehensive store access result
    const accessResult: StoreAccessResult = {
      store_id: requestedStoreId,
      store_name: storeInfo.name,
      permissions: permissions,
      access_level: determineAccessLevel(permissions, user.role),
      features_enabled: featuresEnabled,
      restrictions: restrictions,
      business_hours: businessHours,
      settings: storeSettings
    };

    // Set comprehensive context variables
    c.set('store_id', requestedStoreId);
    c.set('store_name', storeInfo.name);
    c.set('store_permissions', permissions);
    c.set('jwtPayload', accessResult.access_level as any);
    c.set('features', Object.fromEntries(featuresEnabled.map(f => [f, true])));
    c.set('business_date', new Date().toISOString().split('T')[0]);
    c.set('timezone', storeSettings.timezone || 'Asia/Ho_Chi_Minh');
    c.set('currency', storeSettings.currency || 'VND');
    c.set('tax_rate', parseFloat(storeSettings.tax_rate || '0.1'));

    // Log store access for audit
    await logStoreAccess(c.env, {
      user_id: Number(user.id),
      store_id: requestedStoreId,
      access_time: new Date().toISOString(),
      ip_address: c.req.header('cf-connecting-ip') || 'unknown',
      user_agent: c.req.header('user-agent') || 'unknown',
      permissions: permissions,
      access_level: accessResult.access_level
    });

    // Performance monitoring
    c.set('jwtPayload', Date.now() - startTime as any);

    await next();
  } catch (error) {
    console.error('Store access middleware error:', error);
    return c.json<ApiResponse<null>>({
      success: false,
      data: null,
      message: 'Lỗi kiểm tra quyền truy cập cửa hàng'
    }, 500);
  }
};

/**
 * Validate if user has access to specific store
 */
async function validateStoreAccess(env: any, userId: number, storeId: number): Promise<{ hasAccess: boolean; reason?: string }> {
  try {
    // Check if user exists and is active
    const user = await env.DB.prepare(
      'SELECT id, is_active, store_id, role FROM users WHERE id = ?'
    ).bind(userId).first();
    if (!user || !user.is_active) {
      return { hasAccess: false, reason: 'User not found or inactive' };
    }

    // Admin users can access any store
    if (user.role === 'admin') {
      return { hasAccess: true };
    }

    // Check if user belongs to the store or has explicit permission
    const storeAccess = await env.DB.prepare(`
      SELECT 1 FROM user_store_access
      WHERE user_id = ? AND store_id = ? AND is_active = 1
      UNION
      SELECT 1 FROM users WHERE id = ? AND store_id = ?
    `).bind(userId, storeId, userId, storeId).first();
    return { hasAccess: !!storeAccess };
  } catch (error) {
    console.error('Store access validation error:', error);
    return { hasAccess: false, reason: 'Validation error' };
  }
}

/**
 * Get comprehensive store information
 */
async function getStoreInformation(env: any, storeId: number) {
  try {
    const store = await env.DB.prepare(`
      SELECT id, name, address, phone, email, tax_number, is_active,
             business_hours_start, business_hours_end, timezone
      FROM stores WHERE id = ? AND is_active = 1
    `).bind(storeId).first();
    return store;
  } catch (error) {
    console.error('Get store information error:', error);
    return null;
  }
}

/**
 * Check business hours and operational status
 */
async function checkBusinessHours(env: any, storeId: number) {
  try {
    const store = await env.DB.prepare(
      'SELECT business_hours_start, business_hours_end, timezone FROM stores WHERE id = ?'
    ).bind(storeId).first();
    if (!store) {
      return { start: '08:00', end: '18:00', is_open: true };
    }

    const now = new Date();
    const currentHour = now.getHours();
    const startHour = parseInt(store.business_hours_start || '8');
    const endHour = parseInt(store.business_hours_end || '18');

    const isOpen = currentHour >= startHour && currentHour < endHour;

    return {
      start: store.business_hours_start || '08:00',
      end: store.business_hours_end || '18:00',
      is_open: isOpen
    };
  } catch (error) {
    console.error('Business hours check error:', error);
    return { start: '08:00', end: '18:00', is_open: true };
  }
}

/**
 * Get user permissions for specific store
 */
async function getUserStorePermissions(env: any, userId: number, storeId: number, userRole: string): Promise<string[]> {
  try {
    const basePermissions = getBasePermissionsByRole(userRole);

    // Get additional permissions from database
    const additionalPerms = await env.DB.prepare(`
      SELECT permission FROM user_permissions
      WHERE user_id = ? AND store_id = ? AND is_active = 1
    `).bind(userId, storeId).all();
    const dbPermissions = additionalPerms.results.map((p: any) => p.permission);

    return [...new Set([...basePermissions, ...dbPermissions])];
  } catch (error) {
    console.error('Get user permissions error:', error);
    return getBasePermissionsByRole(userRole);
  }
}

/**
 * Get base permissions by user role
 */
function getBasePermissionsByRole(role: string): string[] {
  const rolePermissions: Record<string, string[]> = {
    admin: [
      'store.read', 'store.write', 'store.admin',
      'products.read', 'products.write', 'products.admin',
      'sales.read', 'sales.write', 'sales.admin',
      'inventory.read', 'inventory.write', 'inventory.admin',
      'users.read', 'users.write', 'users.admin',
      'reports.read', 'reports.admin',
      'settings.read', 'settings.write'
    ],
    manager: [
      'store.read', 'store.write',
      'products.read', 'products.write',
      'sales.read', 'sales.write',
      'inventory.read', 'inventory.write',
      'users.read',
      'reports.read'
    ],
    cashier: [
      'store.read',
      'products.read', 'products.write',  // Thu ngân có thể sửa đổi sản phẩm
      'sales.read', 'sales.write',
      'returns.read', 'returns.write',
      'customers.read', 'customers.write'
    ],
    sales_agent: [
      'store.read',
      'products.read',  // Chỉ xem sản phẩm, không sửa đổi
      'sales.read', 'sales.write',
      'returns.read', 'returns.write',
      'warranty.read', 'warranty.write',
      'customers.read', 'customers.write'
    ],
    affiliate: [
      'store.read',
      'products.read',  // Chỉ xem sản phẩm, không sửa đổi
      'sales.read', 'sales.write',
      'returns.read', 'returns.write',
      'warranty.read', 'warranty.write',
      'customers.read', 'customers.write'
    ],
    inventory: [
      'store.read',
      'products.read', 'products.write',
      'inventory.read', 'inventory.write'
    ]
  };

  return rolePermissions[role] || ['store.read'];
}

/**
 * Get enabled features for store
 */
async function getStoreFeatures(env: any, storeId: number): Promise<string[]> {
  try {
    const features = await env.DB.prepare(`
      SELECT feature_name FROM store_features
      WHERE store_id = ? AND is_enabled = 1
    `).bind(storeId).all();
    const enabledFeatures = features.results.map((f: any) => f.feature_name);

    // Default features if none configured
    if (enabledFeatures.length === 0) {
      return [
        'pos_system',
        'inventory_management',
        'sales_reporting',
        'customer_management',
        'barcode_scanning'
      ];
    }

    return enabledFeatures;
  } catch (error) {
    console.error('Get store features error:', error);
    return ['pos_system', 'inventory_management'];
  }
}

/**
 * Get store restrictions for user
 */
async function getStoreRestrictions(env: any, storeId: number, userId: number): Promise<string[]> {
  try {
    const restrictions = await env.DB.prepare(`
      SELECT restriction_type FROM user_restrictions
      WHERE user_id = ? AND store_id = ? AND is_active = 1
    `).bind(userId, storeId).all();
    return restrictions.results.map((r: any) => r.restriction_type);
  } catch (error) {
    console.error('Get store restrictions error:', error);
    return [];
  }
}

/**
 * Get store-specific settings
 */
async function getStoreSettings(env: any, storeId: number): Promise {
  try {
    const settings = await env.DB.prepare(`
      SELECT setting_key, setting_value FROM store_settings
      WHERE store_id = ? OR store_id IS NULL
      ORDER BY store_id DESC
    `).bind(storeId).all();
    const settingsMap: Record<string, any> = { /* No operation */ }
    settings.results.forEach((setting: any) => {
      settingsMap[setting.setting_key] = setting.setting_value;
    });

    // Default settings
    return {
      timezone: 'Asia/Ho_Chi_Minh',
      currency: 'VND',
      tax_rate: '0.1',
      language: 'vi',
      date_format: 'DD/MM/YYYY',
      time_format: '24h',
      decimal_places: 0,
      ...settingsMap
    };
  } catch (error) {
    console.error('Get store settings error:', error);
    return {
      timezone: 'Asia/Ho_Chi_Minh',
      currency: 'VND',
      tax_rate: '0.1',
      language: 'vi'
    };
  }
}

/**
 * Determine access level based on permissions and role
 */
function determineAccessLevel(permissions: string[], role: string): StorePermissionLevel {
  if (role === 'admin' || permissions.includes('store.admin')) {
    return StorePermissionLevel.ADMIN;
  } else if (permissions.includes('store.write')) {
    return StorePermissionLevel.WRITE;
  } else {
    return StorePermissionLevel.READ;
  }
}

/**
 * Log store access for audit purposes
 */
async function logStoreAccess(env: any, accessData: {
  user_id: number;
  store_id: number;
  access_time: string;
  ip_address: string;
  user_agent: string;
  permissions: string[];
  access_level: StorePermissionLevel;
}) {
  try {
    await env.DB.prepare(`
      INSERT INTO store_access_logs (
        user_id, store_id, access_time, ip_address, user_agent,
        permissions, access_level, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      accessData.user_id,
      accessData.store_id,
      accessData.access_time,
      accessData.ip_address,
      accessData.user_agent,
      JSON.stringify(accessData.permissions),
      accessData.access_level
    ).run();
  } catch (error) {
    // Don't fail the request if logging fails
    console.error('Store access logging error:', error);
  }
}

/**
 * Permission checking helper for routes
 */
export const requirePermission = (permission: string) => {
  return async (c: Context<HonoEnv>, next: Next) => {
    const permissions = c.get('store_permissions') || [];

    if (!permissions.includes(permission)) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: `Không có quyền: ${permission}`
      }, 403);
    }

    await next();
  };
};

/**
 * Feature checking helper for routes
 */
export const requireFeature = (feature: string) => {
  return async (c: Context<HonoEnv>, next: Next) => {
    const features = c.get('features') || { /* No operation */ }
    if (!features[feature]) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: `Tính năng không được kích hoạt: ${feature}`
      }, 403);
    }

    await next();
  };
};
