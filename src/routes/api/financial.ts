import { Hono } from 'hono';
import { Env } from '../../types';

const app = new Hono<{ Bindings: Env }>();

// Expenses CRUD
app.get('/expenses', async (c: any) => {
  try {
    const { page = '1', limit = '50', category, start_date, end_date } = c.req.query();
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let query = `
      SELECT 
        e.*,
        c.name as category_name,
        c.color as category_color
      FROM expenses e
      LEFT JOIN expense_categories c ON e.category_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (category) {
      query += ` AND e.category_id = ?`;
      params.push(category);
    }
    
    if (start_date) {
      query += ` AND e.date >= ?`;
      params.push(start_date);
    }
    
    if (end_date) {
      query += ` AND e.date <= ?`;
      params.push(end_date);
    }
    
    query += ` ORDER BY e.date DESC, e.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);
    
    const result = await c.env.DB.prepare(query).bind(...params).all();
    
    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM expenses e WHERE 1=1`;
    const countParams: any[] = [];
    
    if (category) {
      countQuery += ` AND e.category_id = ?`;
      countParams.push(category);
    }
    
    if (start_date) {
      countQuery += ` AND e.date >= ?`;
      countParams.push(start_date);
    }
    
    if (end_date) {
      countQuery += ` AND e.date <= ?`;
      countParams.push(end_date);
    }
    
    const countResult = await c.env.DB.prepare(countQuery).bind(...countParams).first();
    
    return c.json({
      success: true,
      data: result.results || [],
      pagination: {
        total: countResult?.total || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil((countResult?.total || 0) / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Expenses list error:', error);
    return c.json({ success: false, error: 'Failed to fetch expenses' }, 500);
  }
});

app.post('/expenses', async (c: any) => {
  try {
    const { 
      category_id, 
      amount, 
      description, 
      date, 
      receipt_url,
      tags,
      vendor_name,
      payment_method
    } = await c.req.json();
    
    if (!category_id || !amount || !description || !date) {
      return c.json({ success: false, error: 'Category, amount, description and date are required' }, 400);
    }
    
    const expenseId = crypto.randomUUID();
    
    await c.env.DB.prepare(`
      INSERT INTO expenses (
        id, category_id, amount, description, date, tags, vendor_name, payment_method, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      expenseId,
      category_id,
      amount,
      description,
      date,
      tags || null,
      vendor_name || null,
      payment_method || 'cash'
    ).run();
    
    // Get the created expense with category info
    const expense = await c.env.DB.prepare(`
      SELECT
        e.*,
        c.name as category_name,
        c.color as category_color
      FROM expenses e
      LEFT JOIN expense_categories c ON e.category_id = c.id
      WHERE e.id = ?
    `).bind(expenseId).first();

    return c.json({
      success: true,
      data: expense
    }, 201);
  } catch (error) {
    console.error('Expense create error:', error);
    return c.json({ success: false, error: 'Failed to create expense' }, 500);
  }
});

app.put('/expenses/:id', async (c: any) => {
  try {
    const { id } = c.req.param();
    const { 
      category_id, 
      amount, 
      description, 
      date, 
      receipt_url,
      tags,
      vendor_name,
      payment_method
    } = await c.req.json();
    
    const result = await c.env.DB.prepare(`
      UPDATE expenses
      SET category_id = ?, amount = ?, description = ?, date = ?, tags = ?, vendor_name = ?, payment_method = ?
      WHERE id = ?
    `).bind(category_id, amount, description, date, tags, vendor_name, payment_method, id).run();
    
    if ((result as any).changes === 0) {
      return c.json({ success: false, error: 'Expense not found' }, 404);
    }
    
    // Get the updated expense with category info
    const expense = await c.env.DB.prepare(`
      SELECT 
        e.*,
        c.name as category_name,
        c.color as category_color
      FROM expenses e
      LEFT JOIN expense_categories c ON e.category_id = c.id
      WHERE e.id = ?
    `).bind(id).first();
    
    return c.json({
      success: true,
      data: expense
    });
  } catch (error) {
    console.error('Expense update error:', error);
    return c.json({ success: false, error: 'Failed to update expense' }, 500);
  }
});

