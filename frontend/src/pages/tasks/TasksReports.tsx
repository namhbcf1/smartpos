import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, Download, Filter, Calendar, TrendingUp, TrendingDown,
  CheckSquare, Users, Clock, AlertCircle, CheckCircle, XCircle,
  FileText, PieChart, LineChart, Activity, Target, Award, Timer,
  User, Building2, Zap, Star, Award as AwardIcon
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/badge'

interface ReportData {
  summary: {
    totalTasks: number
    completedTasks: number
    inProgressTasks: number
    overdueTasks: number
    completionRate: number
    avgCompletionTime: number
    totalHours: number
    productivityScore: number
  }
  tasksByStatus: {
    todo: number
    in_progress: number
    completed: number
    overdue: number
  }
  tasksByPriority: {
    low: number
    medium: number
    high: number
    urgent: number
  }
  tasksByDepartment: {
    [key: string]: {
      total: number
      completed: number
      overdue: number
      avgTime: number
    }
  }
  tasksByAssignee: {
    [key: string]: {
      name: string
      department: string
      total: number
      completed: number
      overdue: number
      avgTime: number
      productivity: number
    }
  }
  dailyStats: {
    date: string
    created: number
    completed: number
    overdue: number
  }[]
  topPerformers: {
    id: string
    name: string
    department: string
    completedTasks: number
    avgCompletionTime: number
    productivityScore: number
  }[]
  projectStats: {
    [key: string]: {
      name: string
      totalTasks: number
      completedTasks: number
      completionRate: number
      avgTime: number
    }
  }
  timeAnalysis: {
    peakHours: number[]
    peakDays: string[]
    avgTaskDuration: number
    totalLoggedHours: number
  }
}

const mockReportData: ReportData = {
  summary: {
    totalTasks: 1250,
    completedTasks: 920,
    inProgressTasks: 156,
    overdueTasks: 51,
    completionRate: 73.6,
    avgCompletionTime: 3.2,
    totalHours: 4200,
    productivityScore: 85.2
  },
  tasksByStatus: {
    todo: 123,
    in_progress: 156,
    completed: 920,
    overdue: 51
  },
  tasksByPriority: {
    low: 320,
    medium: 450,
    high: 380,
    urgent: 100
  },
  tasksByDepartment: {
    'Design': {
      total: 280,
      completed: 210,
      overdue: 15,
      avgTime: 2.8
    },
    'IT': {
      total: 350,
      completed: 280,
      overdue: 20,
      avgTime: 4.2
    },
    'Marketing': {
      total: 200,
      completed: 150,
      overdue: 8,
      avgTime: 2.1
    },
    'Customer Service': {
      total: 180,
      completed: 140,
      overdue: 5,
      avgTime: 1.5
    },
    'Warehouse': {
      total: 240,
      completed: 140,
      overdue: 3,
      avgTime: 3.5
    }
  },
  tasksByAssignee: {
    '1': {
      name: 'Nguyễn Văn A',
      department: 'Design',
      total: 45,
      completed: 38,
      overdue: 2,
      avgTime: 2.5,
      productivity: 92
    },
    '2': {
      name: 'Trần Thị B',
      department: 'IT',
      total: 52,
      completed: 48,
      overdue: 1,
      avgTime: 3.8,
      productivity: 95
    },
    '3': {
      name: 'Lê Văn C',
      department: 'Marketing',
      total: 38,
      completed: 32,
      overdue: 3,
      avgTime: 2.2,
      productivity: 88
    },
    '4': {
      name: 'Phạm Thị D',
      department: 'Customer Service',
      total: 42,
      completed: 40,
      overdue: 0,
      avgTime: 1.3,
      productivity: 98
    },
    '5': {
      name: 'Hoàng Văn E',
      department: 'Warehouse',
      total: 35,
      completed: 28,
      overdue: 2,
      avgTime: 3.2,
      productivity: 85
    }
  },
  dailyStats: [
    { date: '2024-01-15', created: 12, completed: 8, overdue: 2 },
    { date: '2024-01-16', created: 15, completed: 12, overdue: 1 },
    { date: '2024-01-17', created: 8, completed: 6, overdue: 3 },
    { date: '2024-01-18', created: 18, completed: 14, overdue: 1 },
    { date: '2024-01-19', created: 10, completed: 9, overdue: 2 },
    { date: '2024-01-20', created: 14, completed: 11, overdue: 0 },
    { date: '2024-01-21', created: 11, completed: 8, overdue: 1 }
  ],
  topPerformers: [
    {
      id: '4',
      name: 'Phạm Thị D',
      department: 'Customer Service',
      completedTasks: 40,
      avgCompletionTime: 1.3,
      productivityScore: 98
    },
    {
      id: '2',
      name: 'Trần Thị B',
      department: 'IT',
      completedTasks: 48,
      avgCompletionTime: 3.8,
      productivityScore: 95
    },
    {
      id: '1',
      name: 'Nguyễn Văn A',
      department: 'Design',
      completedTasks: 38,
      avgCompletionTime: 2.5,
      productivityScore: 92
    },
    {
      id: '3',
      name: 'Lê Văn C',
      department: 'Marketing',
      completedTasks: 32,
      avgCompletionTime: 2.2,
      productivityScore: 88
    },
    {
      id: '5',
      name: 'Hoàng Văn E',
      department: 'Warehouse',
      completedTasks: 28,
      avgCompletionTime: 3.2,
      productivityScore: 85
    }
  ],
  projectStats: {
    '1': {
      name: 'Website Redesign',
      totalTasks: 45,
      completedTasks: 32,
      completionRate: 71.1,
      avgTime: 3.2
    },
    '2': {
      name: 'System Upgrade',
      totalTasks: 38,
      completedTasks: 28,
      completionRate: 73.7,
      avgTime: 4.1
    },
    '3': {
      name: 'Product Launch',
      totalTasks: 52,
      completedTasks: 35,
      completionRate: 67.3,
      avgTime: 2.8
    },
    '4': {
      name: 'Mobile App',
      totalTasks: 28,
      completedTasks: 18,
      completionRate: 64.3,
      avgTime: 3.5
    }
  },
  timeAnalysis: {
    peakHours: [9, 10, 11, 14, 15, 16],
    peakDays: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5'],
    avgTaskDuration: 3.2,
    totalLoggedHours: 4200
  }
}

