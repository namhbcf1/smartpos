import { useAuth } from './useAuth';

// Permission checking hook
export const usePermissions = () => {
  const { user } = useAuth();

  // Check if user has specific permission
  const hasPermission = (permission: string): boolean => {
    if (!user?.role) return false;
    
    // Admin has all permissions
    if (user.role === 'admin') return true;
    
    // Define role-based permissions
    const rolePermissions: Record<string, string[]> = {
      admin: ['*'], // All permissions
      manager: [
        'products.view', 'products.create', 'products.update', 'products.delete',
        'sales.view', 'sales.create', 'sales.update', 'sales.delete',
        'customers.view', 'customers.create', 'customers.update', 'customers.delete',
        'returns.view', 'returns.create', 'returns.update',
        'warranty.view', 'warranty.create', 'warranty.update',
        'reports.view', 'reports.export'
      ],
      cashier: [
        'products.view', 'products.update', // Thu ngân có thể sửa đổi sản phẩm
        'sales.view', 'sales.create', 'sales.update',
        'customers.view', 'customers.create', 'customers.update',
        'returns.view', 'returns.create'
      ],
      sales_agent: [
        'products.view', // Chỉ xem sản phẩm, không sửa đổi
        'sales.view', 'sales.create', 'sales.update',
        'customers.view', 'customers.create', 'customers.update',
        'returns.view', 'returns.create',
        'warranty.view', 'warranty.create', 'warranty.update'
      ],
      affiliate: [
        'products.view', // Chỉ xem sản phẩm, không sửa đổi
        'sales.view', 'sales.create', 'sales.update',
        'customers.view', 'customers.create', 'customers.update',
        'returns.view', 'returns.create',
        'warranty.view', 'warranty.create', 'warranty.update'
      ],
      inventory: [
        'products.view', 'products.create', 'products.update', 'products.delete',
        'categories.view', 'categories.create', 'categories.update',
        'inventory.view', 'inventory.create', 'inventory.update'
      ]
    };

    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  };

  // Check if user can edit products
  const canEditProducts = (): boolean => {
    return hasPermission('products.update');
  };

  // Check if user can create products
  const canCreateProducts = (): boolean => {
    return hasPermission('products.create');
  };

  // Check if user can delete products
  const canDeleteProducts = (): boolean => {
    return hasPermission('products.delete');
  };

  // Check if user can access sales
  const canAccessSales = (): boolean => {
    return hasPermission('sales.view');
  };

  // Check if user can create sales
  const canCreateSales = (): boolean => {
    return hasPermission('sales.create');
  };

  // Check if user can access returns
  const canAccessReturns = (): boolean => {
    return hasPermission('returns.view');
  };

  // Check if user can access warranty
  const canAccessWarranty = (): boolean => {
    return hasPermission('warranty.view');
  };

  // Check if user can access customers
  const canAccessCustomers = (): boolean => {
    return hasPermission('customers.view');
  };

  // Check if user can edit customers
  const canEditCustomers = (): boolean => {
    return hasPermission('customers.update');
  };

  // Check if user can access reports
  const canAccessReports = (): boolean => {
    return hasPermission('reports.view');
  };

  // Check if user can access admin features
  const canAccessAdmin = (): boolean => {
    return user?.role === 'admin' || user?.role === 'manager';
  };

  // Check if user is read-only for products
  const isProductsReadOnly = (): boolean => {
    return user?.role === 'sales_agent' || user?.role === 'affiliate';
  };

  return {
    hasPermission,
    canEditProducts,
    canCreateProducts,
    canDeleteProducts,
    canAccessSales,
    canCreateSales,
    canAccessReturns,
    canAccessWarranty,
    canAccessCustomers,
    canEditCustomers,
    canAccessReports,
    canAccessAdmin,
    isProductsReadOnly,
    userRole: user?.role
  };
};
