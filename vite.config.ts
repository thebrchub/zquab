import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    proxy: {
      // Proxy HTTP API requests to your deployed backend
      '/api': {
        target: 'https://api.zquab.com',
        changeOrigin: true,
      },
      // Proxy WebSocket connections to your deployed backend
      '/ws': {
        target: 'wss://api.zquab.com',
        changeOrigin: true,
        ws: true,
      }
    }
  }
})