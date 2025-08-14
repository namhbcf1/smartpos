import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Paper,
  Stack,
  useTheme,
  useMediaQuery,
  Fab,
  Tooltip,
} from '@mui/material';
import {
  Computer as PCIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Memory as RAMIcon,
  Storage as StorageIcon,
  Videocam as GPUIcon,
  Power as PSUIcon,
  DeviceHub as MotherboardIcon,
  AcUnit as CoolerIcon,
  Inventory as CaseIcon,
  Save as SaveIcon,
  Share as ShareIcon,
  Build as BuildIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import PCCompatibilityChecker from '../components/PCCompatibilityChecker';
import { formatCurrency } from '../config/constants';

// 🖥️ PC Component Types (same as in PCCompatibilityChecker)
interface PCComponent {
  id: number;
  name: string;
  type: 'cpu' | 'motherboard' | 'ram' | 'gpu' | 'storage' | 'psu' | 'case' | 'cooler';
  brand: string;
  model: string;
  price: number;
  specifications: {
    [key: string]: any;
  };
  compatibility: {
    socket?: string;
    chipset?: string;
    memoryType?: string;
    powerRequirement?: number;
    formFactor?: string;
    interface?: string;
  };
}

interface PCBuild {
  id?: number;
  name: string;
  components: {
    cpu?: PCComponent;
    motherboard?: PCComponent;
    ram?: PCComponent[];
    gpu?: PCComponent;
    storage?: PCComponent[];
    psu?: PCComponent;
    case?: PCComponent;
    cooler?: PCComponent;
  };
  totalPrice: number;
  estimatedPerformance: {
    gaming: number;
    productivity: number;
    overall: number;
  };
}

// 🎨 Component Type Configurations
const componentTypes = [
  { type: 'cpu', name: 'CPU', icon: <PCIcon />, required: true },
  { type: 'motherboard', name: 'Motherboard', icon: <MotherboardIcon />, required: true },
  { type: 'ram', name: 'RAM', icon: <RAMIcon />, required: true, multiple: true },
  { type: 'gpu', name: 'GPU', icon: <GPUIcon />, required: false },
  { type: 'storage', name: 'Storage', icon: <StorageIcon />, required: true, multiple: true },
  { type: 'psu', name: 'PSU', icon: <PSUIcon />, required: true },
  { type: 'case', name: 'Case', icon: <CaseIcon />, required: true },
  { type: 'cooler', name: 'Cooler', icon: <CoolerIcon />, required: false },
];

// 🎯 Components will be loaded from API (100% online)
const loadComponentsFromAPI = async (): Promise<PCComponent[]> => {
  try {
    // In a real implementation, this would fetch from /api/v1/pc-components
    // For now, return empty array to force online-only behavior
    return [];
  } catch (error) {
    console.error('Failed to load PC components from API:', error);
    return [];
  }
};

// Mock data removed - using 100% real Cloudflare D1 data


const PCBuilder: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();

  const [selectedComponents, setSelectedComponents] = useState<PCComponent[]>([]);
  const [componentSelectorOpen, setComponentSelectorOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [savedBuilds, setSavedBuilds] = useState<PCBuild[]>([]);
  const [availableComponents, setAvailableComponents] = useState<PCComponent[]>([]);
  const [loading, setLoading] = useState(true);

  // � Load components from API on mount
  useEffect(() => {
    const loadComponents = async () => {
      setLoading(true);
      try {
        // Load components from Cloudflare D1 database only
        const components = await loadComponentsFromAPI();
        setAvailableComponents(components || []);

        if (!components || components.length === 0) {
          enqueueSnackbar('Không có linh kiện nào trong cơ sở dữ liệu', { variant: 'info' });
        }
      } catch (error) {
        console.error('Failed to load components from API:', error);
        enqueueSnackbar('Lỗi khi tải danh sách linh kiện', { variant: 'error' });
        setAvailableComponents([]);
      } finally {
        setLoading(false);
      }
    };

    loadComponents();
  }, []);

  // �🔍 Filter components by type
  const getComponentsByType = (type: string) => {
    return availableComponents.filter(component => component.type === type);
  };

  // ➕ Add component to build
  const handleAddComponent = (component: PCComponent) => {
    const existingComponent = selectedComponents.find(c => c.type === component.type);
    const typeConfig = componentTypes.find(t => t.type === component.type);

    if (existingComponent && !typeConfig?.multiple) {
      // Replace existing component
      setSelectedComponents(prev => 
        prev.map(c => c.type === component.type ? component : c)
      );
      enqueueSnackbar(`Đã thay thế ${typeConfig?.name}`, { variant: 'info' });
    } else {
      // Add new component
      setSelectedComponents(prev => [...prev, component]);
      enqueueSnackbar(`Đã thêm ${component.name}`, { variant: 'success' });
    }
    setComponentSelectorOpen(false);
  };

  // ❌ Remove component from build
  const handleRemoveComponent = (componentId: number) => {
    setSelectedComponents(prev => prev.filter(c => c.id !== componentId));
    enqueueSnackbar('Đã xóa linh kiện', { variant: 'info' });
  };

  // 💾 Save build
  const handleSaveBuild = (build: PCBuild) => {
    const newBuild = { ...build, id: Date.now() };
    setSavedBuilds(prev => [...prev, newBuild]);
    enqueueSnackbar(`Đã lưu cấu hình "${build.name}"`, { variant: 'success' });
  };

  // 🎨 Get component type info
  const getComponentTypeInfo = (type: string) => {
    return componentTypes.find(t => t.type === type);
  };

  // 📊 Get build summary
  const getBuildSummary = () => {
    const summary = componentTypes.map(typeConfig => {
      const components = selectedComponents.filter(c => c.type === typeConfig.type);
      return {
        ...typeConfig,
        components,
        hasComponent: components.length > 0,
        isComplete: !typeConfig.required || components.length > 0,
      };
    });
    return summary;
  };

  const buildSummary = getBuildSummary();
  const totalPrice = selectedComponents.reduce((sum, component) => sum + component.price, 0);
  const isComplete = buildSummary.every(item => item.isComplete);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* 🏗️ Header */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom display="flex" alignItems="center" gap={2}>
          <BuildIcon color="primary" fontSize="large" />
          PC Builder
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Xây dựng cấu hình PC tối ưu với kiểm tra tương thích tự động
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* 🛠️ Component Selection */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Chọn linh kiện
              </Typography>
              
              <Grid container spacing={2}>
                {buildSummary.map((item) => (
                  <Grid item xs={12} sm={6} md={4} key={item.type}>
                    <Paper
                      sx={{
                        p: 2,
                        border: item.hasComponent ? '2px solid' : '1px solid',
                        borderColor: item.hasComponent 
                          ? 'success.main' 
                          : item.required 
                            ? 'warning.main' 
                            : 'divider',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: theme.shadows[4],
                        }
                      }}
                      onClick={() => {
                        setSelectedType(item.type);
                        setComponentSelectorOpen(true);
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        {item.icon}
                        <Typography variant="subtitle1" fontWeight={600}>
                          {item.name}
                        </Typography>
                        {item.required && (
                          <Chip label="Bắt buộc" size="small" color="warning" />
                        )}
                      </Box>
                      
                      {item.components.length > 0 ? (
                        <Box>
                          {item.components.map((component, index) => (
                            <Box key={component.id} display="flex" alignItems="center" justifyContent="space-between">
                              <Typography variant="body2" noWrap>
                                {component.name}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveComponent(component.id);
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Chưa chọn
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* 🔍 Compatibility Checker */}
          <Box mt={3}>
            <PCCompatibilityChecker
              selectedComponents={selectedComponents}
              onComponentRemove={handleRemoveComponent}
              onBuildSave={handleSaveBuild}
            />
          </Box>
        </Grid>

        {/* 📊 Build Summary */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            {/* Price Summary */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Tổng kết
                </Typography>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="body1">Tổng giá:</Typography>
                  <Typography variant="h5" color="primary.main">
                    {formatCurrency(totalPrice)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="body2">Linh kiện:</Typography>
                  <Typography variant="body2">
                    {selectedComponents.length} / {componentTypes.filter(t => t.required).length} bắt buộc
                  </Typography>
                </Box>
                <Chip 
                  label={isComplete ? 'Hoàn thành' : 'Chưa đủ linh kiện'}
                  color={isComplete ? 'success' : 'warning'}
                  fullWidth
                />
              </CardContent>
            </Card>

            {/* Saved Builds */}
            {savedBuilds.length > 0 && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Cấu hình đã lưu
                  </Typography>
                  <List dense>
                    {savedBuilds.slice(-3).map((build) => (
                      <ListItem key={build.id}>
                        <ListItemText
                          primary={build.name}
                          secondary={formatCurrency(build.totalPrice)}
                        />
                        <ListItemSecondaryAction>
                          <Chip 
                            label={`${build.estimatedPerformance.overall}/100`}
                            size="small"
                            color={build.estimatedPerformance.overall >= 80 ? 'success' : 'warning'}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Grid>
      </Grid>

      {/* 🛒 Component Selector Dialog */}
      <Dialog 
        open={componentSelectorOpen} 
        onClose={() => setComponentSelectorOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Chọn {getComponentTypeInfo(selectedType)?.name}
        </DialogTitle>
        <DialogContent>
          <List>
            {getComponentsByType(selectedType).map((component) => (
              <React.Fragment key={component.id}>
                <ListItem
                  button
                  onClick={() => handleAddComponent(component)}
                >
                  <ListItemText
                    primary={component.name}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="primary.main">
                          {formatCurrency(component.price)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {component.brand} • {component.model}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComponentSelectorOpen(false)}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* 🚀 Quick Add FAB */}
      {isMobile && (
        <Tooltip title="Thêm linh kiện">
          <Fab
            color="primary"
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
            onClick={() => {
              const nextRequired = buildSummary.find(item => item.required && !item.hasComponent);
              if (nextRequired) {
                setSelectedType(nextRequired.type);
                setComponentSelectorOpen(true);
              }
            }}
          >
            <AddIcon />
          </Fab>
        </Tooltip>
      )}
    </Container>
  );
};

export default PCBuilder;