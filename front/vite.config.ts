import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
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
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg}'], // Шаблоны для кэширования
      },
      devOptions: {
        enabled: true, // Включаем PWA в режиме разработки для тестирования
      },
      // Манифест PWA уже настроен в public/manifest.json,
      // поэтому мы не будем его здесь переопределять,
      // если только не потребуется специфическая конфигурация для плагина.
      // manifest: false // Можно установить в false, если manifest.json полностью управляется вручную
      // или оставить как есть, если плагин должен его учитывать/обрабатывать.
      // Для текущей задачи, явное указание manifest: false не требуется,
      // так как мы фокусируемся на sw.js и кэшировании.
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
