import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Chip,
  LinearProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  Divider,
  Alert,
  Tabs,
  Tab,
  Badge,
  IconButton,
  Tooltip,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  Stars as StarsIcon,
  EmojiEvents as TrophyIcon,
  LocalOffer as OfferIcon,
  CardGiftcard as GiftIcon,
  Timeline as TimelineIcon,
  Person as PersonIcon,
  ShoppingCart as ShoppingIcon,
  MonetizationOn as MoneyIcon,
  Favorite as HeartIcon,
  Share as ShareIcon,
  CheckCircle as CheckIcon,
  Lock as LockIcon,
  Celebration as CelebrationIcon,
  Diamond as DiamondIcon,
  WorkspacePremium as CrownIcon,
  Whatshot as FireIcon,
  Speed as SpeedIcon,
  Close as CloseIcon
} from '@mui/icons-material';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  points: number;
  totalSpent: number;
  joinDate: string;
  lastPurchase: string;
  avatar?: string;
}

interface LoyaltyTier {
  name: string;
  minSpent: number;
  pointsMultiplier: number;
  benefits: string[];
  color: string;
  icon: React.ReactNode;
  nextTier?: string;
  requiredForNext?: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  points: number;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  category: 'purchase' | 'loyalty' | 'social' | 'special';
}

interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  type: 'discount' | 'freebie' | 'upgrade' | 'exclusive';
  value: string;
  available: boolean;
  expiryDate?: string;
}

