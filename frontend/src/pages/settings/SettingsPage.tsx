import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Grid,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Save,
  Refresh,
  Security,
  Store,
  Notifications,
  Palette,
  Language,
  Backup,
  Restore,
  Delete,
  Add,
  Edit,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';

// Settings Tabs
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [showPassword, setShowPassword] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    storeName: 'Smart POS Store',
    storeAddress: '123 Main Street, City, Country',
    storePhone: '+84 123 456 789',
    storeEmail: 'info@smartpos.com',
    currency: 'VND',
    timezone: 'Asia/Ho_Chi_Minh',
    language: 'vi',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
    loginAttempts: 5,
    autoLogout: true,
    requirePasswordChange: false,
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    lowStockAlert: true,
    newOrderAlert: true,
    paymentAlert: true,
    systemAlert: true,
  });

  // Theme Settings
  const [themeSettings, setThemeSettings] = useState({
    primaryColor: '#1976d2',
    secondaryColor: '#dc004e',
    mode: 'light' as 'light' | 'dark',
    fontSize: 'medium' as 'small' | 'medium' | 'large',
    compactMode: false,
  });

  // Password Change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSave = (section: string) => {
    setSnackbar({
      open: true,
      message: `Đã lưu cài đặt ${section}`,
      severity: 'success'
    });
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSnackbar({
        open: true,
        message: 'Mật khẩu xác nhận không khớp',
        severity: 'error'
      });
      return;
    }
    
    setSnackbar({
      open: true,
      message: 'Đã thay đổi mật khẩu thành công',
      severity: 'success'
    });
    setChangePasswordOpen(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleBackup = () => {
    setSnackbar({
      open: true,
      message: 'Đang tạo bản sao lưu...',
      severity: 'success'
    });
  };

  const handleRestore = () => {
    setSnackbar({
      open: true,
      message: 'Đang khôi phục dữ liệu...',
      severity: 'success'
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Cài đặt hệ thống
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Quản lý cài đặt và cấu hình hệ thống
      </Typography>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Tổng quan" />
            <Tab label="Bảo mật" />
            <Tab label="Thông báo" />
            <Tab label="Giao diện" />
            <Tab label="Sao lưu" />
          </Tabs>
        </Box>

        {/* General Settings Tab */}
        <TabPanel value={activeTab} index={0}>
          <Typography variant="h6" gutterBottom>
            Thông tin cửa hàng
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tên cửa hàng"
                value={generalSettings.storeName}
                onChange={(e) => setGeneralSettings(prev => ({ ...prev, storeName: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Số điện thoại"
                value={generalSettings.storePhone}
                onChange={(e) => setGeneralSettings(prev => ({ ...prev, storePhone: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Địa chỉ"
                value={generalSettings.storeAddress}
                onChange={(e) => setGeneralSettings(prev => ({ ...prev, storeAddress: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={generalSettings.storeEmail}
                onChange={(e) => setGeneralSettings(prev => ({ ...prev, storeEmail: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tiền tệ</InputLabel>
                <Select
                  value={generalSettings.currency}
                  onChange={(e) => setGeneralSettings(prev => ({ ...prev, currency: e.target.value }))}
                >
                  <MenuItem value="VND">VND - Việt Nam Đồng</MenuItem>
                  <MenuItem value="USD">USD - US Dollar</MenuItem>
                  <MenuItem value="EUR">EUR - Euro</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Múi giờ</InputLabel>
                <Select
                  value={generalSettings.timezone}
                  onChange={(e) => setGeneralSettings(prev => ({ ...prev, timezone: e.target.value }))}
                >
                  <MenuItem value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh</MenuItem>
                  <MenuItem value="UTC">UTC</MenuItem>
                  <MenuItem value="America/New_York">America/New_York</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Ngôn ngữ</InputLabel>
                <Select
                  value={generalSettings.language}
                  onChange={(e) => setGeneralSettings(prev => ({ ...prev, language: e.target.value }))}
                >
                  <MenuItem value="vi">Tiếng Việt</MenuItem>
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="zh">中文</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={() => handleSave('tổng quan')}
            >
              Lưu cài đặt
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => window.location.reload()}
            >
              Làm mới
            </Button>
          </Box>
        </TabPanel>

        {/* Security Settings Tab */}
        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" gutterBottom>
            Bảo mật tài khoản
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Mật khẩu
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={showPassword ? <VisibilityOff /> : <Visibility />}
                    onClick={() => setChangePasswordOpen(true)}
                  >
                    Thay đổi mật khẩu
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={securitySettings.twoFactorAuth}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, twoFactorAuth: e.target.checked }))}
                  />
                }
                label="Xác thực 2 yếu tố"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={securitySettings.autoLogout}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, autoLogout: e.target.checked }))}
                  />
                }
                label="Tự động đăng xuất"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Thời gian hết phiên (phút)"
                type="number"
                value={securitySettings.sessionTimeout}
                onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Hết hạn mật khẩu (ngày)"
                type="number"
                value={securitySettings.passwordExpiry}
                onChange={(e) => setSecuritySettings(prev => ({ ...prev, passwordExpiry: parseInt(e.target.value) }))}
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={() => handleSave('bảo mật')}
            >
              Lưu cài đặt bảo mật
            </Button>
          </Box>
        </TabPanel>

        {/* Notification Settings Tab */}
        <TabPanel value={activeTab} index={2}>
          <Typography variant="h6" gutterBottom>
            Cài đặt thông báo
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                  />
                }
                label="Thông báo email"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.smsNotifications}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, smsNotifications: e.target.checked }))}
                  />
                }
                label="Thông báo SMS"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.pushNotifications}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, pushNotifications: e.target.checked }))}
                  />
                }
                label="Thông báo đẩy"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.lowStockAlert}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, lowStockAlert: e.target.checked }))}
                  />
                }
                label="Cảnh báo hết hàng"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.newOrderAlert}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, newOrderAlert: e.target.checked }))}
                  />
                }
                label="Thông báo đơn hàng mới"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.paymentAlert}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, paymentAlert: e.target.checked }))}
                  />
                }
                label="Thông báo thanh toán"
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={() => handleSave('thông báo')}
            >
              Lưu cài đặt thông báo
            </Button>
          </Box>
        </TabPanel>

        {/* Theme Settings Tab */}
        <TabPanel value={activeTab} index={3}>
          <Typography variant="h6" gutterBottom>
            Giao diện và chủ đề
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Chế độ hiển thị</InputLabel>
                <Select
                  value={themeSettings.mode}
                  onChange={(e) => setThemeSettings(prev => ({ ...prev, mode: e.target.value as 'light' | 'dark' }))}
                >
                  <MenuItem value="light">Sáng</MenuItem>
                  <MenuItem value="dark">Tối</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Kích thước chữ</InputLabel>
                <Select
                  value={themeSettings.fontSize}
                  onChange={(e) => setThemeSettings(prev => ({ ...prev, fontSize: e.target.value as 'small' | 'medium' | 'large' }))}
                >
                  <MenuItem value="small">Nhỏ</MenuItem>
                  <MenuItem value="medium">Vừa</MenuItem>
                  <MenuItem value="large">Lớn</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Màu chính"
                type="color"
                value={themeSettings.primaryColor}
                onChange={(e) => setThemeSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Màu phụ"
                type="color"
                value={themeSettings.secondaryColor}
                onChange={(e) => setThemeSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={themeSettings.compactMode}
                    onChange={(e) => setThemeSettings(prev => ({ ...prev, compactMode: e.target.checked }))}
                  />
                }
                label="Chế độ compact"
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={() => handleSave('giao diện')}
            >
              Lưu cài đặt giao diện
            </Button>
          </Box>
        </TabPanel>

        {/* Backup Settings Tab */}
        <TabPanel value={activeTab} index={4}>
          <Typography variant="h6" gutterBottom>
            Sao lưu và khôi phục
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Sao lưu dữ liệu
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Tạo bản sao lưu toàn bộ dữ liệu hệ thống
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Backup />}
                    onClick={handleBackup}
                  >
                    Tạo sao lưu
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Khôi phục dữ liệu
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Khôi phục dữ liệu từ bản sao lưu
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<Restore />}
                    onClick={handleRestore}
                  >
                    Khôi phục
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Lịch sử sao lưu
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Sao lưu tự động - 2024-01-20"
                        secondary="Kích thước: 15.2 MB"
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end">
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Sao lưu thủ công - 2024-01-15"
                        secondary="Kích thước: 14.8 MB"
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end">
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Thay đổi mật khẩu</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Mật khẩu hiện tại"
              type={showPassword ? 'text' : 'password'}
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
            />
            <TextField
              fullWidth
              label="Mật khẩu mới"
              type={showPassword ? 'text' : 'password'}
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
            />
            <TextField
              fullWidth
              label="Xác nhận mật khẩu mới"
              type={showPassword ? 'text' : 'password'}
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                />
              }
              label="Hiển thị mật khẩu"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangePasswordOpen(false)}>Hủy</Button>
          <Button onClick={handleChangePassword} variant="contained">
            Thay đổi
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsPage;