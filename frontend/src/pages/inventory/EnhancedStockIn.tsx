import React, { useState, useEffect } from 'react';
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

// Import all the enhanced components
import SupplierSelector from '../../components/SupplierSelector';
import SupplierPerformance from '../../components/SupplierPerformance';
import SmartProductSuggestions from '../../components/SmartProductSuggestions';
import InventoryForecasting from '../../components/InventoryForecasting';
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

  const renderTabContent = () => {
    switch (tabs[activeTab].component) {
      case 'stock-in':
        return (
          <Grid container spacing={3}>
            {/* Main Stock-In Form */}
            <Grid item xs={12} lg={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Thông tin phiếu nhập
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <SupplierSelector
                        value={selectedSupplier}
                        onChange={(supplier) => {
                          setSelectedSupplier(supplier);
                          setFormData(prev => ({ ...prev, supplier_id: supplier?.id || null }));
                        }}
                        label="Nhà cung cấp *"
                        placeholder="Tìm kiếm hoặc thêm nhà cung cấp..."
                        showQuickAdd={true}
                        showPerformance={true}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
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
                      onProductSelect={handleProductSelect}
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
                              <Grid item xs={12} sm={4}>
                                <Typography variant="subtitle2">
                                  {item.product_name}
                                </Typography>
                              </Grid>
                              <Grid item xs={6} sm={2}>
                                <Typography variant="body2">
                                  SL: {item.quantity}
                                </Typography>
                              </Grid>
                              <Grid item xs={6} sm={3}>
                                <Typography variant="body2">
                                  Giá: {item.cost_price.toLocaleString()} ₫
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={3}>
                                <SerialNumberInput
                                  value={item.serial_numbers}
                                  onChange={(serials) => {
                                    setItems(prev => prev.map((it, idx) => 
                                      idx === index ? { ...it, serial_numbers: serials } : it
                                    ));
                                  }}
                                  maxSerials={item.quantity}
                                  productName={item.product_name}
                                />
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
            <Grid item xs={12} lg={4}>
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
            <Grid item xs={12} md={6}>
              <SmartProductSuggestions
                supplierId={selectedSupplier?.id}
                onProductSelect={handleProductSelect}
                maxSuggestions={10}
              />
            </Grid>
            <Grid item xs={12} md={6}>
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
        onPhotosCapture={(photos) => {
          console.log('Photos captured:', photos);
          // Handle photo upload logic here
        }}
        productName={items[0]?.product_name}
        stockInId="new"
      />

      <BulkSerialImport
        open={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
        onImportComplete={(serialNumbers) => {
          console.log('Serial numbers imported:', serialNumbers);
          // Handle bulk import logic here
        }}
      />

      {selectedSupplier && (
        <SupplierPerformance
          supplier={selectedSupplier}
          onClose={() => setSupplierPerformanceOpen(false)}
        />
      )}
    </>
  );
};

export default EnhancedStockIn;
