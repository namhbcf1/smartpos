import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, CheckSquare, User, Phone, Mail, MapPin, CreditCard, 
  Clock, AlertCircle, CheckCircle, XCircle, Calendar, Flag, 
  MoreVertical, MessageSquare, Paperclip, Star, TrendingUp,
  DollarSign, ShoppingCart, Building2, Globe, History, Eye, 
  Download, Share2, Edit, Trash2, Plus, Send, FileText, Image,
  Video, Archive, Tag, Users, Target, Timer, Award
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/badge'

interface TaskDetail {
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
    email: string
    phone: string
  }
  creator: {
    id: string
    name: string
    avatar?: string
    email: string
  }
  followers: {
    id: string
    name: string
    avatar?: string
    email: string
  }[]
  project?: {
    id: string
    name: string
    color: string
    description: string
  }
  department: string
  deadline: string
  createdAt: string
  updatedAt: string
  completedAt?: string
  estimatedHours: number
  actualHours?: number
  tags: string[]
  attachments: {
    id: string
    name: string
    type: 'image' | 'document' | 'video' | 'other'
    size: number
    url: string
    uploadedBy: string
    uploadedAt: string
  }[]
  comments: {
    id: string
    content: string
    author: {
      id: string
      name: string
      avatar?: string
    }
    createdAt: string
    isEdited: boolean
    replies?: {
      id: string
      content: string
      author: {
        id: string
        name: string
        avatar?: string
      }
      createdAt: string
    }[]
  }[]
  subtasks: {
    id: string
    title: string
    description?: string
    completed: boolean
    assignee?: {
      id: string
      name: string
    }
    deadline?: string
    createdAt: string
  }[]
  history: {
    id: string
    action: string
    description: string
    timestamp: string
    user: {
      id: string
      name: string
      avatar?: string
    }
    changes?: {
      field: string
      oldValue: string
      newValue: string
    }[]
  }[]
  relatedTasks: {
    id: string
    title: string
    status: string
    type: 'blocked_by' | 'blocks' | 'related'
  }[]
  timeTracking: {
    totalLogged: number
    entries: {
      id: string
      description: string
      duration: number
      date: string
      user: {
        id: string
        name: string
      }
    }[]
  }
}

