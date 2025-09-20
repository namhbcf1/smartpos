import { Env } from '../../types';
import { 
  Return, 
  ReturnCreateData, 
  ReturnUpdateData, 
  ReturnQueryParams, 
  ReturnStats,
  ReturnApprovalData
} from './types';
import { ReturnsDatabase } from './database';
import { CacheManager, CacheKeys } from '../../utils/cache';

export class ReturnsService {
  private db: ReturnsDatabase;
  private cache: CacheManager;

  constructor(private env: Env) {
    this.db = new ReturnsDatabase(env);
    this.cache = new CacheManager();
  }

  // Initialize service
  async initialize(): Promise<void> {
    try {
      console.log('🔄 Initializing returns service...');
      await this.db.initializeTables();
      console.log('✅ Returns tables initialized');
      await this.db.createDefaultData();
      console.log('✅ Returns default data created');
      console.log('✅ Returns service initialization complete');
    } catch (error) {
      console.error('❌ Returns service initialization failed:', error);
      throw error;
    }
  }

  // Get all returns with filtering and pagination
  async getReturns(params: ReturnQueryParams): Promise<{ returns: Return[]; total: number; stats?: ReturnStats }> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        return_status,
        refund_method,
        return_reason,
        customer_id,
        product_id,
        date_from,
        date_to,
        min_amount,
        max_amount,
        created_by,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = params;

      const offset = (page - 1) * limit;

      // Build WHERE clause
      const conditions: string[] = [];
      const bindings: any[] = [];

      if (search) {
        conditions.push('(r.return_number LIKE ? OR r.return_reason LIKE ? OR s.customer_name LIKE ?)');
        const searchTerm = `%${search}%`;
        bindings.push(searchTerm, searchTerm, searchTerm);
      }

      if (return_status) {
        conditions.push('r.return_status = ?');
        bindings.push(return_status);
      }

      if (refund_method) {
        conditions.push('r.refund_method = ?');
        bindings.push(refund_method);
      }

      if (return_reason) {
        conditions.push('r.return_reason LIKE ?');
        bindings.push(`%${return_reason}%`);
      }

      if (customer_id) {
        conditions.push('s.customer_id = ?');
        bindings.push(customer_id);
      }

      if (product_id) {
        conditions.push('EXISTS (SELECT 1 FROM return_items ri WHERE ri.return_id = r.id AND ri.product_id = ?)');
        bindings.push(product_id);
      }

      if (date_from) {
        conditions.push('DATE(r.created_at) >= ?');
        bindings.push(date_from);
      }

      if (date_to) {
        conditions.push('DATE(r.created_at) <= ?');
        bindings.push(date_to);
      }

      if (min_amount) {
        conditions.push('r.return_amount >= ?');
        bindings.push(min_amount);
      }

      if (max_amount) {
        conditions.push('r.return_amount <= ?');
        bindings.push(max_amount);
      }

