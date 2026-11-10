import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const distDir = path.resolve('apps/web/dist')
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const artifactsDir = '/Users/growve-a13/.gemini/antigravity/brain/1ed614de-b83c-4b15-9a45-44a73a1b2431'

// Let's create an HTML that simulates landing on /services?category=convert#services-grid
let baseHtml = fs.readFileSync(path.join(distDir, 'services/index.html'), 'utf8')

// Inline CSS
const cssFiles = fs.readdirSync(path.join(distDir, 'assets')).filter(f => f.endsWith('.css'))
let cssContent = ''
for (const f of cssFiles) {
  cssContent += fs.readFileSync(path.join(distDir, 'assets', f), 'utf8') + '\n'
}
cssContent = cssContent.replace(/url\(\/assets\//g, 'url(file://' + distDir + '/assets/')

baseHtml = baseHtml.replace(/<link rel="stylesheet"[^>]*>/g, '')
baseHtml = baseHtml.replace('</head>', '<style>' + cssContent + '</style></head>')
baseHtml = baseHtml.replace(/src="\/assets\//g, 'src="file://' + distDir + '/assets/')

for (const cat of ['build', 'convert']) {
  // Inject script to set URL and dispatch hash
  const testHtml = baseHtml.replace(
    '</body>',
    `<script>
      window.history.replaceState(null, '', '/services?category=${cat}#services-grid');
      // Scroll to services-grid
      setTimeout(() => {
        const el = document.getElementById('services-grid');
        if (el) el.scrollIntoView({ behavior: 'instant' });
      }, 100);
    </script></body>`
  )

  const tempFile = `/tmp/preview_cat_${cat}.html`
  fs.writeFileSync(tempFile, testHtml)

  const outSnap = path.join(artifactsDir, `services_redirect_${cat}.png`)
  execSync(
    `"${chrome}" --headless=new --no-sandbox --disable-gpu --allow-file-access-from-files --user-data-dir=/tmp/chrome-snap-cat-${cat} --window-size=1440,1100 --screenshot="${outSnap}" "file://${tempFile}#services-grid"`,
    { stdio: 'ignore' }
  )
  console.log(`Captured services_redirect_${cat} -> ${outSnap}`)
}
