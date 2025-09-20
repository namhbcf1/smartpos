import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Box,
  Divider,
  Stack,
  TextField,
  Chip,
  Avatar,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingCart as CartIcon,
  Payment as PaymentIcon,
  Clear as ClearIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { formatCurrency } from '../../../config/constants';
import { CartItem, Customer } from './types';

interface ShoppingCartProps {
  items: CartItem[];
  customer?: Customer;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onApplyDiscount: () => void;
  onEditItem: (item: CartItem) => void;
  onCheckout: () => void;
  loading: boolean;
}

export const ShoppingCart: React.FC<ShoppingCartProps> = ({
  items,
  customer,
  subtotal,
  discountAmount,
  taxAmount,
  total,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onApplyDiscount,
  onEditItem,
  onCheckout,
  loading
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  if (items.length === 0) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 4,
              textAlign: 'center'
            }}
          >
            <Avatar sx={{ width: 64, height: 64, bgcolor: 'grey.300', mb: 2 }}>
              <CartIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Giỏ hàng trống
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Thêm sản phẩm vào giỏ hàng để bắt đầu
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            Giỏ hàng ({itemCount} sản phẩm)
          </Typography>
          
          <Button
            startIcon={<ClearIcon />}
            onClick={onClearCart}
            color="error"
            size="small"
            variant="outlined"
          >
            Xóa tất cả
          </Button>
        </Stack>

        {/* Cart Items */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', maxHeight: 400 }}>
          <List dense>
            {Array.isArray(items) && items.length > 0 ? items.map((item, index) => (
              <React.Fragment key={item.id}>
                <ListItem
                  sx={{
                    px: 0,
                    py: 1,
                    alignItems: 'flex-start'
                  }}
                >
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {item.product.name}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">
                      {formatCurrency(item.unit_price)} x {item.quantity}
                    </Typography>
                    
                    {item.discount_amount > 0 && (
                      <Chip
                        label={`Giảm ${formatCurrency(item.discount_amount)}`}
                        size="small"
                        color="secondary"
                        sx={{ mt: 0.5 }}
                      />
                    )}

                    {/* Quantity Controls */}
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      
                      <TextField
                        value={item.quantity}
                        onChange={(e) => {
                          const qty = parseInt(e.target.value) || 1;
                          onUpdateQuantity(item.id, qty);
                        }}
                        size="small"
                        sx={{ width: 60 }}
                        inputProps={{ 
                          style: { textAlign: 'center' },
                          min: 1,
                          type: 'number'
                        }}
                      />
                      
                      <IconButton
                        size="small"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Box>

                  <Box sx={{ textAlign: 'right', ml: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {formatCurrency(item.total_amount)}
                    </Typography>
                    
                    <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => onEditItem(item)}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      
                      <IconButton
                        size="small"
                        onClick={() => onRemoveItem(item.id)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Box>
                </ListItem>
                
                {index < items.length - 1 && <Divider />}
              </React.Fragment>
            )) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  Giỏ hàng trống
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Thêm sản phẩm để bắt đầu bán hàng
                </Typography>
              </Box>
            )}
          </List>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Summary */}
        <Box>
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2">Tạm tính:</Typography>
              <Typography variant="body2">{formatCurrency(subtotal)}</Typography>
            </Stack>
            
            {discountAmount > 0 && (
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="secondary">Giảm giá:</Typography>
                <Typography variant="body2" color="secondary">
                  -{formatCurrency(discountAmount)}
                </Typography>
              </Stack>
            )}
            
            {taxAmount > 0 && (
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Thuế:</Typography>
                <Typography variant="body2">{formatCurrency(taxAmount)}</Typography>
              </Stack>
            )}
            
            <Divider />
            
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="h6" fontWeight="bold">Tổng cộng:</Typography>
              <Typography variant="h6" fontWeight="bold" color="primary">
                {formatCurrency(total)}
              </Typography>
            </Stack>
          </Stack>

          {/* Customer Discount */}
          {customer?.discount_percentage && (
            <Box sx={{ mt: 2, p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
              <Typography variant="body2" color="success.dark">
                Khách hàng VIP: Giảm {customer.discount_percentage}%
              </Typography>
            </Box>
          )}

          {/* Action Buttons */}
          <Stack spacing={1} sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              onClick={onApplyDiscount}
              fullWidth
              size={isMobile ? "small" : "medium"}
            >
              Áp dụng giảm giá
            </Button>
            
            <Button
              variant="contained"
              startIcon={<PaymentIcon />}
              onClick={onCheckout}
              disabled={loading || items.length === 0}
              fullWidth
              size={isMobile ? "medium" : "large"}
              sx={{ py: 1.5 }}
            >
              Thanh toán ({formatCurrency(total)})
            </Button>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
};
