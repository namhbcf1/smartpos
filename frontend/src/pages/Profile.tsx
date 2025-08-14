import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Profile = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Hồ sơ cá nhân
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Typography>Trang hồ sơ cá nhân đang được phát triển...</Typography>
      </Paper>
    </Box>
  );
};

export default Profile; 