import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  LinearProgress,
} from '@mui/material';
import {
  Search,
  Add,
  Refresh,
  Visibility,
  Edit,
  Delete,
  CloudUpload,
  FilterList,
  MoreVert,
  Image,
  VideoFile,
  AudioFile,
  Description,
  Folder,
  Download,
  Share,
  Link,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storageAPI } from '../../services/api';

// File Upload Component
interface FileUploadProps {
  onUpload: (file: File) => void;
  uploading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUpload, uploading }) => {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onUpload(files[0]);
    }
  };

  return (
    <Box
      sx={{
        border: '2px dashed',
        borderColor: dragOver ? 'primary.main' : 'grey.300',
        borderRadius: 2,
        p: 4,
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: 'primary.main',
          backgroundColor: 'primary.50',
        },
      }}
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      <input
        id="file-input"
        type="file"
        hidden
        onChange={handleFileSelect}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
      />
      <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        Kéo thả file vào đây hoặc click để chọn
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Hỗ trợ: Hình ảnh, Video, Audio, PDF, Word, Excel, Text
      </Typography>
      {uploading && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Đang tải lên...
          </Typography>
        </Box>
      )}
    </Box>
  );
};

// File Row Component
interface FileRowProps {
  file: any;
  onView: (file: any) => void;
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
  onShare: (file: any) => void;
}

const FileRow: React.FC<FileRowProps> = ({
  file,
  onView,
  onDelete,
  onDownload,
  onShare,
}) => {
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image />;
    if (fileType.startsWith('video/')) return <VideoFile />;
    if (fileType.startsWith('audio/')) return <AudioFile />;
    if (fileType.includes('pdf')) return <Description />;
    if (fileType.includes('word') || fileType.includes('document')) return <Description />;
    if (fileType.includes('sheet') || fileType.includes('excel')) return <Description />;
    return <Folder />;
  };

  const getFileColor = (fileType: string) => {
    if (fileType.startsWith('image/')) return 'success';
    if (fileType.startsWith('video/')) return 'info';
    if (fileType.startsWith('audio/')) return 'warning';
    if (fileType.includes('pdf')) return 'error';
    return 'default';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <TableRow>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: `${getFileColor(file.file_type)}.main` }}>
            {getFileIcon(file.file_type)}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {file.original_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {file.filename}
            </Typography>
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        <Chip
          label={file.file_type}
          size="small"
          color={getFileColor(file.file_type) as any}
        />
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          {formatFileSize(file.file_size)}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          {file.entity_type || 'N/A'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          {file.entity_id || 'N/A'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          {formatDate(file.created_at)}
        </Typography>
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" onClick={() => onView(file)}>
            <Visibility />
          </IconButton>
          <IconButton size="small" onClick={() => onDownload(file.id)}>
            <Download />
          </IconButton>
          <IconButton size="small" onClick={() => onShare(file)}>
            <Share />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => onDelete(file.id)}>
            <Delete />
          </IconButton>
        </Box>
      </TableCell>
    </TableRow>
  );
};

// Main File Storage Management Component
const FileStorageManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const queryClient = useQueryClient();

  // Fetch files
  const { data: filesData, isLoading, error, refetch } = useQuery({
    queryKey: ['files', page, pageSize, searchTerm],
    queryFn: () => storageAPI.getFiles(page, pageSize, searchTerm || undefined),
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: (file: File) => storageAPI.uploadFile(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      setUploading(false);
      setUploadOpen(false);
    },
    onError: () => {
      setUploading(false);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => storageAPI.deleteFile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });

  const files = filesData?.data?.files || [];
  const pagination = filesData?.data?.pagination;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleUpload = (file: File) => {
    setUploading(true);
    uploadMutation.mutate(file);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa file này?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleView = (file: any) => {
    console.log('View file:', file);
  };

  const handleDownload = (id: string) => {
    storageAPI.getFileUrl(id).then(response => {
      if (response.data?.url) {
        window.open(response.data.url, '_blank');
      }
    });
  };

  const handleShare = (file: any) => {
    console.log('Share file:', file);
  };

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          Không thể tải dữ liệu file. Vui lòng kiểm tra kết nối mạng.
        </Alert>
        <Button onClick={handleRefresh} startIcon={<Refresh />}>
          Thử lại
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Quản lý file
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Quản lý các file đã tải lên và lưu trữ
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CloudUpload color="primary" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {pagination?.total || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng file
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Image color="success" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {files.filter((f: any) => f.file_type.startsWith('image/')).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Hình ảnh
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <VideoFile color="info" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {files.filter((f: any) => f.file_type.startsWith('video/')).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Video
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Description color="warning" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {files.filter((f: any) => f.file_type.includes('pdf') || f.file_type.includes('document')).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tài liệu
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Toolbar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Tìm kiếm file..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 300 }}
            />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setUploadOpen(true)}
            >
              Tải lên file
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRefresh}
            >
              Làm mới
            </Button>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
            >
              Bộ lọc
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Files Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tên file</TableCell>
                <TableCell>Loại</TableCell>
                <TableCell>Kích thước</TableCell>
                <TableCell>Entity Type</TableCell>
                <TableCell>Entity ID</TableCell>
                <TableCell>Ngày tải lên</TableCell>
                <TableCell>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {files.map((file: any) => (
                <FileRow
                  key={file.id}
                  file={file}
                  onView={handleView}
                  onDelete={handleDelete}
                  onDownload={handleDownload}
                  onShare={handleShare}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Empty State */}
      {files.length === 0 && !isLoading && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Avatar sx={{ width: 64, height: 64, mx: 'auto', mb: 2, bgcolor: 'grey.100' }}>
              <CloudUpload sx={{ fontSize: 32, color: 'grey.400' }} />
            </Avatar>
            <Typography variant="h6" gutterBottom>
              Chưa có file nào
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Bắt đầu bằng cách tải lên file đầu tiên
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setUploadOpen(true)}
            >
              Tải lên file đầu tiên
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Tải lên file mới</DialogTitle>
        <DialogContent>
          <FileUpload onUpload={handleUpload} uploading={uploading} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadOpen(false)} disabled={uploading}>
            Hủy
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FileStorageManagement;