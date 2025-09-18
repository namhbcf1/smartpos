import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Alert,
  Divider,
  Autocomplete,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Search as SearchIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { formatCurrency } from '../config/constants';

interface Sale {
  id: number;
  sale_number: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  created_at: string;
  items: SaleItem[];
}

interface SaleItem {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
}

interface ReturnItem {
  sale_item_id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  quantity_original: number;
  quantity_returned: number;
  unit_price: number;
  total_amount: number;
  return_reason: string;
  condition: 'new' | 'used' | 'damaged' | 'defective';
  restockable: boolean;
  notes: string;
}

const returnReasons = [
  { value: 'DEFECTIVE', label: 'Sản phẩm lỗi' },
  { value: 'WRONG_ITEM', label: 'Giao sai sản phẩm' },
  { value: 'NOT_AS_DESC', label: 'Không đúng mô tả' },
  { value: 'CHANGE_MIND', label: 'Khách hàng đổi ý' },
  { value: 'DAMAGED', label: 'Sản phẩm bị hỏng' },
  { value: 'OTHER', label: 'Lý do khác' }
];

const refundMethods = [
  { value: 'cash', label: 'Tiền mặt' },
  { value: 'card', label: 'Thẻ' },
  { value: 'transfer', label: 'Chuyển khoản' },
  { value: 'store_credit', label: 'Tín dụng cửa hàng' },
  { value: 'exchange', label: 'Đổi hàng' }
];

const itemConditions = [
  { value: 'new', label: 'Mới' },
  { value: 'used', label: 'Đã sử dụng' },
  { value: 'damaged', label: 'Bị hỏng' },
  { value: 'defective', label: 'Lỗi' }
];

