import { Hono } from 'hono';
import { Env } from '../../types';
import { authenticate, requireRole } from '../../middleware/auth';

const app = new Hono<{ Bindings: Env }>();

// Apply authentication to all protected routes
app.use('*', authenticate);

// Mock suppliers data
const mockSuppliers = [
  {
    id: '1',
    code: 'SUP-001',
    name: 'Công ty TNHH Apple Việt Nam',
    contact_person: 'Nguyễn Văn Apple',
    phone: '028-3912-3456',
    email: 'contact@apple.vn',
    address: '123 Lê Duẩn, Quận 1, TP.HCM',
    tax_number: '0123456789',
    payment_terms: 'Net 30',
    credit_limit: 5000000000,
    website: 'https://apple.com/vn',
    is_active: true,
    created_at: '2025-01-15T00:00:00Z',
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    code: 'SUP-002',
    name: 'Samsung Electronics Việt Nam',
    contact_person: 'Trần Thị Samsung',
    phone: '028-3987-6543',
    email: 'info@samsung.vn',
    address: '456 Nguyễn Huệ, Quận 1, TP.HCM',
    tax_number: '0987654321',
    payment_terms: 'Net 15',
    credit_limit: 3000000000,
    website: 'https://samsung.com/vn',
    is_active: true,
    created_at: '2025-01-20T00:00:00Z',
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    code: 'SUP-003',
    name: 'Xiaomi Technology Việt Nam',
    contact_person: 'Lê Văn Xiaomi',
    phone: '028-3456-7890',
    email: 'support@xiaomi.vn',
    address: '789 Pasteur, Quận 3, TP.HCM',
    tax_number: '0456789123',
    payment_terms: 'Net 45',
    credit_limit: 2000000000,
    website: 'https://mi.com/vn',
    is_active: true,
    created_at: '2025-02-01T00:00:00Z',
    updated_at: new Date().toISOString()
  },
  {
    id: '4',
    code: 'SUP-004',
    name: 'Oppo Mobile Việt Nam',
    contact_person: 'Phạm Thị Oppo',
    phone: '028-3321-4567',
    email: 'business@oppo.vn',
    address: '321 Hai Bà Trưng, Quận 1, TP.HCM',
    tax_number: '0789123456',
    payment_terms: 'Net 30',
    credit_limit: 1500000000,
    website: 'https://oppo.com/vn',
    is_active: false,
    created_at: '2025-02-10T00:00:00Z',
    updated_at: new Date().toISOString()
  },
  {
    id: '5',
    code: 'SUP-005',
    name: 'Vivo Communication Technology',
    contact_person: 'Hoàng Văn Vivo',
    phone: '028-3654-9876',
    email: 'contact@vivo.vn',
    address: '654 Võ Văn Tần, Quận 3, TP.HCM',
    tax_number: '0321654987',
    payment_terms: 'Net 30',
    credit_limit: 1200000000,
    website: 'https://vivo.com/vn',
    is_active: true,
    created_at: '2025-02-20T00:00:00Z',
    updated_at: new Date().toISOString()
  }
];

// GET /api/suppliers/stats - Supplier statistics (must be before /:id route)
app.get('/stats', requireRole('manager'), async (c: any) => {
  try {
    const activeSuppliers = mockSuppliers.filter(s => s.is_active);
    const inactiveSuppliers = mockSuppliers.filter(s => !s.is_active);

    const totalCreditLimit = mockSuppliers.reduce((sum, supplier) => sum + supplier.credit_limit, 0);
    const avgCreditLimit = totalCreditLimit / mockSuppliers.length;

    // Top suppliers by credit limit
    const topSuppliers = [...mockSuppliers]
      .sort((a, b) => b.credit_limit - a.credit_limit)
      .slice(0, 5)
      .map(supplier => ({
        id: supplier.id,
        name: supplier.name,
        credit_limit: supplier.credit_limit,
        payment_terms: supplier.payment_terms
      }));

    const stats = {
      total_suppliers: mockSuppliers.length,
      active_suppliers: activeSuppliers.length,
      inactive_suppliers: inactiveSuppliers.length,
      total_credit_limit: totalCreditLimit,
      average_credit_limit: Math.round(avgCreditLimit),
      suppliers_by_payment_terms: {
        'Net 15': mockSuppliers.filter(s => s.payment_terms === 'Net 15').length,
        'Net 30': mockSuppliers.filter(s => s.payment_terms === 'Net 30').length,
        'Net 45': mockSuppliers.filter(s => s.payment_terms === 'Net 45').length
      },
      top_suppliers: topSuppliers,
      recent_additions: mockSuppliers
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3)
        .map(supplier => ({
          id: supplier.id,
          name: supplier.name,
          created_at: supplier.created_at
        }))
    };

    return c.json({
      success: true,
      data: stats,
      message: 'Supplier statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Supplier stats error:', error);
    return c.json({
      success: false,
      message: 'Failed to fetch supplier statistics',
      error: 'SUPPLIER_STATS_ERROR'
    }, 500);
  }
});

