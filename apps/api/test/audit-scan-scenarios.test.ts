import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  preflight,
  runAudit,
  strictPolicy,
  AuditError,
} from '../src/lib/audit-engine/core'
import { computeScores } from '../src/lib/audit-engine/core/scoring/scores'
import { analyzePage } from '../src/lib/audit-engine/core/analyze/page'

describe('Audit Scan Verification: Failure Scenarios (SSRF, DNS, Protocol)', () => {
  it('Failed scan: Blocks internal localhost and loopback SSRF targets', async () => {
    await assert.rejects(
      () => preflight('http://127.0.0.1:5000', strictPolicy),
      (err: unknown) => err instanceof AuditError && err.code === 'UNSAFE_URL'
    )

    await assert.rejects(
      () => preflight('http://localhost:3000', strictPolicy),
      (err: unknown) => err instanceof AuditError && err.code === 'UNSAFE_URL'
    )
  })

  it('Failed scan: Blocks cloud metadata IP address 169.254.169.254', async () => {
    await assert.rejects(
      () => preflight('http://169.254.169.254/latest/meta-data/', strictPolicy),
      (err: unknown) => err instanceof AuditError && err.code === 'UNSAFE_URL'
    )
  })

  it('Failed scan: Blocks unsupported protocols like file:// and ftp://', async () => {
    await assert.rejects(
      () => preflight('file:///etc/passwd', strictPolicy),
      (err: unknown) => err instanceof AuditError && err.code === 'INVALID_URL'
    )

    await assert.rejects(
      () => preflight('ftp://example.com/dump.sql', strictPolicy),
      (err: unknown) => err instanceof AuditError && err.code === 'INVALID_URL'
    )
  })

  it('Failed scan: Detects unresolvable public domains with DNS_FAILURE', async () => {
    // Non-existent domain with public suffix (.com) that fails DNS resolution
    await assert.rejects(
      () => preflight('https://this-chazon-domain-does-not-exist-98234729482.com', strictPolicy),
      (err: unknown) => err instanceof AuditError && err.code === 'DNS_FAILURE'
    )
  })

  it('rejects a domain for sale even when its parking page returns HTTP 200', async () => {
    const url = 'https://example.com/'
    const html = '<body>The domain example.com is for sale. To purchase, call Afternic.com.</body>'
    const body = Buffer.from(html)
    await assert.rejects(
      () => runAudit('parked', { url, strategy: 'mobile', categories: ['performance'], crawlLimit: 1, checkLinks: false }, {
        policy: { ...strictPolicy, resolve: async () => [{ address: '93.184.216.34', family: 4 }] },
        pagespeed: { configured: false, run: async () => { throw new Error('Unavailable') } },
        userAgentToken: 'ChazonTest',
        requireInspectablePage: true,
        fetcher: {
          userAgent: 'ChazonTest',
          close: async () => {},
          fetch: async () => ({
            requestedUrl: url, finalUrl: url, status: 200, headers: {}, contentType: 'text/html',
            body, bytes: body.length, truncated: false, bodySkipped: false, redirects: [], timeMs: 5,
            text: () => html,
          }),
        },
      }),
      (err: unknown) => err instanceof AuditError && err.code === 'PARKED_DOMAIN'
    )
  })
})

