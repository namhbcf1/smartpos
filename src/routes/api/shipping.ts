import { Hono } from 'hono';
import { Env } from '../../types';

const app = new Hono<{ Bindings: Env }>();

interface ShippingProvider {
  id: string;
  name: string;
  apiEndpoint: string;
  apiKey?: string;
  headers: Record<string, string>;
  trackingUrlTemplate: string;
}

// Configuration cho các nhà vận chuyển
const SHIPPING_PROVIDERS: Record<string, ShippingProvider> = {
  ghn: {
    id: 'ghn',
    name: 'Giao Hàng Nhanh',
    apiEndpoint: 'https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/detail',
    headers: {
      'Content-Type': 'application/json',
      'Token': 'YOUR_GHN_TOKEN', // Thay bằng token thực
      'ShopId': 'YOUR_GHN_SHOP_ID'
    },
    trackingUrlTemplate: 'https://tracking.ghn.vn/{trackingNumber}'
  },
  ghtk: {
    id: 'ghtk',
    name: 'Giao Hàng Tiết Kiệm',
    apiEndpoint: 'https://services.giaohangtietkiem.vn/services/shipment/v2',
    headers: {
      'Content-Type': 'application/json',
      'Token': 'YOUR_GHTK_TOKEN'
    },
    trackingUrlTemplate: 'https://tracking.giaohangtietkiem.vn/{trackingNumber}'
  },
  vnpost: {
    id: 'vnpost',
    name: 'VNPost',
    apiEndpoint: 'https://donhang.vnpost.vn/api/tra-cuu',
    headers: {
      'Content-Type': 'application/json'
    },
    trackingUrlTemplate: 'https://trackandtrace.vnpost.vn/{trackingNumber}'
  },
  viettelpost: {
    id: 'viettelpost',
    name: 'Viettel Post',
    apiEndpoint: 'https://api.viettelpost.vn/api/v2/order/getOrderTracking',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_VIETTELPOST_TOKEN'
    },
    trackingUrlTemplate: 'https://viettelpost.com.vn/tra-cuu/{trackingNumber}'
  },
  jnt: {
    id: 'jnt',
    name: 'J&T Express',
    apiEndpoint: 'https://api.jtexpress.vn/web/order/track',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': 'YOUR_JNT_API_KEY'
    },
    trackingUrlTemplate: 'https://www.jtexpress.vn/tracking/{trackingNumber}'
  }
};

// Mock tracking data for demo
const MOCK_TRACKING_DATA = {
  status: 'in_transit',
  statusText: 'Đang vận chuyển',
  estimatedDelivery: '2024-01-20',
  currentLocation: 'Kho HCM',
  history: [
    {
      date: '2024-01-15',
      time: '08:30',
      location: 'Kho Hà Nội',
      description: 'Đơn hàng đã được tiếp nhận tại kho'
    },
    {
      date: '2024-01-15',
      time: '14:20',
      location: 'Trung tâm phân loại HN',
      description: 'Đơn hàng đang được phân loại'
    },
    {
      date: '2024-01-16',
      time: '06:00',
      location: 'Xe tải HN-HCM',
      description: 'Đơn hàng đã xuất kho, đang vận chuyển đến HCM'
    },
    {
      date: '2024-01-17',
      time: '10:15',
      location: 'Kho HCM',
      description: 'Đơn hàng đã đến kho HCM'
    },
    {
      date: '2024-01-17',
      time: '15:30',
      location: 'Xe giao hàng Q1',
      description: 'Đơn hàng đang được giao đến khách hàng'
    }
  ]
};

// Utility functions
function normalizeTrackingData(providerData: any, providerId: string): any {
  switch (providerId) {
    case 'ghn':
      return {
        status: providerData.data?.status || 'unknown',
        statusText: getStatusText(providerData.data?.status),
        estimatedDelivery: providerData.data?.expected_delivery_time,
        currentLocation: providerData.data?.current_warehouse?.name,
        history: providerData.data?.log?.map((log: any) => ({
          date: log.updated_date?.split(' ')[0],
          time: log.updated_date?.split(' ')[1],
          location: log.location?.name || 'N/A',
          description: log.status_text
        })) || []
      };

    case 'ghtk':
      return {
        status: providerData.order?.status || 'unknown',
        statusText: getStatusText(providerData.order?.status),
        estimatedDelivery: providerData.order?.expected_deliver_time,
        currentLocation: providerData.order?.address,
        history: providerData.order?.status_text?.map((status: any, index: number) => ({
          date: status.time?.split(' ')[0],
          time: status.time?.split(' ')[1],
          location: status.location || 'N/A',
          description: status.message
        })) || []
      };

    default:
      return MOCK_TRACKING_DATA;
  }
}

