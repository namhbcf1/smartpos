import React from 'react';
import {
  Box,
  Button,
  Typography,
  Stack,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Grid,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  FileDownload as ExportIcon,
  FileUpload as ImportIcon,
  Refresh as RefreshIcon,
  Inventory as ProductIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as ActiveIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { formatCurrency } from '../../../config/constants';
import { ProductStats } from './types';
import { usePermissions } from '../../../hooks/usePermissions';

interface ProductsHeaderProps {
  stats: ProductStats | null;
  onNewProduct: () => void;
  onImport: () => void;
  onExport: () => void;
  onRefresh: () => void;
  onAnalytics: () => void;
  loading: boolean;
}

export const ProductsHeader: React.FC<ProductsHeaderProps> = ({
  stats,
  onNewProduct,
  onImport,
  onExport,
  onRefresh,
  onAnalytics,
  loading
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { canCreateProducts, canEditProducts, isProductsReadOnly } = usePermissions();

  const statsCards = [
    {
      title: 'Tổng sản phẩm',
      value: stats?.total_products || 0,
      subtitle: `${stats?.active_products || 0} đang hoạt động`,
      icon: <ProductIcon />,
      color: 'primary'
    },
    {
      title: 'Giá trị kho',
      value: formatCurrency(stats?.total_value || 0),
      subtitle: `TB: ${formatCurrency(stats?.average_price || 0)}`,
      icon: <TrendingUpIcon />,
      color: 'success'
    },
    {
      title: 'Cảnh báo tồn kho',
      value: (stats?.low_stock_products || 0) + (stats?.out_of_stock_products || 0),
      subtitle: `${stats?.out_of_stock_products || 0} hết hàng`,
      icon: <WarningIcon />,
      color: 'warning'
    }
  ];

  return (
    <Box sx={{ mb: 3 }}>
      {/* Header with actions */}
      <Stack
        direction={isMobile ? 'column' : 'row'}
        justifyContent="space-between"
        alignItems={isMobile ? 'stretch' : 'center'}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            <ProductIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Quản lý sản phẩm
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Quản lý danh mục sản phẩm, giá cả và tồn kho
          </Typography>
        </Box>

        <Stack direction={isMobile ? 'column' : 'row'} spacing={1}>
          <Button
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
            variant="outlined"
            disabled={loading}
            size={isMobile ? 'small' : 'medium'}
          >
            Làm mới
          </Button>

          {!isProductsReadOnly && (
            <Button
              startIcon={<AnalyticsIcon />}
              onClick={onAnalytics}
              variant="outlined"
              disabled={loading}
              size={isMobile ? 'small' : 'medium'}
            >
              Phân tích
            </Button>
          )}

          {canEditProducts && (
            <Button
              startIcon={<ImportIcon />}
              onClick={onImport}
              variant="outlined"
              disabled={loading}
              size={isMobile ? 'small' : 'medium'}
            >
              Nhập Excel
            </Button>
          )}

          <Button
            startIcon={<ExportIcon />}
            onClick={onExport}
            variant="outlined"
            disabled={loading}
            size={isMobile ? 'small' : 'medium'}
          >
            Xuất báo cáo
          </Button>

          {canCreateProducts && (
            <Button
              startIcon={<AddIcon />}
              onClick={onNewProduct}
              variant="contained"
              disabled={loading}
              size={isMobile ? 'small' : 'medium'}
            >
              Thêm sản phẩm
            </Button>
          )}
        </Stack>
      </Stack>

      {/* Stats Cards */}
      <Grid container spacing={2}>
        {statsCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card 
              sx={{ 
                background: `linear-gradient(135deg, ${theme.palette[card.color as keyof typeof theme.palette].light}, ${theme.palette[card.color as keyof typeof theme.palette].main})`,
                color: 'white',
                height: '100%'
              }}
            >
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {card.icon}
                  </Box>
                  
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {card.title}
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {card.value}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {card.subtitle}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Stats */}
      {stats && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
          <Stack direction="row" spacing={4} flexWrap="wrap">
            <Box>
              <Typography variant="body2" color="text.secondary">
                Sản phẩm nổi bật
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {stats.featured_products} sản phẩm
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary">
                Danh mục hàng đầu
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {stats.top_categories[0]?.category_name || 'N/A'}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary">
                Thương hiệu hàng đầu
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {stats.top_brands[0]?.brand || 'N/A'}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary">
                Sản phẩm bán chạy
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {stats.best_sellers[0]?.product_name || 'N/A'}
              </Typography>
            </Box>
          </Stack>
        </Box>
      )}

      {/* Alerts */}
      {stats && (stats.low_stock_products > 0 || stats.out_of_stock_products > 0) && (
        <Box sx={{ mt: 2 }}>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {stats.out_of_stock_products > 0 && (
              <Chip
                icon={<WarningIcon />}
                label={`${stats.out_of_stock_products} sản phẩm hết hàng`}
                color="error"
                variant="outlined"
              />
            )}
            {stats.low_stock_products > 0 && (
              <Chip
                icon={<WarningIcon />}
                label={`${stats.low_stock_products} sản phẩm sắp hết`}
                color="warning"
                variant="outlined"
              />
            )}
          </Stack>
        </Box>
      )}
    </Box>
  );
};
