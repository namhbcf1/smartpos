import { Env } from '../../types';
import { 
  InventoryItem, 
  InventoryCreateData, 
  InventoryUpdateData, 
  InventoryQueryParams, 
  InventoryStats,
  StockMovement,
  StockAdjustment,
  StockAdjustmentCreateData,
  StockTransfer,
  StockTransferCreateData,
  Location,
  Supplier
} from './types';
import { InventoryDatabase } from './database';
import { CacheManager, CacheKeys } from '../../utils/cache';

export class InventoryService {
  private db: InventoryDatabase;
  private cache: CacheManager;

  constructor(private env: Env) {
    this.db = new InventoryDatabase(env);
    this.cache = new CacheManager(env);
  }

  // Initialize service
  async initialize(): Promise<void> {
    await this.db.initializeTables();
    await this.db.createDefaultData();
  }

  // Get all inventory items with filtering and pagination
  async getInventoryItems(params: InventoryQueryParams): Promise<{ items: InventoryItem[]; total: number; stats?: InventoryStats }> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        product_id,
        location_id,
        supplier_id,
        status,
        low_stock_only,
        out_of_stock_only,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = params;

      const offset = (page - 1) * limit;

      // Build WHERE clause
      const conditions: string[] = [];
      const bindings: any[] = [];

