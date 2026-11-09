import type { Confidence, Effort, Finding, Severity } from '@chazon/shared';
import { enrich } from './guide';

/** What analysers produce. Reader-facing fields are optional here and filled in by `enrich` (findings/guide.ts). */
export type FindingDraft = Omit<Finding, 'priority' | 'plainSummary' | 'effortRationale' | 'verification' | 'status'> &
  Partial<Pick<Finding, 'plainSummary' | 'effortRationale' | 'verification' | 'status'>>;

/**
 * Severity rules (applied by each check, documented in README):
 *  - critical: prevents the site/page being reached or indexed (start page 5xx/4xx,
 *    robots.txt blocking everything). Never used for cosmetic issues.
 *  - high: confirmed issue with significant technical impact (no HTTPS, missing
 *    title or viewport, confirmed broken internal links, poor lab LCP/TBT/CLS,
 *    high-impact accessibility failures, homepage noindex).
 *  - medium: likely impact on search, usability or speed (missing descriptions,
 *    missing H1, duplicate metadata, images without alt, invalid JSON-LD).
 *  - low: best-practice gaps and minor issues (length guidance, missing Open Graph).
 *  - info: observations and things that could not be verified.
 */
export const SEVERITY_RANK: Record<Severity, number> = { critical: 5, high: 4, medium: 3, low: 2, info: 1 };
const CONFIDENCE_FACTOR: Record<Confidence, number> = { high: 1, medium: 0.8, low: 0.55 };
const EFFORT_FACTOR: Record<Effort, number> = { low: 1, medium: 0.9, high: 0.8 };

/** priority = severity rank x 20 x confidence factor x practicality (effort) factor, 0–100. */
export function computePriority(f: Pick<Finding, 'severity' | 'confidence' | 'effort'>): number {
  return Math.round(SEVERITY_RANK[f.severity] * 20 * CONFIDENCE_FACTOR[f.confidence] * EFFORT_FACTOR[f.effort]);
}

export function prioritise(drafts: FindingDraft[]): Finding[] {
  return drafts
    .map((d) => ({ ...enrich(d), priority: computePriority(d) }))
    .sort((a, b) => b.priority - a.priority || SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || a.title.localeCompare(b.title));
}

export function topFindings(findings: Finding[], n = 5): Finding[] {
  return findings.filter((f) => f.severity !== 'info').slice(0, n);
}
