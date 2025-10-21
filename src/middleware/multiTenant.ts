/**
 * Multi-tenant Architecture Middleware
 * Provides tenant isolation, data segregation, and tenant-specific customization
 */

import { Context, MiddlewareHandler, Next } from 'hono';
import { Env, ApiResponse } from '../types';

export interface Tenant {
  id: string;
  name: string;
  domain?: string;
  subdomain?: string;
  status: 'active' | 'suspended' | 'trial' | 'expired';
  subscription_tier: 'basic' | 'professional' | 'enterprise';
  created_at: string;
  updated_at: string;
  settings: TenantSettings;
  limits: TenantLimits;
}

export interface TenantSettings {
  locale: string;
  timezone: string;
  currency: string;
  date_format: string;
  number_format: string;
  tax_settings: {
    enabled: boolean;
    default_rate: number;
    inclusive: boolean;
  };
  branding: {
    logo_url?: string;
    primary_color: string;
    secondary_color: string;
    company_name: string;
  };
  features: {
    inventory_management: boolean;
    multi_location: boolean;
    advanced_reporting: boolean;
    api_access: boolean;
    custom_fields: boolean;
    integrations: boolean;
    mobile_app: boolean;
    webhook_notifications: boolean;
  };
  notifications: {
    email_enabled: boolean;
    sms_enabled: boolean;
    push_enabled: boolean;
    low_stock_threshold: number;
    daily_reports: boolean;
  };
}

export interface TenantLimits {
  max_users: number;
  max_products: number;
  max_orders_per_month: number;
  max_locations: number;
  max_storage_gb: number;
  max_api_requests_per_hour: number;
  max_webhook_endpoints: number;
}

export interface TenantContext {
  tenant: Tenant;
  isOwner: boolean;
  canManage: boolean;
  permissions: string[];
}

/**
 * Tenant resolution middleware - determines tenant from request
 */
export const resolveTenant: MiddlewareHandler<{
  Bindings: Env;
  Variables: {
    tenant?: Tenant;
    tenantId?: string;
    tenantContext?: TenantContext;
  };
}> = async (c, next) => {
  try {
    let tenantId: string | null = null;

    // 1. Try to get tenant from subdomain (e.g., tenant1.smartpos.com)
    const host = c.req.header('Host') || '';
    const subdomain = host.split('.')[0];

    if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
      tenantId = await getTenantBySubdomain(c.env, subdomain);
    }

    // 2. Try to get tenant from custom domain
    if (!tenantId) {
      tenantId = await getTenantByDomain(c.env, host);
    }

    // 3. Try to get tenant from header (for API access)
    if (!tenantId) {
      tenantId = c.req.header('X-Tenant-ID') || null;
    }

    // 4. Try to get tenant from path (e.g., /api/tenant/{tenantId}/...)
    if (!tenantId) {
      const pathParts = c.req.path.split('/');
      const tenantIndex = pathParts.findIndex(part => part === 'tenant');
      if (tenantIndex !== -1 && pathParts[tenantIndex + 1]) {
        tenantId = pathParts[tenantIndex + 1];
      }
    }

    // 5. Try to get tenant from JWT token (if authenticated)
    if (!tenantId) {
      const jwtPayload = c.get('jwtPayload');
      if (jwtPayload?.tenantId) {
        tenantId = jwtPayload.tenantId;
      }
    }

    // 6. Default to 'default' tenant for backwards compatibility
    if (!tenantId) {
      tenantId = 'default';
    }

    // Fetch tenant information
    const tenant = await getTenantById(c.env, tenantId);

    if (!tenant) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Tenant not found',
        error: 'TENANT_NOT_FOUND'
      }, 404);
    }

    // Check tenant status
    if (tenant.status === 'suspended') {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Tenant account is suspended',
        error: 'TENANT_SUSPENDED'
      }, 403);
    }

    if (tenant.status === 'expired') {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Tenant subscription has expired',
        error: 'TENANT_EXPIRED'
      }, 402);
    }

    // Set tenant context
    c.set('tenant', tenant);
    c.set('tenantId', tenantId);

    await next();
  } catch (error) {
    console.error('❌ Tenant resolution failed:', error);
    return c.json<ApiResponse<null>>({
      success: false,
      data: null,
      message: 'Tenant resolution failed',
      error: 'TENANT_RESOLUTION_ERROR'
    }, 500);
  }
};

/**
 * Tenant access control middleware
 */
