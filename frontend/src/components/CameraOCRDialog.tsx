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
      setHasCamera(true);

      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCamera(false);
        setError('⚠️ Trình duyệt không hỗ trợ camera. Vui lòng sử dụng trình duyệt hiện đại hơn (Chrome, Safari, Firefox).');
        return;
      }

      // Check if on HTTPS or localhost
      const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
      if (!isSecure) {
        setHasCamera(false);
        setError('⚠️ Camera chỉ hoạt động trên HTTPS. Vui lòng truy cập trang web qua HTTPS.');
        return;
      }

      // Request camera access with proper error handling
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStreaming(true);
        setHasCamera(true);
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setHasCamera(false);
      setStreaming(false);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError(`🚫 Bạn đã từ chối quyền truy cập camera.\n\n📱 Cách khắc phục:\n• Chrome/Android: Vào Settings → Site Settings → Camera → Cho phép\n• Safari/iOS: Vào Settings → Safari → Camera → Ask hoặc Allow\n• Sau đó tải lại trang và thử lại`);
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('📷 Không tìm thấy camera. Vui lòng kiểm tra:\n• Thiết bị có camera không?\n• Camera có bị ứng dụng khác sử dụng không?\n• Thử đóng các ứng dụng camera khác và thử lại');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('⚠️ Camera đang được sử dụng bởi ứng dụng khác.\n\nVui lòng đóng các ứng dụng camera khác và thử lại.');
      } else if (err.name === 'OverconstrainedError') {
        // Try fallback with lower quality
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'environment',
              width: { ideal: 640 },
              height: { ideal: 480 }
            }
          });
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            await videoRef.current.play();
            setStreaming(true);
            setHasCamera(true);
            return;
          }
        } catch (fallbackErr) {
          setError('⚠️ Không thể khởi động camera với cấu hình hiện tại.\n\nThử sử dụng nút "Chọn ảnh từ thiết bị" thay thế.');
        }
      } else if (err.name === 'SecurityError') {
        setError('🔒 Lỗi bảo mật. Camera chỉ hoạt động trên:\n• HTTPS (https://...)\n• Localhost (http://localhost)\n\nVui lòng đảm bảo bạn đang truy cập qua HTTPS.');
      } else {
        setError(`❌ Không thể truy cập camera: ${err.message || 'Lỗi không xác định'}\n\n💡 Thử các bước sau:\n1. Tải lại trang (F5)\n2. Kiểm tra quyền camera trong Settings\n3. Thử trình duyệt khác\n4. Hoặc dùng nút "Chọn ảnh từ thiết bị"`);
      }
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
            <Alert severity="error" sx={{ whiteSpace: 'pre-line' }}>
              <Typography variant="body2" component="div" sx={{ lineHeight: 1.6 }}>
                {error}
              </Typography>
              {error.includes('từ chối') && (
                <Box sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 1 }}>
                  <Typography variant="caption" fontWeight="bold">
                    🔧 Hướng dẫn chi tiết:
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                    1. Nhấn vào biểu tượng 🔒 hoặc ⓘ bên cạnh URL trên thanh địa chỉ<br />
                    2. Tìm mục "Camera" hoặc "Permissions"<br />
                    3. Chọn "Allow" hoặc "Cho phép"<br />
                    4. Tải lại trang (F5) và thử lại
                  </Typography>
                </Box>
              )}
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

        {error && !capturedImage && (
          <Button
            onClick={startCamera}
            startIcon={<Refresh />}
            color="primary"
            variant="outlined"
          >
            Thử lại
          </Button>
        )}

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
