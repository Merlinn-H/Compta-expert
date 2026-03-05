import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  // In standalone builds the React app is served by FastAPI on the same origin,
  // so all API calls go to window.location.origin (no separate server needed).
  define: {
    __STANDALONE__: mode === 'standalone',
  },
}))
