import { Env } from '../types';

export class ShippingPersistenceService {
  constructor(private env: Env) {}

  async upsertShippingOrder(data: {
    tenant_id?: string;
    order_id?: string;
    carrier: string;
    carrier_order_code?: string;
    status?: string;
    fee_amount?: number;
    service?: string;
    payload?: any;
    response?: any;
    created_by?: string;
  }): Promise<{ success: boolean; id?: string; error?: string }>{
    try {
      const tenantId = data.tenant_id || 'default';
      const existing = data.carrier_order_code ? await this.env.DB.prepare(
        `SELECT id FROM shipping_orders WHERE tenant_id = ? AND carrier = ? AND carrier_order_code = ?`
      ).bind(tenantId, data.carrier, data.carrier_order_code).first() : null;

      const now = new Date().toISOString();
      const payloadJson = data.payload ? JSON.stringify(data.payload) : null;
      const responseJson = data.response ? JSON.stringify(data.response) : null;

      if (existing) {
        await this.env.DB.prepare(
          `UPDATE shipping_orders
           SET order_id = COALESCE(?, order_id), status = COALESCE(?, status), fee_amount = COALESCE(?, fee_amount),
               service = COALESCE(?, service), payload = COALESCE(?, payload), response = COALESCE(?, response), updated_at = ?
           WHERE id = ?`
        ).bind(data.order_id || null, data.status || null, data.fee_amount ?? null, data.service || null, payloadJson, responseJson, now, (existing as any).id).run();
        return { success: true, id: (existing as any).id };
      }

      const id = crypto.randomUUID();
      await this.env.DB.prepare(
        `INSERT INTO shipping_orders (id, tenant_id, order_id, carrier, carrier_order_code, status, fee_amount, service, payload, response, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(id, tenantId, data.order_id || null, data.carrier, data.carrier_order_code || null, data.status || null, data.fee_amount ?? null, data.service || null, payloadJson, responseJson, data.created_by || null, now, now).run();
      return { success: true, id };
    } catch (e: any) {
      return { success: false, error: e?.message };
    }
  }

  async addShippingEvent(data: {
    tenant_id?: string;
    shipping_order_id?: string;
    carrier: string;
    carrier_order_code?: string;
    event_type?: string;
    event_time?: string;
    raw_event?: any;
  }): Promise<{ success: boolean; id?: string; error?: string }>{
    try {
      const id = crypto.randomUUID();
      await this.env.DB.prepare(
        `INSERT INTO shipping_events (id, tenant_id, shipping_order_id, carrier, carrier_order_code, event_type, event_time, raw_event, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
      ).bind(id, data.tenant_id || 'default', data.shipping_order_id || null, data.carrier, data.carrier_order_code || null, data.event_type || null, data.event_time || null, data.raw_event ? JSON.stringify(data.raw_event) : null).run();
      return { success: true, id };
    } catch (e: any) {
      return { success: false, error: e?.message };
    }
  }

  async findByCarrierCode(carrier: string, carrier_order_code: string, tenantId: string = 'default') {
    return await this.env.DB.prepare(
      `SELECT * FROM shipping_orders WHERE tenant_id = ? AND carrier = ? AND carrier_order_code = ?`
    ).bind(tenantId, carrier, carrier_order_code).first();
  }

  async getShippingOrders(carrier?: string, tenantId: string = 'default'): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      let query = `SELECT
        so.*,
        COALESCE(so.payload, '{}') as payload_json,
        COALESCE(so.response, '{}') as response_json
      FROM shipping_orders so
      WHERE so.tenant_id = ?`;

      const params: any[] = [tenantId];

      if (carrier) {
        query += ` AND so.carrier = ?`;
        params.push(carrier);
      }

      query += ` ORDER BY so.created_at DESC LIMIT 100`;

      const stmt = this.env.DB.prepare(query);
      const result = await stmt.bind(...params).all();

      if (!result.results) {
        return {
          success: false,
          error: 'No results returned from query'
        };
      }

      // Parse JSON payloads for each order
      const orders = result.results.map((row: any) => {
        try {
          const payload = row.payload_json ? JSON.parse(row.payload_json) : {};
          const response = row.response_json ? JSON.parse(row.response_json) : {};

          // Try multiple sources for customer data
          // From GHTK real data structure
          const ghtkOrder = payload.order || response.order || {};

          // From payload root level
          const customerInfo = payload.customer_info || payload.order || {};

          // Collect all possible data sources
          const sources = [
            ghtkOrder,
            customerInfo,
            payload,
            response,
            row
          ];

          // Helper to get first non-empty value
          const getFirst = (...fields: string[]) => {
            for (const src of sources) {
              for (const field of fields) {
                const val = src?.[field];
                if (val && val !== 'N/A' && val !== '' && val !== null && val !== undefined) {
                  return val;
                }
              }
            }
            return null;
          };

          const customerName = getFirst('customer_fullname', 'customer_name', 'name', 'pick_name');
          const customerPhone = getFirst('customer_tel', 'customer_phone', 'tel', 'phone', 'pick_tel');
          const customerAddress = getFirst('address', 'customer_address', 'pick_address');
          const codAmount = getFirst('pick_money', 'cod_amount', 'value');
          const products = getFirst('products') || [];

          return {
            ...row,
            customer_name: customerName || 'N/A',
            customer_phone: customerPhone || 'N/A',
            customer_address: customerAddress || 'N/A',
            cod_amount: codAmount || 0,
            products: Array.isArray(products) ? products : []
          };
        } catch (e) {
          console.error('[ShippingPersistence] Error parsing order:', e);
          return row;
        }
      });

      return {
        success: true,
        data: orders
      };
    } catch (error: any) {
      console.error('[ShippingPersistence] Failed to get shipping orders:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch shipping orders'
      };
    }
  }
}


