import fs from 'fs'
import path from 'path'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { execSync } from 'child_process'

// Let's import Header from dist-ssr
const ssrBundle = path.resolve('apps/web/dist-ssr/entry-server.js')
const distDir = path.resolve('apps/web/dist')

// Read CSS to inline
const cssFiles = fs.readdirSync(path.join(distDir, 'assets')).filter(f => f.endsWith('.css'))
let cssContent = ''
for (const f of cssFiles) {
  cssContent += fs.readFileSync(path.join(distDir, 'assets', f), 'utf8') + '\n'
}
cssContent = cssContent.replace(/url\(\/assets\//g, 'url(file://' + distDir + '/assets/')

// Read prerendered home page HTML to get full structure
const homeHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8')

// Let's write a function to replace the header in homeHtml with custom Header render
async function generatePreview(name, headerProps, viewport = { width: 1440, height: 950 }) {
  // Let's dynamically import the SSR bundle
  const ssrModule = await import(ssrBundle)
  
  // Create HTML template with inlined styles and no hydration script
  let tpl = homeHtml
  tpl = tpl.replace(/<link rel=\"stylesheet\"[^>]*>/g, '')
  tpl = tpl.replace('</head>', '<style>' + cssContent + '</style></head>')
  tpl = tpl.replace(/src=\"\/assets\//g, 'src=\"file://' + distDir + '/assets/')
  tpl = tpl.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  // Render Header with custom props
  // We can render Header component if exported or find the header in HTML and replace it
  const htmlPath = `/tmp/preview_${name}.html`
  fs.writeFileSync(htmlPath, tpl)
  console.log('Written', htmlPath)
}

generatePreview('test', {})
