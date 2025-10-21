import React, { useState, useMemo, useCallback } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Avatar,
  Tooltip,
  Skeleton,
  Collapse,
  Fab,
  Backdrop,
  CircularProgress,
} from '@mui/material';
import {
  Search,
  Add,
  Refresh,
  Visibility,
  Edit,
  Delete,
  Support,
  FilterList,
  Warning,
  SearchOff,
  Clear,
  GridView,
  ViewList,
  TrendingUp,
  Message,
  Schedule,
  Assessment,
  PriorityHigh,
  LowPriority,
  BugReport,
  QuestionAnswer,
  Feedback,
  CheckCircle,
  AccessTime,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supportAPI } from '../../services/supportApi';

// Support Ticket Form Component
interface SupportTicketFormProps {
  open: boolean;
  onClose: () => void;
  ticket?: any;
}

const SupportTicketForm: React.FC<SupportTicketFormProps> = ({ open, onClose, ticket }) => {
  const [formData, setFormData] = useState({
    title: ticket?.title || '',
    description: ticket?.description || '',
    category: ticket?.category || 'general',
    priority: ticket?.priority || 'medium',
    status: ticket?.status || 'open',
    assigned_to: ticket?.assigned_to || '',
    customer_id: ticket?.customer_id || '',
    tags: ticket?.tags || '',
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: any) => supportAPI.createTicket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => supportAPI.updateTicket(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticket) {
      updateMutation.mutate({ id: ticket.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (field: string) => (e: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)'
        }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        textAlign: 'center',
        py: 3,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Box sx={{ 
          position: 'absolute', 
          top: -20, 
          right: -20, 
          width: 100, 
          height: 100, 
          background: 'rgba(255,255,255,0.1)', 
          borderRadius: '50%' 
        }} />
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
            {ticket ? 'Chỉnh sửa ticket hỗ trợ' : 'Tạo ticket hỗ trợ mới'}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {ticket ? 'Cập nhật thông tin ticket' : 'Điền thông tin chi tiết để tạo ticket mới'}
          </Typography>
        </Box>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: '1 1 100%', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Tiêu đề *"
                value={formData.title}
                onChange={handleChange('title')}
                required
                placeholder="Nhập tiêu đề ngắn gọn và rõ ràng"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    '&:hover': {
                      backgroundColor: 'white'
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
                      boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)'
                    }
                  }
                }}
              />
            </Box>
            <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
              <FormControl fullWidth required>
                <InputLabel>Danh mục *</InputLabel>
                <Select
                  value={formData.category}
                  onChange={handleChange('category')}
                  label="Danh mục *"
                  sx={{
                    borderRadius: 2,
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    '&:hover': {
                      backgroundColor: 'white'
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
                      boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)'
                    }
                  }}
                >
                  <MenuItem value="general">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <QuestionAnswer sx={{ fontSize: 20, color: 'primary.main' }} />
                      Tổng quát
                    </Box>
                  </MenuItem>
                  <MenuItem value="technical">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BugReport sx={{ fontSize: 20, color: 'warning.main' }} />
                      Kỹ thuật
                    </Box>
                  </MenuItem>
                  <MenuItem value="billing">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Assessment sx={{ fontSize: 20, color: 'success.main' }} />
                      Thanh toán
                    </Box>
                  </MenuItem>
                  <MenuItem value="feature">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Feedback sx={{ fontSize: 20, color: 'info.main' }} />
                      Tính năng
                    </Box>
                  </MenuItem>
                  <MenuItem value="bug">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BugReport sx={{ fontSize: 20, color: 'error.main' }} />
                      Lỗi hệ thống
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
              <FormControl fullWidth required>
                <InputLabel>Độ ưu tiên *</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={handleChange('priority')}
                  label="Độ ưu tiên *"
                  sx={{
                    borderRadius: 2,
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    '&:hover': {
                      backgroundColor: 'white'
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
                      boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)'
                    }
                  }}
                >
                  <MenuItem value="low">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LowPriority sx={{ fontSize: 20, color: 'success.main' }} />
                      Thấp
                    </Box>
                  </MenuItem>
                  <MenuItem value="medium">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Schedule sx={{ fontSize: 20, color: 'info.main' }} />
                      Trung bình
                    </Box>
                  </MenuItem>
                  <MenuItem value="high">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Warning sx={{ fontSize: 20, color: 'warning.main' }} />
                      Cao
                    </Box>
                  </MenuItem>
                  <MenuItem value="urgent">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PriorityHigh sx={{ fontSize: 20, color: 'error.main' }} />
                      Khẩn cấp
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
              <FormControl fullWidth>
                <InputLabel>Trạng thái *</InputLabel>
                <Select
                  value={formData.status}
                  onChange={handleChange('status')}
                  label="Trạng thái *"
                  sx={{
                    borderRadius: 2,
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    '&:hover': {
                      backgroundColor: 'white'
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
                      boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)'
                    }
                  }}
                >
                  <MenuItem value="open">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'error.main' }} />
                      Mở
                    </Box>
                  </MenuItem>
                  <MenuItem value="in_progress">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'warning.main' }} />
                      Đang xử lý
                    </Box>
                  </MenuItem>
                  <MenuItem value="pending">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'info.main' }} />
                      Chờ phản hồi
                    </Box>
                  </MenuItem>
                  <MenuItem value="resolved">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'success.main' }} />
                      Đã giải quyết
                    </Box>
                  </MenuItem>
                  <MenuItem value="closed">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'grey.500' }} />
                      Đã đóng
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="ID Khách hàng"
                value={formData.customer_id}
                onChange={handleChange('customer_id')}
                placeholder="Nhập ID khách hàng (tùy chọn)"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    '&:hover': {
                      backgroundColor: 'white'
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
                      boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)'
                    }
                  }
                }}
              />
            </Box>
            <Box sx={{ flex: '1 1 100%', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Mô tả chi tiết *"
                multiline
                rows={4}
                value={formData.description}
                onChange={handleChange('description')}
                required
                placeholder="Mô tả chi tiết vấn đề, yêu cầu hoặc thông tin cần hỗ trợ..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    '&:hover': {
                      backgroundColor: 'white'
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
                      boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)'
                    }
                  }
                }}
              />
            </Box>
            <Box sx={{ flex: '1 1 100%', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Tags (phân cách bằng dấu phẩy)"
                value={formData.tags}
                onChange={handleChange('tags')}
                placeholder="ví dụ: urgent, payment, mobile, web, api"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    '&:hover': {
                      backgroundColor: 'white'
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
                      boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)'
                    }
                  }
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          p: 3, 
          background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
          borderTop: '1px solid rgba(0,0,0,0.1)'
        }}>
          <Button 
            onClick={onClose}
            variant="outlined"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              px: 3,
              py: 1,
              borderColor: 'grey.400',
              color: 'grey.600',
              '&:hover': {
                borderColor: 'grey.600',
                backgroundColor: 'rgba(0,0,0,0.04)'
              }
            }}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createMutation.isPending || updateMutation.isPending}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              py: 1,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
              },
              '&:disabled': {
                background: 'grey.300',
                color: 'grey.500'
              }
            }}
          >
            {createMutation.isPending || updateMutation.isPending ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} color="inherit" />
                {ticket ? 'Đang cập nhật...' : 'Đang tạo...'}
              </Box>
            ) : (
              ticket ? 'Cập nhật ticket' : 'Tạo ticket mới'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Support Ticket Card Component
interface SupportTicketCardProps {
  ticket: any;
  onEdit: (ticket: any) => void;
  onDelete: (id: string) => void;
  onView: (ticket: any) => void;
  viewMode?: 'grid' | 'list' | 'table';
}

const SupportTicketCard: React.FC<SupportTicketCardProps> = ({ 
  ticket, 
  onEdit, 
  onDelete, 
  onView, 
  viewMode = 'grid'
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <PriorityHigh />;
      case 'high': return <Warning />;
      case 'medium': return <Schedule />;
      case 'low': return <LowPriority />;
      default: return <Schedule />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'error';
      case 'in_progress': return 'warning';
      case 'pending': return 'info';
      case 'resolved': return 'success';
      case 'closed': return 'default';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Mở';
      case 'in_progress': return 'Đang xử lý';
      case 'pending': return 'Chờ phản hồi';
      case 'resolved': return 'Đã giải quyết';
      case 'closed': return 'Đã đóng';
      default: return status;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical': return <BugReport />;
      case 'billing': return <Assessment />;
      case 'feature': return <Feedback />;
      case 'bug': return <BugReport />;
      default: return <QuestionAnswer />;
    }
  };

  if (viewMode === 'list') {
    return (
      <Card sx={{ 
        mb: 2, 
        transition: 'all 0.3s ease',
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        '&:hover': {
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          transform: 'translateY(-2px)'
        }
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <Box sx={{ flex: '1 1 40%', minWidth: '300px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ 
                  width: 60, 
                  height: 60, 
                  bgcolor: 'primary.light',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  {getCategoryIcon(ticket.category)}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {ticket.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    #{ticket.ticket_number}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box sx={{ flex: '1 1 20%', minWidth: '150px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getPriorityIcon(ticket.priority)}
                <Chip
                  label={ticket.priority}
                  color={getPriorityColor(ticket.priority) as any}
                  size="small"
                />
              </Box>
            </Box>
            <Box sx={{ flex: '1 1 20%', minWidth: '150px' }}>
              <Chip
                label={getStatusLabel(ticket.status)}
                color={getStatusColor(ticket.status) as any}
                size="small"
              />
            </Box>
            <Box sx={{ flex: '1 1 20%', minWidth: '150px' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Xem chi tiết">
                  <IconButton size="small" onClick={() => onView(ticket)}>
                    <Visibility />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Chỉnh sửa">
                  <IconButton size="small" onClick={() => onEdit(ticket)}>
                    <Edit />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Xóa">
                  <IconButton size="small" color="error" onClick={() => onDelete(ticket.id)}>
                    <Delete />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          transform: 'translateY(-4px)'
        }
      }}
    >
      <CardContent sx={{ flex: 1, pt: 3 }}>
        {/* Ticket Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.light' }}>
              {getCategoryIcon(ticket.category)}
            </Avatar>
            <Box>
              <Typography variant="body2" color="text.secondary">
                #{ticket.ticket_number}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={ticket.priority}
              color={getPriorityColor(ticket.priority) as any}
              size="small"
              icon={getPriorityIcon(ticket.priority)}
            />
          </Box>
        </Box>

        {/* Ticket Title */}
        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ 
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          minHeight: '3em'
        }}>
          {ticket.title}
        </Typography>

        {/* Ticket Description */}
        <Typography variant="body2" color="text.secondary" sx={{ 
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          minHeight: '4.5em',
          mb: 2
        }}>
          {ticket.description}
        </Typography>

        {/* Ticket Status */}
        <Box sx={{ mb: 2 }}>
          <Chip
            label={getStatusLabel(ticket.status)}
            color={getStatusColor(ticket.status) as any}
            size="small"
          />
        </Box>

        {/* Ticket Meta */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Tạo: {new Date(ticket.created_at).toLocaleDateString()}
          </Typography>
          {ticket.customer_id && (
            <Typography variant="caption" color="text.secondary" display="block">
              Khách hàng: {ticket.customer_id}
            </Typography>
          )}
        </Box>
      </CardContent>

      {/* Enhanced Action Buttons */}
      <Box sx={{ 
        p: 2, 
        borderTop: 1, 
        borderColor: 'divider',
        backgroundColor: 'rgba(0,0,0,0.02)'
      }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<Visibility />}
            onClick={() => onView(ticket)}
            sx={{ 
              flex: 1,
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            Xem
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Edit />}
            onClick={() => onEdit(ticket)}
            sx={{ 
              flex: 1,
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 500,
              borderColor: 'primary.main',
              color: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.main',
                color: 'white'
              }
            }}
          >
            Sửa
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="error"
            startIcon={<Delete />}
            onClick={() => onDelete(ticket.id)}
            sx={{ 
              flex: 1,
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 500,
              borderColor: 'error.main',
              color: 'error.main',
              '&:hover': {
                backgroundColor: 'error.main',
                color: 'white'
              }
            }}
          >
            Xóa
          </Button>
        </Box>
      </Box>
    </Card>
  );
};

// Main Support Management Component
const SupportTicketsManagement: React.FC = () => {
  // State Management
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('grid');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [formOpen, setFormOpen] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    sortBy: 'created_at',
    sortOrder: 'desc' as 'asc' | 'desc'
  });
  
  // UI State
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading] = useState(false);

  const queryClient = useQueryClient();

  // Fetch tickets with filtering
  const { data: ticketsData, isLoading: ticketsLoading, error, refetch } = useQuery({
    queryKey: ['support-tickets', page, pageSize, searchTerm, filters],
    queryFn: async () => {
      console.log('Fetching support tickets with params:', { page, pageSize, searchTerm, filters });
      const response = await supportAPI.getTickets(page, pageSize, searchTerm || undefined);
      console.log('Support tickets API response:', response.data);
      return response;
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting support ticket with ID:', id);
      const response = await supportAPI.deleteTicket(id);
      console.log('Delete support ticket response:', response.data);
      return response;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      console.log('Support ticket deleted successfully:', id);
      alert('Ticket hỗ trợ đã được xóa thành công!');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      alert('Lỗi khi xóa ticket hỗ trợ: ' + (error.message || 'Không thể xóa ticket hỗ trợ'));
    },
  });

  const tickets = ticketsData?.data?.data || [];
  
  // Debug logging
  console.log('Support tickets data:', ticketsData);
  console.log('Extracted tickets:', tickets);

  // Basic analytics
  const analytics = useMemo(() => {
    if (!tickets.length) return null;
    
    const totalTickets = tickets.length;
    const openTickets = tickets.filter((t: any) => t.status === 'open').length;
    const inProgressTickets = tickets.filter((t: any) => t.status === 'in_progress').length;
    const resolvedTickets = tickets.filter((t: any) => t.status === 'resolved').length;
    const urgentTickets = tickets.filter((t: any) => t.priority === 'urgent').length;
    
    return {
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      urgentTickets,
      resolutionRate: totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0
    };
  }, [tickets]);

  // Filtered and sorted tickets
  const filteredTickets = useMemo(() => {
    let filtered = [...tickets];
    
    // Apply filters
    if (filters.status) {
      filtered = filtered.filter((t: any) => t.status === filters.status);
    }
    if (filters.priority) {
      filtered = filtered.filter((t: any) => t.priority === filters.priority);
    }
    if (filters.category) {
      filtered = filtered.filter((t: any) => t.category === filters.category);
    }
    
    // Sort tickets
    filtered.sort((a: any, b: any) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        default:
          aValue = new Date(a.created_at || 0).getTime();
          bValue = new Date(b.created_at || 0).getTime();
      }
      
      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  }, [tickets, filters]);

  // Event Handlers
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value;
    console.log('Search term changed:', searchValue);
    setSearchTerm(searchValue);
    setPage(1);
  }, []);

  const handleRefresh = useCallback(() => {
    console.log('Refreshing support tickets...');
    refetch();
  }, [refetch]);

  const handleEdit = useCallback((ticket: any) => {
    console.log('Edit support ticket:', ticket);
    setSelectedTicket(ticket);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    console.log('Delete support ticket:', id);
    if (window.confirm('Bạn có chắc chắn muốn xóa ticket hỗ trợ này?')) {
      deleteMutation.mutate(id);
    }
  }, [deleteMutation]);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedTicketForView, setSelectedTicketForView] = useState<any>(null);

  const handleView = useCallback((ticket: any) => {
    console.log('View support ticket:', ticket);
    setSelectedTicketForView(ticket);
    setViewModalOpen(true);
  }, []);

  const handleFilterChange = useCallback((key: string, value: any) => {
    console.log('Filter changed:', key, value);
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      console.log('New filters applied:', newFilters);
      return newFilters;
    });
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    console.log('Clearing all filters');
    const defaultFilters = {
      status: '',
      priority: '',
      category: '',
      sortBy: 'created_at',
      sortOrder: 'desc' as 'asc' | 'desc'
    };
    setFilters(defaultFilters);
  }, []);

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          Không thể tải dữ liệu ticket hỗ trợ. Vui lòng kiểm tra kết nối mạng.
        </Alert>
        <Button onClick={handleRefresh} startIcon={<Refresh />}>
          Thử lại
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Enhanced Header */}
      <Box sx={{ mb: 4 }}>
        <Card sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white',
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative'
        }}>
          <Box sx={{ 
            position: 'absolute', 
            top: 0, 
            right: 0, 
            width: 200, 
            height: 200, 
            background: 'rgba(255,255,255,0.1)', 
            borderRadius: '50%', 
            transform: 'translate(50%, -50%)' 
          }} />
          <CardContent sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                    <Support sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                      Hệ thống hỗ trợ khách hàng
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                      Quản lý và theo dõi các yêu cầu hỗ trợ từ khách hàng
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Message sx={{ fontSize: 20 }} />
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Hỗ trợ 24/7
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Schedule sx={{ fontSize: 20 }} />
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Phản hồi nhanh
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Assessment sx={{ fontSize: 20 }} />
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Báo cáo chi tiết
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  component={Link}
                  to="/lien-he"
                  variant="outlined"
                  startIcon={<Message />}
                  sx={{ 
                    textDecoration: 'none',
                    color: 'white',
                    borderColor: 'rgba(255,255,255,0.3)',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Liên hệ công khai
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setFormOpen(true)}
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.3)'
                    }
                  }}
                >
                  Tạo ticket mới
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Enhanced Stats Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box sx={{ flex: '1 1 25%', minWidth: '250px' }}>
          <Card sx={{ 
            height: '100%', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            transition: 'transform 0.3s ease',
            '&:hover': { transform: 'translateY(-4px)' }
          }}>
            <Box sx={{ 
              position: 'absolute', 
              top: -20, 
              right: -20, 
              width: 80, 
              height: 80, 
              background: 'rgba(255,255,255,0.1)', 
              borderRadius: '50%' 
            }} />
            <CardContent sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                    {analytics?.totalTickets || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Tổng tickets
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUp sx={{ fontSize: 16 }} />
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Tất cả tickets
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <Support sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: '1 1 25%', minWidth: '250px' }}>
          <Card sx={{ 
            height: '100%', 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            transition: 'transform 0.3s ease',
            '&:hover': { transform: 'translateY(-4px)' }
          }}>
            <Box sx={{ 
              position: 'absolute', 
              top: -20, 
              right: -20, 
              width: 80, 
              height: 80, 
              background: 'rgba(255,255,255,0.1)', 
              borderRadius: '50%' 
            }} />
            <CardContent sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                    {analytics?.openTickets || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Đang chờ xử lý
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTime sx={{ fontSize: 16 }} />
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Cần xử lý
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <Message sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: '1 1 25%', minWidth: '250px' }}>
          <Card sx={{ 
            height: '100%', 
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            transition: 'transform 0.3s ease',
            '&:hover': { transform: 'translateY(-4px)' }
          }}>
            <Box sx={{ 
              position: 'absolute', 
              top: -20, 
              right: -20, 
              width: 80, 
              height: 80, 
              background: 'rgba(255,255,255,0.1)', 
              borderRadius: '50%' 
            }} />
            <CardContent sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                    {analytics?.urgentTickets || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Khẩn cấp
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning sx={{ fontSize: 16 }} />
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Mức độ cao
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <PriorityHigh sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: '1 1 25%', minWidth: '250px' }}>
          <Card sx={{ 
            height: '100%', 
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', 
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            transition: 'transform 0.3s ease',
            '&:hover': { transform: 'translateY(-4px)' }
          }}>
            <Box sx={{ 
              position: 'absolute', 
              top: -20, 
              right: -20, 
              width: 80, 
              height: 80, 
              background: 'rgba(255,255,255,0.1)', 
              borderRadius: '50%' 
            }} />
            <CardContent sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                    {analytics?.resolutionRate || 0}%
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Tỷ lệ giải quyết
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle sx={{ fontSize: 16 }} />
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Đã hoàn thành
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <TrendingUp sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Enhanced Toolbar */}
      <Card sx={{ 
        mb: 3, 
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <CardContent>
          {/* Main Toolbar */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            {/* Enhanced Search */}
            <TextField
              placeholder="Tìm kiếm theo tiêu đề, mô tả, khách hàng..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'primary.main' }} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton 
                      size="small" 
                      onClick={() => setSearchTerm('')}
                      sx={{ color: 'text.secondary' }}
                    >
                      <Clear />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ 
                minWidth: 350, 
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'rgba(0,0,0,0.02)',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.04)'
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'white',
                    boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)'
                  }
                }
              }}
            />
            
            {/* Enhanced View Mode Toggle */}
            <Box sx={{ 
              display: 'flex', 
              border: 1, 
              borderColor: 'divider', 
              borderRadius: 2,
              overflow: 'hidden',
              backgroundColor: 'rgba(0,0,0,0.02)'
            }}>
              <IconButton
                onClick={() => setViewMode('grid')}
                color={viewMode === 'grid' ? 'primary' : 'default'}
                size="small"
                sx={{
                  borderRadius: 0,
                  backgroundColor: viewMode === 'grid' ? 'primary.main' : 'transparent',
                  color: viewMode === 'grid' ? 'white' : 'text.secondary',
                  '&:hover': {
                    backgroundColor: viewMode === 'grid' ? 'primary.dark' : 'rgba(0,0,0,0.04)'
                  }
                }}
              >
                <GridView />
              </IconButton>
              <IconButton
                onClick={() => setViewMode('list')}
                color={viewMode === 'list' ? 'primary' : 'default'}
                size="small"
                sx={{
                  borderRadius: 0,
                  backgroundColor: viewMode === 'list' ? 'primary.main' : 'transparent',
                  color: viewMode === 'list' ? 'white' : 'text.secondary',
                  '&:hover': {
                    backgroundColor: viewMode === 'list' ? 'primary.dark' : 'rgba(0,0,0,0.04)'
                  }
                }}
              >
                <ViewList />
              </IconButton>
            </Box>

            {/* Enhanced Action Buttons */}
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setSelectedTicket(null);
                setFormOpen(true);
              }}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                }
              }}
            >
              Tạo ticket
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRefresh}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                px: 3,
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              Làm mới
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setShowFilters(!showFilters)}
              color={showFilters ? 'primary' : 'inherit'}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                px: 3,
                borderColor: showFilters ? 'primary.main' : 'divider',
                color: showFilters ? 'primary.main' : 'text.secondary',
                backgroundColor: showFilters ? 'rgba(102, 126, 234, 0.08)' : 'transparent',
                '&:hover': {
                  backgroundColor: showFilters ? 'rgba(102, 126, 234, 0.12)' : 'rgba(0,0,0,0.04)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              Bộ lọc
            </Button>
          </Box>

          {/* Filters */}
          <Collapse in={showFilters}>
            <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: '1 1 20%', minWidth: '200px' }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Trạng thái</InputLabel>
                    <Select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      label="Trạng thái"
                    >
                      <MenuItem value="">Tất cả</MenuItem>
                      <MenuItem value="open">Mở</MenuItem>
                      <MenuItem value="in_progress">Đang xử lý</MenuItem>
                      <MenuItem value="pending">Chờ phản hồi</MenuItem>
                      <MenuItem value="resolved">Đã giải quyết</MenuItem>
                      <MenuItem value="closed">Đã đóng</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                
                <Box sx={{ flex: '1 1 20%', minWidth: '200px' }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Độ ưu tiên</InputLabel>
                    <Select
                      value={filters.priority}
                      onChange={(e) => handleFilterChange('priority', e.target.value)}
                      label="Độ ưu tiên"
                    >
                      <MenuItem value="">Tất cả</MenuItem>
                      <MenuItem value="urgent">Khẩn cấp</MenuItem>
                      <MenuItem value="high">Cao</MenuItem>
                      <MenuItem value="medium">Trung bình</MenuItem>
                      <MenuItem value="low">Thấp</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                
                <Box sx={{ flex: '1 1 20%', minWidth: '200px' }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Danh mục</InputLabel>
                    <Select
                      value={filters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      label="Danh mục"
                    >
                      <MenuItem value="">Tất cả</MenuItem>
                      <MenuItem value="general">Tổng quát</MenuItem>
                      <MenuItem value="technical">Kỹ thuật</MenuItem>
                      <MenuItem value="billing">Thanh toán</MenuItem>
                      <MenuItem value="feature">Tính năng</MenuItem>
                      <MenuItem value="bug">Lỗi hệ thống</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                
                <Box sx={{ flex: '1 1 20%', minWidth: '200px' }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Sắp xếp</InputLabel>
                    <Select
                      value={filters.sortBy}
                      onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                      label="Sắp xếp"
                    >
                      <MenuItem value="created_at">Ngày tạo</MenuItem>
                      <MenuItem value="priority">Độ ưu tiên</MenuItem>
                      <MenuItem value="title">Tiêu đề</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                
                <Box sx={{ flex: '1 1 20%', minWidth: '200px' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={clearFilters}
                    startIcon={<Clear />}
                  >
                    Xóa bộ lọc
                  </Button>
                </Box>
              </Box>
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      {/* Tickets Display */}
      {ticketsLoading ? (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Box key={index} sx={{ flex: '1 1 50%', minWidth: '300px' }}>
              <Card>
                <CardContent>
                  <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
                  <Skeleton variant="text" height={32} sx={{ mb: 1 }} />
                  <Skeleton variant="text" height={24} sx={{ mb: 1 }} />
                  <Skeleton variant="text" height={20} />
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      ) : (
        <>
          {/* Tickets Grid/List */}
          {viewMode === 'list' ? (
            <Box>
              {filteredTickets.map((ticket: any) => (
                <SupportTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleView}
                  viewMode="list"
                />
              ))}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {filteredTickets.map((ticket: any) => (
                <Box key={ticket.id} sx={{ flex: '1 1 25%', minWidth: '300px' }}>
                  <SupportTicketCard
                    ticket={ticket}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onView={handleView}
                    viewMode={viewMode}
                  />
                </Box>
              ))}
            </Box>
          )}

          {/* Empty State */}
          {filteredTickets.length === 0 && !ticketsLoading && (
            <Card sx={{ mt: 3 }}>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 3, bgcolor: 'grey.100' }}>
                  <SearchOff sx={{ fontSize: 40, color: 'grey.400' }} />
                </Avatar>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  {searchTerm ? 'Không tìm thấy ticket' : 'Chưa có ticket nào'}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                  {searchTerm 
                    ? `Không có ticket nào khớp với "${searchTerm}"`
                    : 'Bắt đầu bằng cách tạo ticket hỗ trợ đầu tiên'
                  }
                </Typography>
                {searchTerm ? (
                  <Button
                    variant="outlined"
                    startIcon={<Clear />}
                    onClick={() => setSearchTerm('')}
                    sx={{ mr: 2 }}
                  >
                    Xóa tìm kiếm
                  </Button>
                ) : null}
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setFormOpen(true)}
                >
                  {searchTerm ? 'Tạo ticket mới' : 'Tạo ticket đầu tiên'}
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
        }}
        onClick={() => {
          setSelectedTicket(null);
          setFormOpen(true);
        }}
      >
        <Add />
      </Fab>

      {/* Loading Backdrop */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isLoading}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress color="inherit" />
          <Typography variant="h6">Đang xử lý...</Typography>
        </Box>
      </Backdrop>

      {/* Support Ticket Form Dialog */}
      <SupportTicketForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        ticket={selectedTicket}
      />

      {/* Enhanced View Ticket Modal */}
      <Dialog 
        open={viewModalOpen} 
        onClose={() => setViewModalOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center',
          py: 3,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <Box sx={{ 
            position: 'absolute', 
            top: -20, 
            right: -20, 
            width: 100, 
            height: 100, 
            background: 'rgba(255,255,255,0.1)', 
            borderRadius: '50%' 
          }} />
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
              Chi tiết ticket hỗ trợ
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Thông tin đầy đủ về ticket #{selectedTicketForView?.ticket_number}
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 4 }}>
          {selectedTicketForView && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Ticket Header */}
              <Box sx={{ 
                p: 3, 
                borderRadius: 2, 
                background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                border: '1px solid rgba(0,0,0,0.1)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ 
                    width: 60, 
                    height: 60, 
                    bgcolor: 'primary.light',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    {selectedTicketForView.category === 'technical' ? <BugReport /> : 
                     selectedTicketForView.category === 'billing' ? <Assessment /> :
                     selectedTicketForView.category === 'feature' ? <Feedback /> :
                     <QuestionAnswer />}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                      {selectedTicketForView.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      #{selectedTicketForView.ticket_number}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={selectedTicketForView.priority}
                      color={selectedTicketForView.priority === 'urgent' ? 'error' : 
                             selectedTicketForView.priority === 'high' ? 'warning' :
                             selectedTicketForView.priority === 'medium' ? 'info' : 'success'}
                      size="small"
                      icon={selectedTicketForView.priority === 'urgent' ? <PriorityHigh /> :
                            selectedTicketForView.priority === 'high' ? <Warning /> :
                            selectedTicketForView.priority === 'medium' ? <Schedule /> : <LowPriority />}
                    />
                    <Chip
                      label={selectedTicketForView.status === 'open' ? 'Mở' :
                             selectedTicketForView.status === 'in_progress' ? 'Đang xử lý' :
                             selectedTicketForView.status === 'pending' ? 'Chờ phản hồi' :
                             selectedTicketForView.status === 'resolved' ? 'Đã giải quyết' : 'Đã đóng'}
                      color={selectedTicketForView.status === 'open' ? 'error' :
                             selectedTicketForView.status === 'in_progress' ? 'warning' :
                             selectedTicketForView.status === 'pending' ? 'info' :
                             selectedTicketForView.status === 'resolved' ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                </Box>
              </Box>

              {/* Ticket Details */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
                <Box sx={{ 
                  p: 3, 
                  borderRadius: 2, 
                  background: 'rgba(102, 126, 234, 0.05)',
                  border: '1px solid rgba(102, 126, 234, 0.2)'
                }}>
                  <Typography variant="subtitle2" fontWeight="bold" color="primary.main" sx={{ mb: 2 }}>
                    Thông tin cơ bản
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Danh mục:</Typography>
                      <Typography variant="body1" fontWeight="500">
                        {selectedTicketForView.category === 'technical' ? 'Kỹ thuật' :
                         selectedTicketForView.category === 'billing' ? 'Thanh toán' :
                         selectedTicketForView.category === 'feature' ? 'Tính năng' :
                         selectedTicketForView.category === 'bug' ? 'Lỗi hệ thống' : 'Tổng quát'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Độ ưu tiên:</Typography>
                      <Typography variant="body1" fontWeight="500">
                        {selectedTicketForView.priority === 'urgent' ? 'Khẩn cấp' :
                         selectedTicketForView.priority === 'high' ? 'Cao' :
                         selectedTicketForView.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Trạng thái:</Typography>
                      <Typography variant="body1" fontWeight="500">
                        {selectedTicketForView.status === 'open' ? 'Mở' :
                         selectedTicketForView.status === 'in_progress' ? 'Đang xử lý' :
                         selectedTicketForView.status === 'pending' ? 'Chờ phản hồi' :
                         selectedTicketForView.status === 'resolved' ? 'Đã giải quyết' : 'Đã đóng'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ 
                  p: 3, 
                  borderRadius: 2, 
                  background: 'rgba(76, 175, 80, 0.05)',
                  border: '1px solid rgba(76, 175, 80, 0.2)'
                }}>
                  <Typography variant="subtitle2" fontWeight="bold" color="success.main" sx={{ mb: 2 }}>
                    Thông tin khách hàng
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">ID Khách hàng:</Typography>
                      <Typography variant="body1" fontWeight="500">
                        {selectedTicketForView.customer_id || 'Chưa có'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Ngày tạo:</Typography>
                      <Typography variant="body1" fontWeight="500">
                        {new Date(selectedTicketForView.created_at).toLocaleString('vi-VN')}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Cập nhật lần cuối:</Typography>
                      <Typography variant="body1" fontWeight="500">
                        {new Date(selectedTicketForView.updated_at).toLocaleString('vi-VN')}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Description */}
              <Box sx={{ 
                p: 3, 
                borderRadius: 2, 
                background: 'rgba(255, 193, 7, 0.05)',
                border: '1px solid rgba(255, 193, 7, 0.2)'
              }}>
                <Typography variant="subtitle2" fontWeight="bold" color="warning.main" sx={{ mb: 2 }}>
                  Mô tả chi tiết
                </Typography>
                <Typography variant="body1" sx={{ 
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {selectedTicketForView.description}
                </Typography>
              </Box>

              {/* Tags */}
              {selectedTicketForView.tags && (
                <Box sx={{ 
                  p: 3, 
                  borderRadius: 2, 
                  background: 'rgba(156, 39, 176, 0.05)',
                  border: '1px solid rgba(156, 39, 176, 0.2)'
                }}>
                  <Typography variant="subtitle2" fontWeight="bold" color="secondary.main" sx={{ mb: 2 }}>
                    Tags
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedTicketForView.tags.split(',').map((tag: string, index: number) => (
                      <Chip
                        key={index}
                        label={tag.trim()}
                        size="small"
                        sx={{ 
                          backgroundColor: 'rgba(156, 39, 176, 0.1)',
                          color: 'secondary.main',
                          fontWeight: 500
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ 
          p: 3, 
          background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
          borderTop: '1px solid rgba(0,0,0,0.1)'
        }}>
          <Button 
            onClick={() => setViewModalOpen(false)}
            variant="contained"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              py: 1,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
              }
            }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SupportTicketsManagement;