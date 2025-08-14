import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import { Store, Inventory, Assessment, Settings, Home } from '@mui/icons-material';
import POSPage from './pages/POSPage';
import { APP_URLS, MAIN_HUB_URL } from '@shared/types';

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
          <Store sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            SmartPOS - Điểm Bán Hàng
          </Typography>

          {/* Back to main hub */}
          <Button
            color="inherit"
            startIcon={<Home />}
            onClick={() => navigateToApp(MAIN_HUB_URL)}
            sx={{ mr: 2, bgcolor: 'rgba(255,255,255,0.1)' }}
          >
            Trang chính
          </Button>

          {/* Quick navigation to other modules */}
          <Button
            color="inherit"
            startIcon={<Inventory />}
            onClick={() => navigateToApp(APP_URLS.inventory)}
            sx={{ mr: 1 }}
          >
            Kho hàng
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
          <Route path="/" element={<POSPage />} />
          <Route path="/pos" element={<POSPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Container>
    </Box>
  );
}

export default App;
