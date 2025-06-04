import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'public', // Указываем, что наш sw.js находится в public
      filename: 'sw.js', // Имя нашего сервис-воркера
      registerType: 'autoUpdate',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,json}'], // Шаблоны для кэширования
      },
      devOptions: {
        enabled: true, // Включаем PWA в режиме разработки для тестирования
      },
    }),
  ],
  test: {
    globals: true,
    mockReset: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    include: ['**/*.test.{ts,tsx}'],
  },
  server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
    },
  }
  }
})
