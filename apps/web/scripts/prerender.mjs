// Prerenders every fixed page of the website into static HTML after `vite build`, so each URL ships its own title,
// description, canonical, Open Graph tags, structured data and full content — readable without JavaScript.
//   dist/index.html, dist/<path>/index.html   fixed pages (hydrated in the browser)
//   dist/404.html                             served by static hosts for unknown URLs
//   dist/app-shell.html                       empty shell for articles and case studies (/insights/:slug, /work/:slug)
//   dist/sitemap.xml, robots.txt Sitemap line  when VITE_SITE_URL is set
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync, appendFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { loadEnv } from 'vite'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const ssr = join(root, 'dist-ssr')
const env = loadEnv('production', resolve(root, '../..'), 'VITE_')
const siteUrl = (env.VITE_SITE_URL || '').replace(/\/$/, '')
const apiUrl = (env.VITE_API_URL || '').replace(/\/$/, '')
const fail = message => { console.error(`✖ prerender: ${message}`); process.exit(1) }

const { render, PUBLIC_PAGES } = await import(pathToFileURL(join(ssr, 'entry-server.js')).href)
const template = readFileSync(join(dist, 'index.html'), 'utf8')
if (!template.includes('<!--app-html-->') || !/<!--app-head-->[\s\S]*<!--\/app-head-->/.test(template)) fail('index.html is missing its <!--app-head--> / <!--app-html--> markers')

// Preload the two fonts every page uses above the fold (body text and display headings), so text settles quickly.
const assets = readdirSync(join(dist, 'assets'))
const preloads = [/^geist-latin-wght-normal-.+\.woff2$/, /^instrument-serif-latin-400-normal-.+\.woff2$/]
  .map(pattern => assets.find(f => pattern.test(f)))
  .filter(Boolean)
  .map(file => `<link rel="preload" href="/assets/${file}" as="font" type="font/woff2" crossorigin>`)
  .join('')
const page = (head, html) => template.replace(/<!--app-head-->[\s\S]*<!--\/app-head-->/, preloads + head).replace('<!--app-html-->', html)

const write = (file, content) => { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, content) }
// Listing pages that aren't in the sitemap until content exists, but still deserve real HTML.
const extra = ['/insights', '/work']
for (const path of [...PUBLIC_PAGES, ...extra]) {
  const { html, head, status } = render(path)
  if (status !== 200) fail(`${path} rendered with status ${status}`)
  const h1 = (html.match(/<h1[\s>]/g) || []).length
  if (h1 !== 1) fail(`${path} has ${h1} <h1> elements (expected 1)`)
  if (!head.includes('<title')) fail(`${path} has no <title>`)
  write(path === '/' ? join(dist, 'index.html') : join(dist, path.slice(1), 'index.html'), page(head, html))
}
const notFound = render('/__not-found__')
write(join(dist, '404.html'), page(notFound.head, notFound.html))
write(join(dist, 'app-shell.html'), template.replace(/<!--app-head-->[\s\S]*<!--\/app-head-->/, `${preloads}<title>Chazon Digital Ventures</title>`)
  .replace('<!--app-html-->', '').replace('</body>', '<noscript><p style="font-family:sans-serif;padding:24px">Please enable JavaScript to read this page, or visit <a href="/">the Chazon Digital Ventures homepage</a>.</p></noscript></body>'))

if (siteUrl) {
  const url = new URL(siteUrl)
  if (!['https:', 'http:'].includes(url.protocol)) fail('VITE_SITE_URL must be an HTTP(S) URL')
  const xml = v => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
  write(join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${PUBLIC_PAGES.map(p => `<url><loc>${xml(siteUrl + p)}</loc></url>`).join('')}</urlset>`)
  // The API's sitemap adds published articles and case studies to the same fixed pages.
  const robots = join(dist, 'robots.txt')
  if (existsSync(robots)) appendFileSync(robots, `\nSitemap: ${siteUrl}/sitemap.xml\n${apiUrl ? `Sitemap: ${apiUrl}/api/public/sitemap.xml\n` : ''}`)
}

rmSync(ssr, { recursive: true, force: true })
console.log(`✔ Prerendered ${PUBLIC_PAGES.length + extra.length} pages, 404.html and app-shell.html${siteUrl ? ' + sitemap.xml' : ' (no VITE_SITE_URL: canonicals, structured data and sitemap skipped)'}`)
