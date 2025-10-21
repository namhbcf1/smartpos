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
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Close,
  CameraAlt,
  Refresh,
  CheckCircle,
} from '@mui/icons-material';

interface CameraOCRDialogProps {
  open: boolean;
  onClose: () => void;
  onCapture: (imageData: string) => void;
  isProcessing?: boolean;
}

export default function CameraOCRDialog({
  open,
  onClose,
  onCapture,
  isProcessing = false
}: CameraOCRDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string>('');
  const [capturedImage, setCapturedImage] = useState<string>('');
  const [hasCamera, setHasCamera] = useState(true);

  const startCamera = async () => {
    try {
      setError('');

      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCamera(false);
        setError('Trình duyệt không hỗ trợ camera. Vui lòng sử dụng trình duyệt hiện đại hơn.');
        return;
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreaming(true);
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setHasCamera(false);
      if (err.name === 'NotAllowedError') {
        setError('Bạn đã từ chối quyền truy cập camera. Vui lòng cho phép quyền truy cập camera trong cài đặt trình duyệt.');
      } else if (err.name === 'NotFoundError') {
        setError('Không tìm thấy camera. Vui lòng kiểm tra lại thiết bị của bạn.');
      } else {
        setError('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập và thử lại.');
      }
      setStreaming(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setStreaming(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to data URL
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(imageData);

      // Stop camera after capturing
      stopCamera();
    }
  };

  const handleRetake = () => {
    setCapturedImage('');
    startCamera();
  };

  const handleUsePhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage('');
    setError('');
    onClose();
  };

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
      setCapturedImage('');
      setError('');
    }

    return () => {
      stopCamera();
    };
  }, [open]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <CameraAlt color="primary" />
            <Typography variant="h6">Chụp ảnh để OCR tự động điền thông tin</Typography>
          </Stack>
          <IconButton onClick={handleClose} disabled={isProcessing}>
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

          {!error && !capturedImage && (
            <Alert severity="info">
              <Typography variant="body2">
                📸 <strong>Hướng dẫn:</strong> Chụp ảnh giấy tờ (hóa đơn, phiếu bảo hành, tem sản phẩm)
                để hệ thống tự động trích xuất thông tin như serial, giá, tên khách hàng, v.v.
              </Typography>
            </Alert>
          )}

          {isProcessing && (
            <Alert severity="info">
              <Box display="flex" alignItems="center" gap={2}>
                <CircularProgress size={20} />
                <Typography variant="body2">
                  Đang xử lý ảnh và trích xuất thông tin... Vui lòng đợi.
                </Typography>
              </Box>
            </Alert>
          )}

          {/* Camera Video or Captured Image */}
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: '400px',
              border: '2px solid #e0e0e0',
              borderRadius: 2,
              overflow: 'hidden',
              bgcolor: 'black',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {capturedImage ? (
              // Show captured image
              <img
                src={capturedImage}
                alt="Captured"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
              />
            ) : (
              // Show video stream
              <>
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

                {/* Capture guide overlay */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '80%',
                    height: '60%',
                    border: '3px dashed rgba(255, 255, 255, 0.8)',
                    borderRadius: '8px',
                    pointerEvents: 'none',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '-3px',
                      left: '-3px',
                      width: '30px',
                      height: '30px',
                      border: '6px solid #4caf50',
                      borderRight: 'none',
                      borderBottom: 'none',
                      borderRadius: '8px 0 0 0'
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: '-3px',
                      right: '-3px',
                      width: '30px',
                      height: '30px',
                      border: '6px solid #4caf50',
                      borderLeft: 'none',
                      borderTop: 'none',
                      borderRadius: '0 0 8px 0'
                    }
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '-3px',
                      right: '-3px',
                      width: '30px',
                      height: '30px',
                      border: '6px solid #4caf50',
                      borderLeft: 'none',
                      borderBottom: 'none',
                      borderRadius: '0 8px 0 0'
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: '-3px',
                      left: '-3px',
                      width: '30px',
                      height: '30px',
                      border: '6px solid #4caf50',
                      borderRight: 'none',
                      borderTop: 'none',
                      borderRadius: '0 0 0 8px'
                    }}
                  />
                </Box>

                {/* Instruction overlay */}
                {streaming && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      bgcolor: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      px: 2,
                      py: 1,
                      borderRadius: 1
                    }}
                  >
                    <Typography variant="caption">
                      Đặt giấy tờ trong khung và nhấn nút chụp
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </Box>

          {/* Hidden canvas for capturing */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Tips */}
          {!capturedImage && (
            <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                💡 <strong>Mẹo để có kết quả OCR tốt nhất:</strong>
                <br />• Đảm bảo ánh sáng đủ sáng và đều
                <br />• Giữ camera ổn định, không bị rung
                <br />• Chữ trong ảnh rõ ràng, không bị mờ hoặc nhòe
                <br />• Đặt giấy tờ phẳng, không bị nhăn hoặc cong
                <br />• Camera cách giấy tờ khoảng 20-40cm
              </Typography>
            </Box>
          )}

          {capturedImage && !isProcessing && (
            <Alert severity="success" icon={<CheckCircle />}>
              <Typography variant="body2">
                ✓ Ảnh đã được chụp thành công! Nhấn "Xử lý OCR" để trích xuất thông tin tự động.
              </Typography>
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isProcessing}>
          Hủy
        </Button>

        {capturedImage ? (
          <>
            <Button
              onClick={handleRetake}
              startIcon={<Refresh />}
              disabled={isProcessing}
            >
              Chụp lại
            </Button>
            <Button
              variant="contained"
              onClick={handleUsePhoto}
              disabled={isProcessing}
              startIcon={isProcessing ? <CircularProgress size={16} /> : <CheckCircle />}
            >
              {isProcessing ? 'Đang xử lý...' : 'Xử lý OCR'}
            </Button>
          </>
        ) : (
          <Button
            variant="contained"
            onClick={capturePhoto}
            disabled={!streaming || !hasCamera}
            startIcon={<CameraAlt />}
          >
            Chụp ảnh
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
