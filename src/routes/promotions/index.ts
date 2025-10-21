import { Hono } from 'hono';
import { Env } from '../../types';
import { authenticate } from '../../middleware/auth';
import { PromotionService_PromotionsManagementtsx } from '../../services/PromotionService-PromotionsManagementtsx';

const app = new Hono<{ Bindings: Env }>();

// Apply authentication middleware
app.use('*', authenticate);

// Get promotions list with pagination and search
app.get('/', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '12');
    const search = c.req.query('search');
    const status = c.req.query('status');
    const type = c.req.query('type');
    const sortBy = c.req.query('sortBy') || 'name';
    const sortOrder = c.req.query('sortOrder') || 'asc';

    const promotionService = new PromotionService_PromotionsManagementtsx(c.env);
    
    const result = await promotionService.getPromotions({
      tenant_id: tenantId,
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
        promotions: result.promotions || result.data,
        pagination: result.pagination
      }
    });
  } catch (error: any) {
    console.error('Get promotions error:', error);
    return c.json({
      success: false,
      error: error.message || 'Không thể lấy danh sách khuyến mãi',
      stack: error.stack
    }, 500);
  }
});

// Get promotion by ID
app.get('/:id', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const id = c.req.param('id');

    const promotionService = new PromotionService_PromotionsManagementtsx(c.env);
    const result = await promotionService.getPromotionById(id, tenantId);

    if (!result.success) {
      return c.json({ success: false, error: result.error }, 404);
    }

    return c.json({
      success: true,
      data: result.promotion
    });
  } catch (error: any) {
    console.error('Get promotion error:', error);
    return c.json({
      success: false,
      error: error.message || 'Không thể lấy thông tin khuyến mãi'
    }, 500);
  }
});

// Create new promotion
app.post('/', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    const data = await c.req.json();

    // Validate required fields
    if (!data.code || !data.name) {
      return c.json({
        success: false,
        error: 'Mã khuyến mãi và tên là bắt buộc'
      }, 400);
    }

    const promotionService = new PromotionService_PromotionsManagementtsx(c.env);
    const result = await promotionService.createPromotion({
      ...data,
      tenant_id: tenantId,
      created_by: userId
    });

    if (!result.success) {
      return c.json({ success: false, error: result.error }, 400);
    }

    return c.json({
      success: true,
      data: result.promotion,
      message: 'Khuyến mãi đã được tạo thành công'
    }, 201);
  } catch (error: any) {
    console.error('Create promotion error:', error);
    return c.json({
      success: false,
      error: error.message || 'Không thể tạo khuyến mãi'
    }, 500);
  }
});

// Update promotion
app.put('/:id', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    const id = c.req.param('id');
    const data = await c.req.json();

    const promotionService = new PromotionService_PromotionsManagementtsx(c.env);
    const result = await promotionService.updatePromotion(id, {
      ...data,
      tenant_id: tenantId,
      updated_by: userId
    });

    if (!result.success) {
      return c.json({ success: false, error: result.error }, 400);
    }

    return c.json({
      success: true,
      data: result.promotion,
      message: 'Khuyến mãi đã được cập nhật thành công'
    });
  } catch (error: any) {
    console.error('Update promotion error:', error);
    return c.json({
      success: false,
      error: error.message || 'Không thể cập nhật khuyến mãi'
    }, 500);
  }
});

// Delete promotion
app.delete('/:id', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    const id = c.req.param('id');

    const promotionService = new PromotionService_PromotionsManagementtsx(c.env);
    const result = await promotionService.deletePromotion(id, tenantId, userId);

    if (!result.success) {
      return c.json({ success: false, error: result.error }, 400);
    }

    return c.json({
      success: true,
      message: 'Khuyến mãi đã được xóa thành công'
    });
  } catch (error: any) {
    console.error('Delete promotion error:', error);
    return c.json({
      success: false,
      error: error.message || 'Không thể xóa khuyến mãi'
    }, 500);
  }
});

// Get promotion analytics
app.get('/analytics/overview', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';

    const promotionService = new PromotionService_PromotionsManagementtsx(c.env);
    const result = await promotionService.getAnalytics(tenantId);

    if (!result.success) {
      return c.json({ success: false, error: result.error }, 500);
    }

    return c.json({
      success: true,
      data: result.analytics
    });
  } catch (error: any) {
    console.error('Get promotion analytics error:', error);
    return c.json({
      success: false,
      error: error.message || 'Không thể lấy thống kê khuyến mãi'
    }, 500);
  }
});

// Search promotions
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

    const promotionService = new PromotionService_PromotionsManagementtsx(c.env);
    const result = await promotionService.searchPromotions(query, tenantId, limit);

    if (!result.success) {
      return c.json({ success: false, error: result.error }, 500);
    }

    return c.json({
      success: true,
      data: result.promotions
    });
  } catch (error: any) {
    console.error('Search promotions error:', error);
    return c.json({
      success: false,
      error: error.message || 'Không thể tìm kiếm khuyến mãi'
    }, 500);
  }
});

// Validate promotion code
app.get('/validate/:code', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const code = c.req.param('code');

    const promotionService = new PromotionService_PromotionsManagementtsx(c.env);
    const result = await promotionService.validatePromotionCode(code, tenantId);

    if (!result.success) {
      return c.json({ success: false, error: result.error }, 400);
    }

    return c.json({
      success: true,
      data: result.promotion
    });
  } catch (error: any) {
    console.error('Validate promotion code error:', error);
    return c.json({
      success: false,
      error: error.message || 'Không thể xác thực mã khuyến mãi'
    }, 500);
  }
});

export default app;