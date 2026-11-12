import type {
  AuditCategoryKey,
  AuditReport,
  AuditRequest,
  CheckResult,
  CrawlSummary,
  FindingCategory,
  HttpInfo,
  IncompleteCheck,
  LighthouseSummary,
  LinkCheckSummary,
  ProgressStep,
  StepState,
  TechnologySummary,
} from '@chazon/shared';
import { accessibilityChecks, analyzeAccessibility, LIGHTHOUSE_EQUIVALENTS, mobileChecks } from './analyze/accessibility';
import { analyzeJourney, summariseJourney } from './analyze/journey';
import { checkLinks } from './analyze/links';
import { analyzePage, type PageData } from './analyze/page';
import { analyzeSeo } from './analyze/seo';
import { analyzePerformanceAndPractices } from './analyze/siteHealth';
import { mergeDetections } from './analyze/tech';
import { crawlSite } from './crawl/crawler';
import { fetchRobots, type RobotsResult } from './crawl/robots';
import { discoverSitemap, type SitemapResult } from './crawl/sitemap';
import { registeredDomain } from './crawl/urls';
import { buildInsights, type ReportCore } from './findings/insights';
import { prioritise, SEVERITY_RANK, topFindings, type FindingDraft } from './findings/priority';
import { FetchError, isHtmlContentType, type SafeFetcher } from './net/safeFetch';
import { parseTargetUrl, resolveAllowed, strictPolicy, UnsafeUrlError, type NetworkPolicy } from './net/urlPolicy';
import { PageSpeedError, type LighthouseCategoryId, type PageSpeedClient } from './pagespeed/client';
import { parsePageSpeed, type ParsedPageSpeed } from './pagespeed/parse';
import { computeScores } from './scoring/scores';
import { plural } from './util/text';

export const TOOL = { name: 'Website Audit & Digital Growth Analyzer', version: '0.2.0' };

export type AuditErrorCode = 'INVALID_URL' | 'UNSAFE_URL' | 'DNS_FAILURE' | 'SITE_UNREACHABLE' | 'CANCELLED';

export class AuditError extends Error {
  constructor(
    public readonly code: AuditErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AuditError';
  }
}

export interface AuditLimits {
  maxPageBytes: number;
  minDelayMs: number;
  concurrency: number;
  maxInternalLinks: number;
  maxExternalLinks: number;
  linkConcurrency: number;
}

export const DEFAULT_LIMITS: AuditLimits = {
  maxPageBytes: 3 * 1024 * 1024,
  minDelayMs: 300,
  concurrency: 2,
  maxInternalLinks: 25,
  maxExternalLinks: 15,
  linkConcurrency: 3,
};

export interface AuditDeps {
  fetcher: SafeFetcher;
  pagespeed: PageSpeedClient;
  userAgentToken: string;
  policy?: NetworkPolicy;
  limits?: Partial<AuditLimits>;
  /** Server-side only (never from the request): skip Lighthouse, e.g. for competitor observations. */
  skipLighthouse?: boolean;
}

export type ProgressFn = (key: string, state: StepState, detail?: string) => void;

/** Validates syntax, policy and DNS before any request is made to the site. */
export async function preflight(input: string, policy: NetworkPolicy = strictPolicy): Promise<URL> {
  let url: URL;
  try {
    url = parseTargetUrl(input, policy.checkUrl);
  } catch (err) {
    if (err instanceof UnsafeUrlError) {
      throw new AuditError(err.code === 'INVALID_URL' || err.code === 'UNSUPPORTED_PROTOCOL' ? 'INVALID_URL' : 'UNSAFE_URL', err.message);
    }
    throw err;
  }
  try {
    await resolveAllowed(url.hostname, policy);
  } catch (err) {
    if (err instanceof UnsafeUrlError) throw new AuditError('UNSAFE_URL', err.message);
    throw new AuditError('DNS_FAILURE', `The domain "${url.hostname}" could not be resolved. Check the spelling or try again later.`);
  }
  return url;
}