const statusConfig = {
  todo: { label: 'Chờ xử lý', color: 'gray' },
  in_progress: { label: 'Đang làm', color: 'blue' },
  completed: { label: 'Hoàn thành', color: 'green' },
  overdue: { label: 'Quá hạn', color: 'red' }
}

const priorityConfig = {
  low: { label: 'Thấp', color: 'gray' },
  medium: { label: 'Trung bình', color: 'blue' },
  high: { label: 'Cao', color: 'orange' },
  urgent: { label: 'Khẩn cấp', color: 'red' }
}

export const TasksReports: React.FC = () => {
  const [reportData] = useState<ReportData>(mockReportData)
  const [selectedPeriod, setSelectedPeriod] = useState('30d')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [selectedReportType, setSelectedReportType] = useState('summary')

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num)
  }

  const getStatusInfo = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.todo
  }

  const getPriorityInfo = (priority: string) => {
    return priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.low
  }

  const getPercentage = (value: number, total: number) => {
    return ((value / total) * 100).toFixed(1)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            Báo cáo công việc
          </h1>
          <p className="text-gray-600 mt-2">
            Phân tích và thống kê chi tiết về hiệu suất công việc
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Xuất Excel
          </Button>
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Xuất PDF
          </Button>
          <Button>
            <BarChart3 className="w-4 h-4 mr-2" />
            Tạo báo cáo tùy chỉnh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex gap-2">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              >
                <option value="7d">7 ngày qua</option>
                <option value="30d">30 ngày qua</option>
                <option value="90d">90 ngày qua</option>
                <option value="1y">1 năm qua</option>
                <option value="custom">Tùy chọn</option>
              </select>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              >
                <option value="all">Tất cả phòng ban</option>
                <option value="Design">Design</option>
                <option value="IT">IT</option>
                <option value="Marketing">Marketing</option>
                <option value="Customer Service">Customer Service</option>
                <option value="Warehouse">Warehouse</option>
              </select>
              <select
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              >
                <option value="summary">Tổng quan</option>
                <option value="detailed">Chi tiết</option>
                <option value="comparison">So sánh</option>
              </select>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Áp dụng bộ lọc
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(reportData.summary.totalTasks)}
              </p>
              <p className="text-xs text-gray-500">Tổng công việc</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-600">+12.5%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {formatNumber(reportData.summary.completedTasks)}
              </p>
              <p className="text-xs text-gray-500">Hoàn thành</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-600">+8.3%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {reportData.summary.completionRate}%
              </p>
              <p className="text-xs text-gray-500">Tỷ lệ hoàn thành</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-600">+3.4%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {reportData.summary.productivityScore}%
              </p>
              <p className="text-xs text-gray-500">Hiệu suất TB</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-600">+2.1%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Công việc theo trạng thái
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(reportData.tasksByStatus).map(([status, count]) => {
                const statusInfo = getStatusInfo(status)
                const percentage = getPercentage(count, reportData.summary.totalTasks)
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full bg-${statusInfo.color}-500`}></div>
                      <span className="text-sm">{statusInfo.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{formatNumber(count)}</span>
                      <span className="text-xs text-gray-500">({percentage}%)</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tasks by Priority */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Công việc theo độ ưu tiên
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(reportData.tasksByPriority).map(([priority, count]) => {
                const priorityInfo = getPriorityInfo(priority)
                const percentage = getPercentage(count, reportData.summary.totalTasks)
                return (
                  <div key={priority} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full bg-${priorityInfo.color}-500`}></div>
                      <span className="text-sm">{priorityInfo.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{formatNumber(count)}</span>
                      <span className="text-xs text-gray-500">({percentage}%)</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Hiệu suất theo phòng ban
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(reportData.tasksByDepartment).map(([department, stats]) => {
              const completionRate = getPercentage(stats.completed, stats.total)
              return (
                <div key={department} className="text-center p-4 border rounded-lg">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-sm font-medium">{department}</p>
                  <p className="text-lg font-bold text-gray-900">
                    {completionRate}%
                  </p>
                  <p className="text-xs text-gray-500">
                    {stats.completed}/{stats.total} hoàn thành
                  </p>
                  <p className="text-xs text-gray-500">
                    TB: {stats.avgTime} ngày
                  </p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AwardIcon className="w-5 h-5" />
            Top nhân viên xuất sắc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reportData.topPerformers.map((performer, index) => (
              <div key={performer.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index === 0 ? 'bg-yellow-100' : 
                    index === 1 ? 'bg-gray-100' : 
                    index === 2 ? 'bg-orange-100' : 'bg-blue-100'
                  }`}>
                    {index === 0 && <AwardIcon className="w-4 h-4 text-yellow-600" />}
                    {index === 1 && <AwardIcon className="w-4 h-4 text-gray-600" />}
                    {index === 2 && <AwardIcon className="w-4 h-4 text-orange-600" />}
                    {index > 2 && <span className="text-sm font-bold text-blue-600">{index + 1}</span>}
                  </div>
                  <div>
                    <p className="font-medium">{performer.name}</p>
                    <p className="text-sm text-gray-500">{performer.department}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{performer.completedTasks} công việc</p>
                  <p className="text-sm text-gray-500">
                    Hiệu suất: {performer.productivityScore}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Project Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Hiệu suất dự án
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(reportData.projectStats).map(([projectId, stats]) => (
              <div key={projectId} className="text-center p-4 border rounded-lg">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-sm font-medium">{stats.name}</p>
                <p className="text-lg font-bold text-gray-900">
                  {stats.completionRate}%
                </p>
                <p className="text-xs text-gray-500">
                  {stats.completedTasks}/{stats.totalTasks} hoàn thành
                </p>
                <p className="text-xs text-gray-500">
                  TB: {stats.avgTime} ngày
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Time Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="w-5 h-5" />
            Phân tích thời gian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium mb-3">Giờ cao điểm</h4>
              <div className="flex flex-wrap gap-2">
                {reportData.timeAnalysis.peakHours.map((hour) => (
                  <Badge key={hour} variant="outline">
                    {hour}:00
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">Ngày trong tuần</h4>
              <div className="flex flex-wrap gap-2">
                {reportData.timeAnalysis.peakDays.map((day) => (
                  <Badge key={day} variant="outline">
                    {day}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">Thống kê thời gian</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Thời gian TB/công việc</span>
                  <span className="text-sm font-medium">{reportData.timeAnalysis.avgTaskDuration} ngày</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Tổng giờ làm việc</span>
                  <span className="text-sm font-medium">{formatNumber(reportData.timeAnalysis.totalLoggedHours)}h</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
