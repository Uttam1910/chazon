import type {
  CheckCounts,
  FieldData,
  FieldMetric,
  FindingCategory,
  LabMetric,
  LighthouseSummary,
  MetricRating,
  ServiceCategory,
  Severity,
  Strategy,
} from '@chazon/shared';
import type { FindingDraft } from '../findings/priority';
import { formatBytes, formatMs, isHttpUrl, truncate, uniq } from '../util/text';
import { PageSpeedError } from './client';

/* Loosely typed view of the PSI v5 / Lighthouse JSON. Everything is optional
 * because the shape varies across Lighthouse versions and failure modes. */
interface LhAudit {
  id?: string;
  title?: string;
  description?: string;
  score?: number | null;
  scoreDisplayMode?: string;
  displayValue?: string;
  numericValue?: number;
  numericUnit?: string;
  metricSavings?: Record<string, number | undefined>;
  details?: LhDetails;
}
interface LhDetails {
  type?: string;
  items?: unknown;
  overallSavingsMs?: number;
  overallSavingsBytes?: number;
}
interface LhCategory {
  score?: number | null;
  auditRefs?: { id: string; weight?: number; group?: string }[];
}
interface CruxMetric {
  percentile?: number;
  category?: string;
}
interface CruxExperience {
  metrics?: Record<string, CruxMetric | undefined>;
  overall_category?: string;
  origin_fallback?: boolean;
}
interface PsiResponse {
  loadingExperience?: CruxExperience;
  originLoadingExperience?: CruxExperience;
  lighthouseResult?: {
    requestedUrl?: string;
    finalUrl?: string;
    finalDisplayedUrl?: string;
    lighthouseVersion?: string;
    fetchTime?: string;
    runWarnings?: unknown[];
    runtimeError?: { code?: string; message?: string };
    categories?: Record<string, LhCategory | undefined>;
    audits?: Record<string, LhAudit | undefined>;
  };
}

const LAB_METRICS: [string, string][] = [
  ['first-contentful-paint', 'First Contentful Paint (FCP)'],
  ['largest-contentful-paint', 'Largest Contentful Paint (LCP)'],
  ['total-blocking-time', 'Total Blocking Time (TBT)'],
  ['cumulative-layout-shift', 'Cumulative Layout Shift (CLS)'],
  ['speed-index', 'Speed Index'],
];

const FIELD_METRICS: Record<string, { id: string; label: string; kind: 'ms' | 'cls' }> = {
  LARGEST_CONTENTFUL_PAINT_MS: { id: 'LCP', label: 'Largest Contentful Paint', kind: 'ms' },
  INTERACTION_TO_NEXT_PAINT: { id: 'INP', label: 'Interaction to Next Paint', kind: 'ms' },
  CUMULATIVE_LAYOUT_SHIFT_SCORE: { id: 'CLS', label: 'Cumulative Layout Shift', kind: 'cls' },
  FIRST_CONTENTFUL_PAINT_MS: { id: 'FCP', label: 'First Contentful Paint', kind: 'ms' },
  EXPERIMENTAL_TIME_TO_FIRST_BYTE: { id: 'TTFB', label: 'Time to First Byte', kind: 'ms' },
};

const CATEGORY_MAP: Record<string, { category: FindingCategory; service: ServiceCategory }> = {
  performance: { category: 'performance', service: 'BUILD' },
  accessibility: { category: 'accessibility', service: 'BUILD' },
  'best-practices': { category: 'best-practices', service: 'BUILD' },
  seo: { category: 'seo', service: 'GROW' },
};

function score100(cat: LhCategory | undefined): number | null {
  return typeof cat?.score === 'number' ? Math.round(cat.score * 100) : null;
}

export function ratingFromScore(score: number | null | undefined): MetricRating | null {
  if (typeof score !== 'number') return null;
  if (score >= 0.9) return 'good';
  if (score >= 0.5) return 'needs-improvement';
  return 'poor';
}

/** Removes Markdown links/code from Lighthouse descriptions and extracts the first https link. */
export function cleanDescription(desc: string | undefined): { text: string; link?: string } {
  if (!desc) return { text: '' };
  let link: string | undefined;
  const text = desc
    .replace(/\[([^\]]*)\]\(([^)\s]+)\)/g, (_m, label: string, href: string) => {
      if (!link && isHttpUrl(href)) link = href;
      return label;
    })
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  return { text, link };
}

