/**
 * InventorySyncObject - Durable Object quản lý đồng bộ kho hàng
 */

export class InventorySyncObject {
  private state: DurableObjectState;
  private clients: Map<string, WebSocket> = new Map();
  private inventoryState: Map<string, any> = new Map();

  constructor(state: DurableObjectState) {
    this.state = state;
    
    // Khôi phục inventory state từ storage
    this.state.blockConcurrencyWhile(async () => {
      const storedInventory = await this.state.storage.get('inventory');
      if (storedInventory) {
        this.inventoryState = new Map(Object.entries(storedInventory));
      }
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // WebSocket endpoint cho real-time sync
    if (path === '/sync') {
      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('Expected Upgrade: websocket', { status: 426 });
      }
      
      // Tạo WebSocket connection
      const pair = new WebSocketPair();
      const client = pair[0];
      const server = pair[1];
      
      // Accept the WebSocket connection
      server.accept();
      
      // Parse thông tin client từ URL query
      const clientId = url.searchParams.get('clientId') || crypto.randomUUID();
      const storeId = url.searchParams.get('storeId') || '1';
      const clientKey = `${storeId}:${clientId}`;
      
      // Gửi inventory state hiện tại tới client
      server.send(JSON.stringify({
        type: 'init',
        data: Object.fromEntries(this.inventoryState)
      }));
      
      // Xử lý sự kiện từ client
      server.addEventListener('message', async (event) => {
        try {
          const message = JSON.parse(event.data as string);
          await this.handleMessage(clientKey, server, message);
        } catch (error) {
          server.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
        }
      });
      
      // Xử lý sự kiện đóng kết nối
      server.addEventListener('close', () => {
        this.clients.delete(clientKey);
      });
      
      // Xử lý lỗi
      server.addEventListener('error', () => {
        this.clients.delete(clientKey);
      });
      
      // Lưu WebSocket vào clients
      this.clients.set(clientKey, server);
      
      return new Response(null, {
        status: 101,
        webSocket: client
      });
    }
    
    // REST API endpoints để cập nhật inventory
    if (path === '/update' && request.method === 'POST') {
      try {
        const { productId, quantity, action, storeId = '1' } = await request.json();
        
        if (!productId || quantity === undefined || !action) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Missing required fields'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // Cập nhật inventory state
        await this.updateInventory(productId, quantity, action, storeId);
        
        return new Response(JSON.stringify({
          success: true,
          message: 'Inventory updated successfully'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          message: 'Error updating inventory',
          error: error instanceof Error ? error.message : 'Unknown error'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    return new Response('Not found', { status: 404 });
  }
  
  // Xử lý tin nhắn từ client
  private async handleMessage(clientKey: string, client: WebSocket, message: any) {
    const { type, data } = message;
    
    if (!type) {
      client.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
      return;
    }
    
    switch (type) {
      case 'ping':
        client.send(JSON.stringify({
          type: 'pong',
          timestamp: new Date().toISOString()
        }));
        break;
        
      case 'update':
        if (!data || !data.productId || data.quantity === undefined || !data.action) {
          client.send(JSON.stringify({
            type: 'error',
            message: 'Invalid update data'
          }));
          return;
        }
        
        const { productId, quantity, action, storeId = '1' } = data;
        
        // Cập nhật inventory state
        await this.updateInventory(productId, quantity, action, storeId);
        
        // Xác nhận cập nhật thành công
        client.send(JSON.stringify({
          type: 'update_ack',
          data: {
            productId,
            success: true,
            timestamp: new Date().toISOString()
          }
        }));
        break;
        
      default:
        client.send(JSON.stringify({
          type: 'error',
          message: 'Unknown message type'
        }));
    }
  }
  
  // Cập nhật inventory và broadcast
  private async updateInventory(productId: string, quantity: number, action: string, storeId: string) {
    // Khóa state để đảm bảo atomic updates
    await this.state.blockConcurrencyWhile(async () => {
      const inventoryKey = `${storeId}:${productId}`;
      const currentInventory = this.inventoryState.get(inventoryKey) || { quantity: 0 };
      
      // Tính toán số lượng mới
      let newQuantity = currentInventory.quantity;
      
      switch (action) {
        case 'add':
          newQuantity += quantity;
          break;
        case 'subtract':
          newQuantity = Math.max(0, newQuantity - quantity); // Không cho phép số âm
          break;
        case 'set':
          newQuantity = Math.max(0, quantity); // Không cho phép số âm
          break;
        default:
          throw new Error(`Invalid action: ${action}`);
      }
      
      // Cập nhật inventory state
      const updatedInventory = {
        ...currentInventory,
        quantity: newQuantity,
        updatedAt: new Date().toISOString()
      };
      
      this.inventoryState.set(inventoryKey, updatedInventory);
      
      // Lưu vào storage
      await this.state.storage.put('inventory', Object.fromEntries(this.inventoryState));
      
      // Broadcast cập nhật tới tất cả clients
      this.broadcastUpdate(inventoryKey, updatedInventory);
    });
  }
  
  // Broadcast cập nhật tới tất cả clients
  private broadcastUpdate(inventoryKey: string, inventoryData: any) {
    const [storeId] = inventoryKey.split(':');
    const updateMessage = JSON.stringify({
      type: 'inventory_update',
      data: {
        key: inventoryKey,
        ...inventoryData
      }
    });
    
    // Gửi tới tất cả clients trong cùng store
    for (const [clientKey, client] of this.clients.entries()) {
      const [clientStoreId] = clientKey.split(':');
      
      // Chỉ gửi tới clients trong cùng store
      if (clientStoreId === storeId) {
        try {
          client.send(updateMessage);
        } catch (error) {
          // Client có thể đã đóng kết nối
          this.clients.delete(clientKey);
        }
      }
    }
  }
} 