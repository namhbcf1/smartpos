interface RealtimeService {
  connect: () => void;
  disconnect: () => void;
  subscribe: (channel: string, callback: (data: any) => void) => void;
  unsubscribe: (channel: string) => void;
  isConnected: () => boolean;
}

class WebSocketRealtimeService implements RealtimeService {
  private ws: WebSocket | null = null;
  private subscriptions: Map<string, (data: any) => void> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect() {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      this.ws = new WebSocket(`${protocol}//${host}/ws`);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const callback = this.subscriptions.get(data.channel);
          if (callback) {
            callback(data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
  }

  subscribe(channel: string, callback: (data: any) => void) {
    this.subscriptions.set(channel, callback);
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'subscribe',
        channel: channel
      }));
    }
  }

  unsubscribe(channel: string) {
    this.subscriptions.delete(channel);
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'unsubscribe',
        channel: channel
      }));
    }
  }

  isConnected() {
    return this.ws ? this.ws.readyState === WebSocket.OPEN : false;
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }
}

// Mock service for fallback
class MockRealtimeService implements RealtimeService {
  private connected = false;
  private subscriptions: Map<string, (data: any) => void> = new Map();

  connect() {
    this.connected = true;
    console.log('Mock realtime service connected');
  }

  disconnect() {
    this.connected = false;
    this.subscriptions.clear();
    console.log('Mock realtime service disconnected');
  }

  subscribe(channel: string, callback: (data: any) => void) {
    this.subscriptions.set(channel, callback);
    console.log(`Subscribed to channel: ${channel}`);
    
    // Simulate some data for testing
    setTimeout(() => {
      if (this.subscriptions.has(channel)) {
        callback({
          channel,
          data: {
            message: 'Mock realtime data',
            timestamp: new Date().toISOString()
          }
        });
      }
    }, 2000);
  }

  unsubscribe(channel: string) {
    this.subscriptions.delete(channel);
    console.log(`Unsubscribed from channel: ${channel}`);
  }

  isConnected() {
    return this.connected;
  }
}

// Create singleton instance
const createRealtimeService = (): RealtimeService => {
  // Use WebSocket in production, mock in development
  if (import.meta.env.PROD && typeof WebSocket !== 'undefined') {
    return new WebSocketRealtimeService();
  } else {
    return new MockRealtimeService();
  }
};

export const realtimeService = createRealtimeService();
export default realtimeService;