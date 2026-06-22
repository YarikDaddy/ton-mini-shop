import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // @ton/core использует Buffer, которого нет в браузере по умолчанию.
    // Этот плагин добавляет полифилл — иначе аппа падает в белый экран.
    nodePolyfills({ globals: { Buffer: true } }),
  ],
})
