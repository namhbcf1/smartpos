import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings as SettingsIcon, User, Shield, Bell, Palette, Database, 
  Globe, CreditCard, Users, Key, Save, RefreshCw, Eye, EyeOff,
  Upload, Download, Trash2, Plus, Edit, Check, X
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'

interface SettingSection {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
}

const settingSections: SettingSection[] = [
  {
    id: 'profile',
    title: 'Thông tin cá nhân',
    description: 'Quản lý thông tin tài khoản và hồ sơ cá nhân',
    icon: <User className="w-5 h-5" />,
    color: 'blue'
  },
  {
    id: 'security',
    title: 'Bảo mật',
    description: 'Mật khẩu, xác thực 2FA và quyền truy cập',
    icon: <Shield className="w-5 h-5" />,
    color: 'red'
  },
  {
    id: 'notifications',
    title: 'Thông báo',
    description: 'Cài đặt thông báo email, SMS và push',
    icon: <Bell className="w-5 h-5" />,
    color: 'yellow'
  },
  {
    id: 'appearance',
    title: 'Giao diện',
    description: 'Chủ đề, ngôn ngữ và tùy chỉnh giao diện',
    icon: <Palette className="w-5 h-5" />,
    color: 'purple'
  },
  {
    id: 'system',
    title: 'Hệ thống',
    description: 'Cấu hình database, backup và bảo trì',
    icon: <Database className="w-5 h-5" />,
    color: 'green'
  },
  {
    id: 'integrations',
    title: 'Tích hợp',
    description: 'API, webhook và kết nối dịch vụ bên thứ 3',
    icon: <Globe className="w-5 h-5" />,
    color: 'indigo'
  },
  {
    id: 'billing',
    title: 'Thanh toán',
    description: 'Gói dịch vụ, hóa đơn và phương thức thanh toán',
    icon: <CreditCard className="w-5 h-5" />,
    color: 'orange'
  },
  {
    id: 'users',
    title: 'Người dùng',
    description: 'Quản lý người dùng, vai trò và quyền hạn',
    icon: <Users className="w-5 h-5" />,
    color: 'pink'
  }
]


