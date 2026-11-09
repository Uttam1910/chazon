import type { Finding, FindingCategory, FixGuide, Implementer } from '@chazon/shared';
import { plural } from '../util/text';

/**
 * Deterministic Fix-it instructions for the most important findings. Templates only add
 * "how to do it" guidance and illustrative snippets with placeholders; the issue, evidence,
 * affected pages and retest step always come from the finding itself. Nothing here is ever
 * applied to the audited website.
 */

/** How many findings get a Fix-it guide / fix kit (highest priority first). */
export const FIX_GUIDE_LIMIT = 40;

interface Template {
  implementer: Implementer;
  steps: (f: Finding) => string[];
  example?: (f: Finding) => FixGuide['example'];
  cautions?: string[];
}

export const CATEGORY_DEPENDENCIES: Record<FindingCategory, string> = {
  performance: 'Developer access to the theme, assets and hosting; a baseline re-test before and after',
  'best-practices': 'Developer access; agreement on which third-party scripts to keep',
  seo: 'CMS or template access',
  accessibility: 'Developer/CMS access; a manual keyboard and screen-reader check after fixes',
  mobile: 'Developer access to templates; testing on real phones',
  journey: 'Agreement with the business on the primary action and contact routes',
  crawl: 'Hosting or CMS access',
  technology: 'Access to the platform’s settings',
  security: 'Hosting/DNS or certificate access',
};

const CATEGORY_CAUTIONS: Partial<Record<FindingCategory, string>> = {
  security: 'HTTPS, redirect and header changes can make the site unreachable if misconfigured - change them when you can test immediately, and keep a way to roll back.',
  performance: 'Lighthouse results vary between runs; re-test several times before and after, and check that images and scripts still work.',
  'best-practices': 'Removing or updating third-party scripts can break features such as chat, forms or analytics - check them afterwards.',
  journey: 'Agree new contact routes with whoever answers enquiries, so every new button or number is actually responded to.',
  accessibility: 'Automated checks find only some accessibility problems; test the changed pages with a keyboard afterwards.',
};
const TEMPLATE_CHANGE_CAUTION = 'Edit a staging copy or take a backup before changing templates or theme files.';

const IMPLEMENTER_NOTE: Record<Implementer, string> = {
  'business-owner': 'A business owner can do this in the website builder or CMS, or decide it and brief whoever maintains the site.',
  'content-editor': 'Anyone who edits pages in the CMS can usually do this without code.',
  developer: 'Needs a web developer (or the site’s hosting/theme settings).',
};

const first = (f: Finding) => f.affected[0] ?? 'the affected page';

