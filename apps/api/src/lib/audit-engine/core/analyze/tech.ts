import type { Confidence, TechnologyDetection } from '@chazon/shared';

/**
 * Lightweight, evidence-based technology fingerprinting using only what a
 * public HTTP response reveals (HTML, script/style URLs, meta generator,
 * response headers). Every detection carries its evidence.
 */

export interface TechContext {
  html: string;
  scripts: string[];
  stylesheets: string[];
  headers: Record<string, string>;
  generator: string | null;
}

type Check =
  | { kind: 'generator'; pattern: RegExp; confidence: Confidence }
  | { kind: 'header'; header: string; pattern?: RegExp; confidence: Confidence }
  | { kind: 'asset'; pattern: RegExp; confidence: Confidence; label: string }
  | { kind: 'html'; pattern: RegExp; confidence: Confidence; label: string };

interface Rule {
  name: string;
  category: string;
  checks: Check[];
}

const asset = (pattern: RegExp, label: string, confidence: Confidence = 'high'): Check => ({ kind: 'asset', pattern, label, confidence });
const html = (pattern: RegExp, label: string, confidence: Confidence = 'medium'): Check => ({ kind: 'html', pattern, label, confidence });
const gen = (pattern: RegExp): Check => ({ kind: 'generator', pattern, confidence: 'high' });
const header = (name: string, pattern?: RegExp, confidence: Confidence = 'high'): Check => ({ kind: 'header', header: name, confidence, ...(pattern ? { pattern } : {}) });

