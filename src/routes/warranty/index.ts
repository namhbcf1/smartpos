import { Hono } from 'hono';
import { Env } from '../../types';
import { authenticate } from '../../middleware/auth';
import { WarrantyService_WarrantyManagementtsx } from '../../services/WarrantyService-WarrantyManagementtsx';

const WarrantyService = WarrantyService_WarrantyManagementtsx;
const app = new Hono<{ Bindings: Env }>();

// Apply authentication middleware
app.use('*', authenticate);

// Get warranties list with pagination and search
app.get('/', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '12');
    const search = c.req.query('search');
    const status = c.req.query('status');
    const type = c.req.query('type');
    const sortBy = c.req.query('sortBy') || 'warranty_code';
    const sortOrder = c.req.query('sortOrder') || 'asc';

    const warrantyService = new WarrantyService_WarrantyManagementtsx(c.env);
    
    const result = await warrantyService.getWarranties(tenantId, {
      page,
      limit,
      search,
      status,
      type,
      sortBy,
      sortOrder
    });

    if (!result.success) {
      return c.json({ success: false, error: result.error }, 500);
    }

    return c.json({
      success: true,
      data: {
        warranties: result.warranties,
        pagination: result.pagination
      }
    });
  } catch (error: any) {
    console.error('Get warranties error:', error);
    return c.json({
      success: false,
      error: error.message || 'Không thể lấy danh sách bảo hành',
      stack: error.stack
    }, 500);
  }
});

// Get warranty by ID
app.get('/:id', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const id = c.req.param('id');

    const warrantyService = new WarrantyService_WarrantyManagementtsx(c.env);
    const result = await warrantyService.getWarrantyById(id, tenantId);

    if (!result.success) {
      return c.json({ success: false, error: result.error }, 404);
    }

    return c.json({
      success: true,
      data: result.warranty
    });
  } catch (error: any) {
    console.error('Get warranty error:', error);
    return c.json({
      success: false,
      error: error.message || 'Không thể lấy thông tin bảo hành'
    }, 500);
  }
});

// Create new warranty
app.post('/', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    const data = await c.req.json();

    // Validate required fields
    if (!data.warranty_code || !data.product_id) {
      return c.json({
        success: false,
        error: 'Mã bảo hành và ID sản phẩm là bắt buộc'
      }, 400);
    }

    const warrantyService = new WarrantyService_WarrantyManagementtsx(c.env);
    const result = await warrantyService.createWarranty(tenantId, {
      ...data,
      created_by: userId
    });

    if (!result.success) {
      return c.json({ success: false, error: result.error }, 400);
    }

    return c.json({
      success: true,
      data: result.warranty,
      message: 'Bảo hành đã được tạo thành công'
    }, 201);
  } catch (error: any) {
    console.error('Create warranty error:', error);
    return c.json({
      success: false,
      error: error.message || 'Không thể tạo bảo hành'
    }, 500);
  }
});

// Update warranty
app.put('/:id', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    const id = c.req.param('id');
    const data = await c.req.json();

    const warrantyService = new WarrantyService_WarrantyManagementtsx(c.env);
    const result = await warrantyService.updateWarranty(id, tenantId, {
      ...data,
      updated_by: userId
    });

    if (!result.success) {
      return c.json({ success: false, error: result.error }, 400);
    }

    return c.json({
      success: true,
      data: result.warranty,
      message: 'Bảo hành đã được cập nhật thành công'
    });
  } catch (error: any) {
    console.error('Update warranty error:', error);
    return c.json({
      success: false,
      error: error.message || 'Không thể cập nhật bảo hành'
    }, 500);
  }
});

// Delete warranty
app.delete('/:id', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    const id = c.req.param('id');

    const warrantyService = new WarrantyService_WarrantyManagementtsx(c.env);
    const result = await warrantyService.deleteWarranty(id, tenantId);
    
    if (!result.success) {
      return c.json({ success: false, error: result.error }, 400);
    }

    return c.json({
      success: true,
      message: 'Bảo hành đã được xóa thành công'
    });
  } catch (error: any) {
    console.error('Delete warranty error:', error);
    return c.json({
      success: false,
      error: error.message || 'Không thể xóa bảo hành'
    }, 500);
  }
});

// Get warranty analytics
app.get('/analytics/overview', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';

    const warrantyService = new WarrantyService(c.env);
    const result = await warrantyService.getAnalytics(tenantId);

    if (!result.success) {
      return c.json({ success: false, error: result.error }, 500);
    }

    return c.json({
      success: true,
      data: result.analytics
    });
  } catch (error: any) {
    console.error('Get warranty analytics error:', error);
    return c.json({
      success: false,
      error: error.message || 'Không thể lấy thống kê bảo hành'
    }, 500);
  }
});

// Search warranties
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

    const warrantyService = new WarrantyService(c.env);
    const result = await warrantyService.searchWarranties(query, tenantId, limit);

    if (!result.success) {
      return c.json({ success: false, error: result.error }, 500);
    }

    return c.json({
      success: true,
      data: result.warranties
    });
  } catch (error: any) {
    console.error('Search warranties error:', error);
    return c.json({
      success: false,
      error: error.message || 'Không thể tìm kiếm bảo hành'
    }, 500);
  }
});

// Validate warranty code
app.get('/validate/:code', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const code = c.req.param('code');

    const warrantyService = new WarrantyService(c.env);
    const result = await warrantyService.validateWarrantyCode(code, tenantId);
    
    if (!result.success) {
      return c.json({ success: false, error: result.error }, 400);
    }
    
    return c.json({
      success: true,
      data: result.warranty
    });
  } catch (error: any) {
    console.error('Validate warranty code error:', error);
    return c.json({
      success: false,
      error: error.message || 'Không thể xác thực mã bảo hành'
    }, 500);
  }
});

export default app;