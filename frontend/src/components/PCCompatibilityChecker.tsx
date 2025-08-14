import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Tooltip,
  LinearProgress,
  Stack,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Computer as PCIcon,
  Memory as RAMIcon,
  Storage as StorageIcon,
  Videocam as GPUIcon,
  Power as PSUIcon,
  DeviceHub as MotherboardIcon,
  CheckCircle as CompatibleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Build as BuildIcon,
  Speed as PerformanceIcon,
  TrendingUp as BenchmarkIcon,
  AttachMoney as PriceIcon,
} from '@mui/icons-material';

// 🖥️ PC Component Types
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

interface CompatibilityIssue {
  type: 'error' | 'warning' | 'info';
  component1: string;
  component2: string;
  message: string;
  suggestion?: string;
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

interface PCCompatibilityCheckerProps {
  selectedComponents: PCComponent[];
  onComponentRemove?: (componentId: number) => void;
  onBuildSave?: (build: PCBuild) => void;
  showBuildTools?: boolean;
}

const PCCompatibilityChecker: React.FC<PCCompatibilityCheckerProps> = ({
  selectedComponents,
  onComponentRemove,
  onBuildSave,
  showBuildTools = true,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [issues, setIssues] = useState<CompatibilityIssue[]>([]);
  const [buildDialogOpen, setBuildDialogOpen] = useState(false);
  const [buildName, setBuildName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 🔍 Compatibility Analysis
  const analyzeCompatibility = () => {
    setIsAnalyzing(true);
    const newIssues: CompatibilityIssue[] = [];
    
    const componentsByType = selectedComponents.reduce((acc, component) => {
      if (!acc[component.type]) acc[component.type] = [];
      acc[component.type].push(component);
      return acc;
    }, {} as Record<string, PCComponent[]>);

    // CPU + Motherboard Socket Compatibility
    if (componentsByType.cpu && componentsByType.motherboard) {
      const cpu = componentsByType.cpu[0];
      const motherboard = componentsByType.motherboard[0];
      
      if (cpu.compatibility.socket !== motherboard.compatibility.socket) {
        newIssues.push({
          type: 'error',
          component1: cpu.name,
          component2: motherboard.name,
          message: `Socket không tương thích: ${cpu.compatibility.socket} vs ${motherboard.compatibility.socket}`,
          suggestion: 'Chọn CPU và Motherboard có cùng socket'
        });
      }
    }

    // RAM + Motherboard Compatibility
    if (componentsByType.ram && componentsByType.motherboard) {
      const ram = componentsByType.ram[0];
      const motherboard = componentsByType.motherboard[0];
      
      if (ram.compatibility.memoryType !== motherboard.compatibility.memoryType) {
        newIssues.push({
          type: 'error',
          component1: ram.name,
          component2: motherboard.name,
          message: `Loại RAM không tương thích: ${ram.compatibility.memoryType} vs ${motherboard.compatibility.memoryType}`,
          suggestion: 'Chọn RAM phù hợp với motherboard'
        });
      }
    }

    // Power Supply Check
    if (componentsByType.psu) {
      const psu = componentsByType.psu[0];
      const totalPowerNeeded = selectedComponents.reduce((total, component) => {
        return total + (component.compatibility.powerRequirement || 0);
      }, 0);

      const psuWattage = psu.specifications.wattage || 0;
      
      if (totalPowerNeeded > psuWattage * 0.8) { // 80% rule
        newIssues.push({
          type: 'warning',
          component1: psu.name,
          component2: 'Tổng hệ thống',
          message: `PSU có thể không đủ công suất: ${psuWattage}W vs ${totalPowerNeeded}W cần thiết`,
          suggestion: 'Nên chọn PSU có công suất cao hơn 20-30%'
        });
      }
    }

    // GPU + Case Clearance
    if (componentsByType.gpu && componentsByType.case) {
      const gpu = componentsByType.gpu[0];
      const pcCase = componentsByType.case[0];
      
      const gpuLength = gpu.specifications.length || 0;
      const caseGpuClearance = pcCase.specifications.gpuClearance || 0;
      
      if (gpuLength > caseGpuClearance) {
        newIssues.push({
          type: 'error',
          component1: gpu.name,
          component2: pcCase.name,
          message: `GPU quá dài cho case: ${gpuLength}mm vs ${caseGpuClearance}mm`,
          suggestion: 'Chọn case lớn hơn hoặc GPU nhỏ hơn'
        });
      }
    }

    setTimeout(() => {
      setIssues(newIssues);
      setIsAnalyzing(false);
    }, 1500); // Simulate analysis time
  };

  useEffect(() => {
    if (selectedComponents.length > 1) {
      analyzeCompatibility();
    } else {
      setIssues([]);
    }
  }, [selectedComponents]);

  // 📊 Calculate Performance Score
  const calculatePerformance = (): PCBuild['estimatedPerformance'] => {
    // Simplified performance calculation
    const cpu = selectedComponents.find(c => c.type === 'cpu');
    const gpu = selectedComponents.find(c => c.type === 'gpu');
    const ram = selectedComponents.find(c => c.type === 'ram');

    const cpuScore = cpu?.specifications.benchmarkScore || 50;
    const gpuScore = gpu?.specifications.benchmarkScore || 50;
    const ramScore = ram?.specifications.speed ? Math.min(ram.specifications.speed / 100, 100) : 50;

    return {
      gaming: Math.round((gpuScore * 0.6 + cpuScore * 0.3 + ramScore * 0.1)),
      productivity: Math.round((cpuScore * 0.6 + ramScore * 0.3 + gpuScore * 0.1)),
      overall: Math.round((cpuScore + gpuScore + ramScore) / 3),
    };
  };

  // 💰 Calculate Total Price
  const totalPrice = selectedComponents.reduce((sum, component) => sum + component.price, 0);

  // 🎨 Get Issue Icon and Color
  const getIssueIcon = (type: CompatibilityIssue['type']) => {
    switch (type) {
      case 'error': return <ErrorIcon color="error" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'info': return <InfoIcon color="info" />;
      default: return <InfoIcon />;
    }
  };

  const getIssueColor = (type: CompatibilityIssue['type']) => {
    switch (type) {
      case 'error': return 'error.main';
      case 'warning': return 'warning.main';
      case 'info': return 'info.main';
      default: return 'text.secondary';
    }
  };

  // 🏗️ Handle Build Save
  const handleSaveBuild = () => {
    if (!buildName.trim()) return;

    const componentsByType = selectedComponents.reduce((acc, component) => {
      if (component.type === 'ram' || component.type === 'storage') {
        if (!acc[component.type]) acc[component.type] = [];
        acc[component.type].push(component);
      } else {
        acc[component.type] = component;
      }
      return acc;
    }, {} as any);

    const build: PCBuild = {
      name: buildName,
      components: componentsByType,
      totalPrice,
      estimatedPerformance: calculatePerformance(),
    };

    onBuildSave?.(build);
    setBuildDialogOpen(false);
    setBuildName('');
  };

  const performance = calculatePerformance();
  const hasErrors = issues.some(issue => issue.type === 'error');
  const hasWarnings = issues.some(issue => issue.type === 'warning');

  return (
    <Box>
      {/* 🎯 Compatibility Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6" display="flex" alignItems="center" gap={1}>
              <BuildIcon color="primary" />
              Kiểm tra tương thích PC
            </Typography>
            {isAnalyzing && <LinearProgress sx={{ width: 100 }} />}
          </Box>

          {selectedComponents.length === 0 ? (
            <Alert severity="info">
              Chọn linh kiện để kiểm tra tương thích
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {/* Status Overview */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, bgcolor: hasErrors ? 'error.50' : hasWarnings ? 'warning.50' : 'success.50' }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    {hasErrors ? (
                      <ErrorIcon color="error" />
                    ) : hasWarnings ? (
                      <WarningIcon color="warning" />
                    ) : (
                      <CompatibleIcon color="success" />
                    )}
                    <Typography variant="subtitle1" fontWeight={600}>
                      {hasErrors ? 'Có lỗi tương thích' : hasWarnings ? 'Có cảnh báo' : 'Tương thích tốt'}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {issues.length} vấn đề được phát hiện
                  </Typography>
                </Paper>
              </Grid>

              {/* Price & Performance */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Stack spacing={1}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Tổng giá:</Typography>
                      <Typography variant="h6" color="primary.main">
                        {totalPrice.toLocaleString('vi-VN')} ₫
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Hiệu năng:</Typography>
                      <Chip 
                        label={`${performance.overall}/100`} 
                        color={performance.overall >= 80 ? 'success' : performance.overall >= 60 ? 'warning' : 'error'}
                        size="small"
                      />
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* 🚨 Issues List */}
      {issues.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Vấn đề tương thích
            </Typography>
            <List>
              {issues.map((issue, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemIcon>
                      {getIssueIcon(issue.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={issue.message}
                      secondary={issue.suggestion}
                      primaryTypographyProps={{
                        color: getIssueColor(issue.type)
                      }}
                    />
                  </ListItem>
                  {index < issues.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* 📊 Performance Breakdown */}
      {selectedComponents.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
              <PerformanceIcon color="primary" />
              Hiệu năng dự kiến
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary.main">
                    {performance.gaming}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Gaming
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box textAlign="center">
                  <Typography variant="h4" color="secondary.main">
                    {performance.productivity}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Productivity
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box textAlign="center">
                  <Typography variant="h4" color="success.main">
                    {performance.overall}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng thể
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* 🛠️ Build Actions */}
      {showBuildTools && selectedComponents.length > 0 && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                Hành động
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<BenchmarkIcon />}
                  size="small"
                >
                  So sánh
                </Button>
                <Button
                  variant="contained"
                  startIcon={<BuildIcon />}
                  onClick={() => setBuildDialogOpen(true)}
                  disabled={hasErrors}
                >
                  Lưu Build
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* 💾 Save Build Dialog */}
      <Dialog open={buildDialogOpen} onClose={() => setBuildDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Lưu cấu hình PC</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tên cấu hình"
            fullWidth
            variant="outlined"
            value={buildName}
            onChange={(e) => setBuildName(e.target.value)}
            placeholder="VD: Gaming Build 2024, Office PC..."
          />
          <Alert severity="info" sx={{ mt: 2 }}>
            Cấu hình này sẽ được lưu để sử dụng sau hoặc chia sẻ với khách hàng.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBuildDialogOpen(false)}>Hủy</Button>
          <Button 
            onClick={handleSaveBuild} 
            variant="contained"
            disabled={!buildName.trim()}
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PCCompatibilityChecker;