const RULES: Rule[] = [
  // CMS / site builders
  { name: 'WordPress', category: 'CMS', checks: [gen(/wordpress/i), asset(/\/wp-(content|includes)\//i, '/wp-content/ or /wp-includes/ asset path'), html(/<link[^>]+rel=["']https:\/\/api\.w\.org\/["']/i, 'WordPress REST API discovery link', 'high')] },
  { name: 'Wix', category: 'Website builder', checks: [gen(/wix\.com/i), asset(/static\.(wixstatic|parastorage)\.com/i, 'Wix static asset host'), header('x-wix-request-id')] },
  { name: 'Squarespace', category: 'Website builder', checks: [gen(/squarespace/i), asset(/(static1|assets)\.squarespace\.com/i, 'Squarespace asset host')] },
  { name: 'Webflow', category: 'Website builder', checks: [gen(/webflow/i), html(/\sdata-wf-(page|site)=/i, 'data-wf-page/data-wf-site attributes', 'high')] },
  { name: 'Drupal', category: 'CMS', checks: [gen(/drupal/i), header('x-drupal-cache'), header('x-generator', /drupal/i), asset(/\/sites\/(default|all)\/(files|themes|modules)\//i, '/sites/default/ asset path', 'medium')] },
  { name: 'Joomla', category: 'CMS', checks: [gen(/joomla/i), asset(/\/media\/(jui|system)\/js\//i, 'Joomla media path', 'medium')] },
  { name: 'Ghost', category: 'CMS', checks: [gen(/ghost/i)] },
  { name: 'HubSpot CMS', category: 'CMS', checks: [gen(/hubspot/i), header('x-hs-cache-config', undefined, 'medium')] },
  { name: 'Framer', category: 'Website builder', checks: [gen(/framer/i), asset(/framerusercontent\.com|framer\.(com|website)\/m\//i, 'Framer asset host')] },
  { name: 'Weebly', category: 'Website builder', checks: [asset(/weebly\.com|editmysite\.com/i, 'Weebly asset host')] },
  { name: 'GoDaddy Website Builder', category: 'Website builder', checks: [gen(/go daddy|godaddy/i), asset(/img1\.wsimg\.com/i, 'GoDaddy asset host', 'medium')] },

  // Commerce
  { name: 'Shopify', category: 'E-commerce platform', checks: [asset(/cdn\.shopify\.com|\/cdn\/shop\//i, 'Shopify CDN asset'), header('x-shopify-stage'), header('x-shopid'), html(/Shopify\.theme\b/, 'Shopify.theme script object', 'high')] },
  { name: 'WooCommerce', category: 'E-commerce platform', checks: [asset(/\/plugins\/woocommerce\//i, 'WooCommerce plugin asset'), html(/class=["'][^"']*\bwoocommerce\b/i, 'woocommerce CSS class', 'medium')] },
  { name: 'Magento / Adobe Commerce', category: 'E-commerce platform', checks: [html(/Magento_|mage\/cookies|"Magento_Ui/i, 'Magento module references', 'high'), asset(/\/static\/version\d+\/frontend\//i, 'Magento static path', 'medium')] },
  { name: 'BigCommerce', category: 'E-commerce platform', checks: [asset(/cdn\d*\.bigcommerce\.com/i, 'BigCommerce CDN asset')] },
  { name: 'PrestaShop', category: 'E-commerce platform', checks: [gen(/prestashop/i), html(/var prestashop\s*=/i, 'prestashop script object', 'high')] },
  { name: 'Ecwid', category: 'E-commerce platform', checks: [asset(/app\.ecwid\.com/i, 'Ecwid script')] },

  // Frontend frameworks
  { name: 'Next.js', category: 'Frontend framework', checks: [html(/<script[^>]+id=["']__NEXT_DATA__["']/i, '__NEXT_DATA__ script', 'high'), asset(/\/_next\/static\//i, '/_next/static/ asset path')] },
  { name: 'Nuxt', category: 'Frontend framework', checks: [html(/window\.__NUXT__|id=["']__nuxt["']/i, '__NUXT__ marker', 'high'), asset(/\/_nuxt\//i, '/_nuxt/ asset path')] },
  { name: 'Gatsby', category: 'Frontend framework', checks: [html(/id=["']___gatsby["']/i, '___gatsby root element', 'high'), gen(/gatsby/i)] },
  { name: 'Angular', category: 'Frontend framework', checks: [html(/\sng-version=["'][\d.]+/i, 'ng-version attribute', 'high')] },
  { name: 'SvelteKit', category: 'Frontend framework', checks: [html(/__sveltekit|data-sveltekit/i, 'SvelteKit markers', 'high')] },
  { name: 'Astro', category: 'Frontend framework', checks: [gen(/astro/i), html(/<astro-island/i, '<astro-island> element', 'high')] },
  { name: 'Remix', category: 'Frontend framework', checks: [html(/window\.__remixContext/i, '__remixContext marker', 'high')] },
  { name: 'React', category: 'JavaScript library', checks: [html(/data-reactroot|data-reactid/i, 'React root attributes', 'medium'), asset(/react(-dom)?(\.production)?(\.min)?\.js/i, 'React script file', 'medium')] },
  { name: 'Vue.js', category: 'JavaScript library', checks: [html(/\sdata-v-[0-9a-f]{6,8}[\s=>]/i, 'Vue scoped-style data-v-* attributes', 'low'), asset(/vue(\.runtime)?(\.global)?(\.prod)?(\.min)?\.js/i, 'Vue script file', 'medium')] },
  { name: 'jQuery', category: 'JavaScript library', checks: [asset(/jquery[.-]?(\d[\w.]*)?(\.min)?\.js/i, 'jQuery script file')] },
  { name: 'Bootstrap', category: 'CSS framework', checks: [asset(/bootstrap(\.bundle)?(\.min)?\.(css|js)/i, 'Bootstrap asset file')] },

  // Analytics & tag management
  { name: 'Google Tag Manager', category: 'Tag manager', checks: [asset(/googletagmanager\.com\/gtm\.js/i, 'gtm.js script'), html(/GTM-[A-Z0-9]{4,10}/, 'GTM container ID in page', 'high')] },
  { name: 'Google Analytics 4 (gtag.js)', category: 'Analytics', checks: [asset(/googletagmanager\.com\/gtag\/js\?id=G-/i, 'gtag.js with G- measurement ID'), html(/gtag\(\s*['"]config['"]\s*,\s*['"]G-[A-Z0-9]+/i, 'gtag config with G- ID', 'high')] },
  { name: 'Google Ads tag', category: 'Advertising tag', checks: [html(/gtag\(\s*['"]config['"]\s*,\s*['"]AW-\d+/i, 'gtag config with AW- ID', 'high'), asset(/googletagmanager\.com\/gtag\/js\?id=AW-/i, 'gtag.js with AW- ID')] },
  { name: 'Meta Pixel', category: 'Advertising tag', checks: [asset(/connect\.facebook\.net\/[^"']*\/fbevents\.js/i, 'fbevents.js script'), html(/fbq\(\s*['"]init['"]/i, "fbq('init') call", 'high')] },
  { name: 'LinkedIn Insight Tag', category: 'Advertising tag', checks: [asset(/snap\.licdn\.com\/li\.lms-analytics/i, 'LinkedIn insight script'), html(/_linkedin_partner_id/i, '_linkedin_partner_id variable', 'high')] },
  { name: 'TikTok Pixel', category: 'Advertising tag', checks: [asset(/analytics\.tiktok\.com/i, 'TikTok analytics script'), html(/ttq\.load\(/i, 'ttq.load() call', 'high')] },
  { name: 'Hotjar', category: 'Analytics', checks: [asset(/static\.hotjar\.com/i, 'Hotjar script'), html(/hjid\s*:\s*\d+/i, 'Hotjar site ID', 'high')] },
  { name: 'Microsoft Clarity', category: 'Analytics', checks: [asset(/clarity\.ms\/tag/i, 'Clarity script'), html(/clarity\.ms\/tag/i, 'Clarity loader snippet', 'high')] },
  { name: 'Plausible', category: 'Analytics', checks: [asset(/plausible\.io\/js\//i, 'Plausible script')] },
  { name: 'Matomo', category: 'Analytics', checks: [asset(/matomo\.js|piwik\.js/i, 'Matomo/Piwik script'), html(/_paq\.push/i, '_paq.push() calls', 'medium')] },
  { name: 'Segment', category: 'Analytics', checks: [asset(/cdn\.segment\.com\/analytics\.js/i, 'Segment analytics.js')] },

  // Chat, CRM-facing and marketing integrations (public scripts only)
  { name: 'HubSpot (tracking/forms)', category: 'Marketing integration', checks: [asset(/js\.hs-scripts\.com|js\.hsforms\.net|js\.hs-analytics\.net/i, 'HubSpot script')] },
  { name: 'Intercom', category: 'Chat widget', checks: [asset(/widget\.intercom\.io|js\.intercomcdn\.com/i, 'Intercom script'), html(/intercomSettings/i, 'intercomSettings object', 'high')] },
  { name: 'Drift', category: 'Chat widget', checks: [asset(/js\.driftt\.com/i, 'Drift script')] },
  { name: 'Zendesk', category: 'Chat widget', checks: [asset(/static\.zdassets\.com/i, 'Zendesk widget script')] },
  { name: 'Tawk.to', category: 'Chat widget', checks: [asset(/embed\.tawk\.to/i, 'Tawk.to script'), html(/embed\.tawk\.to/i, 'Tawk.to loader snippet', 'high')] },
  { name: 'Crisp', category: 'Chat widget', checks: [asset(/client\.crisp\.chat/i, 'Crisp script'), html(/CRISP_WEBSITE_ID/i, 'CRISP_WEBSITE_ID variable', 'high')] },
  { name: 'LiveChat', category: 'Chat widget', checks: [asset(/cdn\.livechatinc\.com/i, 'LiveChat script'), html(/__lc\.license/i, 'LiveChat license variable', 'high')] },
  { name: 'Tidio', category: 'Chat widget', checks: [asset(/code\.tidio\.co/i, 'Tidio script')] },
  { name: 'Mailchimp', category: 'Email marketing', checks: [asset(/chimpstatic\.com|list-manage\.com/i, 'Mailchimp script/form'), html(/list-manage\.com\/subscribe/i, 'Mailchimp signup form action', 'high')] },
  { name: 'Klaviyo', category: 'Email marketing', checks: [asset(/static\.klaviyo\.com|klaviyo\.com\/onsite/i, 'Klaviyo script')] },
  { name: 'Calendly', category: 'Booking integration', checks: [asset(/assets\.calendly\.com/i, 'Calendly embed script'), html(/calendly\.com\//i, 'Calendly link or embed', 'high')] },
  { name: 'Google reCAPTCHA', category: 'Security widget', checks: [asset(/google\.com\/recaptcha|gstatic\.com\/recaptcha/i, 'reCAPTCHA script')] },
  { name: 'Cloudflare Turnstile', category: 'Security widget', checks: [asset(/challenges\.cloudflare\.com\/turnstile/i, 'Turnstile script')] },
  { name: 'Cookiebot', category: 'Consent management', checks: [asset(/consent\.cookiebot\.com/i, 'Cookiebot script')] },
  { name: 'OneTrust', category: 'Consent management', checks: [asset(/cdn\.cookielaw\.org|optanon/i, 'OneTrust script')] },

  // Hosting / CDN signals visible in public response headers
  { name: 'Cloudflare', category: 'CDN / hosting signal', checks: [header('cf-ray'), header('server', /cloudflare/i)] },
  { name: 'Vercel', category: 'CDN / hosting signal', checks: [header('x-vercel-id'), header('server', /vercel/i)] },
  { name: 'Netlify', category: 'CDN / hosting signal', checks: [header('x-nf-request-id'), header('server', /netlify/i)] },
  { name: 'Amazon CloudFront', category: 'CDN / hosting signal', checks: [header('x-amz-cf-id'), header('via', /cloudfront/i)] },
  { name: 'Fastly', category: 'CDN / hosting signal', checks: [header('x-served-by', /cache-/i, 'medium'), header('x-fastly-request-id')] },
  { name: 'Akamai', category: 'CDN / hosting signal', checks: [header('x-akamai-transformed'), header('server', /akamai/i)] },
  { name: 'GitHub Pages', category: 'CDN / hosting signal', checks: [header('server', /github\.com/i), header('x-github-request-id')] },
];

const RANK: Record<Confidence, number> = { low: 1, medium: 2, high: 3 };

export function detectTechnologies(ctx: TechContext): TechnologyDetection[] {
  const html = ctx.html.length > 1_500_000 ? ctx.html.slice(0, 1_500_000) : ctx.html;
  const assets = [...ctx.scripts, ...ctx.stylesheets];
  const detections: TechnologyDetection[] = [];

  for (const rule of RULES) {
    const evidence: string[] = [];
    let best: Confidence | null = null;
    for (const check of rule.checks) {
      let hit: string | null = null;
      if (check.kind === 'generator' && ctx.generator && check.pattern.test(ctx.generator)) {
        hit = `Meta generator tag: "${ctx.generator.slice(0, 80)}"`;
      } else if (check.kind === 'header') {
        const value = ctx.headers[check.header];
        if (value !== undefined && (!check.pattern || check.pattern.test(value))) {
          hit = `Response header "${check.header}"${check.pattern ? `: ${value.slice(0, 60)}` : ' present'}`;
        }
      } else if (check.kind === 'asset') {
        const match = assets.find((a) => check.pattern.test(a));
        if (match) hit = `${check.label}: ${match.slice(0, 120)}`;
      } else if (check.kind === 'html' && check.pattern.test(html)) {
        hit = `Page markup: ${check.label}`;
      }
      if (hit) {
        evidence.push(hit);
        if (!best || RANK[check.confidence] > RANK[best]) best = check.confidence;
      }
    }
    if (best) {
      // Two or more independent signals raise confidence by one level.
      const confidence: Confidence = evidence.length >= 2 && best !== 'high' ? (best === 'low' ? 'medium' : 'high') : best;
      detections.push({ name: rule.name, category: rule.category, confidence, evidence });
    }
  }
  return detections;
}

/** Merges detections from several pages, keeping the strongest confidence and distinct evidence. */
export function mergeDetections(lists: TechnologyDetection[][]): TechnologyDetection[] {
  const byName = new Map<string, TechnologyDetection>();
  for (const list of lists) {
    for (const d of list) {
      const existing = byName.get(d.name);
      if (!existing) {
        byName.set(d.name, { ...d, evidence: [...d.evidence] });
        continue;
      }
      if (RANK[d.confidence] > RANK[existing.confidence]) existing.confidence = d.confidence;
      for (const e of d.evidence) if (!existing.evidence.includes(e) && existing.evidence.length < 4) existing.evidence.push(e);
    }
  }
  return [...byName.values()].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}
