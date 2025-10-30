import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  Person,
  Phone,
  Email,
  LocationOn,
  ShoppingCart,
  AttachMoney,
  TrendingUp,
  Star,
  Cake,
  CalendarToday
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL;

interface Customer360ViewProps {
  customerId: string;
}

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

const Customer360View: React.FC<Customer360ViewProps> = ({ customerId }) => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [rfmSegment, setRfmSegment] = useState<any>(null);
  const [clvData, setClvData] = useState<any>(null);
  const [loyaltyData, setLoyaltyData] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    fetchCustomer360Data();
  }, [customerId]);

  const fetchCustomer360Data = async () => {
    setLoading(true);
    try {
      const [
        customerRes,
        ordersRes,
        rfmRes,
        clvRes,
        loyaltyRes,
        recsRes
      ] = await Promise.all([
        axios.get(`${API_URL}/api/customers/${customerId}`),
        axios.get(`${API_URL}/api/orders`, { params: { customer_id: customerId, limit: 10 } }),
        axios.get(`${API_URL}/api/customers/segmentation/rfm`),
        axios.get(`${API_URL}/api/analytics/clv`),
        axios.get(`${API_URL}/api/loyalty/transactions/${customerId}`),
        axios.get(`${API_URL}/api/recommendations/personalized/${customerId}`, { params: { limit: 5 } })
      ]);

      setCustomer(customerRes.data.customer || customerRes.data.data);
      setOrders(ordersRes.data.orders || ordersRes.data.data || []);

      // Find customer's RFM segment
      const rfmSegments = rfmRes.data.data || [];
      const customerSegment = rfmSegments.find((s: any) => s.customer_id === customerId);
      setRfmSegment(customerSegment);

      // Find customer's CLV
      const clvMetrics = clvRes.data.data || [];
      const customerCLV = clvMetrics.find((c: any) => c.customer_id === customerId);
      setClvData(customerCLV);

      setLoyaltyData(loyaltyRes.data.data || null);
      setRecommendations(recsRes.data.data || []);
    } catch (error) {
      console.error('Error fetching customer 360 data:', error);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getCustomerTypeColor = (type: string) => {
    switch (type) {
      case 'VIP': return 'error';
      case 'Premium': return 'warning';
      case 'Regular': return 'info';
      default: return 'default';
    }
  };

  const getLoyaltyTier = (points: number) => {
    if (points >= 10000) return { name: 'Diamond', color: '#b9f2ff' };
    if (points >= 5000) return { name: 'Platinum', color: '#e5e4e2' };
    if (points >= 2000) return { name: 'Gold', color: '#ffd700' };
    if (points >= 1000) return { name: 'Silver', color: '#c0c0c0' };
    return { name: 'Bronze', color: '#cd7f32' };
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (loading || !customer) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  const loyaltyTier = getLoyaltyTier(customer.loyalty_points || 0);

  return (
    <Box>
      {/* Header Section */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  bgcolor: 'white',
                  color: 'primary.main',
                  fontSize: '3rem'
                }}
              >
                {customer.name?.charAt(0) || 'C'}
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h4" color="white" gutterBottom>
                {customer.name}
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                <Chip
                  label={customer.customer_type || 'Regular'}
                  color={getCustomerTypeColor(customer.customer_type)}
                  size="small"
                />
                <Chip
                  label={loyaltyTier.name}
                  size="small"
                  sx={{ bgcolor: loyaltyTier.color, color: 'black' }}
                />
                {rfmSegment && (
                  <Chip
                    label={rfmSegment.segment}
                    size="small"
                    color="success"
                  />
                )}
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Box display="flex" alignItems="center" gap={1} color="white">
                    <Phone fontSize="small" />
                    <Typography variant="body2">{customer.phone || 'N/A'}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box display="flex" alignItems="center" gap={1} color="white">
                    <Email fontSize="small" />
                    <Typography variant="body2">{customer.email || 'N/A'}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box display="flex" alignItems="center" gap={1} color="white">
                    <Cake fontSize="small" />
                    <Typography variant="body2">
                      {customer.date_of_birth ? formatDate(customer.date_of_birth) : 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box display="flex" alignItems="center" gap={1} color="white">
                    <CalendarToday fontSize="small" />
                    <Typography variant="body2">
                      Since {formatDate(customer.created_at)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <ShoppingCart color="primary" />
                <Typography variant="body2" color="text.secondary">
                  Total Orders
                </Typography>
              </Box>
              <Typography variant="h4">{customer.total_orders || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <AttachMoney color="success" />
                <Typography variant="body2" color="text.secondary">
                  Total Spent
                </Typography>
              </Box>
              <Typography variant="h5">
                {formatCurrency(customer.total_spent_cents || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TrendingUp color="info" />
                <Typography variant="body2" color="text.secondary">
                  Avg Order Value
                </Typography>
              </Box>
              <Typography variant="h5">
                {customer.total_orders > 0
                  ? formatCurrency(customer.total_spent_cents / customer.total_orders)
                  : formatCurrency(0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Star color="warning" />
                <Typography variant="body2" color="text.secondary">
                  Loyalty Points
                </Typography>
              </Box>
              <Typography variant="h4">{customer.loyalty_points || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* RFM & CLV Insights */}
      {(rfmSegment || clvData) && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {rfmSegment && (
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    RFM Analysis
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">
                        Recency
                      </Typography>
                      <Typography variant="h5">{rfmSegment.recency_score}/5</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">
                        Frequency
                      </Typography>
                      <Typography variant="h5">{rfmSegment.frequency_score}/5</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">
                        Monetary
                      </Typography>
                      <Typography variant="h5">{rfmSegment.monetary_score}/5</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}
          {clvData && (
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Customer Lifetime Value
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {formatCurrency(clvData.clv_cents)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Estimated lifetime value based on purchase patterns
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* Detailed Tabs */}
      <Card>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Recent Orders" />
          <Tab label="Loyalty History" />
          <Tab label="Recommendations" />
          <Tab label="Contact Info" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order #</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.order_number}</TableCell>
                    <TableCell>{formatDate(order.created_at)}</TableCell>
                    <TableCell>
                      <Chip label={order.status} size="small" color="primary" />
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(order.total_cents)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {loyaltyData?.transactions?.length > 0 ? (
            <List>
              {loyaltyData.transactions.map((tx: any, index: number) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={tx.reason}
                    secondary={formatDate(tx.created_at)}
                  />
                  <Chip
                    label={`${tx.type === 'earn' ? '+' : '-'}${tx.points} pts`}
                    color={tx.type === 'earn' ? 'success' : 'error'}
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography color="text.secondary">No loyalty transactions yet</Typography>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={2}>
            {recommendations.map((rec) => (
              <Grid item xs={12} md={6} key={rec.product_id}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {rec.product_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {rec.recommendation_reason}
                    </Typography>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                      <Typography variant="h6" color="primary">
                        {formatCurrency(rec.price_cents)}
                      </Typography>
                      <Chip
                        label={`${rec.confidence}% match`}
                        size="small"
                        color="success"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Full Address"
                    secondary={customer.address || 'N/A'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="City/Province"
                    secondary={`${customer.city || ''} ${customer.province || ''}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Postal Code"
                    secondary={customer.postal_code || 'N/A'}
                  />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Last Visit"
                    secondary={customer.last_visit ? formatDate(customer.last_visit) : 'Never'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Notes"
                    secondary={customer.notes || 'No notes'}
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>
    </Box>
  );
};

export default Customer360View;
