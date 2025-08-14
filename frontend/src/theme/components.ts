// Component overrides - Optimized for performance
import { colors, gradients, shadows, spacing } from './tokens';

export const componentOverrides = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: spacing.borderRadius,
        padding: '12px 24px',
        fontSize: '0.875rem',
        fontWeight: 600,
        textTransform: 'none' as const,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      containedPrimary: {
        background: gradients.primary,
        boxShadow: shadows.colored.primary,
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `${shadows.colored.primary}, 0 20px 25px -5px rgba(14, 165, 233, 0.2)`,
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: spacing.borderRadiusLarge,
        background: 'rgba(255, 255, 255, 0.95)', // Light theme
        backgroundImage: 'none',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${colors.gray[200]}`, // Light border
        boxShadow: shadows.soft,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: shadows.large,
          borderColor: colors.gray[300], // Light hover border
        },
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: spacing.borderRadius,
          backgroundColor: 'rgba(248, 250, 252, 0.8)', // Light background
          backdropFilter: 'blur(10px)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          color: '#1e293b', // Dark text for light theme
          '&:hover': {
            backgroundColor: 'rgba(248, 250, 252, 0.9)',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: colors.primary[500],
            },
          },
          '&.Mui-focused': {
            backgroundColor: 'rgba(255, 255, 255, 1)',
            transform: 'translateY(-2px)',
            boxShadow: shadows.colored.primary,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: colors.primary[500],
              borderWidth: 2,
            },
          },
        },
        '& .MuiInputLabel-root': {
          color: '#64748b', // Medium gray for light theme
          fontWeight: 500,
          '&.Mui-focused': {
            color: colors.primary[500],
          },
        },
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        padding: '16px 20px',
        borderBottom: `1px solid ${colors.gray[200]}`, // Light border
        color: '#1e293b', // Dark text for light theme
      },
      head: {
        fontWeight: 700,
        fontSize: '0.875rem',
        color: '#475569', // Medium dark text
        backgroundColor: 'rgba(248, 250, 252, 0.8)', // Light header background
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
      },
    },
  },
  MuiTableRow: {
    styleOverrides: {
      root: {
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          backgroundColor: 'rgba(14, 165, 233, 0.05)', // Light blue hover
          transform: 'scale(1.01)',
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 20,
        fontWeight: 600,
        fontSize: '0.75rem',
      },
      colorPrimary: {
        backgroundColor: colors.primary[100],
        color: colors.primary[800],
      },
      colorSuccess: {
        backgroundColor: colors.success[100],
        color: colors.success[600],
      },
      colorError: {
        backgroundColor: colors.error[100],
        color: colors.error[600],
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 24,
        background: 'rgba(255, 255, 255, 0.95)', // Light dialog background
        backdropFilter: 'blur(20px)',
        border: `1px solid ${colors.gray[200]}`, // Light border
        boxShadow: shadows.large,
      },
    },
  },
};
