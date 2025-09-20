import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare,
  Plus,
  Search,
  Calendar,
  Clock,
  User,
  Play,
  Edit,
  Trash2,
  Eye,
  Users,
  AlertTriangle,
  RefreshCw,
  FileText,
  Download
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/ButtonSimplified';
import { DataTable, Column } from '../../components/ui/DataTable';
import { formatDate } from '../../lib/utils';

// Types
interface Task {
  id: number;
  title: string;
  description?: string;
  category_id?: number;
  category_name?: string;
  category_color?: string;
  category_icon?: string;
  assigned_to?: number;
  assigned_to_name?: string;
  assigned_by?: number;
  assigned_by_name?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  due_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  progress: number;
  tags?: string[];
  attachments?: string[];
  notes?: string;
  is_recurring: boolean;
  recurring_pattern?: string;
  parent_task_id?: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  comments?: TaskComment[];
  time_logs?: TimeLog[];
}

interface TaskComment {
  id: number;
  task_id: number;
  user_id: number;
  user_name: string;
  comment: string;
  is_internal: boolean;
  created_at: string;
}

interface TimeLog {
  id: number;
  task_id: number;
  user_id: number;
  user_name: string;
  start_time: string;
  end_time?: string;
  duration_minutes: number;
  description?: string;
  created_at: string;
}

interface TaskCategory {
  id: number;
  name: string;
  description?: string;
  color: string;
  icon: string;
  is_active: boolean;
}

interface TaskTemplate {
  id: number;
  name: string;
  description?: string;
  category_id?: number;
  category_name?: string;
  priority: string;
  estimated_hours?: number;
  tags?: string[];
  checklist?: string[];
  is_active: boolean;
}

interface Employee {
  id: number;
  full_name: string;
  role: string;
  is_active: boolean;
}

