import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Chip,
  Typography,
  IconButton,
  Button,
  Paper,
  Divider,
  Alert,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Add,
  Delete,
  QrCodeScanner,
  Clear,
  Numbers,
  Inventory,
  CloudUpload,
  GetApp
} from '@mui/icons-material';
import BarcodeScanner from './BarcodeScanner';
import BulkSerialImport from './BulkSerialImport';
import { sanitizeInput, sanitizeText } from '../utils/sanitize';

interface SerialNumberInputProps {
  value: string[];
  onChange: (serialNumbers: string[]) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  maxSerials?: number;
  showBarcodeScanner?: boolean;
}

const SerialNumberInput: React.FC<SerialNumberInputProps> = ({
  value = [],
  onChange,
  label = 'Serial Numbers',
  placeholder = 'Nhập serial number...',
  disabled = false,
  error = false,
  helperText,
  maxSerials = 100,
  showBarcodeScanner = true
}) => {
  const [inputValue, setInputValue] = useState('');

  // SECURITY FIXED: Sanitize input value
  const handleInputChange = (value: string) => {
    const sanitizedValue = sanitizeInput(value);
    setInputValue(sanitizedValue);
  };
  const [scannerOpen, setScannerOpen] = useState(false);
  const [bulkInputOpen, setBulkInputOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  useEffect(() => {
    if (duplicateError) {
      const timer = setTimeout(() => setDuplicateError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [duplicateError]);

  const addSerialNumber = (serial: string) => {
    const trimmedSerial = serial.trim();
    
    if (!trimmedSerial) return;
    
    if (value.includes(trimmedSerial)) {
      setDuplicateError(`Serial "${trimmedSerial}" đã tồn tại`);
      return;
    }
    
    if (value.length >= maxSerials) {
      setDuplicateError(`Không thể thêm quá ${maxSerials} serial numbers`);
      return;
    }
    
    onChange([...value, trimmedSerial]);
    setInputValue('');
    setDuplicateError(null);
  };

  const removeSerialNumber = (index: number) => {
    const newSerials = value.filter((_, i) => i !== index);
    onChange(newSerials);
  };

  const clearAllSerials = () => {
    onChange([]);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addSerialNumber(inputValue);
    }
  };

  const handleBarcodeScanned = (barcode: string) => {
    addSerialNumber(barcode);
  };

  const handleBulkAdd = () => {
    const serials = bulkText
      .split(/[\n,;]/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    const newSerials = [...value];
    let addedCount = 0;
    let duplicateCount = 0;
    
    for (const serial of serials) {
      if (newSerials.includes(serial)) {
        duplicateCount++;
        continue;
      }
      
      if (newSerials.length >= maxSerials) {
        break;
      }
      
      newSerials.push(serial);
      addedCount++;
    }
    
    onChange(newSerials);
    setBulkText('');
    setBulkInputOpen(false);
    
    if (duplicateCount > 0) {
      setDuplicateError(`Đã bỏ qua ${duplicateCount} serial trùng lặp`);
    }
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Numbers color="primary" />
        {label}
        <Chip 
          label={`${value.length}/${maxSerials}`} 
          size="small" 
          color={value.length > 0 ? 'primary' : 'default'}
        />
      </Typography>

      {/* Input field */}
      <TextField
        fullWidth
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={disabled}
        error={error || !!duplicateError}
        helperText={duplicateError || helperText}
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Inventory color="action" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {showBarcodeScanner && (
                  <IconButton
                    onClick={() => setScannerOpen(true)}
                    size="small"
                    color="primary"
                    title="Quét serial"
                  >
                    <QrCodeScanner />
                  </IconButton>
                )}
                <IconButton
                  onClick={() => addSerialNumber(inputValue)}
                  size="small"
                  color="primary"
                  disabled={!inputValue.trim()}
                  title="Thêm serial"
                >
                  <Add />
                </IconButton>
              </Box>
            </InputAdornment>
          )
        }}
      />

      {/* Action buttons */}
      <Box sx={{ display: 'flex', gap: 1, mt: 1, mb: 2 }}>
        <Button
          size="small"
          variant="outlined"
          onClick={() => setBulkInputOpen(true)}
          disabled={disabled}
        >
          Nhập hàng loạt
        </Button>

        <Button
          size="small"
          variant="outlined"
          onClick={() => setBulkImportOpen(true)}
          disabled={disabled}
          startIcon={<CloudUpload />}
        >
          Import File
        </Button>
        
        {value.length > 0 && (
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={clearAllSerials}
            startIcon={<Clear />}
            disabled={disabled}
          >
            Xóa tất cả
          </Button>
        )}
      </Box>

      {/* Error alert */}
      {duplicateError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {duplicateError}
        </Alert>
      )}

      {/* Serial numbers display */}
      {value.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Danh sách Serial Numbers:
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            {value.map((serial, index) => (
              <Chip
                key={index}
                label={serial}
                onDelete={disabled ? undefined : () => removeSerialNumber(index)}
                deleteIcon={<Delete />}
                variant="outlined"
                size="small"
                sx={{
                  maxWidth: 200,
                  '& .MuiChip-label': {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }
                }}
              />
            ))}
          </Box>
        </Paper>
      )}

      {/* Barcode Scanner */}
      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleBarcodeScanned}
        title="Quét Serial Number"
      />

      {/* Bulk input dialog */}
      <Dialog
        open={bulkInputOpen}
        onClose={() => setBulkInputOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Nhập Serial Numbers hàng loạt</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Nhập nhiều serial numbers, mỗi serial trên một dòng hoặc cách nhau bằng dấu phẩy/chấm phẩy:
          </Typography>
          
          <TextField
            fullWidth
            multiline
            rows={8}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder="SN001&#10;SN002&#10;SN003&#10;hoặc SN001, SN002, SN003"
            sx={{ mt: 2 }}
          />
          
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Sẽ thêm tối đa {maxSerials - value.length} serial numbers mới
          </Typography>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setBulkInputOpen(false)}>
            Hủy
          </Button>
          <Button 
            onClick={handleBulkAdd}
            variant="contained"
            disabled={!bulkText.trim()}
          >
            Thêm tất cả
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Import Dialog */}
      <BulkSerialImport
        open={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
        onImportComplete={(importedSerials) => {
          const newSerials = [...value];
          importedSerials.forEach(serial => {
            if (!newSerials.includes(serial) && newSerials.length < maxSerials) {
              newSerials.push(serial);
            }
          });
          onChange(newSerials);
          setBulkImportOpen(false);
        }}
      />
    </Box>
  );
};

export default SerialNumberInput;
