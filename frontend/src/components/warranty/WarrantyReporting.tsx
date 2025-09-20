import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Assessment as ReportIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Schedule as ScheduleIcon,
  MonetizationOn as CostIcon,
  Person as PersonIcon,
  Build as RepairIcon,
  CalendarToday as DateIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import apiClient from '../services/api/client';

interface ReportData {
  id: string;
  name: string;
  description: string;
  type: 'summary' | 'detailed' | 'trend' | 'performance' | 'cost' | 'custom';
  data: any[];
  filters: ReportFilters;
  generated_at: string;
  generated_by: string;
}

interface ReportFilters {
  date_from: string;
  date_to: string;
  status: string[];
  warranty_type: string[];
  product_category: string[];
  customer_group: string[];
  technician: string[];
  cost_range: {
    min: number;
    max: number;
  };
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  default_filters: ReportFilters;
  is_system: boolean;
}

const WarrantyReporting: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [currentTab, setCurrentTab] = useState(0);
  const [reports, setReports] = useState<ReportData[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Report generation state
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [filters, setFilters] = useState<ReportFilters>({
    date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    date_to: new Date().toISOString().split('T')[0],
    status: [],
    warranty_type: [],
    product_category: [],
    customer_group: [],
    technician: [],
    cost_range: { min: 0, max: 10000000 }
  });
  
  // Load report data from D1 Cloudflare
  useEffect(() => {
    const loadReportData = async () => {
      try {
        const [templatesResponse, reportsResponse] = await Promise.all([
          apiClient.get('/warranty/report-templates'),
          apiClient.get('/warranty/reports')
        ]);

        if (templatesResponse.data.success) {
          setTemplates(templatesResponse.data.data || []);
        }
        if (reportsResponse.data.success) {
          setReports(reportsResponse.data.data || []);
        }
      } catch (error) {
        console.error('Error loading report data:', error);
        setTemplates([]);
        setReports([]);
      }
    };

    loadReportData();
  }, []);

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Data is loaded in useEffect above
    } catch (error) {
      console.error('Error loading report data:', error);
      setError('Không thể tải dữ liệu báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setFilters(template.default_filters);
    setReportDialogOpen(true);
  };

  const handleGenerateReport = async () => {
    if (!selectedTemplate) return;

    try {
      setLoading(true);
      setError(null);

      const resp = await apiClient.post('/warranty/report', {
        templateId: selectedTemplate.id,
        filters: {
          date_from: filters.date_from,
          date_to: filters.date_to,
          status: filters.status,
          warranty_type: filters.warranty_type,
          product_category: filters.product_category,
          customer_group: filters.customer_group,
          technician: filters.technician,
          cost_range: filters.cost_range
        }
      });

      const newReport: ReportData = {
        id: `report_${Date.now()}`,
        name: `${selectedTemplate.name} - ${new Date().toLocaleDateString('vi-VN')}`,
        description: `Báo cáo được tạo từ mẫu: ${selectedTemplate.name}`,
        type: selectedTemplate.type as any,
        data: resp.data?.data || [],
        filters: { ...filters },
        generated_at: new Date().toISOString(),
        generated_by: 'current_user'
      };

      setReports([newReport, ...reports]);
      setReportDialogOpen(false);
      setSelectedTemplate(null);
      
    } catch (error) {
      console.error('Error generating report:', error);
      setError('Không thể tạo báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (report: ReportData, format: 'pdf' | 'excel') => {
    try {
      setLoading(true);
      setError(null);

      const resp = await apiClient.post('/warranty/export', {
        reportId: report.id,
        filters: {
          date_from: report.filters.date_from,
          date_to: report.filters.date_to
        },
        format: format === 'excel' ? 'excel' : 'csv'
      }, { responseType: 'blob' as any });

      const blob = new Blob([resp.data], { type: format === 'excel' ? 'application/vnd.ms-excel' : 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `warranty-report.${format === 'excel' ? 'xlsx' : 'csv'}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      setError('Không thể xuất báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  if (loading && reports.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <LinearProgress sx={{ width: '100%' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Báo cáo & Xuất dữ liệu
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Tạo và quản lý các báo cáo bảo hành
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<ReportIcon />}
          onClick={() => setReportDialogOpen(true)}
        >
          Tạo báo cáo mới
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ReportIcon />
                Mẫu báo cáo
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DownloadIcon />
                Báo cáo đã tạo
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendIcon />
                Phân tích nhanh
              </Box>
            }
          />
        </Tabs>
      </Paper>

      {/* Content based on current tab */}
      {currentTab === 0 && (
        <Grid container spacing={3}>
          {templates.map((template) => (
            <Grid item xs={12} md={6} lg={4} key={template.id}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {template.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {template.description}
                      </Typography>
                    </Box>
                    {template.is_system && (
                      <Chip label="Hệ thống" size="small" color="primary" variant="outlined" />
                    )}
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Loại: {template.type}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Khoảng thời gian: {formatDate(template.default_filters.date_from)} - {formatDate(template.default_filters.date_to)}
                    </Typography>
                  </Box>
                  
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<ReportIcon />}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    Sử dụng mẫu này
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {currentTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Báo cáo đã tạo
            </Typography>
            
            {reports.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  Chưa có báo cáo nào được tạo
                </Typography>
                <Button
                  variant="outlined"
                  sx={{ mt: 2 }}
                  onClick={() => setReportDialogOpen(true)}
                >
                  Tạo báo cáo đầu tiên
                </Button>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Tên báo cáo</TableCell>
                      <TableCell>Loại</TableCell>
                      <TableCell>Ngày tạo</TableCell>
                      <TableCell>Người tạo</TableCell>
                      <TableCell align="center">Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {report.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {report.description}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={report.type}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDateTime(report.generated_at)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {report.generated_by}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Tooltip title="Xuất PDF">
                              <IconButton
                                size="small"
                                onClick={() => handleExportReport(report, 'pdf')}
                              >
                                <PdfIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Xuất Excel">
                              <IconButton
                                size="small"
                                onClick={() => handleExportReport(report, 'excel')}
                              >
                                <ExcelIcon />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {currentTab === 2 && (
        <Grid container spacing={3}>
          {/* Quick Stats */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Thống kê nhanh
                </Typography>
                
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[
                      { month: 'T1', active: 45, expired: 12, claims: 8 },
                      { month: 'T2', active: 52, expired: 15, claims: 12 },
                      { month: 'T3', active: 48, expired: 18, claims: 10 },
                      { month: 'T4', active: 55, expired: 20, claims: 15 },
                      { month: 'T5', active: 62, expired: 22, claims: 18 },
                      { month: 'T6', active: 58, expired: 25, claims: 14 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <RechartsTooltip />
                      <Line type="monotone" dataKey="active" stroke="#4CAF50" strokeWidth={2} />
                      <Line type="monotone" dataKey="expired" stroke="#f44336" strokeWidth={2} />
                      <Line type="monotone" dataKey="claims" stroke="#FF9800" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Cost Analysis */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Phân tích chi phí
                </Typography>
                
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { category: 'Sửa chữa', cost: 2500000 },
                      { category: 'Thay thế', cost: 1800000 },
                      { category: 'Hoàn tiền', cost: 800000 },
                      { category: 'Chẩn đoán', cost: 300000 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <RechartsTooltip formatter={(value) => `${(value as number / 1000000).toFixed(1)}M VND`} />
                      <Bar dataKey="cost" fill="#2196F3" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Report Generation Dialog */}
      <Dialog
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Tạo báo cáo mới
          {selectedTemplate && (
            <Typography variant="body2" color="text.secondary">
              Từ mẫu: {selectedTemplate.name}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tên báo cáo"
                  value={selectedTemplate?.name || ''}
                  onChange={(e) => setSelectedTemplate(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Mô tả"
                  value={selectedTemplate?.description || ''}
                  onChange={(e) => setSelectedTemplate(prev => prev ? { ...prev, description: e.target.value } : null)}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Từ ngày"
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Đến ngày"
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Trạng thái</InputLabel>
                  <Select
                    multiple
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value as string[] })}
                    label="Trạng thái"
                  >
                    <MenuItem value="active">Đang hiệu lực</MenuItem>
                    <MenuItem value="expired">Đã hết hạn</MenuItem>
                    <MenuItem value="claimed">Đang bảo hành</MenuItem>
                    <MenuItem value="completed">Hoàn thành</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Loại bảo hành</InputLabel>
                  <Select
                    multiple
                    value={filters.warranty_type}
                    onChange={(e) => setFilters({ ...filters, warranty_type: e.target.value as string[] })}
                    label="Loại bảo hành"
                  >
                    <MenuItem value="manufacturer">Bảo hành hãng</MenuItem>
                    <MenuItem value="store">Bảo hành cửa hàng</MenuItem>
                    <MenuItem value="extended">Bảo hành mở rộng</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Ghi chú bổ sung"
                  multiline
                  rows={3}
                  placeholder="Thêm ghi chú cho báo cáo này..."
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialogOpen(false)}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleGenerateReport}
            disabled={loading || !selectedTemplate}
            startIcon={<ReportIcon />}
          >
            {loading ? 'Đang tạo...' : 'Tạo báo cáo'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WarrantyReporting;
