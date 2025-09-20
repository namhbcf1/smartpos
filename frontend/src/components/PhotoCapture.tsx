import React, { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  IconButton,
  Tooltip,
  Alert,
  LinearProgress,
  Chip,
  TextField
} from '@mui/material';
import {
  PhotoCamera as CameraIcon,
  FlipCameraIos as FlipIcon,
  Close as CloseIcon,
  Refresh as RetakeIcon,
  Save as SaveIcon,
  Upload as UploadIcon,
  Download as DownloadIcon
} from '@mui/icons-material';

interface PhotoCaptureProps {
  open: boolean;
  onClose: () => void;
  onCapture: (photoData: string, metadata?: PhotoMetadata) => void;
  title?: string;
  showMetadata?: boolean;
}

interface PhotoMetadata {
  description: string;
  tags: string[];
  timestamp: string;
  location?: string;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  open,
  onClose,
  onCapture,
  title = 'Photo Capture',
  showMetadata = true
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play();
      }

      setCameraActive(true);
    } catch (err: any) {
      console.error('Error starting camera:', err);
      setError('Failed to access camera. Please check camera permissions.');
    } finally {
      setLoading(false);
    }
  }, [facingMode, stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedPhoto(photoDataUrl);
    stopCamera();
  }, [stopCamera]);

  const flipCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  const retakePhoto = useCallback(() => {
    setCapturedPhoto(null);
    startCamera();
  }, [startCamera]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCapturedPhoto(result);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleSave = useCallback(() => {
    if (!capturedPhoto) return;

    const metadata: PhotoMetadata = {
      description,
      tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
      timestamp: new Date().toISOString(),
    };

    onCapture(capturedPhoto, showMetadata ? metadata : undefined);
    handleClose();
  }, [capturedPhoto, description, tags, onCapture, showMetadata]);

  const handleClose = useCallback(() => {
    stopCamera();
    setCapturedPhoto(null);
    setDescription('');
    setTags('');
    setError(null);
    onClose();
  }, [stopCamera, onClose]);

  const downloadPhoto = useCallback(() => {
    if (!capturedPhoto) return;

    const link = document.createElement('a');
    link.href = capturedPhoto;
    link.download = `photo_${new Date().getTime()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [capturedPhoto]);

  React.useEffect(() => {
    if (open && !capturedPhoto) {
      startCamera();
    }
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [open, capturedPhoto, startCamera, stream]);

  React.useEffect(() => {
    if (cameraActive && facingMode) {
      startCamera();
    }
  }, [facingMode, cameraActive, startCamera]);

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <CameraIcon sx={{ mr: 1 }} />
            {title}
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Grid container spacing={2} sx={{ height: '100%' }}>
          <Grid item xs={12} md={8}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ height: '100%', p: 1 }}>
                <Box 
                  sx={{ 
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'black',
                    borderRadius: 1,
                    overflow: 'hidden'
                  }}
                >
                  {cameraActive && !capturedPhoto && (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 16,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          display: 'flex',
                          gap: 2,
                          alignItems: 'center'
                        }}
                      >
                        <Tooltip title="Flip Camera">
                          <IconButton
                            onClick={flipCamera}
                            sx={{
                              bgcolor: 'rgba(255, 255, 255, 0.9)',
                              '&:hover': { bgcolor: 'rgba(255, 255, 255, 1)' }
                            }}
                          >
                            <FlipIcon />
                          </IconButton>
                        </Tooltip>
                        <IconButton
                          onClick={capturePhoto}
                          sx={{
                            bgcolor: 'white',
                            width: 70,
                            height: 70,
                            border: '4px solid #fff',
                            '&:hover': { bgcolor: '#f5f5f5' }
                          }}
                        >
                          <CameraIcon sx={{ fontSize: 30 }} />
                        </IconButton>
                        <Tooltip title="Upload Photo">
                          <IconButton
                            onClick={() => fileInputRef.current?.click()}
                            sx={{
                              bgcolor: 'rgba(255, 255, 255, 0.9)',
                              '&:hover': { bgcolor: 'rgba(255, 255, 255, 1)' }
                            }}
                          >
                            <UploadIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </>
                  )}

                  {capturedPhoto && (
                    <>
                      <img
                        src={capturedPhoto}
                        alt="Captured"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain'
                        }}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 16,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          display: 'flex',
                          gap: 2,
                          alignItems: 'center'
                        }}
                      >
                        <Tooltip title="Retake Photo">
                          <IconButton
                            onClick={retakePhoto}
                            sx={{
                              bgcolor: 'rgba(255, 255, 255, 0.9)',
                              '&:hover': { bgcolor: 'rgba(255, 255, 255, 1)' }
                            }}
                          >
                            <RetakeIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download Photo">
                          <IconButton
                            onClick={downloadPhoto}
                            sx={{
                              bgcolor: 'rgba(255, 255, 255, 0.9)',
                              '&:hover': { bgcolor: 'rgba(255, 255, 255, 1)' }
                            }}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </>
                  )}

                  {!cameraActive && !capturedPhoto && (
                    <Box sx={{ textAlign: 'center', color: 'white' }}>
                      <CameraIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Camera Not Active
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={startCamera}
                        startIcon={<CameraIcon />}
                        sx={{ mr: 1 }}
                      >
                        Start Camera
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => fileInputRef.current?.click()}
                        startIcon={<UploadIcon />}
                        sx={{ color: 'white', borderColor: 'white' }}
                      >
                        Upload Photo
                      </Button>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {showMetadata && (
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Photo Details
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <TextField
                      label="Description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      fullWidth
                      multiline
                      rows={4}
                      placeholder="Add a description for this photo..."
                      variant="outlined"
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <TextField
                      label="Tags"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      fullWidth
                      placeholder="tag1, tag2, tag3..."
                      variant="outlined"
                      helperText="Separate tags with commas"
                    />
                  </Box>

                  {tags && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Preview Tags:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {tags.split(',').map((tag, index) => (
                          <Chip
                            key={index}
                            label={tag.trim()}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Photo Info:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Timestamp: {new Date().toLocaleString()}
                    </Typography>
                    {capturedPhoto && (
                      <Typography variant="body2" color="text.secondary">
                        Status: Ready to save
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>

        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        {!cameraActive && !capturedPhoto && (
          <Button
            variant="contained"
            onClick={startCamera}
            startIcon={<CameraIcon />}
          >
            Start Camera
          </Button>
        )}
        {capturedPhoto && (
          <Button
            variant="contained"
            onClick={handleSave}
            startIcon={<SaveIcon />}
            disabled={showMetadata && !description.trim()}
          >
            Save Photo
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PhotoCapture;
