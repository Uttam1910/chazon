import { chromium } from '../.tools/node_modules/playwright/index.mjs'
import { mkdir } from 'node:fs/promises'
const base = process.env.CHECK_URL || 'http://localhost:5173'
await mkdir('test-results', { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const errors = []
const watch = page => {
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('response', response => { if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`) })
}
const assert = (ok, message) => { if (!ok) throw new Error(message) }

// Layout checks at every supported width.
for (const width of [1440, 1280, 1100, 1024, 900, 768, 430, 390, 375, 360, 320]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } })
  watch(page)
  await page.goto(base, { waitUntil: 'networkidle' })
  // Content first: straight after load, with no scrolling and no waiting, every piece of text must be fully visible.
  const hiddenText = await page.evaluate(() => [...document.querySelectorAll('main *')].filter(el => {
    if (!el.getClientRects().length || el.closest('[hidden], .honeypot, .visually-hidden')) return false
    if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return false
    for (let a = el; a; a = a.parentElement) { const s = getComputedStyle(a); if (parseFloat(s.opacity) < 1 || s.visibility === 'hidden') return true }
    return false
  }).map(el => el.textContent.trim().slice(0, 30)))
  assert(!hiddenText.length, `${width}px: text not visible at load: ${JSON.stringify(hiddenText.slice(0, 5))}`)
  const navItems = await page.locator('#main-nav a:not(.nav-cta)').allTextContents()
  assert(navItems.join() === 'Home,About,Services,Work,Contact', `${width}px: unexpected navigation ${navItems}`)
  const height = await page.evaluate(() => document.body.scrollHeight)
  for (let y = 0; y < height; y += 500) { await page.evaluate(y => window.scrollTo(0, y), y); await page.waitForTimeout(30) }
  const issues = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth
    const visible = el => { const s = getComputedStyle(el); return s.display !== 'none' && s.visibility !== 'hidden' && el.getClientRects().length }
    return {
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      offscreen: [...document.querySelectorAll('main *, footer *')].filter(el => visible(el) && !el.closest('.honeypot')).filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.left < -1 || r.right > vw + 1) }).slice(0, 5).map(el => `${el.tagName}.${el.className}`),
      brokenAnchors: [...document.querySelectorAll('a[href^="#"]')].filter(a => a.getAttribute('href') !== '#' && !document.getElementById(a.getAttribute('href').slice(1))).map(a => a.textContent),
      h1: document.querySelectorAll('h1').length,
      missingImages: [...document.images].filter(img => !img.complete || !img.naturalWidth).length,
      unnamedButtons: [...document.querySelectorAll('button, a')].filter(el => visible(el) && !(el.getAttribute('aria-label') || el.textContent.trim())).length,
      smallText: [...document.querySelectorAll('main p, main li, main span, main a, main button, main label')].filter(el => visible(el) && el.textContent.trim() && !el.closest('.work-art') && parseFloat(getComputedStyle(el).fontSize) < 11).slice(0, 5).map(el => el.textContent.trim().slice(0, 30)),
    }
  })
  assert(!issues.overflow && !issues.offscreen.length && !issues.brokenAnchors.length && issues.h1 === 1 && !issues.missingImages && !issues.unnamedButtons && !issues.smallText.length, JSON.stringify({ width, ...issues }))
  await page.screenshot({ path: `test-results/hero-${width}.png` })
  console.log(`PASS ${width}px: 5-item nav, all text visible at load, no overflow or off-screen content, valid anchors, one H1, no missing images, named controls, no text under 11px`)
  await page.close()
}

// Interaction checks on mobile.
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
watch(page)
await page.goto(base, { waitUntil: 'networkidle' })
await page.getByRole('button', { name: 'Open navigation' }).click()
assert((await page.locator('#main-nav a').allTextContents()).map(t => t.trim()).join() === 'Home,About,Services,Work,Contact,Let’s Talk', 'Mobile menu should list five destinations plus Let’s Talk')
await page.locator('#main-nav .nav-cta').click()
assert(await page.locator('#enquiry').isVisible(), 'Mobile menu Let’s Talk did not open the enquiry form')
await page.getByRole('button', { name: 'Open navigation' }).click()
await page.getByRole('navigation').getByRole('link', { name: 'Services', exact: true }).click()
assert(!(await page.getByRole('button', { name: 'Close navigation' }).count()), 'Mobile navigation did not close')
await page.locator('#pillar-tab-1').click()
assert(await page.locator('#pillar-1').isVisible(), 'Service pillar did not open')
assert(!(await page.locator('#pillar-0').isVisible()), 'Previous service pillar did not close')
await page.locator('#pillar-tab-1').click()
assert(!(await page.locator('#pillar-1').isVisible()), 'Service pillar did not collapse on mobile')
await page.getByRole('button', { name: /Website.*Few enquiries/ }).click()
await page.getByText('Conversion-led pages and a clear path to enquire').waitFor()
await page.getByRole('button', { name: /Technology/ }).click()
await page.getByText('Websites, commerce and digital platforms built to convert.').waitFor()
await page.getByRole('button', { name: 'Hospitality', exact: true }).click()
await page.getByText('Help guests discover your business, explore the experience and make an enquiry or booking.').waitFor()
// A pillar CTA opens the enquiry form with the related service preselected.
await page.locator('#pillar-tab-2').click()
await page.getByRole('link', { name: 'Discuss Revenue & Commerce' }).click()
assert(await page.locator('select[name="service"]').inputValue() === 'Digital Revenue Strategy', 'Pillar CTA did not preselect service')
// Audit CTA switches the form to audit mode.
await page.getByRole('link', { name: 'Get a Digital Growth Audit' }).click()
await page.getByText('What the audit looks at').waitFor()
assert(await page.locator('select[name="service"]').inputValue() === 'Digital Growth Audit', 'Audit CTA did not preselect the audit')
await page.locator('button[type="submit"]').click()
assert(!(await page.locator('input[name="name"]').evaluate(el => el.validity.valid)), 'Required validation did not work')
await page.locator('input[name="name"]').fill('Test Enquiry')
await page.locator('input[name="business"]').fill('Test Business')
await page.locator('input[name="email"]').fill('invalid-email')
await page.locator('input[name="phone"]').fill('1234567890')
await page.locator('select[name="category"]').selectOption('B2B')
await page.locator('button[type="submit"]').click()
assert(await page.locator('input[name="email"]').evaluate(el => el.validity.typeMismatch), 'Email validation did not reject invalid input')
await page.locator('input[name="email"]').fill('test@example.com')
await page.locator('input[name="phone"]').fill('abc')
await page.locator('button[type="submit"]').click()
assert(await page.locator('input[name="phone"]').evaluate(el => el.validity.patternMismatch), 'Phone validation did not reject invalid input')
await page.locator('input[name="phone"]').fill('1234567890')
// Without an endpoint the form must say plainly that nothing was sent (a configured endpoint is tested against a real/mock server).
if (await page.locator('.setup-notice').count()) {
  await page.locator('button[type="submit"]').click()
  await page.getByRole('status').filter({ hasText: 'Your details have not been sent' }).waitFor()
}
// Contact panel: with nothing configured, channels are absent (never placeholder links) and a clear note says what will appear.
assert(await page.locator('.connect').isVisible(), 'Connect panel missing')
const deadLinks = await page.evaluate(() => [...document.querySelectorAll('a')].filter(a => { const h = a.getAttribute('href') || ''; return !h || h === '#' || /example|placeholder|wa\.me\/$|mailto:$|tel:$/.test(h) }).map(a => a.textContent))
assert(!deadLinks.length, `Empty or placeholder links: ${deadLinks}`)
const configured = await page.locator('.direct-link, .social-link').count()
if (!configured) assert(await page.locator('.connect-pending').count() === 2, 'Unconfigured channels should show pending notes')
for (const target of ['#contact', 'footer']) {
  await page.locator(target).evaluate(e => e.scrollIntoView({ behavior: 'instant' })); await page.waitForTimeout(400)
  assert(await page.locator('.mobile-actions').evaluate(e => e.classList.contains('is-hidden')), `Mobile action bar should be hidden over ${target}`)
}
// Footer service link opens the matching pillar.
await page.locator('footer').getByRole('link', { name: 'Business Automation' }).click()
assert(await page.locator('#pillar-3').isVisible(), 'Footer service link did not open its pillar')
assert(!errors.length, errors.join('\n'))
console.log('PASS mobile menu (5 items + Let’s Talk), service accordion, problem map, ecosystem, industries, CTA → form prefill, audit mode, required/email/phone validation, honest unconfigured form state, contact panel with no placeholder links, mobile bar clear of contact/footer, footer → pillar; no JavaScript exceptions, console errors or HTTP errors')
await browser.close()
