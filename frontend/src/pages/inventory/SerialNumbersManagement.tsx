import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
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
  Avatar,
  CircularProgress,
} from '@mui/material';
import {
  Search,
  Add,
  Refresh,
  Visibility,
  Edit,
  Delete,
  QrCode,
  FilterList,
  CheckCircle,
  Error,
  Warning,
  Assignment,
  LocalShipping,
  Upload,
  CameraAlt,
  AutoFixHigh,
  Image,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serialNumbersAPI, productsAPI, inventorySerialAPI } from '../../services/api';
import { suppliersAPI } from '../../services/suppliersApi';
import { warehousesAPI } from '../../services/warehousesApi';
import OCRService from '../../services/OCRService';
import { lazy, Suspense } from 'react';

const CameraOCRDialog = lazy(() => import('../../components/CameraOCRDialog'));

// Serial Number Form Component
interface SerialFormProps {
  open: boolean;
  onClose: () => void;
  serialNumber?: any;
  products: any[];
}

const SerialForm: React.FC<SerialFormProps> = ({ open, onClose, serialNumber, products }) => {
  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    // Basic Information
    serial_number: serialNumber?.serial_number || '',
    product_id: serialNumber?.product_id || '',
    status: serialNumber?.status || 'in_stock',
    notes: serialNumber?.notes || '',
    
    // Import Information
    manufacturing_date: serialNumber?.manufacturing_date || getTodayDate(),
    import_date: serialNumber?.import_date || getTodayDate(),
    import_batch: serialNumber?.import_batch || '',
    import_invoice: serialNumber?.import_invoice || '',
    supplier_id: (serialNumber as any)?.supplier_id || '',
    imported_by: (serialNumber as any)?.imported_by || '',
    cost_price: (serialNumber as any)?.cost_price || '',
    warehouse_id: (serialNumber as any)?.warehouse_id || '',
    location: (serialNumber as any)?.location || '',
    
    // Sale Information
    sale_date: (serialNumber as any)?.sale_date || '',
    order_id: (serialNumber as any)?.order_id || '',
    customer_name: (serialNumber as any)?.customer_name || '',
    customer_phone: (serialNumber as any)?.customer_phone || '',
    sale_price: (serialNumber as any)?.sale_price || '',
    sold_by: (serialNumber as any)?.sold_by || '',
    sales_channel: (serialNumber as any)?.sales_channel || '',
    order_status: (serialNumber as any)?.order_status || '',
    
    // Warranty Information
    warranty_type: (serialNumber as any)?.warranty_type || 'Chính hãng',
    warranty_months: serialNumber?.warranty_months || 36,
    warranty_start: (serialNumber as any)?.warranty_start || '',
    warranty_end: (serialNumber as any)?.warranty_end || '',
    warranty_ticket: (serialNumber as any)?.warranty_ticket || '',
    warranty_provider: (serialNumber as any)?.warranty_provider || '',
    warranty_status: (serialNumber as any)?.warranty_status || 'Còn hạn',
    warranty_last_service: (serialNumber as any)?.warranty_last_service || '',
    
    // Internal Information
    internal_id: (serialNumber as any)?.internal_id || '',
    source: (serialNumber as any)?.source || 'Mua sỉ',
    cycle_count: (serialNumber as any)?.cycle_count || 0,
    cycle_status: (serialNumber as any)?.cycle_status || 'Chưa kiểm',
    risk_level: (serialNumber as any)?.risk_level || 'Thấp',
    internal_notes: (serialNumber as any)?.internal_notes || '',
    
    // System Information
    data_source: (serialNumber as any)?.data_source || 'Nhập tay',
    sync_status: (serialNumber as any)?.sync_status || 'Đã đồng bộ',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  // Update form data when serialNumber prop changes
  React.useEffect(() => {
    if (serialNumber) {
      setFormData({
        // Basic Information
        serial_number: serialNumber.serial_number || '',
        product_id: serialNumber.product_id || '',
        status: serialNumber.status || 'in_stock',
        notes: serialNumber.notes || '',
        
        // Import Information
        manufacturing_date: serialNumber.manufacturing_date || getTodayDate(),
        import_date: (serialNumber as any).import_date || getTodayDate(),
        import_batch: serialNumber.import_batch || '',
        import_invoice: (serialNumber as any).import_invoice || '',
        supplier_id: (serialNumber as any).supplier_id || '',
        imported_by: (serialNumber as any).imported_by || '',
        cost_price: (serialNumber as any).cost_price || '',
        warehouse_id: (serialNumber as any).warehouse_id || '',
        location: (serialNumber as any).location || '',
        
        // Sale Information
        sale_date: (serialNumber as any).sale_date || '',
        order_id: (serialNumber as any).order_id || '',
        customer_name: (serialNumber as any).customer_name || '',
        customer_phone: (serialNumber as any).customer_phone || '',
        sale_price: (serialNumber as any).sale_price || '',
        sold_by: (serialNumber as any).sold_by || '',
        sales_channel: (serialNumber as any).sales_channel || '',
        order_status: (serialNumber as any).order_status || '',
        
        // Warranty Information
        warranty_type: (serialNumber as any).warranty_type || 'Chính hãng',
        warranty_months: serialNumber.warranty_months || 36,
        warranty_start: (serialNumber as any).warranty_start || '',
        warranty_end: (serialNumber as any).warranty_end || '',
        warranty_ticket: (serialNumber as any).warranty_ticket || '',
        warranty_provider: (serialNumber as any).warranty_provider || '',
        warranty_status: (serialNumber as any).warranty_status || 'Còn hạn',
        warranty_last_service: (serialNumber as any).warranty_last_service || '',
        
        // Internal Information
        internal_id: (serialNumber as any).internal_id || '',
        source: (serialNumber as any).source || 'Mua sỉ',
        cycle_count: (serialNumber as any).cycle_count || 0,
        cycle_status: (serialNumber as any).cycle_status || 'Chưa kiểm',
        risk_level: (serialNumber as any).risk_level || 'Thấp',
        internal_notes: (serialNumber as any).internal_notes || '',
        
        // System Information
        data_source: (serialNumber as any).data_source || 'Nhập tay',
        sync_status: (serialNumber as any).sync_status || 'Đã đồng bộ',
      });
    } else {
      // Reset form for new serial with today's date
      setFormData({
        // Basic Information
        serial_number: '',
        product_id: '',
        status: 'in_stock',
        notes: '',
        
        // Import Information
        manufacturing_date: getTodayDate(),
        import_date: getTodayDate(),
        import_batch: '',
        import_invoice: '',
        supplier_id: '',
        imported_by: '',
        cost_price: '',
        warehouse_id: '',
        location: '',
        
        // Sale Information
        sale_date: '',
        order_id: '',
        customer_name: '',
        customer_phone: '',
        sale_price: '',
        sold_by: '',
        sales_channel: '',
        order_status: '',
        
        // Warranty Information
        warranty_type: 'Chính hãng',
        warranty_months: 36,
        warranty_start: '',
        warranty_end: '',
        warranty_ticket: '',
        warranty_provider: '',
        warranty_status: 'Còn hạn',
        warranty_last_service: '',
        
        // Internal Information
        internal_id: '',
        source: 'Mua sỉ',
        cycle_count: 0,
        cycle_status: 'Chưa kiểm',
        risk_level: 'Thấp',
        internal_notes: '',
        
        // System Information
        data_source: 'Nhập tay',
        sync_status: 'Đã đồng bộ',
      });
    }
    setFormError(null);
  }, [serialNumber, open]);

  const createMutation = useMutation({
    mutationFn: (data: any) => serialNumbersAPI.createSerialNumber(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serial-numbers'], exact: false });
      setFormError(null);
      onClose();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error || err?.message || 'Không thể tạo serial';
      setFormError(msg);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => serialNumbersAPI.updateSerialNumber(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serial-numbers'], exact: false });
      setFormError(null);
      onClose();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error || err?.message || 'Không thể cập nhật serial';
      setFormError(msg);
    }
  });

  // OCR Processing Functions
  const handleImageCapture = async (imageData: string) => {
    setIsProcessingOCR(true);
    setOcrError(null);

    try {
      const extractedData = await OCRService.processImage(imageData);

      // Auto-fill form with extracted data
      setFormData(prev => ({
        ...prev,
        serial_number: extractedData.serialNumber || prev.serial_number,
        import_invoice: extractedData.invoiceNumber || prev.import_invoice,
        supplier_id: extractedData.supplierName || prev.supplier_id,
        cost_price: extractedData.costPrice ? Math.round(extractedData.costPrice * 100) : prev.cost_price,
        sale_price: extractedData.salePrice ? Math.round(extractedData.salePrice * 100) : prev.sale_price,
        customer_name: extractedData.customerName || prev.customer_name,
        customer_phone: extractedData.customerPhone || prev.customer_phone,
        warranty_months: extractedData.warrantyMonths || prev.warranty_months,
        warranty_start: extractedData.warrantyStartDate || prev.warranty_start,
        warranty_end: extractedData.warrantyEndDate || prev.warranty_end,
        import_date: extractedData.purchaseDate || prev.import_date,
        sale_date: extractedData.saleDate || prev.sale_date,
        data_source: 'OCR',
      }));

      // Show success message
      setFormError(null);
    } catch (error) {
      console.error('OCR processing error:', error);
      setOcrError('Không thể xử lý ảnh. Vui lòng thử lại hoặc nhập thông tin thủ công.');
    } finally {
      setIsProcessingOCR(false);
    }
  };

  // Handle image file upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setOcrError('Vui lòng chọn file ảnh (JPG, PNG, etc.)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setOcrError('Kích thước ảnh quá lớn. Vui lòng chọn ảnh dưới 10MB.');
      return;
    }

    // Read file and convert to base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target?.result as string;
      if (imageData) {
        await handleImageCapture(imageData);
      }
    };
    reader.onerror = () => {
      setOcrError('Không thể đọc file ảnh. Vui lòng thử lại.');
    };
    reader.readAsDataURL(file);

    // Reset input so the same file can be selected again
    event.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.serial_number?.trim() || !formData.product_id?.trim()) {
      setFormError('Vui lòng nhập số serial và chọn sản phẩm.');
      return;
    }
    setFormError(null);

    // Build comprehensive submit data
    const submitData: any = {
      // Basic Information
      serial_number: formData.serial_number.trim(),
      product_id: formData.product_id.trim(),
      status: formData.status || 'in_stock',
      notes: formData.notes?.trim() || '',
      
      // Import Information
      manufacturing_date: formData.manufacturing_date?.trim() || null,
      import_date: formData.import_date?.trim() || null,
      import_batch: formData.import_batch?.trim() || null,
      import_invoice: formData.import_invoice?.trim() || null,
      supplier_id: formData.supplier_id || null,
      imported_by: formData.imported_by?.trim() || null,
      cost_price: formData.cost_price ? Number(formData.cost_price) : null,
      warehouse_id: formData.warehouse_id || null,
      location: formData.location?.trim() || null,
      
      // Sale Information
      sale_date: formData.sale_date?.trim() || null,
      order_id: formData.order_id?.trim() || null,
      customer_name: formData.customer_name?.trim() || null,
      customer_phone: formData.customer_phone?.trim() || null,
      sale_price: formData.sale_price ? Number(formData.sale_price) : null,
      sold_by: formData.sold_by?.trim() || null,
      sales_channel: formData.sales_channel?.trim() || null,
      order_status: formData.order_status?.trim() || null,
      
      // Warranty Information
      warranty_type: formData.warranty_type?.trim() || null,
      warranty_months: Number(formData.warranty_months) || 36,
      warranty_start: formData.warranty_start?.trim() || null,
      warranty_end: formData.warranty_end?.trim() || null,
      warranty_ticket: formData.warranty_ticket?.trim() || null,
      warranty_provider: formData.warranty_provider?.trim() || null,
      warranty_status: formData.warranty_status?.trim() || null,
      warranty_last_service: formData.warranty_last_service?.trim() || null,
      
      // Internal Information
      internal_id: formData.internal_id?.trim() || null,
      source: formData.source?.trim() || null,
      cycle_count: Number(formData.cycle_count) || 0,
      cycle_status: formData.cycle_status?.trim() || null,
      risk_level: formData.risk_level?.trim() || null,
      internal_notes: formData.internal_notes?.trim() || null,
      
      // System Information
      data_source: formData.data_source?.trim() || null,
      sync_status: formData.sync_status?.trim() || null,
    };

    if (serialNumber) {
      updateMutation.mutate({ id: serialNumber.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleChange = (field: string) => (e: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  // no-op retained

  const statusOptions = [
    { value: 'in_stock', label: 'Trong kho' },
    { value: 'sold', label: 'Đã bán' },
    { value: 'warranty', label: 'Bảo hành' },
    { value: 'returned', label: 'Đã trả' },
    { value: 'scrapped', label: 'Loại bỏ' },
  ];

  // Fetch suppliers and warehouses for selectors
  const suppliersQuery = useQuery({
    queryKey: ['suppliers','all'],
    queryFn: async () => {
      const res = await suppliersAPI.getSuppliers(1, 100);
      const d: any = (res as any)?.data;
      const list = d?.data?.suppliers || d?.suppliers || d?.items || [];
      return Array.isArray(list) ? list : [];
    }
  });
  const warehousesQuery = useQuery({
    queryKey: ['warehouses','all'],
    queryFn: async () => {
      const res: any = await warehousesAPI.getWarehouses(1, 100);
      const d: any = res;
      const list = d?.data?.items || d?.data?.warehouses || d?.items || d?.warehouses || d?.data || [];
      return Array.isArray(list) ? list : [];
    }
  });

  // Fetch categories and brands for product details
  const categoriesQuery = useQuery({
    queryKey: ['categories','all'],
    queryFn: async () => {
      const res = await productsAPI.getCategories();
      const d: any = (res as any)?.data;
      const list = d?.data?.categories || d?.categories || d?.items || [];
      return Array.isArray(list) ? list : [];
    }
  });
  const brandsQuery = useQuery({
    queryKey: ['brands','all'],
    queryFn: async () => {
      const res = await productsAPI.getBrands();
      const d: any = (res as any)?.data;
      const list = d?.data?.brands || d?.brands || d?.items || [];
      return Array.isArray(list) ? list : [];
    }
  });

  // Fetch users for imported_by and sold_by fields
  const usersQuery = useQuery({
    queryKey: ['users','all'],
    queryFn: async () => {
      const res = await serialNumbersAPI.getUsers?.() || { data: { users: [] } };
      const d: any = (res as any)?.data;
      const list = d?.data?.users || d?.users || d?.items || [];
      return Array.isArray(list) ? list : [];
    }
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{serialNumber ? 'Chỉnh sửa số serial' : 'Thêm số serial mới'}</span>
        <Button
          variant="contained"
          color="success"
          onClick={() => setIsCameraOpen(true)}
          sx={{ ml: 2 }}
          startIcon={<CameraAlt />}
        >
          📷 OCR - Chụp ảnh
        </Button>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ maxHeight: '80vh', overflow: 'auto' }}>
          {/* OCR Button - Prominent */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'success.light', borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'success.dark' }}>
              📷 Tính năng OCR - Tự động điền thông tin
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => setIsCameraOpen(true)}
                startIcon={<CameraAlt />}
                sx={{
                  backgroundColor: 'success.main',
                  fontSize: '16px',
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    backgroundColor: 'success.dark'
                  }
                }}
              >
                📷 Chụp ảnh giấy tờ
              </Button>
              <Button
                variant="contained"
                size="large"
                onClick={() => fileInputRef.current?.click()}
                startIcon={<Image />}
                disabled={isProcessingOCR}
                sx={{
                  backgroundColor: 'primary.main',
                  fontSize: '16px',
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    backgroundColor: 'primary.dark'
                  }
                }}
              >
                🖼️ Chọn ảnh từ thiết bị
              </Button>
            </Box>
            <Typography variant="caption" display="block" sx={{ mt: 1, color: 'success.dark' }}>
              Hệ thống sẽ tự động trích xuất: Serial, Giá, Khách hàng, Ngày tháng, v.v.
            </Typography>
          </Box>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />

          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}

          {ocrError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setOcrError(null)}>
              {ocrError}
            </Alert>
          )}

          {isProcessingOCR && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Box display="flex" alignItems="center" gap={2}>
                <CircularProgress size={20} />
                <Typography variant="body2">
                  Đang xử lý ảnh và trích xuất thông tin từ OCR... Vui lòng đợi.
                </Typography>
              </Box>
            </Alert>
          )}

          {formData.data_source === 'OCR' && !isProcessingOCR && (
            <Alert severity="success" sx={{ mb: 2 }}>
              ✓ Thông tin đã được tự động điền từ OCR. Vui lòng kiểm tra và chỉnh sửa nếu cần.
            </Alert>
          )}

          {/* Basic Information Section */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ color: 'primary.main' }}>
                🟦 Thông tin cơ bản
              </Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <TextField
                  fullWidth
                  label="Số serial *"
                  value={formData.serial_number}
                  onChange={handleChange('serial_number')}
                  required
                />
                <Button
                  variant="outlined"
                  startIcon={<CameraAlt />}
                  onClick={() => setIsCameraOpen(true)}
                  disabled={isProcessingOCR}
                  sx={{
                    minWidth: 'auto',
                    px: 1.5,
                    height: '56px',
                    borderColor: 'success.main',
                    color: 'success.main',
                    '&:hover': {
                      backgroundColor: 'success.main',
                      color: 'white'
                    }
                  }}
                  title="Chụp ảnh để tự động điền thông tin"
                >
                  📷
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Image />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingOCR}
                  sx={{
                    minWidth: 'auto',
                    px: 1.5,
                    height: '56px',
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'primary.main',
                      color: 'white'
                    }
                  }}
                  title="Chọn ảnh từ thiết bị để tự động điền thông tin"
                >
                  🖼️
                </Button>
              </Box>
              <FormControl fullWidth required>
                <InputLabel>Sản phẩm *</InputLabel>
                <Select
                  value={formData.product_id}
                  onChange={handleChange('product_id')}
                  label="Sản phẩm *"
                >
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.name} - {product.sku}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={formData.status}
                  onChange={handleChange('status')}
                  label="Trạng thái"
                >
                  {statusOptions.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Ghi chú"
                multiline
                rows={2}
                value={formData.notes}
                onChange={handleChange('notes')}
              />
            </Box>
          </Box>

          {/* Import Information Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: 'success.main' }}>
              🟩 Thông tin nhập hàng
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                fullWidth
                label="Ngày nhập hàng"
                type="date"
                value={formData.manufacturing_date}
                onChange={handleChange('manufacturing_date')}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Ngày nhập kho"
                type="date"
                value={formData.import_date}
                onChange={handleChange('import_date')}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Mã lô nhập"
                value={formData.import_batch}
                onChange={handleChange('import_batch')}
              />
              <TextField
                fullWidth
                label="Số hóa đơn nhập hàng"
                value={formData.import_invoice}
                onChange={handleChange('import_invoice')}
              />
              <FormControl fullWidth>
                <InputLabel>Nhà cung cấp</InputLabel>
                <Select
                  value={formData.supplier_id}
                  onChange={handleChange('supplier_id')}
                  label="Nhà cung cấp"
                >
                  {(Array.isArray(suppliersQuery.data) ? suppliersQuery.data : []).map((s: any) => (
                    <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Người nhập kho"
                value={formData.imported_by}
                onChange={handleChange('imported_by')}
              />
              <TextField
                fullWidth
                label="Giá nhập (₫)"
                type="number"
                value={formData.cost_price}
                onChange={handleChange('cost_price')}
                inputProps={{ min: 0 }}
              />
              <FormControl fullWidth>
                <InputLabel>Kho nhập</InputLabel>
                <Select
                  value={formData.warehouse_id}
                  onChange={handleChange('warehouse_id')}
                  label="Kho nhập"
                >
                  {(Array.isArray(warehousesQuery.data) ? warehousesQuery.data : []).map((w: any) => (
                    <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Vị trí lưu kho"
                value={formData.location}
                onChange={handleChange('location')}
                sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}
              />
            </Box>
          </Box>

          {/* Sale Information Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: 'warning.main' }}>
              🟨 Thông tin xuất hàng / bán
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                fullWidth
                label="Ngày xuất hàng"
                type="date"
                value={formData.sale_date}
                onChange={handleChange('sale_date')}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Mã đơn hàng"
                value={formData.order_id}
                onChange={handleChange('order_id')}
              />
              <TextField
                fullWidth
                label="Khách hàng"
                value={formData.customer_name}
                onChange={handleChange('customer_name')}
              />
              <TextField
                fullWidth
                label="Số điện thoại khách"
                value={formData.customer_phone}
                onChange={handleChange('customer_phone')}
              />
              <TextField
                fullWidth
                label="Giá bán (₫)"
                type="number"
                value={formData.sale_price}
                onChange={handleChange('sale_price')}
                inputProps={{ min: 0 }}
              />
              <TextField
                fullWidth
                label="Người bán"
                value={formData.sold_by}
                onChange={handleChange('sold_by')}
              />
              <TextField
                fullWidth
                label="Kênh bán hàng"
                value={formData.sales_channel}
                onChange={handleChange('sales_channel')}
              />
              <TextField
                fullWidth
                label="Tình trạng đơn hàng"
                value={formData.order_status}
                onChange={handleChange('order_status')}
              />
            </Box>
          </Box>

          {/* Warranty Information Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: 'error.main' }}>
              🟥 Thông tin bảo hành
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Loại bảo hành</InputLabel>
                <Select
                  value={formData.warranty_type}
                  onChange={handleChange('warranty_type')}
                  label="Loại bảo hành"
                >
                  <MenuItem value="Chính hãng">Chính hãng</MenuItem>
                  <MenuItem value="Bảo hành tại cửa hàng">Bảo hành tại cửa hàng</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Thời hạn bảo hành (tháng)"
                type="number"
                value={formData.warranty_months}
                onChange={handleChange('warranty_months')}
                inputProps={{ min: 0 }}
              />
              <TextField
                fullWidth
                label="Ngày bắt đầu bảo hành"
                type="date"
                value={formData.warranty_start}
                onChange={handleChange('warranty_start')}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Ngày hết hạn bảo hành"
                type="date"
                value={formData.warranty_end}
                onChange={handleChange('warranty_end')}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Số phiếu bảo hành"
                value={formData.warranty_ticket}
                onChange={handleChange('warranty_ticket')}
              />
              <TextField
                fullWidth
                label="Đơn vị bảo hành"
                value={formData.warranty_provider}
                onChange={handleChange('warranty_provider')}
              />
              <FormControl fullWidth>
                <InputLabel>Tình trạng bảo hành</InputLabel>
                <Select
                  value={formData.warranty_status}
                  onChange={handleChange('warranty_status')}
                  label="Tình trạng bảo hành"
                >
                  <MenuItem value="Còn hạn">Còn hạn</MenuItem>
                  <MenuItem value="Hết hạn">Hết hạn</MenuItem>
                  <MenuItem value="Đang xử lý">Đang xử lý</MenuItem>
                  <MenuItem value="Đã hoàn tất">Đã hoàn tất</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Ngày bảo hành gần nhất"
                type="date"
                value={formData.warranty_last_service}
                onChange={handleChange('warranty_last_service')}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </Box>

          {/* Internal Information Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: 'info.main' }}>
              🟧 Thông tin kỹ thuật – nội bộ
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                fullWidth
                label="Mã nhập hệ thống (internal_id)"
                value={formData.internal_id}
                onChange={handleChange('internal_id')}
              />
              <FormControl fullWidth>
                <InputLabel>Nguồn nhập</InputLabel>
                <Select
                  value={formData.source}
                  onChange={handleChange('source')}
                  label="Nguồn nhập"
                >
                  <MenuItem value="Mua sỉ">Mua sỉ</MenuItem>
                  <MenuItem value="Trả hàng">Trả hàng</MenuItem>
                  <MenuItem value="Bảo hành đổi mới">Bảo hành đổi mới</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Số lần kiểm kê"
                type="number"
                value={formData.cycle_count}
                onChange={handleChange('cycle_count')}
                inputProps={{ min: 0 }}
              />
              <FormControl fullWidth>
                <InputLabel>Tình trạng kiểm kê</InputLabel>
                <Select
                  value={formData.cycle_status}
                  onChange={handleChange('cycle_status')}
                  label="Tình trạng kiểm kê"
                >
                  <MenuItem value="Đã kiểm">Đã kiểm</MenuItem>
                  <MenuItem value="Chưa kiểm">Chưa kiểm</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Mức độ rủi ro</InputLabel>
                <Select
                  value={formData.risk_level}
                  onChange={handleChange('risk_level')}
                  label="Mức độ rủi ro"
                >
                  <MenuItem value="Thấp">Thấp</MenuItem>
                  <MenuItem value="Trung bình">Trung bình</MenuItem>
                  <MenuItem value="Cao">Cao</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Ghi chú nội bộ"
                multiline
                rows={2}
                value={formData.internal_notes}
                onChange={handleChange('internal_notes')}
              />
            </Box>
          </Box>

          {/* System Information Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: 'grey.600' }}>
              🟫 Thông tin hệ thống
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Nguồn dữ liệu</InputLabel>
                <Select
                  value={formData.data_source}
                  onChange={handleChange('data_source')}
                  label="Nguồn dữ liệu"
                >
                  <MenuItem value="Nhập tay">Nhập tay</MenuItem>
                  <MenuItem value="Import Excel">Import Excel</MenuItem>
                  <MenuItem value="API GHTK">API GHTK</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Trạng thái đồng bộ</InputLabel>
                <Select
                  value={formData.sync_status}
                  onChange={handleChange('sync_status')}
                  label="Trạng thái đồng bộ"
                >
                  <MenuItem value="Đã đồng bộ">Đã đồng bộ</MenuItem>
                  <MenuItem value="Chưa đồng bộ">Chưa đồng bộ</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Hủy</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {serialNumber ? 'Cập nhật' : 'Thêm mới'}
          </Button>
        </DialogActions>
      </form>

      {/* Camera OCR Dialog */}
      <Suspense fallback={null}>
        <CameraOCRDialog
          open={isCameraOpen}
          onClose={() => {
            setIsCameraOpen(false);
            setOcrError(null);
          }}
          onCapture={handleImageCapture}
          isProcessing={isProcessingOCR}
        />
      </Suspense>
    </Dialog>
  );
};

