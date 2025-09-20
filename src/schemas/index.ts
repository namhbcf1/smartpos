import { z } from 'zod';
import { PaymentMethod, PaymentStatus, SaleStatus, UserRole, CustomerGroup } from '../types';

// Auth schemas
export const loginSchema = z.object({
  username: z.string().min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự').optional(),
  email: z.string().min(3, 'Email phải có ít nhất 3 ký tự').optional(),
  password: z.string().min(4, 'Mật khẩu phải có ít nhất 4 ký tự'),
}).refine(data => data.username || data.email, {
  message: 'Phải cung cấp tên đăng nhập hoặc email',
  path: ['username'],
});

// User schemas
export const userCreateSchema = z.object({
  username: z.string().min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  full_name: z.string().min(2, 'Họ và tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ').nullable().optional(),
  phone: z.string().nullable().optional(),
  role: z.enum(['admin', 'manager', 'cashier', 'inventory', 'sales_agent', 'affiliate'] as const),
  store_id: z.number().int().positive('ID cửa hàng phải là số dương'),
  avatar_url: z.string().nullable().optional(),
});

export const userUpdateSchema = z.object({
  full_name: z.string().min(2, 'Họ và tên phải có ít nhất 2 ký tự').optional(),
  email: z.string().email('Email không hợp lệ').nullable().optional(),
  phone: z.string().nullable().optional(),
  role: z.enum(['admin', 'manager', 'cashier', 'inventory'] as const).optional(),
  store_id: z.number().int().positive('ID cửa hàng phải là số dương').optional(),
  avatar_url: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

export const passwordUpdateSchema = z.object({
  current_password: z.string().min(6, 'Mật khẩu hiện tại phải có ít nhất 6 ký tự'),
  new_password: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
  confirm_password: z.string().min(6, 'Mật khẩu xác nhận phải có ít nhất 6 ký tự'),
}).refine(data => data.new_password === data.confirm_password, {
  message: 'Mật khẩu xác nhận không khớp với mật khẩu mới',
  path: ['confirm_password'],
});

// Product schemas
export const productCreateSchema = z.object({
  name: z.string().min(2, 'Tên sản phẩm phải có ít nhất 2 ký tự'),
  description: z.string().nullable().optional(),
  sku: z.string().min(2, 'Mã SKU phải có ít nhất 2 ký tự'),
  barcode: z.string().nullable().optional(),
  category_id: z.number().int().positive('ID danh mục phải là số dương'),
  price: z.number().nonnegative('Giá bán phải là số không âm'),
  cost_price: z.number().nonnegative('Giá nhập phải là số không âm'),
  tax_rate: z.number().min(0, 'Thuế suất phải lớn hơn hoặc bằng 0').max(1, 'Thuế suất phải nhỏ hơn hoặc bằng 1'),
  stock: z.number().int().nonnegative('Số lượng tồn kho phải là số không âm'),
  min_stock: z.number().int().nonnegative('Ngưỡng cảnh báo tồn kho phải là số không âm'),
  is_active: z.boolean().optional(),
  image_url: z.string().nullable().optional(),
});

export const productUpdateSchema = z.object({
  name: z.string().min(2, 'Tên sản phẩm phải có ít nhất 2 ký tự').optional(),
  description: z.string().nullable().optional(),
  sku: z.string().min(2, 'Mã SKU phải có ít nhất 2 ký tự').optional(),
  barcode: z.string().nullable().optional(),
  category_id: z.number().int().positive('ID danh mục phải là số dương').optional(),
  price: z.number().nonnegative('Giá bán phải là số không âm').optional(),
  cost_price: z.number().nonnegative('Giá nhập phải là số không âm').optional(),
  tax_rate: z.number().min(0, 'Thuế suất phải lớn hơn hoặc bằng 0').max(1, 'Thuế suất phải nhỏ hơn hoặc bằng 1').optional(),
  stock: z.number().int().nonnegative('Số lượng tồn kho phải là số không âm').optional(),
  min_stock: z.number().int().nonnegative('Ngưỡng cảnh báo tồn kho phải là số không âm').optional(),
  is_active: z.boolean().optional(),
  image_url: z.string().nullable().optional(),
});

// Category schemas
export const categoryCreateSchema = z.object({
  name: z.string().min(2, 'Tên danh mục phải có ít nhất 2 ký tự'),
  description: z.string().nullable().optional(),
  parent_id: z.number().int().positive('ID danh mục cha phải là số dương').nullable().optional(),
  is_active: z.boolean().optional(),
});

export const categoryUpdateSchema = z.object({
  name: z.string().min(2, 'Tên danh mục phải có ít nhất 2 ký tự').optional(),
  description: z.string().nullable().optional(),
  parent_id: z.number().int().positive('ID danh mục cha phải là số dương').nullable().optional(),
  is_active: z.boolean().optional(),
});

// Customer schemas
export const customerCreateSchema = z.object({
  full_name: z.string().min(2, 'Tên khách hàng phải có ít nhất 2 ký tự'),
  phone: z.string().nullable().optional(),
  email: z.string().email('Email không hợp lệ').nullable().optional(),
  address: z.string().nullable().optional(),
  birthday: z.string().nullable().optional(),
  customer_group: z.enum(['regular', 'vip', 'wholesale', 'business'] as const).optional(),
  notes: z.string().nullable().optional(),
  loyalty_points: z.number().int().nonnegative('Điểm tích lũy phải là số không âm').optional(),
});

export const customerUpdateSchema = z.object({
  full_name: z.string().min(2, 'Tên khách hàng phải có ít nhất 2 ký tự').optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email('Email không hợp lệ').nullable().optional(),
  address: z.string().nullable().optional(),
  birthday: z.string().nullable().optional(),
  customer_group: z.enum(['regular', 'vip', 'wholesale', 'business'] as const).optional(),
  notes: z.string().nullable().optional(),
  loyalty_points: z.number().int().nonnegative('Điểm tích lũy phải là số không âm').optional(),
});

// Sale schemas
export const saleItemSchema = z.object({
  product_id: z.number().int().positive('ID sản phẩm phải là số dương'),
  quantity: z.number().int().positive('Số lượng phải là số dương'),
  unit_price: z.number().nonnegative('Giá đơn vị phải là số không âm'),
  discount_amount: z.number().nonnegative('Số tiền giảm giá phải là số không âm').optional(),
});

export const saleCreateSchema = z.object({
  store_id: z.number().int().positive('ID cửa hàng phải là số dương'),
  customer_id: z.number().int().positive('ID khách hàng phải là số dương').nullable().optional(),
  payment_method: z.enum(['cash', 'card', 'bank_transfer', 'mobile_payment', 'credit'] as const),
  payment_status: z.enum(['paid', 'unpaid', 'partial'] as const).optional(),
  notes: z.string().nullable().optional(),
  items: z.array(saleItemSchema).min(1, 'Đơn hàng phải có ít nhất 1 sản phẩm'),
});

export const saleUpdateSchema = z.object({
  payment_method: z.enum(['cash', 'card', 'bank_transfer', 'mobile_payment', 'credit'] as const).optional(),
  payment_status: z.enum(['paid', 'unpaid', 'partial'] as const).optional(),
  sale_status: z.enum(['completed', 'returned', 'cancelled'] as const).optional(),
  notes: z.string().nullable().optional(),
});

// Store schemas
export const storeCreateSchema = z.object({
  name: z.string().min(2, 'Tên cửa hàng phải có ít nhất 2 ký tự'),
  address: z.string().min(5, 'Địa chỉ phải có ít nhất 5 ký tự'),
  phone: z.string().nullable().optional(),
  email: z.string().email('Email không hợp lệ').nullable().optional(),
  tax_number: z.string().nullable().optional(),
  is_main: z.boolean().optional(),
});

export const storeUpdateSchema = z.object({
  name: z.string().min(2, 'Tên cửa hàng phải có ít nhất 2 ký tự').optional(),
  address: z.string().min(5, 'Địa chỉ phải có ít nhất 5 ký tự').optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email('Email không hợp lệ').nullable().optional(),
  tax_number: z.string().nullable().optional(),
  is_main: z.boolean().optional(),
});

// Supplier schemas
export const supplierCreateSchema = z.object({
  name: z.string().min(2, 'Tên nhà cung cấp phải có ít nhất 2 ký tự'),
  contact_person: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email('Email không hợp lệ').nullable().optional(),
  address: z.string().nullable().optional(),
  tax_number: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

export const supplierUpdateSchema = z.object({
  name: z.string().min(2, 'Tên nhà cung cấp phải có ít nhất 2 ký tự').optional(),
  contact_person: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email('Email không hợp lệ').nullable().optional(),
  address: z.string().nullable().optional(),
  tax_number: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

// Inventory schemas
export const stockInItemSchema = z.object({
  product_id: z.number().int().positive('ID sản phẩm phải là số dương'),
  quantity: z.number().int().positive('Số lượng phải là số dương'),
  cost_price: z.number().nonnegative('Giá nhập phải là số không âm'),
  expiry_date: z.string().nullable().optional(),
});

export const stockInCreateSchema = z.object({
  supplier_id: z.number().int().positive('ID nhà cung cấp phải là số dương'),
  store_id: z.number().int().positive('ID cửa hàng phải là số dương'),
  reference_number: z.string().optional(),
  payment_status: z.enum(['paid', 'unpaid', 'partial'] as const).optional(),
  payment_amount: z.number().nonnegative('Số tiền thanh toán phải là số không âm').optional(),
  payment_method: z.enum(['cash', 'card', 'bank_transfer', 'mobile_payment', 'credit'] as const).optional(),
  notes: z.string().nullable().optional(),
  items: z.array(stockInItemSchema).min(1, 'Phiếu nhập kho phải có ít nhất 1 sản phẩm'),
});

// Financial schemas
export const financialTransactionCreateSchema = z.object({
  date: z.string(),
  transaction_type: z.enum(['income', 'expense'] as const),
  category: z.string().min(2, 'Tên danh mục phải có ít nhất 2 ký tự'),
  amount: z.number().positive('Số tiền phải là số dương'),
  payment_method: z.enum(['cash', 'card', 'bank_transfer', 'mobile_payment', 'credit'] as const),
  reference_number: z.string().nullable().optional(),
  reference_id: z.number().int().positive('ID tham chiếu phải là số dương').nullable().optional(),
  reference_type: z.enum(['sale', 'purchase', 'expense', 'other'] as const).nullable().optional(),
  notes: z.string().nullable().optional(),
});

// Settings schemas
export const settingUpdateSchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]));

// Query param schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
});

export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
});