export const Settings: React.FC = () => {
  const [activeSection, setActiveSection] = useState('profile')
  const [showPassword, setShowPassword] = useState(false)
  const [settings, setSettings] = useState({
    profile: {
      name: '',
      email: '',
      phone: '',
      avatar: ''
    },
    security: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      twoFactorEnabled: false
    },
    notifications: {
      email: true,
      sms: false,
      push: true,
      marketing: false
    },
    appearance: {
      theme: 'light',
      language: 'vi',
      timezone: 'Asia/Ho_Chi_Minh'
    }
  })

  const handleSave = () => {
    // Save settings logic
    console.log('Saving settings...', settings)
  }

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'profile':
    return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin cá nhân</CardTitle>
                <CardDescription>Cập nhật thông tin tài khoản của bạn</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-10 h-10 text-gray-400" />
        </div>
                  <div>
                    <Button variant="outline" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Tải ảnh lên
                    </Button>
                    <p className="text-sm text-gray-500 mt-1">JPG, PNG tối đa 2MB</p>
        </div>
      </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                    <label className="block text-sm font-medium mb-2">Họ và tên</label>
                    <Input 
                      value={settings.profile.name}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        profile: { ...prev.profile, name: e.target.value }
                      }))}
              />
            </div>
            <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <Input 
                type="email"
                      value={settings.profile.email}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        profile: { ...prev.profile, email: e.target.value }
                      }))}
              />
            </div>
            <div>
                    <label className="block text-sm font-medium mb-2">Số điện thoại</label>
                    <Input 
                      value={settings.profile.phone}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        profile: { ...prev.profile, phone: e.target.value }
                      }))}
              />
            </div>
          </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'security':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Đổi mật khẩu</CardTitle>
                <CardDescription>Thay đổi mật khẩu để bảo mật tài khoản</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
            <div>
                  <label className="block text-sm font-medium mb-2">Mật khẩu hiện tại</label>
                  <div className="relative">
                    <Input 
                      type={showPassword ? 'text' : 'password'}
                      value={settings.security.currentPassword}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        security: { ...prev.security, currentPassword: e.target.value }
                      }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
          </div>
        </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Mật khẩu mới</label>
                  <Input 
                    type="password"
                    value={settings.security.newPassword}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      security: { ...prev.security, newPassword: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Xác nhận mật khẩu mới</label>
                  <Input 
                    type="password"
                    value={settings.security.confirmPassword}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      security: { ...prev.security, confirmPassword: e.target.value }
                    }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Xác thực 2 yếu tố</CardTitle>
                <CardDescription>Bảo mật tài khoản với xác thực 2 yếu tố</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Xác thực 2 yếu tố</p>
                    <p className="text-sm text-gray-500">Yêu cầu mã xác thực khi đăng nhập</p>
              </div>
                  <Button 
                    variant={settings.security.twoFactorEnabled ? "default" : "outline"}
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      security: { ...prev.security, twoFactorEnabled: !prev.security.twoFactorEnabled }
                    }))}
                  >
                    {settings.security.twoFactorEnabled ? 'Bật' : 'Tắt'}
                  </Button>
          </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'notifications':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cài đặt thông báo</CardTitle>
                <CardDescription>Chọn loại thông báo bạn muốn nhận</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(settings.notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium capitalize">{key}</p>
                      <p className="text-sm text-gray-500">
                        {key === 'email' && 'Nhận thông báo qua email'}
                        {key === 'sms' && 'Nhận thông báo qua SMS'}
                        {key === 'push' && 'Nhận thông báo push'}
                        {key === 'marketing' && 'Nhận thông báo marketing'}
                      </p>
                    </div>
                    <Button 
                      variant={value ? "default" : "outline"}
                      onClick={() => setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, [key]: !value }
                      }))}
                    >
                      {value ? 'Bật' : 'Tắt'}
                    </Button>
                      </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )

      case 'appearance':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Giao diện</CardTitle>
                <CardDescription>Tùy chỉnh giao diện và ngôn ngữ</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
            <div>
                  <label className="block text-sm font-medium mb-2">Chủ đề</label>
                  <select 
                    value={settings.appearance.theme}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      appearance: { ...prev.appearance, theme: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="light">Sáng</option>
                    <option value="dark">Tối</option>
                    <option value="auto">Tự động</option>
                  </select>
            </div>
            <div>
                  <label className="block text-sm font-medium mb-2">Ngôn ngữ</label>
              <select 
                    value={settings.appearance.language}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      appearance: { ...prev.appearance, language: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">English</option>
              </select>
            </div>
            <div>
                  <label className="block text-sm font-medium mb-2">Múi giờ</label>
                  <select 
                    value={settings.appearance.timezone}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      appearance: { ...prev.appearance, timezone: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh</option>
                    <option value="UTC">UTC</option>
                  </select>
            </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'system':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin hệ thống</CardTitle>
                <CardDescription>Thông tin về phiên bản và trạng thái hệ thống</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Phiên bản</p>
                    <p className="text-lg font-bold text-gray-500">Không có dữ liệu</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Cập nhật cuối</p>
                    <p className="text-lg font-bold text-gray-500">Không có dữ liệu</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Kích thước database</p>
                    <p className="text-lg font-bold text-gray-500">Không có dữ liệu</p>
              </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Uptime</p>
                    <p className="text-lg font-bold text-gray-500">Không có dữ liệu</p>
          </div>
        </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bảo trì hệ thống</CardTitle>
                <CardDescription>Các tác vụ bảo trì và quản lý hệ thống</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Backup dữ liệu
                  </Button>
                  <Button variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Làm mới cache
                  </Button>
                  <Button variant="outline">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Dọn dẹp log
                  </Button>
                </div>
              </CardContent>
            </Card>
              </div>
        )

      default:
        return (
          <div className="text-center py-12">
            <SettingsIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Chọn một mục để cấu hình
            </h3>
            <p className="text-gray-600">
              Chọn một mục từ menu bên trái để bắt đầu cấu hình
            </p>
              </div>
        )
    }
  }
              
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="w-8 h-8 text-slate-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cài đặt hệ thống</h1>
          <p className="text-gray-600">Quản lý cấu hình và tùy chỉnh hệ thống</p>
        </div>
      </div>
            
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Menu */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-0">
              <nav className="space-y-1">
                {settingSections.map((section) => {
                  const isActive = activeSection === section.id
                  return (
              <button 
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        isActive 
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {section.icon}
            </div>
                      <div>
                        <p className="font-medium">{section.title}</p>
                        <p className="text-xs text-gray-500">{section.description}</p>
          </div>
                    </button>
                  )
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="space-y-6">
            {renderSectionContent()}
            
            {activeSection !== 'system' && (
              <div className="flex justify-end">
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Lưu thay đổi
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
