/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// Environment files live at the repository root (shared with the Admin and API). Only VITE_ values reach the browser.
// `npm run build` also prerenders every fixed page and writes the sitemap (scripts/prerender.mjs).
export default defineConfig({
  envDir: resolve(import.meta.dirname, '../..'),
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
  // The shared package ships TypeScript source, so the build-time renderer bundles it rather than importing it from Node.
  ssr: { noExternal: ['@chazon/shared'] },
  test: { environment: 'node', include: ['src/**/*.test.{ts,tsx}'] },
})
