import React from 'react';
import {
  Box,
  Button,
  Typography,
  Stack,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Assignment as CheckIcon
} from '@mui/icons-material';
import { StockCheckSession } from './types';

interface StockCheckHeaderProps {
  session: StockCheckSession | null;
  onBack: () => void;
  onSave: () => void;
  onRefresh: () => void;
  loading: boolean;
}

export const StockCheckHeader: React.FC<StockCheckHeaderProps> = ({
  session,
  onBack,
  onSave,
  onRefresh,
  loading
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'in_progress': return 'Đang kiểm';
      case 'cancelled': return 'Đã hủy';
      default: return 'Chưa xác định';
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Stack
        direction={isMobile ? 'column' : 'row'}
        justifyContent="space-between"
        alignItems={isMobile ? 'stretch' : 'center'}
        spacing={2}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Button
            startIcon={<BackIcon />}
            onClick={onBack}
            variant="outlined"
            size={isMobile ? 'small' : 'medium'}
          >
            Quay lại
          </Button>
          
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              <CheckIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Kiểm kho
            </Typography>
            
            {session && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Phiên: {session.session_name}
                </Typography>
                <Chip
                  label={getStatusLabel(session.status)}
                  color={getStatusColor(session.status) as any}
                  size="small"
                />
              </Stack>
            )}
          </Box>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
            variant="outlined"
            disabled={loading}
            size={isMobile ? 'small' : 'medium'}
          >
            Làm mới
          </Button>
          
          <Button
            startIcon={<SaveIcon />}
            onClick={onSave}
            variant="contained"
            disabled={loading || !session}
            size={isMobile ? 'small' : 'medium'}
          >
            Lưu kiểm kho
          </Button>
        </Stack>
      </Stack>

      {session && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
          <Stack direction="row" spacing={4}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Tổng sản phẩm
              </Typography>
              <Typography variant="h6">
                {session.total_items}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary">
                Đã kiểm
              </Typography>
              <Typography variant="h6" color="primary">
                {session.items_checked}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary">
                Sai lệch
              </Typography>
              <Typography variant="h6" color="error">
                {session.discrepancies_found}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary">
                Tiến độ
              </Typography>
              <Typography variant="h6" color="success.main">
                {session.total_items > 0 
                  ? Math.round((session.items_checked / session.total_items) * 100)
                  : 0}%
              </Typography>
            </Box>
          </Stack>
        </Box>
      )}
    </Box>
  );
};
