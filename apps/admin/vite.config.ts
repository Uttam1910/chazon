import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Environment files are read from the repository root, shared with the website and API.
// Only VITE_-prefixed values reach the browser bundle — never put secrets in them.
// ADMIN_BASE sets the URL path the Admin is served from: "/" on its own (local dev, standalone deploy),
// "/admin/" when deployed inside the website's Vercel project (see scripts/build-vercel.mjs).
export default defineConfig({
  base: process.env.ADMIN_BASE || '/',
  envDir: '../..',
  plugins: [react()],
  server: { port: 5174, strictPort: true },
  preview: { port: 4174 },
})
