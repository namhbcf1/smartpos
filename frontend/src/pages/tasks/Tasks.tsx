import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  CheckSquare, Plus, Search, Filter, Calendar, Clock, User, 
  AlertCircle, CheckCircle, Edit, Trash2, Eye, MessageSquare, Paperclip
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'

interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  assignee: string
  dueDate: string
  tags: string[]
  comments: number
}

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Cập nhật giao diện trang khách hàng',
    description: 'Thiết kế lại giao diện trang quản lý khách hàng với Material Design 3',
    status: 'in_progress',
    priority: 'high',
    assignee: 'Nguyễn Văn A',
    dueDate: '2024-01-25',
    tags: ['UI/UX', 'Frontend', 'React'],
    comments: 5
  },
  {
    id: '2',
    title: 'Tối ưu hóa hiệu suất database',
    description: 'Phân tích và tối ưu hóa các truy vấn database để cải thiện tốc độ',
    status: 'todo',
    priority: 'medium',
    assignee: 'Trần Thị B',
    dueDate: '2024-01-30',
    tags: ['Backend', 'Database'],
    comments: 2
  },
  {
    id: '3',
    title: 'Tạo báo cáo doanh thu tháng 1',
    description: 'Tổng hợp và phân tích dữ liệu doanh thu tháng 1/2024',
    status: 'completed',
    priority: 'high',
    assignee: 'Lê Văn C',
    dueDate: '2024-01-23',
    tags: ['Report', 'Finance'],
    comments: 8
  }
]

export const Tasks: React.FC = () => {
  const [tasks] = useState<Task[]>(mockTasks)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || task.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    const colors = {
      todo: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800'
    }
    return colors[status as keyof typeof colors] || colors.todo
  }

  const getStatusText = (status: string) => {
    const texts = {
      todo: 'Cần làm',
      in_progress: 'Đang làm',
      completed: 'Hoàn thành'
    }
    return texts[status as keyof typeof texts] || texts.todo
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CheckSquare className="w-8 h-8 text-amber-600" />
            Quản lý công việc
          </h1>
          <p className="text-gray-600 mt-2">
            Theo dõi và quản lý tất cả các công việc, dự án và nhiệm vụ
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Tạo công việc
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <p className="text-2xl font-bold text-gray-600">{tasks.filter(t => t.status === 'todo').length}</p>
              <p className="text-xs text-gray-500">Cần làm</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{tasks.filter(t => t.status === 'in_progress').length}</p>
              <p className="text-xs text-gray-500">Đang làm</p>
          </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{tasks.filter(t => t.status === 'completed').length}</p>
              <p className="text-xs text-gray-500">Hoàn thành</p>
        </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
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
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500">
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="todo">Cần làm</option>
                <option value="in_progress">Đang làm</option>
                <option value="completed">Hoàn thành</option>
              </select>
          </div>
        </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTasks.map((task) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{task.title}</CardTitle>
                    <Badge className={getStatusColor(task.status)}>
                      {getStatusText(task.status)}
                    </Badge>
                        </div>
                      </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  {task.description}
                </p>

                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>{task.assignee}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Hạn: {new Date(task.dueDate).toLocaleDateString('vi-VN')}</span>
                    </div>

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    <span>{task.comments}</span>
              </div>
            </div>

                <div className="flex flex-wrap gap-1">
                  {task.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
          ))}
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
                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                    </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
              </div>

      {filteredTasks.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Không tìm thấy công việc nào
            </h3>
            <p className="text-gray-600 mb-4">
              Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tạo công việc đầu tiên
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
