/**
 * Offline data management slice for SmartPOS Mobile
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface OfflineAction {
  id: string;
  type: 'CREATE_SALE' | 'UPDATE_PRODUCT' | 'CREATE_CUSTOMER' | 'SYNC_INVENTORY';
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: 'high' | 'medium' | 'low';
}

export interface OfflineState {
  isOnline: boolean;
  pendingActions: OfflineAction[];
  failedActions: OfflineAction[];
  lastSync: number | null;
  syncInProgress: boolean;
  offlineData: {
    products: any[];
    categories: any[];
    customers: any[];
    settings: any;
  };
  queueStats: {
    totalPending: number;
    totalFailed: number;
    lastProcessed: number | null;
  };
}

const initialState: OfflineState = {
  isOnline: true,
  pendingActions: [],
  failedActions: [],
  lastSync: null,
  syncInProgress: false,
  offlineData: {
    products: [],
    categories: [],
    customers: [],
    settings: null,
  },
  queueStats: {
    totalPending: 0,
    totalFailed: 0,
    lastProcessed: null,
  },
};

const offlineSlice = createSlice({
  name: 'offline',
  initialState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },

    addPendingAction: (state, action: PayloadAction<Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>>) => {
      const newAction: OfflineAction = {
        ...action.payload,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        retryCount: 0,
      };
      
      state.pendingActions.push(newAction);
      state.queueStats.totalPending = state.pendingActions.length;
    },

    removePendingAction: (state, action: PayloadAction<string>) => {
      state.pendingActions = state.pendingActions.filter(
        action => action.id !== action.payload
      );
      state.queueStats.totalPending = state.pendingActions.length;
      state.queueStats.lastProcessed = Date.now();
    },

    moveToFailedActions: (state, action: PayloadAction<string>) => {
      const actionIndex = state.pendingActions.findIndex(
        a => a.id === action.payload
      );
      
      if (actionIndex !== -1) {
        const failedAction = state.pendingActions[actionIndex];
        failedAction.retryCount++;
        
        state.failedActions.push(failedAction);
        state.pendingActions.splice(actionIndex, 1);
        
        state.queueStats.totalPending = state.pendingActions.length;
        state.queueStats.totalFailed = state.failedActions.length;
      }
    },

    retryFailedAction: (state, action: PayloadAction<string>) => {
      const actionIndex = state.failedActions.findIndex(
        a => a.id === action.payload
      );
      
      if (actionIndex !== -1) {
        const retryAction = state.failedActions[actionIndex];
        
        if (retryAction.retryCount < retryAction.maxRetries) {
          state.pendingActions.push(retryAction);
          state.failedActions.splice(actionIndex, 1);
          
          state.queueStats.totalPending = state.pendingActions.length;
          state.queueStats.totalFailed = state.failedActions.length;
        }
      }
    },

    clearFailedActions: (state) => {
      state.failedActions = [];
      state.queueStats.totalFailed = 0;
    },

    setSyncInProgress: (state, action: PayloadAction<boolean>) => {
      state.syncInProgress = action.payload;
    },

    updateLastSync: (state) => {
      state.lastSync = Date.now();
    },

    // Offline data management
    setOfflineProducts: (state, action: PayloadAction<any[]>) => {
      state.offlineData.products = action.payload;
    },

    setOfflineCategories: (state, action: PayloadAction<any[]>) => {
      state.offlineData.categories = action.payload;
    },

    setOfflineCustomers: (state, action: PayloadAction<any[]>) => {
      state.offlineData.customers = action.payload;
    },

    setOfflineSettings: (state, action: PayloadAction<any>) => {
      state.offlineData.settings = action.payload;
    },

    updateOfflineProduct: (state, action: PayloadAction<{ id: number; updates: any }>) => {
      const { id, updates } = action.payload;
      const productIndex = state.offlineData.products.findIndex(p => p.id === id);
      
      if (productIndex !== -1) {
        state.offlineData.products[productIndex] = {
          ...state.offlineData.products[productIndex],
          ...updates,
        };
      }
    },

    addOfflineCustomer: (state, action: PayloadAction<any>) => {
      // Add temporary ID for offline customers
      const customer = {
        ...action.payload,
        id: `temp_${Date.now()}`,
        isOffline: true,
      };
      state.offlineData.customers.push(customer);
    },

    // Priority queue management
    reorderPendingActions: (state) => {
      state.pendingActions.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    },

    // Bulk operations
    addBulkPendingActions: (state, action: PayloadAction<Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>[]>) => {
      const newActions = action.payload.map(actionData => ({
        ...actionData,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        retryCount: 0,
      }));
      
      state.pendingActions.push(...newActions);
      state.queueStats.totalPending = state.pendingActions.length;
    },

    clearAllPendingActions: (state) => {
      state.pendingActions = [];
      state.queueStats.totalPending = 0;
    },

    // Statistics and monitoring
    updateQueueStats: (state) => {
      state.queueStats = {
        totalPending: state.pendingActions.length,
        totalFailed: state.failedActions.length,
        lastProcessed: state.queueStats.lastProcessed,
      };
    },
  },
});

export const {
  setOnlineStatus,
  addPendingAction,
  removePendingAction,
  moveToFailedActions,
  retryFailedAction,
  clearFailedActions,
  setSyncInProgress,
  updateLastSync,
  setOfflineProducts,
  setOfflineCategories,
  setOfflineCustomers,
  setOfflineSettings,
  updateOfflineProduct,
  addOfflineCustomer,
  reorderPendingActions,
  addBulkPendingActions,
  clearAllPendingActions,
  updateQueueStats,
} = offlineSlice.actions;

export default offlineSlice.reducer;

// Selectors
export const selectIsOnline = (state: { offline: OfflineState }) => state.offline.isOnline;
export const selectPendingActions = (state: { offline: OfflineState }) => state.offline.pendingActions;
export const selectFailedActions = (state: { offline: OfflineState }) => state.offline.failedActions;
export const selectSyncInProgress = (state: { offline: OfflineState }) => state.offline.syncInProgress;
export const selectOfflineData = (state: { offline: OfflineState }) => state.offline.offlineData;
export const selectQueueStats = (state: { offline: OfflineState }) => state.offline.queueStats;
export const selectLastSync = (state: { offline: OfflineState }) => state.offline.lastSync;