import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath, URL } from 'node:url'

// Отдельная конфигурация только для виджета
export default defineConfig({
  plugins: [react()],
  define: {
    __VITE_DEBUG__: JSON.stringify(process.env.VITE_DEBUG === 'true'),
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env': JSON.stringify({}),
    'global': 'globalThis',
  },
  build: {
    lib: {
      entry: resolve(fileURLToPath(new URL('.', import.meta.url)), 'src/widget.tsx'),
      name: 'ChatWidget',
      fileName: 'chat-widget',
      formats: ['iife']
    },
    rollupOptions: {
      external: [],
      output: {
        inlineDynamicImports: true,
        assetFileNames: 'chat-widget.[ext]',
      }
    },
    chunkSizeWarningLimit: 1000,
    outDir: 'dist'
  }
})