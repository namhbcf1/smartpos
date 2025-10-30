import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  MenuItem,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tab,
  Tabs
} from '@mui/material';
import { TrendingUp, TrendingDown, AttachMoney, ShoppingCart, Category } from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const SalesReportDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month' | 'year'>('day');

  const [productSales, setProductSales] = useState<any[]>([]);
  const [categorySales, setCategorySales] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [profitMargin, setProfitMargin] = useState<any>(null);

  useEffect(() => {
    fetchReports();
  }, [dateRange, groupBy]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes, timelineRes, profitRes] = await Promise.all([
        axios.get(`${API_URL}/api/reports/advanced/sales/products`, {
          params: dateRange
        }),
        axios.get(`${API_URL}/api/reports/advanced/sales/categories`, {
          params: dateRange
        }),
        axios.get(`${API_URL}/api/reports/advanced/sales/timeline`, {
          params: { ...dateRange, group_by: groupBy }
        }),
        axios.get(`${API_URL}/api/reports/advanced/profit-margin`, {
          params: dateRange
        })
      ]);

      setProductSales(productsRes.data.data || []);
      setCategorySales(categoriesRes.data.data || []);
      setTimeline(timelineRes.data.data || []);
      setProfitMargin(profitRes.data.data || null);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(cents / 100);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (loading && !productSales.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Từ ngày"
          type="date"
          value={dateRange.start_date}
          onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
          InputLabelProps={{ shrink: true }}
          size="small"
        />
        <TextField
          label="Đến ngày"
          type="date"
          value={dateRange.end_date}
          onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
          InputLabelProps={{ shrink: true }}
          size="small"
        />
        <TextField
          select
          label="Nhóm theo"
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as any)}
          size="small"
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="day">Ngày</MenuItem>
          <MenuItem value="week">Tuần</MenuItem>
          <MenuItem value="month">Tháng</MenuItem>
          <MenuItem value="year">Năm</MenuItem>
        </TextField>
      </Box>

      {profitMargin?.overall && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1}>
                  <AttachMoney color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    Tổng doanh thu
                  </Typography>
                </Box>
                <Typography variant="h5" sx={{ mt: 1 }}>
                  {formatCurrency(profitMargin.overall.total_revenue_cents)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1}>
                  <TrendingUp color="success" />
                  <Typography variant="body2" color="text.secondary">
                    Lợi nhuận gộp
                  </Typography>
                </Box>
                <Typography variant="h5" sx={{ mt: 1 }}>
                  {formatCurrency(profitMargin.overall.gross_profit_cents)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1}>
                  <ShoppingCart color="info" />
                  <Typography variant="body2" color="text.secondary">
                    Chi phí
                  </Typography>
                </Box>
                <Typography variant="h5" sx={{ mt: 1 }}>
                  {formatCurrency(profitMargin.overall.total_cost_cents)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1}>
                  {profitMargin.overall.profit_margin_percent >= 0 ? (
                    <TrendingUp color="success" />
                  ) : (
                    <TrendingDown color="error" />
                  )}
                  <Typography variant="body2" color="text.secondary">
                    Tỷ suất lợi nhuận
                  </Typography>
                </Box>
                <Typography variant="h5" sx={{ mt: 1 }}>
                  {formatPercent(profitMargin.overall.profit_margin_percent)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Card>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Sản phẩm" />
          <Tab label="Danh mục" />
          <Tab label="Thời gian" />
          <Tab label="Lợi nhuận" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Sản phẩm</TableCell>
                  <TableCell>SKU</TableCell>
                  <TableCell align="right">Số lượng bán</TableCell>
                  <TableCell align="right">Doanh thu</TableCell>
                  <TableCell align="right">Chi phí</TableCell>
                  <TableCell align="right">Lợi nhuận</TableCell>
                  <TableCell align="right">Tỷ suất LN</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {productSales.slice(0, 20).map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {row.product_name}
                      </Typography>
                      {row.category_name && (
                        <Typography variant="caption" color="text.secondary">
                          {row.category_name}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={row.sku} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">{row.quantity_sold}</TableCell>
                    <TableCell align="right">{formatCurrency(row.total_revenue_cents)}</TableCell>
                    <TableCell align="right">{formatCurrency(row.total_cost_cents)}</TableCell>
                    <TableCell align="right">
                      <Typography
                        color={row.profit_cents >= 0 ? 'success.main' : 'error.main'}
                      >
                        {formatCurrency(row.profit_cents)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={formatPercent(row.profit_margin_percent)}
                        size="small"
                        color={
                          row.profit_margin_percent >= 30 ? 'success' :
                          row.profit_margin_percent >= 15 ? 'warning' : 'error'
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Danh mục</TableCell>
                  <TableCell align="right">Số sản phẩm</TableCell>
                  <TableCell align="right">Số lượng bán</TableCell>
                  <TableCell align="right">Doanh thu</TableCell>
                  <TableCell align="right">Lợi nhuận</TableCell>
                  <TableCell align="right">Tỷ suất LN</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categorySales.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Category fontSize="small" color="primary" />
                        <Typography variant="body2" fontWeight="medium">
                          {row.category_name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">{row.product_count}</TableCell>
                    <TableCell align="right">{row.quantity_sold}</TableCell>
                    <TableCell align="right">{formatCurrency(row.total_revenue_cents)}</TableCell>
                    <TableCell align="right">
                      <Typography color={row.profit_cents >= 0 ? 'success.main' : 'error.main'}>
                        {formatCurrency(row.profit_cents)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={formatPercent(row.profit_margin_percent)}
                        size="small"
                        color={
                          row.profit_margin_percent >= 30 ? 'success' :
                          row.profit_margin_percent >= 15 ? 'warning' : 'error'
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Kỳ</TableCell>
                  <TableCell align="right">Số đơn</TableCell>
                  <TableCell align="right">Doanh thu</TableCell>
                  <TableCell align="right">Lợi nhuận</TableCell>
                  <TableCell align="right">AOV</TableCell>
                  <TableCell align="right">Tỷ suất LN</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {timeline.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Chip label={row.period} size="small" />
                    </TableCell>
                    <TableCell align="right">{row.order_count}</TableCell>
                    <TableCell align="right">{formatCurrency(row.total_revenue_cents)}</TableCell>
                    <TableCell align="right">
                      <Typography color={row.profit_cents >= 0 ? 'success.main' : 'error.main'}>
                        {formatCurrency(row.profit_cents)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(row.average_order_value_cents)}
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={formatPercent(row.profit_margin_percent)}
                        size="small"
                        color={
                          row.profit_margin_percent >= 30 ? 'success' :
                          row.profit_margin_percent >= 15 ? 'warning' : 'error'
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          {profitMargin && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Top sản phẩm lợi nhuận cao
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Sản phẩm</TableCell>
                        <TableCell align="right">Lợi nhuận</TableCell>
                        <TableCell align="right">Tỷ suất</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {profitMargin.top_profitable_products?.map((row: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2">{row.product_name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {row.sku}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography color="success.main">
                              {formatCurrency(row.profit_cents)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={formatPercent(row.margin_percent)}
                              size="small"
                              color="success"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Sản phẩm lợi nhuận thấp (cảnh báo)
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Sản phẩm</TableCell>
                        <TableCell align="right">Lợi nhuận</TableCell>
                        <TableCell align="right">Tỷ suất</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {profitMargin.low_margin_products?.map((row: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2">{row.product_name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {row.sku}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography color="error.main">
                              {formatCurrency(row.profit_cents)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={formatPercent(row.margin_percent)}
                              size="small"
                              color="error"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          )}
        </TabPanel>
      </Card>
    </Box>
  );
};

export default SalesReportDashboard;
