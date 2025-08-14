// 🎨 Design Tokens - Optimized for performance
// Only essential colors and tokens to reduce bundle size

export const colors = {
  // 🔵 Tech Blue - Primary Brand (Tin cậy, công nghệ)
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Main Tech Blue
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  // 🟡 Vietnamese Gold - Secondary (Thịnh vượng)
  secondary: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Main Vietnamese Gold
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  // 🟢 Emerald - Success (Thành công)
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981', // Main Emerald
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  // 🔴 Red - Error (Lỗi)
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // Main Red
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  // 🟠 Amber - Warning (Cảnh báo)
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Main Amber
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  // 🔵 Cyan - Info (Thông tin)
  info: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee',
    500: '#06b6d4', // Main Cyan
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
  },
  // ⚫ Neutral Grays - Optimized for Vietnamese text
  gray: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
};

export const gradients = {
  primary: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', // Tech Blue gradient
  secondary: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', // Vietnamese Gold gradient
  success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', // Emerald gradient
  error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', // Red gradient
  warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', // Amber gradient
  info: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', // Cyan gradient
};

export const shadows = {
  soft: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  medium: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  large: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  colored: {
    primary: '0 10px 15px -3px rgba(14, 165, 233, 0.3), 0 4px 6px -2px rgba(14, 165, 233, 0.1)',
    secondary: '0 10px 15px -3px rgba(168, 85, 247, 0.3), 0 4px 6px -2px rgba(168, 85, 247, 0.1)',
  },
};

// Font configuration - Optimized for Vietnamese
export const typography = {
  fontFamily: [
    'Inter',
    'Roboto', 
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'sans-serif',
  ].join(','),
};

// Spacing and sizing
export const spacing = {
  borderRadius: 12,
  borderRadiusLarge: 20,
  borderRadiusSmall: 8,
};
