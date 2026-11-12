import type { CheckResult, CrawlSummary, HttpInfo, LighthouseSummary } from '@chazon/shared';
import type { FindingDraft } from '../findings/priority';
import { CheckList } from '../scoring/checks';
import { capList, plural } from '../util/text';
import type { PageData } from './page';

export interface SiteHealthInput {
  pages: PageData[];
  http: HttpInfo;
  crawl: CrawlSummary | null;
  lighthouse: LighthouseSummary | null;
}

/**
 * Inspects fetched HTML documents and HTTP response headers to score
 * Performance and Best Practices directly, so audits remain genuinely
 * informative even when Google PageSpeed Insights is unavailable.
 */
export function analyzePerformanceAndPractices(input: SiteHealthInput): {
  findings: FindingDraft[];
  checks: CheckResult[];
} {
  const { pages, http, crawl, lighthouse } = input;
  const findings: FindingDraft[] = [];
  const perf = new CheckList('performance');
  const bp = new CheckList('bestPractices');
  const start = pages[0] ?? null;

  if (!start) {
    perf.skip('perf-ttfb', 'Server response time (HTML fetch)', 3, 'Start page HTML was not retrieved.');
    perf.skip('perf-html-size', 'Document HTML payload size', 2, 'Start page HTML was not retrieved.');
    perf.skip('perf-compression', 'HTTP response compression', 2, 'Start page HTML was not retrieved.');
    perf.skip('perf-blocking-scripts', 'Render-blocking scripts in <head>', 2, 'Start page HTML was not retrieved.');
    perf.skip('perf-asset-count', 'External script and stylesheet count', 2, 'Start page HTML was not retrieved.');
    perf.skip('perf-cache-headers', 'HTTP caching headers', 1, 'Start page HTML was not retrieved.');
    perf.skip('perf-image-dimensions', 'Images declare width & height', 2, 'Start page HTML was not retrieved.');

    bp.bool('bp-https', 'Site served over HTTPS', 3, Boolean(http.httpsUsed), http.httpCheckDetail || 'HTTPS status check.');
    bp.skip('bp-no-mixed-content', 'No insecure HTTP sub-resources on HTTPS pages', 2, 'Start page HTML was not retrieved.');
    bp.skip('bp-hsts', 'Strict-Transport-Security (HSTS) header', 1, 'Start page HTML was not retrieved.');
    bp.skip('bp-security-headers', 'Browser security headers (nosniff / framing / CSP)', 2, 'Start page HTML was not retrieved.');
    bp.skip('bp-referrer-policy', 'Referrer-Policy header configured', 1, 'Start page HTML was not retrieved.');
    bp.skip('bp-doctype-charset', 'Valid <!DOCTYPE html> and charset declaration', 2, 'Start page HTML was not retrieved.');
    bp.skip('bp-safe-blank-links', 'External target="_blank" links include rel="noopener"', 2, 'Start page HTML was not retrieved.');
    bp.skip('bp-no-server-errors', 'No 5xx server errors on crawled pages', 2, 'No crawled HTML pages available.');

    return { findings, checks: [...perf.items, ...bp.items] };
  }

  // --- Performance checks ---

  const responseMs = start.responseTimeMs > 0 ? start.responseTimeMs : (http.responseTimeMs ?? 0);
  const responseDetail = `${Math.round(responseMs)} ms initial HTML fetch (good <= 600 ms, acceptable <= 1500 ms)`;
  if (responseMs <= 600) {
    perf.pass('perf-ttfb', 'Server response time (HTML fetch)', 3, responseDetail);
  } else if (responseMs <= 1500) {
    perf.warn('perf-ttfb', 'Server response time (HTML fetch)', 3, responseDetail, 0.55);
  } else {
    perf.fail('perf-ttfb', 'Server response time (HTML fetch)', 3, responseDetail);
    findings.push({
      id: 'perf.slow-response',
      source: 'custom',
      category: 'performance',
      severity: responseMs >= 2500 ? 'high' : 'medium',
      confidence: 'high',
      service: 'BUILD',
      effort: 'medium',
      title: 'Initial HTML document response is slow',
      plainSummary: `The server took ${Math.round(responseMs)} ms to return the homepage HTML, delaying everything else on the page from loading.`,
      observed: `${Math.round(responseMs)} ms HTML response time on ${start.finalUrl}`,
      expected: 'Initial HTML response under 600 ms (ideally under 300 ms via edge caching or server optimization).',
      evidence: [`Observed response time: ${Math.round(responseMs)} ms on ${start.finalUrl}`],
      affected: [start.finalUrl],
      explanation: 'Before the browser can download stylesheets, scripts, or images, it waits for the initial HTML response from your origin server.',
      recommendation: 'Enable full-page CDN caching for public pages, optimize slow backend database queries, and enable HTTP/2 or HTTP/3 with keep-alive.',
      effortRationale: 'Caching configuration is typically quick, while backend query or origin upgrades require moderate engineering work.',
      verification: 'Re-run this audit or check TTFB in Chrome DevTools Network panel; target < 600 ms.',
      status: 'confirmed',
    });
  }

  const htmlKb = Math.round(start.bytes / 1024);
  if (!start.truncated && htmlKb <= 150) {
    perf.pass('perf-html-size', 'Document HTML payload size', 2, `${htmlKb} KB uncompressed HTML (recommended <= 150 KB).`);
  } else if (!start.truncated && htmlKb <= 400) {
    perf.warn('perf-html-size', 'Document HTML payload size', 2, `${htmlKb} KB uncompressed HTML (heavy; aim for <= 150 KB).`, 0.5);
  } else {
    perf.fail('perf-html-size', 'Document HTML payload size', 2, start.truncated ? `HTML exceeded safety cap (${htmlKb} KB+).` : `${htmlKb} KB uncompressed HTML (excessive; aim for <= 150 KB).`);
    findings.push({
      id: 'perf.large-html',
      source: 'custom',
      category: 'performance',
      severity: 'medium',
      confidence: 'high',
      service: 'BUILD',
      effort: 'medium',
      title: 'Homepage HTML payload is heavy',
      plainSummary: `The initial HTML document is ${htmlKb} KB${start.truncated ? '+' : ''}, which slows down parsing and mobile rendering.`,
      observed: `${htmlKb} KB HTML document on ${start.finalUrl}`,
      expected: 'Initial HTML document under 150 KB.',
      evidence: [`HTML document size: ${htmlKb} KB`],
      affected: [start.finalUrl],
      explanation: 'Large HTML documents often embed oversized inline SVG sprites, serialized state payloads, or unminified templates that delay First Contentful Paint.',
      recommendation: 'Move large inline scripts/styles or repeated SVG assets into external cacheable bundles and trim serialized DOM data.',
      effortRationale: 'Separating inline blobs or oversized payloads into cacheable assets takes moderate frontend refactoring.',
      verification: 'Inspect the initial document size in DevTools Network (uncompressed < 150 KB).',
      status: 'confirmed',
    });
  }

  const contentEncoding = start.headers['content-encoding'] ?? '';
  const hasCompression = /\b(br|gzip|deflate|zstd)\b/i.test(contentEncoding);
  if (start.bytes < 1400) {
    perf.pass('perf-compression', 'HTTP response compression', 2, `HTML payload is ${start.bytes} bytes (too small to benefit from compression).`);
  } else if (hasCompression) {
    perf.pass('perf-compression', 'HTTP response compression', 2, `Compressed via ${contentEncoding}.`);
  } else {
    perf.warn('perf-compression', 'HTTP response compression', 2, 'No Content-Encoding compression header (br/gzip) detected on HTML response.', 0.35);
    if (start.bytes >= 15_000) {
      findings.push({
        id: 'perf.no-compression',
        source: 'custom',
        category: 'performance',
        severity: start.bytes >= 40_000 ? 'medium' : 'low',
        confidence: 'medium',
        service: 'BUILD',
        effort: 'low',
        title: 'Text compression (Gzip / Brotli) not detected on HTML response',
        plainSummary: 'The homepage HTML was delivered without a Content-Encoding header for Brotli or Gzip compression.',
        observed: `No Content-Encoding header on ${htmlKb} KB HTML response`,
        expected: 'Content-Encoding: br or gzip on HTML, CSS, JS, and SVG responses.',
        evidence: [`HTML size: ${htmlKb} KB`, 'Response header content-encoding was absent'],
        affected: [start.finalUrl],
        explanation: 'Enabling Brotli or Gzip typically cuts text transfer size by 60-80%, noticeably accelerating mobile page loads.',
        recommendation: 'Enable Brotli (`br`) and Gzip fallback in your CDN (Cloudflare/Vercel/Nginx) for all text MIME types.',
        effortRationale: 'Usually a single CDN or web-server toggle.',
        verification: 'Check the response headers for `content-encoding: br` or `gzip`.',
        status: 'likely',
      });
    }
  }

  const blocking = start.techHealth.headBlockingScripts;
  if (blocking === 0) {
    perf.pass('perf-blocking-scripts', 'Render-blocking scripts in <head>', 2, 'No synchronous blocking <script> tags found in <head>.');
  } else if (blocking <= 2) {
    perf.warn('perf-blocking-scripts', 'Render-blocking scripts in <head>', 2, `${plural(blocking, 'synchronous script')} in <head> can block initial rendering.`, 0.5);
  } else {
    perf.fail('perf-blocking-scripts', 'Render-blocking scripts in <head>', 2, `${blocking} synchronous blocking <script> tags in <head>.`);
  }
  if (blocking > 0) {
    findings.push({
      id: 'perf.render-blocking-scripts',
      source: 'custom',
      category: 'performance',
      severity: blocking >= 4 ? 'high' : blocking >= 2 ? 'medium' : 'low',
      confidence: 'high',
      service: 'BUILD',
      effort: 'low',
      title: 'Render-blocking scripts in document <head>',
      plainSummary: `${plural(blocking, 'external script')} in the page <head> load without defer, async, or type="module", pausing page rendering.`,
      observed: `${blocking} synchronous <script src> tag(s) inside <head>`,
      expected: 'Use `defer`, `type="module"`, or `async` so scripts do not block first paint.',
      evidence: [`Start page ${start.finalUrl} has ${blocking} synchronous <script> tags in <head>`],
      affected: [start.finalUrl],
      explanation: 'When the HTML parser encounters a classic external <script> without async or defer in <head>, it stops building the visual page until that script downloads and runs.',
      recommendation: 'Add `defer` (or `type="module"`) to non-critical scripts in <head>, or move analytics/widgets to load asynchronously.',
      effortRationale: 'Adding `defer` or `async` attributes takes minutes in templates or layout headers.',
      verification: 'Inspect `<head>` in page source and confirm scripts carry `defer`, `async`, or `type="module"`.',
      status: 'confirmed',
    });
  }

  const totalAssets = start.techHealth.externalScriptCount + start.techHealth.stylesheetCount;
  const assetDetail = `${start.techHealth.externalScriptCount} external scripts and ${start.techHealth.stylesheetCount} stylesheet links`;
  if (totalAssets <= 12) {
    perf.pass('perf-asset-count', 'External script and stylesheet count', 2, assetDetail);
  } else if (totalAssets <= 24) {
    perf.warn('perf-asset-count', 'External script and stylesheet count', 2, `${assetDetail} (${totalAssets} total; consider bundling).`, 0.5);
  } else {
    perf.fail('perf-asset-count', 'External script and stylesheet count', 2, `${assetDetail} (${totalAssets} total requests in HTML).`);
    findings.push({
      id: 'perf.excessive-assets',
      source: 'custom',
      category: 'performance',
      severity: 'medium',
      confidence: 'high',
      service: 'BUILD',
      effort: 'medium',
      title: 'High number of external script and stylesheet requests',
      plainSummary: `The homepage references ${totalAssets} external JavaScript and CSS files, increasing network overhead on slower connections.`,
      observed: assetDetail,
      expected: 'Keep initial critical script and stylesheet requests compact (<= 12 files where practical).',
      evidence: [assetDetail],
      affected: [start.finalUrl],
      explanation: 'Every unbundled CSS/JS file adds connection/TLS/scheduling overhead and increases third-party execution risk.',
      recommendation: 'Bundle small page scripts/styles, remove unused third-party widgets, and lazy-load non-essential embeds.',
      effortRationale: 'Requires auditing installed plugins/scripts and bundling build outputs.',
      verification: 'Check the DevTools Network waterfall or HTML source count after cleanup.',
      status: 'confirmed',
    });
  }

  const cacheControl = start.headers['cache-control'] ?? '';
  const etag = start.headers['etag'] ?? '';
  const lastMod = start.headers['last-modified'] ?? '';
  if (cacheControl || etag || lastMod) {
    perf.pass('perf-cache-headers', 'HTTP caching headers', 1, cacheControl ? `cache-control: ${cacheControl}` : etag ? 'ETag header present' : 'Last-Modified header present');
  } else {
    perf.warn('perf-cache-headers', 'HTTP caching headers', 1, 'No Cache-Control, ETag, or Last-Modified header detected on start document.', 0.4);
  }

  if (start.images.total === 0) {
    perf.skip('perf-image-dimensions', 'Images declare width & height', 2, 'No <img> elements found on the start page.');
  } else {
    const withDims = Math.max(0, start.images.total - start.techHealth.imagesMissingDimensions);
    const ratio = withDims / start.images.total;
    const dimDetail = `${withDims} of ${start.images.total} start-page <img> tags include explicit width and height attributes`;
    if (ratio >= 0.9) perf.pass('perf-image-dimensions', 'Images declare width & height', 2, dimDetail);
    else if (ratio >= 0.5) perf.warn('perf-image-dimensions', 'Images declare width & height', 2, dimDetail, ratio);
    else perf.fail('perf-image-dimensions', 'Images declare width & height', 2, dimDetail);
    if (start.techHealth.imagesMissingDimensions >= 2) {
      findings.push({
        id: 'perf.images-missing-dimensions',
        source: 'custom',
        category: 'performance',
        severity: start.techHealth.imagesMissingDimensions >= 5 ? 'medium' : 'low',
        confidence: 'high',
        service: 'BUILD',
        effort: 'low',
        title: 'Images are missing explicit width and height attributes',
        plainSummary: `${start.techHealth.imagesMissingDimensions} of ${start.images.total} images on the homepage lack width and height attributes, which can trigger layout shifts as the page loads.`,
        observed: `${start.techHealth.imagesMissingDimensions} <img> element(s) missing width/height`,
        expected: 'All `<img>` tags specify `width` and `height` (or CSS aspect-ratio) so the browser reserves space before decoding.',
        evidence: [`Start page has ${start.images.total} <img> elements, ${start.techHealth.imagesMissingDimensions} missing dimensions`],
        affected: [start.finalUrl],
        explanation: 'Without intrinsic dimensions in HTML, surrounding text and buttons jump downward when images finish downloading (hurting Cumulative Layout Shift).',
        recommendation: 'Add `width` and `height` attributes matching the image aspect ratio on all `<img>` tags.',
        effortRationale: 'Straightforward markup or component template update.',
        verification: 'Inspect `<img>` elements in HTML or check CLS in a Lighthouse run.',
        status: 'confirmed',
      });
    }
  }

  // Factor in slow inner pages during crawl when Lighthouse did not run
  const slowPages = crawl?.pages.filter((p) => p.responseTimeMs > 2000 && p.finalUrl !== start.finalUrl) ?? [];
  if (slowPages.length > 0 && !lighthouse) {
    perf.warn('perf-crawl-speed', 'Crawled inner pages respond quickly', 1, `${plural(slowPages.length, 'inner page')} took > 2000 ms to respond.`, 0.4);
  }

  // --- Best Practices checks ---

  const httpsOk = Boolean(http.httpsUsed && start.finalUrl.startsWith('https://'));
  bp.bool('bp-https', 'Site served over HTTPS', 3, httpsOk, httpsOk ? `Resolved cleanly over HTTPS (${start.finalUrl}).` : http.httpCheckDetail || 'Site did not serve over HTTPS.');

  const mixedPages = pages.filter((p) => p.insecureResources.length > 0);
  if (!http.httpsUsed) {
    bp.skip('bp-no-mixed-content', 'No insecure HTTP sub-resources on HTTPS pages', 2, 'Not applicable while the main page is not served over HTTPS.');
  } else if (mixedPages.length === 0) {
    bp.pass('bp-no-mixed-content', 'No insecure HTTP sub-resources on HTTPS pages', 2, `Checked ${plural(pages.length, 'page')}; no http:// sub-resources found.`);
  } else {
    bp.fail('bp-no-mixed-content', 'No insecure HTTP sub-resources on HTTPS pages', 2, `${plural(mixedPages.length, 'page')} load insecure http:// assets on an https:// page.`);
  }

  if (!http.httpsUsed) {
    bp.skip('bp-hsts', 'Strict-Transport-Security (HSTS) header', 1, 'Requires HTTPS.');
  } else if (start.headers['strict-transport-security']) {
    bp.pass('bp-hsts', 'Strict-Transport-Security (HSTS) header', 1, start.headers['strict-transport-security']);
  } else {
    bp.warn('bp-hsts', 'Strict-Transport-Security (HSTS) header', 1, 'Strict-Transport-Security header not present on start response.', 0.4);
  }

  const nosniff = (start.headers['x-content-type-options'] ?? '').toLowerCase().includes('nosniff');
  const csp = start.headers['content-security-policy'] ?? '';
  const xfo = start.headers['x-frame-options'] ?? '';
  const hasFrameGuard = Boolean(xfo) || /frame-ancestors/i.test(csp);
  const missingSecHeaders = [
    !nosniff && 'X-Content-Type-Options: nosniff',
    !hasFrameGuard && 'X-Frame-Options / CSP frame-ancestors',
    !csp && 'Content-Security-Policy',
  ].filter(Boolean) as string[];

  if (nosniff && hasFrameGuard && csp) {
    bp.pass('bp-security-headers', 'Browser security headers (nosniff / framing / CSP)', 2, 'X-Content-Type-Options, clickjacking protection, and CSP headers are set.');
  } else if (nosniff || hasFrameGuard || csp) {
    bp.warn('bp-security-headers', 'Browser security headers (nosniff / framing / CSP)', 2, `Missing recommended header(s): ${missingSecHeaders.join(', ')}.`, 0.55);
  } else {
    bp.fail('bp-security-headers', 'Browser security headers (nosniff / framing / CSP)', 2, 'None of X-Content-Type-Options, X-Frame-Options, or Content-Security-Policy were set.');
  }

  if (!nosniff || !hasFrameGuard) {
    findings.push({
      id: 'bp.missing-security-headers',
      source: 'custom',
      category: 'best-practices',
      severity: !nosniff && !hasFrameGuard ? 'medium' : 'low',
      confidence: 'high',
      service: 'BUILD',
      effort: 'low',
      title: 'Recommended browser security headers are missing',
      plainSummary: `The server response is missing ${missingSecHeaders.join(' and ')}, leaving browsers with weaker protection against MIME sniffing and clickjacking.`,
      observed: `Missing: ${missingSecHeaders.join(', ')}`,
      expected: 'Serve `X-Content-Type-Options: nosniff` and either `X-Frame-Options: SAMEORIGIN` or CSP `frame-ancestors`.',
      evidence: [`Checked HTTP response headers on ${start.finalUrl}`, ...missingSecHeaders.map((h) => `Missing ${h}`)],
      affected: [start.finalUrl],
      explanation: 'Standard response security headers tell modern browsers not to execute mislabelled file types and prevent your pages from being embedded inside malicious iframes.',
      recommendation: 'Configure `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN` (or `Content-Security-Policy: frame-ancestors \'self\'`), and `Referrer-Policy: strict-origin-when-cross-origin` at the web server or CDN layer.',
      effortRationale: 'Can be applied globally in Vercel/Cloudflare/Nginx headers config in a few lines.',
      verification: 'Inspect response headers with `curl -I` or browser DevTools Network tab.',
      status: 'confirmed',
    });
  }

  const referrerPolicy = start.headers['referrer-policy'] ?? '';
  if (referrerPolicy) {
    bp.pass('bp-referrer-policy', 'Referrer-Policy header configured', 1, `referrer-policy: ${referrerPolicy}`);
  } else {
    bp.warn('bp-referrer-policy', 'Referrer-Policy header configured', 1, 'No Referrer-Policy response header detected.', 0.4);
  }

  const doctypeAndCharsetOk = start.techHealth.hasDoctype && start.techHealth.hasCharset;
  bp.bool(
    'bp-doctype-charset',
    'Valid <!DOCTYPE html> and charset declaration',
    2,
    doctypeAndCharsetOk,
    doctypeAndCharsetOk
      ? '<!DOCTYPE html> and UTF-8 / charset declaration verified.'
      : `Missing ${[!start.techHealth.hasDoctype && '<!DOCTYPE html>', !start.techHealth.hasCharset && '<meta charset>'].filter(Boolean).join(' and ')}.`,
  );
  if (!doctypeAndCharsetOk) {
    findings.push({
      id: 'bp.missing-doctype-charset',
      source: 'custom',
      category: 'best-practices',
      severity: 'medium',
      confidence: 'high',
      service: 'BUILD',
      effort: 'low',
      title: 'Missing HTML5 DOCTYPE or character encoding declaration',
      plainSummary: 'The start page is missing an explicit `<!DOCTYPE html>` declaration or `<meta charset="utf-8">` tag, risking inconsistent browser layout modes.',
      observed: [!start.techHealth.hasDoctype && 'No <!DOCTYPE html>', !start.techHealth.hasCharset && 'No <meta charset> / charset header'].filter(Boolean).join('; '),
      expected: 'Begin every HTML document with `<!DOCTYPE html>` and `<meta charset="utf-8">`.',
      evidence: [`Inspected document header on ${start.finalUrl}`],
      affected: [start.finalUrl],
      explanation: 'Without `<!DOCTYPE html>`, browsers can fall back to quirks mode with legacy CSS sizing rules.',
      recommendation: 'Add `<!DOCTYPE html>` as the very first line of the HTML template and `<meta charset="utf-8">` inside `<head>`.',
      effortRationale: 'One-line layout template update.',
      verification: 'View page source and verify `<!DOCTYPE html>` and `<meta charset="utf-8">` appear at the top.',
      status: 'confirmed',
    });
  }

  const unsafeBlankTotal = pages.reduce((s, p) => s + p.techHealth.unsafeBlankLinks, 0);
  if (unsafeBlankTotal === 0) {
    bp.pass('bp-safe-blank-links', 'External target="_blank" links include rel="noopener"', 2, `Checked ${plural(pages.length, 'page')}; external new-tab links include safe rel attributes.`);
  } else {
    bp.warn(
      'bp-safe-blank-links',
      'External target="_blank" links include rel="noopener"',
      2,
      `${plural(unsafeBlankTotal, 'external target="_blank" link')} missing rel="noopener" or rel="noreferrer".`,
      unsafeBlankTotal > 5 ? 0.35 : 0.6,
    );
    const affectedBlank = capList(
      pages.filter((p) => p.techHealth.unsafeBlankLinks > 0).map((p) => p.finalUrl),
      15,
    );
    findings.push({
      id: 'bp.unsafe-blank-links',
      source: 'custom',
      category: 'best-practices',
      severity: 'low',
      confidence: 'high',
      service: 'BUILD',
      effort: 'low',
      title: 'External target="_blank" links missing rel="noopener"',
      plainSummary: `Found ${plural(unsafeBlankTotal, 'external link')} opening in a new tab without explicit \`rel="noopener noreferrer"\`.`,
      observed: `${unsafeBlankTotal} external target="_blank" link(s) without rel="noopener"`,
      expected: 'Include `rel="noopener noreferrer"` on external `target="_blank"` anchors.',
      evidence: [`Counted ${unsafeBlankTotal} external target="_blank" links without noopener across ${affectedBlank.items.length} page(s)`],
      affected: affectedBlank.items,
      ...(affectedBlank.total > affectedBlank.items.length ? { affectedTotal: affectedBlank.total } : {}),
      explanation: 'Explicitly setting `rel="noopener noreferrer"` protects against legacy reverse-tabnabbing behavior and avoids sharing cross-origin process context.',
      recommendation: 'Add `rel="noopener noreferrer"` to external links that specify `target="_blank"`.',
      effortRationale: 'Quick template or CMS link component fix.',
      verification: 'Search rendered HTML for `target="_blank"` and confirm `rel` includes `noopener`.',
      status: 'confirmed',
    });
  }

  const serverErrors = pages.filter((p) => p.status >= 500);
  bp.bool(
    'bp-no-server-errors',
    'No 5xx server errors on crawled pages',
    2,
    serverErrors.length === 0,
    serverErrors.length === 0
      ? `All ${plural(pages.length, 'crawled page')} returned non-5xx responses.`
      : `${plural(serverErrors.length, 'crawled page')} returned 5xx server errors.`,
  );

  return { findings, checks: [...perf.items, ...bp.items] };
}