// Bulk Import Dialog Component
interface BulkImportDialogProps {
  open: boolean;
  onClose: () => void;
  products: any[];
  suppliers: any[];
  warehouses: any[];
}

const BulkImportDialog: React.FC<BulkImportDialogProps> = ({ open, onClose, products, suppliers, warehouses }) => {
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    product_id: '',
    serial_numbers_text: '',
    import_batch: '',
    manufacturing_date: getTodayDate(),
    location: '',
    warranty_months: 36,
    notes: '',
    supplier_id: '',
    warehouse_id: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      setFormData({
        product_id: '',
        serial_numbers_text: '',
        import_batch: '',
        manufacturing_date: getTodayDate(),
        location: '',
        warranty_months: 36,
        notes: '',
        supplier_id: '',
        warehouse_id: '',
      });
      setFormError(null);
      setImportResult(null);
    }
  }, [open]);

  const bulkImportMutation = useMutation({
    mutationFn: async (serials: any[]) => {
      return serialNumbersAPI.bulkImport(serials);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serial-numbers'], exact: false });
    },
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
    setFormData({ ...formData, [field]: e.target.value });
    setFormError(null);
  };

  // OCR Processing Functions
  const handleImageCapture = async (imageData: string) => {
    setIsProcessingOCR(true);
    setOcrError(null);

    try {
      const extractedData = await OCRService.processImage(imageData);

      // Extract serial number and append to textarea
      if (extractedData.serialNumber) {
        setFormData(prev => ({
          ...prev,
          serial_numbers_text: prev.serial_numbers_text
            ? `${prev.serial_numbers_text}\n${extractedData.serialNumber}`
            : extractedData.serialNumber,
        }));
      }

      // Auto-fill other form fields if not already set
      setFormData(prev => ({
        ...prev,
        import_batch: extractedData.invoiceNumber || prev.import_batch,
        supplier_id: extractedData.supplierName || prev.supplier_id,
        warranty_months: extractedData.warrantyMonths || prev.warranty_months,
        notes: prev.notes || extractedData.productName || '',
      }));

      // Show success message
      setFormError(null);
      setIsCameraOpen(false);
    } catch (error) {
      console.error('OCR processing error:', error);
      setOcrError('Không thể xử lý ảnh. Vui lòng thử lại hoặc nhập thông tin thủ công.');
    } finally {
      setIsProcessingOCR(false);
    }
  };

  // Handle image file upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setOcrError('Vui lòng chọn file ảnh (JPG, PNG, etc.)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setOcrError('Kích thước ảnh quá lớn. Vui lòng chọn ảnh dưới 10MB.');
      return;
    }

    // Read file and convert to base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target?.result as string;
      if (imageData) {
        await handleImageCapture(imageData);
      }
    };
    reader.onerror = () => {
      setOcrError('Không thể đọc file ảnh. Vui lòng thử lại.');
    };
    reader.readAsDataURL(file);

    // Reset input so the same file can be selected again
    event.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setImportResult(null);

    // Validate product selection
    if (!formData.product_id) {
      setFormError('Vui lòng chọn sản phẩm');
      return;
    }

    // Parse serial numbers (support both newline and comma separated)
    const serialNumbersRaw = formData.serial_numbers_text.trim();
    if (!serialNumbersRaw) {
      setFormError('Vui lòng nhập ít nhất một số serial');
      return;
    }

    // Split by newline or comma, then trim and filter out empty strings
    const serialNumbers = serialNumbersRaw
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (serialNumbers.length === 0) {
      setFormError('Không tìm thấy số serial hợp lệ');
      return;
    }

    // Check for duplicates in input
    const uniqueSerials = new Set(serialNumbers);
    if (uniqueSerials.size !== serialNumbers.length) {
      setFormError(`Phát hiện ${serialNumbers.length - uniqueSerials.size} số serial trùng lặp trong danh sách nhập`);
      return;
    }

    // Build array of serial objects
    const serialsToImport = serialNumbers.map(serial_number => ({
      serial_number,
      product_id: formData.product_id,
      status: 'in_stock',
      import_batch: formData.import_batch || null,
      manufacturing_date: formData.manufacturing_date || null,
      location: formData.location || null,
      warranty_months: Number(formData.warranty_months) || 36,
      notes: formData.notes || null,
      supplier_id: formData.supplier_id || undefined,
      warehouse_id: formData.warehouse_id || undefined,
    }));

    try {
      const result = await bulkImportMutation.mutateAsync(serialsToImport);
      const resultData = (result as any)?.data;

      if (resultData?.success) {
        const importedCount = resultData?.data?.count || 0;
        setImportResult({
          success: importedCount,
          failed: serialNumbers.length - importedCount,
          errors: [],
        });

        // If all successful, close dialog after 2 seconds
        if (importedCount === serialNumbers.length) {
          setTimeout(() => {
            onClose();
          }, 2000);
        }
      } else {
        setFormError(resultData?.error || 'Import thất bại');
      }
    } catch (error: any) {
      setFormError(error.message || 'Đã xảy ra lỗi khi import');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Import nhiều số serial</DialogTitle>
        <DialogContent sx={{ maxHeight: '80vh', overflow: 'auto' }}>
          {/* OCR Button - Prominent */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'success.light', borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'success.dark' }}>
              📷 Tính năng OCR - Tự động điền thông tin
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => setIsCameraOpen(true)}
                startIcon={<CameraAlt />}
                sx={{
                  backgroundColor: 'success.main',
                  fontSize: '16px',
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    backgroundColor: 'success.dark'
                  }
                }}
              >
                📷 Chụp ảnh giấy tờ
              </Button>
              <Button
                variant="contained"
                size="large"
                onClick={() => fileInputRef.current?.click()}
                startIcon={<Image />}
                disabled={isProcessingOCR}
                sx={{
                  backgroundColor: 'primary.main',
                  fontSize: '16px',
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    backgroundColor: 'primary.dark'
                  }
                }}
              >
                🖼️ Chọn ảnh từ thiết bị
              </Button>
            </Box>
            <Typography variant="caption" display="block" sx={{ mt: 1, color: 'success.dark' }}>
              Hệ thống sẽ tự động trích xuất: Serial, Lô nhập, Nhà cung cấp, Thời hạn BH, v.v.
            </Typography>
          </Box>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />

          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}

          {ocrError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setOcrError(null)}>
              {ocrError}
            </Alert>
          )}

          {isProcessingOCR && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Box display="flex" alignItems="center" gap={2}>
                <CircularProgress size={20} />
                <Typography variant="body2">
                  Đang xử lý ảnh và trích xuất thông tin từ OCR... Vui lòng đợi.
                </Typography>
              </Box>
            </Alert>
          )}

          {importResult && (
            <Alert severity={importResult.failed === 0 ? 'success' : 'warning'} sx={{ mb: 2 }}>
              Đã import thành công {importResult.success}/{importResult.success + importResult.failed} số serial
              {importResult.failed > 0 && ` (${importResult.failed} thất bại)`}
            </Alert>
          )}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2, mt: 2 }}>
            <Box>
              <FormControl fullWidth required>
                <InputLabel>Sản phẩm</InputLabel>
                <Select
                  value={formData.product_id}
                  onChange={handleChange('product_id')}
                  label="Sản phẩm"
                >
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.name} - {product.sku}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box>
              <TextField
                fullWidth
                required
                label="Danh sách số serial"
                multiline
                rows={8}
                value={formData.serial_numbers_text}
                onChange={handleChange('serial_numbers_text')}
                placeholder="Nhập mỗi số serial trên một dòng hoặc phân cách bằng dấu phẩy&#10;Ví dụ:&#10;SN001&#10;SN002&#10;SN003"
                helperText="Nhập mỗi số serial trên một dòng, hoặc phân cách bằng dấu phẩy"
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                fullWidth
                label="Mã lô nhập"
                value={formData.import_batch}
                onChange={handleChange('import_batch')}
              />
              <TextField
                fullWidth
                label="Ngày nhập hàng"
                type="date"
                value={formData.manufacturing_date}
                onChange={handleChange('manufacturing_date')}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Nhà cung cấp</InputLabel>
                <Select value={formData.supplier_id} label="Nhà cung cấp" onChange={handleChange('supplier_id')}>
                  {(Array.isArray(suppliers) ? suppliers : []).map((s: any) => (
                    <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Kho hàng</InputLabel>
                <Select value={formData.warehouse_id} label="Kho hàng" onChange={handleChange('warehouse_id')}>
                  {(Array.isArray(warehouses) ? warehouses : []).map((w: any) => (
                    <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box>
              <TextField
                fullWidth
                label="Vị trí"
                value={formData.location}
                onChange={handleChange('location')}
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                label="Thời hạn bảo hành (tháng)"
                type="number"
                value={formData.warranty_months}
                onChange={handleChange('warranty_months')}
                inputProps={{ min: 0 }}
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                label="Ghi chú"
                multiline
                rows={2}
                value={formData.notes}
                onChange={handleChange('notes')}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Hủy</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={bulkImportMutation.isPending}
            startIcon={<Upload />}
          >
            {bulkImportMutation.isPending ? 'Đang import...' : 'Import'}
          </Button>
        </DialogActions>
      </form>

      {/* Camera OCR Dialog */}
      <Suspense fallback={null}>
        <CameraOCRDialog
          open={isCameraOpen}
          onClose={() => {
            setIsCameraOpen(false);
            setOcrError(null);
          }}
          onCapture={handleImageCapture}
          isProcessing={isProcessingOCR}
        />
      </Suspense>
    </Dialog>
  );
};

// Serial Number Row Component
interface SerialRowProps {
  serialNumber: any;
  onEdit: (serialNumber: any) => void;
  onDelete: (id: string) => void;
  onView: (serialNumber: any) => void;
  onTrack: (id: string) => void;
}

const SerialRow: React.FC<SerialRowProps> = ({
  serialNumber,
  onEdit,
  onDelete,
  onView,
  onTrack,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'success';
      case 'sold': return 'info';
      case 'warranty': return 'warning';
      case 'returned': return 'default';
      case 'scrapped': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_stock': return <CheckCircle />;
      case 'sold': return <LocalShipping />;
      case 'scrapped': return <Error />;
      case 'warranty': return <Warning />;
      default: return null;
    }
  };

  const isWarrantyExpired = () => false;

  const isExpired = () => false;

  return (
    <TableRow>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
            <QrCode />
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {serialNumber.serial_number}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {serialNumber.batch_number || 'Không có lô'}
            </Typography>
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        <Typography variant="body2" fontWeight="medium">
          {serialNumber.product?.name || 'N/A'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          SKU: {serialNumber.product?.sku || 'N/A'}
        </Typography>
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getStatusIcon(serialNumber.status)}
          <Chip
            label={serialNumber.status}
            size="small"
            color={getStatusColor(serialNumber.status) as any}
          />
        </Box>
      </TableCell>
      <TableCell>
        <Box>
          <Typography variant="body2">
            {serialNumber.manufacturing_date ? new Date(serialNumber.manufacturing_date).toLocaleDateString('vi-VN') : 'N/A'}
          </Typography>
          {isExpired() && (
            <Chip label="Hết hạn" size="small" color="error" />
          )}
        </Box>
      </TableCell>
      <TableCell>
        <Box>
          <Typography variant="body2">
            {serialNumber.warranty_end ? new Date(serialNumber.warranty_end).toLocaleDateString('vi-VN') : 'N/A'}
          </Typography>
          {isWarrantyExpired() && (
            <Chip label="Hết BH" size="small" color="warning" />
          )}
        </Box>
      </TableCell>
      <TableCell>{serialNumber.location || 'Chưa xác định'}</TableCell>
      <TableCell>{new Date(serialNumber.created_at).toLocaleDateString('vi-VN')}</TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" onClick={() => onView(serialNumber)}>
            <Visibility />
          </IconButton>
          <IconButton size="small" onClick={() => onTrack(serialNumber.id)}>
            <Assignment />
          </IconButton>
          <IconButton size="small" onClick={() => onEdit(serialNumber)}>
            <Edit />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => onDelete(serialNumber.id)}>
            <Delete />
          </IconButton>
        </Box>
      </TableCell>
    </TableRow>
  );
};

// Main Serial Numbers Management Component
const SerialNumbersManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [selectedSerialNumber, setSelectedSerialNumber] = useState<any>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [filterProductId, setFilterProductId] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [reconcileOpen, setReconcileOpen] = useState(false);
  const [reconcileInput, setReconcileInput] = useState('');
  const [reconcileApplying, setReconcileApplying] = useState(false);

  const queryClient = useQueryClient();

  // Fetch serial numbers
  const { data: serialNumbersData, isLoading, error, refetch } = useQuery({
    queryKey: ['serial-numbers', page, pageSize, searchTerm],
    queryFn: () => serialNumbersAPI.getSerialNumbers(page, pageSize, searchTerm || undefined),
  });

  // Fetch products
  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsAPI.getProducts(1, 1000),
  });

  // Fetch suppliers and warehouses for bulk import selects
  const suppliersAll = useQuery({
    queryKey: ['suppliers','all-main'],
    queryFn: async () => {
      const res = await suppliersAPI.getSuppliers(1, 100);
      const d: any = (res as any)?.data;
      const list = d?.data?.suppliers || d?.suppliers || d?.items || [];
      return Array.isArray(list) ? list : [];
    }
  });
  const warehousesAll = useQuery({
    queryKey: ['warehouses','all-main'],
    queryFn: async () => {
      const res: any = await warehousesAPI.getWarehouses(1, 100);
      const d: any = res;
      const list = d?.data?.items || d?.data?.warehouses || d?.items || d?.warehouses || d?.data || [];
      return Array.isArray(list) ? list : [];
    }
  });

  const { data: serialList } = useSerialListing({ product_id: filterProductId || undefined, status: filterStatus || undefined, page, limit: 50 });
  const summaryQuery = useQuery({
    queryKey: ['inventory-serial-summary', filterProductId],
    queryFn: async () => (await inventorySerialAPI.getSummary(filterProductId || undefined)).data,
  });

  const reconcileMutation = useMutation({
    mutationFn: async (apply: boolean) => {
      const observed = reconcileInput.split(/\r?\n|,|;|\s+/).map(s => s.trim()).filter(Boolean);
      return (await inventorySerialAPI.reconcile({ product_id: filterProductId, observed_serials: observed, apply, reason: 'cycle_count' })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-serials'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-serial-summary'] });
      setReconcileApplying(false);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => serialNumbersAPI.deleteSerialNumber(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serial-numbers'], exact: false });
    },
  });

  // Quick add demo serial
  // Removed unused quickAddMutation to resolve linter error

  const serialRaw = (serialNumbersData as any)?.data?.data;
  const serialNumbers: any[] = (Array.isArray(serialRaw) ? serialRaw : []).map((sn: any) => ({
    ...sn,
    product: sn.product || {
      name: sn.product_name || 'N/A',
      sku: sn.product_sku || 'N/A',
    }
  }));
  const products = (productsData as any)?.data?.products || [];
  const pagination = (serialNumbersData as any)?.data?.pagination;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleEdit = (serialNumber: any) => {
    setSelectedSerialNumber(serialNumber);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa số serial này?')) {
      deleteMutation.mutate(id);
    }
  };

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewSerialNumber, setViewSerialNumber] = useState<any>(null);

  const handleView = (serialNumber: any) => {
    setViewSerialNumber(serialNumber);
    setViewDialogOpen(true);
  };

  const handleTrack = (id: string) => {
    console.log('Track serial number:', id);
  };

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          Không thể tải dữ liệu số serial. Vui lòng kiểm tra kết nối mạng.
        </Alert>
        <Button onClick={handleRefresh} startIcon={<Refresh />}>
          Thử lại
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Quản lý số serial
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Quản lý số serial sản phẩm và theo dõi bảo hành
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="success"
            startIcon={<CameraAlt />}
            onClick={() => {
              setSelectedSerialNumber(null);
              setFormOpen(true);
            }}
            sx={{
              backgroundColor: 'success.main',
              fontSize: '16px',
              px: 3,
              py: 1.5,
              '&:hover': {
                backgroundColor: 'success.dark'
              }
            }}
          >
            📷 OCR - Chụp ảnh tự động điền
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <Box>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <QrCode color="primary" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {pagination?.total || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng số serial
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CheckCircle color="success" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {serialNumbers.filter((s: any) => s.status === 'in_stock').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Có sẵn
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <LocalShipping color="info" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {serialNumbers.filter((s: any) => s.status === 'sold').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Đã bán
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Warning color="warning" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {serialNumbers.filter((s: any) => {
                      if (!s.warranty_end) return false;
                      return new Date(s.warranty_end) < new Date();
                    }).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Hết bảo hành
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Toolbar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Tìm kiếm số serial..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 300 }}
            />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setSelectedSerialNumber(null);
                setFormOpen(true);
              }}
            >
              Thêm số serial
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<Upload />}
              onClick={() => setBulkImportOpen(true)}
            >
              Import nhiều serial
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRefresh}
            >
              Làm mới
            </Button>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
            >
              Bộ lọc
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Serial Numbers Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Số serial</TableCell>
                <TableCell>Sản phẩm</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Ngày nhập hàng</TableCell>
                <TableCell>Bảo hành đến</TableCell>
                <TableCell>Vị trí</TableCell>
                <TableCell>Ngày tạo</TableCell>
                <TableCell>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {serialNumbers.map((serialNumber: any) => (
                <SerialRow
                  key={serialNumber.id}
                  serialNumber={serialNumber}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleView}
                  onTrack={handleTrack}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Empty State */}
      {serialNumbers.length === 0 && !isLoading && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Avatar sx={{ width: 64, height: 64, mx: 'auto', mb: 2, bgcolor: 'grey.100' }}>
              <QrCode sx={{ fontSize: 32, color: 'grey.400' }} />
            </Avatar>
            <Typography variant="h6" gutterBottom>
              Chưa có số serial nào
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Bắt đầu bằng cách thêm số serial đầu tiên của bạn
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setFormOpen(true)}
            >
              Thêm số serial đầu tiên
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Serial Number Form Dialog */}
      <SerialForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        serialNumber={selectedSerialNumber}
        products={products}
      />

      {/* View Serial Number Dialog - Rich details */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Chi tiết số serial</DialogTitle>
        <DialogContent>
          {viewSerialNumber && (
            <Box sx={{ display: 'grid', gap: 3, mt: 1 }}>
              {/* Thông tin cơ bản */}
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Thông tin cơ bản</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 1, alignItems: 'center' }}>
                  <Typography variant="body2" fontWeight="bold">Số serial:</Typography>
                  <Typography variant="body2">{viewSerialNumber.serial_number}</Typography>
                  <Typography variant="body2" fontWeight="bold">Sản phẩm:</Typography>
                  <Typography variant="body2">{viewSerialNumber.product?.name || viewSerialNumber.product_name || '—'}</Typography>
                  <Typography variant="body2" fontWeight="bold">SKU:</Typography>
                  <Typography variant="body2">{viewSerialNumber.product?.sku || viewSerialNumber.product_sku || '—'}</Typography>
                  <Typography variant="body2" fontWeight="bold">Danh mục:</Typography>
                  <Typography variant="body2">{viewSerialNumber.product?.category_name || viewSerialNumber.category_name || '—'}</Typography>
                  <Typography variant="body2" fontWeight="bold">Thương hiệu:</Typography>
                  <Typography variant="body2">{viewSerialNumber.product?.brand_name || viewSerialNumber.brand_name || '—'}</Typography>
                  <Typography variant="body2" fontWeight="bold">Model:</Typography>
                  <Typography variant="body2">{viewSerialNumber.product?.model || viewSerialNumber.model || '—'}</Typography>
                  <Typography variant="body2" fontWeight="bold">Trạng thái:</Typography>
                  <Box>
                    <Chip label={viewSerialNumber.status} size="small" color="primary" />
                  </Box>
                </Box>
              </Box>

              {/* Thông tin nhập hàng */}
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Thông tin nhập hàng</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 1, alignItems: 'center' }}>
                  <Typography variant="body2" fontWeight="bold">Ngày nhập hàng:</Typography>
                  <Typography variant="body2">{viewSerialNumber.manufacturing_date ? new Date(viewSerialNumber.manufacturing_date).toLocaleDateString('vi-VN') : '—'}</Typography>
                  <Typography variant="body2" fontWeight="bold">Ngày nhập kho:</Typography>
                  <Typography variant="body2">{viewSerialNumber.import_date ? new Date(viewSerialNumber.import_date).toLocaleDateString('vi-VN') : '—'}</Typography>
                  <Typography variant="body2" fontWeight="bold">Mã lô nhập:</Typography>
                  <Typography variant="body2">{viewSerialNumber.import_batch || '—'}</Typography>
                  <Typography variant="body2" fontWeight="bold">Số HĐ nhập:</Typography>
                  <Typography variant="body2">{viewSerialNumber.import_invoice || '—'}</Typography>
                  <Typography variant="body2" fontWeight="bold">Nhà cung cấp:</Typography>
                  <Typography variant="body2">{viewSerialNumber.supplier_name || '—'}</Typography>
                  <Typography variant="body2" fontWeight="bold">Người nhập kho:</Typography>
                  <Typography variant="body2">{viewSerialNumber.imported_by_name || viewSerialNumber.imported_by || '—'}</Typography>
                  <Typography variant="body2" fontWeight="bold">Giá nhập:</Typography>
                  <Typography variant="body2">{viewSerialNumber.cost_price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(viewSerialNumber.cost_price) : '—'}</Typography>
                  <Typography variant="body2" fontWeight="bold">Kho nhập:</Typography>
                  <Typography variant="body2">{viewSerialNumber.warehouse_name || '—'}</Typography>
                  <Typography variant="body2" fontWeight="bold">Vị trí lưu kho:</Typography>
                  <Typography variant="body2">{viewSerialNumber.location || '—'}</Typography>
                </Box>
              </Box>

              {/* Thông tin xuất hàng / bán */}
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Thông tin xuất hàng / bán</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 1, alignItems: 'center' }}>
                  <Typography variant="body2" fontWeight="bold">Ngày xuất hàng:</Typography>
                  <Typography variant="body2">{viewSerialNumber.sale_date ? new Date(viewSerialNumber.sale_date).toLocaleDateString('vi-VN') : '—'}</Typography>
                  <Typography variant="body2" fontWeight="bold">Mã đơn hàng:</Typography>
                  <Typography variant="body2">{viewSerialNumber.order_id || viewSerialNumber.order_number || '—'}</Typography>
                  <Typography variant="body2" fontWeight="bold">Khách hàng:</Typography>
                  <Typography variant="body2">{viewSerialNumber.customer_name || '—'}</Typography>
                  <Typography variant="body2" fontWeight="bold">SĐT khách:</Typography>
                  <Typography variant="body2">{viewSerialNumber.customer_phone || '—'}</Typography>
                  <Typography variant="body2" fontWeight="bold">Giá bán:</Typography>
                  <Typography variant="body2">{viewSerialNumber.sale_price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(viewSerialNumber.sale_price) : '—'}</Typography>
                  <Typography variant="body2" fontWeight="bold">Người bán:</Typography>
                  <Typography variant="body2">{viewSerialNumber.sold_by_name || viewSerialNumber.sold_by || '—'}</Typography>
                  <Typography variant="body2" fontWeight="bold">Kênh bán:</Typography>
                  <Typography variant="body2">{viewSerialNumber.sales_channel || '—'}</Typography>
                  <Typography variant="body2" fontWeight="bold">Tình trạng đơn:</Typography>
                  <Typography variant="body2">{viewSerialNumber.order_status || '—'}</Typography>
                </Box>
              </Box>

              {/* Thông tin bảo hành */}
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Thông tin bảo hành</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 1, alignItems: 'center' }}>
                  <Typography variant="body2" fontWeight="bold">Loại bảo hành:</Typography>
                  <Typography variant="body2">{viewSerialNumber.warranty_type || '—'}</Typography>
                  <Typography variant="body2" fontWeight="bold">Thời hạn bảo hành:</Typography>
                  <Typography variant="body2">{viewSerialNumber.warranty_months || 36} tháng</Typography>
                  <Typography variant="body2" fontWeight="bold">Ngày bắt đầu:</Typography>
                  <Typography variant="body2">{viewSerialNumber.warranty_start ? new Date(viewSerialNumber.warranty_start).toLocaleDateString('vi-VN') : '—'}</Typography>
                  <Typography variant="body2" fontWeight="bold">Ngày hết hạn:</Typography>
                  <Typography variant="body2">{viewSerialNumber.warranty_end_date || viewSerialNumber.warranty_end ? new Date(viewSerialNumber.warranty_end_date || viewSerialNumber.warranty_end).toLocaleDateString('vi-VN') : '—'}</Typography>
                  <Typography variant="body2" fontWeight="bold">Số phiếu BH:</Typography>
                  <Typography variant="body2">{viewSerialNumber.warranty_ticket || '—'}</Typography>
                  <Typography variant="body2" fontWeight="bold">Đơn vị bảo hành:</Typography>
                  <Typography variant="body2">{viewSerialNumber.warranty_provider || '—'}</Typography>
                  <Typography variant="body2" fontWeight="bold">Tình trạng bảo hành:</Typography>
                  <Typography variant="body2">{viewSerialNumber.warranty_status || '—'}</Typography>
                  <Typography variant="body2" fontWeight="bold">Lần bảo hành gần nhất:</Typography>
                  <Typography variant="body2">{viewSerialNumber.warranty_last_service ? new Date(viewSerialNumber.warranty_last_service).toLocaleDateString('vi-VN') : '—'}</Typography>
                </Box>
              </Box>

              {/* Nội bộ */}
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Thông tin kỹ thuật – nội bộ</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 1, alignItems: 'center' }}>
                  <Typography variant="body2" fontWeight="bold">Internal ID:</Typography>
                  <Typography variant="body2">{viewSerialNumber.internal_id || '—'}</Typography>
                  <Typography variant="body2" fontWeight="bold">Nguồn nhập:</Typography>
                  <Typography variant="body2">{viewSerialNumber.source || '—'}</Typography>
                  <Typography variant="body2" fontWeight="bold">Số lần kiểm kê:</Typography>
                  <Typography variant="body2">{viewSerialNumber.cycle_count || 0}</Typography>
                  <Typography variant="body2" fontWeight="bold">Tình trạng kiểm kê:</Typography>
                  <Typography variant="body2">{viewSerialNumber.cycle_status || '—'}</Typography>
                  <Typography variant="body2" fontWeight="bold">Mức độ rủi ro:</Typography>
                  <Typography variant="body2">{viewSerialNumber.risk_level || '—'}</Typography>
                  <Typography variant="body2" fontWeight="bold">Ghi chú nội bộ:</Typography>
                  <Typography variant="body2">{viewSerialNumber.internal_notes || viewSerialNumber.notes || '—'}</Typography>
                </Box>
              </Box>

              {/* Hệ thống */}
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Thông tin hệ thống</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 1, alignItems: 'center' }}>
                  <Typography variant="body2" fontWeight="bold">Ngày tạo:</Typography>
                  <Typography variant="body2">{new Date(viewSerialNumber.created_at).toLocaleString('vi-VN')}</Typography>
                  <Typography variant="body2" fontWeight="bold">Người tạo:</Typography>
                  <Typography variant="body2">{viewSerialNumber.created_by_name || viewSerialNumber.created_by || '—'}</Typography>
                  <Typography variant="body2" fontWeight="bold">Cập nhật gần nhất:</Typography>
                  <Typography variant="body2">{viewSerialNumber.updated_at ? new Date(viewSerialNumber.updated_at).toLocaleString('vi-VN') : '—'}</Typography>
                  <Typography variant="body2" fontWeight="bold">Người cập nhật:</Typography>
                  <Typography variant="body2">{viewSerialNumber.updated_by_name || viewSerialNumber.updated_by || '—'}</Typography>
                  <Typography variant="body2" fontWeight="bold">Nguồn dữ liệu:</Typography>
                  <Typography variant="body2">{viewSerialNumber.data_source || '—'}</Typography>
                  <Typography variant="body2" fontWeight="bold">Trạng thái đồng bộ:</Typography>
                  <Typography variant="body2">{viewSerialNumber.sync_status || '—'}</Typography>
                </Box>
              </Box>

              {viewSerialNumber.notes && (
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Ghi chú</Typography>
                  <Typography variant="body2">{viewSerialNumber.notes}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Đóng</Button>
          <Button
            variant="contained"
            onClick={() => {
              setViewDialogOpen(false);
              handleEdit(viewSerialNumber);
            }}
          >
            Chỉnh sửa
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Import Dialog */}
      <BulkImportDialog
        open={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
        products={products}
        suppliers={suppliersAll.data || []}
        warehouses={warehousesAll.data || []}
      />

      <Box sx={{ mb: 2 }}>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField label="Product ID" value={filterProductId} onChange={(e) => setFilterProductId(e.target.value)} size="small" />
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Trạng thái</InputLabel>
                <Select value={filterStatus} label="Trạng thái" onChange={(e) => setFilterStatus(String(e.target.value))}>
                  <MenuItem value="">Tất cả</MenuItem>
                  <MenuItem value="in_stock">Available</MenuItem>
                  <MenuItem value="reserved">Reserved</MenuItem>
                  <MenuItem value="sold">Sold</MenuItem>
                  <MenuItem value="returned">Returned</MenuItem>
                  <MenuItem value="damaged">Damaged</MenuItem>
                </Select>
              </FormControl>
              <Button variant="contained" onClick={() => { setPage(1); queryClient.invalidateQueries({ queryKey: ['inventory-serials'] }); }}>Tải</Button>
              <Button variant="outlined" onClick={() => setReconcileOpen(true)}>Reconcile</Button>
            </Box>
            {summaryQuery.data && (
              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {(Array.isArray((summaryQuery.data as any)?.summary)
                  ? (summaryQuery.data as any).summary
                  : Array.isArray((summaryQuery.data as any)?.data?.summary)
                    ? (summaryQuery.data as any).data.summary
                    : []
                ).map((s: any) => (
                  <Chip key={s.status} label={`${s.status}: ${s.count}`} />
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

        {(() => {
          const items = Array.isArray((serialList as any)?.items)
            ? (serialList as any).items
            : Array.isArray((serialList as any)?.data?.items)
              ? (serialList as any).data.items
              : Array.isArray((serialList as any)?.data)
                ? (serialList as any).data
                : [];
          return items.length > 0 ? (
            <TableContainer component={Card}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Serial</TableCell>
                    <TableCell>Sản phẩm</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Cập nhật</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((row: any) => (
                    <TableRow key={`${row.product_id}-${row.serial_number}`}>
                      <TableCell>{row.serial_number}</TableCell>
                      <TableCell>{row.product_name} ({row.product_sku})</TableCell>
                      <TableCell>{row.status}</TableCell>
                      <TableCell>{row.updated_at || row.created_at}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : null;
        })()}

        <Dialog open={reconcileOpen} onClose={() => setReconcileOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Reconcile Serial (mỗi serial cách nhau bởi xuống dòng, dấu phẩy hoặc khoảng trắng)</DialogTitle>
          <DialogContent>
            <TextField multiline minRows={6} fullWidth value={reconcileInput} onChange={(e) => setReconcileInput(e.target.value)} placeholder="Dán danh sách serial thực tế ở đây" />
            <Alert severity="info" sx={{ mt: 2 }}>Product ID hiện tại: {filterProductId || '—'}. Vui lòng nhập Product ID trước khi áp dụng.</Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReconcileOpen(false)}>Đóng</Button>
            <Button disabled={!filterProductId || reconcileApplying} onClick={() => { setReconcileApplying(true); reconcileMutation.mutate(false); }}>Preview</Button>
            <Button variant="contained" color="primary" disabled={!filterProductId || reconcileApplying} onClick={() => { setReconcileApplying(true); reconcileMutation.mutate(true); }}>Apply</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

// Simple hook to load serials with filters
const useSerialListing = (filters: { product_id?: string; status?: string; page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['inventory-serials', filters],
    queryFn: async () => {
      const res = await inventorySerialAPI.listSerials(filters);
      return res.data;
    },
    staleTime: 10_000,
  });
};

export default SerialNumbersManagement;