import robotsParser from 'robots-parser';
import type { RobotsInfo } from '@chazon/shared';
import { FetchError, type SafeFetcher } from '../net/safeFetch';

export interface RobotsResult {
  info: RobotsInfo;
  /** Whether this tool's crawler may fetch the URL. */
  isAllowed(url: string): boolean;
  crawlDelayMs: number | null;
}

/**
 * Fetches and parses /robots.txt for an origin.
 *  - 2xx: rules apply.
 *  - 4xx: treated as "no restrictions" (standard crawler behaviour).
 *  - 5xx / network error: this crawler conservatively fetches nothing beyond the start page.
 */
export async function fetchRobots(
  origin: string,
  fetcher: SafeFetcher,
  userAgentToken: string,
  startUrl: string,
  signal?: AbortSignal,
): Promise<RobotsResult> {
  const robotsUrl = `${origin}/robots.txt`;
  const info: RobotsInfo = {
    url: robotsUrl,
    status: null,
    found: false,
    blocksAll: false,
    sitemaps: [],
    crawlDelaySeconds: null,
    startUrlAllowed: null,
  };

  let body = '';
  try {
    const res = await fetcher.fetch(robotsUrl, { maxBytes: 512 * 1024, timeoutMs: 10_000, accept: 'text/plain,*/*;q=0.5', signal });
    info.status = res.status;
    if (res.status >= 200 && res.status < 300) {
      info.found = true;
      body = res.text();
    } else if (res.status >= 500) {
      info.error = `robots.txt returned HTTP ${res.status}; crawling beyond the start page was skipped as a precaution.`;
      return { info, isAllowed: () => false, crawlDelayMs: null };
    }
  } catch (err) {
    info.error = `robots.txt could not be fetched (${err instanceof FetchError ? err.message : 'unknown error'}); crawling beyond the start page was skipped as a precaution.`;
    return { info, isAllowed: () => false, crawlDelayMs: null };
  }

  if (!info.found) {
    info.startUrlAllowed = true;
    return { info, isAllowed: () => true, crawlDelayMs: null };
  }

  const robots = robotsParser(robotsUrl, body);
  const homepage = `${origin}/`;
  // "Blocks all" is judged for search engines (Googlebot falls back to the * group).
  info.blocksAll = robots.isAllowed(homepage, 'Googlebot') === false;
  info.sitemaps = robots.getSitemaps().slice(0, 10);
  const delay = robots.getCrawlDelay(userAgentToken);
  info.crawlDelaySeconds = typeof delay === 'number' && Number.isFinite(delay) ? delay : null;
  info.startUrlAllowed = robots.isAllowed(startUrl, userAgentToken) !== false;

  return {
    info,
    // Undefined means the URL is on a different origin; treat as not covered by these rules.
    isAllowed: (url: string) => robots.isAllowed(url, userAgentToken) !== false,
    crawlDelayMs: info.crawlDelaySeconds !== null ? info.crawlDelaySeconds * 1000 : null,
  };
}
