import { Context } from 'hono';
import { Env } from '../../types';
import { InventoryService } from './service';
import { 
  InventoryQueryParams, 
  InventoryCreateData, 
  InventoryUpdateData, 
  InventoryResponse,
  StockAdjustmentCreateData,
  StockTransferCreateData
} from './types';
import { getUser } from '../../middleware/auth';

export class InventoryHandlers {
  private service: InventoryService;

  constructor(env: Env) {
    this.service = new InventoryService(env);
  }

  // Initialize service
  async initialize(): Promise<void> {
    await this.service.initialize();
  }

  // GET /inventory - Get all inventory items with filtering and pagination
  async getInventoryItems(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
      const query = c.req.query();
      const params: InventoryQueryParams = {
        page: query.page ? parseInt(query.page) : 1,
        limit: query.limit ? parseInt(query.limit) : 20,
        search: query.search,
        product_id: query.product_id ? parseInt(query.product_id) : undefined,
        location_id: query.location_id ? parseInt(query.location_id) : undefined,
        supplier_id: query.supplier_id ? parseInt(query.supplier_id) : undefined,
        status: query.status,
        low_stock_only: query.low_stock_only === 'true',
        out_of_stock_only: query.out_of_stock_only === 'true',
        sort_by: query.sort_by || 'created_at',
        sort_order: query.sort_order as 'asc' | 'desc' || 'desc'
      };

      const result = await this.service.getInventoryItems(params);

      const response: InventoryResponse = {
        success: true,
        data: result.items,
        pagination: {
          page: params.page || 1,
          limit: params.limit || 20,
          total: result.total,
          pages: Math.ceil(result.total / (params.limit || 20))
        },
        stats: result.stats
      };

      return c.json(response);
    } catch (error) {
      console.error('Error in getInventoryItems handler:', error);
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get inventory items'
      }, 500);
    }
  }

  // GET /inventory/:id - Get inventory item by ID
  async getInventoryItemById(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
      const id = parseInt(c.req.param('id'));
      if (isNaN(id)) {
        return c.json({
          success: false,
          message: 'Invalid inventory item ID'
        }, 400);
      }

      const item = await this.service.getInventoryItemById(id);
      if (!item) {
        return c.json({
          success: false,
          message: 'Inventory item not found'
        }, 404);
      }

      const response: InventoryResponse = {
        success: true,
        data: item
      };

      return c.json(response);
    } catch (error) {
      console.error('Error in getInventoryItemById handler:', error);
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get inventory item'
      }, 500);
    }
  }

  // POST /inventory - Create new inventory item
  async createInventoryItem(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
      const currentUser = getUser(c);
      if (!currentUser) {
        return c.json({
          success: false,
          message: 'Authentication required'
        }, 401);
      }

      const data = await c.req.json<InventoryCreateData>();
      
      // Basic validation
      if (!data.product_id || !data.quantity || data.quantity <= 0 || !data.cost_price || data.cost_price <= 0) {
        return c.json({
          success: false,
          message: 'Invalid data: product_id, positive quantity, and positive cost_price are required'
        }, 400);
      }

      const item = await this.service.createInventoryItem(data, currentUser.id);

      const response: InventoryResponse = {
        success: true,
        data: item,
        message: 'Inventory item created successfully'
      };

      return c.json(response, 201);
    } catch (error) {
      console.error('Error in createInventoryItem handler:', error);
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create inventory item'
      }, 500);
    }
  }

  // PUT /inventory/:id - Update inventory item
  async updateInventoryItem(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
      const currentUser = getUser(c);
      if (!currentUser) {
        return c.json({
          success: false,
          message: 'Authentication required'
        }, 401);
      }

      const id = parseInt(c.req.param('id'));
      if (isNaN(id)) {
        return c.json({
          success: false,
          message: 'Invalid inventory item ID'
        }, 400);
      }

      const data = await c.req.json<InventoryUpdateData>();

      const item = await this.service.updateInventoryItem(id, data, currentUser.id);

      const response: InventoryResponse = {
        success: true,
        data: item,
        message: 'Inventory item updated successfully'
      };

      return c.json(response);
    } catch (error) {
      console.error('Error in updateInventoryItem handler:', error);
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update inventory item'
      }, 500);
    }
  }

  // GET /inventory/stats - Get inventory statistics
  async getStats(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
      const stats = await this.service.getStats();

      const response: InventoryResponse = {
        success: true,
        stats
      };

      return c.json(response);
    } catch (error) {
      console.error('Error in getStats handler:', error);
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get inventory statistics'
      }, 500);
    }
  }

  // GET /inventory/locations - Get all locations
  async getLocations(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
      const locations = await this.service.getLocations();

      const response: InventoryResponse = {
        success: true,
        data: locations
      };

      return c.json(response);
    } catch (error) {
      console.error('Error in getLocations handler:', error);
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get locations'
      }, 500);
    }
  }

  // GET /inventory/suppliers - Get all suppliers
  async getSuppliers(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
      const suppliers = await this.service.getSuppliers();

      const response: InventoryResponse = {
        success: true,
        data: suppliers
      };

      return c.json(response);
    } catch (error) {
      console.error('Error in getSuppliers handler:', error);
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get suppliers'
      }, 500);
    }
  }

  // GET /inventory/low-stock - Get low stock items
  async getLowStockItems(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
      const params: InventoryQueryParams = {
        page: 1,
        limit: 100,
        low_stock_only: true,
        sort_by: 'quantity',
        sort_order: 'asc'
      };

      const result = await this.service.getInventoryItems(params);

      const response: InventoryResponse = {
        success: true,
        data: result.items
      };

      return c.json(response);
    } catch (error) {
      console.error('Error in getLowStockItems handler:', error);
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get low stock items'
      }, 500);
    }
  }

  // GET /inventory/out-of-stock - Get out of stock items
  async getOutOfStockItems(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
      const params: InventoryQueryParams = {
        page: 1,
        limit: 100,
        out_of_stock_only: true,
        sort_by: 'created_at',
        sort_order: 'desc'
      };

      const result = await this.service.getInventoryItems(params);

      const response: InventoryResponse = {
        success: true,
        data: result.items
      };

      return c.json(response);
    } catch (error) {
      console.error('Error in getOutOfStockItems handler:', error);
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get out of stock items'
      }, 500);
    }
  }

  // POST /inventory/bulk-update - Bulk update inventory items
  async bulkUpdateInventory(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
      const currentUser = getUser(c);
      if (!currentUser) {
        return c.json({
          success: false,
          message: 'Authentication required'
        }, 401);
      }

      const { items } = await c.req.json<{ items: Array<{ id: number; data: InventoryUpdateData }> }>();
      
      if (!items || items.length === 0) {
        return c.json({
          success: false,
          message: 'No items provided for update'
        }, 400);
      }

      const updatedItems = [];
      for (const { id, data } of items) {
        try {
          const updatedItem = await this.service.updateInventoryItem(id, data, currentUser.id);
          updatedItems.push(updatedItem);
        } catch (error) {
          console.error(`Error updating inventory item ${id}:`, error);
          // Continue with other items
        }
      }

      const response: InventoryResponse = {
        success: true,
        data: updatedItems,
        message: `Successfully updated ${updatedItems.length} out of ${items.length} items`
      };

      return c.json(response);
    } catch (error) {
      console.error('Error in bulkUpdateInventory handler:', error);
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to bulk update inventory'
      }, 500);
    }
  }
}