function performanceTag(id: string): string {
  if (/render-blocking/.test(id)) return 'render-blocking';
  if (/unused-(javascript|css)|legacy-javascript|duplicated-javascript|unminified/.test(id)) return 'unused-code';
  if (/image|imag|offscreen|lcp-lazy|unsized/.test(id)) return 'images';
  if (/byte-weight|network|cache|font|third-part|redirect|server-response|document-latency|bootup|mainthread|dom-size|long-task|text-compression|http2|preconnect|critical-request/.test(id)) {
    return 'network';
  }
  return 'other';
}

const PERF_RECOMMENDATION: Record<string, string> = {
  images: 'Resize images to their displayed size, compress them, serve modern formats (WebP/AVIF) and lazy-load images below the fold.',
  'render-blocking': 'Inline critical CSS, defer non-critical CSS and JavaScript (defer/async) so the first render is not blocked.',
  'unused-code': 'Remove or code-split JavaScript and CSS that the page does not use, and avoid shipping legacy polyfills to modern browsers.',
  network: 'Reduce the number and size of requests: enable compression and caching, limit third-party scripts and trim heavy resources.',
  other: 'Follow the Lighthouse guidance for this audit.',
};

function formatSavings(audit: LhAudit): string | undefined {
  const parts: string[] = [];
  const d = audit.details;
  if (typeof d?.overallSavingsMs === 'number' && d.overallSavingsMs >= 50) parts.push(`~${formatMs(d.overallSavingsMs)}`);
  if (typeof d?.overallSavingsBytes === 'number' && d.overallSavingsBytes >= 1024) parts.push(`~${formatBytes(d.overallSavingsBytes)}`);
  if (parts.length === 0 && audit.metricSavings) {
    for (const [metric, value] of Object.entries(audit.metricSavings)) {
      if (typeof value !== 'number' || value <= 0) continue;
      if (metric === 'CLS') {
        if (value >= 0.01) parts.push(`CLS -${value.toFixed(2)}`);
      } else if (value >= 50) {
        parts.push(`${metric} ~${formatMs(value)}`);
      }
    }
  }
  return parts.length ? `${parts.join(', ')} (Lighthouse estimate)` : undefined;
}

function maxMetricSavingMs(audit: LhAudit): number {
  const values = Object.entries(audit.metricSavings ?? {})
    .filter(([k]) => k !== 'CLS')
    .map(([, v]) => (typeof v === 'number' ? v : 0));
  return Math.max(audit.details?.overallSavingsMs ?? 0, ...values, 0);
}

/** Flattens Lighthouse detail items (tables, lists of tables, checklists) into evidence lines and URLs. */
export function extractItems(details: LhDetails | undefined): { lines: string[]; urls: string[]; total: number } {
  const lines: string[] = [];
  const urls: string[] = [];
  if (!details) return { lines, urls, total: 0 };

  if (details.type === 'checklist' && details.items && typeof details.items === 'object' && !Array.isArray(details.items)) {
    for (const v of Object.values(details.items as Record<string, { label?: string; value?: boolean }>)) {
      if (v && v.value === false && v.label) lines.push(`Not met: ${truncate(v.label, 160)}`);
    }
    return { lines, urls, total: lines.length };
  }

  const flat: Record<string, unknown>[] = [];
  const visit = (items: unknown) => {
    if (!Array.isArray(items)) return;
    for (const it of items) {
      if (!it || typeof it !== 'object') continue;
      const obj = it as Record<string, unknown>;
      if ((obj.type === 'table' || obj.type === 'opportunity' || obj.type === 'list') && Array.isArray(obj.items)) visit(obj.items);
      else flat.push(obj);
    }
  };
  visit(details.items);

  for (const item of flat.slice(0, 8)) {
    const parts: string[] = [];
    const source = item.source as { url?: unknown } | undefined;
    const node = item.node as { nodeLabel?: unknown; snippet?: unknown; selector?: unknown } | undefined;
    const url = typeof item.url === 'string' ? item.url : typeof source?.url === 'string' ? source.url : null;
    if (url && isHttpUrl(url)) {
      urls.push(url);
      parts.push(truncate(url, 160));
    }
    if (node && typeof node === 'object') {
      const label = typeof node.nodeLabel === 'string' ? node.nodeLabel : '';
      const snippet = typeof node.snippet === 'string' ? node.snippet : '';
      const selector = typeof node.selector === 'string' ? node.selector : '';
      parts.push(`Element: ${truncate([label, snippet].filter(Boolean).join(' - ') || selector, 200)}`);
      if (!url && selector) urls.push(`element: ${truncate(selector, 120)}`);
    }
    if (typeof item.wastedBytes === 'number' && item.wastedBytes >= 1024) parts.push(`potential saving ~${formatBytes(item.wastedBytes)}`);
    if (typeof item.wastedMs === 'number' && item.wastedMs >= 10) parts.push(`potential saving ~${formatMs(item.wastedMs)}`);
    if (typeof item.totalBytes === 'number' && item.totalBytes >= 1024 && !item.wastedBytes) parts.push(`size ${formatBytes(item.totalBytes)}`);
    if (typeof item.label === 'string' && parts.length === 0) parts.push(truncate(item.label, 160));
    if (parts.length) lines.push(parts.join(' - '));
  }
  return { lines, urls: uniq(urls), total: flat.length };
}

