import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  Box,
  Typography,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Stack,
  Button,
  Avatar
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Schedule as PendingIcon,
  CheckCircle as CompletedIcon,
  Cancel as CancelledIcon,
  Assignment as OrderIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  LocalShipping as DeliveryIcon,
  Store as StoreIcon
} from '@mui/icons-material';
import { formatCurrency } from '../../../config/constants';
import { Order } from './types';

interface OrdersTableProps {
  orders: Order[];
  onViewDetails: (order: Order) => void;
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (orderId: number) => void;
  onUpdateStatus: (orderId: number, status: string) => void;
  loading: boolean;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  onViewDetails,
  onEditOrder,
  onDeleteOrder,
  onUpdateStatus,
  loading
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, order: Order) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrder(order);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOrder(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'confirmed': return 'info';
      case 'preparing': return 'warning';
      case 'ready': return 'primary';
      case 'pending': return 'default';
      case 'cancelled': return 'error';
      case 'refunded': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ xác nhận';
      case 'confirmed': return 'Đã xác nhận';
      case 'preparing': return 'Đang chuẩn bị';
      case 'ready': return 'Sẵn sàng';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      case 'refunded': return 'Đã hoàn tiền';
      default: return 'Không xác định';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CompletedIcon />;
      case 'confirmed': return <OrderIcon />;
      case 'preparing': return <PendingIcon />;
      case 'ready': return <CheckCircle />;
      case 'pending': return <PendingIcon />;
      case 'cancelled': return <CancelledIcon />;
      case 'refunded': return <CancelledIcon />;
      default: return <PendingIcon />;
    }
  };

  const getOrderTypeLabel = (type: string) => {
    switch (type) {
      case 'in_store': return 'Tại cửa hàng';
      case 'online': return 'Trực tuyến';
      case 'phone': return 'Điện thoại';
      case 'delivery': return 'Giao hàng';
      default: return 'Không xác định';
    }
  };

  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case 'in_store': return <StoreIcon />;
      case 'online': return <OrderIcon />;
      case 'phone': return <PhoneIcon />;
      case 'delivery': return <DeliveryIcon />;
      default: return <OrderIcon />;
    }
  };

  if (isMobile) {
    // Mobile card layout
    return (
      <Box>
        {orders.map((order) => (
          <Card key={order.id} sx={{ mb: 2 }}>
            <CardContent>
              <Stack spacing={2}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      #{order.order_number}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(order.order_date).toLocaleDateString('vi-VN')} {new Date(order.order_date).toLocaleTimeString('vi-VN')}
                    </Typography>
                  </Box>
                  
                  <IconButton
                    onClick={(e) => handleMenuOpen(e, order)}
                    size="small"
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>

                {/* Customer & Type */}
                <Stack direction="row" spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 24, height: 24 }}>
                      <PersonIcon fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {order.customer_name || 'Khách lẻ'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {order.customer_phone}
                      </Typography>
                    </Box>
                  </Box>
                </Stack>

                {/* Amount & Items */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Tổng tiền
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary">
                      {formatCurrency(order.total_amount)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Số sản phẩm
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {order.items_count} sản phẩm
                    </Typography>
                  </Box>
                </Box>

                {/* Status & Type */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip
                    icon={getStatusIcon(order.status)}
                    label={getStatusLabel(order.status)}
                    color={getStatusColor(order.status) as any}
                    size="small"
                  />
                  
                  <Chip
                    icon={getOrderTypeIcon(order.order_type)}
                    label={getOrderTypeLabel(order.order_type)}
                    variant="outlined"
                    size="small"
                  />
                </Box>

                {/* Actions */}
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onViewDetails(order)}
                    fullWidth
                  >
                    Xem chi tiết
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => onEditOrder(order)}
                    fullWidth
                  >
                    Chỉnh sửa
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  // Desktop table layout
  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Mã đơn hàng</TableCell>
              <TableCell>Khách hàng</TableCell>
              <TableCell>Loại đơn</TableCell>
              <TableCell align="right">Tổng tiền</TableCell>
              <TableCell align="center">Sản phẩm</TableCell>
              <TableCell align="center">Trạng thái</TableCell>
              <TableCell align="center">Thanh toán</TableCell>
              <TableCell>Thời gian</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    #{order.order_number}
                  </Typography>
                </TableCell>
                
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {order.customer_name || 'Khách lẻ'}
                    </Typography>
                    {order.customer_phone && (
                      <Typography variant="caption" color="text.secondary">
                        {order.customer_phone}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Chip
                    icon={getOrderTypeIcon(order.order_type)}
                    label={getOrderTypeLabel(order.order_type)}
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
                
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="bold" color="primary">
                    {formatCurrency(order.total_amount)}
                  </Typography>
                  {order.discount_amount > 0 && (
                    <Typography variant="caption" color="secondary">
                      Giảm: {formatCurrency(order.discount_amount)}
                    </Typography>
                  )}
                </TableCell>
                
                <TableCell align="center">
                  <Typography variant="body2">
                    {order.items_count}
                  </Typography>
                </TableCell>
                
                <TableCell align="center">
                  <Chip
                    icon={getStatusIcon(order.status)}
                    label={getStatusLabel(order.status)}
                    color={getStatusColor(order.status) as any}
                    size="small"
                  />
                </TableCell>
                
                <TableCell align="center">
                  <Chip
                    label={order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    color={order.payment_status === 'paid' ? 'success' : 'warning'}
                    size="small"
                  />
                </TableCell>
                
                <TableCell>
                  <Box>
                    <Typography variant="body2">
                      {new Date(order.order_date).toLocaleDateString('vi-VN')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(order.order_date).toLocaleTimeString('vi-VN')}
                    </Typography>
                  </Box>
                </TableCell>
                
                <TableCell align="center">
                  <IconButton
                    onClick={(e) => handleMenuOpen(e, order)}
                    size="small"
                  >
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          if (selectedOrder) onViewDetails(selectedOrder);
          handleMenuClose();
        }}>
          <ViewIcon sx={{ mr: 1 }} />
          Xem chi tiết
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedOrder) onEditOrder(selectedOrder);
          handleMenuClose();
        }}>
          <EditIcon sx={{ mr: 1 }} />
          Chỉnh sửa
        </MenuItem>
        {selectedOrder?.status === 'pending' && (
          <MenuItem onClick={() => {
            if (selectedOrder) onUpdateStatus(selectedOrder.id, 'confirmed');
            handleMenuClose();
          }}>
            <CheckCircle sx={{ mr: 1 }} />
            Xác nhận đơn
          </MenuItem>
        )}
        {selectedOrder?.status !== 'cancelled' && selectedOrder?.status !== 'completed' && (
          <MenuItem 
            onClick={() => {
              if (selectedOrder) onDeleteOrder(selectedOrder.id);
              handleMenuClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon sx={{ mr: 1 }} />
            Hủy đơn
          </MenuItem>
        )}
      </Menu>
    </>
  );
};
