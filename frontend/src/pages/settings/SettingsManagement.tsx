import React, { useState, useCallback, lazy, Suspense } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Avatar,
  CircularProgress,
  Backdrop,
  Tooltip,
  Tabs,
  Tab
} from '@mui/material';
import {
  Search,
  Save,
  Refresh,
  Settings,
  Business,
  Security,
  Notifications,
  Palette,
  Language,
  Storage,
  Backup,
  CheckCircle,
  Warning,
  Email,
  Phone,
  LocationOn,
  Web,
  Timer,
  AutoAwesome,
  Brightness4,
  Brightness7
} from '@mui/icons-material';

// Settings Section Component
interface SettingsSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  color?: string;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  description,
  icon,
  children,
  color = 'primary'
}) => (
  <Card sx={{
    borderRadius: 3,
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    mb: 3,
    transition: 'all 0.3s ease',
    '&:hover': {
      boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
    }
  }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Avatar sx={{
          width: 50,
          height: 50,
          bgcolor: `${color}.main`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          {icon}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Box>
      </Box>
      {children}
    </CardContent>
  </Card>
);

// Main Settings Management Component
const SettingsManagement: React.FC = () => {
  // State Management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState({
    // General Settings
    storeName: 'Smart POS Store',
    storeAddress: '123 Đường ABC, Quận 1, TP.HCM',
    storePhone: '0123456789',
    storeEmail: 'info@smartpos.com',
    storeWebsite: 'https://smartpos.com',
    currency: 'VND',
    timezone: 'Asia/Ho_Chi_Minh',
    language: 'vi',
    
    // Security Settings
    passwordMinLength: 8,
    requireTwoFactor: false,
    sessionTimeout: 30,
    loginAttempts: 5,
    passwordExpiry: 90,
    
    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    orderNotifications: true,
    inventoryNotifications: true,
    customerNotifications: true,
    
    // Appearance Settings
    theme: 'light',
    primaryColor: '#667eea',
    secondaryColor: '#764ba2',
    fontSize: 'medium',
    compactMode: false,
    
    // System Settings
    autoBackup: true,
    backupFrequency: 'daily',
    dataRetention: 365,
    logLevel: 'info',
    maintenanceMode: false,
    
    // Integration Settings
    paymentGateway: 'vnpay',
    shippingProvider: 'ghn',
    emailProvider: 'smtp',
    smsProvider: 'twilio'
  });

  // Handlers
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  const handleSave = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      console.log('Settings saved:', settings);
    }, 2000);
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          Không thể tải cài đặt hệ thống. Vui lòng kiểm tra kết nối mạng.
        </Alert>
        <Button onClick={handleRefresh} startIcon={<Refresh />}>
          Thử lại
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Enhanced Header */}
      <Card sx={{
        mb: 4,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: 3,
        overflow: 'hidden',
        position: 'relative'
      }}>
        <Box sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%'
        }} />
        <Box sx={{
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 150,
          height: 150,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '50%'
        }} />
        <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
            <Avatar sx={{
              width: 80,
              height: 80,
              bgcolor: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <Settings sx={{ fontSize: 40 }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                Cài đặt hệ thống
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                Quản lý và cấu hình toàn bộ hệ thống Smart POS
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip
                  label="Cài đặt chung"
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 600,
                    backdropFilter: 'blur(10px)'
                  }}
                />
                <Chip
                  label="Bảo mật"
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 600,
                    backdropFilter: 'blur(10px)'
                  }}
                />
                <Chip
                  label="Tùy chỉnh"
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 600,
                    backdropFilter: 'blur(10px)'
                  }}
                />
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<Backup />}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                },
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1
              }}
            >
              Sao lưu cài đặt
            </Button>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.9)',
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'white',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                },
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1
              }}
            >
              Lưu tất cả
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Enhanced Toolbar */}
      <Card sx={{ 
        mb: 3, 
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)'
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
            {/* Search Field */}
            <TextField
              placeholder="Tìm kiếm cài đặt..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'primary.main' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                minWidth: 300,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'white',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                  }
                }
              }}
            />

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, ml: 'auto' }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleRefresh}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.dark',
                    backgroundColor: 'rgba(102, 126, 234, 0.05)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
                  }
                }}
              >
                Làm mới
              </Button>
              <Button
                variant="outlined"
                startIcon={<Restore />}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  borderColor: 'warning.main',
                  color: 'warning.main',
                  '&:hover': {
                    borderColor: 'warning.dark',
                    backgroundColor: 'rgba(255, 152, 0, 0.05)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(255, 152, 0, 0.2)'
                  }
                }}
              >
                Khôi phục mặc định
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              minHeight: 60
            }
          }}
        >
          <Tab
            icon={<Business />}
            iconPosition="start"
            label="Cài đặt chung"
          />
          <Tab
            icon={<Security />}
            iconPosition="start"
            label="Bảo mật"
          />
          <Tab
            icon={<Notifications />}
            iconPosition="start"
            label="Thông báo"
          />
          <Tab
            icon={<Palette />}
            iconPosition="start"
            label="Giao diện"
          />
          <Tab
            icon={<Storage />}
            iconPosition="start"
            label="Hệ thống"
          />
        </Tabs>
      </Card>

      {/* Tab Content */}
      {selectedTab === 0 && (
        <Box>
          {/* General Settings */}
          <SettingsSection
            title="Thông tin cửa hàng"
            description="Cấu hình thông tin cơ bản của cửa hàng"
            icon={<Business />}
            color="primary"
          >
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tên cửa hàng"
                  value={settings.storeName}
                  onChange={(e) => handleSettingChange('storeName', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Business sx={{ color: 'primary.main' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: 'rgba(255,255,255,0.8)',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'white',
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                      }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Số điện thoại"
                  value={settings.storePhone}
                  onChange={(e) => handleSettingChange('storePhone', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone sx={{ color: 'success.main' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: 'rgba(255,255,255,0.8)',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'white',
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                      }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Địa chỉ cửa hàng"
                  value={settings.storeAddress}
                  onChange={(e) => handleSettingChange('storeAddress', e.target.value)}
                  multiline
                  rows={2}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn sx={{ color: 'warning.main' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: 'rgba(255,255,255,0.8)',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'white',
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                      }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={settings.storeEmail}
                  onChange={(e) => handleSettingChange('storeEmail', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: 'info.main' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: 'rgba(255,255,255,0.8)',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'white',
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                      }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Website"
                  value={settings.storeWebsite}
                  onChange={(e) => handleSettingChange('storeWebsite', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Web sx={{ color: 'secondary.main' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: 'rgba(255,255,255,0.8)',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'white',
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                      }
                    }
                  }}
                />
              </Grid>
            </Grid>
          </SettingsSection>

          <SettingsSection
            title="Cài đặt hệ thống"
            description="Cấu hình ngôn ngữ, tiền tệ và múi giờ"
            icon={<Language />}
            color="info"
          >
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Tiền tệ</InputLabel>
                  <Select
                    value={settings.currency}
                    onChange={(e) => handleSettingChange('currency', e.target.value)}
                    label="Tiền tệ"
                    sx={{
                      borderRadius: 2,
                      backgroundColor: 'rgba(255,255,255,0.8)',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'white',
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                      }
                    }}
                  >
                    <MenuItem value="VND">VND - Việt Nam Đồng</MenuItem>
                    <MenuItem value="USD">USD - US Dollar</MenuItem>
                    <MenuItem value="EUR">EUR - Euro</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Múi giờ</InputLabel>
                  <Select
                    value={settings.timezone}
                    onChange={(e) => handleSettingChange('timezone', e.target.value)}
                    label="Múi giờ"
                    sx={{
                      borderRadius: 2,
                      backgroundColor: 'rgba(255,255,255,0.8)',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'white',
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                      }
                    }}
                  >
                    <MenuItem value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh</MenuItem>
                    <MenuItem value="UTC">UTC</MenuItem>
                    <MenuItem value="America/New_York">America/New_York</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Ngôn ngữ</InputLabel>
                  <Select
                    value={settings.language}
                    onChange={(e) => handleSettingChange('language', e.target.value)}
                    label="Ngôn ngữ"
                    sx={{
                      borderRadius: 2,
                      backgroundColor: 'rgba(255,255,255,0.8)',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'white',
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                      }
                    }}
                  >
                    <MenuItem value="vi">Tiếng Việt</MenuItem>
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="zh">中文</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </SettingsSection>
        </Box>
      )}

      {selectedTab === 1 && (
        <Box>
          {/* Security Settings */}
          <SettingsSection
            title="Bảo mật đăng nhập"
            description="Cấu hình các quy tắc bảo mật cho hệ thống"
            icon={<Lock />}
            color="error"
          >
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Độ dài mật khẩu tối thiểu"
                  type="number"
                  value={settings.passwordMinLength}
                  onChange={(e) => handleSettingChange('passwordMinLength', parseInt(e.target.value))}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: 'error.main' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: 'rgba(255,255,255,0.8)',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'white',
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                      }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Thời gian hết hạn phiên (phút)"
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Timer sx={{ color: 'warning.main' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: 'rgba(255,255,255,0.8)',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'white',
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                      }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.requireTwoFactor}
                        onChange={(e) => handleSettingChange('requireTwoFactor', e.target.checked)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: 'error.main',
                            '& + .MuiSwitch-track': {
                              backgroundColor: 'error.main',
                            },
                          },
                        }}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Security sx={{ color: 'error.main' }} />
                        <Typography variant="body1" fontWeight="600">
                          Yêu cầu xác thực 2 yếu tố
                        </Typography>
                      </Box>
                    }
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: settings.requireTwoFactor ? 'rgba(244, 67, 54, 0.05)' : 'rgba(0,0,0,0.05)',
                      border: `1px solid ${settings.requireTwoFactor ? 'rgba(244, 67, 54, 0.2)' : 'rgba(0,0,0,0.1)'}`,
                      width: '100%',
                      m: 0
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          </SettingsSection>
        </Box>
      )}

      {selectedTab === 2 && (
        <Box>
          {/* Notification Settings */}
          <SettingsSection
            title="Cài đặt thông báo"
            description="Quản lý các loại thông báo hệ thống"
            icon={<Notifications />}
            color="info"
          >
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.emailNotifications}
                      onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                    />
                  }
                  label="Thông báo qua email"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.smsNotifications}
                      onChange={(e) => handleSettingChange('smsNotifications', e.target.checked)}
                    />
                  }
                  label="Thông báo qua SMS"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.pushNotifications}
                      onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                    />
                  }
                  label="Thông báo đẩy"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.orderNotifications}
                      onChange={(e) => handleSettingChange('orderNotifications', e.target.checked)}
                    />
                  }
                  label="Thông báo đơn hàng"
                />
              </Grid>
            </Grid>
          </SettingsSection>
        </Box>
      )}

      {selectedTab === 3 && (
        <Box>
          {/* Appearance Settings */}
          <SettingsSection
            title="Giao diện hệ thống"
            description="Tùy chỉnh giao diện và màu sắc"
            icon={<Palette />}
            color="secondary"
          >
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Chủ đề</InputLabel>
                  <Select
                    value={settings.theme}
                    onChange={(e) => handleSettingChange('theme', e.target.value)}
                    label="Chủ đề"
                  >
                    <MenuItem value="light">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Brightness7 sx={{ fontSize: 16 }} />
                        <Typography>Sáng</Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="dark">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Brightness4 sx={{ fontSize: 16 }} />
                        <Typography>Tối</Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="auto">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AutoAwesome sx={{ fontSize: 16 }} />
                        <Typography>Tự động</Typography>
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Kích thước chữ</InputLabel>
                  <Select
                    value={settings.fontSize}
                    onChange={(e) => handleSettingChange('fontSize', e.target.value)}
                    label="Kích thước chữ"
                  >
                    <MenuItem value="small">Nhỏ</MenuItem>
                    <MenuItem value="medium">Trung bình</MenuItem>
                    <MenuItem value="large">Lớn</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.compactMode}
                      onChange={(e) => handleSettingChange('compactMode', e.target.checked)}
                    />
                  }
                  label="Chế độ compact"
                />
              </Grid>
            </Grid>
          </SettingsSection>
        </Box>
      )}

      {selectedTab === 4 && (
        <Box>
          {/* System Settings */}
          <SettingsSection
            title="Cài đặt hệ thống"
            description="Quản lý sao lưu và bảo trì hệ thống"
            icon={<Storage />}
            color="warning"
          >
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.autoBackup}
                      onChange={(e) => handleSettingChange('autoBackup', e.target.checked)}
                    />
                  }
                  label="Sao lưu tự động"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Tần suất sao lưu</InputLabel>
                  <Select
                    value={settings.backupFrequency}
                    onChange={(e) => handleSettingChange('backupFrequency', e.target.value)}
                    label="Tần suất sao lưu"
                  >
                    <MenuItem value="daily">Hàng ngày</MenuItem>
                    <MenuItem value="weekly">Hàng tuần</MenuItem>
                    <MenuItem value="monthly">Hàng tháng</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.maintenanceMode}
                      onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                    />
                  }
                  label="Chế độ bảo trì"
                />
              </Grid>
            </Grid>
          </SettingsSection>
        </Box>
      )}

      {/* Loading Backdrop */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isLoading}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress color="inherit" />
          <Typography variant="h6">Đang lưu cài đặt...</Typography>
        </Box>
      </Backdrop>
    </Box>
  );
};

export default SettingsManagement;