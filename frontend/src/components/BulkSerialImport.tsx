import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Alert,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  ContentCopy as CopyIcon,
  Clear as ClearIcon,
  GetApp as TemplateIcon
} from '@mui/icons-material';
import { comprehensiveAPI } from '../services/business/comprehensiveApi';

interface SerialImportResult {
  success: boolean;
  processed: number;
  errors: string[];
  warnings: string[];
  imported_serials: string[];
}

interface BulkSerialImportProps {
  open: boolean;
  onClose: () => void;
  productId?: number;
  productName?: string;
  onImportComplete?: (result: SerialImportResult) => void;
}

const BulkSerialImport: React.FC<BulkSerialImportProps> = ({
  open,
  onClose,
  productId,
  productName,
  onImportComplete
}) => {
  const [serialNumbers, setSerialNumbers] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SerialImportResult | null>(null);
  const [importMode, setImportMode] = useState<'text' | 'file'>('text');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setSerialNumbers('');
    setResult(null);
    setImportMode('text');
    onClose();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setSerialNumbers(content);
      };
      reader.readAsText(file);
    }
  };

  const downloadTemplate = () => {
    const template = `# Bulk Serial Number Import Template
# Instructions:
# - One serial number per line
# - Lines starting with # are comments and will be ignored
# - Remove this comment section before importing

SERIAL001
SERIAL002
SERIAL003
SERIAL004
SERIAL005`;
    
    const blob = new Blob([template], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'serial_import_template.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const processSerialNumbers = (input: string): string[] => {
    return input
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .filter((serial, index, array) => array.indexOf(serial) === index); // Remove duplicates
  };

  const handleImport = async () => {
    if (!serialNumbers.trim()) {
      return;
    }

    try {
      setLoading(true);
      const processedSerials = processSerialNumbers(serialNumbers);
      
      if (processedSerials.length === 0) {
        setResult({
          success: false,
          processed: 0,
          errors: ['No valid serial numbers found'],
          warnings: [],
          imported_serials: []
        });
        return;
      }

      const response = await comprehensiveAPI.post('/inventory/bulk-serial-import', {
        product_id: productId,
        serial_numbers: processedSerials
      });

      const importResult: SerialImportResult = response.data;
      setResult(importResult);

      if (onImportComplete && importResult.success) {
        onImportComplete(importResult);
      }
    } catch (error: any) {
      console.error('Error importing serial numbers:', error);
      setResult({
        success: false,
        processed: 0,
        errors: [error.response?.data?.message || 'Failed to import serial numbers'],
        warnings: [],
        imported_serials: []
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSampleSerials = () => {
    const prefix = productName ? productName.substring(0, 3).toUpperCase() : 'SER';
    const samples = [];
    for (let i = 1; i <= 10; i++) {
      samples.push(`${prefix}${Date.now()}${i.toString().padStart(3, '0')}`);
    }
    setSerialNumbers(samples.join('\n'));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const previewSerials = processSerialNumbers(serialNumbers);
  const duplicateCount = serialNumbers.split('\n').length - previewSerials.length;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            Bulk Serial Number Import
            {productName && ` - ${productName}`}
          </Typography>
          <Box>
            <Tooltip title="Download Template">
              <IconButton onClick={downloadTemplate}>
                <TemplateIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Button
                variant={importMode === 'text' ? 'contained' : 'outlined'}
                onClick={() => setImportMode('text')}
                fullWidth
              >
                Text Input
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Button
                variant={importMode === 'file' ? 'contained' : 'outlined'}
                onClick={() => setImportMode('file')}
                fullWidth
              >
                File Upload
              </Button>
            </Grid>
          </Grid>
        </Box>

        {importMode === 'text' ? (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Enter Serial Numbers</Typography>
              <Button
                size="small"
                onClick={generateSampleSerials}
                startIcon={<CopyIcon />}
              >
                Generate Samples
              </Button>
            </Box>
            <TextField
              multiline
              rows={12}
              fullWidth
              value={serialNumbers}
              onChange={(e) => setSerialNumbers(e.target.value)}
              placeholder="Enter serial numbers, one per line..."
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                • One serial number per line
                • Lines starting with # are comments and will be ignored
                • Duplicates will be automatically removed
              </Typography>
            </Alert>
          </Box>
        ) : (
          <Box>
            <Typography variant="h6" gutterBottom>
              Upload File
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                textAlign: 'center',
                border: '2px dashed',
                borderColor: 'divider',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover'
                }
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" gutterBottom>
                Click to upload a text file containing serial numbers
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Supported formats: .txt, .csv
              </Typography>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </Paper>
            {serialNumbers && (
              <Alert severity="success" sx={{ mt: 2 }}>
                File loaded successfully! {previewSerials.length} serial numbers detected.
              </Alert>
            )}
          </Box>
        )}

        {/* Preview Section */}
        {serialNumbers && (
          <Box sx={{ mt: 3 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Preview
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip
                    icon={<CheckIcon />}
                    label={`${previewSerials.length} Valid Serial Numbers`}
                    color="success"
                    size="small"
                  />
                  {duplicateCount > 0 && (
                    <Chip
                      icon={<WarningIcon />}
                      label={`${duplicateCount} Duplicates Removed`}
                      color="warning"
                      size="small"
                    />
                  )}
                </Box>
                <Box sx={{ maxHeight: 150, overflow: 'auto' }}>
                  {previewSerials.slice(0, 10).map((serial, index) => (
                    <Chip
                      key={index}
                      label={serial}
                      size="small"
                      variant="outlined"
                      sx={{ m: 0.5 }}
                      deleteIcon={<CopyIcon />}
                      onDelete={() => copyToClipboard(serial)}
                    />
                  ))}
                  {previewSerials.length > 10 && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      ... and {previewSerials.length - 10} more
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Loading State */}
        {loading && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
              Importing serial numbers...
            </Typography>
          </Box>
        )}

        {/* Results */}
        {result && (
          <Box sx={{ mt: 3 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Import Results
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Alert 
                    severity={result.success ? 'success' : 'error'}
                    action={
                      result.success && (
                        <Chip
                          icon={<CheckIcon />}
                          label={`${result.processed} Imported`}
                          color="success"
                          size="small"
                        />
                      )
                    }
                  >
                    {result.success 
                      ? `Successfully imported ${result.processed} serial numbers`
                      : 'Import failed. Please check the errors below.'
                    }
                  </Alert>
                </Box>

                {/* Errors */}
                {result.errors.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="error" gutterBottom>
                      Errors:
                    </Typography>
                    <List dense>
                      {result.errors.map((error, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <ErrorIcon color="error" />
                          </ListItemIcon>
                          <ListItemText primary={error} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* Warnings */}
                {result.warnings.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="warning.main" gutterBottom>
                      Warnings:
                    </Typography>
                    <List dense>
                      {result.warnings.map((warning, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <WarningIcon color="warning" />
                          </ListItemIcon>
                          <ListItemText primary={warning} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* Successfully imported serials */}
                {result.imported_serials.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="success.main" gutterBottom>
                      Successfully Imported Serial Numbers:
                    </Typography>
                    <Box sx={{ maxHeight: 150, overflow: 'auto' }}>
                      {result.imported_serials.map((serial, index) => (
                        <Chip
                          key={index}
                          label={serial}
                          size="small"
                          color="success"
                          variant="outlined"
                          sx={{ m: 0.5 }}
                          deleteIcon={<CopyIcon />}
                          onDelete={() => copyToClipboard(serial)}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          {result ? 'Close' : 'Cancel'}
        </Button>
        {!result && (
          <Button
            variant="contained"
            onClick={handleImport}
            disabled={!serialNumbers.trim() || loading}
            startIcon={<UploadIcon />}
          >
            Import Serial Numbers
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BulkSerialImport;
