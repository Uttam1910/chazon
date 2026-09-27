import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig(({ mode }) => {
  const siteUrl = loadEnv(mode, '.', 'VITE_').VITE_SITE_URL?.replace(/\/$/, '')
  return { plugins: [react(), {
    name: 'chazon-sitemap',
    generateBundle() {
      if (!siteUrl) return
      const url = new URL(siteUrl)
      if (!['https:', 'http:'].includes(url.protocol)) throw new Error('VITE_SITE_URL must be an HTTP(S) URL')
      const escaped = siteUrl.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escaped}/</loc></url></urlset>` })
    },
  }] }
})
