import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Alert,
  TablePagination,
  Divider,
  CircularProgress,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  
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
  // Product dialog state
  const [dialogSearch, setDialogSearch] = useState('');

  // Fetch products for adding to stock check
  const {
    data: products,
    isLoading: productsLoading,
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
      const activeSession = await api.get<StockCheckSession | null>('/inventory/stock-check/active');
      
      if (activeSession) {
        setSession(activeSession);
        // Fetch items for this session
        if (typeof activeSession.id === 'number') {
          await fetchSessionItems(activeSession.id);
        } else {
          setItems([]);
        }
      } else {
        // Create new session
        const newSession = await api.post<StockCheckSession>('/inventory/stock-check', {
          session_name: `Kiểm kho ${new Date().toLocaleDateString('vi-VN')}`,
          status: 'in_progress'
        });
        setSession(newSession);
        setItems([]); // Initialize with empty array for new session
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
      const categoriesData = await api.get<any>('/categories/names');
      // Normalize to a string[] in all cases
      let normalized: string[] = [];
      if (Array.isArray(categoriesData)) {
        normalized = categoriesData as string[];
      } else if (categoriesData && Array.isArray(categoriesData?.data)) {
        normalized = categoriesData.data as string[];
      } else if (categoriesData && Array.isArray(categoriesData?.items)) {
        normalized = categoriesData.items as string[];
      } else if (categoriesData && typeof categoriesData === 'object') {
        const keys = Object.keys(categoriesData);
        if (keys.length) {
          normalized = keys;
        }
      }
      setCategories(normalized);
    } catch (err) {
      console.error('Categories fetch error:', err);
      setCategories([]);
    }
  };

  const fetchSessionItems = async (sessionId: number) => {
    try {
      const itemsData = await api.get<StockCheckItem[]>(`/inventory/stock-check/${sessionId}/items`);
      setItems(Array.isArray(itemsData) ? itemsData : []);
    } catch (err) {
      console.error('Session items fetch error:', err);
      setItems([]); // Ensure items is always an array
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
      
      const safeItemsForSave = Array.isArray(items) ? items : [];
      const updatedSession = {
        ...session,
        items: safeItemsForSave,
        items_checked: safeItemsForSave.filter(item => item.actual_quantity !== item.expected_quantity || item.actual_quantity === item.expected_quantity).length,
        discrepancies_found: safeItemsForSave.filter(item => item.discrepancy !== 0).length
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

  const handleExportCSV = () => {
    try {
      const header = ['Product ID','Name','SKU','Expected','Actual','Discrepancy','Notes'];
      const rows = (Array.isArray(items) ? items : []).map(i => [
        i.product_id,
        '"' + (i.product_name ?? '').replace(/"/g, '""') + '"',
        '"' + (i.product_sku ?? '').replace(/"/g, '""') + '"',
        i.expected_quantity,
        i.actual_quantity,
        i.discrepancy,
        '"' + (i.notes ?? '').replace(/"/g, '""') + '"'
      ].join(','));
      const csv = [header.join(','), ...rows].join('\n');
      const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stock-check-${session?.id ?? 'new'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      enqueueSnackbar('Đã xuất CSV', { variant: 'success' });
    } catch (e) {
      enqueueSnackbar('Xuất CSV thất bại', { variant: 'error' });
    }
  };

  const handleCompleteSession = async () => {
    if (!session?.id) return;
    try {
      setLoading(true);
      const safeItemsForSave = Array.isArray(items) ? items : [];
  const payload = {
        ...session,
        status: 'completed',
        items: safeItemsForSave,
        items_checked: safeItemsForSave.length,
        discrepancies_found: safeItemsForSave.filter(it => it.discrepancy !== 0).length
      };
      await api.put(`/inventory/stock-check/${session.id}`, payload);
      enqueueSnackbar('Đã hoàn tất phiên kiểm kho', { variant: 'success' });
      await initializeStockCheck();
    } catch (err) {
      enqueueSnackbar('Không thể hoàn tất phiên', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleItemUpdate = useCallback((productId: number, field: keyof StockCheckItem, value: any) => {
    setItems(prevItems => {
      // Ensure prevItems is an array
      const safePrevItems = Array.isArray(prevItems) ? prevItems : [];
      return safePrevItems.map(item => {
        if (item.product_id === productId) {
          const updatedItem = { ...item, [field]: value };
          
          // Recalculate discrepancy when actual_quantity changes
          if (field === 'actual_quantity') {
            updatedItem.discrepancy = updatedItem.actual_quantity - updatedItem.expected_quantity;
          }
          
          return updatedItem;
        }
        return item;
      });
    });
  }, []);

  const handleItemDelete = useCallback((productId: number) => {
    setItems(prevItems => {
      // Ensure prevItems is an array
      const safePrevItems = Array.isArray(prevItems) ? prevItems : [];
      return safePrevItems.filter(item => item.product_id !== productId);
    });
  }, []);

  const handleAddProducts = () => {
    setAddDialogOpen(true);
  };

  const handleProductSelect = (product: Product) => {
    const safeItemsForCheck = Array.isArray(items) ? items : [];
    const existingItem = safeItemsForCheck.find(item => item.product_id === product.id);
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
  const safeItems = Array.isArray(items) ? items : [];
  const filteredItems = safeItems.filter(item => {
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

  const handleChangePage = (_event: unknown, newPage: number) => {
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
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <StockCheckHeader
        session={session}
        onBack={handleBack}
        onSave={handleSave}
        onRefresh={handleRefresh}
        loading={loading}
        onExportCSV={handleExportCSV}
        onCompleteSession={handleCompleteSession}
      />

      <Divider sx={{ my: 2 }} />

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
          {filteredItems.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 2 }}>
              <Alert severity="info" sx={{ display: 'inline-flex', mb: 2 }}>
                Chưa có sản phẩm trong danh sách kiểm kho. Nhấn nút + để thêm.
              </Alert>
              <Box>
                <Button variant="contained" onClick={handleAddProducts} startIcon={<AddIcon />}>
                  Thêm sản phẩm
                </Button>
              </Box>
            </Box>
          ) : (
            <StockCheckTable
              items={paginatedItems}
              onItemUpdate={handleItemUpdate}
              onItemDelete={handleItemDelete}
              loading={loading}
            />
          )}

          {/* Summary metrics below table */}
          <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Paper sx={{ p: 2, minWidth: 220 }}>
              Tổng sản phẩm đang hiển thị: {filteredItems.length}
            </Paper>
            <Paper sx={{ p: 2, minWidth: 220 }}>
              Đã kiểm: {(Array.isArray(items) ? items : []).filter(i => i.actual_quantity || i.actual_quantity === 0).length}
            </Paper>
            <Paper sx={{ p: 2, minWidth: 220 }}>
              Tổng sai lệch: {(Array.isArray(items) ? items : []).reduce((sum, i) => sum + (i.discrepancy || 0), 0)}
            </Paper>
          </Box>

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
        sx={{ position: 'fixed', bottom: 24, right: 24, boxShadow: 6 }}
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
          <Box sx={{ p: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Tìm theo tên hoặc SKU..."
              value={dialogSearch}
              onChange={(e) => setDialogSearch(e.target.value)}
              sx={{ mb: 2 }}
            />
            {productsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={24} />
              </Box>
            ) : productsError ? (
              <Alert severity="error">Không thể tải danh sách sản phẩm</Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Tên</TableCell>
                      <TableCell>SKU</TableCell>
                      <TableCell>Danh mục</TableCell>
                      <TableCell align="right">Tồn kho</TableCell>
                      <TableCell align="center">Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(Array.isArray(products) ? products : [])
                      .filter((p: Product) => {
                        if (!dialogSearch) return true;
                        const q = dialogSearch.toLowerCase();
                        return p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
                      })
                      .map((product: Product) => (
                        <TableRow key={product.id} hover>
                          <TableCell>{product.name}</TableCell>
                          <TableCell>{product.sku}</TableCell>
                          <TableCell>{(product as any).category || ''}</TableCell>
                          <TableCell align="right">{product.current_stock ?? 0}</TableCell>
                          <TableCell align="center">
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleProductSelect(product)}
                            >
                              Thêm
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
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
