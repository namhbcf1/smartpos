/**
 * Realtime Optimization Utilities
 * Helps reduce excessive logging and improve performance
 */

// Debounce function to prevent excessive calls
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function to limit call frequency
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Log rate limiter to prevent console spam
class LogRateLimiter {
  private logCounts: Map<string, { count: number; lastReset: number }> = new Map();
  private readonly maxLogsPerMinute = 5;
  private readonly resetInterval = 60000; // 1 minute

  shouldLog(key: string): boolean {
    const now = Date.now();
    const logData = this.logCounts.get(key);

    if (!logData) {
      this.logCounts.set(key, { count: 1, lastReset: now });
      return true;
    }

    // Reset count if a minute has passed
    if (now - logData.lastReset > this.resetInterval) {
      logData.count = 1;
      logData.lastReset = now;
      return true;
    }

    // Check if under limit
    if (logData.count < this.maxLogsPerMinute) {
      logData.count++;
      return true;
    }

    return false;
  }
}

export const logRateLimiter = new LogRateLimiter();

// Optimized console logger
export const optimizedLog = {
  subscription: (eventType: string, action: 'subscribe' | 'unsubscribe') => {
    const key = `${action}-${eventType}`;
    if (logRateLimiter.shouldLog(key)) {
      console.log(`📡 ${action === 'subscribe' ? 'Subscribed to' : 'Unsubscribed from'} ${eventType} events`);
    }
  },
  
  polling: (data: any) => {
    if (logRateLimiter.shouldLog('polling-update')) {
      console.log('📊 Dashboard data updated via polling:', data);
    }
  },
  
  event: (type: string, data: any) => {
    const key = `event-${type}`;
    if (logRateLimiter.shouldLog(key)) {
      console.log(`📨 ${type} event:`, data);
    }
  }
};

// Event subscription manager to prevent duplicate subscriptions
export class EventSubscriptionManager {
  private subscriptions: Map<string, Set<Function>> = new Map();

  subscribe(eventType: string, callback: Function): boolean {
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, new Set());
    }

    const callbacks = this.subscriptions.get(eventType)!;
    const wasEmpty = callbacks.size === 0;
    callbacks.add(callback);

    return wasEmpty; // Return true if this is the first subscription for this event type
  }

  unsubscribe(eventType: string, callback: Function): boolean {
    if (!this.subscriptions.has(eventType)) {
      return false;
    }

    const callbacks = this.subscriptions.get(eventType)!;
    callbacks.delete(callback);

    return callbacks.size === 0; // Return true if this was the last subscription for this event type
  }

  getSubscriptionCount(eventType: string): number {
    return this.subscriptions.get(eventType)?.size || 0;
  }

  clear(): void {
    this.subscriptions.clear();
  }
}

export const globalSubscriptionManager = new EventSubscriptionManager();
