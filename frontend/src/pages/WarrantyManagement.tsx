import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Tooltip,
  IconButton,
  Badge,
  Divider,
  Tabs,
  Tab,
  LinearProgress
} from '@mui/material';
import WarrantyDashboard from '../components/WarrantyDashboard';
import WarrantyWorkflow from '../components/WarrantyWorkflow';
import WarrantyReporting from '../components/WarrantyReporting';
import WarrantyNotifications from '../components/WarrantyNotifications';
import {
  Security as WarrantyIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as ExportIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Assignment as ClaimIcon,
  CheckCircle as ActiveIcon,
  Warning as ExpiringIcon,
  Cancel as ExpiredIcon,
  Build as RepairIcon,
  TrendingUp as TrendIcon,
  MonetizationOn as CostIcon,
  Timer as TimeIcon,
  Percent as RateIcon,
  QrCode as SerialIcon,
  Person as CustomerIcon,
  Store as ProductIcon,
  CalendarToday as DateIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import api from '../services/api';

interface WarrantyRegistration {
  id: number;
  warranty_number: string;
  serial_number_id: number;
  product_id: number;
  customer_id: number;
  sale_id: number;
  warranty_type: string;
  warranty_period_months: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'claimed' | 'completed';
  terms_accepted: boolean;
  contact_phone?: string;
  contact_email?: string;
  contact_address?: string;
  created_at: string;
  updated_at: string;
  
  // Joined data
  serial_number?: string;
  product_name?: string;
  product_sku?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
}

interface WarrantyStats {
  total_active_warranties: number;
  expiring_soon: number;
  expired_this_month: number;
  pending_claims: number;
  completed_claims_this_month: number;
  warranty_cost_this_month: number;
  average_claim_resolution_days: number;
  warranty_claim_rate: number;
}

interface WarrantyClaim {
  id: number;
  warranty_registration_id: number;
  claim_number: string;
  issue_description: string;
  claim_type: string;
  status: string;
  priority: string;
  reported_date: string;
  resolution_date?: string;
  resolution_notes?: string;
  cost_estimate?: number;
  actual_cost?: number;
  technician_notes?: string;
  customer_satisfaction?: number;
  created_at: string;
  updated_at: string;
}

const WarrantyManagement: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [warranties, setWarranties] = useState<WarrantyRegistration[]>([]);
  const [claims, setClaims] = useState<WarrantyClaim[]>([]);
  const [stats, setStats] = useState<WarrantyStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // Dialog states
  const [selectedWarranty, setSelectedWarranty] = useState<WarrantyRegistration | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);

  useEffect(() => {
    loadStats();
    if (currentTab === 0) {
      loadWarranties();
    } else if (currentTab === 1) {
      loadClaims();
    }
  }, [currentTab, page, rowsPerPage, searchTerm, statusFilter, typeFilter]);

  const loadStats = async () => {
    try {
      const response = await api.get<{
        success: boolean;
        data: WarrantyStats;
      }>('/warranty/dashboard');
      
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading warranty stats:', error);
    }
  };

  const loadWarranties = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(typeFilter !== 'all' && { warranty_type: typeFilter }),
      });

      const response = await api.get<{
        success: boolean;
        data: WarrantyRegistration[];
        pagination: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      }>(`/warranty/registrations?${params}`);
      
      if (response.success) {
        setWarranties(response.data);
        setTotalCount(response.pagination.total);
      } else {
        setError('Không thể tải danh sách bảo hành');
      }
    } catch (error) {
      console.error('Error loading warranties:', error);
      setError('Lỗi khi tải danh sách bảo hành');
    } finally {
      setLoading(false);
    }
  };

  const loadClaims = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });

      const response = await api.get<{
        success: boolean;
        data: WarrantyClaim[];
        pagination: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      }>(`/warranty/claims?${params}`);
      
      if (response.success) {
        setClaims(response.data);
        setTotalCount(response.pagination.total);
      } else {
        setError('Không thể tải danh sách yêu cầu bảo hành');
      }
    } catch (error) {
      console.error('Error loading warranty claims:', error);
      setError('Lỗi khi tải danh sách yêu cầu bảo hành');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <ActiveIcon sx={{ color: '#4CAF50' }} />;
      case 'expired': return <ExpiredIcon sx={{ color: '#f44336' }} />;
      case 'claimed': return <RepairIcon sx={{ color: '#FF9800' }} />;
      case 'completed': return <ActiveIcon sx={{ color: '#2196F3' }} />;
      default: return <WarrantyIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'expired': return 'error';
      case 'claimed': return 'warning';
      case 'completed': return 'primary';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Đang hiệu lực';
      case 'expired': return 'Đã hết hạn';
      case 'claimed': return 'Đang bảo hành';
      case 'completed': return 'Hoàn thành';
      default: return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const handleViewDetails = (warranty: WarrantyRegistration) => {
    setSelectedWarranty(warranty);
    setDetailDialogOpen(true);
  };

  const isWarrantyExpiringSoon = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  if (loading && warranties.length === 0 && claims.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Đang tải dữ liệu bảo hành...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 56, height: 56 }}>
            <WarrantyIcon fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h4" component="h1">
              Quản lý Bảo hành
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Theo dõi và xử lý bảo hành sản phẩm
            </Typography>
          </Box>
        </Box>
        
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              loadStats();
              if (currentTab === 0) loadWarranties();
              else if (currentTab === 1) loadClaims();
            }}
            disabled={loading}
          >
            Làm mới
          </Button>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
          >
            Xuất Excel
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
          >
            Đăng ký BH
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: '#4CAF50', mr: 2 }}>
                    <ActiveIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      BH hiệu lực
                    </Typography>
                    <Typography variant="h6">
                      {stats.total_active_warranties.toLocaleString('vi-VN')}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: '#FF9800', mr: 2 }}>
                    <ExpiringIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Sắp hết hạn
                    </Typography>
                    <Typography variant="h6">
                      {stats.expiring_soon.toLocaleString('vi-VN')}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: '#2196F3', mr: 2 }}>
                    <RepairIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Yêu cầu BH
                    </Typography>
                    <Typography variant="h6">
                      {stats.pending_claims.toLocaleString('vi-VN')}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: '#9C27B0', mr: 2 }}>
                    <CostIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Chi phí BH
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(stats.warranty_cost_this_month)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => {
            setCurrentTab(newValue);
            setPage(0);
          }}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarrantyIcon />
                Đăng ký bảo hành
                <Badge badgeContent={stats?.total_active_warranties || 0} color="primary" />
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ClaimIcon />
                Yêu cầu bảo hành
                <Badge badgeContent={stats?.pending_claims || 0} color="error" />
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendIcon />
                Dashboard
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TimelineIcon />
                Workflow
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssessmentIcon />
                Báo cáo
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotificationsIcon />
                Thông báo
              </Box>
            }
          />
        </Tabs>
      </Paper>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Bộ lọc tìm kiếm
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Tìm kiếm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={currentTab === 0 ? "Tìm theo serial, khách hàng..." : "Tìm theo mã claim..."}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Trạng thái"
              >
                <MenuItem value="all">Tất cả</MenuItem>
                {currentTab === 0 ? (
                  <>
                    <MenuItem value="active">Đang hiệu lực</MenuItem>
                    <MenuItem value="expired">Đã hết hạn</MenuItem>
                    <MenuItem value="claimed">Đang bảo hành</MenuItem>
                    <MenuItem value="completed">Hoàn thành</MenuItem>
                  </>
                ) : (
                  <>
                    <MenuItem value="pending">Chờ xử lý</MenuItem>
                    <MenuItem value="in_progress">Đang xử lý</MenuItem>
                    <MenuItem value="completed">Hoàn thành</MenuItem>
                    <MenuItem value="rejected">Từ chối</MenuItem>
                  </>
                )}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Loại</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                label="Loại"
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="manufacturer">Bảo hành hãng</MenuItem>
                <MenuItem value="store">Bảo hành cửa hàng</MenuItem>
                <MenuItem value="extended">Bảo hành mở rộng</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Content based on current tab */}
      {currentTab === 0 && (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Mã BH</TableCell>
                  <TableCell>Serial Number</TableCell>
                  <TableCell>Sản phẩm</TableCell>
                  <TableCell>Khách hàng</TableCell>
                  <TableCell>Loại BH</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Hết hạn</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {warranties.map((warranty) => (
                  <TableRow key={warranty.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {warranty.warranty_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 32, height: 32 }}>
                          <SerialIcon fontSize="small" />
                        </Avatar>
                        <Typography variant="body2">
                          {warranty.serial_number}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {warranty.product_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {warranty.product_sku}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {warranty.customer_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {warranty.customer_phone}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={warranty.warranty_type}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          icon={getStatusIcon(warranty.status)}
                          label={getStatusLabel(warranty.status)}
                          color={getStatusColor(warranty.status) as any}
                          size="small"
                        />
                        {isWarrantyExpiringSoon(warranty.end_date) && (
                          <Tooltip title="Sắp hết hạn">
                            <ExpiringIcon color="warning" fontSize="small" />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(warranty.end_date)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({warranty.warranty_period_months} tháng)
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Xem chi tiết">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(warranty)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Tạo yêu cầu BH">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedWarranty(warranty);
                              setClaimDialogOpen(true);
                            }}
                          >
                            <ClaimIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage="Số dòng mỗi trang:"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} của ${count !== -1 ? count : `hơn ${to}`}`
            }
          />
        </Paper>
      )}

      {/* New Advanced Features Tabs */}
      {currentTab === 2 && (
        <WarrantyDashboard />
      )}

      {currentTab === 3 && (
        <WarrantyWorkflow />
      )}

      {currentTab === 4 && (
        <WarrantyReporting />
      )}

      {currentTab === 5 && (
        <WarrantyNotifications />
      )}

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Chi tiết bảo hành
        </DialogTitle>
        <DialogContent>
          {selectedWarranty && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Thông tin bảo hành
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Mã bảo hành:</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedWarranty.warranty_number}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Serial Number:</Typography>
                    <Typography variant="body1">
                      {selectedWarranty.serial_number}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Sản phẩm:</Typography>
                    <Typography variant="body1">
                      {selectedWarranty.product_name}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Loại bảo hành:</Typography>
                    <Typography variant="body1">
                      {selectedWarranty.warranty_type}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Thông tin khách hàng
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Tên khách hàng:</Typography>
                    <Typography variant="body1">
                      {selectedWarranty.customer_name}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Số điện thoại:</Typography>
                    <Typography variant="body1">
                      {selectedWarranty.contact_phone || selectedWarranty.customer_phone}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Email:</Typography>
                    <Typography variant="body1">
                      {selectedWarranty.contact_email || selectedWarranty.customer_email || 'Chưa có'}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Thời hạn:</Typography>
                    <Typography variant="body1">
                      {formatDate(selectedWarranty.start_date)} - {formatDate(selectedWarranty.end_date)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ({selectedWarranty.warranty_period_months} tháng)
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>
            Đóng
          </Button>
          {selectedWarranty && selectedWarranty.status === 'active' && (
            <Button
              variant="contained"
              onClick={() => {
                setDetailDialogOpen(false);
                setClaimDialogOpen(true);
              }}
            >
              Tạo yêu cầu BH
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default WarrantyManagement;
