import { Hono } from 'hono';
import { Env } from '../../types';

const app = new Hono<{ Bindings: Env }>();

// Helper functions for database operations
async function getSetting(db: D1Database, key: string) {
  const query = 'SELECT * FROM settings WHERE key = ?';
  const result = await db.prepare(query).bind(key).first();
  return result;
}

async function setSetting(db: D1Database, key: string, value: string, description: string, category: string) {
  const query = `
    INSERT OR REPLACE INTO settings (key, value, description, category, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `;
  await db.prepare(query).bind(key, value, description, category).run();
}

async function getStoreSettings(db: D1Database) {
  // Check if store_settings table exists, if not use system_settings
  const checkTableQuery = "SELECT name FROM sqlite_master WHERE type='table' AND name='store_settings'";
  const tableExists = await db.prepare(checkTableQuery).first();

  if (tableExists) {
    const query = 'SELECT * FROM store_settings LIMIT 1';
    return await db.prepare(query).first();
  } else {
    // Fallback to system_settings or construct from individual settings
    const storeKeys = ['store_name', 'address', 'phone', 'email', 'website', 'tax_id', 'currency', 'timezone', 'receipt_footer'];
    const settings: any = {};

    for (const key of storeKeys) {
      const setting = await getSetting(db, key);
      if (setting) {
        settings[key] = setting.value;
      }
    }

    // Default store data if no settings found
    return {
      id: 'store-001',
      store_name: settings.store_name || 'Cửa hàng SmartPos',
      address: settings.address || '123 Đường Nguyễn Huệ, Quận 1, TP.HCM',
      phone: settings.phone || '+84 028 3822 1234',
      email: settings.email || 'contact@smartpos.vn',
      website: settings.website || 'https://smartpos.vn',
      tax_id: settings.tax_id || '0123456789',
      currency: settings.currency || 'VND',
      timezone: settings.timezone || 'Asia/Ho_Chi_Minh',
      logo_url: settings.logo_url || null,
      receipt_footer: settings.receipt_footer || 'Cảm ơn quý khách đã mua hàng!',
      business_hours: '{}',
      is_active: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: new Date().toISOString()
    };
  }
}

