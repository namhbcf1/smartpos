import { Hono } from 'hono';
import { Env } from '../../types';
import { ProductRecommendationService } from '../../services/ProductRecommendationService';

const app = new Hono<{ Bindings: Env }>();

// Get personalized recommendations for a customer
app.get('/personalized/:customerId', async (c) => {
  try {
    const customerId = c.req.param('customerId');
    const tenantId = c.get('tenantId') || 'default';
    const limit = parseInt(c.req.query('limit') || '10');

    const service = new ProductRecommendationService(c.env.DB);
    const recommendations = await service.getPersonalizedRecommendations(customerId, tenantId, limit);

    return c.json({
      success: true,
      data: recommendations
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get frequently bought together products
app.get('/frequently-bought-together/:productId', async (c) => {
  try {
    const productId = c.req.param('productId');
    const tenantId = c.get('tenantId') || 'default';
    const limit = parseInt(c.req.query('limit') || '5');

    const service = new ProductRecommendationService(c.env.DB);
    const recommendations = await service.getFrequentlyBoughtTogether(productId, tenantId, limit);

    return c.json({
      success: true,
      data: recommendations
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get similar products
app.get('/similar/:productId', async (c) => {
  try {
    const productId = c.req.param('productId');
    const tenantId = c.get('tenantId') || 'default';
    const limit = parseInt(c.req.query('limit') || '10');

    const service = new ProductRecommendationService(c.env.DB);
    const recommendations = await service.getSimilarProducts(productId, tenantId, limit);

    return c.json({
      success: true,
      data: recommendations
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get popular/trending products
app.get('/popular', async (c) => {
  try {
    const tenantId = c.get('tenantId') || 'default';
    const limit = parseInt(c.req.query('limit') || '10');
    const days = parseInt(c.req.query('days') || '30');

    const service = new ProductRecommendationService(c.env.DB);
    const recommendations = await service.getPopularProducts(tenantId, limit, days);

    return c.json({
      success: true,
      data: recommendations
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get cart-based recommendations
app.post('/cart', async (c) => {
  try {
    const { product_ids } = await c.req.json();
    const tenantId = c.get('tenantId') || 'default';
    const limit = parseInt(c.req.query('limit') || '5');

    if (!Array.isArray(product_ids)) {
      return c.json({
        success: false,
        error: 'product_ids must be an array'
      }, 400);
    }

    const service = new ProductRecommendationService(c.env.DB);
    const recommendations = await service.getCartRecommendations(product_ids, tenantId, limit);

    return c.json({
      success: true,
      data: recommendations
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get new arrivals
app.get('/new-arrivals', async (c) => {
  try {
    const tenantId = c.get('tenantId') || 'default';
    const limit = parseInt(c.req.query('limit') || '10');
    const days = parseInt(c.req.query('days') || '30');

    const service = new ProductRecommendationService(c.env.DB);
    const recommendations = await service.getNewArrivals(tenantId, limit, days);

    return c.json({
      success: true,
      data: recommendations
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get comprehensive recommendations based on context
app.post('/comprehensive', async (c) => {
  try {
    const context = await c.req.json();
    const tenantId = c.get('tenantId') || 'default';

    const service = new ProductRecommendationService(c.env.DB);
    const recommendations = await service.getRecommendations(context, tenantId);

    return c.json({
      success: true,
      data: recommendations
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;
