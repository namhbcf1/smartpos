/**
 * Theme Configuration for Smart POS Mobile
 * Defines colors, typography, and styling for the app
 */

import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// Custom color palette
const customColors = {
  primary: '#2563eb',
  primaryContainer: '#dbeafe',
  secondary: '#64748b',
  secondaryContainer: '#f1f5f9',
  tertiary: '#059669',
  tertiaryContainer: '#d1fae5',
  surface: '#ffffff',
  surfaceVariant: '#f8fafc',
  background: '#ffffff',
  error: '#dc2626',
  errorContainer: '#fef2f2',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#1e40af',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#334155',
  onTertiary: '#ffffff',
  onTertiaryContainer: '#047857',
  onSurface: '#0f172a',
  onSurfaceVariant: '#64748b',
  onBackground: '#0f172a',
  onError: '#ffffff',
  onErrorContainer: '#b91c1c',
  outline: '#e2e8f0',
  outlineVariant: '#f1f5f9',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#1e293b',
  inverseOnSurface: '#f8fafc',
  inversePrimary: '#60a5fa',
  surfaceDisabled: '#f8fafc',
  onSurfaceDisabled: '#94a3b8',
  backdrop: 'rgba(0, 0, 0, 0.5)',

  // Custom success colors
  success: '#059669',
  successContainer: '#d1fae5',
  onSuccess: '#ffffff',
  onSuccessContainer: '#047857',

  // Custom warning colors
  warning: '#d97706',
  warningContainer: '#fef3c7',
  onWarning: '#ffffff',
  onWarningContainer: '#b45309',

  // Custom info colors
  info: '#0ea5e9',
  infoContainer: '#e0f2fe',
  onInfo: '#ffffff',
  onInfoContainer: '#0284c7',
};

// Light theme
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...customColors,
  },
  roundness: 8,
};

// Dark theme
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#60a5fa',
    primaryContainer: '#1e40af',
    secondary: '#94a3b8',
    secondaryContainer: '#334155',
    tertiary: '#34d399',
    tertiaryContainer: '#047857',
    surface: '#1e293b',
    surfaceVariant: '#334155',
    background: '#0f172a',
    error: '#f87171',
    errorContainer: '#b91c1c',
    onPrimary: '#ffffff',
    onPrimaryContainer: '#dbeafe',
    onSecondary: '#ffffff',
    onSecondaryContainer: '#f1f5f9',
    onTertiary: '#ffffff',
    onTertiaryContainer: '#d1fae5',
    onSurface: '#f8fafc',
    onSurfaceVariant: '#cbd5e1',
    onBackground: '#f8fafc',
    onError: '#ffffff',
    onErrorContainer: '#fef2f2',
    outline: '#475569',
    outlineVariant: '#334155',
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: '#f8fafc',
    inverseOnSurface: '#1e293b',
    inversePrimary: '#2563eb',
    surfaceDisabled: '#334155',
    onSurfaceDisabled: '#64748b',
    backdrop: 'rgba(0, 0, 0, 0.7)',

    // Custom colors for dark theme
    success: '#34d399',
    successContainer: '#047857',
    onSuccess: '#ffffff',
    onSuccessContainer: '#d1fae5',

    warning: '#fbbf24',
    warningContainer: '#b45309',
    onWarning: '#ffffff',
    onWarningContainer: '#fef3c7',

    info: '#38bdf8',
    infoContainer: '#0284c7',
    onInfo: '#ffffff',
    onInfoContainer: '#e0f2fe',
  },
  roundness: 8,
};

// Default theme (light)
export const theme = lightTheme;

// Typography styles
export const typography = {
  // Headlines
  headlineLarge: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700' as const,
    letterSpacing: 0,
  },
  headlineMedium: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  headlineSmall: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },

  // Titles
  titleLarge: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  titleMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600' as const,
    letterSpacing: 0.15,
  },
  titleSmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
  },

  // Labels
  labelLarge: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
  },

  // Body
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
    letterSpacing: 0.15,
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.4,
  },
};

// Spacing scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Shadow styles
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

// Animation durations
export const animations = {
  fast: 150,
  normal: 250,
  slow: 350,
};

// Border radius scale
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

export default theme;