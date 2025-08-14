import React, { useState, useEffect, useMemo } from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  Chip,
  Avatar,
  InputAdornment,
  IconButton,
  Paper
} from '@mui/material';
import {
  Search,
  QrCodeScanner,
  Inventory,
  Category
} from '@mui/icons-material';
import { debounce } from 'lodash';
import BarcodeScanner from './BarcodeScanner';
import api from '../services/api';

interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  category_name: string;
  price: number;
  cost_price: number;
  stock_quantity: number;
}

interface ProductSelectorProps {
  value: Product | null;
  onChange: (product: Product | null) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  showBarcodeScanner?: boolean;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({
  value,
  onChange,
  label = 'Chọn sản phẩm',
  placeholder = 'Tìm kiếm theo tên, SKU hoặc mã vạch...',
  disabled = false,
  error = false,
  helperText,
  showBarcodeScanner = true
}) => {
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce(async (searchTerm: string) => {
      if (!searchTerm.trim()) {
        setOptions([]);
        return;
      }

      setLoading(true);
      try {
        // Use the API service which handles authentication and base URL correctly
        const data = await api.get<{ data: Product[]; pagination: any }>(`/products?search=${encodeURIComponent(searchTerm)}&limit=20`);
        setOptions(data.data || []);
      } catch (error) {
        console.error('Error searching products:', error);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(inputValue);
    return () => {
      debouncedSearch.cancel();
    };
  }, [inputValue, debouncedSearch]);

  const handleBarcodeScanned = async (barcode: string) => {
    setInputValue(barcode);

    // Search for product by barcode
    try {
      // Use the API service which handles authentication and base URL correctly
      const data = await api.get<{ data: Product[]; pagination: any }>(`/products?search=${encodeURIComponent(barcode)}&limit=1`);
      const products = data.data || [];

      if (products.length > 0) {
        const product = products[0];
        // Check if barcode matches exactly
        if (product.barcode === barcode) {
          onChange(product);
          setInputValue(product.name);
        }
      }
    } catch (error) {
      console.error('Error finding product by barcode:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getStockStatusColor = (quantity: number) => {
    if (quantity === 0) return 'error';
    if (quantity < 10) return 'warning';
    return 'success';
  };

  const renderOption = (props: any, option: Product) => (
    <Box component="li" {...props}>
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', py: 1 }}>
        <Avatar
          sx={{
            bgcolor: 'primary.main',
            mr: 2,
            width: 40,
            height: 40
          }}
        >
          <Inventory />
        </Avatar>
        
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" noWrap>
            {option.name}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Chip
              label={option.sku}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.75rem' }}
            />
            
            {option.barcode && (
              <Chip
                label={option.barcode}
                size="small"
                color="secondary"
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
              />
            )}
            
            <Chip
              label={option.category_name}
              size="small"
              color="info"
              variant="outlined"
              sx={{ fontSize: '0.75rem' }}
              icon={<Category sx={{ fontSize: '0.75rem' }} />}
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Giá: {formatCurrency(option.price)}
            </Typography>
            
            <Chip
              label={`Tồn: ${option.stock_quantity}`}
              size="small"
              color={getStockStatusColor(option.stock_quantity)}
              variant="filled"
              sx={{ fontSize: '0.75rem' }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );

  const renderInput = (params: any) => (
    <TextField
      {...params}
      label={label}
      placeholder={placeholder}
      error={error}
      helperText={helperText}
      InputProps={{
        ...params.InputProps,
        startAdornment: (
          <InputAdornment position="start">
            <Search color="action" />
          </InputAdornment>
        ),
        endAdornment: (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {showBarcodeScanner && (
              <IconButton
                onClick={() => setScannerOpen(true)}
                size="small"
                color="primary"
                title="Quét mã vạch"
              >
                <QrCodeScanner />
              </IconButton>
            )}
            {params.InputProps.endAdornment}
          </Box>
        )
      }}
    />
  );

  return (
    <>
      <Autocomplete
        value={value}
        onChange={(_, newValue) => onChange(newValue)}
        inputValue={inputValue}
        onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
        options={options}
        loading={loading}
        disabled={disabled}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        renderOption={renderOption}
        renderInput={renderInput}
        noOptionsText="Không tìm thấy sản phẩm"
        loadingText="Đang tìm kiếm..."
        PaperComponent={({ children, ...props }) => (
          <Paper {...props} elevation={8}>
            {children}
          </Paper>
        )}
        sx={{
          '& .MuiAutocomplete-listbox': {
            maxHeight: 400,
            '& .MuiAutocomplete-option': {
              padding: 0
            }
          }
        }}
      />

      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleBarcodeScanned}
        title="Quét mã vạch sản phẩm"
      />
    </>
  );
};

export default ProductSelector;
