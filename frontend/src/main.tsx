import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './modules/app/App'
import { AuthProvider } from './contexts/AuthContext'
import './styles.css'

console.log('🚀 Main.tsx is loading...');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

try {
  const rootElement = document.getElementById('root');
  console.log('📍 Root element found:', !!rootElement);

  if (!rootElement) {
    console.error('❌ Root element not found!');
    document.body.innerHTML = '<div style="padding:20px;color:red;">ERROR: Root element not found!</div>';
  } else {
    console.log('✅ Creating React root...');
    const root = ReactDOM.createRoot(rootElement);

    console.log('🔄 Rendering App with providers...');
    root.render(
      <React.StrictMode>
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <App />
            </AuthProvider>
          </QueryClientProvider>
        </BrowserRouter>
      </React.StrictMode>
    );
    console.log('✅ App rendered successfully!');
  }
} catch (error) {
  console.error('❌ Error in main.tsx:', error);
  document.body.innerHTML = '<div style="padding:20px;color:red;">React Loading Error: ' + error + '</div>';
}
