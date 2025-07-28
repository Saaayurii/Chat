import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath, URL } from 'node:url'

// Конфигурация для сборки виджета в IIFE формате
export default defineConfig({
  plugins: [react()],
  define: {
    __VITE_DEBUG__: JSON.stringify(false),
    'process.env.NODE_ENV': JSON.stringify('production'),
    'import.meta.env.VITE_API_URL': JSON.stringify('http://localhost:3004'),
    'import.meta.env.MODE': JSON.stringify('production'),
    'import.meta.env.PROD': JSON.stringify(true),
    'import.meta.env.DEV': JSON.stringify(false),
  },
  build: {
    lib: {
      entry: resolve(fileURLToPath(new URL('.', import.meta.url)), 'src/widget.tsx'),
      name: 'ChatWidget',
      fileName: 'chat-widget',
      formats: ['iife']
    },
    rollupOptions: {
      output: {
        entryFileNames: 'chat-widget.iife.js',
        assetFileNames: 'chat-widget.css',
        inlineDynamicImports: true,
        extend: true, // Позволяет добавлять к существующему глобальному объекту
      },
      external: [], // Не делаем ничего внешним
    },
    // Увеличиваем лимит для предупреждений о размере
    chunkSizeWarningLimit: 1000
  }
})