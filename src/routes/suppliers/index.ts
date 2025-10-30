import { Hono } from 'hono';
import { Env } from '../../types';
import { authenticate } from '../../middleware/auth';
import { SupplierService_SuppliersManagementtsx as SupplierService } from '../../services/SupplierService-SuppliersManagementtsx';

const app = new Hono<{ Bindings: Env }>();

// Apply authentication middleware
app.use('*', authenticate);

// Get suppliers list with pagination and search
app.get('/', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '12');
    const search = c.req.query('search');
    const status = c.req.query('status');
    const sortBy = c.req.query('sortBy') || 'name';
    const sortOrder = c.req.query('sortOrder') || 'asc';

    const supplierService = new SupplierService(c.env);

    const result = await supplierService.getSuppliers(tenantId, {
      tenant_id: tenantId,
      page,
      limit,
      search,
      status,
      sortBy,
      sortOrder
    });

    if (!result.success) {
      return c.json({ success: false, error: result.error }, 500);
    }

    return c.json({
      success: true,
      data: {
        suppliers: result.suppliers,
        pagination: result.pagination
      }
    });
  } catch (error: any) {
    console.error('Get suppliers error:', error);
    return c.json({
      success: false,
      error: error.message || 'Không thể lấy danh sách nhà cung cấp',
      stack: error.stack
    }, 500);
  }
});

// Get supplier by ID
app.get('/:id', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const id = c.req.param('id');

    const supplierService = new SupplierService(c.env);
    const result = await supplierService.getSupplierById(id, tenantId);

    if (!result.success) {
      return c.json({ success: false, error: result.error }, 404);
    }

    return c.json({
      success: true,
      data: result.supplier
    });
  } catch (error: any) {
    console.error('Get supplier error:', error);
    return c.json({
      success: false,
      error: error.message || 'Không thể lấy thông tin nhà cung cấp'
    }, 500);
  }
});

// Create new supplier
app.post('/', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    const data = await c.req.json();

    console.log('Create supplier request data:', data);

    // Validate required fields
    if (!data.name) {
      return c.json({
        success: false,
        error: 'Tên nhà cung cấp là bắt buộc'
      }, 400);
    }

    // Ensure credit_limit_cents is a valid number
    if (data.credit_limit_cents !== undefined && data.credit_limit_cents !== null) {
      const creditLimit = Number(data.credit_limit_cents);
      if (isNaN(creditLimit)) {
        return c.json({
          success: false,
          error: 'Hạn mức tín dụng phải là số hợp lệ'
        }, 400);
      }
      data.credit_limit_cents = Math.round(creditLimit);
    }

    // Remove tenant_id and other non-existent columns from data
    const { tenant_id, created_by, updated_by, ...supplierData } = data;

    const supplierService = new SupplierService(c.env);
    const result = await supplierService.createSupplier(tenantId, supplierData);

    if (!result.success) {
      return c.json({ success: false, error: result.error }, 400);
    }

    return c.json({
      success: true,
      data: result.supplier,
      message: 'Nhà cung cấp đã được tạo thành công'
    }, 201);
  } catch (error: any) {
    console.error('Create supplier error:', error);
    return c.json({
      success: false,
      error: error.message || 'Không thể tạo nhà cung cấp',
      stack: error.stack
    }, 500);
  }
});

// Update supplier
app.put('/:id', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    const id = c.req.param('id');
    const data = await c.req.json();

    console.log('Update supplier request data:', data);

    // Ensure credit_limit_cents is a valid number if provided
    if (data.credit_limit_cents !== undefined && data.credit_limit_cents !== null) {
      const creditLimit = Number(data.credit_limit_cents);
      if (isNaN(creditLimit)) {
        return c.json({
          success: false,
          error: 'Hạn mức tín dụng phải là số hợp lệ'
        }, 400);
      }
      data.credit_limit_cents = Math.round(creditLimit);
    }

    // Remove tenant_id and other non-existent columns from data
    const { tenant_id, created_by, updated_by, ...supplierData } = data;

    const supplierService = new SupplierService(c.env);
    const result = await supplierService.updateSupplier(id, tenantId, supplierData);

    if (!result.success) {
      return c.json({ success: false, error: result.error }, 400);
    }

    return c.json({
      success: true,
      data: result.supplier,
      message: 'Nhà cung cấp đã được cập nhật thành công'
    });
  } catch (error: any) {
    console.error('Update supplier error:', error);
    return c.json({
      success: false,
      error: error.message || 'Không thể cập nhật nhà cung cấp',
      stack: error.stack
    }, 500);
  }
});

// Delete supplier
app.delete('/:id', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    const id = c.req.param('id');

    const supplierService = new SupplierService(c.env);
    const result = await supplierService.deleteSupplier(id, tenantId);

    if (!result.success) {
      return c.json({ success: false, error: result.error }, 400);
    }

    return c.json({
      success: true,
      message: 'Nhà cung cấp đã được xóa thành công'
    });
  } catch (error: any) {
    console.error('Delete supplier error:', error);
    return c.json({
      success: false,
      error: error.message || 'Không thể xóa nhà cung cấp'
    }, 500);
  }
});

// Get supplier analytics
app.get('/analytics/overview', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';

    const supplierService = new SupplierService(c.env);
    const result = await supplierService.getAnalytics(tenantId);

    if (!result.success) {
      return c.json({ success: false, error: result.error }, 500);
    }

    return c.json({
      success: true,
      data: result.analytics
    });
  } catch (error: any) {
    console.error('Get supplier analytics error:', error);
    return c.json({
      success: false,
      error: error.message || 'Không thể lấy thống kê nhà cung cấp'
    }, 500);
  }
});

// Search suppliers
app.get('/search', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const query = c.req.query('q');
    const limit = parseInt(c.req.query('limit') || '10');

    if (!query) {
      return c.json({
        success: false,
        error: 'Từ khóa tìm kiếm là bắt buộc'
      }, 400);
    }

    const supplierService = new SupplierService(c.env);
    const result = await supplierService.searchSuppliers(tenantId, query);

    if (!result.success) {
      return c.json({ success: false, error: result.error }, 500);
    }

    return c.json({
      success: true,
      data: result.suppliers
    });
  } catch (error: any) {
    console.error('Search suppliers error:', error);
    return c.json({
      success: false,
      error: error.message || 'Không thể tìm kiếm nhà cung cấp'
    }, 500);
  }
});

export default app;