import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Alert,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { formatCurrency } from '../config/constants';
import api from '../services/api';

interface ForecastData {
  product_id: number;
  product_name: string;
  product_sku: string;
  category_name: string;
  current_stock: number;
  reorder_point: number;
  suggested_order_quantity: number;
  forecast_period_days: number;
  predicted_demand: number;
  confidence_level: number;
  risk_level: 'low' | 'medium' | 'high';
  seasonal_factor: number;
  trend_direction: 'up' | 'down' | 'stable';
  historical_data: {
    date: string;
    actual_sales: number;
    predicted_sales: number;
  }[];
  cost_impact: {
    current_value: number;
    suggested_order_value: number;
    potential_savings: number;
  };
}

interface InventoryForecastingProps {
  categoryId?: number;
  supplierId?: number;
  onReorderSuggestion?: (productId: number, quantity: number) => void;
}

const InventoryForecasting: React.FC<InventoryForecastingProps> = ({
  categoryId,
  supplierId,
  onReorderSuggestion
}) => {
  const [forecasts, setForecasts] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedForecast, setSelectedForecast] = useState<ForecastData | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  useEffect(() => {
    loadForecastData();
  }, [categoryId, supplierId]);

  const loadForecastData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryId) params.append('category_id', categoryId.toString());
      if (supplierId) params.append('supplier_id', supplierId.toString());
      params.append('forecast_days', '30');

      const data = await api.get<{ data: ForecastData[] }>(`/analytics/inventory-forecast?${params}`);
      setForecasts(data.data || []);
    } catch (error) {
      console.error('Error loading forecast data:', error);
      // Mock data for demonstration
      setForecasts([
        {
          product_id: 1,
          product_name: 'CPU Intel Core i5-13400F',
          product_sku: 'CPU-I5-13400F',
          category_name: 'CPU',
          current_stock: 5,
          reorder_point: 8,
          suggested_order_quantity: 15,
          forecast_period_days: 30,
          predicted_demand: 12,
          confidence_level: 87,
          risk_level: 'medium',
          seasonal_factor: 1.2,
          trend_direction: 'up',
          historical_data: [
            { date: '2024-01-01', actual_sales: 8, predicted_sales: 7 },
            { date: '2024-01-02', actual_sales: 12, predicted_sales: 11 },
            { date: '2024-01-03', actual_sales: 6, predicted_sales: 8 },
            { date: '2024-01-04', actual_sales: 15, predicted_sales: 13 },
            { date: '2024-01-05', actual_sales: 9, predicted_sales: 10 }
          ],
          cost_impact: {
            current_value: 20950000,
            suggested_order_value: 62850000,
            potential_savings: 1500000
          }
        },
        {
          product_id: 2,
          product_name: 'RAM Corsair Vengeance 16GB',
          product_sku: 'RAM-CORS-16GB',
          category_name: 'RAM',
          current_stock: 12,
          reorder_point: 6,
          suggested_order_quantity: 0,
          forecast_period_days: 30,
          predicted_demand: 8,
          confidence_level: 92,
          risk_level: 'low',
          seasonal_factor: 0.9,
          trend_direction: 'stable',
          historical_data: [
            { date: '2024-01-01', actual_sales: 5, predicted_sales: 6 },
            { date: '2024-01-02', actual_sales: 7, predicted_sales: 7 },
            { date: '2024-01-03', actual_sales: 4, predicted_sales: 5 },
            { date: '2024-01-04', actual_sales: 9, predicted_sales: 8 },
            { date: '2024-01-05', actual_sales: 6, predicted_sales: 6 }
          ],
          cost_impact: {
            current_value: 27600000,
            suggested_order_value: 0,
            potential_savings: 0
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      default:
        return 'success';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'high':
        return <WarningIcon color="error" />;
      case 'medium':
        return <InfoIcon color="warning" />;
      default:
        return <CheckIcon color="success" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUpIcon color="success" />;
      case 'down':
        return <TrendingDownIcon color="error" />;
      default:
        return <TrendingUpIcon color="action" sx={{ transform: 'rotate(90deg)' }} />;
    }
  };

  const getStockStatus = (current: number, reorderPoint: number) => {
    if (current <= reorderPoint * 0.5) return { label: 'Cần nhập gấp', color: 'error' };
    if (current <= reorderPoint) return { label: 'Cần nhập hàng', color: 'warning' };
    return { label: 'Đủ hàng', color: 'success' };
  };

  const totalPotentialSavings = forecasts.reduce((sum, f) => sum + f.cost_impact.potential_savings, 0);
  const highRiskCount = forecasts.filter(f => f.risk_level === 'high').length;
  const reorderNeededCount = forecasts.filter(f => f.suggested_order_quantity > 0).length;

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <AnalyticsIcon color="primary" />
            <Typography variant="h6">Dự báo tồn kho</Typography>
          </Box>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AnalyticsIcon color="primary" />
              <Typography variant="h6">Dự báo tồn kho thông minh</Typography>
              <Chip label="AI-Powered" color="primary" size="small" />
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={loadForecastData}
            >
              Cập nhật
            </Button>
          </Box>

          {/* Summary Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.50' }}>
                <Typography variant="h4" color="error.main" fontWeight="bold">
                  {highRiskCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sản phẩm rủi ro cao
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.50' }}>
                <Typography variant="h4" color="warning.main" fontWeight="bold">
                  {reorderNeededCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Cần nhập hàng
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.50' }}>
                <Typography variant="h4" color="success.main" fontWeight="bold">
                  {formatCurrency(totalPotentialSavings)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tiết kiệm tiềm năng
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Forecast Table */}
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Sản phẩm</TableCell>
                  <TableCell align="center">Tồn kho</TableCell>
                  <TableCell align="center">Dự báo nhu cầu</TableCell>
                  <TableCell align="center">Đề xuất nhập</TableCell>
                  <TableCell align="center">Độ tin cậy</TableCell>
                  <TableCell align="center">Rủi ro</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {forecasts.map((forecast) => {
                  const stockStatus = getStockStatus(forecast.current_stock, forecast.reorder_point);
                  
                  return (
                    <TableRow key={forecast.product_id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {forecast.product_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {forecast.product_sku} • {forecast.category_name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {forecast.current_stock}
                          </Typography>
                          <Chip
                            label={stockStatus.label}
                            color={stockStatus.color as any}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {forecast.predicted_demand}
                          </Typography>
                          {getTrendIcon(forecast.trend_direction)}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        {forecast.suggested_order_quantity > 0 ? (
                          <Box>
                            <Typography variant="body2" fontWeight={600} color="primary">
                              {forecast.suggested_order_quantity}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatCurrency(forecast.cost_impact.suggested_order_value)}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Không cần
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={forecast.confidence_level}
                            sx={{ width: 40, height: 6 }}
                            color={forecast.confidence_level >= 80 ? 'success' : 'warning'}
                          />
                          <Typography variant="caption">
                            {forecast.confidence_level}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={getRiskIcon(forecast.risk_level)}
                          label={forecast.risk_level}
                          color={getRiskColor(forecast.risk_level) as any}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Xem chi tiết">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedForecast(forecast);
                                setDetailDialogOpen(true);
                              }}
                            >
                              <AnalyticsIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {forecast.suggested_order_quantity > 0 && (
                            <Tooltip title="Thêm vào phiếu nhập">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => onReorderSuggestion?.(forecast.product_id, forecast.suggested_order_quantity)}
                              >
                                <TrendingUpIcon fontSize="small" />
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

          {forecasts.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Không có dữ liệu dự báo. Hệ thống cần thêm dữ liệu lịch sử để tạo dự báo chính xác.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Chi tiết dự báo: {selectedForecast?.product_name}
        </DialogTitle>
        <DialogContent>
          {selectedForecast && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Biểu đồ dự báo
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={selectedForecast.historical_data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="actual_sales" stroke="#8884d8" name="Thực tế" />
                  <Line type="monotone" dataKey="predicted_sales" stroke="#82ca9d" name="Dự báo" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default InventoryForecasting;