app.delete('/expenses/:id', async (c: any) => {
  try {
    const { id } = c.req.param();
    
    const result = await c.env.DB.prepare(`
      DELETE FROM expenses 
      WHERE id = ?
    `).bind(id).run();
    
    if ((result as any).changes === 0) {
      return c.json({ success: false, error: 'Expense not found' }, 404);
    }
    
    return c.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Expense delete error:', error);
    return c.json({ success: false, error: 'Failed to delete expense' }, 500);
  }
});

// Expense Categories CRUD
app.get('/expense-categories', async (c: any) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT * FROM expense_categories 
      ORDER BY name ASC
    `).all();
    
    return c.json({
      success: true,
      data: result.results || []
    });
  } catch (error) {
    console.error('Expense categories list error:', error);
    return c.json({ success: false, error: 'Failed to fetch expense categories' }, 500);
  }
});

app.post('/expense-categories', async (c: any) => {
  try {
    const { name, description, color, budget_limit } = await c.req.json();
    
    if (!name) {
      return c.json({ success: false, error: 'Name is required' }, 400);
    }
    
    const categoryId = crypto.randomUUID();
    
    await c.env.DB.prepare(`
      INSERT INTO expense_categories (id, name, description, color, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(categoryId, name, description || null, color || null).run();
    
    const category = await c.env.DB.prepare(`
      SELECT * FROM expense_categories WHERE id = ?
    `).bind(categoryId).first();

    return c.json({
      success: true,
      data: category
    }, 201);
  } catch (error) {
    console.error('Expense category create error:', error);
    return c.json({ success: false, error: 'Failed to create expense category' }, 500);
  }
});

