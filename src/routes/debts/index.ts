import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { DebtService_DebtManagementtsx } from '../../services/DebtService-DebtManagementtsx';
import { DebtService } from '../../services/DebtService';
import { Env } from '../../types';

const debtsRouter = new Hono<{ Bindings: Env }>();

// Validation schemas
const createDebtSchema = z.object({
  customer_id: z.string().optional(),
  supplier_id: z.string().optional(),
  debt_type: z.enum(['customer', 'supplier']),
  amount: z.number().positive('Số tiền phải lớn hơn 0'),
  paid_amount: z.number().min(0).default(0),
  due_date: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['unpaid', 'partial', 'paid']).default('unpaid'),
});

const updateDebtSchema = z.object({
  customer_id: z.string().optional(),
  supplier_id: z.string().optional(),
  debt_type: z.enum(['customer', 'supplier']).optional(),
  amount: z.number().positive().optional(),
  paid_amount: z.number().min(0).optional(),
  due_date: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['unpaid', 'partial', 'paid']).optional(),
});

const debtQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  pageSize: z.string().transform(Number).default('10'),
  search: z.string().optional(),
  status: z.enum(['unpaid', 'partial', 'paid']).optional(),
  debt_type: z.enum(['customer', 'supplier']).optional(),
  sortBy: z.enum(['amount', 'due_date', 'created_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const paymentSchema = z.object({
  amount: z.number().positive('Số tiền phải lớn hơn 0'),
  notes: z.string().optional(),
});

const bulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1),
});

const bulkUpdateSchema = z.object({
  ids: z.array(z.string()).min(1),
  data: updateDebtSchema,
});

// Initialize service - moved to individual handlers

// GET /debts - Get all debts with pagination and filtering
debtsRouter.get(
  '/',
  zValidator('query', debtQuerySchema),
  async (c) => {
    try {
      console.log('Debts API - c.env:', c.env);
      console.log('Debts API - c.env.DB:', c.env?.DB);
      const debtService = new DebtService_DebtManagementtsx(c.env);
      const tenantId = (c.get as any)('tenantId') || 'default';
      const userId = (c.get as any)('userId');
      
      const {
        page,
        pageSize,
        search,
        status,
        debt_type,
        sortBy,
        sortOrder
      } = c.req.valid('query');

      console.log('Fetching debts with params:', {
        tenantId,
        userId,
        page,
        pageSize,
        search,
        status,
        debt_type,
        sortBy,
        sortOrder
      });

      const result = await debtService.getDebts({
        tenantId,
        page,
        pageSize,
        search,
        status,
        debt_type,
        sortBy,
        sortOrder
      });

      console.log('Debts fetched successfully:', result);

      return c.json({
        success: true,
        data: result,
        message: 'Lấy danh sách nợ thành công'
      });
    } catch (error: any) {
      console.error('Error fetching debts:', error);
      return c.json({
        success: false,
        error: error.message || 'Không thể lấy danh sách nợ'
      }, 500);
    }
  }
);

// GET /debts/:id - Get debt by ID
debtsRouter.get(
  '/:id',
  async (c) => {
    try {
      const debtService = new DebtService_DebtManagementtsx(c.env);
      const tenantId = (c.get as any)('tenantId') || 'default';
      const debtId = c.req.param('id');

      console.log('Fetching debt:', { tenantId, debtId });

      const result = await debtService.getDebtById(debtId, tenantId);

      if (!result.success) {
        return c.json({
          success: false,
          error: result.error || 'Không tìm thấy nợ'
        }, 404);
      }

      console.log('Debt fetched successfully:', result.debt);

      return c.json({
        success: true,
        data: result.debt,
        message: 'Lấy thông tin nợ thành công'
      });
    } catch (error: any) {
      console.error('Error fetching debt:', error);
      return c.json({
        success: false,
        error: error.message || 'Không thể lấy thông tin nợ'
      }, 500);
    }
  }
);

