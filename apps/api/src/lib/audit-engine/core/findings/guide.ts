import type { Confidence, Effort, EvidenceStatus, Finding, FindingCategory, Severity } from '@chazon/shared';

/**
 * Deterministic, reader-facing guidance for findings: a plain-English summary,
 * the expected condition, how to verify a fix and why the effort rating was
 * chosen. Nothing here adds evidence - it only explains what was observed.
 */
export interface FindingGuide {
  plain: string;
  expected?: string;
  verification?: string;
  /** Replaces a generic recommendation (e.g. "Follow the Lighthouse guidance"). */
  fix?: string;
  effortRationale?: string;
  status?: EvidenceStatus;
}

const RETEST_LH = 'Re-run this audit (or PageSpeed Insights) for the same URL and device and confirm the Lighthouse audit passes.';
const RECRAWL = 'Re-run this audit with the same crawl limit and confirm the finding no longer appears.';

/** Keyed by finding id. Lighthouse findings use "lh.<audit-id>". */
const GUIDES: Record<string, FindingGuide> = {
  // --- Security & HTTP --------------------------------------------------------------------
  'security.no-https': {
    plain: 'The site is not served over a secure (HTTPS) connection, so browsers may label it "Not secure".',
    expected: 'All pages load over https:// with a valid certificate.',
    verification: 'Open the site in a browser and confirm the padlock icon; re-run the audit and check the "Final URL uses HTTPS" check passes.',
    effortRationale: 'Usually a hosting setting plus a redirect rule; most hosts provide free certificates.',
  },
  'security.http-not-redirected': {
    plain: 'Typing the http:// address does not forward visitors to the secure version of the site.',
    expected: 'http:// requests return a 301 redirect to the https:// equivalent.',
    verification: 'Visit the http:// address and confirm the browser ends up on https://; re-run the audit.',
    effortRationale: 'A single server or hosting redirect rule.',
  },
  'security.mixed-content': {
    plain: 'Secure pages load some images, scripts or styles over an insecure connection, which browsers may block or warn about.',
    expected: 'Every resource on an https:// page is loaded over https://.',
    verification: 'Open the page with the browser developer console and confirm there are no "Mixed Content" warnings; re-run the audit.',
    effortRationale: 'Usually a find-and-replace of http:// URLs in templates or content.',
  },
  'security.no-hsts': {
    plain: 'The site does not tell browsers to always use the secure connection (HSTS). This is a hardening step, not a vulnerability by itself.',
    expected: 'A Strict-Transport-Security header on HTTPS responses (once HTTPS works everywhere).',
    verification: 'Check the response headers of the start page for Strict-Transport-Security (e.g. with securityheaders.com or the browser network panel).',
    effortRationale: 'One server header, but it should be enabled carefully because it is hard to undo.',
  },
  'seo.start-page-error': {
    plain: 'The home page returned an error instead of the page, so visitors and search engines cannot see it.',
    expected: 'The start URL returns HTTP 200.',
    verification: 'Load the URL in a browser and re-run the audit; the status should be 200.',
    effortRationale: 'Depends on the cause (hosting, routing or application error); needs investigation by the site’s developer or host.',
  },
  'crawl.start-refused': {
    plain: 'The website refused this tool’s automated request. Visitors may still see the site normally.',
    verification: 'Ask the site owner whether bot protection is enabled; re-run from another network or with the tool allowed.',
    status: 'manual-review',
  },
  'crawl.start-unreachable': {
    plain: 'This tool could not connect to the home page directly, although Google’s test could.',
    verification: 'Re-run the audit later; if it persists, review firewall or bot-protection settings.',
    status: 'manual-review',
  },
  'seo.redirect-chain': {
    plain: 'The address passes through several redirects before reaching the page, which adds delay.',
    expected: 'At most one redirect from the entered address to the final page.',
    verification: RECRAWL,
  },

  // --- Titles, descriptions, headings ------------------------------------------------------
  'seo.missing-title': {
    plain: 'Some pages have no title - the headline shown in Google results and browser tabs.',
    expected: 'Every page has one unique, descriptive <title>.',
    verification: RECRAWL,
    effortRationale: 'Editing page settings in the CMS or a template; no new features needed.',
  },
  'seo.title-length': {
    plain: 'Some page titles are very short or likely to be cut off in search results.',
    expected: 'Roughly 15–65 characters, most important words first (a guideline, not a rule).',
    verification: RECRAWL,
    status: 'likely',
  },
  'seo.multiple-titles': { plain: 'Some pages contain more than one title tag, usually a template error.', expected: 'Exactly one <title> per page.', verification: RECRAWL },
  'seo.missing-description': {
    plain: 'Some pages have no meta description, so Google picks its own snippet text for search results.',
    expected: 'Each important page has a unique 1–2 sentence meta description.',
    verification: RECRAWL,
  },
  'seo.description-length': {
    plain: 'Some meta descriptions are very short or likely to be cut off in search results.',
    expected: 'Roughly 50–160 characters (a guideline, not a ranking rule).',
    verification: RECRAWL,
    status: 'likely',
  },
  'seo.missing-h1': {
    plain: 'Some pages have no main heading (H1) telling visitors and search engines what the page is about.',
    expected: 'One clear H1 per page.',
    verification: RECRAWL,
  },
  'seo.multiple-h1': { plain: 'Some pages have several main headings. This is allowed, but one is usually clearer.', expected: 'Usually one H1 with H2/H3 for sections.', verification: RECRAWL },
  'seo.duplicate-titles': {
    plain: 'Several inspected pages share the same title, making them hard to tell apart in search results.',
    expected: 'A distinct title for each page.',
    verification: RECRAWL,
  },
  'seo.duplicate-descriptions': {
    plain: 'Several inspected pages share the same meta description.',
    expected: 'A distinct description for each page.',
    verification: RECRAWL,
  },
  'seo.thin-content': {
    plain: 'Some inspected pages contain very little text in their HTML. They may give search engines and visitors too little to go on - or the text may be loaded by JavaScript.',
    expected: 'Key pages explain their topic in enough words to be useful (there is no fixed minimum).',
    verification: 'Review the listed pages in a browser; if they are meant to rank, expand the content and re-run the audit.',
    status: 'hypothesis',
  },

  // --- Canonical & indexing -----------------------------------------------------------------
  'seo.canonical-invalid': { plain: 'A canonical tag exists but does not contain a valid address, so search engines ignore it.', expected: 'An absolute https:// URL.', verification: RECRAWL },
  'seo.canonical-multiple': { plain: 'Some pages declare more than one canonical address, so search engines may ignore all of them.', expected: 'Exactly one canonical link per page.', verification: RECRAWL },
  'seo.canonical-cross-domain': {
    plain: 'Some pages tell search engines that the "real" version lives on another domain. This can be deliberate, but is often a leftover from a migration.',
    expected: 'A self-referencing canonical unless the content is intentionally syndicated.',
    verification: 'Confirm with the site owner whether this is intended; re-run the audit after changes.',
    status: 'manual-review',
  },
  'seo.canonical-missing': { plain: 'Some pages do not declare a preferred address (canonical). Not an error by itself.', expected: 'A self-referencing canonical on indexable pages.', verification: RECRAWL },
  'seo.noindex-start': {
    plain: 'The home page tells search engines not to list it in results.',
    expected: 'No noindex directive on pages that should appear in search.',
    verification: 'Check the page source and response headers for "noindex"; use URL Inspection in Google Search Console after the fix.',
  },
  'seo.noindex-pages': {
    plain: 'Some inspected pages are hidden from search results. This is often intentional (e.g. thank-you pages).',
    verification: 'Confirm with the site owner that each listed page should be hidden from search.',
    status: 'manual-review',
  },
  'seo.robots-blocks-all': {
    plain: 'The robots.txt file blocks search engines from the entire site.',
    expected: 'robots.txt allows crawling of public pages.',
    verification: 'Open /robots.txt and confirm there is no blanket "Disallow: /"; test in Google Search Console’s robots.txt report.',
  },
  'seo.robots-unavailable': { plain: 'The robots.txt file could not be retrieved reliably.', expected: '/robots.txt returns 200 or 404 consistently.', verification: 'Request /robots.txt several times and confirm a consistent 200 or 404.', status: 'likely' },
  'seo.robots-missing': { plain: 'There is no robots.txt file. This is not an error; it is mainly useful for pointing search engines to a sitemap.', verification: 'Open /robots.txt in a browser.' },
  'seo.sitemap-invalid': { plain: 'The XML sitemap has problems that may stop search engines reading it fully.', expected: 'A valid XML sitemap.', verification: 'Validate the sitemap and check the Sitemaps report in Google Search Console.' },
  'seo.sitemap-not-found': {
    plain: 'No XML sitemap was found at the usual addresses. One may still exist elsewhere.',
    expected: 'A sitemap listed in robots.txt and submitted in Search Console.',
    verification: 'Ask the site owner or check Google Search Console’s Sitemaps report.',
    status: 'manual-review',
  },
  'seo.sitemap-not-in-robots': { plain: 'The sitemap exists but robots.txt does not mention it.', expected: 'A "Sitemap:" line in robots.txt.', verification: 'Open /robots.txt and confirm the Sitemap line.' },

  // --- Links & crawl -----------------------------------------------------------------------
  'seo.broken-internal-links': {
    plain: 'Some links on the site lead to pages that no longer exist.',
    expected: 'All internal links return a working page.',
    verification: 'Click the listed links or re-run the audit with link checking enabled.',
  },
  'seo.broken-external-links': {
    plain: 'Some links to other websites are broken.',
    expected: 'External links point to live pages.',
    verification: 'Open the listed links in a browser; some sites block automated checks, so confirm manually.',
    status: 'likely',
  },
  'seo.unverified-links': {
    plain: 'Some links could not be checked automatically (many sites block bots). They are not confirmed as broken.',
    verification: 'Open the listed links manually in a browser.',
    status: 'manual-review',
  },
  'crawl.error-pages': { plain: 'Some linked pages returned errors when visited.', expected: 'Linked pages return HTTP 200.', verification: RECRAWL },
  'crawl.client-rendered': {
    plain: 'The page’s content appears to be built by JavaScript in the browser, so some checks in this report may under-report.',
    verification: 'Compare "View source" with the rendered page; test key pages with Google Search Console’s URL Inspection.',
    effortRationale: 'Changing the rendering approach affects the whole site architecture.',
    status: 'likely',
  },
  'crawl.truncated-pages': { plain: 'Some pages are unusually large, so only part of their HTML was analysed.', verification: 'Check the HTML size of the listed pages in the browser network panel.' },

  // --- Structured data & sharing -------------------------------------------------------------
  'seo.no-structured-data': {
    plain: 'The home page has no structured data - machine-readable details (business name, address, products) that help search engines.',
    expected: 'Organization or LocalBusiness JSON-LD (and Product where relevant).',
    verification: 'Test the page with Google’s Rich Results Test or the Schema Markup Validator.',
    effortRationale: 'Requires writing and validating JSON-LD for the business; often supported by SEO plugins.',
    status: 'likely',
  },
  'seo.invalid-jsonld': { plain: 'Some structured data contains syntax errors, so search engines ignore it.', expected: 'Valid JSON-LD.', verification: 'Validate with the Schema Markup Validator.' },
  'seo.missing-open-graph': {
    plain: 'Some pages lack the tags that control how links look when shared on social media and messaging apps.',
    expected: 'og:title, og:description and og:image on key pages.',
    verification: 'Paste the URL into a share-preview tool (e.g. the Facebook Sharing Debugger) or a WhatsApp chat.',
  },

  // --- Accessibility & mobile ---------------------------------------------------------------
  'a11y.images-missing-alt': {
    plain: 'Some images have no text description, so screen-reader users miss their meaning.',
    expected: 'Meaningful images have descriptive alt text; decorative images use alt="".',
    verification: 'Re-run the audit and check the images with a screen reader or an accessibility browser extension.',
  },
  'a11y.unlabeled-fields': {
    plain: 'Some form fields have no proper label, which makes forms harder to complete with a screen reader.',
    expected: 'Every field has a programmatic label.',
    verification: 'Tab through the form with a screen reader and confirm each field is announced; re-run the audit.',
  },
  'a11y.unnamed-buttons': { plain: 'Some buttons have no name, so screen readers announce just "button".', expected: 'Every button has visible text or an aria-label.', verification: 'Re-run the audit; check with a screen reader.' },
  'a11y.unnamed-links': { plain: 'Some links (often icons) have no text for assistive technology.', expected: 'Every link has a name.', verification: 'Re-run the audit; check with a screen reader.' },
  'a11y.missing-lang': { plain: 'Some pages do not declare their language, which affects screen-reader pronunciation and translation.', expected: '<html lang="…"> on every page.', verification: RECRAWL },
  'a11y.heading-skips': { plain: 'Heading levels jump (e.g. H1 to H3), making the page structure harder to follow with assistive technology.', expected: 'Headings in order: H1 → H2 → H3.', verification: RECRAWL },
  'a11y.positive-tabindex': { plain: 'Some elements change the natural keyboard order, which often confuses keyboard users.', expected: 'tabindex values of 0 or -1 only.', verification: 'Tab through the page and confirm a logical order; re-run the audit.' },
  'a11y.zoom-disabled': { plain: 'Visitors cannot zoom in on phones, which affects people with low vision.', expected: 'No user-scalable=no or maximum-scale below 2.', verification: 'Pinch-zoom on a phone; re-run the audit.' },
  'mobile.missing-viewport': {
    plain: 'Some pages are not set up for phone screens, so they appear shrunk and hard to use on mobile.',
    expected: '<meta name="viewport" content="width=device-width, initial-scale=1"> and a responsive layout.',
    verification: 'Open the pages on a phone; re-run the audit.',
    effortRationale: 'The tag is simple, but a non-responsive layout may also need template work.',
  },
  'mobile.viewport-not-device-width': { plain: 'The page uses a fixed width on phones instead of adapting to the screen.', expected: 'width=device-width.', verification: 'Open the pages on a phone; re-run the audit.' },

  // --- Conversion & journey -----------------------------------------------------------------
  'journey.no-contact-route': {
    plain: 'No way to contact the business (contact page, email, phone, WhatsApp or form) was found on the inspected pages.',
    expected: 'A visible contact route on every page, usually in the header or footer.',
    verification: 'Check the live site on desktop and mobile; re-run the audit with a larger crawl limit.',
    status: 'hypothesis',
  },
  'journey.contact-not-on-start': {
    plain: 'The home page itself shows no contact option, although other pages do.',
    expected: 'A contact link or button visible on the home page.',
    verification: 'Check the home page on desktop and mobile; re-run the audit.',
  },
  'journey.contact-not-in-header': {
    plain: 'Contact options exist, but none appear in the header or main navigation, where visitors usually look first.',
    expected: 'A contact link, phone link or enquiry button in the header or navigation.',
    verification: 'Check the header on desktop and in the mobile menu; re-run the audit.',
    status: 'likely',
  },
  'journey.no-primary-cta': {
    plain: 'No clear "next step" button or link (e.g. "Get a quote", "Book now") was detected on the home page.',
    expected: 'One prominent, specific primary action near the top of the page.',
    verification: 'Review the home page above the fold on desktop and mobile; re-run the audit.',
    status: 'hypothesis',
  },
  'journey.no-navigation': {
    plain: 'No standard navigation menu was found in the page code; the site may use a non-standard menu.',
    verification: 'Check the menu with a keyboard and screen reader.',
    status: 'hypothesis',
  },
  'journey.contact-not-linked': { plain: 'A contact page exists but the home page does not link to it.', expected: 'Contact page linked from the header or footer.', verification: RECRAWL },
  'journey.sitemap-unlinked': { plain: 'Some pages listed in the sitemap are not linked from the inspected pages, so visitors may not find them.', verification: 'Check navigation for the listed pages; re-run with a larger crawl.', status: 'hypothesis' },
  'journey.shop-no-cart': {
    plain: 'Products appear on the site, but no cart or checkout path was found. The business may sell offline or by enquiry on purpose.',
    verification: 'Ask the business how customers are meant to buy.',
    status: 'manual-review',
  },
  'journey.service-pages-no-next-step': {
    plain: 'Some service or product pages do not show an obvious next step (contact, quote, book or buy).',
    expected: 'Each service page ends with a clear action.',
    verification: 'Review the listed pages on desktop and mobile; re-run the audit.',
    status: 'likely',
  },
  'journey.phone-not-clickable': {
    plain: 'A phone number appears in the page text but is not a tap-to-call link, so mobile visitors must copy it by hand.',
    expected: 'Phone numbers wrapped in tel: links.',
    verification: 'Tap the number on a phone; re-run the audit.',
    status: 'hypothesis',
  },
  'journey.form-no-privacy-link': {
    plain: 'A form collects visitor details, but no privacy policy link was found on the same page.',
    expected: 'A privacy policy link near forms that collect personal data.',
    verification: 'Check the form pages for a privacy notice; re-run the audit.',
    status: 'likely',
  },
  'journey.long-enquiry-form': {
    plain: 'An enquiry form has many fields, which can discourage people from completing it.',
    expected: 'Only the fields needed to respond to the enquiry.',
    verification: 'Review which fields are essential with the business; re-run the audit.',
    status: 'hypothesis',
  },
  'journey.no-trust-signals': {
    plain: 'No testimonials, reviews or review markup were detected on the inspected pages. They may exist elsewhere or be shown as images.',
    verification: 'Review the site manually and ask the business whether it collects reviews.',
    status: 'hypothesis',
  },

  // --- Lighthouse audits with generic guidance ----------------------------------------------
  'lh.http-status-code': { plain: 'Google’s test received an error status for the page.', expected: 'HTTP 200.', fix: 'Fix the server or routing error so the page returns HTTP 200 to all clients, including Google.', verification: RETEST_LH },
  'lh.is-crawlable': { plain: 'Google’s test found the page is blocked from being indexed.', expected: 'No noindex or robots.txt block on public pages.', fix: 'Remove the noindex directive or robots.txt rule if the page should appear in search.', verification: RETEST_LH },
  'lh.document-title': { plain: 'The page has no title.', expected: 'A unique, descriptive <title>.', fix: 'Add a unique, descriptive <title> to the page.', verification: RETEST_LH },
  'lh.meta-description': { plain: 'The page has no meta description.', expected: 'A unique meta description.', fix: 'Write a unique 1–2 sentence meta description summarising the page.', verification: RETEST_LH },
  'lh.link-text': { plain: 'Some links use vague text such as "click here".', expected: 'Descriptive link text.', fix: 'Rewrite link text to describe the destination (e.g. "View our pricing").', verification: RETEST_LH },
  'lh.crawlable-anchors': { plain: 'Some links cannot be followed by search engines.', expected: 'Links use real href URLs.', fix: 'Use <a href="…"> with real URLs instead of JavaScript-only links.', verification: RETEST_LH },
  'lh.canonical': { plain: 'The canonical tag is invalid or conflicting.', expected: 'One valid canonical URL.', fix: 'Point the canonical tag at the page’s own preferred https:// URL.', verification: RETEST_LH },
  'lh.hreflang': { plain: 'Language alternates (hreflang) are invalid.', fix: 'Correct the hreflang codes and URLs.', verification: RETEST_LH },
  'lh.robots-txt': { plain: 'Google’s test found robots.txt is invalid.', fix: 'Fix the syntax errors in robots.txt.', verification: RETEST_LH },
  'lh.image-alt': { plain: 'Some images have no text description.', expected: 'Descriptive alt text or alt="" for decoration.', verification: RETEST_LH },
  'lh.color-contrast': {
    plain: 'Some text has too little contrast with its background, making it hard to read.',
    expected: 'At least 4.5:1 contrast for normal text (3:1 for large text).',
    fix: 'Darken the text or lighten the background for the listed elements until they meet WCAG AA contrast.',
    verification: RETEST_LH,
  },
  'lh.errors-in-console': {
    plain: 'The browser logged errors while loading the page, which can mean something is broken.',
    expected: 'No console errors on page load.',
    fix: 'Open the browser developer console, fix the listed errors (often failed requests or script errors) and remove broken third-party scripts.',
    verification: RETEST_LH,
    status: 'likely',
  },
  'lh.inspector-issues': { plain: 'The browser reported issues (e.g. cookies or security warnings) while loading the page.', fix: 'Review the Issues panel in Chrome DevTools and resolve the listed items.', verification: RETEST_LH, status: 'likely' },
  'lh.deprecations': { plain: 'The page uses browser features that are being removed.', fix: 'Update the code or third-party scripts that use the deprecated features.', verification: RETEST_LH },
  'lh.third-party-cookies': { plain: 'The page uses third-party cookies, which browsers are restricting.', fix: 'Review third-party services that set cookies and move to supported alternatives.', verification: RETEST_LH, status: 'likely' },
  'lh.is-on-https': { plain: 'Some requests are not secure (HTTPS).', expected: 'All requests over HTTPS.', fix: 'Serve the page and all its resources over HTTPS.', verification: RETEST_LH },
  'lh.redirects-http': { plain: 'The http:// address does not redirect to https://.', fix: 'Redirect all http:// traffic to https:// with 301 redirects.', verification: RETEST_LH },
  'lh.target-size': { plain: 'Some buttons or links are too small or too close together to tap easily on a phone.', expected: 'Touch targets at least 24×24 CSS px with spacing.', fix: 'Enlarge or space out the listed tap targets.', verification: RETEST_LH },
  'lh.font-size': { plain: 'Some text is too small to read comfortably on a phone.', fix: 'Use a base font size of at least 16 px on mobile.', verification: RETEST_LH },
  'lh.label': { plain: 'Some form fields have no label.', verification: RETEST_LH },
  'lh.button-name': { plain: 'Some buttons have no accessible name.', verification: RETEST_LH },
  'lh.link-name': { plain: 'Some links have no accessible name.', verification: RETEST_LH },
  'lh.heading-order': { plain: 'Headings are not in a logical order.', verification: RETEST_LH },
  'lh.document-latency-insight': { plain: 'The server takes a while to deliver the first part of the page.', fix: 'Enable compression and caching, avoid redirects and review hosting/server response time.', verification: RETEST_LH },
  'lh.metric.largest-contentful-paint': {
    plain: 'The main content took a long time to appear in Google’s simulated test.',
    expected: 'Largest Contentful Paint ≤ 2.5 s (Google’s "good" threshold).',
    verification: 'Re-test several times and compare with real-user field data where available.',
  },
  'lh.metric.total-blocking-time': {
    plain: 'The page was unresponsive to taps and clicks for a noticeable time while loading (simulated test).',
    expected: 'Total Blocking Time ≤ 200 ms.',
    verification: 'Re-test several times; compare with Interaction to Next Paint field data where available.',
  },
  'lh.metric.cumulative-layout-shift': {
    plain: 'Parts of the page jumped around while loading, which can cause mis-taps.',
    expected: 'Cumulative Layout Shift ≤ 0.1.',
    verification: 'Re-test several times; compare with field data where available.',
  },
  'lh.metric.first-contentful-paint': { plain: 'The first content took a while to appear (simulated test).', expected: 'First Contentful Paint ≤ 1.8 s.', verification: 'Re-test several times.' },
  'lh.metric.speed-index': { plain: 'The page filled in slowly overall (simulated test).', expected: 'Speed Index ≤ 3.4 s.', verification: 'Re-test several times.' },
};

