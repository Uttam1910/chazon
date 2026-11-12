import * as cheerio from 'cheerio';
import type { AnyNode, Element } from 'domhandler';
import type { PolicyKind, RedirectHop, TechnologyDetection } from '@chazon/shared';
import { isSameSite, normaliseUrl } from '../crawl/urls';
import { clean, truncate, uniq } from '../util/text';
import { detectTechnologies } from './tech';

/**
 * Extracts everything the audit needs from one HTML document. The HTML is
 * parsed as untrusted data (parse5 via cheerio tolerates malformed markup);
 * only short, plain-text excerpts leave this module - never markup.
 */

export interface LinkRef {
  href: string;
  text: string;
  inNav: boolean;
}

export interface FormInfo {
  kind: 'enquiry' | 'search' | 'newsletter' | 'login' | 'other';
  fieldCount: number;
  unlabeled: string[];
  /** Client-side hints only (the form is never submitted). */
  hints: { requiredFields: number; typedFields: number; hasLiveRegion: boolean; hasSuccessMessage: boolean };
}

export interface PageData {
  url: string;
  finalUrl: string;
  status: number;
  contentType: string;
  bytes: number;
  truncated: boolean;
  responseTimeMs: number;
  redirects: RedirectHop[];
  headers: Record<string, string>;
  source: 'start' | 'link' | 'sitemap';

  title: string | null;
  titleCount: number;
  description: string | null;
  descriptionCount: number;
  h1: string[];
  headings: { level: number; text: string }[];
  canonicalRaw: string | null;
  canonical: string | null;
  canonicalCount: number;
  metaRobots: string | null;
  xRobotsTag: string | null;
  noindex: boolean;
  nofollow: boolean;
  lang: string | null;
  viewport: string | null;
  og: Record<string, string>;
  twitterCard: string | null;
  jsonLd: { valid: boolean; types: string[]; error?: string }[];
  microdataTypes: string[];
  generator: string | null;

  images: { total: number; missingAltCount: number; missingAlt: string[] };
  internalLinks: LinkRef[];
  externalLinks: LinkRef[];
  mailto: string[];
  tel: string[];

  forms: FormInfo[];
  embeddedForms: string[];
  a11y: {
    unlabeledFields: string[];
    unnamedButtons: string[];
    unnamedLinks: string[];
    positiveTabindex: number;
    headingSkips: string[];
  };
  nav: { present: boolean; links: { text: string; href: string }[] };
  ctas: { text: string; href: string | null; strength: 'primary' | 'secondary' }[];
  contactLinks: { text: string; href: string }[];
  whatsapp: string[];
  booking: { text: string; href: string; provider: string | null }[];
  social: { network: string; url: string }[];
  ecommerce: { signals: string[]; prices: string[]; cartLinks: string[]; checkoutLinks: string[]; isProductPage: boolean };
  address: string[];
  openingHours: string[];
  /** Contact link, email, phone or WhatsApp link inside the header / navigation. */
  contactInHeader: boolean;
  /** Phone-like numbers in visible text next to words such as "call" or "phone" (heuristic). */
  phoneText: string[];
  trust: { signals: string[]; privacyLink: string | null; aboutLink: string | null };
  /** Customer-facing business signals (presence only). */
  business: {
    policyLinks: { kind: PolicyKind; href: string; text: string }[];
    paymentMethods: string[];
    mapLinks: string[];
    pinCodes: string[];
    gstin: boolean;
    indianPhones: string[];
  };
  /** http:// sub-resources (images, scripts, styles, frames, media) on an https:// page. */
  insecureResources: string[];
  /** Words of visible text (scripts, styles and templates excluded). */
  wordCount: number;
  bodyTextLength: number;
  scriptCount: number;
  likelyClientRendered: boolean;
  technologies: TechnologyDetection[];
  techHealth: {
    hasDoctype: boolean;
    hasCharset: boolean;
    headBlockingScripts: number;
    stylesheetCount: number;
    externalScriptCount: number;
    imagesMissingDimensions: number;
    unsafeBlankLinks: number;
    hasMainLandmark: boolean;
    hasResponsiveMedia: boolean;
  };
}

export interface PageInput {
  html: string;
  url: string;
  finalUrl: string;
  status: number;
  contentType: string;
  bytes: number;
  truncated: boolean;
  responseTimeMs: number;
  redirects: RedirectHop[];
  headers: Record<string, string>;
  source: PageData['source'];
  siteDomain: string;
}