describe('Audit Scan Verification: Genuine Analysis & Scoring (No Fabrication)', () => {
  it('Calculates genuine page metrics and findings from actual HTML DOM and headers', () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Genuine Test Business — Growth Engineering</title>
        <meta name="description" content="This is an authentic test business for website audit validation." />
        <link rel="canonical" href="https://example.com/" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Genuine Test Business" />
        <meta property="og:description" content="This is an authentic test business." />
      </head>
      <body>
        <h1>Primary Heading</h1>
        <p>Welcome to our platform. <a href="tel:+919876543210">Call Us</a></p>
        <img src="/logo.png" alt="Company Logo" />
      </body>
      </html>
    `

    const pageData = analyzePage({
      html: mockHtml,
      url: 'https://example.com/',
      finalUrl: 'https://example.com/',
      status: 200,
      contentType: 'text/html; charset=utf-8',
      bytes: Buffer.byteLength(mockHtml),
      truncated: false,
      responseTimeMs: 120,
      redirects: [],
      headers: { 'content-type': 'text/html; charset=utf-8' },
      source: 'start',
      siteDomain: 'example.com',
    })

    assert.equal(pageData.title, 'Genuine Test Business — Growth Engineering')
    assert.equal(pageData.description, 'This is an authentic test business for website audit validation.')
    assert.equal(pageData.h1.length, 1)
    assert.equal(pageData.h1[0], 'Primary Heading')
    assert.ok(pageData.viewport)
    assert.ok(pageData.canonical)
    assert.equal(pageData.og['og:title'], 'Genuine Test Business')
  })

  it('Computes genuine scores across all diagnostic categories with authentic notes and counts', () => {
    const scores = computeScores({
      checks: [
        {
          id: 'test.check.1',
          label: 'HTML Title declared',
          score: 'technicalSeo',
          status: 'pass',
          weight: 1,
          credit: 1,
          detail: 'Title is declared',
          outcome: 'pass',
        },
        {
          id: 'test.check.2',
          label: 'Viewport declared',
          score: 'mobileUx',
          status: 'pass',
          weight: 1,
          credit: 1,
          detail: 'Viewport declared',
          outcome: 'pass',
        },
        {
          id: 'test.check.3',
          label: 'Contact pathway available',
          score: 'conversionReadiness',
          status: 'pass',
          weight: 1,
          credit: 1,
          detail: 'Contact pathway available',
          outcome: 'pass',
        },
      ],
      lighthouse: {
        strategy: 'mobile',
        requestedUrl: 'https://example.com/',
        finalUrl: 'https://example.com/',
        fetchTime: new Date().toISOString(),
        categories: {
          performance: 82,
          accessibility: 90,
          bestPractices: 88,
          seo: 92,
        },
        categoryCounts: {
          performance: { total: 12, completed: 12, passed: 10, warnings: 0, failed: 2, skipped: 0 },
          accessibility: { total: 9, completed: 9, passed: 8, warnings: 0, failed: 1, skipped: 0 },
          bestPractices: { total: 12, completed: 12, passed: 12, warnings: 0, failed: 0, skipped: 0 },
        },
        metrics: [
          { id: 'fcp', label: 'First Contentful Paint', displayValue: '1.4 s', numericValue: 1400, unit: 'ms', score: 0.9, rating: 'good' },
          { id: 'lcp', label: 'Largest Contentful Paint', displayValue: '2.2 s', numericValue: 2200, unit: 'ms', score: 0.85, rating: 'good' },
        ],
        field: null,
        runWarnings: [],
        auditOutcomes: {},
        lighthouseVersion: '12.0.0',
      },
      lighthouseUnavailableReason: '',
      ran: { performance: true, seo: true, accessibility: true, journey: true },
    })

    assert.ok(Array.isArray(scores))
    assert.equal(scores.length, 7) // 6 categories + 1 overall score

    const keys = scores.map((s) => s.key)
    assert.ok(keys.includes('overallHealth'))
    assert.ok(keys.includes('technicalSeo'))
    assert.ok(keys.includes('performance'))
    assert.ok(keys.includes('bestPractices'))
    assert.ok(keys.includes('accessibility'))
    assert.ok(keys.includes('mobileUx'))
    assert.ok(keys.includes('conversionReadiness'))

    for (const score of scores) {
      if (score.value !== null) {
        assert.ok(typeof score.value === 'number')
        assert.ok(score.value >= 0 && score.value <= 100)
      }
      assert.ok(typeof score.label === 'string')
    }
  })
})
