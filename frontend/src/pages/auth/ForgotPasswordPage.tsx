import React, { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, Container, Paper } from '@mui/material';
import { Email } from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { authAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const forgotMutation = useMutation({
    mutationFn: () => authAPI.forgotPassword({ email: formData.email }),
    onSuccess: () => {
      setSuccess('Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.');
    },
    onError: (err: any) => {
      setError(err?.message || 'Yêu cầu thất bại');
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    forgotMutation.mutate();
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <Container maxWidth="sm">
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Quên mật khẩu
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}
          <Card variant="outlined">
            <CardContent>
              <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2 }}>
                <TextField name="email" label="Email" type="email" value={formData.email} onChange={handleChange} required InputProps={{ startAdornment: <Email /> }} />
                <Button type="submit" variant="contained" disabled={forgotMutation.isPending}>
                  {forgotMutation.isPending ? 'Đang gửi...' : 'Gửi hướng dẫn đặt lại'}
                </Button>
                <Button variant="text" onClick={() => navigate('/login')}>
                  Quay lại đăng nhập
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Paper>
      </Container>
    </Box>
  );
};

export default ForgotPasswordPage;
