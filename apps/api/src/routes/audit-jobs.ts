import { Router, json, type Request, type Response } from 'express'
import cors from 'cors'
import { rateLimit } from 'express-rate-limit'
import { z } from 'zod'
import {
  ALL_AUDIT_CATEGORIES,
  BUSINESS_TYPES,
  CHALLENGES,
  FOLLOW_UP,
  LEAD_CHANNELS,
  NEEDS,
  OBJECTIVES,
  TIMEFRAMES,
  TRI_STATE,
  type AuditReport,
  type AuditRequest,
  type DiscoveryAnswers,
  type PublicConfig,
} from '@chazon/shared'
import { prisma } from '../db'
import { env } from '../env'
import { runtimeStore } from '../lib/runtime-store'
import {
  AuditError,
  createPageSpeedClient,
  createSafeFetcher,
  planSteps,
  preflight,
  renderReportHtml,
  runAudit,
  strictPolicy,
  type AuditDeps,
} from '../lib/audit-engine/core'
import { JobStore } from '../lib/audit-engine/jobs/jobStore'
import { parseClientReport } from '../lib/audit-engine/reportSchema'

const ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const auditJobStore = new JobStore(30 * 60_000)

const auditDeps: AuditDeps = {
  fetcher: createSafeFetcher({
    userAgent: `Mozilla/5.0 (compatible; ${env.AUDIT_USER_AGENT_TOKEN}/1.0; +https://chazon.in)`,
  }),
  pagespeed: createPageSpeedClient({
    apiKey: env.PAGESPEED_API_KEY || null,
  }),
  policy: strictPolicy,
  userAgentToken: env.AUDIT_USER_AGENT_TOKEN,
}

const freeText = (max: number) =>
  z
    .string()
    .max(max * 2)
    // eslint-disable-next-line no-control-regex
    .transform((v) => v.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max))
    .optional()

export const discoverySchema = z
  .object({
    businessType: z.enum(BUSINESS_TYPES).optional(),
    offerings: freeText(300),
    mainObjective: z.enum(OBJECTIVES).optional(),
    leadChannels: z.array(z.enum(LEAD_CHANNELS)).max(LEAD_CHANNELS.length).optional(),
    mainChallenge: z.enum(CHALLENGES).optional(),
    hasAnalytics: z.enum(TRI_STATE).optional(),
    usesAdvertising: z.enum(TRI_STATE).optional(),
    followUp: z.enum(FOLLOW_UP).optional(),
    needs: z.array(z.enum(NEEDS)).max(NEEDS.length).optional(),
    timeframe: z.enum(TIMEFRAMES).optional(),
    budgetRange: freeText(60),
  })
  .strict()

function cleanDiscovery(d: z.infer<typeof discoverySchema> | undefined): DiscoveryAnswers | undefined {
  if (!d) return undefined
  const out: DiscoveryAnswers = { ...d }
  if (out.leadChannels) out.leadChannels = [...new Set(out.leadChannels)]
  if (out.needs) out.needs = [...new Set(out.needs)]
  for (const k of Object.keys(out) as (keyof DiscoveryAnswers)[]) {
    const v = out[k]
    if (v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) delete out[k]
  }
  return out
}

function sendError(res: Response, status: number, code: string, message: string) {
  res.status(status).json({ error: { code, message } })
}

export const auditJobsRouter = Router()

const auditCors = cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'], maxAge: 600 })
auditJobsRouter.use(auditCors)
auditJobsRouter.use(json({ limit: '256kb' }))

const startLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MINUTES * 60_000,
  limit: env.RATE_LIMIT_AUDITS_PER_WINDOW,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, res) =>
    sendError(
      res,
      429,
      'RATE_LIMITED',
      `Too many audits started from your IP address. Limit: ${env.RATE_LIMIT_AUDITS_PER_WINDOW} per ${env.RATE_LIMIT_WINDOW_MINUTES} minutes.`
    ),
})

const readLimiter = rateLimit({
  windowMs: 60_000,
  limit: 240,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, res) => sendError(res, 429, 'RATE_LIMITED', 'Too many requests. Please slow down.'),
})

