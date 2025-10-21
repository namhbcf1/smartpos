import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { SupportService_SupportTicketstsx as SupportService } from '../../services/SupportService-SupportTicketstsx';
import { Env } from '../../types';

const supportRouter = new Hono<{ Bindings: Env }>();

// Validation schemas
const createTicketSchema = z.object({
  title: z.string().min(1, 'Tiêu đề là bắt buộc'),
  description: z.string().min(1, 'Mô tả là bắt buộc'),
  category: z.enum(['general', 'technical', 'billing', 'feature', 'bug']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z.enum(['open', 'in_progress', 'pending', 'resolved', 'closed']).default('open'),
  assigned_to: z.string().optional(),
  customer_id: z.string().optional(),
  tags: z.string().optional(),
});

const updateTicketSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  category: z.enum(['general', 'technical', 'billing', 'feature', 'bug']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['open', 'in_progress', 'pending', 'resolved', 'closed']).optional(),
  assigned_to: z.string().optional(),
  customer_id: z.string().optional(),
  tags: z.string().optional(),
});

const ticketQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  pageSize: z.string().transform(Number).default('10'),
  search: z.string().optional(),
  status: z.enum(['open', 'in_progress', 'pending', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  category: z.enum(['general', 'technical', 'billing', 'feature', 'bug']).optional(),
  sortBy: z.enum(['created_at', 'priority', 'title']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const commentSchema = z.object({
  content: z.string().min(1, 'Nội dung comment là bắt buộc'),
  is_internal: z.boolean().default(false),
});

const assignTicketSchema = z.object({
  assigned_to: z.string().min(1, 'ID người được giao là bắt buộc'),
});

const changeStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'pending', 'resolved', 'closed']),
});

const bulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1),
});

const bulkUpdateSchema = z.object({
  ids: z.array(z.string()).min(1),
  data: updateTicketSchema,
});

// GET /support/tickets - Get all tickets with pagination and filtering
supportRouter.get(
  '/tickets',
  zValidator('query', ticketQuerySchema),
  async (c) => {
    try {
      console.log('Support tickets API - c.env:', c.env);
      console.log('Support tickets API - c.env.DB:', c.env?.DB);
      const supportService = new SupportService(c.env);
      const tenantId = (c.get as any)('tenantId') || 'default';
      const userId = (c.get as any)('userId');
      
      const {
        page,
        pageSize,
        search,
        status,
        priority,
        category,
        sortBy,
        sortOrder
      } = c.req.valid('query');

      console.log('Fetching support tickets with params:', {
        tenantId,
        userId,
        page,
        pageSize,
        search,
        status,
        priority,
        category,
        sortBy,
        sortOrder
      });

      const result = await supportService.getTickets(tenantId, {
        page,
        pageSize,
        search,
        status,
        priority,
        category,
        sortBy,
        sortOrder
      });

      console.log('Support tickets fetched successfully:', result);

      return c.json({
        success: true,
        data: result,
        message: 'Lấy danh sách ticket hỗ trợ thành công'
      });
    } catch (error: any) {
      console.error('Error fetching support tickets:', error);
      return c.json({
        success: false,
        error: error.message || 'Không thể lấy danh sách ticket hỗ trợ'
      }, 500);
    }
  }
);

// GET /support/tickets/:id - Get ticket by ID
supportRouter.get(
  '/tickets/:id',
  async (c) => {
    try {
      const supportService = new SupportService(c.env);
      const tenantId = (c.get as any)('tenantId') || 'default';
      const ticketId = c.req.param('id');

      console.log('Fetching support ticket:', { tenantId, ticketId });

      const result = await supportService.getTicketById(ticketId, tenantId);

      if (!result.success) {
        return c.json({
          success: false,
          error: result.error || 'Không tìm thấy ticket hỗ trợ'
        }, 404);
      }

      console.log('Support ticket fetched successfully:', result.ticket);

      return c.json({
        success: true,
        data: result.ticket,
        message: 'Lấy thông tin ticket hỗ trợ thành công'
      });
    } catch (error: any) {
      console.error('Error fetching support ticket:', error);
      return c.json({
        success: false,
        error: error.message || 'Không thể lấy thông tin ticket hỗ trợ'
      }, 500);
    }
  }
);

