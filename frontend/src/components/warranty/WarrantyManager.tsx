import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Alert,
  LinearProgress,
  Tooltip,
  Badge,
  Divider,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  Avatar
} from '@mui/material';
import {
  Security as WarrantyIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as ClaimIcon,
  Search as SearchIcon,
  Download as ExportIcon,
  Visibility as ViewIcon,
  History as HistoryIcon,
  CheckCircle as ActiveIcon,
  CheckCircle,
  Cancel as ExpiredIcon,
  Cancel,
  Warning as ExpiringIcon,
  Build as RepairIcon,
  Person as CustomerIcon,
  Schedule as ScheduleIcon,
  MonetizationOn as CostIcon,
  AssignmentTurnedIn as CompletedIcon,
  AssignmentLate as PendingIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import apiClient from '../../services/api/client';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../config/constants';

interface WarrantyRegistration {
  id: number;
  warranty_number: string;
  serial_number: string;
  product_id: number;
  product_name?: string;
  product_sku?: string;
  customer_id: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  warranty_type: 'manufacturer' | 'store' | 'extended' | 'premium';
  warranty_start_date: string;
  warranty_end_date: string;
  status: 'active' | 'expired' | 'voided' | 'claimed' | 'transferred';
  purchase_date?: string;
  purchase_price?: number;
  notes?: string;
  created_at: string;
}

interface WarrantyClaim {
  id: number;
  claim_number: string;
  warranty_id: number;
  warranty_number?: string;
  claim_type: 'repair' | 'replacement' | 'refund' | 'parts';
  status: 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed' | 'cancelled';
  issue_description: string;
  resolution_notes?: string;
  claim_date: string;
  resolution_date?: string;
  cost_estimate?: number;
  actual_cost_price?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  technician_name?: string;
  customer_name?: string;
  product_name?: string;
}

interface SerialNumber {
  id: number;
  serial_number: string;
  product_id: number;
  product_name?: string;
  product_sku?: string;
  customer_id?: number;
  customer_name?: string;
  status: string;
  warranty_start_date?: string;
  warranty_end_date?: string;
}

interface WarrantyStats {
  total_registrations: number;
  active_warranties: number;
  expired_warranties: number;
  expiring_soon: number;
  total_claims: number;
  pending_claims: number;
  completed_claims: number;
  total_claim_cost: number;
}

const warrantyTypeConfig = {
  manufacturer: { label: 'Bảo hành NSX', color: 'primary' as const },
  store: { label: 'Bảo hành cửa hàng', color: 'secondary' as const },
  extended: { label: 'Bảo hành mở rộng', color: 'info' as const },
  premium: { label: 'Bảo hành cao cấp', color: 'success' as const }
};

const warrantyStatusConfig = {
  active: { label: 'Đang hiệu lực', color: 'success' as const, icon: <ActiveIcon /> },
  expired: { label: 'Hết hạn', color: 'error' as const, icon: <ExpiredIcon /> },
  claimed: { label: 'Đã khiếu nại', color: 'warning' as const, icon: <ClaimIcon /> },
  voided: { label: 'Đã hủy', color: 'default' as const, icon: <DeleteIcon /> },
  transferred: { label: 'Đã chuyển', color: 'info' as const, icon: <HistoryIcon /> }
};

const claimStatusConfig = {
  pending: { label: 'Chờ xử lý', color: 'warning' as const, icon: <PendingIcon /> },
  approved: { label: 'Đã duyệt', color: 'success' as const, icon: <CheckCircle /> },
  rejected: { label: 'Từ chối', color: 'error' as const, icon: <Cancel /> },
  in_progress: { label: 'Đang xử lý', color: 'info' as const, icon: <RepairIcon /> },
  completed: { label: 'Hoàn thành', color: 'success' as const, icon: <CompletedIcon /> },
  cancelled: { label: 'Đã hủy', color: 'default' as const, icon: <DeleteIcon /> }
};

const priorityConfig = {
  low: { label: 'Thấp', color: 'default' as const },
  medium: { label: 'Trung bình', color: 'info' as const },
  high: { label: 'Cao', color: 'warning' as const },
  urgent: { label: 'Khẩn cấp', color: 'error' as const }
};

export default function WarrantyManager() {
  const { hasPermission } = useAuth() as any;
  const { enqueueSnackbar } = useSnackbar();

  const [currentTab, setCurrentTab] = useState(0);
  const [warranties, setWarranties] = useState<WarrantyRegistration[]>([]);
  const [claims, setClaims] = useState<WarrantyClaim[]>([]);
  const [serials, setSerials] = useState<SerialNumber[]>([]);
  const [stats, setStats] = useState<WarrantyStats | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Selected items
  const [selectedWarranty, setSelectedWarranty] = useState<WarrantyRegistration | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<WarrantyClaim | null>(null);
  
  // Filters
  const [warrantySearch, setWarrantySearch] = useState('');
  const [warrantyStatusFilter, setWarrantyStatusFilter] = useState('');
  const [warrantyTypeFilter, setWarrantyTypeFilter] = useState('');
  const [claimSearch, setClaimSearch] = useState('');
  const [claimStatusFilter, setClaimStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  
  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showWarrantyDetail, setShowWarrantyDetail] = useState(false);
  const [showClaimDetail, setShowClaimDetail] = useState(false);
  
  // Form data
  const [newWarranty, setNewWarranty] = useState({
    serial_number: '',
    warranty_type: 'manufacturer',
    warranty_period_months: 12,
    purchase_date: '',
    purchase_price: 0,
    notes: ''
  });

  const [newClaim, setNewClaim] = useState({
    warranty_id: '',
    claim_type: 'repair',
    issue_description: '',
    priority: 'medium',
    cost_estimate: 0
  });
  
  // Pagination
  const [warrantyPage, setWarrantyPage] = useState(1);
  const [claimPage, setClaimPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    loadData();
  }, [currentTab, warrantySearch, warrantyStatusFilter, warrantyTypeFilter, claimSearch, claimStatusFilter, priorityFilter]);

  useEffect(() => {
    loadSerials();
    loadStats();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      if (currentTab === 0) {
        await loadWarranties();
      } else {
        await loadClaims();
      }
    } finally {
      setLoading(false);
    }
  };

  const loadWarranties = async () => {
    try {
      const params: any = {
        page: warrantyPage,
        limit: itemsPerPage
      };

      if (warrantySearch) params.search = warrantySearch;
      if (warrantyStatusFilter) params.status = warrantyStatusFilter;
      if (warrantyTypeFilter) params.warranty_type = warrantyTypeFilter;

      const response = await apiClient.get('/warranty/registrations', { params });
      
      if (response.success) {
        setWarranties(response.data || []);
      }
    } catch (error) {
      console.error('Error loading warranties:', error);
      enqueueSnackbar('Lỗi khi tải danh sách bảo hành', { variant: 'error' });
    }
  };

  const loadClaims = async () => {
    try {
      const params: any = {
        page: claimPage,
        limit: itemsPerPage
      };

      if (claimSearch) params.search = claimSearch;
      if (claimStatusFilter) params.status = claimStatusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const response = await apiClient.get('/warranty/claims', { params });
      
      if (response.success) {
        setClaims(response.data || []);
      }
    } catch (error) {
      console.error('Error loading claims:', error);
      enqueueSnackbar('Lỗi khi tải danh sách khiếu nại', { variant: 'error' });
    }
  };

  const loadSerials = async () => {
    try {
      const response = await apiClient.get('/serial-numbers', {
        params: { status: 'sold', limit: 1000 }
      });
      setSerials(response.data || []);
    } catch (error) {
      console.error('Error loading serials:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiClient.get('/warranty/stats');
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleRegisterWarranty = async () => {
    if (!newWarranty.serial_number) {
      enqueueSnackbar('Vui lòng chọn serial number', { variant: 'warning' });
      return;
    }

    try {
      const response = await apiClient.post('/warranty/registrations', newWarranty);

      if (response.success) {
        enqueueSnackbar('Đăng ký bảo hành thành công', { variant: 'success' });
        setShowRegisterModal(false);
        setNewWarranty({
          serial_number: '',
          warranty_type: 'manufacturer',
          warranty_period_months: 12,
          purchase_date: '',
          purchase_price: 0,
          notes: ''
        });
        loadData();
        loadStats();
      }
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Lỗi khi đăng ký bảo hành', { variant: 'error' });
    }
  };

  const handleCreateClaim = async () => {
    if (!newClaim.warranty_id || !newClaim.issue_description) {
      enqueueSnackbar('Vui lòng điền đầy đủ thông tin', { variant: 'warning' });
      return;
    }

    try {
      const response = await apiClient.post('/warranty/claims', newClaim);

      if (response.success) {
        enqueueSnackbar('Tạo khiếu nại bảo hành thành công', { variant: 'success' });
        setShowClaimModal(false);
        setNewClaim({
          warranty_id: '',
          claim_type: 'repair',
          issue_description: '',
          priority: 'medium',
          cost_estimate: 0
        });
        loadData();
        loadStats();
      }
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Lỗi khi tạo khiếu nại', { variant: 'error' });
    }
  };

  const handleUpdateClaimStatus = async (claimId: number, status: string) => {
    try {
      const response = await apiClient.put(`/warranty/claims/${claimId}`, { status });

      if (response.success) {
        enqueueSnackbar('Cập nhật trạng thái thành công', { variant: 'success' });
        loadData();
        loadStats();
      }
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Lỗi khi cập nhật', { variant: 'error' });
    }
  };

  const getWarrantyStatus = (warranty: WarrantyRegistration) => {
    const now = new Date();
    const endDate = new Date(warranty.warranty_end_date);
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (warranty.status === 'expired' || daysLeft < 0) {
      return { status: 'expired', daysLeft: 0, color: 'error' };
    } else if (daysLeft < 30) {
      return { status: 'expiring', daysLeft, color: 'warning' };
    } else {
      return { status: 'active', daysLeft, color: 'success' };
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarrantyIcon />
        Quản lý Bảo hành
      </Typography>

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4">{stats.total_registrations}</Typography>
                <Typography variant="body2">Tổng bảo hành</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4">{stats.active_warranties}</Typography>
                <Typography variant="body2">Đang hiệu lực</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'warning.light', color: 'white' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4">{stats.pending_claims}</Typography>
                <Typography variant="body2">Khiếu nại chờ</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'info.light', color: 'white' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4">{formatCurrency(stats.total_claim_cost)}</Typography>
                <Typography variant="body2">Chi phí khiếu nại</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(_, value) => setCurrentTab(value)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Đăng ký bảo hành" />
          <Tab label="Khiếu nại bảo hành" />
        </Tabs>
      </Card>

      {/* Warranty Registrations Tab */}
      {currentTab === 0 && (
        <Card>
          <CardContent>
            {/* Warranty Filters */}
            <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Tìm kiếm"
                  value={warrantySearch}
                  onChange={(e) => setWarrantySearch(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Trạng thái</InputLabel>
                  <Select
                    value={warrantyStatusFilter}
                    label="Trạng thái"
                    onChange={(e) => setWarrantyStatusFilter(e.target.value)}
                  >
                    <MenuItem value="">Tất cả</MenuItem>
                    {Object.entries(warrantyStatusConfig).map(([key, config]) => (
                      <MenuItem key={key} value={key}>
                        {config.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Loại bảo hành</InputLabel>
                  <Select
                    value={warrantyTypeFilter}
                    label="Loại bảo hành"
                    onChange={(e) => setWarrantyTypeFilter(e.target.value)}
                  >
                    <MenuItem value="">Tất cả</MenuItem>
                    {Object.entries(warrantyTypeConfig).map(([key, config]) => (
                      <MenuItem key={key} value={key}>
                        {config.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box display="flex" gap={1}>
                  {hasPermission?.('warranty.create') && (
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setShowRegisterModal(true)}
                    >
                      Đăng ký bảo hành
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>

            {/* Warranty Table */}
            {loading ? (
              <LinearProgress />
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Mã bảo hành</TableCell>
                      <TableCell>Serial Number</TableCell>
                      <TableCell>Sản phẩm</TableCell>
                      <TableCell>Khách hàng</TableCell>
                      <TableCell>Loại</TableCell>
                      <TableCell align="center">Trạng thái</TableCell>
                      <TableCell>Hạn bảo hành</TableCell>
                      <TableCell align="center">Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {warranties.map((warranty) => {
                      const statusInfo = getWarrantyStatus(warranty);
                      const typeInfo = warrantyTypeConfig[warranty.warranty_type];
                      
                      return (
                        <TableRow key={warranty.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace">
                              {warranty.warranty_number}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace">
                              {warranty.serial_number}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
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
                              {warranty.customer_phone && (
                                <Typography variant="caption" color="text.secondary">
                                  {warranty.customer_phone}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={typeInfo.label}
                              color={typeInfo.color}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={
                                statusInfo.status === 'expiring'
                                  ? `${statusInfo.daysLeft} ngày`
                                  : warrantyStatusConfig[warranty.status].label
                              }
                              color={statusInfo.color}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(warranty.warranty_end_date).toLocaleDateString('vi-VN')}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box display="flex" gap={0.5}>
                              <Tooltip title="Chi tiết">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setSelectedWarranty(warranty);
                                    setShowWarrantyDetail(true);
                                  }}
                                >
                                  <ViewIcon />
                                </IconButton>
                              </Tooltip>
                              
                              {hasPermission?.('warranty.create') && warranty.status === 'active' && (
                                <Tooltip title="Tạo khiếu nại">
                                  <IconButton
                                    size="small"
                                    color="warning"
                                    onClick={() => {
                                      setNewClaim({ ...newClaim, warranty_id: warranty.id.toString() });
                                      setShowClaimModal(true);
                                    }}
                                  >
                                    <ClaimIcon />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Claims Tab */}
      {currentTab === 1 && (
        <Card>
          <CardContent>
            {/* Claim Filters */}
            <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Tìm kiếm"
                  value={claimSearch}
                  onChange={(e) => setClaimSearch(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Trạng thái</InputLabel>
                  <Select
                    value={claimStatusFilter}
                    label="Trạng thái"
                    onChange={(e) => setClaimStatusFilter(e.target.value)}
                  >
                    <MenuItem value="">Tất cả</MenuItem>
                    {Object.entries(claimStatusConfig).map(([key, config]) => (
                      <MenuItem key={key} value={key}>
                        {config.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Độ ưu tiên</InputLabel>
                  <Select
                    value={priorityFilter}
                    label="Độ ưu tiên"
                    onChange={(e) => setPriorityFilter(e.target.value)}
                  >
                    <MenuItem value="">Tất cả</MenuItem>
                    {Object.entries(priorityConfig).map(([key, config]) => (
                      <MenuItem key={key} value={key}>
                        {config.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Claims Table */}
            {loading ? (
              <LinearProgress />
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Mã khiếu nại</TableCell>
                      <TableCell>Mã bảo hành</TableCell>
                      <TableCell>Khách hàng</TableCell>
                      <TableCell>Sản phẩm</TableCell>
                      <TableCell>Loại</TableCell>
                      <TableCell align="center">Độ ưu tiên</TableCell>
                      <TableCell align="center">Trạng thái</TableCell>
                      <TableCell>Chi phí ước tính</TableCell>
                      <TableCell>Ngày tạo</TableCell>
                      <TableCell align="center">Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {claims.map((claim) => {
                      const statusInfo = claimStatusConfig[claim.status];
                      const priorityInfo = priorityConfig[claim.priority];
                      
                      return (
                        <TableRow key={claim.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace">
                              {claim.claim_number}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace">
                              {claim.warranty_number}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {claim.customer_name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {claim.product_name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={claim.claim_type === 'repair' ? 'Sửa chữa' :
                                     claim.claim_type === 'replacement' ? 'Thay thế' :
                                     claim.claim_type === 'refund' ? 'Hoàn tiền' : 'Linh kiện'}
                              color="default"
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={priorityInfo.label}
                              color={priorityInfo.color}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              icon={statusInfo.icon}
                              label={statusInfo.label}
                              color={statusInfo.color}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {claim.cost_estimate ? formatCurrency(claim.cost_estimate) : '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(claim.claim_date).toLocaleDateString('vi-VN')}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box display="flex" gap={0.5}>
                              <Tooltip title="Chi tiết">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setSelectedClaim(claim);
                                    setShowClaimDetail(true);
                                  }}
                                >
                                  <ViewIcon />
                                </IconButton>
                              </Tooltip>
                              
                              {hasPermission?.('warranty.update') && claim.status === 'pending' && (
                                <Tooltip title="Duyệt">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => handleUpdateClaimStatus(claim.id, 'approved')}
                                  >
                                    <CheckCircle />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Register Warranty Modal */}
      <Dialog open={showRegisterModal} onClose={() => setShowRegisterModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Đăng ký bảo hành</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Autocomplete
                options={serials}
                getOptionLabel={(option) => `${option.serial_number} - ${option.product_name}`}
                value={serials.find(s => s.serial_number === newWarranty.serial_number) || null}
                onChange={(_, value) => setNewWarranty({ ...newWarranty, serial_number: value?.serial_number || '' })}
                renderInput={(params) => (
                  <TextField {...params} label="Chọn Serial Number" required />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {option.serial_number}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.product_name} - {option.customer_name}
                      </Typography>
                    </Box>
                  </li>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Loại bảo hành</InputLabel>
                <Select
                  value={newWarranty.warranty_type}
                  label="Loại bảo hành"
                  onChange={(e) => setNewWarranty({ ...newWarranty, warranty_type: e.target.value as any })}
                >
                  {Object.entries(warrantyTypeConfig).map(([key, config]) => (
                    <MenuItem key={key} value={key}>
                      {config.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Thời hạn bảo hành (tháng)"
                value={newWarranty.warranty_period_months}
                onChange={(e) => setNewWarranty({ ...newWarranty, warranty_period_months: parseInt(e.target.value) || 12 })}
                inputProps={{ min: 1, max: 120 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Ngày mua"
                value={newWarranty.purchase_date}
                onChange={(e) => setNewWarranty({ ...newWarranty, purchase_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Giá mua"
                value={newWarranty.purchase_price}
                onChange={(e) => setNewWarranty({ ...newWarranty, purchase_price: parseFloat(e.target.value) || 0 })}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ghi chú"
                value={newWarranty.notes}
                onChange={(e) => setNewWarranty({ ...newWarranty, notes: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRegisterModal(false)}>Hủy</Button>
          <Button onClick={handleRegisterWarranty} variant="contained">
            Đăng ký bảo hành
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Claim Modal */}
      <Dialog open={showClaimModal} onClose={() => setShowClaimModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Tạo khiếu nại bảo hành</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Autocomplete
                options={warranties.filter(w => w.status === 'active')}
                getOptionLabel={(option) => `${option.warranty_number} - ${option.product_name} (${option.customer_name})`}
                value={warranties.find(w => w.id.toString() === newClaim.warranty_id) || null}
                onChange={(_, value) => setNewClaim({ ...newClaim, warranty_id: value?.id.toString() || '' })}
                renderInput={(params) => (
                  <TextField {...params} label="Chọn bảo hành" required />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Loại khiếu nại</InputLabel>
                <Select
                  value={newClaim.claim_type}
                  label="Loại khiếu nại"
                  onChange={(e) => setNewClaim({ ...newClaim, claim_type: e.target.value as any })}
                >
                  <MenuItem value="repair">Sửa chữa</MenuItem>
                  <MenuItem value="replacement">Thay thế</MenuItem>
                  <MenuItem value="refund">Hoàn tiền</MenuItem>
                  <MenuItem value="parts">Linh kiện</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Độ ưu tiên</InputLabel>
                <Select
                  value={newClaim.priority}
                  label="Độ ưu tiên"
                  onChange={(e) => setNewClaim({ ...newClaim, priority: e.target.value as any })}
                >
                  {Object.entries(priorityConfig).map(([key, config]) => (
                    <MenuItem key={key} value={key}>
                      {config.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Mô tả vấn đề"
                value={newClaim.issue_description}
                onChange={(e) => setNewClaim({ ...newClaim, issue_description: e.target.value })}
                multiline
                rows={4}
                required
                placeholder="Mô tả chi tiết vấn đề gặp phải..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Ước tính chi phí"
                value={newClaim.cost_estimate}
                onChange={(e) => setNewClaim({ ...newClaim, cost_estimate: parseFloat(e.target.value) || 0 })}
                inputProps={{ min: 0 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowClaimModal(false)}>Hủy</Button>
          <Button onClick={handleCreateClaim} variant="contained">
            Tạo khiếu nại
          </Button>
        </DialogActions>
      </Dialog>

      {/* Warranty Detail Modal */}
      <Dialog open={showWarrantyDetail} onClose={() => setShowWarrantyDetail(false)} maxWidth="md" fullWidth>
        {selectedWarranty && (
          <>
            <DialogTitle>
              Chi tiết bảo hành: {selectedWarranty.warranty_number}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Thông tin bảo hành
                      </Typography>
                      <Box display="flex" flexDirection="column" gap={2}>
                        <Box display="flex" justifyContent="space-between">
                          <Typography color="text.secondary">Mã bảo hành:</Typography>
                          <Typography fontFamily="monospace">{selectedWarranty.warranty_number}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography color="text.secondary">Serial:</Typography>
                          <Typography fontFamily="monospace">{selectedWarranty.serial_number}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography color="text.secondary">Sản phẩm:</Typography>
                          <Typography>{selectedWarranty.product_name}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography color="text.secondary">Loại:</Typography>
                          <Chip
                            label={warrantyTypeConfig[selectedWarranty.warranty_type].label}
                            color={warrantyTypeConfig[selectedWarranty.warranty_type].color}
                            size="small"
                          />
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography color="text.secondary">Trạng thái:</Typography>
                          <Chip
                            icon={warrantyStatusConfig[selectedWarranty.status].icon}
                            label={warrantyStatusConfig[selectedWarranty.status].label}
                            color={warrantyStatusConfig[selectedWarranty.status].color}
                            size="small"
                          />
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography color="text.secondary">Bắt đầu:</Typography>
                          <Typography>
                            {new Date(selectedWarranty.warranty_start_date).toLocaleDateString('vi-VN')}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography color="text.secondary">Kết thúc:</Typography>
                          <Typography>
                            {new Date(selectedWarranty.warranty_end_date).toLocaleDateString('vi-VN')}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Thông tin khách hàng
                      </Typography>
                      <Box display="flex" flexDirection="column" gap={2}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <CustomerIcon color="primary" />
                          <Typography>{selectedWarranty.customer_name}</Typography>
                        </Box>
                        {selectedWarranty.customer_phone && (
                          <Box display="flex" alignItems="center" gap={1}>
                            <PhoneIcon color="primary" />
                            <Typography>{selectedWarranty.customer_phone}</Typography>
                          </Box>
                        )}
                        {selectedWarranty.customer_email && (
                          <Box display="flex" alignItems="center" gap={1}>
                            <EmailIcon color="primary" />
                            <Typography>{selectedWarranty.customer_email}</Typography>
                          </Box>
                        )}
                        {selectedWarranty.purchase_date && (
                          <Box display="flex" alignItems="center" gap={1}>
                            <CalendarIcon color="primary" />
                            <Typography>
                              Mua: {new Date(selectedWarranty.purchase_date).toLocaleDateString('vi-VN')}
                            </Typography>
                          </Box>
                        )}
                        {selectedWarranty.purchase_price && (
                          <Box display="flex" alignItems="center" gap={1}>
                            <CostIcon color="primary" />
                            <Typography>
                              Giá mua: {formatCurrency(selectedWarranty.purchase_price)}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                {selectedWarranty.notes && (
                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Ghi chú
                        </Typography>
                        <Typography>{selectedWarranty.notes}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowWarrantyDetail(false)}>Đóng</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Claim Detail Modal */}
      <Dialog open={showClaimDetail} onClose={() => setShowClaimDetail(false)} maxWidth="lg" fullWidth>
        {selectedClaim && (
          <>
            <DialogTitle>
              Chi tiết khiếu nại: {selectedClaim.claim_number}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Thông tin khiếu nại
                      </Typography>
                      <Box display="flex" flexDirection="column" gap={2}>
                        <Box display="flex" justifyContent="space-between">
                          <Typography color="text.secondary">Mã khiếu nại:</Typography>
                          <Typography fontFamily="monospace">{selectedClaim.claim_number}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography color="text.secondary">Mã bảo hành:</Typography>
                          <Typography fontFamily="monospace">{selectedClaim.warranty_number}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography color="text.secondary">Khách hàng:</Typography>
                          <Typography>{selectedClaim.customer_name}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography color="text.secondary">Sản phẩm:</Typography>
                          <Typography>{selectedClaim.product_name}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography color="text.secondary">Loại khiếu nại:</Typography>
                          <Typography>{selectedClaim.claim_type}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography color="text.secondary">Độ ưu tiên:</Typography>
                          <Chip
                            label={priorityConfig[selectedClaim.priority].label}
                            color={priorityConfig[selectedClaim.priority].color}
                            size="small"
                          />
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography color="text.secondary">Trạng thái:</Typography>
                          <Chip
                            icon={claimStatusConfig[selectedClaim.status].icon}
                            label={claimStatusConfig[selectedClaim.status].label}
                            color={claimStatusConfig[selectedClaim.status].color}
                            size="small"
                          />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                  
                  <Card sx={{ mt: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Mô tả vấn đề
                      </Typography>
                      <Typography>{selectedClaim.issue_description}</Typography>
                      
                      {selectedClaim.resolution_notes && (
                        <>
                          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                            Ghi chú xử lý
                          </Typography>
                          <Typography>{selectedClaim.resolution_notes}</Typography>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Chi phí & Thời gian
                      </Typography>
                      <Box display="flex" flexDirection="column" gap={2}>
                        <Box display="flex" justifyContent="space-between">
                          <Typography color="text.secondary">Ước tính:</Typography>
                          <Typography>
                            {selectedClaim.cost_estimate ? formatCurrency(selectedClaim.cost_estimate) : '-'}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography color="text.secondary">Chi phí thực:</Typography>
                          <Typography>
                            {selectedClaim.actual_cost_price ? formatCurrency(selectedClaim.actual_cost_price) : '-'}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography color="text.secondary">Ngày tạo:</Typography>
                          <Typography>
                            {new Date(selectedClaim.claim_date).toLocaleDateString('vi-VN')}
                          </Typography>
                        </Box>
                        {selectedClaim.resolution_date && (
                          <Box display="flex" justifyContent="space-between">
                            <Typography color="text.secondary">Ngày hoàn thành:</Typography>
                            <Typography>
                              {new Date(selectedClaim.resolution_date).toLocaleDateString('vi-VN')}
                            </Typography>
                          </Box>
                        )}
                        {selectedClaim.technician_name && (
                          <Box display="flex" justifyContent="space-between">
                            <Typography color="text.secondary">Kỹ thuật viên:</Typography>
                            <Typography>{selectedClaim.technician_name}</Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Status Actions */}
                  {hasPermission?.('warranty.update') && selectedClaim.status === 'pending' && (
                    <Card sx={{ mt: 2 }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Cập nhật trạng thái
                        </Typography>
                        <Box display="flex" flexDirection="column" gap={1}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircle />}
                            onClick={() => handleUpdateClaimStatus(selectedClaim.id, 'approved')}
                          >
                            Duyệt khiếu nại
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<Cancel />}
                            onClick={() => handleUpdateClaimStatus(selectedClaim.id, 'rejected')}
                          >
                            Từ chối
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  )}
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowClaimDetail(false)}>Đóng</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