      if (created_by) {
        conditions.push('r.created_by = ?');
        bindings.push(created_by);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Build ORDER BY clause
      const validSortFields = ['created_at', 'return_amount', 'return_status', 'return_number'];
      const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
      const sortDirection = sort_order === 'asc' ? 'ASC' : 'DESC';

      // Get returns with joined data
      const query = `
        SELECT 
          r.*,
          s.sale_number as original_sale_number,
          s.customer_name,
          s.customer_phone,
          u1.full_name as created_by_name,
          u2.full_name as approved_by_name,
          u3.full_name as completed_by_name
        FROM returns r
        LEFT JOIN sales s ON r.original_sale_id = s.id
        LEFT JOIN users u1 ON r.created_by = u1.id
        LEFT JOIN users u2 ON r.approved_by = u2.id
        LEFT JOIN users u3 ON r.completed_by = u3.id
        ${whereClause}
        ORDER BY r.${sortField} ${sortDirection}
        LIMIT ? OFFSET ?
      `;

      console.log('🔍 Executing returns query:', query);
      console.log('🔍 Query bindings:', [...bindings, limit, offset]);

      const returns = await this.env.DB.prepare(query)
        .bind(...bindings, limit, offset)
        .all<Return>();

      console.log('✅ Returns query executed, found:', returns.results?.length || 0, 'records');

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM returns r
        LEFT JOIN sales s ON r.original_sale_id = s.id
        ${whereClause}
      `;

      const countResult = await this.env.DB.prepare(countQuery)
        .bind(...bindings)
        .first<{ total: number }>();

      const total = countResult?.total || 0;
      console.log('📊 Total returns count:', total);

      // Get stats if requested (first page only)
      let stats: ReturnStats | undefined;
      if (page === 1) {
        stats = await this.db.getStats();
      }

      return {
        returns: returns.results || [],
        total,
        stats
      };
    } catch (error) {
      console.error('Error getting returns:', error);
      throw new Error('Failed to get returns');
    }
  }

  // Get return by ID with items and transactions
  async getReturnById(id: number): Promise<Return | null> {
    try {
      const cacheKey = CacheKeys.return(id);
      const cached = await this.cache.get<Return>(this.env, cacheKey);
      if (cached) return cached;

      // Get return with joined data
      const returnItem = await this.env.DB.prepare(`
        SELECT 
          r.*,
          s.sale_number as original_sale_number,
          s.customer_name,
          s.customer_phone,
          u1.full_name as created_by_name,
          u2.full_name as approved_by_name,
          u3.full_name as completed_by_name
        FROM returns r
        LEFT JOIN sales s ON r.original_sale_id = s.id
        LEFT JOIN users u1 ON r.created_by = u1.id
        LEFT JOIN users u2 ON r.approved_by = u2.id
        LEFT JOIN users u3 ON r.completed_by = u3.id
        WHERE r.id = ?
      `).bind(id).first<Return>();

      if (!returnItem) return null;

      // Get return items
      const items = await this.env.DB.prepare(`
        SELECT 
          ri.*,
          p.image_url as product_image_url,
          p.category_name as product_category,
          p.stock as current_stock
        FROM return_items ri
        LEFT JOIN products p ON ri.product_id = p.id
        WHERE ri.return_id = ?
        ORDER BY ri.id
      `).bind(id).all<any>();

      returnItem.items = items.results || [];

      // Get refund transactions
      const transactions = await this.env.DB.prepare(`
        SELECT 
          rt.*,
          u.full_name as created_by_name
        FROM refund_transactions rt
        LEFT JOIN users u ON rt.created_by = u.id
        WHERE rt.return_id = ?
        ORDER BY rt.created_at
      `).bind(id).all<any>();

      returnItem.refund_transactions = transactions.results || [];

      await this.cache.set(this.env, cacheKey, returnItem, { ttl: 300 }); // Cache for 5 minutes
      return returnItem;
    } catch (error) {
      console.error('Error getting return by ID:', error);
      throw new Error('Failed to get return');
    }
  }

  // Create new return
  async createReturn(data: ReturnCreateData, createdBy: number): Promise<Return> {
    try {
      // Generate return number
      const returnNumber = await this.db.generateReturnNumber();

      // Validate original sale exists
      const originalSale = await this.env.DB.prepare(
        'SELECT id, sale_number, customer_name, customer_phone FROM sales WHERE id = ?'
      ).bind(data.original_sale_id).first<any>();

      if (!originalSale) {
        throw new Error('Original sale not found');
      }

      // Calculate total return amount
      let totalReturnAmount = 0;
      for (const item of data.items) {
        // Get sale item details
        const saleItem = await this.env.DB.prepare(
          'SELECT unit_price, quantity FROM sale_items WHERE id = ? AND sale_id = ?'
        ).bind(item.sale_item_id, data.original_sale_id).first<any>();

        if (!saleItem) {
          throw new Error(`Sale item ${item.sale_item_id} not found`);
        }

        if (item.quantity_returned > saleItem.quantity) {
          throw new Error(`Cannot return more than original quantity for item ${item.sale_item_id}`);
        }

        totalReturnAmount += saleItem.unit_price * item.quantity_returned;
      }

      // Apply fees
      const processingFee = data.processing_fee || 0;
      const restockingFee = data.restocking_fee || 0;
      const finalRefundAmount = totalReturnAmount - processingFee - restockingFee;

      // Create return
      const returnResult = await this.env.DB.prepare(`
        INSERT INTO returns (
          original_sale_id, return_number, return_amount, return_reason,
          refund_method, refund_amount, processing_fee, restocking_fee,
          notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        data.original_sale_id,
        returnNumber,
        totalReturnAmount,
        data.return_reason,
        data.refund_method,
        finalRefundAmount,
        processingFee,
        restockingFee,
        data.notes,
        createdBy
      ).run();

      const returnId = returnResult.meta.last_row_id as number;

      // Create return items
      for (const item of data.items) {
        const saleItem = await this.env.DB.prepare(
          'SELECT product_id, product_name, product_sku, unit_price FROM sale_items WHERE id = ?'
        ).bind(item.sale_item_id).first<any>();

        await this.env.DB.prepare(`
          INSERT INTO return_items (
            return_id, sale_item_id, product_id, product_name, product_sku,
            quantity_returned, quantity_original, unit_price, total_amount,
            return_reason, condition, restockable, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          returnId,
          item.sale_item_id,
          saleItem.product_id,
          saleItem.product_name,
          saleItem.product_sku,
          item.quantity_returned,
          saleItem.quantity,
          saleItem.unit_price,
          saleItem.unit_price * item.quantity_returned,
          item.return_reason,
          item.condition,
          item.restockable ? 1 : 0,
          item.notes
        ).run();
      }

      // Clear cache
      await this.cache.delete(this.env, CacheKeys.returnsList());

      const newReturn = await this.getReturnById(returnId);
      if (!newReturn) {
        throw new Error('Failed to retrieve created return');
      }

      return newReturn;
    } catch (error) {
      console.error('Error creating return:', error);
      throw error;
    }
  }

  // Update return
  async updateReturn(id: number, data: ReturnUpdateData, updatedBy: number): Promise<Return> {
    try {
      const existingReturn = await this.getReturnById(id);
      if (!existingReturn) {
        throw new Error('Return not found');
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

      updateFields.push('updated_at = datetime(\'now\')');
      bindings.push(id);

      await this.env.DB.prepare(`
        UPDATE returns 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `).bind(...bindings).run();

      // Clear cache
      await this.cache.delete(this.env, CacheKeys.return(id));
      await this.cache.delete(this.env, CacheKeys.returnsList());

      const updatedReturn = await this.getReturnById(id);
      if (!updatedReturn) {
        throw new Error('Failed to retrieve updated return');
      }

      return updatedReturn;
    } catch (error) {
      console.error('Error updating return:', error);
      throw error;
    }
  }

  // Approve return
  async approveReturn(id: number, data: ReturnApprovalData, approvedBy: number): Promise<Return> {
    try {
      const existingReturn = await this.getReturnById(id);
      if (!existingReturn) {
        throw new Error('Return not found');
      }

      if (existingReturn.return_status !== 'pending') {
        throw new Error('Only pending returns can be approved');
      }

      await this.env.DB.prepare(`
        UPDATE returns 
        SET return_status = 'approved',
            refund_amount = ?,
            store_credit_amount = ?,
            processing_fee = ?,
            restocking_fee = ?,
            notes = COALESCE(?, notes),
            approved_at = datetime('now'),
            approved_by = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(
        data.refund_amount,
        data.store_credit_amount || 0,
        data.processing_fee || existingReturn.processing_fee,
        data.restocking_fee || existingReturn.restocking_fee,
        data.approval_notes,
        approvedBy,
        id
      ).run();

      // Clear cache
      await this.cache.delete(this.env, CacheKeys.return(id));
      await this.cache.delete(this.env, CacheKeys.returnsList());

      const approvedReturn = await this.getReturnById(id);
      if (!approvedReturn) {
        throw new Error('Failed to retrieve approved return');
      }

      return approvedReturn;
    } catch (error) {
      console.error('Error approving return:', error);
      throw error;
    }
  }

  // Reject return
  async rejectReturn(id: number, rejectionReason: string, rejectedBy: number): Promise<Return> {
    try {
      const existingReturn = await this.getReturnById(id);
      if (!existingReturn) {
        throw new Error('Return not found');
      }

      if (existingReturn.return_status !== 'pending') {
        throw new Error('Only pending returns can be rejected');
      }

      await this.env.DB.prepare(`
        UPDATE returns 
        SET return_status = 'rejected',
            notes = ?,
            approved_at = datetime('now'),
            approved_by = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(rejectionReason, rejectedBy, id).run();

      // Clear cache
      await this.cache.delete(this.env, CacheKeys.return(id));
      await this.cache.delete(this.env, CacheKeys.returnsList());

      const rejectedReturn = await this.getReturnById(id);
      if (!rejectedReturn) {
        throw new Error('Failed to retrieve rejected return');
      }

      return rejectedReturn;
    } catch (error) {
      console.error('Error rejecting return:', error);
      throw error;
    }
  }

  // Complete return processing
  async completeReturn(id: number, completedBy: number): Promise<Return> {
    try {
      const existingReturn = await this.getReturnById(id);
      if (!existingReturn) {
        throw new Error('Return not found');
      }

      if (existingReturn.return_status !== 'approved') {
        throw new Error('Only approved returns can be completed');
      }

      // Update return status
      await this.env.DB.prepare(`
        UPDATE returns 
        SET return_status = 'completed',
            completed_at = datetime('now'),
            completed_by = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(completedBy, id).run();

      // Restock items if applicable
      if (existingReturn.items) {
        for (const item of existingReturn.items) {
          if (item.restockable && item.condition === 'new') {
            await this.env.DB.prepare(`
              UPDATE products 
              SET stock = stock + ?
              WHERE id = ?
            `).bind(item.quantity_returned, item.product_id).run();
          }
        }
      }

      // Clear cache
      await this.cache.delete(this.env, CacheKeys.return(id));
      await this.cache.delete(this.env, CacheKeys.returnsList());

      const completedReturn = await this.getReturnById(id);
      if (!completedReturn) {
        throw new Error('Failed to retrieve completed return');
      }

      return completedReturn;
    } catch (error) {
      console.error('Error completing return:', error);
      throw error;
    }
  }

  // Get returns statistics
  async getStats(): Promise<ReturnStats> {
    return await this.db.getStats();
  }
}
