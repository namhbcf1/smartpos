import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { WarehouseService_WarehouseManagementtsx } from '../../services/WarehouseService-WarehouseManagementtsx';
import { Env } from '../../types';

const warehousesRouter = new Hono<{ Bindings: Env }>();

// Validation schemas
const createWarehouseSchema = z.object({
  code: z.string().min(1, 'Mã kho hàng là bắt buộc'),
  name: z.string().min(1, 'Tên kho hàng là bắt buộc'),
  address: z.string().optional(),
  manager_id: z.string().optional(),
  is_active: z.number().int().min(0).max(1).default(1),
});

const updateWarehouseSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  manager_id: z.string().optional(),
  is_active: z.number().int().min(0).max(1).optional(),
});

const warehouseQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  pageSize: z.string().transform(Number).default('10'),
  search: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  sortBy: z.enum(['name', 'code', 'created_at']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

const validateCodeSchema = z.object({
  code: z.string().min(1),
  excludeId: z.string().optional(),
});

const bulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1),
});

const bulkUpdateSchema = z.object({
  ids: z.array(z.string()).min(1),
  data: updateWarehouseSchema,
});

// GET /warehouses - Get all warehouses with pagination and filtering
warehousesRouter.get(
  '/',
  zValidator('query', warehouseQuerySchema),
  async (c) => {
    try {
      const warehouseService = new WarehouseService_WarehouseManagementtsx(c.env);
      const tenantId = (c.get as any)('tenantId') || 'default';
      const userId = (c.get as any)('userId');
      
      const {
        page,
        pageSize,
        search,
        status,
        sortBy,
        sortOrder
      } = c.req.valid('query');

      console.log('Fetching warehouses with params:', {
        tenantId,
        userId,
        page,
        pageSize,
        search,
        status,
        sortBy,
        sortOrder
      });

      const result = await warehouseService.getWarehouses(tenantId, {
        page,
        limit: pageSize,
        search,
        status,
        sortBy,
        sortOrder
      });

      console.log('Warehouses fetched successfully:', result);

      return c.json({
        success: true,
        data: result,
        message: 'Lấy danh sách kho hàng thành công'
      });
    } catch (error: any) {
      console.error('Error fetching warehouses:', error);
      return c.json({
        success: false,
        error: error.message || 'Không thể lấy danh sách kho hàng'
      }, 500);
    }
  }
);

// GET /warehouses/:id - Get warehouse by ID
warehousesRouter.get(
  '/:id',
  async (c) => {
    try {
      const warehouseService = new WarehouseService_WarehouseManagementtsx(c.env);
      const tenantId = (c.get as any)('tenantId') || 'default';
      const warehouseId = c.req.param('id');

      console.log('Fetching warehouse:', { tenantId, warehouseId });

      const result = await warehouseService.getWarehouseById(warehouseId, tenantId);

      if (!result.success) {
        return c.json({
          success: false,
          error: result.error || 'Không tìm thấy kho hàng'
        }, 404);
      }

      console.log('Warehouse fetched successfully:', result.warehouse);

      return c.json({
        success: true,
        data: result.warehouse,
        message: 'Lấy thông tin kho hàng thành công'
      });
    } catch (error: any) {
      console.error('Error fetching warehouse:', error);
      return c.json({
        success: false,
        error: error.message || 'Không thể lấy thông tin kho hàng'
      }, 500);
    }
  }
);

// POST /warehouses - Create new warehouse
warehousesRouter.post(
  '/',
  zValidator('json', createWarehouseSchema),
  async (c) => {
    try {
      const warehouseService = new WarehouseService_WarehouseManagementtsx(c.env);
      const tenantId = (c.get as any)('tenantId') || 'default';
      const userId = (c.get as any)('userId');
      const data = c.req.valid('json');

      console.log('Creating warehouse:', { tenantId, userId, data });

      const result = await warehouseService.createWarehouse(tenantId, {
        code: data.code,
        name: data.name,
        address: data.address,
        manager_id: data.manager_id,
        is_active: data.is_active,
        createdBy: userId
      });

      if (!result.success) {
        return c.json({
          success: false,
          error: result.error || 'Không thể tạo kho hàng'
        }, 400);
      }

      console.log('Warehouse created successfully:', result.warehouse);

      return c.json({
        success: true,
        data: result.warehouse,
        message: 'Tạo kho hàng thành công'
      }, 201);
    } catch (error: any) {
      console.error('Error creating warehouse:', error);
      return c.json({
        success: false,
        error: error.message || 'Không thể tạo kho hàng'
      }, 500);
    }
  }
);

