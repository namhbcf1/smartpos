import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  User, Plus, Search, Filter, Download, Eye, Edit, Trash2, 
  Clock, AlertCircle, CheckCircle, XCircle, Calendar, Flag, 
  MoreVertical, MessageSquare, Paperclip, Star, TrendingUp,
  BarChart3, Grid, List, Kanban, Calendar as CalendarIcon,
  Target, Zap, Award, Timer
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/badge'

interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'completed' | 'overdue'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignee: {
    id: string
    name: string
    avatar?: string
    department: string
  }
  creator: {
    id: string
    name: string
    avatar?: string
  }
  followers: {
    id: string
    name: string
    avatar?: string
  }[]
  project?: {
    id: string
    name: string
    color: string
  }
  department: string
  deadline: string
  createdAt: string
  updatedAt: string
  completedAt?: string
  estimatedHours: number
  actualHours?: number
  tags: string[]
  attachments: number
  comments: number
  subtasks: {
    id: string
    title: string
    completed: boolean
  }[]
  isOverdue: boolean
  daysRemaining: number
  isMyTask: boolean
}

const mockMyTasks: Task[] = [
  {
    id: '1',
    title: 'Thiết kế giao diện trang chủ mới',
    description: 'Tạo giao diện trang chủ hiện đại và responsive cho website',
    status: 'in_progress',
    priority: 'high',
    assignee: {
      id: '1',
      name: 'Nguyễn Văn A',
      department: 'Design'
    },
    creator: {
      id: '2',
      name: 'Trần Thị B'
    },
    followers: [
      { id: '3', name: 'Lê Văn C' },
      { id: '4', name: 'Phạm Thị D' }
    ],
    project: {
      id: '1',
      name: 'Website Redesign',
      color: 'blue'
    },
    department: 'Design',
    deadline: '2024-01-30',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-22',
    estimatedHours: 40,
    actualHours: 25,
    tags: ['UI/UX', 'Frontend', 'Responsive'],
    attachments: 3,
    comments: 8,
    subtasks: [
      { id: '1', title: 'Wireframe trang chủ', completed: true },
      { id: '2', title: 'Thiết kế mockup', completed: true },
      { id: '3', title: 'Code HTML/CSS', completed: false },
      { id: '4', title: 'Test responsive', completed: false }
    ],
    isOverdue: false,
    daysRemaining: 8,
    isMyTask: true
  },
  {
    id: '2',
    title: 'Review code cho module báo cáo',
    description: 'Kiểm tra và đánh giá code của module báo cáo mới',
    status: 'todo',
    priority: 'medium',
    assignee: {
      id: '1',
      name: 'Nguyễn Văn A',
      department: 'Design'
    },
    creator: {
      id: '5',
      name: 'Hoàng Văn E'
    },
    followers: [
      { id: '6', name: 'Vũ Thị F' }
    ],
    project: {
      id: '2',
      name: 'System Upgrade',
      color: 'green'
    },
    department: 'IT',
    deadline: '2024-01-28',
    createdAt: '2024-01-20',
    updatedAt: '2024-01-22',
    estimatedHours: 8,
    tags: ['Code Review', 'Backend', 'Reports'],
    attachments: 2,
    comments: 3,
    subtasks: [
      { id: '5', title: 'Đọc và hiểu code', completed: false },
      { id: '6', title: 'Kiểm tra logic', completed: false },
      { id: '7', title: 'Viết feedback', completed: false }
    ],
    isOverdue: false,
    daysRemaining: 6,
    isMyTask: true
  },
  {
    id: '3',
    title: 'Cập nhật tài liệu API',
    description: 'Viết lại tài liệu API cho các endpoint mới',
    status: 'completed',
    priority: 'low',
    assignee: {
      id: '1',
      name: 'Nguyễn Văn A',
      department: 'Design'
    },
    creator: {
      id: '7',
      name: 'Đặng Văn G'
    },
    followers: [
      { id: '8', name: 'Bùi Văn H' }
    ],
    project: {
      id: '2',
      name: 'System Upgrade',
      color: 'green'
    },
    department: 'IT',
    deadline: '2024-01-20',
    createdAt: '2024-01-18',
    updatedAt: '2024-01-20',
    completedAt: '2024-01-20',
    estimatedHours: 6,
    actualHours: 5,
    tags: ['Documentation', 'API', 'Technical Writing'],
    attachments: 1,
    comments: 2,
    subtasks: [
      { id: '8', title: 'Liệt kê endpoints', completed: true },
      { id: '9', title: 'Viết mô tả chi tiết', completed: true },
      { id: '10', title: 'Thêm ví dụ code', completed: true }
    ],
    isOverdue: false,
    daysRemaining: 0,
    isMyTask: true
  },
  {
    id: '4',
    title: 'Thiết kế logo cho dự án mới',
    description: 'Tạo logo cho dự án mobile app sắp ra mắt',
    status: 'overdue',
    priority: 'urgent',
    assignee: {
      id: '1',
      name: 'Nguyễn Văn A',
      department: 'Design'
    },
    creator: {
      id: '9',
      name: 'Ngô Thị I'
    },
    followers: [
      { id: '10', name: 'Lý Văn J' }
    ],
    project: {
      id: '3',
      name: 'Mobile App',
      color: 'purple'
    },
    department: 'Design',
    deadline: '2024-01-18',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-22',
    estimatedHours: 12,
    actualHours: 8,
    tags: ['Logo Design', 'Branding', 'Mobile'],
    attachments: 4,
    comments: 6,
    subtasks: [
      { id: '11', title: 'Nghiên cứu thương hiệu', completed: true },
      { id: '12', title: 'Tạo concept', completed: true },
      { id: '13', title: 'Thiết kế chi tiết', completed: false },
      { id: '14', title: 'Xuất file final', completed: false }
    ],
    isOverdue: true,
    daysRemaining: -4,
    isMyTask: true
  }
]

