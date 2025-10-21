import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Button, Typography, Container, Paper } from '@mui/material';
import { Error as ErrorIcon, Refresh } from '@mui/icons-material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="sm">
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100vh',
              py: 4,
            }}
          >
            <Paper
              elevation={3}
              sx={{
                p: 4,
                textAlign: 'center',
                width: '100%',
              }}
            >
              <ErrorIcon
                sx={{
                  fontSize: 80,
                  color: 'error.main',
                  mb: 2,
                }}
              />
              <Typography variant="h4" gutterBottom>
                Có lỗi xảy ra
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Xin lỗi, đã có lỗi xảy ra khi tải trang này.
              </Typography>
              {this.state.error && (
                <Typography
                  variant="body2"
                  color="error"
                  sx={{
                    p: 2,
                    bgcolor: 'error.lighter',
                    borderRadius: 1,
                    mb: 3,
                    fontFamily: 'monospace',
                    textAlign: 'left',
                    overflow: 'auto',
                  }}
                >
                  {this.state.error.toString()}
                </Typography>
              )}
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={this.handleReset}
                size="large"
              >
                Tải lại trang
              </Button>
            </Paper>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
