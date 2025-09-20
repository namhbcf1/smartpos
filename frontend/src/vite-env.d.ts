/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_TITLE: string
  readonly VITE_DEBUG: string
  readonly VITE_ENVIRONMENT: string
  // Add other env variables you need
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}