// POST /support/tickets - Create new ticket
supportRouter.post(
  '/tickets',
  zValidator('json', createTicketSchema),
  async (c) => {
    try {
      const supportService = new SupportService(c.env);
      const tenantId = (c.get as any)('tenantId') || 'default';
      const userId = (c.get as any)('userId');
      const data = c.req.valid('json');

      console.log('Creating support ticket:', { tenantId, userId, data });

      const result = await supportService.createTicket(tenantId || 'default', {
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        status: data.status,
        assigned_to: data.assigned_to,
        customer_id: data.customer_id,
        tags: data.tags,
        created_by: userId || 'system'
      });

      if (!result.success) {
        return c.json({
          success: false,
          error: result.error || 'Không thể tạo ticket hỗ trợ'
        }, 400);
      }

      console.log('Support ticket created successfully:', result.data);

      return c.json({
        success: true,
        data: result.data,
        message: 'Tạo ticket hỗ trợ thành công'
      }, 201);
    } catch (error: any) {
      console.error('Error creating support ticket:', error);
      return c.json({
        success: false,
        error: error.message || 'Không thể tạo ticket hỗ trợ'
      }, 500);
    }
  }
);

// PUT /support/tickets/:id - Update ticket
supportRouter.put(
  '/tickets/:id',
  zValidator('json', updateTicketSchema),
  async (c) => {
    try {
      const supportService = new SupportService(c.env);
      const tenantId = (c.get as any)('tenantId') || 'default';
      const userId = (c.get as any)('userId');
      const ticketId = c.req.param('id');
      const data = c.req.valid('json');

      console.log('Updating support ticket:', { tenantId, userId, ticketId, data });

      const result = await supportService.updateTicket(ticketId, tenantId, {
        ...data,
        updated_by: userId || 'system'
      });

      if (!result.success) {
        return c.json({
          success: false,
          error: result.error || 'Không thể cập nhật ticket hỗ trợ'
        }, 400);
      }

      console.log('Support ticket updated successfully:', result.ticket);

      return c.json({
        success: true,
        data: result.ticket,
        message: 'Cập nhật ticket hỗ trợ thành công'
      });
    } catch (error: any) {
      console.error('Error updating support ticket:', error);
      return c.json({
        success: false,
        error: error.message || 'Không thể cập nhật ticket hỗ trợ'
      }, 500);
    }
  }
);

// DELETE /support/tickets/:id - Delete ticket
supportRouter.delete(
  '/tickets/:id',
  async (c) => {
    try {
      const supportService = new SupportService(c.env);
      const tenantId = (c.get as any)('tenantId') || 'default';
      const userId = (c.get as any)('userId');
      const ticketId = c.req.param('id');

      console.log('Deleting support ticket:', { tenantId, userId, ticketId });

      const result = await supportService.deleteTicket(ticketId, tenantId);

      if (!result.success) {
        return c.json({
          success: false,
          error: (result as any).error || 'Không thể xóa ticket hỗ trợ'
        }, 400);
      }

      console.log('Support ticket deleted successfully:', ticketId);

      return c.json({
        success: true,
        message: 'Xóa ticket hỗ trợ thành công'
      });
    } catch (error: any) {
      console.error('Error deleting support ticket:', error);
      return c.json({
        success: false,
        error: error.message || 'Không thể xóa ticket hỗ trợ'
      }, 500);
    }
  }
);

// POST /support/tickets/:id/comments - Add comment to ticket
supportRouter.post(
  '/tickets/:id/comments',
  zValidator('json', commentSchema),
  async (c) => {
    try {
      const supportService = new SupportService(c.env);
      const tenantId = (c.get as any)('tenantId') || 'default';
      const userId = (c.get as any)('userId');
      const ticketId = c.req.param('id');
      const { content, is_internal } = c.req.valid('json');

      console.log('Adding comment to ticket:', { tenantId, userId, ticketId, content, is_internal });

      const result = await supportService.addComment(ticketId, tenantId, userId, content);

      if (!result.success) {
        return c.json({
          success: false,
          error: (result as any).error || 'Không thể thêm comment'
        }, 400);
      }

      console.log('Comment added successfully:', (result as any).comment);

      return c.json({
        success: true,
        data: (result as any).comment,
        message: 'Thêm comment thành công'
      });
    } catch (error: any) {
      console.error('Error adding comment:', error);
      return c.json({
        success: false,
        error: error.message || 'Không thể thêm comment'
      }, 500);
    }
  }
);

