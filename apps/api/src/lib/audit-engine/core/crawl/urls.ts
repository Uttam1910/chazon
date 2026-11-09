import { getDomain } from 'tldts';

/** Resolves and normalises a link: http(s) only, no fragment, default port removed. */
export function normaliseUrl(href: string, base?: string): string | null {
  if (!href) return null;
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;
  try {
    const u = new URL(trimmed, base);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    if (u.username || u.password) return null;
    u.hash = '';
    return u.href;
  } catch {
    return null;
  }
}

/** Registered domain (eTLD+1), e.g. "shop.example.co.uk" -> "example.co.uk". */
export function registeredDomain(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace(/^\[|\]$/g, '');
    return getDomain(host, { allowPrivateDomains: true }) ?? host;
  } catch {
    return null;
  }
}

export function isSameSite(url: string, siteDomain: string): boolean {
  return registeredDomain(url) === siteDomain;
}

const SKIP_EXTENSIONS =
  /\.(?:pdf|jpe?g|png|gif|webp|avif|svg|ico|bmp|tiff?|heic|mp4|m4v|mov|avi|webm|mkv|mp3|m4a|wav|ogg|flac|zip|rar|7z|gz|tgz|tar|bz2|exe|dmg|msi|pkg|apk|ipa|iso|bin|docx?|xlsx?|pptx?|odt|ods|csv|json|xml|rss|atom|txt|css|js|mjs|map|woff2?|ttf|otf|eot|ics|vcf)$/i;

export function hasNonHtmlExtension(url: string): boolean {
  try {
    return SKIP_EXTENSIONS.test(new URL(url).pathname);
  } catch {
    return true;
  }
}

const TRANSACTIONAL_PATH =
  /\/(?:cart|basket|bag|checkout|my-account|account|login|log-in|signin|sign-in|logout|log-out|register|signup|sign-up|wp-admin|wp-login\.php|admin|user\/login)(?:\/|$)/i;
const TRANSACTIONAL_QUERY = /(?:^|[?&])(?:add-to-cart|add_to_cart|add-to-basket|action|logout|token|session|nonce|_wpnonce)=/i;

/** Account, cart, checkout and action URLs are never fetched by the crawler. */
export function isTransactionalUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return TRANSACTIONAL_PATH.test(u.pathname) || TRANSACTIONAL_QUERY.test(u.search);
  } catch {
    return true;
  }
}

export function originOf(url: string): string {
  return new URL(url).origin;
}
