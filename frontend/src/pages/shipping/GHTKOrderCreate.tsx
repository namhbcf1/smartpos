import React, { useState } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Chip,
  Stack
} from '@mui/material';
import {
  LocalShipping,
  Save,
  Send,
  CheckCircle,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../services/api';
import AddressForm, { AddressData } from '../../components/AddressForm';

interface GHTKOrderData {
  // Thông tin người nhận
  receiver: AddressData;
  
  // Thông tin người gửi
  sender: {
    name: string;
    phone: string;
    address: string;
    province: string;
    district: string;
  };
  
  // Thông tin hàng hóa
  products: Array<{
    name: string;
    weight: number;
    quantity: number;
    value: number;
  }>;
  
  // Thông tin vận chuyển
  transport: 'road' | 'fly';
  service: string;
  cod_amount: number;
  note: string;
  
  // Thông tin bổ sung
  is_freeship: boolean;
  insurance: boolean;
  insurance_value: number;
}

const GHTKOrderCreate: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [orderData, setOrderData] = useState<GHTKOrderData>({
    receiver: {
      fullName: '',
      phone: '',
      address: '',
      province: null,
      district: null,
      ward: null,
      province_id: '',
      district_id: '',
      ward_id: '',
      full_address: ''
    },
    sender: {
      name: 'SmartPOS Store',
      phone: '0836768597',
      address: '415 Trần Hưng Đạo, Tổ 10, Phường Phương Lâm',
      province: 'Hòa Bình',
      district: 'Thành phố Hòa Bình'
    },
    products: [{
      name: '',
      weight: 1,
      quantity: 1,
      value: 0
    }],
    transport: 'road',
    service: 'road',
    cod_amount: 0,
    note: '',
    is_freeship: false,
    insurance: false,
    insurance_value: 0
  });

  const [feeEstimate, setFeeEstimate] = useState<{
    fee: number;
    insurance_fee: number;
    total: number;
  } | null>(null);

  const steps = [
    'Thông tin người nhận',
    'Thông tin hàng hóa',
    'Tùy chọn vận chuyển',
    'Xác nhận và tạo đơn'
  ];

  // Mutation để tạo đơn hàng
  const createOrderMutation = useMutation({
    mutationFn: async (data: GHTKOrderData) => {
      const payload = {
        order: {
          id: `order-${Date.now()}`,
          name: data.receiver.fullName,
          tel: data.receiver.phone,
          address: data.receiver.full_address,
          province: data.receiver.province?.name || '',
          district: data.receiver.district?.name || '',
          ward: data.receiver.ward?.name || '',
          pick_name: data.sender.name,
          pick_tel: data.sender.phone,
          pick_address: data.sender.address,
          pick_province: data.sender.province,
          pick_district: data.sender.district,
          value: data.cod_amount,
          weight: data.products.reduce((sum, p) => sum + (p.weight * p.quantity), 0) * 1000, // Convert kg to grams
          transport: data.transport,
          service: data.service,
          note: data.note,
          is_freeship: data.is_freeship ? 1 : 0,
          insurance: data.insurance ? data.insurance_value : 0
        }
      };
      
      const response = await api.post('/shipping/ghtk/order', payload);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Order created successfully:', data);
      navigate('/shipping/orders');
    },
    onError: (error) => {
      console.error('Failed to create order:', error);
    }
  });

  // Mutation để tính phí
  const calculateFeeMutation = useMutation({
    mutationFn: async (data: GHTKOrderData) => {
      const payload = {
        pick_province: data.sender.province,
        pick_district: data.sender.district,
        province: data.receiver.province?.name || '',
        district: data.receiver.district?.name || '',
        weight: data.products.reduce((sum, p) => sum + (p.weight * p.quantity), 0) * 1000, // Convert kg to grams
        value: data.cod_amount,
        transport: data.transport
      };
      
      const response = await api.post('/shipping/ghtk/fee', payload);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        setFeeEstimate({
          fee: data.data?.fee || 0,
          insurance_fee: orderData.insurance ? orderData.insurance_value * 0.005 : 0,
          total: (data.data?.fee || 0) + (orderData.insurance ? orderData.insurance_value * 0.005 : 0)
        });
      }
    }
  });

  const handleReceiverChange = (receiver: AddressData) => {
    setOrderData(prev => ({
      ...prev,
      receiver
    }));
  };

  const handleProductChange = (index: number, field: string, value: any) => {
    setOrderData(prev => ({
      ...prev,
      products: prev.products.map((product, i) => 
        i === index ? { ...product, [field]: value } : product
      )
    }));
  };

  const addProduct = () => {
    setOrderData(prev => ({
      ...prev,
      products: [...prev.products, {
        name: '',
        weight: 1,
        quantity: 1,
        value: 0
      }]
    }));
  };

  const removeProduct = (index: number) => {
    if (orderData.products.length > 1) {
      setOrderData(prev => ({
        ...prev,
        products: prev.products.filter((_, i) => i !== index)
      }));
    }
  };

  const calculateFee = () => {
    if (orderData.receiver.province && orderData.receiver.district) {
      calculateFeeMutation.mutate(orderData);
    }
  };

  // Auto-calculate fee when relevant data changes
  React.useEffect(() => {
    // Only auto-calculate if we have minimum required data
    if (
      orderData.receiver.province &&
      orderData.receiver.district &&
      orderData.products.length > 0 &&
      orderData.products.every(p => p.weight > 0 && p.quantity > 0) &&
      !calculateFeeMutation.isPending
    ) {
      const timer = setTimeout(() => {
        calculateFeeMutation.mutate(orderData);
      }, 500); // Debounce 500ms

      return () => clearTimeout(timer);
    }
  }, [
    orderData.receiver.province,
    orderData.receiver.district,
    orderData.products,
    orderData.transport,
    orderData.cod_amount,
    orderData.insurance,
    orderData.insurance_value
  ]);

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleCreateOrder = () => {
    createOrderMutation.mutate(orderData);
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 0:
        return orderData.receiver.fullName && 
               orderData.receiver.phone && 
               orderData.receiver.address &&
               orderData.receiver.province &&
               orderData.receiver.district &&
               orderData.receiver.ward;
      case 1:
        return orderData.products.every(p => p.name && p.weight > 0 && p.quantity > 0);
      case 2:
        return true;
      case 3:
        return feeEstimate !== null;
      default:
        return false;
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <AddressForm
            title="Thông tin người nhận"
            onAddressChange={handleReceiverChange}
            showValidation={true}
          />
        );
      
      case 1:
        return (
          <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" sx={{ mb: 4, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                📦 Thông tin hàng hóa
              </Typography>
              
              {orderData.products.map((product, index) => (
                <Paper key={index} sx={{ p: 3, mb: 3, borderRadius: 2, border: '2px solid', borderColor: 'grey.200' }}>
                  <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Tên sản phẩm"
                        value={product.name}
                        onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                        placeholder="Nhập tên sản phẩm"
                        required
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            fontSize: '16px',
                            height: '56px',
                            borderRadius: 2,
                            '& fieldset': { borderWidth: 2 },
                            '&:hover fieldset': { borderColor: 'primary.main' },
                            '&.Mui-focused fieldset': { borderWidth: 2 },
                          },
                          '& .MuiInputLabel-root': { fontSize: '16px', fontWeight: 500 }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField
                        fullWidth
                        label="Khối lượng (kg)"
                        type="number"
                        value={product.weight}
                        onChange={(e) => handleProductChange(index, 'weight', parseFloat(e.target.value) || 0)}
                        inputProps={{ min: 0.1, step: 0.1 }}
                        required
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            fontSize: '16px',
                            height: '56px',
                            borderRadius: 2,
                            '& fieldset': { borderWidth: 2 },
                            '&:hover fieldset': { borderColor: 'primary.main' },
                            '&.Mui-focused fieldset': { borderWidth: 2 },
                          },
                          '& .MuiInputLabel-root': { fontSize: '16px', fontWeight: 500 }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField
                        fullWidth
                        label="Số lượng"
                        type="number"
                        value={product.quantity}
                        onChange={(e) => handleProductChange(index, 'quantity', parseInt(e.target.value) || 1)}
                        inputProps={{ min: 1 }}
                        required
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            fontSize: '16px',
                            height: '56px',
                            borderRadius: 2,
                            '& fieldset': { borderWidth: 2 },
                            '&:hover fieldset': { borderColor: 'primary.main' },
                            '&.Mui-focused fieldset': { borderWidth: 2 },
                          },
                          '& .MuiInputLabel-root': { fontSize: '16px', fontWeight: 500 }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField
                        fullWidth
                        label="Giá trị (₫)"
                        type="number"
                        value={product.value}
                        onChange={(e) => handleProductChange(index, 'value', parseInt(e.target.value) || 0)}
                        inputProps={{ min: 0 }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            fontSize: '16px',
                            height: '56px',
                            borderRadius: 2,
                            '& fieldset': { borderWidth: 2 },
                            '&:hover fieldset': { borderColor: 'primary.main' },
                            '&.Mui-focused fieldset': { borderWidth: 2 },
                          },
                          '& .MuiInputLabel-root': { fontSize: '16px', fontWeight: 500 }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => removeProduct(index)}
                        disabled={orderData.products.length === 1}
                        fullWidth
                        sx={{ 
                          height: '56px',
                          fontSize: '16px',
                          fontWeight: 500,
                          borderRadius: 2,
                          borderWidth: 2,
                          '&:hover': { borderWidth: 2 }
                        }}
                      >
                        🗑️ Xóa
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
              
              <Button
                variant="outlined"
                onClick={addProduct}
                sx={{ 
                  mt: 3,
                  height: '56px',
                  fontSize: '16px',
                  fontWeight: 500,
                  borderRadius: 2,
                  borderWidth: 2,
                  px: 4,
                  '&:hover': { borderWidth: 2 }
                }}
              >
                ➕ Thêm sản phẩm
              </Button>
            </CardContent>
          </Card>
        );
      
      case 2:
        return (
          <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" sx={{ mb: 4, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                🚚 Tùy chọn vận chuyển
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ fontSize: '16px', fontWeight: 500 }}>Phương thức vận chuyển</InputLabel>
                    <Select
                      value={orderData.transport}
                      onChange={(e) => setOrderData(prev => ({ 
                        ...prev, 
                        transport: e.target.value as 'road' | 'fly',
                        service: e.target.value
                      }))}
                      label="Phương thức vận chuyển"
                      sx={{
                        height: '56px',
                        fontSize: '16px',
                        borderRadius: 2,
                        '& .MuiOutlinedInput-notchedOutline': { borderWidth: 2 },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderWidth: 2 },
                      }}
                    >
                      <MenuItem value="road" sx={{ fontSize: '16px', py: 2 }}>🚛 Đường bộ</MenuItem>
                      <MenuItem value="fly" sx={{ fontSize: '16px', py: 2 }}>✈️ Đường hàng không</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Tiền thu hộ (COD)"
                    type="number"
                    value={orderData.cod_amount}
                    onChange={(e) => setOrderData(prev => ({ 
                      ...prev, 
                      cod_amount: parseInt(e.target.value) || 0 
                    }))}
                    inputProps={{ min: 0 }}
                    helperText="Nhập 0 nếu không thu hộ"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '16px',
                        height: '56px',
                        borderRadius: 2,
                        '& fieldset': { borderWidth: 2 },
                        '&:hover fieldset': { borderColor: 'primary.main' },
                        '&.Mui-focused fieldset': { borderWidth: 2 },
                      },
                      '& .MuiInputLabel-root': { fontSize: '16px', fontWeight: 500 }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Ghi chú"
                    multiline
                    rows={4}
                    value={orderData.note}
                    onChange={(e) => setOrderData(prev => ({ 
                      ...prev, 
                      note: e.target.value 
                    }))}
                    placeholder="Ghi chú thêm cho đơn hàng..."
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '16px',
                        borderRadius: 2,
                        '& fieldset': { borderWidth: 2 },
                        '&:hover fieldset': { borderColor: 'primary.main' },
                        '&.Mui-focused fieldset': { borderWidth: 2 },
                      },
                      '& .MuiInputLabel-root': { fontSize: '16px', fontWeight: 500 }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={orderData.is_freeship}
                        onChange={(e) => setOrderData(prev => ({ 
                          ...prev, 
                          is_freeship: e.target.checked 
                        }))}
                        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: 'success.main' } }}
                      />
                    }
                    label={
                      <Typography sx={{ fontSize: '16px', fontWeight: 500 }}>
                        🆓 Miễn phí vận chuyển
                      </Typography>
                    }
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={orderData.insurance}
                        onChange={(e) => setOrderData(prev => ({ 
                          ...prev, 
                          insurance: e.target.checked 
                        }))}
                        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: 'primary.main' } }}
                      />
                    }
                    label={
                      <Typography sx={{ fontSize: '16px', fontWeight: 500 }}>
                        🛡️ Bảo hiểm hàng hóa
                      </Typography>
                    }
                  />
                </Grid>
                
                {orderData.insurance && (
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Giá trị bảo hiểm (₫)"
                      type="number"
                      value={orderData.insurance_value}
                      onChange={(e) => setOrderData(prev => ({ 
                        ...prev, 
                        insurance_value: parseInt(e.target.value) || 0 
                      }))}
                      inputProps={{ min: 0 }}
                      helperText="Phí bảo hiểm: 0.5% giá trị hàng hóa"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          fontSize: '16px',
                          height: '56px',
                          borderRadius: 2,
                          '& fieldset': { borderWidth: 2 },
                          '&:hover fieldset': { borderColor: 'primary.main' },
                          '&.Mui-focused fieldset': { borderWidth: 2 },
                        },
                        '& .MuiInputLabel-root': { fontSize: '16px', fontWeight: 500 }
                      }}
                    />
                  </Grid>
                )}
              </Grid>
              
              <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={calculateFee}
                  disabled={!isStepValid(0) || calculateFeeMutation.isPending}
                  startIcon={calculateFeeMutation.isPending ? <CircularProgress size={24} /> : <LocalShipping />}
                  sx={{
                    height: '56px',
                    fontSize: '16px',
                    fontWeight: 500,
                    borderRadius: 2,
                    px: 4,
                    py: 2
                  }}
                >
                  {calculateFeeMutation.isPending ? 'Đang tính phí...' : '💰 Tính phí vận chuyển'}
                </Button>
              </Box>
              
              {feeEstimate && (
                <Alert 
                  severity="success" 
                  sx={{ 
                    mt: 3,
                    fontSize: '16px',
                    py: 2,
                    borderRadius: 2,
                    '& .MuiAlert-message': { fontSize: '16px' }
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                    💰 Ước tính phí vận chuyển:
                  </Typography>
                  <Stack direction="row" spacing={2} flexWrap="wrap">
                    <Chip 
                      label={`Phí vận chuyển: ${feeEstimate.fee.toLocaleString()} ₫`} 
                      sx={{ fontSize: '14px', height: '32px' }}
                    />
                    {orderData.insurance && (
                      <Chip 
                        label={`Phí bảo hiểm: ${feeEstimate.insurance_fee.toLocaleString()} ₫`} 
                        sx={{ fontSize: '14px', height: '32px' }}
                      />
                    )}
                    <Chip 
                      label={`Tổng cộng: ${feeEstimate.total.toLocaleString()} ₫`} 
                      color="primary"
                      sx={{ fontSize: '14px', height: '32px', fontWeight: 'bold' }}
                    />
                  </Stack>
                </Alert>
              )}
            </CardContent>
          </Card>
        );
      
      case 3:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Xác nhận thông tin đơn hàng
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                      Thông tin người nhận
                    </Typography>
                    <Typography variant="body2">
                      <strong>Tên:</strong> {orderData.receiver.fullName}
                    </Typography>
                    <Typography variant="body2">
                      <strong>SĐT:</strong> {orderData.receiver.phone}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Địa chỉ:</strong> {orderData.receiver.full_address}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                      Thông tin hàng hóa
                    </Typography>
                    {orderData.products.map((product, index) => (
                      <Typography key={index} variant="body2">
                        {product.name} - {product.quantity}x {product.weight}kg
                      </Typography>
                    ))}
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Tổng khối lượng:</strong> {orderData.products.reduce((sum, p) => sum + (p.weight * p.quantity), 0)} kg
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                      Thông tin vận chuyển
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>Phương thức:</strong> {orderData.transport === 'road' ? 'Đường bộ' : 'Đường hàng không'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>COD:</strong> {orderData.cod_amount.toLocaleString()} ₫
                        </Typography>
                      </Grid>
                      {orderData.insurance && (
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            <strong>Bảo hiểm:</strong> {orderData.insurance_value.toLocaleString()} ₫
                          </Typography>
                        </Grid>
                      )}
                      {orderData.is_freeship && (
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            <strong>Miễn phí vận chuyển:</strong> Có
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        );
      
      default:
        return null;
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      py: 6 
    }}>
      <Container maxWidth="xl">
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 6,
          p: 4,
          borderRadius: 4,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
        }}>
          <LocalShipping sx={{ mr: 3, fontSize: 48, color: '#3b82f6' }} />
          <Typography variant="h2" component="h1" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
            🚚 Tạo đơn hàng GHTK
          </Typography>
        </Box>

        <Stepper activeStep={activeStep} sx={{ 
          mb: 6, 
          p: 4,
          borderRadius: 4,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
          '& .MuiStepLabel-label': { fontSize: '18px', fontWeight: 600 },
          '& .MuiStepLabel-root': { color: '#64748b' },
          '& .MuiStepLabel-active': { color: '#3b82f6' },
          '& .MuiStepLabel-completed': { color: '#10b981' }
        }}>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent(activeStep)}

        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          mt: 6,
          p: 4,
          borderRadius: 4,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
        }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            sx={{
              height: '64px',
              fontSize: '18px',
              fontWeight: 600,
              borderRadius: 3,
              px: 6,
              py: 3,
              background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
              },
              '&:disabled': {
                background: '#e2e8f0',
                color: '#94a3b8'
              }
            }}
          >
            ← Quay lại
          </Button>
          
          <Box sx={{ display: 'flex', gap: 3 }}>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleCreateOrder}
                disabled={!isStepValid(activeStep) || createOrderMutation.isPending}
                startIcon={createOrderMutation.isPending ? <CircularProgress size={28} /> : <Send />}
                sx={{
                  height: '64px',
                  fontSize: '18px',
                  fontWeight: 600,
                  borderRadius: 3,
                  px: 6,
                  py: 3,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  },
                  '&:disabled': {
                    background: '#e2e8f0',
                    color: '#94a3b8'
                  }
                }}
              >
                {createOrderMutation.isPending ? 'Đang tạo đơn...' : '🚀 Tạo đơn hàng'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!isStepValid(activeStep)}
                sx={{
                  height: '64px',
                  fontSize: '18px',
                  fontWeight: 600,
                  borderRadius: 3,
                  px: 6,
                  py: 3,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
                  },
                  '&:disabled': {
                    background: '#e2e8f0',
                    color: '#94a3b8'
                  }
                }}
              >
                Tiếp theo →
              </Button>
            )}
          </Box>
        </Box>

        {/* Error Messages */}
        {createOrderMutation.error && (
          <Alert
            severity="error"
            sx={{
              mt: 4,
              fontSize: '16px',
              borderRadius: 3,
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', fontSize: '18px' }}>
              ❌ Lỗi khi tạo đơn hàng:
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '16px' }}>
              {(createOrderMutation.error as any)?.response?.status === 401
                ? '🔒 Bạn cần đăng nhập để tạo đơn GHTK. Vui lòng đăng nhập và thử lại.'
                : ((createOrderMutation.error as any)?.response?.data?.error || 'Có lỗi xảy ra. Vui lòng thử lại sau.')}
            </Typography>
          </Alert>
        )}

        {calculateFeeMutation.error && (
          <Alert
            severity="warning"
            sx={{
              mt: 4,
              fontSize: '16px',
              borderRadius: 3,
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)'
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', fontSize: '18px' }}>
              ⚠️ Lỗi khi tính phí vận chuyển:
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '16px' }}>
              {(calculateFeeMutation.error as any)?.response?.status === 401
                ? '🔒 Bạn cần đăng nhập để tính phí vận chuyển.'
                : ((calculateFeeMutation.error as any)?.response?.data?.error || 'Không thể tính phí vận chuyển. Vui lòng kiểm tra thông tin địa chỉ.')}
            </Typography>
          </Alert>
        )}
      </Container>
    </Box>
  );
};

export default GHTKOrderCreate;