const CATEGORY_PLAIN: Record<FindingCategory, string> = {
  performance: 'Google’s simulated test found something that slows the page down.',
  'best-practices': 'Google’s test found a web best-practice problem.',
  seo: 'This affects how search engines read or list the page.',
  accessibility: 'This makes part of the page harder to use for people with disabilities.',
  mobile: 'This affects how the site works on phones.',
  journey: 'This affects how easily visitors can find information or contact the business.',
  crawl: 'Part of the site could not be reached or fully analysed.',
  technology: 'This relates to the tools and platforms the site uses.',
  security: 'This affects whether connections to the site are secure.',
};

const EFFORT_RATIONALE: Record<Effort, string> = {
  low: 'Usually a content, setting or template change that does not need new features.',
  medium: 'Typically needs developer time across templates or assets, followed by re-testing.',
  high: 'Involves structural changes (e.g. rendering approach or redesign) and broader testing.',
};

const GENERIC_RECOMMENDATIONS = [/^Follow the Lighthouse guidance/];

export function statusFromConfidence(confidence: Confidence, severity: Severity): EvidenceStatus {
  if (confidence === 'high') return 'confirmed';
  if (confidence === 'medium') return 'likely';
  return severity === 'info' ? 'manual-review' : 'hypothesis';
}

