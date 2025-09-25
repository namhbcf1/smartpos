// @ts-nocheck
import React, { useState, useEffect, useRef, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  Tabs,
  Tab,
  Fab,
  Badge,
  useTheme,
  useMediaQuery,
  Drawer,
  IconButton,
  AppBar,
  Toolbar
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Add as AddIcon,
  Dashboard as DashboardIcon,
  Psychology as AIIcon,
  PhotoCamera as PhotoIcon,
  Analytics as AnalyticsIcon,
  Menu as MenuIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { API_BASE_URL } from '../../services/api';

// Import all the enhanced components
import SupplierSelector from '../../components/SupplierSelector';
import SupplierPerformance from '../../components/SupplierPerformance';
import SmartProductSuggestions from '../../components/SmartProductSuggestions';
import InventoryForecasting from '../../components/inventory/InventoryForecasting';
import InventoryDashboard from '../../components/InventoryDashboard';
import BulkSerialImport from '../../components/BulkSerialImport';
import PhotoCapture from '../../components/PhotoCapture';
import ProductSelector from '../../components/ProductSelector';
import SerialNumberInput from '../../components/SerialNumberInput';

interface Supplier {
  id: number;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
}

interface StockInItem {
  product_id: number;
  product_name: string;
  quantity: number;
  cost_price: number;
  serial_numbers: string[];
}

interface FormData {
  supplier_id: number | null;
  reference_number: string;
  notes: string;
  expected_date: string;
}

const EnhancedStockIn: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const wsRef = useRef<WebSocket | null>(null);
  const isMountedRef = useRef<boolean>(false);
  
  const [activeTab, setActiveTab] = useState(0);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [items, setItems] = useState<StockInItem[]>([]);
  const [formData, setFormData] = useState<FormData>({
    supplier_id: null,
    reference_number: '',
    notes: '',
    expected_date: new Date().toISOString().split('T')[0]
  });
  const [submitting, setSubmitting] = useState(false);

  // Totals
  const totals = useMemo(() => {
    const totalQty = items.reduce((s, i) => s + (i.quantity || 0), 0);
    const totalCost = items.reduce((s, i) => s + (i.quantity * (i.cost_price || 0)), 0);
    const totalLines = items.length;
    return { totalQty, totalCost, totalLines };
  }, [items]);

  // Dialog states
  const [photoCaptureOpen, setPhotoCaptureOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [supplierPerformanceOpen, setSupplierPerformanceOpen] = useState(false);

  const tabs = [
    { label: 'Nhập hàng', icon: <InventoryIcon />, component: 'stock-in' },
    { label: 'Gợi ý AI', icon: <AIIcon />, component: 'suggestions' },
    { label: 'Dự báo', icon: <AnalyticsIcon />, component: 'forecasting' },
    { label: 'Dashboard', icon: <DashboardIcon />, component: 'dashboard' }
  ];

  // Bỏ WebSocket riêng; sử dụng Worker/REST sẵn có của bạn để đồng bộ (nếu cần thì thêm polling ngoài này)

  const handleProductSelect = (product: any) => {
    const newItem: StockInItem = {
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      cost_price: product.cost_price || 0,
      serial_numbers: []
    };
    setItems(prev => [...prev, newItem]);
  };

  const updateItemQuantity = (index: number, delta: number) => {
    setItems(prev => prev.map((it, idx) => idx === index ? { ...it, quantity: Math.max(1, it.quantity + delta) } : it));
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const exportToCSV = () => {
    if (!items.length) return;
    const rows = items.map(i => ({
      product_id: i.product_id,
      product_name: i.product_name,
      quantity: i.quantity,
      cost_price: i.cost_price,
      total_cost: i.quantity * i.cost_price,
      serials: i.serial_numbers.join('|')
    }));
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(',')]
      .concat(rows.map(r => headers.map(h => JSON.stringify((r as any)[h] ?? '')).join(',')))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `stockin_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const clearForm = () => {
    setSelectedSupplier(null);
    setItems([]);
    setFormData({ supplier_id: null, reference_number: '', notes: '', expected_date: new Date().toISOString().split('T')[0] });
  };

  const buildPayload = () => ({
    supplier_id: formData.supplier_id,
    reference_number: formData.reference_number,
    notes: formData.notes,
    expected_date: formData.expected_date,
    items: items.map(i => ({
      product_id: i.product_id,
      quantity: i.quantity,
      cost_price: i.cost_price,
      serial_numbers: i.serial_numbers
    }))
  });

  const saveDraft = async () => {
    try {
      setSubmitting(true);
      const loadingId = toast.loading('Đang lưu bản nháp...');
      const { data } = await api.post(`${API_BASE_URL}/inventory/stock-in/drafts`, buildPayload());
      toast.success('Đã lưu bản nháp!', { id: loadingId });
      // Navigate to draft detail if returned
      if (data?.id) navigate(`/inventory/stock-in/drafts/${data.id}`);
    } catch (e) {
      console.error(e);
      toast.error('Không thể lưu bản nháp');
    } finally {
      setSubmitting(false);
    }
  };

  const submitStockIn = async () => {
    // Stronger validation
    if (!formData.supplier_id) return toast.error('Vui lòng chọn nhà cung cấp');
    if (items.length === 0) return toast.error('Vui lòng thêm ít nhất 1 sản phẩm');
    for (const [idx, it] of items.entries()) {
      if (!it.product_id) return toast.error(`Dòng ${idx + 1}: thiếu sản phẩm`);
      if (!it.quantity || it.quantity <= 0) return toast.error(`Dòng ${idx + 1}: số lượng phải > 0`);
      if (it.cost_price == null || it.cost_price < 0) return toast.error(`Dòng ${idx + 1}: giá không hợp lệ`);
      if (it.serial_numbers && it.serial_numbers.length > it.quantity) return toast.error(`Dòng ${idx + 1}: số serial vượt quá số lượng`);
    }
    try {
      setSubmitting(true);
      const loadingId = toast.loading('Đang tạo phiếu nhập...');
      const { data } = await api.post(`${API_BASE_URL}/inventory/stock-in`, buildPayload());
      clearForm();
      toast.success('Tạo phiếu nhập thành công!', { id: loadingId });
      // Navigate to receipt detail
      if (data?.id) navigate(`/inventory/stock-in/${data.id}`);
    } catch (e) {
      console.error(e);
      toast.error('Không thể tạo phiếu nhập');
    } finally {
      setSubmitting(false);
    }
  };

  const renderTabContent = () => {
    switch (tabs[activeTab].component) {
      case 'stock-in':
        return (
          <Grid container spacing={3}>
            {/* Main Stock-In Form */}
            <Grid item xs={12} lg={8} component="div">
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Thông tin phiếu nhập
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6} component="div">
                      <SupplierSelector
                        value={selectedSupplier as any}
                        onChange={(supplier: any) => {
                          setSelectedSupplier(supplier);
                          setFormData(prev => ({ ...prev, supplier_id: supplier?.id || null }));
                        }}
                        label="Nhà cung cấp *"
                        placeholder="Tìm kiếm hoặc thêm nhà cung cấp..."
                        showQuickAdd={true}
                        showPerformance={true}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6} component="div">
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => setPhotoCaptureOpen(true)}
                          startIcon={<PhotoIcon />}
                        >
                          Chụp ảnh
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => setBulkImportOpen(true)}
                          startIcon={<AddIcon />}
                        >
                          Import hàng loạt
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => navigate('/inventory')}
                          startIcon={<DashboardIcon />}
                        >
                          Tồn kho
                        </Button>
                        {selectedSupplier && (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => setSupplierPerformanceOpen(true)}
                            startIcon={<AnalyticsIcon />}
                          >
                            Hiệu suất NCC
                          </Button>
                        )}
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Product Selection */}
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Chọn sản phẩm
                    </Typography>
                    <ProductSelector
                      {...({ onProductSelect: handleProductSelect } as any)}
                      placeholder="Tìm kiếm sản phẩm theo tên, SKU hoặc mã vạch..."
                    />
                  </Box>

                  {/* Items List */}
                  {items.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Danh sách sản phẩm ({items.length})
                      </Typography>
                      {items.map((item, index) => (
                        <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                          <CardContent>
                            <Grid container spacing={2} alignItems="center">
                              <Grid item xs={12} sm={4} component="div">
                                <Typography variant="subtitle2">
                                  {item.product_name}
                                </Typography>
                              </Grid>
                              <Grid item xs={6} sm={3} component="div">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Button variant="outlined" size="small" onClick={() => updateItemQuantity(index, -1)}>-</Button>
                                  <Typography variant="body2" sx={{ minWidth: 24, textAlign: 'center' }}>{item.quantity}</Typography>
                                  <Button variant="outlined" size="small" onClick={() => updateItemQuantity(index, 1)}>+</Button>
                                </Box>
                              </Grid>
                              <Grid item xs={6} sm={3} component="div">
                                <Typography variant="body2">
                                  Giá: {item.cost_price.toLocaleString()} ₫
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={2} component="div">
                                <SerialNumberInput
                                  value={item.serial_numbers}
                                  onChange={(serials) => {
                                    setItems(prev => prev.map((it, idx) => 
                                      idx === index ? { ...it, serial_numbers: serials } : it
                                    ));
                                  }}
                                  maxSerials={item.quantity}
                                />
                              </Grid>
                              <Grid item xs={12} sm={2} sx={{ display: 'flex', justifyContent: 'flex-end' }} component="div">
                                <Button color="error" size="small" onClick={() => removeItem(index)}>Xóa</Button>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Smart Suggestions Sidebar */}
            <Grid item xs={12} lg={4} component="div">
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <SmartProductSuggestions
                  supplierId={selectedSupplier?.id}
                  onProductSelect={handleProductSelect}
                  maxSuggestions={5}
                />
              </Box>
            </Grid>
          </Grid>
        );

      case 'suggestions':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} component="div">
              <SmartProductSuggestions
                supplierId={selectedSupplier?.id}
                onProductSelect={handleProductSelect}
                maxSuggestions={10}
              />
            </Grid>
            <Grid item xs={12} md={6} component="div">
              <InventoryForecasting
                supplierId={selectedSupplier?.id}
                onReorderSuggestion={(productId, quantity) => {
                  console.log('Reorder suggestion:', productId, quantity);
                }}
              />
            </Grid>
          </Grid>
        );

      case 'forecasting':
        return (
          <InventoryForecasting
            supplierId={selectedSupplier?.id}
            onReorderSuggestion={(productId, quantity) => {
              console.log('Reorder suggestion:', productId, quantity);
            }}
          />
        );

      case 'dashboard':
        return <InventoryDashboard compactMode={isMobile} />;

      default:
        return null;
    }
  };

  const drawerContent = (
    <Box sx={{ width: 280, p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Menu</Typography>
        <IconButton onClick={() => setMobileDrawerOpen(false)}>
          <CloseIcon />
        </IconButton>
      </Box>
      
      {tabs.map((tab, index) => (
        <Button
          key={index}
          fullWidth
          variant={activeTab === index ? 'contained' : 'text'}
          startIcon={tab.icon}
          onClick={() => {
            setActiveTab(index);
            setMobileDrawerOpen(false);
          }}
          sx={{ mb: 1, justifyContent: 'flex-start' }}
        >
          {tab.label}
        </Button>
      ))}
    </Box>
  );

  return (
    <>
      {/* Mobile App Bar */}
      {isMobile && (
        <AppBar position="sticky" color="default" elevation={1}>
          <Toolbar>
            <IconButton
              edge="start"
              onClick={() => setMobileDrawerOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {tabs[activeTab].label}
            </Typography>
            <Badge badgeContent={items.length} color="primary">
              <InventoryIcon />
            </Badge>
          </Toolbar>
        </AppBar>
      )}

      <Container maxWidth="xl" sx={{ py: isMobile ? 1 : 3 }}>
        {/* Desktop Header */}
        {!isMobile && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InventoryIcon />
              Nhập kho nâng cao
              <Badge badgeContent={items.length} color="primary">
                <AddIcon />
              </Badge>
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <Box sx={{ mr: 2, display: 'flex', gap: 2 }}>
                <Badge color="secondary" badgeContent={totals.totalLines}>Dòng</Badge>
                <Badge color="secondary" badgeContent={totals.totalQty}>SL</Badge>
                <Badge color="secondary" badgeContent={`${totals.totalCost.toLocaleString()} ₫`}>Tổng</Badge>
              </Box>
              <Button variant="outlined" onClick={() => {
                exportToCSV();
                toast.success('Đã xuất CSV');
              }}>Xuất CSV</Button>
              <Button variant="outlined" onClick={saveDraft} disabled={submitting || items.length === 0}>Lưu nháp</Button>
              <Button variant="contained" onClick={submitStockIn} disabled={submitting || items.length === 0 || !formData.supplier_id}>Tạo phiếu nhập</Button>
              <Button variant="text" color="warning" onClick={() => { clearForm(); toast('Đã làm mới biểu mẫu'); }}>Làm mới</Button>
            </Box>
            
            <Tabs 
              value={activeTab} 
              onChange={(_, newValue) => setActiveTab(newValue)} 
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              {tabs.map((tab, index) => (
                <Tab
                  key={index}
                  icon={tab.icon}
                  label={tab.label}
                  iconPosition="start"
                />
              ))}
            </Tabs>
          </Box>
        )}

        {/* Tab Content */}
        <Box sx={{ mt: isMobile ? 2 : 3 }}>
          {renderTabContent()}
        </Box>

        {/* Mobile Drawer */}
        <Drawer
          anchor="left"
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Floating Action Button for Mobile */}
        {isMobile && activeTab === 0 && (
          <Fab
            color="primary"
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
            onClick={() => setPhotoCaptureOpen(true)}
          >
            <PhotoIcon />
          </Fab>
        )}
      </Container>

      {/* Dialogs */}
      <PhotoCapture
        open={photoCaptureOpen}
        onClose={() => setPhotoCaptureOpen(false)}
        onPhotosCapture={(photos: any[]) => {
          const uploadUrl = `${API_BASE_URL}/r2/upload` as string;
          if (!uploadUrl) return;
          const form = new FormData();
          photos.forEach((p: any, idx: number) => form.append('file' + idx, (p?.file as File) || p));
          const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
          fetch(uploadUrl, { 
            method: 'POST', 
            body: form,
            headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
            credentials: 'include'
          })
            .then(() => {})
            .catch(() => {});
        }}
        productName={items[0]?.product_name}
        stockInId="new"
      />

      <BulkSerialImport
        open={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
        onImportComplete={(serialNumbers) => {
          // Distribute serial numbers to the first item that can accept more serials
          setItems(prev => {
            const next = [...prev];
            for (let i = 0; i < next.length && serialNumbers.length > 0; i++) {
              const can = Math.max(0, next[i].quantity - next[i].serial_numbers.length);
              if (can > 0) {
                const take = serialNumbers.splice(0, can);
                next[i] = { ...next[i], serial_numbers: [...next[i].serial_numbers, ...take] };
              }
            }
            return next;
          });
        }}
      />

      {selectedSupplier && (
        <div>
        {/*<SupplierPerformance
          supplier={selectedSupplier}
          onClose={() => setSupplierPerformanceOpen(false)}
        />*/}
        </div>
      )}
    </>
  );
};

export default EnhancedStockIn;
