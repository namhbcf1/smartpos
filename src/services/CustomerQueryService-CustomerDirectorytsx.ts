import { BaseService, ServiceResponse } from './BaseService';
import { Env } from '../types';

export interface CustomerCompleteInfo { customer: any; orders: any[]; summary: any }

export class CustomerQueryService_CustomerDirectorytsx extends BaseService {
  constructor(env: Env) { super(env, 'customers', 'id'); }

  async getCompleteInfoByPhone(phone: string, tenantId: string = 'default'): Promise<ServiceResponse<CustomerCompleteInfo>> {
    const customer = await (this as any).env.DB.prepare(`SELECT id, phone, name, email, address FROM customers WHERE phone = ? AND tenant_id = ?`).bind(phone, tenantId).first<any>();
    if (!customer) return { success: false, error: 'Không tìm thấy khách hàng với số điện thoại này' } as any;

    const rows = await (this as any).env.DB.prepare(`
      SELECT o.id as order_id, o.order_number, o.created_at as ngay_mua_hang, o.payment_method as phuong_thuc_thanh_toan, o.total_cents,
             u.full_name as nguoi_ban, oi.id as order_item_id, p.id as product_id, p.sku as ma_san_pham, p.name as ten_san_pham,
             b.name as hang_san_xuat, oi.unit_price_cents as gia_ban_cents, sn.id as serial_id, sn.serial_number,
             w.id as warranty_id, w.warranty_code, w.start_date as ngay_kich_hoat, w.end_date as ngay_het_han, w.status as warranty_status
      FROM orders o
      INNER JOIN order_items oi ON o.id = oi.order_id
      INNER JOIN products p ON oi.product_id = p.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN serial_numbers sn ON sn.order_id = o.id AND sn.product_id = p.id
      LEFT JOIN warranties w ON w.order_id = o.id AND w.serial_number_id = sn.id
      WHERE o.customer_id = ? AND o.tenant_id = ?
      ORDER BY o.created_at DESC, oi.id
    `).bind(customer.id, tenantId).all<any>();

    const ordersMap = new Map<string, any>();
    for (const row of rows.results || []) {
      if (!ordersMap.has(row.order_id)) {
        ordersMap.set(row.order_id, { order_id: row.order_id, order_number: row.order_number, ngay_mua_hang: row.ngay_mua_hang, phuong_thuc_thanh_toan: row.phuong_thuc_thanh_toan, nguoi_ban: row.nguoi_ban || 'N/A', total_amount: (row.total_cents || 0) / 100, products: [] });
      }
      const order = ordersMap.get(row.order_id);
      let thoi_han_thang = 0;
      if (row.ngay_kich_hoat && row.ngay_het_han) {
        const start = new Date(row.ngay_kich_hoat); const end = new Date(row.ngay_het_han);
        thoi_han_thang = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
      }
      order.products.push({
        product_id: row.product_id,
        ma_san_pham: row.ma_san_pham,
        ten_san_pham: row.ten_san_pham,
        hang_san_xuat: row.hang_san_xuat || 'N/A',
        serial_number: row.serial_number,
        gia_ban: (row.gia_ban_cents || 0) / 100,
        warranty: row.warranty_id ? { warranty_id: row.warranty_id, warranty_code: row.warranty_code, ngay_kich_hoat: row.ngay_kich_hoat, ngay_het_han: row.ngay_het_han, thoi_han_thang, trang_thai: row.warranty_status, service_history: [] } : undefined
      });
    }

    const orders = Array.from(ordersMap.values());
    let totalProducts = 0, totalSpent = 0, activeWarranties = 0, expiredWarranties = 0, totalServices = 0;
    for (const order of orders) {
      totalSpent += order.total_amount;
      for (const product of order.products) {
        totalProducts++;
        if (product.warranty) {
          const isActive = product.warranty.trang_thai === 'active';
          if (isActive) activeWarranties++; else expiredWarranties++;
          totalServices += (product.warranty.service_history || []).length;
        }
      }
    }

    return { success: true, data: { customer, orders, summary: { total_orders: orders.length, total_products: totalProducts, total_spent: totalSpent, active_warranties: activeWarranties, expired_warranties: expiredWarranties, total_services: totalServices } } } as any;
  }
}

export default CustomerQueryService_CustomerDirectorytsx;

