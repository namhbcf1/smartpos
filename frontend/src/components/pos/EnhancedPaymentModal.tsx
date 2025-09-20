import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Typography,
  Divider,
  Box,
  Chip,
  InputAdornment,
  Autocomplete,
  Alert,
  useTheme,
  IconButton,
  Avatar,
  Stack,
  Fade,
  Zoom
} from '@mui/material';
import {
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  Phone as PhoneIcon,
  AccountBalance as BankIcon,
  MonetizationOn as CashIcon,
  CreditCard as CardIcon,
  AccountBalanceWallet as WalletIcon,
  Close as CloseIcon,
  Calculate as CalculateIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';

interface PaymentItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

interface EnhancedPaymentModalProps {
  open: boolean;
  onClose: () => void;
  onPayment: (paymentData: any) => void;
  items: PaymentItem[];
  subtotal: number;
  tax: number;
  total: number;
  customers?: Customer[];
  isProcessing?: boolean;
}

const paymentMethods = [
  {
    value: 'cash',
    label: 'Tiền mặt',
    icon: <CashIcon />,
    color: '#4CAF50',
    description: 'Thanh toán bằng tiền mặt'
  },
  {
    value: 'bank_transfer',
    label: 'Chuyển khoản',
    icon: <BankIcon />,
    color: '#2196F3',
    description: 'Chuyển khoản ngân hàng'
  },
  {
    value: 'credit_card',
    label: 'Thẻ tín dụng',
    icon: <CardIcon />,
    color: '#FF9800',
    description: 'Thanh toán bằng thẻ'
  },
  {
    value: 'momo',
    label: 'Ví MoMo',
    icon: <WalletIcon />,
    color: '#D82D8B',
    description: 'Thanh toán qua MoMo'
  },
  {
    value: 'zalopay',
    label: 'ZaloPay',
    icon: <WalletIcon />,
    color: '#0068FF',
    description: 'Thanh toán qua ZaloPay'
  },
];

const quickAmounts = [
  { label: 'Đúng số', factor: 1 },
  { label: '50K', value: 50000 },
  { label: '100K', value: 100000 },
  { label: '200K', value: 200000 },
  { label: '500K', value: 500000 },
];

export default function EnhancedPaymentModal({
  open,
  onClose,
  onPayment,
  items,
  subtotal,
  tax,
  total,
  customers = [],
  isProcessing = false
}: EnhancedPaymentModalProps) {
  const theme = useTheme();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState(total.toString());
  const [referenceCode, setReferenceCode] = useState('');
  const [notes, setNotes] = useState('');

  const change = Math.max(0, parseFloat(amountReceived || '0') - total);
  const isValidPayment = parseFloat(amountReceived || '0') >= total;

  // Auto focus on phone input when modal opens
  useEffect(() => {
    if (open) {
      setAmountReceived(total.toString());
      setTimeout(() => {
        const phoneInput = document.getElementById('customer-phone-enhanced');
        phoneInput?.focus();
      }, 100);
    }
  }, [open, total]);

  // Handle customer selection
  const handleCustomerSelect = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    if (customer) {
      setCustomerPhone(customer.phone);
      setCustomerName(customer.name);
    }
  };

  // Handle phone input change with autocomplete
  const handlePhoneChange = (value: string) => {
    setCustomerPhone(value);

    // Find customer by phone
    const foundCustomer = customers.find(c => c.phone.includes(value));
    if (foundCustomer && value.length >= 3) {
      setSelectedCustomer(foundCustomer);
      setCustomerName(foundCustomer.name);
    } else {
      setSelectedCustomer(null);
      if (!foundCustomer) {
        setCustomerName('');
      }
    }
  };

  // Handle payment method change
  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
    // For non-cash payments, set exact amount
    if (method !== 'cash') {
      setAmountReceived(total.toString());
    }
  };

  // Handle quick amount selection
  const handleQuickAmount = (amount: any) => {
    const value = amount.value || (amount.factor * total);
    setAmountReceived(value.toString());
  };

  const handlePayment = () => {
    const paymentData = {
      customer: {
        phone: customerPhone,
        name: customerName,
        id: selectedCustomer?.id
      },
      payment: {
        method: paymentMethod,
        amountReceived: parseFloat(amountReceived),
        change,
        referenceCode,
        notes
      },
      items,
      totals: {
        subtotal,
        tax,
        total
      }
    };

    onPayment(paymentData);
  };

  const selectedPaymentMethod = paymentMethods.find(pm => pm.value === paymentMethod);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <Dialog
      open={open}
      onClose={!isProcessing ? onClose : undefined}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '95vh',
          background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)'
        }
      }}
      TransitionComponent={Fade}
      transitionDuration={300}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pb: 1,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '12px 12px 0 0'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
            <PaymentIcon />
          </Avatar>
          <Typography variant="h5" fontWeight="bold">
            Thanh toán đơn hàng
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          disabled={isProcessing}
          sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 3 }}>
        <Grid container spacing={3}>
          {/* Customer Section */}
          <Grid item xs={12}>
            <Zoom in={open} style={{ transitionDelay: '100ms' }}>
              <Card
                elevation={0}
                sx={{
                  border: '1px solid #e3f2fd',
                  borderRadius: 2,
                  background: 'linear-gradient(145deg, #e3f2fd 0%, #f3e5f5 100%)'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                    <Avatar sx={{ bgcolor: '#1976d2', width: 32, height: 32 }}>
                      <PersonIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="h6" fontWeight="600" color="primary">
                      Thông tin khách hàng
                    </Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        id="customer-phone-enhanced"
                        label="Số điện thoại"
                        value={customerPhone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        fullWidth
                        variant="outlined"
                        disabled={isProcessing}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PhoneIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                        placeholder="Nhập số điện thoại khách hàng"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Autocomplete
                        value={selectedCustomer}
                        onChange={(_, customer) => handleCustomerSelect(customer)}
                        options={customers}
                        getOptionLabel={(customer) => customer.name}
                        disabled={isProcessing}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Tên khách hàng"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="Tên khách hàng"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                              }
                            }}
                          />
                        )}
                        freeSolo
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>

          {/* Order Summary Section */}
          <Grid item xs={12} md={6}>
            <Zoom in={open} style={{ transitionDelay: '200ms' }}>
              <Card
                elevation={0}
                sx={{
                  border: '1px solid #e8f5e8',
                  borderRadius: 2,
                  height: 'fit-content',
                  background: 'linear-gradient(145deg, #e8f5e8 0%, #f1f8e9 100%)'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                    <Avatar sx={{ bgcolor: '#4caf50', width: 32, height: 32 }}>
                      <ReceiptIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="h6" fontWeight="600" color="#2e7d32">
                      Chi tiết đơn hàng
                    </Typography>
                  </Box>

                  {/* Items */}
                  <Box sx={{ mb: 2 }}>
                    {items.map((item, index) => (
                      <Box
                        key={item.id || index}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          py: 1.5,
                          px: 2,
                          borderRadius: 1,
                          bgcolor: 'rgba(255,255,255,0.7)',
                          mb: 1,
                          border: '1px solid rgba(76,175,80,0.1)'
                        }}
                      >
                        <Box>
                          <Typography variant="body1" fontWeight="500">
                            {item.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.quantity} × {formatCurrency(item.price)}
                          </Typography>
                        </Box>
                        <Typography variant="h6" fontWeight="bold" color="primary">
                          {formatCurrency(item.total || item.price * item.quantity)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Totals */}
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body1" color="text.secondary">
                        Tạm tính
                      </Typography>
                      <Typography variant="body1" fontWeight="500">
                        {formatCurrency(subtotal)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body1" color="text.secondary">
                        Thuế ({((tax / subtotal) * 100).toFixed(0)}%)
                      </Typography>
                      <Typography variant="body1" fontWeight="500">
                        {formatCurrency(tax)}
                      </Typography>
                    </Box>

                    <Divider />

                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      py: 1,
                      bgcolor: 'rgba(46,125,50,0.1)',
                      borderRadius: 1,
                      px: 2
                    }}>
                      <Typography variant="h6" fontWeight="bold">
                        Tổng cộng
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" color="primary">
                        {formatCurrency(total)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>

          {/* Payment Section */}
          <Grid item xs={12} md={6}>
            <Zoom in={open} style={{ transitionDelay: '300ms' }}>
              <Card
                elevation={0}
                sx={{
                  border: '1px solid #fff3e0',
                  borderRadius: 2,
                  background: 'linear-gradient(145deg, #fff3e0 0%, #fce4ec 100%)'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                    <Avatar sx={{ bgcolor: '#ff9800', width: 32, height: 32 }}>
                      <PaymentIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="h6" fontWeight="600" color="#f57c00">
                      Thanh toán
                    </Typography>
                  </Box>

                  <Stack spacing={2.5}>
                    {/* Payment Method */}
                    <FormControl fullWidth>
                      <InputLabel>Phương thức thanh toán</InputLabel>
                      <Select
                        value={paymentMethod}
                        onChange={(e) => handlePaymentMethodChange(e.target.value)}
                        label="Phương thức thanh toán"
                        disabled={isProcessing}
                        sx={{ borderRadius: 2 }}
                      >
                        {paymentMethods.map((method) => (
                          <MenuItem key={method.value} value={method.value}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Box sx={{ color: method.color }}>{method.icon}</Box>
                              <Box>
                                <Typography variant="body1" fontWeight="500">
                                  {method.label}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {method.description}
                                </Typography>
                              </Box>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {/* Quick Amount Buttons */}
                    {paymentMethod === 'cash' && (
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Chọn nhanh:
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          {quickAmounts.map((quick) => (
                            <Chip
                              key={quick.label}
                              label={quick.label}
                              onClick={() => handleQuickAmount(quick)}
                              disabled={isProcessing}
                              variant="outlined"
                              sx={{
                                '&:hover': { bgcolor: 'primary.main', color: 'white' },
                                cursor: 'pointer'
                              }}
                            />
                          ))}
                        </Stack>
                      </Box>
                    )}

                    {/* Amount Received */}
                    <TextField
                      label="Số tiền nhận"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      fullWidth
                      variant="outlined"
                      type="number"
                      disabled={isProcessing}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><CalculateIcon color="action" /></InputAdornment>,
                        endAdornment: <InputAdornment position="end">đ</InputAdornment>,
                      }}
                      error={!isValidPayment}
                      helperText={!isValidPayment ? 'Số tiền nhận phải >= tổng tiền' : ''}
                    />

                    {/* Change Display */}
                    {paymentMethod === 'cash' && change > 0 && (
                      <Alert
                        severity="success"
                        icon={<CheckIcon />}
                        sx={{
                          borderRadius: 2,
                          '& .MuiAlert-message': { fontWeight: 'bold', fontSize: '1.1rem' }
                        }}
                      >
                        Tiền thừa: {formatCurrency(change)}
                      </Alert>
                    )}

                    {/* Reference Code */}
                    {paymentMethod !== 'cash' && (
                      <TextField
                        label="Mã tham chiếu"
                        value={referenceCode}
                        onChange={(e) => setReferenceCode(e.target.value)}
                        fullWidth
                        variant="outlined"
                        disabled={isProcessing}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        placeholder="Mã giao dịch, số thẻ..."
                      />
                    )}

                    {/* Notes */}
                    <TextField
                      label="Ghi chú"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      fullWidth
                      variant="outlined"
                      multiline
                      rows={2}
                      disabled={isProcessing}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      placeholder="Ghi chú thêm..."
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2.5, gap: 2, bgcolor: '#f8f9fa' }}>
        <Button
          onClick={onClose}
          variant="outlined"
          size="large"
          disabled={isProcessing}
          sx={{
            minWidth: 120,
            borderRadius: 2,
            borderColor: '#e0e0e0',
            color: '#666'
          }}
        >
          Hủy
        </Button>
        <Button
          onClick={handlePayment}
          variant="contained"
          size="large"
          disabled={!isValidPayment || isProcessing}
          sx={{
            minWidth: 150,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
            }
          }}
          startIcon={isProcessing ? null : selectedPaymentMethod?.icon}
        >
          {isProcessing ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' }
                  }
                }}
              />
              Đang xử lý...
            </Box>
          ) : (
            'Thanh toán'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
