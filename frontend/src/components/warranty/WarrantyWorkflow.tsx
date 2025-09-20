import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Chip,
  Grid,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  Stack,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Build as RepairIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import apiClient from '../services/api/client';

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';
  assigned_to?: string;
  estimated_duration: number;
  actual_duration?: number;
  start_time?: string;
  end_time?: string;
  notes?: string;
  sla_hours: number;
  is_critical: boolean;
}

interface WorkflowInstance {
  id: string;
  warranty_claim_id: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  current_step: string;
  progress_percentage: number;
  start_time: string;
  estimated_completion: string;
  actual_completion?: string;
  steps: WorkflowStep[];
  sla_breach_risk: 'low' | 'medium' | 'high' | 'breached';
  created_by: string;
  created_at: string;
  updated_at: string;
}

const WarrantyWorkflow: React.FC = () => {
  const [workflows, setWorkflows] = useState<WorkflowInstance[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState(false);
  const [stepDialogOpen, setStepDialogOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
  const [editMode, setEditMode] = useState(false);

  // Load workflow data from D1 Cloudflare
  useEffect(() => {
    const loadWorkflowData = async () => {
      try {
        const response = await apiClient.get('/warranty/workflows');
        if (response.data.success) {
          setWorkflows(response.data.data || []);
        } else {
          setWorkflows([]);
        }
      } catch (error) {
        console.error('Error loading workflow data:', error);
        setWorkflows([]);
      }
    };

    loadWorkflowData();
  }, []);

  useEffect(() => {
    loadWorkflowData();
  }, []);

  const loadWorkflowData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Data is loaded in useEffect above
    } catch (error) {
      console.error('Error loading workflow data:', error);
      setError('Không thể tải dữ liệu workflow');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'paused': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'draft': return 'default';
      default: return 'default';
    }
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'primary';
      case 'failed': return 'error';
      case 'skipped': return 'warning';
      case 'pending': return 'default';
      default: return 'default';
    }
  };

  const getSLARiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'breached': return 'error';
      default: return 'default';
    }
  };

  const getSLARiskLabel = (risk: string) => {
    switch (risk) {
      case 'low': return 'Thấp';
      case 'medium': return 'Trung bình';
      case 'high': return 'Cao';
      case 'breached': return 'Vi phạm';
      default: return 'Không xác định';
    }
  };

  const handleWorkflowSelect = (workflow: WorkflowInstance) => {
    setSelectedWorkflow(workflow);
    setWorkflowDialogOpen(true);
  };

  const handleStepEdit = (step: WorkflowStep) => {
    setSelectedStep(step);
    setEditMode(true);
    setStepDialogOpen(true);
  };

  const handleStepUpdate = (updatedStep: WorkflowStep) => {
    if (!selectedWorkflow) return;

    const updatedWorkflow = {
      ...selectedWorkflow,
      steps: selectedWorkflow.steps.map(step => 
        step.id === updatedStep.id ? updatedStep : step
      )
    };

    setSelectedWorkflow(updatedWorkflow);
    setWorkflows(workflows.map(w => 
      w.id === updatedWorkflow.id ? updatedWorkflow : w
    ));

    setStepDialogOpen(false);
    setSelectedStep(null);
    setEditMode(false);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <LinearProgress sx={{ width: '100%' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Quản lý Workflow Bảo hành
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Theo dõi và quản lý quy trình xử lý bảo hành
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setWorkflowDialogOpen(true)}
        >
          Tạo Workflow mới
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Active Workflows */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Workflow đang hoạt động
          </Typography>
          
          <Grid container spacing={3}>
            {workflows.map((workflow) => (
              <Grid item xs={12} key={workflow.id}>
                <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Workflow #{workflow.id}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Claim: {workflow.warranty_claim_id} | 
                        Bắt đầu: {formatDateTime(workflow.start_time)}
                      </Typography>
                    </Box>
                    
                    <Stack direction="row" spacing={1}>
                      <Chip
                        label={workflow.status}
                        color={getStatusColor(workflow.status) as any}
                        size="small"
                      />
                      <Chip
                        label={`SLA: ${getSLARiskLabel(workflow.sla_breach_risk)}`}
                        color={getSLARiskColor(workflow.sla_breach_risk) as any}
                        size="small"
                        variant="outlined"
                      />
                    </Stack>
                  </Box>
                  
                  {/* Progress Bar */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Tiến độ: {workflow.progress_percentage}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Dự kiến hoàn thành: {formatDateTime(workflow.estimated_completion)}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={workflow.progress_percentage}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  
                  {/* Steps Overview */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Các bước thực hiện:
                    </Typography>
                    <Grid container spacing={1}>
                      {workflow.steps.map((step) => (
                        <Grid item xs={12} sm={6} md={4} key={step.id}>
                          <Paper
                            sx={{
                              p: 1.5,
                              border: '1px solid',
                              borderColor: step.id === workflow.current_step ? 'primary.main' : 'divider',
                              bgcolor: step.id === workflow.current_step ? 'primary.50' : 'background.paper'
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="body2" fontWeight="medium">
                                {step.name}
                              </Typography>
                              <Chip
                                label={step.status}
                                color={getStepStatusColor(step.status) as any}
                                size="small"
                              />
                            </Box>
                            
                            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                              {step.description}
                            </Typography>
                            
                            {step.status === 'in_progress' && (
                              <IconButton
                                size="small"
                                onClick={() => handleStepEdit(step)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleWorkflowSelect(workflow)}
                    >
                      Xem chi tiết
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Workflow Detail Dialog */}
      <Dialog
        open={workflowDialogOpen}
        onClose={() => setWorkflowDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Chi tiết Workflow
          {selectedWorkflow && (
            <Typography variant="body2" color="text.secondary">
              #{selectedWorkflow.id} - {selectedWorkflow.warranty_claim_id}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedWorkflow && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  {/* Workflow Steps */}
                  <Typography variant="h6" gutterBottom>
                    Quy trình thực hiện
                  </Typography>
                  
                  <Stepper orientation="vertical">
                    {selectedWorkflow.steps.map((step, index) => (
                      <Step key={step.id} active={step.status === 'in_progress'} completed={step.status === 'completed'}>
                        <StepLabel
                          optional={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                {step.estimated_duration}h
                              </Typography>
                              {step.is_critical && (
                                <Chip label="Quan trọng" size="small" color="error" variant="outlined" />
                              )}
                            </Box>
                          }
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1">
                              {step.name}
                            </Typography>
                            <Chip
                              label={step.status}
                              color={getStepStatusColor(step.status) as any}
                              size="small"
                            />
                          </Box>
                        </StepLabel>
                        <StepContent>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {step.description}
                          </Typography>
                          
                          {step.assigned_to && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <PersonIcon fontSize="small" />
                              <Typography variant="body2">
                                Phụ trách: {step.assigned_to}
                              </Typography>
                            </Box>
                          )}
                          
                          {step.start_time && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <ScheduleIcon fontSize="small" />
                              <Typography variant="body2">
                                Bắt đầu: {formatDateTime(step.start_time)}
                              </Typography>
                            </Box>
                          )}
                          
                          {step.end_time && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <CheckIcon fontSize="small" />
                              <Typography variant="body2">
                                Hoàn thành: {formatDateTime(step.end_time)}
                              </Typography>
                            </Box>
                          )}
                          
                          {step.notes && (
                            <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 1 }}>
                              Ghi chú: {step.notes}
                            </Typography>
                          )}
                          
                          <Box sx={{ mt: 2 }}>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleStepEdit(step)}
                              disabled={step.status === 'completed'}
                            >
                              {step.status === 'in_progress' ? 'Cập nhật' : 'Chỉnh sửa'}
                            </Button>
                          </Box>
                        </StepContent>
                      </Step>
                    ))}
                  </Stepper>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  {/* Workflow Info */}
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Thông tin Workflow
                      </Typography>
                      
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Trạng thái
                          </Typography>
                          <Chip
                            label={selectedWorkflow.status}
                            color={getStatusColor(selectedWorkflow.status) as any}
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                        
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Tiến độ
                          </Typography>
                          <Typography variant="h6" color="primary.main">
                            {selectedWorkflow.progress_percentage}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={selectedWorkflow.progress_percentage}
                            sx={{ mt: 1 }}
                          />
                        </Box>
                        
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Nguy cơ vi phạm SLA
                          </Typography>
                          <Chip
                            label={getSLARiskLabel(selectedWorkflow.sla_breach_risk)}
                            color={getSLARiskColor(selectedWorkflow.sla_breach_risk) as any}
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                        
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Bắt đầu
                          </Typography>
                          <Typography variant="body2">
                            {formatDateTime(selectedWorkflow.start_time)}
                          </Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Dự kiến hoàn thành
                          </Typography>
                          <Typography variant="body2">
                            {formatDateTime(selectedWorkflow.estimated_completion)}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWorkflowDialogOpen(false)}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Step Edit Dialog */}
      <Dialog
        open={stepDialogOpen}
        onClose={() => setStepDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editMode ? 'Chỉnh sửa bước' : 'Thông tin bước'}
        </DialogTitle>
        <DialogContent>
          {selectedStep && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    {selectedStep.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {selectedStep.description}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Trạng thái</InputLabel>
                    <Select
                      value={selectedStep.status}
                      label="Trạng thái"
                      onChange={(e) => setSelectedStep({
                        ...selectedStep,
                        status: e.target.value as any
                      })}
                      disabled={!editMode}
                    >
                      <MenuItem value="pending">Chờ xử lý</MenuItem>
                      <MenuItem value="in_progress">Đang thực hiện</MenuItem>
                      <MenuItem value="completed">Hoàn thành</MenuItem>
                      <MenuItem value="skipped">Bỏ qua</MenuItem>
                      <MenuItem value="failed">Thất bại</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Người phụ trách"
                    value={selectedStep.assigned_to || ''}
                    onChange={(e) => setSelectedStep({
                      ...selectedStep,
                      assigned_to: e.target.value
                    })}
                    disabled={!editMode}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Ghi chú"
                    multiline
                    rows={3}
                    value={selectedStep.notes || ''}
                    onChange={(e) => setSelectedStep({
                      ...selectedStep,
                      notes: e.target.value
                    })}
                    disabled={!editMode}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStepDialogOpen(false)}>
            Đóng
          </Button>
          {editMode && (
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={() => handleStepUpdate(selectedStep!)}
            >
              Cập nhật
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WarrantyWorkflow;
