import type { CheckCounts, CheckResult, LighthouseSummary, ScoreKey, ScoreResult } from '@chazon/shared';

export const SCORE_LABELS: Record<ScoreKey, string> = {
  performance: 'Performance',
  technicalSeo: 'Technical SEO',
  accessibility: 'Accessibility',
  bestPractices: 'Best Practices',
  mobileUx: 'Mobile & User Experience',
  conversionReadiness: 'Conversion Readiness',
  overallHealth: 'Overall Technical Website Health',
};

/** Weights used for the composite Overall Technical Website Health score. */
export const OVERALL_WEIGHTS: Partial<Record<ScoreKey, number>> = {
  performance: 25,
  technicalSeo: 25,
  accessibility: 20,
  bestPractices: 15,
  mobileUx: 15,
};

/** A custom score needs at least this share of its total check weight completed. */
export const MIN_COVERAGE = 0.5;
export const MIN_COMPLETED_CHECKS = 3;

export function countChecks(checks: CheckResult[]): CheckCounts {
  return {
    total: checks.length,
    completed: checks.filter((c) => c.status !== 'skipped').length,
    passed: checks.filter((c) => c.status === 'pass').length,
    warnings: checks.filter((c) => c.status === 'warn').length,
    failed: checks.filter((c) => c.status === 'fail').length,
    skipped: checks.filter((c) => c.status === 'skipped').length,
  };
}

/**
 * Custom score = 100 x sum(weight x credit) / sum(weight of completed checks).
 * Skipped checks are excluded from both sides (never counted as passed), and the
 * score is withheld ("Not enough data") when coverage is too low.
 */
export function customScore(key: ScoreKey, checks: CheckResult[], description: string): ScoreResult {
  const counts = countChecks(checks);
  const totalWeight = checks.reduce((s, c) => s + c.weight, 0);
  const done = checks.filter((c) => c.status !== 'skipped');
  const doneWeight = done.reduce((s, c) => s + c.weight, 0);
  const base = { key, label: SCORE_LABELS[key], kind: 'custom' as const, counts };
  if (checks.length === 0) return { ...base, value: null, note: 'Not enough data: this category was not run.' };
  if (doneWeight === 0 || doneWeight / totalWeight < MIN_COVERAGE || done.length < MIN_COMPLETED_CHECKS) {
    return {
      ...base,
      value: null,
      note: `Not enough data: only ${done.length} of ${checks.length} checks (${Math.round((doneWeight / Math.max(totalWeight, 1)) * 100)}% of the weighting) could be completed. ${description}`,
    };
  }
  const earned = done.reduce((s, c) => s + c.weight * c.credit, 0);
  return {
    ...base,
    value: Math.round((100 * earned) / doneWeight),
    note: `Internally calculated from ${done.length} weighted checks (${counts.skipped} skipped and excluded). ${description} Not a Google score.`,
  };
}

function lighthouseScore(
  key: 'performance' | 'accessibility' | 'bestPractices',
  lh: LighthouseSummary | null,
  unavailable: string,
): ScoreResult {
  const value = lh?.categories[key] ?? null;
  const counts = lh?.categoryCounts[key];
  return {
    key,
    label: SCORE_LABELS[key],
    kind: 'lighthouse',
    value,
    ...(counts ? { counts } : {}),
    note:
      value === null
        ? `Not enough data: ${lh ? 'this Lighthouse category was not part of the run.' : unavailable}`
        : `Official Lighthouse ${SCORE_LABELS[key].toLowerCase()} score from a single ${lh!.strategy} lab run (Lighthouse ${lh!.lighthouseVersion}) via PageSpeed Insights. Scores vary between runs.`,
  };
}