const statusConfig = {
  todo: { label: 'Chờ xử lý', color: 'gray', icon: Clock },
  in_progress: { label: 'Đang làm', color: 'blue', icon: AlertCircle },
  completed: { label: 'Hoàn thành', color: 'green', icon: CheckCircle },
  overdue: { label: 'Quá hạn', color: 'red', icon: XCircle }
}

const priorityConfig = {
  low: { label: 'Thấp', color: 'gray' },
  medium: { label: 'Trung bình', color: 'blue' },
  high: { label: 'Cao', color: 'orange' },
  urgent: { label: 'Khẩn cấp', color: 'red' }
}

export const MyTasks: React.FC = () => {
  const [tasks] = useState<Task[]>(mockMyTasks)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedPriority, setSelectedPriority] = useState('all')
  const [selectedTimeRange, setSelectedTimeRange] = useState('all')
  const [sortBy, setSortBy] = useState('deadline')
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'kanban' | 'calendar'>('list')
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || task.status === selectedStatus
    const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority
    return matchesSearch && matchesStatus && matchesPriority
  })

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case 'deadline':
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      case 'priority':
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      case 'status':
        return a.status.localeCompare(b.status)
      default:
        return 0
    }
  })

  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => t.status === 'overdue').length,
    urgent: tasks.filter(t => t.priority === 'urgent').length,
    high: tasks.filter(t => t.priority === 'high').length,
    completedThisWeek: tasks.filter(t => {
      if (!t.completedAt) return false
      const completedDate = new Date(t.completedAt)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return completedDate >= weekAgo
    }).length,
    totalHours: tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0),
    estimatedHours: tasks.reduce((sum, t) => sum + t.estimatedHours, 0)
  }

  const getStatusInfo = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.todo
  }

  const getPriorityInfo = (priority: string) => {
    return priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.low
  }

  const handleSelectTask = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    )
  }

  const handleSelectAll = () => {
    setSelectedTasks(
      selectedTasks.length === sortedTasks.length 
        ? [] 
        : sortedTasks.map(t => t.id)
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getDaysRemaining = (deadline: string) => {
    const today = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getCompletionPercentage = (subtasks: Task['subtasks']) => {
    if (subtasks.length === 0) return 0
    const completed = subtasks.filter(st => st.completed).length
    return Math.round((completed / subtasks.length) * 100)
  }

  const getProductivityScore = () => {
    const completedTasks = tasks.filter(t => t.status === 'completed').length
    const totalTasks = tasks.length
    const onTimeTasks = tasks.filter(t => t.status === 'completed' && !t.isOverdue).length
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
    const onTimeRate = completedTasks > 0 ? (onTimeTasks / completedTasks) * 100 : 0
    return Math.round((completionRate + onTimeRate) / 2)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <User className="w-8 h-8 text-purple-600" />
            Công việc của tôi
          </h1>
          <p className="text-gray-600 mt-2">
            Quản lý và theo dõi các công việc được giao cho bạn
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Xuất báo cáo
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Tạo công việc mới
          </Button>
        </div>
      </div>

      {/* Personal Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
              <p className="text-xs text-gray-500">Tổng công việc</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">{stats.todo}</p>
              <p className="text-xs text-gray-500">Chờ xử lý</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              <p className="text-xs text-gray-500">Đang làm</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-xs text-gray-500">Hoàn thành</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              <p className="text-xs text-gray-500">Quá hạn</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{getProductivityScore()}%</p>
              <p className="text-xs text-gray-500">Hiệu suất</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.completedThisWeek}</p>
              <p className="text-xs text-gray-500">Tuần này</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">{stats.totalHours}h</p>
              <p className="text-xs text-gray-500">Giờ làm việc</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Công việc khẩn cấp</h3>
                <p className="text-sm text-gray-500">{stats.urgent} công việc cần xử lý ngay</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Timer className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Sắp đến hạn</h3>
                <p className="text-sm text-gray-500">Công việc cần hoàn thành trong 3 ngày</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Hoàn thành tuần này</h3>
                <p className="text-sm text-gray-500">{stats.completedThisWeek} công việc hoàn thành</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Ước tính thời gian</h3>
                <p className="text-sm text-gray-500">Hoàn thành {stats.estimatedHours}h công việc</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Tìm kiếm công việc của bạn..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Tất cả trạng thái</option>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Tất cả độ ưu tiên</option>
                {Object.entries(priorityConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="deadline">Sắp xếp theo deadline</option>
                <option value="priority">Sắp xếp theo độ ưu tiên</option>
                <option value="status">Sắp xếp theo trạng thái</option>
              </select>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Bộ lọc
              </Button>
            </div>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 mt-4">
            <span className="text-sm text-gray-500">Chế độ xem:</span>
            <div className="flex border border-gray-300 rounded-md">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-purple-500 text-white' : 'text-gray-600'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm ${viewMode === 'grid' ? 'bg-purple-500 text-white' : 'text-gray-600'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-2 text-sm ${viewMode === 'kanban' ? 'bg-purple-500 text-white' : 'text-gray-600'}`}
              >
                <Kanban className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-2 text-sm ${viewMode === 'calendar' ? 'bg-purple-500 text-white' : 'text-gray-600'}`}
              >
                <CalendarIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      {viewMode === 'list' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedTasks.length === sortedTasks.length && sortedTasks.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Công việc
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dự án
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deadline
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Độ ưu tiên
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tiến độ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedTasks.map((task) => {
                    const statusInfo = getStatusInfo(task.status)
                    const StatusIcon = statusInfo.icon
                    const priorityInfo = getPriorityInfo(task.priority)
                    const completionPercentage = getCompletionPercentage(task.subtasks)
                    const daysRemaining = getDaysRemaining(task.deadline)
                    
                    return (
                      <tr key={task.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedTasks.includes(task.id)}
                            onChange={() => handleSelectTask(task.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {task.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {task.description.length > 50 
                                ? `${task.description.substring(0, 50)}...` 
                                : task.description}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">{task.department}</span>
                              {task.tags.slice(0, 2).map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {task.project && (
                            <Badge className={`bg-${task.project.color}-100 text-${task.project.color}-800`}>
                              {task.project.name}
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(task.deadline)}
                          </div>
                          <div className={`text-sm ${daysRemaining < 0 ? 'text-red-600' : daysRemaining <= 3 ? 'text-orange-600' : 'text-gray-500'}`}>
                            {daysRemaining < 0 ? `${Math.abs(daysRemaining)} ngày quá hạn` :
                             daysRemaining === 0 ? 'Hôm nay' :
                             `${daysRemaining} ngày còn lại`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={`bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={`bg-${priorityInfo.color}-100 text-${priorityInfo.color}-800`}>
                            {priorityInfo.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${completionPercentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-500">{completionPercentage}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
                            </Button>
                            {task.status !== 'completed' && (
                              <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700">
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedTasks.map((task) => {
            const statusInfo = getStatusInfo(task.status)
            const StatusIcon = statusInfo.icon
            const priorityInfo = getPriorityInfo(task.priority)
            const completionPercentage = getCompletionPercentage(task.subtasks)
            const daysRemaining = getDaysRemaining(task.deadline)
            
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedTasks.includes(task.id)}
                          onChange={() => handleSelectTask(task.id)}
                          className="rounded border-gray-300">
                        />
                        <div>
                          <CardTitle className="text-lg">{task.title}</CardTitle>
                          <CardDescription className="text-sm text-gray-500">
                            {task.department}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge className={`bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                        <Badge className={`bg-${priorityInfo.color}-100 text-${priorityInfo.color}-800`}>
                          {priorityInfo.label}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">{task.description}</p>
                    
                    {task.project && (
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 bg-${task.project.color}-500 rounded-full`}></div>
                        <span className="text-sm font-medium">{task.project.name}</span>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Deadline:</span>
                        <span className={`font-medium ${daysRemaining < 0 ? 'text-red-600' : daysRemaining <= 3 ? 'text-orange-600' : 'text-gray-900'}`}>
                          {formatDate(task.deadline)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Tiến độ:</span>
                        <span className="font-medium">{completionPercentage}%</span>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"> 
                        style={{ width: `${completionPercentage}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4 text-gray-400" />
                          <span>{task.comments}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Paperclip className="w-4 h-4 text-gray-400" />
                          <span>{task.attachments}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>{task.followers.length}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="w-4 h-4 mr-1" />
                        Xem
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Edit className="w-4 h-4 mr-1" />
                        Sửa
                      </Button>
                      {task.status !== 'completed' && (
                        <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700">
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {sortedTasks.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Bạn chưa có công việc nào
            </h3>
            <p className="text-gray-600 mb-4">
              Hãy liên hệ với quản lý để được giao công việc
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tạo công việc mới
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