const TaskManagement: React.FC = () => {
  // State management
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [, setTemplates] = useState<TaskTemplate[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'assigned' | 'templates'>('all');
  
  // Modals and forms
  const [showTaskModal, setShowTaskModal] = useState(false);
  
  // Form data
  const [taskForm, setTaskForm] = useState<Partial<Task>>({});

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [assignedToFilter] = useState('all');

  // Stats
  const [taskStats, setTaskStats] = useState({
    total_tasks: 0,
    pending_tasks: 0,
    in_progress_tasks: 0,
    completed_tasks: 0,
    overdue_tasks: 0,
    today_tasks: 0,
    my_tasks: 0,
    urgent_tasks: 0
  });

  useEffect(() => {
    loadTaskData();
  }, []);

  const loadTaskData = async () => {
    try {
      setLoading(true);
      
      // Use fallback data for all task-related API calls
      // Mock tasks data
      const mockTasks = [
        {
          id: '1',
          title: 'Kiểm tra tồn kho',
          description: 'Kiểm tra và cập nhật tồn kho sản phẩm',
          status: 'pending',
          priority: 'medium',
          category: 'inventory',
          assignee_id: '1',
          assignee_name: 'Nguyễn Văn A',
          due_date: new Date(Date.now() + 86400000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Báo cáo doanh thu',
          description: 'Tạo báo cáo doanh thu tháng này',
          status: 'in_progress',
          priority: 'high',
          category: 'reports',
          assignee_id: '2',
          assignee_name: 'Trần Thị B',
          due_date: new Date(Date.now() + 172800000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      setTasks(mockTasks);

      // Mock categories data
      const mockCategories = [
        { id: 'inventory', name: 'Quản lý kho', color: '#3B82F6' },
        { id: 'reports', name: 'Báo cáo', color: '#10B981' },
        { id: 'sales', name: 'Bán hàng', color: '#F59E0B' },
        { id: 'maintenance', name: 'Bảo trì', color: '#EF4444' }
      ];
      setCategories(mockCategories);

      // Mock templates data
      const mockTemplates = [
        {
          id: '1',
          name: 'Kiểm tra tồn kho hàng ngày',
          description: 'Template cho việc kiểm tra tồn kho',
          tasks: [
            { title: 'Kiểm tra sản phẩm sắp hết', priority: 'high' },
            { title: 'Cập nhật số lượng', priority: 'medium' }
          ]
        }
      ];
      setTemplates(mockTemplates);

      // Mock employees data
      const mockEmployees = [
        { id: '1', name: 'Nguyễn Văn A', email: 'a@example.com', role: 'staff' },
        { id: '2', name: 'Trần Thị B', email: 'b@example.com', role: 'manager' }
      ];
      setEmployees(mockEmployees);

      // Mock stats data
      setTaskStats({
        total_tasks: mockTasks.length,
        pending_tasks: mockTasks.filter(t => t.status === 'pending').length,
        in_progress_tasks: mockTasks.filter(t => t.status === 'in_progress').length,
        completed_tasks: mockTasks.filter(t => t.status === 'completed').length,
        overdue_tasks: 0,
        today_tasks: 1,
        my_tasks: 0,
        urgent_tasks: mockTasks.filter(t => t.priority === 'urgent').length
      });

    } catch (error) {
      console.error('Error loading task data:', error);
      // Set empty data on error
      setTasks([]);
      setCategories([]);
      setTemplates([]);
      setEmployees([]);
      setTaskStats({
        total_tasks: 0,
        pending_tasks: 0,
        in_progress_tasks: 0,
        completed_tasks: 0,
        overdue_tasks: 0,
        today_tasks: 0,
        my_tasks: 0,
        urgent_tasks: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Task table columns
  const taskColumns: Column<Task>[] = [
    {
      key: 'title',
      title: 'Tiêu đề',
      sortable: true,
      render: (value: string, record: Task) => (
        <div className="flex items-center space-x-3">
          <div 
            className="w-3 h-3 rounded-full">
            style={{ backgroundColor: record.category_color || '#6B7280' }}
          />
          <div>
            <div className="font-medium text-gray-900">
            {record.description && (
              <div className="text-sm text-gray-500 truncate max-w-xs">
                {record.description}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'category_name',
      title: 'Danh mục',
      sortable: true,
      render: (value: string, record: Task) => (
        <span 
          className="px-2 py-1 text-xs font-medium rounded-full">
          style={{ 
            backgroundColor: record.category_color + '20', 
            color: record.category_color 
          }}
        >
          {value || 'Không phân loại'}
        </span>
      )
    },
    {
      key: 'assigned_to_name',
      title: 'Người thực hiện',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4 text-gray-400" />
          <span className="text-sm">{value || 'Chưa giao'}</span>
        </div>
      )
    },
    {
      key: 'priority',
      title: 'Độ ưu tiên',
      sortable: true,
      render: (value: string) => {
        const priorityConfig = {
          low: { color: 'green', text: 'Thấp', icon: '↓' },
          medium: { color: 'yellow', text: 'Trung bình', icon: '→' },
          high: { color: 'orange', text: 'Cao', icon: '↑' },
          urgent: { color: 'red', text: 'Khẩn cấp', icon: '↑↑' }
        };
        const config = priorityConfig[value as keyof typeof priorityConfig];
        return (
          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-${config.color}-100 text-${config.color}-800  
            <span className="mr-1">{config.icon}</span>
            {config.text}
          </span>
        );
      }
    },
    {
      key: 'status',
      title: 'Trạng thái',
      sortable: true,
      render: (value: string) => {
        const statusConfig = {
          pending: { color: 'gray', text: 'Chờ thực hiện' },
          in_progress: { color: 'blue', text: 'Đang thực hiện' },
          completed: { color: 'green', text: 'Hoàn thành' },
          cancelled: { color: 'red', text: 'Đã hủy' },
          on_hold: { color: 'yellow', text: 'Tạm dừng' }
        };
        const config = statusConfig[value as keyof typeof statusConfig];
        return (
          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-${config.color}-100 text-${config.color}-800  
            {config.text}
          </span>
        );
      }
    },
    {
      key: 'due_date',
      title: 'Hạn hoàn thành',
      sortable: true,
      render: (value: string) => {
        if (!value) return <span className="text-gray-400">Không có</span>;
        const dueDate = new Date(value);
        const today = new Date();
        const isOverdue = dueDate < today;
        const isToday = dueDate.toDateString() === today.toDateString();
        
        return (
          <div className={`text-sm ${isOverdue ? 'text-red-600' : isToday ? 'text-orange-600' : 'text-gray-600'}`}>
            {formatDate(value)}
            {isOverdue && <AlertTriangle className="w-3 h-3 inline ml-1" />}
            {isToday && <Clock className="w-3 h-3 inline ml-1" />}
          </div>
        );
      }
    },
    {
      key: 'progress',
      title: 'Tiến độ',
      sortable: true,
      align: 'center',
      render: (value: number) => (
        <div className="flex items-center justify-center">
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300">
              style={{ width: `${value}%` }}
            />
          </div>
          <span className="ml-2 text-xs font-medium">{value}%</span>
        </div>
      )
    },
    {
      key: 'id' as keyof Task,
      title: 'Thao tác',
      align: 'center',
      render: (_: any, record: Task) => (
        <div className="flex items-center justify-center space-x-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleViewTask(record)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEditTask(record)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDeleteTask(record.id)}
            className="text-red-600 hover:text-red-700">
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleEditTask = (task: Task) => {
    setTaskForm(task);
    setShowTaskModal(true);
  };

  const handleDeleteTask = async (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa công việc này?')) {
      try {
        const response = await fetch(`/api/tasks/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          setTasks(tasks.filter(t => t.id !== id));
        }
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleCreateTask = () => {
    setTaskForm({});
    setShowTaskModal(true);
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || task.category_id?.toString() === categoryFilter;
    const matchesAssignedTo = assignedToFilter === 'all' || task.assigned_to?.toString() === assignedToFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesAssignedTo;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 tải dữ liệu công việc...</p>">
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
            <CheckSquare className="w-8 h-8 mr-3 text-blue-600" />
            Quản lý công việc
          </h1>
          <p className="text-gray-600 mt-1">
            Chia công việc và theo dõi tiến độ nhân viên
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={handleCreateTask}>
            <Plus className="w-4 h-4 mr-2" />
            Tạo công việc
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 công việc</p>">
                <p className="text-3xl font-bold text-gray-900">
                <p className="text-sm text-blue-600">
                  {taskStats.pending_tasks} chờ thực hiện
                </p>
              </div>
              <CheckSquare className="w-12 h-12 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 thực hiện</p>">
                <p className="text-3xl font-bold text-gray-900">
                <p className="text-sm text-green-600">
                  {taskStats.completed_tasks} đã hoàn thành
                </p>
              </div>
              <Play className="w-12 h-12 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 hạn</p>">
                <p className="text-3xl font-bold text-gray-900">
                <p className="text-sm text-red-600">
                  Cần xử lý ngay
                </p>
              </div>
              <AlertTriangle className="w-12 h-12 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 nay</p>">
                <p className="text-3xl font-bold text-gray-900">
                <p className="text-sm text-orange-600">
                  Cần hoàn thành
                </p>
              </div>
              <Calendar className="w-12 h-12 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'all', label: 'Tất cả công việc', icon: CheckSquare },
            { id: 'my', label: 'Công việc của tôi', icon: User },
            { id: 'assigned', label: 'Tôi giao việc', icon: Users },
            { id: 'templates', label: 'Mẫu công việc', icon: FileText }
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
          {activeTab === 'all' && (
            <div className="space-y-6">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm công việc..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ">
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ">
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="pending">Chờ thực hiện</option>
                    <option value="in_progress">Đang thực hiện</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="cancelled">Đã hủy</option>
                    <option value="on_hold">Tạm dừng</option>
                  </select>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ">
                  >
                    <option value="all">Tất cả độ ưu tiên</option>
                    <option value="urgent">Khẩn cấp</option>
                    <option value="high">Cao</option>
                    <option value="medium">Trung bình</option>
                    <option value="low">Thấp</option>
                  </select>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ">
                  >
                    <option value="all">Tất cả danh mục</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id.toString()}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Xuất Excel
                  </Button>
                </div>
              </div>

              {/* Task Table */}
              <DataTable
                data={filteredTasks}
                columns={taskColumns}
                searchable={false}
                pagination
                pageSize={20}
                className="border-0">
              />
            </div>
          )}

          {activeTab === 'my' && (
            <div className="space-y-6">
              <div className="text-center py-12">
                <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Công việc của tôi
                </h3>
                <p className="text-gray-600 mb-6">
                  Xem và quản lý các công việc được giao cho bạn
                </p>
                <Button onClick={() => setActiveTab('all')}>
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Xem tất cả công việc
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'assigned' && (
            <div className="space-y-6">
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Công việc tôi giao
                </h3>
                <p className="text-gray-600 mb-6">
                  Theo dõi các công việc bạn đã giao cho nhân viên khác
                </p>
                <Button onClick={() => setActiveTab('all')}>
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Xem tất cả công việc
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Mẫu công việc
                </h3>
                <p className="text-gray-600 mb-6">
                  Tính năng mẫu công việc sẽ được phát triển trong phiên bản tiếp theo
                </p>
                <Button onClick={() => setActiveTab('all')}>
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Xem tất cả công việc
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Modal */}
      <AnimatePresence>
        {showTaskModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowTaskModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto text-gray-900" onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900">
                  {selectedTask ? 'Chi tiết công việc' : 'Tạo công việc mới'}
                </h3>
              </div>
              
              <div className="p-6">
                {selectedTask ? (
                  // Task Details View
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-xl font-bold text-gray-900">
                            {selectedTask.description && (
                              <p className="text-gray-600 mt-2">{selectedTask.description}</p>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Trạng thái
                              </label>
                              <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                                selectedTask.status === 'completed' ? 'bg-green-100 text-green-800' :
                                selectedTask.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                selectedTask.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {selectedTask.status}
                              </span>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Độ ưu tiên
                              </label>
                              <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                                selectedTask.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                selectedTask.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                selectedTask.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {selectedTask.priority}
                              </span>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Người thực hiện
                              </label>
                              <p className="text-gray-900 || 'Chưa giao'}</p>">
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Hạn hoàn thành
                              </label>
                              <p className="text-gray-900">
                                {selectedTask.due_date ? formatDate(selectedTask.due_date) : 'Không có'}
                              </p>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Tiến độ
                            </label>
                            <div className="flex items-center space-x-3">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300">
                                  style={{ width: `${selectedTask.progress}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">{selectedTask.progress}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="lg:col-span-1">
                        <div className="space-y-4">
                          <div>
                            <h5 className="font-medium text-gray-800 mb-3">Thông tin bổ sung</h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600 mục:</span>">
                                <span>{selectedTask.category_name || 'Không phân loại'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 gian ước tính:</span>">
                                <span>{selectedTask.estimated_hours || 0}h</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 gian thực tế:</span>">
                                <span>{selectedTask.actual_hours || 0}h</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 giao:</span>">
                                <span>{selectedTask.assigned_by_name || 'Hệ thống'}</span>
                              </div>
                            </div>
                          </div>

                          {selectedTask.tags && selectedTask.tags.length > 0 && (
                            <div>
                              <h5 className="font-medium text-gray-800 mb-2">Tags</h5>
                              <div className="flex flex-wrap gap-1">
                                {selectedTask.tags.map((tag, index) => (
                                  <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Comments Section */}
                    {selectedTask.comments && selectedTask.comments.length > 0 && (
                      <div>
                        <h5 className="font-medium text-gray-800 mb-3">Bình luận</h5>
                        <div className="space-y-3">
                          {selectedTask.comments.map(comment => (
                            <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">{comment.user_name}</span>
                                <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
                              </div>
                              <p className="text-sm text-gray-700">
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Task Form
                  <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tiêu đề công việc *
                        </label>
                        <input
                          type="text"
                          value={taskForm.title || ''}
                          onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ">
                          placeholder="Nhập tiêu đề công việc"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mô tả
                        </label>
                        <textarea
                          value={taskForm.description || ''}
                          onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ">
                          placeholder="Mô tả chi tiết công việc"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Danh mục
                        </label>
                        <select
                          value={taskForm.category_id || ''}
                          onChange={(e) => setTaskForm({...taskForm, category_id: e.target.value ? parseInt(e.target.value) : undefined})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ">
                        >
                          <option value="">Chọn danh mục</option>
                          {categories.map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Người thực hiện *
                        </label>
                        <select
                          value={taskForm.assigned_to || ''}
                          onChange={(e) => setTaskForm({...taskForm, assigned_to: e.target.value ? parseInt(e.target.value) : undefined})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ">
                        >
                          <option value="">Chọn nhân viên</option>
                          {employees.map(employee => (
                            <option key={employee.id} value={employee.id}>
                              {employee.full_name} ({employee.role})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Độ ưu tiên
                        </label>
                        <select
                          value={taskForm.priority || 'medium'}
                          onChange={(e) => setTaskForm({...taskForm, priority: e.target.value as any})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ">
                        >
                          <option value="low">Thấp</option>
                          <option value="medium">Trung bình</option>
                          <option value="high">Cao</option>
                          <option value="urgent">Khẩn cấp</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Hạn hoàn thành
                        </label>
                        <input
                          type="datetime-local"
                          value={taskForm.due_date || ''}
                          onChange={(e) => setTaskForm({...taskForm, due_date: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ">
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Thời gian ước tính (giờ)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={taskForm.estimated_hours || ''}
                          onChange={(e) => setTaskForm({...taskForm, estimated_hours: e.target.value ? parseFloat(e.target.value) : undefined})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ">
                          placeholder="0.0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tiến độ (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={taskForm.progress || 0}
                          onChange={(e) => setTaskForm({...taskForm, progress: parseInt(e.target.value) || 0})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ">
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Trạng thái
                        </label>
                        <select
                          value={taskForm.status || 'pending'}
                          onChange={(e) => setTaskForm({...taskForm, status: e.target.value as any})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ">
                        >
                          <option value="pending">Chờ thực hiện</option>
                          <option value="in_progress">Đang thực hiện</option>
                          <option value="completed">Hoàn thành</option>
                          <option value="cancelled">Đã hủy</option>
                          <option value="on_hold">Tạm dừng</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ghi chú
                        </label>
                        <textarea
                          value={taskForm.notes || ''}
                          onChange={(e) => setTaskForm({...taskForm, notes: e.target.value})}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ">
                          placeholder="Ghi chú bổ sung"
                        />
                      </div>
                    </div>
                  </form>
                )}
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTaskModal(false);
                    setSelectedTask(null);
                  }}
                >
                  Hủy
                </Button>
                {!selectedTask && (
                  <Button onClick={async () => {
                    try {
                      const response = await fetch('/api/tasks', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(taskForm)
                      });
                      if (response.ok) {
                        loadTaskData();
                        setShowTaskModal(false);
                      }
                    } catch (error) {
                      console.error('Error creating task:', error);
                    }
                  }}>
                    Tạo công việc
                  </Button>
                )}
                {selectedTask && (
                  <Button onClick={async () => {
                    try {
                      const response = await fetch(`/api/tasks/${selectedTask.id}`, {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(taskForm)
                      });
                      if (response.ok) {
                        loadTaskData();
                        setShowTaskModal(false);
                        setSelectedTask(null);
                      }
                    } catch (error) {
                      console.error('Error updating task:', error);
                    }
                  }}>
                    Cập nhật
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaskManagement;