const TEMPLATES: Record<string, Template> = {
  'security.no-https': {
    implementer: 'developer',
    cautions: ['Make sure every page and resource works over https:// before forcing the redirect, or visitors may see errors.'],
    steps: () => ['Enable a TLS certificate in the hosting control panel (most hosts offer free Let’s Encrypt certificates).', 'Redirect every http:// URL to its https:// equivalent with a permanent (301) redirect.', 'Update internal links, canonical tags and the sitemap to https:// URLs.'],
  },
  'security.http-not-redirected': {
    implementer: 'developer',
    steps: () => ['Add a permanent (301) redirect from http:// to https:// at the host, CDN or web server.', 'Make sure the redirect keeps the path and query string.'],
    example: () => ({ label: 'Apache (.htaccess) example - check your host’s documentation first', code: 'RewriteEngine On\nRewriteCond %{HTTPS} off\nRewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]' }),
  },
  'security.mixed-content': {
    implementer: 'developer',
    steps: (f) => [`Open ${first(f)} with the browser developer console and note each “Mixed Content” warning.`, 'Change the listed http:// resource URLs to https:// (or host the files on the site).', 'Search the theme and content for hard-coded “http://” links to your own domain.'],
  },
  'seo.missing-title': {
    implementer: 'content-editor',
    steps: (f) => [`Open the page settings for ${first(f)} in the CMS (often under “SEO” or “Page settings”).`, 'Write a unique title that says what the page is about, with the most important words first.', 'Repeat for each affected page.'],
    example: () => ({ label: 'HTML the title produces', code: '<title>Service Name in City | Your Business Name</title>' }),
  },
  'seo.title-length': {
    implementer: 'content-editor',
    steps: () => ['Shorten very long titles to roughly 15–65 characters, keeping the key words first.', 'Expand very short titles so they describe the page.'],
  },
  'seo.missing-description': {
    implementer: 'content-editor',
    steps: (f) => [`Open the SEO settings for ${first(f)}.`, 'Write one or two sentences that summarise the page and why someone should visit it.', 'Make each page’s description unique.'],
    example: () => ({ label: 'HTML the description produces', code: '<meta name="description" content="What the page offers, for whom, and the next step - in one or two sentences.">' }),
  },
  'seo.duplicate-titles': { implementer: 'content-editor', steps: () => ['Give each listed page its own title that reflects its specific content.'] },
  'seo.duplicate-descriptions': { implementer: 'content-editor', steps: () => ['Write a unique meta description for each listed page.'] },
  'seo.missing-h1': {
    implementer: 'content-editor',
    steps: () => ['Make the main heading of each affected page a “Heading 1” in the editor.', 'Keep one H1 per page and use H2/H3 for sections.'],
    example: () => ({ label: 'HTML structure', code: '<h1>Main topic of the page</h1>\n<h2>Section</h2>' }),
  },
  'seo.thin-content': {
    implementer: 'content-editor',
    steps: () => ['Add useful detail to the listed pages: what is offered, who it is for, how it works and common questions.', 'Avoid filler text; write for customers first.'],
  },
  'seo.noindex-start': {
    implementer: 'developer',
    cautions: ['Confirm the noindex is unintentional - some sites hide pages from search on purpose.'],
    steps: () => ['Find where “noindex” is set: the page’s SEO settings, the CMS “discourage search engines” option, or an X-Robots-Tag header.', 'Remove it if the page should appear in search, then request indexing in Google Search Console.'],
  },
  'seo.robots-blocks-all': {
    implementer: 'developer',
    cautions: ['Confirm the block is unintentional - staging or private sites are sometimes blocked on purpose.'],
    steps: () => ['Open /robots.txt and look for “Disallow: /” under “User-agent: *”.', 'Remove or narrow the rule so public pages can be crawled.'],
    example: () => ({ label: 'robots.txt that allows crawling and lists the sitemap', code: 'User-agent: *\nDisallow:\n\nSitemap: https://www.example.com/sitemap.xml' }),
  },
  'seo.sitemap-not-found': {
    implementer: 'developer',
    steps: () => ['Enable the sitemap feature of the CMS or an SEO plugin (most generate /sitemap.xml automatically).', 'Add a “Sitemap:” line to robots.txt and submit the sitemap in Google Search Console.'],
  },
  'seo.sitemap-not-in-robots': {
    implementer: 'developer',
    steps: () => ['Add the sitemap address to /robots.txt.'],
    example: () => ({ label: 'Line to add to robots.txt (use your real sitemap URL)', code: 'Sitemap: https://www.example.com/sitemap.xml' }),
  },
  'seo.broken-internal-links': {
    implementer: 'content-editor',
    steps: (f) => ['For each broken link in the evidence, find the page it appears on.', 'Update the link to the correct page, remove it, or ask a developer to add a 301 redirect from the old URL.', ...(f.affected.length > 5 ? ['Start with links in the header, footer and navigation - they appear on every page.'] : [])],
  },
  'seo.no-structured-data': {
    implementer: 'developer',
    cautions: ['Mark up only accurate information that is also visible on the page; misleading structured data can be ignored or penalised by search engines.'],
    steps: () => ['Add JSON-LD structured data describing the business (e.g. LocalBusiness or Organization) to the home page.', 'Use only real, accurate details that are also visible on the page.', 'Validate with the Schema Markup Validator or Google’s Rich Results Test.'],
    example: () => ({
      label: 'JSON-LD template - replace every placeholder with your real details',
      code: '<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "LocalBusiness",\n  "name": "Your Business Name",\n  "telephone": "+91-XXXXXXXXXX",\n  "address": {\n    "@type": "PostalAddress",\n    "streetAddress": "Street address",\n    "addressLocality": "City",\n    "postalCode": "PIN code",\n    "addressCountry": "IN"\n  },\n  "url": "https://www.example.com/"\n}\n</script>',
    }),
  },
  'seo.missing-open-graph': {
    implementer: 'developer',
    steps: () => ['Enable social sharing tags in the SEO plugin or theme, or add Open Graph tags to the page template.'],
    example: () => ({ label: 'Open Graph tags', code: '<meta property="og:title" content="Page title">\n<meta property="og:description" content="Short description">\n<meta property="og:image" content="https://www.example.com/share-image.jpg">' }),
  },
  'a11y.images-missing-alt': {
    implementer: 'content-editor',
    steps: () => ['In the media library or page editor, add a short description (alt text) to each meaningful image listed.', 'Leave alt text empty only for purely decorative images.'],
    example: () => ({ label: 'HTML', code: '<img src="team.jpg" alt="Our team at the Pune office">' }),
  },
  'a11y.unlabeled-fields': {
    implementer: 'developer',
    steps: () => ['Give every form field a visible label connected to it (placeholder text alone is not a label).'],
    example: () => ({ label: 'HTML', code: '<label for="phone">Phone number</label>\n<input id="phone" name="phone" type="tel" autocomplete="tel">' }),
  },
  'a11y.missing-lang': {
    implementer: 'developer',
    steps: () => ['Set the language attribute on the <html> element in the site template (often a CMS language setting).'],
    example: () => ({ label: 'HTML (use hi, ta, etc. for pages in other languages)', code: '<html lang="en-IN">' }),
  },
  'a11y.zoom-disabled': {
    implementer: 'developer',
    steps: () => ['Remove user-scalable=no and maximum-scale limits from the viewport meta tag in the theme.'],
    example: () => ({ label: 'Viewport tag', code: '<meta name="viewport" content="width=device-width, initial-scale=1">' }),
  },
  'mobile.missing-viewport': {
    implementer: 'developer',
    steps: () => ['Add a responsive viewport meta tag to the <head> of the site template.', 'Check the pages on a real phone afterwards.'],
    example: () => ({ label: 'Viewport tag', code: '<meta name="viewport" content="width=device-width, initial-scale=1">' }),
  },
  'journey.phone-not-clickable': {
    implementer: 'content-editor',
    steps: () => ['Wherever the business number appears (header, footer, contact page), turn it into a link.', 'In most editors: select the number, choose “link”, and enter tel: followed by the number in international format.'],
    example: (f) => ({ label: 'HTML', code: f.expected?.startsWith('<a href="tel:') ? f.expected.replace('…', 'Call us') : '<a href="tel:+91XXXXXXXXXX">Call +91 XXXXX XXXXX</a>' }),
  },
  'journey.no-primary-cta': {
    implementer: 'business-owner',
    steps: () => ['Decide the one action you most want visitors to take (call, WhatsApp, book, request a quote).', 'Add a prominent button with that specific wording near the top of the home page, linked to the right page or contact method.'],
    example: () => ({ label: 'HTML', code: '<a class="button" href="/contact">Request a free quote</a>' }),
  },
  'journey.no-contact-route': {
    implementer: 'business-owner',
    steps: () => ['Choose the contact routes you can respond to (phone, WhatsApp, email, form).', 'Add a Contact link to the main menu and the contact details to the footer of every page.'],
  },
  'journey.contact-not-in-header': {
    implementer: 'content-editor',
    steps: () => ['Add a “Contact” item (or a phone/WhatsApp button) to the header or main menu.'],
  },
  'journey.contact-not-on-start': { implementer: 'content-editor', steps: () => ['Add a contact link or button to the home page header or footer.'] },
  'journey.service-pages-no-next-step': {
    implementer: 'content-editor',
    steps: (f) => [`Open each listed service page (starting with ${first(f)}).`, 'End it with a specific action such as “Request a quote for this service”, linked to the enquiry form or contact page.'],
  },
  'journey.form-no-privacy-link': {
    implementer: 'content-editor',
    steps: () => ['Add a short line under each form: how the enquiry is used, with a link to the privacy policy.'],
    example: () => ({ label: 'HTML', code: '<p>We use your details only to reply to your enquiry. See our <a href="/privacy-policy">privacy policy</a>.</p>' }),
  },
};

