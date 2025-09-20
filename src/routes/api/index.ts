import { Hono } from 'hono';
import { Env } from '../../types';
import { authenticate } from '../../middleware/auth';

// Import all API route modules
import authRouter from './auth';
import productsRouter from './products';
import ordersRouter from './orders';
import analyticsRouter from './analytics';
import customersRouter from './customers';
import inventoryRouter from './inventory';
import reportsRouter from './reports';
import vouchersRouter from './vouchers';
import settingsRouter from './settings';
import notificationsRouter from './notifications';
import tasksRouter from './tasks';
import suppliersRouter from './suppliers';
import warrantiesRouter from './warranties';
import categoriesRouter from './categories';
import brandsRouter from './brands';
import salesRouter from './sales';
import posRouter from './pos';
import usersRouter from './users';
import paymentsRouter from './payments';
import shippingRouter from './shipping';
import financialRouter from './financial';
import purchaseOrdersRouter from './purchase-orders';
import serialWarrantyRouter from './serial-warranty';
import serialNumbersRouter from './serial-numbers';
import employeeManagementRouter from './employee-management';
import fileUploadRouter from './file-upload';
import rbacRouter from './rbac';
import alertsRouter from './alerts';
import advancedReportsRouter from './advanced-reports';
import storesRouter from './stores';
import paymentMethodsRouter from './payment-methods';
import promotionsRouter from './promotions';

const app = new Hono<{ Bindings: Env }>();

// Note: Tenant ID is handled with fallback in each handler: c.req.header('X-Tenant-ID') || 'default'

// Mount all API routes directly (no /api prefix since they're already under /api/v1)
app.route('/auth', authRouter);
app.route('/products', productsRouter);
app.route('/orders', ordersRouter);
app.route('/analytics', analyticsRouter);
app.route('/customers', customersRouter);
app.route('/inventory', inventoryRouter);
app.route('/reports', reportsRouter);
app.route('/vouchers', vouchersRouter);
app.route('/pos', posRouter);
app.route('/settings', settingsRouter);
app.route('/notifications', notificationsRouter);
app.route('/tasks', tasksRouter);
app.route('/suppliers', suppliersRouter);
app.route('/warranties', warrantiesRouter);
app.route('/categories', categoriesRouter);
app.route('/brands', brandsRouter);
app.route('/sales', salesRouter);
app.route('/users', usersRouter);
app.route('/payments', paymentsRouter);
app.route('/shipping', shippingRouter);
app.route('/financial', financialRouter);
app.route('/purchase-orders', purchaseOrdersRouter);
app.route('/serial-warranty', serialWarrantyRouter);
app.route('/serial-numbers', serialNumbersRouter);
app.route('/employee-management', employeeManagementRouter);
app.route('/file-upload', fileUploadRouter);
app.route('/rbac', rbacRouter);
app.route('/permissions', rbacRouter);
app.route('/alerts', alertsRouter);
app.route('/advanced-reports', advancedReportsRouter);
app.route('/stores', storesRouter);
app.route('/payment-methods', paymentMethodsRouter);
app.route('/promotions', promotionsRouter);


// Health check endpoint
app.get('/health', async (c: any) => {
  return c.json({
    success: true,
    message: 'SmartPOS API v1 is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    timezone: 'UTC',
    endpoints: {
      health: '/api/v1/health',
      products: '/api/v1/products',
      customers: '/api/v1/customers',
      sales: '/api/v1/sales',
      dashboard: '/api/v1/dashboard/stats'
    }
  });
});


export default app;


