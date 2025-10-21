import React, { useRef, useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Stack,
  Alert,
  TextField,
  Typography,
  IconButton,
} from '@mui/material';
import {
  QrCodeScanner,
  Close,
  CameraAlt,
  HelpOutline,
} from '@mui/icons-material';

interface QRScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
}

export default function QRCodeScanner({ open, onClose, onScan }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [manualInput, setManualInput] = useState('');

  const startCamera = async () => {
    try {
      setError('');
      setScanning(true);
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      setError('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập camera và thử lại.');
      setScanning(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  const handleManualInputSubmit = () => {
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      onClose();
      setManualInput('');
    }
  };

  useEffect(() => {
    if (open && !window.isSecureContext) {
      setError('Trình duyệt này không hỗ trợ camera. Vui lòng sử dụng HTTPS hoặc trình duyệt khác.');
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
      setError('');
    }

    return () => {
      stopCamera();
    };
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <QrCodeScanner />
            <Typography variant="h6">Quét mã QR/Barcode</Typography>
          </Stack>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={2}>
          {error && (
            <Alert severity="error">
              <Typography variant="body2">{error}</Typography>
            </Alert>
          )}

          <Alert severity="info">
            <Typography variant="body2">
              📱 Hướng dẫn: Đưa camera vào mã QR/barcode trên sản phẩm để quét tự động.
              Đảm bảo mã nằm trong khung quét để hệ thống có thể nhận diện.
            </Typography>
          </Alert>

          {/* Camera Video */}
          <Box 
            sx={{ 
              position: 'relative',
              width: '100%',
              height: '300px',
              border: '2px dashed #ccc',
              borderRadius: 2,
              overflow: 'hidden',
              bgcolor: 'black',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <video
              ref={videoRef}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              playsInline
              muted
            />
            
            {/* Scanning Frame */}
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '200px',
                height: '200px',
                border: '2px solid #1976d2',
                borderRadius: '8px',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '-2px',
                  left: '-2px',
                  width: '20px',
                  height: '20px',
                  border: '4px solid #1976d2',
                  borderRight: 'none',
                  borderBottom: 'none',
                  borderRadius: '8px 0 0 0'
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '20px',
                  height: '20px',
                  border: '4px solid #1976d2',
                  borderLeft: 'none',
                  borderBottom: 'none',
                  borderRadius: '0 8px 0 0'
                }
              }}
            />
            
            {/* Help Icon */}
            <IconButton
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'rgba(255, 255, 255, 0.8)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.9)'
                }
              }}
              onClick={() => setError(prev => prev + ' Camera ready for scanning. Hold steady and point at QR code.')}
            >
              <HelpOutline />
            </IconButton>
          </Box>

          {/* Manual Input */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Hoặc nhập mã thủ công:
            </Typography>
            <Stack direction="row" spacing={1}>
              <TextField
                fullWidth
                size="small"
                placeholder="Nhập serial number hoặc mã sản phẩm"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleManualInputSubmit()}
              />
              <Button 
                variant="contained" 
                onClick={handleManualInputSubmit}
                disabled={!manualInput.trim()}
                startIcon={<CameraAlt />}
              >
                Nhập
              </Button>
            </Stack>
          </Box>

          {/* Tips */}
          <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              💡 <strong>Mẹo:</strong> Để có kết quả tốt nhất, hãy đảm bảo:
              <br />• Ánh sáng đủ tốt
              <br />• Giữ máy ổn định
              <br />• Mã QR/barcode không bị mờ hoặc hỏng
              <br />• Camera cách mã khoảng 10-30cm
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Đóng</Button>
        <Button 
          variant="contained" 
          onClick={scanning ? stopCamera : startCamera}
          disabled={!window.isSecureContext}
        >
          {scanning ? 'Tạm dừng camera' : 'Bật camera'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}