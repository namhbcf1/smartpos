import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';

const TestPage: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Trang Test Hoạt Động!
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Nếu bạn thấy trang này, nghĩa là routing đang hoạt động tốt.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Vấn đề có thể là các trang khác đang gọi API không tồn tại hoặc có lỗi trong component.
        </Typography>
        <Button variant="contained" sx={{ mt: 3 }} onClick={() => window.location.reload()}>
          Tải lại
        </Button>
      </Paper>
    </Box>
  );
};

export default TestPage;
