import { Hono } from 'hono';
import { Env } from '../../types';

const app = new Hono<{ Bindings: Env }>();

// Mock data for Vietnamese computer hardware store
const mockNotifications = [
  {
    id: '1',
    type: 'system',
    title: 'Hàng mới về kho',
    message: 'Laptop Gaming ASUS ROG vừa được nhập về. Kiểm tra ngay!',
    status: 'unread',
    priority: 'high',
    created_at: '2025-01-14T08:00:00Z',
    user_id: 'user1'
  },
  {
    id: '2',
    type: 'order',
    title: 'Đơn hàng cần xử lý',
    message: 'Đơn hàng #ORD-001 đang chờ xác nhận từ khách hàng',
    status: 'read',
    priority: 'medium',
    created_at: '2025-01-14T07:30:00Z',
    user_id: 'user1'
  },
  {
    id: '3',
    type: 'promotion',
    title: 'Khuyến mãi hấp dẫn',
    message: 'Giảm giá 20% cho tất cả card đồ họa RTX 40 series. Áp dụng đến 31/01/2025',
    status: 'unread',
    priority: 'low',
    created_at: '2025-01-14T07:00:00Z',
    user_id: 'user1'
  }
];

const mockTemplates = [
  {
    id: '1',
    name: 'Thông báo hàng về',
    type: 'email',
    subject: 'Sản phẩm {{product_name}} đã có hàng',
    content: 'Chào {{customer_name}},\n\nSản phẩm {{product_name}} mà bạn quan tâm đã có hàng tại cửa hàng.\n\nGiá: {{price}}\nSố lượng: {{quantity}}\n\nHãy liên hệ ngay để đặt hàng!',
    variables: ['customer_name', 'product_name', 'price', 'quantity'],
    created_at: '2025-01-14T00:00:00Z'
  },
  {
    id: '2',
    name: 'Xác nhận đơn hàng',
    type: 'sms',
    subject: '',
    content: 'Đơn hàng #{{order_id}} đã được xác nhận. Tổng tiền: {{total}}. Cảm ơn {{customer_name}}!',
    variables: ['order_id', 'total', 'customer_name'],
    created_at: '2025-01-14T00:00:00Z'
  }
];

// Email notification service (now with mock data)
const sendEmail = async (to: string, subject: string, content: string) => {
  try {
    console.log('Email sent (mock):', { to, subject, content: content.substring(0, 100) + '...' });
    const emailId = crypto.randomUUID();
    return { success: true, id: emailId };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Lỗi không xác định' };
  }
};

// SMS notification service (now with mock data)
const sendSMS = async (to: string, message: string) => {
  try {
    console.log('SMS sent (mock):', { to, message: message.substring(0, 50) + '...' });
    const smsId = crypto.randomUUID();
    return { success: true, id: smsId };
  } catch (error) {
    console.error('SMS send error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Lỗi không xác định' };
  }
};

// GET /api/notifications - Get notifications list
app.get('/', async (c: any) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');
    const type = c.req.query('type');
    const status = c.req.query('status');

    let filteredNotifications = [...mockNotifications];

    if (type) {
      filteredNotifications = filteredNotifications.filter(n => n.type === type);
    }

    if (status) {
      filteredNotifications = filteredNotifications.filter(n => n.status === status);
    }

    const total = filteredNotifications.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredNotifications.slice(startIndex, endIndex);

    return c.json({
      success: true,
      data: paginatedData,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      message: 'Danh sách thông báo được tải thành công'
    });
  } catch (error) {
    console.error('Notifications list error:', error);
    return c.json({
      success: false,
      message: 'Không thể tải danh sách thông báo',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    }, 500);
  }
});

