import { chromium } from '../.tools/node_modules/playwright/index.mjs'
import { mkdir } from 'node:fs/promises'
await mkdir('test-results', { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage()
const errors = []
page.on('pageerror', error => errors.push(error.message))
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('response', response => { if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`) })
for (const width of [1440, 768, 390, 320]) {
  await page.setViewportSize({ width, height: 900 })
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })
  const issues = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > window.innerWidth,
    brokenAnchors: [...document.querySelectorAll('a[href^="#"]')].filter(a => !document.getElementById(a.getAttribute('href').slice(1))).map(a => a.textContent),
    h1: document.querySelectorAll('h1').length,
    missingImages: [...document.images].filter(img => !img.complete || !img.naturalWidth).length,
  }))
  if (issues.overflow || issues.brokenAnchors.length || issues.h1 !== 1 || issues.missingImages) throw new Error(JSON.stringify({ width, ...issues }))
  await page.screenshot({ path: `test-results/viewport-${width}.png`, fullPage: true })
  await page.screenshot({ path: `test-results/hero-${width}.png` })
  await page.locator('#contact').scrollIntoViewIfNeeded()
  await page.screenshot({ path: `test-results/contact-${width}.png` })
  console.log(`PASS ${width}px: no overflow, valid anchors, one H1, no missing images`)
}
await page.getByRole('button', { name: 'Open navigation' }).click()
await page.getByRole('navigation').getByRole('link', { name: 'Services', exact: true }).click()
if (await page.getByRole('button', { name: 'Close navigation' }).count()) throw new Error('Mobile navigation did not close')
await page.locator('.service-card summary').first().click()
if (!(await page.locator('.service-card details').first().getAttribute('open') === '')) throw new Error('Capabilities disclosure did not open')
await page.getByRole('button', { name: 'Hospitality', exact: true }).click()
await page.getByText('Help guests discover your business, explore the experience and make an enquiry or booking.').waitFor()
await page.locator('button[type="submit"]').click()
if (await page.locator('input[name="name"]').evaluate(el => el.validity.valid)) throw new Error('Required validation did not work')
await page.locator('input[name="name"]').fill('Test Enquiry')
await page.locator('input[name="business"]').fill('Test Business')
await page.locator('input[name="email"]').fill('test@example.com')
await page.locator('input[name="phone"]').fill('1234567890')
await page.locator('select[name="category"]').selectOption('B2B')
await page.locator('select[name="service"]').selectOption('Website')
await page.locator('input[name="email"]').fill('invalid-email')
await page.locator('button[type="submit"]').click()
if (!(await page.locator('input[name="email"]').evaluate(el => el.validity.typeMismatch))) throw new Error('Email validation did not reject invalid input')
await page.locator('input[name="email"]').fill('test@example.com')
await page.locator('input[name="phone"]').fill('abc')
await page.locator('button[type="submit"]').click()
if (!(await page.locator('input[name="phone"]').evaluate(el => el.validity.patternMismatch))) throw new Error('Phone validation did not reject invalid input')
await page.locator('input[name="phone"]').fill('1234567890')
await page.locator('button[type="submit"]').click()
await page.getByRole('status').filter({ hasText: 'Your details have not been sent' }).waitFor()
if (errors.length) throw new Error(errors.join('\n'))
console.log('PASS mobile menu, service disclosure, industry selection, required/email/phone validation, honest unconfigured form state; no JavaScript exceptions, console errors or HTTP errors')
await browser.close()
