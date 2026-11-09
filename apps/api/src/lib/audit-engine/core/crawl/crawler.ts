import type { CrawlSummary } from '@chazon/shared';
import { analyzePage, type PageData } from '../analyze/page';
import { FetchError, isHtmlContentType, type SafeFetcher } from '../net/safeFetch';
import type { RobotsResult } from './robots';
import { hasNonHtmlExtension, isSameSite, isTransactionalUrl, normaliseUrl } from './urls';

export interface UrlStatus {
  status: number | null;
  reason?: string;
  code?: string;
}

export interface CrawlInput {
  start: PageData;
  siteDomain: string;
  /** Total pages to fetch including the start page. */
  limit: number;
  robotsFor: (origin: string) => Promise<RobotsResult>;
  sitemapUrls: string[];
  /** Politeness delay between request starts (robots crawl-delay is applied on top). */
  minDelayMs: number;
  crawlDelayMs: number | null;
  concurrency: number;
  maxBytes: number;
  signal?: AbortSignal;
  onProgress?: (visited: number, limit: number, url: string) => void;
}

export interface CrawlOutput {
  pages: PageData[];
  summary: CrawlSummary;
  /** Status of every URL the crawler requested (keyed by requested and final URL). */
  statuses: Map<string, UrlStatus>;
  /** link URL -> pages it was found on (max 5 each). */
  linkSources: Map<string, string[]>;
}

/** Robots crawl-delays above this make an interactive audit impractical; we then stop at the start page. */
export const MAX_HONOURED_CRAWL_DELAY_MS = 10_000;

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve) => {
    if (ms <= 0) return resolve();
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      resolve();
    }, { once: true });
  });

