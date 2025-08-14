/**
 * Offline synchronization service for SmartPOS Mobile
 */

import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../store';
import {
  setOnlineStatus,
  addPendingAction,
  removePendingAction,
  moveToFailedActions,
  setSyncInProgress,
  updateLastSync,
  setOfflineProducts,
  setOfflineCategories,
  setOfflineCustomers,
  setOfflineSettings,
  OfflineAction,
} from '../store/slices/offlineSlice';
import { ApiService } from './ApiService';

export interface SyncResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
}

export class OfflineService {
  private static instance: OfflineService;
  private syncInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;
  private maxRetries = 3;
  private syncIntervalMs = 30000; // 30 seconds

  static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  /**
   * Initialize offline service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Monitor network connectivity
      this.setupNetworkMonitoring();
      
      // Load offline data
      await this.loadOfflineData();
      
      // Start sync interval
      this.startSyncInterval();
      
      this.isInitialized = true;
      console.log('OfflineService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OfflineService:', error);
      throw error;
    }
  }

  /**
   * Setup network connectivity monitoring
   */
  private setupNetworkMonitoring(): void {
    NetInfo.addEventListener(state => {
      const isOnline = state.isConnected && state.isInternetReachable;
      store.dispatch(setOnlineStatus(isOnline));
      
      if (isOnline) {
        console.log('Network connected - starting sync');
        this.syncPendingActions();
      } else {
        console.log('Network disconnected - entering offline mode');
      }
    });
  }

  /**
   * Load essential data for offline operation
   */
  private async loadOfflineData(): Promise<void> {
    try {
      const state = store.getState();
      if (!state.offline.isOnline) {
        // Load from local storage
        const [products, categories, customers, settings] = await Promise.all([
          this.getStoredData('offline_products'),
          this.getStoredData('offline_categories'),
          this.getStoredData('offline_customers'),
          this.getStoredData('offline_settings'),
        ]);

        store.dispatch(setOfflineProducts(products || []));
        store.dispatch(setOfflineCategories(categories || []));
        store.dispatch(setOfflineCustomers(customers || []));
        store.dispatch(setOfflineSettings(settings));
      } else {
        // Fetch fresh data from server
        await this.downloadEssentialData();
      }
    } catch (error) {
      console.error('Failed to load offline data:', error);
    }
  }

  /**
   * Download essential data for offline use
   */
  async downloadEssentialData(): Promise<void> {
    try {
      const [products, categories, customers, settings] = await Promise.all([
        ApiService.getProducts(),
        ApiService.getCategories(),
        ApiService.getCustomers(),
        ApiService.getSettings(),
      ]);

      // Store in Redux
      store.dispatch(setOfflineProducts(products));
      store.dispatch(setOfflineCategories(categories));
      store.dispatch(setOfflineCustomers(customers));
      store.dispatch(setOfflineSettings(settings));

      // Store locally for offline access
      await Promise.all([
        this.storeData('offline_products', products),
        this.storeData('offline_categories', categories),
        this.storeData('offline_customers', customers),
        this.storeData('offline_settings', settings),
      ]);

      console.log('Essential data downloaded and cached');
    } catch (error) {
      console.error('Failed to download essential data:', error);
      throw error;
    }
  }

  /**
   * Add action to offline queue
   */
  async queueAction(
    type: OfflineAction['type'],
    endpoint: string,
    method: OfflineAction['method'],
    data: any,
    priority: OfflineAction['priority'] = 'medium'
  ): Promise<void> {
    const action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'> = {
      type,
      endpoint,
      method,
      data,
      priority,
      maxRetries: this.maxRetries,
    };

    store.dispatch(addPendingAction(action));
    
