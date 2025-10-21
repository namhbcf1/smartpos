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
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor'
            }
            // Let Vite auto-split MUI to avoid circular dependencies
            // if (id.includes('@mui')) {
            //   return 'mui'
            // }
            if (id.includes('@tanstack')) {
              return 'tanstack'
            }
            if (id.includes('axios')) {
              return 'axios'
            }
            if (id.includes('recharts')) {
              return 'charts'
            }
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000
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