export async function crawlSite(input: CrawlInput, fetcher: SafeFetcher): Promise<CrawlOutput> {
  const { start, siteDomain, signal } = input;
  const pages: PageData[] = [start];
  const statuses = new Map<string, UrlStatus>([
    [start.url, { status: start.status }],
    [start.finalUrl, { status: start.status }],
  ]);
  const linkSources = new Map<string, string[]>();
  const seen = new Set<string>([start.url, start.finalUrl]);
  const visitedFinal = new Set<string>([start.finalUrl]);
  const queue: { url: string; source: 'link' | 'sitemap' }[] = [];
  const skippedUrls: { url: string; reason: string }[] = [];
  const skippedByReason: Record<string, number> = {};
  const failedUrls: { url: string; reason: string }[] = [];
  let skippedCount = 0;

  const skip = (url: string, reason: string) => {
    skippedCount++;
    skippedByReason[reason] = (skippedByReason[reason] ?? 0) + 1;
    if (skippedUrls.length < 100) skippedUrls.push({ url, reason });
  };

  const addSource = (url: string, page: string) => {
    const list = linkSources.get(url);
    if (!list) linkSources.set(url, [page]);
    else if (list.length < 5 && !list.includes(page)) list.push(page);
  };

  const enqueueLinks = (page: PageData) => {
    for (const l of page.internalLinks) {
      addSource(l.href, page.finalUrl);
      if (!seen.has(l.href)) {
        seen.add(l.href);
        queue.push({ url: l.href, source: 'link' });
      }
    }
    for (const l of page.externalLinks) addSource(l.href, page.finalUrl);
  };

  enqueueLinks(start);
  for (const raw of input.sitemapUrls.slice(0, 1000)) {
    const url = normaliseUrl(raw);
    if (url && isSameSite(url, siteDomain) && !seen.has(url)) {
      seen.add(url);
      queue.push({ url, source: 'sitemap' });
    }
  }

  let crawlDelayNote: string | undefined;
  let limit = input.limit;
  let concurrency = Math.max(1, input.concurrency);
  let delay = input.minDelayMs;
  if (input.crawlDelayMs !== null) {
    if (input.crawlDelayMs > MAX_HONOURED_CRAWL_DELAY_MS) {
      limit = 1;
      crawlDelayNote = `robots.txt requests a crawl delay of ${input.crawlDelayMs / 1000} s. To respect it within an interactive audit, only the start page was inspected.`;
    } else {
      delay = Math.max(delay, input.crawlDelayMs);
      concurrency = 1;
      if (input.crawlDelayMs > 0) crawlDelayNote = `robots.txt crawl delay of ${input.crawlDelayMs / 1000} s was respected.`;
    }
  }

  let reserved = 1; // the start page
  let nextSlot = 0;
  const gate = async () => {
    const now = Date.now();
    const wait = Math.max(0, nextSlot - now);
    nextSlot = Math.max(now, nextSlot) + delay;
    await sleep(wait, signal);
  };

  const worker = async () => {
    while (!signal?.aborted) {
      if (reserved >= limit) return;
      const item = queue.shift();
      if (!item) return;
      reserved++;
      const release = (reason: string) => {
        reserved--;
        skip(item.url, reason);
      };

      if (hasNonHtmlExtension(item.url)) {
        release('Not an HTML page (file type)');
        continue;
      }
      if (isTransactionalUrl(item.url)) {
        release('Account, cart, checkout or action URL (never crawled)');
        continue;
      }
      const robots = await input.robotsFor(new URL(item.url).origin);
      if (!robots.isAllowed(item.url)) {
        release('Disallowed by robots.txt (or robots.txt unavailable)');
        continue;
      }

      await gate();
      if (signal?.aborted) return;
      try {
        const res = await fetcher.fetch(item.url, {
          maxBytes: input.maxBytes,
          timeoutMs: 15_000,
          signal,
          acceptContentType: isHtmlContentType,
        });
        statuses.set(item.url, { status: res.status });
        statuses.set(res.finalUrl, { status: res.status });
        if (!isSameSite(res.finalUrl, siteDomain)) {
          skip(item.url, 'Redirected outside the site');
          continue;
        }
        if (visitedFinal.has(res.finalUrl)) {
          skip(item.url, 'Redirects to a page already inspected');
          continue;
        }
        if (res.status >= 400) {
          failedUrls.push({ url: item.url, reason: `HTTP ${res.status}` });
          continue;
        }
        if (res.bodySkipped) {
          skip(item.url, 'Non-HTML response (content type)');
          continue;
        }
        visitedFinal.add(res.finalUrl);
        const page = analyzePage({
          html: res.text(),
          url: item.url,
          finalUrl: res.finalUrl,
          status: res.status,
          contentType: res.contentType,
          bytes: res.bytes,
          truncated: res.truncated,
          responseTimeMs: res.timeMs,
          redirects: res.redirects,
          headers: res.headers,
          source: item.source,
          siteDomain,
        });
        pages.push(page);
        input.onProgress?.(pages.length, limit, res.finalUrl);
        enqueueLinks(page);
      } catch (err) {
        const reason = err instanceof FetchError ? err.message : 'Request failed';
        const code = err instanceof FetchError ? err.code : undefined;
        statuses.set(item.url, { status: null, reason, ...(code ? { code } : {}) });
        failedUrls.push({ url: item.url, reason });
      }
    }
  };

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  for (const item of queue) skip(item.url, 'Crawl limit reached');

  const summary: CrawlSummary = {
    limit: input.limit,
    discovered: seen.size,
    visited: pages.length,
    skipped: skippedCount,
    failed: failedUrls.length,
    pages: pages.map((p) => ({
      url: p.url,
      finalUrl: p.finalUrl,
      status: p.status,
      title: p.title,
      description: p.description,
      h1Count: p.h1.length,
      responseTimeMs: p.responseTimeMs,
      bytes: p.bytes,
      truncated: p.truncated,
      source: p.source,
    })),
    skippedUrls,
    skippedByReason,
    failedUrls,
    crawlDelayMs: delay,
    ...(crawlDelayNote ? { crawlDelayNote } : {}),
  };
  return { pages, summary, statuses, linkSources };
}
