import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Button,
  Chip
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
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import api from '../services/api';

interface WarrantyTrend {
  id: string;
  month: string;
  claims_count: number;
  resolution_time: number;
  customer_satisfaction: number;
}

interface ClaimStatus {
  id: string;
  status: string;
  count: number;
  percentage: number;
}

interface TopProduct {
  id: string;
  name: string;
  warranty_claims: number;
  failure_rate: number;
  avg_repair_cost: number;
}

interface RecentActivity {
  id: string;
  customer_name: string;
  product_name: string;
  claim_type: string;
  status: string;
  created_at: string;
}

const WarrantyDashboard: React.FC = () => {
  const [trends, setTrends] = useState<WarrantyTrend[]>([]);
  const [claimStatuses, setClaimStatuses] = useState<ClaimStatus[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch warranty trends from D1 Cloudflare
  const fetchWarrantyTrends = async () => {
    try {
      const response = await api.get('/warranty/trends');
      
      if (response.data.success) {
        setTrends(response.data.data || []);
      } else {
        setError('Lỗi tải dữ liệu trends từ D1 Cloudflare');
      }
    } catch (error: any) {
      console.error('Error fetching warranty trends from D1:', error);
      setError('Lỗi kết nối đến D1 Cloudflare');
    }
  };

  // Fetch claim statuses from D1 Cloudflare
  const fetchClaimStatuses = async () => {
    try {
      const response = await api.get('/warranty/claim-statuses');
      
      if (response.data.success) {
        setClaimStatuses(response.data.data || []);
      }
    } catch (error: any) {
      console.error('Error fetching claim statuses from D1:', error);
    }
  };

  // Fetch top products from D1 Cloudflare
  const fetchTopProducts = async () => {
    try {
      const response = await api.get('/warranty/top-products');
      
      if (response.data.success) {
        setTopProducts(response.data.data || []);
      }
    } catch (error: any) {
      console.error('Error fetching top products from D1:', error);
    }
  };

  // Fetch recent activities from D1 Cloudflare
  const fetchRecentActivities = async () => {
    try {
      const response = await api.get('/warranty/recent-activities');
      
      if (response.data.success) {
        setRecentActivities(response.data.data || []);
      }
    } catch (error: any) {
      console.error('Error fetching recent activities from D1:', error);
    }
  };

  // Load all data from D1 Cloudflare
  const loadWarrantyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await Promise.all([
        fetchWarrantyTrends(),
        fetchClaimStatuses(),
        fetchTopProducts(),
        fetchRecentActivities()
      ]);
    } catch (error) {
      console.error('Error loading warranty data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarrantyData();
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
        <Button onClick={loadWarrantyData} variant="contained">
          Thử lại
        </Button>
      </Box>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return '#ff9800';
      case 'approved': return '#4caf50';
      case 'rejected': return '#f44336';
      case 'in_progress': return '#2196f3';
      case 'completed': return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Warranty Dashboard - Kết nối 100% D1 Cloudflare
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Dữ liệu được lấy trực tiếp từ D1 Cloudflare thông qua backend
      </Alert>

      {/* Warranty Trends */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Xu hướng bảo hành
        </Typography>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={trends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="claims_count" stroke="#8884d8" name="Số lượng claims" />
            <Line type="monotone" dataKey="resolution_time" stroke="#82ca9d" name="Thời gian giải quyết (ngày)" />
            <Line type="monotone" dataKey="customer_satisfaction" stroke="#ffc658" name="Độ hài lòng (%)" />
          </LineChart>
        </ResponsiveContainer>
      </Paper>

      {/* Claim Statuses */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Trạng thái claims
        </Typography>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={claimStatuses}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ status, percentage }) => `${status} ${percentage}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {claimStatuses.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Paper>

      {/* Top Products with Warranty Issues */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Top sản phẩm có vấn đề bảo hành
        </Typography>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={topProducts}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="warranty_claims" fill="#8884d8" name="Số claims" />
            <Bar dataKey="failure_rate" fill="#82ca9d" name="Tỷ lệ lỗi (%)" />
            <Bar dataKey="avg_repair_cost" fill="#ffc658" name="Chi phí sửa chữa TB" />
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {/* Recent Activities */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Hoạt động gần đây
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {recentActivities.map((activity) => (
            <Card key={activity.id} variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="h6">
                    {activity.customer_name}
                  </Typography>
                  <Chip 
                    label={activity.status}
                    size="small"
                    sx={{ bgcolor: getStatusColor(activity.status), color: 'white' }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Sản phẩm: {activity.product_name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Loại claim: {activity.claim_type}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Ngày tạo: {new Date(activity.created_at).toLocaleDateString('vi-VN')}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default WarrantyDashboard;
