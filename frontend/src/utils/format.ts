// 💰 D1 Optimized Vietnamese Currency Formatting (expects cents)
export const formatCurrency = (amountInCents: number | null | undefined): string => {
  // Handle null, undefined, or NaN values
  if (amountInCents == null || isNaN(amountInCents)) {
    return '0 ₫';
  }

  // Convert cents to VND (divide by 100)
  const amountInVND = Math.round(amountInCents / 100);

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountInVND);
};

// Format date to Vietnamese locale
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('vi-VN');
};

// Format datetime to Vietnamese locale
export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('vi-VN');
};

// Format number with thousand separators
export const formatNumber = (number: number | null | undefined): string => {
  if (number == null || isNaN(number)) {
    return '0';
  }
  return new Intl.NumberFormat('vi-VN').format(number);
};

// Format percentage
export const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(2)}%`;
}; 