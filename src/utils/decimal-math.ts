/**
 * DECIMAL ARITHMETIC FOR FINANCIAL CALCULATIONS
 * Prevents floating-point precision errors in monetary calculations
 */

/**
 * Decimal arithmetic class for precise financial calculations
 * Uses integer arithmetic with fixed decimal places to avoid floating-point errors
 */
export class DecimalMath {
  private static readonly DECIMAL_PLACES = 2;
  private static readonly MULTIPLIER = Math.pow(10, DecimalMath.DECIMAL_PLACES);

  /**
   * Convert decimal number to integer representation
   */
  private static toInteger(value: number): number {
    return Math.round(value * DecimalMath.MULTIPLIER);
  }

  /**
   * Convert integer representation back to decimal
   */
  private static toDecimal(value: number): number {
    return value / DecimalMath.MULTIPLIER;
  }

  /**
   * Add two decimal numbers with precision
   */
  static add(a: number, b: number): number {
    const intA = DecimalMath.toInteger(a);
    const intB = DecimalMath.toInteger(b);
    return DecimalMath.toDecimal(intA + intB);
  }

  /**
   * Subtract two decimal numbers with precision
   */
  static subtract(a: number, b: number): number {
    const intA = DecimalMath.toInteger(a);
    const intB = DecimalMath.toInteger(b);
    return DecimalMath.toDecimal(intA - intB);
  }

  /**
   * Multiply two decimal numbers with precision
   */
  static multiply(a: number, b: number): number {
    const intA = DecimalMath.toInteger(a);
    const intB = DecimalMath.toInteger(b);
    return DecimalMath.toDecimal((intA * intB) / DecimalMath.MULTIPLIER);
  }

  /**
   * Divide two decimal numbers with precision
   */
  static divide(a: number, b: number): number {
    if (b === 0) {
      throw new Error('Division by zero');
    }
    const intA = DecimalMath.toInteger(a);
    const intB = DecimalMath.toInteger(b);
    return DecimalMath.toDecimal((intA * DecimalMath.MULTIPLIER) / intB);
  }

  /**
   * Calculate percentage with precision
   */
  static percentage(amount: number, percentage: number): number {
    return DecimalMath.multiply(amount, DecimalMath.divide(percentage, 100));
  }

  /**
   * Round to specified decimal places
   */
  static round(value: number, places: number = DecimalMath.DECIMAL_PLACES): number {
    const multiplier = Math.pow(10, places);
    return Math.round(value * multiplier) / multiplier;
  }

  /**
   * Compare two decimal numbers for equality (within precision)
   */
  static equals(a: number, b: number): boolean {
    return Math.abs(a - b) < (1 / DecimalMath.MULTIPLIER);
  }

  /**
   * Ensure value is non-negative
   */
  static max(a: number, b: number): number {
    return a > b ? a : b;
  }

  /**
   * Ensure value is non-positive
   */
  static min(a: number, b: number): number {
    return a < b ? a : b;
  }
}

/**
 * Financial calculation utilities
 */
export class FinancialCalculator {
  
  /**
   * Calculate line item total (quantity × unit_price - discount)
   */
  static calculateLineTotal(quantity: number, unitPrice: number, discount: number = 0): number {
    const subtotal = DecimalMath.multiply(quantity, unitPrice);
    return DecimalMath.subtract(subtotal, discount);
  }

  /**
   * Calculate tax amount
   */
  static calculateTax(amount: number, taxRate: number): number {
    return DecimalMath.percentage(amount, taxRate);
  }

  /**
   * Calculate discount amount
   */
  static calculateDiscount(amount: number, discountRate: number): number {
    return DecimalMath.percentage(amount, discountRate);
  }

