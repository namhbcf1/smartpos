import { useEffect, useState, useCallback, useRef } from 'react';
import { realtimeService, RealtimeEvent } from '../services/realtime';

// Hook for general realtime connection
export const useRealtimeConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState({
    connected: false,
    id: null as string | null,
    attempts: 0
  });

  useEffect(() => {
    const handleConnected = () => {
      setIsConnected(true);
      setConnectionInfo(realtimeService.getConnectionInfo());
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      setConnectionInfo(realtimeService.getConnectionInfo());
    };

    const handleError = (error: any) => {
      console.error('Realtime connection error:', error);
      setIsConnected(false);
    };

    // Add event listeners
    realtimeService.on('connected', handleConnected);
    realtimeService.on('disconnected', handleDisconnected);
    realtimeService.on('error', handleError);

    // Connect on mount
    realtimeService.connect();

    // Cleanup on unmount
    return () => {
      realtimeService.off('connected', handleConnected);
      realtimeService.off('disconnected', handleDisconnected);
      realtimeService.off('error', handleError);
    };
  }, []);

  const connect = useCallback(() => {
    realtimeService.connect();
  }, []);

  const disconnect = useCallback(() => {
    realtimeService.disconnect();
  }, []);

  return {
    isConnected,
    connectionInfo,
    connect,
    disconnect
  };
};

// Hook for subscribing to specific event types
export const useRealtimeEvents = <T extends RealtimeEvent>(
  eventTypes: string[],
  callback: (event: T) => void,
  dependencies: any[] = []
) => {
  const callbackRef = useRef(callback);
  const [events, setEvents] = useState<T[]>([]);
  const [lastEvent, setLastEvent] = useState<T | null>(null);
  const eventTypesRef = useRef<string[]>([]);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    // Check if event types have actually changed
    const eventTypesChanged =
      eventTypes.length !== eventTypesRef.current.length ||
      eventTypes.some((type, index) => type !== eventTypesRef.current[index]);

    if (!eventTypesChanged) {
      return; // Skip if event types haven't changed
    }

    const handleEvent = (event: T) => {
      // Call the provided callback
      callbackRef.current(event);

      // Update state
      setLastEvent(event);
      setEvents(prev => [...prev.slice(-99), event]); // Keep last 100 events
    };

    // Unsubscribe from old event types
    eventTypesRef.current.forEach(eventType => {
      realtimeService.unsubscribe(eventType, handleEvent);
    });

    // Subscribe to new event types
    eventTypes.forEach(eventType => {
      realtimeService.subscribe(eventType, handleEvent);
    });

    // Update ref
    eventTypesRef.current = [...eventTypes];

    // Cleanup subscriptions
    return () => {
      eventTypes.forEach(eventType => {
        realtimeService.unsubscribe(eventType, handleEvent);
      });
    };
  }, [eventTypes.join(','), ...dependencies]); // Use join to create stable dependency

  const clearEvents = useCallback(() => {
    setEvents([]);
    setLastEvent(null);
  }, []);

  return {
    events,
    lastEvent,
    clearEvents
  };
};

// Hook for sales events
export const useSalesEvents = (callback?: (event: any) => void) => {
  const [salesStats, setSalesStats] = useState({
    todayTotal: 0,
    todayCount: 0,
    recentSales: [] as any[]
  });

  const handleSalesEvent = useCallback((event: any) => {
    console.log('📊 Sales event received:', event);
    
    if (event.type === 'sale_created') {
      setSalesStats(prev => ({
        todayTotal: prev.todayTotal + event.data.total_amount,
        todayCount: prev.todayCount + 1,
        recentSales: [event.data, ...prev.recentSales.slice(0, 9)] // Keep last 10
      }));
    }

    // Call external callback if provided
    if (callback) {
      callback(event);
    }
  }, [callback]);

  const { events, lastEvent } = useRealtimeEvents(
    ['sale_created', 'sale_updated', 'sale_deleted'],
    handleSalesEvent
  );

  return {
    salesStats,
    salesEvents: events,
    lastSalesEvent: lastEvent,
    setSalesStats
  };
};

