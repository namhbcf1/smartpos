import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  FormControlLabel,
  Avatar,
  CircularProgress,
  Backdrop,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Fab,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import {
  Search,
  Add,
  Refresh,
  Visibility,
  Edit,
  Delete,
  Assessment,
  FilterList,
  MoreVert,
  TrendingUp,
  TrendingDown,
  AttachMoney,
  ShoppingCart,
  People,
  Inventory,
  LocalOffer,
  Schedule,
  Download,
  Print,
  Share,
  Analytics,
  BarChart,
  PieChart,
  Timeline,
  ShowChart,
  TableChart,
  Description,
  GetApp,
  PictureAsPdf,
  Image,
  FileDownload,
  CloudDownload,
  Email,
  WhatsApp,
  Telegram,
  Facebook,
  Twitter,
  LinkedIn
} from '@mui/icons-material';

// Report Card Component
interface ReportCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease';
  color: string;
  onView: () => void;
  onDownload: () => void;
}

const ReportCard: React.FC<ReportCardProps> = ({
  title,
  description,
  icon,
  value,
  change,
  changeType,
  color,
  onView,
  onDownload
}) => (
  <Card sx={{
    borderRadius: 3,
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
    }
  }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Avatar sx={{
          width: 50,
          height: 50,
          bgcolor: color,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          {icon}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Xem báo cáo">
            <IconButton
              size="small"
              onClick={onView}
              sx={{
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'rgba(102, 126, 234, 0.1)'
                }
              }}
            >
              <Visibility />
            </IconButton>
          </Tooltip>
          <Tooltip title="Tải xuống">
            <IconButton
              size="small"
              onClick={onDownload}
              sx={{
                color: 'success.main',
                '&:hover': {
                  backgroundColor: 'rgba(76, 175, 80, 0.1)'
                }
              }}
            >
              <Download />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" fontWeight="bold" color={color}>
          {value}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
          {changeType === 'increase' ? (
            <TrendingUp sx={{ color: 'success.main', fontSize: 16 }} />
          ) : (
            <TrendingDown sx={{ color: 'error.main', fontSize: 16 }} />
          )}
          <Typography
            variant="body2"
            color={changeType === 'increase' ? 'success.main' : 'error.main'}
            fontWeight="600"
          >
            {change > 0 ? '+' : ''}{change}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            so với tháng trước
          </Typography>
        </Box>
      </Box>
    </CardContent>
  </Card>
);

// Chart Component
interface ChartProps {
  title: string;
  type: 'bar' | 'line' | 'pie';
  data: any[];
}

const Chart: React.FC<ChartProps> = ({ title, type, data }) => (
  <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Avatar sx={{
          width: 40,
          height: 40,
          bgcolor: 'primary.main'
        }}>
          {type === 'bar' ? <BarChart /> : type === 'line' ? <ShowChart /> : <PieChart />}
        </Avatar>
        <Typography variant="h6" fontWeight="bold">
          {title}
        </Typography>
      </Box>
      
      {/* Placeholder for chart */}
      <Box sx={{
        height: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.02)',
        borderRadius: 2,
        border: '2px dashed rgba(0,0,0,0.1)'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" color="text.secondary" sx={{ mb: 1 }}>
            📊
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Biểu đồ {title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Dữ liệu sẽ được hiển thị ở đây
          </Typography>
        </Box>
      </Box>
    </CardContent>
  </Card>
);

// Main Reports Management Component
const ReportsManagement: React.FC = () => {
  // State Management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [dateRange, setDateRange] = useState('30');
  const [reportType, setReportType] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mock data
  const reportCards = [
    {
      title: 'Doanh thu tổng',
      description: 'Tổng doanh thu trong kỳ',
      icon: <AttachMoney />,
      value: '125.5M VNĐ',
      change: 12.5,
      changeType: 'increase' as const,
      color: '#4caf50'
    },
    {
      title: 'Đơn hàng',
      description: 'Số đơn hàng đã xử lý',
      icon: <ShoppingCart />,
      value: '2,847',
      change: 8.3,
      changeType: 'increase' as const,
      color: '#2196f3'
    },
    {
      title: 'Khách hàng mới',
      description: 'Khách hàng đăng ký mới',
      icon: <People />,
      value: '156',
      change: -2.1,
      changeType: 'decrease' as const,
      color: '#ff9800'
    },
    {
      title: 'Sản phẩm bán chạy',
      description: 'Sản phẩm bán được nhiều nhất',
      icon: <Inventory />,
      value: 'iPhone 15 Pro',
      change: 25.7,
      changeType: 'increase' as const,
      color: '#9c27b0'
    },
    {
      title: 'Khuyến mãi',
      description: 'Số chương trình khuyến mãi',
      icon: <LocalOffer />,
      value: '12',
      change: 5.2,
      changeType: 'increase' as const,
      color: '#f44336'
    },
    {
      title: 'Tỷ lệ chuyển đổi',
      description: 'Tỷ lệ khách hàng mua hàng',
      icon: <TrendingUp />,
      value: '3.2%',
      change: 0.8,
      changeType: 'increase' as const,
      color: '#00bcd4'
    }
  ];

  const charts = [
    {
      title: 'Doanh thu theo tháng',
      type: 'bar' as const,
      data: []
    },
    {
      title: 'Xu hướng bán hàng',
      type: 'line' as const,
      data: []
    },
    {
      title: 'Phân bố sản phẩm',
      type: 'pie' as const,
      data: []
    }
  ];

  // Handlers
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  const handleViewReport = (title: string) => {
    console.log('Viewing report:', title);
  };

  const handleDownloadReport = (title: string) => {
    console.log('Downloading report:', title);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          Không thể tải dữ liệu báo cáo. Vui lòng kiểm tra kết nối mạng.
        </Alert>
        <Button onClick={handleRefresh} startIcon={<Refresh />}>
          Thử lại
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Enhanced Header */}
      <Card sx={{
        mb: 4,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: 3,
        overflow: 'hidden',
        position: 'relative'
      }}>
        <Box sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%'
        }} />
        <Box sx={{
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 150,
          height: 150,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '50%'
        }} />
        <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
            <Avatar sx={{
              width: 80,
              height: 80,
              bgcolor: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <Assessment sx={{ fontSize: 40 }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                Hệ thống báo cáo thông minh
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                Phân tích dữ liệu, thống kê kinh doanh và báo cáo chi tiết
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip
                  label="Phân tích dữ liệu"
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 600,
                    backdropFilter: 'blur(10px)'
                  }}
                />
                <Chip
                  label="Báo cáo tự động"
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 600,
                    backdropFilter: 'blur(10px)'
                  }}
                />
                <Chip
                  label="Xuất Excel/PDF"
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 600,
                    backdropFilter: 'blur(10px)'
                  }}
                />
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<Download />}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                },
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1
              }}
            >
              Xuất tất cả báo cáo
            </Button>
            <Button
              variant="contained"
              startIcon={<Email />}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.9)',
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'white',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                },
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1
              }}
            >
              Gửi báo cáo qua email
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Enhanced Toolbar */}
      <Card sx={{ 
        mb: 3, 
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)'
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
            {/* Search Field */}
            <TextField
              placeholder="Tìm kiếm báo cáo..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'primary.main' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                minWidth: 300,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'white',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                  }
                }
              }}
            />

            {/* Date Range Filter */}
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Khoảng thời gian</InputLabel>
              <Select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                label="Khoảng thời gian"
                sx={{
                  borderRadius: 2,
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'white',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                  }
                }}
              >
                <MenuItem value="7">7 ngày qua</MenuItem>
                <MenuItem value="30">30 ngày qua</MenuItem>
                <MenuItem value="90">3 tháng qua</MenuItem>
                <MenuItem value="365">1 năm qua</MenuItem>
              </Select>
            </FormControl>

            {/* Report Type Filter */}
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Loại báo cáo</InputLabel>
              <Select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                label="Loại báo cáo"
                sx={{
                  borderRadius: 2,
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'white',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                  }
                }}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="sales">Doanh thu</MenuItem>
                <MenuItem value="inventory">Kho hàng</MenuItem>
                <MenuItem value="customers">Khách hàng</MenuItem>
                <MenuItem value="products">Sản phẩm</MenuItem>
              </Select>
            </FormControl>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, ml: 'auto' }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleRefresh}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.dark',
                    backgroundColor: 'rgba(102, 126, 234, 0.05)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
                  }
                }}
              >
                Làm mới
              </Button>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  borderColor: 'success.main',
                  color: 'success.main',
                  '&:hover': {
                    borderColor: 'success.dark',
                    backgroundColor: 'rgba(76, 175, 80, 0.05)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.2)'
                  }
                }}
              >
                Bộ lọc nâng cao
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              minHeight: 60
            }
          }}
        >
          <Tab
            icon={<BarChart />}
            iconPosition="start"
            label="Tổng quan"
          />
          <Tab
            icon={<ShowChart />}
            iconPosition="start"
            label="Biểu đồ"
          />
          <Tab
            icon={<TableChart />}
            iconPosition="start"
            label="Báo cáo chi tiết"
          />
          <Tab
            icon={<Description />}
            iconPosition="start"
            label="Báo cáo xuất"
          />
        </Tabs>
      </Card>

      {/* Tab Content */}
      {selectedTab === 0 && (
        <Box>
          {/* Report Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {reportCards.map((report, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <ReportCard
                  title={report.title}
                  description={report.description}
                  icon={report.icon}
                  value={report.value}
                  change={report.change}
                  changeType={report.changeType}
                  color={report.color}
                  onView={() => handleViewReport(report.title)}
                  onDownload={() => handleDownloadReport(report.title)}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {selectedTab === 1 && (
        <Box>
          {/* Charts */}
          <Grid container spacing={3}>
            {charts.map((chart, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Chart
                  title={chart.title}
                  type={chart.type}
                  data={chart.data}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {selectedTab === 2 && (
        <Box>
          {/* Detailed Reports Table */}
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'rgba(102, 126, 234, 0.05)' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Báo cáo</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Loại</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Khoảng thời gian</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Trạng thái</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Cập nhật cuối</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[
                    {
                      name: 'Báo cáo doanh thu tháng 12',
                      type: 'Doanh thu',
                      period: '1-31/12/2024',
                      status: 'Hoàn thành',
                      lastUpdate: '2024-12-31 23:59',
                      color: 'success'
                    },
                    {
                      name: 'Báo cáo tồn kho',
                      type: 'Kho hàng',
                      period: 'Tuần này',
                      status: 'Đang xử lý',
                      lastUpdate: '2024-12-30 15:30',
                      color: 'warning'
                    },
                    {
                      name: 'Báo cáo khách hàng',
                      type: 'Khách hàng',
                      period: 'Quý 4/2024',
                      status: 'Hoàn thành',
                      lastUpdate: '2024-12-29 10:15',
                      color: 'success'
                    }
                  ].map((report, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
                            <Assessment />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {report.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: RPT-{String(index + 1).padStart(3, '0')}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={report.type}
                          color="primary"
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {report.period}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={report.status}
                          color={report.color as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {report.lastUpdate}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Xem báo cáo">
                            <IconButton size="small">
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Tải xuống">
                            <IconButton size="small">
                              <Download />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Chia sẻ">
                            <IconButton size="small">
                              <Share />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
      )}

      {selectedTab === 3 && (
        <Box>
          {/* Export Reports */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                    Xuất báo cáo Excel
                  </Typography>
                  <List>
                    {[
                      { name: 'Báo cáo doanh thu', icon: <AttachMoney />, color: 'success' },
                      { name: 'Báo cáo sản phẩm', icon: <Inventory />, color: 'primary' },
                      { name: 'Báo cáo khách hàng', icon: <People />, color: 'info' },
                      { name: 'Báo cáo tồn kho', icon: <Assessment />, color: 'warning' }
                    ].map((item, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemIcon>
                          <Avatar sx={{ width: 40, height: 40, bgcolor: `${item.color}.main` }}>
                            {item.icon}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={item.name}
                          secondary="Định dạng .xlsx"
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<GetApp />}
                          sx={{ borderRadius: 2 }}
                        >
                          Tải xuống
                        </Button>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                    Xuất báo cáo PDF
                  </Typography>
                  <List>
                    {[
                      { name: 'Báo cáo tổng hợp', icon: <PictureAsPdf />, color: 'error' },
                      { name: 'Báo cáo tài chính', icon: <AttachMoney />, color: 'success' },
                      { name: 'Báo cáo kinh doanh', icon: <TrendingUp />, color: 'primary' },
                      { name: 'Báo cáo thống kê', icon: <BarChart />, color: 'info' }
                    ].map((item, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemIcon>
                          <Avatar sx={{ width: 40, height: 40, bgcolor: `${item.color}.main` }}>
                            {item.icon}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={item.name}
                          secondary="Định dạng .pdf"
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<PictureAsPdf />}
                          sx={{ borderRadius: 2 }}
                        >
                          Tải xuống
                        </Button>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Loading Backdrop */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isLoading}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress color="inherit" />
          <Typography variant="h6">Đang tạo báo cáo...</Typography>
        </Box>
      </Backdrop>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
            transform: 'scale(1.1)'
          }
        }}
      >
        <Download />
      </Fab>
    </Box>
  );
};

export default ReportsManagement;

