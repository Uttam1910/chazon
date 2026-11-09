import type { SearchMetrics, SearchOpportunity, SearchPerformance, SearchRow } from '@chazon/shared';

/**
 * Turns Search Console rows into a report section. Opportunities are fixed, documented rules over
 * the returned rows - prompts to investigate, never predictions of more clicks or better rankings.
 */

/** A page needs at least this many impressions before its click-through rate is worth reviewing. */
export const PAGE_MIN_IMPRESSIONS = 100;
/** ...and a CTR below this fraction of the property's overall CTR... */
export const PAGE_CTR_FRACTION = 0.5;
/** ...while ranking, on average, within the first two result pages. */
export const PAGE_MAX_POSITION = 20;
/** Queries with enough impressions whose average position is just off page one. */
export const QUERY_MIN_IMPRESSIONS = 50;
export const QUERY_POSITION_RANGE: [number, number] = [8, 20];
const MAX_OPPORTUNITIES = 5;

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

export function findOpportunities(totals: SearchMetrics | null, queries: SearchRow[], pages: SearchRow[]): SearchOpportunity[] {
  const out: SearchOpportunity[] = [];
  if (totals && totals.impressions > 0) {
    const bar = totals.ctr * PAGE_CTR_FRACTION;
    pages
      .filter((p) => p.impressions >= PAGE_MIN_IMPRESSIONS && p.position <= PAGE_MAX_POSITION && p.ctr < bar)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, MAX_OPPORTUNITIES)
      .forEach((p) =>
        out.push({
          id: `gsc.page-ctr:${p.key}`,
          kind: 'page-ctr',
          target: p.key,
          metrics: { clicks: p.clicks, impressions: p.impressions, ctr: p.ctr, position: p.position },
          reason: `${p.impressions.toLocaleString('en-IN')} impressions at average position ${p.position.toFixed(1)}, but a click-through rate of ${pct(p.ctr)} - less than half the property’s overall ${pct(totals.ctr)} for this period.`,
          suggestion: 'Review whether the page title and meta description match what searchers are looking for, and whether the snippet is clear and specific.',
        }),
      );
  }
  const [lo, hi] = QUERY_POSITION_RANGE;
  queries
    .filter((q) => q.key && q.impressions >= QUERY_MIN_IMPRESSIONS && q.position >= lo && q.position <= hi)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, MAX_OPPORTUNITIES)
    .forEach((q) =>
      out.push({
        id: `gsc.query:${q.key}`,
        kind: 'query-near-page-one',
        target: q.key,
        metrics: { clicks: q.clicks, impressions: q.impressions, ctr: q.ctr, position: q.position },
        reason: `“${q.key}” had ${q.impressions.toLocaleString('en-IN')} impressions at an average position of ${q.position.toFixed(1)} - around the bottom of page one or on page two.`,
        suggestion: 'Check which page ranks for this search and whether it answers it clearly and specifically; improve the content if it does not.',
      }),
    );
  return out;
}

export function buildSearchPerformance(input: { siteUrl: string; startDate: string; endDate: string; totals: SearchRow[]; queries: SearchRow[]; pages: SearchRow[]; now?: Date }): SearchPerformance {
  const t = input.totals[0];
  const totals = t ? { clicks: t.clicks, impressions: t.impressions, ctr: t.ctr, position: t.position } : null;
  return {
    siteUrl: input.siteUrl,
    startDate: input.startDate,
    endDate: input.endDate,
    fetchedAt: (input.now ?? new Date()).toISOString(),
    totals,
    queries: input.queries,
    pages: input.pages,
    opportunities: findOpportunities(totals, input.queries, input.pages),
    notes: [
      'Source: Google Search Console API (Search results, web), read-only, for the account you connected. These figures are Google’s, not this tool’s audit findings.',
      'Only finalised data is requested, so the most recent 2–3 days are usually missing.',
      'Google hides some rare queries for privacy, so the query list does not add up to the totals. Average position is Google’s impression-weighted average.',
      `Opportunities use fixed rules (pages with ≥${PAGE_MIN_IMPRESSIONS} impressions, position ≤${PAGE_MAX_POSITION} and CTR below half the site average; queries with ≥${QUERY_MIN_IMPRESSIONS} impressions at positions ${QUERY_POSITION_RANGE[0]}–${QUERY_POSITION_RANGE[1]}). They are things to investigate, not guaranteed improvements.`,
      ...(totals ? [] : ['Google returned no search data for this property and period. New or low-traffic properties often have none.']),
    ],
  };
}
