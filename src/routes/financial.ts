/**
 * Financial API routes for SmartPOS
 */

import { Hono } from 'hono';
import { Env } from '../types';
import { authenticate } from '../middleware/auth';

const financial = new Hono<{ Bindings: Env }>();

// Apply authentication to all routes
financial.use('*', authenticate);

/**
 * GET /financial/summary
 * Get financial summary data
 */
financial.get('/summary', async (c) => {
  try {
    // Get date ranges
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const yearStart = new Date(today.getFullYear(), 0, 1);

    // Get sales data (income)
    const [
      todayIncome,
      monthIncome,
      yearIncome,
      totalIncome
    ] = await Promise.all([
      // Today's income
      c.env.DB.prepare(`
        SELECT COALESCE(SUM(total_amount), 0) as total
        FROM sales
        WHERE created_at >= ? AND payment_status = 'paid'
      `).bind(todayStart.toISOString()).first(),

      // This month's income
      c.env.DB.prepare(`
        SELECT COALESCE(SUM(total_amount), 0) as total
        FROM sales
        WHERE created_at >= ? AND payment_status = 'paid'
      `).bind(monthStart.toISOString()).first(),

      // This year's income
      c.env.DB.prepare(`
        SELECT COALESCE(SUM(total_amount), 0) as total
        FROM sales
        WHERE created_at >= ? AND payment_status = 'paid'
      `).bind(yearStart.toISOString()).first(),

      // Total income
      c.env.DB.prepare(`
        SELECT COALESCE(SUM(total_amount), 0) as total
        FROM sales
        WHERE payment_status = 'paid'
      `).first()
    ]);

    // For now, expenses are 0 since we don't have expense tracking yet
    // TODO: Implement expense tracking
    const expenses = {
      today: 0,
      month: 0,
      year: 0,
      total: 0
    };

    const summary = {
      totalIncome: totalIncome?.total || 0,
      totalExpense: expenses.total,
      netProfit: (totalIncome?.total || 0) - expenses.total,
      balance: (totalIncome?.total || 0) - expenses.total,
      todayIncome: todayIncome?.total || 0,
      monthIncome: monthIncome?.total || 0,
      yearIncome: yearIncome?.total || 0,
      todayExpense: expenses.today,
      monthExpense: expenses.month,
      yearExpense: expenses.year
    };

    return c.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Failed to get financial summary:', error);
    return c.json({
      success: false,
      message: 'Failed to get financial summary',
      error: error.message
    }, 500);
  }
});

/**
 * GET /financial/transactions
 * Get financial transactions (sales for now)
 */
financial.get('/transactions', async (c) => {
  try {
    const query = c.req.query();
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const offset = (page - 1) * limit;

    // Get sales as income transactions
    const salesResult = await c.env.DB.prepare(`
      SELECT 
        s.id,
        s.created_at as date,
        'income' as transaction_type,
        'sales' as category,
        s.total_amount as amount,
        s.payment_method,
        s.customer_name,
        s.notes,
        'sale' as reference_type,
        s.id as reference_id
      FROM sales s
      WHERE s.payment_status = 'paid'
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    // Get total count
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total
      FROM sales
      WHERE payment_status = 'paid'
    `).first();

    const transactions = salesResult.results || [];
    const total = countResult?.total || 0;

    return c.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Failed to get financial transactions:', error);
    return c.json({
      success: false,
      message: 'Failed to get financial transactions',
      error: error.message
    }, 500);
  }
});

/**
 * GET /financial/chart-data
 * Get chart data for financial dashboard
 */
financial.get('/chart-data', async (c) => {
  try {
    const query = c.req.query();
    const period = query.period || 'week'; // week, month, year
    
    let dateCondition = '';
    let groupBy = '';
    
    const now = new Date();
    
    switch (period) {
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateCondition = `WHERE s.created_at >= '${weekAgo.toISOString()}'`;
        groupBy = `DATE(s.created_at)`;
        break;
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        dateCondition = `WHERE s.created_at >= '${monthAgo.toISOString()}'`;
        groupBy = `DATE(s.created_at)`;
        break;
      case 'year':
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        dateCondition = `WHERE s.created_at >= '${yearAgo.toISOString()}'`;
        groupBy = `strftime('%Y-%m', s.created_at)`;
        break;
    }

    const chartData = await c.env.DB.prepare(`
      SELECT 
        ${groupBy} as period,
        COALESCE(SUM(s.total_amount), 0) as income,
        0 as expense
      FROM sales s
      ${dateCondition}
      AND s.payment_status = 'paid'
      GROUP BY ${groupBy}
      ORDER BY period ASC
    `).all();

    return c.json({
      success: true,
      data: chartData.results || []
    });
  } catch (error) {
    console.error('Failed to get chart data:', error);
    return c.json({
      success: false,
      message: 'Failed to get chart data',
      error: error.message
    }, 500);
  }
});

export default financial;
