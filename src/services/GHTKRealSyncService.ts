import { Env } from '../types';

interface GHTKRealOrder {
  order_id: string;
  label: string;
  status: string;
  status_text: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  cod_amount: number;
  total_fee: number;
  created_at: string;
  updated_at: string;
  products: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  pickup_info: {
    name: string;
    phone: string;
    address: string;
  };
  delivery_info: {
    name: string;
    phone: string;
    address: string;
  };
  tags: string[];
  timeline: Array<{
    time: string;
    status: string;
    description: string;
    location?: string;
  }>;
}

export class GHTKRealSyncService {
  private readonly env: Env;
  private readonly ghtkToken: string;
  private readonly ghtkBaseUrl: string = 'https://services.giaohangtietkiem.vn';

  constructor(env: Env) {
    this.env = env;
    this.ghtkToken = (env as any).GHTK_TOKEN || '';
  }

  // Fetch order details from GHTK API by order code
  async fetchOrderFromGHTK(orderCode: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const response = await fetch(
        `${this.ghtkBaseUrl}/services/shipment/v2/${encodeURIComponent(orderCode)}`,
        {
          headers: {
            'Token': this.ghtkToken,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.message || `Failed to fetch order ${orderCode}`
        };
      }

      return {
        success: true,
        data: data.order
      };
    } catch (error: any) {
      console.error(`[GHTK Fetch] Failed to fetch order ${orderCode}:`, error);
      return {
        success: false,
        error: error.message || 'Network error'
      };
    }
  }

  // Sync multiple orders from GHTK by order codes
  async syncOrdersByCodesBatch(orderCodes: string[]): Promise<{
    success: boolean;
    synced: number;
    errors: string[];
    data?: GHTKRealOrder[];
  }> {
    const errors: string[] = [];
    const orders: GHTKRealOrder[] = [];

    for (const code of orderCodes) {
      try {
        const result = await this.fetchOrderFromGHTK(code);

        if (result.success && result.data) {
          const transformed = this.transformSingleOrder(result.data, code);
          orders.push(transformed);
        } else {
          errors.push(`Order ${code}: ${result.error || 'Failed to fetch'}`);
        }
      } catch (error: any) {
        errors.push(`Order ${code}: ${error.message}`);
      }
    }

    // Save to database
    if (orders.length > 0) {
      const syncResult = await this.syncOrdersToDatabase(orders);
      return {
        success: syncResult.success,
        synced: syncResult.synced,
        errors: [...errors, ...syncResult.errors],
        data: orders
      };
    }

    return {
      success: false,
      synced: 0,
      errors,
      data: []
    };
  }

  // Transform single GHTK order to standard format
  private transformSingleOrder(ghtkOrder: any, orderCode: string): GHTKRealOrder {
    return {
      order_id: ghtkOrder.label_id || ghtkOrder.partner_id || orderCode,
      label: ghtkOrder.label_id || orderCode,
      status: String(ghtkOrder.status_id || ghtkOrder.status || 'unknown'),
      status_text: ghtkOrder.status_text || ghtkOrder.status || 'Không rõ',
      customer_name: ghtkOrder.customer_fullname || ghtkOrder.customer_name || '',
      customer_phone: ghtkOrder.customer_tel || ghtkOrder.customer_phone || '',
      customer_address: ghtkOrder.address || ghtkOrder.customer_address || '',
      cod_amount: ghtkOrder.pick_money || ghtkOrder.cod_amount || ghtkOrder.value || 0,
      total_fee: ghtkOrder.ship_money || ghtkOrder.total_fee || 0,
      created_at: ghtkOrder.created || new Date().toISOString(),
      updated_at: ghtkOrder.modified || new Date().toISOString(),
      products: (ghtkOrder.products || []).map((p: any) => ({
        name: p.full_name || p.name || 'Sản phẩm',
        quantity: p.quantity || 1,
        price: p.cost || 0
      })),
      pickup_info: {
        name: ghtkOrder.pick_name || 'N/A',
        phone: ghtkOrder.pick_tel || 'N/A',
        address: ghtkOrder.pick_address || 'N/A'
      },
      delivery_info: {
        name: ghtkOrder.customer_fullname || ghtkOrder.customer_name || '',
        phone: ghtkOrder.customer_tel || ghtkOrder.customer_phone || '',
        address: ghtkOrder.address || ghtkOrder.customer_address || ''
      },
      tags: ghtkOrder.tags || [],
      timeline: (ghtkOrder.tracking || []).map((t: any) => ({
        time: t.timestamp || t.time || '',
        status: t.status || t.status_text || '',
        description: t.description || t.note || '',
        location: t.location || ''
      }))
    };
  }