// GET /support/tickets/:id/comments - Get ticket comments
supportRouter.get(
  '/tickets/:id/comments',
  async (c) => {
    try {
      const supportService = new SupportService(c.env);
      const tenantId = (c.get as any)('tenantId') || 'default';
      const ticketId = c.req.param('id');

      console.log('Getting ticket comments:', { tenantId, ticketId });

      const result = await supportService.getTicketComments(ticketId, tenantId);

      console.log('Ticket comments fetched successfully:', result);

      return c.json({
        success: true,
        data: result,
        message: 'Lấy danh sách comment thành công'
      });
    } catch (error: any) {
      console.error('Error fetching ticket comments:', error);
      return c.json({
        success: false,
        error: error.message || 'Không thể lấy danh sách comment'
      }, 500);
    }
  }
);

// POST /support/tickets/:id/assign - Assign ticket
supportRouter.post(
  '/tickets/:id/assign',
  zValidator('json', assignTicketSchema),
  async (c) => {
    try {
      const supportService = new SupportService(c.env);
      const tenantId = (c.get as any)('tenantId') || 'default';
      const userId = (c.get as any)('userId');
      const ticketId = c.req.param('id');
      const { assigned_to } = c.req.valid('json');

      console.log('Assigning ticket:', { tenantId, userId, ticketId, assigned_to });

      const result = await supportService.assignTicket(ticketId, tenantId, assigned_to);

      if (!result.success) {
        return c.json({
          success: false,
          error: result.error || 'Không thể giao ticket'
        }, 400);
      }

      console.log('Ticket assigned successfully:', result.ticket);

      return c.json({
        success: true,
        data: result.ticket,
        message: 'Giao ticket thành công'
      });
    } catch (error: any) {
      console.error('Error assigning ticket:', error);
      return c.json({
        success: false,
        error: error.message || 'Không thể giao ticket'
      }, 500);
    }
  }
);

// POST /support/tickets/:id/status - Change ticket status
supportRouter.post(
  '/tickets/:id/status',
  zValidator('json', changeStatusSchema),
  async (c) => {
    try {
      const supportService = new SupportService(c.env);
      const tenantId = (c.get as any)('tenantId') || 'default';
      const userId = (c.get as any)('userId');
      const ticketId = c.req.param('id');
      const { status } = c.req.valid('json');

      console.log('Changing ticket status:', { tenantId, userId, ticketId, status });

      const result = await supportService.changeTicketStatus(ticketId, tenantId, status);

      if (!result.success) {
        return c.json({
          success: false,
          error: result.error || 'Không thể thay đổi trạng thái ticket'
        }, 400);
      }

      console.log('Ticket status changed successfully');

      return c.json({
        success: true,
        message: 'Thay đổi trạng thái ticket thành công'
      });
    } catch (error: any) {
      console.error('Error changing ticket status:', error);
      return c.json({
        success: false,
        error: error.message || 'Không thể thay đổi trạng thái ticket'
      }, 500);
    }
  }
);

// GET /support/tickets/analytics - Get ticket analytics
supportRouter.get(
  '/tickets/analytics',
  async (c) => {
    try {
      const supportService = new SupportService(c.env);
      const tenantId = (c.get as any)('tenantId') || 'default';

      console.log('Fetching support ticket analytics:', { tenantId });

      const result = await supportService.getTicketAnalytics(tenantId);

      console.log('Support ticket analytics fetched successfully:', result);

      return c.json({
        success: true,
        data: result,
        message: 'Lấy thống kê ticket hỗ trợ thành công'
      });
    } catch (error: any) {
      console.error('Error fetching support ticket analytics:', error);
      return c.json({
        success: false,
        error: error.message || 'Không thể lấy thống kê ticket hỗ trợ'
      }, 500);
    }
  }
);