export const dateFilterSchema = z.object({
  from_date: z.string().optional(),
  to_date: z.string().optional(),
});

export const searchSchema = z.object({
  search: z.string().optional(),
});

export const statusFilterSchema = z.object({
  status: z.string().optional(),
  is_active: z.coerce.boolean().optional(),
});

export const productFilterSchema = z.object({
  category_id: z.coerce.number().int().positive().optional(),
  low_stock: z.coerce.boolean().optional(),
});

export const saleFilterSchema = z.object({
  payment_method: z.enum(['cash', 'card', 'bank_transfer', 'mobile_payment', 'credit'] as const).optional(),
  payment_status: z.enum(['paid', 'unpaid', 'partial'] as const).optional(),
  sale_status: z.enum(['completed', 'returned', 'cancelled'] as const).optional(),
  customer_id: z.coerce.number().int().positive().optional(),
  store_id: z.coerce.number().int().positive().optional(),
  user_id: z.coerce.number().int().positive().optional(),
});

// Cache buster schema
export const cacheBusterSchema = z.object({
  _t: z.string().optional(), // Cache buster timestamp
});

// Combined query param schemas
export const baseQuerySchema = paginationSchema.merge(sortSchema).merge(searchSchema).merge(cacheBusterSchema);
export const productQuerySchema = baseQuerySchema.merge(statusFilterSchema).merge(productFilterSchema).merge(dateFilterSchema);
export const saleQuerySchema = baseQuerySchema.merge(saleFilterSchema).merge(dateFilterSchema);
export const customerQuerySchema = baseQuerySchema.merge(statusFilterSchema);
export const userQuerySchema = baseQuerySchema.merge(statusFilterSchema);
export const categoryQuerySchema = baseQuerySchema.merge(statusFilterSchema);
export const supplierQuerySchema = baseQuerySchema.merge(statusFilterSchema);
export const financialTransactionQuerySchema = baseQuerySchema.merge(dateFilterSchema);