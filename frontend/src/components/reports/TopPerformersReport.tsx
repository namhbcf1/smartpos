import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar
} from '@mui/material';
import { EmojiEvents, Category, Person, TrendingUp } from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const TopPerformersReport: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });
  const [limit, setLimit] = useState(10);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchTopPerformers();
  }, [dateRange, limit]);

  const fetchTopPerformers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/reports/advanced/top-performers`, {
        params: { ...dateRange, limit }
      });
      setData(response.data.data);
    } catch (error) {
      console.error('Error fetching top performers:', error);
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

  const getMedalColor = (rank: number) => {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return '#757575'; // Gray
  };

  if (loading && !data) {
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
          label="Số lượng"
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          size="small"
          SelectProps={{ native: true }}
        >
          <option value={5}>Top 5</option>
          <option value={10}>Top 10</option>
          <option value={20}>Top 20</option>
          <option value={50}>Top 50</option>
        </TextField>
      </Box>

      {data && (
        <Grid container spacing={3}>
          {/* Top Products */}
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <EmojiEvents sx={{ color: '#FFD700' }} />
                  <Typography variant="h6">Top Sản Phẩm</Typography>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell width={50}>#</TableCell>
                        <TableCell>Sản phẩm</TableCell>
                        <TableCell align="right">Doanh thu</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.products?.map((product: any) => (
                        <TableRow key={product.product_id}>
                          <TableCell>
                            <Avatar
                              sx={{
                                width: 28,
                                height: 28,
                                bgcolor: getMedalColor(product.rank),
                                fontSize: '0.875rem'
                              }}
                            >
                              {product.rank}
                            </Avatar>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {product.product_name}
                            </Typography>
                            <Box display="flex" gap={0.5} mt={0.5}>
                              <Chip
                                label={product.sku}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 20 }}
                              />
                              <Chip
                                label={`${product.quantity_sold} bán`}
                                size="small"
                                color="primary"
                                sx={{ fontSize: '0.7rem', height: 20 }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold" color="primary">
                              {formatCurrency(product.revenue_cents)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Top Categories */}
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Category sx={{ color: '#2196F3' }} />
                  <Typography variant="h6">Top Danh Mục</Typography>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell width={50}>#</TableCell>
                        <TableCell>Danh mục</TableCell>
                        <TableCell align="right">Doanh thu</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.categories?.map((category: any) => (
                        <TableRow key={category.category_name}>
                          <TableCell>
                            <Avatar
                              sx={{
                                width: 28,
                                height: 28,
                                bgcolor: getMedalColor(category.rank),
                                fontSize: '0.875rem'
                              }}
                            >
                              {category.rank}
                            </Avatar>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {category.category_name}
                            </Typography>
                            <Box display="flex" gap={0.5} mt={0.5}>
                              <Chip
                                label={`${category.product_count} SP`}
                                size="small"
                                color="info"
                                sx={{ fontSize: '0.7rem', height: 20 }}
                              />
                              <Chip
                                label={`${category.order_count} đơn`}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 20 }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold" color="primary">
                              {formatCurrency(category.revenue_cents)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Top Customers */}
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Person sx={{ color: '#4CAF50' }} />
                  <Typography variant="h6">Top Khách Hàng</Typography>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell width={50}>#</TableCell>
                        <TableCell>Khách hàng</TableCell>
                        <TableCell align="right">Chi tiêu</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.customers?.map((customer: any) => (
                        <TableRow key={customer.customer_id}>
                          <TableCell>
                            <Avatar
                              sx={{
                                width: 28,
                                height: 28,
                                bgcolor: getMedalColor(customer.rank),
                                fontSize: '0.875rem'
                              }}
                            >
                              {customer.rank}
                            </Avatar>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {customer.customer_name}
                            </Typography>
                            <Box display="flex" gap={0.5} mt={0.5}>
                              <Chip
                                label={`${customer.order_count} đơn`}
                                size="small"
                                color="success"
                                sx={{ fontSize: '0.7rem', height: 20 }}
                              />
                              <Chip
                                label={`AOV: ${formatCurrency(customer.avg_order_value_cents)}`}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 20 }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold" color="success.main">
                              {formatCurrency(customer.total_spent_cents)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Summary Stats */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Tổng quan hiệu suất
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white'
                      }}
                    >
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Tổng sản phẩm bán chạy
                      </Typography>
                      <Typography variant="h4" sx={{ mt: 1 }}>
                        {data.products?.reduce((sum: number, p: any) => sum + p.quantity_sold, 0)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        color: 'white'
                      }}
                    >
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Tổng doanh thu top SP
                      </Typography>
                      <Typography variant="h5" sx={{ mt: 1 }}>
                        {formatCurrency(
                          data.products?.reduce((sum: number, p: any) => sum + p.revenue_cents, 0)
                        )}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        color: 'white'
                      }}
                    >
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Tổng đơn hàng
                      </Typography>
                      <Typography variant="h4" sx={{ mt: 1 }}>
                        {data.products?.reduce((sum: number, p: any) => sum + p.order_count, 0)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                        color: 'white'
                      }}
                    >
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Tổng chi tiêu top KH
                      </Typography>
                      <Typography variant="h5" sx={{ mt: 1 }}>
                        {formatCurrency(
                          data.customers?.reduce((sum: number, c: any) => sum + c.total_spent_cents, 0)
                        )}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default TopPerformersReport;
