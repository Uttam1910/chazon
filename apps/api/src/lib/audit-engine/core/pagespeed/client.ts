import type { Strategy } from '@chazon/shared';

export type LighthouseCategoryId = 'performance' | 'accessibility' | 'best-practices' | 'seo';

export type PageSpeedErrorCode =
  | 'MISSING_API_KEY'
  | 'QUOTA_EXCEEDED'
  | 'INVALID_API_KEY'
  | 'API_NOT_ENABLED'
  | 'LIGHTHOUSE_FAILED'
  | 'TIMEOUT'
  | 'UPSTREAM_ERROR'
  | 'INVALID_RESPONSE';

export class PageSpeedError extends Error {
  constructor(
    public readonly code: PageSpeedErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'PageSpeedError';
  }
}

const ENDPOINT = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

export interface PageSpeedClientOptions {
  apiKey: string | null;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  cacheTtlMs?: number;
  maxCacheEntries?: number;
}

export interface PageSpeedClient {
  readonly configured: boolean;
  run(url: string, strategy: Strategy, categories: LighthouseCategoryId[], signal?: AbortSignal): Promise<unknown>;
}

interface GoogleErrorBody {
  error?: { code?: number; message?: string; status?: string; errors?: { reason?: string; message?: string }[] };
}

/** Maps a Google API error response to a typed, user-safe error. Never includes the key. */
export function mapPageSpeedError(status: number, body: unknown, apiKey: string | null): PageSpeedError {
  const err = (body as GoogleErrorBody | null)?.error;
  const reasons = (err?.errors ?? []).map((e) => e.reason ?? '');
  let message = (err?.message ?? '').slice(0, 500);
  if (apiKey) message = message.split(apiKey).join('[redacted]');

  if (status === 429 || reasons.some((r) => /rateLimitExceeded|dailyLimitExceeded|quotaExceeded|userRateLimitExceeded/.test(r))) {
    return new PageSpeedError('QUOTA_EXCEEDED', 'The PageSpeed Insights API quota has been exceeded. Try again later or raise the quota in Google Cloud.');
  }
  if (/API key not valid|API_KEY_INVALID/i.test(message) || reasons.includes('keyInvalid')) {
    return new PageSpeedError('INVALID_API_KEY', 'The configured PAGESPEED_API_KEY was rejected by Google.');
  }
  if (status === 403 && (reasons.includes('accessNotConfigured') || /has not been used|is disabled/i.test(message))) {
    return new PageSpeedError('API_NOT_ENABLED', 'The PageSpeed Insights API is not enabled for this Google Cloud project.');
  }
  if (status === 403) {
    return new PageSpeedError('INVALID_API_KEY', 'Google refused the request (403). Check the API key restrictions.');
  }
  if (/Lighthouse returned error|FAILED_DOCUMENT_REQUEST|ERRORED_DOCUMENT_REQUEST|NO_FCP|DNS_FAILURE|NOT_HTML|PROTOCOL_TIMEOUT/i.test(message)) {
    return new PageSpeedError('LIGHTHOUSE_FAILED', `Lighthouse could not audit the page: ${message || 'unknown error'}`);
  }
  if (status >= 500) return new PageSpeedError('UPSTREAM_ERROR', `PageSpeed Insights returned an error (${status}).`);
  return new PageSpeedError('UPSTREAM_ERROR', `PageSpeed Insights request failed (${status})${message ? `: ${message}` : ''}.`);
}

export function createPageSpeedClient(options: PageSpeedClientOptions): PageSpeedClient {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 120_000;
  const ttl = options.cacheTtlMs ?? 10 * 60_000;
  const maxEntries = options.maxCacheEntries ?? 30;
  // Short-lived cache so repeated audits of the same URL do not burn API quota.
  const cache = new Map<string, { at: number; value: unknown }>();

  return {
    configured: Boolean(options.apiKey),
    async run(url, strategy, categories, signal) {
      if (!options.apiKey) {
        throw new PageSpeedError('MISSING_API_KEY', 'PAGESPEED_API_KEY is not configured on the server, so Lighthouse checks were skipped.');
      }
      const cacheKey = `${strategy}|${[...categories].sort().join(',')}|${url}`;
      const hit = cache.get(cacheKey);
      if (hit && Date.now() - hit.at < ttl) return hit.value;

      const params = new URLSearchParams({ url, strategy, key: options.apiKey });
      for (const c of categories) params.append('category', c);

      const timeout = AbortSignal.timeout(timeoutMs);
      let res: Response;
      try {
        res = await fetchImpl(`${ENDPOINT}?${params.toString()}`, {
          signal: signal ? AbortSignal.any([timeout, signal]) : timeout,
          headers: { accept: 'application/json' },
        });
      } catch {
        if (timeout.aborted) throw new PageSpeedError('TIMEOUT', `PageSpeed Insights did not respond within ${Math.round(timeoutMs / 1000)} s.`);
        throw new PageSpeedError('UPSTREAM_ERROR', 'Could not reach the PageSpeed Insights API.');
      }

      let body: unknown;
      try {
        body = await res.json();
      } catch {
        if (timeout.aborted) throw new PageSpeedError('TIMEOUT', `PageSpeed Insights did not respond within ${Math.round(timeoutMs / 1000)} s.`);
        throw new PageSpeedError('INVALID_RESPONSE', 'PageSpeed Insights returned a response that was not valid JSON.');
      }
      if (!res.ok) throw mapPageSpeedError(res.status, body, options.apiKey);

      cache.set(cacheKey, { at: Date.now(), value: body });
      while (cache.size > maxEntries) {
        const oldest = cache.keys().next().value;
        if (oldest === undefined) break;
        cache.delete(oldest);
      }
      return body;
    },
  };
}