export const tenantAccess: MiddlewareHandler<{
  Bindings: Env;
  Variables: {
    user?: any;
    tenant?: Tenant;
    tenantContext?: TenantContext;
  };
}> = async (c, next) => {
  const user = c.get('user');
  const tenant = c.get('tenant');

  if (!user || !tenant) {
    return c.json<ApiResponse<null>>({
      success: false,
      data: null,
      message: 'Authentication required',
      error: 'AUTH_REQUIRED'
    }, 401);
  }

  // Check if user belongs to this tenant
  const userTenants = await getUserTenants(c.env, user.id);
  const tenantAccess = userTenants.find(t => t.tenant_id === tenant.id);

  if (!tenantAccess) {
    return c.json<ApiResponse<null>>({
      success: false,
      data: null,
      message: 'Access denied to this tenant',
      error: 'TENANT_ACCESS_DENIED'
    }, 403);
  }

  // Set tenant context with permissions
  const tenantContext: TenantContext = {
    tenant,
    isOwner: tenantAccess.role === 'owner',
    canManage: ['owner', 'admin'].includes(tenantAccess.role),
    permissions: await getTenantPermissions(c.env, user.id, tenant.id)
  };

  c.set('tenantContext', tenantContext);

  await next();
};

/**
 * Feature access middleware - checks if tenant has access to specific features
 */
export const requireFeature = (feature: keyof TenantSettings['features']): MiddlewareHandler<{
  Bindings: Env;
  Variables: {
    tenant?: Tenant;
  };
}> => {
  return async (c, next) => {
    const tenant = c.get('tenant');

    if (!tenant) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Tenant context required',
        error: 'NO_TENANT_CONTEXT'
      }, 400);
    }

    if (!tenant.settings.features[feature]) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: `Feature '${feature}' not available in your subscription`,
        error: 'FEATURE_NOT_AVAILABLE'
      }, 403);
    }

    await next();
  };
};

/**
 * Rate limiting per tenant
 */
export const tenantRateLimit: MiddlewareHandler<{
  Bindings: Env;
  Variables: {
    tenant?: Tenant;
  };
}> = async (c, next) => {
  const tenant = c.get('tenant');

  if (!tenant) {
    await next();
    return;
  }

  const key = `rate_limit:${tenant.id}:${Math.floor(Date.now() / 3600000)}`; // per hour

  try {
    const current = await c.env.KV_CACHE?.get(key);
    const count = current ? parseInt(current) : 0;

    if (count >= tenant.limits.max_api_requests_per_hour) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'API rate limit exceeded for tenant',
        error: 'TENANT_RATE_LIMIT_EXCEEDED'
      }, 429);
    }

    // Increment counter
    await c.env.KV_CACHE?.put(key, (count + 1).toString(), { expirationTtl: 3600 });

    await next();
  } catch (error) {
    console.error('❌ Tenant rate limiting error:', error);
    await next(); // Continue on error
  }
};

/**
 * Database query helper with tenant isolation
 */
export function withTenantIsolation(c: Context, baseQuery: string): string {
  const tenantId = c.get('tenantId');

  // Add tenant_id WHERE clause to queries
  if (baseQuery.toLowerCase().includes('where')) {
    return baseQuery.replace(
      /where/i,
      `WHERE tenant_id = '${tenantId}' AND`
    );
  } else if (baseQuery.toLowerCase().includes('from')) {
    return baseQuery.replace(
      /(from\s+\w+)/i,
      `$1 WHERE tenant_id = '${tenantId}'`
    );
  }

  return baseQuery;
}

/**
 * Helper functions for tenant management
 */

async function getTenantBySubdomain(env: Env, subdomain: string): Promise<string | null> {
  try {
    const result = await env.DB.prepare(`
      SELECT id FROM tenants
      WHERE subdomain = ? AND status = 'active'
    `).bind(subdomain).first();
    return result?.id as string || null;
  } catch (error) {
    console.error('Error getting tenant by subdomain:', error);
    return null;
  }
}

async function getTenantByDomain(env: Env, domain: string): Promise<string | null> {
  try {
    const result = await env.DB.prepare(`
      SELECT id FROM tenants
      WHERE domain = ? AND status = 'active'
    `).bind(domain).first();
    return result?.id as string || null;
  } catch (error) {
    console.error('Error getting tenant by domain:', error);
    return null;
  }
}

async function getTenantById(env: Env, tenantId: string): Promise<Tenant | null> {
  try {
    const result = await env.DB.prepare(`
      SELECT * FROM tenants WHERE id = ?
    `).bind(tenantId).first();
    if (!result) {
      return null;
    }

    return {
      id: result.id as string,
      name: result.name as string,
      domain: result.domain as string,
      subdomain: result.subdomain as string,
      status: result.status as any,
      subscription_tier: result.subscription_tier as any,
      created_at: result.created_at as string,
      updated_at: result.updated_at as string,
      settings: JSON.parse(result.settings as string),
      limits: JSON.parse(result.limits as string)
    };
  } catch (error) {
    console.error('Error getting tenant by ID:', error);
    return null;
  }
}