const CTA_PRIMARY =
  /\b(contact us|contact|get in touch|get (a |your )?(free )?(quote|estimate|proposal)|request (a |an )?(quote|call|callback|demo|consultation|appointment)|book( now| online| a| an|ing)?|schedule|buy( now)?|shop( now| the)?|order( now| online)?|add to (cart|basket|bag)|call (us|now|today)|enquire|inquire|get started|start (now|free|your|here)|sign up|subscribe|join( now| us)?|donate|apply( now)?|free (trial|consultation|quote)|hire us|talk to (us|an expert|sales)|reserve|let'?s talk|send (a )?message|chat with us|whatsapp)\b/i;
const CTA_SECONDARY = /\b(learn more|read more|find out more|discover|explore|see (more|how|our)|view (more|all|our)|download)\b/i;
const CONTACT_HREF = /(contact|enquir|inquir|get-in-touch|kontakt|contacto|reach-us)/i;
const CONTACT_TEXT = /\b(contact|get in touch|enquir|inquir|reach us)\b/i;
const WHATSAPP = /^whatsapp:|\/\/(?:wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com|web\.whatsapp\.com)\b/i;

const BOOKING_PROVIDERS: [RegExp, string][] = [
  [/calendly\.com/i, 'Calendly'],
  [/acuityscheduling\.com|\.as\.me\b/i, 'Acuity Scheduling'],
  [/booksy\.com/i, 'Booksy'],
  [/fresha\.com/i, 'Fresha'],
  [/setmore\.com/i, 'Setmore'],
  [/simplybook\./i, 'SimplyBook.me'],
  [/opentable\./i, 'OpenTable'],
  [/resy\.com/i, 'Resy'],
  [/sevenrooms\.com/i, 'SevenRooms'],
  [/exploretock\.com/i, 'Tock'],
  [/squareup\.com\/appointments|book\.squareup\.com|square\.site\/book/i, 'Square Appointments'],
  [/mindbodyonline\.com/i, 'Mindbody'],
  [/vagaro\.com/i, 'Vagaro'],
  [/zocdoc\.com/i, 'Zocdoc'],
  [/youcanbook\.me/i, 'YouCanBookMe'],
  [/tidycal\.com/i, 'TidyCal'],
  [/\bcal\.com\//i, 'Cal.com'],
  [/savvycal\.com/i, 'SavvyCal'],
  [/meetings\.hubspot\.com/i, 'HubSpot Meetings'],
  [/outlook\.office365\.com\/(owa\/calendar|book)|bookings\.cloud\.microsoft/i, 'Microsoft Bookings'],
  [/booking\.com\/hotel/i, 'Booking.com'],
];
const BOOKING_TEXT =
  /\b(book (now|online|an? (appointment|table|call|consultation|session|class|room|demo))|make a (booking|reservation|appointment)|reserve (a table|now|online)|schedule (an? )?(appointment|call|consultation|demo))\b/i;

const SOCIAL: [RegExp, string][] = [
  [/(^|\.)facebook\.com$|(^|\.)fb\.com$/i, 'Facebook'],
  [/(^|\.)instagram\.com$/i, 'Instagram'],
  [/(^|\.)linkedin\.com$/i, 'LinkedIn'],
  [/(^|\.)(twitter|x)\.com$/i, 'X (Twitter)'],
  [/(^|\.)youtube\.com$|^youtu\.be$/i, 'YouTube'],
  [/(^|\.)tiktok\.com$/i, 'TikTok'],
  [/(^|\.)pinterest\.[a-z.]+$/i, 'Pinterest'],
  [/(^|\.)threads\.(net|com)$/i, 'Threads'],
  [/(^|\.)snapchat\.com$/i, 'Snapchat'],
];
const SHARE_LINK = /sharer|\/share\b|share\?|intent\/(tweet|post)|shareArticle|pin\/create|\/tr\?|\/plugins\/|\/dialog\//i;

const EMBEDDED_FORMS: [RegExp, string][] = [
  [/typeform\.com/i, 'Typeform'],
  [/docs\.google\.com\/forms|forms\.gle/i, 'Google Forms'],
  [/jotform\./i, 'Jotform'],
  [/hsforms\.(net|com)|share\.hsforms|forms\.hubspot/i, 'HubSpot Forms'],
  [/forms\.office\.com|forms\.microsoft\.com/i, 'Microsoft Forms'],
  [/tally\.so/i, 'Tally'],
  [/wufoo\.com/i, 'Wufoo'],
  [/cognitoforms\.com/i, 'Cognito Forms'],
  [/formstack\.com/i, 'Formstack'],
  [/paperform\.co/i, 'Paperform'],
];

const PRIVACY_LINK = /privacy|data-protection|datenschutz|gdpr|\bpopia\b/i;
const ABOUT_LINK = /\/(about|about-us|who-we-are|our-story|team|company)(\/|$)/i;
const TESTIMONIAL_ATTR = /testimonial|review|trustpilot|feefo|yotpo|judge-?me|stamped|reviews-io|okendo|rating/i;
const TESTIMONIAL_HEADING = /\b(testimonials?|what (our |my )?(clients|customers|patients|guests|students) (say|think)|customer reviews|client reviews|reviews|kind words|case stud(y|ies))\b/i;
// The second alternative is a 10-digit Indian mobile number written without a prefix (e.g. "98765 43210").
const PHONE_TEXT = /\b(?:tel|telephone|phone|call(?: us)?|mobile|cell|whatsapp|ph)\b[\s.:]{0,4}((?:\+|00|0)[\d\s().-]{7,18}\d|[6-9]\d{4}[\s-]?\d{5}\b)/gi;

/** Policy / help links, matched against the URL path or the link text. First match wins. */
const POLICY_LINKS: [PolicyKind, RegExp, RegExp][] = [
  ['grievance', /grievance/i, /\bgrievance/i],
  ['returns', /return|refund|exchange|cancell?ation/i, /\b(returns?|refunds?|exchanges?|cancell?ation)\b/i],
  ['shipping', /shipping|delivery/i, /\b(shipping|delivery)\b/i],
  ['payment', /payment|pay-?options|how-to-pay/i, /\b(payment (options|methods|policy|information)|how to pay)\b/i],
  ['terms', /terms|conditions|\btos\b/i, /\b(terms|conditions)\b/i],
  ['faq', /\bfaqs?\b|frequently-asked/i, /\b(faqs?|frequently asked)\b/i],
  ['support', /support|help-?(centre|center|desk)?(\/|$)|customer-(care|service)/i, /\b(support|help (centre|center|desk)|customer (care|service))\b/i],
];
/** Payment methods named in visible text (or checkout scripts). Presence only. */
const PAYMENT_TEXT: [RegExp, string][] = [
  [/\bUPI\b/, 'UPI'],
  [/\bcash on delivery\b|\bCOD (available|option)/i, 'Cash on delivery'],
  [/\bnet ?banking\b/i, 'Net banking'],
  [/\b(credit|debit) cards?\b/i, 'Credit / debit cards'],
  [/\bEMI\b/, 'EMI'],
  [/\brazorpay\b/i, 'Razorpay'],
  [/\bpaytm\b/i, 'Paytm'],
  [/\bphonepe\b/i, 'PhonePe'],
  [/\b(google pay|gpay)\b/i, 'Google Pay'],
  [/\bpayu\b/i, 'PayU'],
  [/\bcashfree\b/i, 'Cashfree'],
  [/\bccavenue\b/i, 'CCAvenue'],
  [/\binstamojo\b/i, 'Instamojo'],
  [/\bpaypal\b/i, 'PayPal'],
];
const PAYMENT_SCRIPTS: [RegExp, string][] = [
  [/checkout\.razorpay\.com/i, 'Razorpay'],
  [/paytm(payments)?\.(in|com)/i, 'Paytm'],
  [/cashfree\.com/i, 'Cashfree'],
  [/ccavenue\.com/i, 'CCAvenue'],
  [/js\.stripe\.com/i, 'Stripe'],
  [/paypal\.com\/sdk/i, 'PayPal'],
];
const MAP_URL = /(^|\.)google\.[a-z.]+\/maps|maps\.google\.|maps\.app\.goo\.gl|goo\.gl\/maps|bing\.com\/maps|openstreetmap\.org|maps\.apple\.com|mappls\.com/i;
/** A six-digit PIN code next to an address word or "India", in either order. */
const PIN_NEAR_WORD = /(?:\bpin(?:\s?code)?\b|\bpincode\b|\bindia\b)[^\d]{0,25}\b([1-9]\d{2}\s?\d{3})\b|\b([1-9]\d{2}\s?\d{3})\b[\s,.-]{0,6}india\b/gi;
const PIN = /\b([1-9]\d{2}\s?\d{3})\b/;
const GSTIN = /\bGSTIN\b|\bGST\s?(No|Number|Reg)/i;
/** +91 followed by 10 digits, or a bare 10-digit Indian mobile number (starts with 6-9). */
export function isIndianPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  if (/^\s*\+91/.test(raw) || /^0091/.test(digits)) return true;
  return /^(91|0)?[6-9]\d{9}$/.test(digits);
}
const SUCCESS_HINT = /success|thank|confirmation|form-message|form-response|wpcf7-response/i;

const CURRENCY = /(?:[$£€¥₹₨]|\b(?:USD|EUR|GBP|AUD|CAD|NZD|INR|NPR|Rs\.?|AED|SGD|ZAR)\b)\s?\d[\d,.]*/;
const NON_LABEL_INPUTS = new Set(['hidden', 'submit', 'button', 'reset', 'image']);

function typesFromJsonLd(value: unknown, out: Set<string>, depth = 0): void {
  if (depth > 8 || value == null) return;
  if (Array.isArray(value)) {
    for (const v of value) typesFromJsonLd(v, out, depth + 1);
    return;
  }
  if (typeof value !== 'object') return;
  const obj = value as Record<string, unknown>;
  const t = obj['@type'];
  if (typeof t === 'string') out.add(t);
  else if (Array.isArray(t)) t.filter((x): x is string => typeof x === 'string').forEach((x) => out.add(x));
  for (const [k, v] of Object.entries(obj)) {
    if (k !== '@context' && typeof v === 'object') typesFromJsonLd(v, out, depth + 1);
  }
}

function collectLocalInfo(value: unknown, address: Set<string>, hours: Set<string>, depth = 0): void {
  if (depth > 8 || value == null || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const v of value) collectLocalInfo(v, address, hours, depth + 1);
    return;
  }
  const obj = value as Record<string, unknown>;
  const addr = obj.address;
  if (typeof addr === 'string') address.add(truncate(addr, 160));
  else if (addr && typeof addr === 'object' && !Array.isArray(addr)) {
    const a = addr as Record<string, unknown>;
    const parts = ['streetAddress', 'addressLocality', 'addressRegion', 'postalCode', 'addressCountry']
      .map((k) => (typeof a[k] === 'string' ? (a[k] as string) : null))
      .filter(Boolean);
    if (parts.length) address.add(truncate(parts.join(', '), 160));
  }
  const oh = obj.openingHours;
  if (typeof oh === 'string') hours.add(truncate(oh, 120));
  else if (Array.isArray(oh)) oh.filter((x): x is string => typeof x === 'string').forEach((x) => hours.add(truncate(x, 120)));
  const spec = obj.openingHoursSpecification;
  if (Array.isArray(spec)) {
    for (const s of spec.slice(0, 7)) {
      if (!s || typeof s !== 'object') continue;
      const r = s as Record<string, unknown>;
      const day = Array.isArray(r.dayOfWeek) ? r.dayOfWeek.join('/') : r.dayOfWeek;
      if (typeof r.opens === 'string') hours.add(truncate(`${String(day ?? '').replace(/https?:\/\/schema\.org\//g, '')} ${r.opens}–${String(r.closes ?? '')}`.trim(), 120));
    }
  }
  for (const [k, v] of Object.entries(obj)) {
    if (k !== 'address' && typeof v === 'object') collectLocalInfo(v, address, hours, depth + 1);
  }
}

