import React, { useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip,
  Avatar,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Assessment as ReportsIcon,
  MonetizationOn as RevenueIcon,
  AccountBalance as FinanceIcon,
  Psychology as AIIcon,
  TrendingUp as TrendingIcon,
  Insights as InsightsIcon,
  Launch as LaunchIcon,
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  NewReleases as NewIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface SmartReport {
  id: string;
  title: string;
  description: string;
  route: string;
  icon: React.ReactNode;
  color: string;
  status: 'ready' | 'beta' | 'new';
  features: string[];
  aiEnabled: boolean;
}

const SmartReportsDemo: React.FC = () => {
  const navigate = useNavigate();
  const [selectedReport, setSelectedReport] = useState<SmartReport | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const smartReports: SmartReport[] = [
    {
      id: 'revenue-report',
      title: 'Báo cáo Doanh thu Thông minh',
      description: 'Phân tích doanh thu với AI insights, dự báo xu hướng và khuyến nghị kinh doanh',
      route: '/reports/revenue',
      icon: <RevenueIcon />,
      color: '#4CAF50',
      status: 'ready',
      features: [
        'AI phân tích xu hướng doanh thu',
        'Dự báo tăng trưởng thông minh',
        'Khuyến nghị tối ưu hóa',
        'Phân tích theo ngày trong tuần',
        'Benchmarking với ngành',
        'Real-time data visualization'
      ],
      aiEnabled: true
    },
    {
      id: 'financial-analysis',
      title: 'Phân tích Tài chính AI',
      description: 'Báo cáo tài chính toàn diện với AI insights và phân tích rủi ro',
      route: '/finance',
      icon: <FinanceIcon />,
      color: '#2196F3',
      status: 'ready',
      features: [
        'Phân tích tỷ suất lợi nhuận',
        'AI đánh giá rủi ro tài chính',
        'Dự báo cash flow',
        'So sánh với kỳ trước',
        'Chỉ số tài chính chi tiết',
        'Khuyến nghị cải thiện'
      ],
      aiEnabled: true
    },
    {
      id: 'reports-overview',
      title: 'Tổng quan Báo cáo',
      description: 'Dashboard tổng hợp tất cả báo cáo với AI-powered insights',
      route: '/reports',
      icon: <ReportsIcon />,
      color: '#FF9800',
      status: 'beta',
      features: [
        'Dashboard tổng hợp',
        'Báo cáo đa dạng',
        'Filters thông minh',
        'Export multiple formats',
        'Scheduled reports',
        'Custom report builder'
      ],
      aiEnabled: true
    }
  ];

  const handleReportClick = (report: SmartReport) => {
    setSelectedReport(report);
    setDialogOpen(true);
  };

  const handleNavigateToReport = (route: string) => {
    setDialogOpen(false);
    navigate(route);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return '#4CAF50';
      case 'beta': return '#FF9800';
      case 'new': return '#2196F3';
      default: return '#666';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ready': return 'Sẵn sàng';
      case 'beta': return 'Beta';
      case 'new': return 'Mới';
      default: return status;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          📊 Smart Reports System
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          Hệ thống báo cáo thông minh với AI-powered insights
        </Typography>
        
        <Alert severity="success" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckIcon />
            <Typography>
              Tất cả báo cáo đã được nâng cấp với AI và sẵn sàng sử dụng!
            </Typography>
          </Box>
        </Alert>
      </Box>

      {/* Smart Reports Grid */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        {smartReports.map((report) => (
          <Grid item xs={12} md={6} lg={4} key={report.id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: report.color, 
                      mr: 2,
                      width: 56,
                      height: 56
                    }}
                  >
                    {report.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" component="h2">
                      {report.title}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Chip
                        label={getStatusLabel(report.status)}
                        size="small"
                        sx={{ 
                          bgcolor: getStatusColor(report.status),
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                      {report.aiEnabled && (
                        <Chip
                          icon={<AIIcon />}
                          label="AI"
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {report.description}
                </Typography>
                
                <Typography variant="subtitle2" gutterBottom>
                  Tính năng nổi bật:
                </Typography>
                <List dense>
                  {report.features.slice(0, 3).map((feature, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={feature}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                  {report.features.length > 3 && (
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemText 
                        primary={`+${report.features.length - 3} tính năng khác...`}
                        primaryTypographyProps={{ 
                          variant: 'body2',
                          color: 'text.secondary',
                          fontStyle: 'italic'
                        }}
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
              
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  size="small"
                  onClick={() => handleReportClick(report)}
                  startIcon={<LaunchIcon />}
                >
                  Chi tiết
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => handleNavigateToReport(report.route)}
                  sx={{ bgcolor: report.color }}
                >
                  Mở báo cáo
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Features Overview */}
      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          🚀 Tính năng nâng cao
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: '#4CAF50', mx: 'auto', mb: 2 }}>
                <AIIcon />
              </Avatar>
              <Typography variant="h6">AI-Powered</Typography>
              <Typography variant="body2" color="text.secondary">
                Machine learning insights và dự báo thông minh
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: '#2196F3', mx: 'auto', mb: 2 }}>
                <SpeedIcon />
              </Avatar>
              <Typography variant="h6">Real-time</Typography>
              <Typography variant="body2" color="text.secondary">
                Dữ liệu cập nhật theo thời gian thực
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: '#FF9800', mx: 'auto', mb: 2 }}>
                <AnalyticsIcon />
              </Avatar>
              <Typography variant="h6">Advanced Analytics</Typography>
              <Typography variant="body2" color="text.secondary">
                Phân tích sâu với visualizations đẹp mắt
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: '#9C27B0', mx: 'auto', mb: 2 }}>
                <SecurityIcon />
              </Avatar>
              <Typography variant="h6">Enterprise Ready</Typography>
              <Typography variant="body2" color="text.secondary">
                Bảo mật cao và hiệu suất tối ưu
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Report Detail Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {selectedReport && (
                <Avatar sx={{ bgcolor: selectedReport.color, mr: 2 }}>
                  {selectedReport.icon}
                </Avatar>
              )}
              <Typography variant="h6">
                {selectedReport?.title}
              </Typography>
            </Box>
            <IconButton onClick={() => setDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {selectedReport && (
            <Box>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {selectedReport.description}
              </Typography>
              
              <Typography variant="h6" gutterBottom>
                Tất cả tính năng:
              </Typography>
              <List>
                {selectedReport.features.map((feature, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckIcon color="success" />
                    </ListItemIcon>
                    <ListItemText primary={feature} />
                  </ListItem>
                ))}
              </List>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip
                  label={`Trạng thái: ${getStatusLabel(selectedReport.status)}`}
                  sx={{ 
                    bgcolor: getStatusColor(selectedReport.status),
                    color: 'white'
                  }}
                />
                {selectedReport.aiEnabled && (
                  <Chip
                    icon={<AIIcon />}
                    label="AI-Enabled"
                    color="primary"
                  />
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Đóng
          </Button>
          {selectedReport && (
            <Button
              variant="contained"
              onClick={() => handleNavigateToReport(selectedReport.route)}
              sx={{ bgcolor: selectedReport.color }}
            >
              Mở báo cáo
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Footer Stats */}
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          📈 Thống kê Smart Reports
        </Typography>
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={3}>
            <Box>
              <Typography variant="h4" color="primary">
                {smartReports.length}
              </Typography>
              <Typography variant="body2">
                Smart Reports
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Box>
              <Typography variant="h4" color="success.main">
                {smartReports.filter(r => r.aiEnabled).length}
              </Typography>
              <Typography variant="body2">
                AI-Enabled
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Box>
              <Typography variant="h4" color="warning.main">
                {smartReports.filter(r => r.status === 'ready').length}
              </Typography>
              <Typography variant="body2">
                Production Ready
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Box>
              <Typography variant="h4" color="info.main">
                100%
              </Typography>
              <Typography variant="body2">
                Vietnamese Localized
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default SmartReportsDemo;
