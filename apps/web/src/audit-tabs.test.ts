import { describe, expect, it } from 'vitest'
import type { AuditReport, CheckResult, Finding } from '@chazon/shared'
import {
  getActionableFindingsForTab,
  getChecksForTab,
  getFindingsForTab,
  getReportScoreValue,
} from './lib/audit-report-tabs'
import { render } from './entry-server'

function makeFinding(id: string, category: Finding['category'], severity: Finding['severity'] = 'medium'): Finding {
  return {
    id,
    title: id,
    category,
    severity,
    confidence: 'high',
    source: 'custom',
    evidence: [],
    affected: ['https://example.test/'],
    explanation: 'exp',
    recommendation: 'rec',
    service: 'BUILD',
    effort: 'low',
    priority: 50,
    plainSummary: 'summary',
    effortRationale: 'quick',
    verification: 'verify',
    status: 'confirmed',
  }
}

function makeCheck(id: string, score: CheckResult['score']): CheckResult {
  return {
    id,
    label: id,
    score,
    status: 'pass',
    weight: 1,
    credit: 1,
    detail: `${id} ok`,
    outcome: 'pass',
  }
}

describe('website audit tab filtering & authentic score extraction', () => {
  const report = {
    scores: [
      { key: 'overallHealth', label: 'Overall Health', value: 64, kind: 'composite', note: '' },
      { key: 'performance', label: 'Performance', value: 52, kind: 'custom', note: '' },
      { key: 'technicalSeo', label: 'SEO', value: 94, kind: 'custom', note: '' },
      { key: 'accessibility', label: 'Accessibility', value: null, kind: 'lighthouse', note: 'Unavailable' },
      { key: 'bestPractices', label: 'Best Practices', value: 78, kind: 'custom', note: '' },
      { key: 'mobileUx', label: 'Mobile UX', value: 69, kind: 'custom', note: '' },
    ],
  } as AuditReport

  const findings: Finding[] = [
    makeFinding('perf.slow-response', 'performance', 'high'),
    makeFinding('seo.missing-description', 'seo', 'medium'),
    makeFinding('a11y.images-missing-alt', 'accessibility', 'high'),
    makeFinding('a11y.zoom-disabled', 'accessibility', 'medium'),
    makeFinding('bp.missing-security-headers', 'best-practices', 'low'),
    makeFinding('mobile.missing-viewport', 'mobile', 'high'),
    makeFinding('journey.no-cta', 'journey', 'low'),
  ]

  const checks: CheckResult[] = [
    makeCheck('perf-ttfb', 'performance'),
    makeCheck('seo-title', 'technicalSeo'),
    makeCheck('a11y-lang', 'accessibility'),
    makeCheck('bp-https', 'bestPractices'),
    makeCheck('viewport', 'mobileUx'),
  ]

  it('never replaces null or real scores with hardcoded 80', () => {
    expect(getReportScoreValue(null, 'overallHealth')).toBeNull()
    expect(getReportScoreValue(report, 'performance')).toBe(52)
    expect(getReportScoreValue(report, 'technicalSeo')).toBe(94)
    expect(getReportScoreValue(report, 'accessibility')).toBeNull()
    expect(getReportScoreValue(report, 'bestPractices')).toBe(78)
    expect(getReportScoreValue(report, 'mobileUx')).toBe(69)
  })

  it('filters findings distinctly when switching each tab', () => {
    expect(getFindingsForTab(findings, 'all')).toHaveLength(7)
    expect(getFindingsForTab(findings, 'performance').map((f) => f.id)).toEqual(['perf.slow-response'])
    expect(getFindingsForTab(findings, 'seo').map((f) => f.id)).toEqual(['seo.missing-description'])
    expect(getFindingsForTab(findings, 'accessibility').map((f) => f.id)).toEqual([
      'a11y.images-missing-alt',
      'a11y.zoom-disabled',
    ])
    expect(getFindingsForTab(findings, 'practices').map((f) => f.id)).toEqual(['bp.missing-security-headers'])
    expect(getFindingsForTab(findings, 'mobile').map((f) => f.id)).toEqual([
      'a11y.zoom-disabled',
      'mobile.missing-viewport',
    ])
    expect(getActionableFindingsForTab(findings, 'practices').map((f) => f.id)).toEqual([
      'bp.missing-security-headers',
    ])
  })

  it('filters category diagnostics checks cleanly per tab', () => {
    expect(getChecksForTab(checks, 'all')).toEqual([])
    expect(getChecksForTab(checks, 'performance').map((c) => c.id)).toEqual(['perf-ttfb'])
    expect(getChecksForTab(checks, 'seo').map((c) => c.id)).toEqual(['seo-title'])
    expect(getChecksForTab(checks, 'accessibility').map((c) => c.id)).toEqual(['a11y-lang'])
    expect(getChecksForTab(checks, 'practices').map((c) => c.id)).toEqual(['bp-https'])
    expect(getChecksForTab(checks, 'mobile').map((c) => c.id)).toEqual(['viewport'])
  })

  it('renders /website-audit SSR page cleanly', () => {
    const res = render('/website-audit')
    expect(res.status).toBe(200)
    expect(res.html).toContain('Website Audit')
  })
})