export function analyzePage(input: PageInput): PageData {
  const $ = cheerio.load(input.html);
  const base = input.finalUrl;

  // Text helpers ------------------------------------------------------------
  let idIndex: Map<string, Element> | null = null;
  const labelledByText = (ids: string | undefined): string => {
    if (!ids) return '';
    if (!idIndex) {
      idIndex = new Map();
      for (const el of $('[id]').toArray()) {
        const id = el.attribs.id;
        if (id && !idIndex.has(id)) idIndex.set(id, el);
      }
    }
    const index = idIndex;
    return ids
      .split(/\s+/)
      .map((id) => {
        const el = index.get(id);
        return el ? $(el).text() : '';
      })
      .join(' ');
  };
  // Like .text() but separates child elements with spaces ("<span>A</span><span>B</span>" -> "A B").
  const spacedText = (el: cheerio.Cheerio<AnyNode>): string => {
    const walk = (node: AnyNode): string => {
      if (node.type === 'text') return (node as unknown as { data: string }).data;
      if (node.type === 'script' || node.type === 'style') return '';
      const children = (node as { children?: AnyNode[] }).children;
      return children ? children.map(walk).join(' ') : '';
    };
    return el.toArray().map(walk).join(' ');
  };
  const accessibleName = (el: cheerio.Cheerio<Element>): string => {
    const aria = el.attr('aria-label') ?? '';
    if (aria.trim()) return aria;
    const lb = labelledByText(el.attr('aria-labelledby'));
    if (lb.trim()) return lb;
    const text = spacedText(el);
    if (text.trim()) return text;
    const imgAlt = el.find('img[alt]').map((_, i) => $(i).attr('alt') ?? '').get().join(' ');
    if (imgAlt.trim()) return imgAlt;
    const svgTitle = el.find('svg title').text();
    if (svgTitle.trim()) return svgTitle;
    return el.attr('title') ?? el.attr('value') ?? '';
  };
  const describe = (el: cheerio.Cheerio<Element>): string => {
    const tag = (el.get(0) as Element | undefined)?.tagName ?? 'element';
    const attrs = ['type', 'name', 'id', 'class', 'href']
      .map((a) => {
        const v = el.attr(a);
        return v ? `${a}="${truncate(v.trim(), 40)}"` : null;
      })
      .filter(Boolean)
      .slice(0, 3);
    return `<${tag}${attrs.length ? ` ${attrs.join(' ')}` : ''}>`;
  };

  // Head metadata -------------------------------------------------------------
  const titles = $('title').filter((_, el) => $(el).closest('svg').length === 0);
  const descriptions = $('meta[name="description" i]');
  const canonicals = $('link[rel~="canonical" i]');
  const canonicalRaw = canonicals.first().attr('href')?.trim() ?? null;
  const metaRobots = [$('meta[name="robots" i]').attr('content'), $('meta[name="googlebot" i]').attr('content')]
    .filter(Boolean)
    .join(', ') || null;
  const xRobotsTag = input.headers['x-robots-tag'] ?? null;
  const robotsText = `${metaRobots ?? ''} ${xRobotsTag ?? ''}`.toLowerCase();

  const og: Record<string, string> = {};
  $('meta[property^="og:" i]').each((_, el) => {
    const p = $(el).attr('property')?.toLowerCase();
    const c = clean($(el).attr('content'), 300);
    if (p && c && Object.keys(og).length < 20) og[p] = c;
  });

  const jsonLd: PageData['jsonLd'] = [];
  const addresses = new Set<string>();
  const hours = new Set<string>();
  $('script[type="application/ld+json" i]').each((_, el) => {
    if (jsonLd.length >= 20) return;
    const raw = $(el).text().trim();
    if (!raw) return;
    try {
      const parsed: unknown = JSON.parse(raw.length > 300_000 ? raw.slice(0, 300_000) : raw);
      const types = new Set<string>();
      typesFromJsonLd(parsed, types);
      collectLocalInfo(parsed, addresses, hours);
      jsonLd.push({ valid: true, types: [...types].slice(0, 20) });
    } catch (err) {
      jsonLd.push({ valid: false, types: [], error: truncate(err instanceof Error ? err.message : 'Invalid JSON', 160) });
    }
  });
  const microdataTypes = uniq(
    $('[itemtype]')
      .map((_, el) => ($(el).attr('itemtype') ?? '').split(/\s+/).map((t) => t.split('/').pop() ?? ''))
      .get()
      .filter(Boolean),
  ).slice(0, 20);

  // Headings ------------------------------------------------------------------
  const headings: PageData['headings'] = [];
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    if (headings.length >= 200) return;
    headings.push({ level: Number(el.tagName.slice(1)), text: clean($(el).text(), 120) ?? '' });
  });
  const headingSkips: string[] = [];
  for (let i = 1; i < headings.length; i++) {
    const prev = headings[i - 1]!.level;
    const cur = headings[i]!.level;
    if (cur > prev + 1 && headingSkips.length < 10) headingSkips.push(`h${prev} → h${cur} ("${truncate(headings[i]!.text, 60)}")`);
  }

  // Images --------------------------------------------------------------------
  const missingAlt: string[] = [];
  let missingAltCount = 0;
  const imgs = $('img');
  imgs.each((_, el) => {
    const img = $(el);
    if (img.attr('alt') !== undefined) return;
    if (img.attr('role') === 'presentation' || img.attr('role') === 'none' || img.attr('aria-hidden') === 'true') return;
    missingAltCount++;
    const src = img.attr('src') ?? img.attr('data-src') ?? '';
    if (missingAlt.length < 20) missingAlt.push(truncate(normaliseUrl(src, base) ?? (src || describe(img)), 200));
  });

  // Links ---------------------------------------------------------------------
  const internalLinks: LinkRef[] = [];
  const externalLinks: LinkRef[] = [];
  const mailto = new Set<string>();
  const tel = new Set<string>();
  const whatsapp = new Set<string>();
  const contactLinks: PageData['contactLinks'] = [];
  const booking: PageData['booking'] = [];
  const social = new Map<string, { network: string; url: string }>();
  const cartLinks = new Set<string>();
  const checkoutLinks = new Set<string>();
  const unnamedLinks: string[] = [];
  const seenLinks = new Set<string>();
  let contactInHeader = false;
  let privacyLink: string | null = null;
  let aboutLink: string | null = null;
  const policyLinks: PageData['business']['policyLinks'] = [];
  const mapLinks = new Set<string>();
  const inHeader = (el: cheerio.Cheerio<Element>) => el.closest('header, nav, [role="banner"], [role="navigation"]').length > 0;

  $('a[href], area[href]').each((_, el) => {
    const a = $(el);
    const rawHref = (a.attr('href') ?? '').trim();
    const text = clean(accessibleName(a), 100) ?? '';
    if (!text && el.tagName === 'a' && unnamedLinks.length < 15) unnamedLinks.push(describe(a));
    const lower = rawHref.toLowerCase();
    if (/^(mailto|tel):/.test(lower) || WHATSAPP.test(rawHref)) {
      if (!contactInHeader && inHeader(a)) contactInHeader = true;
    }
    if (lower.startsWith('mailto:')) {
      const email = decodeURIComponent(rawHref.slice(7).split('?')[0] ?? '').trim();
      if (email && mailto.size < 10) mailto.add(truncate(email, 100));
      return;
    }
    if (lower.startsWith('tel:')) {
      const phone = decodeURIComponent(rawHref.slice(4)).trim();
      if (phone && tel.size < 10) tel.add(truncate(phone, 40));
      return;
    }
    if (WHATSAPP.test(rawHref)) {
      if (whatsapp.size < 5) whatsapp.add(truncate(rawHref, 200));
      return;
    }
    const href = normaliseUrl(rawHref, base);
    if (!href) return;
    const inNav = a.closest('nav, [role="navigation"], header').length > 0;
    const key = `${href}|${inNav}`;
    if (!seenLinks.has(key)) {
      seenLinks.add(key);
      const ref = { href, text, inNav };
      if (isSameSite(href, input.siteDomain)) {
        if (internalLinks.length < 500) internalLinks.push(ref);
      } else if (externalLinks.length < 300) externalLinks.push(ref);
    }
    const url = new URL(href);
    if ((CONTACT_HREF.test(url.pathname) || CONTACT_TEXT.test(text)) && contactLinks.length < 10 && !contactLinks.some((c) => c.href === href)) {
      contactLinks.push({ text, href });
    }
    if ((CONTACT_HREF.test(url.pathname) || CONTACT_TEXT.test(text)) && !contactInHeader && inHeader(a)) contactInHeader = true;
    if (!privacyLink && (PRIVACY_LINK.test(url.pathname) || /\bprivacy\b/i.test(text))) privacyLink = href;
    if (!aboutLink && isSameSite(href, input.siteDomain) && ABOUT_LINK.test(url.pathname)) aboutLink = href;
    if (MAP_URL.test(href)) {
      if (mapLinks.size < 5) mapLinks.add(href);
    } else {
      const kind = POLICY_LINKS.find(([, path, txt]) => (isSameSite(href, input.siteDomain) && path.test(url.pathname)) || txt.test(text))?.[0];
      if (kind && policyLinks.filter((p) => p.kind === kind).length < 3 && !policyLinks.some((p) => p.href === href)) policyLinks.push({ kind, href, text: truncate(text, 80) });
    }
    const provider = BOOKING_PROVIDERS.find(([re]) => re.test(href))?.[1] ?? null;
    if ((provider || BOOKING_TEXT.test(text)) && booking.length < 10 && !booking.some((b) => b.href === href)) {
      booking.push({ text, href, provider });
    }
    const network = SOCIAL.find(([re]) => re.test(url.hostname))?.[1];
    if (network && !SHARE_LINK.test(href) && url.pathname.length > 1 && social.size < 15) {
      const clean = `${url.origin}${url.pathname}`.replace(/\/$/, '');
      social.set(clean, { network, url: clean });
    }
    if (/\/(cart|basket|bag)(\/|$)/i.test(url.pathname) && cartLinks.size < 5) cartLinks.add(href);
    if (/\/checkout(s)?(\/|$)/i.test(url.pathname) && checkoutLinks.size < 5) checkoutLinks.add(href);
  });

  // Navigation ----------------------------------------------------------------
  const navEls = $('nav, [role="navigation"]');
  const navLinks = uniq(
    navEls
      .find('a[href]')
      .map((_, el) => {
        const href = normaliseUrl($(el).attr('href') ?? '', base);
        const text = clean(spacedText($(el)), 60);
        return href && text ? JSON.stringify({ text, href }) : null;
      })
      .get()
      .filter((x): x is string => Boolean(x)),
  )
    .slice(0, 40)
    .map((s) => JSON.parse(s) as { text: string; href: string });

  // CTAs ----------------------------------------------------------------------
  const ctas: PageData['ctas'] = [];
  const ctaSeen = new Set<string>();
  $('a[href], button, input[type="submit" i], input[type="button" i], [role="button"]').each((_, el) => {
    if (ctas.length >= 20) return;
    const node = $(el);
    const text = clean(accessibleName(node), 80);
    if (!text || text.length > 60) return;
    const strength = CTA_PRIMARY.test(text) ? 'primary' : CTA_SECONDARY.test(text) ? 'secondary' : null;
    if (!strength) return;
    const k = text.toLowerCase();
    if (ctaSeen.has(k)) return;
    ctaSeen.add(k);
    const rawHref = node.attr('href');
    const href = rawHref ? (normaliseUrl(rawHref, base) ?? (/^(tel|mailto):/i.test(rawHref) ? truncate(rawHref, 80) : null)) : null;
    ctas.push({ text, href, strength });
  });

  // Buttons without names ---------------------------------------------------------
  const unnamedButtons: string[] = [];
  $('button, [role="button"], input[type="button" i]').each((_, el) => {
    const b = $(el);
    if (b.attr('aria-hidden') === 'true') return;
    if (!clean(accessibleName(b)) && unnamedButtons.length < 15) unnamedButtons.push(describe(b));
  });

  // Forms -------------------------------------------------------------------------
  const labelFor = new Set($('label[for]').map((_, el) => $(el).attr('for') ?? '').get());
  const isLabelled = (f: cheerio.Cheerio<Element>): boolean => {
    if ((f.attr('aria-label') ?? '').trim()) return true;
    if (labelledByText(f.attr('aria-labelledby')).trim()) return true;
    if ((f.attr('title') ?? '').trim()) return true;
    const id = f.attr('id');
    if (id && labelFor.has(id)) return true;
    return f.closest('label').length > 0;
  };
  const fieldsIn = (scope: cheerio.Cheerio<AnyNode>) =>
    scope.find('input, select, textarea').filter((_, el) => {
      const type = ($(el).attr('type') ?? 'text').toLowerCase();
      return !(el.tagName === 'input' && NON_LABEL_INPUTS.has(type));
    });

  const unlabeledFields: string[] = [];
  const forms: FormInfo[] = [];
  $('form').each((_, el) => {
    if (forms.length >= 20) return;
    const form = $(el);
    const fields = fieldsIn(form);
    const unlabeled: string[] = [];
    fields.each((__, f) => {
      const field = $(f);
      if (!isLabelled(field)) {
        const placeholder = field.attr('placeholder') ? ' (placeholder only)' : '';
        unlabeled.push(`${describe(field)}${placeholder}`);
      }
    });
    const types = fields.map((__, f) => ($(f).attr('type') ?? f.tagName).toLowerCase()).get();
    const names = fields.map((__, f) => ($(f).attr('name') ?? '').toLowerCase()).get();
    let kind: FormInfo['kind'] = 'other';
    if (types.includes('password')) kind = 'login';
    else if (form.attr('role') === 'search' || types.includes('search') || (fields.length === 1 && names.some((n) => ['q', 's', 'search', 'query', 'keyword'].includes(n)))) kind = 'search';
    else if (types.includes('textarea') || ((types.includes('email') || types.includes('tel')) && fields.length >= 3)) kind = 'enquiry';
    else if (fields.length <= 2 && types.includes('email')) kind = 'newsletter';
    const requiredFields = fields.filter((__, f) => $(f).attr('required') !== undefined || $(f).attr('aria-required') === 'true').length;
    const typedFields = fields.filter((__, f) => /^(email|tel|url|number|date)$/i.test($(f).attr('type') ?? '') || $(f).attr('pattern') !== undefined || $(f).attr('inputmode') !== undefined).length;
    const hasLiveRegion = form.find('[aria-live], [role="alert"], [role="status"]').length > 0;
    const hasSuccessMessage = form.find('[class], [id]').filter((__, n) => SUCCESS_HINT.test(`${$(n).attr('class') ?? ''} ${$(n).attr('id') ?? ''}`)).length > 0;
    forms.push({ kind, fieldCount: fields.length, unlabeled: unlabeled.slice(0, 10), hints: { requiredFields, typedFields, hasLiveRegion, hasSuccessMessage } });
    unlabeledFields.push(...unlabeled);
  });
  // Fields outside forms (common in JS-driven UIs).
  fieldsIn($('body').first() as cheerio.Cheerio<AnyNode>).each((_, f) => {
    const field = $(f);
    if (field.closest('form').length) return;
    if (!isLabelled(field) && unlabeledFields.length < 30) unlabeledFields.push(describe(field));
  });

  const embeddedForms = uniq(
    [
      ...$('iframe[src]').map((_, el) => $(el).attr('src') ?? '').get(),
      ...$('script[src]').map((_, el) => $(el).attr('src') ?? '').get(),
    ]
      .map((src) => EMBEDDED_FORMS.find(([re]) => re.test(src))?.[1])
      .filter((x): x is string => Boolean(x)),
  );

  // E-commerce signals ----------------------------------------------------------
  const ldTypes = new Set(jsonLd.flatMap((j) => j.types));
  const ecomSignals: string[] = [];
  const isProductPage = ldTypes.has('Product') || og['og:type']?.toLowerCase() === 'product' || microdataTypes.includes('Product');
  if (ldTypes.has('Product')) ecomSignals.push('Product structured data (JSON-LD)');
  if (microdataTypes.includes('Product')) ecomSignals.push('Product microdata');
  if (og['og:type']?.toLowerCase() === 'product') ecomSignals.push('og:type = product');
  const addToCart = $('button, input[type="submit" i], a').filter((_, el) => /add to (cart|basket|bag)/i.test(accessibleName($(el)))).length;
  if (addToCart || $('form[action*="cart/add" i], [name="add-to-cart"]').length) ecomSignals.push('Add-to-cart control');
  const prices = new Set<string>();
  $('[itemprop="price"]').each((_, el) => {
    const v = clean($(el).attr('content') ?? $(el).text(), 40);
    if (v && prices.size < 5) prices.add(v);
  });
  $('[class*="price" i]').each((_, el) => {
    if (prices.size >= 5) return;
    const t = clean($(el).text(), 60) ?? '';
    const m = CURRENCY.exec(t);
    if (m) prices.add(m[0]);
  });
  if (prices.size) ecomSignals.push('Visible price text');

  // Address / opening hours -----------------------------------------------------
  $('address').each((_, el) => {
    const t = clean($(el).text(), 160);
    if (t && addresses.size < 4) addresses.add(t);
  });
  $('[itemprop="address"], [itemprop="streetAddress"]').each((_, el) => {
    const t = clean($(el).text(), 160);
    if (t && addresses.size < 4) addresses.add(t);
  });
  const bodyText = clean($('body').text(), 1_000_000) ?? '';
  const visibleBody = $('body').first().clone();
  visibleBody.find('script, style, noscript, template, svg').remove();
  const visibleText = clean(visibleBody.text(), 1_000_000) ?? '';
  const wordCount = visibleText ? visibleText.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length : 0;

  // Phone numbers shown as text (used only to suggest tap-to-call; heuristic).
  const phoneText = new Set<string>();
  for (const m of visibleText.matchAll(PHONE_TEXT)) {
    const num = m[1]!.trim();
    const digits = num.replace(/\D/g, '').length;
    if (digits >= 8 && digits <= 15 && phoneText.size < 5) phoneText.add(num);
  }

  // Public trust signals (presence only; content is never judged).
  const trustSignals: string[] = [];
  const reviewTypes = jsonLd.flatMap((j) => j.types).filter((t) => /^(Review|AggregateRating)$/.test(t));
  if (reviewTypes.length) trustSignals.push(`Review structured data (${uniq(reviewTypes).join(', ')})`);
  const reviewEls = $('[class], [id]').filter((_, el) => TESTIMONIAL_ATTR.test(`${$(el).attr('class') ?? ''} ${$(el).attr('id') ?? ''}`)).length;
  if (reviewEls) trustSignals.push(`${reviewEls} element(s) with testimonial/review class or id`);
  const reviewHeading = $('h1, h2, h3, h4').toArray().map((el) => clean($(el).text(), 80) ?? '').find((t) => TESTIMONIAL_HEADING.test(t));
  if (reviewHeading) trustSignals.push(`Heading "${truncate(reviewHeading, 60)}"`);

  // Mixed content: http:// sub-resources on an https:// page.
  const insecureResources = new Set<string>();
  if (input.finalUrl.startsWith('https:')) {
    $('img[src], script[src], iframe[src], source[src], video[src], audio[src], embed[src], link[rel~="stylesheet" i][href]').each((_, el) => {
      const raw = ($(el).attr('src') ?? $(el).attr('href') ?? '').trim();
      if (/^http:\/\//i.test(raw) && insecureResources.size < 10) insecureResources.add(truncate(raw, 200));
    });
  }
  const hoursMention = /\b(opening hours|opening times|business hours|hours of operation|office hours|we(?:'| a)re open)\b/i.exec(bodyText);
  if (hoursMention && hours.size === 0) hours.add(`Page text mentions "${hoursMention[0]}"`);

  // Business readiness signals (presence only) ------------------------------------
  for (const src of $('iframe[src]').map((_, el) => $(el).attr('src') ?? '').get()) {
    const u = normaliseUrl(src, base);
    if (u && MAP_URL.test(u) && mapLinks.size < 5) mapLinks.add(u);
  }
  const paymentMethods = new Set<string>();
  for (const [re, name] of PAYMENT_TEXT) if (re.test(visibleText)) paymentMethods.add(name);
  for (const src of $('script[src]').map((_, el) => $(el).attr('src') ?? '').get()) {
    const hit = PAYMENT_SCRIPTS.find(([re]) => re.test(src));
    if (hit) paymentMethods.add(hit[1]);
  }
  const pinCodes = new Set<string>();
  for (const a of addresses) {
    const m = PIN.exec(a);
    if (m && pinCodes.size < 5) pinCodes.add(m[1]!.replace(/\s/g, ''));
  }
  for (const m of visibleText.matchAll(PIN_NEAR_WORD)) {
    const code = (m[1] ?? m[2] ?? '').replace(/\s/g, '');
    if (code && pinCodes.size < 5) pinCodes.add(code);
  }
  const indianPhones = uniq([...tel, ...phoneText].filter(isIndianPhone)).slice(0, 5);

  // Misc ------------------------------------------------------------------------
  let positiveTabindex = 0;
  $('[tabindex]').each((_, el) => {
    if (Number.parseInt($(el).attr('tabindex') ?? '0', 10) > 0) positiveTabindex++;
  });
  const scripts = $('script[src]').map((_, el) => $(el).attr('src') ?? '').get().slice(0, 200);
  const stylesheets = $('link[rel~="stylesheet" i][href]').map((_, el) => $(el).attr('href') ?? '').get().slice(0, 100);
  const headBlockingScripts = $('head script[src]').filter((_, el) => {
    const s = $(el);
    return s.attr('async') === undefined && s.attr('defer') === undefined && (s.attr('type') ?? '').toLowerCase() !== 'module';
  }).length;
  let imagesMissingDimensions = 0;
  imgs.each((_, el) => {
    const img = $(el);
    if (img.attr('role') === 'presentation' || img.attr('role') === 'none' || img.attr('aria-hidden') === 'true') return;
    if (!img.attr('width') || !img.attr('height')) imagesMissingDimensions++;
  });
  let unsafeBlankLinks = 0;
  $('a[target="_blank" i][href]').each((_, el) => {
    const href = ($(el).attr('href') ?? '').trim();
    if (!/^https?:\/\//i.test(href)) return;
    const rel = ($(el).attr('rel') ?? '').toLowerCase();
    if (!rel.includes('noopener') && !rel.includes('noreferrer')) unsafeBlankLinks++;
  });
  const hasDoctype = /<!doctype\s+html/i.test(input.html.slice(0, 600));
  const hasCharset =
    $('meta[charset], meta[http-equiv="content-type" i]').length > 0 ||
    /charset=/i.test(input.contentType);
  const hasMainLandmark = $('main, [role="main"]').length > 0;
  const hasResponsiveMedia =
    $('picture, img[srcset], img[sizes]').length > 0 ||
    $('style')
      .toArray()
      .some((el) => $(el).text().includes('@media'));
  const generator = clean($('meta[name="generator" i]').attr('content'), 120);
  const emptyAppRoot = $('#root, #app, #__next, #__nuxt').filter((_, el) => $(el).children().length === 0).length > 0;
  const likelyClientRendered = bodyText.length < 250 && ($('script').length >= 3 || emptyAppRoot);

  const technologies = detectTechnologies({ html: input.html, scripts, stylesheets, headers: input.headers, generator });

  const canonical = canonicalRaw ? normaliseUrl(canonicalRaw, base) : null;

  return {
    url: input.url,
    finalUrl: input.finalUrl,
    status: input.status,
    contentType: input.contentType,
    bytes: input.bytes,
    truncated: input.truncated,
    responseTimeMs: input.responseTimeMs,
    redirects: input.redirects,
    headers: input.headers,
    source: input.source,
    title: clean(titles.first().text(), 300),
    titleCount: titles.length,
    description: clean(descriptions.first().attr('content'), 400),
    descriptionCount: descriptions.length,
    h1: headings.filter((h) => h.level === 1).map((h) => h.text),
    headings,
    canonicalRaw: canonicalRaw ? truncate(canonicalRaw, 300) : null,
    canonical,
    canonicalCount: canonicals.length,
    metaRobots: metaRobots ? truncate(metaRobots, 200) : null,
    xRobotsTag: xRobotsTag ? truncate(xRobotsTag, 200) : null,
    noindex: /\b(noindex|none)\b/.test(robotsText),
    nofollow: /\b(nofollow|none)\b/.test(robotsText),
    lang: clean($('html').attr('lang'), 35),
    viewport: clean($('meta[name="viewport" i]').attr('content'), 200),
    og,
    twitterCard: clean($('meta[name="twitter:card" i]').attr('content'), 40),
    jsonLd,
    microdataTypes,
    generator,
    images: { total: imgs.length, missingAltCount, missingAlt },
    internalLinks,
    externalLinks,
    mailto: [...mailto],
    tel: [...tel],
    forms,
    embeddedForms,
    a11y: { unlabeledFields: unlabeledFields.slice(0, 30), unnamedButtons, unnamedLinks, positiveTabindex, headingSkips },
    nav: { present: navEls.length > 0, links: navLinks },
    ctas,
    contactLinks,
    whatsapp: [...whatsapp],
    booking,
    social: [...social.values()],
    ecommerce: { signals: ecomSignals, prices: [...prices], cartLinks: [...cartLinks], checkoutLinks: [...checkoutLinks], isProductPage },
    address: [...addresses],
    openingHours: [...hours].slice(0, 7),
    contactInHeader,
    phoneText: [...phoneText],
    trust: { signals: trustSignals, privacyLink, aboutLink },
    business: { policyLinks, paymentMethods: [...paymentMethods], mapLinks: [...mapLinks], pinCodes: [...pinCodes], gstin: GSTIN.test(visibleText), indianPhones },
    insecureResources: [...insecureResources],
    wordCount,
    bodyTextLength: bodyText.length,
    scriptCount: $('script').length,
    likelyClientRendered,
    technologies,
    techHealth: {
      hasDoctype,
      hasCharset,
      headBlockingScripts,
      stylesheetCount: stylesheets.length,
      externalScriptCount: scripts.length,
      imagesMissingDimensions,
      unsafeBlankLinks,
      hasMainLandmark,
      hasResponsiveMedia,
    },
  };
}
