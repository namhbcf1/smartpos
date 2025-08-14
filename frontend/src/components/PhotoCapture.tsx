import React, { useState, useRef, useCallback } from 'react';
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
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  Tooltip
} from '@mui/material';
import {
  PhotoCamera as CameraIcon,
  Close as CloseIcon,
  FlipCameraIos as FlipIcon,
  Flash as FlashIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

interface CapturedPhoto {
  id: string;
  dataUrl: string;
  timestamp: Date;
  size: number;
  filename: string;
}

interface PhotoCaptureProps {
  open: boolean;
  onClose: () => void;
  onPhotosCapture: (photos: CapturedPhoto[]) => void;
  maxPhotos?: number;
  productName?: string;
  stockInId?: string;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  open,
  onClose,
  onPhotosCapture,
  maxPhotos = 5,
  productName,
  stockInId
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [currentCamera, setCurrentCamera] = useState<'user' | 'environment'>('environment');
  const [loading, setLoading] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      setLoading(true);
      
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: currentCamera,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      enqueueSnackbar('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [currentCamera, enqueueSnackbar]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || capturedPhotos.length >= maxPhotos) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    const timestamp = new Date();
    const filename = `stock_in_${stockInId || 'new'}_${timestamp.getTime()}.jpg`;

    // Calculate approximate file size
    const size = Math.round((dataUrl.length * 3) / 4);

    const newPhoto: CapturedPhoto = {
      id: `photo_${timestamp.getTime()}`,
      dataUrl,
      timestamp,
      size,
      filename
    };

    setCapturedPhotos(prev => [...prev, newPhoto]);
    enqueueSnackbar('Đã chụp ảnh thành công!', { variant: 'success' });
  }, [capturedPhotos.length, maxPhotos, stockInId, enqueueSnackbar]);

  const deletePhoto = (photoId: string) => {
    setCapturedPhotos(prev => prev.filter(photo => photo.id !== photoId));
  };

  const downloadPhoto = (photo: CapturedPhoto) => {
    const link = document.createElement('a');
    link.download = photo.filename;
    link.href = photo.dataUrl;
    link.click();
  };

  const handleSave = () => {
    onPhotosCapture(capturedPhotos);
    handleClose();
  };

  const handleClose = () => {
    stopCamera();
    setCapturedPhotos([]);
    onClose();
  };

  const switchCamera = () => {
    setCurrentCamera(prev => prev === 'user' ? 'environment' : 'user');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Start camera when dialog opens
  React.useEffect(() => {
    if (open && !isStreaming) {
      startCamera();
    }
    return () => {
      if (!open) {
        stopCamera();
      }
    };
  }, [open, startCamera, stopCamera, isStreaming]);

  // Update camera when switching
  React.useEffect(() => {
    if (open && isStreaming) {
      startCamera();
    }
  }, [currentCamera, open, isStreaming, startCamera]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CameraIcon color="primary" />
          <Typography variant="h6">
            Chụp ảnh xác minh hàng hóa
          </Typography>
          {productName && (
            <Chip label={productName} color="primary" size="small" />
          )}
        </Box>
        <IconButton onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
        {loading && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              Đang khởi động camera...
            </Typography>
            <LinearProgress />
          </Box>
        )}

        <Grid container spacing={2} sx={{ flexGrow: 1 }}>
          {/* Camera View */}
          <Grid item xs={12} md={8}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ 
                  position: 'relative', 
                  flexGrow: 1, 
                  bgcolor: 'black', 
                  borderRadius: 1,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
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
                  
                  {!isStreaming && !loading && (
                    <Box sx={{ 
                      position: 'absolute', 
                      color: 'white', 
                      textAlign: 'center' 
                    }}>
                      <CameraIcon sx={{ fontSize: 64, mb: 2 }} />
                      <Typography variant="h6">
                        Camera chưa sẵn sàng
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={startCamera}
                        sx={{ mt: 2 }}
                      >
                        Khởi động camera
                      </Button>
                    </Box>
                  )}

                  {/* Camera Controls */}
                  {isStreaming && (
                    <Box sx={{ 
                      position: 'absolute', 
                      bottom: 16, 
                      left: '50%', 
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      gap: 2
                    }}>
                      <Tooltip title="Chuyển camera">
                        <IconButton
                          onClick={switchCamera}
                          sx={{ 
                            bgcolor: 'rgba(0,0,0,0.5)', 
                            color: 'white',
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                          }}
                        >
                          <FlipIcon />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Chụp ảnh">
                        <IconButton
                          onClick={capturePhoto}
                          disabled={capturedPhotos.length >= maxPhotos}
                          sx={{ 
                            bgcolor: 'primary.main', 
                            color: 'white',
                            width: 64,
                            height: 64,
                            '&:hover': { bgcolor: 'primary.dark' },
                            '&:disabled': { bgcolor: 'grey.500' }
                          }}
                        >
                          <CameraIcon sx={{ fontSize: 32 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                  {capturedPhotos.length}/{maxPhotos} ảnh đã chụp
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Captured Photos */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Ảnh đã chụp ({capturedPhotos.length})
                </Typography>
                
                {capturedPhotos.length === 0 ? (
                  <Alert severity="info">
                    Chưa có ảnh nào được chụp
                  </Alert>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 400, overflow: 'auto' }}>
                    {capturedPhotos.map((photo) => (
                      <Card key={photo.id} variant="outlined">
                        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <img
                              src={photo.dataUrl}
                              alt={`Captured ${photo.timestamp.toLocaleTimeString()}`}
                              style={{
                                width: 60,
                                height: 60,
                                objectFit: 'cover',
                                borderRadius: 4
                              }}
                            />
                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                              <Typography variant="caption" noWrap>
                                {photo.filename}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {photo.timestamp.toLocaleTimeString('vi-VN')}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {formatFileSize(photo.size)}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Tooltip title="Tải xuống">
                                <IconButton
                                  size="small"
                                  onClick={() => downloadPhoto(photo)}
                                >
                                  <DownloadIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Xóa">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => deletePhoto(photo.id)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          Hủy
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={capturedPhotos.length === 0}
          startIcon={<CheckIcon />}
        >
          Lưu ảnh ({capturedPhotos.length})
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PhotoCapture;
