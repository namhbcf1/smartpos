import { Hono } from 'hono';
import { Env } from '../../types';

const app = new Hono<{ Bindings: Env }>();

// GET /api/employee-management/employees - List employees
app.get('/employees', async (c: any) => {
  try {
    const { page = '1', limit = '50', status, role, department, search } = c.req.query();
    
    let query = `
      SELECT
        e.id,
        e.employee_id,
        e.first_name,
        e.last_name,
        e.email,
        e.phone,
        e.role,
        e.department,
        e.position,
        e.hire_date,
        e.salary,
        e.status,
        e.address,
        e.emergency_contact,
        e.notes,
        e.created_at,
        e.updated_at
      FROM employees e
    `;
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (status) {
      conditions.push(`e.status = ?`);
      params.push(status);
    }
    
    if (role) {
      conditions.push(`e.role = ?`);
      params.push(role);
    }
    
    if (department) {
      conditions.push(`e.department = ?`);
      params.push(department);
    }
    
    if (search) {
      conditions.push(`(e.first_name LIKE ? OR e.last_name LIKE ? OR e.email LIKE ? OR e.employee_id LIKE ?)`);
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY e.created_at DESC`;
    
    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);
    
    const result = await c.env.DB.prepare(query).bind(...params).all();
    
    return c.json({
      success: true,
      data: result.results || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.results?.length || 0,
        pages: Math.ceil((result.results?.length || 0) / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Employees list error:', error);
    return c.json({
      success: true,
      data: [],
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        pages: 0
      }
    });
  }
});

// GET /api/employee-management/employees/:id - Get employee details
app.get('/employees/:id', async (c: any) => {
  try {
    const id = c.req.param('id');
    
    const employee = await c.env.DB.prepare(`
      SELECT e.*
      FROM employees e
      WHERE e.id = ?
    `).bind(id).first();
    
    if (!employee) {
      return c.json({ success: false, error: 'Employee not found' }, 404);
    }
    
    // Get attendance records (last 30 days)
    const attendance = await c.env.DB.prepare(`
      SELECT 
        date,
        check_in_time,
        check_out_time,
        total_hours,
        status,
        notes
      FROM employee_attendance
      WHERE employee_id = ? AND date >= date('now', '-30 days')
      ORDER BY date DESC
    `).bind(id).all();
    
    // Get performance records (last 6 months)
    const performance = await c.env.DB.prepare(`
      SELECT 
        period,
        rating,
        goals_achieved,
        feedback,
        created_at
      FROM employee_performance
      WHERE employee_id = ? AND created_at >= date('now', '-6 months')
      ORDER BY created_at DESC
    `).bind(id).all();
    
    return c.json({
      success: true,
      data: {
        ...employee,
        attendance: attendance.results || [],
        performance: performance.results || []
      }
    });
  } catch (error) {
    console.error('Employee details error:', error);
    return c.json({ success: false, error: 'Failed to fetch employee details' }, 500);
  }
});

// POST /api/employee-management/employees - Create employee
app.post('/employees', async (c: any) => {
  try {
    const data = await c.req.json();
    const { 
      employee_id, first_name, last_name, email, phone, role, 
      department, position, hire_date, salary, address, emergency_contact, notes 
    } = data;
    
    if (!employee_id || !first_name || !last_name || !email || !role) {
      return c.json({ success: false, error: 'Employee ID, name, email, and role are required' }, 400);
    }
    
    // Check if employee ID already exists
    const existing = await c.env.DB.prepare(`
      SELECT id FROM employees WHERE employee_id = ?
    `).bind(employee_id).first();
    
    if (existing) {
      return c.json({ success: false, error: 'Employee ID already exists' }, 400);
    }
    
    const empId = crypto.randomUUID();
    
    await c.env.DB.prepare(`
      INSERT INTO employees (
        id, employee_id, first_name, last_name, email, phone, role,
        department, position, hire_date, salary, status, address,
        emergency_contact, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      empId, employee_id, first_name, last_name, email, phone, role,
      department, position, hire_date || new Date().toISOString(), salary || 0, 'active',
      address, emergency_contact, notes
    ).run();
    
    // Get created employee
    const employee = await c.env.DB.prepare(`
      SELECT * FROM employees WHERE id = ?
    `).bind(empId).first();
    
    return c.json({
      success: true,
      data: employee,
      message: 'Employee created successfully'
    }, 201);
  } catch (error) {
    console.error('Create employee error:', error);
    return c.json({ success: false, error: 'Failed to create employee' }, 500);
  }
});

// PUT /api/employee-management/employees/:id - Update employee
app.put('/employees/:id', async (c: any) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();

    // First get the current employee data
    const currentEmployee = await c.env.DB.prepare(`
      SELECT * FROM employees WHERE id = ?
    `).bind(id).first();

    if (!currentEmployee) {
      return c.json({ success: false, error: 'Employee not found' }, 404);
    }

    // Merge the updates with current data, ensuring no undefined values
    const updateData = {
      first_name: data.first_name || currentEmployee.first_name || '',
      last_name: data.last_name || currentEmployee.last_name || '',
      email: data.email || currentEmployee.email || '',
      phone: data.phone || currentEmployee.phone || '',
      role: data.role || currentEmployee.role || '',
      department: data.department || currentEmployee.department || '',
      position: data.position || currentEmployee.position || '',
      salary: data.salary !== undefined ? data.salary : (currentEmployee.salary || 0),
      status: data.status || currentEmployee.status || 'active',
      address: data.address || currentEmployee.address || '',
      emergency_contact: data.emergency_contact || currentEmployee.emergency_contact || '',
      notes: data.notes !== undefined ? data.notes : (currentEmployee.notes || '')
    };

    await c.env.DB.prepare(`
      UPDATE employees
      SET first_name = ?, last_name = ?, email = ?, phone = ?, role = ?,
          department = ?, position = ?, salary = ?, status = ?, address = ?,
          emergency_contact = ?, notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      updateData.first_name, updateData.last_name, updateData.email,
      updateData.phone, updateData.role, updateData.department,
      updateData.position, updateData.salary, updateData.status,
      updateData.address, updateData.emergency_contact, updateData.notes, id
    ).run();

    // Get updated employee
    const employee = await c.env.DB.prepare(`
      SELECT * FROM employees WHERE id = ?
    `).bind(id).first();

    return c.json({
      success: true,
      data: employee,
      message: 'Employee updated successfully'
    });
  } catch (error) {
    console.error('Update employee error:', error);
    return c.json({ success: false, error: 'Failed to update employee' }, 500);
  }
});

// POST /api/employee-management/attendance/check-in - Check in
app.post('/attendance/check-in', async (c: any) => {
  try {
    const { employee_id, check_in_time, notes } = await c.req.json();
    
    if (!employee_id) {
      return c.json({ success: false, error: 'Employee ID is required' }, 400);
    }
    
    const today = new Date().toISOString().split('T')[0];
    const checkInTime = check_in_time || new Date().toISOString();
    
    // Check if already checked in today
    const existing = await c.env.DB.prepare(`
      SELECT id FROM employee_attendance 
      WHERE employee_id = ? AND date = ?
    `).bind(employee_id, today).first();
    
    if (existing) {
      return c.json({ success: false, error: 'Already checked in today' }, 400);
    }
    
    const attendanceId = crypto.randomUUID();
    
    await c.env.DB.prepare(`
      INSERT INTO employee_attendance (
        id, employee_id, date, check_in_time, status, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(attendanceId, employee_id, today, checkInTime, 'checked_in', notes).run();
    
    return c.json({
      success: true,
      message: 'Checked in successfully'
    });
  } catch (error) {
    console.error('Check in error:', error);
    return c.json({ success: false, error: 'Failed to check in' }, 500);
  }
});

// POST /api/employee-management/attendance/check-out - Check out
app.post('/attendance/check-out', async (c: any) => {
  try {
    const { employee_id, check_out_time, notes } = await c.req.json();
    
    if (!employee_id) {
      return c.json({ success: false, error: 'Employee ID is required' }, 400);
    }
    
    const today = new Date().toISOString().split('T')[0];
    const checkOutTime = check_out_time || new Date().toISOString();
    
    // Get today's attendance record
    const attendance = await c.env.DB.prepare(`
      SELECT * FROM employee_attendance 
      WHERE employee_id = ? AND date = ?
    `).bind(employee_id, today).first() as any;
    
    if (!attendance) {
      return c.json({ success: false, error: 'No check-in record found for today' }, 400);
    }
    
    if (attendance.check_out_time) {
      return c.json({ success: false, error: 'Already checked out today' }, 400);
    }
    
    // Calculate total hours
    const checkIn = new Date(attendance.check_in_time);
    const checkOut = new Date(checkOutTime);
    const totalHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
    
    await c.env.DB.prepare(`
      UPDATE employee_attendance 
      SET check_out_time = ?, total_hours = ?, status = ?, notes = COALESCE(notes || '\n', '') || ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(checkOutTime, totalHours, 'checked_out', notes || '', attendance.id).run();
    
    return c.json({
      success: true,
      message: 'Checked out successfully',
      data: { total_hours: totalHours }
    });
  } catch (error) {
    console.error('Check out error:', error);
    return c.json({ success: false, error: 'Failed to check out' }, 500);
  }
});

// GET /api/employee-management/attendance - Get attendance records
app.get('/attendance', async (c: any) => {
  try {
    const { employee_id, date_from, date_to, page = '1', limit = '50' } = c.req.query();
    
    let query = `
      SELECT 
        ea.*,
        e.first_name,
        e.last_name,
        e.employee_id
      FROM employee_attendance ea
      LEFT JOIN employees e ON ea.employee_id = e.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (employee_id) {
      conditions.push(`ea.employee_id = ?`);
      params.push(employee_id);
    }
    
    if (date_from) {
      conditions.push(`ea.date >= ?`);
      params.push(date_from);
    }
    
    if (date_to) {
      conditions.push(`ea.date <= ?`);
      params.push(date_to);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY ea.date DESC`;
    
    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);
    
    const result = await c.env.DB.prepare(query).bind(...params).all();
    
    return c.json({
      success: true,
      data: result.results || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.results?.length || 0,
        pages: Math.ceil((result.results?.length || 0) / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Attendance records error:', error);
    return c.json({
      success: true,
      data: [],
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        pages: 0
      }
    });
  }
});

// POST /api/employee-management/performance - Create performance record
app.post('/performance', async (c: any) => {
  try {
    const { employee_id, period, rating, goals_achieved, feedback, reviewer_id } = await c.req.json();
    
    if (!employee_id || !period || !rating) {
      return c.json({ success: false, error: 'Employee ID, period, and rating are required' }, 400);
    }
    
    const performanceId = crypto.randomUUID();
    
    await c.env.DB.prepare(`
      INSERT INTO employee_performance (
        id, employee_id, period, rating, goals_achieved, feedback, reviewer_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(performanceId, employee_id, period, rating, goals_achieved, feedback, reviewer_id).run();
    
    return c.json({
      success: true,
      message: 'Performance record created successfully'
    }, 201);
  } catch (error) {
    console.error('Create performance record error:', error);
    return c.json({ success: false, error: 'Failed to create performance record' }, 500);
  }
});

// GET /api/employee-management/stats - Get employee statistics
app.get('/stats', async (c: any) => {
  try {
    // Get employee stats
    const employeeStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_employees,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_employees,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_employees,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_count,
        SUM(CASE WHEN role = 'manager' THEN 1 ELSE 0 END) as manager_count,
        SUM(CASE WHEN role = 'cashier' THEN 1 ELSE 0 END) as cashier_count,
        SUM(CASE WHEN role = 'inventory' THEN 1 ELSE 0 END) as inventory_count
      FROM employees
    `).first();
    
    // Get attendance stats (today)
    const today = new Date().toISOString().split('T')[0];
    const attendanceStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_checked_in,
        SUM(CASE WHEN check_out_time IS NOT NULL THEN 1 ELSE 0 END) as total_checked_out,
        AVG(total_hours) as avg_hours_worked
      FROM employee_attendance 
      WHERE date = ?
    `).bind(today).first();
    
    // Get department stats
    const departmentStats = await c.env.DB.prepare(`
      SELECT 
        department,
        COUNT(*) as employee_count,
        AVG(salary) as avg_salary
      FROM employees 
      WHERE status = 'active' AND department IS NOT NULL
      GROUP BY department
      ORDER BY employee_count DESC
    `).all();
    
    return c.json({
      success: true,
      data: {
        employee_stats: employeeStats,
        attendance_stats: attendanceStats,
        department_stats: departmentStats.results || []
      }
    });
  } catch (error) {
    console.error('Employee stats error:', error);
    return c.json({
      success: true,
      data: {
        employee_stats: {
          total_employees: 0,
          active_employees: 0,
          inactive_employees: 0,
          admin_count: 0,
          manager_count: 0,
          cashier_count: 0,
          inventory_count: 0
        },
        attendance_stats: {
          total_checked_in: 0,
          total_checked_out: 0,
          avg_hours_worked: 0
        },
        department_stats: []
      }
    });
  }
});

export default app;
