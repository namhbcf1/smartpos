import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Button,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  Badge,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Notifications as NotificationIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  PushPin as PushIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Build as RepairIcon,
  Refresh as RefreshIcon,
  VolumeUp as SoundIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import api from '../services/api';

interface NotificationRule {
  id: string;
  name: string;
  description: string;
  type: 'warranty_expiry' | 'claim_update' | 'sla_breach' | 'cost_threshold' | 'custom';
  conditions: NotificationConditions;
  actions: NotificationAction[];
  is_active: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  updated_at: string;
}

interface NotificationConditions {
  warranty_status?: string[];
  days_before_expiry?: number;
  cost_threshold?: number;
  claim_status?: string[];
  technician_id?: string[];
  customer_group?: string[];
  product_category?: string[];
  time_window?: {
    start: string;
    end: string;
  };
}

interface NotificationAction {
  type: 'email' | 'sms' | 'push' | 'in_app';
  recipients: string[];
  template: string;
  delay_minutes?: number;
  is_enabled: boolean;
}

interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'email' | 'sms' | 'push' | 'in_app';
  variables: string[];
  is_system: boolean;
}

interface NotificationHistory {
  id: string;
  rule_id: string;
  rule_name: string;
  type: string;
  recipient: string;
  subject: string;
  content: string;
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  sent_at: string;
  delivered_at?: string;
  error_message?: string;
}