const CustomerLoyaltyProgram: React.FC = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rewardDialogOpen, setRewardDialogOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);

  // Mock data
  const loyaltyTiers: LoyaltyTier[] = [
    {
      name: 'Bronze',
      minSpent: 0,
      pointsMultiplier: 1,
      benefits: ['Tích điểm cơ bản', 'Thông báo khuyến mãi'],
      color: '#CD7F32',
      icon: <PersonIcon />
    },
    {
      name: 'Silver',
      minSpent: 10000000,
      pointsMultiplier: 1.2,
      benefits: ['Tích điểm x1.2', 'Ưu đãi sinh nhật', 'Hỗ trợ ưu tiên'],
      color: '#C0C0C0',
      icon: <StarsIcon />,
      nextTier: 'Gold',
      requiredForNext: 25000000
    },
    {
      name: 'Gold',
      minSpent: 25000000,
      pointsMultiplier: 1.5,
      benefits: ['Tích điểm x1.5', 'Miễn phí vận chuyển', 'Tư vấn chuyên sâu'],
      color: '#FFD700',
      icon: <TrophyIcon />,
      nextTier: 'Platinum',
      requiredForNext: 50000000
    },
    {
      name: 'Platinum',
      minSpent: 50000000,
      pointsMultiplier: 2,
      benefits: ['Tích điểm x2', 'Ưu đãi độc quyền', 'Sự kiện VIP'],
      color: '#E5E4E2',
      icon: <CrownIcon />,
      nextTier: 'Diamond',
      requiredForNext: 100000000
    },
    {
      name: 'Diamond',
      minSpent: 100000000,
      pointsMultiplier: 3,
      benefits: ['Tích điểm x3', 'Concierge service', 'Early access'],
      color: '#B9F2FF',
      icon: <DiamondIcon />
    }
  ];

  const mockCustomer: Customer = {
    id: 1,
    name: 'Nguyễn Văn A',
    email: 'nguyenvana@email.com',
    phone: '0901234567',
    tier: 'Gold',
    points: 15420,
    totalSpent: 35000000,
    joinDate: '2023-01-15',
    lastPurchase: '2024-01-10'
  };

  const achievements: Achievement[] = [
    {
      id: 'first_purchase',
      title: 'Lần đầu mua hàng',
      description: 'Hoàn thành đơn hàng đầu tiên',
      icon: <ShoppingIcon />,
      points: 100,
      unlocked: true,
      progress: 1,
      maxProgress: 1,
      category: 'purchase'
    },
    {
      id: 'big_spender',
      title: 'Khách hàng VIP',
      description: 'Chi tiêu trên 50 triệu VND',
      icon: <MoneyIcon />,
      points: 1000,
      unlocked: false,
      progress: 35000000,
      maxProgress: 50000000,
      category: 'purchase'
    },
    {
      id: 'loyal_customer',
      title: 'Khách hàng thân thiết',
      description: 'Mua hàng liên tục trong 6 tháng',
      icon: <HeartIcon />,
      points: 500,
      unlocked: true,
      progress: 6,
      maxProgress: 6,
      category: 'loyalty'
    },
    {
      id: 'social_butterfly',
      title: 'Người chia sẻ',
      description: 'Giới thiệu 5 khách hàng mới',
      icon: <ShareIcon />,
      points: 750,
      unlocked: false,
      progress: 2,
      maxProgress: 5,
      category: 'social'
    },
    {
      id: 'speed_buyer',
      title: 'Mua sắm nhanh',
      description: 'Hoàn thành 10 đơn hàng trong 1 tháng',
      icon: <SpeedIcon />,
      points: 300,
      unlocked: false,
      progress: 7,
      maxProgress: 10,
      category: 'special'
    }
  ];

  const rewards: Reward[] = [
    {
      id: 'discount_10',
      title: 'Giảm giá 10%',
      description: 'Giảm 10% cho đơn hàng tiếp theo',
      pointsCost: 1000,
      type: 'discount',
      value: '10%',
      available: true
    },
    {
      id: 'free_shipping',
      title: 'Miễn phí vận chuyển',
      description: 'Miễn phí ship cho 3 đơn hàng tiếp theo',
      pointsCost: 500,
      type: 'freebie',
      value: 'Free shipping x3',
      available: true
    },
    {
      id: 'premium_support',
      title: 'Hỗ trợ Premium',
      description: 'Hỗ trợ kỹ thuật ưu tiên trong 1 tháng',
      pointsCost: 2000,
      type: 'upgrade',
      value: '30 days',
      available: true
    },
    {
      id: 'exclusive_product',
      title: 'Sản phẩm độc quyền',
      description: 'Quyền mua sản phẩm limited edition',
      pointsCost: 5000,
      type: 'exclusive',
      value: 'Limited access',
      available: false,
      expiryDate: '2024-02-29'
    }
  ];

  useEffect(() => {
    setSelectedCustomer(mockCustomer);
  }, []);

  const getCurrentTier = (customer: Customer) => {
    return loyaltyTiers.find(tier => tier.name === customer.tier);
  };

  const getNextTier = (customer: Customer) => {
    const currentTier = getCurrentTier(customer);
    return loyaltyTiers.find(tier => tier.name === currentTier?.nextTier);
  };

  const getProgressToNextTier = (customer: Customer) => {
    const currentTier = getCurrentTier(customer);
    const nextTier = getNextTier(customer);
    
    if (!nextTier || !currentTier?.requiredForNext) return 100;
    
    return Math.min((customer.totalSpent / currentTier.requiredForNext) * 100, 100);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'purchase': return <ShoppingIcon />;
      case 'loyalty': return <HeartIcon />;
      case 'social': return <ShareIcon />;
      case 'special': return <FireIcon />;
      default: return <CheckIcon />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'purchase': return '#4CAF50';
      case 'loyalty': return '#E91E63';
      case 'social': return '#2196F3';
      case 'special': return '#FF9800';
      default: return '#666';
    }
  };

  const getRewardTypeIcon = (type: string) => {
    switch (type) {
      case 'discount': return <OfferIcon />;
      case 'freebie': return <GiftIcon />;
      case 'upgrade': return <TrophyIcon />;
      case 'exclusive': return <DiamondIcon />;
      default: return <GiftIcon />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const handleRedeemReward = (reward: Reward) => {
    setSelectedReward(reward);
    setRewardDialogOpen(true);
  };

  const confirmRedeemReward = () => {
    if (selectedReward && selectedCustomer) {
      // Implement reward redemption logic
      console.log('Redeeming reward:', selectedReward.id);
      setRewardDialogOpen(false);
      setSelectedReward(null);
    }
  };

  if (!selectedCustomer) {
    return <Typography>Loading...</Typography>;
  }

  const currentTier = getCurrentTier(selectedCustomer);
  const nextTier = getNextTier(selectedCustomer);
  const progressToNext = getProgressToNextTier(selectedCustomer);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <StarsIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Chương trình khách hàng thân thiết
        </Typography>
      </Box>

      {/* Customer Profile Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar
                sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: currentTier?.color,
                  fontSize: '2rem'
                }}
              >
                {currentTier?.icon}
              </Avatar>
            </Grid>
            
            <Grid item xs>
              <Typography variant="h5" gutterBottom>
                {selectedCustomer.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Chip
                  label={selectedCustomer.tier}
                  sx={{ 
                    bgcolor: currentTier?.color,
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
                <Typography variant="body1">
                  {selectedCustomer.points.toLocaleString()} điểm
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tổng chi tiêu: {formatCurrency(selectedCustomer.totalSpent)}
                </Typography>
              </Box>
              
              {nextTier && (
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Tiến độ lên {nextTier.name}: {progressToNext.toFixed(1)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={progressToNext}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Cần thêm {formatCurrency((currentTier?.requiredForNext || 0) - selectedCustomer.totalSpent)}
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Thành tích" icon={<TrophyIcon />} />
          <Tab label="Phần thưởng" icon={<GiftIcon />} />
          <Tab label="Hạng thành viên" icon={<CrownIcon />} />
          <Tab label="Lịch sử" icon={<TimelineIcon />} />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {achievements.map((achievement) => (
            <Grid item xs={12} md={6} key={achievement.id}>
              <Card sx={{ 
                opacity: achievement.unlocked ? 1 : 0.7,
                border: achievement.unlocked ? `2px solid ${getCategoryColor(achievement.category)}` : 'none'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ 
                      bgcolor: getCategoryColor(achievement.category),
                      mr: 2
                    }}>
                      {achievement.unlocked ? achievement.icon : <LockIcon />}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6">
                        {achievement.title}
                        {achievement.unlocked && <CheckIcon sx={{ ml: 1, color: 'success.main' }} />}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {achievement.description}
                      </Typography>
                    </Box>
                    <Chip
                      label={`+${achievement.points} điểm`}
                      size="small"
                      color={achievement.unlocked ? 'success' : 'default'}
                    />
                  </Box>
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" gutterBottom>
                      Tiến độ: {achievement.progress}/{achievement.maxProgress}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(achievement.progress / achievement.maxProgress) * 100}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          {rewards.map((reward) => (
            <Grid item xs={12} md={6} lg={4} key={reward.id}>
              <Card sx={{ 
                opacity: reward.available ? 1 : 0.6,
                position: 'relative'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      {getRewardTypeIcon(reward.type)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6">
                        {reward.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {reward.description}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Chip
                      label={`${reward.pointsCost} điểm`}
                      color="primary"
                      variant="outlined"
                    />
                    <Typography variant="h6" color="primary">
                      {reward.value}
                    </Typography>
                  </Box>
                  
                  <Button
                    fullWidth
                    variant={reward.available ? 'contained' : 'outlined'}
                    disabled={!reward.available || selectedCustomer.points < reward.pointsCost}
                    onClick={() => handleRedeemReward(reward)}
                  >
                    {selectedCustomer.points < reward.pointsCost ? 'Không đủ điểm' : 'Đổi thưởng'}
                  </Button>
                  
                  {reward.expiryDate && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Hết hạn: {new Date(reward.expiryDate).toLocaleDateString('vi-VN')}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Các hạng thành viên
                </Typography>
                <Stepper orientation="vertical">
                  {loyaltyTiers.map((tier, index) => (
                    <Step key={tier.name} active={tier.name === selectedCustomer.tier}>
                      <StepLabel
                        StepIconComponent={() => (
                          <Avatar sx={{ bgcolor: tier.color, width: 40, height: 40 }}>
                            {tier.icon}
                          </Avatar>
                        )}
                      >
                        <Typography variant="h6" sx={{ color: tier.color }}>
                          {tier.name}
                        </Typography>
                      </StepLabel>
                      <StepContent>
                        <Typography variant="body2" gutterBottom>
                          Yêu cầu: {formatCurrency(tier.minSpent)}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          Hệ số điểm: x{tier.pointsMultiplier}
                        </Typography>
                        <Typography variant="subtitle2" gutterBottom>
                          Quyền lợi:
                        </Typography>
                        <List dense>
                          {tier.benefits.map((benefit, idx) => (
                            <ListItem key={idx}>
                              <ListItemIcon>
                                <CheckIcon color="success" />
                              </ListItemIcon>
                              <ListItemText primary={benefit} />
                            </ListItem>
                          ))}
                        </List>
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 3 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Lịch sử giao dịch và điểm thưởng
            </Typography>
            <Alert severity="info">
              Tính năng lịch sử chi tiết sẽ được cập nhật trong phiên bản tiếp theo.
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Reward Redemption Dialog */}
      <Dialog open={rewardDialogOpen} onClose={() => setRewardDialogOpen(false)}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Xác nhận đổi thưởng</Typography>
            <IconButton onClick={() => setRewardDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedReward && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Bạn có chắc muốn đổi <strong>{selectedReward.title}</strong> với <strong>{selectedReward.pointsCost} điểm</strong>?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Điểm hiện tại: {selectedCustomer.points.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Điểm sau khi đổi: {(selectedCustomer.points - selectedReward.pointsCost).toLocaleString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRewardDialogOpen(false)}>
            Hủy
          </Button>
          <Button onClick={confirmRedeemReward} variant="contained">
            Xác nhận đổi thưởng
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerLoyaltyProgram;