const launchSchema = z
  .object({
    url: z.string().trim().min(1, 'Please enter a website URL.').max(2048, 'The URL is too long.'),
    strategy: z.enum(['mobile', 'desktop']).default('mobile'),
    categories: z
      .array(z.enum(ALL_AUDIT_CATEGORIES as [string, ...string[]]))
      .min(1, 'Select at least one audit category.')
      .max(10)
      .default(ALL_AUDIT_CATEGORIES),
    crawlLimit: z.number().int().min(1).max(env.MAX_CRAWL_PAGES).default(env.DEFAULT_CRAWL_PAGES),
    checkLinks: z.boolean().default(true),
    discovery: discoverySchema.optional(),
  })
  .strict()

// --- Public Config & Status -------------------------------------------------
auditJobsRouter.get('/config', (_req, res) => {
  const body: PublicConfig = {
    pagespeedConfigured: auditDeps.pagespeed.configured,
    defaultCrawlPages: env.DEFAULT_CRAWL_PAGES,
    maxCrawlPages: env.MAX_CRAWL_PAGES,
    version: '1.0.0',
    contactUrl: '/contact',
  }
  res.json(body)
})

// --- Start Audit Job --------------------------------------------------------
async function handleLaunch(req: Request, res: Response, opts: { skipLighthouse?: boolean } = {}) {
  const parsed = launchSchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    return sendError(res, 400, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid request.')
  }

  const { discovery, ...rest } = parsed.data
  const answers = cleanDiscovery(discovery)
  const request: AuditRequest = {
    ...rest,
    strategy: parsed.data.strategy,
    categories: [...new Set(parsed.data.categories)] as AuditRequest['categories'],
    ...(answers ? { discovery: answers } : {}),
  }

  const runDeps: AuditDeps = opts.skipLighthouse ? { ...auditDeps, skipLighthouse: true } : auditDeps
  if (auditJobStore.running >= env.MAX_CONCURRENT_AUDITS) {
    return sendError(
      res,
      503,
      'SERVER_BUSY',
      'The audit server is currently busy with other scans. Please try again in a minute.'
    )
  }

  try {
    await preflight(request.url, auditDeps.policy)
  } catch (err) {
    if (err instanceof AuditError) {
      return sendError(res, err.code === 'DNS_FAILURE' ? 422 : 400, err.code, err.message)
    }
    throw err
  }

  const job = auditJobStore.create(planSteps(request, opts))
  const id = job.status.id
  runtimeStore.recordJobStart(id, request.url, request.strategy)

  const run = runAudit(
    id,
    request,
    runDeps,
    (key, state, detail) => auditJobStore.updateStep(job, key, state, detail),
    job.controller.signal
  )

  run
    .then(async (report) => {
      auditJobStore.complete(job, report)
      const summary = runtimeStore.recordJobComplete(id, report)
      try {
        await prisma.auditScan.upsert({
          where: { reference: summary.reference },
          update: {
            url: summary.url,
            normalizedUrl: summary.normalizedUrl,
            overallScore: summary.overallScore,
            performanceScore: summary.performanceScore,
            seoScore: summary.seoScore,
            mobileScore: summary.mobileScore,
            conversionScore: summary.conversionScore,
            metrics: {
              strategy: summary.strategy,
              pagesInspected: summary.pagesInspected,
              durationMs: summary.durationMs,
              accessibilityScore: summary.accessibilityScore,
              bestPracticesScore: summary.bestPracticesScore,
              headline: summary.headline,
            },
            issues: summary.topIssues as unknown as object,
          },
          create: {
            reference: summary.reference,
            url: summary.url,
            normalizedUrl: summary.normalizedUrl,
            overallScore: summary.overallScore,
            performanceScore: summary.performanceScore,
            seoScore: summary.seoScore,
            mobileScore: summary.mobileScore,
            conversionScore: summary.conversionScore,
            metrics: {
              strategy: summary.strategy,
              pagesInspected: summary.pagesInspected,
              durationMs: summary.durationMs,
              accessibilityScore: summary.accessibilityScore,
              bestPracticesScore: summary.bestPracticesScore,
              headline: summary.headline,
            },
            issues: summary.topIssues as unknown as object,
          },
        })
      } catch {
        // DB unavailable — scan remains synced in runtimeStore for live Admin visibility
      }
    })
    .catch((err: unknown) => {
      if (err instanceof AuditError) {
        auditJobStore.fail(job, err.code, err.message)
        runtimeStore.recordJobFail(id, err.message)
      } else {
        console.error(`[audit ${id}] unexpected error`, err instanceof Error ? err.stack : err)
        auditJobStore.fail(job, 'INTERNAL_ERROR', 'The audit failed unexpectedly. Please try again.')
        runtimeStore.recordJobFail(id, 'The audit failed unexpectedly.')
      }
    })

  res.status(202).json({ id, status: job.status })
}

