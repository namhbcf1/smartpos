// Simple EventEmitter for browser compatibility
class EventEmitter {
  private events: { [key: string]: Function[] } = {};

  on(event: string, listener: Function): void {
    if (typeof listener !== 'function') {
      console.warn('EventEmitter.on: listener must be a function', { event, listener });
      return;
    }
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  off(event: string, listener: Function): void {
    if (typeof listener !== 'function') {
      console.warn('EventEmitter.off: listener must be a function', { event, listener });
      return;
    }
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  emit(event: string, ...args: any[]): void {
    if (!this.events[event]) return;
    this.events[event].forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  removeAllListeners(event?: string): void {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
}

// Real-time event types
export interface RealtimeEvent {
  type: string;
  data: any;
  timestamp: number;
  source?: string;
}

export interface SalesEvent extends RealtimeEvent {
  type: 'sale_created' | 'sale_updated' | 'sale_deleted';
  data: {
    id: number;
    sale_number: string;
    total_amount: number;
    customer_name?: string;
    status: string;
  };
}

export interface InventoryEvent extends RealtimeEvent {
  type: 'stock_updated' | 'stock_low' | 'stock_out' | 'stock_synced' | 'serial_number_updated';
  data: {
    product_id: number;
    product_name: string;
    current_stock: number;
    min_stock: number;
    location?: string;
    serial_number?: string;
    old_status?: string;
    new_status?: string;
    calculated_stock?: number;
    manual_stock?: number;
    sync_source?: 'serial_numbers' | 'manual' | 'auto';
  };
}

export interface CustomerEvent extends RealtimeEvent {
  type: 'customer_created' | 'customer_updated' | 'loyalty_points_changed';
  data: {
    id: number;
    name: string;
    loyalty_points?: number;
    vip_status?: boolean;
  };
}

export interface SystemEvent extends RealtimeEvent {
  type: 'user_login' | 'user_logout' | 'system_alert' | 'backup_completed';
  data: {
    user_id?: number;
    username?: string;
    message?: string;
    level?: 'info' | 'warning' | 'error' | 'success';
  };
}

// Real-time service class
class RealtimeService extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3; // Reduced to limit spam
  private reconnectDelay = 30000; // 30 seconds to reduce frequency significantly
  private isConnecting = false;
  private isManuallyDisconnected = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private connectionId: string | null = null;

  // Event listeners storage
  private eventListeners: Map<string, Set<Function>> = new Map();

  // Fallback polling mechanism
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastDataHash: string = '';
  private usePollingFallback = false;

  constructor() {
    super();
    this.setupEventListeners();

    // Use polling only - WebSocket not supported on Cloudflare Workers
    console.log('🔄 Enabling polling for real-time features');
    this.usePollingFallback = true;
    this.startPollingFallback();
  }

  // Initialize realtime connection (polling only)
  async connect(): Promise<void> {
    if (this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    this.isManuallyDisconnected = false;

    try {
      // Use polling fallback only (WebSocket not supported on Cloudflare Workers)
      this.usePollingFallback = true;
      this.startPollingFallback();
      this.emit('connected');
    } catch (error) {
      console.error('❌ Failed to connect to realtime service:', error);
      this.emit('error', error);
    } finally {
      this.isConnecting = false;
    }
  }

  // Disconnect from service
  disconnect(): void {
    this.isManuallyDisconnected = true;

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Stop polling fallback if active
    this.stopPollingFallback();

    this.emit('disconnected');
  }

  // Subscribe to specific event types
  subscribe(eventType: string, callback: (event: RealtimeEvent) => void): void {
    if (typeof callback !== 'function') {
      console.warn('RealtimeService.subscribe: callback must be a function', { eventType, callback });
      return;
    }

    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }

    const listeners = this.eventListeners.get(eventType)!;
    // const wasEmpty = listeners.size === 0;
    listeners.add(callback);

    // Silent subscription
  }

  // Unsubscribe from event types
  unsubscribe(eventType: string, callback?: (event: RealtimeEvent) => void): void {
    if (!this.eventListeners.has(eventType)) return;

    const listeners = this.eventListeners.get(eventType)!;

    if (callback) {
      if (typeof callback !== 'function') {
        console.warn('RealtimeService.unsubscribe: callback must be a function', { eventType, callback });
        return;
      }
      listeners.delete(callback);
    } else {
      listeners.clear();
    }

    // Only log when last subscriber for this event type is removed
    if (listeners.size === 0) {
      console.log(`📡 Unsubscribed from ${eventType} events`);
    }
  }

  // Send event to server
  send(event: RealtimeEvent): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
      console.log('📤 Sent event:', event.type);
    } else {
      console.warn('⚠️ Cannot send event: not connected to realtime service');
    }
  }

  // Subscribe to product updates
  subscribeToProduct(productId: number): void {
    this.send({
      type: 'subscribe',
      data: { type: 'product', productId },
      timestamp: Date.now()
    });
  }

  // Unsubscribe from product updates
  unsubscribeFromProduct(productId: number): void {
    this.send({
      type: 'unsubscribe',
      data: { type: 'product', productId },
      timestamp: Date.now()
    });
  }

  // Subscribe to inventory updates
  subscribeToInventory(): void {
    this.send({
      type: 'subscribe',
      data: { type: 'inventory' },
      timestamp: Date.now()
    });
  }

  // Subscribe to sales updates
  subscribeToSales(): void {
    this.send({
      type: 'subscribe',
      data: { type: 'sales' },
      timestamp: Date.now()
    });
  }

  // Subscribe to serial number updates
  subscribeToSerialNumbers(): void {
    this.send({
      type: 'subscribe',
      data: { type: 'serial_numbers' },
      timestamp: Date.now()
    });
  }

  // Subscribe to system events
  subscribeToSystemEvents(): void {
    this.send({
      type: 'subscribe',
      data: { type: 'system' },
      timestamp: Date.now()
    });
  }

  // Get connection status
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Get connection info
  getConnectionInfo(): { connected: boolean; id: string | null; attempts: number } {
    return {
      connected: this.isConnected(),
      id: this.connectionId,
      attempts: this.reconnectAttempts
    };
  }

  // Private methods
  private setupEventListeners(): void {
    this.on('event', (event: RealtimeEvent) => {
      const listeners = this.eventListeners.get(event.type);
      if (listeners) {
        listeners.forEach(callback => {
          try {
            callback(event);
          } catch (error) {
            console.error(`Error in event listener for ${event.type}:`, error);
          }
        });
      }
    });
  }

  private scheduleReconnect(): void {
    if (this.isManuallyDisconnected || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    // Only log reconnection attempts in development mode and occasionally to reduce spam
    if (process.env.NODE_ENV === 'development' &&
        (this.reconnectAttempts <= 2 || this.reconnectAttempts % 10 === 0)) {
      console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    }

    setTimeout(() => {
      if (!this.isManuallyDisconnected) {
        this.connect();
      }
    }, delay);
  }

  // Get WebSocket URL based on environment - PRODUCTION ONLY (rules.md compliance)
  private getWebSocketUrl(): string {
    // Prefer unified base URL per production.env
    const base = (import.meta as any).env?.VITE_API_BASE_URL || 'https://namhbcf-api.bangachieu2.workers.dev';
    const url = new URL(base);
    const host = url.host;
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${host}/ws`;
  }

  // Setup WebSocket event handlers
  private setupWebSocketHandlers(): void {
    if (!this.ws) return;

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Only log WebSocket messages in development mode
        if (process.env.NODE_ENV === 'development') {
          console.log('📨 Received WebSocket message:', data);
        }

        // Handle different message types
        switch (data.type) {
          case 'connected':
            if (process.env.NODE_ENV === 'development') {
              console.log('✅ WebSocket connected:', data.data?.message);
            }
            this.emit('connected', data);
            break;

          case 'pong':
            this.handleHeartbeat(data);
            break;

          case 'subscription_confirmed':
            console.log('📡 Subscription confirmed:', data.data?.type);
            break;

          case 'unsubscription_confirmed':
            console.log('📡 Unsubscription confirmed:', data.data?.type);
            break;

          case 'error':
            console.error('❌ Server error:', data.message);
            this.emit('error', new Error(data.message));
            break;

          case 'user_login':
          case 'user_logout':
          case 'system_alert':
          case 'backup_completed':
          case 'stock_updated':
          case 'stock_low':
          case 'stock_out':
          case 'product_updated':
          case 'inventory_updated':
          case 'sale_completed':
          case 'serial_number_updated':
          case 'inventory_alert':
          case 'analytics_updated':
          case 'user_created':
          case 'user_updated':
          case 'role_changed':
          case 'permission_updated':
          case 'database_optimized':
          case 'maintenance_completed':
          case 'backup_created':
          case 'performance_alert':
          case 'security_alert':
          case 'notification':
            // Emit specific event types to subscribers
            this.emit(data.type, data);
            this.emit('event', data);
            break;

          default:
            // Emit generic event for unknown types
            this.emit('event', data);
        }
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = (event) => {
      // Only log WebSocket close in development mode and occasionally to reduce spam
      if (process.env.NODE_ENV === 'development' && Math.random() < 0.2) {
        console.log('🔌 WebSocket connection closed:', event.code, event.reason);
      }
      this.ws = null;
      this.connectionId = null;

      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }

      this.emit('disconnected');

      // Attempt to reconnect if not manually disconnected
      if (!this.isManuallyDisconnected) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      // Only log WebSocket errors occasionally to reduce spam
      if (Math.random() < 0.05) {
        console.error('❌ WebSocket error:', error);
      }
      this.emit('error', error);
    };
  }

  // Start heartbeat to keep connection alive
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({
          type: 'ping',
          data: {},
          timestamp: Date.now()
        });
      }
    }, 30000); // 30 seconds
  }

  // Handle heartbeat response
  private handleHeartbeat(data: any): void {
    // Update connection info if provided
    if (data.connectionId) {
      this.connectionId = data.connectionId;
    }

    this.emit('heartbeat', data);
  }

  // Start polling fallback when WebSocket fails
  private startPollingFallback(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    this.emit('connected'); // Emit connected event for UI

    // Poll for updates every 60 seconds (much less frequent to reduce spam)
    this.pollingInterval = setInterval(async () => {
      try {
        await this.pollForUpdates();
      } catch (error) {
        // Only log errors occasionally to reduce spam
        if (Math.random() < 0.1) {
          console.error('❌ Polling error:', error);
        }
      }
    }, 60000); // Increased to 60 seconds to reduce spam

    // Initial poll with delay to prevent immediate multiple calls
    setTimeout(() => {
      this.pollForUpdates();
    }, 1000);
  }

  // Poll for updates from API
  private async pollForUpdates(): Promise<void> {
    try {
      // Import API service dynamically to avoid circular dependency
      const { default: api } = await import('./api');

      // Use API service to ensure authentication is included
      const response = await api.get('/dashboard/stats');

      if (response && response.data && response.data.success && response.data.data) {
        const data = response.data;
        const dataHash = JSON.stringify(data);

        // Check if data has changed
        if (dataHash !== this.lastDataHash) {
          this.lastDataHash = dataHash;

          // Only log in development mode and occasionally to reduce console spam
          if (process.env.NODE_ENV === 'development' && Math.random() < 0.05) { // Log only 5% of the time in dev
            console.log('📊 Dashboard data updated via polling:', data.data);
          }

          // Emit events based on data changes
          this.emit('dashboard_updated', data);

          // Simulate real-time events based on data changes
          if (data.data?.todaySales !== undefined) {
            this.emit('sales_updated', {
              type: 'sales_updated',
              data: { todaySales: data.data.todaySales },
              timestamp: Date.now()
            });
          }

          if (data.data?.totalCustomers !== undefined) {
            this.emit('customer_updated', {
              type: 'customer_updated',
              data: { totalCustomers: data.data.totalCustomers },
              timestamp: Date.now()
            });
          }

          if (data.data?.totalProducts !== undefined) {
            this.emit('inventory_updated', {
              type: 'inventory_updated',
              data: { totalProducts: data.data.totalProducts },
              timestamp: Date.now()
            });
          }

          // Emit system status
          this.emit('system_status', {
            type: 'system_status',
            data: {
              status: 'operational',
              timestamp: new Date().toISOString(),
              activeUsers: 1,
              systemLoad: 'low',
              pollingActive: true
            },
            timestamp: Date.now()
          });
        }
      } else {
        // Only log polling failures occasionally to reduce spam
        if (Math.random() < 0.01) {
          console.warn('⚠️ Failed to fetch dashboard stats via polling');
        }
      }
    } catch (error: any) {
      // Handle network errors gracefully - don't spam console
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error') || 
          error.message?.includes('ERR_CONNECTION_CLOSED')) {
        // Network error - silently retry, don't log
        return;
      }
      
      // Only log other errors occasionally to reduce console spam
      if (Math.random() < 0.01) {
        console.error('❌ Failed to poll for updates:', error);
      }
    }
  }

  // Stop polling fallback
  private stopPollingFallback(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.usePollingFallback = false;
  }

  // Generate unique connection ID
  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

// Create singleton instance with error protection
let realtimeService: RealtimeService;

try {
  realtimeService = new RealtimeService();

  // Additional safety check to ensure the service has the required methods
  if (!realtimeService || typeof realtimeService.on !== 'function') {
    throw new Error('RealtimeService not properly initialized');
  }
} catch (error) {
  console.error('Failed to initialize RealtimeService:', error);
  // Create a robust mock service to prevent runtime errors
  const mockService = {
    on: (event: string, listener: Function) => {
      console.warn('MockRealtimeService.on called:', { event, listener: typeof listener });
    },
    off: (event: string, listener: Function) => {
      console.warn('MockRealtimeService.off called:', { event, listener: typeof listener });
    },
    emit: (event: string, ...args: any[]) => {
      console.warn('MockRealtimeService.emit called:', { event, args });
    },
    connect: () => {
      console.warn('MockRealtimeService.connect called');
      return Promise.resolve();
    },
    disconnect: () => {
      console.warn('MockRealtimeService.disconnect called');
    },
    subscribe: (eventType: string, callback: Function) => {
      console.warn('MockRealtimeService.subscribe called:', { eventType, callback: typeof callback });
    },
    unsubscribe: (eventType: string, callback?: Function) => {
      console.warn('MockRealtimeService.unsubscribe called:', { eventType, callback: typeof callback });
    },
    send: (event: any) => {
      console.warn('MockRealtimeService.send called:', event);
    },
    isConnected: () => {
      console.warn('MockRealtimeService.isConnected called');
      return false;
    },
    getConnectionInfo: () => {
      console.warn('MockRealtimeService.getConnectionInfo called');
      return { connected: false, id: null, attempts: 0 };
    }
  };

  // Ensure mock service cannot be accidentally treated as null/undefined
  realtimeService = mockService as any;
}

// Export singleton instance
export { realtimeService };

// Export types and service
export default realtimeService;
