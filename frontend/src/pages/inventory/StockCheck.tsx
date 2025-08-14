import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Alert,
  TablePagination,
  Divider,
  Stack,
  CircularProgress,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { usePaginatedQuery } from '../../hooks/useApiData';
import api from '../../services/api';

// Import modular components
import { StockCheckHeader } from './components/StockCheckHeader';
import { StockCheckFiltersComponent } from './components/StockCheckFilters';
import { StockCheckTable } from './components/StockCheckTable';
import { 
  Product, 
  StockCheckItem, 
  StockCheckSession, 
  StockCheckFilters 
} from './components/types';

const StockCheck = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // State Management
  const [session, setSession] = useState<StockCheckSession | null>(null);
  const [items, setItems] = useState<StockCheckItem[]>([]);
  const [filters, setFilters] = useState<StockCheckFilters>({
    search: '',
    category: '',
    status: 'all'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [categories, setCategories] = useState<string[]>([]);
  
  // Add Product Dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

  // Fetch products for adding to stock check
  const {
    data: products,
    loading: productsLoading,
    error: productsError,
    refetch: refetchProducts
  } = usePaginatedQuery<Product>('/products', {
    page: page + 1,
    limit: rowsPerPage,
    search: filters.search,
    category: filters.category
  });

  // Initialize component
  useEffect(() => {
    initializeStockCheck();
    fetchCategories();
  }, []);

  const initializeStockCheck = async () => {
    try {
      setLoading(true);
      
      // Check if there's an active session
      const activeSession = await api.get<StockCheckSession>('/inventory/stock-check/active');
      
      if (activeSession) {
        setSession(activeSession);
        setItems(activeSession.items || []);
      } else {
        // Create new session
        const newSession = await api.post<StockCheckSession>('/inventory/stock-check', {
          session_name: `Kiểm kho ${new Date().toLocaleDateString('vi-VN')}`,
          status: 'in_progress'
        });
        setSession(newSession);
      }
    } catch (err) {
      setError('Không thể khởi tạo phiên kiểm kho');
      console.error('Stock check initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const categoriesData = await api.get<string[]>('/categories/names');
      setCategories(categoriesData || []);
    } catch (err) {
      console.error('Categories fetch error:', err);
    }
  };

  // Event Handlers
  const handleBack = () => {
    navigate('/inventory');
  };

  const handleSave = async () => {
    if (!session) return;

    try {
      setLoading(true);
      
      const updatedSession = {
        ...session,
        items,
        items_checked: items.filter(item => item.actual_quantity !== item.expected_quantity || item.actual_quantity === item.expected_quantity).length,
        discrepancies_found: items.filter(item => item.discrepancy !== 0).length
      };

      await api.put(`/inventory/stock-check/${session.id}`, updatedSession);
      
      enqueueSnackbar('Đã lưu kết quả kiểm kho', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar('Lỗi khi lưu kiểm kho', { variant: 'error' });
      console.error('Save stock check error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    refetchProducts();
    initializeStockCheck();
  };

  const handleItemUpdate = useCallback((productId: number, field: keyof StockCheckItem, value: any) => {
    setItems(prevItems => 
      prevItems.map(item => {
        if (item.product_id === productId) {
          const updatedItem = { ...item, [field]: value };
          
          // Recalculate discrepancy when actual_quantity changes
          if (field === 'actual_quantity') {
            updatedItem.discrepancy = updatedItem.actual_quantity - updatedItem.expected_quantity;
          }
          
          return updatedItem;
        }
        return item;
      })
    );
  }, []);

  const handleItemDelete = useCallback((productId: number) => {
    setItems(prevItems => prevItems.filter(item => item.product_id !== productId));
  }, []);

  const handleAddProducts = () => {
    setAddDialogOpen(true);
  };

  const handleProductSelect = (product: Product) => {
    const existingItem = items.find(item => item.product_id === product.id);
    if (existingItem) {
      enqueueSnackbar('Sản phẩm đã có trong danh sách kiểm kho', { variant: 'warning' });
      return;
    }

    const newItem: StockCheckItem = {
      product_id: product.id,
      product_name: product.name,
      product_sku: product.sku,
      expected_quantity: product.current_stock || 0,
      actual_quantity: 0,
      discrepancy: -(product.current_stock || 0),
      notes: ''
    };

    setItems(prevItems => [...prevItems, newItem]);
    setAddDialogOpen(false);
    enqueueSnackbar('Đã thêm sản phẩm vào kiểm kho', { variant: 'success' });
  };

  // Filter items based on current filters
  const filteredItems = items.filter(item => {
    if (filters.search && !item.product_name.toLowerCase().includes(filters.search.toLowerCase()) && 
        !item.product_sku.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    
    if (filters.status !== 'all') {
      switch (filters.status) {
        case 'accurate':
          return item.discrepancy === 0;
        case 'discrepancy':
          return item.discrepancy !== 0;
        case 'unchecked':
          return item.actual_quantity === 0;
        default:
          return true;
      }
    }
    
    return true;
  });

  // Pagination
  const paginatedItems = filteredItems.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={handleRefresh} variant="contained">
          Thử lại
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <StockCheckHeader
        session={session}
        onBack={handleBack}
        onSave={handleSave}
        onRefresh={handleRefresh}
        loading={loading}
      />

      <Divider sx={{ my: 3 }} />

      <StockCheckFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        categories={categories}
      />

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && (
        <>
          <StockCheckTable
            items={paginatedItems}
            onItemUpdate={handleItemUpdate}
            onItemDelete={handleItemDelete}
            loading={loading}
          />

          <TablePagination
            component="div"
            count={filteredItems.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Số dòng mỗi trang:"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} của ${count !== -1 ? count : `hơn ${to}`}`
            }
          />
        </>
      )}

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={handleAddProducts}
      >
        <AddIcon />
      </Fab>

      {/* Add Products Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Thêm sản phẩm vào kiểm kho</DialogTitle>
        <DialogContent>
          {/* Product selection interface would go here */}
          <Box sx={{ p: 2 }}>
            <Alert severity="info">
              Chức năng chọn sản phẩm sẽ được triển khai trong phiên bản tiếp theo
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StockCheck;