// Hook for inventory events
export const useInventoryEvents = (callback?: (event: any) => void) => {
  const [inventoryAlerts, setInventoryAlerts] = useState<any[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);

  const handleInventoryEvent = useCallback((event: any) => {
    console.log('📦 Inventory event received:', event);
    
    if (event.type === 'stock_updated') {
      if (event.data.current_stock <= event.data.min_stock_level) {
        setInventoryAlerts(prev => [
          {
            id: Date.now(),
            product_name: event.data.product_name,
            current_stock: event.data.current_stock,
            min_stock_level: event.data.min_stock_level,
            timestamp: event.timestamp
          },
          ...prev.slice(0, 19) // Keep last 20 alerts
        ]);
        setLowStockCount(prev => prev + 1);
      }
    }

    // Call external callback if provided
    if (callback) {
      callback(event);
    }
  }, [callback]);

  const { events, lastEvent } = useRealtimeEvents(
    ['stock_updated', 'stock_low', 'stock_out'],
    handleInventoryEvent
  );

  const clearAlerts = useCallback(() => {
    setInventoryAlerts([]);
    setLowStockCount(0);
  }, []);

  return {
    inventoryAlerts,
    lowStockCount,
    inventoryEvents: events,
    lastInventoryEvent: lastEvent,
    clearAlerts
  };
};

// Hook for customer events
export const useCustomerEvents = (callback?: (event: any) => void) => {
  const [customerStats, setCustomerStats] = useState({
    newCustomersToday: 0,
    totalLoyaltyPoints: 0,
    vipCustomers: 0
  });

  const handleCustomerEvent = useCallback((event: any) => {
    console.log('👥 Customer event received:', event);
    
    if (event.type === 'customer_created') {
      setCustomerStats(prev => ({
        ...prev,
        newCustomersToday: prev.newCustomersToday + 1
      }));
    }

    if (event.type === 'loyalty_points_changed') {
      setCustomerStats(prev => ({
        ...prev,
        totalLoyaltyPoints: prev.totalLoyaltyPoints + (event.data.points_change || 0)
      }));
    }

    // Call external callback if provided
    if (callback) {
      callback(event);
    }
  }, [callback]);

  const { events, lastEvent } = useRealtimeEvents(
    ['customer_created', 'customer_updated', 'loyalty_points_changed'],
    handleCustomerEvent
  );

  return {
    customerStats,
    customerEvents: events,
    lastCustomerEvent: lastEvent,
    setCustomerStats
  };
};

// Hook for system events
export const useSystemEvents = (callback?: (event: any) => void) => {
  const [systemAlerts, setSystemAlerts] = useState<any[]>([]);
  const [systemStatus, setSystemStatus] = useState({
    status: 'online',
    lastHeartbeat: Date.now(),
    uptime: 0
  });

  const handleSystemEvent = useCallback((event: any) => {
    console.log('🔧 System event received:', event);
    
    if (event.type === 'system_alert') {
      setSystemAlerts(prev => [
        {
          id: Date.now(),
          message: event.data.message,
          level: event.data.level,
          timestamp: event.timestamp
        },
        ...prev.slice(0, 9) // Keep last 10 alerts
      ]);
    }

    // Call external callback if provided
    if (callback) {
      callback(event);
    }
  }, [callback]);

  const { events, lastEvent } = useRealtimeEvents(
    ['user_login', 'user_logout', 'system_alert', 'backup_completed'],
    handleSystemEvent
  );

  // Handle heartbeat - use ref to prevent re-subscription
  const heartbeatHandlerRef = useRef<((data: any) => void) | null>(null);

  useEffect(() => {
    if (!heartbeatHandlerRef.current) {
      heartbeatHandlerRef.current = (data: any) => {
        setSystemStatus(prev => ({
          ...prev,
          lastHeartbeat: data.timestamp,
          status: 'online'
        }));
      };

      realtimeService.on('heartbeat', heartbeatHandlerRef.current);
    }

    return () => {
      if (heartbeatHandlerRef.current) {
        realtimeService.off('heartbeat', heartbeatHandlerRef.current);
        heartbeatHandlerRef.current = null;
      }
    };
  }, []);

  const clearAlerts = useCallback(() => {
    setSystemAlerts([]);
  }, []);

  return {
    systemAlerts,
    systemStatus,
    systemEvents: events,
    lastSystemEvent: lastEvent,
    clearAlerts
  };
};

// Combined hook for dashboard
export const useDashboardRealtime = () => {
  const connection = useRealtimeConnection();
  const sales = useSalesEvents();
  const inventory = useInventoryEvents();
  const customers = useCustomerEvents();
  const system = useSystemEvents();

  return {
    connection,
    sales,
    inventory,
    customers,
    system
  };
};
