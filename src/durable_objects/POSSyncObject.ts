/**
 * POSSyncObject - Durable Object cho đồng bộ POS
 */

export class POSSyncObject {
  private state: DurableObjectState;
  private sessions: Set<WebSocket> = new Set();
  private activeTransactions: Map<string, any> = new Map();

  constructor(state: DurableObjectState) {
    this.state = state;
    
    // Khôi phục state từ storage
    this.state.blockConcurrencyWhile(async () => {
      const storedTransactions = await this.state.storage.get('activeTransactions');
      if (storedTransactions) {
        this.activeTransactions = new Map(Object.entries(storedTransactions));
      }
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // WebSocket endpoint
    if (path === '/connect') {
      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('Expected Upgrade: websocket', { status: 426 });
      }
      
      // Create websocket pair
      const pair = new WebSocketPair();
      const client = pair[0];
      const server = pair[1];
      
      // Accept the connection
      server.accept();
      
      // Parse metadata
      const storeId = url.searchParams.get('storeId') || '1';
      const deviceId = url.searchParams.get('deviceId') || 'unknown';
      const clientId = `${storeId}:${deviceId}`;
      
      // Send initial data
      server.send(JSON.stringify({
        type: 'init',
        storeId,
        deviceId,
        activeTransactions: Object.fromEntries(this.activeTransactions)
      }));
      
      // Handle messages
      server.addEventListener('message', async event => {
        try {
          const message = JSON.parse(event.data as string);
          await this.handleMessage(clientId, server, message);
        } catch (error) {
          server.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
        }
      });
      
      // Handle close
      server.addEventListener('close', () => {
        this.sessions.delete(server);
      });
      
      // Handle errors
      server.addEventListener('error', () => {
        this.sessions.delete(server);
      });
      
      // Add to sessions
      this.sessions.add(server);
      
      return new Response(null, {
        status: 101,
        webSocket: client
      });
    }
    
    // REST API endpoints
    if (path === '/transaction' && request.method === 'POST') {
      try {
        const { transactionId, action, data, storeId = '1' } = await request.json();
        
        if (!transactionId || !action) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Missing required parameters'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // Handle transaction action
        switch (action) {
          case 'create':
            await this.createTransaction(transactionId, data, storeId);
            break;
          case 'update':
            await this.updateTransaction(transactionId, data, storeId);
            break;
          case 'complete':
            await this.completeTransaction(transactionId, data, storeId);
            break;
          case 'cancel':
            await this.cancelTransaction(transactionId, storeId);
            break;
          default:
            return new Response(JSON.stringify({
              success: false,
              message: 'Invalid action'
            }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            });
        }
        
        return new Response(JSON.stringify({
          success: true,
          message: 'Transaction processed successfully'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          message: 'Failed to process transaction',
          error: error instanceof Error ? error.message : 'Unknown error'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    return new Response('Not found', { status: 404 });
  }
  
  // Handle messages from WebSocket
  private async handleMessage(clientId: string, client: WebSocket, message: any) {
    const { type, data } = message;
    
    if (!type) {
      client.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message type'
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
        
      case 'transaction':
        if (!data || !data.transactionId || !data.action) {
          client.send(JSON.stringify({
            type: 'error',
            message: 'Invalid transaction data'
          }));
          return;
        }
        
        const { transactionId, action, payload, storeId = '1' } = data;
        
        try {
          switch (action) {
            case 'create':
              await this.createTransaction(transactionId, payload, storeId);
              break;
            case 'update':
              await this.updateTransaction(transactionId, payload, storeId);
              break;
            case 'complete':
              await this.completeTransaction(transactionId, payload, storeId);
              break;
            case 'cancel':
              await this.cancelTransaction(transactionId, storeId);
              break;
            default:
              throw new Error(`Invalid transaction action: ${action}`);
          }
          
          // Acknowledge
          client.send(JSON.stringify({
            type: 'ack',
            transactionId,
            action
          }));
        } catch (error) {
          client.send(JSON.stringify({
            type: 'error',
            transactionId,
            message: error instanceof Error ? error.message : 'Unknown error'
          }));
        }
        break;
        
      default:
        client.send(JSON.stringify({
          type: 'error',
          message: `Unknown message type: ${type}`
        }));
    }
  }
  
  // Create a new transaction
  private async createTransaction(transactionId: string, data: any, storeId: string) {
    const key = `${storeId}:${transactionId}`;
    
    await this.state.blockConcurrencyWhile(async () => {
      if (this.activeTransactions.has(key)) {
        throw new Error(`Transaction ${transactionId} already exists`);
      }
      
      const transaction = {
        id: transactionId,
        storeId,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data
      };
      
      this.activeTransactions.set(key, transaction);
      await this.state.storage.put('activeTransactions', Object.fromEntries(this.activeTransactions));
      
      this.broadcastUpdate({
        type: 'transaction_created',
        storeId,
        transaction
      });
    });
  }
  
  // Update an existing transaction
  private async updateTransaction(transactionId: string, data: any, storeId: string) {
    const key = `${storeId}:${transactionId}`;
    
    await this.state.blockConcurrencyWhile(async () => {
      const transaction = this.activeTransactions.get(key);
      
      if (!transaction) {
        throw new Error(`Transaction ${transactionId} not found`);
      }
      
      const updatedTransaction = {
        ...transaction,
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      this.activeTransactions.set(key, updatedTransaction);
      await this.state.storage.put('activeTransactions', Object.fromEntries(this.activeTransactions));
      
      this.broadcastUpdate({
        type: 'transaction_updated',
        storeId,
        transaction: updatedTransaction
      });
    });
  }
  
  // Complete a transaction
  private async completeTransaction(transactionId: string, data: any, storeId: string) {
    const key = `${storeId}:${transactionId}`;
    
    await this.state.blockConcurrencyWhile(async () => {
      const transaction = this.activeTransactions.get(key);
      
      if (!transaction) {
        throw new Error(`Transaction ${transactionId} not found`);
      }
      
      // Mark as completed
      const completedTransaction = {
        ...transaction,
        ...data,
        status: 'completed',
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Remove from active transactions
      this.activeTransactions.delete(key);
      await this.state.storage.put('activeTransactions', Object.fromEntries(this.activeTransactions));
      
      this.broadcastUpdate({
        type: 'transaction_completed',
        storeId,
        transaction: completedTransaction
      });
    });
  }
  
  // Cancel a transaction
  private async cancelTransaction(transactionId: string, storeId: string) {
    const key = `${storeId}:${transactionId}`;
    
    await this.state.blockConcurrencyWhile(async () => {
      const transaction = this.activeTransactions.get(key);
      
      if (!transaction) {
        throw new Error(`Transaction ${transactionId} not found`);
      }
      
      // Mark as cancelled
      const cancelledTransaction = {
        ...transaction,
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Remove from active transactions
      this.activeTransactions.delete(key);
      await this.state.storage.put('activeTransactions', Object.fromEntries(this.activeTransactions));
      
      this.broadcastUpdate({
        type: 'transaction_cancelled',
        storeId,
        transaction: cancelledTransaction
      });
    });
  }
  
  // Broadcast update to all connected clients
  private broadcastUpdate(message: any) {
    const { storeId } = message;
    const messageString = JSON.stringify(message);
    
    for (const session of this.sessions) {
      try {
        session.send(messageString);
      } catch (error) {
        this.sessions.delete(session);
      }
    }
  }
} 