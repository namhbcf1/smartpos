/**
 * BUSINESS INTELLIGENCE API ROUTES
 * 
 * Advanced analytics and reporting endpoints for comprehensive business insights,
 * profit analysis, trend forecasting, and custom report generation.
 */

import { Hono } from 'hono';
import { Env, ApiResponse } from '../types';
import { standardAuthenticate, standardAuthorize } from '../middleware/auth-standardized';
import { BusinessIntelligenceService } from '../services/BusinessIntelligenceService';
import { log } from '../utils/logger';

const app = new Hono<{ Bindings: Env }>();

// Apply authentication to all routes
app.use('*', standardAuthenticate);

// ============================================================================
// PROFIT ANALYSIS
// ============================================================================

/**
 * Analyze profit margins
 * GET /api/v1/business-intelligence/profit-analysis
 */
app.get('/profit-analysis',
  standardAuthorize(['admin', 'manager']),
  async (c) => {
    try {
      const startDate = c.req.query('startDate');
      const endDate = c.req.query('endDate');
      const categoryId = c.req.query('categoryId');

      const service = new BusinessIntelligenceService(c.env);
      const analysis = await service.analyzeProfitMargins(
        startDate,
        endDate,
        categoryId ? parseInt(categoryId) : undefined
      );

      log.info('Profit analysis generated', {
        count: analysis.length,
        startDate,
        endDate,
        categoryId,
        userId: c.get('user')?.id
      });

      return c.json<ApiResponse<typeof analysis>>({
        success: true,
        data: analysis,
        message: `Profit analysis completed for ${analysis.length} products`
      });
    } catch (error) {
      log.error('Failed to analyze profit margins', error);
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Failed to analyze profit margins',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
);

// ============================================================================
// SALES TRENDS & FORECASTING
// ============================================================================

/**
 * Analyze sales trends with forecasting
 * GET /api/v1/business-intelligence/sales-trends
 */
app.get('/sales-trends',
  standardAuthorize(['admin', 'manager', 'sales_agent']),
  async (c) => {
    try {
      const groupBy = (c.req.query('groupBy') as 'day' | 'week' | 'month') || 'month';
      const periods = parseInt(c.req.query('periods') || '12');

      if (!['day', 'week', 'month'].includes(groupBy)) {
        return c.json<ApiResponse<null>>({
          success: false,
          data: null,
          message: 'Invalid groupBy parameter. Must be: day, week, or month',
          error: 'INVALID_GROUP_BY'
        }, 400);
      }

      const service = new BusinessIntelligenceService(c.env);
      const trends = await service.analyzeSalesTrends(groupBy, periods);

      log.info('Sales trends analyzed', {
        groupBy,
        periods,
        count: trends.length,
        userId: c.get('user')?.id
      });

      return c.json<ApiResponse<typeof trends>>({
        success: true,
        data: trends,
        message: `Sales trends analyzed for ${periods} ${groupBy}s`
      });
    } catch (error) {
      log.error('Failed to analyze sales trends', error);
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Failed to analyze sales trends',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
);

// ============================================================================
// CUSTOMER ANALYTICS
// ============================================================================

/**
 * Analyze customer behavior and segmentation
 * GET /api/v1/business-intelligence/customer-analytics
 */
app.get('/customer-analytics',
  standardAuthorize(['admin', 'manager']),
  async (c) => {
    try {
      const service = new BusinessIntelligenceService(c.env);
      const analytics = await service.analyzeCustomerBehavior();

      log.info('Customer analytics generated', {
        count: analytics.length,
        userId: c.get('user')?.id
      });

      return c.json<ApiResponse<typeof analytics>>({
        success: true,
        data: analytics,
        message: `Customer analytics completed for ${analytics.length} customers`
      });
    } catch (error) {
      log.error('Failed to analyze customer behavior', error);
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Failed to analyze customer behavior',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
);

/**
 * Get customer segmentation summary
 * GET /api/v1/business-intelligence/customer-segments
 */
app.get('/customer-segments',
  standardAuthorize(['admin', 'manager']),
  async (c) => {
    try {
      const service = new BusinessIntelligenceService(c.env);
      const analytics = await service.analyzeCustomerBehavior();

      // Group customers by segment
      const segments = analytics.reduce((acc, customer) => {
        const segment = customer.customerSegment;
        if (!acc[segment]) {
          acc[segment] = {
            count: 0,
            totalValue: 0,
            averageValue: 0
          };
        }
        acc[segment].count++;
        acc[segment].totalValue += customer.totalSpent;
        return acc;
      }, {} as Record<string, any>);

      // Calculate averages
      Object.keys(segments).forEach(segment => {
        segments[segment].averageValue = segments[segment].totalValue / segments[segment].count;
      });

      return c.json<ApiResponse<typeof segments>>({
        success: true,
        data: segments,
        message: 'Customer segmentation summary generated'
      });
    } catch (error) {
      log.error('Failed to get customer segments', error);
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Failed to get customer segments',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
);

// ============================================================================
// PRODUCT PERFORMANCE
// ============================================================================

/**
 * Analyze product performance
 * GET /api/v1/business-intelligence/product-performance
 */
app.get('/product-performance',
  standardAuthorize(['admin', 'manager', 'inventory']),
  async (c) => {
    try {
      const service = new BusinessIntelligenceService(c.env);
      const performance = await service.analyzeProductPerformance();

      log.info('Product performance analyzed', {
        count: performance.length,
        userId: c.get('user')?.id
      });

      return c.json<ApiResponse<typeof performance>>({
        success: true,
        data: performance,
        message: `Product performance analyzed for ${performance.length} products`
      });
    } catch (error) {
      log.error('Failed to analyze product performance', error);
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Failed to analyze product performance',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
);

// ============================================================================
// BUSINESS METRICS DASHBOARD
// ============================================================================

/**
 * Get comprehensive business metrics
 * GET /api/v1/business-intelligence/business-metrics
 */
app.get('/business-metrics',
  standardAuthorize(['admin', 'manager']),
  async (c) => {
    try {
      const startDate = c.req.query('startDate');
      const endDate = c.req.query('endDate');

      const service = new BusinessIntelligenceService(c.env);
      const metrics = await service.calculateBusinessMetrics(startDate, endDate);

      log.info('Business metrics calculated', {
        startDate,
        endDate,
        totalRevenue: metrics.totalRevenue,
        userId: c.get('user')?.id
      });

      return c.json<ApiResponse<typeof metrics>>({
        success: true,
        data: metrics,
        message: 'Business metrics calculated successfully'
      });
    } catch (error) {
      log.error('Failed to calculate business metrics', error);
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Failed to calculate business metrics',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
);

// ============================================================================
// CUSTOM REPORTS
// ============================================================================

/**
 * Generate custom report
 * POST /api/v1/business-intelligence/custom-report
 */
app.post('/custom-report',
  standardAuthorize(['admin', 'manager']),
  async (c) => {
    try {
      const config = await c.req.json();

      // Validate required fields
      if (!config.reportName || !config.reportType || !config.dateRange) {
        return c.json<ApiResponse<null>>({
          success: false,
          data: null,
          message: 'Missing required fields: reportName, reportType, dateRange',
          error: 'MISSING_REQUIRED_FIELDS'
        }, 400);
      }

      const service = new BusinessIntelligenceService(c.env);
      const reportData = await service.generateCustomReport(config);

      log.info('Custom report generated', {
        reportName: config.reportName,
        reportType: config.reportType,
        recordCount: reportData.length,
        userId: c.get('user')?.id
      });

      return c.json<ApiResponse<typeof reportData>>({
        success: true,
        data: reportData,
        message: `Custom report "${config.reportName}" generated with ${reportData.length} records`
      });
    } catch (error) {
      log.error('Failed to generate custom report', error);
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Failed to generate custom report',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
);

/**
 * Export report data
 * POST /api/v1/business-intelligence/export-report
 */
app.post('/export-report',
  standardAuthorize(['admin', 'manager']),
  async (c) => {
    try {
      const { data, format = 'csv', filename } = await c.req.json();

      if (!data || !Array.isArray(data)) {
        return c.json<ApiResponse<null>>({
          success: false,
          data: null,
          message: 'Invalid data format. Expected array of objects.',
          error: 'INVALID_DATA_FORMAT'
        }, 400);
      }

      const service = new BusinessIntelligenceService(c.env);
      const exportedData = await service.exportReport(data, format);

      // Set appropriate headers for file download
      const contentType = {
        csv: 'text/csv',
        json: 'application/json',
        excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }[format] || 'text/plain';

      const defaultFilename = `report_${new Date().toISOString().split('T')[0]}.${format}`;

      c.header('Content-Type', contentType);
      c.header('Content-Disposition', `attachment; filename="${filename || defaultFilename}"`);

      log.info('Report exported', {
        format,
        filename: filename || defaultFilename,
        recordCount: data.length,
        userId: c.get('user')?.id
      });

      return c.text(exportedData);
    } catch (error) {
      log.error('Failed to export report', error);
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Failed to export report',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
);

// ============================================================================
// ANALYTICS DASHBOARD DATA
// ============================================================================

/**
 * Get dashboard overview data
 * GET /api/v1/business-intelligence/dashboard
 */
app.get('/dashboard',
  standardAuthorize(['admin', 'manager']),
  async (c) => {
    try {
      const service = new BusinessIntelligenceService(c.env);

      // Get data for dashboard in parallel
      const [
        businessMetrics,
        salesTrends,
        topProducts,
        customerSegments
      ] = await Promise.all([
        service.calculateBusinessMetrics(),
        service.analyzeSalesTrends('month', 6),
        service.analyzeProductPerformance().then(products => products.slice(0, 10)),
        service.analyzeCustomerBehavior().then(customers => {
          const segments = customers.reduce((acc, customer) => {
            const segment = customer.customerSegment;
            acc[segment] = (acc[segment] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          return segments;
        })
      ]);

      const dashboardData = {
        businessMetrics,
        salesTrends,
        topProducts,
        customerSegments,
        lastUpdated: new Date().toISOString()
      };

      log.info('Dashboard data generated', {
        userId: c.get('user')?.id
      });

      return c.json<ApiResponse<typeof dashboardData>>({
        success: true,
        data: dashboardData,
        message: 'Dashboard data generated successfully'
      });
    } catch (error) {
      log.error('Failed to generate dashboard data', error);
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Failed to generate dashboard data',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
);

export default app;
