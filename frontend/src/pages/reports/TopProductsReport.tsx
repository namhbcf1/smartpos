import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  Stack,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { TrendingUp as TopProductsIcon } from '@mui/icons-material';

const TopProductsReport = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Container
      maxWidth="xl"
      sx={{
        py: { xs: 1, sm: 2 },
        px: { xs: 1, sm: 2, md: 3 },
        minHeight: '100vh',
        bgcolor: 'grey.50'
      }}
    >
      {/* Header */}
      <Paper
        elevation={1}
        sx={{
          p: { xs: 2, sm: 3 },
          mb: 3,
          borderRadius: 2,
          bgcolor: 'white'
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
                fontWeight: 600,
                color: 'primary.main',
                mb: 1
              }}
            >
              <TopProductsIcon sx={{ fontSize: 'inherit' }} />
              Báo cáo sản phẩm bán chạy
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              Phân tích sản phẩm bán chạy nhất
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Content */}
      <Paper
        elevation={2}
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Typography
          variant="h6"
          sx={{
            textAlign: 'center',
            color: 'text.secondary',
            py: 4
          }}
        >
          🔥 Trang báo cáo sản phẩm bán chạy đang được phát triển...
        </Typography>
      </Paper>
    </Container>
  );
};

export default TopProductsReport;