const TAG_TEMPLATES: Record<string, Template> = {
  images: {
    implementer: 'developer',
    steps: (f) => ['Compress the listed images and serve modern formats (WebP/AVIF) at the size they are displayed.', 'Lazy-load images below the fold, but not the main (largest) image.', ...(f.affected.length ? [`Start with ${first(f)}.`] : [])],
    example: () => ({ label: 'HTML for a below-the-fold image', code: '<img src="photo-800.webp" srcset="photo-400.webp 400w, photo-800.webp 800w" sizes="(max-width: 600px) 400px, 800px" width="800" height="600" loading="lazy" alt="Description">' }),
  },
  'render-blocking': {
    implementer: 'developer',
    steps: () => ['Load non-critical JavaScript with defer or async.', 'Inline the small amount of CSS needed for the first screen and load the rest without blocking.'],
    example: () => ({ label: 'HTML', code: '<script src="/js/site.js" defer></script>' }),
  },
  'unused-code': {
    implementer: 'developer',
    steps: () => ['Remove plugins, widgets and scripts the site no longer uses.', 'Load page-specific code only on the pages that need it.'],
  },
};

const CATEGORY_IMPLEMENTER: Record<FindingCategory, Implementer> = {
  performance: 'developer',
  'best-practices': 'developer',
  seo: 'developer',
  accessibility: 'developer',
  mobile: 'developer',
  journey: 'content-editor',
  crawl: 'developer',
  technology: 'developer',
  security: 'developer',
};

