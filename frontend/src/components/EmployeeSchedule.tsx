/**
 * Employee Schedule Component
 * Quản lý lịch làm việc và ca làm việc của nhân viên
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
  ListItemIcon
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  AccessTime as TimeIcon,
  Work as WorkIcon,
  Event as EventIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Save as SaveIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/api';
import { useSnackbar } from 'notistack';

interface EmployeeScheduleProps {
  employee: any;
  onClose: () => void;
}

interface ScheduleEntry {
  id?: number;
  date: string;
  shift_type: 'morning' | 'afternoon' | 'night' | 'full_day';
  start_time: string;
  end_time: string;
  is_working_day: boolean;
  notes?: string;
}

const SHIFT_TYPES = {
  morning: { label: 'Ca sáng', color: 'success', start: '08:00', end: '16:00' },
  afternoon: { label: 'Ca chiều', color: 'warning', start: '16:00', end: '00:00' },
  night: { label: 'Ca đêm', color: 'error', start: '00:00', end: '08:00' },
  full_day: { label: 'Cả ngày', color: 'primary', start: '08:00', end: '18:00' }
};

export const EmployeeSchedule: React.FC<EmployeeScheduleProps> = ({
  employee,
  onClose
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [openScheduleDialog, setOpenScheduleDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleEntry | null>(null);
  const [scheduleForm, setScheduleForm] = useState<ScheduleEntry>({
    date: '',
    shift_type: 'full_day',
    start_time: '08:00',
    end_time: '18:00',
    is_working_day: true,
    notes: ''
  });

  // Mock data - trong thực tế sẽ lấy từ API
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([
    {
      id: 1,
      date: '2024-01-15',
      shift_type: 'morning',
      start_time: '08:00',
      end_time: '16:00',
      is_working_day: true,
      notes: 'Ca sáng bình thường'
    },
    {
      id: 2,
      date: '2024-01-16',
      shift_type: 'full_day',
      start_time: '08:00',
      end_time: '18:00',
      is_working_day: true,
      notes: 'Làm cả ngày'
    },
    {
      id: 3,
      date: '2024-01-17',
      shift_type: 'afternoon',
      start_time: '16:00',
      end_time: '00:00',
      is_working_day: true,
      notes: 'Ca chiều'
    }
  ]);

  const handleAddSchedule = () => {
    setSelectedSchedule(null);
    setScheduleForm({
      date: '',
      shift_type: 'full_day',
      start_time: '08:00',
      end_time: '18:00',
      is_working_day: true,
      notes: ''
    });
    setOpenScheduleDialog(true);
  };

  const handleEditSchedule = (schedule: ScheduleEntry) => {
    setSelectedSchedule(schedule);
    setScheduleForm(schedule);
    setOpenScheduleDialog(true);
  };

  const handleDeleteSchedule = (id: number) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
    enqueueSnackbar('Xóa lịch làm việc thành công!', { variant: 'success' });
  };

  const handleSaveSchedule = () => {
    if (selectedSchedule) {
      // Update existing schedule
      setSchedules(prev => prev.map(s => 
        s.id === selectedSchedule.id ? { ...scheduleForm, id: s.id } : s
      ));
      enqueueSnackbar('Cập nhật lịch làm việc thành công!', { variant: 'success' });
    } else {
      // Add new schedule
      const newSchedule = {
        ...scheduleForm,
        id: Date.now()
      };
      setSchedules(prev => [...prev, newSchedule]);
      enqueueSnackbar('Thêm lịch làm việc thành công!', { variant: 'success' });
    }
    setOpenScheduleDialog(false);
  };

  const handleShiftTypeChange = (shiftType: string) => {
    const shift = SHIFT_TYPES[shiftType as keyof typeof SHIFT_TYPES];
    setScheduleForm({
      ...scheduleForm,
      shift_type: shiftType as any,
      start_time: shift.start,
      end_time: shift.end
    });
  };

  const getShiftColor = (shiftType: string) => {
    return SHIFT_TYPES[shiftType as keyof typeof SHIFT_TYPES]?.color || 'default';
  };

  const getShiftLabel = (shiftType: string) => {
    return SHIFT_TYPES[shiftType as keyof typeof SHIFT_TYPES]?.label || shiftType;
  };

  const getWorkingHours = (start: string, end: string) => {
    const startHour = parseInt(start.split(':')[0]);
    const endHour = parseInt(end.split(':')[0]);
    let hours = endHour - startHour;
    if (hours < 0) hours += 24; // Handle overnight shifts
    return `${hours} giờ`;
  };

  const getCurrentWeekSchedules = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const weekSchedules = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const schedule = schedules.find(s => s.date === dateStr);
      
      weekSchedules.push({
        date: dateStr,
        dayName: date.toLocaleDateString('vi-VN', { weekday: 'short' }),
        schedule
      });
    }
    return weekSchedules;
  };

  const weekSchedules = getCurrentWeekSchedules();

  return (
    <Dialog open={true} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <ScheduleIcon color="primary" />
            <Typography variant="h6">
              Lịch làm việc - {employee.full_name}
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddSchedule}
            >
              Thêm lịch
            </Button>
            <Button variant="outlined" onClick={onClose}>
              Đóng
            </Button>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Weekly Schedule Overview */}
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Lịch làm việc tuần này" />
              <CardContent>
                <Grid container spacing={1}>
                  {weekSchedules.map((day, index) => (
                    <Grid item xs={12} sm={6} md={1.7} key={index}>
                      <Paper 
                        sx={{ 
                          p: 2, 
                          textAlign: 'center',
                          bgcolor: day.schedule ? 'primary.light' : 'grey.100',
                          color: day.schedule ? 'white' : 'text.primary'
                        }}
                      >
                        <Typography variant="h6" gutterBottom>
                          {day.dayName}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          {new Date(day.date).getDate()}/{new Date(day.date).getMonth() + 1}
                        </Typography>
                        {day.schedule ? (
                          <Box>
                            <Chip
                              label={getShiftLabel(day.schedule.shift_type)}
                              color={getShiftColor(day.schedule.shift_type) as any}
                              size="small"
                              sx={{ mb: 1 }}
                            />
                            <Typography variant="caption" display="block">
                              {day.schedule.start_time} - {day.schedule.end_time}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="caption" color="textSecondary">
                            Nghỉ
                          </Typography>
                        )}
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Schedule Statistics */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="Thống kê tháng" />
              <CardContent>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <WorkIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Ngày làm việc"
                      secondary={`${schedules.filter(s => s.is_working_day).length} ngày`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <TimeIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Tổng giờ làm"
                      secondary={`${schedules.reduce((total, s) => 
                        total + parseInt(getWorkingHours(s.start_time, s.end_time)), 0
                      )} giờ`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <EventIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Ca sáng"
                      secondary={`${schedules.filter(s => s.shift_type === 'morning').length} ca`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <EventIcon color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Ca đêm"
                      secondary={`${schedules.filter(s => s.shift_type === 'night').length} ca`}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Detailed Schedule Table */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader title="Chi tiết lịch làm việc" />
              <CardContent>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Ngày</TableCell>
                        <TableCell>Ca làm việc</TableCell>
                        <TableCell>Giờ bắt đầu</TableCell>
                        <TableCell>Giờ kết thúc</TableCell>
                        <TableCell>Thời gian</TableCell>
                        <TableCell>Ghi chú</TableCell>
                        <TableCell>Thao tác</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {schedules.map((schedule) => (
                        <TableRow key={schedule.id}>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(schedule.date).toLocaleDateString('vi-VN')}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {new Date(schedule.date).toLocaleDateString('vi-VN', { weekday: 'long' })}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getShiftLabel(schedule.shift_type)}
                              color={getShiftColor(schedule.shift_type) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="primary">
                              {schedule.start_time}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="error">
                              {schedule.end_time}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {getWorkingHours(schedule.start_time, schedule.end_time)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap>
                              {schedule.notes || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={1}>
                              <Tooltip title="Chỉnh sửa">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditSchedule(schedule)}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Xóa">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => schedule.id && handleDeleteSchedule(schedule.id)}
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
          </Grid>
        </Grid>

        {/* Schedule Dialog */}
        <Dialog
          open={openScheduleDialog}
          onClose={() => setOpenScheduleDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {selectedSchedule ? 'Chỉnh sửa lịch làm việc' : 'Thêm lịch làm việc'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="date"
                  label="Ngày"
                  value={scheduleForm.date}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Loại ca</InputLabel>
                  <Select
                    value={scheduleForm.shift_type}
                    label="Loại ca"
                    onChange={(e) => handleShiftTypeChange(e.target.value)}
                  >
                    <MenuItem value="morning">Ca sáng (08:00 - 16:00)</MenuItem>
                    <MenuItem value="afternoon">Ca chiều (16:00 - 00:00)</MenuItem>
                    <MenuItem value="night">Ca đêm (00:00 - 08:00)</MenuItem>
                    <MenuItem value="full_day">Cả ngày (08:00 - 18:00)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="time"
                  label="Giờ bắt đầu"
                  value={scheduleForm.start_time}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="time"
                  label="Giờ kết thúc"
                  value={scheduleForm.end_time}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={scheduleForm.is_working_day}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, is_working_day: e.target.checked })}
                    />
                  }
                  label="Ngày làm việc"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Ghi chú"
                  value={scheduleForm.notes}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                  placeholder="Ghi chú về lịch làm việc..."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenScheduleDialog(false)}>
              Hủy
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveSchedule}
              disabled={!scheduleForm.date}
            >
              {selectedSchedule ? 'Cập nhật' : 'Thêm'}
            </Button>
          </DialogActions>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};