const WarrantyNotifications: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [currentTab, setCurrentTab] = useState(0);
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<NotificationRule | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [editMode, setEditMode] = useState(false);
  
  // Notification settings
  const [settings, setSettings] = useState({
    email_enabled: true,
    sms_enabled: false,
    push_enabled: true,
    in_app_enabled: true,
    sound_enabled: true,
    auto_refresh: true,
    refresh_interval: 30
  });

  // Mock data
  const mockRules: NotificationRule[] = [
    {
      id: 'rule_1',
      name: 'Cảnh báo bảo hành sắp hết hạn',
      description: 'Gửi thông báo khi bảo hành sắp hết hạn trong 30 ngày',
      type: 'warranty_expiry',
      conditions: {
        warranty_status: ['active'],
        days_before_expiry: 30,
        time_window: {
          start: '09:00',
          end: '17:00'
        }
      },
      actions: [
        {
          type: 'email',
          recipients: ['customer', 'admin'],
          template: 'warranty_expiry_warning',
          delay_minutes: 0,
          is_enabled: true
        },
        {
          type: 'in_app',
          recipients: ['admin', 'technician'],
          template: 'warranty_expiry_alert',
          delay_minutes: 0,
          is_enabled: true
        }
      ],
      is_active: true,
      priority: 'medium',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z'
    },
    {
      id: 'rule_2',
      name: 'Thông báo cập nhật yêu cầu bảo hành',
      description: 'Thông báo khi có cập nhật về yêu cầu bảo hành',
      type: 'claim_update',
      conditions: {
        claim_status: ['submitted', 'in_progress', 'completed'],
        time_window: {
          start: '08:00',
          end: '18:00'
        }
      },
      actions: [
        {
          type: 'email',
          recipients: ['customer'],
          template: 'claim_status_update',
          delay_minutes: 0,
          is_enabled: true
        },
        {
          type: 'push',
          recipients: ['customer'],
          template: 'claim_update_push',
          delay_minutes: 0,
          is_enabled: true
        }
      ],
      is_active: true,
      priority: 'high',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z'
    }
  ];

  const mockTemplates: NotificationTemplate[] = [
    {
      id: 'template_1',
      name: 'Cảnh báo bảo hành sắp hết hạn',
      subject: 'Bảo hành sắp hết hạn - {product_name}',
      content: 'Bảo hành cho sản phẩm {product_name} sẽ hết hạn vào {expiry_date}. Vui lòng liên hệ để được hỗ trợ.',
      type: 'email',
      variables: ['product_name', 'expiry_date'],
      is_system: true
    },
    {
      id: 'template_2',
      name: 'Cập nhật trạng thái yêu cầu bảo hành',
      subject: 'Cập nhật yêu cầu bảo hành #{claim_number}',
      content: 'Yêu cầu bảo hành #{claim_number} đã được cập nhật: {status}. {additional_info}',
      type: 'email',
      variables: ['claim_number', 'status', 'additional_info'],
      is_system: true
    }
  ];

  const mockHistory: NotificationHistory[] = [
    {
      id: 'history_1',
      rule_id: 'rule_1',
      rule_name: 'Cảnh báo bảo hành sắp hết hạn',
      type: 'email',
      recipient: 'customer@example.com',
      subject: 'Bảo hành sắp hết hạn - Laptop Dell XPS 13',
      content: 'Bảo hành cho sản phẩm Laptop Dell XPS 13 sẽ hết hạn vào 15/02/2024...',
      status: 'delivered',
      sent_at: '2024-01-15T10:00:00Z',
      delivered_at: '2024-01-15T10:01:00Z'
    },
    {
      id: 'history_2',
      rule_id: 'rule_2',
      rule_name: 'Thông báo cập nhật yêu cầu bảo hành',
      type: 'push',
      recipient: 'customer_device_001',
      subject: 'Cập nhật yêu cầu bảo hành #WC001',
      content: 'Yêu cầu bảo hành #WC001 đã được cập nhật: Đang xử lý...',
      status: 'sent',
      sent_at: '2024-01-15T09:30:00Z'
    }
  ];

  useEffect(() => {
    loadNotificationData();
  }, []);

  const loadNotificationData = async () => {
    try {
      setLoading(true);
      setError(null);
      setRules(mockRules);
      setTemplates(mockTemplates);
      setHistory(mockHistory);
    } catch (error) {
      console.error('Error loading notification data:', error);
      setError('Không thể tải dữ liệu thông báo');
      setRules(mockRules);
      setTemplates(mockTemplates);
      setHistory(mockHistory);
    } finally {
      setLoading(false);
    }
  };

  const handleRuleCreate = () => {
    setSelectedRule(null);
    setEditMode(false);
    setRuleDialogOpen(true);
  };

  const handleRuleEdit = (rule: NotificationRule) => {
    setSelectedRule(rule);
    setEditMode(true);
    setRuleDialogOpen(true);
  };

  const handleRuleDelete = (ruleId: string) => {
    setRules(rules.filter(r => r.id !== ruleId));
  };

  const handleRuleToggle = (ruleId: string) => {
    setRules(rules.map(r => 
      r.id === ruleId ? { ...r, is_active: !r.is_active } : r
    ));
  };

  const handleTemplateCreate = () => {
    setSelectedTemplate(null);
    setEditMode(false);
    setTemplateDialogOpen(true);
  };

  const handleTemplateEdit = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    setEditMode(true);
    setTemplateDialogOpen(true);
  };

  const handleTemplateDelete = (templateId: string) => {
    setTemplates(templates.filter(t => t.id !== templateId));
  };

  const getNotificationTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <EmailIcon />;
      case 'sms': return <SmsIcon />;
      case 'push': return <PushIcon />;
      case 'in_app': return <NotificationIcon />;
      default: return <NotificationIcon />;
    }
  };

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'email': return 'primary';
      case 'sms': return 'success';
      case 'push': return 'warning';
      case 'in_app': return 'info';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'info';
      case 'delivered': return 'success';
      case 'failed': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  if (loading && rules.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          Đang tải hệ thống thông báo...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Thông báo & Cảnh báo
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Quản lý hệ thống thông báo thông minh cho bảo hành
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
          >
            Cài đặt
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleRuleCreate}
          >
            Tạo quy tắc mới
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotificationIcon />
                Quy tắc thông báo
                <Badge badgeContent={rules.filter(r => r.is_active).length} color="primary" />
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ViewIcon />
                Mẫu thông báo
                  </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScheduleIcon />
                Lịch sử thông báo
                </Box>
            }
          />
        </Tabs>
      </Paper>

      {/* Content based on current tab */}
      {currentTab === 0 && (
        <Grid container spacing={3}>
          {rules.map((rule) => (
            <Grid item xs={12} md={6} key={rule.id}>
            <Card>
              <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                      <Typography variant="h6" gutterBottom>
                        {rule.name}
                    </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {rule.description}
                    </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Chip
                        label={rule.priority}
                        color={getPriorityColor(rule.priority) as any}
                        size="small"
                      />
                      <Switch
                        checked={rule.is_active}
                        onChange={() => handleRuleToggle(rule.id)}
                        color="primary"
                      />
                    </Stack>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Loại: {rule.type.replace('_', ' ')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Hành động: {rule.actions.length} loại
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Cập nhật: {formatDateTime(rule.updated_at)}
                    </Typography>
                    
                    <Stack direction="row" spacing={1}>
                      <IconButton
                        size="small"
                        onClick={() => handleRuleEdit(rule)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRuleDelete(rule.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          ))}
        </Grid>
      )}

      {currentTab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Mẫu thông báo
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleTemplateCreate}
            >
              Tạo mẫu mới
            </Button>
          </Box>
          
          <Grid container spacing={3}>
            {templates.map((template) => (
              <Grid item xs={12} md={6} key={template.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                        <Typography variant="h6" gutterBottom>
                          {template.name}
                          </Typography>
                                                 <Typography variant="body2" color="text.secondary" gutterBottom>
                           {template.content.substring(0, 100)}...
                          </Typography>
                        </Box>
                      <Stack direction="row" spacing={1}>
                        <Chip
                          icon={getNotificationTypeIcon(template.type)}
                          label={template.type}
                          color={getNotificationTypeColor(template.type) as any}
                          size="small"
                        />
                        {template.is_system && (
                          <Chip label="Hệ thống" size="small" color="primary" variant="outlined" />
                        )}
                      </Stack>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" fontWeight="medium" gutterBottom>
                        Tiêu đề:
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        {template.subject}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" fontWeight="medium" gutterBottom>
                        Nội dung:
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        {template.content}
                      </Typography>
                    </Box>
                    
                    {template.variables.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" fontWeight="medium" gutterBottom>
                          Biến sử dụng:
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {template.variables.map((variable) => (
                        <Chip
                              key={variable}
                              label={variable}
                          size="small"
                              variant="outlined"
                            />
                          ))}
                        </Stack>
                      </Box>
                    )}
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        ID: {template.id}
                      </Typography>
                      
                      {!template.is_system && (
                        <Stack direction="row" spacing={1}>
                            <IconButton
                              size="small"
                            onClick={() => handleTemplateEdit(template)}
                          >
                            <EditIcon fontSize="small" />
                            </IconButton>
                              <IconButton
                                size="small"
                            color="error"
                            onClick={() => handleTemplateDelete(template.id)}
                              >
                            <DeleteIcon fontSize="small" />
                              </IconButton>
                        </Stack>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {currentTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Lịch sử thông báo
            </Typography>
            
            {history.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                  Chưa có lịch sử thông báo
                        </Typography>
                      </Box>
            ) : (
              <List>
                {history.map((item) => (
                  <React.Fragment key={item.id}>
                    <ListItem>
                      <ListItemIcon>
                        {getNotificationTypeIcon(item.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight="medium">
                              {item.subject}
                            </Typography>
                            <Chip
                              label={item.status}
                              color={getStatusColor(item.status) as any}
                              size="small"
              />
            </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Quy tắc: {item.rule_name}
                            </Typography>
                            <Typography variant="caption" display="block" color="text.secondary">
                              Người nhận: {item.recipient}
                            </Typography>
                            <Typography variant="caption" display="block" color="text.secondary">
                              Gửi lúc: {formatDateTime(item.sent_at)}
                            </Typography>
                            {item.delivered_at && (
                              <Typography variant="caption" display="block" color="text.secondary">
                                Nhận lúc: {formatDateTime(item.delivered_at)}
                              </Typography>
                            )}
                            {item.error_message && (
                              <Typography variant="caption" display="block" color="error">
                                Lỗi: {item.error_message}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Stack direction="row" spacing={1}>
                          <Chip
                            icon={getNotificationTypeIcon(item.type)}
                            label={item.type}
                            color={getNotificationTypeColor(item.type) as any}
                            size="small"
                            variant="outlined"
                          />
                        </Stack>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rule Dialog */}
      <Dialog
        open={ruleDialogOpen}
        onClose={() => setRuleDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editMode ? 'Chỉnh sửa quy tắc' : 'Tạo quy tắc mới'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Tính năng này sẽ được triển khai trong phiên bản tiếp theo
          </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRuleDialogOpen(false)}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Template Dialog */}
      <Dialog
        open={templateDialogOpen}
        onClose={() => setTemplateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editMode ? 'Chỉnh sửa mẫu' : 'Tạo mẫu mới'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Tính năng này sẽ được triển khai trong phiên bản tiếp theo
                  </Typography>
            </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateDialogOpen(false)}>
            Đóng
            </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WarrantyNotifications;
