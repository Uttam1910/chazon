import type { CheckResult, HttpInfo, LinkCheckSummary, RobotsInfo, SitemapInfo } from '@chazon/shared';
import type { FindingDraft } from '../findings/priority';
import { CheckList } from '../scoring/checks';
import { registeredDomain } from '../crawl/urls';
import { capList, plural, truncate } from '../util/text';
import type { PageData } from './page';

export interface SeoInput {
  /** Successfully analysed HTML pages (start page first). */
  pages: PageData[];
  http: HttpInfo;
  robots: RobotsInfo | null;
  sitemap: SitemapInfo | null;
  links: LinkCheckSummary | null;
}

export const TITLE_MIN = 15;
export const TITLE_MAX = 65;
export const DESC_MIN = 50;
export const DESC_MAX = 160;

function duplicates(pages: PageData[], pick: (p: PageData) => string | null): { value: string; urls: string[] }[] {
  const groups = new Map<string, { value: string; urls: string[] }>();
  for (const p of pages) {
    const v = pick(p);
    if (!v) continue;
    const key = v.trim().toLowerCase();
    const g = groups.get(key);
    if (g) g.urls.push(p.finalUrl);
    else groups.set(key, { value: v, urls: [p.finalUrl] });
  }
  return [...groups.values()].filter((g) => g.urls.length > 1);
}

