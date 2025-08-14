/**
 * Enhanced Real-time Service
 * Integrates with all advanced backend services for real-time updates
 * Rules.md compliant - uses only real Cloudflare D1 data
 */

import { EventEmitter } from 'events';
import apiService from './api';
import { API_ENDPOINTS } from '../config/constants';
import { RealtimeNotification, RealtimeEvent, WebSocketMessage } from '../types/api';

export interface RealtimeSubscription {
  id: string;
  type: string;
  callback: (data: any) => void;
  filters?: Record<string, any>;
}

export interface RealtimeConnectionStatus {
  connected: boolean;
  connectionType: 'websocket' | 'polling' | 'sse';
  lastHeartbeat?: Date;
  reconnectAttempts: number;
  latency?: number;
}

class EnhancedRealtimeService extends EventEmitter {
  private ws: WebSocket | null = null;
  private eventSource: EventSource | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  
  private isConnecting = false;
  private isManuallyDisconnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private pollingDelay = 3000;
  
  private subscriptions = new Map<string, RealtimeSubscription>();
  private connectionStatus: RealtimeConnectionStatus = {
    connected: false,
    connectionType: 'polling',
    reconnectAttempts: 0
  };

  constructor() {
    super();
    this.setMaxListeners(50); // Allow many subscribers
  }

