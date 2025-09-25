import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Search,
  Download,
  Edit,
  Trash2,
  Eye,
  Shield,
  Clock,
  Calendar,
  TrendingUp,
  DollarSign,
  Star,
  Award,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Target,
  Sun,
  Moon,
  Heart,
  Briefcase,
  Phone,
  Mail
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/ButtonSimplified';
import { DataTable, Column } from '../../components/ui/DataTable';
import { formatCurrency, formatDate } from '../../lib/utils';

// Types
interface Employee {
  id: string;
  employee_code: string;
  full_name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  hire_date: string;
  status: 'active' | 'inactive' | 'on_leave';
  salary: number;
  role: 'admin' | 'manager' | 'cashier' | 'staff';
  avatar?: string;
  address?: string;
  emergency_contact?: string;
  performance_score: number;
  total_sales: number;
  worked_hours: number;
  overtime_hours: number;
  leave_balance: number;
  last_check_in?: string;
  permissions: string[];
  shift_schedule: ShiftSchedule[];
}

interface ShiftSchedule {
  id: string;
  employee_id: string;
  day_of_week: number; // 0-6 (Sunday-Saturday)
  start_time: string;
  end_time: string;
  break_duration: number; // minutes
  is_active: boolean;
}

interface WorkShift {
  id: string;
  employee_id: string;
  date: string;
  check_in: string;
  check_out?: string;
  break_start?: string;
  break_end?: string;
  total_hours: number;
  overtime_hours: number;
  status: 'present' | 'absent' | 'late' | 'partial';
}

interface Performance {
  employee_id: string;
  month: string;
  sales_target: number;
  sales_achieved: number;
  customer_rating: number;
  attendance_rate: number;
  performance_score: number;
  bonus_earned: number;
}

interface PayrollRecord {
  id: string;
  employee_id: string;
  period: string;
  basic_salary: number;
  overtime_pay: number;
  bonus: number;
  deductions: number;
  net_salary: number;
  status: 'pending' | 'approved' | 'paid';
}

