// Simple EventEmitter for browser compatibility
class EventEmitter {
  private events: { [key: string]: Function[] } = {};

  on(event: string, listener: Function): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  off(event: string, listener: Function): void {
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
    min_stock_level: number;
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
  private reconnectDelay = 5000; // Increased delay to reduce frequency
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
  private pollingDelay = 5000; // 5 seconds

  constructor() {
    super();
    this.setupEventListeners();

    // Use polling only - disable WebSocket to avoid 503 errors
    console.log('🔄 Enabling polling for real-time features');
    this.usePollingFallback = true;
    this.startPollingFallback();

    // Don't try WebSocket to avoid 503 errors
    // WebSocket is not supported on Cloudflare Workers
  }

  // Initialize real WebSocket connection (enhanced)
  async connect(): Promise<void> {
    if (this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    this.isManuallyDisconnected = false;

    try {
      // Try WebSocket first, fallback to polling if needed
      const wsUrl = this.getWebSocketUrl();
      console.log('🔌 Attempting WebSocket connection to:', wsUrl);

      try {
        this.ws = new WebSocket(wsUrl);
        this.setupWebSocketHandlers();

        // Wait for connection with timeout
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('WebSocket connection timeout'));
          }, 5000);

          this.ws!.onopen = () => {
            clearTimeout(timeout);
            console.log('✅ WebSocket connected successfully');
            this.usePollingFallback = false;
            this.emit('connected');
            resolve();
          };

          this.ws!.onerror = (error) => {
            clearTimeout(timeout);
            reject(error);
          };
        });

      } catch (wsError) {
        // Only log WebSocket failures occasionally to reduce spam
        if (Math.random() < 0.05) {
          console.warn('⚠️ WebSocket failed, falling back to polling');
        }
        this.usePollingFallback = true;
        this.startPollingFallback();
        this.emit('connected');
        // Only log successful polling fallback occasionally
        if (Math.random() < 0.1) {
          console.log('✅ Realtime service connected via polling fallback');
        }
      }

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
    console.log('🔌 Realtime service disconnected');
  }

  // Subscribe to specific event types
  subscribe(eventType: string, callback: (event: RealtimeEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }

    const listeners = this.eventListeners.get(eventType)!;
    const wasEmpty = listeners.size === 0;
    listeners.add(callback);

    // Only log when first subscriber for this event type
    if (wasEmpty) {
      console.log(`📡 Subscribed to ${eventType} events`);
    }
  }

  // Unsubscribe from event types
  unsubscribe(eventType: string, callback?: (event: RealtimeEvent) => void): void {
    if (!this.eventListeners.has(eventType)) return;

    const listeners = this.eventListeners.get(eventType)!;

    if (callback) {
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

    // Only log reconnection attempts occasionally to reduce spam
    if (this.reconnectAttempts <= 3 || this.reconnectAttempts % 5 === 0) {
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
    // ALWAYS use production Cloudflare Workers - NO localhost (violates rules.md)
    const apiUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'https://smartpos-api-bangachieu2.bangachieu2.workers.dev/api/v1';

    // Extract host from API URL and remove /api/v1 path
    const apiHost = new URL(apiUrl).host;

    // ALWAYS use production WebSocket - rules.md compliant
    const protocol = apiUrl.startsWith('https:') ? 'wss:' : 'ws:';
    return `${protocol}//${apiHost}/ws`;
  }

  // Setup WebSocket event handlers
  private setupWebSocketHandlers(): void {
    if (!this.ws) return;

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 Received WebSocket message:', data);

        // Handle different message types
        switch (data.type) {
          case 'connected':
            console.log('✅ WebSocket connected:', data.data?.message);
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
      // Only log WebSocket close occasionally to reduce spam
      if (Math.random() < 0.1) {
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

    console.log('🔄 Starting polling fallback for real-time updates');
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
      const response = await api.get('/api/v1/dashboard/stats');

      if (response && response.data && response.data.success && response.data.data) {
        const data = response.data;
        const dataHash = JSON.stringify(data);

        // Check if data has changed
        if (dataHash !== this.lastDataHash) {
          this.lastDataHash = dataHash;

          // Only log occasionally to reduce console spam
          if (Math.random() < 0.1) { // Log only 10% of the time
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
    } catch (error) {
      // Only log polling errors occasionally to reduce spam
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

// Create singleton instance
export const realtimeService = new RealtimeService();

// Export types and service
export default realtimeService;
