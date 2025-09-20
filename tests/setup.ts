import { beforeAll, afterAll, beforeEach } from '@jest/globals';

let testDatabase: any;

export async function setupTestDatabase() {
  // Initialize test database connection
  try {
    // For real D1 testing, we would set up a test database instance
    // For now, we'll use a mock implementation that simulates D1 behavior
    testDatabase = {
      prepare: (query: string) => ({
        bind: (...params: any[]) => ({
          run: () => ({ success: true }),
          first: () => ({ id: 'test-id', name: 'Test Product' }),
          all: () => ({ results: [] })
        })
      }),
      exec: (query: string) => ({ success: true })
    };
    console.log('✅ Test database setup completed');
  } catch (error) {
    console.error('❌ Test database setup failed:', error);
    throw error;
  }
}

export async function teardownTestDatabase() {
  try {
    // Clean up test database connections
    testDatabase = null;
    console.log('✅ Test database teardown completed');
  } catch (error) {
    console.error('❌ Test database teardown failed:', error);
  }
}

export async function cleanDatabase() {
  try {
    // Clean all test data between tests
    if (testDatabase) {
      await testDatabase.exec('DELETE FROM products WHERE sku LIKE "TEST-%"');
      await testDatabase.exec('DELETE FROM categories WHERE name LIKE "Test %"');
      await testDatabase.exec('DELETE FROM customers WHERE email LIKE "%@test.com"');
      await testDatabase.exec('DELETE FROM sales WHERE notes LIKE "TEST:%"');
    }
    console.log('✅ Database cleaned for test');
  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
  }
}

// Global test setup
beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await teardownTestDatabase();
});

beforeEach(async () => {
  await cleanDatabase();
});

// Mock API client for testing
export const testApiClient = {
  get: async (url: string) => ({ status: 200, data: [] }),
  post: async (url: string, data: any) => ({ status: 201, data: { id: 'test-id' } }),
  put: async (url: string, data: any) => ({ status: 200, data: { ...data } }),
  delete: async (url: string) => ({ status: 204 })
};

// Test utilities
export function generateTestId() {
  return 'test-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

export function generateTestSKU() {
  return 'TEST-' + Date.now().toString(36).toUpperCase();
}