export function guideFor(id: string): FindingGuide | undefined {
  return GUIDES[id];
}

type Draft = Omit<Finding, 'priority' | 'plainSummary' | 'effortRationale' | 'verification' | 'status'> & Partial<Pick<Finding, 'plainSummary' | 'effortRationale' | 'verification' | 'status'>>;

/** Fills the reader-facing fields of a finding from its guide (explicit values on the draft win). */
export function enrich<T extends Draft>(f: T): T & Pick<Finding, 'plainSummary' | 'effortRationale' | 'verification' | 'status'> {
  const g = GUIDES[f.id];
  const isLh = f.source === 'lighthouse';
  const lhReported = isLh ? /^Lighthouse reported: (.+)$/.exec(f.evidence[0] ?? '')?.[1] : undefined;
  const lab = isLh && f.id.startsWith('lh.metric.') ? /^Lab value \([a-z]+\): ([^-]+?) -/.exec(f.evidence[0] ?? '')?.[1] : undefined;
  const generic = GENERIC_RECOMMENDATIONS.some((re) => re.test(f.recommendation));
  return {
    ...f,
    recommendation: g?.fix && (generic || !f.recommendation) ? g.fix : f.recommendation,
    plainSummary: f.plainSummary ?? g?.plain ?? (isLh ? `Google’s Lighthouse test flagged: “${f.title.replace(/\.$/, '')}”. ${CATEGORY_PLAIN[f.category]}` : CATEGORY_PLAIN[f.category]),
    ...(f.observed ?? lab ?? lhReported ? { observed: f.observed ?? (lab ? `Lab value: ${lab}` : `Lighthouse reported: ${lhReported}`) } : {}),
    ...(f.expected ?? g?.expected ? { expected: f.expected ?? g?.expected } : {}),
    effortRationale: f.effortRationale ?? g?.effortRationale ?? EFFORT_RATIONALE[f.effort],
    verification: f.verification ?? g?.verification ?? (isLh ? RETEST_LH : RECRAWL),
    status: f.status ?? g?.status ?? statusFromConfidence(f.confidence, f.severity),
  };
}
