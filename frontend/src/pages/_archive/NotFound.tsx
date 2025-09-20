import React from 'react';
import { Container, Typography, Box, Button, Card, CardContent } from '@mui/material';
import { Home, ArrowBack, Search } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h1" sx={{ fontSize: '6rem', fontWeight: 'bold', color: 'primary.main', mb: 2 }}>
            404
          </Typography>
          
          <Typography variant="h4" gutterBottom>
            Trang không tìm thấy
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
          </Typography>
          
          <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
            <Button 
              variant="contained" 
              startIcon={<Home />}
              onClick={() => navigate('/dashboard')}
            >
              Về trang chủ
            </Button>
            
            <Button 
              variant="outlined" 
              startIcon={<ArrowBack />}
              onClick={() => navigate(-1)}
            >
              Quay lại
            </Button>
            
            <Button 
              variant="outlined" 
              startIcon={<Search />}
              onClick={() => navigate('/products')}
            >
              Tìm kiếm sản phẩm
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
