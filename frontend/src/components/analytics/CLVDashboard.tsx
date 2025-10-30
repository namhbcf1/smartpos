import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Grid, CircularProgress, Chip, Table, TableBody, TableCell, TableHead, TableRow, LinearProgress } from '@mui/material';
import { TrendingUp, AttachMoney, Person, Warning } from '@mui/icons-material';

interface CLVData {
  customerId: string;
  customerName: string;
  averageOrderValue: number;
  purchaseFrequency: number;
  totalRevenue: number;
  clv: number;
  predictedClv: number;
  profitability: 'high' | 'medium' | 'low';
}

const CLVDashboard: React.FC = () => {
  const [data, setData] = useState<CLVData[]>([]);
  const [loading, setLoading] = useState(true);
  const [topCustomers, setTopCustomers] = useState<CLVData[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const base = (import.meta as any).env?.VITE_API_BASE_URL || 'https://namhbcf-api.bangachieu2.workers.dev';
      const [clvRes, topRes] = await Promise.all([
        fetch(`${base}/api/analytics/clv`, { headers: { 'X-Tenant-ID': 'default' }}),
        fetch(`${base}/api/analytics/clv/top?limit=10`, { headers: { 'X-Tenant-ID': 'default' }})
      ]);
      const clvData = await clvRes.json();
      const topData = await topRes.json();
      setData(clvData.data || []);
      setTopCustomers(topData.data || []);
    } catch (error) {
      console.error('Error fetching CLV:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(amount);
  };

  const avgCLV = data.length > 0 ? data.reduce((sum, c) => sum + c.clv, 0) / data.length : 0;
  const totalCLV = data.reduce((sum, c) => sum + c.clv, 0);
  const highValue = data.filter(c => c.profitability === 'high').length;

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachMoney color="primary" />
                <Typography variant="caption" color="text.secondary">AVG CLV</Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold">{formatCurrency(avgCLV)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp color="success" />
                <Typography variant="caption" color="text.secondary">Total CLV</Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold">{formatCurrency(totalCLV)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person color="error" />
                <Typography variant="caption" color="text.secondary">High Value</Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold">{highValue}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Warning color="warning" />
                <Typography variant="caption" color="text.secondary">Total Customers</Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold">{data.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Top 10 Customers by CLV</Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Customer</TableCell>
                <TableCell>Total Revenue</TableCell>
                <TableCell>AVG Order</TableCell>
                <TableCell>Frequency</TableCell>
                <TableCell>CLV</TableCell>
                <TableCell>Predicted CLV</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {topCustomers.map((customer) => (
                <TableRow key={customer.customerId}>
                  <TableCell>{customer.customerName}</TableCell>
                  <TableCell>{formatCurrency(customer.totalRevenue)}</TableCell>
                  <TableCell>{formatCurrency(customer.averageOrderValue)}</TableCell>
                  <TableCell>{customer.purchaseFrequency.toFixed(2)}</TableCell>
                  <TableCell fontWeight="bold">{formatCurrency(customer.clv)}</TableCell>
                  <TableCell>{formatCurrency(customer.predictedClv)}</TableCell>
                  <TableCell>
                    <Chip
                      label={customer.profitability.toUpperCase()}
                      color={customer.profitability === 'high' ? 'error' : customer.profitability === 'medium' ? 'warning' : 'default'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CLVDashboard;
