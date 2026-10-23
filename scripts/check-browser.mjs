// Browser checks for the public website: layout at every supported width, keyboard navigation, CTAs, the enquiry form
// and the mobile action bar. Needs Playwright in .tools/ (`npm i --prefix .tools playwright`) and Google Chrome.
// Set CHECK_URL to test a preview or production build (default: the dev server).
import { chromium } from '../.tools/node_modules/playwright/index.mjs'
import { mkdir } from 'node:fs/promises'
const base = process.env.CHECK_URL || 'http://localhost:5173'
await mkdir('test-results', { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const errors = []
const watch = page => {
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error' && !/status of 404/.test(message.text())) errors.push(message.text()) })
  page.on('response', response => { if (response.status() >= 400 && !response.url().includes('/missing-page')) errors.push(`HTTP ${response.status()}: ${response.url()}`) })
}
const assert = (ok, message) => { if (!ok) throw new Error(message) }

const pages = ['/', '/services', '/services/website-development', '/services/digital-growth', '/services/conversion-optimisation', '/services/business-automation', '/growth-audit', '/approach', '/about', '/contact', '/privacy', '/terms']
const homeWidths = [1440, 1280, 1100, 1024, 900, 768, 430, 390, 375, 360, 320]
const pageWidths = [1440, 1024, 768, 375, 320]

// Layout: content visible at load, no horizontal overflow, nothing off-screen, valid anchors, one H1, named controls.
for (const path of pages) {
  for (const width of path === '/' ? homeWidths : pageWidths) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    watch(page)
    await page.goto(base + path, { waitUntil: 'networkidle' })
    const hiddenText = await page.evaluate(() => [...document.querySelectorAll('main *')].filter(el => {
      if (!el.getClientRects().length || el.closest('[hidden], .honeypot, .visually-hidden, details:not([open])')) return false
      if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return false
      for (let a = el; a; a = a.parentElement) { const s = getComputedStyle(a); if (parseFloat(s.opacity) < 1 || s.visibility === 'hidden') return true }
      return false
    }).map(el => el.textContent.trim().slice(0, 30)))
    assert(!hiddenText.length, `${path} ${width}px: text not visible at load: ${JSON.stringify(hiddenText.slice(0, 5))}`)
    const height = await page.evaluate(() => document.body.scrollHeight)
    for (let y = 0; y < height; y += 700) { await page.evaluate(y => window.scrollTo(0, y), y); await page.waitForTimeout(20) }
    const issues = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth
      const visible = el => { const s = getComputedStyle(el); return s.display !== 'none' && s.visibility !== 'hidden' && el.getClientRects().length }
      return {
        overflow: document.documentElement.scrollWidth > window.innerWidth,
        offscreen: [...document.querySelectorAll('main *, footer *, header *')].filter(el => visible(el) && !el.closest('.honeypot, .visually-hidden, svg')).filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.left < -1 || r.right > vw + 1) }).slice(0, 5).map(el => `${el.tagName}.${el.className}`),
        brokenAnchors: [...document.querySelectorAll('a[href^="#"]')].filter(a => a.getAttribute('href') !== '#' && !document.getElementById(a.getAttribute('href').slice(1))).map(a => a.textContent),
        h1: document.querySelectorAll('h1').length,
        missingImages: [...document.images].filter(img => !img.complete || !img.naturalWidth).length,
        unnamedControls: [...document.querySelectorAll('button, a, input, select, textarea')].filter(el => visible(el) && !el.closest('.honeypot') && !(el.getAttribute('aria-label') || el.textContent.trim() || el.labels?.length)).length,
        smallText: [...document.querySelectorAll('main p, main li, main span, main a, main button, main label')].filter(el => visible(el) && el.textContent.trim() && parseFloat(getComputedStyle(el).fontSize) < 11).slice(0, 5).map(el => el.textContent.trim().slice(0, 30)),
        smallTargets: [...document.querySelectorAll('main a, main button, main summary, header a, header button')].filter(el => visible(el) && !el.closest('p, .breadcrumbs, .prose')).filter(el => { const r = el.getBoundingClientRect(); return r.width < 24 || r.height < 24 }).slice(0, 5).map(el => el.textContent.trim().slice(0, 30)),
      }
    })
    assert(!issues.overflow && !issues.offscreen.length && !issues.brokenAnchors.length && issues.h1 === 1 && !issues.missingImages && !issues.unnamedControls && !issues.smallText.length && !issues.smallTargets.length, JSON.stringify({ path, width, ...issues }))
    if (path === '/' || width === 375 || width === 1440) await page.screenshot({ path: `test-results/${path === '/' ? 'home' : path.slice(1).replace(/\//g, '_')}-${width}.png` })
    await page.close()
  }
  console.log(`PASS ${path}: visible at load, no overflow or off-screen content, valid anchors, one H1, no missing images, named controls, text ≥11px, targets ≥24px`)
}

// Unknown URLs render the 404 page.
{
  const page = await browser.newPage()
  await page.goto(`${base}/missing-page`)
  assert(await page.getByRole('heading', { level: 1 }).textContent() === 'This page isn’t part of the system.', '404 page missing')
  assert(await page.locator('meta[name="robots"]').getAttribute('content') === 'noindex, follow', '404 must be noindex')
  await page.close()
}

