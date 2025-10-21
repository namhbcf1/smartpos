export default class PublicWarrantyService_WarrantyChecktsx {
  constructor(private env: any) {}

  async findByWarrantyCode(code: string, tenantId: string = 'default') {
    try {
      const row = await this.env.DB.prepare(
        `SELECT w.*, p.name as product_name, p.sku as product_sku, c.name as customer_name, c.phone as customer_phone
         FROM warranties w
         LEFT JOIN products p ON p.id = w.product_id
         LEFT JOIN customers c ON c.id = w.customer_id
         WHERE w.warranty_code = ? AND COALESCE(w.tenant_id,'default') = ?`
      ).bind(code, tenantId).first();

      if (!row) return { success: true, data: null };

      return { success: true, data: row };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to lookup warranty' };
    }
  }

  async findByPhone(phone: string, tenantId: string = 'default') {
    try {
      const res = await this.env.DB.prepare(
        `SELECT w.*, p.name as product_name, p.sku as product_sku, c.name as customer_name, c.phone as customer_phone
         FROM warranties w
         LEFT JOIN products p ON p.id = w.product_id
         LEFT JOIN customers c ON c.id = w.customer_id
         WHERE c.phone = ? AND COALESCE(w.tenant_id,'default') = ?
         ORDER BY w.created_at DESC`
      ).bind(phone, tenantId).all();

      return { success: true, data: res.results || [] };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to lookup by phone' };
    }
  }
}

