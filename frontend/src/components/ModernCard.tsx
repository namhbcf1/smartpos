import React from 'react';
import { Card, CardContent, CardActions, Box, alpha } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { colors, gradients, shadows } from '../theme';

// 🎨 Modern Card Animations
const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`;

const glow = keyframes`
  0%, 100% {
    box-shadow: 0 0 20px rgba(14, 165, 233, 0.3);
  }
  50% {
    box-shadow: 0 0 30px rgba(14, 165, 233, 0.6);
  }
`;

// 🎨 Modern Styled Card
const ModernStyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 24,
  background: 'rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(20px)',
  border: `1px solid ${colors.gray[200]}`,
  boxShadow: shadows.soft,
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',

  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: `linear-gradient(
      90deg,
      transparent,
      ${alpha(colors.primary[500], 0.1)},
      transparent
    )`,
    transition: 'left 0.6s',
  },

  '&:hover': {
    transform: 'translateY(-8px) scale(1.02)',
    boxShadow: shadows.large,
    borderColor: colors.primary[300],

    '&::before': {
      left: '100%',
    },
  },

  '&.featured': {
    background: `linear-gradient(135deg,
      rgba(255, 255, 255, 0.9) 0%,
      rgba(14, 165, 233, 0.05) 100%
    )`,
    borderColor: colors.primary[300],
    animation: `${glow} 3s ease-in-out infinite`,
  },
  
  '&.loading': {
    background: `
      linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)
    `,
    backgroundSize: '200px 100%',
    animation: `${shimmer} 1.5s infinite`,
  },
}));

const GradientOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: '4px',
  background: gradients.primary,
  borderRadius: '24px 24px 0 0',
}));

const FloatingIcon = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 16,
  right: 16,
  width: 48,
  height: 48,
  borderRadius: '50%',
  background: gradients.primary,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  boxShadow: shadows.colored.primary,
  animation: `${float} 3s ease-in-out infinite`,

  '& svg': {
    fontSize: '1.5rem',
  },
}));

interface ModernCardProps {
  children: React.ReactNode;
  featured?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  gradient?: boolean;
  onClick?: () => void;
  className?: string;
}

const ModernCard: React.FC<ModernCardProps> = ({
  children,
  featured = false,
  loading = false,
  icon,
  gradient = true,
  onClick,
  className,
  ...props
}) => {
  return (
    <ModernStyledCard
      className={`
        ${featured ? 'featured' : ''} 
        ${loading ? 'loading' : ''} 
        ${className || ''}
      `.trim()}
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
      }}
      {...props}
    >
      {gradient && <GradientOverlay />}
      {icon && <FloatingIcon>{icon}</FloatingIcon>}
      {children}
    </ModernStyledCard>
  );
};

export default ModernCard;
