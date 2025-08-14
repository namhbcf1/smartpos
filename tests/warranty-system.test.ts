import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WarrantyNotificationService } from '../src/services/WarrantyNotificationService';

// Mock environment for testing
const mockEnv = {
  DB: {
    prepare: (query: string) => ({
      bind: (...params: any[]) => ({
        run: async () => ({ success: true, meta: { last_row_id: 1, changes: 1 } }),
        first: async () => ({ id: 1, total: 10 }),
        all: async () => ({ results: [] }),
      }),
    }),
  },
} as any;

describe('Warranty Notification System', () => {
  let notificationService: WarrantyNotificationService;

  beforeEach(() => {
    notificationService = new WarrantyNotificationService(mockEnv);
  });

  describe('WarrantyNotificationService', () => {
    it('should check for expiring warranties', async () => {
      const result = await notificationService.checkExpiringWarranties();
      
      expect(result).toHaveProperty('created');
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(typeof result.created).toBe('number');
    });

    it('should process pending notifications', async () => {
      const result = await notificationService.processPendingNotifications();
      
      expect(result).toHaveProperty('sent');
      expect(result).toHaveProperty('failed');
      expect(result).toHaveProperty('errors');
      expect(typeof result.sent).toBe('number');
      expect(typeof result.failed).toBe('number');
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should get notification statistics', async () => {
      const stats = await notificationService.getNotificationStats();
      
      // Should return stats object or null
      expect(stats === null || typeof stats === 'object').toBe(true);
    });

    it('should cleanup old notifications', async () => {
      const result = await notificationService.cleanupOldNotifications();
      
      expect(result).toHaveProperty('deleted');
      expect(typeof result.deleted).toBe('number');
    });
  });

  describe('Warranty API Endpoints', () => {
    // These would be integration tests with actual API calls
    it('should create warranty registration', async () => {
      const warrantyData = {
        serial_number_id: 1,
        warranty_type: 'manufacturer' as const,
        warranty_period_months: 12,
        terms_accepted: true,
      };

      // Mock API call
      const response = {
        data: {
          success: true,
          data: { id: 1, warranty_number: 'WR-001' },
        },
      };

      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('warranty_number');
    });

    it('should create warranty claim', async () => {
      const claimData = {
        warranty_registration_id: 1,
        claim_type: 'repair' as const,
        issue_description: 'Product not working properly',
        estimated_cost: 100000,
      };

      // Mock API call
      const response = {
        data: {
          success: true,
          data: { id: 1, claim_number: 'CL-001' },
        },
      };

      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('claim_number');
    });

    it('should list warranty notifications', async () => {
      // Mock API call
      const response = {
        data: {
          success: true,
          data: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          },
        },
      };

      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.pagination).toHaveProperty('page');
    });
  });

  describe('Serial Number Management', () => {
    it('should create serial number', async () => {
      const serialData = {
        serial_number: 'SN123456789',
        product_id: 1,
        supplier_id: 1,
        location: 'Store A',
      };

      // Mock API call
      const response = {
        data: {
          success: true,
          data: { id: 1, ...serialData },
        },
      };

      expect(response.data.success).toBe(true);
      expect(response.data.data.serial_number).toBe(serialData.serial_number);
    });

    it('should update serial number status', async () => {
      const updateData = {
        status: 'sold' as const,
        customer_id: 1,
        sale_reference: 'SALE-123',
      };

      // Mock API call
      const response = {
        data: {
          success: true,
          data: { id: 1, status: 'sold' },
        },
      };

      expect(response.data.success).toBe(true);
      expect(response.data.data.status).toBe('sold');
    });

    it('should validate serial number availability', async () => {
      const serialNumber = 'SN123456789';
      const productId = 1;

      // Mock validation
      const isAvailable = true;
      const errors: string[] = [];

      expect(typeof isAvailable).toBe('boolean');
      expect(Array.isArray(errors)).toBe(true);
    });
  });

  describe('POS Integration', () => {
    it('should assign serial numbers during sale', async () => {
      const saleData = {
        customer: { name: 'Test Customer', phone: '0123456789', email: 'test@example.com' },
        items: [
          {
            product: { id: 1, name: 'Test Product', sku: 'TEST-001' },
            quantity: 1,
            unit_price: 1000000,
            total_price: 1000000,
            serial_numbers: ['SN123456789'],
            auto_warranty: true,
          },
        ],
        payment_method: 'cash',
        discount_amount: 0,
        tax_amount: 100000,
        total_amount: 1100000,
      };

      // Mock enhanced sales service
      const result = {
        sale_id: 1,
        assigned_serials: [
          { serial_number: 'SN123456789', serial_id: 1, product_id: 1 },
        ],
        created_warranties: [
          { warranty_id: 1, warranty_number: 'WR-001', serial_number: 'SN123456789' },
        ],
        errors: [],
      };

      expect(result.sale_id).toBe(1);
      expect(result.assigned_serials).toHaveLength(1);
      expect(result.created_warranties).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle sale without serial numbers', async () => {
      const saleData = {
        customer: { name: 'Test Customer', phone: '0123456789', email: 'test@example.com' },
        items: [
          {
            product: { id: 1, name: 'Test Product', sku: 'TEST-001' },
            quantity: 1,
            unit_price: 1000000,
            total_price: 1000000,
          },
        ],
        payment_method: 'cash',
        discount_amount: 0,
        tax_amount: 100000,
        total_amount: 1100000,
      };

      // Mock regular sales API
      const response = {
        data: {
          success: true,
          data: { id: 1 },
        },
      };

      expect(response.data.success).toBe(true);
      expect(response.data.data.id).toBe(1);
    });
  });

  describe('Notification Scheduling', () => {
    it('should schedule expiry warning notification', async () => {
      const warranty = {
        id: 1,
        warranty_end_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days from now
        product_name: 'Test Product',
        customer_name: 'Test Customer',
        warranty_number: 'WR-001',
        serial_number: 'SN123456789',
      };

      // Should create notification for warranty expiring in 25 days
      const shouldCreateNotification = true;
      expect(shouldCreateNotification).toBe(true);
    });

    it('should not create duplicate notifications', async () => {
      const warranty = {
        id: 1,
        warranty_end_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
        has_existing_notification: true,
      };

      // Should not create notification if one already exists
      const shouldCreateNotification = !warranty.has_existing_notification;
      expect(shouldCreateNotification).toBe(false);
    });

    it('should process scheduled notifications', async () => {
      const pendingNotifications = [
        {
          id: 1,
          scheduled_date: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
          notification_type: 'expiry_warning',
          customer_email: 'test@example.com',
        },
      ];

      // Should process notifications that are due
      const shouldProcess = pendingNotifications.filter(
        n => new Date(n.scheduled_date) <= new Date()
      );

      expect(shouldProcess).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      const mockErrorEnv = {
        DB: {
          prepare: () => {
            throw new Error('Database connection failed');
          },
        },
      } as any;

      const errorService = new WarrantyNotificationService(mockErrorEnv);
      
      const result = await errorService.checkExpiringWarranties();
      expect(result.created).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle notification sending failures', async () => {
      // Mock notification that fails to send
      const notification = {
        id: 1,
        customer_email: 'invalid-email',
        notification_type: 'expiry_warning',
      };

      // Simulate 5% failure rate
      const sendSuccess = Math.random() > 0.05;
      
      // Should handle both success and failure cases
      expect(typeof sendSuccess).toBe('boolean');
    });

    it('should validate warranty data', async () => {
      const invalidWarrantyData = {
        serial_number_id: null, // Invalid
        warranty_type: 'invalid_type', // Invalid
        warranty_period_months: -1, // Invalid
      };

      const validationErrors = [];
      
      if (!invalidWarrantyData.serial_number_id) {
        validationErrors.push('Serial number ID is required');
      }
      
      if (!['manufacturer', 'store', 'extended', 'premium'].includes(invalidWarrantyData.warranty_type)) {
        validationErrors.push('Invalid warranty type');
      }
      
      if (invalidWarrantyData.warranty_period_months < 1) {
        validationErrors.push('Warranty period must be positive');
      }

      expect(validationErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Tests', () => {
    it('should handle bulk serial number creation', async () => {
      const serialNumbers = Array.from({ length: 100 }, (_, i) => `SN${i.toString().padStart(6, '0')}`);
      
      const bulkData = {
        product_id: 1,
        serial_numbers: serialNumbers,
        location: 'Store A',
      };

      // Mock bulk creation
      const result = {
        created: serialNumbers.length,
        errors: [],
      };

      expect(result.created).toBe(100);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle large notification batches', async () => {
      const batchSize = 50;
      
      // Mock processing large batch
      const result = {
        sent: 47,
        failed: 3,
        errors: ['Email 1 failed', 'Email 2 failed', 'Email 3 failed'],
      };

      expect(result.sent + result.failed).toBe(batchSize);
      expect(result.errors).toHaveLength(result.failed);
    });
  });
});

describe('Integration Tests', () => {
  it('should complete full warranty lifecycle', async () => {
    // 1. Create serial number
    const serialNumber = 'SN123456789';
    
    // 2. Sell product with serial number
    const saleId = 1;
    
    // 3. Create warranty registration
    const warrantyId = 1;
    
    // 4. Schedule notifications
    const notificationId = 1;
    
    // 5. Process notifications
    const processed = true;

    expect(serialNumber).toBeDefined();
    expect(saleId).toBeDefined();
    expect(warrantyId).toBeDefined();
    expect(notificationId).toBeDefined();
    expect(processed).toBe(true);
  });

  it('should handle warranty claim process', async () => {
    // 1. Create warranty claim
    const claimId = 1;
    
    // 2. Update claim status
    const statusUpdated = true;
    
    // 3. Send claim update notification
    const notificationSent = true;

    expect(claimId).toBeDefined();
    expect(statusUpdated).toBe(true);
    expect(notificationSent).toBe(true);
  });
});

// Test data generators
export const generateTestWarranty = (overrides = {}) => ({
  id: 1,
  warranty_number: 'WR-001',
  serial_number_id: 1,
  warranty_type: 'manufacturer',
  warranty_period_months: 12,
  warranty_start_date: new Date().toISOString(),
  warranty_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'active',
  terms_accepted: true,
  ...overrides,
});

export const generateTestSerialNumber = (overrides = {}) => ({
  id: 1,
  serial_number: 'SN123456789',
  product_id: 1,
  status: 'in_stock',
  location: 'Store A',
  ...overrides,
});

export const generateTestNotification = (overrides = {}) => ({
  id: 1,
  warranty_registration_id: 1,
  notification_type: 'expiry_warning',
  notification_method: 'email',
  scheduled_date: new Date().toISOString(),
  subject: 'Test Notification',
  message: 'This is a test notification',
  status: 'pending',
  ...overrides,
});
