import zlib from 'node:zlib';
import { XMLValidator } from 'fast-xml-parser';
import type { SitemapInfo } from '@chazon/shared';
import { FetchError, type SafeFetcher } from '../net/safeFetch';
import { normaliseUrl } from './urls';

const MAX_SITEMAP_BYTES = 5 * 1024 * 1024;

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

export interface ParsedSitemap {
  type: 'urlset' | 'sitemapindex' | null;
  locs: string[];
  validXml: boolean;
  error?: string;
}

/** Basic sitemap parsing: root type, <loc> entries and XML well-formedness. */
export function parseSitemapXml(xml: string, truncated: boolean): ParsedSitemap {
  const root = /<(?:[\w-]+:)?(urlset|sitemapindex)\b/i.exec(xml)?.[1]?.toLowerCase();
  const type = root === 'urlset' || root === 'sitemapindex' ? root : null;
  const locs: string[] = [];
  const re = /<(?:[\w-]+:)?loc>\s*(?:<!\[CDATA\[)?\s*([^<\]]+?)\s*(?:\]\]>)?\s*<\/(?:[\w-]+:)?loc>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null && locs.length < 50_000) {
    if (m[1]) locs.push(decodeXmlEntities(m[1]));
  }
  let validXml = true;
  let error: string | undefined;
  if (truncated) {
    validXml = false;
    error = 'Sitemap exceeded the size limit and was only partially read.';
  } else {
    const result = XMLValidator.validate(xml);
    if (result !== true) {
      validXml = false;
      error = `XML is not well-formed (line ${result.err.line}): ${result.err.msg}`;
    }
  }
  return { type, locs, validXml, ...(error ? { error } : {}) };
}

async function fetchXml(url: string, fetcher: SafeFetcher, signal?: AbortSignal) {
  const res = await fetcher.fetch(url, {
    maxBytes: MAX_SITEMAP_BYTES,
    timeoutMs: 15_000,
    accept: 'application/xml,text/xml;q=0.9,*/*;q=0.5',
    signal,
  });
  let body = res.body;
  let truncated = res.truncated;
  // Gzipped sitemap file (as opposed to Content-Encoding): decompress with a hard cap.
  if (body.length > 2 && body[0] === 0x1f && body[1] === 0x8b) {
    try {
      body = zlib.gunzipSync(body, { maxOutputLength: MAX_SITEMAP_BYTES });
    } catch {
      body = Buffer.alloc(0);
      truncated = true;
    }
  }
  return { res, xml: body.toString('utf8'), truncated };
}

export interface SitemapResult {
  info: SitemapInfo;
  /** Page URLs from the sitemap (first file of an index), for crawl seeding. */
  pageUrls: string[];
}

/**
 * Looks for a sitemap at locations declared in robots.txt, then at common
 * conventional paths. "Not found" only means not found at the checked URLs.
 */
export async function discoverSitemap(
  origin: string,
  robotsSitemaps: string[],
  fetcher: SafeFetcher,
  signal?: AbortSignal,
): Promise<SitemapResult> {
  const candidates = [
    ...robotsSitemaps.slice(0, 3),
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
  ]
    .map((u) => normaliseUrl(u))
    .filter((u): u is string => Boolean(u));
  const unique = [...new Set(candidates)];

  const info: SitemapInfo = { checked: [], found: null, type: null, urlCount: 0, childSitemaps: 0, sampleUrls: [] };
  let pageUrls: string[] = [];

  for (const url of unique) {
    try {
      const { res, xml, truncated } = await fetchXml(url, fetcher, signal);
      if (res.status < 200 || res.status >= 300) {
        info.checked.push({ url, status: res.status, outcome: `HTTP ${res.status}` });
        continue;
      }
      const parsed = parseSitemapXml(xml, truncated);
      if (!parsed.type) {
        const looksHtml = /<html[\s>]/i.test(xml.slice(0, 2000));
        info.checked.push({ url, status: res.status, outcome: looksHtml ? 'returned an HTML page, not a sitemap' : 'not a recognisable sitemap' });
        continue;
      }
      info.found = url;
      info.type = parsed.type;
      if (parsed.error) info.error = parsed.error;
      info.checked.push({ url, status: res.status, outcome: `found (${parsed.type}, ${parsed.locs.length} entries)` });

      if (parsed.type === 'urlset') {
        info.urlCount = parsed.locs.length;
        pageUrls = parsed.locs;
      } else {
        info.childSitemaps = parsed.locs.length;
        // Read only the first child sitemap to seed the crawl - bounded work.
        const child = parsed.locs.map((l) => normaliseUrl(l)).find(Boolean);
        if (child) {
          try {
            const c = await fetchXml(child, fetcher, signal);
            const childParsed = c.res.status === 200 ? parseSitemapXml(c.xml, c.truncated) : null;
            if (childParsed?.type === 'urlset') {
              pageUrls = childParsed.locs;
              info.urlCount = childParsed.locs.length;
            }
          } catch {
            /* child sitemap failures are reported implicitly via urlCount = 0 */
          }
        }
      }
      info.sampleUrls = pageUrls.slice(0, 10);
      break;
    } catch (err) {
      info.checked.push({ url, status: null, outcome: err instanceof FetchError ? err.message : 'request failed' });
    }
  }
  return { info, pageUrls };
}
