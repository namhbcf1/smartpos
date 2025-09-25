import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  ShoppingCart as CartIcon,
  Star as StarIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { comprehensiveAPI } from '../services/business/comprehensiveApi';

interface CustomerMetrics {
  total_customers: number;
  new_customers_this_month: number;
  total_revenue: number;
  average_order_value: number;
  repeat_customer_rate: number;
  customer_lifetime_value: number;
}

interface TopCustomer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  total_spent: number;
  order_count: number;
  last_order_date: string;
  customer_since: string;
  loyalty_level: 'bronze' | 'silver' | 'gold' | 'platinum';
}

interface CustomerSegment {
  segment: string;
  count: number;
  percentage: number;
  avg_spent: number;
  color: string;
}

interface CustomerAnalyticsDashboardProps {
  compact?: boolean;
}

const CustomerAnalyticsDashboard: React.FC<CustomerAnalyticsDashboardProps> = ({
  compact = false
}) => {
  const [metrics, setMetrics] = useState<CustomerMetrics>({
    total_customers: 0,
    new_customers_this_month: 0,
    total_revenue: 0,
    average_order_value: 0,
    repeat_customer_rate: 0,
    customer_lifetime_value: 0
  });
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [customerSegments, setCustomerSegments] = useState<CustomerSegment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const [metricsResponse, topCustomersResponse, segmentsResponse] = await Promise.all([
        comprehensiveAPI.customers.getCustomers(),
        comprehensiveAPI.customers.getCustomers(),
        comprehensiveAPI.customers.getCustomerGroups()
      ]);

      setMetrics(metricsResponse.data || metrics);
      setTopCustomers(topCustomersResponse.data || []);
      setCustomerSegments(segmentsResponse.data || []);
    } catch (error) {
      console.error('Error loading customer analytics:', error);
      // NO MOCK DATA - Clear state on API failure
      setMetrics({
        total_customers: 0,
        new_customers_this_month: 0,
        total_revenue: 0,
        average_order_value: 0,
        repeat_customer_rate: 0,
        customer_lifetime_value: 0
      });
      setTopCustomers([]);
      setCustomerSegments([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getLoyaltyColor = (level: string) => {
    switch (level) {
      case 'platinum':
        return '#e0e0e0';
      case 'gold':
        return '#ffd700';
      case 'silver':
        return '#c0c0c0';
      case 'bronze':
        return '#cd7f32';
      default:
        return '#757575';
    }
  };

  const getLoyaltyIcon = (level: string) => {
    return <StarIcon sx={{ color: getLoyaltyColor(level) }} />;
  };

  if (compact) {
    return (
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3} component="div">
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <PeopleIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{metrics.total_customers.toLocaleString()}</Typography>
              <Typography variant="body2" color="text.secondary">
                Total Customers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3} component="div">
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <MoneyIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{formatCurrency(metrics.total_revenue)}</Typography>
              <Typography variant="body2" color="text.secondary">
                Total Revenue
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3} component="div">
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CartIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{formatCurrency(metrics.average_order_value)}</Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Order Value
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3} component="div">
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUpIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{metrics.repeat_customer_rate.toFixed(1)}%</Typography>
              <Typography variant="body2" color="text.secondary">
                Repeat Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center' }}>
          <PeopleIcon sx={{ mr: 1 }} />
          Customer Analytics Dashboard
        </Typography>
        <Tooltip title="Refresh Data">
          <IconButton onClick={loadAnalyticsData} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2} component="div">
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <PeopleIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="primary">
                {metrics.total_customers.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Customers
              </Typography>
              <Chip
                label={`+${metrics.new_customers_this_month} this month`}
                color="success"
                size="small"
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2} component="div">
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <MoneyIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="success.main">
                {formatCurrency(metrics.total_revenue)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Revenue
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2} component="div">
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CartIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="info.main">
                {formatCurrency(metrics.average_order_value)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Order Value
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2} component="div">
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUpIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="warning.main">
                {metrics.repeat_customer_rate.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Repeat Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2} component="div">
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <StarIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="primary">
                {formatCurrency(metrics.customer_lifetime_value)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Customer LTV
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2} component="div">
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUpIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="success.main">
                +{metrics.new_customers_this_month}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                New This Month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Customer Segments */}
        <Grid item xs={12} md={6} component="div">
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Customer Segments
              </Typography>
              {customerSegments.map((segment) => (
                <Box key={segment.segment} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                      {segment.segment} ({segment.count} customers)
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {segment.percentage}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={segment.percentage}
                    sx={{
                      height: 8,
                      backgroundColor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: segment.color
                      }
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Avg Spent: {formatCurrency(segment.avg_spent)}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Top Customers */}
        <Grid item xs={12} md={6} component="div">
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Customers
              </Typography>
              <List>
                {topCustomers.map((customer, index) => (
                  <React.Fragment key={customer.id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {customer.name.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" fontWeight="bold">
                              {customer.name}
                            </Typography>
                            {getLoyaltyIcon(customer.loyalty_level)}
                            <Chip
                              label={customer.loyalty_level.toUpperCase()}
                              size="small"
                              sx={{ bgcolor: getLoyaltyColor(customer.loyalty_level), color: 'white' }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                              <EmailIcon sx={{ fontSize: 16 }} />
                              <Typography variant="body2">{customer.email}</Typography>
                            </Box>
                            {customer.phone && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                <PhoneIcon sx={{ fontSize: 16 }} />
                                <Typography variant="body2">{customer.phone}</Typography>
                              </Box>
                            )}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                              <Typography variant="body2" color="success.main" fontWeight="bold">
                                {formatCurrency(customer.total_spent)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {customer.order_count} orders
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < topCustomers.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Customer Details Table */}
        <Grid item xs={12} component="div">
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Customer Details
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Customer</TableCell>
                      <TableCell>Contact</TableCell>
                      <TableCell align="right">Total Spent</TableCell>
                      <TableCell align="center">Orders</TableCell>
                      <TableCell align="center">Loyalty Level</TableCell>
                      <TableCell>Last Order</TableCell>
                      <TableCell>Customer Since</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                              {customer.name.split(' ').map(n => n[0]).join('')}
                            </Avatar>
                            <Typography variant="body2" fontWeight="bold">
                              {customer.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">{customer.email}</Typography>
                            {customer.phone && (
                              <Typography variant="caption" color="text.secondary">
                                {customer.phone}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold" color="success.main">
                            {formatCurrency(customer.total_spent)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={customer.order_count} color="info" size="small" />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={customer.loyalty_level.toUpperCase()}
                            size="small"
                            sx={{ bgcolor: getLoyaltyColor(customer.loyalty_level), color: 'white' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(customer.last_order_date).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(customer.customer_since).toLocaleDateString()}
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
      </Grid>
    </Box>
  );
};

export default CustomerAnalyticsDashboard;
