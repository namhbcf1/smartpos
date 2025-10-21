/**
 * Smart POS Mobile Application
 * Main entry point for the React Native mobile app
 */

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { QueryClient, QueryClientProvider } from 'react-query';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import NetInfo from '@react-native-community/netinfo';

import { store } from './src/store/store';
import { theme } from './src/theme/theme';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { NetworkProvider } from './src/contexts/NetworkContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import ErrorBoundary from './src/components/ErrorBoundary';
import LoadingScreen from './src/screens/LoadingScreen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts
        await Font.loadAsync({
          'Roboto-Regular': require('./assets/fonts/Roboto-Regular.ttf'),
          'Roboto-Medium': require('./assets/fonts/Roboto-Medium.ttf'),
          'Roboto-Bold': require('./assets/fonts/Roboto-Bold.ttf'),
        });

        // Set up network listener
        const unsubscribe = NetInfo.addEventListener(state => {
          setIsConnected(state.isConnected ?? true);
        });

        // Initialize other services
        await initializeApp();

        // Artificially delay for at least 1 second for splash screen
        await new Promise(resolve => setTimeout(resolve, 1000));

        return unsubscribe;
      } catch (e) {
        console.warn('Error during app initialization:', e);
      } finally {
        setIsLoading(false);
        SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  const initializeApp = async () => {
    // Initialize services, load cached data, etc.
    console.log('🚀 Smart POS Mobile App initializing...');

    // TODO: Initialize authentication
    // TODO: Load cached offline data
    // TODO: Set up push notifications
    // TODO: Initialize barcode scanner

    console.log('✅ Smart POS Mobile App initialized');
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <ReduxProvider store={store}>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={theme}>
            <NavigationContainer>
              <NetworkProvider value={{ isConnected }}>
                <AuthProvider>
                  <NotificationProvider>
                    <AppNavigator />
                    <StatusBar style="auto" />
                  </NotificationProvider>
                </AuthProvider>
              </NetworkProvider>
            </NavigationContainer>
          </PaperProvider>
        </QueryClientProvider>
      </ReduxProvider>
    </ErrorBoundary>
  );
}