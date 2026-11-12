import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { CrawlSummary, HttpInfo, LighthouseSummary } from '@chazon/shared';
import { analyzePage } from '../src/lib/audit-engine/core/analyze/page';
import {
  accessibilityChecks,
  analyzeAccessibility,
  mobileChecks,
} from '../src/lib/audit-engine/core/analyze/accessibility';
import { analyzePerformanceAndPractices } from '../src/lib/audit-engine/core/analyze/siteHealth';
import { analyzeSeo } from '../src/lib/audit-engine/core/analyze/seo';
import { computeScores } from '../src/lib/audit-engine/core/scoring/scores';

function makeCrawl(visited = 1, responseTimeMs = 240): CrawlSummary {
  return {
    limit: 10,
    discovered: visited,
    visited,
    skipped: 0,
    failed: 0,
    pages: [
      {
        url: 'https://example.test/',
        finalUrl: 'https://example.test/',
        status: 200,
        title: 'Example Growth Studio',
        description: 'We help local businesses build high-converting websites and grow organically.',
        h1Count: 1,
        responseTimeMs,
        bytes: 4200,
        truncated: false,
        source: 'start',
      },
    ],
    skippedUrls: [],
    skippedByReason: {},
    failedUrls: [],
    crawlDelayMs: 300,
  };
}

function makeHttp(httpsUsed = true, responseTimeMs = 240): HttpInfo {
  return {
    inputUrl: 'https://example.test',
    finalUrl: 'https://example.test/',
    status: 200,
    redirects: [],
    httpsUsed,
    httpRedirectsToHttps: true,
    httpCheckDetail: 'Redirects to HTTPS.',
    responseTimeMs,
  };
}

