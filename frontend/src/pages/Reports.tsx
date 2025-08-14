/**
 * Advanced Reports Page for SmartPOS
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  DatePicker,
  LocalizationProvider,
} from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Download,
  Refresh,
  FilterList,
  Assessment,
  TrendingUp,
  Inventory,
  People,
  AttachMoney,
} from '@mui/icons-material';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';

interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  category: 'sales' | 'inventory' | 'financial' | 'customer' | 'custom';
  chartType?: 'line' | 'bar' | 'pie' | 'area' | 'table';
}

interface ReportFilter {
  dateFrom?: Date;
  dateTo?: Date;
  storeId?: number;
  categoryId?: number;
  productId?: number;
  customerId?: number;
}

interface ReportResult {
  data: any[];
  summary: {
    totalRecords: number;
    aggregations: Record<string, number>;
  };
  metadata: {
    generatedAt: string;
    executionTime: number;
    filters: ReportFilter;
  };
}

const Reports: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [reportDefinitions, setReportDefinitions] = useState<ReportDefinition[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportDefinition | null>(null);
  const [reportData, setReportData] = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ReportFilter>({
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    dateTo: new Date(),
  });
  const [showFilters, setShowFilters] = useState(false);
  const [exportDialog, setExportDialog] = useState(false);

  // Load report definitions on mount
  useEffect(() => {
    loadReportDefinitions();
  }, []);

  const loadReportDefinitions = async () => {
    try {
      // Backend returns envelope { success, data: [...] } - handle this format correctly
      const result = await api.get<{ success: boolean; data: ReportDefinition[] }>(
        '/reports/definitions'
      );
      console.log('Report definitions response:', result);

      // Handle the actual response format from backend
      let reports: ReportDefinition[] = [];
      if (result && result.data && Array.isArray(result.data)) {
        reports = result.data;
      } else if (Array.isArray(result)) {
        reports = result;
      } else if (result && (result as any).reports) {
        reports = (result as any).reports;
      }

      console.log('Processed reports:', reports);
      setReportDefinitions(reports);
    } catch (err: any) {
      console.error('Error loading report definitions:', err);
      // Use default report definitions if API fails (rules.md compliant)
      const mockDefinitions: ReportDefinition[] = [
        {
          id: 'revenue-overview',
          name: 'Tổng quan doanh thu',
          description: 'Phân tích doanh thu theo thời gian với AI insights và dự báo xu hướng',
          category: 'sales',
          chartType: 'line'
        },
        {
          id: 'inventory-report',
          name: 'Báo cáo tồn kho',
          description: 'Theo dõi tình trạng tồn kho và dự báo nhu cầu nhập hàng',
          category: 'inventory',
          chartType: 'bar'
        },
        {
          id: 'financial-summary',
          name: 'Tổng quan tài chính',
          description: 'Phân tích chi tiết về doanh thu, chi phí và lợi nhuận',
          category: 'financial',
          chartType: 'pie'
        },
        {
          id: 'customer-insights',
          name: 'Phân tích khách hàng',
          description: 'Phân tích hành vi khách hàng và xu hướng mua sắm',
          category: 'customer',
          chartType: 'area'
        }
      ];
      setReportDefinitions(mockDefinitions);
      setError('Đang sử dụng dữ liệu mẫu - Không thể kết nối API báo cáo');
    }
  };

  const generateReport = async (reportId: string) => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        dateFrom: filters.dateFrom?.toISOString(),
        dateTo: filters.dateTo?.toISOString(),
        storeId: filters.storeId,
        categoryId: filters.categoryId,
        productId: filters.productId,
        customerId: filters.customerId,
      };
      const data = await api.post<ReportResult>(`/reports/${reportId}/generate`, payload);
      setReportData(data);
      setSelectedReport(reportDefinitions.find(r => r.id === reportId) || null);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'csv' | 'excel' | 'pdf') => {
    if (!selectedReport) return;
    
    try {
      // Export likely returns a file/stream; use fetch with absolute URL from api base
      const payload = {
        format,
        dateFrom: filters.dateFrom?.toISOString(),
        dateTo: filters.dateTo?.toISOString(),
        storeId: filters.storeId,
        categoryId: filters.categoryId,
        productId: filters.productId,
        customerId: filters.customerId,
      };

      // Build absolute url using same API base as axios instance
      const base = (import.meta as any).env?.VITE_API_BASE_URL || (import.meta as any).env?.VITE_API_URL || 'https://smartpos-api.bangachieu2.workers.dev';
      const url = `${base}/api/v1/reports/${selectedReport.id}/export`;

      const token = sessionStorage.getItem('auth_token');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to export report');
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${selectedReport.id}_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to export report');
    }
    
    setExportDialog(false);
  };

  const renderChart = () => {
    if (!reportData || !selectedReport) return null;

    const chartData = reportData.data.map(row => {
      const formattedRow: any = {};
      Object.keys(row).forEach(key => {
        const value = row[key];
        formattedRow[key] = typeof value === 'object' && value.raw !== undefined ? value.raw : value;
      });
      return formattedRow;
    });

    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

    switch (selectedReport.chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={Object.keys(chartData[0] || {})[0]} />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              {Object.keys(chartData[0] || {}).slice(1).map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={Object.keys(chartData[0] || {})[0]} />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              {Object.keys(chartData[0] || {}).slice(1).map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={colors[index % colors.length]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        const pieData = chartData.slice(0, 10).map((item, index) => ({
          name: item[Object.keys(item)[0]],
          value: item[Object.keys(item)[1]],
          fill: colors[index % colors.length],
        }));
        
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const renderTable = () => {
    if (!reportData) return null;

    return (
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              {Object.keys(reportData.data[0] || {}).map(key => (
                <TableCell key={key} sx={{ fontWeight: 'bold' }}>
                  {key.replace(/_/g, ' ').toUpperCase()}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {reportData.data.slice(0, 100).map((row, index) => (
              <TableRow key={index}>
                {Object.values(row).map((value: any, cellIndex) => (
                  <TableCell key={cellIndex}>
                    {typeof value === 'object' && value.formatted 
                      ? value.formatted 
                      : value?.toString() || '-'
                    }
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'sales': return <TrendingUp />;
      case 'inventory': return <Inventory />;
      case 'customer': return <People />;
      case 'financial': return <AttachMoney />;
      default: return <Assessment />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'sales': return '#4CAF50';
      case 'inventory': return '#FF9800';
      case 'customer': return '#2196F3';
      case 'financial': return '#9C27B0';
      default: return '#757575';
    }
  };

  // Compute categories from report definitions
  const categories = Array.from(new Set(reportDefinitions.map(r => r.category)));

  // If no categories, provide default ones
  const defaultCategories = categories.length > 0 ? categories : ['sales', 'inventory', 'financial', 'customer'];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }} data-testid="reports-dashboard">
        <Typography variant="h4" gutterBottom>
          Advanced Reports
        </Typography>

        {/* Tabs for categories */}
        <Tabs
          value={selectedTab}
          onChange={(_, newValue) => setSelectedTab(newValue)}
          sx={{ mb: 3 }}
        >
          <Tab label="Tất cả báo cáo" />
          {defaultCategories.map(category => (
            <Tab
              key={category}
              label={category.charAt(0).toUpperCase() + category.slice(1)}
              icon={getCategoryIcon(category)}
            />
          ))}
        </Tabs>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="h6">Filters</Typography>
              <IconButton onClick={() => setShowFilters(!showFilters)}>
                <FilterList />
              </IconButton>
            </Box>
            
            {showFilters && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <DatePicker
                    label="Date From"
                    value={filters.dateFrom}
                    onChange={(date) => setFilters(prev => ({ ...prev, dateFrom: date }))}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <DatePicker
                    label="Date To"
                    value={filters.dateTo}
                    onChange={(date) => setFilters(prev => ({ ...prev, dateTo: date }))}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Store</InputLabel>
                    <Select
                      value={filters.storeId || ''}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        storeId: e.target.value ? Number(e.target.value) : undefined 
                      }))}
                    >
                      <MenuItem value="">All Stores</MenuItem>
                      <MenuItem value={1}>Main Store</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>

        {/* Report Definitions Grid */}
        <Grid container spacing={3}>
          {reportDefinitions.length === 0 ? (
            <Grid item xs={12}>
              <Card sx={{ p: 4, textAlign: 'center' }}>
                <Assessment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Đang tải báo cáo...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Vui lòng đợi trong giây lát
                </Typography>
              </Card>
            </Grid>
          ) : (
            reportDefinitions
              .filter(report => selectedTab === 0 || report.category === defaultCategories[selectedTab - 1])
              .map(report => (
                <Grid item xs={12} md={6} lg={4} key={report.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4
                      }
                    }}
                    onClick={() => generateReport(report.id)}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ color: getCategoryColor(report.category), mr: 1 }}>
                          {getCategoryIcon(report.category)}
                        </Box>
                        <Chip
                          label={report.category}
                          size="small"
                          sx={{
                            backgroundColor: getCategoryColor(report.category),
                            color: 'white'
                          }}
                        />
                      </Box>
                      <Typography variant="h6" gutterBottom>
                        {report.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {report.description}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        startIcon={<Assessment />}
                        disabled={loading}
                        variant="outlined"
                        fullWidth
                      >
                        Tạo báo cáo
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))
          )}
        </Grid>

        {/* Loading */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {/* Report Results */}
        {reportData && selectedReport && (
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">
                  {selectedReport.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Refresh">
                    <IconButton onClick={() => generateReport(selectedReport.id)}>
                      <Refresh />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Export">
                    <IconButton onClick={() => setExportDialog(true)}>
                      <Download />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Summary Stats */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6">{reportData.summary.totalRecords}</Typography>
                    <Typography variant="body2" color="text.secondary">Total Records</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6">{reportData.metadata.executionTime}ms</Typography>
                    <Typography variant="body2" color="text.secondary">Execution Time</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6">
                      {new Date(reportData.metadata.generatedAt).toLocaleTimeString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Generated At</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6" data-testid="reports-revenue">
                      {reportData.summary.aggregations?.total_revenue?.toLocaleString() || '0 ₫'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Chart */}
              {selectedReport.chartType && selectedReport.chartType !== 'table' && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Chart View</Typography>
                  {renderChart()}
                </Box>
              )}

              {/* Table */}
              <Typography variant="h6" gutterBottom>Data View</Typography>
              {renderTable()}
            </CardContent>
          </Card>
        )}

        {/* Export Dialog */}
        <Dialog open={exportDialog} onClose={() => setExportDialog(false)}>
          <DialogTitle>Export Report</DialogTitle>
          <DialogContent>
            <Typography gutterBottom>
              Choose export format for {selectedReport?.name}:
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button variant="outlined" onClick={() => exportReport('csv')}>
                CSV
              </Button>
              <Button variant="outlined" onClick={() => exportReport('excel')}>
                Excel
              </Button>
              <Button variant="outlined" onClick={() => exportReport('pdf')}>
                PDF
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExportDialog(false)}>Cancel</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default Reports;