import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const distDir = path.resolve('apps/web/dist')
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const artifactsDir = '/Users/growve-a13/.gemini/antigravity/brain/1ed614de-b83c-4b15-9a45-44a73a1b2431'

const pages = [
  { file: 'index.html', name: 'homepage_hero_check' },
  { file: 'about/index.html', name: 'about_hero_check' }
]

// Inline CSS
const cssFiles = fs.readdirSync(path.join(distDir, 'assets')).filter(f => f.endsWith('.css'))
let cssContent = ''
for (const f of cssFiles) {
  cssContent += fs.readFileSync(path.join(distDir, 'assets', f), 'utf8') + '\n'
}
cssContent = cssContent.replace(/url\(\/assets\//g, 'url(file://' + distDir + '/assets/')

for (const p of pages) {
  let html = fs.readFileSync(path.join(distDir, p.file), 'utf8')
  html = html.replace(/<link rel="stylesheet"[^>]*>/g, '')
  html = html.replace('</head>', '<style>' + cssContent + '</style></head>')
  html = html.replace(/src="\/assets\//gi, 'src="file://' + distDir + '/assets/')
  html = html.replace(/srcset="\/assets\//gi, 'srcset="file://' + distDir + '/assets/')
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  const tempFile = `/tmp/preview_${p.name}.html`
  fs.writeFileSync(tempFile, html)

  const outHero = path.join(artifactsDir, `${p.name}.png`)
  execSync(
    `"${chrome}" --headless=new --no-sandbox --disable-gpu --allow-file-access-from-files --user-data-dir=/tmp/chrome-snap-${p.name} --window-size=1440,850 --screenshot="${outHero}" "file://${tempFile}"`,
    { stdio: 'ignore' }
  )
  console.log(`Captured ${p.name} -> ${outHero}`)
}