// POST /debts - Create new debt
debtsRouter.post(
  '/',
  zValidator('json', createDebtSchema),
  async (c) => {
    try {
      const debtService = new DebtService_DebtManagementtsx(c.env);
      const tenantId = (c.get as any)('tenantId') || 'default';
      const userId = (c.get as any)('userId');
      const data = c.req.valid('json');

      console.log('Creating debt:', { tenantId, userId, data });

      const result = await debtService.createDebt({
        ...data,
        tenantId,
        createdBy: userId
      } as any);

      if (!result.success) {
        return c.json({
          success: false,
          error: result.error || 'Không thể tạo nợ'
        }, 400);
      }

      console.log('Debt created successfully:', result.debt);

      return c.json({
        success: true,
        data: result.debt,
        message: 'Tạo nợ thành công'
      }, 201);
    } catch (error: any) {
      console.error('Error creating debt:', error);
      return c.json({
        success: false,
        error: error.message || 'Không thể tạo nợ'
      }, 500);
    }
  }
);

// PUT /debts/:id - Update debt
debtsRouter.put(
  '/:id',
  zValidator('json', updateDebtSchema),
  async (c) => {
    try {
      const debtService = new DebtService_DebtManagementtsx(c.env);
      const tenantId = (c.get as any)('tenantId') || 'default';
      const userId = (c.get as any)('userId');
      const debtId = c.req.param('id');
      const data = c.req.valid('json');

      console.log('Updating debt:', { tenantId, userId, debtId, data });

      const result = await debtService.updateDebt(debtId, {
        ...data,
        tenantId,
        updatedBy: userId
      });

      if (!result.success) {
        return c.json({
          success: false,
          error: result.error || 'Không thể cập nhật nợ'
        }, 400);
      }

      console.log('Debt updated successfully:', result.debt);

      return c.json({
        success: true,
        data: result.debt,
        message: 'Cập nhật nợ thành công'
      });
    } catch (error: any) {
      console.error('Error updating debt:', error);
      return c.json({
        success: false,
        error: error.message || 'Không thể cập nhật nợ'
      }, 500);
    }
  }
);

// DELETE /debts/:id - Delete debt
debtsRouter.delete(
  '/:id',
  async (c) => {
    try {
      const debtService = new DebtService_DebtManagementtsx(c.env);
      const tenantId = (c.get as any)('tenantId') || 'default';
      const userId = (c.get as any)('userId');
      const debtId = c.req.param('id');

      console.log('Deleting debt:', { tenantId, userId, debtId });

      const result = await debtService.deleteDebt(debtId, tenantId);

      if (!result.success) {
        return c.json({
          success: false,
          error: (result as any).error || 'Không thể xóa nợ'
        }, 400);
      }

      console.log('Debt deleted successfully:', debtId);

      return c.json({
        success: true,
        message: 'Xóa nợ thành công'
      });
    } catch (error: any) {
      console.error('Error deleting debt:', error);
      return c.json({
        success: false,
        error: error.message || 'Không thể xóa nợ'
      }, 500);
    }
  }
);

// POST /debts/:id/payment - Make payment
debtsRouter.post(
  '/:id/payment',
  zValidator('json', paymentSchema),
  async (c) => {
    try {
      const debtService = new DebtService_DebtManagementtsx(c.env);
      const tenantId = (c.get as any)('tenantId') || 'default';
      const userId = (c.get as any)('userId');
      const debtId = c.req.param('id');
      const { amount, notes } = c.req.valid('json');

      console.log('Making payment:', { tenantId, userId, debtId, amount, notes });

      const result = await debtService.makePayment(debtId, {
        amount,
        notes,
        tenantId,
        userId
      });

      if (!result.success) {
        return c.json({
          success: false,
          error: result.error || 'Không thể thực hiện thanh toán'
        }, 400);
      }

      console.log('Payment made successfully:', result.payment);

      return c.json({
        success: true,
        data: result.payment,
        message: 'Thanh toán thành công'
      });
    } catch (error: any) {
      console.error('Error making payment:', error);
      return c.json({
        success: false,
        error: error.message || 'Không thể thực hiện thanh toán'
      }, 500);
    }
  }
);

// GET /debts/analytics - Get debt analytics
debtsRouter.get(
  '/analytics',
  async (c) => {
    try {
      const debtService = new DebtService_DebtManagementtsx(c.env);
      const tenantId = (c.get as any)('tenantId') || 'default';

      console.log('Fetching debt analytics:', { tenantId });

      const result = await debtService.getDebtAnalytics(tenantId);

      console.log('Debt analytics fetched successfully:', result);

      return c.json({
        success: true,
        data: result,
        message: 'Lấy thống kê nợ thành công'
      });
    } catch (error: any) {
      console.error('Error fetching debt analytics:', error);
      return c.json({
        success: false,
        error: error.message || 'Không thể lấy thống kê nợ'
      }, 500);
    }
  }
);

