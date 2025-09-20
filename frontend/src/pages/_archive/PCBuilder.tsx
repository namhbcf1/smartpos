import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper
} from '@mui/material';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

// Vietnamese PC Component Types
interface PCComponent {
  id: string;
  name: string;
  type: string;
  price: number;
  brand: string;
  model: string;
  specifications: Record<string, any>;
}

interface ComponentType {
  type: string;
  name: string;
  icon: string;
  required: boolean;
  multiple?: boolean;
}

const componentTypes: ComponentType[] = [
  { type: 'cpu', name: 'CPU', icon: '🖥️', required: true },
  { type: 'motherboard', name: 'Bo mạch chủ', icon: '🔌', required: true },
  { type: 'ram', name: 'RAM', icon: '💾', required: true },
  { type: 'gpu', name: 'Card đồ họa', icon: '🎮', required: false },
  { type: 'storage', name: 'Ổ cứng', icon: '💿', required: true },
  { type: 'psu', name: 'Nguồn máy tính', icon: '⚡', required: true },
  { type: 'case', name: 'Thùng máy', icon: '📦', required: true },
  { type: 'cooling', name: 'Tản nhiệt', icon: '❄️', required: false }
];

const PCBuilder: React.FC = () => {
  const [selectedComponents, setSelectedComponents] = useState<Record<string, PCComponent>>({});
  const [availableComponents, setAvailableComponents] = useState<PCComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [compatibilityIssues, setCompatibilityIssues] = useState<string[]>([]);
  const [buildResult, setBuildResult] = useState<string>('');

  // Fetch components from D1 Cloudflare
  useEffect(() => {
    const fetchComponents = async () => {
      try {
        setLoading(true);
        const response = await api.get('/pc-components');
        
        if (response.data.success) {
          setAvailableComponents(response.data.data || []);
          console.log('📦 PC Components loaded from D1:', response.data.data?.length || 0);
        } else {
          console.log('No PC components found in D1 database');
          setAvailableComponents([]);
        }
      } catch (error) {
        console.error('Error fetching PC components from D1:', error);
        setAvailableComponents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchComponents();
  }, []);

  const getComponentsByType = (type: string) => {
    return availableComponents.filter(component => component.type === type);
  };

  const handleComponentSelect = (type: string, componentId: string) => {
    if (!componentId) {
      const newSelected = { ...selectedComponents };
      delete newSelected[type];
      setSelectedComponents(newSelected);
      return;
    }

    const component = availableComponents.find(c => c.id === componentId);
    if (component) {
      setSelectedComponents(prev => ({
        ...prev,
        [type]: component
      }));
    }
  };

  const canBuildPC = () => {
    const requiredTypes = componentTypes.filter(t => t.required);
    return requiredTypes.every(t => selectedComponents[t.type]);
  };

  const calculateTotalPrice = () => {
    return Object.values(selectedComponents).reduce((total, component) => total + component.price, 0);
  };

  const checkCompatibility = () => {
    const issues: string[] = [];
    
    // Check CPU and motherboard socket compatibility
    const cpu = selectedComponents.cpu;
    const motherboard = selectedComponents.motherboard;
    
    if (cpu && motherboard) {
      if (cpu.specifications.socket !== motherboard.specifications.socket) {
        issues.push(`CPU ${cpu.name} không tương thích với bo mạch ${motherboard.name} (socket khác nhau)`);
      }
    }

    // Check RAM compatibility
    const ram = selectedComponents.ram;
    if (ram && motherboard) {
      if (ram.specifications.speed > 3200 && motherboard.specifications.chipset === 'B660') {
        issues.push(`RAM ${ram.name} có thể không chạy được tốc độ tối đa trên bo mạch ${motherboard.name}`);
      }
    }

    setCompatibilityIssues(issues);
    return issues.length === 0;
  };

  const handleBuildPC = () => {
    if (!canBuildPC()) {
      toast.error('Vui lòng chọn đủ linh kiện bắt buộc');
      return;
    }

    const isCompatible = checkCompatibility();
    if (!isCompatible) {
      toast.error('Có vấn đề về tương thích giữa các linh kiện');
      return;
    }

    const totalPrice = calculateTotalPrice();
    const result = `PC đã được xây dựng thành công với tổng giá ${formatCurrency(totalPrice)}!`;
    setBuildResult(result);
    toast.success('Xây dựng PC thành công!');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const totalPrice = calculateTotalPrice();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        PC Builder - Xây dựng máy tính
      </Typography>

      {/* Online-only Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        Chức năng này yêu cầu kết nối internet để hoạt động
      </Alert>

      {/* Component Selection */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3 }}>
        <Box sx={{ flex: { lg: 2 } }}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Chọn linh kiện
            </Typography>

            {componentTypes.map((componentType) => (
              <Box key={componentType.type} sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1">
                    {componentType.icon} {componentType.name}
                  </Typography>
                  {selectedComponents[componentType.type] && (
                    <Chip 
                      label="Đã chọn" 
                      color="success" 
                      sx={{ width: 'auto' }}
                    />
                  )}
                </Box>

                <FormControl fullWidth>
                  <InputLabel>Chọn {componentType.name}</InputLabel>
                  <Select
                    value={selectedComponents[componentType.type]?.id || ''}
                    onChange={(e) => handleComponentSelect(componentType.type, e.target.value)}
                    label={`Chọn ${componentType.name}`}
                  >
                    <MenuItem value="">
                      <em>Chưa chọn</em>
                    </MenuItem>
                    {getComponentsByType(componentType.type).map((component) => (
                      <MenuItem key={component.id} value={component.id}>
                        {component.name} - {formatCurrency(component.price)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            ))}
          </Paper>
        </Box>

        <Box sx={{ flex: { lg: 1 } }}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Tổng quan
            </Typography>

            <List>
              {Object.entries(selectedComponents).map(([type, component]) => (
                <ListItem key={type} sx={{ px: 0 }}>
                  <ListItemText
                    primary={component.name}
                    secondary={`${componentTypes.find(t => t.type === type)?.name} - ${formatCurrency(component.price)}`}
                  />
                </ListItem>
              ))}
            </List>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              Tổng tiền: {formatCurrency(totalPrice)}
            </Typography>

            <Button
              variant="contained"
              fullWidth
              onClick={handleBuildPC}
              disabled={!canBuildPC()}
              sx={{ mt: 2 }}
            >
              Xây dựng PC
            </Button>
          </Paper>
        </Box>
      </Box>

      {/* Compatibility Check */}
      {compatibilityIssues.length > 0 && (
        <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" color="warning.main" gutterBottom>
            Cảnh báo tương thích
          </Typography>
          <List>
            {compatibilityIssues.map((issue, index) => (
              <ListItem key={index} sx={{ px: 0 }}>
                <ListItemText primary={issue} />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Build Result */}
      {buildResult && (
        <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Kết quả xây dựng PC
          </Typography>
          <Typography variant="body1" paragraph>
            {buildResult}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default PCBuilder;