// PUT /warehouses/:id - Update warehouse
warehousesRouter.put(
  '/:id',
  zValidator('json', updateWarehouseSchema),
  async (c) => {
    try {
      const warehouseService = new WarehouseService_WarehouseManagementtsx(c.env);
      const tenantId = (c.get as any)('tenantId') || 'default';
      const userId = (c.get as any)('userId');
      const warehouseId = c.req.param('id');
      const data = c.req.valid('json');

      console.log('Updating warehouse:', { tenantId, userId, warehouseId, data });

      const result = await warehouseService.updateWarehouse(warehouseId, tenantId, {
        ...data,
        updatedBy: userId
      });

      if (!result.success) {
        return c.json({
          success: false,
          error: result.error || 'Không thể cập nhật kho hàng'
        }, 400);
      }

      console.log('Warehouse updated successfully:', result.warehouse);

      return c.json({
        success: true,
        data: result.warehouse,
        message: 'Cập nhật kho hàng thành công'
      });
    } catch (error: any) {
      console.error('Error updating warehouse:', error);
      return c.json({
        success: false,
        error: error.message || 'Không thể cập nhật kho hàng'
      }, 500);
    }
  }
);

// DELETE /warehouses/:id - Delete warehouse
warehousesRouter.delete(
  '/:id',
  async (c) => {
    try {
      const warehouseService = new WarehouseService_WarehouseManagementtsx(c.env);
      const tenantId = (c.get as any)('tenantId') || 'default';
      const userId = (c.get as any)('userId');
      const warehouseId = c.req.param('id');

      console.log('Deleting warehouse:', { tenantId, userId, warehouseId });

      const result = await warehouseService.deleteWarehouse(warehouseId, tenantId);

      if (!result.success) {
        return c.json({
          success: false,
          error: (result as any).error || 'Không thể xóa kho hàng'
        }, 400);
      }

      console.log('Warehouse deleted successfully:', warehouseId);

      return c.json({
        success: true,
        message: 'Xóa kho hàng thành công'
      });
    } catch (error: any) {
      console.error('Error deleting warehouse:', error);
      return c.json({
        success: false,
        error: error.message || 'Không thể xóa kho hàng'
      }, 500);
    }
  }
);

// GET /warehouses/analytics - Get warehouse analytics
warehousesRouter.get(
  '/analytics',
  async (c) => {
    try {
      const warehouseService = new WarehouseService_WarehouseManagementtsx(c.env);
      const tenantId = (c.get as any)('tenantId') || 'default';

      console.log('Fetching warehouse analytics:', { tenantId });

      const result = await warehouseService.getWarehouseAnalytics(tenantId);

      console.log('Warehouse analytics fetched successfully:', result);

      return c.json({
        success: true,
        data: result,
        message: 'Lấy thống kê kho hàng thành công'
      });
    } catch (error: any) {
      console.error('Error fetching warehouse analytics:', error);
      return c.json({
        success: false,
        error: error.message || 'Không thể lấy thống kê kho hàng'
      }, 500);
    }
  }
);

// GET /warehouses/validate-code - Validate warehouse code
warehousesRouter.get(
  '/validate-code',
  zValidator('query', validateCodeSchema),
  async (c) => {
    try {
      const warehouseService = new WarehouseService_WarehouseManagementtsx(c.env);
      const tenantId = (c.get as any)('tenantId') || 'default';
      const { code, excludeId } = c.req.valid('query');

      console.log('Validating warehouse code:', { tenantId, code, excludeId });

      const result = await warehouseService.validateWarehouseCode(code, tenantId);

      console.log('Warehouse code validation result:', result);

      return c.json({
        success: true,
        data: result,
        message: 'Kiểm tra mã kho hàng thành công'
      });
    } catch (error: any) {
      console.error('Error validating warehouse code:', error);
      return c.json({
        success: false,
        error: error.message || 'Không thể kiểm tra mã kho hàng'
      }, 500);
    }
  }
);