// Financial Reports
app.get('/profit-loss', async (c: any) => {
  try {
    const { start_date, end_date } = c.req.query();
    
    // Get revenue (sales)
    let revenueQuery = `
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM sales
      WHERE payment_status = 'paid'
    `;

    if (start_date && end_date) {
      revenueQuery += ` AND created_at >= '${start_date}' AND created_at <= '${end_date}'`;
    }

    const revenueResult = await c.env.DB.prepare(revenueQuery).first();
    
    // Get expenses
    const expenseCondition = start_date && end_date ? 
      `WHERE date >= '${start_date}' AND date <= '${end_date}'` : '';
    
    const expenseResult = await c.env.DB.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM expenses
      ${expenseCondition}
    `).first();
    
    // Get cost of goods sold (simplified - estimate using 60% of sale price)
    let cogsQuery = `
      SELECT COALESCE(SUM(si.quantity * (p.price * 0.6)), 0) as total
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      JOIN sales s ON si.sale_id = s.id
      WHERE s.payment_status = 'paid'
    `;

    if (start_date && end_date) {
      cogsQuery += ` AND s.created_at >= '${start_date}' AND s.created_at <= '${end_date}'`;
    }

    const cogsResult = await c.env.DB.prepare(cogsQuery).first();
    
    const revenue = revenueResult?.total || 0;
    const expenses = expenseResult?.total || 0;
    const costOfGoodsSold = cogsResult?.total || 0;
    const grossProfit = revenue - costOfGoodsSold;
    const netProfit = grossProfit - expenses;
    
    return c.json({
      success: true,
      data: {
        period: {
          start_date: start_date || 'all_time',
          end_date: end_date || 'all_time'
        },
        revenue: {
          total: revenue,
          sales: revenue,
          services: 0, // Can be added later
          other: 0
        },
        cost_of_goods_sold: {
          total: costOfGoodsSold,
          inventory: costOfGoodsSold,
          labor: 0 // Can be added later
        },
        gross_profit: grossProfit,
        operating_expenses: {
          total: expenses,
          rent: 0, // Can be categorized
          utilities: 0,
          marketing: 0,
          admin: expenses
        },
        net_profit: netProfit,
        profit_margin: revenue > 0 ? (netProfit / revenue) * 100 : 0
      }
    });
  } catch (error) {
    console.error('Profit loss report error:', error);
    return c.json({ success: false, error: 'Failed to generate profit loss report' }, 500);
  }
});

app.get('/budget-analysis', async (c: any) => {
  try {
    const { month, year } = c.req.query();
    
    const targetMonth = month || new Date().getMonth() + 1;
    const targetYear = year || new Date().getFullYear();
    
    // Get spending analysis for each category
    const budgetAnalysis = await c.env.DB.prepare(`
      SELECT
        c.id,
        c.name,
        c.color,
        0 as budget_limit,
        COALESCE(SUM(e.amount), 0) as actual_spent,
        0 as variance_percentage
      FROM expense_categories c
      LEFT JOIN expenses e ON c.id = e.category_id
        AND strftime('%m', e.date) = ?
        AND strftime('%Y', e.date) = ?
      GROUP BY c.id, c.name, c.color
      ORDER BY actual_spent DESC
    `).bind(
      targetMonth.toString().padStart(2, '0'),
      targetYear.toString()
    ).all();
    
    // Get total budget vs actual
    const totalBudget = await c.env.DB.prepare(`
      SELECT 0 as total
    `).first();
    
    const totalActual = await c.env.DB.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE strftime('%m', date) = ? AND strftime('%Y', date) = ?
    `).bind(
      targetMonth.toString().padStart(2, '0'),
      targetYear.toString()
    ).first();
    
    return c.json({
      success: true,
      data: {
        period: {
          month: parseInt(targetMonth as string),
          year: parseInt(targetYear as string)
        },
        categories: budgetAnalysis.results || [],
        summary: {
          total_budget: totalBudget?.total || 0,
          total_actual: totalActual?.total || 0,
          variance: (totalBudget?.total || 0) - (totalActual?.total || 0),
          variance_percentage: totalBudget?.total > 0 ? 
            (((totalBudget?.total || 0) - (totalActual?.total || 0)) / (totalBudget?.total || 0)) * 100 : 0
        }
      }
    });
  } catch (error) {
    console.error('Budget analysis error:', error);
    return c.json({ success: false, error: 'Failed to generate budget analysis' }, 500);
  }
});