function templateFor(f: Finding): Template | undefined {
  return TEMPLATES[f.id] ?? (f.tags?.[0] ? TAG_TEMPLATES[f.tags[0]] : undefined);
}

/** What a kit built from automated evidence cannot vouch for. */
function notVerified(f: Finding, pagesInspected: number | undefined, hasExample: boolean): string[] {
  const out = ['This kit was generated from the audit evidence and has not been tested on your website.'];
  if (f.status === 'hypothesis' || f.status === 'manual-review') out.push('The issue itself has not been confirmed - detection was indirect or could not be checked automatically.');
  else if (f.status === 'likely') out.push('Detection is heuristic or based on a single lab run, so confirm the issue before changing anything.');
  if (f.source === 'lighthouse') out.push('Based on one simulated Lighthouse run on the tested device; real visitors may experience different results.');
  else if (pagesInspected) out.push(`Only ${plural(pagesInspected, 'inspected page')} ${pagesInspected === 1 ? 'was' : 'were'} checked; other pages may have the same issue.`);
  if (f.affectedTotal && f.affectedTotal > f.affected.length) {
    out.push(f.affected.length ? `Only ${f.affected.length} of ${f.affectedTotal} affected items are listed.` : `${plural(f.affectedTotal, 'affected item was', 'affected items were')} reported without individual URLs; see the full finding for details.`);
  }
  if (hasExample) out.push('The example is illustrative, uses placeholders and may need changes for your CMS, theme or hosting.');
  return out;
}

export function buildFixGuide(f: Finding, pagesInspected?: number): FixGuide {
  const t = templateFor(f);
  const implementer = t?.implementer ?? CATEGORY_IMPLEMENTER[f.category];
  const confirm = f.status === 'hypothesis' || f.status === 'manual-review' ? [`First confirm the issue is real: ${f.verification}`] : [];
  const steps = t ? t.steps(f) : [f.recommendation];
  const example = t?.example?.(f);
  const cautions = [...(t?.cautions ?? []), ...(CATEGORY_CAUTIONS[f.category] ? [CATEGORY_CAUTIONS[f.category]!] : []), ...(implementer === 'developer' ? [TEMPLATE_CHANGE_CAUTION] : [])];
  return {
    findingId: f.id,
    issue: f.title,
    severity: f.severity,
    evidence: [f.observed, ...f.evidence.slice(0, 3)].filter((x): x is string => Boolean(x)),
    affected: f.affected.slice(0, 8),
    ...(f.observed ? { current: f.observed } : {}),
    fix: f.recommendation,
    steps: [...confirm, ...steps],
    ...(example ? { example } : {}),
    implementer,
    implementerNote: IMPLEMENTER_NOTE[implementer],
    dependencies: [CATEGORY_DEPENDENCIES[f.category], ...(confirm.length ? ['Manual confirmation that the issue is real'] : [])],
    cautions,
    notVerified: notVerified(f, pagesInspected, Boolean(example)),
    retest: f.verification,
    service: f.service,
  };
}

/** Guides for the most important actionable findings (findings arrive sorted by priority). */
export function buildFixGuides(findings: Finding[], pagesInspected?: number, limit = FIX_GUIDE_LIMIT): FixGuide[] {
  return [...findings]
    .filter((f) => f.severity !== 'info')
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit)
    .map((f) => buildFixGuide(f, pagesInspected));
}