export function overallScore(scores: ScoreResult[]): ScoreResult {
  const available = scores.filter((s) => OVERALL_WEIGHTS[s.key] !== undefined && s.value !== null);
  const weightSum = available.reduce((s, x) => s + (OVERALL_WEIGHTS[x.key] ?? 0), 0);
  const base = { key: 'overallHealth' as const, label: SCORE_LABELS.overallHealth, kind: 'composite' as const };
  if (available.length < 3 || weightSum < 60) {
    return {
      ...base,
      value: null,
      note: `Not enough data: needs at least 3 of the 5 technical category scores covering 60% of the weighting (have ${available.length}, ${weightSum}%).`,
    };
  }
  const components = available.map((s) => ({
    key: s.key,
    label: s.label,
    weight: Math.round(((OVERALL_WEIGHTS[s.key] ?? 0) / weightSum) * 1000) / 10,
    value: s.value!,
  }));
  const value = Math.round(available.reduce((s, x) => s + x.value! * (OVERALL_WEIGHTS[x.key] ?? 0), 0) / weightSum);
  const missing = Object.keys(OVERALL_WEIGHTS).filter((k) => !available.some((a) => a.key === k));
  return {
    ...base,
    value,
    components,
    note: `Weighted average of the available technical scores (default weights: Performance 25, Technical SEO 25, Accessibility 20, Best Practices 15, Mobile & UX 15, re-normalised).${missing.length ? ` Excluded for lack of data: ${missing.map((k) => SCORE_LABELS[k as ScoreKey]).join(', ')}.` : ''} Conversion Readiness is deliberately excluded. Not a Google score.`,
  };
}

export interface ScoreInput {
  checks: CheckResult[];
  lighthouse: LighthouseSummary | null;
  lighthouseUnavailableReason: string;
  ran: { performance?: boolean; seo: boolean; accessibility: boolean; journey: boolean };
}

export function computeScores(input: ScoreInput): ScoreResult[] {
  const by = (k: ScoreKey) => input.checks.filter((c) => c.score === k);
  const reason = input.lighthouseUnavailableReason;
  const notRun = (key: ScoreKey, what: string): ScoreResult => ({ key, label: SCORE_LABELS[key], kind: 'custom', value: null, note: `Not enough data: the ${what} category was not selected for this audit.` });

  const resolveScore = (
    key: 'performance' | 'accessibility' | 'bestPractices',
    enabled: boolean,
    what: string,
    customNote: string,
  ): ScoreResult => {
    const lh = lighthouseScore(key, input.lighthouse, reason);
    if (lh.value !== null) return lh;
    if (!enabled) return notRun(key, what);
    const keyChecks = by(key);
    if (keyChecks.length > 0) {
      const custom = customScore(key, keyChecks, customNote);
      if (custom.value !== null) return custom;
    }
    return lh;
  };

  const scores: ScoreResult[] = [
    resolveScore(
      'performance',
      input.ran.performance ?? true,
      'Performance',
      'Measured from HTTP response speed, HTML payload weight, response compression, render-blocking scripts, external asset count, cache headers and image dimensions.',
    ),
    input.ran.seo
      ? customScore('technicalSeo', by('technicalSeo'), 'Covers HTTP status, HTTPS, redirects, titles, descriptions, headings, duplicates, canonical, indexability, robots.txt, sitemap, image alt, structured data, Open Graph, language, viewport and broken links.')
      : notRun('technicalSeo', 'Technical SEO'),
    resolveScore(
      'accessibility',
      input.ran.accessibility,
      'Accessibility & Mobile',
      'Measured from HTML lang attributes, image alt coverage, form labels, button/link accessible names, heading order, tabindex, main landmarks and pinch-zoom settings.',
    ),
    resolveScore(
      'bestPractices',
      true,
      'Best Practices',
      'Measured from HTTPS, mixed-content safety, HSTS, browser security headers (nosniff, framing/CSP, Referrer-Policy), DOCTYPE/charset, safe target="_blank" links and 5xx error checks.',
    ),
    input.ran.accessibility
      ? customScore('mobileUx', by('mobileUx'), 'Covers responsive viewport, pinch-zoom, mobile contact routes, mobile fetch responsiveness, payload compactness, responsive media and (when available) Lighthouse tap-targets and Core Web Vitals.')
      : notRun('mobileUx', 'Accessibility & Mobile'),
    input.ran.journey
      ? customScore('conversionReadiness', by('conversionReadiness'), 'Measures whether common next steps (contact routes, calls to action, forms, cart path) are detectable - not conversion rate or business performance.')
      : notRun('conversionReadiness', 'Structure & User Journey'),
  ];
  return [...scores, overallScore(scores)];
}
