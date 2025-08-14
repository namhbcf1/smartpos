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
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  AccountBalance as FinanceIcon,
  TrendingUp as ProfitIcon,
  TrendingDown as LossIcon,
  MonetizationOn as RevenueIcon,
  Receipt as ExpenseIcon,
  Assessment as AnalyticsIcon,
  Insights as InsightsIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Psychology as AIIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Lightbulb as OpportunityIcon,
  Security as RiskIcon
} from '@mui/icons-material';
import { Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ComposedChart } from 'recharts';
import api from '../services/api';

interface FinancialData {
  period: string;
  revenue: number;
  expenses: number;
  profit: number;
  profitMargin: number;
  cashFlow: number;
}

interface FinancialInsight {
  type: 'strength' | 'opportunity' | 'risk' | 'warning';
  title: string;
  description: string;
  confidence: number;
  recommendation: string;
}

interface FinancialReportData {
  summary: {
    currentRevenue: number;
    currentProfit: number;
    profitMargin: number;
    cashFlow: number;
    period: string;
    comparison: string;
  };
  periodData: FinancialData[];
  insights: FinancialInsight[];
  metadata: {
    generatedAt: string;
    periods: number;
    currency: string;
    aiAnalysis: boolean;
  };
}

// Note: Chart colors are defined inline where needed

