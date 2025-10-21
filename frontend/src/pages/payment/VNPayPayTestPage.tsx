import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  Divider,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Payment,
  Send,
  ContentCopy,
  ExpandMore,
  CheckCircle,
  Error,
  Info,
  Refresh
} from '@mui/icons-material';
import api from '../../services/api';

interface PaymentRequest {
  orderId: string;
  amount: number;
  orderDescription: string;
  bankCode?: string;
  locale?: string;
  currency?: string;
  returnUrl?: string;
  expireDate?: string;
  orderType?: string;
  billing?: {
    mobile?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    address?: string;
    city?: string;
    country?: string;
    state?: string;
  };
  invoice?: {
    phone?: string;
    email?: string;
    customer?: string;
    address?: string;
    company?: string;
    taxcode?: string;
    type?: string;
  };
}

const VNPayPayTestPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest>({
    orderId: `PAY_TEST_${Date.now()}`,
    amount: 100000,
    orderDescription: 'Test thanh toan VNPay PAY',
    locale: 'vn',
    currency: 'VND',
    orderType: 'other'
  });

  const handleInputChange = (field: string, value: any) => {
    setPaymentRequest(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBillingChange = (field: string, value: string) => {
    setPaymentRequest(prev => ({
      ...prev,
      billing: {
        ...prev.billing,
        [field]: value
      }
    }));
  };

  const handleInvoiceChange = (field: string, value: string) => {
    setPaymentRequest(prev => ({
      ...prev,
      invoice: {
        ...prev.invoice,
        [field]: value
      }
    }));
  };

  const createPayUrl = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await api.post('/payments/vnpay/create-pay-url', paymentRequest);
      
      if (response.data.success) {
        setResult(response.data);
      } else {
        setError(response.data.error || 'Failed to create payment URL');
      }
    } catch (err: any) {
      console.error('Error creating payment URL:', err);
      setError(err.response?.data?.error || err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const generateRandomOrderId = () => {
    const newOrderId = `PAY_TEST_${Date.now()}`;
    handleInputChange('orderId', newOrderId);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Payment color="primary" />
        VNPay PAY Test Page
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Test VNPay PAY flow (vnp_Command = pay) với đầy đủ tham số theo spec
      </Typography>

      <Grid container spacing={3}>
        {/* Request Form */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Payment Request" 
              action={
                <Tooltip title="Generate new order ID">
                  <IconButton onClick={generateRandomOrderId}>
                    <Refresh />
                  </IconButton>
                </Tooltip>
              }
            />
            <CardContent>
              <Stack spacing={2}>
                {/* Basic Parameters */}
                <Typography variant="h6" color="primary">Basic Parameters</Typography>
                
                <TextField
                  fullWidth
                  label="Order ID"
                  value={paymentRequest.orderId}
                  onChange={(e) => handleInputChange('orderId', e.target.value)}
                  helperText="Unique order identifier"
                />

                <TextField
                  fullWidth
                  label="Amount (VND)"
                  type="number"
                  value={paymentRequest.amount}
                  onChange={(e) => handleInputChange('amount', parseInt(e.target.value) || 0)}
                  helperText={`${formatVND(paymentRequest.amount)}`}
                />

                <TextField
                  fullWidth
                  label="Order Description"
                  multiline
                  rows={2}
                  value={paymentRequest.orderDescription}
                  onChange={(e) => handleInputChange('orderDescription', e.target.value)}
                  helperText="Vietnamese without diacritics, no special characters"
                />

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel>Locale</InputLabel>
                      <Select
                        value={paymentRequest.locale || 'vn'}
                        label="Locale"
                        onChange={(e) => handleInputChange('locale', e.target.value)}
                      >
                        <MenuItem value="vn">Vietnamese</MenuItem>
                        <MenuItem value="en">English</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel>Currency</InputLabel>
                      <Select
                        value={paymentRequest.currency || 'VND'}
                        label="Currency"
                        onChange={(e) => handleInputChange('currency', e.target.value)}
                      >
                        <MenuItem value="VND">VND</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <TextField
                  fullWidth
                  label="Bank Code (Optional)"
                  value={paymentRequest.bankCode || ''}
                  onChange={(e) => handleInputChange('bankCode', e.target.value)}
                  helperText="VNPAYQR, VNBANK, INTCARD, or specific bank code"
                />

                <TextField
                  fullWidth
                  label="Order Type"
                  value={paymentRequest.orderType || 'other'}
                  onChange={(e) => handleInputChange('orderType', e.target.value)}
                  helperText="Product category code"
                />

                <TextField
                  fullWidth
                  label="Expire Date (Optional)"
                  type="datetime-local"
                  value={paymentRequest.expireDate || ''}
                  onChange={(e) => handleInputChange('expireDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  fullWidth
                  label="Return URL (Optional)"
                  value={paymentRequest.returnUrl || ''}
                  onChange={(e) => handleInputChange('returnUrl', e.target.value)}
                  helperText="Custom return URL (default: /payment/vnpay-return)"
                />

                {/* Billing Information */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6" color="primary">Billing Information (Optional)</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={2}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label="First Name"
                            value={paymentRequest.billing?.firstName || ''}
                            onChange={(e) => handleBillingChange('firstName', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label="Last Name"
                            value={paymentRequest.billing?.lastName || ''}
                            onChange={(e) => handleBillingChange('lastName', e.target.value)}
                          />
                        </Grid>
                      </Grid>
                      
                      <TextField
                        fullWidth
                        label="Mobile"
                        value={paymentRequest.billing?.mobile || ''}
                        onChange={(e) => handleBillingChange('mobile', e.target.value)}
                      />

                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={paymentRequest.billing?.email || ''}
                        onChange={(e) => handleBillingChange('email', e.target.value)}
                      />

                      <TextField
                        fullWidth
                        label="Address"
                        multiline
                        rows={2}
                        value={paymentRequest.billing?.address || ''}
                        onChange={(e) => handleBillingChange('address', e.target.value)}
                      />

                      <Grid container spacing={2}>
                        <Grid item xs={4}>
                          <TextField
                            fullWidth
                            label="City"
                            value={paymentRequest.billing?.city || ''}
                            onChange={(e) => handleBillingChange('city', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={4}>
                          <TextField
                            fullWidth
                            label="State"
                            value={paymentRequest.billing?.state || ''}
                            onChange={(e) => handleBillingChange('state', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={4}>
                          <TextField
                            fullWidth
                            label="Country"
                            value={paymentRequest.billing?.country || ''}
                            onChange={(e) => handleBillingChange('country', e.target.value)}
                          />
                        </Grid>
                      </Grid>
                    </Stack>
                  </AccordionDetails>
                </Accordion>

                {/* Invoice Information */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6" color="primary">Invoice Information (Optional)</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={2}>
                      <TextField
                        fullWidth
                        label="Customer Name"
                        value={paymentRequest.invoice?.customer || ''}
                        onChange={(e) => handleInvoiceChange('customer', e.target.value)}
                      />

                      <TextField
                        fullWidth
                        label="Company"
                        value={paymentRequest.invoice?.company || ''}
                        onChange={(e) => handleInvoiceChange('company', e.target.value)}
                      />

                      <TextField
                        fullWidth
                        label="Tax Code"
                        value={paymentRequest.invoice?.taxcode || ''}
                        onChange={(e) => handleInvoiceChange('taxcode', e.target.value)}
                      />

                      <TextField
                        fullWidth
                        label="Phone"
                        value={paymentRequest.invoice?.phone || ''}
                        onChange={(e) => handleInvoiceChange('phone', e.target.value)}
                      />

                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={paymentRequest.invoice?.email || ''}
                        onChange={(e) => handleInvoiceChange('email', e.target.value)}
                      />

                      <TextField
                        fullWidth
                        label="Address"
                        multiline
                        rows={2}
                        value={paymentRequest.invoice?.address || ''}
                        onChange={(e) => handleInvoiceChange('address', e.target.value)}
                      />

                      <TextField
                        fullWidth
                        label="Invoice Type"
                        value={paymentRequest.invoice?.type || ''}
                        onChange={(e) => handleInvoiceChange('type', e.target.value)}
                      />
                    </Stack>
                  </AccordionDetails>
                </Accordion>

                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={createPayUrl}
                  disabled={loading}
                  startIcon={loading ? <Refresh /> : <Send />}
                  sx={{ mt: 2 }}
                >
                  {loading ? 'Creating Payment URL...' : 'Create VNPay PAY URL'}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Results */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Results" />
            <CardContent>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography variant="body2">{error}</Typography>
                </Alert>
              )}

              {result && (
                <Stack spacing={2}>
                  <Alert severity="success">
                    <Typography variant="body2">Payment URL created successfully!</Typography>
                  </Alert>

                  {result.data?.paymentUrl && (
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Payment URL:
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontFamily: 'monospace', 
                            fontSize: '0.75rem',
                            wordBreak: 'break-all',
                            flex: 1
                          }}
                        >
                          {result.data.paymentUrl}
                        </Typography>
                        <Tooltip title="Copy URL">
                          <IconButton 
                            size="small" 
                            onClick={() => copyToClipboard(result.data.paymentUrl)}
                          >
                            <ContentCopy />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Button
                        variant="contained"
                        fullWidth
                        sx={{ mt: 1 }}
                        onClick={() => window.open(result.data.paymentUrl, '_blank')}
                        startIcon={<Payment />}
                      >
                        Open VNPay Payment
                      </Button>
                    </Paper>
                  )}

                  {result.data?.debug && (
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="subtitle2">Debug Information</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack spacing={2}>
                          <Box>
                            <Typography variant="subtitle2" gutterBottom>Parameters:</Typography>
                            <Paper sx={{ p: 1, bgcolor: 'grey.100' }}>
                              <pre style={{ fontSize: '0.75rem', margin: 0, overflow: 'auto' }}>
                                {JSON.stringify(result.data.debug.parameters, null, 2)}
                              </pre>
                            </Paper>
                          </Box>

                          <Box>
                            <Typography variant="subtitle2" gutterBottom>Query String:</Typography>
                            <Paper sx={{ p: 1, bgcolor: 'grey.100' }}>
                              <pre style={{ fontSize: '0.75rem', margin: 0, wordBreak: 'break-all' }}>
                                {result.data.debug.queryString}
                              </pre>
                            </Paper>
                          </Box>

                          <Box>
                            <Typography variant="subtitle2" gutterBottom>Secure Hash:</Typography>
                            <Paper sx={{ p: 1, bgcolor: 'grey.100' }}>
                              <pre style={{ fontSize: '0.75rem', margin: 0, wordBreak: 'break-all' }}>
                                {result.data.debug.secureHash}
                              </pre>
                            </Paper>
                          </Box>
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  )}
                </Stack>
              )}

              {!result && !error && (
                <Alert severity="info">
                  <Typography variant="body2">
                    Fill in the payment request form and click "Create VNPay PAY URL" to test the API.
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* API Endpoints Info */}
      <Card sx={{ mt: 3 }}>
        <CardHeader title="Available API Endpoints" />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <CheckCircle color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6" gutterBottom>Create PAY URL</Typography>
                <Typography variant="body2" color="text.secondary">
                  POST /api/payments/vnpay/create-pay-url
                </Typography>
                <Chip label="Implemented" color="success" size="small" sx={{ mt: 1 }} />
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <CheckCircle color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6" gutterBottom>Return Handler</Typography>
                <Typography variant="body2" color="text.secondary">
                  GET /api/payments/vnpay/pay-return
                </Typography>
                <Chip label="Implemented" color="success" size="small" sx={{ mt: 1 }} />
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <CheckCircle color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6" gutterBottom>IPN Handler</Typography>
                <Typography variant="body2" color="text.secondary">
                  POST /api/payments/vnpay/pay-ipn
                </Typography>
                <Chip label="Implemented" color="success" size="small" sx={{ mt: 1 }} />
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default VNPayPayTestPage;
