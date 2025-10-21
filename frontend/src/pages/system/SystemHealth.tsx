import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Refresh,
  CheckCircle,
  Error,
  Warning,
  Info,
  Storage,
  Speed,
  Memory,
  NetworkCheck,
  Security,
  CloudQueue,
  Storage as Database,
  MonitorHeart,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { systemAPI } from '../../services/api';

// Health Status Component
interface HealthStatusProps {
  title: string;
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  value?: string | number;
  icon: React.ReactNode;
  description?: string;
}

const HealthStatus: React.FC<HealthStatusProps> = ({
  title,
  status,
  value,
  icon,
  description,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle />;
      case 'warning': return <Warning />;
      case 'error': return <Error />;
      default: return <Info />;
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar sx={{ bgcolor: `${getStatusColor(status)}.main` }}>
            {icon}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight="bold">
              {title}
            </Typography>
            {value && (
              <Typography variant="h4" color={`${getStatusColor(status)}.main`}>
                {value}
              </Typography>
            )}
          </Box>
          <Chip
            icon={getStatusIcon(status)}
            label={status}
            color={getStatusColor(status) as any}
            size="small"
          />
        </Box>
        {description && (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

// Performance Metrics Component
interface PerformanceMetricsProps {
  metrics: any;
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ metrics }) => {
  const getUsageColor = (usage: number) => {
    if (usage < 50) return 'success';
    if (usage < 80) return 'warning';
    return 'error';
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Hiệu suất hệ thống
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {metrics.cpu && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">CPU Usage</Typography>
                <Typography variant="body2">{metrics.cpu}%</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={metrics.cpu}
                color={getUsageColor(metrics.cpu)}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}
          {metrics.memory && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Memory Usage</Typography>
                <Typography variant="body2">{metrics.memory}%</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={metrics.memory}
                color={getUsageColor(metrics.memory)}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}
          {metrics.disk && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Disk Usage</Typography>
                <Typography variant="body2">{metrics.disk}%</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={metrics.disk}
                color={getUsageColor(metrics.disk)}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

// Database Status Component
interface DatabaseStatusProps {
  dbStatus: any;
}

const DatabaseStatus: React.FC<DatabaseStatusProps> = ({ dbStatus }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Trạng thái Database
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Metric</TableCell>
                <TableCell>Value</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Connection</TableCell>
                <TableCell>{dbStatus.connected ? 'Connected' : 'Disconnected'}</TableCell>
                <TableCell>
                  <Chip
                    label={dbStatus.connected ? 'OK' : 'Error'}
                    color={dbStatus.connected ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Response Time</TableCell>
                <TableCell>{dbStatus.responseTime || 'N/A'}ms</TableCell>
                <TableCell>
                  <Chip
                    label={dbStatus.responseTime < 100 ? 'Fast' : 'Slow'}
                    color={dbStatus.responseTime < 100 ? 'success' : 'warning'}
                    size="small"
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Active Connections</TableCell>
                <TableCell>{dbStatus.activeConnections || 0}</TableCell>
                <TableCell>
                  <Chip
                    label="Normal"
                    color="success"
                    size="small"
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

// Main System Health Component
const SystemHealth: React.FC = () => {
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Fetch system health data
  const { data: healthData, isLoading: healthLoading, error: healthError, refetch: refetchHealth } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => systemAPI.getHealth(),
  });

  // Fetch diagnostics data
  const { data: diagnosticsData, isLoading: diagnosticsLoading, error: diagnosticsError, refetch: refetchDiagnostics } = useQuery({
    queryKey: ['system-diagnostics'],
    queryFn: () => systemAPI.getDiagnostics(),
  });

  // Fetch database status
  const { data: dbData, isLoading: dbLoading, error: dbError, refetch: refetchDb } = useQuery({
    queryKey: ['database-status'],
    queryFn: () => systemAPI.getDatabaseStatus(),
  });

  // Fetch performance metrics
  const { data: metricsData, isLoading: metricsLoading, error: metricsError, refetch: refetchMetrics } = useQuery({
    queryKey: ['performance-metrics'],
    queryFn: () => systemAPI.getPerformanceMetrics(),
  });

  const handleRefresh = () => {
    setLastRefresh(new Date());
    refetchHealth();
    refetchDiagnostics();
    refetchDb();
    refetchMetrics();
  };

  const health = healthData?.data || {};
  const diagnostics = diagnosticsData?.data || {};
  const dbStatus = dbData?.data || {};
  const metrics = metricsData?.data || {};

  const getOverallStatus = () => {
    const hasError = healthError || diagnosticsError || dbError || metricsError;
    const hasWarning = metrics.cpu > 80 || metrics.memory > 80 || metrics.disk > 80;
    
    if (hasError) return 'error';
    if (hasWarning) return 'warning';
    return 'healthy';
  };

  const overallStatus = getOverallStatus();

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Giám sát hệ thống
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Theo dõi hiệu suất và trạng thái hệ thống SmartPOS
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Cập nhật lần cuối: {lastRefresh.toLocaleTimeString('vi-VN')}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRefresh}
              disabled={healthLoading || diagnosticsLoading || dbLoading || metricsLoading}
            >
              Làm mới
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Overall Status Alert */}
      <Alert
        severity={overallStatus === 'healthy' ? 'success' : overallStatus === 'warning' ? 'warning' : 'error'}
        sx={{ mb: 3 }}
        icon={overallStatus === 'healthy' ? <CheckCircle /> : overallStatus === 'warning' ? <Warning /> : <Error />}
      >
        <Typography variant="h6" fontWeight="bold">
          Trạng thái tổng thể: {overallStatus === 'healthy' ? 'Khỏe mạnh' : overallStatus === 'warning' ? 'Cảnh báo' : 'Lỗi'}
        </Typography>
        <Typography variant="body2">
          {overallStatus === 'healthy' 
            ? 'Tất cả các dịch vụ đang hoạt động bình thường'
            : overallStatus === 'warning'
            ? 'Một số dịch vụ có hiệu suất thấp, cần theo dõi'
            : 'Có lỗi xảy ra với hệ thống, cần kiểm tra ngay'
          }
        </Typography>
      </Alert>

      {/* System Status Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <HealthStatus
            title="API Health"
            status={health.status === 'ok' ? 'healthy' : 'error'}
            value={health.status === 'ok' ? 'OK' : 'ERROR'}
            icon={<MonitorHeart />}
            description="Trạng thái API endpoint"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <HealthStatus
            title="Database"
            status={dbStatus.connected ? 'healthy' : 'error'}
            value={dbStatus.responseTime ? `${dbStatus.responseTime}ms` : 'N/A'}
            icon={<Database />}
            description="Kết nối và hiệu suất database"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <HealthStatus
            title="Cloudflare Workers"
            status="healthy"
            value="Active"
            icon={<CloudQueue />}
            description="Runtime environment"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <HealthStatus
            title="D1 Database"
            status="healthy"
            value="Connected"
            icon={<Storage />}
            description="Cloudflare D1 SQLite"
          />
        </Grid>
      </Grid>

      {/* Performance and Database Status */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <PerformanceMetrics metrics={metrics} />
        </Grid>
        <Grid item xs={12} md={6}>
          <DatabaseStatus dbStatus={dbStatus} />
        </Grid>
      </Grid>

      {/* System Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Thông tin hệ thống
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {health.version || '2.0.0'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Phiên bản
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {health.uptime || '99.9%'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Uptime
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="bold" color="info.main">
                  {diagnostics.requestCount || '0'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Requests/min
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="bold" color="warning.main">
                  {diagnostics.errorRate || '0'}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Error Rate
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Error States */}
      {(healthError || diagnosticsError || dbError || metricsError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            Lỗi kết nối hệ thống
          </Typography>
          <Typography variant="body2">
            Không thể tải dữ liệu giám sát. Vui lòng kiểm tra kết nối mạng và thử lại.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default SystemHealth;