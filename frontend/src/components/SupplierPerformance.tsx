import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Rating,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Schedule as ScheduleIcon,
  LocalShipping as ShippingIcon,
  Assessment as AssessmentIcon,
  Star as StarIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { comprehensiveAPI } from '../services/business/comprehensiveApi';

interface SupplierMetrics {
  id: number;
  supplier_name: string;
  total_orders: number;
  completed_orders: number;
  pending_orders: number;
  cancelled_orders: number;
  total_amount: number;
  average_order_value: number;
  on_time_delivery_rate: number;
  quality_rating: number;
  response_time_hours: number;
  last_order_date: string;
  first_order_date: string;
  performance_score: number;
  trend: 'up' | 'down' | 'stable';
}

interface SupplierOrder {
  id: number;
  order_date: string;
  delivery_date: string;
  status: 'completed' | 'pending' | 'cancelled';
  total_amount: number;
  items_count: number;
  on_time: boolean;
}

interface SupplierPerformanceProps {
  supplierId?: number;
  showDetailed?: boolean;
  compact?: boolean;
}

const SupplierPerformance: React.FC<SupplierPerformanceProps> = ({
  supplierId,
  showDetailed = false,
  compact = false
}) => {
  const [metrics, setMetrics] = useState<SupplierMetrics[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierMetrics | null>(null);
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  useEffect(() => {
    loadSupplierMetrics();
  }, [supplierId]);

  const loadSupplierMetrics = async () => {
    try {
      setLoading(true);
      const response = await comprehensiveAPI.get(
        supplierId ? `/suppliers/${supplierId}/performance` : '/suppliers/performance'
      );
      const data = response.data || [];
      setMetrics(Array.isArray(data) ? data : [data]);
    } catch (error) {
      console.error('Error loading supplier metrics:', error);
      setMetrics([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSupplierOrders = async (supplierId: number) => {
    try {
      const response = await comprehensiveAPI.get(`/suppliers/${supplierId}/orders`);
      setOrders(response.data || []);
    } catch (error) {
      console.error('Error loading supplier orders:', error);
      setOrders([]);
    }
  };

  const handleViewDetails = async (supplier: SupplierMetrics) => {
    setSelectedSupplier(supplier);
    await loadSupplierOrders(supplier.id);
    setDetailsOpen(true);
  };

  const handleRateSupplier = async () => {
    if (!selectedSupplier) return;
    
    try {
      await comprehensiveAPI.post(`/suppliers/${selectedSupplier.id}/rating`, {
        rating: newRating,
        comment: ratingComment
      });
      setRatingDialogOpen(false);
      setRatingComment('');
      loadSupplierMetrics();
    } catch (error) {
      console.error('Error rating supplier:', error);
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckIcon color="success" />;
      case 'pending':
        return <WarningIcon color="warning" />;
      case 'cancelled':
        return <ErrorIcon color="error" />;
      default:
        return null;
    }
  };

  if (compact && metrics.length === 1) {
    const metric = metrics[0];
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">{metric.supplier_name}</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={6} component="div">
              <Typography variant="body2" color="text.secondary">
                Performance Score
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h6" color={getPerformanceColor(metric.performance_score)}>
                  {metric.performance_score}%
                </Typography>
                {metric.trend === 'up' && <TrendingUpIcon color="success" sx={{ ml: 1 }} />}
                {metric.trend === 'down' && <TrendingDownIcon color="error" sx={{ ml: 1 }} />}
              </Box>
            </Grid>
            <Grid item xs={6} component="div">
              <Typography variant="body2" color="text.secondary">
                Quality Rating
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Rating value={metric.quality_rating} readOnly size="small" />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  ({metric.quality_rating.toFixed(1)})
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <AssessmentIcon sx={{ mr: 1 }} />
        Supplier Performance Analytics
      </Typography>

      {loading ? (
        <LinearProgress />
      ) : (
        <Grid container spacing={3}>
          {metrics.map((metric) => (
            <Grid item xs={12} md={6} lg={4} key={metric.id} component="div">
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" noWrap>
                        {metric.supplier_name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <Rating value={metric.quality_rating} readOnly size="small" />
                        <Typography variant="caption" sx={{ ml: 1 }}>
                          ({metric.quality_rating.toFixed(1)})
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex' }}>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => handleViewDetails(metric)}>
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Rate Supplier">
                        <IconButton 
                          size="small" 
                          onClick={() => {
                            setSelectedSupplier(metric);
                            setRatingDialogOpen(true);
                          }}
                        >
                          <StarIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Performance Score
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography 
                          variant="body2" 
                          color={`${getPerformanceColor(metric.performance_score)}.main`}
                          fontWeight="bold"
                        >
                          {metric.performance_score}%
                        </Typography>
                        {metric.trend === 'up' && <TrendingUpIcon color="success" fontSize="small" sx={{ ml: 0.5 }} />}
                        {metric.trend === 'down' && <TrendingDownIcon color="error" fontSize="small" sx={{ ml: 0.5 }} />}
                      </Box>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={metric.performance_score} 
                      color={getPerformanceColor(metric.performance_score)}
                    />
                  </Box>

                  <Grid container spacing={1}>
                    <Grid item xs={6} component="div">
                      <Typography variant="body2" color="text.secondary">
                        Total Orders
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {metric.total_orders}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} component="div">
                      <Typography variant="body2" color="text.secondary">
                        On-Time Rate
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {metric.on_time_delivery_rate.toFixed(1)}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6} component="div">
                      <Typography variant="body2" color="text.secondary">
                        Avg Order Value
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        ${metric.average_order_value.toFixed(0)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} component="div">
                      <Typography variant="body2" color="text.secondary">
                        Response Time
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {metric.response_time_hours}h
                      </Typography>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip 
                      label={`${metric.completed_orders} Completed`} 
                      color="success" 
                      size="small" 
                    />
                    {metric.pending_orders > 0 && (
                      <Chip 
                        label={`${metric.pending_orders} Pending`} 
                        color="warning" 
                        size="small" 
                      />
                    )}
                    {metric.cancelled_orders > 0 && (
                      <Chip 
                        label={`${metric.cancelled_orders} Cancelled`} 
                        color="error" 
                        size="small" 
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          {selectedSupplier && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <BusinessIcon sx={{ mr: 1 }} />
              {selectedSupplier.supplier_name} - Detailed Performance
            </Box>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedSupplier && (
            <Box>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3} component="div">
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <MoneyIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h4">
                        ${selectedSupplier.total_amount.toFixed(0)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Revenue
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3} component="div">
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <ShippingIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h4">
                        {selectedSupplier.on_time_delivery_rate.toFixed(1)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        On-Time Delivery
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3} component="div">
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <ScheduleIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h4">
                        {selectedSupplier.response_time_hours}h
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Avg Response Time
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3} component="div">
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <StarIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h4">
                        {selectedSupplier.quality_rating.toFixed(1)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Quality Rating
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom>
                Recent Orders
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Order Date</TableCell>
                      <TableCell>Delivery Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Items</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>On Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.slice(0, 10).map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          {new Date(order.order_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getStatusIcon(order.status)}
                            <Typography variant="body2" sx={{ ml: 1, textTransform: 'capitalize' }}>
                              {order.status}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{order.items_count}</TableCell>
                        <TableCell align="right">
                          ${order.total_amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {order.on_time ? (
                            <CheckIcon color="success" />
                          ) : (
                            <ErrorIcon color="error" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Rating Dialog */}
      <Dialog open={ratingDialogOpen} onClose={() => setRatingDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Rate Supplier</DialogTitle>
        <DialogContent>
          {selectedSupplier && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="h6" gutterBottom>
                {selectedSupplier.supplier_name}
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" gutterBottom>
                  Quality Rating
                </Typography>
                <Rating
                  value={newRating}
                  onChange={(_, value) => setNewRating(value || 5)}
                  size="large"
                />
              </Box>
              <TextField
                label="Comments (Optional)"
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                multiline
                rows={4}
                fullWidth
                placeholder="Share your experience with this supplier..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRatingDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRateSupplier} variant="contained">
            Submit Rating
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SupplierPerformance;