    // Try to sync immediately if online
    const state = store.getState();
    if (state.offline.isOnline && !state.offline.syncInProgress) {
      this.syncPendingActions();
    }
  }

  /**
   * Sync pending actions with server
   */
  async syncPendingActions(): Promise<SyncResult> {
    const state = store.getState();
    
    if (!state.offline.isOnline || state.offline.syncInProgress) {
      return { success: false, processed: 0, failed: 0, errors: ['Sync already in progress or offline'] };
    }

    store.dispatch(setSyncInProgress(true));
    
    const result: SyncResult = {
      success: true,
      processed: 0,
      failed: 0,
      errors: [],
    };

    try {
      const pendingActions = state.offline.pendingActions;
      
      for (const action of pendingActions) {
        try {
          await this.executeAction(action);
          store.dispatch(removePendingAction(action.id));
          result.processed++;
        } catch (error) {
          console.error(`Failed to execute action ${action.id}:`, error);
          store.dispatch(moveToFailedActions(action.id));
          result.failed++;
          result.errors.push(`Action ${action.type}: ${error.message}`);
        }
      }

      store.dispatch(updateLastSync());
      console.log(`Sync completed: ${result.processed} processed, ${result.failed} failed`);
      
    } catch (error) {
      console.error('Sync process failed:', error);
      result.success = false;
      result.errors.push(error.message);
    } finally {
      store.dispatch(setSyncInProgress(false));
    }

    return result;
  }

  /**
   * Execute a single offline action
   */
  private async executeAction(action: OfflineAction): Promise<any> {
    switch (action.method) {
      case 'POST':
        return await ApiService.post(action.endpoint, action.data);
      case 'PUT':
        return await ApiService.put(action.endpoint, action.data);
      case 'PATCH':
        return await ApiService.patch(action.endpoint, action.data);
      case 'DELETE':
        return await ApiService.delete(action.endpoint);
      default:
        throw new Error(`Unsupported method: ${action.method}`);
    }
  }

  /**
   * Start automatic sync interval
   */
  private startSyncInterval(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      const state = store.getState();
      if (state.offline.isOnline && state.offline.pendingActions.length > 0) {
        this.syncPendingActions();
      }
    }, this.syncIntervalMs);
  }

  /**
   * Stop automatic sync interval
   */
  stopSyncInterval(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Force full sync (download + upload)
   */
  async forceFullSync(): Promise<SyncResult> {
    try {
      // Download latest data
      await this.downloadEssentialData();
      
      // Upload pending changes
      return await this.syncPendingActions();
    } catch (error) {
      console.error('Force sync failed:', error);
      return {
        success: false,
        processed: 0,
        failed: 0,
        errors: [error.message],
      };
    }
  }

  /**
   * Check if device can operate offline
   */
  canOperateOffline(): boolean {
    const state = store.getState();
    const { products, categories, settings } = state.offline.offlineData;
    
    return products.length > 0 && categories.length > 0 && settings !== null;
  }

  /**
   * Get offline data freshness
   */
  getDataFreshness(): {
    lastSync: number | null;
    hoursOld: number | null;
    isStale: boolean;
  } {
    const state = store.getState();
    const lastSync = state.offline.lastSync;
    
    if (!lastSync) {
      return { lastSync: null, hoursOld: null, isStale: true };
    }

    const hoursOld = (Date.now() - lastSync) / (1000 * 60 * 60);
    const isStale = hoursOld > 24; // Consider data stale after 24 hours

    return { lastSync, hoursOld, isStale };
  }

  /**
   * Clear all offline data
   */
  async clearOfflineData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem('offline_products'),
        AsyncStorage.removeItem('offline_categories'),
        AsyncStorage.removeItem('offline_customers'),
        AsyncStorage.removeItem('offline_settings'),
      ]);

      store.dispatch(setOfflineProducts([]));
      store.dispatch(setOfflineCategories([]));
      store.dispatch(setOfflineCustomers([]));
      store.dispatch(setOfflineSettings(null));

      console.log('Offline data cleared');
    } catch (error) {
      console.error('Failed to clear offline data:', error);
      throw error;
    }
  }

  /**
   * Get sync statistics
   */
  getSyncStats(): {
    pendingCount: number;
    failedCount: number;
    lastSync: number | null;
    isOnline: boolean;
    canSync: boolean;
  } {
    const state = store.getState();
    
    return {
      pendingCount: state.offline.pendingActions.length,
      failedCount: state.offline.failedActions.length,
      lastSync: state.offline.lastSync,
      isOnline: state.offline.isOnline,
      canSync: state.offline.isOnline && !state.offline.syncInProgress,
    };
  }

  // Helper methods
  private async storeData(key: string, data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Failed to store ${key}:`, error);
    }
  }

  private async getStoredData(key: string): Promise<any> {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Failed to get ${key}:`, error);
      return null;
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopSyncInterval();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const offlineService = OfflineService.getInstance();