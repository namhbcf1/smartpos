import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  build: {
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Core React
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor'
            }
            // Data fetching
            if (id.includes('@tanstack')) {
              return 'tanstack'
            }
            // HTTP client
            if (id.includes('axios')) {
              return 'axios'
            }
            // Charts
            if (id.includes('recharts')) {
              return 'charts'
            }
            // Let Vite auto-split MUI completely to avoid circular dependencies
            // Both @mui/material and @mui/icons-material have interdependencies
          }
        }
      }
    },
    chunkSizeWarningLimit: 600,
    cssCodeSplit: true,
    sourcemap: false
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@mui/icons-material',
      '@tanstack/react-query',
      'axios'
    ]
  }
})
