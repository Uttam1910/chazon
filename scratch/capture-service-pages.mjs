import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const distDir = path.resolve('apps/web/dist')
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const artifactsDir = '/Users/growve-a13/.gemini/antigravity/brain/1ed614de-b83c-4b15-9a45-44a73a1b2431'

const pages = [
  { file: 'services/ui-ux-design/index.html', name: 'service_uiux_desktop' },
  { file: 'services/digital-marketing/index.html', name: 'service_digital_marketing_desktop' },
  { file: 'services/website-development/index.html', name: 'service_webdev_desktop' },
]

for (const p of pages) {
  let html = fs.readFileSync(path.join(distDir, p.file), 'utf8')

  // Inline CSS
  const cssFiles = fs.readdirSync(path.join(distDir, 'assets')).filter(f => f.endsWith('.css'))
  let cssContent = ''
  for (const f of cssFiles) {
    cssContent += fs.readFileSync(path.join(distDir, 'assets', f), 'utf8') + '\n'
  }
  cssContent = cssContent.replace(/url\(\/assets\//g, 'url(file://' + distDir + '/assets/')

  html = html.replace(/<link rel=\"stylesheet\"[^>]*>/g, '')
  html = html.replace('</head>', '<style>' + cssContent + '</style></head>')
  html = html.replace(/src=\"\/assets\//g, 'src=\"file://' + distDir + '/assets/')
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  const tempFile = `/tmp/preview_real_${p.name}.html`
  fs.writeFileSync(tempFile, html)

  // Capture hero screenshot
  const outHero = path.join(artifactsDir, `${p.name}_hero.png`)
  execSync(
    `"${chrome}" --headless=new --no-sandbox --disable-gpu --allow-file-access-from-files --user-data-dir=/tmp/chrome-snap-${p.name} --window-size=1440,900 --screenshot="${outHero}" "file://${tempFile}"`,
    { stdio: 'ignore' }
  )
  console.log(`Captured ${p.name}_hero -> ${outHero}`)

  // Capture mid section / craft screenshot
  const outFull = path.join(artifactsDir, `${p.name}_full.png`)
  execSync(
    `"${chrome}" --headless=new --no-sandbox --disable-gpu --allow-file-access-from-files --user-data-dir=/tmp/chrome-snap-${p.name}-full --window-size=1440,4200 --screenshot="${outFull}" "file://${tempFile}"`,
    { stdio: 'ignore' }
  )
  console.log(`Captured ${p.name}_full -> ${outFull}`)
}