// Mobile navigation: keyboard-operable, isolates the page while open, Escape returns focus, links navigate and close it.
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
watch(page)
await page.goto(base, { waitUntil: 'networkidle' })
const toggle = page.locator('.menu-toggle')
await toggle.focus()
await page.keyboard.press('Enter')
assert(await toggle.getAttribute('aria-expanded') === 'true' && await page.locator('#mobile-menu').isVisible(), 'Menu did not open from the keyboard')
assert(await page.locator('#main').evaluate(el => el.inert), 'Page content should be inert behind the open menu')
const menuLinks = (await page.locator('#mobile-menu a').allTextContents()).map(t => t.trim())
for (const name of ['Home', 'Approach', 'About', 'Contact', 'Get a Digital Growth Audit']) assert(menuLinks.includes(name), `Mobile menu missing ${name}`)
await page.keyboard.press('Escape')
assert(await toggle.getAttribute('aria-expanded') === 'false' && await page.evaluate(() => document.activeElement.classList.contains('menu-toggle')), 'Escape should close the menu and return focus')
assert(!(await page.locator('#main').evaluate(el => el.inert)), 'Page should not stay inert after closing the menu')
await toggle.click()
await page.locator('#mobile-menu').getByRole('link', { name: /Convert/ }).click()
await page.waitForURL('**/services/conversion-optimisation')
assert(await toggle.getAttribute('aria-expanded') === 'false', 'Menu should close after navigating')
assert(await page.getByRole('heading', { level: 1 }).textContent() === 'Turn more of the traffic you already have into customers.', 'Service page did not render after client navigation')
assert(await page.evaluate(() => window.scrollY) === 0, 'New page should start at the top')
assert((await page.title()).includes('Conversion Optimisation'), 'Title should update on client navigation')

// Mobile action bar: hidden on the opening screen, shown while reading, hidden over the closing CTA and footer.
await page.goto(base, { waitUntil: 'networkidle' })
const bar = page.locator('.mobile-bar')
assert(await bar.evaluate(e => e.classList.contains('is-hidden')), 'Mobile bar should be hidden on the opening screen')
await page.locator('#system').evaluate(e => e.scrollIntoView({ behavior: 'instant' })); await page.waitForTimeout(400)
assert(!(await bar.evaluate(e => e.classList.contains('is-hidden'))), 'Mobile bar should appear once the visitor scrolls')
for (const target of ['#contact', 'footer']) {
  await page.locator(target).evaluate(e => e.scrollIntoView({ behavior: 'instant' })); await page.waitForTimeout(400)
  assert(await bar.evaluate(e => e.classList.contains('is-hidden')), `Mobile bar should be hidden over ${target}`)
}
await page.goto(`${base}/contact`, { waitUntil: 'networkidle' })
assert(!(await bar.count()), 'No mobile bar on pages that already show the form')

// Desktop: the Services menu is a keyboard-operable disclosure; CTAs reach working destinations.
await page.setViewportSize({ width: 1280, height: 900 })
await page.goto(base, { waitUntil: 'networkidle' })
const services = page.locator('.nav-services > button')
await services.focus()
await page.keyboard.press('Enter')
assert(await services.getAttribute('aria-expanded') === 'true' && await page.locator('.services-panel').isVisible(), 'Services menu did not open')
assert(await page.locator('.services-panel-item').count() === 4, 'Services menu should list four pillars')
await page.keyboard.press('Escape')
assert(await services.getAttribute('aria-expanded') === 'false' && await page.evaluate(() => document.activeElement.textContent.startsWith('Services')), 'Escape should close the Services menu and return focus')
const ctas = [['.header-cta', '/contact'], ['.hero .button-primary', '/contact'], ['.hero .button-secondary', '/services'], ['.audit-band .button', '/growth-audit'], ['.final-paths .path-card >> nth=0', '/contact'], ['.final-paths .path-card >> nth=1', '/growth-audit']]
for (const [selector, destination] of ctas) {
  await page.goto(base, { waitUntil: 'networkidle' })
  await page.locator(selector).click()
  await page.waitForURL(`**${destination}`)
  assert(await page.getByRole('heading', { level: 1 }).isVisible(), `${selector} → ${destination} did not render`)
}
// A service page's CTA preselects its pillar in the form.
await page.goto(`${base}/services/business-automation`, { waitUntil: 'networkidle' })
await page.locator('.page-hero .button-primary').click()
await page.waitForURL('**/contact?service=business-automation')
assert(await page.locator('select[name="service"]').inputValue() === 'Automation & Retention', 'Service CTA did not preselect its pillar')
// Client-side validation: accessible messages, focus on the summary.
await page.getByRole('button', { name: 'Send enquiry' }).click()
if (await page.getByRole('button', { name: 'Send enquiry' }).isEnabled()) {
  assert(await page.locator('.form-summary').isVisible(), 'Validation summary missing')
  assert(await page.getByLabel('Your name').getAttribute('aria-invalid') === 'true', 'Invalid fields should be marked')
} else {
  assert(await page.locator('.form-notice').isVisible(), 'An unconnected form must say that nothing can be sent')
}

// Reduced motion: the engine is fully lit with no intro sequence.
const calm = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
await calm.goto(base, { waitUntil: 'networkidle' })
await calm.waitForTimeout(1200)
assert(await calm.locator('.engine-arc.is-on').count() === 4, 'With reduced motion every pillar should be shown at once')
await calm.close()

assert(!errors.length, errors.join('\n'))
console.log('PASS 404 page, mobile menu (keyboard, inert page, Escape, navigation, focus/scroll/title on route change), mobile action bar, Services menu (keyboard + Escape), CTA destinations, service → form prefill, form validation or honest unconnected state, reduced motion; no JavaScript exceptions, console errors or HTTP errors')
await browser.close()
