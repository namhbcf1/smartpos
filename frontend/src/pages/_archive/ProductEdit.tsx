import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
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
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Badge
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack as BackIcon,
  QrCode as QrCodeIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { usePaginatedQuery, useUpdateMutation } from '../../../hooks/useApiData';
import { formatCurrency } from '../../utils/format';
import api from '../../services/api';
import realtimeService from '../../services/realtime';

// Enhanced interfaces
interface Product {
  id: number;
  name: string;
  description: string;
  sku: string;
  barcode: string | null;
  category_id: number;
  price: number;
  cost_price: number;
  taxRate: number;
  stock: number;
  min_stock: number;
  is_active: boolean;
  imageUrl: string | null;
  warrantyPeriodMonths?: number;
  warrantyType?: string;
  trackQuantity?: boolean;
}

interface SerialNumber {
  id: number;
  serial_number: string;
  product_id: number;
  status: 'in_stock' | 'sold' | 'returned' | 'defective' | 'warranty_claim' | 'disposed';
  customer_id?: number;
  customer_name?: string;
  sold_date?: string;
  warranty_end_date?: string;
  received_date: string;
  supplier_id?: number;
  supplier_name?: string;
  notes?: string;
}

interface Category {
  id: number;
  name: string;
}

interface StockSummary {
  total_serials: number;
  in_stock: number;
  sold: number;
  warranty_claim: number;
  defective: number;
  returned: number;
  disposed: number;
}

const ProductEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  
  // Serial Number states
  const [serialNumbers, setSerialNumbers] = useState<SerialNumber[]>([]);
  const [stockSummary, setStockSummary] = useState<StockSummary | null>(null);
  const [serialLoading, setSerialLoading] = useState(false);
  const [showSerialDialog, setShowSerialDialog] = useState(false);
  const [stockCalculationMode, setStockCalculationMode] = useState<'manual' | 'auto'>('manual');

  // Enhanced form data with comprehensive fields
  const [formData, setFormData] = useState({
    // Basic information
    name: '',
    description: '',
    sku: '',
    barcode: '',
    category_id: '',

    // Pricing
    price: '',
    cost_price: '',
    taxRate: '',
    discountEligible: true,

    // Inventory - Enhanced with serial tracking
    stock: '',
    calculatedStock: 0,
    min_stock: '',
    min_stock: '',
    maxStockLevel: '',
    reorderPoint: '',
    reorderQuantity: '',

    // Product details
    brand: '',
    model: '',
    unit: 'piece',
    weight: '',
    dimensions: '',
    color: '',
    size: '',

    // Supplier
    supplierId: '',
    supplierSku: '',
    supplierPrice: '',

    // Warranty
    warrantyPeriodMonths: '12',
    warrantyType: 'manufacturer',
    warrantyTerms: '',

    // Media
    imageUrl: '',
    videoUrl: '',

    // SEO
    metaTitle: '',
    metaDescription: '',
    tags: [] as string[],

    // Status
    is_active: true,
    isFeatured: false,
    isDigital: false,
    requiresShipping: true,
    trackQuantity: true
  });

  // Fetch categories
  const { data: categories = [] } = usePaginatedQuery<Category>('/categories', {
    limit: 100,
    is_active: true
  });

  // Update mutation
  const { update: updateProduct, loading: updateLoading, error: updateError } = useUpdateMutation();

  // Fetch serial numbers for this product
  const fetchSerialNumbers = async () => {
    if (!id) return;
    
    try {
      setSerialLoading(true);
      console.log('🔍 Fetching serial numbers for product:', id);
      
      const response = await api.get(`/serial-numbers?product_id=${id}&limit=1000`);
      
      if (response.success && response.data) {
        setSerialNumbers(response.data);
        
        // Calculate stock summary
        const summary: StockSummary = {
          total_serials: response.data.length,
          in_stock: response.data.filter((sn: SerialNumber) => sn.status === 'in_stock').length,
          sold: response.data.filter((sn: SerialNumber) => sn.status === 'sold').length,
          warranty_claim: response.data.filter((sn: SerialNumber) => sn.status === 'warranty_claim').length,
          defective: response.data.filter((sn: SerialNumber) => sn.status === 'defective').length,
          returned: response.data.filter((sn: SerialNumber) => sn.status === 'returned').length,
          disposed: response.data.filter((sn: SerialNumber) => sn.status === 'disposed').length
        };
        
        setStockSummary(summary);
        
        // Update calculated stock in form
        setFormData(prev => ({
          ...prev,
          calculatedStock: summary.in_stock
        }));
        
        console.log('📊 Serial numbers loaded:', summary);
      }
    } catch (error) {
      console.error('❌ Error fetching serial numbers:', error);
    } finally {
      setSerialLoading(false);
    }
  };

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        console.log('🔍 Fetching product with ID:', id);

        // Use standard products endpoint with authentication
        const response = await api.get(`/products/${id}`);

        if (!response.data.success) {
          throw new Error(`API Error: ${response.data.message || 'Failed to fetch product'}`);
        }

        const apiResponse = response.data;

        console.log('📦 API Response:', apiResponse);

        // Handle response structure - API returns { success: true, data: product }
        let productData = null;
        if (apiResponse.success && apiResponse.data) {
          productData = apiResponse.data;
        } else if (apiResponse.data) {
          // Fallback if response structure is different
          productData = apiResponse.data;
        } else {
          // Direct data response
          productData = apiResponse;
        }

        console.log('📋 Product Data:', productData);

        if (productData && productData.id) {
          setProduct(productData);
          setFormData({
            // Basic information
            name: productData.name || '',
            description: productData.description || '',
            sku: productData.sku || '',
            barcode: productData.barcode || '',
            category_id: (productData.category_id ?? productData.categoryId)?.toString() || '',

            // Pricing
            price: productData.price?.toString() || '',
            cost_price: (productData.cost_price ?? productData.costPrice)?.toString() || '',
            taxRate: productData.taxRate?.toString() || '',
            discountEligible: productData.discountEligible ?? true,

            // Inventory
            stock: (productData.stock ?? productData.stockQuantity)?.toString() || '',
            calculatedStock: 0, // Will be updated by fetchSerialNumbers
            min_stock: (productData.min_stock ?? productData.minStockLevel ?? productData.stockAlertThreshold)?.toString() || '',
            min_stock: (productData.min_stock ?? productData.minStockLevel ?? productData.stockAlertThreshold)?.toString() || '',
            maxStockLevel: productData.maxStockLevel?.toString() || '',
            reorderPoint: productData.reorderPoint?.toString() || '',
            reorderQuantity: productData.reorderQuantity?.toString() || '',

            // Product details
            brand: productData.brand || '',
            model: productData.model || '',
            unit: productData.unit || 'piece',
            weight: productData.weight?.toString() || '',
            dimensions: productData.dimensions || '',
            color: productData.color || '',
            size: productData.size || '',

            // Supplier
            supplierId: productData.supplierId?.toString() || '',
            supplierSku: productData.supplierSku || '',
            supplierPrice: productData.supplierPrice?.toString() || '',

            // Warranty
            warrantyPeriodMonths: productData.warrantyPeriodMonths?.toString() || '12',
            warrantyType: productData.warrantyType || 'manufacturer',
            warrantyTerms: productData.warrantyTerms || '',

            // Media
            imageUrl: productData.imageUrl || '',
            videoUrl: productData.videoUrl || '',

            // SEO
            metaTitle: productData.metaTitle || '',
            metaDescription: productData.metaDescription || '',
            tags: productData.tags || [],

            // Status
            is_active: productData.is_active ?? productData.isActive ?? true,
            isFeatured: productData.isFeatured ?? false,
            isDigital: productData.isDigital ?? false,
            requiresShipping: productData.requiresShipping ?? true,
            trackQuantity: productData.trackQuantity ?? true
          });
          
          // Determine stock calculation mode
          setStockCalculationMode(productData.trackQuantity ? 'auto' : 'manual');
          
          console.log('✅ Product data loaded successfully');
          
          // Fetch serial numbers after product data is loaded
          await fetchSerialNumbers();
        } else {
          setError('Không thể tải thông tin sản phẩm - dữ liệu không hợp lệ');
          console.error('❌ Invalid product data:', productData);
        }
      } catch (err: any) {
        console.error('❌ Error fetching product:', err);

        // Provide more specific error messages
        if (err.response?.status === 404) {
          setError('Không tìm thấy sản phẩm');
        } else if (err.response?.status === 401) {
          setError('Không có quyền truy cập');
        } else if (err.response?.status === 500) {
          setError('Lỗi máy chủ - vui lòng thử lại sau');
        } else {
          setError('Lỗi khi tải dữ liệu sản phẩm');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Real-time functionality
  useEffect(() => {
    if (!id) return;

    // Connect to real-time service
    realtimeService.connect();

    // Subscribe to product updates
    realtimeService.subscribeToProduct(parseInt(id));

    // Listen for product updates
    const handleProductUpdate = (event: any) => {
      if (event.data.product_id === parseInt(id)) {
        console.log('📡 Received real-time product update:', event);

        // Update form data with real-time changes
        if (event.type === 'stock_updated') {
          setFormData(prev => ({
            ...prev,
            stockQuantity: event.data.current_stock.toString()
          }));

          // Show notification
          console.log(`📦 Stock updated: ${event.data.product_name} - ${event.data.current_stock} units`);
        }

        if (event.type === 'serial_number_updated') {
          // Refresh serial numbers
          fetchSerialNumbers();
        }

        if (event.type === 'product_updated') {
          // Refresh product data
          fetchProduct();
        }
      }
    };

    // Subscribe to relevant events
    realtimeService.subscribe('stock_updated', handleProductUpdate);
    realtimeService.subscribe('product_updated', handleProductUpdate);
    realtimeService.subscribe('serial_number_updated', handleProductUpdate);
    realtimeService.subscribe('stock_low', handleProductUpdate);

    // Cleanup on unmount
    return () => {
      realtimeService.unsubscribe('stock_updated', handleProductUpdate);
      realtimeService.unsubscribe('product_updated', handleProductUpdate);
      realtimeService.unsubscribe('serial_number_updated', handleProductUpdate);
      realtimeService.unsubscribe('stock_low', handleProductUpdate);
      realtimeService.unsubscribeFromProduct(parseInt(id));
    };
  }, [id]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStockCalculationModeChange = (mode: 'manual' | 'auto') => {
    setStockCalculationMode(mode);
    
    if (mode === 'auto' && stockSummary) {
      // Use calculated stock from serial numbers
      setFormData(prev => ({
        ...prev,
        stockQuantity: stockSummary.in_stock.toString(),
        trackQuantity: true
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;

    try {
      const updateData = {
        name: formData.name,
        description: formData.description,
        sku: formData.sku,
        barcode: formData.barcode || null,
        category_id: parseInt(formData.category_id),
        price: parseFloat(formData.price),
        cost_price: parseFloat(formData.cost_price),
        tax_rate: parseFloat(formData.taxRate),
        stock: stockCalculationMode === 'auto' ? formData.calculatedStock : parseInt(formData.stock),
        min_stock: parseInt(formData.min_stock || '0'),
        track_quantity: stockCalculationMode === 'auto',
        is_active: formData.is_active,
        warranty_period_months: parseInt(formData.warrantyPeriodMonths),
        warranty_type: formData.warrantyType
      };

      const success = await updateProduct(`/products/${id}`, updateData);
      if (success) {
        // Refresh serial numbers after update
        await fetchSerialNumbers();
        navigate('/products');
      }
    } catch (err) {
      console.error('Error updating product:', err);
    }
  };

  const handleCancel = () => {
    navigate('/products');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'success';
      case 'sold': return 'primary';
      case 'warranty_claim': return 'warning';
      case 'defective': return 'error';
      case 'returned': return 'info';
      case 'disposed': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_stock': return <CheckIcon fontSize="small" />;
      case 'sold': return <QrCodeIcon fontSize="small" />;
      case 'warranty_claim': return <WarningIcon fontSize="small" />;
      case 'defective': return <ErrorIcon fontSize="small" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link color="inherit" href="/products" onClick={(e) => { e.preventDefault(); navigate('/products'); }}>
          Sản phẩm
        </Link>
        <Typography color="text.primary">Chỉnh sửa sản phẩm</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Chỉnh sửa sản phẩm
        </Typography>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={handleCancel}
        >
          Quay lại
        </Button>
      </Box>

      {/* Serial Number Summary Card */}
      {stockSummary && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                📊 Tổng quan Serial Numbers
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={fetchSerialNumbers}
                  disabled={serialLoading}
                >
                  Làm mới
                </Button>
                <Button
                  size="small"
                  startIcon={<ViewIcon />}
                  onClick={() => setShowSerialDialog(true)}
                >
                  Xem chi tiết
                </Button>
              </Box>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={6} md={2}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {stockSummary.total_serials}
                  </Typography>
                  <Typography variant="caption">Tổng SN</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={2}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {stockSummary.in_stock}
                  </Typography>
                  <Typography variant="caption">Trong kho</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={2}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">
                    {stockSummary.sold}
                  </Typography>
                  <Typography variant="caption">Đã bán</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={2}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {stockSummary.warranty_claim}
                  </Typography>
                  <Typography variant="caption">Bảo hành</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={2}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="error.main">
                    {stockSummary.defective}
                  </Typography>
                  <Typography variant="caption">Lỗi</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={2}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="text.secondary">
                    {stockSummary.returned}
                  </Typography>
                  <Typography variant="caption">Trả lại</Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Stock Calculation Mode */}
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle2" gutterBottom>
                Chế độ tính toán tồn kho:
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant={stockCalculationMode === 'manual' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => handleStockCalculationModeChange('manual')}
                >
                  Thủ công ({formData.stock || 0})
                </Button>
                <Button
                  variant={stockCalculationMode === 'auto' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => handleStockCalculationModeChange('auto')}
                  color="success"
                >
                  Tự động ({stockSummary.in_stock})
                </Button>
              </Box>
              {stockCalculationMode === 'auto' && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  Số lượng tồn kho sẽ được tính tự động từ Serial Numbers có trạng thái "Trong kho"
                </Alert>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Thông tin cơ bản
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tên sản phẩm"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="SKU"
                  value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Mô tả"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  multiline
                  rows={3}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Barcode"
                  value={formData.barcode}
                  onChange={(e) => handleInputChange('barcode', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Danh mục</InputLabel>
                  <Select
                    value={formData.category_id}
                    onChange={(e) => handleInputChange('category_id', e.target.value)}
                    label="Danh mục"
                    required
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Pricing */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Giá cả
                </Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Giá bán"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Giá vốn"
                  type="number"
                  value={formData.cost_price}
                  onChange={(e) => handleInputChange('cost_price', e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Thuế (%)"
                  type="number"
                  value={formData.taxRate}
                  onChange={(e) => handleInputChange('taxRate', e.target.value)}
                />
              </Grid>

              {/* Enhanced Inventory Section */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Tồn kho & Serial Numbers
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={stockCalculationMode === 'auto' ? 'Số lượng tồn kho (Tự động)' : 'Số lượng tồn kho'}
                  type="number"
                  value={stockCalculationMode === 'auto' ? formData.calculatedStock : formData.stock}
                  onChange={(e) => handleInputChange('stock', e.target.value)}
                  disabled={stockCalculationMode === 'auto'}
                  InputProps={{
                    endAdornment: stockCalculationMode === 'auto' && (
                      <Tooltip title="Được tính tự động từ Serial Numbers">
                        <CheckIcon color="success" />
                      </Tooltip>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Ngưỡng cảnh báo tồn kho"
                  type="number"
                  value={formData.min_stock}
                  onChange={(e) => handleInputChange('min_stock', e.target.value)}
                />
              </Grid>

              {/* Serial Numbers Display */}
              {serialNumbers.length > 0 && (
                <Grid item xs={12}>
                  <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Serial Numbers ({serialNumbers.length} total):
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, maxHeight: 200, overflow: 'auto' }}>
                      {serialNumbers.slice(0, 20).map((sn) => (
                        <Chip
                          key={sn.serial_number}
                          label={sn.serial_number}
                          color={getStatusColor(sn.status) as any}
                          size="small"
                          icon={getStatusIcon(sn.status)}
                          variant={sn.status === 'in_stock' ? 'filled' : 'outlined'}
                        />
                      ))}
                      {serialNumbers.length > 20 && (
                        <Chip
                          label={`+${serialNumbers.length - 20} more`}
                          variant="outlined"
                          size="small"
                          onClick={() => setShowSerialDialog(true)}
                        />
                      )}
                    </Box>
                  </Box>
                </Grid>
              )}

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tồn kho tối thiểu"
                  type="number"
                  value={formData.min_stock}
                  onChange={(e) => handleInputChange('min_stock', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tồn kho tối đa"
                  type="number"
                  value={formData.max_stock}
                  onChange={(e) => handleInputChange('max_stock', e.target.value)}
                />
              </Grid>

              {/* Warranty */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Bảo hành
                </Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Thời gian bảo hành (tháng)"
                  type="number"
                  value={formData.warrantyPeriodMonths}
                  onChange={(e) => handleInputChange('warrantyPeriodMonths', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Loại bảo hành</InputLabel>
                  <Select
                    value={formData.warrantyType}
                    onChange={(e) => handleInputChange('warrantyType', e.target.value)}
                    label="Loại bảo hành"
                  >
                    <MenuItem value="manufacturer">Bảo hành nhà sản xuất</MenuItem>
                    <MenuItem value="store">Bảo hành cửa hàng</MenuItem>
                    <MenuItem value="extended">Bảo hành mở rộng</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Status & Flags */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Trạng thái & Cài đặt
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_active}
                      onChange={(e) => handleInputChange('is_active', e.target.checked)}
                    />
                  }
                  label="Kích hoạt sản phẩm"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={stockCalculationMode === 'auto'}
                      onChange={(e) => handleStockCalculationModeChange(e.target.checked ? 'auto' : 'manual')}
                    />
                  }
                  label="Theo dõi số lượng bằng Serial Numbers"
                />
              </Grid>

              {/* Error display */}
              {updateError && (
                <Grid item xs={12}>
                  <Alert severity="error">{updateError}</Alert>
                </Grid>
              )}

              {/* Action buttons */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={handleCancel}
                    startIcon={<CancelIcon />}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={updateLoading}
                  >
                    {updateLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      {/* Serial Numbers Detail Dialog */}
      <Dialog
        open={showSerialDialog}
        onClose={() => setShowSerialDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Chi tiết Serial Numbers - {product?.name}
        </DialogTitle>
        <DialogContent>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Serial Number</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Khách hàng</TableCell>
                  <TableCell>Ngày bán</TableCell>
                  <TableCell>Bảo hành đến</TableCell>
                  <TableCell>Nhà cung cấp</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {serialNumbers.map((sn) => (
                  <TableRow key={sn.serial_number}>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {sn.serial_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={sn.status}
                        color={getStatusColor(sn.status) as any}
                        size="small"
                        icon={getStatusIcon(sn.status)}
                      />
                    </TableCell>
                    <TableCell>{sn.customer_name || '-'}</TableCell>
                    <TableCell>
                      {sn.sold_date ? new Date(sn.sold_date).toLocaleDateString('vi-VN') : '-'}
                    </TableCell>
                    <TableCell>
                      {sn.warranty_end_date ? new Date(sn.warranty_end_date).toLocaleDateString('vi-VN') : '-'}
                    </TableCell>
                    <TableCell>{sn.supplier_name || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSerialDialog(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProductEdit;