async function getUserTenants(env: Env, userId: string): Promise<any[]> {
  try {
    const results = await env.DB.prepare(`
      SELECT ut.*, t.name as tenant_name
      FROM user_tenants ut
      JOIN tenants t ON ut.tenant_id = t.id
      WHERE ut.user_id = ? AND t.status = 'active'
    `).bind(userId).all();
    return results.results || [];
  } catch (error) {
    console.error('Error getting user tenants:', error);
    return [];
  }
}

async function getTenantPermissions(env: Env, userId: string, tenantId: string): Promise<string[]> {
  try {
    const results = await env.DB.prepare(`
      SELECT permission
      FROM tenant_user_permissions
      WHERE user_id = ? AND tenant_id = ?
    `).bind(userId, tenantId).all();
    return (results.results || []).map((r: any) => r.permission);
  } catch (error) {
    console.error('Error getting tenant permissions:', error);
    return [];
  }
}

/**
 * Tenant management service
 */
export class TenantService {
  constructor(private env: Env) { /* No operation */ }
  async createTenant(data: {
    name: string;
    subdomain?: string;
    domain?: string;
    owner_email: string;
    subscription_tier: 'basic' | 'professional' | 'enterprise';
  }): Promise<Tenant> {
    const tenantId = `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const defaultSettings: TenantSettings = {
      locale: 'vi-VN',
      timezone: 'Asia/Ho_Chi_Minh',
      currency: 'VND',
      date_format: 'DD/MM/YYYY',
      number_format: '1,234.56',
      tax_settings: {
        enabled: true,
        default_rate: 10,
        inclusive: false
      },
      branding: {
        primary_color: '#2563eb',
        secondary_color: '#64748b',
        company_name: data.name
      },
      features: {
        inventory_management: true,
        multi_location: data.subscription_tier !== 'basic',
        advanced_reporting: data.subscription_tier === 'enterprise',
        api_access: data.subscription_tier !== 'basic',
        custom_fields: data.subscription_tier === 'enterprise',
        integrations: data.subscription_tier !== 'basic',
        mobile_app: true,
        webhook_notifications: data.subscription_tier !== 'basic'
      },
      notifications: {
        email_enabled: true,
        sms_enabled: false,
        push_enabled: true,
        low_stock_threshold: 10,
        daily_reports: true
      }
    };

    const defaultLimits: TenantLimits = {
      max_users: data.subscription_tier === 'basic' ? 3 :
                 data.subscription_tier === 'professional' ? 10 : 50,
      max_products: data.subscription_tier === 'basic' ? 1000 :
                   data.subscription_tier === 'professional' ? 5000 : 25000,
      max_orders_per_month: data.subscription_tier === 'basic' ? 500 :
                           data.subscription_tier === 'professional' ? 2500 : 10000,
      max_locations: data.subscription_tier === 'basic' ? 1 :
                    data.subscription_tier === 'professional' ? 3 : 10,
      max_storage_gb: data.subscription_tier === 'basic' ? 1 :
                     data.subscription_tier === 'professional' ? 5 : 25,
      max_api_requests_per_hour: data.subscription_tier === 'basic' ? 1000 :
                                data.subscription_tier === 'professional' ? 5000 : 25000,
      max_webhook_endpoints: data.subscription_tier === 'basic' ? 0 :
                            data.subscription_tier === 'professional' ? 3 : 10
    };

    const now = new Date().toISOString();
    await this.env.DB.prepare(`
      INSERT INTO tenants (
        id, name, subdomain, domain, status, subscription_tier,
        settings, limits, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      tenantId,
      data.name,
      data.subdomain || null,
      data.domain || null,
      'active',
      data.subscription_tier,
      JSON.stringify(defaultSettings),
      JSON.stringify(defaultLimits),
      now,
      now
    ).run();
    return {
      id: tenantId,
      name: data.name,
      subdomain: data.subdomain,
      domain: data.domain,
      status: 'active',
      subscription_tier: data.subscription_tier,
      created_at: now,
      updated_at: now,
      settings: defaultSettings,
      limits: defaultLimits
    };
  }

  async updateTenantSettings(tenantId: string, settings: Partial<TenantSettings>): Promise<void> {
    const tenant = await getTenantById(this.env, tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const updatedSettings = { ...tenant.settings, ...settings };

    await this.env.DB.prepare(`
      UPDATE tenants
      SET settings = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      JSON.stringify(updatedSettings),
      new Date().toISOString(),
      tenantId
    ).run();
  }

  async addUserToTenant(tenantId: string, userId: string, role: string): Promise<void> {
    await this.env.DB.prepare(`
      INSERT OR REPLACE INTO user_tenants (user_id, tenant_id, role, created_at)
      VALUES (?, ?, ?, ?)
    `).bind(userId, tenantId, role, new Date().toISOString()).run();
  }
}

// Export singleton instance
export const createTenantService = (env: Env) => new TenantService(env);