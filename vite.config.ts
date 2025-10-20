import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    // Environment variables with VITE_ prefix are automatically exposed to client
    define: {
      __DEV__: mode === 'development',
    },
    server: {
      port: 5173,
      host: true, // Allow access from other devices on the network
    },
    preview: {
      port: 4173,
      host: true,
    },
  }
})
