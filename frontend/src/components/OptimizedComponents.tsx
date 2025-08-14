/**
 * OPTIMIZED: React components with proper memoization and performance optimizations
 * Fixes: Excessive re-renders, missing memoization, props drilling
 */

import React, { memo, useMemo, useCallback, useState } from 'react';
import { 
  Card, 
  CardContent, 
  Button, 
  CircularProgress, 
  Typography,
  Box,
  Skeleton
} from '@mui/material';

// ============================================================================
// OPTIMIZED CARD COMPONENT
// ============================================================================

interface OptimizedCardProps {
  children: React.ReactNode;
  loading?: boolean;
  featured?: boolean;
  onClick?: () => void;
  className?: string;
  elevation?: number;
}

export const OptimizedCard = memo<OptimizedCardProps>(({
  children,
  loading = false,
  featured = false,
  onClick,
  className = '',
  elevation = 1
}) => {
  // Memoize styles to prevent recalculation
  const cardStyles = useMemo(() => ({
    cursor: onClick ? 'pointer' : 'default',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    background: featured 
      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      : undefined,
    color: featured ? 'white' : undefined,
    '&:hover': onClick ? {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
    } : undefined,
  }), [onClick, featured]);

  // Memoize click handler
  const handleClick = useCallback(() => {
    if (onClick && !loading) {
      onClick();
    }
  }, [onClick, loading]);

  if (loading) {
    return (
      <Card elevation={elevation} className={className}>
        <CardContent>
          <Skeleton variant="rectangular" height={100} />
          <Skeleton variant="text" sx={{ mt: 1 }} />
          <Skeleton variant="text" width="60%" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      elevation={elevation}
      className={className}
      sx={cardStyles}
      onClick={handleClick}
    >
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
});

OptimizedCard.displayName = 'OptimizedCard';

// ============================================================================
// OPTIMIZED BUTTON COMPONENT
// ============================================================================

interface OptimizedButtonProps {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'contained' | 'outlined' | 'text';
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
}

export const OptimizedButton = memo<OptimizedButtonProps>(({
  children,
  loading = false,
  disabled = false,
  variant = 'contained',
  color = 'primary',
  size = 'medium',
  onClick,
  startIcon,
  endIcon,
  fullWidth = false,
  className = ''
}) => {
  // Memoize button props to prevent unnecessary re-renders
  const buttonProps = useMemo(() => ({
    variant,
    color,
    size,
    fullWidth,
    disabled: disabled || loading,
    className,
    startIcon: loading ? undefined : startIcon,
    endIcon: loading ? undefined : endIcon,
  }), [variant, color, size, fullWidth, disabled, loading, className, startIcon, endIcon]);

  // Memoize click handler
  const handleClick = useCallback(() => {
    if (onClick && !loading && !disabled) {
      onClick();
    }
  }, [onClick, loading, disabled]);

  return (
    <Button
      {...buttonProps}
      onClick={handleClick}
    >
      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={16} color="inherit" />
          <span>Loading...</span>
        </Box>
      ) : (
        children
      )}
    </Button>
  );
});

OptimizedButton.displayName = 'OptimizedButton';

// ============================================================================
// OPTIMIZED DATA TABLE COMPONENT
// ============================================================================

interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string | number;
}

interface OptimizedDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  keyField: keyof T;
  emptyMessage?: string;
  pageSize?: number;
}

export const OptimizedDataTable = memo(<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  onRowClick,
  keyField,
  emptyMessage = 'No data available',
  pageSize = 10
}: OptimizedDataTableProps<T>) => {
  const [page, setPage] = useState(0);
  const [sortField, setSortField] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Memoize sorted and paginated data
  const processedData = useMemo(() => {
    let sortedData = [...data];

    // Apply sorting
    if (sortField) {
      sortedData.sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Apply pagination
    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [data, sortField, sortDirection, page, pageSize]);

  // Memoize total pages
  const totalPages = useMemo(() => Math.ceil(data.length / pageSize), [data.length, pageSize]);

  // Memoize sort handler
  const handleSort = useCallback((field: keyof T) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setPage(0); // Reset to first page when sorting
  }, [sortField]);

  // Memoize row click handler
  const handleRowClick = useCallback((row: T) => {
    if (onRowClick) {
      onRowClick(row);
    }
  }, [onRowClick]);

  if (loading) {
    return (
      <Box>
        {Array.from({ length: pageSize }).map((_, index) => (
          <Skeleton key={index} variant="rectangular" height={50} sx={{ mb: 1 }} />
        ))}
      </Box>
    );
  }

  if (data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Table Header */}
      <Box sx={{ display: 'flex', fontWeight: 'bold', borderBottom: 1, borderColor: 'divider', pb: 1, mb: 1 }}>
        {columns.map((column) => (
          <Box
            key={String(column.key)}
            sx={{
              flex: column.width || 1,
              cursor: column.sortable ? 'pointer' : 'default',
              '&:hover': column.sortable ? { backgroundColor: 'action.hover' } : undefined,
            }}
            onClick={column.sortable ? () => handleSort(column.key) : undefined}
          >
            {column.label}
            {sortField === column.key && (
              <span>{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
            )}
          </Box>
        ))}
      </Box>

      {/* Table Body */}
      {processedData.map((row) => (
        <Box
          key={String(row[keyField])}
          sx={{
            display: 'flex',
            borderBottom: 1,
            borderColor: 'divider',
            py: 1,
            cursor: onRowClick ? 'pointer' : 'default',
            '&:hover': onRowClick ? { backgroundColor: 'action.hover' } : undefined,
          }}
          onClick={() => handleRowClick(row)}
        >
          {columns.map((column) => (
            <Box key={String(column.key)} sx={{ flex: column.width || 1 }}>
              {column.render ? column.render(row[column.key], row) : String(row[column.key] || '')}
            </Box>
          ))}
        </Box>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 1 }}>
          <OptimizedButton
            disabled={page === 0}
            onClick={() => setPage(prev => Math.max(0, prev - 1))}
            size="small"
          >
            Previous
          </OptimizedButton>
          
          <Typography variant="body2" sx={{ alignSelf: 'center', mx: 2 }}>
            Page {page + 1} of {totalPages}
          </Typography>
          
          <OptimizedButton
            disabled={page >= totalPages - 1}
            onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
            size="small"
          >
            Next
          </OptimizedButton>
        </Box>
      )}
    </Box>
  );
}) as <T extends Record<string, any>>(props: OptimizedDataTableProps<T>) => JSX.Element;

OptimizedDataTable.displayName = 'OptimizedDataTable';

// ============================================================================
// OPTIMIZED LOADING COMPONENT
// ============================================================================

interface OptimizedLoadingProps {
  size?: number;
  message?: string;
  fullScreen?: boolean;
}

export const OptimizedLoading = memo<OptimizedLoadingProps>(({
  size = 40,
  message = 'Loading...',
  fullScreen = false
}) => {
  const containerStyles = useMemo(() => ({
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    ...(fullScreen ? {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      zIndex: 9999,
    } : {
      py: 4,
    }),
  }), [fullScreen]);

  return (
    <Box sx={containerStyles}>
      <CircularProgress size={size} />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
});

OptimizedLoading.displayName = 'OptimizedLoading';