function severityFor(catId: string, auditId: string, audit: LhAudit, weight: number): Severity {
  if (catId === 'performance') {
    const saving = maxMetricSavingMs(audit);
    if (saving >= 1000) return 'high';
    if (saving >= 300) return 'medium';
    return (audit.score ?? 1) < 0.5 && saving === 0 ? 'medium' : 'low';
  }
  if (catId === 'accessibility') {
    if (weight >= 10) return 'high';
    if (weight >= 7) return 'medium';
    return 'low';
  }
  if (catId === 'best-practices') {
    if (/is-on-https|redirects-http/.test(auditId)) return 'high';
    return 'low';
  }
  // seo
  if (auditId === 'is-crawlable' || auditId === 'http-status-code') return 'high';
  if (auditId === 'document-title' || auditId === 'meta-description') return 'medium';
  return 'low';
}

function buildField(exp: CruxExperience | undefined, scope: 'url' | 'origin'): FieldData | null {
  const metrics = exp?.metrics;
  if (!metrics || Object.keys(metrics).length === 0) return null;
  const out: FieldMetric[] = [];
  for (const [key, def] of Object.entries(FIELD_METRICS)) {
    const m = metrics[key];
    if (!m || typeof m.percentile !== 'number') continue;
    const value = def.kind === 'cls' ? m.percentile / 100 : m.percentile;
    out.push({
      id: def.id,
      label: def.label,
      percentile: value,
      displayValue: def.kind === 'cls' ? value.toFixed(2) : formatMs(value),
      category: m.category ?? 'UNKNOWN',
    });
  }
  if (out.length === 0) return null;
  const cwv = ['LCP', 'INP', 'CLS'].map((id) => out.find((m) => m.id === id));
  const coreWebVitalsPassed = cwv.every(Boolean) ? cwv.every((m) => m?.category === 'FAST') : null;
  return { scope, overallCategory: exp?.overall_category ?? null, coreWebVitalsPassed, metrics: out };
}

/** Only well-formed base64 image data URIs within a size cap are kept; anything else is dropped. */
const IMAGE_DATA_URI = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;
export function safeImageData(value: unknown, maxBytes: number): string | undefined {
  return typeof value === 'string' && value.length <= maxBytes && IMAGE_DATA_URI.test(value) ? value : undefined;
}

function screenshots(audits: Record<string, LhAudit | undefined>): Pick<LighthouseSummary, 'screenshot' | 'filmstrip'> {
  const finalShot = audits['final-screenshot']?.details as { data?: unknown } | undefined;
  const screenshot = safeImageData(finalShot?.data, 400_000);
  const items = (audits['screenshot-thumbnails']?.details?.items ?? []) as { timing?: unknown; data?: unknown }[];
  const frames = Array.isArray(items)
    ? items
        .map((i) => ({ timingMs: typeof i.timing === 'number' ? Math.round(i.timing) : -1, data: safeImageData(i.data, 60_000) }))
        .filter((f): f is { timingMs: number; data: string } => f.timingMs >= 0 && Boolean(f.data))
    : [];
  // Keep at most 8 evenly spaced frames to bound the report size.
  const step = Math.max(1, Math.ceil(frames.length / 8));
  const filmstrip = frames.filter((_, i) => i % step === 0 || i === frames.length - 1).slice(0, 8);
  return { ...(screenshot ? { screenshot } : {}), ...(filmstrip.length ? { filmstrip } : {}) };
}

