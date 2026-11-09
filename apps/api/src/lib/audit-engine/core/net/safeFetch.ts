import type dns from 'node:dns';
import type { Readable } from 'node:stream';
import zlib from 'node:zlib';
import { Agent, request } from 'undici';
import type { RedirectHop } from '@chazon/shared';
import { resolveAllowed, strictPolicy, UnsafeUrlError, type NetworkPolicy } from './urlPolicy';

export type FetchErrorCode =
  | 'BLOCKED_URL'
  | 'BLOCKED_ADDRESS'
  | 'BLOCKED_REDIRECT'
  | 'DNS_FAILURE'
  | 'TIMEOUT'
  | 'CONNECTION_FAILED'
  | 'TLS_ERROR'
  | 'TOO_MANY_REDIRECTS'
  | 'INVALID_RESPONSE'
  | 'ABORTED';

export class FetchError extends Error {
  constructor(
    public readonly code: FetchErrorCode,
    message: string,
    public readonly url: string,
  ) {
    super(message);
    this.name = 'FetchError';
  }
}

export interface SafeFetchOptions {
  method?: 'GET' | 'HEAD';
  /** Maximum decoded body size; larger bodies are truncated (truncated = true). */
  maxBytes?: number;
  /** Total time budget including redirects. */
  timeoutMs?: number;
  maxRedirects?: number;
  accept?: string;
  signal?: AbortSignal;
  /** When given, the body is only downloaded if this returns true for the content type. */
  acceptContentType?: (contentType: string) => boolean;
}

export interface SafeResponse {
  requestedUrl: string;
  finalUrl: string;
  status: number;
  headers: Record<string, string>;
  contentType: string;
  body: Buffer;
  bytes: number;
  truncated: boolean;
  bodySkipped: boolean;
  redirects: RedirectHop[];
  timeMs: number;
  text(): string;
}

export interface SafeFetcher {
  readonly userAgent: string;
  fetch(url: string | URL, options?: SafeFetchOptions): Promise<SafeResponse>;
  close(): Promise<void>;
}

export interface SafeFetcherOptions {
  policy?: NetworkPolicy;
  userAgent: string;
  connectTimeoutMs?: number;
}

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const noop = () => {};
export const DEFAULT_MAX_BYTES = 3 * 1024 * 1024;

function flattenHeaders(raw: Record<string, string | string[] | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v === undefined) continue;
    out[k.toLowerCase()] = Array.isArray(v) ? v.join(', ') : v;
  }
  return out;
}

function decodeText(body: Buffer, contentType: string): string {
  const charset = /charset=["']?([\w-]+)/i.exec(contentType)?.[1] ?? 'utf-8';
  try {
    return new TextDecoder(charset, { fatal: false }).decode(body);
  } catch {
    return new TextDecoder('utf-8', { fatal: false }).decode(body);
  }
}

async function readLimited(stream: Readable, maxBytes: number): Promise<{ body: Buffer; truncated: boolean }> {
  const chunks: Buffer[] = [];
  let size = 0;
  let truncated = false;
  for await (const chunk of stream) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array);
    if (size + buf.length > maxBytes) {
      chunks.push(buf.subarray(0, maxBytes - size));
      size = maxBytes;
      truncated = true;
      break; // leaving the loop destroys the stream
    }
    chunks.push(buf);
    size += buf.length;
  }
  return { body: Buffer.concat(chunks, size), truncated };
}

function decoderFor(encoding: string): zlib.Gunzip | zlib.Inflate | zlib.BrotliDecompress | null {
  switch (encoding.trim().toLowerCase()) {
    case 'gzip':
    case 'x-gzip':
      return zlib.createGunzip();
    case 'deflate':
      return zlib.createInflate();
    case 'br':
      return zlib.createBrotliDecompress();
    default:
      return null;
  }
}

function errorChain(err: unknown): Array<{ code?: string; name?: string; message?: string }> {
  const chain: Array<{ code?: string; name?: string; message?: string }> = [];
  let cur: unknown = err;
  for (let i = 0; cur && i < 6; i++) {
    chain.push(cur as { code?: string; name?: string; message?: string });
    cur = (cur as { cause?: unknown }).cause;
  }
  return chain;
}

export function classifyNetworkError(err: unknown, url: string, timedOut: boolean): FetchError {
  if (err instanceof FetchError) return err;
  const chain = errorChain(err);
  const unsafe = chain.find((e) => e instanceof UnsafeUrlError) as UnsafeUrlError | undefined;
  if (unsafe) return new FetchError('BLOCKED_ADDRESS', unsafe.message, url);
  if (timedOut) return new FetchError('TIMEOUT', 'The request timed out.', url);
  const codes = chain.map((e) => e.code ?? '').filter(Boolean);
  const has = (re: RegExp) => codes.some((c) => re.test(c));
  if (has(/^(ENOTFOUND|EAI_AGAIN|EAI_NONAME|ENODATA)$/)) {
    return new FetchError('DNS_FAILURE', 'The domain name could not be resolved.', url);
  }
  if (has(/TIMEOUT/)) return new FetchError('TIMEOUT', 'The request timed out.', url);
  if (has(/CERT|TLS|SSL|SELF_SIGNED|UNABLE_TO_VERIFY/)) {
    return new FetchError('TLS_ERROR', 'The secure (TLS) connection failed - the certificate may be invalid.', url);
  }
  if (chain.some((e) => e.name === 'AbortError') || has(/ABORT/)) {
    return new FetchError('ABORTED', 'The request was cancelled.', url);
  }
  return new FetchError('CONNECTION_FAILED', 'The server could not be reached.', url);
}

