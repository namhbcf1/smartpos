import { Hono } from 'hono';
import { Env } from '../../types';
import { CustomerSegmentationService, CustomerSegment } from '../../services/CustomerSegmentationService';

const app = new Hono<{ Bindings: Env }>();

/**
 * GET /api/customers/segmentation/rfm
 * Calculate RFM scores for all customers
 */
app.get('/rfm', async (c) => {
  try {
    const tenantId = c.get('tenantId') || 'default';
    const service = new CustomerSegmentationService(c.env.DB);

    const rfmScores = await service.calculateRFM(tenantId);

    return c.json({
      success: true,
      data: rfmScores,
      count: rfmScores.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ RFM calculation error:', error);
    return c.json({
      success: false,
      error: 'Failed to calculate RFM scores',
      message: error.message
    }, 500);
  }
});

/**
 * GET /api/customers/segmentation/stats
 * Get segment statistics
 */
app.get('/stats', async (c) => {
  try {
    const tenantId = c.get('tenantId') || 'default';
    const service = new CustomerSegmentationService(c.env.DB);

    const stats = await service.getSegmentStats(tenantId);

    // Calculate totals
    const totalCustomers = Object.values(stats).reduce((sum, s) => sum + s.count, 0);
    const totalValue = Object.values(stats).reduce((sum, s) => sum + s.totalValue, 0);

    return c.json({
      success: true,
      data: {
        segments: stats,
        summary: {
          totalCustomers,
          totalValue,
          avgValuePerCustomer: totalCustomers > 0 ? totalValue / totalCustomers : 0
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Segment stats error:', error);
    return c.json({
      success: false,
      error: 'Failed to get segment statistics',
      message: error.message
    }, 500);
  }
});

/**
 * POST /api/customers/segmentation/auto-tag
 * Auto-tag customers based on RFM analysis
 */
app.post('/auto-tag', async (c) => {
  try {
    const tenantId = c.get('tenantId') || 'default';
    const service = new CustomerSegmentationService(c.env.DB);

    const result = await service.autoTagCustomers(tenantId);

    return c.json({
      success: true,
      data: result,
      message: `Successfully tagged ${result.tagged} customers`,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Auto-tag error:', error);
    return c.json({
      success: false,
      error: 'Failed to auto-tag customers',
      message: error.message
    }, 500);
  }
});

/**
 * GET /api/customers/segmentation/actions/:segment
 * Get recommended actions for a segment
 */
app.get('/actions/:segment', async (c) => {
  try {
    const segment = c.req.param('segment');
    const service = new CustomerSegmentationService(c.env.DB);

    // Validate segment
    const validSegments = Object.values(CustomerSegment);
    if (!validSegments.includes(segment as any)) {
      return c.json({
        success: false,
        error: 'Invalid segment',
        validSegments
      }, 400);
    }

    const actions = service.getRecommendedActions(segment as any);

    return c.json({
      success: true,
      data: {
        segment,
        actions
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Get actions error:', error);
    return c.json({
      success: false,
      error: 'Failed to get recommended actions',
      message: error.message
    }, 500);
  }
});

export default app;