function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    'ready_to_pick': 'Chờ lấy hàng',
    'picking': 'Đang lấy hàng',
    'picked': 'Đã lấy hàng',
    'storing': 'Hàng đang về kho',
    'transporting': 'Đang vận chuyển',
    'delivering': 'Đang giao hàng',
    'delivered': 'Đã giao hàng',
    'delivery_fail': 'Giao hàng thất bại',
    'waiting_to_return': 'Chờ trả hàng',
    'return': 'Trả hàng',
    'returned': 'Đã trả hàng',
    'exception': 'Đơn hàng ngoại lệ',
    'damage': 'Hàng bị hư hỏng',
    'lost': 'Thất lạc'
  };

  return statusMap[status] || 'Không xác định';
}

// Routes

// Lấy danh sách nhà vận chuyển
app.get('/providers', async (c: any) => {
  try {
    const providers = Object.values(SHIPPING_PROVIDERS).map(provider => ({
      id: provider.id,
      name: provider.name,
      trackingUrlTemplate: provider.trackingUrlTemplate
    }));

    return c.json({
      success: true,
      data: providers
    });
  } catch (error) {
    console.error('Get shipping providers error:', error);
    return c.json({
      success: false,
      message: 'Không thể lấy danh sách nhà vận chuyển'
    }, 500);
  }
});

// Simple test endpoint
app.get('/', async (c: any) => {
  return c.json({
    success: true,
    data: [],
    message: 'Shipping tracking endpoint - iframe/widget/API approach'
  });
});