function lighthouseCategories(cats: AuditCategoryKey[]): LighthouseCategoryId[] {
  const out: LighthouseCategoryId[] = [];
  if (cats.includes('performance')) out.push('performance', 'best-practices');
  if (cats.includes('accessibility')) out.push('accessibility');
  if (cats.includes('seo')) out.push('seo');
  return out;
}

export function planSteps(req: AuditRequest, opts: { skipLighthouse?: boolean } = {}): ProgressStep[] {
  const c = new Set(req.categories);
  const steps: ProgressStep[] = [
    { key: 'validate', label: 'Validating URL and DNS', state: 'pending' },
    { key: 'fetch', label: 'Fetching the start page', state: 'pending' },
  ];
  if (!opts.skipLighthouse && lighthouseCategories(req.categories).length) steps.push({ key: 'lighthouse', label: `Lighthouse via PageSpeed Insights (${req.strategy})`, state: 'pending' });
  if (c.has('seo') || c.has('crawl')) {
    steps.push({ key: 'robots', label: 'Checking robots.txt', state: 'pending' });
    steps.push({ key: 'sitemap', label: 'Looking for an XML sitemap', state: 'pending' });
  }
  if (c.has('crawl') && req.crawlLimit > 1) steps.push({ key: 'crawl', label: `Crawling up to ${req.crawlLimit} pages`, state: 'pending' });
  if (req.checkLinks && (c.has('seo') || c.has('crawl'))) steps.push({ key: 'links', label: 'Checking links', state: 'pending' });
  steps.push({ key: 'analyze', label: 'Analysing findings and scores', state: 'pending' });
  return steps;
}

/** Which selectable category a custom finding belongs to (Lighthouse findings follow the PSI categories requested). */
const FINDING_TO_CATEGORY: Record<FindingCategory, AuditCategoryKey[]> = {
  performance: ['performance'],
  'best-practices': ['performance'],
  security: ['seo'],
  seo: ['seo'],
  accessibility: ['accessibility'],
  mobile: ['accessibility'],
  journey: ['journey'],
  crawl: ['seo', 'crawl'],
  technology: ['technology'],
};

const EXTRA_EQUIVALENTS: Record<string, string> = {
  'seo.missing-title': 'document-title',
  'seo.missing-description': 'meta-description',
  'seo.noindex-start': 'is-crawlable',
  'security.no-https': 'is-on-https',
  'security.http-not-redirected': 'redirects-http',
  'perf.slow-response': 'server-response-time',
  'perf.large-html': 'total-byte-weight',
  'perf.no-compression': 'uses-text-compression',
  'perf.render-blocking-scripts': 'render-blocking-resources',
  'perf.images-missing-dimensions': 'unsized-images',
  'bp.unsafe-blank-links': 'external-anchors-use-rel-noopener',
};

/** Merges a custom finding with its Lighthouse equivalent so the same issue is not listed twice. */
export function mergeEquivalentFindings(custom: FindingDraft[], lighthouse: FindingDraft[]): FindingDraft[] {
  const map = { ...LIGHTHOUSE_EQUIVALENTS, ...EXTRA_EQUIVALENTS };
  const lhById = new Map(lighthouse.map((f) => [f.id.replace(/^lh\./, ''), f]));
  const consumed = new Set<string>();
  const merged = custom.map((f) => {
    const lhId = map[f.id];
    const lh = lhId ? lhById.get(lhId) : undefined;
    if (!lh) return f;
    consumed.add(lh.id);
    return {
      ...f,
      confidence: 'high' as const,
      severity: SEVERITY_RANK[lh.severity] > SEVERITY_RANK[f.severity] ? lh.severity : f.severity,
      evidence: [...f.evidence, `Lighthouse also flagged this on the start page ("${lh.title}").`, ...lh.evidence.slice(1, 4)],
      ...(lh.learnMoreUrl && !f.learnMoreUrl ? { learnMoreUrl: lh.learnMoreUrl } : {}),
    };
  });
  return [...merged, ...lighthouse.filter((f) => !consumed.has(f.id))];
}

