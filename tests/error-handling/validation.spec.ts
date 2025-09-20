import { describe, test, expect } from '@jest/globals';

describe('Data Validation Error Handling', () => {
  
  test('should validate product data comprehensively', () => {
    const testCases = [
      {
        name: 'Empty product name',
        data: { name: '', price: 100000, sku: 'TEST-001' },
        expectedErrors: ['Name is required']
      },
      {
        name: 'Negative price',
        data: { name: 'Test Product', price: -100, sku: 'TEST-002' },
        expectedErrors: ['Price must be positive']
      },
      {
        name: 'Invalid SKU format',
        data: { name: 'Test Product', price: 100000, sku: '123' },
        expectedErrors: ['SKU must be at least 4 characters']
      },
      {
        name: 'Multiple validation errors',
        data: { name: '', price: -50, sku: '' },
        expectedErrors: ['Name is required', 'Price must be positive', 'SKU is required']
      }
    ];

    testCases.forEach(({ name, data, expectedErrors }) => {
      const validation = validateProduct(data);
      
      expect(validation.isValid).toBe(false);
      expectedErrors.forEach(error => {
        expect(validation.errors).toContain(error);
      });
    });
  });

  test('should validate customer data', () => {
    const invalidCustomer = {
      name: '',
      email: 'invalid-email',
      phone: '123', // Too short
      loyalty_points: -100 // Negative points
    };
    
    const validation = validateCustomer(invalidCustomer);
    
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('Name is required');
    expect(validation.errors).toContain('Invalid email format');
    expect(validation.errors).toContain('Phone number must be at least 10 digits');
    expect(validation.errors).toContain('Loyalty points cannot be negative');
  });

  test('should sanitize malicious input', () => {
    const maliciousInputs = [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      '<img src="x" onerror="alert(1)">',
      '"><script>alert("xss")</script>',
      '<svg onload="alert(1)">',
      'eval("malicious code")'
    ];

    maliciousInputs.forEach(input => {
      const sanitized = sanitizeInput(input);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('onload');
      expect(sanitized).not.toContain('eval(');
    });
  });

  test('should validate file upload types', () => {
    const validFiles = [
      { name: 'products.csv', type: 'text/csv' },
      { name: 'inventory.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      { name: 'image.jpg', type: 'image/jpeg' },
      { name: 'document.pdf', type: 'application/pdf' }
    ];

    const invalidFiles = [
      { name: 'script.exe', type: 'application/x-msdownload' },
      { name: 'malware.bat', type: 'application/x-bat' },
      { name: 'suspicious.zip', type: 'application/zip' },
      { name: 'unknown.xyz', type: 'application/octet-stream' }
    ];

    validFiles.forEach(file => {
      const validation = validateFileUpload(file);
      expect(validation.isValid).toBe(true);
    });

    invalidFiles.forEach(file => {
      const validation = validateFileUpload(file);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('File type not allowed');
    });
  });

  test('should validate file size limits', () => {
    const oversizedFile = {
      name: 'large-file.csv',
      type: 'text/csv',
      size: 10 * 1024 * 1024 // 10MB
    };

    const validFile = {
      name: 'small-file.csv',
      type: 'text/csv',
      size: 1 * 1024 * 1024 // 1MB
    };

    const oversizedValidation = validateFileUpload(oversizedFile, { maxSize: 5 * 1024 * 1024 });
    expect(oversizedValidation.isValid).toBe(false);
    expect(oversizedValidation.errors).toContain('File size exceeds maximum limit');

    const validValidation = validateFileUpload(validFile, { maxSize: 5 * 1024 * 1024 });
    expect(validValidation.isValid).toBe(true);
  });

  test('should validate password strength', () => {
    const weakPasswords = [
      '123',
      'password',
      '12345678',
      'abcdefgh',
      'PASSWORD',
      '!@#$%^&*'
    ];

    const strongPasswords = [
      'StrongPass123!',
      'MySecureP@ssw0rd',
      'Compl3x!Password',
      'S@f3Passw0rd2024'
    ];

    weakPasswords.forEach(password => {
      const validation = validatePassword(password);
      expect(validation.isValid).toBe(false);
    });

    strongPasswords.forEach(password => {
      const validation = validatePassword(password);
      expect(validation.isValid).toBe(true);
    });
  });

  test('should validate currency amounts', () => {
    const invalidAmounts = [
      'not-a-number',
      '',
      null,
      undefined,
      Infinity,
      -Infinity,
      NaN
    ];

    const validAmounts = [
      '100.50',
      '1000000',
      '0.01',
      '999999.99'
    ];

    invalidAmounts.forEach(amount => {
      const validation = validateCurrencyAmount(amount);
      expect(validation.isValid).toBe(false);
    });

    validAmounts.forEach(amount => {
      const validation = validateCurrencyAmount(amount);
      expect(validation.isValid).toBe(true);
    });
  });

  test('should validate date ranges', () => {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    // Invalid: end date before start date
    const invalidRange = validateDateRange(tomorrow, yesterday);
    expect(invalidRange.isValid).toBe(false);
    expect(invalidRange.errors).toContain('End date must be after start date');

    // Valid: proper date range
    const validRange = validateDateRange(yesterday, tomorrow);
    expect(validRange.isValid).toBe(true);
  });

  test('should validate business rules', () => {
    // Test inventory business rules
    const inventoryValidation = validateInventoryTransaction({
      product_id: 'product-1',
      transaction_type: 'out',
      quantity: 100,
      current_stock: 50
    });

    expect(inventoryValidation.isValid).toBe(false);
    expect(inventoryValidation.errors).toContain('Cannot withdraw more than available stock');

    // Test discount business rules
    const discountValidation = validateDiscount({
      type: 'percentage',
      value: 150 // Invalid: over 100%
    });

    expect(discountValidation.isValid).toBe(false);
    expect(discountValidation.errors).toContain('Percentage discount cannot exceed 100%');
  });

  test('should handle SQL injection attempts', () => {
    const sqlInjectionAttempts = [
      "'; DROP TABLE products; --",
      "' OR '1'='1",
      "admin'--",
      "'; INSERT INTO users VALUES('hacker', 'password'); --",
      "' UNION SELECT * FROM users --"
    ];

    sqlInjectionAttempts.forEach(attempt => {
      const sanitized = sanitizeSqlInput(attempt);
      
      expect(sanitized).not.toContain('DROP');
      expect(sanitized).not.toContain('INSERT');
      expect(sanitized).not.toContain('UNION');
      expect(sanitized).not.toContain('--');
      expect(sanitized).not.toContain("'");
    });
  });

  test('should validate API request parameters', () => {
    const invalidRequests = [
      { page: -1, limit: 10 },
      { page: 1, limit: 1001 }, // Exceeds max limit
      { page: 'invalid', limit: 10 },
      { search: '<script>alert(1)</script>' }
    ];

    invalidRequests.forEach(params => {
      const validation = validateApiParameters(params);
      expect(validation.isValid).toBe(false);
    });
  });

  test('should validate user permissions', () => {
    const user = { role: 'employee', permissions: ['read_products'] };
    const adminUser = { role: 'admin', permissions: ['*'] };

    // Employee trying to delete (should fail)
    const employeeDeleteValidation = validateUserAction(user, 'delete_product');
    expect(employeeDeleteValidation.isValid).toBe(false);
    expect(employeeDeleteValidation.errors).toContain('Insufficient permissions');

    // Admin doing anything (should pass)
    const adminValidation = validateUserAction(adminUser, 'delete_product');
    expect(adminValidation.isValid).toBe(true);
  });
});

// Validation function implementations
function validateProduct(data: any) {
  const errors = [];
  
  if (!data.name || data.name.trim() === '') {
    errors.push('Name is required');
  }
  
  if (data.price <= 0) {
    errors.push('Price must be positive');
  }
  
  if (!data.sku) {
    errors.push('SKU is required');
  } else if (data.sku.length < 4) {
    errors.push('SKU must be at least 4 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateCustomer(data: any) {
  const errors = [];
  
  if (!data.name || data.name.trim() === '') {
    errors.push('Name is required');
  }
  
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email format');
  }
  
  if (data.phone && data.phone.length < 10) {
    errors.push('Phone number must be at least 10 digits');
  }
  
  if (data.loyalty_points < 0) {
    errors.push('Loyalty points cannot be negative');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/eval\s*\(/gi, '')
    .replace(/<svg[^>]*>/gi, '')
    .replace(/<img[^>]*>/gi, '');
}

function validateFileUpload(file: any, options: any = {}) {
  const errors = [];
  const allowedTypes = [
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'application/pdf'
  ];
  
  const maxSize = options.maxSize || 5 * 1024 * 1024; // 5MB default
  
  if (!allowedTypes.includes(file.type)) {
    errors.push('File type not allowed');
  }
  
  if (file.size > maxSize) {
    errors.push('File size exceeds maximum limit');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

function validatePassword(password: string) {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateCurrencyAmount(amount: any) {
  const errors = [];
  const numericAmount = parseFloat(amount);
  
  if (isNaN(numericAmount) || !isFinite(numericAmount)) {
    errors.push('Amount must be a valid number');
  }
  
  if (numericAmount < 0) {
    errors.push('Amount cannot be negative');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateDateRange(startDate: Date, endDate: Date) {
  const errors = [];
  
  if (endDate <= startDate) {
    errors.push('End date must be after start date');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateInventoryTransaction(data: any) {
  const errors = [];
  
  if (data.transaction_type === 'out' && data.quantity > data.current_stock) {
    errors.push('Cannot withdraw more than available stock');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateDiscount(data: any) {
  const errors = [];
  
  if (data.type === 'percentage' && data.value > 100) {
    errors.push('Percentage discount cannot exceed 100%');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

function sanitizeSqlInput(input: string): string {
  return input
    .replace(/'/g, "''")
    .replace(/--/g, '')
    .replace(/;/g, '')
    .replace(/\b(DROP|INSERT|DELETE|UPDATE|UNION|SELECT)\b/gi, '');
}

function validateApiParameters(params: any) {
  const errors = [];
  
  if (params.page && (isNaN(params.page) || params.page < 1)) {
    errors.push('Page must be a positive number');
  }
  
  if (params.limit && (isNaN(params.limit) || params.limit > 1000)) {
    errors.push('Limit must be a number not exceeding 1000');
  }
  
  if (params.search && /<script|javascript:|on\w+=/i.test(params.search)) {
    errors.push('Search contains invalid characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateUserAction(user: any, action: string) {
  const errors = [];
  
  if (user.role === 'admin' || user.permissions.includes('*')) {
    return { isValid: true, errors: [] };
  }
  
  if (!user.permissions.includes(action)) {
    errors.push('Insufficient permissions');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}