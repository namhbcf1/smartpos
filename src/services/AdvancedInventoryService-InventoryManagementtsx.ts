import { Env } from '../types';

export class AdvancedInventoryService_InventoryManagementtsx {
  constructor(private env: Env) {}

  async getStockSummary() {
    const row = await this.env.DB.prepare(`
      SELECT 
        COUNT(*) AS total_products,
        SUM(stock) AS total_stock,
        SUM(CASE WHEN stock <= COALESCE(min_stock, 0) THEN 1 ELSE 0 END) AS low_stock
      FROM products
    `).first<any>();
    return {
      totalProducts: Number(row?.total_products || 0),
      totalStock: Number(row?.total_stock || 0),
      lowStock: Number(row?.low_stock || 0),
    };
  }

  async getMovements(limit: number = 20) {
    const res = await this.env.DB.prepare(`
      SELECT id, product_id, variant_id, transaction_type, quantity, unit_cost_cents, created_at
      FROM inventory_movements
      ORDER BY datetime(created_at) DESC
      LIMIT ?
    `).bind(limit).all<any>();
    return res.results || [];
  }
}

export default AdvancedInventoryService_InventoryManagementtsx;

