// 💰 Enhanced Vietnamese Currency Formatting (1.999.000 ₫)
export const formatCurrency = (amount: number | null | undefined): string => {
  // Handle null, undefined, or NaN values
  if (amount == null || isNaN(amount)) {
    return '0 ₫';
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
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