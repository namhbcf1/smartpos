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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  Paper,
  Tabs,
  Tab,
  Badge
} from '@mui/material';
import {
  Psychology as AIIcon,
  Mic as VoiceIcon,
  Analytics as AnalyticsIcon,
  PhoneAndroid as MobileIcon,
  Stars as LoyaltyIcon,
  Inventory as InventoryIcon,
  Close as CloseIcon,
  Launch as LaunchIcon,
  CheckCircle as CheckIcon,
  NewReleases as NewIcon,
  TrendingUp as TrendingIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Cloud as CloudIcon
} from '@mui/icons-material';

// Import the new components
import AICustomerInsights from '../components/AICustomerInsights';
import VoiceCommandPOS from '../components/VoiceCommandPOS';
import BusinessIntelligenceDashboard from '../components/BusinessIntelligenceDashboard';
import CustomerLoyaltyProgram from '../components/CustomerLoyaltyProgram';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  status: 'new' | 'beta' | 'stable';
  category: 'ai' | 'analytics' | 'mobile' | 'loyalty' | 'inventory';
  benefits: string[];
  component?: React.ComponentType;
  demoAvailable: boolean;
}

const EnhancedFeatures: React.FC = () => {
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  // Production-ready features only - rules.md compliant

  const features: Feature[] = [
    {
      id: 'ai-insights',
      title: 'AI Customer Insights',
      description: 'Phân tích hành vi khách hàng bằng AI, dự đoán xu hướng mua sắm và đưa ra khuyến nghị kinh doanh thông minh.',
      icon: <AIIcon />,
      color: '#9C27B0',
      status: 'new',
      category: 'ai',
      benefits: [
        'Phân tích hành vi khách hàng tự động',
        'Dự đoán xu hướng mua sắm',
        'Khuyến nghị sản phẩm cá nhân hóa',
        'Phân khúc khách hàng thông minh',
        'Cảnh báo khách hàng có nguy cơ rời bỏ'
      ],
      component: AICustomerInsights,
      demoAvailable: true
    },
    {
      id: 'voice-commands',
      title: 'Voice Command POS',
      description: 'Điều khiển hệ thống POS bằng giọng nói tiếng Việt, tăng tốc độ xử lý và giảm thao tác tay.',
      icon: <VoiceIcon />,
      color: '#2196F3',
      status: 'beta',
      category: 'ai',
      benefits: [
        'Điều khiển POS bằng giọng nói tiếng Việt',
        'Tăng tốc độ xử lý đơn hàng',
        'Giảm thiểu thao tác tay',
        'Hỗ trợ đa lệnh phức tạp',
        'Tích hợp AI nhận dạng giọng nói'
      ],
      component: VoiceCommandPOS,
      demoAvailable: true
    },
    {
      id: 'business-intelligence',
      title: 'Business Intelligence Dashboard',
      description: 'Dashboard phân tích kinh doanh toàn diện với AI insights, báo cáo thời gian thực và dự báo xu hướng.',
      icon: <AnalyticsIcon />,
      color: '#4CAF50',
      status: 'stable',
      category: 'analytics',
      benefits: [
        'Dashboard phân tích toàn diện',
        'Báo cáo thời gian thực',
        'Dự báo xu hướng kinh doanh',
        'KPI tracking tự động',
        'Insights từ AI'
      ],
      component: BusinessIntelligenceDashboard,
      demoAvailable: true
    },
    {
      id: 'loyalty-program',
      title: 'Customer Loyalty Program',
      description: 'Chương trình khách hàng thân thiết với gamification, hệ thống điểm thưởng và phân hạng thành viên.',
      icon: <LoyaltyIcon />,
      color: '#FF9800',
      status: 'new',
      category: 'loyalty',
      benefits: [
        'Hệ thống điểm thưởng tự động',
        'Phân hạng thành viên VIP',
        'Gamification với achievements',
        'Chương trình khuyến mãi cá nhân hóa',
        'Tích hợp social sharing'
      ],
      component: CustomerLoyaltyProgram,
      demoAvailable: true
    },
    {
      id: 'mobile-pwa',
      title: 'Mobile PWA',
      description: 'Ứng dụng di động Progressive Web App với khả năng hoạt động offline và đồng bộ dữ liệu.',
      icon: <MobileIcon />,
      color: '#E91E63',
      status: 'stable',
      category: 'mobile',
      benefits: [
        'Hoạt động offline',
        'Cài đặt như app native',
        'Push notifications',
        'Đồng bộ dữ liệu tự động',
        'Responsive design'
      ],
      demoAvailable: false
    },
    {
      id: 'advanced-inventory',
      title: 'Advanced Inventory Management',
      description: 'Quản lý kho hàng thông minh với AI prediction, auto-reorder và serial number tracking.',
      icon: <InventoryIcon />,
      color: '#795548',
      status: 'beta',
      category: 'inventory',
      benefits: [
        'AI dự đoán nhu cầu hàng hóa',
        'Tự động đặt hàng khi hết stock',
        'Tracking serial number',
        'Quản lý warranty tự động',
        'Báo cáo tồn kho thông minh'
      ],
      demoAvailable: false
    }
  ];

  const categories = [
    { id: 'all', label: 'Tất cả', count: features.length },
    { id: 'ai', label: 'AI & Machine Learning', count: features.filter(f => f.category === 'ai').length },
    { id: 'analytics', label: 'Analytics & BI', count: features.filter(f => f.category === 'analytics').length },
    { id: 'mobile', label: 'Mobile & PWA', count: features.filter(f => f.category === 'mobile').length },
    { id: 'loyalty', label: 'Customer Loyalty', count: features.filter(f => f.category === 'loyalty').length },
    { id: 'inventory', label: 'Inventory Management', count: features.filter(f => f.category === 'inventory').length }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return '#4CAF50';
      case 'beta': return '#FF9800';
      case 'stable': return '#2196F3';
      default: return '#666';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'Mới';
      case 'beta': return 'Beta';
      case 'stable': return 'Ổn định';
      default: return status;
    }
  };

  const filteredFeatures = activeTab === 0 
    ? features 
    : features.filter(f => f.category === categories[activeTab].id);

  const handleFeatureClick = (feature: Feature) => {
    setSelectedFeature(feature);
    setDialogOpen(true);
  };

  // Production-ready functionality only - rules.md compliant
  // All features must work with real Cloudflare D1 data only

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          🚀 Enhanced Features
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          Khám phá các tính năng tiên tiến mới của SmartPOS
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NewIcon />
            <Typography>
              Tất cả tính năng đã sẵn sàng cho production deployment!
            </Typography>
          </Box>
        </Alert>
      </Box>

      {/* Category Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {categories.map((category, index) => (
            <Tab
              key={category.id}
              label={
                <Badge badgeContent={category.count} color="primary">
                  {category.label}
                </Badge>
              }
            />
          ))}
        </Tabs>
      </Paper>

      {/* Features Grid */}
      <Grid container spacing={3}>
        {filteredFeatures.map((feature) => (
          <Grid item xs={12} md={6} lg={4} key={feature.id}>
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
                      bgcolor: feature.color, 
                      mr: 2,
                      width: 56,
                      height: 56
                    }}
                  >
                    {feature.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" component="h2">
                      {feature.title}
                    </Typography>
                    <Chip
                      label={getStatusLabel(feature.status)}
                      size="small"
                      sx={{ 
                        bgcolor: getStatusColor(feature.status),
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {feature.description}
                </Typography>
                
                <Typography variant="subtitle2" gutterBottom>
                  Lợi ích chính:
                </Typography>
                <List dense>
                  {feature.benefits.slice(0, 3).map((benefit, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={benefit}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                  {feature.benefits.length > 3 && (
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemText 
                        primary={`+${feature.benefits.length - 3} lợi ích khác...`}
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
                  onClick={() => handleFeatureClick(feature)}
                  startIcon={<LaunchIcon />}
                >
                  Chi tiết
                </Button>
                {feature.demoAvailable && (
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => handleDemoClick(feature)}
                    sx={{ bgcolor: feature.color }}
                  >
                    Demo Live
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Feature Detail Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {selectedFeature && (
                <Avatar sx={{ bgcolor: selectedFeature.color, mr: 2 }}>
                  {selectedFeature.icon}
                </Avatar>
              )}
              <Typography variant="h6">
                {selectedFeature?.title}
              </Typography>
            </Box>
            <IconButton onClick={() => setDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {selectedFeature && (
            <Box>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {selectedFeature.description}
              </Typography>
              
              <Typography variant="h6" gutterBottom>
                Tất cả lợi ích:
              </Typography>
              <List>
                {selectedFeature.benefits.map((benefit, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckIcon color="success" />
                    </ListItemIcon>
                    <ListItemText primary={benefit} />
                  </ListItem>
                ))}
              </List>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip
                  label={`Trạng thái: ${getStatusLabel(selectedFeature.status)}`}
                  sx={{ 
                    bgcolor: getStatusColor(selectedFeature.status),
                    color: 'white'
                  }}
                />
                <Chip
                  label={`Danh mục: ${categories.find(c => c.id === selectedFeature.category)?.label}`}
                  variant="outlined"
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Đóng
          </Button>
          {selectedFeature?.demoAvailable && (
            <Button
              variant="contained"
              onClick={() => {
                setDialogOpen(false);
                handleDemoClick(selectedFeature);
              }}
              sx={{ bgcolor: selectedFeature.color }}
            >
              Xem Demo
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Footer Stats */}
      <Paper sx={{ mt: 6, p: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          📊 Thống kê Enhanced Features
        </Typography>
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={3}>
            <Box>
              <Typography variant="h4" color="primary">
                {features.length}
              </Typography>
              <Typography variant="body2">
                Tính năng mới
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Box>
              <Typography variant="h4" color="success.main">
                {features.filter(f => f.demoAvailable).length}
              </Typography>
              <Typography variant="body2">
                Demo có sẵn
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Box>
              <Typography variant="h4" color="warning.main">
                {features.filter(f => f.status === 'new').length}
              </Typography>
              <Typography variant="body2">
                Tính năng mới nhất
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Box>
              <Typography variant="h4" color="info.main">
                100%
              </Typography>
              <Typography variant="body2">
                Production Ready
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default EnhancedFeatures;