const FinancePage: React.FC = () => {
  const [reportData, setReportData] = useState<FinancialReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('monthly');
  const [comparison, setComparison] = useState('previous');

  useEffect(() => {
    loadFinancialReport();
  }, []);

  const loadFinancialReport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // api.get returns the data payload directly (not the ApiResponse envelope)
      const data = await api.get<FinancialReportData>(`/reports/financial?period=${period}&comparison=${comparison}`);
      setReportData(data);
    } catch (error: any) {
      // Fallback: compose report from /financial/summary and /financial/chart-data if /reports/financial is unavailable
      const status = error?.response?.status;
      console.warn('Primary financial report failed, attempting fallback endpoints...', status);
      try {
        await api.get<{
          totalIncome: number; totalExpense: number; netProfit: number; balance: number;
          todayIncome: number; monthIncome: number; yearIncome: number; todayExpense: number; monthExpense: number; yearExpense: number;
        }>(`/financial/summary`);

        const chart = await api.get<Array<{ period: string; income: number; expense: number }>>(`/financial/chart-data?period=${period === 'weekly' ? 'week' : period === 'monthly' ? 'month' : 'year'}`);

        const periodData = chart.map(d => ({
          period: d.period,
          revenue: d.income,
          expenses: d.expense,
          profit: Math.max(0, d.income - d.expense),
          profitMargin: d.income > 0 ? ((d.income - d.expense) / d.income) * 100 : 0,
          cashFlow: d.income - d.expense,
        }));

        const latest = periodData[periodData.length - 1] || { revenue: 0, profit: 0, profitMargin: 0, cashFlow: 0 } as any;

        const fallbackData: FinancialReportData = {
          summary: {
            currentRevenue: latest.revenue,
            currentProfit: latest.profit,
            profitMargin: latest.profitMargin,
            cashFlow: latest.cashFlow,
            period,
            comparison,
          },
          periodData,
          insights: [
            { type: 'strength', title: 'Báo cáo tổng hợp', description: 'Dữ liệu tổng hợp từ các endpoint tài chính', confidence: 0.8, recommendation: 'Sử dụng như phương án dự phòng' },
          ],
          metadata: {
            generatedAt: new Date().toISOString(),
            periods: periodData.length,
            currency: 'VND',
            aiAnalysis: false,
          }
        };
        setReportData(fallbackData);
      } catch (fallbackError: any) {
        console.error('Error loading financial report (fallback failed):', fallbackError);
        const message = fallbackError?.response?.data?.message || fallbackError?.message || 'Lỗi khi tải báo cáo tài chính';
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'strength': return <SuccessIcon sx={{ color: '#4CAF50' }} />;
      case 'opportunity': return <OpportunityIcon sx={{ color: '#FF9800' }} />;
      case 'risk': return <RiskIcon sx={{ color: '#f44336' }} />;
      case 'warning': return <WarningIcon sx={{ color: '#FF5722' }} />;
      default: return <InsightsIcon />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'strength': return '#E8F5E8';
      case 'opportunity': return '#FFF3E0';
      case 'risk': return '#FFEBEE';
      case 'warning': return '#FFF3E0';
      default: return '#F5F5F5';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            AI đang phân tích dữ liệu tài chính...
          </Typography>
          <LinearProgress sx={{ width: '300px', mt: 2 }} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadFinancialReport} startIcon={<RefreshIcon />}>
          Thử lại
        </Button>
      </Container>
    );
  }

  if (!reportData) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="info">
          Không có dữ liệu báo cáo tài chính
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 56, height: 56 }}>
            <FinanceIcon fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h4" component="h1">
              Báo cáo Tài chính Thông minh
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Phân tích AI • {reportData.summary.period} • {reportData.metadata.periods} kỳ
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Làm mới dữ liệu">
            <IconButton onClick={loadFinancialReport}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button variant="outlined" startIcon={<DownloadIcon />}>
            Xuất báo cáo
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Cấu hình báo cáo
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Chu kỳ</InputLabel>
              <Select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                label="Chu kỳ"
              >
                <MenuItem value="weekly">Hàng tuần</MenuItem>
                <MenuItem value="monthly">Hàng tháng</MenuItem>
                <MenuItem value="quarterly">Hàng quý</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>So sánh</InputLabel>
              <Select
                value={comparison}
                onChange={(e) => setComparison(e.target.value)}
                label="So sánh"
              >
                <MenuItem value="previous">Kỳ trước</MenuItem>
                <MenuItem value="year">Cùng kỳ năm trước</MenuItem>
                <MenuItem value="budget">So với ngân sách</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="contained"
              onClick={loadFinancialReport}
              sx={{ height: '56px' }}
            >
              Cập nhật báo cáo
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Financial KPIs */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#4CAF50', mr: 2 }}>
                  <RevenueIcon />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Doanh thu hiện tại
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(reportData.summary.currentRevenue)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: reportData.summary.currentProfit > 0 ? '#4CAF50' : '#f44336', mr: 2 }}>
                  {reportData.summary.currentProfit > 0 ? <ProfitIcon /> : <LossIcon />}
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Lợi nhuận
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(reportData.summary.currentProfit)}
                  </Typography>
                </Box>
              </Box>
              <Chip
                label={`${reportData.summary.profitMargin.toFixed(1)}% margin`}
                color={reportData.summary.profitMargin > 20 ? 'success' : reportData.summary.profitMargin > 10 ? 'warning' : 'error'}
                size="small"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#2196F3', mr: 2 }}>
                  <AnalyticsIcon />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Cash Flow
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(reportData.summary.cashFlow)}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color={reportData.summary.cashFlow > 0 ? 'success.main' : 'error.main'}>
                {reportData.summary.cashFlow > 0 ? 'Dương' : 'Âm'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#FF9800', mr: 2 }}>
                  <ExpenseIcon />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Tỷ lệ chi phí
                  </Typography>
                  <Typography variant="h6">
                    {((reportData.summary.currentRevenue - reportData.summary.currentProfit) / reportData.summary.currentRevenue * 100).toFixed(1)}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Xu hướng tài chính theo {period === 'monthly' ? 'tháng' : period === 'quarterly' ? 'quý' : 'tuần'}
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={reportData.periodData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <RechartsTooltip 
                    formatter={(value, name) => [
                      formatCurrency(Number(value)),
                      name === 'revenue' ? 'Doanh thu' : 
                      name === 'expenses' ? 'Chi phí' : 
                      name === 'profit' ? 'Lợi nhuận' : 'Cash Flow'
                    ]}
                  />
                  <Bar dataKey="revenue" fill="#8884d8" name="revenue" />
                  <Bar dataKey="expenses" fill="#82ca9d" name="expenses" />
                  <Line type="monotone" dataKey="profit" stroke="#ff7300" strokeWidth={3} name="profit" />
                  <Line type="monotone" dataKey="cashFlow" stroke="#ff0000" strokeWidth={2} strokeDasharray="5 5" name="cashFlow" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                AI Financial Insights
              </Typography>
              <List dense>
                {reportData.insights.map((insight, index) => (
                  <React.Fragment key={index}>
                    <ListItem sx={{ bgcolor: getInsightColor(insight.type), borderRadius: 1, mb: 1 }}>
                      <ListItemIcon>
                        {getInsightIcon(insight.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2">
                              {insight.title}
                            </Typography>
                            <Chip 
                              label={`${Math.round(insight.confidence * 100)}%`}
                              size="small"
                              color="primary"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              {insight.description}
                            </Typography>
                            <Typography variant="caption" color="primary">
                              💡 {insight.recommendation}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < reportData.insights.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Financial Ratios Table */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Chỉ số tài chính chi tiết
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Kỳ</TableCell>
                  <TableCell align="right">Doanh thu</TableCell>
                  <TableCell align="right">Chi phí</TableCell>
                  <TableCell align="right">Lợi nhuận</TableCell>
                  <TableCell align="right">Margin (%)</TableCell>
                  <TableCell align="right">Cash Flow</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.periodData.slice(-5).map((row, index) => (
                  <TableRow key={index}>
                    <TableCell component="th" scope="row">
                      {row.period}
                    </TableCell>
                    <TableCell align="right">{formatCurrency(row.revenue)}</TableCell>
                    <TableCell align="right">{formatCurrency(row.expenses)}</TableCell>
                    <TableCell align="right" sx={{ color: row.profit > 0 ? 'success.main' : 'error.main' }}>
                      {formatCurrency(row.profit)}
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${row.profitMargin.toFixed(1)}%`}
                        color={row.profitMargin > 20 ? 'success' : row.profitMargin > 10 ? 'warning' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ color: row.cashFlow > 0 ? 'success.main' : 'error.main' }}>
                      {formatCurrency(row.cashFlow)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* AI Analysis Badge */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Chip
          icon={<AIIcon />}
          label={`Phân tích tài chính bởi AI • Cập nhật: ${new Date(reportData.metadata.generatedAt).toLocaleString('vi-VN')}`}
          variant="outlined"
          color="primary"
        />
      </Box>
    </Container>
  );
};

export default FinancePage;
