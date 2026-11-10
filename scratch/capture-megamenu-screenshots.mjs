import fs from 'fs'
import path from 'path'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { execSync } from 'child_process'

const distDir = path.resolve('apps/web/dist')
const ssrBundle = path.resolve('apps/web/dist-ssr/entry-server.js')
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const artifactsDir = '/Users/growve-a13/.gemini/antigravity/brain/1ed614de-b83c-4b15-9a45-44a73a1b2431'

// Read and inline CSS
const cssFiles = fs.readdirSync(path.join(distDir, 'assets')).filter(f => f.endsWith('.css'))
let cssContent = ''
for (const f of cssFiles) {
  cssContent += fs.readFileSync(path.join(distDir, 'assets', f), 'utf8') + '\n'
}
cssContent = cssContent.replace(/url\(\/assets\//g, 'url(file://' + distDir + '/assets/')

// Read base HTML from dist/index.html (prerendered home page)
const baseHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8')

async function run() {
  const { Header } = await import(ssrBundle)

  const states = [
    {
      name: 'build',
      props: { defaultServicesOpen: true, defaultCategory: 'build' },
      viewport: { width: 1440, height: 950 },
      out: path.join(artifactsDir, 'megamenu_desktop_build.png'),
    },
    {
      name: 'market',
      props: { defaultServicesOpen: true, defaultCategory: 'market' },
      viewport: { width: 1440, height: 950 },
      out: path.join(artifactsDir, 'megamenu_desktop_market.png'),
    },
    {
      name: 'automate',
      props: { defaultServicesOpen: true, defaultCategory: 'automate' },
      viewport: { width: 1440, height: 950 },
      out: path.join(artifactsDir, 'megamenu_desktop_automate.png'),
    },
    {
      name: 'mobile',
      props: { defaultMobileOpen: true, defaultMobileServicesOpen: true },
      viewport: { width: 390, height: 844 },
      out: path.join(artifactsDir, 'megamenu_mobile_drawer.png'),
    },
  ]

  for (const s of states) {
    // Render custom Header HTML
    const headerHtml = renderToString(React.createElement(Header, s.props))

    // Replace <header ... </header> and <nav id="mobile-drawer" ... </nav> in baseHtml
    let html = baseHtml
    // In baseHtml, replace the existing header and mobile drawer
    // The existing markup starts with <header class="header" and has <nav id="mobile-drawer"
    const headerRegex = /<header class="header"[\s\S]*?<\/nav>\s*(?=<main|<div class="main|$)/i
    if (headerRegex.test(html)) {
      html = html.replace(headerRegex, headerHtml)
    } else {
      // Fallback: replace just header
      html = html.replace(/<header class="header"[\s\S]*?<\/header>/i, headerHtml)
    }

    // Prepare static HTML with inline CSS and file:// assets
    html = html.replace(/<link rel=\"stylesheet\"[^>]*>/g, '')
    html = html.replace('</head>', '<style>' + cssContent + '.services-dropdown-panel { animation: none !important; } .mm-content-grid { animation: none !important; } </style></head>')
    html = html.replace(/src=\"\/assets\//g, 'src=\"file://' + distDir + '/assets/')
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

    const tempFile = `/tmp/preview_mm_${s.name}.html`
    fs.writeFileSync(tempFile, html)

    // Capture screenshot
    execSync(
      `"${chrome}" --headless=new --no-sandbox --disable-gpu --allow-file-access-from-files --user-data-dir=/tmp/chrome-snap-mm-${s.name} --window-size=${s.viewport.width},${s.viewport.height} --screenshot="${s.out}" "file://${tempFile}"`,
      { stdio: 'ignore' }
    )
    console.log(`Captured ${s.name} -> ${s.out}`)
  }
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
