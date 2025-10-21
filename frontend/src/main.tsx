import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SnackbarProvider } from 'notistack';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SnackbarProvider maxSnack={4} preventDuplicate autoHideDuration={3000} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
      <App />
    </SnackbarProvider>
  </React.StrictMode>
);