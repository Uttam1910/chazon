import type { AuditReport, CheckResult, Finding, ScoreKey } from '@chazon/shared'

export type AuditTabKey = 'all' | 'performance' | 'seo' | 'accessibility' | 'practices' | 'mobile'

export const AUDIT_TAB_ORDER: AuditTabKey[] = [
  'all',
  'performance',
  'seo',
  'accessibility',
  'practices',
  'mobile',
]

export const AUDIT_TAB_META: Record<
  AuditTabKey,
  { label: string; scoreKey: ScoreKey; categories: string[]; checkScores: ScoreKey[] }
> = {
  all: { label: 'Overview', scoreKey: 'overallHealth', categories: [], checkScores: [] },
  performance: { label: 'Performance', scoreKey: 'performance', categories: ['performance'], checkScores: ['performance'] },
  seo: { label: 'SEO', scoreKey: 'technicalSeo', categories: ['seo', 'crawl'], checkScores: ['technicalSeo'] },
  accessibility: { label: 'Accessibility', scoreKey: 'accessibility', categories: ['accessibility'], checkScores: ['accessibility'] },
  practices: { label: 'Best Practices', scoreKey: 'bestPractices', categories: ['best-practices', 'security', 'technology'], checkScores: ['bestPractices'] },
  mobile: { label: 'Mobile', scoreKey: 'mobileUx', categories: ['mobile'], checkScores: ['mobileUx'] },
}

export function getReportScoreValue(report: AuditReport | null, key: ScoreKey): number | null {
  if (!report) return null
  const val = report.scores.find((s) => s.key === key)?.value
  return typeof val === 'number' ? val : null
}

export function getFindingsForTab(findings: Finding[], tab: AuditTabKey): Finding[] {
  if (tab === 'all') return findings
  if (tab === 'mobile') {
    return findings.filter(
      (f) =>
        f.category === 'mobile' ||
        f.id === 'a11y.zoom-disabled' ||
        f.id === 'seo.missing-viewport' ||
        f.id === 'seo.bad-viewport'
    )
  }
  const cats = AUDIT_TAB_META[tab].categories
  return findings.filter((f) => cats.includes(f.category))
}

export function getChecksForTab(checks: CheckResult[], tab: AuditTabKey): CheckResult[] {
  if (tab === 'all') return []
  const checkScores = AUDIT_TAB_META[tab].checkScores
  return checks.filter((c) => checkScores.includes(c.score))
}

export function getActionableFindingsForTab(findings: Finding[], tab: AuditTabKey): Finding[] {
  const scoped = getFindingsForTab(findings, tab)
  if (tab !== 'all') return scoped
  const important = scoped.filter(
    (f) => f.severity === 'critical' || f.severity === 'high' || f.severity === 'medium'
  )
  return (important.length > 0 ? important : scoped).slice(0, 8)
}
