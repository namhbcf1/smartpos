import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Chip,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  QrCode as QrCodeIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

interface SerialNumber {
  id: string;
  value: string;
  status: 'valid' | 'duplicate' | 'invalid';
  timestamp: string;
}

interface SerialNumberInputProps {
  value: SerialNumber[];
  onChange: (serials: SerialNumber[]) => void;
  maxSerials?: number;
  allowDuplicates?: boolean;
  validateSerial?: (serial: string) => boolean;
  placeholder?: string;
  label?: string;
}

const SerialNumberInput: React.FC<SerialNumberInputProps> = ({
  value = [],
  onChange,
  maxSerials = 100,
  allowDuplicates = false,
  validateSerial,
  placeholder = "Enter serial number...",
  label = "Serial Numbers"
}) => {
  const [currentSerial, setCurrentSerial] = useState('');
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSerial, setEditingSerial] = useState<SerialNumber | null>(null);
  const [editValue, setEditValue] = useState('');

  const defaultValidateSerial = (serial: string): boolean => {
    return serial.trim().length >= 3 && /^[A-Za-z0-9-_]+$/.test(serial.trim());
  };

  const checkSerialStatus = (serial: string): 'valid' | 'duplicate' | 'invalid' => {
    const trimmedSerial = serial.trim();
    
    if (!trimmedSerial) return 'invalid';
    
    const validator = validateSerial || defaultValidateSerial;
    if (!validator(trimmedSerial)) return 'invalid';
    
    if (!allowDuplicates && value.some(s => s.value === trimmedSerial)) {
      return 'duplicate';
    }
    
    return 'valid';
  };

  const addSerial = () => {
    if (!currentSerial.trim()) return;
    
    const trimmedSerial = currentSerial.trim();
    const status = checkSerialStatus(trimmedSerial);
    
    if (status === 'invalid') {
      return;
    }
    
    if (status === 'duplicate' && !allowDuplicates) {
      return;
    }
    
    if (value.length >= maxSerials) {
      return;
    }
    
    const newSerial: SerialNumber = {
      id: Date.now().toString(),
      value: trimmedSerial,
      status,
      timestamp: new Date().toISOString()
    };
    
    const updatedSerials = [...value, newSerial];
    onChange(updatedSerials);
    setCurrentSerial('');
  };

  const removeSerial = (id: string) => {
    const updatedSerials = value.filter(serial => serial.id !== id);
    onChange(updatedSerials);
  };

  const editSerial = (serial: SerialNumber) => {
    setEditingSerial(serial);
    setEditValue(serial.value);
    setEditDialogOpen(true);
  };

  const saveEditedSerial = () => {
    if (!editingSerial || !editValue.trim()) return;
    
    const status = checkSerialStatus(editValue);
    if (status === 'invalid') return;
    
    const updatedSerials = value.map(serial => 
      serial.id === editingSerial.id 
        ? { ...serial, value: editValue.trim(), status }
        : serial
    );
    
    onChange(updatedSerials);
    setEditDialogOpen(false);
    setEditingSerial(null);
    setEditValue('');
  };

  const copySerial = (serialValue: string) => {
    navigator.clipboard.writeText(serialValue);
  };

  const copyAllSerials = () => {
    const allSerials = value.map(s => s.value).join('\n');
    navigator.clipboard.writeText(allSerials);
  };

  const clearAllSerials = () => {
    onChange([]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'success';
      case 'duplicate':
        return 'warning';
      case 'invalid':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckIcon />;
      case 'duplicate':
      case 'invalid':
        return <WarningIcon />;
      default:
        return null;
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      addSerial();
    }
  };

  const validSerials = value.filter(s => s.status === 'valid').length;
  const duplicateSerials = value.filter(s => s.status === 'duplicate').length;
  const invalidSerials = value.filter(s => s.status === 'invalid').length;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {label}
      </Typography>

      {/* Input Section */}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                value={currentSerial}
                onChange={(e) => setCurrentSerial(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={placeholder}
                variant="outlined"
                size="small"
                error={currentSerial.trim() && checkSerialStatus(currentSerial) !== 'valid'}
                helperText={
                  currentSerial.trim() && checkSerialStatus(currentSerial) !== 'valid'
                    ? checkSerialStatus(currentSerial) === 'duplicate'
                      ? 'Serial number already exists'
                      : 'Invalid serial number format'
                    : ''
                }
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={addSerial}
                  disabled={
                    !currentSerial.trim() || 
                    checkSerialStatus(currentSerial) !== 'valid' ||
                    value.length >= maxSerials
                  }
                  startIcon={<AddIcon />}
                  size="small"
                >
                  Add
                </Button>
                <Tooltip title="QR Code Scanner">
                  <IconButton
                    onClick={() => setShowQrScanner(true)}
                    size="small"
                  >
                    <QrCodeIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Chip
          icon={<CheckIcon />}
          label={`${validSerials} Valid`}
          color="success"
          size="small"
        />
        {duplicateSerials > 0 && (
          <Chip
            icon={<WarningIcon />}
            label={`${duplicateSerials} Duplicates`}
            color="warning"
            size="small"
          />
        )}
        {invalidSerials > 0 && (
          <Chip
            icon={<WarningIcon />}
            label={`${invalidSerials} Invalid`}
            color="error"
            size="small"
          />
        )}
        <Chip
          label={`${value.length}/${maxSerials} Total`}
          color="info"
          size="small"
        />
      </Box>

      {/* Actions */}
      {value.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button
            size="small"
            onClick={() => setViewDialogOpen(true)}
            startIcon={<ViewIcon />}
          >
            View All
          </Button>
          <Button
            size="small"
            onClick={copyAllSerials}
            startIcon={<CopyIcon />}
          >
            Copy All
          </Button>
          <Button
            size="small"
            onClick={clearAllSerials}
            startIcon={<DeleteIcon />}
            color="error"
          >
            Clear All
          </Button>
        </Box>
      )}

      {/* Serial Numbers Preview */}
      {value.length > 0 && (
        <Card variant="outlined">
          <CardContent>
            <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {value.slice(0, 20).map((serial) => (
                  <Chip
                    key={serial.id}
                    label={serial.value}
                    color={getStatusColor(serial.status)}
                    size="small"
                    icon={getStatusIcon(serial.status)}
                    onDelete={() => removeSerial(serial.id)}
                    onClick={() => editSerial(serial)}
                    deleteIcon={<DeleteIcon />}
                  />
                ))}
                {value.length > 20 && (
                  <Chip
                    label={`+${value.length - 20} more`}
                    variant="outlined"
                    size="small"
                    onClick={() => setViewDialogOpen(true)}
                  />
                )}
              </Box>
            </Box>
            {value.length === 0 && (
              <Typography variant="body2" color="text.secondary" textAlign="center">
                No serial numbers added yet
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Validation Warnings */}
      {invalidSerials > 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {invalidSerials} serial number(s) have invalid format. Please fix them before proceeding.
        </Alert>
      )}

      {duplicateSerials > 0 && !allowDuplicates && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {duplicateSerials} duplicate serial number(s) detected. Please remove duplicates.
        </Alert>
      )}

      {/* View All Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          All Serial Numbers ({value.length})
        </DialogTitle>
        <DialogContent>
          <List>
            {value.map((serial, index) => (
              <React.Fragment key={serial.id}>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">
                          {serial.value}
                        </Typography>
                        <Chip
                          label={serial.status}
                          color={getStatusColor(serial.status)}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={`Added: ${new Date(serial.timestamp).toLocaleString()}`}
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Copy">
                      <IconButton onClick={() => copySerial(serial.value)} size="small">
                        <CopyIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton onClick={() => editSerial(serial)} size="small">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remove">
                      <IconButton onClick={() => removeSerial(serial.id)} size="small">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < value.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          <Button onClick={copyAllSerials} startIcon={<CopyIcon />}>
            Copy All
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Serial Number</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Serial Number"
            fullWidth
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            error={editValue.trim() && checkSerialStatus(editValue) !== 'valid'}
            helperText={
              editValue.trim() && checkSerialStatus(editValue) !== 'valid'
                ? checkSerialStatus(editValue) === 'duplicate'
                  ? 'Serial number already exists'
                  : 'Invalid serial number format'
                : ''
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={saveEditedSerial}
            variant="contained"
            disabled={!editValue.trim() || checkSerialStatus(editValue) !== 'valid'}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SerialNumberInput;
