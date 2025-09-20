import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import {
  Avatar,
  Button,
  TextField,
  Paper,
  Box,
  Grid,
  Typography,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  LockOutlined as LockIcon,
  Visibility,
  VisibilityOff,
  PersonOutline,
  Business,
  Computer,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';

import { useAuth } from '../../hooks/useAuth';

interface LoginFormData {
  username: string;
  password: string;
}

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // If already authenticated, redirect to dashboard
  React.useEffect(() => {
    console.log('Login: isAuthenticated changed:', isAuthenticated);
    if (isAuthenticated) {
      console.log('Login: Redirecting to dashboard...');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      username: '', // SECURITY FIXED: Removed hardcoded credentials
      password: '', // SECURITY FIXED: Removed hardcoded credentials
    },
    mode: 'onSubmit', // Validate on submit to show errors
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      console.log('Login: Attempting login...');
      await login(data.username, data.password);
      console.log('Login: Login API call successful');
      toast.success('Đăng nhập thành công');

      // Small delay to ensure auth state is properly updated
      setTimeout(() => {
        console.log('Login: Manual redirect after timeout');
        navigate('/dashboard', { replace: true });
      }, 200);
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Cpath d="m0 40l40-40h-40z"/%3E%3Cpath d="m0 40l40-40h-40z"/%3E%3C/g%3E%3C/svg%3E")',
          zIndex: 0,
        }
      }}
    >
      <Card
        elevation={24}
        sx={{
          minWidth: { xs: '100%', sm: 480, md: 520 },
          maxWidth: 520,
          position: 'relative',
          zIndex: 1,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: 4,
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
              }}
            >
              <Box
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '50%',
                  p: 2,
                  mr: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
                }}
              >
                <Computer sx={{ color: 'white', fontSize: 32 }} />
              </Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.5px',
                }}
              >
                ComputerPOS Pro
              </Typography>
            </Box>
            
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                mb: 1,
              }}
            >
              Hệ thống POS 100% Online
            </Typography>
            
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                fontSize: '1.1rem',
              }}
            >
              Cloudflare Workers + D1 Database
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Đăng nhập hệ thống
            </Typography>
          </Divider>
          <Alert 
            severity="info" 
            sx={{ 
              mb: 3, 
              backgroundColor: 'rgba(25, 118, 210, 0.08)',
              border: '1px solid rgba(25, 118, 210, 0.2)',
              borderRadius: 2,
              '& .MuiAlert-icon': {
                color: 'primary.main'
              }
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              <strong>Tài khoản demo:</strong><br />
              Username: <code style={{ background: 'rgba(25, 118, 210, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>admin</code><br />
              Password: <code style={{ background: 'rgba(25, 118, 210, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>admin123</code>
            </Typography>
          </Alert>
          
          <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1, width: '100%' }}>
            <Controller
              name="username"
              control={control}
              rules={{
                required: 'Username is required',
                minLength: {
                  value: 3,
                  message: 'Username must be at least 3 characters'
                }
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  required
                  fullWidth
                  id="username"
                  name="username"
                  label="Tên đăng nhập hoặc Email"
                  placeholder="admin"
                  autoComplete="off"
                  autoFocus
                  error={!!errors.username}
                  helperText={errors.username?.message}
                  disabled={isSubmitting}
                  aria-label="Username input field"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutline sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'rgba(255, 255, 255, 1)',
                        boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                      }
                    }
                  }}
                />
              )}
            />
            
            <Controller
              name="password"
              control={control}
              rules={{
                required: 'Password is required',
                minLength: {
                  value: 3,
                  message: 'Password must be at least 3 characters'
                }
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  required
                  fullWidth
                  label="Mật khẩu"
                  placeholder="admin123"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  autoComplete="off"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  disabled={isSubmitting}
                  aria-label="Password input field"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{ color: 'text.secondary' }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'rgba(255, 255, 255, 1)',
                        boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                      }
                    }
                  }}
                />
              )}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isSubmitting}
              sx={{ 
                mt: 3, 
                mb: 2, 
                py: 1.8,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                  boxShadow: '0 12px 32px rgba(102, 126, 234, 0.4)',
                  transform: 'translateY(-2px)',
                },
                '&:active': {
                  transform: 'translateY(0px)',
                },
                transition: 'all 0.3s ease',
              }}
              aria-label="Sign in button"
            >
              {isSubmitting ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} color="inherit" />
                  <span>Đang xử lý...</span>
                </Box>
              ) : (
                'Đăng nhập'
              )}
            </Button>
            
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Chưa có tài khoản?{' '}
                <Link
                  to="/register"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textDecoration: 'none',
                    fontWeight: 600,
                    borderBottom: '2px solid transparent',
                    transition: 'border-bottom 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderBottom = '2px solid #667eea';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderBottom = '2px solid transparent';
                  }}
                >
                  Đăng ký ngay
                </Link>
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                © 2024 ComputerPOS Pro - 100% Online POS System<br />
                <strong>Powered by Cloudflare Workers + D1 Database</strong>
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login; 
