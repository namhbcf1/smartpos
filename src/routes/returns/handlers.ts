import { Context } from 'hono';
import { Env } from '../../types';
import { ReturnsService } from './service';
import { 
  ReturnQueryParams, 
  ReturnCreateData, 
  ReturnUpdateData, 
  ReturnResponse,
  ReturnApprovalData
} from './types';
import { getUser } from '../../middleware/auth';

export class ReturnsHandlers {
  private service: ReturnsService;

  constructor(env: Env) {
    this.service = new ReturnsService(env);
  }

  // Initialize service
  async initialize(): Promise<void> {
    try {
      await this.service.initialize();
      console.log('✅ Returns service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize returns service:', error);
      // Don't throw error to prevent blocking the entire application
    }
  }

  // GET /returns - Get all returns with filtering and pagination
  async getReturns(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
      console.log('🔍 Returns handler called');

      const query = c.req.query();
      const params: ReturnQueryParams = {
        page: query.page ? parseInt(query.page) : 1,
        limit: query.limit ? parseInt(query.limit) : 20,
        search: query.search,
        return_status: query.return_status,
        refund_method: query.refund_method,
        return_reason: query.return_reason,
        customer_id: query.customer_id ? parseInt(query.customer_id) : undefined,
        product_id: query.product_id ? parseInt(query.product_id) : undefined,
        date_from: query.date_from,
        date_to: query.date_to,
        min_amount: query.min_amount ? parseFloat(query.min_amount) : undefined,
        max_amount: query.max_amount ? parseFloat(query.max_amount) : undefined,
        created_by: query.created_by ? parseInt(query.created_by) : undefined,
        sort_by: query.sort_by || 'created_at',
        sort_order: (query.sort_order as 'asc' | 'desc') || 'desc'
      };

      console.log('📄 Returns query params:', params);

      try {
        const result = await this.service.getReturns(params);

        const response: ReturnResponse = {
          success: true,
          data: result.returns,
          pagination: {
            page: params.page || 1,
            limit: params.limit || 20,
            total: result.total,
            pages: Math.ceil(result.total / (params.limit || 20))
          },
          stats: result.stats
        };

        return c.json(response);
      } catch (serviceError) {
        console.warn('Service error, falling back to empty response:', serviceError);

        // Fallback response when service fails
        const response: ReturnResponse = {
          success: true,
          data: [],
          pagination: {
            page: params.page || 1,
            limit: params.limit || 20,
            total: 0,
            pages: 0
          },
          message: 'Returns system is initializing. Please try again in a moment.'
        };

        return c.json(response);
      }
    } catch (error) {
      console.error('Error in getReturns handler:', error);
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get returns'
      }, 500);
    }
  }

  // GET /returns/:id - Get return by ID
  async getReturnById(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
      const id = parseInt(c.req.param('id'));
      if (isNaN(id)) {
        return c.json({
          success: false,
          message: 'Invalid return ID'
        }, 400);
      }

      const returnItem = await this.service.getReturnById(id);
      if (!returnItem) {
        return c.json({
          success: false,
          message: 'Return not found'
        }, 404);
      }

      const response: ReturnResponse = {
        success: true,
        data: returnItem
      };

      return c.json(response);
    } catch (error) {
      console.error('Error in getReturnById handler:', error);
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get return'
      }, 500);
    }
  }

  // POST /returns - Create new return
  async createReturn(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
      const currentUser = getUser(c);
      if (!currentUser) {
        return c.json({
          success: false,
          message: 'Authentication required'
        }, 401);
      }

      const data = await c.req.json<ReturnCreateData>();
      
      // Basic validation
      if (!data.original_sale_id || !data.return_reason) {
        return c.json({
          success: false,
          message: 'Original sale ID and return reason are required'
        }, 400);
      }

      if (!data.items || data.items.length === 0) {
        return c.json({
          success: false,
          message: 'At least one item must be returned'
        }, 400);
      }

      const returnItem = await this.service.createReturn(data, currentUser.id);

      const response: ReturnResponse = {
        success: true,
        data: returnItem,
        message: 'Return created successfully'
      };

      return c.json(response, 201);
    } catch (error) {
      console.error('Error in createReturn handler:', error);
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create return'
      }, 500);
    }
  }

  // PUT /returns/:id - Update return
  async updateReturn(c: Context<{ Bindings: Env }>): Promise<Response> {
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
          message: 'Invalid return ID'
        }, 400);
      }

      const data = await c.req.json<ReturnUpdateData>();

      const returnItem = await this.service.updateReturn(id, data, currentUser.id);

      const response: ReturnResponse = {
        success: true,
        data: returnItem,
        message: 'Return updated successfully'
      };

      return c.json(response);
    } catch (error) {
      console.error('Error in updateReturn handler:', error);
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update return'
      }, 500);
    }
  }

  // POST /returns/:id/approve - Approve return
  async approveReturn(c: Context<{ Bindings: Env }>): Promise<Response> {
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
          message: 'Invalid return ID'
        }, 400);
      }

      const data = await c.req.json<ReturnApprovalData>();

      const returnItem = await this.service.approveReturn(id, data, currentUser.id);

      const response: ReturnResponse = {
        success: true,
        data: returnItem,
        message: 'Return approved successfully'
      };

      return c.json(response);
    } catch (error) {
      console.error('Error in approveReturn handler:', error);
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to approve return'
      }, 500);
    }
  }

  // POST /returns/:id/reject - Reject return
  async rejectReturn(c: Context<{ Bindings: Env }>): Promise<Response> {
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
          message: 'Invalid return ID'
        }, 400);
      }

      const { rejection_reason } = await c.req.json<{ rejection_reason: string }>();

      if (!rejection_reason || rejection_reason.trim().length === 0) {
        return c.json({
          success: false,
          message: 'Rejection reason is required'
        }, 400);
      }

      const returnItem = await this.service.rejectReturn(id, rejection_reason, currentUser.id);

      const response: ReturnResponse = {
        success: true,
        data: returnItem,
        message: 'Return rejected successfully'
      };

      return c.json(response);
    } catch (error) {
      console.error('Error in rejectReturn handler:', error);
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to reject return'
      }, 500);
    }
  }

  // POST /returns/:id/complete - Complete return processing
  async completeReturn(c: Context<{ Bindings: Env }>): Promise<Response> {
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
          message: 'Invalid return ID'
        }, 400);
      }

      const returnItem = await this.service.completeReturn(id, currentUser.id);

      const response: ReturnResponse = {
        success: true,
        data: returnItem,
        message: 'Return completed successfully'
      };

      return c.json(response);
    } catch (error) {
      console.error('Error in completeReturn handler:', error);
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to complete return'
      }, 500);
    }
  }

  // GET /returns/stats - Get returns statistics
  async getStats(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
      const stats = await this.service.getStats();

      const response: ReturnResponse = {
        success: true,
        stats
      };

      return c.json(response);
    } catch (error) {
      console.error('Error in getStats handler:', error);
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get returns statistics'
      }, 500);
    }
  }

  // GET /returns/recent - Get recent returns
  async getRecentReturns(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
      const limit = parseInt(c.req.query('limit') || '10');
      
      const params: ReturnQueryParams = {
        page: 1,
        limit: Math.min(limit, 50), // Max 50 items
        sort_by: 'created_at',
        sort_order: 'desc'
      };

      const result = await this.service.getReturns(params);

      const response: ReturnResponse = {
        success: true,
        data: result.returns
      };

      return c.json(response);
    } catch (error) {
      console.error('Error in getRecentReturns handler:', error);
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get recent returns'
      }, 500);
    }
  }

  // GET /returns/pending - Get pending returns
  async getPendingReturns(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
      const params: ReturnQueryParams = {
        page: 1,
        limit: 100,
        return_status: 'pending',
        sort_by: 'created_at',
        sort_order: 'asc'
      };

      const result = await this.service.getReturns(params);

      const response: ReturnResponse = {
        success: true,
        data: result.returns
      };

      return c.json(response);
    } catch (error) {
      console.error('Error in getPendingReturns handler:', error);
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get pending returns'
      }, 500);
    }
  }
}
