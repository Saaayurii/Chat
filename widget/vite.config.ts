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
        widget: resolve(fileURLToPath(new URL('.', import.meta.url)), 'src/widget.tsx'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Widget файл в IIFE формате для встраивания
          if (chunkInfo.name === 'widget') {
            return 'chat-widget.js';
          }
          return '[name]-[hash].js';
        },
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          // CSS файл для виджета
          if (assetInfo.name?.endsWith('.css') && assetInfo.name.includes('widget')) {
            return 'chat-widget.css';
          }
          return '[name]-[hash].[ext]';
        },
        format: 'iife',
        name: 'ChatWidgetBundle',
        inlineDynamicImports: false
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