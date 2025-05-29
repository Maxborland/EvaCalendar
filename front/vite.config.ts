import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
