import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  IconButton,
  Tooltip,
  Chip,
  Box,
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  CheckCircle as AccurateIcon,
  Warning as DiscrepancyIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { formatCurrency } from '../../../config/constants';
import { StockCheckItem } from './types';

interface StockCheckTableProps {
  items: StockCheckItem[];
  onItemUpdate: (productId: number, field: keyof StockCheckItem, value: any) => void;
  onItemDelete: (productId: number) => void;
  loading: boolean;
}

export const StockCheckTable: React.FC<StockCheckTableProps> = ({
  items,
  onItemUpdate,
  onItemDelete,
  loading
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Ensure items is always an array
  const safeItems = Array.isArray(items) ? items : [];

  if (!loading && safeItems.length === 0) {
    return (
      <Paper sx={{ py: 6, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Không có dữ liệu kiểm kho để hiển thị.
        </Typography>
      </Paper>
    );
  }

  const getDiscrepancyStatus = (discrepancy: number) => {
    if (discrepancy === 0) {
      return {
        icon: <AccurateIcon color="success" />,
        label: 'Chính xác',
        color: 'success' as const
      };
    } else {
      return {
        icon: <DiscrepancyIcon color="error" />,
        label: `Lệch ${discrepancy > 0 ? '+' : ''}${discrepancy}`,
        color: 'error' as const
      };
    }
  };

  const handleActualQuantityChange = (productId: number, value: string) => {
    const numValue = parseInt(value) || 0;
    onItemUpdate(productId, 'actual_quantity', numValue);
  };

  const handleNotesChange = (productId: number, value: string) => {
    onItemUpdate(productId, 'notes', value);
  };

  if (isMobile) {
    // Mobile card layout
    return (
      <Box>
        {safeItems.map((item) => {
          const status = getDiscrepancyStatus(item.discrepancy);
          return (
            <Paper key={item.product_id} sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {item.product_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    SKU: {item.product_sku}
                  </Typography>
                </Box>
                <Chip
                  icon={status.icon}
                  label={status.label}
                  color={status.color}
                  size="small"
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Dự kiến
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {item.expected_quantity}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Thực tế
                  </Typography>
                  <TextField
                    type="number"
                    value={item.actual_quantity}
                    onChange={(e) => handleActualQuantityChange(item.product_id, e.target.value)}
                    size="small"
                    fullWidth
                    disabled={loading}
                  />
                </Box>
              </Box>

              <TextField
                placeholder="Ghi chú..."
                value={item.notes || ''}
                onChange={(e) => handleNotesChange(item.product_id, e.target.value)}
                size="small"
                fullWidth
                multiline
                rows={2}
                disabled={loading}
                sx={{ mb: 1 }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Tooltip title="Xóa">
                  <IconButton
                    onClick={() => onItemDelete(item.product_id)}
                    color="error"
                    size="small"
                    disabled={loading}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Paper>
          );
        })}
      </Box>
    );
  }

  // Desktop table layout
  return (
    <TableContainer component={Paper}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Sản phẩm</TableCell>
            <TableCell>SKU</TableCell>
            <TableCell align="center">Dự kiến</TableCell>
            <TableCell align="center">Thực tế</TableCell>
            <TableCell align="center">Sai lệch</TableCell>
            <TableCell>Ghi chú</TableCell>
            <TableCell align="center">Thao tác</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {safeItems.map((item, idx) => {
            const status = getDiscrepancyStatus(item.discrepancy);
            return (
              <TableRow key={item.product_id} sx={{ bgcolor: idx % 2 === 1 ? 'action.hover' : 'inherit' }}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {item.product_name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {item.product_sku}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2">
                    {item.expected_quantity}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <TextField
                    type="number"
                    value={item.actual_quantity}
                    onChange={(e) => handleActualQuantityChange(item.product_id, e.target.value)}
                    size="small"
                    sx={{ width: 88 }}
                    disabled={loading}
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    icon={status.icon}
                    label={status.label}
                    color={status.color}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    placeholder="Ghi chú..."
                    value={item.notes || ''}
                    onChange={(e) => handleNotesChange(item.product_id, e.target.value)}
                    size="small"
                    sx={{ minWidth: 180 }}
                    disabled={loading}
                  />
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Xóa">
                    <IconButton
                      onClick={() => onItemDelete(item.product_id)}
                      color="error"
                      size="small"
                      disabled={loading}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
