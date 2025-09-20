import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Box,
  TextField,
  FormControlLabel,
  Checkbox,
  Chip,
  IconButton,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  RadioGroup,
  Radio,
  FormLabel
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  FileDownload as FileDownloadIcon,
  Email as EmailIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';

interface ExportOption {
  id: string;
  name: string;
  description: string;
  format: 'csv' | 'excel' | 'pdf';
  icon: React.ReactNode;
}

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  onExport: (config: ExportConfig) => void;
  module: 'products' | 'inventory' | 'sales' | 'customers' | 'employees';
}

interface ExportConfig {
  format: 'csv' | 'excel' | 'pdf';
  dateRange: {
    start: string;
    end: string;
  };
  filters: {
    status?: string;
    category?: string;
    department?: string;
  };
  columns: string[];
  email?: string;
  schedule?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
  };
}

const ExportModal: React.FC<ExportModalProps> = ({
  open,
  onClose,
  onExport,
  module
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [config, setConfig] = useState<ExportConfig>({
    format: 'excel',
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    filters: {},
    columns: [],
    schedule: {
      enabled: false,
      frequency: 'daily',
      time: '09:00'
    }
  });

  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  const exportOptions: ExportOption[] = [
    {
      id: 'csv',
      name: 'CSV',
      description: 'Tệp CSV có thể mở bằng Excel',
      format: 'csv',
      icon: <FileDownloadIcon />
    },
    {
      id: 'excel',
      name: 'Excel',
      description: 'Tệp Excel với định dạng đẹp',
      format: 'excel',
      icon: <FileDownloadIcon />
    },
    {
      id: 'pdf',
      name: 'PDF',
      description: 'Tệp PDF để in ấn',
      format: 'pdf',
      icon: <FileDownloadIcon />
    }
  ];

  const getModuleColumns = () => {
    switch (module) {
      case 'products':
        return [
          { id: 'name', name: 'Tên sản phẩm', required: true },
          { id: 'sku', name: 'SKU', required: true },
          { id: 'price', name: 'Giá bán', required: true },
          { id: 'cost', name: 'Giá vốn', required: false },
          { id: 'stock', name: 'Tồn kho', required: true },
          { id: 'category', name: 'Danh mục', required: false },
          { id: 'brand', name: 'Thương hiệu', required: false },
          { id: 'status', name: 'Trạng thái', required: false }
        ];
      case 'inventory':
        return [
          { id: 'product_name', name: 'Tên sản phẩm', required: true },
          { id: 'sku', name: 'SKU', required: true },
          { id: 'current_stock', name: 'Tồn hiện tại', required: true },
          { id: 'min_stock', name: 'Tồn tối thiểu', required: false },
          { id: 'max_stock', name: 'Tồn tối đa', required: false },
          { id: 'location', name: 'Vị trí', required: false },
          { id: 'last_updated', name: 'Cập nhật cuối', required: false }
        ];
      case 'sales':
        return [
          { id: 'order_number', name: 'Số đơn hàng', required: true },
          { id: 'customer_name', name: 'Khách hàng', required: true },
          { id: 'total_amount', name: 'Tổng tiền', required: true },
          { id: 'payment_method', name: 'Phương thức thanh toán', required: false },
          { id: 'status', name: 'Trạng thái', required: false },
          { id: 'created_at', name: 'Ngày tạo', required: true },
          { id: 'items', name: 'Chi tiết sản phẩm', required: false }
        ];
      case 'customers':
        return [
          { id: 'full_name', name: 'Họ tên', required: true },
          { id: 'phone', name: 'Số điện thoại', required: true },
          { id: 'email', name: 'Email', required: false },
          { id: 'address', name: 'Địa chỉ', required: false },
          { id: 'total_spent', name: 'Tổng chi tiêu', required: false },
          { id: 'loyalty_points', name: 'Điểm tích lũy', required: false },
          { id: 'created_at', name: 'Ngày đăng ký', required: false }
        ];
      case 'employees':
        return [
          { id: 'full_name', name: 'Họ tên', required: true },
          { id: 'employee_id', name: 'Mã nhân viên', required: true },
          { id: 'email', name: 'Email', required: true },
          { id: 'phone', name: 'Số điện thoại', required: false },
          { id: 'department', name: 'Phòng ban', required: false },
          { id: 'position', name: 'Chức vụ', required: false },
          { id: 'salary', name: 'Lương', required: false },
          { id: 'hire_date', name: 'Ngày vào làm', required: false }
        ];
      default:
        return [];
    }
  };

  const columns = getModuleColumns();

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleExport = () => {
    const finalConfig = {
      ...config,
      columns: selectedColumns.length > 0 ? selectedColumns : columns.filter(c => c.required).map(c => c.id)
    };
    onExport(finalConfig);
    onClose();
  };

  const handleColumnToggle = (columnId: string) => {
    setSelectedColumns(prev => 
      prev.includes(columnId) 
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  };

  const steps = [
    'Chọn định dạng',
    'Thiết lập bộ lọc',
    'Chọn cột dữ liệu',
    'Tùy chọn gửi'
  ];

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Chọn định dạng xuất file
              </Typography>
            </Grid>
            {exportOptions.map((option) => (
              <Grid item xs={12} sm={4} key={option.id}>
                <Box
                  p={2}
                  border={1}
                  borderColor={config.format === option.format ? 'primary.main' : 'grey.300'}
                  borderRadius={1}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'primary.50'
                    }
                  }}
                  onClick={() => setConfig({ ...config, format: option.format })}
                >
                  <Box display="flex" alignItems="center" gap={2} mb={1}>
                    {option.icon}
                    <Typography variant="h6">{option.name}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {option.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Thiết lập bộ lọc dữ liệu
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Từ ngày"
                value={new Date(config.dateRange.start)}
                onChange={(date) => setConfig({
                  ...config,
                  dateRange: {
                    ...config.dateRange,
                    start: date?.toISOString().split('T')[0] || ''
                  }
                })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Đến ngày"
                value={new Date(config.dateRange.end)}
                onChange={(date) => setConfig({
                  ...config,
                  dateRange: {
                    ...config.dateRange,
                    end: date?.toISOString().split('T')[0] || ''
                  }
                })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            {module === 'products' && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Danh mục</InputLabel>
                  <Select
                    value={config.filters.category || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      filters: { ...config.filters, category: e.target.value }
                    })}
                  >
                    <MenuItem value="">Tất cả</MenuItem>
                    <MenuItem value="laptop">Laptop</MenuItem>
                    <MenuItem value="desktop">Desktop</MenuItem>
                    <MenuItem value="accessories">Phụ kiện</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            {module === 'employees' && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Phòng ban</InputLabel>
                  <Select
                    value={config.filters.department || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      filters: { ...config.filters, department: e.target.value }
                    })}
                  >
                    <MenuItem value="">Tất cả</MenuItem>
                    <MenuItem value="sales">Bán hàng</MenuItem>
                    <MenuItem value="inventory">Kho</MenuItem>
                    <MenuItem value="admin">Quản trị</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Chọn cột dữ liệu cần xuất
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" gap={1} mb={2}>
                <Button
                  size="small"
                  onClick={() => setSelectedColumns(columns.map(c => c.id))}
                >
                  Chọn tất cả
                </Button>
                <Button
                  size="small"
                  onClick={() => setSelectedColumns(columns.filter(c => c.required).map(c => c.id))}
                >
                  Chỉ cột bắt buộc
                </Button>
                <Button
                  size="small"
                  onClick={() => setSelectedColumns([])}
                >
                  Bỏ chọn tất cả
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Grid container spacing={1}>
                {columns.map((column) => (
                  <Grid item xs={12} sm={6} md={4} key={column.id}>
                    <Box
                      p={1}
                      border={1}
                      borderColor={selectedColumns.includes(column.id) ? 'primary.main' : 'grey.300'}
                      borderRadius={1}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: 'primary.50'
                        }
                      }}
                      onClick={() => handleColumnToggle(column.id)}
                    >
                      <Box display="flex" alignItems="center" gap={1}>
                        <Checkbox
                          checked={selectedColumns.includes(column.id)}
                          size="small"
                        />
                        <Typography variant="body2">
                          {column.name}
                        </Typography>
                        {column.required && (
                          <Chip label="Bắt buộc" size="small" color="error" />
                        )}
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Tùy chọn gửi file
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Cách thức nhận file</FormLabel>
                <RadioGroup
                  value={config.email ? 'email' : 'download'}
                  onChange={(e) => setConfig({
                    ...config,
                    email: e.target.value === 'email' ? '' : undefined
                  })}
                >
                  <FormControlLabel
                    value="download"
                    control={<Radio />}
                    label="Tải xuống trực tiếp"
                  />
                  <FormControlLabel
                    value="email"
                    control={<Radio />}
                    label="Gửi qua email"
                  />
                </RadioGroup>
              </FormControl>
            </Grid>
            {config.email !== undefined && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email nhận file"
                  type="email"
                  value={config.email || ''}
                  onChange={(e) => setConfig({ ...config, email: e.target.value })}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={config.schedule?.enabled || false}
                    onChange={(e) => setConfig({
                      ...config,
                      schedule: {
                        ...config.schedule!,
                        enabled: e.target.checked
                      }
                    })}
                  />
                }
                label="Lên lịch xuất file định kỳ"
              />
            </Grid>
            {config.schedule?.enabled && (
              <>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Tần suất</InputLabel>
                    <Select
                      value={config.schedule.frequency}
                      onChange={(e) => setConfig({
                        ...config,
                        schedule: {
                          ...config.schedule!,
                          frequency: e.target.value as 'daily' | 'weekly' | 'monthly'
                        }
                      })}
                    >
                      <MenuItem value="daily">Hàng ngày</MenuItem>
                      <MenuItem value="weekly">Hàng tuần</MenuItem>
                      <MenuItem value="monthly">Hàng tháng</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Thời gian"
                    type="time"
                    value={config.schedule.time}
                    onChange={(e) => setConfig({
                      ...config,
                      schedule: {
                        ...config.schedule!,
                        time: e.target.value
                      }
                    })}
                  />
                </Grid>
              </>
            )}
          </Grid>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <DownloadIcon />
              <Typography variant="h6">Xuất dữ liệu {module}</Typography>
            </Box>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ maxWidth: 600, margin: '0 auto' }}>
            <Stepper activeStep={activeStep} orientation="horizontal">
              {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <Box sx={{ mt: 3 }}>
              {getStepContent(activeStep)}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Hủy
          </Button>
          {activeStep > 0 && (
            <Button onClick={handleBack} color="inherit">
              Quay lại
            </Button>
          )}
          {activeStep < steps.length - 1 ? (
            <Button onClick={handleNext} variant="contained" color="primary">
              Tiếp theo
            </Button>
          ) : (
            <Button
              onClick={handleExport}
              variant="contained"
              color="primary"
              startIcon={<DownloadIcon />}
            >
              Xuất file
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default ExportModal;