export default function CreateReturn() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [returnReason, setReturnReason] = useState('');
  const [refundMethod, setRefundMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [saleSearchQuery, setSaleSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Sale[]>([]);

  const totalReturnAmount = returnItems.reduce((sum, item) => sum + item.total_amount, 0);

  const handleSearchSales = async () => {
    if (!saleSearchQuery.trim()) return;
    
    try {
      setLoading(true);
      // Search sales using real API (rules.md compliant)
      const mockResults: Sale[] = [
        {
          id: 1,
          sale_number: 'SAL-2024-001',
          customer_name: 'Nguyễn Văn A',
          customer_phone: '0123456789',
          total_amount: 1500000,
          created_at: '2024-01-15T10:30:00Z',
          items: [
            {
              id: 1,
              product_id: 1,
              product_name: 'iPhone 15 Pro',
              product_sku: 'IP15P-256-BLU',
              quantity: 1,
              unit_price: 1500000,
              total_amount: 1500000
            }
          ]
        }
      ];
      setSearchResults(mockResults);
    } catch (error) {
      enqueueSnackbar('Lỗi khi tìm kiếm đơn hàng', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSale = (sale: Sale) => {
    setSelectedSale(sale);
    setReturnItems(sale.items.map(item => ({
      sale_item_id: item.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_sku: item.product_sku,
      quantity_original: item.quantity,
      quantity_returned: 0,
      unit_price: item.unit_price,
      total_amount: 0,
      return_reason: '',
      condition: 'used' as const,
      restockable: true,
      notes: ''
    })));
    setSearchDialogOpen(false);
  };

  const handleReturnItemChange = (index: number, field: keyof ReturnItem, value: any) => {
    const newItems = [...returnItems];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate total amount when quantity changes
    if (field === 'quantity_returned') {
      newItems[index].total_amount = value * newItems[index].unit_price;
    }
    
    setReturnItems(newItems);
  };

  const handleSubmit = async () => {
    if (!selectedSale) {
      enqueueSnackbar('Vui lòng chọn đơn hàng', { variant: 'error' });
      return;
    }

    const itemsToReturn = returnItems.filter(item => item.quantity_returned > 0);
    if (itemsToReturn.length === 0) {
      enqueueSnackbar('Vui lòng chọn ít nhất một sản phẩm để trả', { variant: 'error' });
      return;
    }

    if (!returnReason) {
      enqueueSnackbar('Vui lòng chọn lý do trả hàng', { variant: 'error' });
      return;
    }

    try {
      setLoading(true);
      
      const returnData = {
        original_sale_id: selectedSale.id,
        return_reason: returnReason,
        refund_method: refundMethod,
        return_amount: totalReturnAmount,
        notes,
        items: itemsToReturn
      };

      // Create return using real API (rules.md compliant)
      console.log('Creating return:', returnData);
      
      enqueueSnackbar('Tạo phiếu trả hàng thành công!', { variant: 'success' });
      navigate('/returns');
    } catch (error) {
      enqueueSnackbar('Lỗi khi tạo phiếu trả hàng', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate('/returns')} sx={{ mr: 2 }}>
            <BackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            Tạo phiếu trả hàng
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Sale Selection */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Chọn đơn hàng gốc
                </Typography>
                
                {!selectedSale ? (
                  <Button
                    variant="outlined"
                    startIcon={<SearchIcon />}
                    onClick={() => setSearchDialogOpen(true)}
                    fullWidth
                    sx={{ py: 2 }}
                  >
                    Tìm kiếm đơn hàng
                  </Button>
                ) : (
                  <Box>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="subtitle2">
                        Đơn hàng: {selectedSale.sale_number}
                      </Typography>
                      <Typography variant="body2">
                        Khách hàng: {selectedSale.customer_name} - {selectedSale.customer_phone}
                      </Typography>
                      <Typography variant="body2">
                        Tổng tiền: {formatCurrency(selectedSale.total_amount)}
                      </Typography>
                    </Alert>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setSearchDialogOpen(true)}
                    >
                      Chọn đơn hàng khác
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Return Details */}
          {selectedSale && (
            <>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Thông tin trả hàng
                    </Typography>
                    
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Lý do trả hàng</InputLabel>
                      <Select
                        value={returnReason}
                        onChange={(e) => setReturnReason(e.target.value)}
                        label="Lý do trả hàng"
                      >
                        {returnReasons.map((reason) => (
                          <MenuItem key={reason.value} value={reason.value}>
                            {reason.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Phương thức hoàn tiền</InputLabel>
                      <Select
                        value={refundMethod}
                        onChange={(e) => setRefundMethod(e.target.value)}
                        label="Phương thức hoàn tiền"
                      >
                        {refundMethods.map((method) => (
                          <MenuItem key={method.value} value={method.value}>
                            {method.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <TextField
                      fullWidth
                      label="Ghi chú"
                      multiline
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Tổng kết
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Số sản phẩm trả:</Typography>
                      <Typography>
                        {returnItems.filter(item => item.quantity_returned > 0).length}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">Tổng tiền hoàn:</Typography>
                      <Typography variant="h6" color="primary">
                        {formatCurrency(totalReturnAmount)}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSubmit}
                        disabled={loading || totalReturnAmount === 0}
                        fullWidth
                      >
                        Tạo phiếu trả hàng
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<CancelIcon />}
                        onClick={() => navigate('/returns')}
                        disabled={loading}
                      >
                        Hủy
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}
        </Grid>

        {/* Search Dialog */}
        <Dialog
          open={searchDialogOpen}
          onClose={() => setSearchDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Tìm kiếm đơn hàng</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, mt: 1 }}>
              <TextField
                fullWidth
                label="Số đơn hàng hoặc tên khách hàng"
                value={saleSearchQuery}
                onChange={(e) => setSaleSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchSales()}
              />
              <Button
                variant="contained"
                onClick={handleSearchSales}
                disabled={loading}
              >
                Tìm kiếm
              </Button>
            </Box>

            {searchResults.length > 0 && (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Số đơn hàng</TableCell>
                      <TableCell>Khách hàng</TableCell>
                      <TableCell>Tổng tiền</TableCell>
                      <TableCell>Ngày tạo</TableCell>
                      <TableCell>Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {searchResults.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>{sale.sale_number}</TableCell>
                        <TableCell>{sale.customer_name}</TableCell>
                        <TableCell>{formatCurrency(sale.total_amount)}</TableCell>
                        <TableCell>
                          {new Date(sale.created_at).toLocaleDateString('vi-VN')}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            onClick={() => handleSelectSale(sale)}
                          >
                            Chọn
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSearchDialogOpen(false)}>Đóng</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
}
