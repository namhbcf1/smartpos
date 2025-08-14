/**
 * NotificationObject - Durable Object cho quản lý thông báo thời gian thực
 */

export class NotificationObject {
  private state: DurableObjectState;
  private sessions: Set<WebSocket> = new Set();
  private messageBuffer: any[] = [];
  private maxBufferSize = 100;

  constructor(state: DurableObjectState) {
    this.state = state;
    
    // Khôi phục messageBuffer từ storage nếu có
    this.state.blockConcurrencyWhile(async () => {
      const storedBuffer = await this.state.storage.get('messageBuffer');
      if (storedBuffer) {
        this.messageBuffer = storedBuffer;
      }
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    console.log(`📡 NotificationObject received request: ${request.method} ${path}`);

    // WebSocket endpoint - handle both /connect and / paths
    if (path === '/connect' || path === '/' || path === '/ws') {
      console.log('🔍 WebSocket request details:', {
        path,
        upgrade: request.headers.get('Upgrade'),
        connection: request.headers.get('Connection'),
        'sec-websocket-key': request.headers.get('Sec-WebSocket-Key'),
        'sec-websocket-version': request.headers.get('Sec-WebSocket-Version'),
        origin: request.headers.get('Origin')
      });

      const upgradeHeader = request.headers.get('Upgrade');
      if (upgradeHeader !== 'websocket') {
        console.log(`❌ Invalid upgrade header: ${upgradeHeader}`);
        return new Response('Expected Upgrade: websocket', {
          status: 426,
          headers: {
            'Content-Type': 'application/json',
            'Upgrade': 'websocket'
          }
        });
      }

      try {
        console.log('🔗 Creating WebSocket pair...');
        const pair = new WebSocketPair();
        const client = pair[0];
        const server = pair[1];

        // Accept the WebSocket connection
        server.accept();
        console.log('✅ WebSocket connection accepted');

      // Generate connection ID
      const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Send welcome message
      server.send(JSON.stringify({
        type: 'connected',
        data: {
          connectionId,
          timestamp: new Date().toISOString(),
          message: 'Connected to SmartPOS real-time service',
          sessionCount: this.sessions.size
        }
      }));

      // Send message history
      for (const message of this.messageBuffer) {
        try {
          server.send(JSON.stringify(message));
        } catch (error) {
          console.error('Error sending buffered message:', error);
        }
      }

      // Handle messages from client
      server.addEventListener('message', async (event) => {
        try {
          const message = JSON.parse(event.data as string);
          console.log(`📨 Received message from client:`, message.type);
          await this.handleMessage(server, message);
        } catch (error) {
          console.error('Error parsing client message:', error);
          server.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format',
            timestamp: new Date().toISOString()
          }));
        }
      });

      // Handle connection close
      server.addEventListener('close', (event) => {
        this.sessions.delete(server);
        console.log(`🔌 WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason}. Remaining sessions: ${this.sessions.size}`);
      });

      // Handle connection error
      server.addEventListener('error', (event) => {
        this.sessions.delete(server);
        console.log(`❌ WebSocket connection error. Remaining sessions: ${this.sessions.size}`);
      });

        // Add to sessions
        this.sessions.add(server);
        console.log(`🔗 WebSocket connected successfully. Total sessions: ${this.sessions.size}`);

        return new Response(null, {
          status: 101,
          webSocket: client
        });
      } catch (error) {
        console.error('❌ Error creating WebSocket connection:', error);
        return new Response(JSON.stringify({
          success: false,
          message: 'Failed to create WebSocket connection',
          error: error instanceof Error ? error.message : 'Unknown error'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // REST API endpoints
    if (path === '/broadcast' && request.method === 'POST') {
      const message = await request.json();
      
      // Xác thực message
      if (!message.type || !message.data) {
        return new Response(JSON.stringify({ 
          error: 'Invalid message format' 
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Thêm timestamp
      message.timestamp = new Date().toISOString();
      
      // Broadcast tin nhắn
      this.broadcastMessage(message);
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Message broadcasted successfully'
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Endpoint không tồn tại
    return new Response('Not found', { status: 404 });
  }
  
  // Xử lý tin nhắn từ client
  private async handleMessage(client: WebSocket, message: any) {
    // Xác thực message
    if (!message.type) {
      client.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format',
        timestamp: new Date().toISOString()
      }));
      return;
    }

    switch (message.type) {
      case 'ping':
        client.send(JSON.stringify({
          type: 'pong',
          timestamp: new Date().toISOString()
        }));
        break;

      case 'subscribe':
        // Handle subscription requests
        const subscriptionType = message.data?.type;
        client.send(JSON.stringify({
          type: 'subscription_confirmed',
          data: {
            type: subscriptionType,
            subscribed: true
          },
          timestamp: new Date().toISOString()
        }));
        console.log(`📡 Client subscribed to: ${subscriptionType}`);
        break;

      case 'unsubscribe':
        // Handle unsubscription requests
        const unsubscriptionType = message.data?.type;
        client.send(JSON.stringify({
          type: 'unsubscription_confirmed',
          data: {
            type: unsubscriptionType,
            subscribed: false
          },
          timestamp: new Date().toISOString()
        }));
        console.log(`📡 Client unsubscribed from: ${unsubscriptionType}`);
        break;

      case 'message':
        // Thêm timestamp
        message.timestamp = new Date().toISOString();

        // Broadcast tin nhắn
        this.broadcastMessage(message);
        break;

      default:
        client.send(JSON.stringify({
          type: 'error',
          message: 'Unknown message type',
          timestamp: new Date().toISOString()
        }));
    }
  }
  
  // Broadcast tin nhắn tới tất cả clients
  private broadcastMessage(message: any) {
    // Lưu tin nhắn vào buffer
    this.messageBuffer.push(message);
    
    // Giới hạn kích thước buffer
    if (this.messageBuffer.length > this.maxBufferSize) {
      this.messageBuffer.shift(); // Xóa tin nhắn cũ nhất
    }
    
    // Lưu buffer vào storage
    this.state.storage.put('messageBuffer', this.messageBuffer);
    
    // Broadcast tới tất cả sessions
    const messageStr = JSON.stringify(message);
    for (const session of this.sessions) {
      try {
        session.send(messageStr);
      } catch (error) {
        // Có thể session đã bị đóng
        this.sessions.delete(session);
      }
    }
  }
} 