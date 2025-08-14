/**
 * SYSTEM MONITORING DASHBOARD
 * 
 * Real-time system health monitoring, performance metrics,
 * circuit breaker status, and alerting dashboard.
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
  LinearProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  NetworkCheck as NetworkIcon,
  Timeline as TimelineIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import api from '../services/api';

// Interfaces
interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  timestamp: number;
  details?: any;
  error?: string;
}

interface SystemMetrics {
  api: {
    requestCount: number;
    errorCount: number;
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
  };
  database: {
    queryCount: number;
    slowQueryCount: number;
    averageQueryTime: number;
    connectionCount: number;
  };
  cache: {
    hitRate: number;
    missRate: number;
    evictionRate: number;
    memoryUsage: number;
  };
  business: {
    salesCount: number;
    revenue: number;
    activeUsers: number;
    inventoryValue: number;
  };
}

interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime: number;
  halfOpenCalls: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  totalSize: number;
  hitRate: number;
  memoryEntries: number;
}

const SystemMonitoringDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Data states
  const [healthChecks, setHealthChecks] = useState<Record<string, HealthCheck>>({});
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [circuitBreakers, setCircuitBreakers] = useState<Record<string, CircuitBreakerState>>({});
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);

  // Dialog states
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

  useEffect(() => {
    loadSystemData();
    
    // Auto-refresh every 30 seconds
    const interval = autoRefresh ? setInterval(loadSystemData, 30000) : null;
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadSystemData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [healthRes, metricsRes, circuitRes, cacheRes] = await Promise.all([
        api.get('/api/v1/system/health/detailed'),
        api.get('/api/v1/system/metrics'),
        api.get('/api/v1/system/circuit-breakers'),
        api.get('/api/v1/system/cache/stats')
      ]);

      setHealthChecks(healthRes.data.data.health_checks || {});
      setSystemMetrics(healthRes.data.data.system_metrics || null);
      setCircuitBreakers(circuitRes.data.data || {});
      setCacheStats(cacheRes.data.data || null);
    } catch (err) {
      setError('Failed to load system monitoring data');
      console.error('System monitoring error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetCircuitBreaker = async (name: string) => {
    try {
      await api.post(`/api/v1/system/circuit-breakers/${name}/reset`);
      await loadSystemData(); // Refresh data
    } catch (err) {
      setError(`Failed to reset circuit breaker: ${name}`);
    }
  };

  const clearCache = async () => {
    try {
      await api.delete('/api/v1/system/cache');
      await loadSystemData(); // Refresh data
    } catch (err) {
      setError('Failed to clear cache');
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'degraded': return 'warning';
      case 'unhealthy': return 'error';
      default: return 'default';
    }
  };

  const getCircuitBreakerColor = (state: string) => {
    switch (state) {
      case 'CLOSED': return 'success';
      case 'HALF_OPEN': return 'warning';
      case 'OPEN': return 'error';
      default: return 'default';
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // System Overview Cards
  const SystemOverviewCards = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <SpeedIcon color="primary" sx={{ mr: 2 }} />
              <Box>
                <Typography variant="h6">
                  {systemMetrics?.api.averageResponseTime.toFixed(0) || 0}ms
                </Typography>
                <Typography variant="body2" color="textSecondary">Avg Response Time</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <NetworkIcon color="success" sx={{ mr: 2 }} />
              <Box>
                <Typography variant="h6">
                  {formatNumber(systemMetrics?.api.requestCount || 0)}
                </Typography>
                <Typography variant="body2" color="textSecondary">Total Requests</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <MemoryIcon color="info" sx={{ mr: 2 }} />
              <Box>
                <Typography variant="h6">
                  {cacheStats?.hitRate.toFixed(1) || 0}%
                </Typography>
                <Typography variant="body2" color="textSecondary">Cache Hit Rate</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <StorageIcon color="warning" sx={{ mr: 2 }} />
              <Box>
                <Typography variant="h6">
                  {systemMetrics?.database.averageQueryTime.toFixed(0) || 0}ms
                </Typography>
                <Typography variant="body2" color="textSecondary">Avg Query Time</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Health Checks Component
  const HealthChecksComponent = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>System Health Checks</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Service</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Response Time</TableCell>
                <TableCell>Last Check</TableCell>
                <TableCell>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(healthChecks).map(([name, check]) => (
                <TableRow key={name}>
                  <TableCell>{name}</TableCell>
                  <TableCell>
                    <Chip
                      label={check.status.toUpperCase()}
                      color={getHealthStatusColor(check.status) as any}
                      size="small"
                      icon={
                        check.status === 'healthy' ? <CheckCircleIcon /> :
                        check.status === 'degraded' ? <WarningIcon /> : <ErrorIcon />
                      }
                    />
                  </TableCell>
                  <TableCell>{check.responseTime}ms</TableCell>
                  <TableCell>{new Date(check.timestamp).toLocaleTimeString()}</TableCell>
                  <TableCell>
                    {check.error ? (
                      <Tooltip title={check.error}>
                        <ErrorIcon color="error" />
                      </Tooltip>
                    ) : (
                      <CheckCircleIcon color="success" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  // Circuit Breakers Component
  const CircuitBreakersComponent = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Circuit Breakers</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Operation</TableCell>
                <TableCell>State</TableCell>
                <TableCell>Failure Count</TableCell>
                <TableCell>Last Failure</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(circuitBreakers).map(([name, breaker]) => (
                <TableRow key={name}>
                  <TableCell>{name}</TableCell>
                  <TableCell>
                    <Chip
                      label={breaker.state}
                      color={getCircuitBreakerColor(breaker.state) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{breaker.failureCount}</TableCell>
                  <TableCell>
                    {breaker.lastFailureTime ? 
                      new Date(breaker.lastFailureTime).toLocaleString() : 
                      'Never'
                    }
                  </TableCell>
                  <TableCell>
                    {breaker.state === 'OPEN' && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => resetCircuitBreaker(name)}
                      >
                        Reset
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">System Monitoring Dashboard</Typography>
        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
            }
            label="Auto Refresh"
            sx={{ mr: 2 }}
          />
          <IconButton onClick={() => setSettingsDialogOpen(true)} sx={{ mr: 1 }}>
            <SettingsIcon />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={loadSystemData}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

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

      <SystemOverviewCards />
      <HealthChecksComponent />
      <CircuitBreakersComponent />

      {/* Cache Management */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Cache Management</Typography>
            <Button
              variant="outlined"
              color="warning"
              onClick={clearCache}
            >
              Clear Cache
            </Button>
          </Box>
          
          {cacheStats && (
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="textSecondary">Hit Rate</Typography>
                <Typography variant="h6">{cacheStats.hitRate.toFixed(1)}%</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="textSecondary">Total Hits</Typography>
                <Typography variant="h6">{formatNumber(cacheStats.hits)}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="textSecondary">Total Misses</Typography>
                <Typography variant="h6">{formatNumber(cacheStats.misses)}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="textSecondary">Memory Entries</Typography>
                <Typography variant="h6">{formatNumber(cacheStats.memoryEntries)}</Typography>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default SystemMonitoringDashboard;