  /**
   * Calculate sale total with tax and discount
   */
  static calculateSaleTotal(
    items: Array<{
      quantity: number;
      unit_price: number;
      discount_amount?: number;
      tax_rate?: number;
    }>,
    globalTaxRate: number = 0,
    globalDiscountAmount: number = 0
  ): {
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    final_amount: number;
  } {
    // Calculate subtotal from all items
    let subtotal = 0;
    let totalTax = 0;
    let totalItemDiscount = 0;

    for (const item of items) {
      const itemSubtotal = DecimalMath.multiply(item.quantity, item.unit_price);
      const itemDiscount = item.discount_amount || 0;
      const itemTaxRate = item.tax_rate || globalTaxRate;
      
      // Add to subtotal
      subtotal = DecimalMath.add(subtotal, itemSubtotal);
      
      // Add item discount
      totalItemDiscount = DecimalMath.add(totalItemDiscount, itemDiscount);
      
      // Calculate tax on (subtotal - discount)
      const taxableAmount = DecimalMath.subtract(itemSubtotal, itemDiscount);
      const itemTax = FinancialCalculator.calculateTax(taxableAmount, itemTaxRate);
      totalTax = DecimalMath.add(totalTax, itemTax);
    }

    // Apply global discount
    const totalDiscount = DecimalMath.add(totalItemDiscount, globalDiscountAmount);
    
    // Calculate final amount
    const afterDiscount = DecimalMath.subtract(subtotal, totalDiscount);
    const finalAmount = DecimalMath.add(afterDiscount, totalTax);

    return {
      subtotal: DecimalMath.round(subtotal),
      tax_amount: DecimalMath.round(totalTax),
      discount_amount: DecimalMath.round(totalDiscount),
      final_amount: DecimalMath.round(DecimalMath.max(finalAmount, 0)) // Ensure non-negative
    };
  }

  /**
   * Calculate change amount
   */
  static calculateChange(amountPaid: number, totalAmount: number): number {
    const change = DecimalMath.subtract(amountPaid, totalAmount);
    return DecimalMath.max(change, 0); // No negative change
  }

  /**
   * Split amount among multiple recipients
   */
  static splitAmount(totalAmount: number, parts: number): number[] {
    if (parts <= 0) {
      throw new Error('Parts must be positive');
    }

    const baseAmount = DecimalMath.divide(totalAmount, parts);
    const roundedBase = DecimalMath.round(baseAmount);
    
    const result = new Array(parts).fill(roundedBase);
    
    // Distribute any remainder due to rounding
    const totalRounded = DecimalMath.multiply(roundedBase, parts);
    const remainder = DecimalMath.subtract(totalAmount, totalRounded);
    
    if (!DecimalMath.equals(remainder, 0)) {
      const remainderCents = (remainder * 100) | 0;
      for (let i = 0; i < Math.abs(remainderCents) && i < parts; i++) {
        if (remainderCents > 0) {
          result[i] = DecimalMath.add(result[i], 0.01);
        } else {
          result[i] = DecimalMath.subtract(result[i], 0.01);
        }
      }
    }

    return result;
  }

  /**
   * Validate monetary amount
   */
  static validateAmount(amount: number): boolean {
    return typeof amount === 'number' && 
           !isNaN(amount) && 
           isFinite(amount) && 
           amount >= 0;
  }

  /**
   * Format amount for display
   */
  static formatCurrency(amount: number, currency: string = 'VND'): string {
    if (!FinancialCalculator.validateAmount(amount)) {
      return '0';
    }

    const rounded = DecimalMath.round(amount);
    
    if (currency === 'VND') {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(rounded);
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(rounded);
  }
}

/**
 * Inventory calculation utilities
 */
export class InventoryCalculator {
  
  /**
   * Calculate inventory value
   */
  static calculateInventoryValue(
    items: Array<{ quantity: number; cost_price: number }>
  ): number {
    let totalValue = 0;
    
    for (const item of items) {
      const itemValue = DecimalMath.multiply(item.quantity, item.cost_price);
      totalValue = DecimalMath.add(totalValue, itemValue);
    }
    
    return DecimalMath.round(totalValue);
  }

  /**
   * Calculate profit margin
   */
  static calculateProfitMargin(sellingPrice: number, costPrice: number): number {
    if (costPrice === 0) {
      return 0;
    }
    
    const profit = DecimalMath.subtract(sellingPrice, costPrice);
    const margin = DecimalMath.divide(profit, costPrice);
    return DecimalMath.multiply(margin, 100); // Convert to percentage
  }

  /**
   * Calculate markup percentage
   */
  static calculateMarkup(sellingPrice: number, costPrice: number): number {
    if (sellingPrice === 0) {
      return 0;
    }
    
    const profit = DecimalMath.subtract(sellingPrice, costPrice);
    const markup = DecimalMath.divide(profit, sellingPrice);
    return DecimalMath.multiply(markup, 100); // Convert to percentage
  }
}