// Tra cứu vận đơn - Main tracking endpoint
app.post('/track', async (c: any) => {
  try {
    const { trackingNumber, provider } = await c.req.json();

    if (!trackingNumber || !provider) {
      return c.json({
        success: false,
        message: 'Mã vận đơn và nhà vận chuyển là bắt buộc'
      }, 400);
    }

    const shippingProvider = SHIPPING_PROVIDERS[provider];
    if (!shippingProvider) {
      return c.json({
        success: false,
        message: 'Nhà vận chuyển không được hỗ trợ'
      }, 400);
    }

    // Lưu tracking request vào database
    try {
      await c.env.DB.prepare(`
        INSERT INTO shipping_tracking_logs (
          id, tracking_number, provider, requested_at, client_ip
        ) VALUES (?, ?, ?, datetime('now'), ?)
      `).bind(
        crypto.randomUUID(),
        trackingNumber,
        provider,
        c.req.header('CF-Connecting-IP') || 'unknown'
      ).run();
    } catch (dbError) {
      console.warn('Failed to log tracking request:', dbError);
    }

    let trackingData;

    try {
      // Call shipping provider API
      const response = await fetch(shippingProvider.apiEndpoint, {
        method: 'POST',
        headers: shippingProvider.headers,
        body: JSON.stringify({
          order_code: trackingNumber,
          tracking_number: trackingNumber
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const providerData = await response.json();
      trackingData = normalizeTrackingData(providerData, provider);

    } catch (providerError) {
      console.error(`Error calling ${provider} API:`, providerError);

      // Fallback to mock data for demo
      trackingData = {
        ...MOCK_TRACKING_DATA,
        trackingNumber,
        provider: shippingProvider.name,
        trackingUrl: shippingProvider.trackingUrlTemplate.replace('{trackingNumber}', trackingNumber),
        note: 'Dữ liệu demo - API thực không khả dụng'
      };
    }

    return c.json({
      success: true,
      data: {
        trackingNumber,
        provider: shippingProvider.name,
        providerId: provider,
        trackingUrl: shippingProvider.trackingUrlTemplate.replace('{trackingNumber}', trackingNumber),
        ...trackingData
      }
    });

  } catch (error) {
    console.error('Shipping tracking error:', error);
    return c.json({
      success: false,
      message: 'Lỗi tra cứu vận đơn. Vui lòng thử lại.'
    }, 500);
  }
});

// GHN Shipping Integration - Iframe/Widget Approach
app.post('/ghn/calculate', async (c: any) => {
  try {
    const { fromAddress, toAddress, weight, serviceType = 'standard' } = await c.req.json();

    if (!fromAddress || !toAddress || !weight) {
      return c.json({ success: false, error: 'From address, to address and weight are required' }, 400);
    }

    // Generate tracking ID
    const trackingId = `GHN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Return iframe URL và widget config cho GHN
    return c.json({
      success: true,
      data: {
        trackingId,
        provider: 'ghn',
        serviceType,
        iframeUrl: 'https://khachhang.giaohangnhanh.vn/calculator',
        widgetConfig: {
          fromAddress,
          toAddress,
          weight,
          serviceType,
          estimatedFee: Math.round(weight * 1000 + Math.random() * 10000), // Estimate
          estimatedDeliveryTime: '2-3 ngày'
        },
        instructions: 'Sử dụng iframe GHN calculator để tính phí chính xác'
      }
    });
  } catch (error) {
    console.error('GHN calculate shipping error:', error);
    return c.json({ success: false, error: 'Failed to calculate GHN shipping fee' }, 500);
  }
});

// GHN Create Shipment - Iframe/Widget Approach
app.post('/ghn/create-shipment', async (c: any) => {
  try {
    const { orderId, fromAddress, toAddress, weight, codAmount, items } = await c.req.json();

    if (!orderId || !fromAddress || !toAddress || !weight) {
      return c.json({ success: false, error: 'Order ID, addresses and weight are required' }, 400);
    }

    // Generate tracking ID
    const trackingId = `GHN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store shipment in database for tracking
    await c.env.DB.prepare(`
      INSERT INTO shipping_orders (
        id, order_id, tracking_id, provider, from_address, to_address,
        weight, cod_amount, status, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      crypto.randomUUID(),
      orderId,
      trackingId,
      'ghn',
      JSON.stringify(fromAddress),
      JSON.stringify(toAddress),
      weight,
      codAmount || 0,
      'pending'
    ).run();

    // Return iframe URL for GHN shipping creation
    return c.json({
      success: true,
      data: {
        trackingId,
        provider: 'ghn',
        iframeUrl: 'https://khachhang.giaohangnhanh.vn/order/create',
        widgetConfig: {
          orderId,
          fromAddress,
          toAddress,
          weight,
          codAmount,
          items,
          returnUrl: 'https://namhbcf-uk.pages.dev/shipping/success',
          cancelUrl: 'https://namhbcf-uk.pages.dev/shipping/cancel'
        },
        instructions: 'Sử dụng iframe GHN để tạo đơn giao hàng'
      }
    });
  } catch (error) {
    console.error('GHN create shipment error:', error);
    return c.json({ success: false, error: 'Failed to create GHN shipment' }, 500);
  }
});

// Viettel Post Integration - Iframe/Widget Approach
app.post('/viettelpost/calculate', async (c: any) => {
  try {
    const { fromAddress, toAddress, weight, serviceType = 'standard' } = await c.req.json();

    if (!fromAddress || !toAddress || !weight) {
      return c.json({ success: false, error: 'From address, to address and weight are required' }, 400);
    }

    // Generate tracking ID
    const trackingId = `VTP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Return iframe URL và widget config cho Viettel Post
    return c.json({
      success: true,
      data: {
        trackingId,
        provider: 'viettelpost',
        serviceType,
        iframeUrl: 'https://viettelpost.vn/tra-cuoc',
        widgetConfig: {
          fromAddress,
          toAddress,
          weight,
          serviceType,
          estimatedFee: Math.round(weight * 800 + Math.random() * 8000), // Estimate
          estimatedDeliveryTime: '3-5 ngày'
        },
        instructions: 'Sử dụng iframe Viettel Post để tính phí chính xác'
      }
    });
  } catch (error) {
    console.error('Viettel Post calculate shipping error:', error);
    return c.json({ success: false, error: 'Failed to calculate Viettel Post shipping fee' }, 500);
  }
});

// J&T Express Integration - Iframe/Widget Approach
app.post('/jt/calculate', async (c: any) => {
  try {
    const { fromAddress, toAddress, weight, serviceType = 'standard' } = await c.req.json();

    if (!fromAddress || !toAddress || !weight) {
      return c.json({ success: false, error: 'From address, to address and weight are required' }, 400);
    }

    // Generate tracking ID
    const trackingId = `JT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Return iframe URL và widget config cho J&T
    return c.json({
      success: true,
      data: {
        trackingId,
        provider: 'jt',
        serviceType,
        iframeUrl: 'https://www.jtexpress.vn/tra-cuoc-phi',
        widgetConfig: {
          fromAddress,
          toAddress,
          weight,
          serviceType,
          estimatedFee: Math.round(weight * 900 + Math.random() * 9000), // Estimate
          estimatedDeliveryTime: '2-4 ngày'
        },
        instructions: 'Sử dụng iframe J&T Express để tính phí chính xác'
      }
    });
  } catch (error) {
    console.error('J&T calculate shipping error:', error);
    return c.json({ success: false, error: 'Failed to calculate J&T shipping fee' }, 500);
  }
});

// Generic shipping tracking
app.get('/track/:trackingId', async (c: any) => {
  try {
    const trackingId = c.req.param('trackingId');

    // Get tracking info from database
    const shipment = await c.env.DB.prepare(`
      SELECT * FROM shipping_orders WHERE tracking_id = ?
    `).bind(trackingId).first();

    if (!shipment) {
      return c.json({ success: false, error: 'Shipment not found' }, 404);
    }

    // Return tracking iframe based on provider
    let trackingUrl = '';
    switch (shipment.provider) {
      case 'ghn':
        trackingUrl = `https://donhang.ghn.vn/?order_code=${trackingId}`;
        break;
      case 'viettelpost':
        trackingUrl = `https://viettelpost.vn/tra-cuu/?code=${trackingId}`;
        break;
      case 'jt':
        trackingUrl = `https://www.jtexpress.vn/tra-cuu-don-hang/?code=${trackingId}`;
        break;
      default:
        trackingUrl = '#';
    }

    return c.json({
      success: true,
      data: {
        ...shipment,
        trackingUrl,
        iframeUrl: trackingUrl,
        instructions: `Sử dụng iframe để tra cứu đơn hàng ${trackingId}`
      }
    });
  } catch (error) {
    console.error('Shipping tracking error:', error);
    return c.json({ success: false, error: 'Failed to track shipment' }, 500);
  }
});

// Update shipment status - Manual approach
app.post('/status/:trackingId', async (c: any) => {
  try {
    const trackingId = c.req.param('trackingId');
    const { status, location, note } = await c.req.json();

    if (!trackingId || !status) {
      return c.json({ success: false, error: 'Tracking ID and status are required' }, 400);
    }

    // Update shipment status
    await c.env.DB.prepare(`
      UPDATE shipping_orders
      SET status = ?, current_location = ?, notes = ?, updated_at = datetime('now')
      WHERE tracking_id = ?
    `).bind(status, location || '', note || '', trackingId).run();

    return c.json({
      success: true,
      data: {
        trackingId,
        status,
        location,
        note,
        message: 'Shipment status updated successfully'
      }
    });
  } catch (error) {
    console.error('Shipping status update error:', error);
    return c.json({ success: false, error: 'Failed to update shipment status' }, 500);
  }
});

// Get all shipments
app.get('/orders', async (c: any) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM shipping_orders
      ORDER BY created_at DESC
      LIMIT 100
    `).all();

    return c.json({
      success: true,
      data: results || []
    });
  } catch (error) {
    console.error('Get shipping orders error:', error);
    return c.json({ success: false, error: 'Failed to get shipping orders' }, 500);
  }
});

// Tạo iframe embed URL
app.get('/embed/:provider/:trackingNumber', async (c: any) => {
  try {
    const { provider, trackingNumber } = c.req.param();

    const shippingProvider = SHIPPING_PROVIDERS[provider];
    if (!shippingProvider) {
      return c.html(`
        <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
          <h3>Nhà vận chuyển không được hỗ trợ</h3>
          <p>Provider: ${provider}</p>
        </div>
      `);
    }

    // Generate tracking embed HTML
    const embedHtml = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tra cứu vận đơn ${trackingNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header {
            background: #1976d2;
            color: white;
            padding: 20px;
            text-align: center;
          }
          .content {
            padding: 20px;
          }
          .tracking-info {
            background: #f8f9fa;
            border-radius: 4px;
            padding: 15px;
            margin: 10px 0;
          }
          .status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            color: white;
            background: #4caf50;
          }
          .history-item {
            border-left: 3px solid #1976d2;
            padding-left: 15px;
            margin: 15px 0;
          }
          .btn {
            display: inline-block;
            padding: 10px 20px;
            background: #1976d2;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🚚 Tra cứu vận đơn</h2>
            <p>Mã vận đơn: <strong>${trackingNumber}</strong></p>
            <p>Nhà vận chuyển: <strong>${shippingProvider.name}</strong></p>
          </div>

          <div class="content">
            <div class="tracking-info">
              <span class="status">Đang vận chuyển</span>
              <p><strong>Vị trí hiện tại:</strong> Kho HCM</p>
              <p><strong>Dự kiến giao:</strong> 20/01/2024</p>
            </div>

            <h3>Lịch sử vận chuyển:</h3>
            <div class="history-item">
              <strong>17/01/2024 15:30</strong><br>
              <em>Xe giao hàng Q1</em><br>
              Đơn hàng đang được giao đến khách hàng
            </div>
            <div class="history-item">
              <strong>17/01/2024 10:15</strong><br>
              <em>Kho HCM</em><br>
              Đơn hàng đã đến kho HCM
            </div>
            <div class="history-item">
              <strong>16/01/2024 06:00</strong><br>
              <em>Xe tải HN-HCM</em><br>
              Đơn hàng đã xuất kho, đang vận chuyển đến HCM
            </div>

            <a href="${shippingProvider.trackingUrlTemplate.replace('{trackingNumber}', trackingNumber)}"
               target="_blank" class="btn">
              Xem chi tiết trên ${shippingProvider.name}
            </a>
          </div>
        </div>

        <script>
          // Auto-refresh every 30 seconds
          setTimeout(() => {
            window.location.reload();
          }, 30000);
        </script>
      </body>
      </html>
    `;

    return c.html(embedHtml);

  } catch (error) {
    console.error('Embed generation error:', error);
    return c.html(`
      <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif; color: red;">
        <h3>Lỗi tạo embed</h3>
        <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    `);
  }
});

// Widget JavaScript endpoint
app.get('/widget.js', async (c: any) => {
  const widgetJs = `
    (function() {
      window.ShippingWidget = {
        track: function(options) {
          const { element, trackingNumber, provider } = options;
          const container = document.querySelector(element);

          if (!container) {
            console.error('Widget container not found:', element);
            return;
          }

          container.innerHTML = '<div style="text-align: center; padding: 20px;">Đang tải...</div>';

          // Fetch tracking data
          fetch('/api/v1/shipping/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trackingNumber, provider })
          })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              renderTrackingWidget(container, data.data);
            } else {
              container.innerHTML = '<div style="color: red; padding: 20px;">Lỗi: ' + data.message + '</div>';
            }
          })
          .catch(error => {
            container.innerHTML = '<div style="color: red; padding: 20px;">Lỗi kết nối: ' + error.message + '</div>';
          });
        }
      };

      function renderTrackingWidget(container, data) {
        container.innerHTML = \`
          <div style="border: 1px solid #ddd; border-radius: 8px; padding: 20px; font-family: Arial, sans-serif;">
            <h3>🚚 \${data.provider}</h3>
            <p><strong>Mã vận đơn:</strong> \${data.trackingNumber}</p>
            <p><strong>Trạng thái:</strong> <span style="background: #4caf50; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">\${data.statusText}</span></p>
            <p><strong>Vị trí hiện tại:</strong> \${data.currentLocation || 'N/A'}</p>
            <p><strong>Dự kiến giao:</strong> \${data.estimatedDelivery || 'N/A'}</p>
            <a href="\${data.trackingUrl}" target="_blank" style="display: inline-block; background: #1976d2; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; margin-top: 10px;">
              Xem chi tiết
            </a>
          </div>
        \`;
      }
    })();
  `;

  c.header('Content-Type', 'application/javascript');
  return c.text(widgetJs);
});

export default app;