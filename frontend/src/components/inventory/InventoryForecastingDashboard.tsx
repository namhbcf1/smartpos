/**
 * INVENTORY FORECASTING DASHBOARD
 * 
 * Advanced inventory management dashboard with automated reorder points,
 * demand forecasting, and supplier performance analytics.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Button
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import api from '../../services/api';

interface ForecastData {
  date: string;
  predicted_demand: number;
  actual_demand: number;
  stock_level: number;
  reorder_point: number;
}

interface ProductForecast {
  id: string;
  name: string;
  current_stock: number;
  predicted_demand: number;
  days_until_stockout: number;
  recommended_order: number;
  forecast_accuracy: number;
}

const InventoryForecastingDashboard: React.FC = () => {
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [productForecasts, setProductForecasts] = useState<ProductForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch forecast data from D1 Cloudflare
  const fetchForecastData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/inventory-advanced/forecast');
      
      if (response.data.success) {
        setForecastData(response.data.data.forecast_data || []);
        setProductForecasts(response.data.data.product_forecasts || []);
      } else {
        setError('Lỗi tải dữ liệu dự báo từ D1 Cloudflare');
      }
    } catch (error: any) {
      console.error('Error fetching forecast data from D1:', error);
      setError('Lỗi kết nối đến D1 Cloudflare');
    } finally {
      setLoading(false);
    }
  };

  // Fetch product forecasts from D1 Cloudflare
  const fetchProductForecasts = async () => {
    try {
      const response = await api.get('/inventory-advanced/product-forecasts');
      
      if (response.data.success) {
        setProductForecasts(response.data.data || []);
      }
    } catch (error: any) {
      console.error('Error fetching product forecasts from D1:', error);
    }
  };

  useEffect(() => {
    fetchForecastData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={fetchForecastData} variant="contained">
          Thử lại
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dự báo tồn kho - Kết nối 100% D1 Cloudflare
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Dữ liệu được lấy trực tiếp từ D1 Cloudflare thông qua backend
      </Alert>

      {/* Demand Forecast Chart */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Dự báo nhu cầu
        </Typography>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={forecastData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="predicted_demand" stroke="#8884d8" name="Dự báo" />
            <Line type="monotone" dataKey="actual_demand" stroke="#82ca9d" name="Thực tế" />
          </LineChart>
        </ResponsiveContainer>
      </Paper>

      {/* Stock Level Chart */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Mức tồn kho và điểm đặt hàng
        </Typography>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={forecastData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="stock_level" stroke="#ff7300" name="Tồn kho" />
            <Line type="monotone" dataKey="reorder_point" stroke="#ff0000" name="Điểm đặt hàng" />
          </LineChart>
        </ResponsiveContainer>
      </Paper>

      {/* Product Forecasts */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Dự báo sản phẩm
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, flexWrap: 'wrap' }}>
          {productForecasts.map((product) => (
            <Box key={product.id} sx={{ flex: { xs: '1 1 100%', sm: '1 1 50%', md: '1 1 33%' }, minWidth: 0 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" noWrap>
                    {product.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tồn kho hiện tại: {product.current_stock}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Dự báo nhu cầu: {product.predicted_demand}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ngày hết hàng: {product.days_until_stockout}
                  </Typography>
                  <Typography variant="body2" color="primary">
                    Đặt hàng: {product.recommended_order}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default InventoryForecastingDashboard;
