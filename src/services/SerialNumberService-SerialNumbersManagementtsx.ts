export class SerialNumberService_SerialNumbersManagementtsx {
  constructor(private env: any) {}

  async createSerialNumber(data: any, tenantId: string = 'default') {
    try {
      const id = crypto.randomUUID();
      const status = data.status || 'in_stock';

      const row = await this.env.DB.prepare(`
        INSERT INTO serial_numbers (
          id, tenant_id, serial_number, product_id, status, notes,
          manufacturing_date, import_date, import_batch, import_invoice, supplier_id, 
          imported_by, cost_price, warehouse_id, location,
          sale_date, order_id, customer_name, customer_phone, sale_price, 
          sold_by, sales_channel, order_status,
          warranty_type, warranty_start_date, warranty_end_date, warranty_months,
          warranty_ticket, warranty_provider, warranty_status, warranty_last_service,
          internal_id, source, cycle_count, cycle_status, risk_level, internal_notes,
          data_source, sync_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING *
      `).bind(
        id, tenantId, data.serial_number, data.product_id,
        status, data.notes || null,
        data.manufacturing_date || null,
        data.import_date || new Date().toISOString(),
        data.import_batch || null,
        data.import_invoice || null,
        data.supplier_id || null,
        data.imported_by || null,
        data.cost_price || null,
        data.warehouse_id || null,
        data.location || null,
        data.sale_date || null,
        data.order_id || null,
        data.customer_name || null,
        data.customer_phone || null,
        data.sale_price || null,
        data.sold_by || null,
        data.sales_channel || null,
        data.order_status || null,
        data.warranty_type || null,
        data.warranty_start || null,
        data.warranty_end || null,
        data.warranty_months || 36,
        data.warranty_ticket || null,
        data.warranty_provider || null,
        data.warranty_status || null,
        data.warranty_last_service || null,
        data.internal_id || null,
        data.source || null,
        data.cycle_count || 0,
        data.cycle_status || null,
        data.risk_level || null,
        data.internal_notes || null,
        data.data_source || null,
        data.sync_status || null
      ).first();

      // AUTO-UPDATE STOCK: Tăng stock nếu serial mới có status = 'in_stock'
      if (status === 'in_stock') {
        await this.env.DB.prepare(`
          UPDATE products
          SET stock = stock + 1, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND COALESCE(tenant_id, 'default') = ?
        `).bind(data.product_id, tenantId).run();
      }

      return { success: true, data: row };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async getBySerialNumber(serial: string, tenantId: string = 'default') {
    try {
      const row = await this.env.DB.prepare(`
        SELECT sn.*, p.name as product_name, p.sku as product_sku
        FROM serial_numbers sn
        LEFT JOIN products p ON p.id = sn.product_id
        WHERE sn.serial_number = ? AND COALESCE(sn.tenant_id,'default') = ?
      `).bind(serial, tenantId).first();
      return { success: true, data: row || null };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async getSerialNumbers(filters: any = {}, pagination: { limit: number; offset: number } = { limit: 20, offset: 0 }, tenantId: string = 'default') {
    try {
      const where: string[] = ["COALESCE(sn.tenant_id,'default') = ?"];
      const params: any[] = [tenantId];
      if (filters.search) { where.push('(sn.serial_number LIKE ? OR p.name LIKE ?)'); params.push(`%${filters.search}%`, `%${filters.search}%`); }
      if (filters.status) { where.push('sn.status = ?'); params.push(filters.status); }
      if (filters.product_id) { where.push('sn.product_id = ?'); params.push(filters.product_id); }
      if (filters.sold_to_customer_id) { where.push('sn.sold_to_customer_id = ?'); params.push(filters.sold_to_customer_id); }
      if (filters.warehouse_id) { where.push('sn.warehouse_id = ?'); params.push(filters.warehouse_id); }

      const res = await this.env.DB.prepare(`
        SELECT sn.*, p.name as product_name, p.sku as product_sku
        FROM serial_numbers sn
        LEFT JOIN products p ON p.id = sn.product_id
        WHERE ${where.join(' AND ')}
        ORDER BY sn.created_at DESC
        LIMIT ? OFFSET ?
      `).bind(...params, pagination.limit, pagination.offset).all();
      return { success: true, data: res.results || [] };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async findById(id: string, tenantId: string = 'default') {
    try {
      const row = await this.env.DB.prepare(`
        SELECT sn.*, p.name as product_name, p.sku as product_sku
        FROM serial_numbers sn
        LEFT JOIN products p ON p.id = sn.product_id
        WHERE sn.id = ? AND COALESCE(sn.tenant_id,'default') = ?
      `).bind(id, tenantId).first();
      return { success: true, data: row || null };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async update(id: string, updates: any, _opts: any = {}, tenantId: string = 'default') {
    try {
      // Get current serial để kiểm tra status thay đổi
      const current = await this.env.DB.prepare(`
        SELECT product_id, status FROM serial_numbers
        WHERE id = ? AND COALESCE(tenant_id,'default') = ?
      `).bind(id, tenantId).first();

      if (!current) {
        return { success: false, error: 'Serial not found' };
      }

      const fields: string[] = [];
      const params: any[] = [];
      const allowed = [
        'status', 'notes', 'order_id', 'order_item_id', 'warranty_id',
        'manufacturing_date', 'import_date', 'import_batch', 'import_invoice', 'supplier_id',
        'imported_by', 'cost_price', 'warehouse_id', 'location',
        'sale_date', 'customer_name', 'customer_phone', 'sale_price', 
        'sold_by', 'sales_channel', 'order_status',
        'warranty_type', 'warranty_start_date', 'warranty_end_date', 'warranty_months',
        'warranty_ticket', 'warranty_provider', 'warranty_status', 'warranty_last_service',
        'internal_id', 'source', 'cycle_count', 'cycle_status', 'risk_level', 'internal_notes',
        'data_source', 'sync_status',
        'sold_date', 'sold_to_customer_id'
      ];
      for (const key of allowed) {
        if (updates[key] !== undefined) { fields.push(`${key} = ?`); params.push(updates[key]); }
      }
      if (fields.length === 0) return { success: true, data: current };

      const row = await this.env.DB.prepare(`
        UPDATE serial_numbers SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND COALESCE(tenant_id,'default') = ?
        RETURNING *
      `).bind(...params, id, tenantId).first();

      // AUTO-UPDATE STOCK: Nếu status thay đổi, cập nhật stock
      const oldStatus = (current as any).status;
      const newStatus = updates.status;

      if (newStatus && oldStatus !== newStatus) {
        const productId = (current as any).product_id;

        // Case 1: in_stock → sold/warranty/etc (stock giảm 1)
        if (oldStatus === 'in_stock' && newStatus !== 'in_stock') {
          await this.env.DB.prepare(`
            UPDATE products
            SET stock = CASE WHEN stock > 0 THEN stock - 1 ELSE 0 END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND COALESCE(tenant_id, 'default') = ?
          `).bind(productId, tenantId).run();
        }

        // Case 2: sold/warranty/etc → in_stock (stock tăng 1)
        if (oldStatus !== 'in_stock' && newStatus === 'in_stock') {
          await this.env.DB.prepare(`
            UPDATE products
            SET stock = stock + 1, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND COALESCE(tenant_id, 'default') = ?
          `).bind(productId, tenantId).run();
        }
      }

      return { success: true, data: row };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async delete(id: string, tenantId: string = 'default') {
    try {
      // Get serial info before deleting để biết product_id và status
      const serial = await this.env.DB.prepare(`
        SELECT product_id, status FROM serial_numbers
        WHERE id = ? AND COALESCE(tenant_id,'default') = ?
      `).bind(id, tenantId).first();

      if (!serial) {
        return { success: false, error: 'Serial not found' };
      }

      // Delete serial
      await this.env.DB.prepare(`
        DELETE FROM serial_numbers WHERE id = ? AND COALESCE(tenant_id,'default') = ?
      `).bind(id, tenantId).run();

      // AUTO-UPDATE STOCK: Giảm stock nếu serial bị xóa có status = 'in_stock'
      if ((serial as any).status === 'in_stock') {
        await this.env.DB.prepare(`
          UPDATE products
          SET stock = CASE WHEN stock > 0 THEN stock - 1 ELSE 0 END,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND COALESCE(tenant_id, 'default') = ?
        `).bind((serial as any).product_id, tenantId).run();
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async bulkImport(items: any[], tenantId: string = 'default') {
    try {
      const created: any[] = [];
      for (const item of items) {
        const res = await this.createSerialNumber(item, tenantId);
        if (res.success && res.data) created.push(res.data);
      }
      return { success: true, data: { count: created.length, items: created } };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async getStats(tenantId: string = 'default') {
    try {
      const row = await this.env.DB.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'in_stock' THEN 1 ELSE 0 END) as in_stock,
          SUM(CASE WHEN status = 'sold' THEN 1 ELSE 0 END) as sold,
          SUM(CASE WHEN status = 'warranty' THEN 1 ELSE 0 END) as warranty
        FROM serial_numbers WHERE COALESCE(tenant_id,'default') = ?
      `).bind(tenantId).first();
      return { success: true, data: row };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
}

