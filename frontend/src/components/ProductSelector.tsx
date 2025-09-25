import React, { useState, useEffect, useMemo } from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  Chip,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Badge
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Inventory as InventoryIcon,
  ShoppingCart as CartIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  QrCode as QrCodeIcon,
  Visibility as ViewIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { comprehensiveAPI } from '../services/business/comprehensiveApi';

interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  cost: number;
  current_stock: number;
  min_stock: number;
  category_name?: string;
  supplier_name?: string;
  image_url?: string;
  description?: string;
  unit: string;
  status: 'active' | 'inactive' | 'discontinued';
  last_updated: string;
}

interface ProductSelectorProps {
  value?: Product | null;
  onChange: (product: Product | null) => void;
  onQuantityChange?: (quantity: number) => void;
  showQuantityInput?: boolean;
  showStockInfo?: boolean;
  allowCreateNew?: boolean;
  filterByCategory?: string;
  filterBySupplier?: string;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({
  value,
  onChange,
  onQuantityChange,
  showQuantityInput = false,
  showStockInfo = true,
  allowCreateNew = false,
  filterByCategory,
  filterBySupplier,
  placeholder = "Search products...",
  label = "Select Product",
  required = false,
  disabled = false
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [filterByCategory, filterBySupplier]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterByCategory) params.append('category', filterByCategory);
      if (filterBySupplier) params.append('supplier', filterBySupplier);
      params.append('status', 'active');

      const response = await comprehensiveAPI.products.getProducts({
        page: 1,
        limit: 1000,
        search: searchTerm,
        category: filterByCategory,
        supplier: filterBySupplier,
        status: 'active'
      });
      const productsData = response.data || [];
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (error) {
      console.error('Error loading products:', error);
      // NO MOCK DATA - Clear products on API failure
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    
    const search = searchTerm.toLowerCase();
    return products.filter(product => 
      product.name.toLowerCase().includes(search) ||
      product.sku.toLowerCase().includes(search) ||
      product.barcode?.toLowerCase().includes(search) ||
      product.category_name?.toLowerCase().includes(search)
    );
  }, [products, searchTerm]);

