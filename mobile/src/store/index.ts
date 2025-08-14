/**
 * Redux store configuration with offline support for SmartPOS Mobile
 */

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createEncryptor from 'redux-persist-transform-encrypt';

// Reducers
import authReducer from './slices/authSlice';
import productsReducer from './slices/productsSlice';
import salesReducer from './slices/salesSlice';
import cartReducer from './slices/cartSlice';
import offlineReducer from './slices/offlineSlice';
import settingsReducer from './slices/settingsSlice';
import syncReducer from './slices/syncSlice';

// Encryption for sensitive data
const encryptor = createEncryptor({
  secretKey: 'smartpos-mobile-encryption-key-2024',
  onError: (error) => {
    console.error('Redux persist encryption error:', error);
  },
});

// Persist configuration
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'settings', 'offline'], // Only persist these reducers
  transforms: [encryptor],
};

const offlinePersistConfig = {
  key: 'offline',
  storage: AsyncStorage,
  blacklist: ['isOnline', 'lastSync'], // Don't persist these fields
};

const settingsPersistConfig = {
  key: 'settings',
  storage: AsyncStorage,
};

// Root reducer
const rootReducer = combineReducers({
  auth: authReducer,
  products: productsReducer,
  sales: salesReducer,
  cart: cartReducer,
  offline: persistReducer(offlinePersistConfig, offlineReducer),
  settings: persistReducer(settingsPersistConfig, settingsReducer),
  sync: syncReducer,
});

// Persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Store configuration
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredPaths: ['register'],
      },
    }),
  devTools: __DEV__,
});

export const persistor = persistStore(store);

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;