auditJobsRouter.post('/', startLimiter, (req, res) => handleLaunch(req, res))
auditJobsRouter.post('/jobs', startLimiter, (req, res) => handleLaunch(req, res))
auditJobsRouter.post('/audits', startLimiter, (req, res) => handleLaunch(req, res))

// --- Competitor Gap Observer ------------------------------------------------
const observeSchema = z.object({ url: z.string().trim().min(1, 'Please enter a website URL.').max(2048) }).strict()
auditJobsRouter.post('/competitors/observe', startLimiter, async (req, res) => {
  const parsed = observeSchema.safeParse(req.body ?? {})
  if (!parsed.success) return sendError(res, 400, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid URL.')
  req.body = {
    url: parsed.data.url,
    strategy: 'mobile',
    categories: ['seo', 'journey', 'crawl'],
    crawlLimit: 3,
    checkLinks: false,
  }
  return handleLaunch(req, res, { skipLighthouse: true })
})

// --- Job Polling & Report Endpoints -----------------------------------------
const handleStatus = (req: Request, res: Response) => {
  const job = auditJobStore.get(String(req.params.id))
  if (!job) {
    return sendError(
      res,
      404,
      'NOT_FOUND',
      'Audit session not found or expired. Scan sessions are preserved in memory for 30 minutes. Please run a new scan.'
    )
  }
  res.json({ id: job.status.id, status: job.status })
}

const handleReport = (req: Request, res: Response) => {
  const job = auditJobStore.get(String(req.params.id))
  if (!job) {
    return sendError(
      res,
      404,
      'NOT_FOUND',
      'Audit not found or expired. Please start a new scan.'
    )
  }
  if (job.status.state !== 'completed') {
    return sendError(res, 409, 'NOT_READY', 'The audit is still running. Please poll status until complete.')
  }
  const report = job.status.report
  if (!report) return sendError(res, 404, 'NOT_FOUND', 'Report data could not be retrieved.')
  res.json({ id: job.status.id, report })
}

const handleHtml = (req: Request, res: Response) => {
  const job = auditJobStore.get(String(req.params.id))
  if (!job || job.status.state !== 'completed') {
    return sendError(res, 404, 'NOT_FOUND', 'Completed audit report not found.')
  }
  const report = job.status.report
  if (!report) return sendError(res, 404, 'NOT_FOUND', 'Report data not found.')
  const html = renderReportHtml(report)
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; img-src data:; script-src 'none'")
  res.send(html)
}

const handleCancel = (req: Request, res: Response) => {
  const job = auditJobStore.get(String(req.params.id))
  if (!job) return sendError(res, 404, 'NOT_FOUND', 'Audit not found.')
  if (job.status.state === 'running') {
    job.controller.abort()
    auditJobStore.fail(job, 'CANCELLED', 'The audit was cancelled by the user.')
  }
  res.json({ ok: true })
}

auditJobsRouter.use(['/jobs/:id', '/audits/:id'], readLimiter, (req, res, next) => {
  if (!ID_RE.test(String(req.params.id))) return sendError(res, 404, 'NOT_FOUND', 'Audit not found.')
  res.setHeader('Cache-Control', 'no-store')
  next()
})

auditJobsRouter.get('/jobs/:id', handleStatus)
auditJobsRouter.get('/audits/:id', handleStatus)

auditJobsRouter.get('/jobs/:id/report', handleReport)
auditJobsRouter.get('/audits/:id/report', handleReport)

auditJobsRouter.get('/jobs/:id/html', handleHtml)
auditJobsRouter.get('/audits/:id/html', handleHtml)

auditJobsRouter.post('/jobs/:id/cancel', handleCancel)
auditJobsRouter.post('/audits/:id/cancel', handleCancel)

// Stateless HTML generation for client-supplied saved reports
auditJobsRouter.post('/reports/html', (req, res) => {
  const parsed = parseClientReport(req.body)
  if (!parsed.ok) return sendError(res, 400, 'INVALID_REPORT', parsed.message)
  const html = renderReportHtml(parsed.report as unknown as AuditReport)
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; img-src data:; script-src 'none'")
  res.send(html)
})
