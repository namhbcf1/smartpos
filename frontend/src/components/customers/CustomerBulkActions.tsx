import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Checkbox,
  FormControlLabel,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Delete,
  Email,
  LocalOffer,
  FileDownload,
  Block,
  CheckCircle,
  MoreVert,
  Label,
  Send,
  Archive
} from '@mui/icons-material';

interface CustomerBulkActionsProps {
  selectedCount: number;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  onDelete?: () => Promise<void>;
  onExport?: () => Promise<void>;
  onSendEmail?: () => void;
  onAddTag?: () => void;
  onArchive?: () => Promise<void>;
  onActivate?: () => Promise<void>;
  onDeactivate?: () => Promise<void>;
  isAllSelected?: boolean;
  totalCount?: number;
}

const CustomerBulkActions: React.FC<CustomerBulkActionsProps> = ({
  selectedCount,
  onSelectAll,
  onDeselectAll,
  onDelete,
  onExport,
  onSendEmail,
  onAddTag,
  onArchive,
  onActivate,
  onDeactivate,
  isAllSelected = false,
  totalCount = 0
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    action: 'delete' | 'archive' | 'deactivate' | null;
  }>({
    open: false,
    title: '',
    message: '',
    action: null
  });
  const [loading, setLoading] = useState(false);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      switch (confirmDialog.action) {
        case 'delete':
          await onDelete?.();
          break;
        case 'archive':
          await onArchive?.();
          break;
        case 'deactivate':
          await onDeactivate?.();
          break;
      }
    } finally {
      setLoading(false);
      setConfirmDialog({ open: false, title: '', message: '', action: null });
      handleCloseMenu();
    }
  };

  const openConfirmDialog = (action: 'delete' | 'archive' | 'deactivate') => {
    const configs = {
      delete: {
        title: 'Xóa khách hàng?',
        message: `Bạn có chắc chắn muốn xóa ${selectedCount} khách hàng đã chọn? Hành động này không thể hoàn tác.`
      },
      archive: {
        title: 'Lưu trữ khách hàng?',
        message: `Bạn có chắc chắn muốn lưu trữ ${selectedCount} khách hàng đã chọn?`
      },
      deactivate: {
        title: 'Vô hiệu hóa khách hàng?',
        message: `Bạn có chắc chắn muốn vô hiệu hóa ${selectedCount} khách hàng đã chọn?`
      }
    };

    setConfirmDialog({
      open: true,
      ...configs[action],
      action
    });
    handleCloseMenu();
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 2,
          borderRadius: 2,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'
        }}
      >
        <FormControlLabel
          control={
            <Checkbox
              checked={isAllSelected}
              indeterminate={selectedCount > 0 && !isAllSelected}
              onChange={(e) => e.target.checked ? onSelectAll?.() : onDeselectAll?.()}
              sx={{
                color: 'white',
                '&.Mui-checked': { color: 'white' },
                '&.MuiCheckbox-indeterminate': { color: 'white' }
              }}
            />
          }
          label={
            <Typography variant="body2" fontWeight={600}>
              {isAllSelected ? `Tất cả ${totalCount} khách hàng` : `${selectedCount} khách hàng`}
            </Typography>
          }
        />

        <Box sx={{ flex: 1 }} />

        {/* Quick Actions */}
        <Button
          variant="contained"
          size="small"
          startIcon={<FileDownload />}
          onClick={onExport}
          sx={{
            bgcolor: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.3)'
            }
          }}
        >
          Xuất Excel
        </Button>

        <Button
          variant="contained"
          size="small"
          startIcon={<Email />}
          onClick={onSendEmail}
          sx={{
            bgcolor: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.3)'
            }
          }}
        >
          Gửi Email
        </Button>

        {/* More Actions Menu */}
        <Button
          variant="contained"
          size="small"
          startIcon={<MoreVert />}
          onClick={handleOpenMenu}
          sx={{
            bgcolor: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.3)'
            }
          }}
        >
          Thêm
        </Button>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseMenu}
          PaperProps={{
            sx: {
              borderRadius: 2,
              minWidth: 200,
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
            }
          }}
        >
          <MenuItem onClick={onAddTag}>
            <ListItemIcon>
              <Label fontSize="small" />
            </ListItemIcon>
            <ListItemText>Gắn thẻ</ListItemText>
          </MenuItem>

          <MenuItem onClick={onActivate}>
            <ListItemIcon>
              <CheckCircle fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText>Kích hoạt</ListItemText>
          </MenuItem>

          <MenuItem onClick={() => openConfirmDialog('deactivate')}>
            <ListItemIcon>
              <Block fontSize="small" color="warning" />
            </ListItemIcon>
            <ListItemText>Vô hiệu hóa</ListItemText>
          </MenuItem>

          <Divider />

          <MenuItem onClick={() => openConfirmDialog('archive')}>
            <ListItemIcon>
              <Archive fontSize="small" />
            </ListItemIcon>
            <ListItemText>Lưu trữ</ListItemText>
          </MenuItem>

          <MenuItem onClick={() => openConfirmDialog('delete')}>
            <ListItemIcon>
              <Delete fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText sx={{ color: 'error.main' }}>
              Xóa vĩnh viễn
            </ListItemText>
          </MenuItem>
        </Menu>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {confirmDialog.message}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            onClick={handleConfirm}
            color="error"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : null}
          >
            {loading ? 'Đang xử lý...' : 'Xác nhận'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CustomerBulkActions;
