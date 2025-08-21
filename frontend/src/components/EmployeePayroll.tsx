/**
 * Employee Payroll Component
 * Quản lý lương, hoa hồng và bảng lương của nhân viên
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Tooltip,
  Badge,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  Tabs,
  Tab
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  TrendingUp as TrendingIcon,
  Work as WorkIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  Receipt as ReceiptIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Visibility as ViewIcon,
  Calculate as CalculateIcon
} from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/api';
import { formatCurrency, formatDate } from '../utils/format';
import { useSnackbar } from 'notistack';

interface EmployeePayrollProps {
  employee: any;
  onClose: () => void;
}

interface PayrollEntry {
  id?: number;
  month: string;
  year: number;
  base_salary: number;
  commission_amount: number;
  overtime_hours: number;
  overtime_rate: number;
  deductions: number;
  bonuses: number;
  total_salary: number;
  status: 'pending' | 'paid' | 'cancelled';
  paid_date?: string;
  notes?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`payroll-tabpanel-${index}`}
      aria-labelledby={`payroll-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const EmployeePayroll: React.FC<EmployeePayrollProps> = ({
  employee,
  onClose
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [openPayrollDialog, setOpenPayrollDialog] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollEntry | null>(null);
  const [payrollForm, setPayrollForm] = useState<PayrollEntry>({
    month: '',
    year: new Date().getFullYear(),
    base_salary: employee.salary || 0,
    commission_amount: 0,
    overtime_hours: 0,
    overtime_rate: 1.5,
    deductions: 0,
    bonuses: 0,
    total_salary: 0,
    status: 'pending',
    notes: ''
  });

  // Mock data - trong thực tế sẽ lấy từ API
  const [payrolls, setPayrolls] = useState<PayrollEntry[]>([
    {
      id: 1,
      month: '12',
      year: 2023,
      base_salary: 8000000,
      commission_amount: 1200000,
      overtime_hours: 20,
      overtime_rate: 1.5,
      deductions: 400000,
      bonuses: 500000,
      total_salary: 9800000,
      status: 'paid',
      paid_date: '2023-12-31',
      notes: 'Lương tháng 12/2023'
    },
    {
      id: 2,
      month: '11',
      year: 2023,
      base_salary: 8000000,
      commission_amount: 800000,
      overtime_hours: 15,
      overtime_rate: 1.5,
      deductions: 400000,
      bonuses: 300000,
      total_salary: 8850000,
      status: 'paid',
      paid_date: '2023-11-30',
      notes: 'Lương tháng 11/2023'
    }
  ]);

  const handleAddPayroll = () => {
    setSelectedPayroll(null);
    setPayrollForm({
      month: '',
      year: new Date().getFullYear(),
      base_salary: employee.salary || 0,
      commission_amount: 0,
      overtime_hours: 0,
      overtime_rate: 1.5,
      deductions: 0,
      bonuses: 0,
      total_salary: 0,
      status: 'pending',
      notes: ''
    });
    setOpenPayrollDialog(true);
  };

  const handleEditPayroll = (payroll: PayrollEntry) => {
    setSelectedPayroll(payroll);
    setPayrollForm(payroll);
    setOpenPayrollDialog(true);
  };

  const handleDeletePayroll = (id: number) => {
    setPayrolls(prev => prev.filter(p => p.id !== id));
    enqueueSnackbar('Xóa bảng lương thành công!', { variant: 'success' });
  };

  const calculateTotalSalary = () => {
    const overtimePay = payrollForm.overtime_hours * payrollForm.overtime_rate * (payrollForm.base_salary / 160);
    const total = payrollForm.base_salary + payrollForm.commission_amount + overtimePay + payrollForm.bonuses - payrollForm.deductions;
    setPayrollForm(prev => ({ ...prev, total_salary: total }));
  };

  const handleSavePayroll = () => {
    if (selectedPayroll) {
      // Update existing payroll
      setPayrolls(prev => prev.map(p => 
        p.id === selectedPayroll.id ? { ...payrollForm, id: p.id } : p
      ));
      enqueueSnackbar('Cập nhật bảng lương thành công!', { variant: 'success' });
    } else {
      // Add new payroll
      const newPayroll = {
        ...payrollForm,
        id: Date.now()
      };
      setPayrolls(prev => [...prev, newPayroll]);
      enqueueSnackbar('Thêm bảng lương thành công!', { variant: 'success' });
    }
    setOpenPayrollDialog(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Đã thanh toán';
      case 'pending': return 'Chờ thanh toán';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const getMonthName = (month: string) => {
    const months = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];
    return months[parseInt(month) - 1] || month;
  };

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const currentPayroll = payrolls.find(p => p.month === currentMonth.toString() && p.year === currentYear);

  return (
    <Dialog open={true} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <MoneyIcon color="primary" />
            <Typography variant="h6">
              Quản lý lương - {employee.full_name}
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddPayroll}
            >
              Thêm bảng lương
            </Button>
            <Button variant="outlined" onClick={onClose}>
              Đóng
            </Button>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Tổng quan" />
            <Tab label="Bảng lương" />
            <Tab label="Tính toán" />
            <Tab label="Báo cáo" />
          </Tabs>
        </Box>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Current Month Summary */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Tháng hiện tại" />
                <CardContent>
                  {currentPayroll ? (
                    <Box>
                      <Typography variant="h4" color="primary" gutterBottom>
                        {formatCurrency(currentPayroll.total_salary)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Tổng lương tháng {getMonthName(currentPayroll.month)}/{currentPayroll.year}
                      </Typography>
                      
                      <Grid container spacing={2} sx={{ mt: 2 }}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Lương cơ bản
                          </Typography>
                          <Typography variant="h6">
                            {formatCurrency(currentPayroll.base_salary)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Hoa hồng
                          </Typography>
                          <Typography variant="h6" color="success.main">
                            {formatCurrency(currentPayroll.commission_amount)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Làm thêm giờ
                          </Typography>
                          <Typography variant="h6" color="warning.main">
                            {formatCurrency(currentPayroll.overtime_hours * currentPayroll.overtime_rate * (currentPayroll.base_salary / 160))}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Thưởng
                          </Typography>
                          <Typography variant="h6" color="info.main">
                            {formatCurrency(currentPayroll.bonuses)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  ) : (
                    <Box textAlign="center" py={3}>
                      <Typography variant="body1" color="textSecondary">
                        Chưa có bảng lương tháng {getMonthName(currentMonth.toString())}/{currentYear}
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddPayroll}
                        sx={{ mt: 2 }}
                      >
                        Tạo bảng lương
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Salary Statistics */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Thống kê lương" />
                <CardContent>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <MoneyIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Lương trung bình"
                        secondary={formatCurrency(payrolls.reduce((sum, p) => sum + p.total_salary, 0) / Math.max(payrolls.length, 1))}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <TrendingIcon color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Tổng hoa hồng"
                        secondary={formatCurrency(payrolls.reduce((sum, p) => sum + p.commission_amount, 0))}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <WorkIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Tổng giờ làm thêm"
                        secondary={`${payrolls.reduce((sum, p) => sum + p.overtime_hours, 0)} giờ`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <AssessmentIcon color="info" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Tháng có lương cao nhất"
                        secondary={(() => {
                          const maxPayroll = payrolls.reduce((max, p) => p.total_salary > max.total_salary ? p : max, payrolls[0]);
                          return maxPayroll ? `${getMonthName(maxPayroll.month)}/${maxPayroll.year}` : 'N/A';
                        })()}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Salary Trend Chart */}
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Biểu đồ lương 6 tháng gần đây" />
                <CardContent>
                  <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body1" color="textSecondary">
                      Biểu đồ lương sẽ được hiển thị ở đây
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Payroll Table Tab */}
        <TabPanel value={tabValue} index={1}>
          <Card>
            <CardHeader 
              title="Bảng lương chi tiết"
              action={
                <Box display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    startIcon={<PrintIcon />}
                    onClick={() => {/* Print payroll */}}
                  >
                    In bảng lương
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => {/* Export payroll */}}
                  >
                    Xuất Excel
                  </Button>
                </Box>
              }
            />
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Tháng/Năm</TableCell>
                      <TableCell>Lương cơ bản</TableCell>
                      <TableCell>Hoa hồng</TableCell>
                      <TableCell>Làm thêm</TableCell>
                      <TableCell>Thưởng</TableCell>
                      <TableCell>Khấu trừ</TableCell>
                      <TableCell>Tổng lương</TableCell>
                      <TableCell>Trạng thái</TableCell>
                      <TableCell>Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payrolls.map((payroll) => (
                      <TableRow key={payroll.id}>
                        <TableCell>
                          <Typography variant="body2">
                            {getMonthName(payroll.month)}/{payroll.year}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatCurrency(payroll.base_salary)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="success.main">
                            {formatCurrency(payroll.commission_amount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="warning.main">
                            {formatCurrency(payroll.overtime_hours * payroll.overtime_rate * (payroll.base_salary / 160))}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="info.main">
                            {formatCurrency(payroll.bonuses)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="error.main">
                            {formatCurrency(payroll.deductions)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="h6" color="primary">
                            {formatCurrency(payroll.total_salary)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusText(payroll.status)}
                            color={getStatusColor(payroll.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <Tooltip title="Xem chi tiết">
                              <IconButton size="small">
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Chỉnh sửa">
                              <IconButton
                                size="small"
                                onClick={() => handleEditPayroll(payroll)}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Xóa">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => payroll.id && handleDeletePayroll(payroll.id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Calculator Tab */}
        <TabPanel value={tabValue} index={2}>
          <Card>
            <CardHeader title="Tính toán lương" />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Thông tin cơ bản
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Lương cơ bản"
                        type="number"
                        value={payrollForm.base_salary}
                        onChange={(e) => setPayrollForm({ ...payrollForm, base_salary: parseFloat(e.target.value) || 0 })}
                        InputProps={{
                          startAdornment: <MoneyIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Hoa hồng"
                        type="number"
                        value={payrollForm.commission_amount}
                        onChange={(e) => setPayrollForm({ ...payrollForm, commission_amount: parseFloat(e.target.value) || 0 })}
                        InputProps={{
                          startAdornment: <TrendingIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Giờ làm thêm"
                        type="number"
                        value={payrollForm.overtime_hours}
                        onChange={(e) => setPayrollForm({ ...payrollForm, overtime_hours: parseFloat(e.target.value) || 0 })}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Hệ số làm thêm"
                        type="number"
                        value={payrollForm.overtime_rate}
                        onChange={(e) => setPayrollForm({ ...payrollForm, overtime_rate: parseFloat(e.target.value) || 1.5 })}
                      />
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Kết quả tính toán
                  </Typography>
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Lương cơ bản
                        </Typography>
                        <Typography variant="h6">
                          {formatCurrency(payrollForm.base_salary)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Hoa hồng
                        </Typography>
                        <Typography variant="h6" color="success.main">
                          {formatCurrency(payrollForm.commission_amount)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Làm thêm giờ
                        </Typography>
                        <Typography variant="h6" color="warning.main">
                          {formatCurrency(payrollForm.overtime_hours * payrollForm.overtime_rate * (payrollForm.base_salary / 160))}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Tổng lương
                        </Typography>
                        <Typography variant="h4" color="primary">
                          {formatCurrency(payrollForm.total_salary)}
                        </Typography>
                      </Grid>
                    </Grid>
                    
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<CalculateIcon />}
                      onClick={calculateTotalSalary}
                      sx={{ mt: 2 }}
                    >
                      Tính toán
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Reports Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Báo cáo lương" />
                <CardContent>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <ReceiptIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Báo cáo lương tháng"
                        secondary="Tạo báo cáo lương chi tiết theo tháng"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <AssessmentIcon color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Báo cáo hoa hồng"
                        secondary="Phân tích hiệu suất hoa hồng"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <WorkIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Báo cáo làm thêm giờ"
                        secondary="Thống kê giờ làm thêm"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Xuất báo cáo" />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={() => {/* Export monthly report */}}
                      >
                        Xuất báo cáo tháng
                      </Button>
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={() => {/* Export yearly report */}}
                      >
                        Xuất báo cáo năm
                      </Button>
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<PrintIcon />}
                        onClick={() => {/* Print report */}}
                      >
                        In báo cáo
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </DialogContent>

      {/* Payroll Dialog */}
      <Dialog
        open={openPayrollDialog}
        onClose={() => setOpenPayrollDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedPayroll ? 'Chỉnh sửa bảng lương' : 'Thêm bảng lương'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                select
                label="Tháng"
                value={payrollForm.month}
                onChange={(e) => setPayrollForm({ ...payrollForm, month: e.target.value })}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <MenuItem key={i + 1} value={(i + 1).toString()}>
                    Tháng {i + 1}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Năm"
                type="number"
                value={payrollForm.year}
                onChange={(e) => setPayrollForm({ ...payrollForm, year: parseInt(e.target.value) || new Date().getFullYear() })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Lương cơ bản"
                type="number"
                value={payrollForm.base_salary}
                onChange={(e) => setPayrollForm({ ...payrollForm, base_salary: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Hoa hồng"
                type="number"
                value={payrollForm.commission_amount}
                onChange={(e) => setPayrollForm({ ...payrollForm, commission_amount: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Giờ làm thêm"
                type="number"
                value={payrollForm.overtime_hours}
                onChange={(e) => setPayrollForm({ ...payrollForm, overtime_hours: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Hệ số làm thêm"
                type="number"
                value={payrollForm.overtime_rate}
                onChange={(e) => setPayrollForm({ ...payrollForm, overtime_rate: parseFloat(e.target.value) || 1.5 })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Thưởng"
                type="number"
                value={payrollForm.bonuses}
                onChange={(e) => setPayrollForm({ ...payrollForm, bonuses: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Khấu trừ"
                type="number"
                value={payrollForm.deductions}
                onChange={(e) => setPayrollForm({ ...payrollForm, deductions: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Ghi chú"
                value={payrollForm.notes}
                onChange={(e) => setPayrollForm({ ...payrollForm, notes: e.target.value })}
                placeholder="Ghi chú về bảng lương..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPayrollDialog(false)}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSavePayroll}
            disabled={!payrollForm.month || !payrollForm.year}
          >
            {selectedPayroll ? 'Cập nhật' : 'Thêm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};
