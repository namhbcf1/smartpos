// Warranty & Service Management Hub
// Central hub for all warranty and service related features

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  FileText,
  Building2,
  QrCode,
  Bell,
  ClipboardList,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/ButtonSimplified';

interface ServiceMenuItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  color: string;
  stats?: {
    count: number;
    label: string;
  };
}

const WarrantyServiceHub: React.FC = () => {
  const navigate = useNavigate();

  const serviceMenuItems: ServiceMenuItem[] = [
    {
      id: 'warranty-list',
      title: 'Danh sách bảo hành',
      description: 'Quản lý tất cả bảo hành sản phẩm, thông tin khách hàng và trạng thái bảo hành',
      icon: Shield,
      path: '/warranty',
      color: 'bg-blue-500',
      stats: {
        count: 156,
        label: 'Bảo hành đang hoạt động'
      }
    },
    {
      id: 'claims-requests',
      title: 'Khiếu nại & Yêu cầu dịch vụ',
      description: 'Xử lý khiếu nại, yêu cầu sửa chữa và theo dõi tiến độ xử lý',
      icon: FileText,
      path: '/warranty/claims',
      color: 'bg-orange-500',
      stats: {
        count: 23,
        label: 'Khiếu nại đang xử lý'
      }
    },
    {
      id: 'service-centers',
      title: 'Trung tâm bảo hành',
      description: 'Quản lý danh sách trung tâm bảo hành, chi nhánh và thông tin liên hệ',
      icon: Building2,
      path: '/warranty/service-centers',
      color: 'bg-green-500',
      stats: {
        count: 8,
        label: 'Trung tâm hoạt động'
      }
    },
    {
      id: 'qr-lookup',
      title: 'QR Code tra cứu bảo hành',
      description: 'Tạo, quản lý QR code cho sản phẩm và cho phép khách hàng tra cứu bảo hành',
      icon: QrCode,
      path: '/warranty/qr-lookup',
      color: 'bg-purple-500',
      stats: {
        count: 342,
        label: 'QR Code đã tạo'
      }
    },
    {
      id: 'notifications',
      title: 'Thông báo bảo hành',
      description: 'Hệ thống thông báo tự động qua SMS, Zalo, Email khi bảo hành sắp hết hạn',
      icon: Bell,
      path: '/warranty/notifications',
      color: 'bg-red-500',
      stats: {
        count: 45,
        label: 'Thông báo chờ gửi'
      }
    },
    {
      id: 'processing-history',
      title: 'Lịch sử xử lý bảo hành',
      description: 'Log chi tiết từng lần khách hàng mang sản phẩm tới, quá trình xử lý và kết quả',
      icon: ClipboardList,
      path: '/warranty/history',
      color: 'bg-indigo-500',
      stats: {
        count: 1284,
        label: 'Lịch sử xử lý'
      }
    }
  ];

  const quickStats = [
    {
      label: 'Bảo hành đang hoạt động',
      value: '156',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      label: 'Sắp hết hạn (30 ngày)',
      value: '23',
      icon: AlertTriangle,
      color: 'text-orange-600'
    },
    {
      label: 'Đang xử lý khiếu nại',
      value: '12',
      icon: Clock,
      color: 'text-blue-600'
    },
    {
      label: 'Trung tâm bảo hành',
      value: '8',
      icon: MapPin,
      color: 'text-purple-600'
    }
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Bảo hành & Dịch vụ
            </h1>
            <p className="text-gray-600">
              Quản lý tổng thể hệ thống bảo hành và dịch vụ khách hàng
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {quickStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <stat.icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Service Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {serviceMenuItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5 }}
            className="group cursor-pointer" onClick={() => handleNavigate(item.path)}
          >
            <Card className="h-full hover:shadow-xl transition-all duration-300 group-hover:shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 ${item.color} rounded-xl text-white`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:transform group-hover:translate-x-1 transition-all" />
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h3>

                <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                  {item.description}
                </p>

                {item.stats && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {item.stats.count}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.stats.label}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Xem chi tiết
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Hoạt động gần đây
            </h2>
            <div className="space-y-3">
              {[
                {
                  action: 'Tạo bảo hành mới',
                  details: 'Laptop Dell XPS 13 - Khách hàng Nguyễn Văn An',
                  time: '2 phút trước',
                  icon: Shield,
                  color: 'text-green-600'
                },
                {
                  action: 'Khiếu nại mới',
                  details: 'Màn hình bị lỗi - Mã bảo hành WAR_001',
                  time: '15 phút trước',
                  icon: AlertTriangle,
                  color: 'text-orange-600'
                },
                {
                  action: 'Gửi thông báo bảo hành',
                  details: '5 khách hàng sắp hết hạn bảo hành',
                  time: '1 giờ trước',
                  icon: Bell,
                  color: 'text-blue-600'
                }
              ].map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <activity.icon className={`w-5 h-5 ${activity.color}`} />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {activity.action}
                    </p>
                    <p className="text-sm text-gray-600">
                      {activity.details}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WarrantyServiceHub;