const mockTaskDetail: TaskDetail = {
  id: '1',
  title: 'Thiết kế giao diện trang chủ mới',
  description: 'Tạo giao diện trang chủ hiện đại và responsive cho website. Cần đảm bảo tương thích với tất cả các thiết bị và trình duyệt phổ biến. Giao diện phải thân thiện với người dùng và tải nhanh.',
  status: 'in_progress',
  priority: 'high',
  assignee: {
    id: '1',
    name: 'Nguyễn Văn A',
    department: 'Design',
    email: 'nguyenvana@company.com',
    phone: '0123456789'
  },
  creator: {
    id: '2',
    name: 'Trần Thị B',
    email: 'tranthib@company.com'
  },
  followers: [
    { id: '3', name: 'Lê Văn C', email: 'levanc@company.com' },
    { id: '4', name: 'Phạm Thị D', email: 'phamthid@company.com' }
  ],
  project: {
    id: '1',
    name: 'Website Redesign',
    color: 'blue',
    description: 'Dự án nâng cấp toàn bộ website công ty'
  },
  department: 'Design',
  deadline: '2024-01-30',
  createdAt: '2024-01-15',
  updatedAt: '2024-01-22',
  estimatedHours: 40,
  actualHours: 25,
  tags: ['UI/UX', 'Frontend', 'Responsive', 'Website'],
  attachments: [
    {
      id: '1',
      name: 'wireframe-homepage.fig',
      type: 'document',
      size: 2048000,
      url: '/attachments/wireframe-homepage.fig',
      uploadedBy: 'Nguyễn Văn A',
      uploadedAt: '2024-01-16'
    },
    {
      id: '2',
      name: 'mockup-design.png',
      type: 'image',
      size: 1024000,
      url: '/attachments/mockup-design.png',
      uploadedBy: 'Nguyễn Văn A',
      uploadedAt: '2024-01-18'
    },
    {
      id: '3',
      name: 'requirements.pdf',
      type: 'document',
      size: 512000,
      url: '/attachments/requirements.pdf',
      uploadedBy: 'Trần Thị B',
      uploadedAt: '2024-01-15'
    }
  ],
  comments: [
    {
      id: '1',
      content: 'Tôi đã hoàn thành wireframe cho trang chủ. Các bạn có thể xem và cho ý kiến.',
      author: {
        id: '1',
        name: 'Nguyễn Văn A'
      },
      createdAt: '2024-01-16 10:30',
      isEdited: false
    },
    {
      id: '2',
      content: 'Wireframe nhìn rất tốt! Tôi có một số gợi ý nhỏ về phần navigation.',
      author: {
        id: '3',
        name: 'Lê Văn C'
      },
      createdAt: '2024-01-16 14:20',
      isEdited: false,
      replies: [
        {
          id: '1',
          content: 'Cảm ơn bạn! Tôi sẽ xem xét và cập nhật.',
          author: {
            id: '1',
            name: 'Nguyễn Văn A'
          },
          createdAt: '2024-01-16 15:45'
        }
      ]
    },
    {
      id: '3',
      content: 'Khi nào có thể hoàn thành mockup design?',
      author: {
        id: '4',
        name: 'Phạm Thị D'
      },
      createdAt: '2024-01-20 09:15',
      isEdited: false
    }
  ],
  subtasks: [
    {
      id: '1',
      title: 'Wireframe trang chủ',
      description: 'Tạo wireframe cơ bản cho trang chủ',
      completed: true,
      assignee: { id: '1', name: 'Nguyễn Văn A' },
      deadline: '2024-01-18',
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      title: 'Thiết kế mockup',
      description: 'Tạo mockup chi tiết với màu sắc và typography',
      completed: true,
      assignee: { id: '1', name: 'Nguyễn Văn A' },
      deadline: '2024-01-22',
      createdAt: '2024-01-15'
    },
    {
      id: '3',
      title: 'Code HTML/CSS',
      description: 'Chuyển đổi design thành code HTML/CSS responsive',
      completed: false,
      assignee: { id: '1', name: 'Nguyễn Văn A' },
      deadline: '2024-01-28',
      createdAt: '2024-01-15'
    },
    {
      id: '4',
      title: 'Test responsive',
      description: 'Kiểm tra và tối ưu trên các thiết bị khác nhau',
      completed: false,
      assignee: { id: '1', name: 'Nguyễn Văn A' },
      deadline: '2024-01-30',
      createdAt: '2024-01-15'
    }
  ],
  history: [
    {
      id: '1',
      action: 'Tạo công việc',
      description: 'Công việc được tạo bởi Trần Thị B',
      timestamp: '2024-01-15 09:00',
      user: { id: '2', name: 'Trần Thị B' }
    },
    {
      id: '2',
      action: 'Giao việc',
      description: 'Công việc được giao cho Nguyễn Văn A',
      timestamp: '2024-01-15 09:15',
      user: { id: '2', name: 'Trần Thị B' },
      changes: [
        { field: 'assignee', oldValue: '', newValue: 'Nguyễn Văn A' }
      ]
    },
    {
      id: '3',
      action: 'Thay đổi trạng thái',
      description: 'Trạng thái thay đổi từ "Chờ xử lý" thành "Đang làm"',
      timestamp: '2024-01-16 08:30',
      user: { id: '1', name: 'Nguyễn Văn A' },
      changes: [
        { field: 'status', oldValue: 'todo', newValue: 'in_progress' }
      ]
    },
    {
      id: '4',
      action: 'Cập nhật tiến độ',
      description: 'Hoàn thành subtask "Wireframe trang chủ"',
      timestamp: '2024-01-18 16:45',
      user: { id: '1', name: 'Nguyễn Văn A' }
    }
  ],
  relatedTasks: [
    {
      id: '5',
      title: 'Tối ưu hóa tốc độ tải trang',
      status: 'todo',
      type: 'blocks'
    },
    {
      id: '6',
      title: 'Thiết kế trang sản phẩm',
      status: 'in_progress',
      type: 'related'
    }
  ],
  timeTracking: {
    totalLogged: 25,
    entries: [
      {
        id: '1',
        description: 'Tạo wireframe trang chủ',
        duration: 8,
        date: '2024-01-16',
        user: { id: '1', name: 'Nguyễn Văn A' }
      },
      {
        id: '2',
        description: 'Thiết kế mockup và chỉnh sửa',
        duration: 12,
        date: '2024-01-18',
        user: { id: '1', name: 'Nguyễn Văn A' }
      },
      {
        id: '3',
        description: 'Review và feedback',
        duration: 5,
        date: '2024-01-20',
        user: { id: '1', name: 'Nguyễn Văn A' }
      }
    ]
  }
}

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