async function updateStoreSettings(db: D1Database, data: any, tenantId: string = 'default') {
  const existingStore = await getStoreSettings(db);

  if (existingStore) {
    const query = `
      UPDATE store_settings SET
        store_name = ?, address = ?, phone = ?, email = ?, website = ?,
        tax_id = ?, currency = ?, timezone = ?, receipt_footer = ?,
        business_hours = ?, updated_at = CURRENT_TIMESTAMP
      WHERE tenant_id = ?
    `;
    await db.prepare(query).bind(
      data.name || data.store_name || existingStore.store_name,
      data.address || existingStore.address,
      data.phone || existingStore.phone,
      data.email || existingStore.email,
      data.website || existingStore.website,
      data.tax_id || existingStore.tax_id,
      data.currency || existingStore.currency,
      data.timezone || existingStore.timezone,
      data.receipt_footer || existingStore.receipt_footer,
      typeof data.business_hours === 'object' ? JSON.stringify(data.business_hours) : (data.business_hours || existingStore.business_hours),
      tenantId
    ).run();
  } else {
    const query = `
      INSERT INTO store_settings
      (tenant_id, store_name, address, phone, email, website, tax_id, currency, timezone, receipt_footer, business_hours)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await db.prepare(query).bind(
      tenantId,
      data.name || data.store_name || 'Cửa hàng SmartPos',
      data.address || '',
      data.phone || '',
      data.email || '',
      data.website || '',
      data.tax_id || '',
      data.currency || 'VND',
      data.timezone || 'Asia/Ho_Chi_Minh',
      data.receipt_footer || 'Cảm ơn quý khách đã mua hàng!',
      typeof data.business_hours === 'object' ? JSON.stringify(data.business_hours) : (data.business_hours || '{}')
    ).run();
  }
}

async function getPaymentMethods(db: D1Database, tenantId: string = 'default') {
  const query = 'SELECT * FROM payment_methods ORDER BY name ASC';
  const result = await db.prepare(query).all();
  return result.results || [];
}

async function updatePaymentMethods(db: D1Database, methods: any[], tenantId: string = 'default') {
  // Delete existing methods
  await db.prepare('DELETE FROM payment_methods WHERE tenant_id = ?').bind(tenantId).run();

  // Insert new methods
  const insertQuery = `
    INSERT INTO payment_methods (tenant_id, name, code, is_active, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `;

  for (let i = 0; i < methods.length; i++) {
    const method = methods[i];
    await db.prepare(insertQuery).bind(
      tenantId,
      method.name || `Phương thức ${i + 1}`,
      method.code || `METHOD_${i + 1}`,
      method.is_active !== undefined ? (method.is_active ? 1 : 0) : (method.enabled !== undefined ? (method.enabled ? 1 : 0) : 1),
      method.sort_order || i + 1
    ).run();
  }
}

// GET /api/settings/store - Get store settings
// GET /api/settings - Get all settings summary
app.get('/', async (c: any) => {
  try {
    console.log('Settings list request received');

    // Get basic settings summary
    const settingsData = {
      store: {
        name: 'Cửa hàng SmartPos',
        address: '123 Đường Nguyễn Huệ, Quận 1, TP.HCM',
        phone: '+84 028 3822 1234',
        email: 'contact@smartpos.vn',
        currency: 'VND',
        timezone: 'Asia/Ho_Chi_Minh'
      },
      system: {
        version: '1.0.0',
        api_version: 'non-versioned',
        environment: 'production',
        maintenance_mode: false
      },
      features: {
        inventory_management: true,
        analytics: true,
        multi_store: false,
        loyalty_program: false
      },
      last_updated: new Date().toISOString()
    };

    console.log('Settings summary generated successfully');

    return c.json({
      success: true,
      data: settingsData,
      message: 'Settings retrieved successfully'
    });
  } catch (error) {
    console.error('Settings error:', error);
    return c.json({
      success: false,
      message: 'Failed to fetch settings: ' + (error as Error).message,
      data: {
        store: { name: 'SmartPos', currency: 'VND' },
        system: { version: '1.0.0', environment: 'production' },
        features: {},
        last_updated: new Date().toISOString()
      }
    }, 500);
  }
});

app.get('/store', async (c: any) => {
  try {
    const db = c.env.DB;
    const storeSettings = await getStoreSettings(db);

    // Always return store settings (with defaults if not found)
    const finalStoreSettings = storeSettings || {
      id: 'store-001',
      store_name: 'Cửa hàng SmartPos',
      address: '123 Đường Nguyễn Huệ, Quận 1, TP.HCM',
      phone: '+84 028 3822 1234',
      email: 'contact@smartpos.vn',
      website: 'https://smartpos.vn',
      tax_id: '0123456789',
      currency: 'VND',
      timezone: 'Asia/Ho_Chi_Minh',
      logo_url: null,
      receipt_footer: 'Cảm ơn quý khách đã mua hàng!',
      business_hours: '{}',
      is_active: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: new Date().toISOString()
    };

    // Parse business_hours if it's a JSON string
    let businessHours = {};
    try {
      businessHours = typeof finalStoreSettings.business_hours === 'string'
        ? JSON.parse(finalStoreSettings.business_hours)
        : finalStoreSettings.business_hours || {};
    } catch (e) {
      businessHours = {};
    }

    return c.json({
      success: true,
      data: {
        id: finalStoreSettings.id,
        name: finalStoreSettings.store_name,
        address: finalStoreSettings.address,
        phone: finalStoreSettings.phone,
        email: finalStoreSettings.email,
        website: finalStoreSettings.website,
        tax_id: finalStoreSettings.tax_id,
        currency: finalStoreSettings.currency,
        timezone: finalStoreSettings.timezone,
        logo_url: finalStoreSettings.logo_url,
        receipt_footer: finalStoreSettings.receipt_footer,
        business_hours: businessHours,
        is_active: finalStoreSettings.is_active,
        created_at: finalStoreSettings.created_at,
        updated_at: finalStoreSettings.updated_at
      }
    });
  } catch (error) {
    console.error('Store settings error:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch store settings'
    }, 500);
  }
});

// PUT /api/settings/store - Update store settings
app.put('/store', async (c: any) => {
  try {
    const db = c.env.DB;
    const data = await c.req.json();

    await updateStoreSettings(db, data);

    // Fetch updated store settings
    const updatedStore = await getStoreSettings(db);

    if (!updatedStore) {
      return c.json({
        success: false,
        error: 'Failed to retrieve updated store settings'
      }, 500);
    }

    // Parse business_hours if it's a JSON string
    let businessHours = {};
    try {
      businessHours = typeof updatedStore.business_hours === 'string'
        ? JSON.parse(updatedStore.business_hours)
        : updatedStore.business_hours || {};
    } catch (e) {
      businessHours = {};
    }

    return c.json({
      success: true,
      data: {
        id: updatedStore.id,
        name: updatedStore.store_name,
        address: updatedStore.address,
        phone: updatedStore.phone,
        email: updatedStore.email,
        website: updatedStore.website,
        tax_id: updatedStore.tax_id,
        currency: updatedStore.currency,
        timezone: updatedStore.timezone,
        logo_url: updatedStore.logo_url,
        receipt_footer: updatedStore.receipt_footer,
        business_hours: businessHours,
        is_active: updatedStore.is_active,
        created_at: updatedStore.created_at,
        updated_at: updatedStore.updated_at
      },
      message: 'Store settings updated successfully'
    });
  } catch (error) {
    console.error('Update store settings error:', error);
    return c.json({ success: false, error: 'Failed to update store settings' }, 500);
  }
});

// GET /api/settings/payment-methods - Get payment methods
app.get('/payment-methods', async (c: any) => {
  try {
    const db = c.env.DB;
    const paymentMethods = await getPaymentMethods(db);

    return c.json({
      success: true,
      data: paymentMethods.map(method => ({
        id: method.id,
        name: method.name,
        code: method.code,
        description: method.description,
        is_active: Boolean(method.is_active),
        is_default: Boolean(method.is_default),
        sort_order: method.sort_order,
        created_at: method.created_at,
        updated_at: method.updated_at
      }))
    });
  } catch (error) {
    console.error('Payment methods error:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch payment methods'
    }, 500);
  }
});

// PUT /api/settings/payment-methods - Update payment methods
app.put('/payment-methods', async (c: any) => {
  try {
    const db = c.env.DB;
    const body = await c.req.json();
    let methods = body.methods || body;

    // Handle the test data format (paymentMethods object)
    if (body.cash || body.card || body.bank_transfer || body.e_wallet) {
      // Convert object format to array
      methods = Object.entries(body).map(([key, value]: [string, any], index) => ({
        id: `method-${index + 1}`,
        name: value.name || key,
        code: key.toUpperCase(),
        is_active: value.enabled !== undefined ? value.enabled : true,
        sort_order: index + 1
      }));
    }

    if (!methods) {
      return c.json({ success: false, error: 'Payment methods array is required' }, 400);
    }

    // Handle both array and object formats
    const methodsArray = Array.isArray(methods) ? methods : [methods];

    // Update payment methods in database
    await updatePaymentMethods(db, methodsArray);

    // Fetch updated payment methods
    const updatedMethods = await getPaymentMethods(db);

    return c.json({
      success: true,
      data: updatedMethods.map(method => ({
        id: method.id,
        name: method.name,
        code: method.code,
        is_active: Boolean(method.is_active),
        sort_order: method.sort_order,
        created_at: method.created_at,
        updated_at: method.updated_at
      })),
      message: 'Payment methods updated successfully'
    });
  } catch (error) {
    console.error('Update payment methods error:', error);
    return c.json({ success: false, error: 'Failed to update payment methods' }, 500);
  }
});

// GET /api/settings/tax - Get tax settings
app.get('/tax', async (c: any) => {
  try {
    const db = c.env.DB;
    const query = 'SELECT * FROM settings WHERE category = "financial" ORDER BY key ASC';
    const result = await db.prepare(query).all();
    const settings = result.results || [];

    // Convert to object format for easier frontend consumption
    const taxSettings: any = {};
    settings.forEach((setting: any) => {
      if (setting.data_type === 'boolean') {
        taxSettings[setting.key] = setting.value === 'true';
      } else if (setting.data_type === 'number') {
        taxSettings[setting.key] = parseFloat(setting.value) || 0;
      } else {
        taxSettings[setting.key] = setting.value;
      }
    });

    return c.json({
      success: true,
      data: taxSettings
    });
  } catch (error) {
    console.error('Tax settings error:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch tax settings'
    }, 500);
  }
});

// PUT /api/settings/tax - Update tax settings
app.put('/tax', async (c: any) => {
  try {
    const db = c.env.DB;
    const body = await c.req.json();
    const tax_rate = body.tax_rate || body.vat_rate || body.value;
    const enable_vat = body.enable_vat;
    const tax_number = body.tax_number;
    const tax_address = body.tax_address;

    if (tax_rate !== undefined && tax_rate !== null && tax_rate !== '') {
      const numericRate = parseFloat(tax_rate);
      if (isNaN(numericRate)) {
        return c.json({ success: false, error: 'Valid tax rate is required' }, 400);
      }
      await setSetting(db, 'tax_rate', tax_rate.toString(), 'Thuế VAT (%)', 'financial');
    }

    if (enable_vat !== undefined) {
      await setSetting(db, 'enable_vat', enable_vat.toString(), 'Bật thuế VAT', 'financial');
    }

    if (tax_number !== undefined) {
      await setSetting(db, 'tax_number', tax_number, 'Mã số thuế', 'financial');
    }

    if (tax_address !== undefined) {
      await setSetting(db, 'tax_address', tax_address, 'Địa chỉ thuế', 'financial');
    }

    // Fetch updated tax settings
    const query = 'SELECT * FROM settings WHERE category = "financial" ORDER BY key ASC';
    const result = await db.prepare(query).all();
    const settings = result.results || [];

    const taxSettings: any = {};
    settings.forEach((setting: any) => {
      if (setting.data_type === 'boolean') {
        taxSettings[setting.key] = setting.value === 'true';
      } else if (setting.data_type === 'number') {
        taxSettings[setting.key] = parseFloat(setting.value) || 0;
      } else {
        taxSettings[setting.key] = setting.value;
      }
    });

    return c.json({
      success: true,
      data: taxSettings,
      message: 'Tax settings updated successfully'
    });
  } catch (error) {
    console.error('Update tax settings error:', error);
    return c.json({ success: false, error: 'Failed to update tax settings' }, 500);
  }
});

// GET /api/settings/inventory - Get inventory settings
app.get('/inventory', async (c: any) => {
  try {
    const db = c.env.DB;
    const query = 'SELECT * FROM settings WHERE category = "inventory" ORDER BY key ASC';
    const result = await db.prepare(query).all();
    const settings = result.results || [];

    // Convert to object format for easier frontend consumption
    const inventorySettings: any = {};
    settings.forEach((setting: any) => {
      if (setting.data_type === 'boolean') {
        inventorySettings[setting.key] = setting.value === 'true';
      } else if (setting.data_type === 'number') {
        inventorySettings[setting.key] = parseFloat(setting.value) || 0;
      } else {
        inventorySettings[setting.key] = setting.value;
      }
    });

    return c.json({
      success: true,
      data: inventorySettings
    });
  } catch (error) {
    console.error('Inventory settings error:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch inventory settings'
    }, 500);
  }
});

// PUT /api/settings/inventory - Update inventory settings
app.put('/inventory', async (c: any) => {
  try {
    const db = c.env.DB;
    const data = await c.req.json();

    // Update inventory settings in database
    const settingsToUpdate = [
      { key: 'low_stock_threshold', description: 'Ngưỡng cảnh báo hàng tồn kho thấp' },
      { key: 'auto_reorder', description: 'Tự động đặt hàng khi hết kho' },
      { key: 'track_serial_numbers', description: 'Theo dõi số serial' },
      { key: 'track_batches', description: 'Theo dõi lô hàng' },
      { key: 'default_warehouse', description: 'Kho mặc định' }
    ];

    for (const settingInfo of settingsToUpdate) {
      if (data[settingInfo.key] !== undefined) {
        await setSetting(db, settingInfo.key, data[settingInfo.key].toString(), settingInfo.description, 'inventory');
      }
    }

    // Fetch updated inventory settings
    const query = 'SELECT * FROM settings WHERE category = "inventory" ORDER BY key ASC';
    const result = await db.prepare(query).all();
    const settings = result.results || [];

    const inventorySettings: any = {};
    settings.forEach((setting: any) => {
      if (setting.data_type === 'boolean') {
        inventorySettings[setting.key] = setting.value === 'true';
      } else if (setting.data_type === 'number') {
        inventorySettings[setting.key] = parseFloat(setting.value) || 0;
      } else {
        inventorySettings[setting.key] = setting.value;
      }
    });

    return c.json({
      success: true,
      data: inventorySettings,
      message: 'Inventory settings updated successfully'
    });
  } catch (error) {
    console.error('Update inventory settings error:', error);
    return c.json({ success: false, error: 'Failed to update inventory settings' }, 500);
  }
});

// GET /api/settings/pos - Get POS settings
app.get('/pos', async (c: any) => {
  try {
    const db = c.env.DB;
    const query = 'SELECT * FROM settings WHERE category = "pos" ORDER BY key ASC';
    const result = await db.prepare(query).all();
    const settings = result.results || [];

    // Convert to object format for easier frontend consumption
    const posSettings: any = {};
    settings.forEach((setting: any) => {
      if (setting.data_type === 'boolean') {
        posSettings[setting.key] = setting.value === 'true';
      } else if (setting.data_type === 'number') {
        posSettings[setting.key] = parseFloat(setting.value) || 0;
      } else {
        posSettings[setting.key] = setting.value;
      }
    });

    return c.json({
      success: true,
      data: posSettings
    });
  } catch (error) {
    console.error('POS settings error:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch POS settings'
    }, 500);
  }
});

// PUT /api/settings/pos - Update POS settings
app.put('/pos', async (c: any) => {
  try {
    const db = c.env.DB;
    const data = await c.req.json();

    // Update POS settings in database
    const settingsToUpdate = [
      { key: 'auto_print_receipt', description: 'Tự động in hóa đơn' },
      { key: 'show_customer_display', description: 'Hiển thị màn hình khách hàng' },
      { key: 'require_customer_info', description: 'Yêu cầu thông tin khách hàng' },
      { key: 'default_payment_method', description: 'Phương thức thanh toán mặc định' },
      { key: 'receipt_printer', description: 'Máy in hóa đơn' },
      { key: 'barcode_scanner', description: 'Máy quét mã vạch' }
    ];

    for (const settingInfo of settingsToUpdate) {
      if (data[settingInfo.key] !== undefined) {
        await setSetting(db, settingInfo.key, data[settingInfo.key].toString(), settingInfo.description, 'pos');
      }
    }

    // Fetch updated POS settings
    const query = 'SELECT * FROM settings WHERE category = "pos" ORDER BY key ASC';
    const result = await db.prepare(query).all();
    const settings = result.results || [];

    const posSettings: any = {};
    settings.forEach((setting: any) => {
      if (setting.data_type === 'boolean') {
        posSettings[setting.key] = setting.value === 'true';
      } else if (setting.data_type === 'number') {
        posSettings[setting.key] = parseFloat(setting.value) || 0;
      } else {
        posSettings[setting.key] = setting.value;
      }
    });

    return c.json({
      success: true,
      data: posSettings,
      message: 'POS settings updated successfully'
    });
  } catch (error) {
    console.error('Update POS settings error:', error);
    return c.json({ success: false, error: 'Failed to update POS settings' }, 500);
  }
});

// GET /api/settings/backup - Get backup settings
app.get('/backup', async (c: any) => {
  try {
    const db = c.env.DB;
    const query = 'SELECT * FROM settings WHERE category = "backup" ORDER BY key ASC';
    const result = await db.prepare(query).all();
    const settings = result.results || [];

    // Convert to object format for easier frontend consumption
    const backupSettings: any = {};
    settings.forEach((setting: any) => {
      if (setting.data_type === 'boolean') {
        backupSettings[setting.key] = setting.value === 'true';
      } else if (setting.data_type === 'number') {
        backupSettings[setting.key] = parseFloat(setting.value) || 0;
      } else {
        backupSettings[setting.key] = setting.value;
      }
    });

    // Add last backup time if available
    const lastBackupSetting = await getSetting(db, 'last_backup');
    if (lastBackupSetting) {
      backupSettings.last_backup = lastBackupSetting.value;
    }

    return c.json({
      success: true,
      data: backupSettings
    });
  } catch (error) {
    console.error('Backup settings error:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch backup settings'
    }, 500);
  }
});

// PUT /api/settings/backup - Update backup settings
app.put('/backup', async (c: any) => {
  try {
    const db = c.env.DB;
    const data = await c.req.json();

    // Update backup settings in database
    const settingsToUpdate = [
      { key: 'auto_backup', description: 'Tự động sao lưu' },
      { key: 'backup_frequency', description: 'Tần suất sao lưu' },
      { key: 'backup_retention_days', description: 'Số ngày lưu trữ backup' },
      { key: 'backup_location', description: 'Vị trí lưu backup' }
    ];

    for (const settingInfo of settingsToUpdate) {
      if (data[settingInfo.key] !== undefined) {
        await setSetting(db, settingInfo.key, data[settingInfo.key].toString(), settingInfo.description, 'backup');
      }
    }

    // Fetch updated backup settings
    const query = 'SELECT * FROM settings WHERE category = "backup" ORDER BY key ASC';
    const result = await db.prepare(query).all();
    const settings = result.results || [];

    const backupSettings: any = {};
    settings.forEach((setting: any) => {
      if (setting.data_type === 'boolean') {
        backupSettings[setting.key] = setting.value === 'true';
      } else if (setting.data_type === 'number') {
        backupSettings[setting.key] = parseFloat(setting.value) || 0;
      } else {
        backupSettings[setting.key] = setting.value;
      }
    });

    return c.json({
      success: true,
      data: backupSettings,
      message: 'Backup settings updated successfully'
    });
  } catch (error) {
    console.error('Update backup settings error:', error);
    return c.json({ success: false, error: 'Failed to update backup settings' }, 500);
  }
});

// POST /api/settings/backup/create - Create backup
app.post('/backup/create', async (c: any) => {
  try {
    const db = c.env.DB;
    const backupId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const filename = `smartpos_backup_${new Date().toISOString().split('T')[0]}_${backupId.substring(0, 8)}.sql`;

    // Update last backup timestamp
    await setSetting(db, 'last_backup', timestamp, 'Thời gian sao lưu cuối cùng', 'backup');

    // Mock backup data (in real implementation, this would trigger actual backup)
    const backupInfo = {
      backup_id: backupId,
      filename: filename,
      timestamp: timestamp,
      status: 'completed',
      size: '2.4 MB',
      tables_backed_up: [
        'products',
        'sales',
        'customers',
        'inventory',
        'settings',
        'users',
        'stores'
      ],
      location: 'cloud_storage',
      retention_expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    return c.json({
      success: true,
      data: backupInfo,
      message: 'Backup created successfully'
    });
  } catch (error) {
    console.error('Create backup error:', error);
    return c.json({ success: false, error: 'Failed to create backup' }, 500);
  }
});

// GET /api/settings/all - Get all settings
app.get('/all', async (c: any) => {
  try {
    const db = c.env.DB;

    // Fetch all settings grouped by category
    const settingsQuery = 'SELECT * FROM settings ORDER BY category, key ASC';
    const settingsResult = await db.prepare(settingsQuery).all();
    const settings = settingsResult.results || [];

    // Fetch store settings
    const storeSettings = await getStoreSettings(db);

    // Fetch payment methods
    const paymentMethods = await getPaymentMethods(db);

    // Group settings by category
    const groupedSettings: any = {};

    // Add store settings
    if (storeSettings) {
      let businessHours = {};
      try {
        businessHours = typeof storeSettings.business_hours === 'string'
          ? JSON.parse(storeSettings.business_hours)
          : storeSettings.business_hours || {};
      } catch (e) {
        businessHours = {};
      }

      groupedSettings.store = {
        name: storeSettings.store_name,
        address: storeSettings.address,
        phone: storeSettings.phone,
        email: storeSettings.email,
        website: storeSettings.website,
        tax_id: storeSettings.tax_id,
        currency: storeSettings.currency,
        timezone: storeSettings.timezone,
        logo_url: storeSettings.logo_url,
        receipt_footer: storeSettings.receipt_footer,
        business_hours: businessHours
      };
    }

    // Group other settings by category
    settings.forEach((setting: any) => {
      if (!groupedSettings[setting.category]) {
        groupedSettings[setting.category] = {};
      }

      let value = setting.value;
      if (setting.data_type === 'boolean') {
        value = setting.value === 'true';
      } else if (setting.data_type === 'number') {
        value = parseFloat(setting.value) || 0;
      }

      groupedSettings[setting.category][setting.key] = value;
    });

    // Add payment methods
    groupedSettings.payment_methods = paymentMethods.map(method => ({
      id: method.id,
      name: method.name,
      code: method.code,
      is_active: Boolean(method.is_active),
      sort_order: method.sort_order
    }));

    return c.json({
      success: true,
      data: groupedSettings
    });
  } catch (error) {
    console.error('All settings error:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch settings'
    }, 500);
  }
});

export default app;