// POST /api/notifications/email - Send email notification
app.post('/email', async (c: any) => {
  try {
    const requestBody = await c.req.json();
    const { to, subject, template, data } = requestBody;
    // Accept both 'content' and 'body' fields for compatibility
    const content = requestBody.content || requestBody.body;

    if (!to || !subject || !content) {
      return c.json({
        success: false,
        message: 'Missing required fields: to, subject, content'
      }, 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return c.json({
        success: false,
        message: 'Invalid email format'
      }, 400);
    }

    // Process template if provided
    let finalContent = content;
    if (template && data) {
      // Simple template processing - replace {{key}} with data[key]
      finalContent = content.replace(/\{\{(\w+)\}\}/g, (match: any, key: any) => {
        return data[key] || match;
      });
    }

    const result = await sendEmail(to, subject, finalContent);

    if (result.success) {
      return c.json({
        success: true,
        data: {
          id: result.id,
          to,
          subject,
          sent_at: new Date().toISOString()
        },
        message: 'Email đã được gửi thành công'
      });
    } else {
      return c.json({
        success: false,
        message: 'Không thể gửi email',
        error: result.error
      }, 500);
    }

  } catch (error) {
    console.error('Email notification error:', error);
    return c.json({
      success: false,
      message: 'Không thể gửi thông báo email',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    }, 500);
  }
});

// POST /api/notifications/sms - Send SMS notification
app.post('/sms', async (c: any) => {
  try {
    const { to, message, template, data } = await c.req.json();

    if (!to || !message) {
      return c.json({
        success: false,
        message: 'Missing required fields: to, message'
      }, 400);
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(to.replace(/\s/g, ''))) {
      return c.json({
        success: false,
        message: 'Invalid phone number format'
      }, 400);
    }

    // Process template if provided
    let finalMessage = message;
    if (template && data) {
      // Simple template processing - replace {{key}} with data[key]
      finalMessage = message.replace(/\{\{(\w+)\}\}/g, (match: any, key: any) => {
        return data[key] || match;
      });
    }

    const result = await sendSMS(to, finalMessage);

    if (result.success) {
      return c.json({
        success: true,
        data: {
          id: result.id,
          to,
          sent_at: new Date().toISOString()
        },
        message: 'SMS đã được gửi thành công'
      });
    } else {
      return c.json({
        success: false,
        message: 'Không thể gửi SMS',
        error: result.error
      }, 500);
    }

  } catch (error) {
    console.error('SMS notification error:', error);
    return c.json({
      success: false,
      message: 'Không thể gửi thông báo SMS',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    }, 500);
  }
});

// POST /api/notifications/bulk - Send bulk notifications
app.post('/bulk', async (c: any) => {
  try {
    const { type, recipients, subject, content, template, data } = await c.req.json();

    if (!type || !recipients || !content) {
      return c.json({
        success: false,
        message: 'Missing required fields: type, recipients, content'
      }, 400);
    }

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return c.json({
        success: false,
        message: 'Recipients must be a non-empty array'
      }, 400);
    }

    const results = [];
    const errors = [];

    for (const recipient of recipients) {
      try {
        if (type === 'email') {
          const result = await sendEmail(
            recipient.email || recipient,
            subject || 'Thông báo',
            content
          );
          
          if (result.success) {
            results.push({
              type: 'email',
              recipient: recipient.email || recipient,
              id: result.id
            });
          } else {
            errors.push({
              type: 'email',
              recipient: recipient.email || recipient,
              error: result.error
            });
          }
        } else if (type === 'sms') {
          const result = await sendSMS(
            recipient.phone || recipient,
            content
          );
          
          if (result.success) {
            results.push({
              type: 'sms',
              recipient: recipient.phone || recipient,
              id: result.id
            });
          } else {
            errors.push({
              type: 'sms',
              recipient: recipient.phone || recipient,
              error: result.error
            });
          }
        }
      } catch (error) {
        errors.push({
          type,
          recipient: recipient.email || recipient.phone || recipient,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return c.json({
      success: true,
      data: {
        sent: results,
        errors: errors
      },
      message: `Đã gửi ${results.length} thông báo thành công${errors.length > 0 ? `, ${errors.length} thất bại` : ''}`
    });

  } catch (error) {
    console.error('Bulk notification error:', error);
    return c.json({
      success: false,
      message: 'Không thể gửi thông báo hàng loạt',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    }, 500);
  }
});

// GET /api/notifications/history - Get notification history
app.get('/history', async (c: any) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const type = c.req.query('type'); // 'email' or 'sms'
    const status = c.req.query('status'); // 'sent', 'failed', 'pending'

    // Mock notification history data
    const mockHistory = [
      {
        id: '1',
        type: 'email',
        recipient: 'customer1@example.com',
        subject: 'Thông báo hàng về',
        content: 'Laptop Gaming ASUS ROG đã có hàng. Liên hệ ngay!',
        status: 'sent',
        sent_at: '2025-01-14T08:00:00Z',
        created_at: '2025-01-14T08:00:00Z'
      },
      {
        id: '2',
        type: 'sms',
        recipient: '+84901234567',
        subject: '',
        content: 'Đơn hàng #ORD-001 đã được xác nhận. Cảm ơn bạn!',
        status: 'sent',
        sent_at: '2025-01-14T07:30:00Z',
        created_at: '2025-01-14T07:30:00Z'
      },
      {
        id: '3',
        type: 'email',
        recipient: 'customer2@example.com',
        subject: 'Khuyến mãi đặc biệt',
        content: 'Giảm giá 20% cho card đồ họa RTX 40 series',
        status: 'sent',
        sent_at: '2025-01-14T07:00:00Z',
        created_at: '2025-01-14T07:00:00Z'
      }
    ];

    let filteredHistory = [...mockHistory];

    if (type) {
      filteredHistory = filteredHistory.filter(h => h.type === type);
    }

    if (status) {
      filteredHistory = filteredHistory.filter(h => h.status === status);
    }

    const total = filteredHistory.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredHistory.slice(startIndex, endIndex);

    return c.json({
      success: true,
      data: paginatedData,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      message: 'Lịch sử thông báo được tải thành công'
    });

  } catch (error) {
    console.error('Notification history error:', error);
    return c.json({
      success: false,
      message: 'Không thể tải lịch sử thông báo',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    }, 500);
  }
});

// POST /api/notifications/templates - Create notification template
app.post('/templates', async (c: any) => {
  try {
    const { name, type, subject, content, variables } = await c.req.json();

    if (!name || !type || !content) {
      return c.json({
        success: false,
        message: 'Missing required fields: name, type, content'
      }, 400);
    }

    const templateId = crypto.randomUUID();

    // Add to mock templates array
    const newTemplate = {
      id: templateId,
      name,
      type,
      subject: subject || '',
      content,
      variables: variables || [],
      created_at: new Date().toISOString()
    };

    mockTemplates.push(newTemplate);

    return c.json({
      success: true,
      data: newTemplate,
      message: 'Mẫu thông báo đã được tạo thành công'
    });

  } catch (error) {
    console.error('Template creation error:', error);
    return c.json({
      success: false,
      message: 'Không thể tạo mẫu thông báo',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    }, 500);
  }
});

// GET /api/notifications/templates - Get notification templates
app.get('/templates', async (c: any) => {
  try {
    const type = c.req.query('type'); // 'email' or 'sms'

    let filteredTemplates = [...mockTemplates];

    if (type) {
      filteredTemplates = filteredTemplates.filter(t => t.type === type);
    }

    return c.json({
      success: true,
      data: filteredTemplates,
      message: 'Danh sách mẫu thông báo được tải thành công'
    });

  } catch (error) {
    console.error('Templates list error:', error);
    return c.json({
      success: false,
      message: 'Không thể tải danh sách mẫu thông báo',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    }, 500);
  }
});

// POST /api/notifications/push - Send push notification
app.post('/push', async (c: any) => {
  try {
    const { token, title, body, data } = await c.req.json();

    if (!token || !title || !body) {
      return c.json({
        success: false,
        message: 'Missing required fields: token, title, body'
      }, 400);
    }

    // Mock push notification sending
    const pushId = crypto.randomUUID();
    console.log('Push notification sent (mock):', { token, title, body });

    return c.json({
      success: true,
      data: {
        id: pushId,
        token,
        title,
        body,
        sent_at: new Date().toISOString()
      },
      message: 'Thông báo đẩy đã được gửi thành công'
    });

  } catch (error) {
    console.error('Push notification error:', error);
    return c.json({
      success: false,
      message: 'Không thể gửi thông báo đẩy',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    }, 500);
  }
});

// GET /api/notifications/stream - Realtime notification stream (SSE)
app.get('/stream', async (c: any) => {
  try {
    // Set SSE headers
    c.header('Content-Type', 'text/event-stream');
    c.header('Cache-Control', 'no-cache');
    c.header('Connection', 'keep-alive');
    c.header('Access-Control-Allow-Origin', '*');

    // Send initial connection event
    const initialData = {
      type: 'connection',
      message: 'Kết nối thành công với máy chủ thông báo',
      timestamp: new Date().toISOString()
    };

    // Mock realtime notifications for computer hardware store
    const mockRealtimeData = [
      {
        type: 'stock_update',
        message: 'CPU Intel Core i9-13900K vừa được nhập về kho',
        timestamp: new Date().toISOString()
      },
      {
        type: 'order_alert',
        message: 'Có đơn hàng mới cần xử lý - #ORD-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        timestamp: new Date().toISOString()
      }
    ];

    return c.json({
      success: true,
      data: {
        connection: initialData,
        sample_events: mockRealtimeData
      },
      message: 'Luồng thông báo thời gian thực đã được khởi tạo'
    });

  } catch (error) {
    console.error('Realtime stream error:', error);
    return c.json({
      success: false,
      message: 'Không thể khởi tạo luồng thông báo thời gian thực',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    }, 500);
  }
});

// GET /api/notifications/heartbeat - Health check for notification service
app.get('/heartbeat', async (c: any) => {
  try {
    const timestamp = new Date().toISOString();

    return c.json({
      success: true,
      data: {
        status: 'healthy',
        service: 'notifications',
        timestamp,
        uptime: 0, // Not available in Cloudflare Workers
        version: '1.0.0'
      },
      message: 'Dịch vụ thông báo đang hoạt động bình thường'
    });

  } catch (error) {
    console.error('Heartbeat error:', error);
    return c.json({
      success: false,
      message: 'Dịch vụ thông báo gặp lỗi',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    }, 500);
  }
});

export default app;