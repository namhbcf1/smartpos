import React, { useState, useEffect } from 'react';
import apiClient from './services/api/client';
import { MainLayout, PageWrapper, Section, Grid, StatsCard } from './components/layout/MainLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { DataTable, Column } from './components/ui/DataTable';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  Activity,
  BarChart3,
  Zap,
  Cloud,
  Wifi,
  Database,
  Sparkles,
  Star,
  Award
} from 'lucide-react';
import { formatCurrency } from './lib/utils';
import { ParticleBackground, FloatingOrbs, AnimatedGradient } from './components/effects/ParticleBackground';
import {
  RevealOnScroll,
  TiltCard,
  MorphingShape,
  FloatingElement,
  TypewriterText,
  MagneticElement
} from './components/effects/AdvancedAnimations';
import {
  SalesTrendChart,
  ProductCategoriesChart,
  MonthlyComparisonChart,
  PerformanceRadarChart
} from './components/charts/AdvancedCharts';
import './styles/globals.css';

function App() {
  const [apiStatus, setApiStatus] = useState<string>('checking');
  const [products, setProducts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0
  });

  // Define product table columns
  const productColumns = [
    {
      key: 'id',
      title: 'ID',
      sortable: true,
      width: '80px',
    },
    {
      key: 'name',
      title: 'Tên sản phẩm',
      sortable: true,
      render: (value: string) => (
        <div className="font-medium text-gray-900">
          {value}
        </div>
      ),
    },
    {
      key: 'category_name',
      title: 'Danh mục',
      sortable: true,
      render: (value: string) => (
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800  rounded-full">
          {value}
        </span>
      ),
    },
    {
      key: 'price',
      title: 'Giá',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => (
        <span className="font-bold text-green-600">
          {formatCurrency(value)}
        </span>
      ),
    },
  ];

  useEffect(() => {
    // Test API connection
    const testAPI = async () => {
      try {
        await apiClient.get('/health');
        setApiStatus('connected');

        // Fetch products
        const productsResponse = await apiClient.get('/products');
        const productsData = productsResponse.data.data || [];
        setProducts(productsData);

        // Calculate stats
        setStats({
          totalSales: 15420000,
          totalOrders: 156,
          totalProducts: productsData.length,
          totalCustomers: 89
        });
      } catch (error) {
        setApiStatus('error');
        console.error('API connection failed:', error);
      }
    };

    testAPI();
  }, []);

  return (
      <div data-testid="app-container">
        <MainLayout
          title="Dashboard"
          breadcrumbs={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Dashboard' }
          ]}
        >
        <PageWrapper>
          {/* Enhanced Hero Section */}
          <Section>
            <motion.div
              data-testid="hero-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative rounded-3xl p-8 text-white overflow-hidden min-h-[400px]"
            >
              {/* Advanced Background Effects */}
              <AnimatedGradient
                colors={['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b']}
                className="opacity-90"
              />
              <ParticleBackground preset="floating" opacity={0.3} />
              <FloatingOrbs count={8} />

              <div className="relative z-20">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <RevealOnScroll direction="up" delay={0.2}>
                      <h1 className="text-5xl font-bold mb-4 gradient-text-primary">
                        <TypewriterText
                          text="ComputerPOS Pro"
                          speed={100}
                        />
                      </h1>
                    </RevealOnScroll>

                    <RevealOnScroll direction="up" delay={0.4}>
                      <p className="text-xl mb-8 text-white/90 max-w-2xl">
                        Hệ thống quản lý bán hàng thông minh với công nghệ đám mây,
                        AI và analytics tiên tiến
                      </p>
                    </RevealOnScroll>

                    <RevealOnScroll direction="up" delay={0.6}>
                      <div className="flex flex-wrap gap-4">
                        <MagneticElement strength={0.2}>
                          <Button variant="glass" size="xl" className="hover-glow">
                            <ShoppingCart className="w-6 h-6 mr-3" />
                            Bắt đầu bán hàng
                            <Sparkles className="w-5 h-5 ml-2" />
                          </Button>
                        </MagneticElement>

                        <MagneticElement strength={0.2}>
                          <Button
                            variant="outline"
                            size="xl"
                            className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
                          >
                            <BarChart3 className="w-6 h-6 mr-3" />
                            Analytics Dashboard
                          </Button>
                        </MagneticElement>
                      </div>
                    </RevealOnScroll>
                  </div>

                  <div className="hidden lg:block">
                    <FloatingElement intensity={15} speed={4}>
                      <TiltCard tiltMaxAngleX={15} tiltMaxAngleY={15} scale={1.05}>
                        <div className="w-48 h-48 glass-card rounded-3xl flex items-center justify-center relative">
                          <MorphingShape size={120} colors={['#ffffff', '#3b82f6', '#8b5cf6']} />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Activity className="w-20 h-20 text-white animate-pulse-glow" />
                          </div>
                        </div>
                      </TiltCard>
                    </FloatingElement>
                  </div>
                </div>

                {/* Floating Achievement Badges */}
                <div className="absolute top-8 right-8 space-y-4">
                  <FloatingElement intensity={8} speed={3}>
                    <div className="glass-card rounded-full p-3 animate-glow">
                      <Star className="w-6 h-6 text-yellow-300" />
                    </div>
                  </FloatingElement>
                  <FloatingElement intensity={10} speed={3.5}>
                    <div className="glass-card rounded-full p-3 animate-pulse-glow">
                      <Award className="w-6 h-6 text-green-300" />
                    </div>
                  </FloatingElement>
                </div>
              </div>
            </motion.div>
          </Section>

          {/* Enhanced Stats Cards */}
          <Section title="Tổng quan hôm nay" description="Dữ liệu thời gian thực được cập nhật mỗi phút">
            <RevealOnScroll direction="up" delay={0.2}>
              <div data-testid="stats-section">
                <Grid cols={4}>
                <TiltCard tiltMaxAngleX={5} tiltMaxAngleY={5}>
                  <StatsCard
                    title="Doanh thu"
                    value={formatCurrency(stats.totalSales)}
                    change={{ value: 12.5, type: 'increase' }}
                    icon={<DollarSign className="w-6 h-6" />}
                    className="hover-lift animate-slide-in-left glass-card"
                  />
                </TiltCard>

                <TiltCard tiltMaxAngleX={5} tiltMaxAngleY={5}>
                  <StatsCard
                    title="Đơn hàng"
                    value={stats.totalOrders}
                    change={{ value: 8.2, type: 'increase' }}
                    icon={<ShoppingCart className="w-6 h-6" />}
                    className="hover-lift animate-slide-in-left glass-card"
                  />
                </TiltCard>

                <TiltCard tiltMaxAngleX={5} tiltMaxAngleY={5}>
                  <StatsCard
                    title="Sản phẩm"
                    value={stats.totalProducts}
                    change={{ value: 3.1, type: 'increase' }}
                    icon={<Package className="w-6 h-6" />}
                    className="hover-lift animate-slide-in-right glass-card"
                  />
                </TiltCard>

                <TiltCard tiltMaxAngleX={5} tiltMaxAngleY={5}>
                  <StatsCard
                    title="Khách hàng"
                    value={stats.totalCustomers}
                    change={{ value: 15.3, type: 'increase' }}
                    icon={<Users className="w-6 h-6" />}
                    className="hover-lift animate-slide-in-right glass-card"
                  />
                </TiltCard>
                </Grid>
              </div>
            </RevealOnScroll>
          </Section>

          {/* Advanced Charts Section */}
          <Section
            title="Analytics Dashboard"
            description="Phân tích chi tiết và xu hướng kinh doanh"
            headerActions={
              <Button variant="gradient" size="lg">
                <BarChart3 className="w-5 h-5 mr-2" />
                Báo cáo chi tiết
              </Button>
            }
          >
            <RevealOnScroll direction="up" delay={0.3}>
              <Grid cols={2} gap={6}>
                <TiltCard tiltMaxAngleX={3} tiltMaxAngleY={3}>
                  <SalesTrendChart />
                </TiltCard>
                <TiltCard tiltMaxAngleX={3} tiltMaxAngleY={3}>
                  <ProductCategoriesChart />
                </TiltCard>
                <TiltCard tiltMaxAngleX={3} tiltMaxAngleY={3}>
                  <MonthlyComparisonChart />
                </TiltCard>
                <TiltCard tiltMaxAngleX={3} tiltMaxAngleY={3}>
                  <PerformanceRadarChart />
                </TiltCard>
              </Grid>
            </RevealOnScroll>
          </Section>

          {/* System Status */}
          <Section title="Trạng thái hệ thống">
            <Grid cols={3}>
              <Card gradient hover>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Cloud className="w-5 h-5 text-blue-600" />
                    <span>Cloudflare Workers</span>
                  </CardTitle>
                  <CardDescription>
                    API Backend trên edge network
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        Status
                      </p>
                      <p className={`font-semibold ${
                        apiStatus === 'connected'
                          ? 'text-green-600'
                          : apiStatus === 'error'
                          ? 'text-red-600'
                          : 'text-yellow-600'
                      }`}>
                        {apiStatus === 'connected' ? '✅ Connected' :
                         apiStatus === 'error' ? '❌ Error' : '🔄 Checking...'}
                      </p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      apiStatus === 'connected' ? 'bg-green-400' :
                      apiStatus === 'error' ? 'bg-red-400' : 'bg-yellow-400'
                    }`}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    pos-backend-bangachieu2.bangachieu2.workers.dev
                  </p>
                </CardContent>
              </Card>

              <Card gradient hover>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="w-5 h-5 text-purple-600" />
                    <span>Cloudflare D1</span>
                  </CardTitle>
                  <CardDescription>
                    Database SQLite trên edge
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        Sản phẩm
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {products.length}
                      </p>
                    </div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Đồng bộ thời gian thực
                  </p>
                </CardContent>
              </Card>

              <Card gradient hover>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Wifi className="w-5 h-5 text-green-600" />
                    <span>Kết nối mạng</span>
                  </CardTitle>
                  <CardDescription>
                    Trạng thái kết nối internet
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        Status
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        Online
                      </p>
                    </div>
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Tốc độ cao, độ trễ thấp
                  </p>
                </CardContent>
              </Card>
            </Grid>
          </Section>

          {/* Enhanced Products Table */}
          {products.length > 0 && (
            <Section
              title="Quản lý sản phẩm"
              description="Bảng dữ liệu tương tác với tính năng tìm kiếm, lọc và xuất dữ liệu"
              headerActions={
                <div className="flex gap-2">
                  <Button variant="gradient">
                    <Package className="w-4 h-4 mr-2" />
                    Thêm sản phẩm
                  </Button>
                  <Button variant="outline">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Phân tích
                  </Button>
                </div>
              }
            >
              <RevealOnScroll direction="up" delay={0.4}>
                <TiltCard tiltMaxAngleX={2} tiltMaxAngleY={2}>
                  <DataTable
                    data={products}
                    columns={productColumns}
                    searchable
                    filterable
                    exportable
                    selectable
                    pagination
                    pageSize={8}
                    onEdit={(product) => console.log('Edit:', product)}
                    onDelete={(product) => console.log('Delete:', product)}
                    onView={(product) => console.log('View:', product)}
                    className="glass-card"
                  />
                </TiltCard>
              </RevealOnScroll>
            </Section>
          )}

          {/* Enhanced Products Preview Cards */}
          {products.length > 0 && (
            <Section
              title="Sản phẩm nổi bật"
              description="Showcase sản phẩm với hiệu ứng 3D và animations"
            >
              <RevealOnScroll direction="up" delay={0.5}>
                <Grid cols={3}>
                  {products.slice(0, 6).map((product: any, index: number) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20, rotateY: -15 }}
                      animate={{ opacity: 1, y: 0, rotateY: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.6 }}
                    >
                      <TiltCard tiltMaxAngleX={10} tiltMaxAngleY={10} scale={1.05}>
                        <Card hover className="h-full glass-card hover-glow">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <FloatingElement intensity={5} speed={3}>
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center animate-morphing">
                                  <Package className="w-7 h-7 text-white" />
                                </div>
                              </FloatingElement>
                              <span className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full font-medium">
                                {product.category_name}
                              </span>
                            </div>
                            <h4 className="font-bold text-gray-900 mb-2 text-lg gradient-text-primary">
                              {product.name}
                            </h4>
                            <p className="text-2xl font-bold gradient-text-success mb-4">
                              {formatCurrency(product.price)}
                            </p>
                            <div className="space-y-2">
                              <MagneticElement strength={0.1}>
                                <Button size="sm" className="w-full hover-lift" variant="gradient">
                                  <ShoppingCart className="w-4 h-4 mr-2" />
                                  Thêm vào giỏ
                                </Button>
                              </MagneticElement>
                            </div>
                          </CardContent>
                        </Card>
                      </TiltCard>
                    </motion.div>
                  ))}
                </Grid>
              </RevealOnScroll>
            </Section>
          )}

          {/* Enhanced Quick Actions */}
          <Section title="Thao tác nhanh" description="Các tính năng chính với hiệu ứng tương tác">
            <RevealOnScroll direction="up" delay={0.6}>
              <Grid cols={2} gap={8}>
                <TiltCard tiltMaxAngleX={8} tiltMaxAngleY={8} scale={1.03}>
                  <MagneticElement strength={0.15}>
                    <Card gradient hover className="cursor-pointer group glass-card hover-glow">
                      <CardContent className="p-8">
                        <div className="flex items-center space-x-6">
                          <FloatingElement intensity={8} speed={2.5}>
                            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 animate-pulse-glow">
                              <ShoppingCart className="w-8 h-8 text-white" />
                            </div>
                          </FloatingElement>
                          <div>
                            <h3 className="text-xl font-bold gradient-text-primary mb-2">
                              Tạo đơn hàng mới
                            </h3>
                            <p className="text-gray-600">
                              Bắt đầu quy trình bán hàng với AI assistant
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </MagneticElement>
                </TiltCard>

                <TiltCard tiltMaxAngleX={8} tiltMaxAngleY={8} scale={1.03}>
                  <MagneticElement strength={0.15}>
                    <Card gradient hover className="cursor-pointer group glass-card hover-glow">
                      <CardContent className="p-8">
                        <div className="flex items-center space-x-6">
                          <FloatingElement intensity={8} speed={3}>
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 animate-glow">
                              <BarChart3 className="w-8 h-8 text-white" />
                            </div>
                          </FloatingElement>
                          <div>
                            <h3 className="text-xl font-bold gradient-text-primary mb-2">
                              Analytics Dashboard
                            </h3>
                            <p className="text-gray-600">
                              Phân tích doanh thu và insights kinh doanh
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </MagneticElement>
                </TiltCard>
              </Grid>
            </RevealOnScroll>
          </Section>

          {/* Floating Action Button */}
          <motion.div
            className="fixed bottom-8 right-8 z-50"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 1, type: "spring", stiffness: 260, damping: 20 }}
          >
            <FloatingElement intensity={5} speed={2}>
              <MagneticElement strength={0.3}>
                <Button
                  size="xl"
                  variant="gradient"
                  className="rounded-full w-16 h-16 shadow-2xl hover-glow animate-pulse-glow"
                >
                  <Sparkles className="w-8 h-8" />
                </Button>
              </MagneticElement>
            </FloatingElement>
          </motion.div>
        </PageWrapper>
        </MainLayout>
      </div>
  );
}

export default App;