describe('Custom HTML & HTTP scoring when Google PageSpeed Insights is unavailable', () => {
  it('computes real high custom scores for a well-optimised page with lighthouse=null', () => {
    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Chazon Test Studio — Fast Web Engineering</title>
  <meta name="description" content="Trusted web engineering and digital growth partner helping teams convert visitors into loyal customers." />
  <script defer src="/assets/app.js"></script>
</head>
<body>
  <header><nav><a href="/contact">Contact Us</a><a href="tel:+919198195875">Call</a></nav></header>
  <main>
    <h1>Fast Websites That Convert</h1>
    <p>Clear positioning and fast mobile execution for modern businesses.</p>
    <picture>
      <img src="/hero.webp" srcset="/hero.webp 1x" width="800" height="600" alt="Team workshop hero" />
    </picture>
    <a href="https://partner.example" target="_blank" rel="noopener noreferrer">Partner</a>
  </main>
</body>
</html>`;

    const page = analyzePage({
      html,
      url: 'https://example.test/',
      finalUrl: 'https://example.test/',
      status: 200,
      contentType: 'text/html; charset=utf-8',
      bytes: Buffer.byteLength(html),
      truncated: false,
      responseTimeMs: 210,
      redirects: [],
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'content-encoding': 'br',
        'cache-control': 'public, max-age=3600',
        'strict-transport-security': 'max-age=31536000',
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'SAMEORIGIN',
        'content-security-policy': "default-src 'self'",
        'referrer-policy': 'strict-origin-when-cross-origin',
      },
      source: 'start',
      siteDomain: 'example.test',
    });

    const http = makeHttp(true, 210);
    const crawl = makeCrawl(1, 210);
    const siteHealth = analyzePerformanceAndPractices({ pages: [page], http, crawl, lighthouse: null });
    const seo = analyzeSeo({ pages: [page], http, robots: null, sitemap: null, links: null });
    const checks = [
      ...seo.checks,
      ...siteHealth.checks,
      ...accessibilityChecks([page]),
      ...mobileChecks(page, null),
    ];

    const scores = computeScores({
      checks,
      lighthouse: null,
      lighthouseUnavailableReason: 'PAGESPEED_API_KEY not configured',
      ran: { performance: true, seo: true, accessibility: true, journey: false },
    });

    const byKey = Object.fromEntries(scores.map((s) => [s.key, s]));
    assert.equal(byKey.performance.kind, 'custom');
    assert.ok((byKey.performance.value ?? 0) >= 90);
    assert.equal(byKey.accessibility.kind, 'custom');
    assert.ok((byKey.accessibility.value ?? 0) >= 90);
    assert.equal(byKey.bestPractices.kind, 'custom');
    assert.ok((byKey.bestPractices.value ?? 0) >= 95);
    assert.equal(byKey.mobileUx.kind, 'custom');
    assert.ok((byKey.mobileUx.value ?? 0) >= 90);
    assert.ok((byKey.overallHealth.value ?? 0) >= 90);
    assert.equal(siteHealth.findings.length, 0);
  });

  it('produces distinctly lower scores and concrete findings on a slow, unoptimised page', () => {
    const html = `<html>
<head>
  <meta name="viewport" content="width=1024, user-scalable=no" />
  <script src="/a.js"></script>
  <script src="/b.js"></script>
  <script src="/c.js"></script>
  <script src="/d.js"></script>
</head>
<body>
  <div id="hero">
    <h1>Welcome</h1>
    <h4>Skipped H2 and H3</h4>
    <img src="/1.jpg" />
    <img src="/2.jpg" />
    <img src="/3.jpg" />
    <img src="/4.jpg" />
    <img src="/5.jpg" />
    <button tabindex="3"></button>
    <a href="https://external.example" target="_blank">External link</a>
  </div>
</body>
</html>`;

    const page = analyzePage({
      html,
      url: 'https://slow.test/',
      finalUrl: 'https://slow.test/',
      status: 200,
      contentType: 'text/html',
      bytes: 280_000,
      truncated: false,
      responseTimeMs: 2800,
      redirects: [],
      headers: { 'content-type': 'text/html' },
      source: 'start',
      siteDomain: 'slow.test',
    });

    const http = makeHttp(true, 2800);
    const crawl = makeCrawl(1, 2800);
    const siteHealth = analyzePerformanceAndPractices({ pages: [page], http, crawl, lighthouse: null });
    const a11yFindings = analyzeAccessibility([page]);
    const checks = [
      ...siteHealth.checks,
      ...accessibilityChecks([page]),
      ...mobileChecks(page, null),
    ];

    const scores = computeScores({
      checks,
      lighthouse: null,
      lighthouseUnavailableReason: 'PAGESPEED_API_KEY not configured',
      ran: { performance: true, seo: false, accessibility: true, journey: false },
    });

    const byKey = Object.fromEntries(scores.map((s) => [s.key, s]));
    assert.ok((byKey.performance.value ?? 100) < 55, `Expected low perf score, got ${byKey.performance.value}`);
    assert.ok((byKey.accessibility.value ?? 100) < 55, `Expected low a11y score, got ${byKey.accessibility.value}`);
    assert.ok((byKey.bestPractices.value ?? 100) < 70, `Expected lower bestPractices score, got ${byKey.bestPractices.value}`);
    assert.ok((byKey.mobileUx.value ?? 100) < 40, `Expected low mobileUx score, got ${byKey.mobileUx.value}`);

    const findingIds = new Set([...siteHealth.findings, ...a11yFindings].map((f) => f.id));
    assert.ok(findingIds.has('perf.slow-response'));
    assert.ok(findingIds.has('perf.render-blocking-scripts'));
    assert.ok(findingIds.has('perf.images-missing-dimensions'));
    assert.ok(findingIds.has('bp.missing-security-headers'));
    assert.ok(findingIds.has('bp.missing-doctype-charset'));
    assert.ok(findingIds.has('bp.unsafe-blank-links'));
    assert.ok(findingIds.has('a11y.missing-main-landmark'));
  });

  it('returns null scores (never fake 80) when both HTML and Lighthouse failed', () => {
    const http = makeHttp(false, 0);
    const crawl = makeCrawl(0, 0);
    const siteHealth = analyzePerformanceAndPractices({ pages: [], http, crawl, lighthouse: null });
    const checks = [...siteHealth.checks, ...accessibilityChecks([]), ...mobileChecks(null, null)];

    const scores = computeScores({
      checks,
      lighthouse: null,
      lighthouseUnavailableReason: 'Site unreachable',
      ran: { performance: true, seo: true, accessibility: true, journey: true },
    });

    for (const s of scores) {
      if (s.key !== 'bestPractices') {
        assert.equal(s.value, null, `Expected null for ${s.key}, got ${s.value}`);
      }
    }
  });

  it('prefers official Lighthouse scores when PageSpeed Insights succeeds', () => {
    const lh: LighthouseSummary = {
      strategy: 'mobile',
      requestedUrl: 'https://example.test/',
      finalUrl: 'https://example.test/',
      lighthouseVersion: '12.0.0',
      fetchTime: new Date().toISOString(),
      categories: {
        performance: 93,
        accessibility: 87,
        bestPractices: 96,
        seo: 91,
      },
      metrics: [
        { id: 'largest-contentful-paint', label: 'LCP', displayValue: '1.8 s', numericValue: 1800, unit: 'ms', score: 0.96, rating: 'good' },
      ],
      field: null,
      runWarnings: [],
      categoryCounts: {},
      auditOutcomes: {},
    };

    const page = analyzePage({
      html: '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><main><h1>Hi</h1></main></body></html>',
      url: 'https://example.test/',
      finalUrl: 'https://example.test/',
      status: 200,
      contentType: 'text/html; charset=utf-8',
      bytes: 200,
      truncated: false,
      responseTimeMs: 3000,
      redirects: [],
      headers: {},
      source: 'start',
      siteDomain: 'example.test',
    });

    const siteHealth = analyzePerformanceAndPractices({
      pages: [page],
      http: makeHttp(true, 3000),
      crawl: makeCrawl(1, 3000),
      lighthouse: lh,
    });

    const scores = computeScores({
      checks: [...siteHealth.checks, ...accessibilityChecks([page]), ...mobileChecks(page, lh)],
      lighthouse: lh,
      lighthouseUnavailableReason: '',
      ran: { performance: true, seo: false, accessibility: true, journey: false },
    });

    const byKey = Object.fromEntries(scores.map((s) => [s.key, s]));
    assert.equal(byKey.performance.kind, 'lighthouse');
    assert.equal(byKey.performance.value, 93);
    assert.equal(byKey.accessibility.kind, 'lighthouse');
    assert.equal(byKey.accessibility.value, 87);
    assert.equal(byKey.bestPractices.kind, 'lighthouse');
    assert.equal(byKey.bestPractices.value, 96);
  });
});
