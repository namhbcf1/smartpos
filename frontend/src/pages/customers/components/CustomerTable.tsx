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
  Avatar,
  Box,
  Typography,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Stack,
  Button
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { formatCurrency } from '../../../config/constants';
import { Customer } from './types';

interface CustomerTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customerId: number) => void;
  onViewDetails: (customer: Customer) => void;
  loading: boolean;
}

export const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  onEdit,
  onDelete,
  onViewDetails,
  loading
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, customer: Customer) => {
    setAnchorEl(event.currentTarget);
    setSelectedCustomer(customer);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCustomer(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'warning';
      case 'blocked': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Hoạt động';
      case 'inactive': return 'Không hoạt động';
      case 'blocked': return 'Bị chặn';
      default: return 'Không xác định';
    }
  };

  const getLoyaltyTier = (totalSpent: number) => {
    if (totalSpent >= 50000000) return { tier: 'Bạch kim', color: '#E5E4E2' };
    if (totalSpent >= 20000000) return { tier: 'Vàng', color: '#FFD700' };
    if (totalSpent >= 5000000) return { tier: 'Bạc', color: '#C0C0C0' };
    return { tier: 'Đồng', color: '#CD7F32' };
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    // Format Vietnamese phone number
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    }
    return phone;
  };

  if (isMobile) {
    // Mobile card layout
    return (
      <Box>
        {customers.map((customer) => {
          const loyaltyTier = getLoyaltyTier(customer.total_spent);
          return (
            <Card key={customer.id} sx={{ mb: 2 }}>
              <CardContent>
                <Stack spacing={2}>
                  {/* Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        src={customer.avatar_url}
                        sx={{ 
                          width: 48, 
                          height: 48,
                          bgcolor: customer.customer_type === 'business' ? 'primary.main' : 'secondary.main'
                        }}
                      >
                        {customer.customer_type === 'business' ? <BusinessIcon /> : <PersonIcon />}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {customer.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {customer.customer_type === 'business' ? 'Doanh nghiệp' : 'Cá nhân'}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <IconButton
                      onClick={(e) => handleMenuOpen(e, customer)}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  {/* Contact Info */}
                  <Stack spacing={1}>
                    {customer.phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {formatPhoneNumber(customer.phone)}
                        </Typography>
                      </Box>
                    )}
                    
                    {customer.email && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {customer.email}
                        </Typography>
                      </Box>
                    )}
                    
                    {customer.city && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {customer.city}
                        </Typography>
                      </Box>
                    )}
                  </Stack>

                  {/* Stats */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Tổng chi tiêu
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {formatCurrency(customer.total_spent)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Số đơn hàng
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {customer.total_orders}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Status and Loyalty */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip
                      label={getStatusLabel(customer.status)}
                      color={getStatusColor(customer.status) as any}
                      size="small"
                    />
                    
                    <Chip
                      icon={<StarIcon />}
                      label={loyaltyTier.tier}
                      size="small"
                      sx={{ 
                        bgcolor: loyaltyTier.color,
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </Box>

                  {/* Actions */}
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => onViewDetails(customer)}
                      fullWidth
                    >
                      Xem chi tiết
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => onEdit(customer)}
                      fullWidth
                    >
                      Chỉnh sửa
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
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
              <TableCell>Khách hàng</TableCell>
              <TableCell>Liên hệ</TableCell>
              <TableCell>Loại</TableCell>
              <TableCell align="right">Tổng chi tiêu</TableCell>
              <TableCell align="center">Đơn hàng</TableCell>
              <TableCell align="center">Điểm thưởng</TableCell>
              <TableCell align="center">Hạng</TableCell>
              <TableCell align="center">Trạng thái</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.map((customer) => {
              const loyaltyTier = getLoyaltyTier(customer.total_spent);
              return (
                <TableRow key={customer.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        src={customer.avatar_url}
                        sx={{ 
                          width: 40, 
                          height: 40,
                          bgcolor: customer.customer_type === 'business' ? 'primary.main' : 'secondary.main'
                        }}
                      >
                        {customer.customer_type === 'business' ? <BusinessIcon /> : <PersonIcon />}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {customer.name}
                        </Typography>
                        {customer.company_name && (
                          <Typography variant="caption" color="text.secondary">
                            {customer.company_name}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {formatPhoneNumber(customer.phone)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {customer.email}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      icon={customer.customer_type === 'business' ? <BusinessIcon /> : <PersonIcon />}
                      label={customer.customer_type === 'business' ? 'Doanh nghiệp' : 'Cá nhân'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(customer.total_spent)}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="center">
                    <Typography variant="body2">
                      {customer.total_orders}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="center">
                    <Typography variant="body2" color="primary">
                      {customer.loyalty_points.toLocaleString()}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="center">
                    <Chip
                      icon={<StarIcon />}
                      label={loyaltyTier.tier}
                      size="small"
                      sx={{ 
                        bgcolor: loyaltyTier.color,
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </TableCell>
                  
                  <TableCell align="center">
                    <Chip
                      label={getStatusLabel(customer.status)}
                      color={getStatusColor(customer.status) as any}
                      size="small"
                    />
                  </TableCell>
                  
                  <TableCell align="center">
                    <IconButton
                      onClick={(e) => handleMenuOpen(e, customer)}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
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
          if (selectedCustomer) onViewDetails(selectedCustomer);
          handleMenuClose();
        }}>
          <Typography>Xem chi tiết</Typography>
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedCustomer) onEdit(selectedCustomer);
          handleMenuClose();
        }}>
          <EditIcon sx={{ mr: 1 }} />
          Chỉnh sửa
        </MenuItem>
        <MenuItem 
          onClick={() => {
            if (selectedCustomer) onDelete(selectedCustomer.id);
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Xóa
        </MenuItem>
      </Menu>
    </>
  );
};