// DELETE /debts/bulk - Bulk delete debts
debtsRouter.delete(
  '/bulk',
  zValidator('json', bulkDeleteSchema),
  async (c) => {
    try {
      const debtService = new DebtService(c.env);
      const tenantId = (c.get as any)('tenantId') || 'default';
      const userId = (c.get as any)('userId');
      const { ids } = c.req.valid('json');

      console.log('Bulk deleting debts:', { tenantId, userId, ids });

      const result = await debtService.bulkDeleteDebts(ids, tenantId);

      if (!result.success) {
        return c.json({
          success: false,
          error: result.error || 'Không thể xóa hàng loạt nợ'
        }, 400);
      }

      console.log('Debts bulk deleted successfully:', result.deletedCount);

      return c.json({
        success: true,
        data: { deletedCount: result.deletedCount },
        message: `Đã xóa thành công ${result.deletedCount} nợ`
      });
    } catch (error: any) {
      console.error('Error bulk deleting debts:', error);
      return c.json({
        success: false,
        error: error.message || 'Không thể xóa hàng loạt nợ'
      }, 500);
    }
  }
);

// PUT /debts/bulk - Bulk update debts
debtsRouter.put(
  '/bulk',
  zValidator('json', bulkUpdateSchema),
  async (c) => {
    try {
      const debtService = new DebtService(c.env);
      const tenantId = (c.get as any)('tenantId') || 'default';
      const userId = (c.get as any)('userId');
      const { ids, data } = c.req.valid('json');

      console.log('Bulk updating debts:', { tenantId, userId, ids, data });

      const result = await debtService.bulkUpdateDebts(ids, {
        ...data,
        tenantId,
        updatedBy: userId
      });

      if (!result.success) {
        return c.json({
          success: false,
          error: result.error || 'Không thể cập nhật hàng loạt nợ'
        }, 400);
      }

      console.log('Debts bulk updated successfully:', result.updatedCount);

      return c.json({
        success: true,
        data: { updatedCount: result.updatedCount },
        message: `Đã cập nhật thành công ${result.updatedCount} nợ`
      });
    } catch (error: any) {
      console.error('Error bulk updating debts:', error);
      return c.json({
        success: false,
        error: error.message || 'Không thể cập nhật hàng loạt nợ'
      }, 500);
    }
  }
);

// GET /debts/export - Export debts
debtsRouter.get(
  '/export',
  async (c) => {
    try {
      const debtService = new DebtService(c.env);
      const tenantId = (c.get as any)('tenantId') || 'default';
      const format = c.req.query('format') || 'csv';

      console.log('Exporting debts:', { tenantId, format });

      const result = await debtService.exportDebts(tenantId, format as 'csv' | 'excel');

      if (!result.success) {
        return c.json({
          success: false,
          error: result.error || 'Không thể xuất nợ'
        }, 400);
      }

      console.log('Debts exported successfully');

      return new Response(result.data, {
        headers: {
          'Content-Type': format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="debts.${format}"`
        }
      });
    } catch (error: any) {
      console.error('Error exporting debts:', error);
      return c.json({
        success: false,
        error: error.message || 'Không thể xuất nợ'
      }, 500);
    }
  }
);

// POST /debts/import - Import debts
debtsRouter.post(
  '/import',
  async (c) => {
    try {
      const debtService = new DebtService(c.env);
      const tenantId = (c.get as any)('tenantId') || 'default';
      const userId = (c.get as any)('userId');

      console.log('Importing debts:', { tenantId, userId });

      const formData = await c.req.formData();
      const file = formData.get('file') as unknown as File;

      if (!file) {
        return c.json({
          success: false,
          error: 'Không tìm thấy file để import'
        }, 400);
      }

      const result = await debtService.importDebts(file, tenantId, userId);

      if (!result.success) {
        return c.json({
          success: false,
          error: result.error || 'Không thể import nợ'
        }, 400);
      }

      console.log('Debts imported successfully:', result.importedCount);

      return c.json({
        success: true,
        data: { importedCount: result.importedCount },
        message: `Đã import thành công ${result.importedCount} nợ`
      });
    } catch (error: any) {
      console.error('Error importing debts:', error);
      return c.json({
        success: false,
        error: error.message || 'Không thể import nợ'
      }, 500);
    }
  }
);

export default debtsRouter;