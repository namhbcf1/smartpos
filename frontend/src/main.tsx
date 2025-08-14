import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { Toaster } from 'react-hot-toast'

import App from './App'
import theme from './theme'
import './index.css'

// Import self-hosted fonts for better performance
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'

// Optimized QueryClient configuration for better performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnMount: false,
      refetchOnReconnect: 'always',
      // Optimize network requests
      networkMode: 'online',
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
})

// COMPLETELY DISABLE ServiceWorker - Force unregister and prevent registration
if ('serviceWorker' in navigator) {
  // Unregister ALL existing service workers immediately
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    console.log('🔧 Found', registrations.length, 'service worker registrations');
    for(let registration of registrations) {
      registration.unregister().then(function(success) {
        console.log('🗑️ ServiceWorker unregistered:', success, registration.scope);
      });
    }
  });

  // Clear ALL caches to prevent interference
  if ('caches' in window) {
    caches.keys().then(function(names) {
      console.log('🧹 Found', names.length, 'caches to delete');
      for (let name of names) {
        caches.delete(name).then(function(success) {
          console.log('🗑️ Cache deleted:', name, success);
        });
      }
    });
  }

  // Override service worker registration to prevent any future registration
  navigator.serviceWorker.register = function() {
    console.log('🚫 ServiceWorker registration blocked');
    return Promise.reject(new Error('ServiceWorker registration disabled'));
  };
}

// Disable service worker temporarily to fix CORS issues
// TODO: Re-enable after fixing ServiceWorker CORS handling
/*
if ('serviceWorker' in navigator && import.meta.env.MODE === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SmartPOS SW: Registration successful', registration.scope);
      })
      .catch((error) => {
        console.log('SmartPOS SW: Registration failed', error);
      });
  });
}
*/

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
          <Toaster position="top-right" />
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
)