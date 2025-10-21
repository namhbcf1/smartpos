import React, { useState, useMemo, useCallback } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Avatar,
  Tooltip,
  Skeleton,
  Collapse,
  Fab,
  Backdrop,
  CircularProgress,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  Search,
  Add,
  Refresh,
  Visibility,
  Edit,
  Delete,
  Assessment,
  FilterList,
  Warning,
  SearchOff,
  Clear,
  GridView,
  ViewList,
  TrendingUp,
  TrendingDown,
  Download,
  Print,
  Share,
  Schedule,
  BarChart,
  PieChart,
  ShowChart,
  Timeline,
  AttachMoney,
  ShoppingCart,
  People,
  Inventory,
  Store,
  LocalShipping,
  Receipt,
  CreditCard,
  AccountBalance,
  TrendingFlat,
  Analytics,
  Dashboard,
  TableChart,
  PieChartOutline,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  PlayArrow,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsAPI } from '../../services/api';

// Report Types
interface Report {
  id: string;
  name: string;
  type: 'sales' | 'inventory' | 'financial' | 'customer' | 'product' | 'custom';
  description: string;
  status: 'active' | 'inactive' | 'draft';
  created_at: string;
  updated_at: string;
  created_by: string;
  parameters: Record<string, any>;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    time: string;
    enabled: boolean;
  };
  last_run?: string;
  next_run?: string;
  data?: any[];
  chart_config?: {
    type: 'line' | 'bar' | 'pie' | 'area' | 'table';
    x_axis: string;
    y_axis: string;
    colors: string[];
  };
}

interface ReportData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
    borderWidth?: number;
  }[];
}

// Report Builder Component
interface ReportBuilderProps {
  open: boolean;
  onClose: () => void;
  onSave: (report: Partial<Report>) => void;
  editingReport?: Report | null;
}