export interface ParsedPageSpeed {
  summary: LighthouseSummary;
  findings: FindingDraft[];
}

export function parsePageSpeed(json: unknown, strategy: Strategy): ParsedPageSpeed {
  const psi = (json && typeof json === 'object' ? json : {}) as PsiResponse;
  const lhr = psi.lighthouseResult;
  if (!lhr || typeof lhr !== 'object' || !lhr.audits || !lhr.categories) {
    throw new PageSpeedError('INVALID_RESPONSE', 'The PageSpeed Insights response did not contain a Lighthouse result.');
  }
  if (lhr.runtimeError?.code && lhr.runtimeError.code !== 'NO_ERROR') {
    throw new PageSpeedError('LIGHTHOUSE_FAILED', `Lighthouse could not audit the page (${lhr.runtimeError.code}).`);
  }
  const audits = lhr.audits;
  const cats = lhr.categories;

  const metrics: LabMetric[] = LAB_METRICS.map(([id, label]) => {
    const a = audits[id];
    return {
      id,
      label,
      displayValue: a?.displayValue ?? 'Not reported',
      numericValue: typeof a?.numericValue === 'number' ? a.numericValue : null,
      unit: a?.numericUnit ?? '',
      score: typeof a?.score === 'number' ? a.score : null,
      rating: ratingFromScore(a?.score),
    };
  });

  // Field (real-user, CrUX) data. Origin fallback is labelled as such.
  let field: FieldData | null = null;
  let fieldUnavailableReason: string | undefined;
  if (psi.loadingExperience?.metrics && Object.keys(psi.loadingExperience.metrics).length > 0) {
    field = buildField(psi.loadingExperience, psi.loadingExperience.origin_fallback ? 'origin' : 'url');
  }
  if (!field) field = buildField(psi.originLoadingExperience, 'origin');
  if (!field) {
    fieldUnavailableReason =
      'No real-user (Chrome UX Report) field data is available for this URL or origin - usually because it has too little traffic. Only lab data is shown.';
  }

  const auditOutcomes: LighthouseSummary['auditOutcomes'] = {};
  for (const [id, a] of Object.entries(audits)) {
    if (!a) continue;
    auditOutcomes[id] = {
      score: typeof a.score === 'number' ? a.score : null,
      mode: a.scoreDisplayMode ?? 'unknown',
      ...(a.displayValue ? { displayValue: a.displayValue } : {}),
    };
  }

  const categoryCounts: LighthouseSummary['categoryCounts'] = {};
  const countKeys: Record<string, keyof LighthouseSummary['categoryCounts']> = {
    performance: 'performance',
    accessibility: 'accessibility',
    'best-practices': 'bestPractices',
    seo: 'seo',
  };
  for (const [catId, key] of Object.entries(countKeys)) {
    const refs = cats[catId]?.auditRefs;
    if (!refs) continue;
    const counts: CheckCounts = { total: 0, completed: 0, passed: 0, warnings: 0, failed: 0, skipped: 0 };
    for (const ref of refs) {
      if (ref.group === 'hidden') continue;
      const a = audits[ref.id];
      if (!a || a.scoreDisplayMode === 'informative') continue;
      counts.total++;
      if (a.scoreDisplayMode === 'notApplicable' || a.scoreDisplayMode === 'manual' || a.scoreDisplayMode === 'error' || typeof a.score !== 'number') {
        counts.skipped++;
        continue;
      }
      counts.completed++;
      if (a.score >= 0.9) counts.passed++;
      else if (a.score >= 0.5) counts.warnings++;
      else counts.failed++;
    }
    categoryCounts[key] = counts;
  }

  const findings: FindingDraft[] = [];
  const seen = new Set<string>();
  for (const [catId, mapping] of Object.entries(CATEGORY_MAP)) {
    const cat = cats[catId];
    if (!cat?.auditRefs) continue;
    for (const ref of cat.auditRefs) {
      if (ref.group === 'metrics' || ref.group === 'hidden' || seen.has(ref.id)) continue;
      const audit = audits[ref.id];
      if (!audit) continue;
      const mode = audit.scoreDisplayMode ?? '';
      if (['notApplicable', 'manual', 'informative', 'error'].includes(mode)) continue;
      if (typeof audit.score !== 'number' || audit.score >= 0.9) continue;
      seen.add(ref.id);

      const { text, link } = cleanDescription(audit.description);
      const items = extractItems(audit.details);
      const tag = catId === 'performance' ? performanceTag(ref.id) : catId;
      const evidence = [
        ...(audit.displayValue ? [`Lighthouse reported: ${audit.displayValue}`] : [`Lighthouse audit "${ref.id}" did not pass (score ${audit.score.toFixed(2)}).`]),
        ...items.lines,
      ];
      const isHttps = /is-on-https|redirects-http/.test(ref.id);
      findings.push({
        id: `lh.${ref.id}`,
        title: audit.title ?? ref.id,
        category: isHttps ? 'security' : mapping.category,
        severity: severityFor(catId, ref.id, audit, ref.weight ?? 0),
        confidence: catId === 'performance' ? 'medium' : 'high',
        source: 'lighthouse',
        evidence,
        affected: items.urls.slice(0, 15),
        ...(items.total > items.urls.length ? { affectedTotal: items.total } : {}),
        explanation: text || 'Lighthouse flagged this audit as failing.',
        recommendation:
          catId === 'performance'
            ? PERF_RECOMMENDATION[tag] ?? PERF_RECOMMENDATION.other!
            : catId === 'accessibility'
              ? 'Fix the listed elements so they meet the WCAG requirement described, then re-test with assistive technology.'
              : 'Follow the Lighthouse guidance for this audit and re-run the audit to confirm.',
        service: mapping.service,
        effort: catId === 'accessibility' || catId === 'seo' || tag === 'images' ? 'low' : 'medium',
        ...(catId === 'performance' && formatSavings(audit) ? { estimatedSavings: formatSavings(audit) } : {}),
        tags: [tag],
        ...(link ? { learnMoreUrl: link } : {}),
      });
    }
  }

  // Lab metric findings for poor / needs-improvement Core Web Vitals-related metrics.
  for (const m of metrics) {
    if (!m.rating || m.rating === 'good') continue;
    const important = ['largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift'].includes(m.id);
    findings.push({
      id: `lh.metric.${m.id}`,
      title: `${m.rating === 'poor' ? 'Poor' : 'Needs improvement'}: ${m.label} (lab)`,
      category: 'performance',
      severity: m.rating === 'poor' ? (important ? 'high' : 'medium') : important ? 'medium' : 'low',
      confidence: 'medium',
      source: 'lighthouse',
      evidence: [`Lab value (${strategy}): ${m.displayValue} - Lighthouse metric score ${m.score?.toFixed(2) ?? 'n/a'}.`],
      affected: [lhr.finalDisplayedUrl ?? lhr.finalUrl ?? lhr.requestedUrl ?? ''].filter(Boolean),
      explanation:
        'This is a single simulated lab measurement. Lab values vary between runs and devices; compare with field data where available before drawing conclusions.',
      recommendation: 'Address the related performance opportunities listed in this report, then re-test several times.',
      service: 'BUILD',
      effort: 'medium',
      tags: ['metric'],
    });
  }

  const summary: LighthouseSummary = {
    strategy,
    requestedUrl: lhr.requestedUrl ?? '',
    finalUrl: lhr.finalDisplayedUrl ?? lhr.finalUrl ?? lhr.requestedUrl ?? '',
    lighthouseVersion: lhr.lighthouseVersion ?? 'unknown',
    fetchTime: lhr.fetchTime ?? new Date().toISOString(),
    categories: {
      performance: score100(cats.performance),
      accessibility: score100(cats.accessibility),
      bestPractices: score100(cats['best-practices']),
      seo: score100(cats.seo),
    },
    metrics,
    field,
    ...(fieldUnavailableReason ? { fieldUnavailableReason } : {}),
    categoryCounts,
    ...screenshots(audits),
    runWarnings: (lhr.runWarnings ?? []).filter((w): w is string => typeof w === 'string').map((w) => truncate(w, 300)),
    auditOutcomes,
  };
  return { summary, findings };
}
