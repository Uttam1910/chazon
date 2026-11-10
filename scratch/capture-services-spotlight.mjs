import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const distDir = path.resolve('apps/web/dist')
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const artifactsDir = '/Users/growve-a13/.gemini/antigravity/brain/1ed614de-b83c-4b15-9a45-44a73a1b2431'

// Inline CSS into services index.html
const cssFiles = fs.readdirSync(path.join(distDir, 'assets')).filter(f => f.endsWith('.css'))
let cssContent = ''
for (const f of cssFiles) {
  cssContent += fs.readFileSync(path.join(distDir, 'assets', f), 'utf8') + '\n'
}
cssContent = cssContent.replace(/url\(\/assets\//gi, 'url(file://' + distDir + '/assets/')

let fullHtml = fs.readFileSync(path.join(distDir, 'services/index.html'), 'utf8')
const match = fullHtml.match(/<section class="services-spotlight-section[\s\S]*?<\/section>/)

let snippet = match ? match[0] : 'not found'
snippet = snippet.replace(/src="\/assets\//gi, 'src="file://' + distDir + '/assets/')
snippet = snippet.replace(/srcset="\/assets\//gi, 'srcset="file://' + distDir + '/assets/')

const previewHtml = `<!doctype html>
<html>
<head>
  <style>
    body { margin: 0; background: #FAF7F2; font-family: sans-serif; }
    ${cssContent}
  </style>
</head>
<body>
  ${snippet}
</body>
</html>`

const tempFile = `/tmp/preview_services_spotlight.html`
fs.writeFileSync(tempFile, previewHtml)

const outSnap = path.join(artifactsDir, `services_spotlight_clean.png`)
execSync(
  `"${chrome}" --headless=new --no-sandbox --disable-gpu --allow-file-access-from-files --user-data-dir=/tmp/chrome-snap-spotlight --window-size=1200,650 --screenshot="${outSnap}" "file://${tempFile}"`,
  { stdio: 'ignore' }
)
console.log(`Captured services_spotlight_clean -> ${outSnap}`)
