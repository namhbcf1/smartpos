import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Button,
  Divider,
  Alert,
} from '@mui/material';
import {
  Receipt,
  Warning,
  TrendingUp,
  ShoppingCart,
  Inventory,
  ArrowForward,
} from '@mui/icons-material';
import { formatCurrency, formatDate } from '../../config/constants';

interface RecentSale {
  id: number;
  receipt_number: string;
  final_amount: number;
  payment_method: string;
  customer_name?: string;
  created_at: string;
  items_count: number;
}

interface LowStockProduct {
  id: number;
  name: string;
  stock: number;
  min_stock: number;
  category_name?: string;
}

interface RecentActivityProps {
  recentSales: RecentSale[];
  lowStockProducts: LowStockProduct[];
  aiInsights: string[];
  loading: boolean;
  onViewAllSales: () => void;
  onViewInventory: () => void;
}

const RecentActivity: React.FC<RecentActivityProps> = ({
  recentSales,
  lowStockProducts,
  aiInsights,
  loading,
  onViewAllSales,
  onViewInventory,
}) => {
  if (loading) {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Giao dịch gần đây (Đang tải...)
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Sản phẩm sắp hết hàng (Đang tải...)
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Recent Sales */}
      <Grid item xs={12} md={6}>
        <Card elevation={2} sx={{ height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Receipt color="primary" />
                Giao dịch gần đây
              </Typography>
              <Button 
                size="small" 
                endIcon={<ArrowForward />}
                onClick={onViewAllSales}
              >
                Xem tất cả
              </Button>
            </Box>
            
            {recentSales.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <ShoppingCart sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography color="text.secondary">
                  Chưa có giao dịch nào
                </Typography>
              </Box>
            ) : (
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {recentSales.slice(0, 5).map((sale, index) => (
                  <React.Fragment key={sale.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <Receipt />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2">
                              #{sale.receipt_number}
                            </Typography>
                            <Typography variant="h6" color="primary">
                              {formatCurrency(sale.final_amount)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {sale.customer_name || 'Khách lẻ'} • {sale.items_count} sản phẩm
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                              <Chip 
                                label={sale.payment_method} 
                                size="small" 
                                variant="outlined"
                              />
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(sale.created_at)}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < recentSales.slice(0, 5).length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Low Stock Products */}
      <Grid item xs={12} md={6}>
        <Card elevation={2} sx={{ height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Warning color="warning" />
                Sản phẩm sắp hết
              </Typography>
              <Button 
                size="small" 
                endIcon={<ArrowForward />}
                onClick={onViewInventory}
              >
                Xem kho
              </Button>
            </Box>
            
            {lowStockProducts.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Inventory sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                <Typography color="success.main">
                  Tất cả sản phẩm đều đủ hàng
                </Typography>
              </Box>
            ) : (
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {lowStockProducts.slice(0, 5).map((product, index) => (
                  <React.Fragment key={product.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'warning.main' }}>
                          <Warning />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle2" noWrap>
                            {product.name}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {product.category_name}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                              <Chip 
                                label={`Còn ${product.stock}`}
                                size="small" 
                                color="warning"
                                variant="outlined"
                              />
                              <Typography variant="caption" color="text.secondary">
                                Tối thiểu: {product.min_stock}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < lowStockProducts.slice(0, 5).length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* AI Insights */}
      {aiInsights.length > 0 && (
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TrendingUp color="info" />
                🤖 Thông tin thông minh
              </Typography>
              {aiInsights.map((insight, index) => (
                <Alert 
                  key={index} 
                  severity="info" 
                  sx={{ mb: 1 }}
                  variant="outlined"
                >
                  {insight}
                </Alert>
              ))}
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );
};

export default React.memo(RecentActivity);