export function createSafeFetcher(options: SafeFetcherOptions): SafeFetcher {
  const policy = options.policy ?? strictPolicy;

  // Every socket resolves its host through this hook, so the IP that is
  // validated is exactly the IP that is connected to (defeats DNS rebinding).
  const lookup = (
    hostname: string,
    opts: dns.LookupOptions,
    callback: (err: Error | null, address?: string | dns.LookupAddress[], family?: number) => void,
  ) => {
    resolveAllowed(hostname, policy).then(
      (addresses) => {
        const wanted = opts.family === 4 || opts.family === 6 ? addresses.filter((a) => a.family === opts.family) : addresses;
        const first = wanted[0];
        if (!first) {
          callback(Object.assign(new Error(`No usable address for ${hostname}`), { code: 'ENOTFOUND' }));
        } else if (opts.all) {
          callback(null, wanted);
        } else {
          callback(null, first.address, first.family);
        }
      },
      (err: Error) => callback(err),
    );
  };

  const agent = new Agent({
    connect: { lookup, timeout: options.connectTimeoutMs ?? 10_000, rejectUnauthorized: true } as Agent.Options['connect'],
    headersTimeout: 20_000,
    bodyTimeout: 20_000,
    connections: 6,
    keepAliveTimeout: 4_000,
  });

  async function safeFetch(input: string | URL, opts: SafeFetchOptions = {}): Promise<SafeResponse> {
    const started = Date.now();
    const timeoutMs = opts.timeoutMs ?? 15_000;
    const maxBytes = opts.maxBytes ?? DEFAULT_MAX_BYTES;
    const maxRedirects = opts.maxRedirects ?? 5;
    const timeout = AbortSignal.timeout(timeoutMs);
    const signal = opts.signal ? AbortSignal.any([timeout, opts.signal]) : timeout;
    let method = opts.method ?? 'GET';
    const redirects: RedirectHop[] = [];

    let current: URL;
    try {
      current = typeof input === 'string' ? new URL(input) : new URL(input.href);
      current.hash = '';
      policy.checkUrl(current);
    } catch (err) {
      throw new FetchError('BLOCKED_URL', err instanceof Error ? err.message : 'Invalid URL', String(input));
    }
    const requestedUrl = current.href;

    for (;;) {
      let res: Awaited<ReturnType<typeof request>>;
      try {
        res = await request(current, {
          dispatcher: agent,
          method,
          signal,
          headers: {
            'user-agent': options.userAgent,
            accept: opts.accept ?? 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
            'accept-encoding': 'gzip, deflate, br',
            'accept-language': 'en;q=0.9,*;q=0.5',
          },
        });
      } catch (err) {
        throw classifyNetworkError(err, current.href, timeout.aborted);
      }

      // Destroying an unread undici body emits 'error'; without a listener that
      // would crash the process. Errors that matter surface through readLimited.
      res.body.on('error', noop);
      const headers = flattenHeaders(res.headers as Record<string, string | string[] | undefined>);
      const location = headers.location;
      if (REDIRECT_STATUSES.has(res.statusCode) && location) {
        res.body.destroy();
        if (redirects.length >= maxRedirects) {
          throw new FetchError('TOO_MANY_REDIRECTS', `More than ${maxRedirects} redirects.`, current.href);
        }
        let next: URL;
        try {
          next = new URL(location, current);
        } catch {
          throw new FetchError('INVALID_RESPONSE', 'The server sent an invalid redirect location.', current.href);
        }
        next.hash = '';
        try {
          policy.checkUrl(next);
        } catch (err) {
          throw new FetchError(
            'BLOCKED_REDIRECT',
            `Redirect to a disallowed destination was blocked: ${err instanceof Error ? err.message : ''}`,
            next.href,
          );
        }
        redirects.push({ url: current.href, status: res.statusCode, location: next.href });
        if (res.statusCode === 303 && method !== 'HEAD') method = 'GET';
        current = next;
        continue;
      }

      const contentType = headers['content-type'] ?? '';
      let body: Buffer = Buffer.alloc(0);
      let truncated = false;
      let bodySkipped = false;
      try {
        if (method === 'HEAD' || (opts.acceptContentType && !opts.acceptContentType(contentType))) {
          bodySkipped = method !== 'HEAD';
          res.body.destroy();
        } else {
          const decoder = decoderFor(headers['content-encoding'] ?? '');
          let source: Readable = res.body;
          if (decoder) {
            decoder.on('error', noop);
            res.body.on('error', (e) => decoder.destroy(e));
            source = res.body.pipe(decoder);
          }
          try {
            ({ body, truncated } = await readLimited(source, maxBytes));
          } catch (err) {
            // A broken compressed stream: keep what was decoded only if nothing else failed.
            if (timeout.aborted) throw err;
            if ((err as { code?: string }).code?.startsWith('Z_')) {
              throw new FetchError('INVALID_RESPONSE', 'The response body could not be decoded.', current.href);
            }
            throw err;
          } finally {
            res.body.destroy();
          }
        }
      } catch (err) {
        throw classifyNetworkError(err, current.href, timeout.aborted);
      }

      const finalUrl = current.href;
      return {
        requestedUrl,
        finalUrl,
        status: res.statusCode,
        headers,
        contentType,
        body,
        bytes: body.length,
        truncated,
        bodySkipped,
        redirects,
        timeMs: Date.now() - started,
        text: () => decodeText(body, contentType),
      };
    }
  }

  return {
    userAgent: options.userAgent,
    fetch: safeFetch,
    close: () => agent.close(),
  };
}

export function isHtmlContentType(contentType: string): boolean {
  const ct = contentType.toLowerCase();
  // Some servers omit the header; treat empty as possibly HTML and let parsing decide.
  return ct === '' || ct.includes('text/html') || ct.includes('application/xhtml+xml');
}
