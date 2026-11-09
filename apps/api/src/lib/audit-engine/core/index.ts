/**
 * Public surface of the audit engine. Nothing here depends on Express, so a
 * future host (e.g. the Chazon platform) can import and run audits directly:
 *
 *   const fetcher = createSafeFetcher({ userAgent: '...' });
 *   const pagespeed = createPageSpeedClient({ apiKey: process.env.PAGESPEED_API_KEY ?? null });
 *   const report = await runAudit(id, request, { fetcher, pagespeed, userAgentToken: '...' }, onProgress);
 */
export { runAudit, preflight, planSteps, AuditError, DEFAULT_LIMITS, TOOL } from './audit';
export type { AuditDeps, AuditLimits, ProgressFn } from './audit';
export { createSafeFetcher, FetchError } from './net/safeFetch';
export type { SafeFetcher } from './net/safeFetch';
export { strictPolicy, parseTargetUrl, isPublicAddress, UnsafeUrlError } from './net/urlPolicy';
export type { NetworkPolicy } from './net/urlPolicy';
export { createPageSpeedClient, PageSpeedError } from './pagespeed/client';
export { parsePageSpeed } from './pagespeed/parse';
export { renderReportHtml, escapeHtml } from './report/html';
export type * from '@chazon/shared';