export const TaskDetail: React.FC = () => {
  const [task] = useState<TaskDetail>(mockTaskDetail)
  const [activeTab, setActiveTab] = useState<'overview' | 'subtasks' | 'comments' | 'attachments' | 'history' | 'time'>('overview')
  const [newComment, setNewComment] = useState('')
  const [newSubtask, setNewSubtask] = useState('')

  const getStatusInfo = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.todo
  }

  const getPriorityInfo = (priority: string) => {
    return priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.low
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="w-4 h-4" />
      case 'video': return <Video className="w-4 h-4" />
      case 'document': return <FileText className="w-4 h-4" />
      default: return <Paperclip className="w-4 h-4" />
    }
  }

  const getCompletionPercentage = () => {
    if (task.subtasks.length === 0) return 0
    const completed = task.subtasks.filter(st => st.completed).length
    return Math.round((completed / task.subtasks.length) * 100)
  }

  const getDaysRemaining = () => {
    const today = new Date()
    const deadlineDate = new Date(task.deadline)
    const diffTime = deadlineDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <CheckSquare className="w-8 h-8 text-blue-600" />
              {task.title}
            </h1>
            <p className="text-gray-600 mt-2">
              Chi tiết công việc và thông tin liên quan
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Share2 className="w-4 h-4 mr-2" />
            Chia sẻ
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Xuất PDF
          </Button>
          <Button>
            <Edit className="w-4 h-4 mr-2" />
            Chỉnh sửa
          </Button>
        </div>
      </div>

      {/* Task Status */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {(() => {
                const statusInfo = getStatusInfo(task.status)
                const StatusIcon = statusInfo.icon
                return (
                  <Badge className={`bg-${statusInfo.color}-100 text-${statusInfo.color}-800 text-lg px-4 py-2`}>
                    <StatusIcon className="w-5 h-5 mr-2" />
                    {statusInfo.label}
                  </Badge>
                )
              })()}
              <div>
                <p className="text-sm text-gray-500">Độ ưu tiên</p>
                {(() => {
                  const priorityInfo = getPriorityInfo(task.priority)
                  return (
                    <Badge className={`bg-${priorityInfo.color}-100 text-${priorityInfo.color}-800`}>
                      {priorityInfo.label}
                    </Badge>
                  )
                })()}
              </div>
              <div>
                <p className="text-sm text-gray-500">Deadline</p>
                <p className="font-medium">{formatDate(task.deadline)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {getCompletionPercentage()}%
              </p>
              <p className="text-sm text-gray-500">Tiến độ hoàn thành</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Tổng quan', icon: Eye },
          { id: 'subtasks', label: 'Công việc con', icon: CheckSquare },
          { id: 'comments', label: 'Bình luận', icon: MessageSquare },
          { id: 'attachments', label: 'Tệp đính kèm', icon: Paperclip },
          { id: 'history', label: 'Lịch sử', icon: History },
          { id: 'time', label: 'Thời gian', icon: Timer }
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Task Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5" />
                Thông tin công việc
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-2">Mô tả</p>
                <p className="text-gray-900">{task?.description || 'Không có mô tả'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Dự án</p>
                  {task.project && (
                    <Badge className={`bg-${task.project.color}-100 text-${task.project.color}-800`}>
                      {task.project.name}
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phòng ban</p>
                  <p className="font-medium">{task.department}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Giờ ước tính</p>
                  <p className="font-medium">{task.estimatedHours}h</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Giờ thực tế</p>
                  <p className="font-medium">{task.actualHours || 0}h</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignee Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Người phụ trách
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">{task.assignee.name}</p>
                  <p className="text-sm text-gray-500">{task.assignee.department}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{task.assignee.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{task.assignee.phone}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Followers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Người theo dõi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {task.followers.map((follower) => (
                  <div key={follower.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{follower.name}</p>
                      <p className="text-xs text-gray-500">{follower.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Related Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Công việc liên quan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {task.relatedTasks.map((relatedTask) => (
                  <div key={relatedTask.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{relatedTask.title}</p>
                      <p className="text-xs text-gray-500">
                        {relatedTask.type === 'blocks' ? 'Chặn bởi' :
                         relatedTask.type === 'blocked_by' ? 'Chặn' : 'Liên quan'}
                      </p>
                    </div>
                    <Badge variant="outline">{relatedTask.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'subtasks' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5" />
              Công việc con
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {task.subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium">{subtask.title}</h4>
                    {subtask.description && (
                      <p className="text-sm text-gray-500">{subtask.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      {subtask.assignee && (
                        <span>Giao cho: {subtask.assignee.name}</span>
                      )}
                      {subtask.deadline && (
                        <span>Deadline: {formatDate(subtask.deadline)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {/* Add new subtask */}
              <div className="flex gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                <Input
                  placeholder="Thêm công việc con mới..."
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                />
                <Button>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'comments' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Bình luận
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {task.comments.map((comment) => (
                <div key={comment.id} className="border-b pb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{comment.author.name}</span>
                        <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                        {comment.isEdited && (
                          <Badge variant="outline" className="text-xs">Đã chỉnh sửa</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-700">
                      
                      {/* Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-3 ml-4 space-y-2">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex items-start gap-2">
                              <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                                <User className="w-3 h-3 text-gray-600" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-xs">{reply.author.name}</span>
                                  <span className="text-xs text-gray-500">{formatDate(reply.createdAt)}</span>
                                </div>
                                <p className="text-xs text-gray-600">
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Add new comment */}
              <div className="flex gap-2">
                <Input
                  placeholder="Thêm bình luận..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <Button>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'attachments' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Paperclip className="w-5 h-5" />
              Tệp đính kèm
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {task.attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    {getFileIcon(attachment.type)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{attachment.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(attachment.size)} • {attachment.uploadedBy} • {formatDate(attachment.uploadedAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {/* Upload new attachment */}
              <div className="flex gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                <Button variant="outline" className="flex-1">
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm tệp đính kèm
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Lịch sử hoạt động
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {task.history.map((item, index) => (
                <div key={item.id} className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{item.action}</h4>
                      <span className="text-sm text-gray-500">{formatDate(item.timestamp)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    <p className="text-xs text-gray-500 mt-1">Bởi: {item.user.name}</p>
                    
                    {/* Changes */}
                    {item.changes && item.changes.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {item.changes.map((change, changeIndex) => (
                          <div key={changeIndex} className="text-xs text-gray-500">
                            <span className="font-medium">{change.field}:</span> 
                            <span className="text-red-600 line-through ml-1">{change.oldValue}</span>
                            <span className="text-green-600 ml-1">→ {change.newValue}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'time' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="w-5 h-5" />
              Theo dõi thời gian
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{task.timeTracking.totalLogged}h</p>
                  <p className="text-sm text-gray-500">Tổng thời gian</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{task.estimatedHours}h</p>
                  <p className="text-sm text-gray-500">Ước tính</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">
                    {Math.round((task.timeTracking.totalLogged / task.estimatedHours) * 100)}%
                  </p>
                  <p className="text-sm text-gray-500">Hoàn thành</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Lịch sử thời gian</h4>
                {task.timeTracking.entries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{entry.description}</p>
                      <p className="text-xs text-gray-500">
                        {entry.user.name} • {formatDate(entry.date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{entry.duration}h</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Thêm thời gian làm việc
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
