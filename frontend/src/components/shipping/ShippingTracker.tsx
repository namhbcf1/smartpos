import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Chip,
  Divider
} from '@mui/material';
import {
  LocalShipping,
  Search,
  CheckCircle,
  Schedule,
  LocationOn
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface ShippingProvider {
  id: string;
  name: string;
  logo: string;
  iframeUrl: string;
  widgetUrl?: string;
  trackingUrl: string;
  apiEndpoint?: string;
}

// Configuration cho các nhà vận chuyển Việt Nam
const SHIPPING_PROVIDERS: ShippingProvider[] = [
  {
    id: 'ghn',
    name: 'Giao Hàng Nhanh',
    logo: 'https://file.hstatic.net/1000063620/file/ghn-01_1024x1024.png',
    iframeUrl: 'https://tracking.ghn.vn/iframe',
    widgetUrl: 'https://tracking.ghn.vn/widget.js',
    trackingUrl: 'https://tracking.ghn.vn',
    apiEndpoint: 'https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/detail'
  },
  {
    id: 'ghtk',
    name: 'Giao Hàng Tiết Kiệm',
    logo: 'https://i.ghtk.vn/logozi/ghtk.jpg',
    iframeUrl: 'https://tracking.giaohangtietkiem.vn/iframe',
    trackingUrl: 'https://tracking.giaohangtietkiem.vn',
    apiEndpoint: 'https://services.giaohangtietkiem.vn/services/shipment/v2'
  },
  {
    id: 'vnpost',
    name: 'VNPost',
    logo: 'https://vnpost.vn/images/vnpost-logo.png',
    iframeUrl: 'https://trackandtrace.vnpost.vn/iframe',
    trackingUrl: 'https://trackandtrace.vnpost.vn',
    apiEndpoint: 'https://donhang.vnpost.vn/api/tra-cuu'
  },
  {
    id: 'viettelpost',
    name: 'Viettel Post',
    logo: 'https://viettelpost.com.vn/wp-content/uploads/2021/07/viettelpost-logo.png',
    iframeUrl: 'https://viettelpost.com.vn/tra-cuu/iframe',
    trackingUrl: 'https://viettelpost.com.vn/tra-cuu',
    apiEndpoint: 'https://api.viettelpost.vn/api/v2/order/getOrderTracking'
  },
  {
    id: 'jnt',
    name: 'J&T Express',
    logo: 'https://www.jtexpress.vn/themes/default/assets/img/logo.png',
    iframeUrl: 'https://www.jtexpress.vn/iframe/tracking',
    trackingUrl: 'https://www.jtexpress.vn/tracking',
    apiEndpoint: 'https://api.jtexpress.vn/web/order/track'
  }
];

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`shipping-tabpanel-${index}`}
      aria-labelledby={`shipping-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ShippingTracker() {
  const [tabValue, setTabValue] = useState(0);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<ShippingProvider>(SHIPPING_PROVIDERS[0]);
  const [loading, setLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const widgetContainerRef = useRef<HTMLDivElement>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError('');
    setTrackingData(null);
  };

  const handleProviderChange = (provider: ShippingProvider) => {
    setSelectedProvider(provider);
    setError('');
    setTrackingData(null);
  };

  // Method 1: Iframe Integration
  const handleIframeTracking = () => {
    if (!trackingNumber.trim()) {
      setError('Vui lòng nhập mã vận đơn');
      return;
    }

    setLoading(true);
    setError('');

    const iframeUrl = `${selectedProvider.iframeUrl}?tracking=${encodeURIComponent(trackingNumber)}&provider=${selectedProvider.id}`;

    if (iframeRef.current) {
      iframeRef.current.src = iframeUrl;
      iframeRef.current.onload = () => {
        setLoading(false);
      };
      iframeRef.current.onerror = () => {
        setLoading(false);
        setError('Không thể tải thông tin vận đơn. Vui lòng thử lại.');
      };
    }
  };

  // Method 2: JS Widget Integration
  const handleWidgetTracking = async () => {
    if (!trackingNumber.trim()) {
      setError('Vui lòng nhập mã vận đơn');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Load widget script dynamically
      if (selectedProvider.widgetUrl) {
        await loadWidgetScript(selectedProvider.widgetUrl);

        // Initialize widget
        const widgetContainer = widgetContainerRef.current;
        if (widgetContainer) {
          widgetContainer.innerHTML = '';

          // Create widget instance
          const widget = document.createElement('div');
          widget.id = `shipping-widget-${selectedProvider.id}`;
          widget.className = 'shipping-widget';
          widget.setAttribute('data-tracking', trackingNumber);
          widget.setAttribute('data-provider', selectedProvider.id);

          widgetContainer.appendChild(widget);

          // Initialize widget based on provider
          await initializeWidget(selectedProvider.id, trackingNumber);
        }
      }

      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError('Không thể tải widget tra cứu. Vui lòng thử lại.');
    }
  };

  // Method 3: API Integration
  const handleApiTracking = async () => {
    if (!trackingNumber.trim()) {
      setError('Vui lòng nhập mã vận đơn');
      return;
    }

    setLoading(true);
    setError('');
    setTrackingData(null);

    try {
      // Call our backend API which will proxy to shipping provider
      const response = await fetch('/api/v1/shipping/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trackingNumber,
          provider: selectedProvider.id
        })
      });

      const data = await response.json();

      if (data.success) {
        setTrackingData(data.data);
      } else {
        setError(data.message || 'Không tìm thấy thông tin vận đơn');
      }
    } catch (err) {
      setError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const loadWidgetScript = (scriptUrl: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Check if script already loaded
      if (document.querySelector(`script[src="${scriptUrl}"]`)) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load widget script'));

      document.head.appendChild(script);
    });
  };

  const initializeWidget = async (providerId: string, tracking: string) => {
    // Provider-specific widget initialization
    switch (providerId) {
      case 'ghn':
        if ((window as any).GHNTracking) {
          (window as any).GHNTracking.init({
            container: `#shipping-widget-${providerId}`,
            trackingNumber: tracking,
            theme: 'modern',
            language: 'vi'
          });
        }
        break;

      case 'ghtk':
        if ((window as any).GHTKWidget) {
          (window as any).GHTKWidget.track({
            element: `#shipping-widget-${providerId}`,
            orderCode: tracking
          });
        }
        break;

      default:
        // Generic widget initialization
        const widget = document.querySelector(`#shipping-widget-${providerId}`);
        if (widget) {
          widget.innerHTML = `
            <div class="tracking-widget">
              <p>Đang tra cứu vận đơn: <strong>${tracking}</strong></p>
              <p>Nhà vận chuyển: <strong>${selectedProvider.name}</strong></p>
              <a href="${selectedProvider.trackingUrl}?tracking=${tracking}" target="_blank">
                Xem chi tiết trên trang ${selectedProvider.name}
              </a>
            </div>
          `;
        }
    }
  };

  const renderTrackingData = () => {
    if (!trackingData) return null;

    return (
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <LocalShipping sx={{ mr: 1, verticalAlign: 'middle' }} />
            Thông tin vận đơn: {trackingNumber}
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Chip
              label={trackingData.status || 'Đang xử lý'}
              color={trackingData.status === 'delivered' ? 'success' : 'warning'}
              icon={trackingData.status === 'delivered' ? <CheckCircle /> : <Schedule />}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" gutterBottom>
            Lịch sử vận chuyển:
          </Typography>

          {trackingData.history?.map((event: any, index: number) => (
            <Box key={index} sx={{ mb: 2, pl: 2, borderLeft: '2px solid #e0e0e0' }}>
              <Typography variant="body2" color="textSecondary">
                {event.date} - {event.time}
              </Typography>
              <Typography variant="body1">
                <LocationOn sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                {event.location}
              </Typography>
              <Typography variant="body2">
                {event.description}
              </Typography>
            </Box>
          ))}
        </CardContent>
      </Card>
    );
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          <LocalShipping sx={{ mr: 1, verticalAlign: 'middle' }} />
          Tra cứu vận đơn
        </Typography>

        {/* Provider Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Chọn nhà vận chuyển:
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {SHIPPING_PROVIDERS.map((provider) => (
              <Button
                key={provider.id}
                variant={selectedProvider.id === provider.id ? 'contained' : 'outlined'}
                onClick={() => handleProviderChange(provider)}
                startIcon={
                  <img
                    src={provider.logo}
                    alt={provider.name}
                    style={{ width: 20, height: 20 }}
                  />
                }
              >
                {provider.name}
              </Button>
            ))}
          </Box>
        </Box>

        {/* Tracking Number Input */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            label="Mã vận đơn"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Nhập mã vận đơn cần tra cứu"
            disabled={loading}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Tracking Methods Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Iframe" />
            <Tab label="Widget" />
            <Tab label="API" />
          </Tabs>
        </Box>

        {/* Method 1: Iframe */}
        <TabPanel value={tabValue} index={0}>
          <Button
            variant="contained"
            onClick={handleIframeTracking}
            startIcon={loading ? <CircularProgress size={20} /> : <Search />}
            disabled={loading || !trackingNumber.trim()}
            fullWidth
            sx={{ mb: 2 }}
          >
            {loading ? 'Đang tra cứu...' : 'Tra cứu bằng Iframe'}
          </Button>

          <Box sx={{
            width: '100%',
            height: 400,
            border: '1px solid #e0e0e0',
            borderRadius: 1,
            overflow: 'hidden'
          }}>
            <iframe
              ref={iframeRef}
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ border: 'none' }}
              title="Shipping Tracking"
            />
          </Box>
        </TabPanel>

        {/* Method 2: Widget */}
        <TabPanel value={tabValue} index={1}>
          <Button
            variant="contained"
            onClick={handleWidgetTracking}
            startIcon={loading ? <CircularProgress size={20} /> : <Search />}
            disabled={loading || !trackingNumber.trim()}
            fullWidth
            sx={{ mb: 2 }}
          >
            {loading ? 'Đang tải widget...' : 'Tra cứu bằng Widget'}
          </Button>

          <Box
            ref={widgetContainerRef}
            sx={{
              minHeight: 300,
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              p: 2,
              '& .shipping-widget': {
                width: '100%',
                height: '100%'
              }
            }}
          />
        </TabPanel>

        {/* Method 3: API */}
        <TabPanel value={tabValue} index={2}>
          <Button
            variant="contained"
            onClick={handleApiTracking}
            startIcon={loading ? <CircularProgress size={20} /> : <Search />}
            disabled={loading || !trackingNumber.trim()}
            fullWidth
            sx={{ mb: 2 }}
          >
            {loading ? 'Đang tra cứu...' : 'Tra cứu qua API'}
          </Button>

          {renderTrackingData()}
        </TabPanel>
      </CardContent>
    </Card>
  );
}
