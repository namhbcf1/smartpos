/**
 * Network Status Hook - Online-Only POS System
 * Monitors both browser network status and API health
 * Blocks critical operations when network is unavailable
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export interface NetworkStatus {
  isOnline: boolean;           // Browser online status
  apiHealthy: boolean;         // API reachability status
  isConnected: boolean;        // Combined status (both must be true)
  lastChecked: Date | null;    // Last health check time
  error: string | null;        // Error message if any
  retryCount: number;          // Number of retry attempts
}

export interface NetworkConfig {
  healthCheckUrl?: string;     // Health check endpoint
  checkInterval?: number;      // Check interval in ms (default: 5000)
  timeout?: number;           // Request timeout in ms (default: 3000)
  maxRetries?: number;        // Max retry attempts (default: 3)
  retryDelay?: number;        // Delay between retries in ms (default: 1000)
}

const DEFAULT_CONFIG: Required<NetworkConfig> = {
  healthCheckUrl: '/api/health',
  checkInterval: 5000,         // 5 seconds
  timeout: 3000,              // 3 seconds
  maxRetries: 3,
  retryDelay: 1000,           // 1 second
};

export const useNetworkStatus = (config: NetworkConfig = {}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    apiHealthy: true,
    isConnected: navigator.onLine,
    lastChecked: null,
    error: null,
    retryCount: 0,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check API health with retry logic
  const checkApiHealth = useCallback(async (retryCount = 0): Promise<boolean> => {
    try {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();
      
      const response = await fetch(finalConfig.healthCheckUrl, {
        method: 'GET',
        signal: abortControllerRef.current.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        // Add timeout
        ...((finalConfig.timeout && {
          signal: AbortSignal.timeout(finalConfig.timeout)
        }) || {})
      });

      if (!response.ok) {
        throw new Error(`API health check failed: ${response.status} ${response.statusText}`);
      }

      // Optionally parse response to check detailed health status
      const healthData = await response.json();
      if (healthData && typeof healthData === 'object' && healthData.status === 'error') {
        throw new Error(healthData.message || 'API reported unhealthy status');
      }

      return true;
    } catch (error) {
      console.warn(`API health check failed (attempt ${retryCount + 1}):`, error);

      // Retry logic
      if (retryCount < finalConfig.maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, finalConfig.retryDelay));
        return checkApiHealth(retryCount + 1);
      }

      return false;
    }
  }, [finalConfig]);

  // Update network status
  const updateStatus = useCallback(async () => {
    const browserOnline = navigator.onLine;
    let apiHealthy = false;
    let error: string | null = null;
    let retryCount = 0;

    if (browserOnline) {
      try {
        apiHealthy = await checkApiHealth();
        if (!apiHealthy) {
          error = 'API health check failed after retries';
          retryCount = finalConfig.maxRetries;
        }
      } catch (err) {
        apiHealthy = false;
        error = err instanceof Error ? err.message : 'Unknown API error';
        retryCount = finalConfig.maxRetries;
      }
    } else {
      error = 'Browser reports offline status';
    }

    setStatus(prevStatus => ({
      ...prevStatus,
      isOnline: browserOnline,
      apiHealthy,
      isConnected: browserOnline && apiHealthy,
      lastChecked: new Date(),
      error,
      retryCount,
    }));
  }, [checkApiHealth, finalConfig.maxRetries]);

  // Manual refresh function
  const refresh = useCallback(() => {
    updateStatus();
  }, [updateStatus]);

  // Set up periodic health checks
  useEffect(() => {
    // Initial check
    updateStatus();

    // Set up interval for periodic checks
    intervalRef.current = setInterval(updateStatus, finalConfig.checkInterval);

    // Browser online/offline event listeners
    const handleOnline = () => {
      console.log('🟢 Browser online event detected');
      updateStatus();
    };

    const handleOffline = () => {
      console.log('🔴 Browser offline event detected');
      setStatus(prevStatus => ({
        ...prevStatus,
        isOnline: false,
        isConnected: false,
        error: 'Browser reports offline status',
        lastChecked: new Date(),
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [updateStatus, finalConfig.checkInterval]);

  return {
    ...status,
    refresh,
  };
};

// Hook for components that need to check network before critical operations
export const useNetworkGuard = (config?: NetworkConfig) => {
  const networkStatus = useNetworkStatus(config);

  const checkNetworkBeforeAction = useCallback(
    (action: () => void | Promise<void>, onBlocked?: (reason: string) => void) => {
      if (!networkStatus.isConnected) {
        const reason = networkStatus.error || 'Network connection unavailable';
        console.warn('🚫 Action blocked due to network status:', reason);
        onBlocked?.(reason);
        return false;
      }
      
      // Execute action if network is available
      try {
        const result = action();
        if (result instanceof Promise) {
          result.catch(error => {
            console.error('Action failed despite network check:', error);
          });
        }
        return true;
      } catch (error) {
        console.error('Action failed:', error);
        return false;
      }
    },
    [networkStatus.isConnected, networkStatus.error]
  );

  return {
    ...networkStatus,
    checkNetworkBeforeAction,
  };
};

export default useNetworkStatus;