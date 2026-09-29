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
// Mobile Services: a compact stepper — one pillar at a time, changed only by the visitor.
const pillarNames = ['Digital Foundation', 'Digital Growth', 'Revenue & Commerce', 'Automation & Retention']
const serviceCounts = [6, 8, 7, 7]
const visiblePillar = () => page.evaluate(() => [...document.querySelectorAll('.svc-panel')].findIndex(p => !p.hidden))
assert(await page.locator('.svc-panel:visible').count() === 1 && await visiblePillar() === 0, 'Mobile stepper should show exactly one pillar, starting with 01')
await page.waitForTimeout(3000)
assert(await visiblePillar() === 0, 'Stepper must not advance on its own')
for (let i = 0; i < 4; i++) {
  const panel = page.locator(`#pillar-${i}`)
  assert(await panel.locator('h3').textContent() === pillarNames[i], `Pillar ${i} heading`)
  assert((await panel.locator('.svc-count').textContent()).replace(/\s/g, '') === `0${i + 1}/04`, `Pillar ${i} counter`)
  assert(await panel.locator('.svc-chips li').count() === serviceCounts[i], `Pillar ${i} should list ${serviceCounts[i]} services`)
  assert(await panel.locator(['.fv', '.gv', '.rv', '.av'][i]).isVisible(), `Pillar ${i} visual missing`)
  const height = await page.locator('#services').evaluate(e => e.getBoundingClientRect().height)
  assert(height <= 1100, `Services section too tall on mobile: ${Math.round(height)}px`)
  await panel.getByRole('button', { name: /^Next pillar/ }).click()
  assert(await visiblePillar() === (i + 1) % 4, `Next from pillar ${i} did not advance`)
}
await page.locator('#pillar-0').getByRole('button', { name: /^Previous pillar/ }).click()
assert(await visiblePillar() === 3, 'Previous should wrap from 01 to 04')
await page.locator('#pillar-tab-1').click()
assert(await visiblePillar() === 1, 'Step tab did not select its pillar')
await page.locator('#pillar-tab-1').press('ArrowRight')
assert(await visiblePillar() === 2 && await page.evaluate(() => document.activeElement.id) === 'pillar-tab-2', 'Arrow key should move to the next step')
const swipe = async dx => { const box = await page.locator('.svc-panel:visible .svc-visual').boundingBox(); const y = box.y + 40; await page.locator('.svc-panel:visible').dispatchEvent('pointerdown', { pointerType: 'touch', clientX: 200, clientY: y }); await page.locator('.svc-panel:visible').dispatchEvent('pointerup', { pointerType: 'touch', clientX: 200 + dx, clientY: y + 5 }) }
await swipe(-120)
assert(await visiblePillar() === 3, 'Swipe left should show the next pillar')
await swipe(120)
assert(await visiblePillar() === 2, 'Swipe right should show the previous pillar')
await page.getByRole('button', { name: /Website.*Few enquiries/ }).click()
await page.getByText('Conversion-led pages and a clear path to enquire').waitFor()
await page.getByRole('button', { name: /Technology/ }).click()
await page.getByText('Websites, commerce and digital platforms built to convert.').waitFor()
await page.getByRole('button', { name: 'Hospitality', exact: true }).click()
await page.getByText('Help guests discover your business, explore the experience and make an enquiry or booking.').waitFor()
// A pillar CTA opens the enquiry form with the related service preselected.
await page.getByRole('link', { name: 'Let’s Talk about Revenue & Commerce' }).click()
assert(await page.locator('select[name="service"]').inputValue() === 'Revenue & Commerce', 'Pillar CTA did not preselect its pillar')
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
const deadLinks = await page.evaluate(() => [...document.querySelectorAll('a')].filter(a => { const h = a.getAttribute('href') || ''; return !h || h === '#' || /example\.com|placeholder|wa\.me\/$|mailto:$|tel:$/.test(h) }).map(a => a.textContent))
assert(!deadLinks.length, `Empty or placeholder links: ${deadLinks}`)
const configured = await page.locator('.direct-link, .social-link').count()
if (!configured) assert(await page.locator('.connect-pending').count() === 2, 'Unconfigured channels should show pending notes')
for (const target of ['#services', '#contact', 'footer']) {
  await page.locator(target).evaluate(e => e.scrollIntoView({ behavior: 'instant' })); await page.waitForTimeout(400)
  assert(await page.locator('.mobile-actions').evaluate(e => e.classList.contains('is-hidden')), `Mobile action bar should be hidden over ${target}`)
}
// Footer service link opens the matching pillar.
await page.locator('footer').getByRole('link', { name: 'Business Automation' }).click()
assert(await page.locator('#pillar-3').isVisible(), 'Footer service link did not open its pillar')

// Desktop Services: an ARIA tab explorer; click and arrow keys switch the stage; every CTA preselects its pillar.
await page.setViewportSize({ width: 1280, height: 900 })
await page.goto(base, { waitUntil: 'networkidle' })
assert(await page.locator('[role=tab]').count() === 4, 'Desktop should show four pillar tabs')
for (let i = 0; i < 4; i++) {
  await page.locator(`#pillar-tab-${i}`).click()
  assert(await page.locator(`#pillar-tab-${i}`).getAttribute('aria-selected') === 'true', `Tab ${i} not selected`)
  assert(await page.locator('.svc-panel:visible').count() === 1 && await page.locator(`#pillar-${i}`).isVisible(), `Tab ${i} did not show its panel`)
  assert(await page.locator(`#pillar-${i} .svc-chips li`).count() === serviceCounts[i], `Desktop pillar ${i} services`)
  await page.locator(`#pillar-${i} .svc-cta`).click()
  assert(await page.locator('select[name="service"]').inputValue() === pillarNames[i], `Desktop CTA ${i} did not preselect ${pillarNames[i]}`)
}
await page.locator('#pillar-tab-3').focus()
await page.keyboard.press('ArrowRight')
assert(await page.evaluate(() => document.activeElement.id) === 'pillar-tab-0' && await page.locator('#pillar-0').isVisible(), 'ArrowRight should wrap to the first pillar')
await page.keyboard.press('End')
assert(await page.locator('#pillar-3').isVisible(), 'End key should select the last pillar')
assert(!errors.length, errors.join('\n'))
console.log('PASS mobile menu (5 items + Let’s Talk), mobile stepper (one pillar at a time, no auto-advance, next/previous wrap, step tabs, arrow keys, swipe, 4 visuals, all 28 services, section ≤1,100px), desktop tabs (click + arrow keys), each pillar CTA → pillar preselected, problem map, ecosystem, industries, CTA → form prefill, audit mode, required/email/phone validation, honest unconfigured form state, contact panel with no placeholder links, mobile bar clear of services/contact/footer, footer → pillar; no JavaScript exceptions, console errors or HTTP errors')
await browser.close()