  // Lấy danh sách đơn hàng thật từ GHTK API (from local DB)
  async getRealOrdersFromGHTK(): Promise<{
    success: boolean;
    data?: GHTKRealOrder[];
    error?: string;
  }> {
    try {
      const { ShippingPersistenceService } = await import('./ShippingPersistenceService');
      const persist = new ShippingPersistenceService(this.env);

      const localOrders = await persist.getShippingOrders('ghtk');

      if (!localOrders.success || !localOrders.data) {
        return {
          success: false,
          error: 'No GHTK orders found in local database'
        };
      }

      const orders: GHTKRealOrder[] = localOrders.data.map(order => ({
        order_id: order.carrier_order_code || order.id,
        label: order.carrier_order_code || order.id,
        status: order.status || 'unknown',
        status_text: order.status || 'Unknown',
        customer_name: order.customer_name || 'N/A',
        customer_phone: order.customer_phone || 'N/A',
        customer_address: order.customer_address || 'N/A',
        cod_amount: order.cod_amount || 0,
        total_fee: order.fee_amount || 0,
        created_at: order.created_at || new Date().toISOString(),
        updated_at: order.updated_at || new Date().toISOString(),
        products: order.products || [],
        pickup_info: {
          name: 'SmartPOS Store',
          phone: 'N/A',
          address: 'N/A'
        },
        delivery_info: {
          name: order.customer_name || 'N/A',
          phone: order.customer_phone || 'N/A',
          address: order.customer_address || 'N/A'
        },
        tags: [],
        timeline: []
      }));

      return {
        success: true,
        data: orders
      };
    } catch (error: any) {
      console.error('[GHTK Real Sync] Failed to fetch orders:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch orders from GHTK'
      };
    }
  }

  // Transform dữ liệu GHTK thành format chuẩn
  private transformGHTKData(ghtkData: any): GHTKRealOrder[] {
    // Dựa trên cấu trúc thật của GHTK API response
    const orders: GHTKRealOrder[] = [];
    
    if (ghtkData.success && ghtkData.data) {
      // Xử lý dữ liệu từ GHTK API
      const rawOrders = Array.isArray(ghtkData.data) ? ghtkData.data : [ghtkData.data];
      
      for (const order of rawOrders) {
        orders.push({
          order_id: order.order_id || order.id || `ghtk-${Date.now()}`,
          label: order.label || order.order_code || order.id,
          status: order.status || 'unknown',
          status_text: order.status_text || order.status || 'Chưa xác định',
          customer_name: order.customer_name || order.receiver_name || 'Khách hàng',
          customer_phone: order.customer_phone || order.receiver_phone || '',
          customer_address: order.customer_address || order.receiver_address || '',
          cod_amount: order.cod_amount || order.value || 0,
          total_fee: order.total_fee || order.fee || 0,
          created_at: order.created_at || order.created || new Date().toISOString(),
          updated_at: order.updated_at || order.modified || new Date().toISOString(),
          products: order.products || [{
            name: order.product_name || 'Sản phẩm',
            quantity: order.quantity || 1,
            price: order.price || 0
          }],
          pickup_info: {
            name: order.pickup_name || order.pick_name || 'Kho lấy hàng',
            phone: order.pickup_phone || order.pick_tel || '',
            address: order.pickup_address || order.pick_address || ''
          },
          delivery_info: {
            name: order.delivery_name || order.receiver_name || 'Khách hàng',
            phone: order.delivery_phone || order.receiver_phone || '',
            address: order.delivery_address || order.receiver_address || ''
          },
          tags: order.tags || [],
          timeline: order.timeline || []
        });
      }
    }
    
    return orders;
  }

  // Đồng bộ đơn hàng vào database SmartPOS
  async syncOrdersToDatabase(orders: GHTKRealOrder[]): Promise<{
    success: boolean;
    synced: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let synced = 0;

    for (const order of orders) {
      try {
        // Lưu vào database SmartPOS với dữ liệu đã được validate
        await this.env.DB.prepare(`
          INSERT OR REPLACE INTO shipping_orders (
            id, tenant_id, order_id, carrier, carrier_order_code,
            status, fee_amount, service, payload, response,
            created_at, updated_at, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          `ghtk-${order.order_id}`,
          'default',
          order.order_id || 'unknown',
          'ghtk',
          order.label || 'unknown',
          order.status || 'unknown',
          order.total_fee || 0,
          'road',
          JSON.stringify(order),
          JSON.stringify(order),
          order.created_at || new Date().toISOString(),
          order.updated_at || new Date().toISOString(),
          'ghtk-sync'
        ).run();

        // Lưu timeline events nếu có
        if (order.timeline && order.timeline.length > 0) {
          for (const event of order.timeline) {
            await this.env.DB.prepare(`
              INSERT OR REPLACE INTO shipping_events (
                id, tenant_id, shipping_order_id, carrier, carrier_order_code,
                event_type, event_time, raw_event, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
              `event-${order.order_id}-${event.time || Date.now()}`,
              'default',
              `ghtk-${order.order_id}`,
              'ghtk',
              order.label || 'unknown',
              event.status || 'unknown',
              event.time || new Date().toISOString(),
              JSON.stringify(event),
              new Date().toISOString()
            ).run();
          }
        }

        synced++;
      } catch (error: any) {
        errors.push(`Failed to sync order ${order.order_id}: ${error.message}`);
        console.error(`[GHTK Sync] Failed to sync order ${order.order_id}:`, error);
      }
    }

    return {
      success: errors.length === 0,
      synced,
      errors
    };
  }

  // Tạo deep link đến trang GHTK chính thức
  createGHTKDeepLink(orderCode: string): string {
    return `https://khachhang.giaohangtietkiem.vn/web/van-hanh/don-hang/${orderCode}`;
  }

  // Tạo link đến trang tạo đơn hàng mới
  createNewOrderLink(): string {
    return 'https://khachhang.giaohangtietkiem.vn/web/van-hanh/don-hang/new';
  }

  // Tạo link đến trang tổng quan
  createOverviewLink(): string {
    return 'https://khachhang.giaohangtietkiem.vn/web/van-hanh';
  }
}
