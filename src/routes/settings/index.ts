import { Hono } from 'hono';
import { Env } from '../../types';
import { authenticate } from '../../middleware/auth';
import { SettingsService_SettingsPagetsx as SettingsService } from '../../services/SettingsService-SettingsPagetsx';

const settings = new Hono<{ Bindings: Env }>();

// Get all settings
settings.get('/', authenticate, async (c) => {
  try {
    const service = new SettingsService(c.env);
    const settingsData = await service.getAllAsKeyValue();

    return c.json({
      success: true,
      data: settingsData,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return c.json(
      {
        success: false,
        message: 'Failed to fetch settings',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// Get settings by category
settings.get('/category/:category', async (c) => {
  try {
    const category = c.req.param('category');
    const service = new SettingsService(c.env);
    const settingsData = await service.getByCategory(category);

    // Convert array to key-value object
    const keyValueData: Record<string, string> = {};
    for (const setting of settingsData) {
      const key = (setting as any).key;
      const value = (setting as any).value;
      if (value !== null && typeof key === 'string') {
        keyValueData[key] = value;
      }
    }

    console.log('Store settings from D1:', keyValueData);

    return c.json({
      success: true,
      data: keyValueData,
    });
  } catch (error) {
    console.error('Error fetching settings by category:', error);
    return c.json(
      {
        success: false,
        message: 'Failed to fetch settings',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// Setup default store settings (no auth required for initial setup)
settings.post('/setup-store', async (c) => {
  try {
    const service = new SettingsService(c.env);
    
    // Check if store settings already exist in D1
    const existingSettings = await c.env.DB.prepare(`
      SELECT key, value FROM settings 
      WHERE category = 'store' AND tenant_id = 'default'
    `).all();
    
    // If no settings exist, create default ones
    if (!existingSettings.results || existingSettings.results.length === 0) {
      const defaultStoreSettings = {
        'store_name': 'SmartPOS',
        'store_address': 'Địa chỉ cửa hàng',
        'store_phone': 'Số điện thoại',
        'store_email': 'Email cửa hàng',
        'store_tax_number': 'Mã số thuế',
        'store_business_license': 'Giấy phép kinh doanh',
        'store_currency': 'VND',
        'store_timezone': 'Asia/Ho_Chi_Minh'
      };
      
      // Create default store settings
      for (const [key, value] of Object.entries(defaultStoreSettings)) {
        await service.upsert(key, {
          value: value,
          category: 'store',
          description: `Store ${key.replace('_', ' ')}`,
          tenant_id: 'default'
        });
      }
    }

    // Get the actual settings from D1 database
    const storeSettings = await c.env.DB.prepare(`
      SELECT key, value FROM settings 
      WHERE category = 'store' AND tenant_id = 'default'
    `).all();
    
    // Transform array to key-value object
    const settingsObject: Record<string, any> = {};
    if (storeSettings.results) {
      for (const setting of storeSettings.results) {
        if (typeof (setting as any).key === 'string') {
          settingsObject[(setting as any).key] = (setting as any).value;
        }
      }
    }

    return c.json({
      success: true,
      message: 'Store settings initialized successfully',
      data: settingsObject,
    });
  } catch (error) {
    console.error('Error setting up store settings:', error);
    return c.json(
      {
        success: false,
        message: 'Failed to setup store settings',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// Get single setting by key
settings.get('/key/:key', authenticate, async (c) => {
  try {
    const key = c.req.param('key');
    const service = new SettingsService(c.env);
    const setting = await service.getByKey(key);

    if (!setting) {
      return c.json(
        {
          success: false,
          message: 'Setting not found',
        },
        404
      );
    }

    return c.json({
      success: true,
      data: setting,
    });
  } catch (error) {
    console.error('Error fetching setting:', error);
    return c.json(
      {
        success: false,
        message: 'Failed to fetch setting',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// Update single setting
settings.put('/key/:key', authenticate, async (c) => {
  try {
    const key = c.req.param('key');
    const body = await c.req.json();
    const service = new SettingsService(c.env);

    const setting = await service.upsert(key, {
      value: body.value,
      category: body.category,
      description: body.description,
    });

    return c.json({
      success: true,
      data: setting,
      message: 'Setting updated successfully',
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    return c.json(
      {
        success: false,
        message: 'Failed to update setting',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// Batch update settings
settings.post('/batch', authenticate, async (c) => {
  try {
    const body = await c.req.json();
    const { settings: settingsData, category = 'store' } = body;

    if (!settingsData || typeof settingsData !== 'object') {
      return c.json(
        {
          success: false,
          message: 'Invalid settings data',
        },
        400
      );
    }

    const service = new SettingsService(c.env);
    await service.batchUpsert(settingsData, category);

    return c.json({
      success: true,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Error batch updating settings:', error);
    return c.json(
      {
        success: false,
        message: 'Failed to update settings',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// Delete setting
settings.delete('/key/:key', authenticate, async (c) => {
  try {
    const key = c.req.param('key');
    const service = new SettingsService(c.env);
    await service.deleteByKey(key);

    return c.json({
      success: true,
      message: 'Setting deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting setting:', error);
    return c.json(
      {
        success: false,
        message: 'Failed to delete setting',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

export default settings;