const EmployeeManagement: React.FC = () => {
  // State management
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState<'employees' | 'shifts' | 'performance' | 'payroll' | 'permissions'>('employees');
  
  // Modals and forms
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  
  // Form data
  const [employeeForm, setEmployeeForm] = useState<Partial<Employee>>({});
  const [shiftForm, setShiftForm] = useState<Partial<WorkShift>>({});
  const [performanceForm, setPerformanceForm] = useState<Partial<Performance>>({});
  const [payrollForm, setPayrollForm] = useState<Partial<PayrollRecord>>({});

  // CSV helper
  const exportToCSV = (rows: Record<string, any>[], filename: string) => {
    if (!rows || rows.length === 0) return;
    const headerSet: Set<string> = rows.reduce((set: Set<string>, row: Record<string, any>) => {
      Object.keys(row).forEach(k => set.add(k));
      return set;
    }, new Set<string>());
    const headers = Array.from(headerSet);
    const csv = [headers.join(',')]
      .concat(rows.map(r => headers.map(h => JSON.stringify((r as any)[h] ?? '')).join(',')))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  // Stats
  const [employeeStats, setEmployeeStats] = useState({
    total_employees: 0,
    active_employees: 0,
    on_leave: 0,
    present_today: 0,
    avg_performance: 0,
    total_payroll: 0,
    pending_leaves: 0,
    overtime_hours: 0
  });

  useEffect(() => {
    // Load employee data from API
    try {
      const rawEmployees = localStorage.getItem('employees');
      const rawShifts = localStorage.getItem('workShifts');
      const rawPerformances = localStorage.getItem('performances');
      const rawPayroll = localStorage.getItem('payrollRecords');
      if (rawEmployees) setEmployees(JSON.parse(rawEmployees));
      if (rawShifts) setWorkShifts(JSON.parse(rawShifts));
      if (rawPerformances) setPerformances(JSON.parse(rawPerformances));
      if (rawPayroll) setPayrollRecords(JSON.parse(rawPayroll));
    } catch (_) {}
    loadEmployeeData();
  }, []);

  useEffect(() => {
    try { localStorage.setItem('employees', JSON.stringify(employees)); } catch (_) {}
  }, [employees]);

  useEffect(() => {
    try { localStorage.setItem('workShifts', JSON.stringify(workShifts)); } catch (_) {}
  }, [workShifts]);

  useEffect(() => {
    try { localStorage.setItem('performances', JSON.stringify(performances)); } catch (_) {}
  }, [performances]);

  useEffect(() => {
    try { localStorage.setItem('payrollRecords', JSON.stringify(payrollRecords)); } catch (_) {}
  }, [payrollRecords]);

  const loadEmployeeData = async () => {
    try {
      setLoading(true);

      const { default: apiClient } = await import('../../services/api/client');
      const response = await apiClient.get('/employees');
      const data = response?.data;

      if (data.success && data.data) {
        const employees = data.data.employees || [];
        setEmployees(employees);

        // Calculate stats from real data
        const stats = {
          total_employees: employees.length,
          active_employees: employees.filter((e: Employee) => e.status === 'active').length,
          on_leave: employees.filter((e: Employee) => e.status === 'on_leave').length,
          present_today: employees.filter((e: Employee) => e.last_check_in?.includes(new Date().toISOString().split('T')[0])).length,
          avg_performance: employees.length > 0 ? Math.round(employees.reduce((sum: number, e: Employee) => sum + e.performance_score, 0) / employees.length) : 0,
          total_payroll: employees.reduce((sum: number, e: Employee) => sum + e.salary, 0),
          pending_leaves: 0, // This should come from a separate API endpoint
          overtime_hours: employees.reduce((sum: number, e: Employee) => sum + e.overtime_hours, 0)
        };

        setEmployeeStats(stats);
      } else {
        throw new Error(data.error || 'Failed to load employees');
      }
    } catch (error) {
      console.error('Error loading employee data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Employee table columns
  const employeeColumns: Column<Employee>[] = [
    {
      key: 'employee_code',
      title: 'Mã NV',
      sortable: true,
      width: '100px'
    },
    {
      key: 'full_name',
      title: 'Tên nhân viên',
      sortable: true,
      render: (value: string, record: Employee) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {value.charAt(0)}
          </div>
          <div>
            <div className="font-medium text-gray-900">
            <div className="text-sm text-gray-500">
          </div>
        </div>
      )
    },
    {
      key: 'department',
      title: 'Phòng ban',
      sortable: true,
      render: (value: string) => (
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800  rounded-full">
          {value}
        </span>
      )
    },
    {
      key: 'status',
      title: 'Trạng thái',
      sortable: true,
      render: (value: string) => {
        const statusConfig = {
          active: { color: 'green', text: 'Đang làm việc' },
          inactive: { color: 'red', text: 'Nghỉ việc' },
          on_leave: { color: 'yellow', text: 'Đang nghỉ phép' }
        };
        const config = statusConfig[value as keyof typeof statusConfig];
        return (
          <span className={`px-2 py-1 text-xs font-medium bg-${config.color}-100 text-${config.color}-800   rounded-full`}>
            {config.text}
          </span>
        );
      }
    },
    {
      key: 'performance_score',
      title: 'Hiệu suất',
      sortable: true,
      align: 'center',
      render: (value: number) => (
        <div className="flex items-center justify-center">
          <div className="w-12 h-12 relative">
            <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-gray-300"
                  stroke="currentColor"
                strokeWidth="3"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={value >= 90 ? 'text-green-500' : value >= 70 ? 'text-yellow-500' : 'text-red-500'}
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${value}, 100`}
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold">{value}%</span>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'salary',
      title: 'Lương cơ bản',
      sortable: true,
      align: 'right',
      render: (value: number) => (
        <span className="font-bold text-green-600">
          {formatCurrency(value)}
        </span>
      )
    },
    {
      key: 'employee_code',
      title: 'Thao tác',
      align: 'center',
      render: (_: any, record: Employee) => (
        <div className="flex items-center justify-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleViewEmployee(record)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEditEmployee(record)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDeleteEmployee(record.id)}
            className="text-red-600 hover:text-red-700">
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowEmployeeModal(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEmployeeForm(employee);
    setShowEmployeeModal(true);
  };

  const handleDeleteEmployee = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) {
      setEmployees(employees.filter(e => e.id !== id));
    }
  };

  const handleCreateEmployee = () => {
    setEmployeeForm({});
    setShowEmployeeModal(true);
  };

  // Save handlers
  const saveShift = () => {
    if (!shiftForm.employee_id || !shiftForm.date || !shiftForm.check_in) return;
    const id = shiftForm.id || `shift-${Date.now()}`;
    const record: WorkShift = {
      id,
      employee_id: shiftForm.employee_id,
      date: shiftForm.date,
      check_in: shiftForm.check_in,
      check_out: shiftForm.check_out,
      break_start: shiftForm.break_start,
      break_end: shiftForm.break_end,
      total_hours: shiftForm.total_hours || 0,
      overtime_hours: shiftForm.overtime_hours || 0,
      status: (shiftForm.status as WorkShift['status']) || 'present'
    };
    setWorkShifts(prev => [record, ...prev.filter(s => s.id !== id)]);
    setShowShiftModal(false);
    setShiftForm({});
  };

  const savePerformance = () => {
    if (!performanceForm.employee_id || !performanceForm.month) return;
    const record: Performance = {
      employee_id: performanceForm.employee_id,
      month: performanceForm.month,
      sales_target: performanceForm.sales_target || 0,
      sales_achieved: performanceForm.sales_achieved || 0,
      customer_rating: performanceForm.customer_rating || 0,
      attendance_rate: performanceForm.attendance_rate || 0,
      performance_score: performanceForm.performance_score || 0,
      bonus_earned: performanceForm.bonus_earned || 0
    };
    setPerformances(prev => [record, ...prev.filter(p => !(p.employee_id === record.employee_id && p.month === record.month))]);
    setShowPerformanceModal(false);
    setPerformanceForm({});
  };

  const savePayroll = () => {
    if (!payrollForm.employee_id || !payrollForm.period || payrollForm.basic_salary == null) return;
    const id = payrollForm.id || `pay-${Date.now()}`;
    const record: PayrollRecord = {
      id,
      employee_id: payrollForm.employee_id,
      period: payrollForm.period,
      basic_salary: payrollForm.basic_salary,
      overtime_pay: payrollForm.overtime_pay || 0,
      bonus: payrollForm.bonus || 0,
      deductions: payrollForm.deductions || 0,
      net_salary: (payrollForm.basic_salary || 0) + (payrollForm.overtime_pay || 0) + (payrollForm.bonus || 0) - (payrollForm.deductions || 0),
      status: (payrollForm.status as PayrollRecord['status']) || 'pending'
    };
    setPayrollRecords(prev => [record, ...prev.filter(p => p.id !== id)]);
    setShowPayrollModal(false);
    setPayrollForm({});
  };

  // removed unused randomId

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employee_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = departmentFilter === 'all' || employee.department === departmentFilter;
    const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
    const matchesRole = roleFilter === 'all' || employee.role === roleFilter;
    
    return matchesSearch && matchesDepartment && matchesStatus && matchesRole;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 tải dữ liệu nhân viên...</p>">
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Users className="w-8 h-8 mr-3 text-blue-600" />
            Quản lý nhân viên
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý toàn diện nhân sự, phân quyền và hiệu suất làm việc
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => setShowPermissionModal(true)}>
            <Shield className="w-4 h-4 mr-2" />
            Phân quyền
          </Button>
          <Button variant="outline" onClick={() => exportToCSV(employees as any, `employees_${new Date().toISOString().slice(0,10)}.csv`)}>
            <Download className="w-4 h-4 mr-2" />
            Xuất CSV
          </Button>
          <Button onClick={handleCreateEmployee}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm nhân viên
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 nhân viên</p>">
                <p className="text-3xl font-bold text-gray-900">
                <p className="text-sm text-green-600">
                  +{employeeStats.active_employees} đang làm việc
                </p>
              </div>
              <Users className="w-12 h-12 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mặt hôm nay</p>">
                <p className="text-3xl font-bold text-gray-900">
                <p className="text-sm text-blue-600">
                  {Math.round((employeeStats.present_today / employeeStats.total_employees) * 100)}% tỷ lệ có mặt
                </p>
              </div>
              <UserCheck className="w-12 h-12 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 suất TB</p>">
                <p className="text-3xl font-bold text-gray-900">
                <p className="text-sm text-yellow-600">
                  Tháng này
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 lương</p>">
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(employeeStats.total_payroll)}
                </p>
                <p className="text-sm text-purple-600">
                  Tháng này
                </p>
              </div>
              <DollarSign className="w-12 h-12 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'employees', label: 'Danh sách nhân viên', icon: Users },
            { id: 'shifts', label: 'Quản lý ca làm', icon: Clock },
            { id: 'performance', label: 'Hiệu suất', icon: TrendingUp },
            { id: 'payroll', label: 'Lương & Thưởng', icon: DollarSign },
            { id: 'permissions', label: 'Phân quyền', icon: Shield }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 bg-blue-50 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'employees' && (
            <div className="space-y-6">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm nhân viên..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ">
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ">
                  >
                    <option value="all">Tất cả phòng ban</option>
                    <option value="Bán hàng">Bán hàng</option>
                    <option value="Kho">Kho</option>
                    <option value="Marketing">Marketing</option>
                    <option value="IT">IT</option>
                  </select>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ">
                  >
                    <option value="all">Tất cả vai trò</option>
                    <option value="admin">Quản trị viên</option>
                    <option value="manager">Quản lý</option>
                    <option value="cashier">Thu ngân</option>
                    <option value="staff">Nhân viên</option>
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ">
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">Đang làm việc</option>
                    <option value="on_leave">Đang nghỉ phép</option>
                    <option value="inactive">Nghỉ việc</option>
                  </select>
                  <Button variant="outline" onClick={() => exportToCSV(filteredEmployees as any, `employees_${new Date().toISOString().slice(0,10)}.csv`)}>
                    <Download className="w-4 h-4 mr-2" />
                    Xuất Excel
                  </Button>
                </div>
              </div>

              {/* Employee Table */}
              <DataTable
                data={filteredEmployees}
                columns={employeeColumns}
                searchable={false}
                pagination
                pageSize={10}
                className="border-0">
              />
            </div>
          )}

          {activeTab === 'shifts' && (
            <div className="space-y-6">
              {/* Shift Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 sáng</p>">
                        <p className="text-2xl font-bold text-gray-900">
                        <p className="text-sm text-blue-600">6:00 - 14:00</p>
                      </div>
                      <Sun className="w-10 h-10 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 chiều</p>">
                        <p className="text-2xl font-bold text-gray-900">
                        <p className="text-sm text-blue-600">14:00 - 22:00</p>
                      </div>
                      <Sun className="w-10 h-10 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 đêm</p>">
                        <p className="text-2xl font-bold text-gray-900">
                        <p className="text-sm text-blue-600">22:00 - 6:00</p>
                      </div>
                      <Moon className="w-10 h-10 text-indigo-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Shift Management Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 lý ca làm việc</h3>">
                  <p className="text-gray-600 lịch và quản lý ca làm việc cho nhân viên</p>">
                </div>
                <Button onClick={() => { setShiftForm({}); setShowShiftModal(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Tạo ca làm việc
                </Button>
              </div>

              {/* Shift Calendar/Schedule View */}
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900 làm việc tuần này</h4>">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">Tuần này</Button>
                        <Button variant="outline" size="sm">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Weekly Schedule Grid */}
                    <div className="grid grid-cols-8 gap-2">
                      <div className="p-3 bg-gray-50 rounded-lg font-medium">
                        <div className="text-sm text-gray-600">
                      </div>
                      {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
                        <div key={day} className="p-3 bg-gray-50 rounded-lg font-medium text-center">
                          <div className="text-sm text-gray-600">
                          <div className="text-xs text-gray-500 mt-1">
                            {day === 'T2' ? '09/09' : day === 'T3' ? '10/09' : day === 'T4' ? '11/09' : 
                             day === 'T5' ? '12/09' : day === 'T6' ? '13/09' : day === 'T7' ? '14/09' : '15/09'}
                          </div>
                        </div>
                      ))}

                      {/* Morning Shift */}
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Sun className="w-4 h-4 text-orange-600" />
                          <span className="text-sm font-medium">Ca sáng</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">6:00-14:00</div>
                      </div>
                      {[1, 2, 3, 4, 5, 6, 7].map(day => (
                        <div key={day} className="p-2 border border-gray-200 rounded-lg min-h-[60px]">
                          <div className="space-y-1">
                            {day <= 5 && (
                              <>
                                <div className="text-xs bg-blue-100  text-blue-800 px-1 rounded">
                                  An
                                </div>
                                <div className="text-xs bg-green-100  text-green-800 px-1 rounded">
                                  Minh
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Afternoon Shift */}
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Sun className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm font-medium">Ca chiều</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">14:00-22:00</div>
                      </div>
                      {[1, 2, 3, 4, 5, 6, 7].map(day => (
                        <div key={day} className="p-2 border border-gray-200 rounded-lg min-h-[60px]">
                          <div className="space-y-1">
                            {day <= 6 && (
                              <>
                                <div className="text-xs bg-purple-100  text-purple-800 px-1 rounded">
                                  Hoa
                                </div>
                                {day <= 5 && (
                                  <div className="text-xs bg-green-100  text-green-800 px-1 rounded">
                                    Minh
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Night Shift */}
                      <div className="p-3 bg-indigo-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Moon className="w-4 h-4 text-indigo-600" />
                          <span className="text-sm font-medium">Ca đêm</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">22:00-6:00</div>
                      </div>
                      {[1, 2, 3, 4, 5, 6, 7].map(day => (
                        <div key={day} className="p-2 border border-gray-200 rounded-lg min-h-[60px]">
                          <div className="space-y-1">
                            {day === 6 || day === 7 ? (
                              <div className="text-xs bg-blue-100  text-blue-800 px-1 rounded">
                                An
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shift Rules and Settings */}
              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Quy định ca làm việc</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-medium text-gray-800 mb-3">Thời gian làm việc</h5>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Ca sáng:</span>
                          <span className="font-medium">6:00 - 14:00 (8 giờ)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Ca chiều:</span>
                          <span className="font-medium">14:00 - 22:00 (8 giờ)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Ca đêm:</span>
                          <span className="font-medium">22:00 - 6:00 (8 giờ)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Giờ nghỉ giải lao:</span>
                          <span className="font-medium">1 giờ</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-800 mb-3">Quy định chung</h5>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div>• Tối thiểu 2 người/ca trong giờ cao điểm</div>
                        <div>• Không được làm quá 6 ngày/tuần</div>
                        <div>• Ca đêm có phụ cấp 30%</div>
                        <div>• Cuối tuần có phụ cấp 20%</div>
                        <div>• Thông báo thay đổi ca trước 24h</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-6">
              {/* Performance Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 suất TB</p>">
                        <p className="text-3xl font-bold text-gray-900">
                        <p className="text-sm text-green-600">+5% từ tháng trước</p>
                      </div>
                      <TrendingUp className="w-12 h-12 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 tiêu đạt</p>">
                        <p className="text-3xl font-bold text-gray-900">
                        <p className="text-sm text-blue-600">90% hoàn thành</p>
                      </div>
                      <Target className="w-12 h-12 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 sắc</p>">
                        <p className="text-3xl font-bold text-gray-900">
                        <p className="text-sm text-yellow-600">Nhân viên ≥90%</p>
                      </div>
                      <Star className="w-12 h-12 text-yellow-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 cải thiện</p>">
                        <p className="text-3xl font-bold text-gray-900">
                        <p className="text-sm text-red-600">Nhân viên &lt;70%</p>
                      </div>
                      <AlertTriangle className="w-12 h-12 text-red-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Management Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 giá hiệu suất nhân viên</h3>">
                  <p className="text-gray-600 dõi và đánh giá hiệu suất làm việc chi tiết</p>">
                </div>
                <Button onClick={() => { setPerformanceForm({}); setShowPerformanceModal(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Tạo đánh giá
                </Button>
              </div>

              {/* Individual Performance Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {employees.map(employee => (
                  <Card key={employee.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Employee Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                              {employee.full_name.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                              <p className="text-sm text-gray-600">
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">
                            {employee.performance_score >= 90 && <Star className="w-4 h-4 text-yellow-500 inline" />}
                            {employee.performance_score < 70 && <AlertTriangle className="w-4 h-4 text-red-500 inline" />}
                          </div>
                        </div>

                        {/* Performance Metrics */}
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600 số</span>">
                              <span className="font-medium">{employee.performance_score >= 80 ? '92%' : employee.performance_score >= 70 ? '75%' : '65%'}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${employee.performance_score >= 80 ? 'bg-green-500' : employee.performance_score >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${employee.performance_score >= 80 ? 92 : employee.performance_score >= 70 ? 75 : 65}%` }}
                              ></div>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600 lượng</span>">
                              <span className="font-medium">{employee.performance_score >= 80 ? '88%' : employee.performance_score >= 70 ? '78%' : '68%'}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${employee.performance_score >= 80 ? 'bg-blue-500' : employee.performance_score >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${employee.performance_score >= 80 ? 88 : employee.performance_score >= 70 ? 78 : 68}%` }}
                              ></div>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600 độ</span>">
                              <span className="font-medium">{employee.performance_score >= 80 ? '95%' : employee.performance_score >= 70 ? '82%' : '60%'}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${employee.performance_score >= 80 ? 'bg-purple-500' : employee.performance_score >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${employee.performance_score >= 80 ? 95 : employee.performance_score >= 70 ? 82 : 60}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        {/* Performance Actions */}
                        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                          <div className="text-xs text-gray-500">
                            Cập nhật: {new Date().toLocaleDateString('vi-VN')}
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedEmployee(employee);
                                setShowPerformanceModal(true);
                              }}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Chi tiết
                            </Button>
                            <Button size="sm" onClick={() => setShowPerformanceModal(true)}>
                              <Edit className="w-3 h-3 mr-1" />
                              Đánh giá
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Performance Trends Chart */}
              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Xu hướng hiệu suất 6 tháng gần đây</h4>
                  <div className="h-64 bg-gradient-to-br from-blue-50 to-indigo-100  rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <TrendingUp className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                      <p className="text-gray-600 đồ xu hướng hiệu suất</p>">
                      <p className="text-sm text-gray-500 mt-2">Tích hợp với thư viện Chart.js</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Goals & KPIs */}
              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Mục tiêu và KPI</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-medium text-gray-800 mb-3">Mục tiêu tháng này</h5>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm">Doanh số đạt 120M VNĐ</span>
                          </div>
                          <span className="text-xs font-medium text-green-600">Hoàn thành</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <span className="text-sm">Tỷ lệ hài lòng &gt;95%</span>
                          </div>
                          <span className="text-xs font-medium text-blue-600">Đang thực hiện</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            <span className="text-sm">Đào tạo 100% nhân viên</span>
                          </div>
                          <span className="text-xs font-medium text-yellow-600">Chờ thực hiện</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-800 mb-3">Chỉ số KPI chính</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 số trung bình/người:</span>">
                          <span className="font-medium text-green-600">4.2M VNĐ</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 khách hàng phục vụ/ngày:</span>">
                          <span className="font-medium text-blue-600">45 khách</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 lệ hoàn thành deadline:</span>">
                          <span className="font-medium text-purple-600">94%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 giờ làm thêm TB/tuần:</span>">
                          <span className="font-medium text-yellow-600">3.5 giờ</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 lệ nghỉ không phép:</span>">
                          <span className="font-medium text-red-600">2.1%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'payroll' && (
            <div className="space-y-6">
              {/* Payroll Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 chi lương</p>">
                        <p className="text-2xl font-bold text-gray-900 VNĐ</p>">
                        <p className="text-sm text-green-600">Tháng này</p>
                      </div>
                      <DollarSign className="w-12 h-12 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 thưởng</p>">
                        <p className="text-2xl font-bold text-gray-900 VNĐ</p>">
                        <p className="text-sm text-blue-600">12.5% tổng lương</p>
                      </div>
                      <Award className="w-12 h-12 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 cấp</p>">
                        <p className="text-2xl font-bold text-gray-900 VNĐ</p>">
                        <p className="text-sm text-purple-600">6.7% tổng lương</p>
                      </div>
                      <Plus className="w-12 h-12 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 bình</p>">
                        <p className="text-2xl font-bold text-gray-900 VNĐ</p>">
                        <p className="text-sm text-orange-600">Lương/người/tháng</p>
                      </div>
                      <TrendingUp className="w-12 h-12 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payroll Management Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 lương nhân viên</h3>">
                  <p className="text-gray-600 lý lương, thưởng và phụ cấp cho nhân viên</p>">
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => exportToCSV(payrollRecords as any, `payroll_${new Date().toISOString().slice(0,7)}.csv`)}>
                    <Download className="w-4 h-4 mr-2" />
                    Xuất CSV bảng lương
                  </Button>
                  <Button onClick={() => { setPayrollForm({}); setShowPayrollModal(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Tạo phiếu lương
                  </Button>
                </div>
              </div>

              {/* Monthly Payroll Summary */}
              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Bảng lương tháng 09/2025</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4">Nhân viên</th>
                          <th className="text-left py-3 px-4">Chức vụ</th>
                          <th className="text-right py-3 px-4">Lương cơ bản</th>
                          <th className="text-right py-3 px-4">Phụ cấp</th>
                          <th className="text-right py-3 px-4">Thưởng</th>
                          <th className="text-right py-3 px-4">Khấu trừ</th>
                          <th className="text-right py-3 px-4">Thực lãnh</th>
                          <th className="text-center py-3 px-4">Trạng thái</th>
                          <th className="text-center py-3 px-4">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employees.map((employee) => {
                          const baseSalary = employee.salary;
                          const allowance = Math.floor(baseSalary * 0.15);
                          const bonus = employee.performance_score >= 90 ? Math.floor(baseSalary * 0.2) : 
                                       employee.performance_score >= 80 ? Math.floor(baseSalary * 0.15) :
                                       employee.performance_score >= 70 ? Math.floor(baseSalary * 0.1) : 0;
                          const deduction = Math.floor(baseSalary * 0.105); // BHXH + thuế
                          const netSalary = baseSalary + allowance + bonus - deduction;
                          const isPaid = Math.random() > 0.3;
                          
                          return (
                            <tr key={employee.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                    {employee.full_name.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900">
                                    <div className="text-xs text-gray-500">{employee.employee_code}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-gray-600">
                              <td className="py-3 px-4 text-right font-medium">{baseSalary.toLocaleString('vi-VN')} VNĐ</td>
                              <td className="py-3 px-4 text-right text-blue-600">{allowance.toLocaleString('vi-VN')} VNĐ</td>
                              <td className="py-3 px-4 text-right text-green-600">{bonus.toLocaleString('vi-VN')} VNĐ</td>
                              <td className="py-3 px-4 text-right text-red-600">-{deduction.toLocaleString('vi-VN')} VNĐ</td>
                              <td className="py-3 px-4 text-right font-bold text-gray-900 VNĐ</td>">
                              <td className="py-3 px-4 text-center">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  isPaid ? 'bg-green-100 text-green-800   : 
                                          'bg-yellow-100 text-yellow-800  
                                }`}>
                                  {isPaid ? 'Đã trả' : 'Chờ trả'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="flex justify-center space-x-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedEmployee(employee);
                                      setShowEmployeeModal(true);
                                    }}
                                  >
                                    <Eye className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setPayrollForm({
                                        employee_id: employee.id,
                                        period: new Date().toISOString().slice(0,7),
                                        basic_salary: baseSalary,
                                        overtime_pay: 0,
                                        bonus,
                                        deductions: deduction,
                                        status: 'pending' as any
                                      });
                                      setShowPayrollModal(true);
                                    }}
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const row = [{
                                        employee: employee.full_name,
                                        employee_code: employee.employee_code,
                                        base_salary: baseSalary,
                                        allowance,
                                        bonus,
                                        deduction,
                                        net_salary: netSalary
                                      }];
                                      exportToCSV(row as any, `payroll_${employee.employee_code}_${new Date().toISOString().slice(0,7)}.csv`);
                                    }}
                                  >
                                    <Download className="w-3 h-3" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Bonus & Incentive Management */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Chính sách thưởng</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Star className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium">Hiệu suất xuất sắc (≥90%)</span>
                        </div>
                        <span className="text-sm font-bold text-green-600">20% lương cơ bản</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Award className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium">Hiệu suất tốt (80-89%)</span>
                        </div>
                        <span className="text-sm font-bold text-blue-600">15% lương cơ bản</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Target className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm font-medium">Đạt mục tiêu (70-79%)</span>
                        </div>
                        <span className="text-sm font-bold text-yellow-600">10% lương cơ bản</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <XCircle className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-medium">Dưới mục tiêu (&lt;70%)</span>
                        </div>
                        <span className="text-sm font-bold text-gray-600">Không thưởng</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Phụ cấp và phúc lợi</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium">Ca đêm</span>
                        </div>
                        <span className="text-sm font-bold text-blue-600">+30% lương ca</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-medium">Cuối tuần</span>
                        </div>
                        <span className="text-sm font-bold text-purple-600">+20% lương ca</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4 text-orange-600" />
                          <span className="text-sm font-medium">BHXH, BHYT</span>
                        </div>
                        <span className="text-sm font-bold text-orange-600">10.5% lương CB</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Heart className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium">Phụ cấp ăn trưa</span>
                        </div>
                        <span className="text-sm font-bold text-green-600">30K VNĐ/ngày</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payroll Analytics */}
              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Phân tích chi phí lương</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto mb-3 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xl">75%</span>
                      </div>
                      <h5 className="font-medium text-gray-900 cơ bản</h5>">
                      <p className="text-sm text-gray-600 VNĐ</p>">
                    </div>
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xl">12%</span>
                      </div>
                      <h5 className="font-medium text-gray-900">
                      <p className="text-sm text-gray-600 VNĐ</p>">
                    </div>
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xl">13%</span>
                      </div>
                      <h5 className="font-medium text-gray-900 cấp</h5>">
                      <p className="text-sm text-gray-600 VNĐ</p>">
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-6">
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Hệ thống phân quyền
                </h3>
                <p className="text-gray-600 mb-6">
                  Quản lý quyền truy cập và chức năng cho từng nhân viên
                </p>
                <Button onClick={() => setShowPermissionModal(true)}>
                  <Shield className="w-4 h-4 mr-2" />
                  Cấu hình quyền
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Employee Modal */}
      <AnimatePresence>
        {showEmployeeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowEmployeeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900">
                  {selectedEmployee ? 'Chi tiết nhân viên' : 'Thêm nhân viên mới'}
                </h3>
              </div>
              
              <div className="p-6">
                {selectedEmployee ? (
                  // Employee Details View
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                      <div className="text-center">
                        <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-4xl mx-auto mb-4">
                          {selectedEmployee.full_name.charAt(0)}
                        </div>
                        <h4 className="text-xl font-bold text-gray-900">
                          {selectedEmployee.full_name}
                        </h4>
                        <p className="text-gray-600">
                        <p className="text-sm text-gray-500">{selectedEmployee.employee_code}</p>
                      </div>
                    </div>
                    
                    <div className="lg:col-span-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <p className="flex items-center text-gray-900">
                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                            {selectedEmployee.email}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Điện thoại
                          </label>
                          <p className="flex items-center text-gray-900">
                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                            {selectedEmployee.phone}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phòng ban
                          </label>
                          <p className="flex items-center text-gray-900">
                            <Briefcase className="w-4 h-4 mr-2 text-gray-400" />
                            {selectedEmployee.department}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ngày vào làm
                          </label>
                          <p className="flex items-center text-gray-900">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                            {formatDate(selectedEmployee.hire_date)}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Lương cơ bản
                          </label>
                          <p className="flex items-center text-gray-900">
                            <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                            {formatCurrency(selectedEmployee.salary)}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Hiệu suất
                          </label>
                          <p className="flex items-center text-gray-900">
                            <Star className="w-4 h-4 mr-2 text-gray-400" />
                            {selectedEmployee.performance_score}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Employee Form
                  <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Họ và tên *
                      </label>
                      <input
                        type="text"
                        value={employeeForm.full_name || ''}
                        onChange={(e) => setEmployeeForm({...employeeForm, full_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 "
                  placeholder="Nhập họ và tên"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={employeeForm.email || ''}
                        onChange={(e) => setEmployeeForm({...employeeForm, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 "
                  placeholder="Nhập email"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Điện thoại *
                      </label>
                      <input
                        type="tel"
                        value={employeeForm.phone || ''}
                        onChange={(e) => setEmployeeForm({...employeeForm, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 "
                  placeholder="Nhập số điện thoại"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Chức vụ *
                      </label>
                      <input
                        type="text"
                        value={employeeForm.position || ''}
                        onChange={(e) => setEmployeeForm({...employeeForm, position: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 "
                  placeholder="Nhập chức vụ"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phòng ban *
                      </label>
                      <select
                        value={employeeForm.department || ''}
                        onChange={(e) => setEmployeeForm({...employeeForm, department: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ">
                      >
                        <option value="">Chọn phòng ban</option>
                        <option value="Bán hàng">Bán hàng</option>
                        <option value="Kho">Kho</option>
                        <option value="Marketing">Marketing</option>
                        <option value="IT">IT</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vai trò *
                      </label>
                      <select
                        value={employeeForm.role || ''}
                        onChange={(e) => setEmployeeForm({...employeeForm, role: e.target.value as any})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ">
                      >
                        <option value="">Chọn vai trò</option>
                        <option value="admin">Quản trị viên</option>
                        <option value="manager">Quản lý</option>
                        <option value="cashier">Thu ngân</option>
                        <option value="staff">Nhân viên</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lương cơ bản *
                      </label>
                      <input
                        type="number"
                        value={employeeForm.salary || ''}
                        onChange={(e) => setEmployeeForm({...employeeForm, salary: Number(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 "
                  placeholder="Nhập lương cơ bản"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ngày vào làm *
                      </label>
                      <input
                        type="date"
                        value={employeeForm.hire_date || ''}
                        onChange={(e) => setEmployeeForm({...employeeForm, hire_date: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ">
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Địa chỉ
                      </label>
                      <textarea
                        value={employeeForm.address || ''}
                        onChange={(e) => setEmployeeForm({...employeeForm, address: e.target.value})}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 "
                  placeholder="Nhập địa chỉ"
                      />
                    </div>
                  </form>
                )}
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowEmployeeModal(false)}
                >
                  Hủy
                </Button>
                {!selectedEmployee && (
                  <Button onClick={() => {
                    // Handle save employee
                    console.log('Saving employee:', employeeForm);
                    const id = employeeForm.id || `emp-${Date.now()}`;
                    const record: Employee = {
                      id,
                      employee_code: employeeForm.employee_code || `E${Math.floor(Math.random()*1000)}`,
                      full_name: employeeForm.full_name || '',
                      email: employeeForm.email || '',
                      phone: employeeForm.phone || '',
                      position: employeeForm.position || '',
                      department: employeeForm.department || 'Bán hàng',
                      hire_date: employeeForm.hire_date || new Date().toISOString().slice(0,10),
                      status: (employeeForm.status as Employee['status']) || 'active',
                      salary: employeeForm.salary || 0,
                      role: (employeeForm.role as Employee['role']) || 'staff',
                      address: employeeForm.address,
                      emergency_contact: employeeForm.emergency_contact,
                      performance_score: employeeForm.performance_score || 0,
                      total_sales: employeeForm.total_sales || 0,
                      worked_hours: employeeForm.worked_hours || 0,
                      overtime_hours: employeeForm.overtime_hours || 0,
                      leave_balance: employeeForm.leave_balance || 0,
                      last_check_in: employeeForm.last_check_in,
                      permissions: employeeForm.permissions || [],
                      shift_schedule: employeeForm.shift_schedule || []
                    };
                    setEmployees(prev => [record, ...prev.filter(e => e.id !== id)]);
                    setShowEmployeeModal(false);
                  }}>
                    Lưu nhân viên
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shift Modal */}
      <AnimatePresence>
        {showShiftModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowShiftModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-xl shadow-2xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 ca làm việc</h3>">
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nhân viên</label>
                  <select value={shiftForm.employee_id || ''} onChange={(e) => setShiftForm({ ...shiftForm, employee_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                    <option value="">-- Chọn --</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ngày</label>
                  <input type="date" value={shiftForm.date || ''} onChange={(e) => setShiftForm({ ...shiftForm, date: e.target.value })} className="w-full px-3 py-2 border rounded-lg />">
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Giờ vào</label>
                  <input type="time" value={shiftForm.check_in || ''} onChange={(e) => setShiftForm({ ...shiftForm, check_in: e.target.value })} className="w-full px-3 py-2 border rounded-lg />">
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Giờ ra</label>
                  <input type="time" value={shiftForm.check_out || ''} onChange={(e) => setShiftForm({ ...shiftForm, check_out: e.target.value })} className="w-full px-3 py-2 border rounded-lg />">
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bắt đầu nghỉ</label>
                  <input type="time" value={shiftForm.break_start || ''} onChange={(e) => setShiftForm({ ...shiftForm, break_start: e.target.value })} className="w-full px-3 py-2 border rounded-lg />">
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Kết thúc nghỉ</label>
                  <input type="time" value={shiftForm.break_end || ''} onChange={(e) => setShiftForm({ ...shiftForm, break_end: e.target.value })} className="w-full px-3 py-2 border rounded-lg />">
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowShiftModal(false)}>Hủy</Button>
                <Button onClick={saveShift}>Lưu ca</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Performance Modal */}
      <AnimatePresence>
        {showPerformanceModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowPerformanceModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-xl shadow-2xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 đánh giá hiệu suất</h3>">
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nhân viên</label>
                  <select value={performanceForm.employee_id || ''} onChange={(e) => setPerformanceForm({ ...performanceForm, employee_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                    <option value="">-- Chọn --</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tháng (YYYY-MM)</label>
                  <input type="month" value={performanceForm.month || ''} onChange={(e) => setPerformanceForm({ ...performanceForm, month: e.target.value })} className="w-full px-3 py-2 border rounded-lg />">
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Mục tiêu doanh số</label>
                  <input type="number" value={performanceForm.sales_target || 0} onChange={(e) => setPerformanceForm({ ...performanceForm, sales_target: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg />">
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Doanh số đạt</label>
                  <input type="number" value={performanceForm.sales_achieved || 0} onChange={(e) => setPerformanceForm({ ...performanceForm, sales_achieved: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg />">
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Đánh giá KH (1-5)</label>
                  <input type="number" min={1} max={5} value={performanceForm.customer_rating || 0} onChange={(e) => setPerformanceForm({ ...performanceForm, customer_rating: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg />">
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Điểm hiệu suất (%)</label>
                  <input type="number" min={0} max={100} value={performanceForm.performance_score || 0} onChange={(e) => setPerformanceForm({ ...performanceForm, performance_score: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg />">
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowPerformanceModal(false)}>Hủy</Button>
                <Button onClick={savePerformance}>Lưu đánh giá</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payroll Modal */}
      <AnimatePresence>
        {showPayrollModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowPayrollModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-xl shadow-2xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 phiếu lương</h3>">
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nhân viên</label>
                  <select value={payrollForm.employee_id || ''} onChange={(e) => setPayrollForm({ ...payrollForm, employee_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                    <option value="">-- Chọn --</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Kỳ lương (YYYY-MM)</label>
                  <input type="month" value={payrollForm.period || ''} onChange={(e) => setPayrollForm({ ...payrollForm, period: e.target.value })} className="w-full px-3 py-2 border rounded-lg />">
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Lương cơ bản</label>
                  <input type="number" value={payrollForm.basic_salary || 0} onChange={(e) => setPayrollForm({ ...payrollForm, basic_salary: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg />">
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Làm thêm</label>
                  <input type="number" value={payrollForm.overtime_pay || 0} onChange={(e) => setPayrollForm({ ...payrollForm, overtime_pay: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg />">
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Thưởng</label>
                  <input type="number" value={payrollForm.bonus || 0} onChange={(e) => setPayrollForm({ ...payrollForm, bonus: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg />">
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Khấu trừ</label>
                  <input type="number" value={payrollForm.deductions || 0} onChange={(e) => setPayrollForm({ ...payrollForm, deductions: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg />">
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Trạng thái</label>
                  <select value={payrollForm.status || 'pending'} onChange={(e) => setPayrollForm({ ...payrollForm, status: e.target.value as any })} className="w-full px-3 py-2 border rounded-lg">
                    <option value="pending">Chờ duyệt</option>
                    <option value="approved">Đã duyệt</option>
                    <option value="paid">Đã trả</option>
                  </select>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowPayrollModal(false)}>Hủy</Button>
                <Button onClick={savePayroll}>Lưu phiếu lương</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Permission Modal */}
      <AnimatePresence>
        {showPermissionModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowPermissionModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-xl shadow-2xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 quyền</h3>">
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Chọn nhân viên</label>
                    <select className="w-full px-3 py-2 border rounded-lg">
                      {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Vai trò hệ thống</label>
                    <select className="w-full px-3 py-2 border rounded-lg">
                      <option value="admin">Quản trị viên</option>
                      <option value="manager">Quản lý</option>
                      <option value="cashier">Thu ngân</option>
                      <option value="staff">Nhân viên</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <label className="inline-flex items-center space-x-2"><input type="checkbox" className="checkbox checkbox-sm" defaultChecked /><span>Báo cáo</span></label>
                  <label className="inline-flex items-center space-x-2"><input type="checkbox" className="checkbox checkbox-sm" defaultChecked /><span>Bán hàng</span></label>
                  <label className="inline-flex items-center space-x-2"><input type="checkbox" className="checkbox checkbox-sm" /><span>Kho</span></label>
                  <label className="inline-flex items-center space-x-2"><input type="checkbox" className="checkbox checkbox-sm" /><span>Danh mục</span></label>
                  <label className="inline-flex items-center space-x-2"><input type="checkbox" className="checkbox checkbox-sm" defaultChecked /><span>Khách hàng</span></label>
                  <label className="inline-flex items-center space-x-2"><input type="checkbox" className="checkbox checkbox-sm" /><span>Nhân viên</span></label>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowPermissionModal(false)}>Đóng</Button>
                <Button onClick={() => setShowPermissionModal(false)}>Lưu</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmployeeManagement;
