import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Button,
  Paper,
  Alert,
  Chip
} from '@mui/material';
import {
  InventoryRounded as InventoryIcon,
  SwapHoriz as TransferIcon,
  TuneRounded as AdjustmentIcon,
  CountertopsRounded as CountIcon,
  FileDownload as ExportIcon,
  FileUpload as ImportIcon,
  Assessment as ReportIcon,
  Timeline as MovementIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import StockAdjustmentManager from '../../components/inventory/StockAdjustmentManager';
import CycleCountManager from '../../components/inventory/CycleCountManager';
import InventoryCSVManager from '../../components/inventory/InventoryCSVManager';
import StockTransfer from './StockTransfer';

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
      id={`inventory-tabpanel-${index}`}
      aria-labelledby={`inventory-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `inventory-tab-${index}`,
    'aria-controls': `inventory-tabpanel-${index}`,
  };
}

const InventoryOperations: React.FC = () => {
  const { hasPermission, user } = useAuth() as any;
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const tabs = [
    {
      label: 'Điều chỉnh tồn kho',
      icon: <AdjustmentIcon />,
      permission: 'inventory.adjust',
      component: <StockAdjustmentManager />
    },
    {
      label: 'Chuyển kho',
      icon: <TransferIcon />,
      permission: 'inventory.transfer',
      component: <StockTransfer />
    },
    {
      label: 'Kiểm kê định kỳ',
      icon: <CountIcon />,
      permission: 'inventory.adjust',
      component: <CycleCountManager />
    },
    {
      label: 'Xuất/Nhập dữ liệu',
      icon: <ImportIcon />,
      permission: 'inventory.import',
      component: <InventoryCSVManager />
    }
  ];

  // If permission checker is missing or user is ADMIN, allow all tabs
  const isAdmin = (user?.role || '').toUpperCase() === 'ADMIN';
  const permissionFn = typeof hasPermission === 'function' ? hasPermission : undefined;
  let availableTabs = permissionFn ? tabs.filter(tab => permissionFn(tab.permission)) : tabs;
  if (availableTabs.length === 0 || isAdmin) {
    availableTabs = tabs;
  }

  if (availableTabs.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Bạn không có quyền truy cập các chức năng quản lý kho.
          Vui lòng liên hệ quản trị viên để được cấp quyền.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InventoryIcon />
          Quản lý tồn kho
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Điều chỉnh, chuyển kho, kiểm kê và quản lý dữ liệu tồn kho
        </Typography>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3} component="div">
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" color="primary">
                    Điều chỉnh
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tăng/giảm tồn kho
                  </Typography>
                </Box>
                <AdjustmentIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
              {hasPermission?.('inventory.adjust') && (
                <Button
                  size="small"
                  onClick={() => setActiveTab(0)}
                  sx={{ mt: 1 }}
                >
                  Thực hiện
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3} component="div">
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" color="info.main">
                    Chuyển kho
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Di chuyển giữa kho
                  </Typography>
                </Box>
                <TransferIcon color="info" sx={{ fontSize: 40 }} />
              </Box>
              {hasPermission?.('inventory.transfer') && (
                <Button
                  size="small"
                  onClick={() => setActiveTab(1)}
                  sx={{ mt: 1 }}
                >
                  Thực hiện
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3} component="div">
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" color="warning.main">
                    Kiểm kê
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Đếm và đối chiếu
                  </Typography>
                </Box>
                <CountIcon color="warning" sx={{ fontSize: 40 }} />
              </Box>
              {hasPermission?.('inventory.adjust') && (
                <Button
                  size="small"
                  onClick={() => setActiveTab(2)}
                  sx={{ mt: 1 }}
                >
                  Bắt đầu
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3} component="div">
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" color="success.main">
                    Dữ liệu
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Xuất/nhập CSV
                  </Typography>
                </Box>
                <ImportIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
              {hasPermission?.('inventory.import') && (
                <Button
                  size="small"
                  onClick={() => setActiveTab(3)}
                  sx={{ mt: 1 }}
                >
                  Quản lý
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="inventory operations tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            {availableTabs.map((tab, index) => (
              <Tab
                key={index}
                icon={tab.icon}
                iconPosition="start"
                label={tab.label}
                {...a11yProps(index)}
                sx={{ minHeight: 72, textTransform: 'none' }}
              />
            ))}
          </Tabs>
        </Box>

        {availableTabs.map((tab, index) => (
          <TabPanel key={index} value={activeTab} index={index}>
            {tab.component}
          </TabPanel>
        ))}
      </Paper>

      {/* User Info */}
      <Box sx={{ mt: 3 }}>
        <Alert severity="info" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2">
            Đăng nhập với vai trò: <Chip label={user?.role || 'N/A'} size="small" color="primary" />
          </Typography>
          <Typography variant="body2" sx={{ ml: 2 }}>
            Quyền hiện tại:
            {availableTabs.map((tab, index) => (
              <Chip
                key={index}
                label={tab.label}
                size="small"
                variant="outlined"
                sx={{ ml: 0.5 }}
              />
            ))}
          </Typography>
        </Alert>
      </Box>
    </Container>
  );
};

export default InventoryOperations;
