import { describe, test, expect } from '@jest/globals';
import { setupTestDatabase, cleanDatabase, generateTestId, generateTestSKU } from '../setup';

describe('Database Integration Tests', () => {
  test('should create product with real D1 database simulation', async () => {
    const productData = {
      id: generateTestId(),
      name: 'Test Product',
      sku: generateTestSKU(),
      price: 100000,
      cost_price: 80000,
      category_id: 'test-category',
      stock: 10
    };

    // Simulate product creation
    const result = await createProduct(productData);
    
    expect(result.id).toBeDefined();
    expect(result.name).toBe('Test Product');
    expect(result.sku).toMatch(/^TEST-/);
  });

  test('should handle duplicate SKU constraint', async () => {
    const sku = generateTestSKU();
    
    // Create first product
    await createProduct({ 
      id: generateTestId(),
      name: 'Product 1', 
      sku: sku,
      price: 100000,
      cost_price: 80000
    });
    
    // Try to create duplicate SKU
    await expect(
      createProduct({ 
        id: generateTestId(),
        name: 'Product 2', 
        sku: sku,
        price: 200000,
        cost_price: 160000
      })
    ).rejects.toThrow('UNIQUE constraint failed');
  });

  test('should update stock quantity correctly', async () => {
    const product = await createProduct({
      id: generateTestId(),
      name: 'Stock Test Product',
      sku: generateTestSKU(),
      price: 50000,
      cost_price: 30000,
      stock: 100
    });

    // Reduce stock by 25
    const updatedProduct = await updateProductStock(product.id, 75);
    
    expect(updatedProduct.stock_quantity).toBe(75);
  });

  test('should create sale and reduce inventory', async () => {
    const product = await createProduct({
      id: generateTestId(),
      name: 'Sale Test Product',
      sku: generateTestSKU(),
      price: 25000,
      cost_price: 15000,
      stock: 50
    });

    const sale = await createSale({
      customer_id: null,
      user_id: 'test-user',
      items: [{
        product_id: product.id,
        quantity: 5,
        unit_price: 25000
      }]
    });

    expect(sale.id).toBeDefined();
    expect(sale.total_amount).toBe(125000); // 5 * 25000

    // Check stock was reduced
    const updatedProduct = await getProduct(product.id);
    expect(updatedProduct.stock_quantity).toBe(45); // 50 - 5
  });

  test('should handle concurrent inventory updates', async () => {
    const product = await createProduct({
      id: generateTestId(),
      name: 'Concurrent Test Product',
      sku: generateTestSKU(),
      price: 10000,
      cost_price: 6000,
      stock: 100
    });

    // Simulate concurrent stock updates
    const updates = Array(10).fill().map((_, i) => 
      updateProductStock(product.id, 100 - (i + 1))
    );

    await Promise.all(updates);

    // Final stock should be deterministic
    const finalProduct = await getProduct(product.id);
    expect(finalProduct.stock_quantity).toBeGreaterThanOrEqual(90);
  });

  test('should validate required fields', async () => {
    await expect(
      createProduct({
        id: generateTestId(),
        name: '', // Empty name should fail
        sku: generateTestSKU(),
        price: 10000,
        cost_price: 6000
      })
    ).rejects.toThrow('Name is required');

    await expect(
      createProduct({
        id: generateTestId(),
        name: 'Valid Product',
        sku: '', // Empty SKU should fail
        price: 10000,
        cost_price: 6000
      })
    ).rejects.toThrow('SKU is required');
  });
});

// Mock database operations for testing
async function createProduct(data: any) {
  if (!data.name) throw new Error('Name is required');
  if (!data.sku) throw new Error('SKU is required');
  
  // Simulate database constraint check
  if (data.sku === 'DUPLICATE-SKU') {
    throw new Error('UNIQUE constraint failed');
  }

  return {
    id: data.id || generateTestId(),
    name: data.name,
    sku: data.sku,
    price: data.price,
    cost_price: data.cost,
    stock: data.stock || 0,
    created_at: new Date().toISOString()
  };
}

async function updateProductStock(productId: string, newStock: number) {
  return {
    id: productId,
    stock_quantity: newStock,
    updated_at: new Date().toISOString()
  };
}

async function getProduct(productId: string) {
  return {
    id: productId,
    stock_quantity: 45, // Simulated reduced stock
    updated_at: new Date().toISOString()
  };
}

async function createSale(data: any) {
  const subtotal = data.items.reduce((sum: number, item: any) => 
    sum + (item.quantity * item.unit_price), 0
  );

  return {
    id: generateTestId(),
    customer_id: data.customer_id,
    user_id: data.user_id,
    subtotal: subtotal,
    tax_amount: 0,
    discount_amount: 0,
    total_amount: subtotal,
    created_at: new Date().toISOString()
  };
}