export async function runAudit(
  id: string,
  req: AuditRequest,
  deps: AuditDeps,
  progress: ProgressFn = () => {},
  signal?: AbortSignal,
): Promise<AuditReport> {
  const started = new Date();
  const limits = { ...DEFAULT_LIMITS, ...deps.limits };
  const { fetcher } = deps;
  const cats = new Set(req.categories);
  const incomplete: IncompleteCheck[] = [];
  const checkAbort = () => {
    if (signal?.aborted) throw new AuditError('CANCELLED', 'The audit was cancelled.');
  };

  // 1. Validate ---------------------------------------------------------------------
  progress('validate', 'running');
  let startUrl: URL;
  try {
    startUrl = await preflight(req.url, deps.policy);
  } catch (err) {
    progress('validate', 'failed', err instanceof Error ? err.message : undefined);
    throw err;
  }
  progress('validate', 'done', startUrl.hostname);

  // 2. Lighthouse runs in parallel with everything else ------------------------------
  const lhCats = deps.skipLighthouse ? [] : lighthouseCategories(req.categories);
  type PsiOutcome = { ok: true; parsed: ParsedPageSpeed } | { ok: false; error: string };
  let psiPromise: Promise<PsiOutcome> | null = null;
  if (lhCats.length) {
    progress('lighthouse', 'running', 'Waiting for Google PageSpeed Insights (often 15–60 s)');
    psiPromise = deps.pagespeed
      .run(startUrl.href, req.strategy, lhCats, signal)
      .then((json): PsiOutcome => ({ ok: true, parsed: parsePageSpeed(json, req.strategy) }))
      .catch((err: unknown): PsiOutcome => ({
        ok: false,
        error: err instanceof PageSpeedError ? err.message : 'Unexpected error while processing the PageSpeed Insights response.',
      }));
  }

  // 3. Start page -------------------------------------------------------------------
  progress('fetch', 'running');
  const http: HttpInfo = {
    inputUrl: startUrl.href,
    finalUrl: null,
    status: null,
    redirects: [],
    httpsUsed: null,
    httpRedirectsToHttps: null,
    httpCheckDetail: '',
    responseTimeMs: null,
  };
  let startPage: PageData | null = null;
  let siteDomain: string | null = null;
  let startContentType = '';
  try {
    const res = await fetcher.fetch(startUrl, { maxBytes: limits.maxPageBytes, timeoutMs: 20_000, signal, acceptContentType: isHtmlContentType });
    http.finalUrl = res.finalUrl;
    http.status = res.status;
    http.redirects = res.redirects;
    http.httpsUsed = res.finalUrl.startsWith('https:');
    http.responseTimeMs = res.timeMs;
    startContentType = res.contentType;
    siteDomain = registeredDomain(res.finalUrl);
    if (res.status < 400 && !res.bodySkipped && siteDomain) {
      startPage = analyzePage({
        html: res.text(),
        url: startUrl.href,
        finalUrl: res.finalUrl,
        status: res.status,
        contentType: res.contentType,
        bytes: res.bytes,
        truncated: res.truncated,
        responseTimeMs: res.timeMs,
        redirects: res.redirects,
        headers: res.headers,
        source: 'start',
        siteDomain,
      });
    } else if (res.bodySkipped) {
      incomplete.push({ name: 'HTML analysis', reason: `The start URL returned "${res.contentType}", not an HTML page.` });
    }
    progress('fetch', res.status < 400 ? 'done' : 'failed', `HTTP ${res.status} in ${res.timeMs} ms${res.redirects.length ? ` after ${plural(res.redirects.length, 'redirect')}` : ''}`);
  } catch (err) {
    http.error = err instanceof FetchError ? err.message : 'The start page could not be fetched.';
    progress('fetch', 'failed', http.error);
  }
  checkAbort();

  // HTTP -> HTTPS behaviour
  if (http.finalUrl?.startsWith('https:')) {
    if (startUrl.protocol === 'http:') {
      http.httpRedirectsToHttps = true;
      http.httpCheckDetail = `The submitted http:// URL redirected to ${http.finalUrl}.`;
    } else {
      const httpUrl = new URL(http.finalUrl);
      httpUrl.protocol = 'http:';
      httpUrl.pathname = '/';
      httpUrl.search = '';
      try {
        const r = await fetcher.fetch(httpUrl, { maxBytes: 16 * 1024, timeoutMs: 10_000, signal });
        http.httpRedirectsToHttps = r.finalUrl.startsWith('https:');
        http.httpCheckDetail = `${httpUrl.href} → ${r.finalUrl} (HTTP ${r.status})`;
      } catch (err) {
        http.httpCheckDetail = `Could not connect to ${httpUrl.href} (${err instanceof FetchError ? err.message : 'error'}). Port 80 may simply be closed, which is acceptable.`;
      }
    }
  } else if (http.finalUrl) {
    http.httpCheckDetail = 'Not applicable: the site is served over HTTP.';
  }

  // 4. robots.txt & sitemap ----------------------------------------------------------
  let robots: RobotsResult | null = null;
  let sitemap: SitemapResult | null = null;
  const robotsCache = new Map<string, Promise<RobotsResult>>();
  const robotsFor = (origin: string) => {
    let p = robotsCache.get(origin);
    if (!p) {
      p = fetchRobots(origin, fetcher, deps.userAgentToken, `${origin}/`, signal);
      robotsCache.set(origin, p);
    }
    return p;
  };
  const needsSiteFiles = cats.has('seo') || cats.has('crawl');
  if (needsSiteFiles) {
    if (http.finalUrl) {
      const origin = new URL(http.finalUrl).origin;
      progress('robots', 'running');
      const robotsPromise = fetchRobots(origin, fetcher, deps.userAgentToken, http.finalUrl, signal);
      robotsCache.set(origin, robotsPromise);
      robots = await robotsPromise;
      progress('robots', robots.info.error ? 'failed' : 'done', robots.info.error ?? (robots.info.found ? 'robots.txt found' : `No robots.txt (HTTP ${robots.info.status})`));
      if (robots.info.error) incomplete.push({ name: 'robots.txt', reason: robots.info.error });

      progress('sitemap', 'running');
      sitemap = await discoverSitemap(origin, robots.info.sitemaps, fetcher, signal);
      progress('sitemap', 'done', sitemap.info.found ? `Found ${sitemap.info.found}` : 'Not found at the checked locations');
    } else {
      progress('robots', 'skipped', 'Start page unavailable');
      progress('sitemap', 'skipped', 'Start page unavailable');
      incomplete.push({ name: 'robots.txt and sitemap', reason: 'Skipped because the start page could not be fetched.' });
    }
  }
  checkAbort();

  // 5. Crawl --------------------------------------------------------------------------
  let pages: PageData[] = startPage ? [startPage] : [];
  let crawl: CrawlSummary | null = null;
  let statuses = new Map<string, { status: number | null; reason?: string; code?: string }>();
  let linkSources = new Map<string, string[]>();
  if (cats.has('crawl') && startPage && siteDomain) {
    if (req.crawlLimit > 1) {
      progress('crawl', 'running', `1 of up to ${req.crawlLimit} pages`);
      const out = await crawlSite(
        {
          start: startPage,
          siteDomain,
          limit: req.crawlLimit,
          robotsFor,
          sitemapUrls: sitemap?.pageUrls ?? [],
          minDelayMs: limits.minDelayMs,
          crawlDelayMs: robots?.crawlDelayMs ?? null,
          concurrency: limits.concurrency,
          maxBytes: limits.maxPageBytes,
          signal,
          onProgress: (visited, limit, url) => progress('crawl', 'running', `${visited} of up to ${limit} pages - ${url}`),
        },
        fetcher,
      );
      pages = out.pages;
      crawl = out.summary;
      statuses = out.statuses;
      linkSources = out.linkSources;
      progress('crawl', 'done', `${crawl.visited} visited, ${crawl.skipped} skipped, ${crawl.failed} failed`);
    } else {
      crawl = {
        limit: 1, discovered: 1, visited: 1, skipped: 0, failed: 0,
        pages: [{ url: startPage.url, finalUrl: startPage.finalUrl, status: startPage.status, title: startPage.title, description: startPage.description, h1Count: startPage.h1.length, responseTimeMs: startPage.responseTimeMs, bytes: startPage.bytes, truncated: startPage.truncated, source: 'start' }],
        skippedUrls: [], skippedByReason: {}, failedUrls: [], crawlDelayMs: 0,
      };
    }
  } else if (cats.has('crawl')) {
    progress('crawl', 'skipped', 'Start page unavailable');
    incomplete.push({ name: 'Crawl', reason: 'Skipped because the start page could not be analysed.' });
  }
  checkAbort();

  // 6. Links ----------------------------------------------------------------------------
  let links: LinkCheckSummary | null = null;
  if (req.checkLinks && needsSiteFiles) {
    if (pages.length && siteDomain) {
      progress('links', 'running');
      if (statuses.size === 0) {
        for (const p of pages) statuses.set(p.finalUrl, { status: p.status });
        for (const p of pages) for (const l of [...p.internalLinks, ...p.externalLinks]) {
          const list = linkSources.get(l.href) ?? [];
          if (!list.includes(p.finalUrl) && list.length < 5) list.push(p.finalUrl);
          linkSources.set(l.href, list);
        }
      }
      links = await checkLinks(
        {
          pages, statuses, linkSources, siteDomain, robotsFor,
          maxInternal: limits.maxInternalLinks, maxExternal: limits.maxExternalLinks,
          concurrency: limits.linkConcurrency, signal,
        },
        fetcher,
      );
      progress('links', 'done', `${links.checked} checked, ${links.broken.length} broken, ${links.unverified.length} unverified`);
    } else {
      progress('links', 'skipped', 'No pages available');
      incomplete.push({ name: 'Link checking', reason: 'Skipped because no HTML pages could be analysed.' });
    }
  }
  checkAbort();

  // 7. Lighthouse result ---------------------------------------------------------------------
  let lighthouse: LighthouseSummary | null = null;
  let lhFindings: FindingDraft[] = [];
  let lighthouseUnavailableReason = deps.skipLighthouse ? 'Lighthouse is not run for competitor comparisons (public-page observations only).' : 'Lighthouse categories were not selected for this audit.';
  if (psiPromise) {
    const outcome = await psiPromise;
    if (outcome.ok) {
      lighthouse = outcome.parsed.summary;
      lhFindings = outcome.parsed.findings;
      progress('lighthouse', 'done', `Lighthouse ${lighthouse.lighthouseVersion}`);
    } else {
      lighthouseUnavailableReason = outcome.error;
      incomplete.push({ name: 'Lighthouse (PageSpeed Insights)', reason: outcome.error });
      progress('lighthouse', 'failed', outcome.error);
    }
  }
  checkAbort();

  if (!startPage && !lighthouse) {
    const reason = http.error
      ? `The website could not be reached: ${http.error}`
      : http.status !== null
        ? `The start page returned HTTP ${http.status}${!isHtmlContentType(startContentType) ? ` (${startContentType})` : ''} and Lighthouse data is unavailable.`
        : 'The website could not be analysed.';
    throw new AuditError('SITE_UNREACHABLE', reason);
  }

  // 8. Analyse ------------------------------------------------------------------------------
  progress('analyze', 'running');
  const custom: FindingDraft[] = [];
  const checks: CheckResult[] = [];

  if (http.status !== null && http.status >= 400) {
    const blocked = [401, 403, 429, 503].includes(http.status);
    custom.push({
      id: blocked ? 'crawl.start-refused' : 'seo.start-page-error',
      title: blocked ? `The site refused this tool’s request (HTTP ${http.status})` : `Start page returns HTTP ${http.status}`,
      category: blocked ? 'crawl' : 'seo',
      severity: blocked ? 'info' : 'critical',
      confidence: blocked ? 'medium' : 'high',
      source: 'custom',
      evidence: [`GET ${http.finalUrl ?? http.inputUrl} → HTTP ${http.status}`],
      affected: [http.finalUrl ?? http.inputUrl],
      explanation: blocked
        ? 'The server may block automated tools or require authentication. Visitors may still see the page; HTML-based checks could not run.'
        : 'Visitors and search engines receive an error instead of the page.',
      recommendation: blocked ? 'If you own the site, allow this tool’s user agent temporarily or test from a different network.' : 'Fix the server or routing error so the page returns HTTP 200.',
      service: 'BUILD',
      effort: 'medium',
    });
    if (blocked) incomplete.push({ name: 'HTML-based checks', reason: `The site returned HTTP ${http.status} to this tool.` });
  } else if (http.error) {
    custom.push({
      id: 'crawl.start-unreachable',
      title: 'This tool could not fetch the start page',
      category: 'crawl',
      severity: 'info',
      confidence: 'medium',
      source: 'custom',
      evidence: [http.error],
      affected: [http.inputUrl],
      explanation: 'Lighthouse could load the page, but this tool’s direct request failed - the server may block automated clients or be intermittently unavailable.',
      recommendation: 'Re-run the audit later; if it persists, check firewall or bot-protection rules.',
      service: 'BUILD',
      effort: 'medium',
    });
    incomplete.push({ name: 'HTML-based checks', reason: http.error });
  }

  if (cats.has('seo')) {
    const seo = analyzeSeo({ pages, http, robots: robots?.info ?? null, sitemap: sitemap?.info ?? null, links });
    custom.push(...seo.findings);
    checks.push(...seo.checks);
  }
  const siteHealth = analyzePerformanceAndPractices({ pages, http, crawl, lighthouse });
  if (cats.has('performance')) {
    custom.push(...siteHealth.findings);
    checks.push(...siteHealth.checks);
  } else {
    custom.push(...siteHealth.findings.filter((f) => f.category === 'best-practices'));
    checks.push(...siteHealth.checks.filter((c) => c.score === 'bestPractices'));
  }
  if (cats.has('accessibility')) {
    custom.push(...analyzeAccessibility(pages));
    checks.push(...accessibilityChecks(pages), ...mobileChecks(startPage, lighthouse));
  }
  const journey = cats.has('journey') && pages.length ? summariseJourney(pages, sitemap?.pageUrls ?? []) : null;
  if (cats.has('journey')) {
    if (journey) {
      const j = analyzeJourney(journey, pages);
      custom.push(...j.findings);
      checks.push(...j.checks);
    } else {
      incomplete.push({ name: 'Structure and user journey', reason: 'No HTML pages could be analysed.' });
    }
  }
  let technology: TechnologySummary | null = null;
  if (cats.has('technology')) {
    if (pages.length) {
      technology = {
        detections: mergeDetections(pages.map((p) => p.technologies)),
        structuredDataTypes: [...new Set(pages.flatMap((p) => [...p.jsonLd.flatMap((j) => j.types), ...p.microdataTypes]))].slice(0, 30),
        likelyClientRendered: Boolean(startPage?.likelyClientRendered),
      };
    } else {
      incomplete.push({ name: 'Technology detection', reason: 'No HTML pages could be analysed.' });
    }
  }
  if (crawl && !links) {
    const errorPages = crawl.failedUrls.filter((f) => /^HTTP \d+/.test(f.reason));
    if (errorPages.length) {
      custom.push({
        id: 'crawl.error-pages',
        title: `${plural(errorPages.length, 'linked page')} returned an HTTP error`,
        category: 'crawl',
        severity: errorPages.some((e) => /HTTP (404|410|5\d\d)/.test(e.reason)) ? 'medium' : 'low',
        confidence: 'high',
        source: 'custom',
        evidence: errorPages.slice(0, 8).map((e) => `${e.url} - ${e.reason}`),
        affected: errorPages.slice(0, 15).map((e) => e.url),
        explanation: 'These pages are linked from the site but returned errors when the crawler visited them.',
        recommendation: 'Fix or remove the links, or redirect the URLs to working pages.',
        service: 'GROW',
        effort: 'low',
      });
    }
  }
  if (startPage?.likelyClientRendered) {
    custom.push({
      id: 'crawl.client-rendered',
      title: 'Page content appears to be rendered by JavaScript',
      category: 'crawl',
      severity: 'info',
      confidence: 'medium',
      source: 'custom',
      evidence: [`The server HTML contains only ${startPage.bodyTextLength} characters of text and ${startPage.scriptCount} scripts.`],
      affected: [startPage.finalUrl],
      explanation: 'This tool analyses server-delivered HTML, so many content checks may under-report. Search engines can render JavaScript but it can delay indexing.',
      recommendation: 'Consider server-side rendering or pre-rendering for key content.',
      service: 'BUILD',
      effort: 'high',
    });
  }

  // Keep only custom findings belonging to the selected categories.
  const selectedCustom = custom.filter((f) => FINDING_TO_CATEGORY[f.category].some((c) => cats.has(c)) || f.id.startsWith('seo.start-page') || f.id.startsWith('crawl.start'));
  const findings = prioritise(mergeEquivalentFindings(selectedCustom, lhFindings));
  const scores = computeScores({
    checks,
    lighthouse,
    lighthouseUnavailableReason,
    ran: { performance: cats.has('performance'), seo: cats.has('seo'), accessibility: cats.has('accessibility'), journey: cats.has('journey') },
  });

  for (const c of checks) {
    if (c.status === 'skipped' && !/not applicable/i.test(c.detail)) incomplete.push({ name: `Check: ${c.label}`, reason: c.detail });
  }
  if (req.checkLinks && !needsSiteFiles) incomplete.push({ name: 'Link checking', reason: 'Requires the Technical SEO or Crawl category.' });

  const limitations = [
    `Only ${plural(pages.length, 'page')} of the site ${pages.length === 1 ? 'was' : 'were'} inspected; findings do not cover the whole website.`,
    'HTML checks analyse the HTML delivered by the server. Content added later by JavaScript is not seen by these checks (Lighthouse does render JavaScript).',
    'Automated accessibility checks find only a subset of issues and cannot establish WCAG conformance or legal compliance; manual testing with keyboard and assistive technology is required.',
    'Custom scores (Technical SEO, Mobile & UX, Conversion Readiness, Overall Health) are internal heuristics - not Google scores - and do not predict rankings, traffic, conversion rates or revenue.',
    'Technology detection relies on public signatures and may miss or misidentify technologies. Private systems (CRM, ad accounts, hosting plans, internal infrastructure) cannot be seen from a URL.',
    'Websites can block, rate-limit or vary responses to automated requests, so some checks may be incomplete or differ from what visitors see.',
    'Business opportunities are suggestions based on observed signals; they need confirmation from the business owner before any decision.',
    'Conversion and trust checks detect the presence of common elements (contact routes, calls to action, forms, testimonials, privacy links) from text and markup; they do not measure conversion rates, lead volumes or whether testimonials are genuine.',
    'Questionnaire answers, when provided, are supplied by the business owner and are not verified by this audit.',
  ];
  if (lighthouse) {
    limitations.unshift(`Lighthouse data comes from a single simulated ${lighthouse.strategy} lab run on Google's infrastructure; scores and metrics vary between runs.${lighthouse.field ? '' : ' No real-user field data was available.'}`);
  }

  progress('analyze', 'done', `${findings.length} findings`);
  const completed = new Date();
  const core: ReportCore = {
    id,
    tool: TOOL,
    inputUrl: req.url,
    finalUrl: http.finalUrl ?? lighthouse?.finalUrl ?? null,
    strategy: req.strategy,
    categories: req.categories,
    startedAt: started.toISOString(),
    completedAt: completed.toISOString(),
    durationMs: completed.getTime() - started.getTime(),
    pagesInspected: pages.length,
    scores,
    checks,
    lighthouse,
    http,
    robots: robots?.info ?? null,
    sitemap: sitemap?.info ?? null,
    crawl,
    links,
    journey,
    technology,
    findings,
    topFindingIds: topFindings(findings).map((f) => f.id),
    opportunities: [],
    incompleteChecks: incomplete,
    limitations,
  };
  return { ...core, ...buildInsights(core, req.discovery ?? null) };
}
