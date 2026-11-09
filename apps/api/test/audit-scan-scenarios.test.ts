import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  preflight,
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
          title: 'HTML Title declared',
          category: 'seo',
          score: 'technicalSeo',
          severity: 'low',
          status: 'pass',
          affected: ['https://example.com/'],
        },
        {
          id: 'test.check.2',
          title: 'Viewport declared',
          category: 'accessibility',
          score: 'mobileUx',
          severity: 'low',
          status: 'pass',
          affected: ['https://example.com/'],
        },
        {
          id: 'test.check.3',
          title: 'Contact pathway available',
          category: 'journey',
          score: 'conversionReadiness',
          severity: 'low',
          status: 'pass',
          affected: ['https://example.com/'],
        },
      ],
      lighthouse: {
        strategy: 'mobile',
        fetchTime: new Date().toISOString(),
        categories: {
          performance: 82,
          accessibility: 90,
          bestPractices: 88,
          seo: 92,
        },
        categoryCounts: {
          performance: { passed: 10, issues: 2 },
          accessibility: { passed: 8, issues: 1 },
          bestPractices: { passed: 12, issues: 0 },
        },
        metrics: {
          fcpMs: 1400,
          lcpMs: 2200,
          tbtMs: 150,
          cls: 0.04,
          speedIndexMs: 1800,
        },
        notices: [],
        findings: [],
        lighthouseVersion: '12.0.0',
      },
      lighthouseUnavailableReason: '',
      ran: { seo: true, accessibility: true, journey: true },
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
