import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Expose environment variables at build time
    __VITE_DEBUG__: JSON.stringify(process.env.VITE_DEBUG === 'true'),
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(fileURLToPath(new URL('.', import.meta.url)), 'index.html'),
      }
    },
    // Увеличиваем лимит для предупреждений о размере
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 3005,
    host: true,
    cors: true
  },
  preview: {
    port: 4173,
    host: true,
    cors: true
  }
})