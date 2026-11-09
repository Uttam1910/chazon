import type { LinkCheckSummary } from '@chazon/shared';
import type { UrlStatus } from '../crawl/crawler';
import type { RobotsResult } from '../crawl/robots';
import { isSameSite, isTransactionalUrl } from '../crawl/urls';
import { FetchError, type SafeFetcher } from '../net/safeFetch';
import type { PageData } from './page';

export interface LinkCheckInput {
  pages: PageData[];
  statuses: Map<string, UrlStatus>;
  linkSources: Map<string, string[]>;
  siteDomain: string;
  robotsFor: (origin: string) => Promise<RobotsResult>;
  maxInternal: number;
  maxExternal: number;
  concurrency: number;
  signal?: AbortSignal;
}

type Outcome = { kind: 'ok' } | { kind: 'broken'; status: number | null; reason: string } | { kind: 'unverified'; status: number | null; reason: string };

/**
 * Classifies a link check result conservatively:
 *  - 404/410 and unresolvable domains are "broken".
 *  - 5xx is "broken" for internal links but "unverified" for external ones (often transient).
 *  - 401/403/429/999 and timeouts are "unverified": many sites block automated checks.
 */
export function classifyLink(status: number | null, code: string | undefined, internal: boolean): Outcome {
  if (status !== null) {
    if (status < 400) return { kind: 'ok' };
    if (status === 404 || status === 410) return { kind: 'broken', status, reason: `HTTP ${status} (not found)` };
    if (status >= 500) {
      return internal
        ? { kind: 'broken', status, reason: `HTTP ${status} (server error)` }
        : { kind: 'unverified', status, reason: `HTTP ${status} (server error - may be temporary)` };
    }
    return { kind: 'unverified', status, reason: `HTTP ${status} - the server refused or limited automated checking` };
  }
  if (code === 'DNS_FAILURE') return { kind: 'broken', status: null, reason: 'Domain name does not resolve' };
  if (code === 'BLOCKED_ADDRESS' || code === 'BLOCKED_URL' || code === 'BLOCKED_REDIRECT') {
    return { kind: 'unverified', status: null, reason: 'Not checked: points to a non-public or disallowed destination' };
  }
  return { kind: 'unverified', status: null, reason: 'Could not verify (timeout or connection error)' };
}

async function probe(fetcher: SafeFetcher, url: string, signal?: AbortSignal): Promise<{ status: number | null; code?: string }> {
  try {
    const head = await fetcher.fetch(url, { method: 'HEAD', timeoutMs: 8_000, signal });
    // Many servers mishandle HEAD; confirm failures with a small GET.
    if (head.status < 400 || head.status === 404 || head.status === 410) return { status: head.status };
  } catch (err) {
    if (err instanceof FetchError && ['DNS_FAILURE', 'BLOCKED_ADDRESS', 'BLOCKED_URL', 'BLOCKED_REDIRECT'].includes(err.code)) {
      return { status: null, code: err.code };
    }
  }
  try {
    const get = await fetcher.fetch(url, { method: 'GET', timeoutMs: 10_000, maxBytes: 64 * 1024, signal });
    return { status: get.status };
  } catch (err) {
    return { status: null, code: err instanceof FetchError ? err.code : undefined };
  }
}

export async function checkLinks(input: LinkCheckInput, fetcher: SafeFetcher): Promise<LinkCheckSummary> {
  const internal = new Set<string>();
  const external = new Set<string>();
  for (const p of input.pages) {
    for (const l of p.internalLinks) internal.add(l.href);
    for (const l of p.externalLinks) external.add(l.href);
  }

  const broken: LinkCheckSummary['broken'] = [];
  const unverified: LinkCheckSummary['unverified'] = [];
  const record = (url: string, isInternal: boolean, outcome: Outcome) => {
    if (outcome.kind === 'broken') {
      broken.push({ url, status: outcome.status, reason: outcome.reason, foundOn: input.linkSources.get(url) ?? [], internal: isInternal });
    } else if (outcome.kind === 'unverified' && unverified.length < 50) {
      unverified.push({ url, status: outcome.status, reason: outcome.reason, internal: isInternal });
    }
  };

  // Reuse statuses the crawler already observed.
  const internalToCheck: string[] = [];
  let reused = 0;
  for (const url of internal) {
    const known = input.statuses.get(url);
    if (known) {
      reused++;
      record(url, true, classifyLink(known.status, known.code, true));
    } else if (!isTransactionalUrl(url)) {
      internalToCheck.push(url);
    }
  }

  const allowedInternal: string[] = [];
  for (const url of internalToCheck) {
    if (allowedInternal.length >= input.maxInternal) break;
    const robots = await input.robotsFor(new URL(url).origin);
    if (robots.isAllowed(url)) allowedInternal.push(url);
  }
  const externalToCheck = [...external].filter((u) => !isSameSite(u, input.siteDomain)).slice(0, input.maxExternal);

  const jobs = [
    ...allowedInternal.map((url) => ({ url, internal: true })),
    ...externalToCheck.map((url) => ({ url, internal: false })),
  ];
  let next = 0;
  const worker = async () => {
    while (next < jobs.length && !input.signal?.aborted) {
      const job = jobs[next++]!;
      const { status, code } = await probe(fetcher, job.url, input.signal);
      record(job.url, job.internal, classifyLink(status, code, job.internal));
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, input.concurrency) }, () => worker()));

  const notChecked = Math.max(0, internalToCheck.length - allowedInternal.length) + Math.max(0, external.size - externalToCheck.length);
  return {
    ran: true,
    checked: reused + jobs.length,
    internalChecked: reused + allowedInternal.length,
    externalChecked: externalToCheck.length,
    broken,
    unverified,
    notCheckedCount: notChecked,
    note: `Checked up to ${input.maxInternal} internal and ${input.maxExternal} external links not already visited by the crawler. HEAD requests were used first, with a small GET to confirm failures. Links blocked by robots.txt, account/cart URLs and links beyond these limits were not checked.`,
  };
}