// GET /api/suppliers - List suppliers with search and filters
app.get('/', requireRole('manager'), async (c: any) => {
  try {
    const { q, page = '1', limit = '50', status } = c.req.query();
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let filteredSuppliers = [...mockSuppliers];

    // Apply search filter
    if (q) {
      const searchTerm = q.toLowerCase();
      filteredSuppliers = filteredSuppliers.filter(supplier =>
        supplier.name.toLowerCase().includes(searchTerm) ||
        supplier.contact_person.toLowerCase().includes(searchTerm) ||
        supplier.email.toLowerCase().includes(searchTerm) ||
        supplier.phone.includes(searchTerm)
      );
    }

    // Apply status filter
    if (status && status !== 'all') {
      const is_active = status === 'active';
      filteredSuppliers = filteredSuppliers.filter(supplier => supplier.is_active === is_active);
    }

    // Apply pagination
    const total = filteredSuppliers.length;
    const paginatedSuppliers = filteredSuppliers.slice(offset, offset + parseInt(limit));
    const totalPages = Math.ceil(total / parseInt(limit));

    return c.json({
      success: true,
      data: paginatedSuppliers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      },
      message: 'Suppliers retrieved successfully'
    });
  } catch (error) {
    console.error('Suppliers list error:', error);
    return c.json({
      success: false,
      message: 'Failed to fetch suppliers',
      error: 'SUPPLIERS_LIST_ERROR'
    }, 500);
  }
});

// GET /api/suppliers/:id - Get supplier details
app.get('/:id', requireRole('manager'), async (c: any) => {
  try {
    const id = c.req.param('id');
    const supplier = mockSuppliers.find(s => s.id === id);

    if (!supplier) {
      return c.json({
        success: false,
        message: 'Supplier not found',
        error: 'SUPPLIER_NOT_FOUND'
      }, 404);
    }

    return c.json({
      success: true,
      data: supplier,
      message: 'Supplier details retrieved successfully'
    });
  } catch (error) {
    console.error('Supplier details error:', error);
    return c.json({
      success: false,
      message: 'Failed to fetch supplier details',
      error: 'SUPPLIER_DETAILS_ERROR'
    }, 500);
  }
});

// POST /api/suppliers - Create new supplier (admin only)
app.post('/', requireRole('admin'), async (c: any) => {
  try {
    const data = await c.req.json();
    const { name, contact_person, phone, email, address, tax_number, payment_terms, credit_limit } = data;

    if (!name || !contact_person || !phone || !email) {
      return c.json({
        success: false,
        message: 'Required fields: name, contact_person, phone, email',
        error: 'REQUIRED_FIELDS_MISSING'
      }, 400);
    }

    const newId = String(mockSuppliers.length + 1);
    const newSupplier = {
      id: newId,
      code: `SUP-${String(mockSuppliers.length + 1).padStart(3, '0')}`,
      name,
      contact_person,
      phone,
      email,
      address: address || '',
      tax_number: tax_number || '',
      payment_terms: payment_terms || 'Net 30',
      credit_limit: credit_limit || 1000000000,
      website: data.website || '',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return c.json({
      success: true,
      data: newSupplier,
      message: 'Supplier created successfully'
    }, 201);
  } catch (error) {
    console.error('Create supplier error:', error);
    return c.json({
      success: false,
      message: 'Failed to create supplier',
      error: 'SUPPLIER_CREATE_ERROR'
    }, 500);
  }
});

// PUT /api/suppliers/:id - Update supplier (admin only)
app.put('/:id', requireRole('admin'), async (c: any) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    const supplierIndex = mockSuppliers.findIndex(s => s.id === id);

    if (supplierIndex === -1) {
      return c.json({
        success: false,
        message: 'Supplier not found',
        error: 'SUPPLIER_NOT_FOUND'
      }, 404);
    }

    const existingSupplier = mockSuppliers[supplierIndex];
    const updatedSupplier = {
      ...existingSupplier,
      ...data,
      id, // Ensure ID doesn't change
      updated_at: new Date().toISOString()
    };

    return c.json({
      success: true,
      data: updatedSupplier,
      message: 'Supplier updated successfully'
    });
  } catch (error) {
    console.error('Update supplier error:', error);
    return c.json({
      success: false,
      message: 'Failed to update supplier',
      error: 'SUPPLIER_UPDATE_ERROR'
    }, 500);
  }
});

// DELETE /api/suppliers/:id - Delete supplier (admin only)
app.delete('/:id', requireRole('admin'), async (c: any) => {
  try {
    const id = c.req.param('id');
    const supplierIndex = mockSuppliers.findIndex(s => s.id === id);

    if (supplierIndex === -1) {
      return c.json({
        success: false,
        message: 'Supplier not found',
        error: 'SUPPLIER_NOT_FOUND'
      }, 404);
    }

    // Deactivate instead of deleting
    const deactivatedSupplier = {
      ...mockSuppliers[supplierIndex],
      is_active: false,
      updated_at: new Date().toISOString()
    };

    return c.json({
      success: true,
      data: deactivatedSupplier,
      message: 'Supplier deactivated successfully'
    });
  } catch (error) {
    console.error('Delete supplier error:', error);
    return c.json({
      success: false,
      message: 'Failed to delete supplier',
      error: 'SUPPLIER_DELETE_ERROR'
    }, 500);
  }
});


export default app;
