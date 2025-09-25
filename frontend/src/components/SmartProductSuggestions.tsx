import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Divider,
  CircularProgress,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Lightbulb as LightbulbIcon,
  TrendingUp as TrendingUpIcon,
  Inventory as InventoryIcon,
  Add as AddIcon,
  ShoppingCart as CartIcon,
  Analytics as AnalyticsIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Star as StarIcon,
  LocalOffer as OfferIcon
} from '@mui/icons-material';
import { comprehensiveAPI } from '../services/business/comprehensiveApi';

interface ProductSuggestion {
  id: number;
  name: string;
  sku: string;
  current_stock: number;
  suggested_order_quantity: number;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  expected_profit: number;
  supplier_name?: string;
  avg_sale_rate: number;
  days_until_stockout: number;
  seasonal_factor: number;
  price: number;
  cost: number;
  category_name?: string;
  image_url?: string;
}

interface SmartProductSuggestionsProps {
  onProductSelected?: (product: ProductSuggestion) => void;
  maxSuggestions?: number;
  showFilters?: boolean;
  compact?: boolean;
}

const SmartProductSuggestions: React.FC<SmartProductSuggestionsProps> = ({
  onProductSelected,
  maxSuggestions = 10,
  showFilters = true,
  compact = false
}) => {
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductSuggestion | null>(null);

  useEffect(() => {
    loadSuggestions();
  }, [selectedCategory, priorityFilter]);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (priorityFilter) params.append('priority', priorityFilter);
      params.append('limit', maxSuggestions.toString());

      const response = await comprehensiveAPI.inventory.getSmartSuggestions({
        category: selectedCategory,
        priority: priorityFilter,
        limit: maxSuggestions
      });
      const suggestionsData = response.data || [];
      setSuggestions(Array.isArray(suggestionsData) ? suggestionsData : []);
    } catch (error) {
      console.error('Error loading smart suggestions:', error);
      // NO MOCK DATA - Clear suggestions on API failure
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const handleProductSelect = (product: ProductSuggestion) => {
    if (onProductSelected) {
      onProductSelected(product);
    } else {
      setSelectedProduct(product);
      setDetailsOpen(true);
    }
  };

  if (compact) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <LightbulbIcon sx={{ mr: 1, color: 'warning.main' }} />
            <Typography variant="h6">Smart Suggestions</Typography>
            <Badge badgeContent={suggestions.length} color="primary" sx={{ ml: 1 }}>
              <AnalyticsIcon />
            </Badge>
          </Box>
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <List dense>
              {suggestions.slice(0, 3).map((suggestion) => (
                <ListItem
                  key={suggestion.id}
                  button
                  onClick={() => handleProductSelect(suggestion)}
                >
                  <ListItemText
                    primary={suggestion.name}
                    secondary={`Stock: ${suggestion.current_stock} | Suggest: ${suggestion.suggested_order_quantity}`}
                  />
                  <ListItemSecondaryAction>
                    <Chip 
                      label={suggestion.priority} 
                      color={getPriorityColor(suggestion.priority)}
                      size="small"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
          <LightbulbIcon sx={{ mr: 1, color: 'warning.main' }} />
          Smart Product Suggestions
          <Badge badgeContent={suggestions.length} color="primary" sx={{ ml: 1 }}>
            <AnalyticsIcon />
          </Badge>
        </Typography>
        <Box>
          <Tooltip title="Refresh Suggestions">
            <IconButton onClick={loadSuggestions} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {showFilters && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FilterIcon />
              <TextField
                select
                label="Category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                size="small"
                sx={{ minWidth: 150 }}
                SelectProps={{ native: true }}
              >
                <option value="">All Categories</option>
                <option value="beverages">Beverages</option>
                <option value="electronics">Electronics</option>
                <option value="clothing">Clothing</option>
                <option value="food">Food</option>
              </TextField>
              <TextField
                select
                label="Priority"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                size="small"
                sx={{ minWidth: 120 }}
                SelectProps={{ native: true }}
              >
                <option value="">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </TextField>
            </Box>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Analyzing inventory data...
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {suggestions.map((suggestion) => (
            <Grid item xs={12} md={6} lg={4} key={suggestion.id} component="div">
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  '&:hover': { elevation: 8 }
                }}
                onClick={() => handleProductSelect(suggestion)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" noWrap>
                        {suggestion.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        SKU: {suggestion.sku}
                      </Typography>
                      {suggestion.category_name && (
                        <Typography variant="caption" color="text.secondary">
                          {suggestion.category_name}
                        </Typography>
                      )}
                    </Box>
                    <Chip 
                      label={suggestion.priority.toUpperCase()} 
                      color={getPriorityColor(suggestion.priority)}
                      size="small"
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Grid container spacing={1}>
                      <Grid item xs={6} component="div">
                        <Typography variant="body2" color="text.secondary">
                          Current Stock
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <InventoryIcon fontSize="small" />
                          <Typography variant="body1" sx={{ ml: 0.5, fontWeight: 'bold' }}>
                            {suggestion.current_stock}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} component="div">
                        <Typography variant="body2" color="text.secondary">
                          Suggested Order
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CartIcon fontSize="small" />
                          <Typography variant="body1" sx={{ ml: 0.5, fontWeight: 'bold' }}>
                            {suggestion.suggested_order_quantity}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Reason
                    </Typography>
                    <Typography variant="body2">
                      {suggestion.reason}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Expected Profit
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TrendingUpIcon color="success" fontSize="small" />
                        <Typography variant="body1" color="success.main" fontWeight="bold" sx={{ ml: 0.5 }}>
                          ${suggestion.expected_profit}
                        </Typography>
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Days to Stockout
                      </Typography>
                      <Typography 
                        variant="body1" 
                        color={suggestion.days_until_stockout <= 3 ? 'error.main' : 'text.primary'}
                        fontWeight="bold"
                      >
                        {suggestion.days_until_stockout}
                      </Typography>
                    </Box>
                  </Box>

                  {suggestion.supplier_name && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Supplier: {suggestion.supplier_name}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedProduct && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LightbulbIcon sx={{ mr: 1, color: 'warning.main' }} />
              Smart Suggestion Details: {selectedProduct.name}
            </Box>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedProduct && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6} component="div">
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Current Inventory Status
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Current Stock
                        </Typography>
                        <Typography variant="h4" color="primary.main">
                          {selectedProduct.current_stock}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Average Daily Sales
                        </Typography>
                        <Typography variant="body1">
                          {selectedProduct.avg_sale_rate} units/day
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Days Until Stockout
                        </Typography>
                        <Typography 
                          variant="h5" 
                          color={selectedProduct.days_until_stockout <= 3 ? 'error.main' : 'warning.main'}
                        >
                          {selectedProduct.days_until_stockout} days
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6} component="div">
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Recommendation Details
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Suggested Order Quantity
                        </Typography>
                        <Typography variant="h4" color="success.main">
                          {selectedProduct.suggested_order_quantity}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Expected Profit
                        </Typography>
                        <Typography variant="h5" color="success.main">
                          ${selectedProduct.expected_profit}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Priority Level
                        </Typography>
                        <Chip 
                          label={selectedProduct.priority.toUpperCase()} 
                          color={getPriorityColor(selectedProduct.priority)}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} component="div">
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Analysis & Reasoning
                      </Typography>
                      <Typography variant="body1" paragraph>
                        {selectedProduct.reason}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Chip
                          icon={<StarIcon />}
                          label={`Seasonal Factor: ${selectedProduct.seasonal_factor}x`}
                          variant="outlined"
                        />
                        <Chip
                          icon={<OfferIcon />}
                          label={`Unit Price: $${selectedProduct.price}`}
                          variant="outlined"
                        />
                        <Chip
                          icon={<AnalyticsIcon />}
                          label={`Unit Cost: $${selectedProduct.cost}`}
                          variant="outlined"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => {
              if (selectedProduct && onProductSelected) {
                onProductSelected(selectedProduct);
                setDetailsOpen(false);
              }
            }}
          >
            Add to Order
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SmartProductSuggestions;