// DELETE /support/tickets/bulk - Bulk delete tickets
supportRouter.delete(
  '/tickets/bulk',
  zValidator('json', bulkDeleteSchema),
  async (c) => {
    try {
      const supportService = new SupportService(c.env);
      const tenantId = (c.get as any)('tenantId') || 'default';
      const userId = (c.get as any)('userId');
      const { ids } = c.req.valid('json');

      console.log('Bulk deleting support tickets:', { tenantId, userId, ids });

      const result = await supportService.bulkDeleteTickets(ids, tenantId);

      if (!result.success) {
        return c.json({
          success: false,
          error: result.error || 'Không thể xóa hàng loạt ticket hỗ trợ'
        }, 400);
      }

      console.log('Support tickets bulk deleted successfully:', result.deleted_count);

      return c.json({
        success: true,
        data: { deletedCount: result.deleted_count },
        message: `Đã xóa thành công ${result.deleted_count} ticket hỗ trợ`
      });
    } catch (error: any) {
      console.error('Error bulk deleting support tickets:', error);
      return c.json({
        success: false,
        error: error.message || 'Không thể xóa hàng loạt ticket hỗ trợ'
      }, 500);
    }
  }
);

// PUT /support/tickets/bulk - Bulk update tickets
supportRouter.put(
  '/tickets/bulk',
  zValidator('json', bulkUpdateSchema),
  async (c) => {
    try {
      const supportService = new SupportService(c.env);
      const tenantId = (c.get as any)('tenantId') || 'default';
      const userId = (c.get as any)('userId');
      const { ids, data } = c.req.valid('json');

      console.log('Bulk updating support tickets:', { tenantId, userId, ids, data });

      const result = await supportService.bulkUpdateTickets(ids, tenantId, {
        ...data,
        updated_by: userId
      });

      if (!result.success) {
        return c.json({
          success: false,
          error: result.error || 'Không thể cập nhật hàng loạt ticket hỗ trợ'
        }, 400);
      }

      console.log('Support tickets bulk updated successfully:', result.updated_count);

      return c.json({
        success: true,
        data: { updatedCount: result.updated_count },
        message: `Đã cập nhật thành công ${result.updated_count} ticket hỗ trợ`
      });
    } catch (error: any) {
      console.error('Error bulk updating support tickets:', error);
      return c.json({
        success: false,
        error: error.message || 'Không thể cập nhật hàng loạt ticket hỗ trợ'
      }, 500);
    }
  }
);

// GET /support/tickets/export - Export tickets
supportRouter.get(
  '/tickets/export',
  async (c) => {
    try {
      const supportService = new SupportService(c.env);
      const tenantId = (c.get as any)('tenantId') || 'default';
      const format = c.req.query('format') || 'csv';

      console.log('Exporting support tickets:', { tenantId, format });

      const result = await supportService.exportTickets(tenantId, format as 'csv' | 'excel');

      if (!result.success) {
        return c.json({
          success: false,
          error: result.error || 'Không thể xuất ticket hỗ trợ'
        }, 400);
      }

      console.log('Support tickets exported successfully');

      return new Response(result.data as any, {
        headers: {
          'Content-Type': format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="support-tickets.${format}"`
        }
      });
    } catch (error: any) {
      console.error('Error exporting support tickets:', error);
      return c.json({
        success: false,
        error: error.message || 'Không thể xuất ticket hỗ trợ'
      }, 500);
    }
  }
);

// POST /support/tickets/import - Import tickets
supportRouter.post(
  '/tickets/import',
  async (c) => {
    try {
      const supportService = new SupportService(c.env);
      const tenantId = (c.get as any)('tenantId') || 'default';
      const userId = (c.get as any)('userId');

      console.log('Importing support tickets:', { tenantId, userId });

      const formData = await c.req.formData();
      const file = formData.get('file') as unknown as File;

      if (!file) {
        return c.json({
          success: false,
          error: 'Không tìm thấy file để import'
        }, 400);
      }

      const result = await supportService.importTickets(tenantId, file as any);

      if (!result.success) {
        return c.json({
          success: false,
          error: result.error || 'Không thể import ticket hỗ trợ'
        }, 400);
      }

      console.log('Support tickets imported successfully:', result.imported_count);

      return c.json({
        success: true,
        data: { importedCount: result.imported_count },
        message: `Đã import thành công ${result.imported_count} ticket hỗ trợ`
      });
    } catch (error: any) {
      console.error('Error importing support tickets:', error);
      return c.json({
        success: false,
        error: error.message || 'Không thể import ticket hỗ trợ'
      }, 500);
    }
  }
);

export default supportRouter;