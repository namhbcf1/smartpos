import React, { useRef, useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
  Stack
} from '@mui/material';
import {
  CameraAlt as CameraIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Check as CheckIcon
} from '@mui/icons-material';

interface CameraCaptureProps {
  open: boolean;
  onClose: () => void;
  onCapture: (imageData: string) => void;
  title?: string;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({
  open,
  onClose,
  onCapture,
  title = "Chụp ảnh giấy tờ"
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        context.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const confirmCapture = useCallback(() => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  }, [capturedImage, onCapture, onClose]);

  const handleClose = useCallback(() => {
    stopCamera();
    setCapturedImage(null);
    setError(null);
    onClose();
  }, [stopCamera, onClose]);

  React.useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [open, startCamera, stopCamera]);

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '500px' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{title}</Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ textAlign: 'center' }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Đang khởi động camera...</Typography>
            </Box>
          )}
          
          {!isLoading && !capturedImage && !error && (
            <Box>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  maxWidth: '600px',
                  height: 'auto',
                  borderRadius: '8px',
                  border: '2px solid #e0e0e0'
                }}
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 3 }}>
                Đặt giấy tờ trong khung hình và nhấn nút chụp
              </Typography>
            </Box>
          )}
          
          {capturedImage && (
            <Box>
              <img
                src={capturedImage}
                alt="Captured document"
                style={{
                  width: '100%',
                  maxWidth: '600px',
                  height: 'auto',
                  borderRadius: '8px',
                  border: '2px solid #4caf50'
                }}
              />
              <Typography variant="body2" color="success.main" sx={{ mt: 2 }}>
                ✓ Ảnh đã được chụp thành công
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Stack direction="row" spacing={2} sx={{ width: '100%', justifyContent: 'center' }}>
          {!capturedImage && !isLoading && !error && (
            <>
              <Button
                variant="outlined"
                onClick={retakePhoto}
                startIcon={<RefreshIcon />}
              >
                Làm mới
              </Button>
              <Button
                variant="contained"
                onClick={capturePhoto}
                startIcon={<CameraIcon />}
                color="primary"
              >
                Chụp ảnh
              </Button>
            </>
          )}
          
          {capturedImage && (
            <>
              <Button
                variant="outlined"
                onClick={retakePhoto}
                startIcon={<RefreshIcon />}
              >
                Chụp lại
              </Button>
              <Button
                variant="contained"
                onClick={confirmCapture}
                startIcon={<CheckIcon />}
                color="success"
              >
                Xác nhận
              </Button>
            </>
          )}
          
          <Button variant="text" onClick={handleClose}>
            Hủy
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default CameraCapture;
