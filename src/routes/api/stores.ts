import { Hono } from 'hono';
import { Env } from '../../types';
import { authenticate, requireRole, storeAccess } from '../../middleware/auth';

const app = new Hono<{ Bindings: Env }>();

// Apply authentication middleware to all routes
app.use('*', authenticate);

// GET /api/stores - List all stores (admin/manager only)
app.get('/', requireRole('manager'), async (c: any) => {
  try {
    const { page = '1', limit = '20', status, search } = c.req.query();
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Use mock data for stores
    const mockStores = [
      {
        id: '1',
        name: 'Cửa hàng Trung tâm',
        code: 'CT-001',
        address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
        phone: '028-3823-4567',
        email: 'central@smartpos.vn',
        manager_id: '2',
        manager_name: 'Nguyễn Văn Quản Lý',
        is_active: true,
        opening_hours: '08:00-22:00',
        timezone: 'Asia/Ho_Chi_Minh',
        currency: 'VND',
        tax_id: '0123456789',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Chi nhánh Quận 7',
        code: 'Q7-002',
        address: '456 Lotte Mart, Quận 7, TP.HCM',
        phone: '028-5432-1098',
        email: 'q7@smartpos.vn',
        manager_id: '3',
        manager_name: 'Trần Thị Kim',
        is_active: true,
        opening_hours: '09:00-21:30',
        timezone: 'Asia/Ho_Chi_Minh',
        currency: 'VND',
        tax_id: '0123456790',
        created_at: '2025-02-15T00:00:00Z',
        updated_at: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Cửa hàng Bình Thạnh',
        code: 'BT-003',
        address: '789 Xô Viết Nghệ Tĩnh, Bình Thạnh, TP.HCM',
        phone: '028-8765-4321',
        email: 'binhthanh@smartpos.vn',
        manager_id: '4',
        manager_name: 'Lê Văn Minh',
        is_active: false,
        opening_hours: '08:30-21:00',
        timezone: 'Asia/Ho_Chi_Minh',
        currency: 'VND',
        tax_id: '0123456791',
        created_at: '2025-03-01T00:00:00Z',
        updated_at: new Date().toISOString()
      }
    ];

    // Apply filters
    let filteredStores = [...mockStores];

    if (status) {
      const is_active = status === 'active';
      filteredStores = filteredStores.filter(store => store.is_active === is_active);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredStores = filteredStores.filter(store =>
        store.name.toLowerCase().includes(searchLower) ||
        store.code.toLowerCase().includes(searchLower) ||
        store.address.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const total = filteredStores.length;
    const paginatedStores = filteredStores.slice(offset, offset + parseInt(limit));
    const totalPages = Math.ceil(total / parseInt(limit));

    return c.json({
      success: true,
      data: paginatedStores,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Stores list error:', error);
    return c.json({
      success: false,
      message: 'Failed to fetch stores',
      error: 'STORES_LIST_ERROR'
    }, 500);
  }
});

// GET /api/stores/:id - Get store details
app.get('/:id', async (c: any) => {
  try {
    const id = c.req.param('id');
    const user = c.get('jwtPayload') as any;

    // Check store access for non-admin users
    if (user?.role !== 'admin' && user?.role !== 'manager' && user?.storeId !== parseInt(id)) {
      return c.json({
        success: false,
        message: 'Không có quyền truy cập cửa hàng này',
        error: 'STORE_ACCESS_DENIED'
      }, 403);
    }

    // Mock store data
    const mockStoreDetails = {
      id: id,
      name: id === '1' ? 'Cửa hàng Trung tâm' : id === '2' ? 'Chi nhánh Quận 7' : 'Cửa hàng Bình Thạnh',
      code: id === '1' ? 'CT-001' : id === '2' ? 'Q7-002' : 'BT-003',
      address: id === '1' ? '123 Nguyễn Huệ, Quận 1, TP.HCM' : id === '2' ? '456 Lotte Mart, Quận 7, TP.HCM' : '789 Xô Viết Nghệ Tĩnh, Bình Thạnh, TP.HCM',
      phone: id === '1' ? '028-3823-4567' : id === '2' ? '028-5432-1098' : '028-8765-4321',
      email: id === '1' ? 'central@smartpos.vn' : id === '2' ? 'q7@smartpos.vn' : 'binhthanh@smartpos.vn',
      manager_id: id === '1' ? '2' : id === '2' ? '3' : '4',
      manager_name: id === '1' ? 'Nguyễn Văn Quản Lý' : id === '2' ? 'Trần Thị Kim' : 'Lê Văn Minh',
      is_active: id !== '3',
      opening_hours: id === '1' ? '08:00-22:00' : id === '2' ? '09:00-21:30' : '08:30-21:00',
      timezone: 'Asia/Ho_Chi_Minh',
      currency: 'VND',
      tax_id: id === '1' ? '0123456789' : id === '2' ? '0123456790' : '0123456791',
      website: id === '1' ? 'https://central.smartpos.vn' : id === '2' ? 'https://q7.smartpos.vn' : 'https://binhthanh.smartpos.vn',
      logo_url: null,
      receipt_footer: 'Cảm ơn quý khách đã mua sắm!',
      settings: {
        pos: {
          auto_print_receipt: true,
          show_customer_display: true,
          require_customer_info: false,
          default_payment_method: 'CASH'
        },
        inventory: {
          low_stock_threshold: 10,
          auto_reorder: false,
          track_serial_numbers: true
        }
      },
      stats: {
        total_products: id === '1' ? 1250 : id === '2' ? 890 : 567,
        active_employees: id === '1' ? 12 : id === '2' ? 8 : 5,
        monthly_revenue: id === '1' ? 45600000 : id === '2' ? 32100000 : 18900000,
        monthly_transactions: id === '1' ? 2340 : id === '2' ? 1560 : 890
      },
      created_at: id === '1' ? '2025-01-01T00:00:00Z' : id === '2' ? '2025-02-15T00:00:00Z' : '2025-03-01T00:00:00Z',
      updated_at: new Date().toISOString()
    };

    return c.json({
      success: true,
      data: mockStoreDetails
    });
  } catch (error) {
    console.error('Store details error:', error);
    return c.json({
      success: false,
      message: 'Failed to fetch store details',
      error: 'STORE_DETAILS_ERROR'
    }, 500);
  }
});

// POST /api/stores - Create new store (admin only)
app.post('/', requireRole('admin'), async (c: any) => {
  try {
    const data = await c.req.json();
    const { name, code, address, phone, email, manager_id, opening_hours, timezone = 'Asia/Ho_Chi_Minh', currency = 'VND' } = data;

    if (!name || !code || !address) {
      return c.json({
        success: false,
        message: 'Tên cửa hàng, mã cửa hàng và địa chỉ là bắt buộc',
        error: 'REQUIRED_FIELDS_MISSING'
      }, 400);
    }

    const storeId = `store-${Date.now()}`;
    const newStore = {
      id: storeId,
      name,
      code,
      address,
      phone: phone || null,
      email: email || null,
      manager_id: manager_id || null,
      manager_name: manager_id ? 'Người quản lý mới' : null,
      is_active: true,
      opening_hours: opening_hours || '09:00-21:00',
      timezone,
      currency,
      tax_id: data.tax_id || null,
      website: data.website || null,
      logo_url: data.logo_url || null,
      receipt_footer: data.receipt_footer || 'Cảm ơn quý khách đã mua sắm!',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return c.json({
      success: true,
      data: newStore,
      message: 'Cửa hàng đã được tạo thành công'
    }, 201);
  } catch (error) {
    console.error('Create store error:', error);
    return c.json({
      success: false,
      message: 'Failed to create store',
      error: 'STORE_CREATE_ERROR'
    }, 500);
  }
});

// PUT /api/stores/:id - Update store (admin/manager only)
app.put('/:id', requireRole('manager'), async (c: any) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    const user = c.get('jwtPayload') as any;

    // Check store access for non-admin users
    if (user?.role !== 'admin' && user?.storeId !== parseInt(id)) {
      return c.json({
        success: false,
        message: 'Không có quyền chỉnh sửa cửa hàng này',
        error: 'STORE_UPDATE_DENIED'
      }, 403);
    }

    const updatedStore = {
      id: id,
      name: data.name || 'Updated Store',
      code: data.code || `UPD-${id}`,
      address: data.address || 'Updated Address',
      phone: data.phone || '028-1111-2222',
      email: data.email || 'updated@smartpos.vn',
      manager_id: data.manager_id || user?.id,
      manager_name: data.manager_name || user?.username,
      is_active: data.is_active !== undefined ? data.is_active : true,
      opening_hours: data.opening_hours || '09:00-21:00',
      timezone: data.timezone || 'Asia/Ho_Chi_Minh',
      currency: data.currency || 'VND',
      tax_id: data.tax_id || null,
      website: data.website || null,
      logo_url: data.logo_url || null,
      receipt_footer: data.receipt_footer || 'Cảm ơn quý khách đã mua sắm!',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: new Date().toISOString()
    };

    return c.json({
      success: true,
      data: updatedStore,
      message: 'Cửa hàng đã được cập nhật thành công'
    });
  } catch (error) {
    console.error('Update store error:', error);
    return c.json({
      success: false,
      message: 'Failed to update store',
      error: 'STORE_UPDATE_ERROR'
    }, 500);
  }
});

// DELETE /api/stores/:id - Deactivate store (admin only)
app.delete('/:id', requireRole('admin'), async (c: any) => {
  try {
    const id = c.req.param('id');

    if (id === '1') {
      return c.json({
        success: false,
        message: 'Không thể xóa cửa hàng chính',
        error: 'CANNOT_DELETE_MAIN_STORE'
      }, 400);
    }

    return c.json({
      success: true,
      data: { id, is_active: false },
      message: 'Cửa hàng đã được vô hiệu hóa'
    });
  } catch (error) {
    console.error('Delete store error:', error);
    return c.json({
      success: false,
      message: 'Failed to delete store',
      error: 'STORE_DELETE_ERROR'
    }, 500);
  }
});

// GET /api/stores/:id/stats - Get store statistics
app.get('/:id/stats', storeAccess, async (c: any) => {
  try {
    const id = c.req.param('id');
    const { period = 'month' } = c.req.query(); // day, week, month, year

    const mockStats = {
      store_id: id,
      period,
      period_start: period === 'day' ? new Date().toISOString().split('T')[0] :
                   period === 'week' ? new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0] :
                   period === 'month' ? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0] :
                   new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      period_end: new Date().toISOString().split('T')[0],
      revenue: {
        total: id === '1' ? 45600000 : id === '2' ? 32100000 : 18900000,
        cash: id === '1' ? 27360000 : id === '2' ? 19260000 : 11340000,
        card: id === '1' ? 18240000 : id === '2' ? 12840000 : 7560000,
        growth_rate: id === '1' ? 12.5 : id === '2' ? 8.3 : -2.1
      },
      transactions: {
        total: id === '1' ? 2340 : id === '2' ? 1560 : 890,
        average_value: id === '1' ? 19487 : id === '2' ? 20577 : 21236,
        peak_hour: id === '1' ? '19:00-20:00' : id === '2' ? '18:00-19:00' : '17:00-18:00'
      },
      inventory: {
        total_products: id === '1' ? 1250 : id === '2' ? 890 : 567,
        low_stock_items: id === '1' ? 23 : id === '2' ? 15 : 8,
        out_of_stock: id === '1' ? 5 : id === '2' ? 3 : 2
      },
      employees: {
        active: id === '1' ? 12 : id === '2' ? 8 : 5,
        on_shift: id === '1' ? 8 : id === '2' ? 5 : 3,
        performance_score: id === '1' ? 92.5 : id === '2' ? 88.3 : 85.7
      },
      top_products: [
        { id: '1', name: 'iPhone 15 Pro', sold: id === '1' ? 45 : id === '2' ? 32 : 18, revenue: id === '1' ? 1215000 : id === '2' ? 864000 : 486000 },
        { id: '2', name: 'Samsung Galaxy S24', sold: id === '1' ? 38 : id === '2' ? 25 : 14, revenue: id === '1' ? 798000 : id === '2' ? 525000 : 294000 },
        { id: '3', name: 'iPad Air', sold: id === '1' ? 29 : id === '2' ? 19 : 11, revenue: id === '1' ? 493000 : id === '2' ? 323000 : 187000 }
      ]
    };

    return c.json({
      success: true,
      data: mockStats
    });
  } catch (error) {
    console.error('Store stats error:', error);
    return c.json({
      success: false,
      message: 'Failed to fetch store statistics',
      error: 'STORE_STATS_ERROR'
    }, 500);
  }
});

// GET /api/stores/:id/employees - Get store employees
app.get('/:id/employees', requireRole('manager'), storeAccess, async (c: any) => {
  try {
    const id = c.req.param('id');
    const { page = '1', limit = '20', role, status } = c.req.query();

    const mockEmployees = [
      {
        id: '2',
        username: 'manager01',
        full_name: 'Nguyễn Văn Quản Lý',
        email: 'manager@smartpos.vn',
        role: 'manager',
        store_id: parseInt(id),
        store_name: id === '1' ? 'Cửa hàng Trung tâm' : id === '2' ? 'Chi nhánh Quận 7' : 'Cửa hàng Bình Thạnh',
        phone: '0901111111',
        is_active: true,
        hired_date: '2025-01-15',
        last_login: new Date().toISOString()
      },
      {
        id: `${id}03`,
        username: `cashier${id}01`,
        full_name: id === '1' ? 'Trần Thị Thu Ngân' : id === '2' ? 'Lê Văn Bán Hàng' : 'Phạm Thị Cashier',
        email: `cashier${id}@smartpos.vn`,
        role: 'cashier',
        store_id: parseInt(id),
        store_name: id === '1' ? 'Cửa hàng Trung tâm' : id === '2' ? 'Chi nhánh Quận 7' : 'Cửa hàng Bình Thạnh',
        phone: `090222222${id}`,
        is_active: true,
        hired_date: '2025-02-01',
        last_login: new Date(Date.now() - 2*60*60*1000).toISOString()
      },
      {
        id: `${id}04`,
        username: `inventory${id}01`,
        full_name: id === '1' ? 'Hoàng Văn Kho' : id === '2' ? 'Đỗ Thị Inventory' : 'Bùi Văn Stock',
        email: `inventory${id}@smartpos.vn`,
        role: 'inventory',
        store_id: parseInt(id),
        store_name: id === '1' ? 'Cửa hàng Trung tâm' : id === '2' ? 'Chi nhánh Quận 7' : 'Cửa hàng Bình Thạnh',
        phone: `090333333${id}`,
        is_active: true,
        hired_date: '2025-02-15',
        last_login: new Date(Date.now() - 4*60*60*1000).toISOString()
      }
    ];

    // Apply filters
    let filteredEmployees = [...mockEmployees];
    if (role) {
      filteredEmployees = filteredEmployees.filter(emp => emp.role === role);
    }
    if (status) {
      const is_active = status === 'active';
      filteredEmployees = filteredEmployees.filter(emp => emp.is_active === is_active);
    }

    const total = filteredEmployees.length;
    const totalPages = Math.ceil(total / parseInt(limit));

    return c.json({
      success: true,
      data: filteredEmployees,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Store employees error:', error);
    return c.json({
      success: false,
      message: 'Failed to fetch store employees',
      error: 'STORE_EMPLOYEES_ERROR'
    }, 500);
  }
});

// GET /api/stores/:id/products - Get store inventory
app.get('/:id/products', storeAccess, async (c: any) => {
  try {
    const id = c.req.param('id');
    const { page = '1', limit = '50', category, low_stock, search } = c.req.query();

    const mockProducts = [
      {
        id: '1',
        name: 'iPhone 15 Pro',
        code: 'IP15P-001',
        category: 'Điện thoại',
        price: 27000000,
        stock: id === '1' ? 25 : id === '2' ? 18 : 8,
        reorder_point: 10,
        supplier: 'Apple Việt Nam',
        last_restocked: '2025-09-10',
        location: `Kệ A${id}-01`
      },
      {
        id: '2',
        name: 'Samsung Galaxy S24',
        code: 'SS24-001',
        category: 'Điện thoại',
        price: 21000000,
        stock: id === '1' ? 32 : id === '2' ? 23 : 12,
        reorder_point: 15,
        supplier: 'Samsung Việt Nam',
        last_restocked: '2025-09-08',
        location: `Kệ A${id}-02`
      },
      {
        id: '3',
        name: 'AirPods Pro 2',
        code: 'APP2-001',
        category: 'Phụ kiện',
        price: 5900000,
        stock: id === '1' ? 8 : id === '2' ? 5 : 2,
        reorder_point: 12,
        supplier: 'Apple Việt Nam',
        last_restocked: '2025-09-05',
        location: `Kệ B${id}-01`
      }
    ];

    // Apply filters
    let filteredProducts = [...mockProducts];
    if (category) {
      filteredProducts = filteredProducts.filter(p => p.category === category);
    }
    if (low_stock === 'true') {
      filteredProducts = filteredProducts.filter(p => p.stock <= p.reorder_point);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      filteredProducts = filteredProducts.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.code.toLowerCase().includes(searchLower)
      );
    }

    const total = filteredProducts.length;
    const totalPages = Math.ceil(total / parseInt(limit));

    return c.json({
      success: true,
      data: filteredProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Store products error:', error);
    return c.json({
      success: false,
      message: 'Failed to fetch store products',
      error: 'STORE_PRODUCTS_ERROR'
    }, 500);
  }
});

// POST /api/stores/:id/transfer - Transfer product between stores (admin/manager only)
app.post('/:id/transfer', requireRole('manager'), async (c: any) => {
  try {
    const fromStoreId = c.req.param('id');
    const { to_store_id, product_id, quantity, reason } = await c.req.json();

    if (!to_store_id || !product_id || !quantity) {
      return c.json({
        success: false,
        message: 'Thiếu thông tin chuyển kho: cửa hàng đích, sản phẩm, số lượng',
        error: 'MISSING_TRANSFER_DATA'
      }, 400);
    }

    const transferId = `transfer-${Date.now()}`;
    const transferRecord = {
      id: transferId,
      from_store_id: fromStoreId,
      to_store_id,
      product_id,
      quantity: parseInt(quantity),
      reason: reason || 'Chuyển kho theo yêu cầu',
      status: 'completed',
      transferred_by: c.get('jwtPayload')?.id || 'admin',
      transferred_at: new Date().toISOString()
    };

    return c.json({
      success: true,
      data: transferRecord,
      message: 'Chuyển kho thành công'
    }, 201);
  } catch (error) {
    console.error('Store transfer error:', error);
    return c.json({
      success: false,
      message: 'Failed to transfer product',
      error: 'STORE_TRANSFER_ERROR'
    }, 500);
  }
});

export default app;