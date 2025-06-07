import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.js',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'splash.jpg'],
      manifest: {
        "name": "Zyaka's Calendar: ваш персональный СДВГ планировщик",
        "short_name": "Zyaka's Calendar",
        "description": "Zyaka's Calendar помогает вам организовывать задачи, события и заметки.",
        "icons": [
          {
            "src": "icons/web/icon-192.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "any"
          },
          {
            "src": "icons/web/icon-512.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "any"
          },
          {
            "src": "icons/web/icon-192-maskable.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "maskable"
          },
          {
            "src": "icons/web/icon-512-maskable.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "maskable"
          },
          {
            "src": "icons/web/apple-touch-icon.png",
            "sizes": "180x180",
            "type": "image/png",
            "purpose": "any"
          },
          {
            "src": "icons/android/res/mipmap-mdpi/ic_launcher.png",
            "sizes": "48x48",
            "type": "image/png",
            "purpose": "any maskable"
          },
          {
            "src": "icons/android/res/mipmap-hdpi/ic_launcher.png",
            "sizes": "72x72",
            "type": "image/png",
            "purpose": "any maskable"
          },
          {
            "src": "icons/android/res/mipmap-xhdpi/ic_launcher.png",
            "sizes": "96x96",
            "type": "image/png",
            "purpose": "any maskable"
          },
          {
            "src": "icons/android/res/mipmap-xxhdpi/ic_launcher.png",
            "sizes": "144x144",
            "type": "image/png",
            "purpose": "any maskable"
          },
          {
            "src": "icons/android/res/mipmap-xxxhdpi/ic_launcher.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "any maskable"
          },
          {
            "src": "icons/android/play_store_512.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "any"
          }
        ],
        "start_url": "/",
        "display": "standalone",
        "scope": "/",
        "background_color": "#333",
        "theme_color": "#d6efc7",
        "orientation": "portrait-primary",
        "screenshots": [],
        "categories": ["productivity", "lifestyle", "utilities"]
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  test: {
    globals: true,
    mockReset: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.tsx', // Изменено на .tsx
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
