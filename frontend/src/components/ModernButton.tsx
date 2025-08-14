import React from 'react';
import { Button, ButtonProps, CircularProgress, Box } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { colors, gradients, shadows } from '../theme';

// 🎨 Modern Button Animations
const ripple = keyframes`
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
`;

const shine = keyframes`
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
`;

// 🎨 Modern Styled Button
const ModernStyledButton = styled(Button)(({ theme }) => ({
  borderRadius: 16,
  padding: '14px 28px',
  fontSize: '0.875rem',
  fontWeight: 600,
  textTransform: 'none',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  
  // Shine effect
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
    transition: 'left 0.5s',
  },
  
  '&:hover::before': {
    left: '100%',
  },
  
  // Primary variant
  '&.MuiButton-containedPrimary': {
    background: gradients.primary,
    boxShadow: shadows.colored.primary,
    '&:hover': {
      transform: 'translateY(-3px)',
      boxShadow: `${shadows.colored.primary}, 0 20px 25px -5px rgba(14, 165, 233, 0.3)`,
    },
    '&:active': {
      transform: 'translateY(-1px)',
    },
  },

  // Secondary variant
  '&.MuiButton-containedSecondary': {
    background: gradients.secondary,
    boxShadow: shadows.colored.secondary,
    '&:hover': {
      transform: 'translateY(-3px)',
      boxShadow: `${shadows.colored.secondary}, 0 20px 25px -5px rgba(245, 158, 11, 0.3)`,
    },
  },

  // Success variant
  '&.MuiButton-containedSuccess': {
    background: gradients.success,
    boxShadow: '0 10px 15px -3px rgba(34, 197, 94, 0.3), 0 4px 6px -2px rgba(34, 197, 94, 0.1)',
    '&:hover': {
      transform: 'translateY(-3px)',
      boxShadow: '0 20px 25px -5px rgba(34, 197, 94, 0.4), 0 10px 10px -5px rgba(34, 197, 94, 0.2)',
    },
  },

  // Error variant
  '&.MuiButton-containedError': {
    background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', // warm gradient
    boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.3), 0 4px 6px -2px rgba(239, 68, 68, 0.1)',
    '&:hover': {
      transform: 'translateY(-3px)',
      boxShadow: '0 20px 25px -5px rgba(239, 68, 68, 0.4), 0 10px 10px -5px rgba(239, 68, 68, 0.2)',
    },
  },
  
  // Outlined variant
  '&.MuiButton-outlined': {
    borderWidth: 2,
    borderColor: colors.gray[300],
    color: colors.gray[700],
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    '&:hover': {
      borderColor: colors.primary[500],
      backgroundColor: colors.primary[50],
      transform: 'translateY(-2px)',
      boxShadow: shadows.soft,
    },
  },

  // Text variant
  '&.MuiButton-text': {
    color: colors.gray[600],
    '&:hover': {
      backgroundColor: colors.gray[100],
      color: colors.primary[600],
      transform: 'translateY(-1px)',
    },
  },

  // Loading state
  '&.loading': {
    pointerEvents: 'none',
    animation: `${pulse} 1.5s ease-in-out infinite`,
  },

  // Disabled state
  '&.Mui-disabled': {
    background: colors.gray[200],
    color: colors.gray[400],
    transform: 'none',
    boxShadow: 'none',
  },
  
  // Size variants
  '&.MuiButton-sizeSmall': {
    padding: '8px 16px',
    fontSize: '0.75rem',
    borderRadius: 12,
  },
  
  '&.MuiButton-sizeLarge': {
    padding: '18px 36px',
    fontSize: '1rem',
    borderRadius: 20,
  },
}));

interface ModernButtonProps extends Omit<ButtonProps, 'loading'> {
  loading?: boolean;
  gradient?: boolean;
  glow?: boolean;
}

const ModernButton: React.FC<ModernButtonProps> = ({
  children,
  loading = false,
  gradient = true,
  glow = false,
  disabled,
  startIcon,
  endIcon,
  ...props
}) => {
  return (
    <ModernStyledButton
      {...props}
      disabled={disabled || loading}
      className={`${loading ? 'loading' : ''} ${props.className || ''}`}
      startIcon={loading ? undefined : startIcon}
      endIcon={loading ? undefined : endIcon}
    >
      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress 
            size={16} 
            sx={{ 
              color: 'inherit',
              opacity: 0.8,
            }} 
          />
          <span>Đang xử lý...</span>
        </Box>
      ) : (
        children
      )}
    </ModernStyledButton>
  );
};

export default ModernButton;