  const handleProductChange = (product: Product | null) => {
    onChange(product);
    if (showQuantityInput && onQuantityChange) {
      onQuantityChange(quantity);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    const validQuantity = Math.max(1, newQuantity);
    setQuantity(validQuantity);
    if (onQuantityChange) {
      onQuantityChange(validQuantity);
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.current_stock === 0) return { status: 'out', color: 'error', label: 'Out of Stock' };
    if (product.current_stock <= product.min_stock) return { status: 'low', color: 'warning', label: 'Low Stock' };
    return { status: 'good', color: 'success', label: 'In Stock' };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setDetailsOpen(true);
  };

  const renderProductOption = (props: any, product: Product) => {
    const stockInfo = getStockStatus(product);
    
    return (
      <Box component="li" {...props}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item>
            <Avatar
              src={product.image_url}
              sx={{ bgcolor: 'primary.main' }}
            >
              <InventoryIcon />
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="body1" fontWeight="bold">
              {product.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                SKU: {product.sku}
              </Typography>
              {product.category_name && (
                <Chip label={product.category_name} size="small" variant="outlined" />
              )}
            </Box>
            {showStockInfo && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Stock: {product.current_stock} {product.unit}
                </Typography>
                <Chip
                  label={stockInfo.label}
                  color={stockInfo.color}
                  size="small"
                />
              </Box>
            )}
          </Grid>
          <Grid item>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body1" fontWeight="bold">
                {formatCurrency(product.price)}
              </Typography>
              <Tooltip title="View Details">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(product);
                  }}
                >
                  <ViewIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <Box>
      <Grid container spacing={2} alignItems="flex-start">
        <Grid item xs={12} md={showQuantityInput ? 8 : 12} component="div">
          <Autocomplete
            value={value}
            onChange={(_, newValue) => handleProductChange(newValue)}
            options={filteredProducts}
            getOptionLabel={(option) => option ? `${option.name} (${option.sku})` : ''}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderOption={renderProductOption}
            renderInput={(params) => (
              <TextField
                {...params}
                label={label}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  endAdornment: (
                    <>
                      {loading ? <CircularProgress size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            loading={loading}
            onInputChange={(_, newInputValue) => setSearchTerm(newInputValue)}
            noOptionsText={
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  No products found
                </Typography>
                {allowCreateNew && (
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => setCreateDialogOpen(true)}
                    sx={{ mt: 1 }}
                  >
                    Create New Product
                  </Button>
                )}
              </Box>
            }
            filterOptions={(options) => options}
          />
        </Grid>
        
        {showQuantityInput && (
          <Grid item xs={12} md={4} component="div">
            <TextField
              label="Quantity"
              type="number"
              value={quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
              inputProps={{ min: 1 }}
              fullWidth
              disabled={!value}
            />
          </Grid>
        )}
      </Grid>

      {/* Selected Product Info */}
      {value && showStockInfo && (
        <Card variant="outlined" sx={{ mt: 2 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} component="div">
                <Typography variant="h6" gutterBottom>
                  Selected Product
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {value.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  SKU: {value.sku} | Price: {formatCurrency(value.price)}
                </Typography>
                {value.supplier_name && (
                  <Typography variant="body2" color="text.secondary">
                    Supplier: {value.supplier_name}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} sm={6} component="div">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Current Stock
                    </Typography>
                    <Typography variant="h6">
                      {value.current_stock} {value.unit}
                    </Typography>
                  </Box>
                  <Chip
                    label={getStockStatus(value).label}
                    color={getStockStatus(value).color}
                    icon={getStockStatus(value).status === 'good' ? <CheckIcon /> : <WarningIcon />}
                  />
                </Box>
                {value.current_stock <= value.min_stock && (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    Stock is below minimum level ({value.min_stock} {value.unit})
                  </Alert>
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Product Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Product Details
        </DialogTitle>
        <DialogContent>
          {selectedProduct && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4} component="div">
                  <Box sx={{ textAlign: 'center' }}>
                    <Avatar
                      src={selectedProduct.image_url}
                      sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                    >
                      <InventoryIcon sx={{ fontSize: 60 }} />
                    </Avatar>
                    <Typography variant="h6">{selectedProduct.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      SKU: {selectedProduct.sku}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={8} component="div">
                  <List>
                    <ListItem>
                      <ListItemText primary="Price" secondary={formatCurrency(selectedProduct.price)} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Cost" secondary={formatCurrency(selectedProduct.cost)} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Current Stock" secondary={`${selectedProduct.current_stock} ${selectedProduct.unit}`} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Minimum Stock" secondary={`${selectedProduct.min_stock} ${selectedProduct.unit}`} />
                    </ListItem>
                    {selectedProduct.category_name && (
                      <ListItem>
                        <ListItemText primary="Category" secondary={selectedProduct.category_name} />
                      </ListItem>
                    )}
                    {selectedProduct.supplier_name && (
                      <ListItem>
                        <ListItemText primary="Supplier" secondary={selectedProduct.supplier_name} />
                      </ListItem>
                    )}
                    {selectedProduct.barcode && (
                      <ListItem>
                        <ListItemText primary="Barcode" secondary={selectedProduct.barcode} />
                      </ListItem>
                    )}
                  </List>
                </Grid>
              </Grid>
              {selectedProduct.description && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body2">
                    {selectedProduct.description}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          {selectedProduct && (
            <Button
              variant="contained"
              onClick={() => {
                handleProductChange(selectedProduct);
                setDetailsOpen(false);
              }}
            >
              Select Product
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Create Product Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Product</DialogTitle>
        <DialogContent>
          <Alert severity="info">
            Product creation is not implemented in this demo. In a real application, this would open a product creation form.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductSelector;
