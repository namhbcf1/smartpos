import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, Search, Filter, Download, Eye, Edit, 
  Clock, AlertCircle, CheckCircle, XCircle, User, Users, Calendar,
  MoreVertical, MessageSquare, Paperclip,
  Kanban
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Card, CardContent } from '../../components/ui/Card'
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
}

const mockTasks: Task[] = [
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
    daysRemaining: 8
  },
  {
    id: '2',
    title: 'Xử lý khiếu nại khách hàng #12345',
    description: 'Khách hàng phản ánh sản phẩm bị lỗi, cần xử lý và hoàn tiền',
    status: 'todo',
    priority: 'urgent',
    assignee: {
      id: '5',
      name: 'Hoàng Văn E',
      department: 'Customer Service'
    },
    creator: {
      id: '6',
      name: 'Vũ Thị F'
    },
    followers: [
      { id: '7', name: 'Đặng Văn G' }
    ],
    department: 'Customer Service',
    deadline: '2024-01-25',
    createdAt: '2024-01-22',
    updatedAt: '2024-01-22',
    estimatedHours: 4,
    tags: ['Customer Service', 'Refund', 'Urgent'],
    attachments: 2,
    comments: 3,
    subtasks: [
      { id: '5', title: 'Liên hệ khách hàng', completed: false },
      { id: '6', title: 'Xác nhận lỗi sản phẩm', completed: false },
      { id: '7', title: 'Xử lý hoàn tiền', completed: false }
    ],
    isOverdue: false,
    daysRemaining: 3
  },
  {
    id: '3',
    title: 'Cập nhật hệ thống báo cáo',
    description: 'Nâng cấp module báo cáo với các tính năng mới',
    status: 'completed',
    priority: 'medium',
    assignee: {
      id: '8',
      name: 'Bùi Văn H',
      department: 'IT'
    },
    creator: {
      id: '9',
      name: 'Ngô Thị I'
    },
    followers: [
      { id: '10', name: 'Lý Văn J' }
    ],
    project: {
      id: '2',
      name: 'System Upgrade',
      color: 'green'
    },
    department: 'IT',
    deadline: '2024-01-20',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-20',
    completedAt: '2024-01-20',
    estimatedHours: 20,
    actualHours: 18,
    tags: ['Backend', 'Database', 'Reports'],
    attachments: 5,
    comments: 12,
    subtasks: [
      { id: '8', title: 'Phân tích yêu cầu', completed: true },
      { id: '9', title: 'Thiết kế database', completed: true },
      { id: '10', title: 'Code backend', completed: true },
      { id: '11', title: 'Test và deploy', completed: true }
    ],
    isOverdue: false,
    daysRemaining: 0
  },
  {
    id: '4',
    title: 'Kiểm kê kho hàng tháng 1',
    description: 'Thực hiện kiểm kê tồn kho toàn bộ sản phẩm',
    status: 'overdue',
    priority: 'high',
    assignee: {
      id: '11',
      name: 'Trịnh Văn K',
      department: 'Warehouse'
    },
    creator: {
      id: '12',
      name: 'Đinh Thị L'
    },
    followers: [
      { id: '13', name: 'Phan Văn M' },
      { id: '14', name: 'Võ Thị N' }
    ],
    department: 'Warehouse',
    deadline: '2024-01-15',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-22',
    estimatedHours: 16,
    actualHours: 12,
    tags: ['Inventory', 'Warehouse', 'Monthly'],
    attachments: 1,
    comments: 5,
    subtasks: [
      { id: '12', title: 'Chuẩn bị danh sách sản phẩm', completed: true },
      { id: '13', title: 'Kiểm kê khu vực A', completed: true },
      { id: '14', title: 'Kiểm kê khu vực B', completed: false },
      { id: '15', title: 'Tổng hợp báo cáo', completed: false }
    ],
    isOverdue: true,
    daysRemaining: -7
  },
  {
    id: '5',
    title: 'Tạo nội dung marketing cho sản phẩm mới',
    description: 'Viết bài quảng cáo và thiết kế banner cho sản phẩm mới',
    status: 'todo',
    priority: 'medium',
    assignee: {
      id: '15',
      name: 'Nguyễn Thị O',
      department: 'Marketing'
    },
    creator: {
      id: '16',
      name: 'Trần Văn P'
    },
    followers: [
      { id: '17', name: 'Lê Thị Q' }
    ],
    project: {
      id: '3',
      name: 'Product Launch',
      color: 'purple'
    },
    department: 'Marketing',
    deadline: '2024-02-05',
    createdAt: '2024-01-20',
    updatedAt: '2024-01-22',
    estimatedHours: 12,
    tags: ['Marketing', 'Content', 'Design'],
    attachments: 0,
    comments: 2,
    subtasks: [
      { id: '16', title: 'Nghiên cứu đối thủ', completed: false },
      { id: '17', title: 'Viết nội dung', completed: false },
      { id: '18', title: 'Thiết kế banner', completed: false }
    ],
    isOverdue: false,
    daysRemaining: 14
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

export const TasksKanban: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(mockTasks)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAssignee, setSelectedAssignee] = useState('all')
  const [selectedProject, setSelectedProject] = useState('all')
  const [selectedPriority, setSelectedPriority] = useState('all')

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.assignee.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesAssignee = selectedAssignee === 'all' || task.assignee.id === selectedAssignee
    const matchesProject = selectedProject === 'all' || task.project?.id === selectedProject
    const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority
    return matchesSearch && matchesAssignee && matchesProject && matchesPriority
  })

  const tasksByStatus = {
    todo: filteredTasks.filter(t => t.status === 'todo'),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    completed: filteredTasks.filter(t => t.status === 'completed'),
    overdue: filteredTasks.filter(t => t.status === 'overdue')
  }

  const stats = {
    total: tasks.length,
    todo: tasksByStatus.todo.length,
    inProgress: tasksByStatus.in_progress.length,
    completed: tasksByStatus.completed.length,
    overdue: tasksByStatus.overdue.length
  }

  const getStatusInfo = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.todo
  }

  const getPriorityInfo = (priority: string) => {
    return priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.low
  }

  const handleStatusChange = (taskId: string, newStatus: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: newStatus as Task['status'], updatedAt: new Date().toISOString() }
        : task
    ))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit'
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

  const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
    const priorityInfo = getPriorityInfo(task.priority)
    const completionPercentage = getCompletionPercentage(task.subtasks)
    const daysRemaining = getDaysRemaining(task.deadline)
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.2 }}
        className="bg-white  rounded-lg shadow-sm border border-gray-200 p-4 mb-3 cursor-move hover:shadow-md transition-shadow"
        draggable
        onDragStart={(e) => {
          (e as any).dataTransfer.setData('text/plain', task.id)
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 text-sm mb-1">
              {task.title}
            </h4>
            <p className="text-xs text-gray-500 mb-2">
              {task.description.length > 60 
                ? `${task.description.substring(0, 60)}...` 
                : task.description}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Badge className={`bg-${priorityInfo.color}-100 text-${priorityInfo.color}-800 text-xs`}>
              {priorityInfo.label}
            </Badge>
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        {task.project && (
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-2 h-2 bg-${task.project.color}-500 rounded-full`}></div>
            <span className="text-xs text-gray-600">{task.project.name}</span>
          </div>
        )}

        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-3 h-3 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-900">{task.assignee.name}</p>
            <p className="text-xs text-gray-500">{task.assignee.department}</p>
          </div>
        </div>

        {task.subtasks.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Tiến độ</span>
              <span>{completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-blue-600 h-1.5 rounded-full"
                  style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(task.deadline)}</span>
            </div>
            <div className={`flex items-center gap-1 ${daysRemaining < 0 ? 'text-red-600' : daysRemaining <= 3 ? 'text-orange-600' : ''}`}>
              {daysRemaining < 0 ? `${Math.abs(daysRemaining)}d quá hạn` :
               daysRemaining === 0 ? 'Hôm nay' :
               `${daysRemaining}d`}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3 text-gray-400" />
              <span className="text-xs">{task.comments}</span>
            </div>
            <div className="flex items-center gap-1">
              <Paperclip className="w-3 h-3 text-gray-400" />
              <span className="text-xs">{task.attachments}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-gray-400" />
              <span className="text-xs">{task.followers.length}</span>
            </div>
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
              <Eye className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
              <Edit className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </motion.div>
    )
  }

  const StatusColumn: React.FC<{ status: string; tasks: Task[] }> = ({ status, tasks }) => {
    const statusInfo = getStatusInfo(status)
    const StatusIcon = statusInfo.icon
    
    return (
      <div className="flex-1 min-w-0">
        <div className="bg-gray-50 rounded-lg p-4 h-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <StatusIcon className={`w-4 h-4 text-${statusInfo.color}-600`} />
              <h3 className="font-medium text-gray-900">{statusInfo.label}</h3>
              <Badge className={`bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}>
                {tasks.length}
              </Badge>
            </div>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          <div 
            className="space-y-3 min-h-[400px]"
                  onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const taskId = e.dataTransfer.getData('text/plain')
              handleStatusChange(taskId, status)
            }}
          >
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
            
            {tasks.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <StatusIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Không có công việc nào</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Kanban className="w-8 h-8 text-blue-600" />
            Kanban Board
          </h1>
          <p className="text-gray-600 mt-2">
            Quản lý công việc theo dạng bảng Kanban với drag & drop
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
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
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Tìm kiếm công việc..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả người phụ trách</option>
                <option value="1">Nguyễn Văn A</option>
                <option value="5">Hoàng Văn E</option>
                <option value="8">Bùi Văn H</option>
                <option value="11">Trịnh Văn K</option>
                <option value="15">Nguyễn Thị O</option>
              </select>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả dự án</option>
                <option value="1">Website Redesign</option>
                <option value="2">System Upgrade</option>
                <option value="3">Product Launch</option>
              </select>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả độ ưu tiên</option>
                {Object.entries(priorityConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Bộ lọc
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <div className="flex gap-6 overflow-x-auto pb-4">
        <StatusColumn status="todo" tasks={tasksByStatus.todo} />
        <StatusColumn status="in_progress" tasks={tasksByStatus.in_progress} />
        <StatusColumn status="completed" tasks={tasksByStatus.completed} />
        <StatusColumn status="overdue" tasks={tasksByStatus.overdue} />
      </div>
    </div>
  )
}
