import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Box,
  Typography,
  Alert,
  Chip,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  AttachMoney as MoneyIcon,
  Percent as PercentIcon,
  Notes as NotesIcon
} from '@mui/icons-material';
import { Employee, EmployeeFormData, employeeApi } from '../services/employeeApi';
import {
  validateEmployeeForm,
  sanitizeEmployeeData,
  createFieldValidator,
  formatPhoneForDisplay,
  formatSalaryForDisplay,
  formatCommissionForDisplay,
  VALIDATION_MESSAGES
} from '../utils/employeeValidation';
import { useSnackbar } from 'notistack';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface EmployeeFormProps {
  open: boolean;
  onClose: () => void;
  employee?: Employee | null;
  onSuccess?: (employee: Employee) => void;
}

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Quản trị viên', color: 'error' },
  { value: 'cashier', label: 'Thu ngân', color: 'primary' },
  { value: 'sales_agent', label: 'Nhân viên kinh doanh', color: 'success' },
  { value: 'affiliate', label: 'Cộng tác viên', color: 'warning' }
] as const;

const STATUS_OPTIONS = [
  { value: 'active', label: 'Hoạt động', color: 'success' },
  { value: 'inactive', label: 'Không hoạt động', color: 'default' }
] as const;

export const EmployeeForm: React.FC<EmployeeFormProps> = ({
  open,
  onClose,
  employee,
  onSuccess
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  
  // Form state
  const [formData, setFormData] = useState<EmployeeFormData>({
    full_name: '',
    email: '',
    phone: '',
    role: 'cashier',
    commission_rate: 0,
    base_salary: 0,
    status: 'active',
    notes: ''
  });
  
  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  // Loading states
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  
  // Initialize form data when employee changes
  useEffect(() => {
    if (employee) {
      setFormData({
        full_name: employee.full_name,
        email: employee.email || '',
        phone: employee.phone || '',
        role: employee.role,
        commission_rate: employee.commission_rate,
        base_salary: employee.base_salary,
        status: employee.status,
        notes: employee.notes || ''
      });
    } else {
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        role: 'cashier',
        commission_rate: 0,
        base_salary: 0,
        status: 'active',
        notes: ''
      });
    }
    setErrors({});
    setWarnings({});
    setTouched({});
  }, [employee, open]);
  
  // Real-time validation
  useEffect(() => {
    const validation = validateEmployeeForm(formData);
    setErrors(validation.errors);
    setWarnings(validation.warnings);
  }, [formData]);
  
  // Email uniqueness check
  useEffect(() => {
    const checkEmailUniqueness = async () => {
      if (formData.email && formData.email.trim() && touched.email) {
        setIsCheckingEmail(true);
        try {
          const exists = await employeeApi.checkEmailExists(
            formData.email,
            employee?.id
          );
          if (exists) {
            setErrors(prev => ({ ...prev, email: VALIDATION_MESSAGES.EMAIL_EXISTS }));
          } else {
            setErrors(prev => {
              const newErrors = { ...prev };
              if (newErrors.email === VALIDATION_MESSAGES.EMAIL_EXISTS) {
                delete newErrors.email;
              }
              return newErrors;
            });
          }
        } catch (error) {
          console.warn('Email check failed:', error);
        } finally {
          setIsCheckingEmail(false);
        }
      }
    };
    
    const timeoutId = setTimeout(checkEmailUniqueness, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.email, touched.email, employee?.id]);
  
  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: EmployeeFormData) => employeeApi.createEmployee(data),
    onSuccess: (newEmployee) => {
      enqueueSnackbar('Tạo nhân viên thành công!', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      onSuccess?.(newEmployee);
      onClose();
    },
    onError: (error: Error) => {
      enqueueSnackbar(`Lỗi tạo nhân viên: ${error.message}`, { variant: 'error' });
    }
  });
  
  const updateMutation = useMutation({
    mutationFn: (data: Partial<EmployeeFormData>) => 
      employeeApi.updateEmployee(employee!.id, data),
    onSuccess: (updatedEmployee) => {
      enqueueSnackbar('Cập nhật nhân viên thành công!', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      onSuccess?.(updatedEmployee);
      onClose();
    },
    onError: (error: Error) => {
      enqueueSnackbar(`Lỗi cập nhật nhân viên: ${error.message}`, { variant: 'error' });
    }
  });
  
  // Event handlers
  const handleFieldChange = (field: keyof EmployeeFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
  };
  
  const handleSelectChange = (field: keyof EmployeeFormData) => (
    event: any
  ) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
  };
  
  const handleNumberChange = (field: keyof EmployeeFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseFloat(event.target.value) || 0;
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
  };
  
  const handleSubmit = async () => {
    // Mark all fields as touched
    const allFields = Object.keys(formData) as (keyof EmployeeFormData)[];
    setTouched(allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {}));
    
    // Validate form
    const validation = validateEmployeeForm(formData);
    if (!validation.isValid) {
      enqueueSnackbar('Vui lòng kiểm tra lại thông tin nhập vào', { variant: 'error' });
      return;
    }
    
    // Sanitize data
    const sanitizedData = sanitizeEmployeeData(formData);
    
    // Submit
    if (employee) {
      updateMutation.mutate(sanitizedData);
    } else {
      createMutation.mutate(sanitizedData as EmployeeFormData);
    }
  };
  
  const isLoading = createMutation.isPending || updateMutation.isPending;
  const hasErrors = Object.keys(errors).length > 0;
  const hasWarnings = Object.keys(warnings).length > 0;
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <PersonIcon />
          <Typography variant="h6">
            {employee ? 'Sửa thông tin nhân viên' : 'Thêm nhân viên mới'}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {/* Warnings */}
          {hasWarnings && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Cảnh báo: {Object.values(warnings).join(', ')}
              </Typography>
            </Alert>
          )}
          
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Thông tin cơ bản
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Họ và tên"
                value={formData.full_name}
                onChange={handleFieldChange('full_name')}
                error={touched.full_name && !!errors.full_name}
                helperText={touched.full_name && errors.full_name}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleFieldChange('email')}
                error={touched.email && !!errors.email}
                helperText={touched.email && errors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  ),
                  endAdornment: isCheckingEmail ? (
                    <InputAdornment position="end">
                      <CircularProgress size={20} />
                    </InputAdornment>
                  ) : undefined
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Số điện thoại"
                value={formData.phone}
                onChange={handleFieldChange('phone')}
                error={touched.phone && !!errors.phone}
                helperText={touched.phone && errors.phone}
                placeholder="0901234567"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={touched.role && !!errors.role}>
                <InputLabel>Vai trò</InputLabel>
                <Select
                  value={formData.role}
                  onChange={handleSelectChange('role')}
                  label="Vai trò"
                >
                  {ROLE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          label={option.label}
                          color={option.color as any}
                          size="small"
                        />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {touched.role && errors.role && (
                  <FormHelperText>{errors.role}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* Salary & Commission Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Thông tin lương & hoa hồng
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Lương cơ bản (VND)"
                type="number"
                value={formData.base_salary}
                onChange={handleNumberChange('base_salary')}
                error={touched.base_salary && !!errors.base_salary}
                helperText={touched.base_salary && (errors.base_salary || `Hiển thị: ${formatSalaryForDisplay(formData.base_salary)}`)}
                inputProps={{ min: 0, step: 100000 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MoneyIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tỷ lệ hoa hồng (%)"
                type="number"
                value={formData.commission_rate}
                onChange={handleNumberChange('commission_rate')}
                error={touched.commission_rate && !!errors.commission_rate}
                helperText={touched.commission_rate && (errors.commission_rate || `Hiển thị: ${formatCommissionForDisplay(formData.commission_rate)}`)}
                inputProps={{ min: 0, max: 100, step: 0.1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PercentIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            {/* Status & Notes */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Trạng thái & Ghi chú
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={touched.status && !!errors.status}>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={formData.status}
                  onChange={handleSelectChange('status')}
                  label="Trạng thái"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          label={option.label}
                          color={option.color as any}
                          size="small"
                        />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {touched.status && errors.status && (
                  <FormHelperText>{errors.status}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ghi chú"
                multiline
                rows={3}
                value={formData.notes}
                onChange={handleFieldChange('notes')}
                error={touched.notes && !!errors.notes}
                helperText={touched.notes && errors.notes}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <NotesIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Hủy
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isLoading || hasErrors}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
        >
          {employee ? 'Cập nhật' : 'Tạo mới'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
