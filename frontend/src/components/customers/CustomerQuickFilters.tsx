import React from 'react';
import {
  Box,
  Chip,
  Badge,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Star,
  Diamond,
  Person,
  Cake,
  TrendingUp,
  FiberNew,
  Warning,
  AllInclusive
} from '@mui/icons-material';

export interface QuickFilterOption {
  key: string;
  label: string;
  icon: React.ReactNode;
  color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  count?: number;
  tooltip?: string;
}

interface CustomerQuickFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  customerCounts?: {
    total: number;
    vip: number;
    premium: number;
    regular: number;
    new: number;
    birthday: number;
    highValue: number;
    atRisk: number;
  };
  compact?: boolean;
}

const CustomerQuickFilters: React.FC<CustomerQuickFiltersProps> = ({
  activeFilter,
  onFilterChange,
  customerCounts,
  compact = false
}) => {
  const filters: QuickFilterOption[] = [
    {
      key: 'all',
      label: 'Tất cả',
      icon: <AllInclusive />,
      color: 'default',
      count: customerCounts?.total,
      tooltip: 'Hiển thị tất cả khách hàng'
    },
    {
      key: 'vip',
      label: 'VIP',
      icon: <Diamond />,
      color: 'error',
      count: customerCounts?.vip,
      tooltip: 'Khách hàng VIP - Giá trị cao nhất'
    },
    {
      key: 'premium',
      label: 'Premium',
      icon: <Star />,
      color: 'warning',
      count: customerCounts?.premium,
      tooltip: 'Khách hàng Premium - Tiềm năng cao'
    },
    {
      key: 'regular',
      label: 'Thường',
      icon: <Person />,
      color: 'success',
      count: customerCounts?.regular,
      tooltip: 'Khách hàng thường xuyên'
    },
    {
      key: 'new',
      label: 'Mới',
      icon: <FiberNew />,
      color: 'info',
      count: customerCounts?.new,
      tooltip: 'Khách hàng mới trong 30 ngày qua'
    },
    {
      key: 'birthday',
      label: 'Sinh nhật',
      icon: <Cake />,
      color: 'secondary',
      count: customerCounts?.birthday,
      tooltip: 'Sinh nhật trong tháng này'
    },
    {
      key: 'high_value',
      label: 'Giá trị cao',
      icon: <TrendingUp />,
      color: 'success',
      count: customerCounts?.highValue,
      tooltip: 'Tổng chi tiêu > 10 triệu'
    },
    {
      key: 'at_risk',
      label: 'Rủi ro',
      icon: <Warning />,
      color: 'error',
      count: customerCounts?.atRisk,
      tooltip: 'Không mua hàng > 90 ngày'
    }
  ];

  if (compact) {
    return (
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {filters.map((filter) => (
          <Tooltip key={filter.key} title={filter.tooltip || filter.label}>
            <IconButton
              size="small"
              onClick={() => onFilterChange(filter.key)}
              sx={{
                borderRadius: 2,
                border: '1px solid',
                borderColor: activeFilter === filter.key ? `${filter.color}.main` : 'divider',
                bgcolor: activeFilter === filter.key ? `${filter.color}.light` : 'transparent',
                '&:hover': {
                  bgcolor: `${filter.color}.light`,
                  borderColor: `${filter.color}.main`
                }
              }}
            >
              <Badge badgeContent={filter.count} color={filter.color} max={999}>
                {filter.icon}
              </Badge>
            </IconButton>
          </Tooltip>
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
      {filters.map((filter) => (
        <Tooltip key={filter.key} title={filter.tooltip || ''}>
          <Chip
            icon={filter.icon as any}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>{filter.label}</span>
                {filter.count !== undefined && (
                  <Badge
                    badgeContent={filter.count}
                    color={filter.color}
                    max={999}
                    sx={{
                      '& .MuiBadge-badge': {
                        position: 'relative',
                        transform: 'none',
                        fontSize: '0.7rem',
                        height: 18,
                        minWidth: 18,
                        padding: '0 4px'
                      }
                    }}
                  />
                )}
              </Box>
            }
            onClick={() => onFilterChange(filter.key)}
            color={activeFilter === filter.key ? filter.color : 'default'}
            variant={activeFilter === filter.key ? 'filled' : 'outlined'}
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              px: 1.5,
              py: 2.5,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              },
              ...(activeFilter === filter.key && {
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              })
            }}
          />
        </Tooltip>
      ))}
    </Box>
  );
};

export default CustomerQuickFilters;