      if (search) {
        conditions.push('(p.name LIKE ? OR p.sku LIKE ? OR i.batch_number LIKE ? OR i.serial_number LIKE ?)');
        const searchTerm = `%${search}%`;
        bindings.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      if (product_id) {
        conditions.push('i.product_id = ?');
        bindings.push(product_id);
      }

      if (location_id) {
        conditions.push('i.location_id = ?');
        bindings.push(location_id);
      }

      if (supplier_id) {
        conditions.push('i.supplier_id = ?');
        bindings.push(supplier_id);
      }

      if (status) {
        conditions.push('i.status = ?');
        bindings.push(status);
      }

      if (low_stock_only) {
        conditions.push('i.quantity <= p.min_stock_level AND i.quantity > 0');
      }

      if (out_of_stock_only) {
        conditions.push('i.quantity = 0');
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Build ORDER BY clause
      const validSortFields = ['created_at', 'quantity', 'cost_price', 'product_name'];
      const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
      const sortDirection = sort_order === 'asc' ? 'ASC' : 'DESC';

      // Get inventory items with joined data
      const query = `
        SELECT 
          i.*,
          p.name as product_name,
          p.sku as product_sku,
          p.category_name as product_category,
          l.name as location_name,
          s.name as supplier_name
        FROM inventory_items i
        LEFT JOIN products p ON i.product_id = p.id
        LEFT JOIN locations l ON i.location_id = l.id
        LEFT JOIN suppliers s ON i.supplier_id = s.id
        ${whereClause}
        ORDER BY i.${sortField} ${sortDirection}
        LIMIT ? OFFSET ?
      `;

      const items = await this.env.DB.prepare(query)
        .bind(...bindings, limit, offset)
        .all<InventoryItem>();

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM inventory_items i
        LEFT JOIN products p ON i.product_id = p.id
        ${whereClause}
      `;

      const countResult = await this.env.DB.prepare(countQuery)
        .bind(...bindings)
        .first<{ total: number }>();

      const total = countResult?.total || 0;

      // Get stats if requested (first page only)
      let stats: InventoryStats | undefined;
      if (page === 1) {
        stats = await this.db.getStats();
      }

      return {
        items: items.results || [],
        total,
        stats
      };
    } catch (error) {
      console.error('Error getting inventory items:', error);
      throw new Error('Failed to get inventory items');
    }
  }

  // Get inventory item by ID
  async getInventoryItemById(id: number): Promise<InventoryItem | null> {
    try {
      const cacheKey = CacheKeys.inventoryItem(id);
      const cached = await this.cache.get<InventoryItem>(cacheKey);
      if (cached) return cached;

      const item = await this.env.DB.prepare(`
        SELECT 
          i.*,
          p.name as product_name,
          p.sku as product_sku,
          p.category_name as product_category,
          l.name as location_name,
          s.name as supplier_name
        FROM inventory_items i
        LEFT JOIN products p ON i.product_id = p.id
        LEFT JOIN locations l ON i.location_id = l.id
        LEFT JOIN suppliers s ON i.supplier_id = s.id
        WHERE i.id = ?
      `).bind(id).first<InventoryItem>();

      if (item) {
        await this.cache.set(cacheKey, item, 300); // Cache for 5 minutes
      }

      return item || null;
    } catch (error) {
      console.error('Error getting inventory item by ID:', error);
      throw new Error('Failed to get inventory item');
    }
  }

  // Create new inventory item
  async createInventoryItem(data: InventoryCreateData, createdBy: number): Promise<InventoryItem> {
    try {
      // Validate product exists
      const product = await this.env.DB.prepare(
        'SELECT id, name, sku FROM products WHERE id = ? AND is_active = 1'
      ).bind(data.product_id).first<any>();

      if (!product) {
        throw new Error('Product not found or inactive');
      }

      // Create inventory item
      const result = await this.env.DB.prepare(`
        INSERT INTO inventory_items (
          product_id, location_id, batch_number, serial_number,
          quantity, cost_price, selling_price, expiry_date,
          manufacture_date, supplier_id, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        data.product_id,
        data.location_id,
        data.batch_number,
        data.serial_number,
        data.quantity,
        data.cost_price,
        data.selling_price,
        data.expiry_date,
        data.manufacture_date,
        data.supplier_id,
        data.notes,
        createdBy
      ).run();

      const itemId = result.meta.last_row_id as number;

      // Create stock movement record
      await this.createStockMovement({
        product_id: data.product_id,
        movement_type: 'in',
        quantity: data.quantity,
        previous_quantity: 0,
        new_quantity: data.quantity,
        cost_price: data.cost_price,
        reference_type: 'adjustment',
        location_id: data.location_id,
        batch_number: data.batch_number,
        reason: 'Initial stock entry',
        created_by: createdBy
      });

      // Update product stock quantity
      await this.env.DB.prepare(`
        UPDATE products 
        SET stock_quantity = stock_quantity + ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(data.quantity, data.product_id).run();

      // Clear cache
      await this.cache.delete(CacheKeys.inventoryList());

      const newItem = await this.getInventoryItemById(itemId);
      if (!newItem) {
        throw new Error('Failed to retrieve created inventory item');
      }

      return newItem;
    } catch (error) {
      console.error('Error creating inventory item:', error);
      throw error;
    }
  }

  // Update inventory item
  async updateInventoryItem(id: number, data: InventoryUpdateData, updatedBy: number): Promise<InventoryItem> {
    try {
      const existingItem = await this.getInventoryItemById(id);
      if (!existingItem) {
        throw new Error('Inventory item not found');
      }

      // Build update query dynamically
      const updateFields: string[] = [];
      const bindings: any[] = [];

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          updateFields.push(`${key} = ?`);
          bindings.push(value);
        }
      });

      updateFields.push('updated_by = ?', 'updated_at = datetime(\'now\')');
      bindings.push(updatedBy, id);

      await this.env.DB.prepare(`
        UPDATE inventory_items 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `).bind(...bindings).run();

      // If quantity changed, create stock movement
      if (data.quantity !== undefined && data.quantity !== existingItem.quantity) {
        const quantityChange = data.quantity - existingItem.quantity;
        await this.createStockMovement({
          product_id: existingItem.product_id,
          movement_type: quantityChange > 0 ? 'in' : 'out',
          quantity: Math.abs(quantityChange),
          previous_quantity: existingItem.quantity,
          new_quantity: data.quantity,
          cost_price: existingItem.cost_price,
          reference_type: 'adjustment',
          location_id: existingItem.location_id,
          reason: 'Inventory adjustment',
          created_by: updatedBy
        });

        // Update product stock quantity
        await this.env.DB.prepare(`
          UPDATE products 
          SET stock_quantity = stock_quantity + ?,
              updated_at = datetime('now')
          WHERE id = ?
        `).bind(quantityChange, existingItem.product_id).run();
      }

      // Clear cache
      await this.cache.delete(CacheKeys.inventoryItem(id));
      await this.cache.delete(CacheKeys.inventoryList());

      const updatedItem = await this.getInventoryItemById(id);
      if (!updatedItem) {
        throw new Error('Failed to retrieve updated inventory item');
      }

      return updatedItem;
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  }

  // Create stock movement record
  private async createStockMovement(data: {
    product_id: number;
    movement_type: string;
    quantity: number;
    previous_quantity: number;
    new_quantity: number;
    cost_price?: number;
    reference_type?: string;
    reference_id?: number;
    location_id?: number;
    batch_number?: string;
    reason?: string;
    notes?: string;
    created_by: number;
  }): Promise<void> {
    await this.env.DB.prepare(`
      INSERT INTO stock_movements (
        product_id, movement_type, quantity, previous_quantity, new_quantity,
        cost_price, reference_type, reference_id, location_id, batch_number,
        reason, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.product_id,
      data.movement_type,
      data.quantity,
      data.previous_quantity,
      data.new_quantity,
      data.cost_price,
      data.reference_type,
      data.reference_id,
      data.location_id,
      data.batch_number,
      data.reason,
      data.notes,
      data.created_by
    ).run();
  }

  // Get inventory statistics
  async getStats(): Promise<InventoryStats> {
    return await this.db.getStats();
  }

  // Get all locations
  async getLocations(): Promise<Location[]> {
    try {
      const locations = await this.env.DB.prepare(`
        SELECT 
          l.*,
          pl.name as parent_name,
          u.full_name as manager_name
        FROM locations l
        LEFT JOIN locations pl ON l.parent_id = pl.id
        LEFT JOIN users u ON l.manager_id = u.id
        WHERE l.is_active = 1
        ORDER BY l.name
      `).all<Location>();

      return locations.results || [];
    } catch (error) {
      console.error('Error getting locations:', error);
      throw new Error('Failed to get locations');
    }
  }

  // Get all suppliers
  async getSuppliers(): Promise<Supplier[]> {
    try {
      const suppliers = await this.env.DB.prepare(`
        SELECT 
          s.*,
          COUNT(po.id) as total_orders,
          COALESCE(SUM(po.final_amount), 0) as total_value,
          MAX(po.order_date) as last_order_date
        FROM suppliers s
        LEFT JOIN purchase_orders po ON s.id = po.supplier_id
        WHERE s.is_active = 1
        GROUP BY s.id
        ORDER BY s.name
      `).all<Supplier>();

      return suppliers.results || [];
    } catch (error) {
      console.error('Error getting suppliers:', error);
      throw new Error('Failed to get suppliers');
    }
  }
}
