/**
 * INVENTORY FORECASTING DASHBOARD
 * 
 * Advanced inventory management dashboard with automated reorder points,
 * demand forecasting, and supplier performance analytics.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  ShoppingCart as ShoppingCartIcon,
  Assessment as AssessmentIcon,
  Inventory as InventoryIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import api from '../services/api';

// Interfaces
interface ReorderPoint {
  productId: number;
  currentStock: number;
  reorderLevel: number;
  reorderQuantity: number;
  leadTimeDays: number;
  averageDailyUsage: number;
  safetyStock: number;
  lastCalculated: string;
}

interface DemandForecast {
  productId: number;
  forecastPeriodDays: number;
  predictedDemand: number;
  confidence: number;
  seasonalityFactor: number;
  trendFactor: number;
  historicalAccuracy: number;
}

interface SupplierPerformance {
  supplierId: number;
  supplierName: string;
  averageLeadTime: number;
  onTimeDeliveryRate: number;
  qualityScore: number;
  priceCompetitiveness: number;
  totalOrders: number;
  lastOrderDate: string;
  recommendationScore: number;
}

interface PurchaseOrderRecommendation {
  productId: number;
  productName: string;
  currentStock: number;
  reorderLevel: number;
  recommendedQuantity: number;
  preferredSupplierId: number;
  estimatedCost: number;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  reasonCode: string;
  expectedDeliveryDate: string;
}

interface InventoryStatus {
  total_products: number;
  out_of_stock: number;
  reorder_needed: number;
  low_stock: number;
  total_inventory_value: number;
  avg_stock_level: number;
}

const InventoryForecastingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [inventoryStatus, setInventoryStatus] = useState<InventoryStatus | null>(null);
  const [reorderRecommendations, setReorderRecommendations] = useState<PurchaseOrderRecommendation[]>([]);
  const [supplierPerformance, setSupplierPerformance] = useState<SupplierPerformance[]>([]);
  const [demandForecasts, setDemandForecasts] = useState<DemandForecast[]>([]);
  
  // Dialog states
  const [forecastDialogOpen, setForecastDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [forecastDays, setForecastDays] = useState(30);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [statusRes, recommendationsRes, suppliersRes] = await Promise.all([
        api.get('/api/v1/inventory/status'),
        api.get('/api/v1/inventory/reorder-points/recommendations'),
        api.get('/api/v1/inventory/supplier-performance')
      ]);

      setInventoryStatus(statusRes.data.data);
      setReorderRecommendations(recommendationsRes.data.data);
      setSupplierPerformance(suppliersRes.data.data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateReorderPoints = async () => {
    setLoading(true);
    try {
      await api.post('/api/v1/inventory/reorder-points/calculate');
      await loadDashboardData(); // Reload data after calculation
    } catch (err) {
      setError('Failed to calculate reorder points');
      console.error('Reorder calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateDemandForecast = async () => {
    if (!selectedProductId) return;
    
    setLoading(true);
    try {
      const response = await api.post('/api/v1/inventory/demand-forecast', {
        productId: selectedProductId,
        forecastDays
      });
      setDemandForecasts(response.data.data);
      setForecastDialogOpen(false);
    } catch (err) {
      setError('Failed to generate demand forecast');
      console.error('Forecast error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // Overview Cards Component
  const OverviewCards = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <InventoryIcon color="primary" sx={{ mr: 2 }} />
              <Box>
                <Typography variant="h6">{inventoryStatus?.total_products || 0}</Typography>
                <Typography variant="body2" color="textSecondary">Total Products</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <WarningIcon color="error" sx={{ mr: 2 }} />
              <Box>
                <Typography variant="h6">{inventoryStatus?.out_of_stock || 0}</Typography>
                <Typography variant="body2" color="textSecondary">Out of Stock</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <ShoppingCartIcon color="warning" sx={{ mr: 2 }} />
              <Box>
                <Typography variant="h6">{inventoryStatus?.reorder_needed || 0}</Typography>
                <Typography variant="body2" color="textSecondary">Reorder Needed</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <TrendingUpIcon color="success" sx={{ mr: 2 }} />
              <Box>
                <Typography variant="h6">
                  {formatCurrency(inventoryStatus?.total_inventory_value || 0)}
                </Typography>
                <Typography variant="body2" color="textSecondary">Inventory Value</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Reorder Recommendations Tab
  const ReorderRecommendationsTab = () => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Purchase Order Recommendations</Typography>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={calculateReorderPoints}
            disabled={loading}
          >
            Recalculate
          </Button>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>Current Stock</TableCell>
                <TableCell>Reorder Level</TableCell>
                <TableCell>Recommended Qty</TableCell>
                <TableCell>Estimated Cost</TableCell>
                <TableCell>Urgency</TableCell>
                <TableCell>Expected Delivery</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reorderRecommendations.map((rec) => (
                <TableRow key={rec.productId}>
                  <TableCell>{rec.productName}</TableCell>
                  <TableCell>{rec.currentStock}</TableCell>
                  <TableCell>{rec.reorderLevel}</TableCell>
                  <TableCell>{rec.recommendedQuantity}</TableCell>
                  <TableCell>{formatCurrency(rec.estimatedCost)}</TableCell>
                  <TableCell>
                    <Chip
                      label={rec.urgencyLevel.toUpperCase()}
                      color={getUrgencyColor(rec.urgencyLevel) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(rec.expectedDeliveryDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button size="small" variant="outlined">
                      Create PO
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  // Supplier Performance Tab
  const SupplierPerformanceTab = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Supplier Performance Analytics</Typography>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Supplier</TableCell>
                <TableCell>Recommendation Score</TableCell>
                <TableCell>Avg Lead Time</TableCell>
                <TableCell>On-Time Delivery</TableCell>
                <TableCell>Quality Score</TableCell>
                <TableCell>Price Competitiveness</TableCell>
                <TableCell>Total Orders</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {supplierPerformance.map((supplier) => (
                <TableRow key={supplier.supplierId}>
                  <TableCell>{supplier.supplierName}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        {(supplier.recommendationScore * 100).toFixed(0)}%
                      </Typography>
                      <Box
                        sx={{
                          width: 50,
                          height: 8,
                          bgcolor: 'grey.300',
                          borderRadius: 1,
                          overflow: 'hidden'
                        }}
                      >
                        <Box
                          sx={{
                            width: `${supplier.recommendationScore * 100}%`,
                            height: '100%',
                            bgcolor: supplier.recommendationScore > 0.8 ? 'success.main' : 
                                   supplier.recommendationScore > 0.6 ? 'warning.main' : 'error.main'
                          }}
                        />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{supplier.averageLeadTime.toFixed(1)} days</TableCell>
                  <TableCell>{formatPercentage(supplier.onTimeDeliveryRate)}</TableCell>
                  <TableCell>{formatPercentage(supplier.qualityScore)}</TableCell>
                  <TableCell>{formatPercentage(supplier.priceCompetitiveness)}</TableCell>
                  <TableCell>{supplier.totalOrders}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  // Demand Forecasting Tab
  const DemandForecastingTab = () => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Demand Forecasting</Typography>
          <Button
            variant="contained"
            startIcon={<TimelineIcon />}
            onClick={() => setForecastDialogOpen(true)}
          >
            Generate Forecast
          </Button>
        </Box>
        
        {demandForecasts.length > 0 && (
          <Box sx={{ height: 400, mt: 2 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demandForecasts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="productId" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="predictedDemand" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Inventory Forecasting Dashboard
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {loading && (
        <Box display="flex" justifyContent="center" my={2}>
          <CircularProgress />
        </Box>
      )}
      
      <OverviewCards />
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Reorder Recommendations" />
          <Tab label="Supplier Performance" />
          <Tab label="Demand Forecasting" />
        </Tabs>
      </Box>
      
      {activeTab === 0 && <ReorderRecommendationsTab />}
      {activeTab === 1 && <SupplierPerformanceTab />}
      {activeTab === 2 && <DemandForecastingTab />}
      
      {/* Demand Forecast Dialog */}
      <Dialog open={forecastDialogOpen} onClose={() => setForecastDialogOpen(false)}>
        <DialogTitle>Generate Demand Forecast</DialogTitle>
        <DialogContent>
          <TextField
            label="Product ID"
            type="number"
            value={selectedProductId || ''}
            onChange={(e) => setSelectedProductId(parseInt(e.target.value))}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Forecast Days"
            type="number"
            value={forecastDays}
            onChange={(e) => setForecastDays(parseInt(e.target.value))}
            fullWidth
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setForecastDialogOpen(false)}>Cancel</Button>
          <Button onClick={generateDemandForecast} variant="contained">
            Generate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InventoryForecastingDashboard;