// DELETE /warehouses/bulk - Bulk delete warehouses
warehousesRouter.delete(
  '/bulk',
  zValidator('json', bulkDeleteSchema),
  async (c) => {
    try {
      const warehouseService = new WarehouseService_WarehouseManagementtsx(c.env);
      const tenantId = (c.get as any)('tenantId') || 'default';
      const userId = (c.get as any)('userId');
      const { ids } = c.req.valid('json');

      console.log('Bulk deleting warehouses:', { tenantId, userId, ids });

      const result = await warehouseService.bulkDeleteWarehouses(ids, tenantId);

      if (!result.success) {
        return c.json({
          success: false,
          error: result.error || 'Không thể xóa hàng loạt kho hàng'
        }, 400);
      }

      console.log('Warehouses bulk deleted successfully:', result.deleted_count);

      return c.json({
        success: true,
        data: { deletedCount: result.deleted_count },
        message: `Đã xóa thành công ${result.deleted_count} kho hàng`
      });
    } catch (error: any) {
      console.error('Error bulk deleting warehouses:', error);
      return c.json({
        success: false,
        error: error.message || 'Không thể xóa hàng loạt kho hàng'
      }, 500);
    }
  }
);

// PUT /warehouses/bulk - Bulk update warehouses
warehousesRouter.put(
  '/bulk',
  zValidator('json', bulkUpdateSchema),
  async (c) => {
    try {
      const warehouseService = new WarehouseService_WarehouseManagementtsx(c.env);
      const tenantId = (c.get as any)('tenantId') || 'default';
      const userId = (c.get as any)('userId');
      const { ids, data } = c.req.valid('json');

      console.log('Bulk updating warehouses:', { tenantId, userId, ids, data });

      const result = await warehouseService.bulkUpdateWarehouses(ids, tenantId, {
        ...data,
        updatedBy: userId
      });

      if (!result.success) {
        return c.json({
          success: false,
          error: result.error || 'Không thể cập nhật hàng loạt kho hàng'
        }, 400);
      }

      console.log('Warehouses bulk updated successfully:', result.updated_count);

      return c.json({
        success: true,
        data: { updatedCount: result.updated_count },
        message: `Đã cập nhật thành công ${result.updated_count} kho hàng`
      });
    } catch (error: any) {
      console.error('Error bulk updating warehouses:', error);
      return c.json({
        success: false,
        error: error.message || 'Không thể cập nhật hàng loạt kho hàng'
      }, 500);
    }
  }
);

// GET /warehouses/export - Export warehouses
warehousesRouter.get(
  '/export',
  async (c) => {
    try {
      const warehouseService = new WarehouseService_WarehouseManagementtsx(c.env);
      const tenantId = (c.get as any)('tenantId') || 'default';
      const format = c.req.query('format') || 'csv';

      console.log('Exporting warehouses:', { tenantId, format });

      const result = await warehouseService.exportWarehouses(tenantId, format as 'csv' | 'excel');

      if (!result.success) {
        return c.json({
          success: false,
          error: result.error || 'Không thể xuất kho hàng'
        }, 400);
      }

      console.log('Warehouses exported successfully');

      return new Response(result.data as any, {
        headers: {
          'Content-Type': format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="warehouses.${format}"`
        }
      });
    } catch (error: any) {
      console.error('Error exporting warehouses:', error);
      return c.json({
        success: false,
        error: error.message || 'Không thể xuất kho hàng'
      }, 500);
    }
  }
);

// POST /warehouses/import - Import warehouses
warehousesRouter.post(
  '/import',
  async (c) => {
    try {
      const warehouseService = new WarehouseService_WarehouseManagementtsx(c.env);
      const tenantId = (c.get as any)('tenantId') || 'default';
      const userId = (c.get as any)('userId');

      console.log('Importing warehouses:', { tenantId, userId });

      const formData = await c.req.formData();
      const file = formData.get('file') as unknown as File;

      if (!file) {
        return c.json({
          success: false,
          error: 'Không tìm thấy file để import'
        }, 400);
      }

      const result = await warehouseService.importWarehouses(tenantId, file as any);

      if (!result.success) {
        return c.json({
          success: false,
          error: result.error || 'Không thể import kho hàng'
        }, 400);
      }

      console.log('Warehouses imported successfully:', result.imported_count);

      return c.json({
        success: true,
        data: { importedCount: result.imported_count },
        message: `Đã import thành công ${result.imported_count} kho hàng`
      });
    } catch (error: any) {
      console.error('Error importing warehouses:', error);
      return c.json({
        success: false,
        error: error.message || 'Không thể import kho hàng'
      }, 500);
    }
  }
);

export default warehousesRouter;