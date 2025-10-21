/**
 * Network Context
 * Manages network connectivity state and offline capabilities
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NetworkContextType {
  isConnected: boolean;
  isOnline: boolean;
  connectionType: string | null;
  offlineQueue: any[];
  addToOfflineQueue: (action: any) => void;
  processOfflineQueue: () => Promise<void>;
  clearOfflineQueue: () => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function NetworkProvider({
  children,
  value
}: {
  children: React.ReactNode;
  value?: { isConnected: boolean };
}) {
  const [isConnected, setIsConnected] = useState(value?.isConnected ?? true);
  const [connectionType, setConnectionType] = useState<string | null>(null);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? false);
      setConnectionType(state.type);

      // Process offline queue when connection is restored
      if (state.isConnected && !isConnected) {
        processOfflineQueue();
      }
    });

    // Load offline queue from storage
    loadOfflineQueue();

    return unsubscribe;
  }, [isConnected]);

  const loadOfflineQueue = async () => {
    try {
      const queue = await AsyncStorage.getItem('offlineQueue');
      if (queue) {
        setOfflineQueue(JSON.parse(queue));
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  };

  const saveOfflineQueue = async (queue: any[]) => {
    try {
      await AsyncStorage.setItem('offlineQueue', JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  };

  const addToOfflineQueue = (action: any) => {
    const newQueue = [...offlineQueue, { ...action, timestamp: Date.now() }];
    setOfflineQueue(newQueue);
    saveOfflineQueue(newQueue);
  };

  const processOfflineQueue = async () => {
    if (offlineQueue.length === 0) return;

    console.log(`🔄 Processing ${offlineQueue.length} offline actions...`);

    const processedActions: any[] = [];
    const failedActions: any[] = [];

    for (const action of offlineQueue) {
      try {
        // Process each action based on its type
        await processOfflineAction(action);
        processedActions.push(action);
      } catch (error) {
        console.error('Failed to process offline action:', error);
        failedActions.push(action);
      }
    }

    // Update queue with failed actions only
    setOfflineQueue(failedActions);
    saveOfflineQueue(failedActions);

    console.log(`✅ Processed ${processedActions.length} offline actions`);
    if (failedActions.length > 0) {
      console.warn(`⚠️ ${failedActions.length} actions failed to process`);
    }
  };

  const processOfflineAction = async (action: any) => {
    // Import API client dynamically to avoid circular dependency
    const { apiClient } = await import('../services/apiClient');

    switch (action.type) {
      case 'CREATE_SALE':
        await apiClient.post('/api/sales', action.data);
        break;
      case 'UPDATE_INVENTORY':
        await apiClient.put(`/api/products/${action.productId}/stock`, action.data);
        break;
      case 'CREATE_CUSTOMER':
        await apiClient.post('/api/customers', action.data);
        break;
      default:
        console.warn('Unknown offline action type:', action.type);
    }
  };

  const clearOfflineQueue = () => {
    setOfflineQueue([]);
    AsyncStorage.removeItem('offlineQueue');
  };

  const contextValue: NetworkContextType = {
    isConnected,
    isOnline: isConnected,
    connectionType,
    offlineQueue,
    addToOfflineQueue,
    processOfflineQueue,
    clearOfflineQueue,
  };

  return (
    <NetworkContext.Provider value={contextValue}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork(): NetworkContextType {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}

export default NetworkContext;