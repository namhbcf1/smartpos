import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  Tabs,
  Tab,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Container,
  Paper,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  AttachMoney as MoneyIcon,
  AccountBalance as FinanceIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api from '../../services/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import api from '../../services/api';

// Interface for transaction
interface Transaction {
  id: number;
  date: string;
  description: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  method: string;
  reference?: string;
}

interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  balance: number;
}

const Finance = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [tabValue, setTabValue] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');
  
  // Summary data
  const [summary, setSummary] = useState<FinancialSummary>({
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
    balance: 0,
  });
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
  
  useEffect(() => {
    fetchData();
  }, []);

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch financial summary
        const summaryResponse = await api.get<FinancialSummary>('/financial/summary');
        if (summaryResponse.success) {
          setSummary(summaryResponse.data);
        }

        // Fetch financial transactions
        const transactionsResponse = await api.get<{
          transactions: Transaction[];
          pagination: any;
        }>('/financial/transactions?limit=50');

        if (transactionsResponse.success) {
          setTransactions(transactionsResponse.data.transactions || []);
        }

      } catch (error) {
        console.error('Error fetching financial data:', error);
        enqueueSnackbar('Lỗi khi tải dữ liệu tài chính', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  
  const handleFilterTypeChange = (event: any) => {
    setFilterType(event.target.value as string);
  };
  
  const handleOpenDialog = (type: 'income' | 'expense') => {
    setTransactionType(type);
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };
  
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };
  
  // Filter transactions based on search and filters
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || transaction.type === filterType;
    return matchesSearch && matchesType;
  });

  // Paginate transactions
  const paginatedTransactions = filteredTransactions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container
      maxWidth="xl"
      sx={{
        py: { xs: 1, sm: 2 },
        px: { xs: 1, sm: 2, md: 3 },
        minHeight: '100vh',
        bgcolor: 'grey.50'
      }}
    >
      {/* Header */}
      <Paper
        elevation={1}
        sx={{
          p: { xs: 2, sm: 3 },
          mb: 3,
          borderRadius: 2,
          bgcolor: 'white'
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
                fontWeight: 600,
                color: 'primary.main',
                mb: 1
              }}
            >
              <FinanceIcon sx={{ fontSize: 'inherit' }} />
              Quản lý tài chính
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              Theo dõi doanh thu, chi phí và báo cáo tài chính
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchData}
              size={isMobile ? 'small' : 'medium'}
          >
              Làm mới
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              size={isMobile ? 'small' : 'medium'}
            >
              Xuất báo cáo
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('income')}
              size={isMobile ? 'small' : 'medium'}
            >
              Thêm giao dịch
            </Button>
          </Stack>
        </Stack>
      </Paper>
      
      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <MoneyIcon color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Tổng thu
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(summary.totalIncome)}
                </Typography>
              </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingDownIcon color="error" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Tổng chi
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(summary.totalExpense)}
                </Typography>
              </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUpIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Lợi nhuận
                  </Typography>
                  <Typography variant="h5" color={summary.netProfit >= 0 ? 'success.main' : 'error.main'}>
                    {formatCurrency(summary.netProfit)}
                </Typography>
              </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AccountBalanceIcon color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Số dư
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(summary.balance)}
                </Typography>
              </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Tổng quan" />
          <Tab label="Giao dịch" />
              <Tab label="Báo cáo" />
            </Tabs>
      </Box>
            
      {/* Tab Content */}
              {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Biểu đồ thu chi
                  </Typography>
                <Box height={300}>
                    <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[]}>
                      <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Line type="monotone" dataKey="income" stroke="#8884d8" name="Thu" />
                      <Line type="monotone" dataKey="expense" stroke="#82ca9d" name="Chi" />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Phân bổ chi tiêu
                      </Typography>
                <Box height={300}>
                        <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                            <Pie
                        data={[]}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                        {[].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                      <RechartsTooltip />
                    </PieChart>
                        </ResponsiveContainer>
                      </Box>
              </CardContent>
            </Card>
                    </Grid>
                  </Grid>
              )}
              
              {tabValue === 1 && (
        <Card>
          <CardContent>
            {/* Filters */}
            <Box display="flex" gap={2} mb={3}>
              <TextField
                placeholder="Tìm kiếm giao dịch..."
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: <SearchIcon />,
                }}
                sx={{ minWidth: 300 }}
              />
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Loại giao dịch</InputLabel>
                <Select
                  value={filterType}
                  onChange={handleFilterTypeChange}
                  label="Loại giao dịch"
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="income">Thu</MenuItem>
                  <MenuItem value="expense">Chi</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            {/* Transactions Table */}
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Ngày</TableCell>
                      <TableCell>Mô tả</TableCell>
                    <TableCell>Loại</TableCell>
                    <TableCell>Số tiền</TableCell>
                      <TableCell>Danh mục</TableCell>
                      <TableCell>Phương thức</TableCell>
                    <TableCell>Tham chiếu</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                  {paginatedTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="textSecondary">
                          Không có giao dịch nào
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                          <TableCell>{formatDate(transaction.date)}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                          <TableCell>
                            <Chip 
                            label={transaction.type === 'income' ? 'Thu' : 'Chi'}
                            color={transaction.type === 'income' ? 'success' : 'error'}
                              size="small" 
                            />
                          </TableCell>
                        <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                        <TableCell>{transaction.category}</TableCell>
                        <TableCell>{transaction.method}</TableCell>
                        <TableCell>{transaction.reference}</TableCell>
                        </TableRow>
                    ))
                  )}
                  </TableBody>
                </Table>
              </TableContainer>
            
            {/* Pagination */}
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredTransactions.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Số dòng mỗi trang:"
            />
          </CardContent>
        </Card>
      )}

      {tabValue === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Thu chi theo tháng
                </Typography>
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar dataKey="income" fill="#8884d8" name="Thu" />
                      <Bar dataKey="expense" fill="#82ca9d" name="Chi" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Thống kê chi tiết
                </Typography>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Báo cáo chi tiết sẽ được hiển thị ở đây
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {/* Add Transaction Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Thêm giao dịch {transactionType === 'income' ? 'thu' : 'chi'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary">
            Tính năng thêm giao dịch đang được phát triển...
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button variant="contained" onClick={handleCloseDialog}>
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Finance; 
