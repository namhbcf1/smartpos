import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import { Inventory, Store, Assessment, Settings } from '@mui/icons-material';
import InventoryPage from './pages/InventoryPage';
import { APP_URLS } from '@shared/types';

// Navigation to other apps
const navigateToApp = (url: string) => {
  window.open(url, '_blank');
};

function App() {
  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Top Navigation */}
      <AppBar position="static" sx={{ bgcolor: 'primary.main' }}>
        <Toolbar>
          <Inventory sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            SmartPOS - Quản Lý Kho Hàng
          </Typography>
          
          {/* Quick navigation to other apps */}
          <Button 
            color="inherit" 
            startIcon={<Store />}
            onClick={() => navigateToApp(APP_URLS.pos)}
            sx={{ mr: 1 }}
          >
            Bán hàng
          </Button>
          <Button 
            color="inherit" 
            startIcon={<Assessment />}
            onClick={() => navigateToApp(APP_URLS.reports)}
            sx={{ mr: 1 }}
          >
            Báo cáo
          </Button>
          <Button 
            color="inherit" 
            startIcon={<Settings />}
            onClick={() => navigateToApp(APP_URLS.admin)}
          >
            Quản trị
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth={false} sx={{ mt: 2, px: 2 }}>
        <Routes>
          <Route path="/" element={<InventoryPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/products" element={<InventoryPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Container>
    </Box>
  );
}

export default App;