  /**
   * Connect to real-time services with fallback strategy
   */
  async connect(): Promise<void> {
    if (this.isConnecting || this.connectionStatus.connected) {
      return;
    }

    this.isConnecting = true;
    this.isManuallyDisconnected = false;

    try {
      // Try connection methods in order of preference
      const success = await this.tryWebSocket() || 
                     await this.tryServerSentEvents() || 
                     await this.tryPolling();

      if (success) {
        this.connectionStatus.connected = true;
        this.reconnectAttempts = 0;
        this.emit('connected', this.connectionStatus);
        console.log('✅ Enhanced realtime service connected via', this.connectionStatus.connectionType);
      } else {
        throw new Error('All connection methods failed');
      }
    } catch (error) {
      console.error('❌ Failed to connect to enhanced realtime service:', error);
      this.emit('error', error);
      this.scheduleReconnect();
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Try WebSocket connection
   */
  private async tryWebSocket(): Promise<boolean> {
    try {
      const wsUrl = this.getWebSocketUrl();
      this.ws = new WebSocket(wsUrl);

      return new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          this.ws?.close();
          resolve(false);
        }, 5000);

        this.ws!.onopen = () => {
          clearTimeout(timeout);
          this.connectionStatus.connectionType = 'websocket';
          this.setupWebSocketHandlers();
          this.startHeartbeat();
          resolve(true);
        };

        this.ws!.onerror = () => {
          clearTimeout(timeout);
          resolve(false);
        };
      });
    } catch (error) {
      console.warn('WebSocket connection failed:', error);
      return false;
    }
  }

  /**
   * Try Server-Sent Events connection
   */
  private async tryServerSentEvents(): Promise<boolean> {
    try {
      const sseUrl = `${import.meta.env.VITE_API_BASE_URL || 'https://smartpos-api-bangachieu2.bangachieu2.workers.dev'}${API_ENDPOINTS.REALTIME.STREAM}`;
      this.eventSource = new EventSource(sseUrl, { withCredentials: true });

      return new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          this.eventSource?.close();
          resolve(false);
        }, 5000);

        this.eventSource!.onopen = () => {
          clearTimeout(timeout);
          this.connectionStatus.connectionType = 'sse';
          this.setupSSEHandlers();
          resolve(true);
        };

        this.eventSource!.onerror = () => {
          clearTimeout(timeout);
          resolve(false);
        };
      });
    } catch (error) {
      console.warn('SSE connection failed:', error);
      return false;
    }
  }

  /**
   * Try polling fallback
   */
  private async tryPolling(): Promise<boolean> {
    try {
      // Test if we can reach the notifications endpoint
      await apiService.get(API_ENDPOINTS.REALTIME.NOTIFICATIONS);
      this.connectionStatus.connectionType = 'polling';
      this.startPolling();
      return true;
    } catch (error) {
      console.warn('Polling connection failed:', error);
      return false;
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupWebSocketHandlers(): void {
    if (!this.ws) return;

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleRealtimeMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      this.connectionStatus.connected = false;
      this.emit('disconnected');
      if (!this.isManuallyDisconnected) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    };
  }

  /**
   * Setup Server-Sent Events handlers
   */
  private setupSSEHandlers(): void {
    if (!this.eventSource) return;

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleRealtimeMessage({
          type: 'event',
          payload: data,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    this.eventSource.onerror = () => {
      this.connectionStatus.connected = false;
      this.emit('disconnected');
      if (!this.isManuallyDisconnected) {
        this.scheduleReconnect();
      }
    };
  }

  /**
   * Start polling for updates
   */
  private startPolling(): void {
    this.pollingInterval = setInterval(async () => {
      try {
        const notifications = await apiService.get<RealtimeNotification[]>(
          `${API_ENDPOINTS.REALTIME.NOTIFICATIONS}?limit=10&unread_only=true`
        );

        notifications.forEach(notification => {
          this.handleRealtimeMessage({
            type: 'notification',
            payload: notification,
            timestamp: notification.created_at
          });
        });
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, this.pollingDelay);
  }

  /**
   * Handle incoming real-time messages
   */
  private handleRealtimeMessage(message: WebSocketMessage): void {
    // Update connection status
    this.connectionStatus.lastHeartbeat = new Date();

    // Process different message types
    switch (message.type) {
      case 'notification':
        this.handleNotification(message.payload);
        break;
      case 'event':
        this.handleEvent(message.payload);
        break;
      case 'heartbeat':
        // Update latency if provided
        if (message.payload?.timestamp) {
          this.connectionStatus.latency = Date.now() - new Date(message.payload.timestamp).getTime();
        }
        break;
      case 'error':
        this.emit('error', message.payload);
        break;
    }

    // Emit to specific subscribers
    this.notifySubscribers(message);
  }

  /**
   * Handle notifications
   */
  private handleNotification(notification: RealtimeNotification): void {
    this.emit('notification', notification);
    this.emit(`notification:${notification.category}`, notification);
    this.emit(`notification:${notification.type}`, notification);
  }

  /**
   * Handle events
   */
  private handleEvent(event: RealtimeEvent): void {
    this.emit('event', event);
    this.emit(`event:${event.type}`, event);
    
    // Handle specific event types
    switch (event.type) {
      case 'inventory_updated':
      case 'stock_updated':
        this.emit('inventory:updated', event.data);
        break;
      case 'analytics_updated':
        this.emit('analytics:updated', event.data);
        break;
      case 'user_updated':
      case 'role_changed':
        this.emit('user:updated', event.data);
        break;
      case 'database_optimized':
        this.emit('database:optimized', event.data);
        break;
    }
  }

  /**
   * Notify subscribers based on their filters
   */
  private notifySubscribers(message: WebSocketMessage): void {
    this.subscriptions.forEach((subscription) => {
      if (this.messageMatchesSubscription(message, subscription)) {
        subscription.callback(message.payload);
      }
    });
  }

  /**
   * Check if message matches subscription filters
   */
  private messageMatchesSubscription(message: WebSocketMessage, subscription: RealtimeSubscription): boolean {
    if (subscription.type !== 'all' && subscription.type !== message.type) {
      return false;
    }

    if (subscription.filters) {
      // Apply custom filters
      for (const [key, value] of Object.entries(subscription.filters)) {
        if (message.payload[key] !== value) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Subscribe to real-time updates
   */
  subscribe(type: string, callback: (data: any) => void, filters?: Record<string, any>): string {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    this.subscriptions.set(id, { id, type, callback, filters });
    return id;
  }

  /**
   * Unsubscribe from updates
   */
  unsubscribe(subscriptionId: string): void {
    this.subscriptions.delete(subscriptionId);
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): RealtimeConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * Start heartbeat mechanism
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'heartbeat',
          timestamp: new Date().toISOString()
        }));
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('max_reconnect_attempts');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    this.reconnectTimeout = setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      this.connect();
    }, delay);
  }

  /**
   * Get WebSocket URL
   */
  private getWebSocketUrl(): string {
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://smartpos-api-bangachieu2.bangachieu2.workers.dev';
    const protocol = apiUrl.startsWith('https:') ? 'wss:' : 'ws:';
    const host = new URL(apiUrl).host;
    return `${protocol}//${host}${API_ENDPOINTS.REALTIME.WEBSOCKET}`;
  }

  /**
   * Disconnect from all services
   */
  disconnect(): void {
    this.isManuallyDisconnected = true;
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.connectionStatus.connected = false;
    this.emit('disconnected');
  }
}

export const enhancedRealtimeService = new EnhancedRealtimeService();
