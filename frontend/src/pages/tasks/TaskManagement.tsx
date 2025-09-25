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
  comments?: Array<{
    id: number;
    content: string;
    user_name: string;
    created_at: string;
  }>;
}

interface TaskForm {
  title: string;
  description?: string;
  category_id?: number | undefined;
  assigned_to?: number | undefined;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  due_date?: string | undefined;
  estimated_hours?: number | undefined;
  progress: number;
}

interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
}

interface TaskStats {
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  today_tasks: number;
}

const TaskManagement: React.FC = () => {
  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // UI state
  const [activeTab, setActiveTab] = useState('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState<TaskForm>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    progress: 0
  });

  // Load data
  useEffect(() => {
    loadTaskData();
    loadCategories();
  }, []);

  const loadTaskData = async () => {
    try {
      setLoading(true);
      const { default: apiClient } = await import('../../services/api/client');
      const response = await apiClient.get('/tasks');
      if (response?.data?.success) {
        setTasks(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      setError('Không thể tải dữ liệu công việc');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { default: apiClient } = await import('../../services/api/client');
      const response = await apiClient.get('/categories');
      if (response?.data?.success) {
        setCategories(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || task.category_id?.toString() === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  // Calculate stats
  const taskStats: TaskStats = {
    total_tasks: tasks.length,
    completed_tasks: tasks.filter(t => t.status === 'completed').length,
    overdue_tasks: tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length,
    today_tasks: tasks.filter(t => {
      if (!t.due_date) return false;
      const today = new Date();
      const dueDate = new Date(t.due_date);
      return dueDate.toDateString() === today.toDateString() && t.status !== 'completed';
    }).length
  };

  // Table columns
  const taskColumns: Column<Task>[] = [
    {
      key: 'title',
      title: 'Công việc',
      sortable: true,
      render: (_value: string, record: Task) => (
        <div className="flex items-center space-x-3">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: record.category_color || '#6B7280' }}
          />
          <div>
            <div className="font-medium text-gray-900">
              {record.title}
            </div>
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
      render: (_value: string, record: Task) => (
        <span 
          className="px-2 py-1 text-xs font-medium rounded-full"
          style={{ 
            backgroundColor: record.category_color + '20', 
            color: record.category_color 
          }}
        >
          {record.category_name || 'Không phân loại'}
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
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            {config?.text || value}
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
        const bgColor = 'bg-' + config.color + '-100';
        const textColor = 'text-' + config.color + '-800';
        return (
          <span className={'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ' + bgColor + ' ' + textColor}>
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
        
        const dateClass = isOverdue ? 'text-red-600' : isToday ? 'text-orange-600' : 'text-gray-600';
        return (
          <div className={'text-sm ' + dateClass}>
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
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: value + '%' }}
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
      render: (_value: any, record: Task) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedTask(record);
              setShowTaskModal(true);
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedTask(record);
              setTaskForm({
                title: record.title,
                description: record.description || '',
                category_id: record.category_id,
                assigned_to: record.assigned_to,
                priority: record.priority,
                status: record.status,
                due_date: record.due_date,
                estimated_hours: record.estimated_hours,
                progress: record.progress
              });
              setShowTaskModal(true);
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDeleteTask(record.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  const handleDeleteTask = async (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa công việc này?')) {
      try {
        const { default: apiClient } = await import('../../services/api/client');
        const res = await apiClient.delete('/tasks/' + id);
        if (res?.data?.success) {
          setTasks(tasks.filter(t => t.id !== id));
        }
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 p-4">
        <div className="bg-base-100 rounded-lg shadow-sm p-8 text-center">
          <div className="loading loading-spinner loading-lg"></div>
          <p className="mt-4">Đang tải dữ liệu công việc...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-base-200 p-4">
        <div className="bg-base-100 rounded-lg shadow-sm p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-4">Lỗi tải dữ liệu</h2>
          <p className="text-base-content/70 mb-6">{error}</p>
          <Button onClick={loadTaskData}>
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý công việc</h1>
          <p className="text-gray-600">Quản lý và theo dõi tất cả công việc trong hệ thống</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tổng công việc</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {taskStats.total_tasks}
                  </p>
                  <p className="text-sm text-blue-600">
                    Tất cả công việc
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
                  <p className="text-sm font-medium text-gray-600">Đã thực hiện</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {taskStats.completed_tasks}
                  </p>
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
                  <p className="text-sm font-medium text-gray-600">Quá hạn</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {taskStats.overdue_tasks}
                  </p>
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
                  <p className="text-sm font-medium text-gray-600">Hôm nay</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {taskStats.today_tasks}
                  </p>
                  <p className="text-sm text-orange-600">
                    Cần hoàn thành
                  </p>
                </div>
                <Calendar className="w-12 h-12 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardContent className="p-6">
            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex space-x-8">
                {[
                  { id: 'all', label: 'Tất cả', icon: CheckSquare },
                  { id: 'my', label: 'Của tôi', icon: User },
                  { id: 'assigned', label: 'Tôi giao việc', icon: Users },
                  { id: 'templates', label: 'Mẫu công việc', icon: FileText }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={'flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ' + 
                      (activeTab === tab.id
                        ? 'border-blue-600 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300')
                    }
                  >
                    <tab.icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
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
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  className="border-0"
                />
              </div>
            )}

            {activeTab === 'my' && (
              <div className="space-y-6">
                <div className="text-center py-12">
                  <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Công việc của tôi
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Hiển thị các công việc được giao cho bạn
                  </p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Tạo công việc mới
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'assigned' && (
              <div className="space-y-6">
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Công việc tôi giao
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Hiển thị các công việc bạn đã giao cho người khác
                  </p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Giao việc mới
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'templates' && (
              <div className="space-y-6">
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Mẫu công việc
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Quản lý các mẫu công việc để tạo nhanh
                  </p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Tạo mẫu mới
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Task Detail Modal */}
      <AnimatePresence>
        {showTaskModal && selectedTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowTaskModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Chi tiết công việc
                  </h2>
                  <button
                    onClick={() => setShowTaskModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
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
                                {selectedTask.title}
                              </h4>
                              {selectedTask.description && (
                                <p className="text-gray-600 mt-2">{selectedTask.description}</p>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Trạng thái
                                </label>
                                <span className={'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ' + 
                                  (selectedTask.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  selectedTask.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                  selectedTask.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                                  'bg-red-100 text-red-800')
                                }>
                                  {selectedTask.status}
                                </span>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Độ ưu tiên
                                </label>
                                <span className={'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ' + 
                                  (selectedTask.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                  selectedTask.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                  selectedTask.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800')
                                }>
                                  {selectedTask.priority}
                                </span>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Người thực hiện
                                </label>
                                <p className="text-gray-900">
                                  {selectedTask.assigned_to_name || 'Chưa giao'}
                                </p>
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
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tiến độ
                              </label>
                              <div className="flex items-center space-x-3">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: selectedTask.progress + '%' }}
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
                                  <span className="text-gray-600">Danh mục:</span>
                                  <span>{selectedTask.category_name || 'Không phân loại'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Thời gian ước tính:</span>
                                  <span>{selectedTask.estimated_hours || 0}h</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Thời gian thực tế:</span>
                                  <span>{selectedTask.actual_hours || 0}h</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Ngày giao:</span>
                                  <span>{selectedTask.assigned_by_name || 'Hệ thống'}</span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h5 className="font-medium text-gray-800 mb-3">Thao tác</h5>
                              <div className="space-y-2">
                                <Button className="w-full" variant="outline">
                                  <Edit className="w-4 h-4 mr-2" />
                                  Chỉnh sửa
                                </Button>
                                <Button className="w-full" variant="outline">
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  Cập nhật tiến độ
                                </Button>
                                <Button className="w-full" variant="outline">
                                  <Users className="w-4 h-4 mr-2" />
                                  Giao việc
                                </Button>
                              </div>
                            </div>
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
                                  {comment.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Task Form
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tiêu đề *
                          </label>
                          <input
                            type="text"
                            value={taskForm.title}
                            onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                            Độ ưu tiên
                          </label>
                          <select
                            value={taskForm.priority || 'medium'}
                            onChange={(e) => setTaskForm({...taskForm, priority: e.target.value as any})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Trạng thái
                          </label>
                          <select
                            value={taskForm.status || 'pending'}
                            onChange={(e) => setTaskForm({...taskForm, status: e.target.value as any})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="pending">Chờ thực hiện</option>
                            <option value="in_progress">Đang thực hiện</option>
                            <option value="completed">Hoàn thành</option>
                            <option value="cancelled">Đã hủy</option>
                            <option value="on_hold">Tạm dừng</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3">
                        <Button variant="outline" onClick={() => setShowTaskModal(false)}>
                          Hủy
                        </Button>
                        {selectedTask && (
                          <Button onClick={async () => {
                            try {
                              const { default: apiClient } = await import('../../services/api/client');
                              const res = await apiClient.put('/tasks/' + ((selectedTask as any)?.id || '0'), taskForm);
                              if (res?.data?.success) {
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
                        {!selectedTask && (
                          <Button onClick={async () => {
                            try {
                              const { default: apiClient } = await import('../../services/api/client');
                              const res = await apiClient.post('/tasks', taskForm);
                              if (res?.data?.success) {
                                loadTaskData();
                                setShowTaskModal(false);
                                setTaskForm({
                                  title: '',
                                  description: '',
                                  priority: 'medium',
                                  status: 'pending',
                                  progress: 0
                                });
                              }
                            } catch (error) {
                              console.error('Error creating task:', error);
                            }
                          }}>
                            Tạo công việc
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaskManagement;
