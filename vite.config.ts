import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { appendFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
export default defineConfig(({ mode }) => {
  const siteUrl = loadEnv(mode, '.', 'VITE_').VITE_SITE_URL?.replace(/\/$/, '')
  let outDir = 'dist'
  return { plugins: [react(), {
    name: 'chazon-sitemap',
    configResolved(config) { outDir = resolve(config.root, config.build.outDir) },
    generateBundle() {
      if (!siteUrl) return
      const url = new URL(siteUrl)
      if (!['https:', 'http:'].includes(url.protocol)) throw new Error('VITE_SITE_URL must be an HTTP(S) URL')
      const escaped = siteUrl.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escaped}/</loc></url></urlset>` })
    },
    // public/robots.txt is copied as-is; point crawlers at the sitemap once a production URL is known.
    closeBundle() {
      const robots = resolve(outDir, 'robots.txt')
      if (siteUrl && existsSync(robots)) appendFileSync(robots, `\nSitemap: ${siteUrl}/sitemap.xml\n`)
    },
  }] }
})