// Financial Dashboard Data
app.get('/dashboard', async (c: any) => {
  try {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const yearStart = new Date(today.getFullYear(), 0, 1);
    
    // Get income data
    const [todayIncome, monthIncome, yearIncome] = await Promise.all([
      c.env.DB.prepare(`
        SELECT COALESCE(SUM(total_amount), 0) as total
        FROM sales
        WHERE date(created_at) = date('now') AND payment_status = 'paid'
      `).first(),
      
      c.env.DB.prepare(`
        SELECT COALESCE(SUM(total_amount), 0) as total
        FROM sales
        WHERE created_at >= ? AND payment_status = 'paid'
      `).bind(monthStart.toISOString()).first(),
      
      c.env.DB.prepare(`
        SELECT COALESCE(SUM(total_amount), 0) as total
        FROM sales
        WHERE created_at >= ? AND payment_status = 'paid'
      `).bind(yearStart.toISOString()).first()
    ]);
    
    // Get expense data
    const [todayExpense, monthExpense, yearExpense] = await Promise.all([
      c.env.DB.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM expenses
        WHERE date = date('now')
      `).first(),
      
      c.env.DB.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM expenses
        WHERE date >= ?
      `).bind(monthStart.toISOString().split('T')[0]).first(),
      
      c.env.DB.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM expenses
        WHERE date >= ?
      `).bind(yearStart.toISOString().split('T')[0]).first()
    ]);
    
    // Get top expense categories this month
    const topExpenseCategories = await c.env.DB.prepare(`
      SELECT 
        c.name,
        c.color,
        SUM(e.amount) as total
      FROM expenses e
      JOIN expense_categories c ON e.category_id = c.id
      WHERE e.date >= ?
      GROUP BY c.id, c.name, c.color
      ORDER BY total DESC
      LIMIT 5
    `).bind(monthStart.toISOString().split('T')[0]).all();
    
    return c.json({
      success: true,
      data: {
        income: {
          today: todayIncome?.total || 0,
          month: monthIncome?.total || 0,
          year: yearIncome?.total || 0
        },
        expenses: {
          today: todayExpense?.total || 0,
          month: monthExpense?.total || 0,
          year: yearExpense?.total || 0
        },
        profit: {
          today: (todayIncome?.total || 0) - (todayExpense?.total || 0),
          month: (monthIncome?.total || 0) - (monthExpense?.total || 0),
          year: (yearIncome?.total || 0) - (yearExpense?.total || 0)
        },
        top_expense_categories: topExpenseCategories.results || []
      }
    });
  } catch (error) {
    console.error('Financial dashboard error:', error);
    return c.json({ success: false, error: 'Failed to fetch financial dashboard data' }, 500);
  }
});

// Revenue endpoint
app.get('/revenue', async (c: any) => {
  try {
    const { period = 'month', start_date, end_date } = c.req.query();

    let query = `
      SELECT
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COUNT(*) as total_orders,
        AVG(total_amount) as avg_order_value
      FROM sales
      WHERE payment_status = 'paid'
    `;
    const params: any[] = [];

    if (start_date && end_date) {
      query += ` AND date(created_at) BETWEEN ? AND ?`;
      params.push(start_date, end_date);
    } else {
      // Default period handling
      const today = new Date();
      let periodStart: Date;

      switch (period) {
        case 'day':
          periodStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          break;
        case 'week':
          periodStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          periodStart = new Date(today.getFullYear(), today.getMonth(), 1);
          break;
        case 'year':
          periodStart = new Date(today.getFullYear(), 0, 1);
          break;
        default:
          periodStart = new Date(today.getFullYear(), today.getMonth(), 1);
      }

      query += ` AND created_at >= ?`;
      params.push(periodStart.toISOString());
    }

    const result = await c.env.DB.prepare(query).bind(...params).first();

    // Get revenue breakdown by day for the period
    let breakdownQuery = `
      SELECT
        date(created_at) as date,
        COALESCE(SUM(total_amount), 0) as revenue,
        COUNT(*) as orders
      FROM sales
      WHERE payment_status = 'paid'
    `;

    if (start_date && end_date) {
      breakdownQuery += ` AND date(created_at) BETWEEN ? AND ?`;
    } else {
      const today = new Date();
      let periodStart: Date;

      switch (period) {
        case 'day':
          periodStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          break;
        case 'week':
          periodStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          periodStart = new Date(today.getFullYear(), today.getMonth(), 1);
          break;
        case 'year':
          periodStart = new Date(today.getFullYear(), 0, 1);
          break;
        default:
          periodStart = new Date(today.getFullYear(), today.getMonth(), 1);
      }

      breakdownQuery += ` AND created_at >= ?`;
    }

    breakdownQuery += ` GROUP BY date(created_at) ORDER BY date(created_at) DESC LIMIT 30`;

    const breakdown = await c.env.DB.prepare(breakdownQuery).bind(...params).all();

    return c.json({
      success: true,
      data: {
        summary: {
          total_revenue: result?.total_revenue || 0,
          total_orders: result?.total_orders || 0,
          avg_order_value: result?.avg_order_value || 0,
          period: period
        },
        breakdown: breakdown.results || []
      }
    });
  } catch (error) {
    console.error('Revenue endpoint error:', error);
    return c.json({ success: false, error: 'Failed to fetch revenue data' }, 500);
  }
});

export default app;

