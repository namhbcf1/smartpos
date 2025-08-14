import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Search as SearchIcon,
  QrCodeScanner as ScanIcon,
  AutoMode as AutoIcon,
  Assignment as ManualIcon,
} from '@mui/icons-material';
import api from '../../services/api';

interface Product {
  id: number;
  name: string;
  sku: string;
  track_quantity: boolean;
}

interface SerialSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (selectedSerials: string[], autoAssign: boolean) => void;
  product: Product | null;
  quantity: number;
}

interface AvailableSerial {
  serial_number: string;
  received_date?: string;
  location?: string;
}

export const SerialSelectionDialog: React.FC<SerialSelectionDialogProps> = ({
  open,
  onClose,
  onConfirm,
  product,
  quantity,
}) => {
  const [loading, setLoading] = useState(false);
  const [availableSerials, setAvailableSerials] = useState<AvailableSerial[]>([]);
  const [selectedSerials, setSelectedSerials] = useState<string[]>([]);
  const [autoAssign, setAutoAssign] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Load available serials when dialog opens
  useEffect(() => {
    if (open && product) {
      loadAvailableSerials();
    }
  }, [open, product, quantity]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedSerials([]);
      setAutoAssign(false);
      setSearchTerm('');
      setError(null);
    }
  }, [open]);

  const loadAvailableSerials = async () => {
    if (!product) return;

    try {
      setLoading(true);
      setError(null);

      const response = await api.get<{
        product: Product;
        available_serials: string[];
        requested_quantity: number;
        available_count: number;
      }>(`/pos-payment/available-serials/${product.id}?quantity=${quantity}`);

      // Convert to AvailableSerial format
      const serials: AvailableSerial[] = response.available_serials.map(serial => ({
        serial_number: serial,
      }));

      setAvailableSerials(serials);

      // Auto-select if not enough serials available
      if (response.available_count < quantity) {
        setAutoAssign(false);
        setError(`Chỉ có ${response.available_count} serial khả dụng, cần ${quantity} serial`);
      } else if (response.available_count === quantity) {
        // If exact match, suggest auto-assign
        setAutoAssign(true);
      }

    } catch (error) {
      console.error('Error loading available serials:', error);
      setError('Lỗi khi tải danh sách serial numbers');
    } finally {
      setLoading(false);
    }
  };

  const handleSerialToggle = (serialNumber: string) => {
    setSelectedSerials(prev => {
      if (prev.includes(serialNumber)) {
        return prev.filter(s => s !== serialNumber);
      } else if (prev.length < quantity) {
        return [...prev, serialNumber];
      }
      return prev;
    });
  };

  const handleAutoAssignToggle = (checked: boolean) => {
    setAutoAssign(checked);
    if (checked) {
      setSelectedSerials([]);
    }
  };

  const handleConfirm = () => {
    if (autoAssign) {
      onConfirm([], true);
    } else {
      if (selectedSerials.length !== quantity) {
        setError(`Vui lòng chọn đúng ${quantity} serial numbers`);
        return;
      }
      onConfirm(selectedSerials, false);
    }
    onClose();
  };

  const filteredSerials = availableSerials.filter(serial =>
    serial.serial_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!product) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '500px' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <ManualIcon color="primary" />
          <Typography variant="h6">
            Chọn Serial Numbers
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {product.name} ({product.sku}) - Cần {quantity} serial
        </Typography>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : (
          <>
            {error && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Auto-assign option */}
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoAssign}
                    onChange={(e) => handleAutoAssignToggle(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <AutoIcon />
                    <Typography>
                      Tự động gán serial numbers
                    </Typography>
                  </Box>
                }
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Hệ thống sẽ tự động chọn {quantity} serial numbers khả dụng
              </Typography>
            </Box>

            {!autoAssign && (
              <>
                {/* Search */}
                <TextField
                  fullWidth
                  placeholder="Tìm kiếm serial number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small">
                          <ScanIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />

                {/* Selection status */}
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Đã chọn: {selectedSerials.length}/{quantity}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Khả dụng: {filteredSerials.length}
                  </Typography>
                </Box>

                {/* Serial list */}
                <List sx={{ maxHeight: '300px', overflow: 'auto' }}>
                  {filteredSerials.map((serial) => (
                    <ListItem
                      key={serial.serial_number}
                      dense
                      button
                      onClick={() => handleSerialToggle(serial.serial_number)}
                      disabled={
                        !selectedSerials.includes(serial.serial_number) && 
                        selectedSerials.length >= quantity
                      }
                    >
                      <ListItemText
                        primary={serial.serial_number}
                        secondary={serial.location && `Vị trí: ${serial.location}`}
                      />
                      <ListItemSecondaryAction>
                        <Checkbox
                          edge="end"
                          checked={selectedSerials.includes(serial.serial_number)}
                          onChange={() => handleSerialToggle(serial.serial_number)}
                          disabled={
                            !selectedSerials.includes(serial.serial_number) && 
                            selectedSerials.length >= quantity
                          }
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>

                {filteredSerials.length === 0 && (
                  <Box textAlign="center" py={4}>
                    <Typography color="text.secondary">
                      Không tìm thấy serial numbers khả dụng
                    </Typography>
                  </Box>
                )}
              </>
            )}

            {/* Selected serials display */}
            {selectedSerials.length > 0 && !autoAssign && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Serial numbers đã chọn:
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {selectedSerials.map((serial) => (
                    <Chip
                      key={serial}
                      label={serial}
                      onDelete={() => handleSerialToggle(serial)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Hủy
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={
            loading || 
            (!autoAssign && selectedSerials.length !== quantity) ||
            (availableSerials.length < quantity)
          }
        >
          Xác nhận
        </Button>
      </DialogActions>
    </Dialog>
  );
};