const ReportBuilder: React.FC<ReportBuilderProps> = ({
  open,
  onClose,
  onSave,
  editingReport
}) => {
  const [formData, setFormData] = useState({
    name: editingReport?.name || '',
    type: editingReport?.type || 'sales',
    description: editingReport?.description || '',
    status: editingReport?.status || 'active',
    parameters: editingReport?.parameters || {},
    schedule: editingReport?.schedule || {
      frequency: 'monthly' as const,
      time: '09:00',
      enabled: false
    },
    chart_config: editingReport?.chart_config || {
      type: 'line' as const,
      x_axis: 'date',
      y_axis: 'amount',
      colors: ['#1976d2', '#dc004e', '#9c27b0', '#2e7d32']
    }
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedChange = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {editingReport ? 'Chỉnh sửa báo cáo' : 'Tạo báo cáo mới'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
          {/* Basic Information */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Thông tin cơ bản
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tên báo cáo"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Loại báo cáo</InputLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                  >
                    <MenuItem value="sales">Báo cáo bán hàng</MenuItem>
                    <MenuItem value="inventory">Báo cáo tồn kho</MenuItem>
                    <MenuItem value="financial">Báo cáo tài chính</MenuItem>
                    <MenuItem value="customer">Báo cáo khách hàng</MenuItem>
                    <MenuItem value="product">Báo cáo sản phẩm</MenuItem>
                    <MenuItem value="custom">Báo cáo tùy chỉnh</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Mô tả"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Chart Configuration */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Cấu hình biểu đồ
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Loại biểu đồ</InputLabel>
                  <Select
                    value={formData.chart_config.type}
                    onChange={(e) => handleNestedChange('chart_config', 'type', e.target.value)}
                  >
                    <MenuItem value="line">Đường</MenuItem>
                    <MenuItem value="bar">Cột</MenuItem>
                    <MenuItem value="pie">Tròn</MenuItem>
                    <MenuItem value="area">Vùng</MenuItem>
                    <MenuItem value="table">Bảng</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Trục X</InputLabel>
                  <Select
                    value={formData.chart_config.x_axis}
                    onChange={(e) => handleNestedChange('chart_config', 'x_axis', e.target.value)}
                  >
                    <MenuItem value="date">Ngày</MenuItem>
                    <MenuItem value="month">Tháng</MenuItem>
                    <MenuItem value="category">Danh mục</MenuItem>
                    <MenuItem value="product">Sản phẩm</MenuItem>
                    <MenuItem value="customer">Khách hàng</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Trục Y</InputLabel>
                  <Select
                    value={formData.chart_config.y_axis}
                    onChange={(e) => handleNestedChange('chart_config', 'y_axis', e.target.value)}
                  >
                    <MenuItem value="amount">Số tiền</MenuItem>
                    <MenuItem value="quantity">Số lượng</MenuItem>
                    <MenuItem value="count">Số lần</MenuItem>
                    <MenuItem value="percentage">Phần trăm</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          {/* Schedule Configuration */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Lịch chạy báo cáo
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Tần suất</InputLabel>
                  <Select
                    value={formData.schedule.frequency}
                    onChange={(e) => handleNestedChange('schedule', 'frequency', e.target.value)}
                  >
                    <MenuItem value="daily">Hàng ngày</MenuItem>
                    <MenuItem value="weekly">Hàng tuần</MenuItem>
                    <MenuItem value="monthly">Hàng tháng</MenuItem>
                    <MenuItem value="quarterly">Hàng quý</MenuItem>
                    <MenuItem value="yearly">Hàng năm</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Thời gian"
                  type="time"
                  value={formData.schedule.time}
                  onChange={(e) => handleNestedChange('schedule', 'time', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Trạng thái</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                  >
                    <MenuItem value="active">Hoạt động</MenuItem>
                    <MenuItem value="inactive">Tạm dừng</MenuItem>
                    <MenuItem value="draft">Bản nháp</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button onClick={handleSave} variant="contained">
          {editingReport ? 'Cập nhật' : 'Tạo báo cáo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Main Reports Dashboard Component
const ReportsDashboard: React.FC = () => {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
  const [bulkActionOpen, setBulkActionOpen] = useState(false);

  // Mock data for demonstration
  const mockReports: Report[] = [
    {
      id: '1',
      name: 'Báo cáo doanh thu hàng ngày',
      type: 'sales',
      description: 'Tổng hợp doanh thu và số lượng bán hàng theo ngày',
      status: 'active',
      created_at: '2024-01-15T08:00:00Z',
      updated_at: '2024-01-20T10:30:00Z',
      created_by: 'admin',
      parameters: { date_range: 'last_30_days' },
      schedule: { frequency: 'daily', time: '08:00', enabled: true },
      last_run: '2024-01-20T08:00:00Z',
      next_run: '2024-01-21T08:00:00Z',
      chart_config: {
        type: 'line',
        x_axis: 'date',
        y_axis: 'amount',
        colors: ['#1976d2', '#dc004e']
      }
    },
    {
      id: '2',
      name: 'Báo cáo tồn kho theo danh mục',
      type: 'inventory',
      description: 'Phân tích tồn kho theo từng danh mục sản phẩm',
      status: 'active',
      created_at: '2024-01-10T09:00:00Z',
      updated_at: '2024-01-18T14:20:00Z',
      created_by: 'admin',
      parameters: { category: 'all' },
      schedule: { frequency: 'weekly', time: '09:00', enabled: true },
      last_run: '2024-01-18T09:00:00Z',
      next_run: '2024-01-25T09:00:00Z',
      chart_config: {
        type: 'pie',
        x_axis: 'category',
        y_axis: 'quantity',
        colors: ['#1976d2', '#dc004e', '#9c27b0', '#2e7d32']
      }
    },
    {
      id: '3',
      name: 'Báo cáo khách hàng VIP',
      type: 'customer',
      description: 'Danh sách khách hàng có giá trị cao nhất',
      status: 'active',
      created_at: '2024-01-05T10:00:00Z',
      updated_at: '2024-01-15T16:45:00Z',
      created_by: 'admin',
      parameters: { min_amount: 1000000 },
      schedule: { frequency: 'monthly', time: '10:00', enabled: true },
      last_run: '2024-01-15T10:00:00Z',
      next_run: '2024-02-15T10:00:00Z',
      chart_config: {
        type: 'table',
        x_axis: 'customer',
        y_axis: 'amount',
        colors: ['#1976d2']
      }
    }
  ];

  // Filtered reports
  const filteredReports = useMemo(() => {
    return mockReports.filter(report => {
      const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           report.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === 'all' || report.type === selectedType;
      const matchesStatus = selectedStatus === 'all' || report.status === selectedStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [mockReports, searchTerm, selectedType, selectedStatus]);

  // Statistics
  const stats = useMemo(() => {
    const total = mockReports.length;
    const active = mockReports.filter(r => r.status === 'active').length;
    const scheduled = mockReports.filter(r => r.schedule?.enabled).length;
    const types = [...new Set(mockReports.map(r => r.type))].length;
    
    return { total, active, scheduled, types };
  }, [mockReports]);

  // Handlers
  const handleCreateReport = () => {
    setEditingReport(null);
    setBuilderOpen(true);
  };

  const handleEditReport = (report: Report) => {
    setEditingReport(report);
    setBuilderOpen(true);
  };

  const handleSaveReport = (reportData: Partial<Report>) => {
    console.log('Saving report:', reportData);
    // Here you would call the API to save the report
  };

  const handleDeleteReport = (id: string) => {
    console.log('Deleting report:', id);
    // Here you would call the API to delete the report
  };

  const handleRunReport = (id: string) => {
    console.log('Running report:', id);
    // Here you would call the API to run the report
  };

  const handleExportReport = (id: string) => {
    console.log('Exporting report:', id);
    // Here you would call the API to export the report
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sales': return <ShoppingCart />;
      case 'inventory': return <Inventory />;
      case 'financial': return <AttachMoney />;
      case 'customer': return <People />;
      case 'product': return <Store />;
      default: return <Assessment />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sales': return '#1976d2';
      case 'inventory': return '#dc004e';
      case 'financial': return '#2e7d32';
      case 'customer': return '#9c27b0';
      case 'product': return '#ff9800';
      default: return '#757575';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'warning';
      case 'draft': return 'default';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Báo cáo & Phân tích
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Quản lý và tạo báo cáo chi tiết về hoạt động kinh doanh
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateReport}
          sx={{ height: 48 }}
        >
          Tạo báo cáo mới
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Tổng báo cáo
                  </Typography>
                  <Typography variant="h4">
                    {stats.total}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <Assessment />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Đang hoạt động
                  </Typography>
                  <Typography variant="h4">
                    {stats.active}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <TrendingUp />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Tự động chạy
                  </Typography>
                  <Typography variant="h4">
                    {stats.scheduled}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <Schedule />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Loại báo cáo
                  </Typography>
                  <Typography variant="h4">
                    {stats.types}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <BarChart />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              placeholder="Tìm kiếm báo cáo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setSearchTerm('')} size="small">
                      <Clear />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ minWidth: 300 }}
            />
            
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Loại báo cáo</InputLabel>
              <Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="sales">Bán hàng</MenuItem>
                <MenuItem value="inventory">Tồn kho</MenuItem>
                <MenuItem value="financial">Tài chính</MenuItem>
                <MenuItem value="customer">Khách hàng</MenuItem>
                <MenuItem value="product">Sản phẩm</MenuItem>
                <MenuItem value="custom">Tùy chỉnh</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="active">Hoạt động</MenuItem>
                <MenuItem value="inactive">Tạm dừng</MenuItem>
                <MenuItem value="draft">Bản nháp</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
              <IconButton
                onClick={() => setViewMode('grid')}
                color={viewMode === 'grid' ? 'primary' : 'default'}
              >
                <GridView />
              </IconButton>
              <IconButton
                onClick={() => setViewMode('list')}
                color={viewMode === 'list' ? 'primary' : 'default'}
              >
                <ViewList />
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Reports List */}
      {viewMode === 'grid' ? (
        <Grid container spacing={3}>
          {filteredReports.map((report) => (
            <Grid item xs={12} sm={6} md={4} key={report.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ bgcolor: getTypeColor(report.type), width: 32, height: 32 }}>
                        {getTypeIcon(report.type)}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" noWrap>
                          {report.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {report.type}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={report.status}
                      color={getStatusColor(report.status) as any}
                      size="small"
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {report.description}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    <Chip
                      icon={<Schedule />}
                      label={report.schedule?.frequency || 'Không lịch'}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      icon={<BarChart />}
                      label={report.chart_config?.type || 'Bảng'}
                      size="small"
                      variant="outlined"
                    />
                  </Box>

                  <Typography variant="caption" color="text.secondary">
                    Cập nhật: {new Date(report.updated_at).toLocaleDateString('vi-VN')}
                  </Typography>
                </CardContent>

                <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Tooltip title="Chạy báo cáo">
                    <IconButton size="small" onClick={() => handleRunReport(report.id)}>
                      <PlayArrow />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Xuất báo cáo">
                    <IconButton size="small" onClick={() => handleExportReport(report.id)}>
                      <Download />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Chỉnh sửa">
                    <IconButton size="small" onClick={() => handleEditReport(report)}>
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Xóa">
                    <IconButton size="small" onClick={() => handleDeleteReport(report.id)}>
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tên báo cáo</TableCell>
                  <TableCell>Loại</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Lịch chạy</TableCell>
                  <TableCell>Cập nhật</TableCell>
                  <TableCell>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: getTypeColor(report.type), width: 24, height: 24 }}>
                          {getTypeIcon(report.type)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {report.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {report.description}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={report.type}
                        size="small"
                        sx={{ bgcolor: getTypeColor(report.type), color: 'white' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={report.status}
                        color={getStatusColor(report.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {report.schedule?.enabled ? (
                        <Chip
                          icon={<Schedule />}
                          label={report.schedule.frequency}
                          size="small"
                          variant="outlined"
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Không có
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {new Date(report.updated_at).toLocaleDateString('vi-VN')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Chạy báo cáo">
                          <IconButton size="small" onClick={() => handleRunReport(report.id)}>
                            <PlayArrow />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Xuất báo cáo">
                          <IconButton size="small" onClick={() => handleExportReport(report.id)}>
                            <Download />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Chỉnh sửa">
                          <IconButton size="small" onClick={() => handleEditReport(report)}>
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Xóa">
                          <IconButton size="small" onClick={() => handleDeleteReport(report.id)}>
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Report Builder Dialog */}
      <ReportBuilder
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        onSave={handleSaveReport}
        editingReport={editingReport}
      />
    </Box>
  );
};

export default ReportsDashboard;