export function analyzeSeo(input: SeoInput): { findings: FindingDraft[]; checks: CheckResult[] } {
  const { pages, http, robots, sitemap, links } = input;
  const findings: FindingDraft[] = [];
  const c = new CheckList('technicalSeo');
  const start = pages[0];
  const n = pages.length;
  const scope = `${plural(n, 'inspected page')}`;

  const pageFinding = (
    id: string,
    affectedPages: PageData[],
    f: Omit<FindingDraft, 'id' | 'affected' | 'affectedTotal' | 'source' | 'category' | 'service'> & Partial<Pick<FindingDraft, 'category' | 'service'>>,
  ) => {
    if (affectedPages.length === 0) return;
    const { items, total } = capList(affectedPages.map((p) => p.finalUrl), 15);
    findings.push({
      id,
      source: 'custom',
      category: f.category ?? 'seo',
      service: f.service ?? 'GROW',
      affected: items,
      ...(total > items.length ? { affectedTotal: total } : {}),
      ...f,
    });
  };

  // --- HTTP status, HTTPS, redirects ---------------------------------------------
  if (http.status !== null) {
    c.bool('http-status', 'Start page returns a successful (2xx) status', 3, http.status >= 200 && http.status < 300, `HTTP ${http.status}`);
  } else {
    c.skip('http-status', 'Start page returns a successful (2xx) status', 3, http.error ?? 'Start page could not be fetched.');
  }
  if (http.httpsUsed !== null) {
    c.bool('https', 'Final URL uses HTTPS', 3, http.httpsUsed, http.finalUrl ?? '');
    if (!http.httpsUsed && http.finalUrl) {
      findings.push({
        id: 'security.no-https',
        title: 'Page is served without HTTPS',
        category: 'security',
        severity: 'high',
        confidence: 'high',
        source: 'custom',
        evidence: [`Final URL after redirects: ${http.finalUrl}`],
        observed: `Final URL uses ${new URL(http.finalUrl).protocol.replace(':', '')}`,
        affected: [http.finalUrl],
        explanation: 'Without HTTPS, data between visitors and the site is unencrypted; browsers mark such pages "Not secure" and HTTPS is a known lightweight Google ranking signal.',
        recommendation: 'Install a TLS certificate (often free via the host or Let’s Encrypt) and redirect all HTTP URLs to HTTPS with 301 redirects.',
        service: 'BUILD',
        effort: 'low',
      });
    }
  } else {
    c.skip('https', 'Final URL uses HTTPS', 3, 'Start page could not be fetched.');
  }
  if (http.httpRedirectsToHttps !== null) {
    c.bool('http-to-https', 'HTTP version redirects to HTTPS', 2, http.httpRedirectsToHttps, http.httpCheckDetail);
    if (!http.httpRedirectsToHttps && http.httpsUsed) {
      findings.push({
        id: 'security.http-not-redirected',
        title: 'HTTP version of the site does not redirect to HTTPS',
        category: 'security',
        severity: 'medium',
        confidence: 'high',
        source: 'custom',
        evidence: [http.httpCheckDetail],
        affected: [http.finalUrl ?? http.inputUrl],
        explanation: 'Visitors or links using http:// may stay on an unencrypted version, and search engines may see two versions of the same pages.',
        recommendation: 'Add a permanent (301) redirect from every http:// URL to its https:// equivalent and consider enabling HSTS.',
        service: 'BUILD',
        effort: 'low',
      });
    }
  } else {
    c.skip('http-to-https', 'HTTP version redirects to HTTPS', 2, http.httpCheckDetail || 'Not checked.');
  }
  if (http.status !== null) {
    const hops = http.redirects.length;
    c.bool('redirect-chain', 'Start URL reaches its final page in at most 2 redirects', 1, hops <= 2, `${plural(hops, 'redirect')}`);
    if (hops > 2) {
      findings.push({
        id: 'seo.redirect-chain',
        title: `Redirect chain of ${hops} hops on the start URL`,
        category: 'seo',
        severity: 'low',
        confidence: 'high',
        source: 'custom',
        evidence: http.redirects.map((r) => `${r.status}: ${truncate(r.url, 120)} → ${truncate(r.location, 120)}`),
        observed: `${hops} redirects before the final page`,
        affected: [http.inputUrl],
        explanation: 'Each redirect adds latency, and long chains can waste crawl budget.',
        recommendation: 'Point links and redirects directly at the final URL so there is at most one hop.',
        service: 'GROW',
        effort: 'low',
      });
    }
  } else {
    c.skip('redirect-chain', 'Start URL reaches its final page in at most 2 redirects', 1, 'Start page could not be fetched.');
  }

  if (!start) {
    for (const [id, label, w] of [
      ['titles', 'Pages have a <title>', 3],
      ['descriptions', 'Pages have a meta description', 2],
      ['h1', 'Pages have an H1 heading', 2],
      ['indexable', 'Start page is indexable', 3],
    ] as const) {
      c.skip(id, label, w, 'No HTML page could be analysed.');
    }
    return { findings, checks: c.items };
  }

  // --- Titles ---------------------------------------------------------------------
  const noTitle = pages.filter((p) => !p.title);
  c.ratio('titles', 'Pages have a <title>', 3, n - noTitle.length, n);
  pageFinding('seo.missing-title', noTitle, {
    title: `Missing page title on ${plural(noTitle.length, 'page')}`,
    severity: 'high',
    confidence: 'high',
    evidence: [`${noTitle.length} of ${scope} have no <title> element (or it is empty).`],
    observed: `${noTitle.length} of ${n} pages without a title`,
    explanation: 'The title is the main clickable headline in search results and the browser tab label.',
    recommendation: 'Give every page a unique, descriptive <title> that leads with the page’s main topic.',
    effort: 'low',
  });
  const badTitleLen = pages.filter((p) => p.title && (p.title.length < TITLE_MIN || p.title.length > TITLE_MAX));
  c.ratio('title-length', `Title length ${TITLE_MIN}–${TITLE_MAX} characters`, 1, pages.filter((p) => p.title).length - badTitleLen.length, pages.filter((p) => p.title).length);
  pageFinding('seo.title-length', badTitleLen, {
    title: `Title length outside ${TITLE_MIN}–${TITLE_MAX} characters on ${plural(badTitleLen.length, 'page')}`,
    severity: 'low',
    confidence: 'medium',
    evidence: badTitleLen.slice(0, 6).map((p) => `${p.title!.length} chars: "${truncate(p.title!, 90)}"`),
    explanation: 'Very short titles carry little information; long titles are usually truncated in search results. (Google truncates by pixel width, so the character range is a guideline.)',
    recommendation: `Aim for roughly ${TITLE_MIN}–${TITLE_MAX} characters with the most important words first.`,
    effort: 'low',
  });
  pageFinding('seo.multiple-titles', pages.filter((p) => p.titleCount > 1), {
    title: 'Multiple <title> elements on a page',
    severity: 'low',
    confidence: 'high',
    evidence: pages.filter((p) => p.titleCount > 1).slice(0, 5).map((p) => `${p.titleCount} title elements on ${p.finalUrl}`),
    explanation: 'Search engines use only one title; duplicates are usually a template error and make the outcome unpredictable.',
    recommendation: 'Keep exactly one <title> in the <head>.',
    effort: 'low',
  });

  // --- Meta descriptions --------------------------------------------------------------
  const noDesc = pages.filter((p) => !p.description);
  c.ratio('descriptions', 'Pages have a meta description', 2, n - noDesc.length, n);
  pageFinding('seo.missing-description', noDesc, {
    title: `Missing meta description on ${plural(noDesc.length, 'page')}`,
    severity: 'medium',
    confidence: 'high',
    evidence: [`${noDesc.length} of ${scope} have no meta description.`],
    observed: `${noDesc.length} of ${n} pages without a meta description`,
    explanation: 'Search engines often use the meta description as the snippet under the title; without one they pick text from the page, which may be less persuasive.',
    recommendation: 'Write a unique 1–2 sentence description for each important page that summarises it and encourages the click.',
    effort: 'low',
  });
  const withDesc = pages.filter((p) => p.description);
  const badDescLen = withDesc.filter((p) => p.description!.length < DESC_MIN || p.description!.length > DESC_MAX);
  c.ratio('description-length', `Meta description length ${DESC_MIN}–${DESC_MAX} characters`, 1, withDesc.length - badDescLen.length, withDesc.length);
  pageFinding('seo.description-length', badDescLen, {
    title: `Meta description length outside ${DESC_MIN}–${DESC_MAX} characters on ${plural(badDescLen.length, 'page')}`,
    severity: 'low',
    confidence: 'medium',
    evidence: badDescLen.slice(0, 5).map((p) => `${p.description!.length} chars on ${p.finalUrl}`),
    explanation: 'Very short descriptions add little; long ones are usually truncated. This is a guideline, not a ranking rule.',
    recommendation: `Aim for roughly ${DESC_MIN}–${DESC_MAX} characters.`,
    effort: 'low',
  });

  // --- Headings ------------------------------------------------------------------------
  const noH1 = pages.filter((p) => p.h1.length === 0);
  c.ratio('h1', 'Pages have an H1 heading', 2, n - noH1.length, n);
  pageFinding('seo.missing-h1', noH1, {
    title: `No H1 heading on ${plural(noH1.length, 'page')}`,
    severity: 'medium',
    confidence: 'high',
    evidence: [`${noH1.length} of ${scope} contain no <h1> in the server-delivered HTML.`],
    observed: `${noH1.length} of ${n} pages without an H1`,
    explanation: 'The H1 tells visitors and search engines what the page is about and anchors the heading structure used by screen readers.',
    recommendation: 'Add one clear H1 per page describing its main topic.',
    effort: 'low',
  });
  const multiH1 = pages.filter((p) => p.h1.length > 1);
  pageFinding('seo.multiple-h1', multiH1, {
    title: `Multiple H1 headings on ${plural(multiH1.length, 'page')}`,
    severity: 'info',
    confidence: 'high',
    evidence: multiH1.slice(0, 5).map((p) => `${p.h1.length} H1s on ${p.finalUrl}: ${p.h1.slice(0, 3).map((h) => `"${truncate(h, 40)}"`).join(', ')}`),
    explanation: 'Multiple H1s are valid HTML and not a confirmed SEO problem, but a single main heading is usually clearer.',
    recommendation: 'Consider one H1 for the main topic and H2/H3 for sections.',
    effort: 'low',
  });

  // --- Duplicates across crawled pages ----------------------------------------------------
  const dupTitles = duplicates(pages, (p) => p.title);
  const dupDescs = duplicates(pages, (p) => p.description);
  if (n >= 2) {
    const dupTitlePages = dupTitles.reduce((s, g) => s + g.urls.length, 0);
    c.ratio('unique-titles', 'Titles are unique across inspected pages', 2, pages.filter((p) => p.title).length - dupTitlePages, pages.filter((p) => p.title).length);
    if (withDesc.length >= 2) {
      const dupDescPages = dupDescs.reduce((s, g) => s + g.urls.length, 0);
      c.ratio('unique-descriptions', 'Meta descriptions are unique across inspected pages', 1, withDesc.length - dupDescPages, withDesc.length);
    } else c.skip('unique-descriptions', 'Meta descriptions are unique across inspected pages', 1, 'Not applicable: fewer than 2 pages have a description.');
  } else {
    c.skip('unique-titles', 'Titles are unique across inspected pages', 2, 'Only one page was inspected.');
    c.skip('unique-descriptions', 'Meta descriptions are unique across inspected pages', 1, 'Only one page was inspected.');
  }
  for (const [kind, groups] of [['title', dupTitles], ['description', dupDescs]] as const) {
    if (groups.length === 0) continue;
    const urls = groups.flatMap((g) => g.urls);
    const { items, total } = capList(urls, 15);
    findings.push({
      id: `seo.duplicate-${kind}s`,
      title: `Duplicate ${kind === 'title' ? 'titles' : 'meta descriptions'} across ${plural(urls.length, 'page')}`,
      category: 'seo',
      severity: 'medium',
      confidence: 'high',
      source: 'custom',
      evidence: groups.slice(0, 5).map((g) => `"${truncate(g.value, 80)}" used on ${g.urls.length} pages`),
      observed: `${urls.length} of ${n} pages share a ${kind} with another page`,
      affected: items,
      ...(total > items.length ? { affectedTotal: total } : {}),
      explanation: `Pages sharing the same ${kind} are harder for search engines and users to tell apart and may compete with each other. Only the ${scope} were compared.`,
      recommendation: `Write a distinct ${kind} for each page reflecting its specific content.`,
      service: 'GROW',
      effort: 'low',
    });
  }

  // --- Canonical ----------------------------------------------------------------------------
  const siteDomain = registeredDomain(start.finalUrl);
  const canonOk = !!start.canonical && start.canonicalCount === 1;
  if (start.canonicalCount === 0) c.warn('canonical', 'Start page declares a valid canonical URL', 1, 'No canonical tag (not an error by itself).', 0.5);
  else c.bool('canonical', 'Start page declares a valid canonical URL', 1, canonOk, start.canonicalRaw ?? '');
  const invalidCanon = pages.filter((p) => p.canonicalCount > 0 && !p.canonical);
  pageFinding('seo.canonical-invalid', invalidCanon, {
    title: 'Canonical tag present but not a valid URL',
    severity: 'medium',
    confidence: 'high',
    evidence: invalidCanon.slice(0, 5).map((p) => `href="${truncate(p.canonicalRaw ?? '', 100)}" on ${p.finalUrl}`),
    explanation: 'An invalid canonical is ignored by search engines and can signal a template error.',
    recommendation: 'Use an absolute https:// URL pointing to the preferred version of the page.',
    effort: 'low',
  });
  const multiCanon = pages.filter((p) => p.canonicalCount > 1);
  pageFinding('seo.canonical-multiple', multiCanon, {
    title: 'Multiple canonical tags on a page',
    severity: 'medium',
    confidence: 'high',
    evidence: multiCanon.slice(0, 5).map((p) => `${p.canonicalCount} canonical tags on ${p.finalUrl}`),
    explanation: 'When several canonicals are present, search engines may ignore all of them.',
    recommendation: 'Keep exactly one canonical link per page (often caused by a theme plus an SEO plugin both adding one).',
    effort: 'low',
  });
  const crossCanon = pages.filter((p) => p.canonical && siteDomain && registeredDomain(p.canonical) !== siteDomain);
  pageFinding('seo.canonical-cross-domain', crossCanon, {
    title: 'Canonical URL points to a different domain',
    severity: 'medium',
    confidence: 'medium',
    evidence: crossCanon.slice(0, 5).map((p) => `${p.finalUrl} → canonical ${truncate(p.canonical!, 100)}`),
    explanation: 'A cross-domain canonical asks search engines to index the other domain instead. This can be intentional (syndicated content) but is often a staging/migration leftover.',
    recommendation: 'Confirm this is intended; otherwise point the canonical at the page’s own URL.',
    effort: 'low',
  });
  const noCanon = pages.filter((p) => p.canonicalCount === 0);
  pageFinding('seo.canonical-missing', noCanon, {
    title: `No canonical tag on ${plural(noCanon.length, 'page')}`,
    severity: 'low',
    confidence: 'high',
    evidence: [`${noCanon.length} of ${scope} declare no rel="canonical". A missing tag is not an error by itself.`],
    explanation: 'Canonical tags help search engines consolidate duplicate URLs (tracking parameters, http/https, trailing slashes).',
    recommendation: 'Add a self-referencing canonical on indexable pages, especially if URLs can be reached with parameters.',
    effort: 'low',
  });

  // --- Indexability -----------------------------------------------------------------------------
  const startBlockedByRobots = robots?.blocksAll === true;
  const indexable = start.status >= 200 && start.status < 300 && !start.noindex && !startBlockedByRobots;
  c.bool(
    'indexable',
    'Start page is indexable (2xx, no noindex, not blocked by robots.txt)',
    3,
    indexable,
    [`HTTP ${start.status}`, start.noindex ? 'noindex present' : 'no noindex', startBlockedByRobots ? 'robots.txt blocks crawling' : 'robots.txt allows crawling'].join('; '),
  );
  if (start.noindex) {
    findings.push({
      id: 'seo.noindex-start',
      title: 'Start page asks search engines not to index it (noindex)',
      category: 'seo',
      severity: 'high',
      confidence: 'high',
      source: 'custom',
      evidence: [start.metaRobots ? `meta robots: "${start.metaRobots}"` : '', start.xRobotsTag ? `X-Robots-Tag header: "${start.xRobotsTag}"` : ''].filter(Boolean),
      affected: [start.finalUrl],
      explanation: 'A noindex directive removes the page from search results. This is sometimes intentional (e.g. staging sites) but is a common launch mistake.',
      recommendation: 'If the page should appear in search, remove the noindex directive from the meta robots tag / X-Robots-Tag header.',
      service: 'GROW',
      effort: 'low',
    });
  }
  const otherNoindex = pages.slice(1).filter((p) => p.noindex);
  pageFinding('seo.noindex-pages', otherNoindex, {
    title: `${plural(otherNoindex.length, 'inspected page')} marked noindex`,
    severity: 'info',
    confidence: 'high',
    evidence: otherNoindex.slice(0, 5).map((p) => `${p.finalUrl}: ${p.metaRobots ?? p.xRobotsTag ?? 'noindex'}`),
    explanation: 'These pages will not appear in search results. That is often intentional (thank-you pages, internal search), so review rather than assume a problem.',
    recommendation: 'Confirm each noindex page is meant to be hidden from search.',
    effort: 'low',
  });

  // --- robots.txt --------------------------------------------------------------------------------
  if (robots) {
    if (robots.error) c.skip('robots', 'robots.txt does not block search engines from the site', 2, robots.error);
    else c.bool('robots', 'robots.txt does not block search engines from the site', 2, !robots.blocksAll, robots.found ? `robots.txt found (HTTP ${robots.status})` : `No robots.txt (HTTP ${robots.status}) - crawlers treat this as allow-all`);
    if (robots.blocksAll) {
      findings.push({
        id: 'seo.robots-blocks-all',
        title: 'robots.txt blocks search engines from the whole site',
        category: 'seo',
        severity: 'critical',
        confidence: 'high',
        source: 'custom',
        evidence: [`${robots.url} disallows "/" for Googlebot (or all user agents).`],
        affected: [robots.url],
        explanation: 'Search engines will not crawl any page, so the site cannot rank (pages may still appear without descriptions). This is sometimes deliberate on staging sites.',
        recommendation: 'If the site should be searchable, remove the blanket "Disallow: /" rule.',
        service: 'GROW',
        effort: 'low',
      });
    } else if (robots.error) {
      findings.push({
        id: 'seo.robots-unavailable',
        title: 'robots.txt could not be retrieved reliably',
        category: 'seo',
        severity: robots.status !== null && robots.status >= 500 ? 'medium' : 'low',
        confidence: 'medium',
        source: 'custom',
        evidence: [robots.error],
        affected: [robots.url],
        explanation: 'When robots.txt returns a server error, Google may temporarily treat the whole site as disallowed.',
        recommendation: 'Make sure /robots.txt returns 200 (with rules) or 404 (no rules) consistently.',
        service: 'GROW',
        effort: 'low',
      });
    } else if (!robots.found) {
      findings.push({
        id: 'seo.robots-missing',
        title: 'No robots.txt file found',
        category: 'seo',
        severity: 'info',
        confidence: 'high',
        source: 'custom',
        evidence: [`${robots.url} returned HTTP ${robots.status}.`],
        affected: [robots.url],
        explanation: 'This is not an error: without robots.txt crawlers may crawl everything. A robots.txt is useful mainly to declare your sitemap and exclude low-value areas.',
        recommendation: 'Optionally add a robots.txt that lists your sitemap URL.',
        service: 'GROW',
        effort: 'low',
      });
    }
  } else {
    c.skip('robots', 'robots.txt does not block search engines from the site', 2, 'robots.txt was not checked.');
  }

  // --- Sitemap -----------------------------------------------------------------------------------
  if (sitemap) {
    if (sitemap.found) {
      c.bool('sitemap', 'XML sitemap found and well-formed', 1, !sitemap.error, sitemap.error ?? `${sitemap.found} (${sitemap.type})`);
      if (sitemap.error) {
        findings.push({
          id: 'seo.sitemap-invalid',
          title: 'Sitemap XML has problems',
          category: 'seo',
          severity: 'medium',
          confidence: 'medium',
          source: 'custom',
          evidence: [sitemap.error],
          affected: [sitemap.found],
          explanation: 'Search engines may reject a malformed sitemap or read only part of it.',
          recommendation: 'Validate the sitemap and regenerate it (most CMSs and SEO plugins do this automatically).',
          service: 'GROW',
          effort: 'low',
        });
      }
      if (robots?.found && robots.sitemaps.length === 0) {
        findings.push({
          id: 'seo.sitemap-not-in-robots',
          title: 'Sitemap is not declared in robots.txt',
          category: 'seo',
          severity: 'low',
          confidence: 'high',
          source: 'custom',
          evidence: [`Sitemap found at ${sitemap.found}, but robots.txt has no "Sitemap:" line.`],
          affected: [robots.url],
          explanation: 'Declaring the sitemap helps all search engines find it, not only those where it was submitted manually.',
          recommendation: `Add "Sitemap: ${sitemap.found}" to robots.txt.`,
          service: 'GROW',
          effort: 'low',
        });
      }
    } else {
      c.warn('sitemap', 'XML sitemap found and well-formed', 1, 'Not found at the checked locations (the site may still have one elsewhere).', 0.5);
      findings.push({
        id: 'seo.sitemap-not-found',
        title: 'No XML sitemap found at the checked locations',
        category: 'seo',
        severity: 'info',
        confidence: 'low',
        source: 'custom',
        evidence: sitemap.checked.map((ch) => `${ch.url}: ${ch.outcome}`),
        affected: sitemap.checked.map((ch) => ch.url),
        explanation: 'This does not prove the site has no sitemap - it may live at another URL or be submitted directly in Google Search Console.',
        recommendation: 'Confirm whether a sitemap exists; if not, generate one and reference it in robots.txt and Search Console.',
        service: 'GROW',
        effort: 'low',
      });
    }
  } else {
    c.skip('sitemap', 'XML sitemap found and well-formed', 1, 'Sitemap was not checked.');
  }

  // --- Images alt (SEO view; detailed finding lives in accessibility) ----------------------------
  const totalImgs = pages.reduce((s, p) => s + p.images.total, 0);
  const missingAlt = pages.reduce((s, p) => s + p.images.missingAltCount, 0);
  c.ratio('img-alt', 'Images have an alt attribute', 1, totalImgs - missingAlt, totalImgs, 'images');

  // --- Structured data & Open Graph -------------------------------------------------------------
  const hasSd = start.jsonLd.some((j) => j.valid) || start.microdataTypes.length > 0;
  c.bool('structured-data', 'Start page has structured data (JSON-LD or microdata)', 1, hasSd, hasSd ? 'Structured data present.' : 'None found in server HTML.');
  if (!hasSd) {
    findings.push({
      id: 'seo.no-structured-data',
      title: 'No structured data found on the start page',
      category: 'seo',
      severity: 'low',
      confidence: 'medium',
      source: 'custom',
      evidence: ['No JSON-LD or microdata found in the server-delivered HTML of the start page.'],
      affected: [start.finalUrl],
      explanation: 'Structured data (e.g. Organization, LocalBusiness, Product) helps search engines understand the business and can make pages eligible for rich results. Eligibility is not guaranteed.',
      recommendation: 'Add JSON-LD describing the organisation and key page types; validate with Google’s Rich Results Test.',
      service: 'GROW',
      effort: 'medium',
    });
  }
  const invalidLd = pages.filter((p) => p.jsonLd.some((j) => !j.valid));
  const allLd = pages.flatMap((p) => p.jsonLd);
  if (allLd.length) c.ratio('jsonld-valid', 'JSON-LD blocks parse as valid JSON', 1, allLd.filter((j) => j.valid).length, allLd.length, 'JSON-LD blocks');
  else c.skip('jsonld-valid', 'JSON-LD blocks parse as valid JSON', 1, 'Not applicable: no JSON-LD found.');
  pageFinding('seo.invalid-jsonld', invalidLd, {
    title: `Invalid JSON-LD structured data on ${plural(invalidLd.length, 'page')}`,
    severity: 'medium',
    confidence: 'high',
    evidence: invalidLd.slice(0, 5).map((p) => `${p.finalUrl}: ${p.jsonLd.find((j) => !j.valid)?.error ?? 'parse error'}`),
    explanation: 'Search engines ignore structured data that is not valid JSON.',
    recommendation: 'Fix the JSON syntax (often a trailing comma or unescaped quote) and validate with the Schema Markup Validator.',
    effort: 'low',
  });
  const ogOk = Boolean(start.og['og:title'] && start.og['og:image']);
  c.bool('open-graph', 'Start page has Open Graph title and image', 1, ogOk, ogOk ? 'og:title and og:image present.' : `Missing: ${['og:title', 'og:image'].filter((k) => !start.og[k]).join(', ')}`);
  const noOg = pages.filter((p) => !p.og['og:title'] || !p.og['og:image']);
  pageFinding('seo.missing-open-graph', noOg, {
    title: `Incomplete Open Graph tags on ${plural(noOg.length, 'page')}`,
    severity: 'low',
    confidence: 'high',
    evidence: noOg.slice(0, 5).map((p) => `${p.finalUrl}: missing ${['og:title', 'og:description', 'og:image'].filter((k) => !p.og[k]).join(', ')}`),
    explanation: 'Open Graph tags control the title, description and image shown when pages are shared on social platforms and messaging apps.',
    recommendation: 'Add og:title, og:description and og:image (at least 1200×630 px) to key pages.',
    effort: 'low',
  });

  // --- Language & viewport (also counted under accessibility/mobile) ------------------------------
  c.bool('lang', 'Start page declares a language (<html lang>)', 1, Boolean(start.lang), start.lang ? `lang="${start.lang}"` : 'No lang attribute.');
  c.bool('viewport', 'Start page has a mobile viewport meta tag', 1, Boolean(start.viewport), start.viewport ?? 'No viewport meta tag.');

  // --- Links ----------------------------------------------------------------------------------------
  if (links?.ran) {
    const brokenInternal = links.broken.filter((b) => b.internal);
    const brokenExternal = links.broken.filter((b) => !b.internal);
    c.bool('broken-links', 'No broken internal links found', 2, brokenInternal.length === 0, `${links.internalChecked} internal links checked; ${brokenInternal.length} broken.`);
    for (const [internal, list] of [[true, brokenInternal], [false, brokenExternal]] as const) {
      if (!list.length) continue;
      findings.push({
        id: internal ? 'seo.broken-internal-links' : 'seo.broken-external-links',
        title: `${plural(list.length, `broken ${internal ? 'internal' : 'external'} link`)} found`,
        category: 'seo',
        severity: internal ? 'high' : 'low',
        confidence: internal ? 'high' : 'medium',
        source: 'custom',
        evidence: list.slice(0, 8).map((b) => `${truncate(b.url, 120)} - ${b.reason}${b.foundOn.length ? ` (linked from ${truncate(b.foundOn[0]!, 80)})` : ''}`),
        observed: `${list.length} broken of ${internal ? links.internalChecked : links.externalChecked} ${internal ? 'internal' : 'external'} links checked`,
        affected: list.slice(0, 15).map((b) => b.url),
        ...(list.length > 15 ? { affectedTotal: list.length } : {}),
        explanation: internal
          ? 'Broken internal links send visitors and crawlers to dead ends and waste link equity.'
          : 'Links to missing external pages frustrate visitors and can look unmaintained.',
        recommendation: internal ? 'Fix or remove the links, or add 301 redirects from the missing URLs to the best replacement page.' : 'Update or remove links to external pages that no longer exist.',
        service: 'GROW',
        effort: 'low',
      });
    }
    if (links.unverified.length) {
      findings.push({
        id: 'seo.unverified-links',
        title: `${plural(links.unverified.length, 'link')} could not be verified`,
        category: 'crawl',
        severity: 'info',
        confidence: 'low',
        source: 'custom',
        evidence: links.unverified.slice(0, 8).map((u) => `${truncate(u.url, 120)} - ${u.reason}`),
        affected: links.unverified.slice(0, 15).map((u) => u.url),
        explanation: 'These links returned restricted/rate-limited responses or timed out. Many sites (e.g. social networks) block automated checks, so these are not confirmed as broken.',
        recommendation: 'Spot-check these links manually in a browser.',
        service: 'GROW',
        effort: 'low',
      });
    }
  } else {
    c.skip('broken-links', 'No broken internal links found', 2, 'Link checking was not run.');
  }

  // --- Transport security ------------------------------------------------------------------------------
  const mixed = pages.filter((p) => p.insecureResources.length > 0);
  if (http.httpsUsed) {
    c.ratio('mixed-content', 'HTTPS pages load all resources over HTTPS', 1, n - mixed.length, n);
    pageFinding('security.mixed-content', mixed, {
      title: `Insecure (http://) resources on ${plural(mixed.length, 'HTTPS page')}`,
      category: 'security',
      service: 'BUILD',
      severity: 'medium',
      confidence: 'high',
      evidence: mixed.slice(0, 4).flatMap((p) => p.insecureResources.slice(0, 3).map((r) => `${p.finalUrl} loads ${r}`)),
      observed: `${mixed.reduce((s, p) => s + p.insecureResources.length, 0)} http:// resource(s) on ${plural(mixed.length, 'page')}`,
      explanation: 'Browsers block or warn about insecure scripts, styles and frames on secure pages ("mixed content"), which can break features and remove the padlock.',
      recommendation: 'Load every image, script, stylesheet and frame over https:// (or a protocol-relative/relative URL), then re-test.',
      effort: 'low',
    });
    const hsts = start.headers['strict-transport-security'];
    if (!hsts) {
      findings.push({
        id: 'security.no-hsts',
        title: 'No HTTP Strict Transport Security (HSTS) header',
        category: 'security',
        severity: 'info',
        confidence: 'high',
        source: 'custom',
        evidence: [`The response for ${start.finalUrl} has no Strict-Transport-Security header.`],
        observed: 'Strict-Transport-Security header absent',
        affected: [start.finalUrl],
        explanation: 'HSTS tells browsers to always use HTTPS for the site, protecting visitors who type or follow http:// links. It is a hardening measure, not a vulnerability by itself.',
        recommendation: 'Once HTTPS works for every page and subdomain, add "Strict-Transport-Security: max-age=31536000" (consider includeSubDomains after testing).',
        service: 'BUILD',
        effort: 'low',
      });
    }
  } else {
    c.skip('mixed-content', 'HTTPS pages load all resources over HTTPS', 1, 'Not applicable: the site is not served over HTTPS.', 'not-applicable');
  }

  // --- Content depth (heuristic) -------------------------------------------------------------------------
  const LEGAL_OR_UTILITY = /(contact|privacy|terms|cookie|legal|login|cart|checkout|account|search|thank)/i;
  const thin = pages.filter((p) => p.wordCount < 150 && !p.likelyClientRendered && !LEGAL_OR_UTILITY.test(new URL(p.finalUrl).pathname));
  pageFinding('seo.thin-content', thin, {
    title: `Very little text on ${plural(thin.length, 'page')}`,
    severity: 'low',
    confidence: 'low',
    evidence: thin.slice(0, 6).map((p) => `${p.finalUrl}: about ${p.wordCount} words of visible text in the server HTML`),
    observed: `Fewer than 150 words on ${plural(thin.length, 'page')}`,
    explanation: 'Pages with very little text give search engines and visitors little to understand. Some pages are legitimately short (galleries, landing pages), and text loaded by JavaScript is not counted here.',
    recommendation: 'Review the listed pages; where they should attract search traffic, add useful, specific content about the topic.',
    effort: 'medium',
  });

  // --- Partial / client-rendered pages ---------------------------------------------------------------
  const truncatedPages = pages.filter((p) => p.truncated);
  pageFinding('crawl.truncated-pages', truncatedPages, {
    title: `${plural(truncatedPages.length, 'page')} exceeded the HTML size limit`,
    category: 'crawl',
    severity: 'info',
    confidence: 'high',
    evidence: truncatedPages.map((p) => `${p.finalUrl}: only the first ${Math.round(p.bytes / 1024)} KiB were analysed.`),
    explanation: 'Very large HTML documents are only partially analysed by this tool. Unusually large HTML can also slow down rendering.',
    recommendation: 'Check why the HTML is so large (inlined data, huge menus, embedded assets).',
    effort: 'medium',
    service: 'BUILD',
  });

  return { findings, checks: c.items };
}
