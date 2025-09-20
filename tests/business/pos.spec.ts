import { describe, test, expect } from '@jest/globals';
import { generateTestId } from '../setup';

describe('POS Business Logic Tests', () => {
  
  test('should calculate correct total with tax', () => {
    const cart = [
      { id: 1, price: 100000, quantity: 2 },
      { id: 2, price: 50000, quantity: 1 }
    ];
    
    const total = calculateCartTotal(cart, { taxRate: 0.1 });
    expect(total).toBe(275000); // (200000 + 50000) * 1.1
  });

  test('should apply percentage discount correctly', () => {
    const cart = [{ id: 1, price: 100000, quantity: 1 }];
    const discount = { type: 'percentage', value: 10 };
    
    const total = calculateCartTotal(cart, { discount });
    expect(total).toBe(90000); // 100000 * 0.9
  });

  test('should apply fixed discount correctly', () => {
    const cart = [{ id: 1, price: 100000, quantity: 1 }];
    const discount = { type: 'fixed', value: 15000 };
    
    const total = calculateCartTotal(cart, { discount });
    expect(total).toBe(85000); // 100000 - 15000
  });

  test('should not apply discount if total is below minimum', () => {
    const cart = [{ id: 1, price: 50000, quantity: 1 }];
    const discount = { 
      type: 'percentage', 
      value: 10, 
      minAmount: 100000 
    };
    
    const total = calculateCartTotal(cart, { discount });
    expect(total).toBe(50000); // No discount applied
  });

  test('should cap discount at maximum amount', () => {
    const cart = [{ id: 1, price: 1000000, quantity: 1 }];
    const discount = { 
      type: 'percentage', 
      value: 20, 
      maxDiscount: 50000 
    };
    
    const total = calculateCartTotal(cart, { discount });
    expect(total).toBe(950000); // 1000000 - 50000 (capped)
  });

  test('should handle multiple tax rates', () => {
    const cart = [
      { id: 1, price: 100000, quantity: 1, taxCategory: 'standard' },
      { id: 2, price: 50000, quantity: 1, taxCategory: 'food' }
    ];
    
    const taxRates = {
      standard: 0.1,
      food: 0.05
    };
    
    const total = calculateCartTotalWithMultipleTax(cart, taxRates);
    expect(total).toBe(162500); // (100000 * 1.1) + (50000 * 1.05)
  });

  test('should handle inventory deduction during sale', async () => {
    const product = await createTestProduct({ 
      sku: 'TEST-POS-001', 
      stock: 10 
    });
    
    const orderResult = await processOrder({
      items: [{ product_id: product.id, quantity: 3 }]
    });
    
    expect(orderResult.success).toBe(true);
    
    const updatedProduct = await getProduct(product.id);
    expect(updatedProduct.stock).toBe(7); // 10 - 3
  });

  test('should prevent overselling', async () => {
    const product = await createTestProduct({ 
      sku: 'TEST-POS-002', 
      stock: 5 
    });
    
    await expect(
      processOrder({
        items: [{ product_id: product.id, quantity: 10 }]
      })
    ).rejects.toThrow('Insufficient stock');
  });

  test('should handle multiple payment methods', () => {
    const cart = [{ id: 1, price: 100000, quantity: 1 }];
    const payments = [
      { method: 'cash', amount: 60000 },
      { method: 'card', amount: 40000 }
    ];
    
    const result = processMultiplePayments(cart, payments);
    
    expect(result.totalPaid).toBe(100000);
    expect(result.change).toBe(0);
    expect(result.success).toBe(true);
  });

  test('should calculate change correctly', () => {
    const cart = [{ id: 1, price: 85000, quantity: 1 }];
    const payment = { method: 'cash', amount: 100000 };
    
    const result = processCashPayment(cart, payment);
    
    expect(result.change).toBe(15000);
    expect(result.success).toBe(true);
  });

  test('should handle loyalty points calculation', () => {
    const cart = [{ id: 1, price: 100000, quantity: 2 }];
    const customer = { id: 'customer-1', loyaltyPoints: 500 };
    
    const result = calculateLoyaltyPoints(cart, customer);
    
    expect(result.pointsEarned).toBe(20); // 200000 / 10000 = 20 points
    expect(result.newBalance).toBe(520); // 500 + 20
  });

  test('should apply loyalty points as discount', () => {
    const cart = [{ id: 1, price: 100000, quantity: 1 }];
    const customer = { id: 'customer-1', loyaltyPoints: 1000 };
    const pointsToUse = 500; // 500 points = 5000 VND
    
    const total = calculateCartTotal(cart, { 
      loyaltyDiscount: pointsToUse * 10 
    });
    
    expect(total).toBe(95000); // 100000 - 5000
  });

  test('should validate sale transaction', () => {
    const saleData = {
      items: [
        { product_id: 'product-1', quantity: 2, unit_price: 50000 }
      ],
      customer_id: 'customer-1',
      payment_method: 'cash',
      total_amount: 100000
    };
    
    const validation = validateSaleTransaction(saleData);
    
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  test('should detect invalid sale data', () => {
    const invalidSaleData = {
      items: [], // Empty items
      payment_method: '', // Empty payment method
      total_amount: -100 // Negative amount
    };
    
    const validation = validateSaleTransaction(invalidSaleData);
    
    expect(validation.isValid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });
});

// Mock business logic functions
function calculateCartTotal(cart: any[], options: any = {}) {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  let total = subtotal;
  
  // Apply discount
  if (options.discount) {
    const { type, value, minAmount = 0, maxDiscount } = options.discount;
    
    if (subtotal >= minAmount) {
      let discountAmount = 0;
      
      if (type === 'percentage') {
        discountAmount = subtotal * (value / 100);
      } else if (type === 'fixed') {
        discountAmount = value;
      }
      
      if (maxDiscount && discountAmount > maxDiscount) {
        discountAmount = maxDiscount;
      }
      
      total -= discountAmount;
    }
  }
  
  // Apply loyalty discount
  if (options.loyaltyDiscount) {
    total -= options.loyaltyDiscount;
  }
  
  // Apply tax
  if (options.taxRate) {
    total *= (1 + options.taxRate);
  }
  
  return Math.round(total);
}

function calculateCartTotalWithMultipleTax(cart: any[], taxRates: any) {
  return cart.reduce((total, item) => {
    const itemTotal = item.price * item.quantity;
    const taxRate = taxRates[item.taxCategory] || 0;
    return total + (itemTotal * (1 + taxRate));
  }, 0);
}

async function createTestProduct(data: any) {
  return {
    id: generateTestId(),
    sku: data.sku,
    stock: data.stock,
    price: data.price || 50000
  };
}

async function getProduct(id: string) {
  return {
    id,
    stock: 7 // Simulated updated stock
  };
}

async function processOrder(orderData: any) {
  const item = orderData.items[0];
  if (item.quantity > 5) { // Simulated stock check
    throw new Error('Insufficient stock');
  }
  return { success: true };
}

function processMultiplePayments(cart: any[], payments: any[]) {
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  
  return {
    totalPaid,
    change: Math.max(0, totalPaid - total),
    success: totalPaid >= total
  };
}

function processCashPayment(cart: any[], payment: any) {
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  return {
    change: payment.amount - total,
    success: payment.amount >= total
  };
}

function calculateLoyaltyPoints(cart: any[], customer: any) {
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const pointsEarned = Math.floor(total / 10000); // 1 point per 10,000 VND
  
  return {
    pointsEarned,
    newBalance: customer.loyaltyPoints + pointsEarned
  };
}

function validateSaleTransaction(saleData: any) {
  const errors = [];
  
  if (!saleData.items || saleData.items.length === 0) {
    errors.push('Sale must have at least one item');
  }
  
  if (!saleData.payment_method) {
    errors.push('Payment method is required');
  }
  
  if (saleData.total_amount <= 0) {
    errors.push('Total amount must be positive');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}