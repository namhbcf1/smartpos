// Vietnamese Currency Formatting Utilities
// ComputerPOS Pro - Vietnamese Computer Hardware Store POS System

/**
 * Format amount in VND cents to Vietnamese currency display
 * Example: 199900000 cents -> "1.999.000 ₫"
 */
export function formatVND(amountInCents: number): string {
  if (typeof amountInCents !== 'number' || isNaN(amountInCents)) {
    return '0 ₫';
  }

  // Convert cents to VND (divide by 100)
  const amountInVND = Math.round(amountInCents / 100);
  
  // Format with Vietnamese thousand separators (dots)
  const formatted = amountInVND.toLocaleString('vi-VN');
  
  return `${formatted} ₫`;
}

/**
 * Parse Vietnamese currency string to cents
 * Example: "1.999.000 ₫" -> 199900000 cents
 */
export function parseVND(currencyString: string): number {
  if (!currencyString || typeof currencyString !== 'string') {
    return 0;
  }

  // Remove currency symbol and spaces
  const cleanString = currencyString.replace(/[₫\s]/g, '');
  
  // Remove dots (thousand separators)
  const numberString = cleanString.replace(/\./g, '');
  
  // Parse to number and convert to cents
  const amountInVND = parseInt(numberString, 10);
  
  if (isNaN(amountInVND)) {
    return 0;
  }
  
  return amountInVND * 100; // Convert to cents
}

/**
 * Format price for input fields (without currency symbol)
 * Example: 199900000 cents -> "1.999.000"
 */
export function formatVNDInput(amountInCents: number): string {
  if (typeof amountInCents !== 'number' || isNaN(amountInCents)) {
    return '0';
  }

  const amountInVND = Math.round(amountInCents / 100);
  return amountInVND.toLocaleString('vi-VN');
}

/**
 * Validate Vietnamese currency input
 */
export function isValidVNDInput(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  // Allow only digits, dots, and spaces
  const cleanInput = input.replace(/[\s₫]/g, '');
  const pattern = /^[\d.]+$/;
  
  return pattern.test(cleanInput);
}

/**
 * Computer hardware price ranges for validation
 */
export const PRICE_RANGES = {
  CPU: { min: 100000, max: 5000000000 }, // 1K - 50M VND
  GPU: { min: 200000, max: 10000000000 }, // 2K - 100M VND
  RAM: { min: 50000, max: 2000000000 }, // 500 - 20M VND
  MOTHERBOARD: { min: 100000, max: 3000000000 }, // 1K - 30M VND
  STORAGE: { min: 50000, max: 5000000000 }, // 500 - 50M VND
  PSU: { min: 100000, max: 2000000000 }, // 1K - 20M VND
  CASE: { min: 50000, max: 1000000000 }, // 500 - 10M VND
  COOLING: { min: 20000, max: 1000000000 }, // 200 - 10M VND
  ACCESSORIES: { min: 10000, max: 500000000 }, // 100 - 5M VND
};

/**
 * Validate price for computer hardware category
 */
export function validateHardwarePrice(priceInCents: number, category: string): {
  isValid: boolean;
  message?: string;
} {
  const categoryUpper = category.toUpperCase();
  const range = PRICE_RANGES[categoryUpper as keyof typeof PRICE_RANGES];
  
  if (!range) {
    return { isValid: true }; // Unknown category, allow any price
  }
  
  if (priceInCents < range.min) {
    return {
      isValid: false,
      message: `Giá quá thấp cho ${category}. Tối thiểu: ${formatVND(range.min)}`
    };
  }
  
  if (priceInCents > range.max) {
    return {
      isValid: false,
      message: `Giá quá cao cho ${category}. Tối đa: ${formatVND(range.max)}`
    };
  }
  
  return { isValid: true };
}

/**
 * Calculate Vietnamese VAT (10%)
 */
export function calculateVAT(amountInCents: number): number {
  return Math.round(amountInCents * 0.1);
}

/**
 * Calculate total with VAT
 */
export function calculateTotalWithVAT(subtotalInCents: number): {
  subtotal: number;
  vat: number;
  total: number;
} {
  const vat = calculateVAT(subtotalInCents);
  const total = subtotalInCents + vat;
  
  return {
    subtotal: subtotalInCents,
    vat,
    total
  };
}

/**
 * Format invoice number for Vietnamese business compliance
 */
export function generateInvoiceNumber(storeCode: string = 'MAIN'): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const timestamp = now.getTime().toString().slice(-6); // Last 6 digits
  
  return `${storeCode}-${year}${month}${day}-${timestamp}`;
}

/**
 * Vietnamese payment method display names
 */
export const PAYMENT_METHODS = {
  cash: 'Tiền mặt',
  card: 'Thẻ ngân hàng',
  bank_transfer: 'Chuyển khoản',
  momo: 'Ví MoMo',
  zalopay: 'ZaloPay',
  vnpay: 'VNPay'
} as const;

export type PaymentMethodKey = keyof typeof PAYMENT_METHODS;

/**
 * Get Vietnamese display name for payment method
 */
export function getPaymentMethodName(method: string): string {
  return PAYMENT_METHODS[method as PaymentMethodKey] || method;
}
