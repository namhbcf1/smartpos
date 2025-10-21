import { Env } from '../types';

export class SettingsService {
  constructor(private env: Env) {}

  async getSettings(tenantId: string, category?: string) {
    let query = `SELECT * FROM settings WHERE tenant_id = ?`;
    const params: any[] = [tenantId];

    if (category) {
      query += ` AND category = ?`;
      params.push(category);
    }

    const settings = await this.env.DB.prepare(query).bind(...params).all();
    return { success: true, settings: settings.results || [] };
  }

  async updateSetting(tenantId: string, key: string, value: string) {
    const now = new Date().toISOString();
    await this.env.DB.prepare(`
      INSERT INTO settings (id, tenant_id, key, value, updated_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(key, tenant_id) DO UPDATE SET value = ?, updated_at = ?
    `).bind(crypto.randomUUID(), tenantId, key, value, now, now, value, now).run();

    return { success: true };
  }

  async getAllAsKeyValue(tenantId: string = 'default') {
    const settings = await this.env.DB.prepare(`
      SELECT key, value FROM settings WHERE tenant_id = ?
    `).bind(tenantId).all();

    const keyValue: Record<string, any> = {};
    for (const setting of (settings.results || [])) {
      keyValue[(setting as any).key] = (setting as any).value;
    }

    return keyValue;
  }

  async getByCategory(category: string, tenantId: string = 'default') {
    const result = await this.getSettings(tenantId, category);
    return result.settings || [];
  }

  async upsert(key: string, data: { value: string; category?: string; description?: string; tenant_id?: string }) {
    const tenantId = data.tenant_id || 'default';
    const now = new Date().toISOString();

    await this.env.DB.prepare(`
      INSERT INTO settings (id, tenant_id, key, value, category, description, updated_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(key, tenant_id) DO UPDATE SET
        value = ?, category = ?, description = ?, updated_at = ?
    `).bind(
      crypto.randomUUID(),
      tenantId,
      key,
      data.value,
      data.category || 'general',
      data.description || null,
      now,
      now,
      data.value,
      data.category || 'general',
      data.description || null,
      now
    ).run();

    return { success: true };
  }

  async getByKey(key: string, tenantId: string = 'default') {
    const setting = await this.env.DB.prepare(`
      SELECT * FROM settings WHERE key = ? AND tenant_id = ?
    `).bind(key, tenantId).first();

    return setting;
  }

  async batchUpsert(settings: Array<{ key: string; value: string; category?: string; description?: string }>, tenantId: string = 'default') {
    try {
      for (const setting of settings) {
        await this.upsert(setting.key, { ...setting, tenant_id: tenantId });
      }
      return { success: true, count: settings.length };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteByKey(key: string, tenantId: string = 'default') {
    try {
      await this.env.DB.prepare(`
        DELETE FROM settings WHERE key = ? AND tenant_id = ?
      `).bind(key, tenantId).run();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
